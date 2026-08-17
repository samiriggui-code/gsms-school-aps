#!/usr/bin/env node
/**
 * Provision / mise à jour des workflows n8n GSMS via API REST.
 *
 * Usage :
 *   GSMS_ENV=/opt/gsms/.env node deploy/gsms/n8n/provision.mjs
 *
 * Variables (.env) :
 *   N8N_API_URL          — ex. https://n8n-k2pw.srv1722028.hstgr.cloud
 *   N8N_API_KEY          — clé API n8n (Settings → API)
 *   N8N_PUBLIC_URL       — URL publique n8n (défaut = N8N_API_URL)
 *   N8N_WEBHOOK_SECRET   — secret partagé CRM ↔ n8n (généré si absent)
 *   N8N_WEBHOOK_STANDARD_URL — écrit automatiquement si absent
 *   NEXTAUTH_URL / DOMAIN — base CRM pour callbacks
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { buildSubWorkflows, buildRouter } from './workflows/index.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadEnvFile(path) {
  if (!existsSync(path)) return {};
  const out = {};
  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx <= 0) continue;
    const key = trimmed.slice(0, idx).trim();
    let val = trimmed.slice(idx + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    out[key] = val;
  }
  return out;
}

function upsertEnvLine(lines, key, value) {
  const pattern = new RegExp(`^\\s*${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}=`);
  let replaced = false;
  for (let i = 0; i < lines.length; i++) {
    if (pattern.test(lines[i])) {
      lines[i] = `${key}=${value}`;
      replaced = true;
      break;
    }
  }
  if (!replaced) lines.push(`${key}=${value}`);
}

function persistEnv(path, updates) {
  const lines = existsSync(path) ? readFileSync(path, 'utf8').split(/\r?\n/) : [];
  for (const [key, value] of Object.entries(updates)) {
    if (value == null || value === '') continue;
    upsertEnvLine(lines, key, value);
  }
  writeFileSync(path, `${lines.join('\n').replace(/\n*$/, '')}\n`, 'utf8');
}

async function n8nFetch(baseUrl, apiKey, method, path, body) {
  const url = `${baseUrl.replace(/\/$/, '')}${path}`;
  const res = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'X-N8N-API-KEY': apiKey,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text };
  }
  if (!res.ok) {
    throw new Error(`n8n ${method} ${path} → HTTP ${res.status}: ${text.slice(0, 400)}`);
  }
  return json;
}

async function listWorkflows(baseUrl, apiKey) {
  const res = await n8nFetch(baseUrl, apiKey, 'GET', '/api/v1/workflows?limit=250');
  return res?.data ?? res ?? [];
}

async function upsertWorkflow(baseUrl, apiKey, definition, existingByName) {
  const existing = existingByName.get(definition.name);
  const payload = {
    name: definition.name,
    nodes: definition.nodes,
    connections: definition.connections,
    settings: definition.settings ?? { executionOrder: 'v1' },
  };

  if (existing?.id) {
    const updated = await n8nFetch(baseUrl, apiKey, 'PUT', `/api/v1/workflows/${existing.id}`, payload);
    return updated?.data ?? updated;
  }

  const created = await n8nFetch(baseUrl, apiKey, 'POST', '/api/v1/workflows', payload);
  return created?.data ?? created;
}

async function activateWorkflow(baseUrl, apiKey, id) {
  try {
    await n8nFetch(baseUrl, apiKey, 'POST', `/api/v1/workflows/${id}/activate`, {});
  } catch (err) {
    console.warn(`[n8n] activation ${id}:`, err instanceof Error ? err.message : err);
  }
}

/**
 * URL utilisée par les nodes HTTP n8n → CRM.
 * Préférer l’URL Docker interne (même VPS) : le domaine public ne résout souvent
 * pas depuis le conteneur n8n (réseau isolé / NXDOMAIN).
 */
function deriveCrmBaseUrl(env) {
  const internal = (env.N8N_CRM_INTERNAL_URL || env.CRM_INTERNAL_URL || '').trim();
  if (internal) return internal.replace(/\/$/, '');
  const next = env.NEXTAUTH_URL?.trim();
  if (next) return next.replace(/\/$/, '');
  const domain = env.DOMAIN?.trim();
  if (domain) return `https://${domain}`;
  return '';
}

function deriveN8nPublicUrl(env) {
  return (env.N8N_PUBLIC_URL || env.N8N_API_URL || '').replace(/\/$/, '');
}

async function main() {
  const envPath = process.env.GSMS_ENV || process.env.ENV_FILE || '/opt/gsms/.env';
  const fileEnv = loadEnvFile(envPath);
  const env = { ...fileEnv, ...process.env };

  const apiUrl = (env.N8N_API_URL || '').trim();
  const apiKey = (env.N8N_API_KEY || '').trim();
  // Même VPS : n8n parle au CRM via le réseau Docker (pas le domaine public).
  if (!(env.N8N_CRM_INTERNAL_URL || env.CRM_INTERNAL_URL || '').trim()) {
    env.N8N_CRM_INTERNAL_URL = 'http://gsms-app:3001';
  }
  const crmBaseUrl = deriveCrmBaseUrl(env);
  const n8nPublic = deriveN8nPublicUrl(env);

  if (!apiUrl || !apiKey) {
    console.log('[n8n] SKIP — N8N_API_URL ou N8N_API_KEY absent dans .env');
    console.log('[n8n] Ajoutez une clé API n8n puis relancez le deploy.');
    process.exit(0);
  }

  if (!crmBaseUrl) {
    console.error(
      '[n8n] ERREUR — N8N_CRM_INTERNAL_URL, NEXTAUTH_URL ou DOMAIN requis pour câbler les callbacks CRM',
    );
    process.exit(1);
  }

  console.log(`[n8n] CRM base (HTTP nodes) : ${crmBaseUrl}`);

  let webhookSecret = (env.N8N_WEBHOOK_SECRET || env.N8N_WEBHOOK_STANDARD_SECRET || '').trim();
  if (!webhookSecret) {
    webhookSecret = randomBytes(32).toString('hex');
    console.log('[n8n] Secret webhook généré (écrit dans .env)');
  }

  const webhookStandardUrl =
    (env.N8N_WEBHOOK_STANDARD_URL || '').trim() ||
    (n8nPublic ? `${n8nPublic}/webhook/gsms/standard` : '');

  const envUpdates = {
    WORKFLOWS_N8N_STANDARD_ENABLED: 'true',
    N8N_CRM_INTERNAL_URL: (env.N8N_CRM_INTERNAL_URL || 'http://gsms-app:3001').replace(
      /\/$/,
      '',
    ),
    N8N_WEBHOOK_SECRET: webhookSecret,
    N8N_WEBHOOK_STANDARD_SECRET: webhookSecret,
  };
  if (webhookStandardUrl) envUpdates.N8N_WEBHOOK_STANDARD_URL = webhookStandardUrl;
  if (n8nPublic && !env.N8N_PUBLIC_URL) envUpdates.N8N_PUBLIC_URL = n8nPublic;

  persistEnv(envPath, envUpdates);
  console.log(`[n8n] .env mis à jour → ${envPath}`);

  const ctx = { crmBaseUrl, webhookSecret, workflowIds: {} };

  console.log('[n8n] Import sous-workflows...');
  const existing = await listWorkflows(apiUrl, apiKey);
  const byName = new Map(
    (Array.isArray(existing) ? existing : []).map((w) => [w.name, w]),
  );

  for (const def of buildSubWorkflows(ctx)) {
    if (def.name === 'GSMS — Circuit session') continue;
    const saved = await upsertWorkflow(apiUrl, apiKey, def, byName);
    if (saved?.id) {
      ctx.workflowIds[def.name] = saved.id;
      byName.set(def.name, saved);
      console.log(`  ✓ ${def.name} (${saved.id})`);
    }
  }

  const circuitDef = buildSubWorkflows(ctx).find((w) => w.name === 'GSMS — Circuit session');
  if (circuitDef) {
    const saved = await upsertWorkflow(apiUrl, apiKey, circuitDef, byName);
    if (saved?.id) {
      ctx.workflowIds[circuitDef.name] = saved.id;
      byName.set(circuitDef.name, saved);
      console.log(`  ✓ ${circuitDef.name} (${saved.id})`);
    }
  }

  console.log('[n8n] Import router...');
  const routerDef = buildRouter(ctx);
  const router = await upsertWorkflow(apiUrl, apiKey, routerDef, byName);
  if (router?.id) {
    ctx.workflowIds[routerDef.name] = router.id;
    console.log(`  ✓ ${routerDef.name} (${router.id})`);
  }

  console.log('[n8n] Activation workflows...');
  for (const id of Object.values(ctx.workflowIds)) {
    await activateWorkflow(apiUrl, apiKey, id);
  }

  console.log('');
  console.log('OK provision n8n');
  console.log(`  Webhook CRM → n8n : ${webhookStandardUrl || '(configurer N8N_WEBHOOK_STANDARD_URL)'}`);
  console.log(`  Callback n8n → CRM : ${crmBaseUrl}/api/internal/n8n/dispatch`);
  console.log(`  Workflows actifs : ${Object.keys(ctx.workflowIds).length}`);
}

main().catch((err) => {
  console.error('[n8n] ERREUR provision:', err instanceof Error ? err.message : err);
  process.exit(1);
});
