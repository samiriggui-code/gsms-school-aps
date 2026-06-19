/**
 * Nettoie apps/lms-crm/.next avant build (évite EBUSY sur Windows).
 * Stratégie : libérer le port 3001 → supprimer → sinon renommer → sinon robocopy /MIR.
 */
import { execSync, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, renameSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const nextDir = join(repoRoot, 'apps', 'lms-crm', '.next');

function sleep(ms) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    /* sync wait */
  }
}

function freeDevPort() {
  try {
    execSync('node scripts/free-dev-port.mjs 3001', {
      cwd: repoRoot,
      stdio: 'pipe',
    });
  } catch {
    // port libre
  }
}

function stopNodeProcesses() {
  if (process.platform !== 'win32') return;
  try {
    const self = process.pid;
    const out = execSync('tasklist /FI "IMAGENAME eq node.exe" /FO CSV /NH', {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    for (const line of out.split(/\r?\n/)) {
      const m = line.match(/^"node\.exe","(\d+)"/i);
      if (!m) continue;
      const pid = Number(m[1]);
      if (pid === self) continue;
      try {
        execSync(`taskkill /PID ${pid} /F`, { stdio: 'ignore' });
      } catch {
        // déjà terminé
      }
    }
    sleep(1500);
  } catch {
    // aucun node
  }
}

function tryRm(dir) {
  rmSync(dir, {
    recursive: true,
    force: true,
    maxRetries: 8,
    retryDelay: 500,
  });
}

function robocopyClear(dir) {
  const empty = join(dirname(dir), `.next-empty-${Date.now()}`);
  mkdirSync(empty, { recursive: true });
  const args = [
    empty,
    dir,
    '/MIR',
    '/R:2',
    '/W:1',
    '/NFL',
    '/NDL',
    '/NJH',
    '/NJS',
    '/nc',
    '/nns',
    '/np',
  ];
  const result = spawnSync('robocopy', args, { encoding: 'utf8' });
  // robocopy : 0-7 = succès
  if (result.status !== null && result.status > 7) {
    throw new Error(`robocopy a échoué (code ${result.status})`);
  }
  rmSync(empty, { recursive: true, force: true });
  if (existsSync(dir)) {
    rmSync(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 400 });
  }
}

function purgeNextDir() {
  if (!existsSync(nextDir)) {
    return;
  }

  if (process.platform === 'win32') {
    freeDevPort();
    stopNodeProcesses();
  }

  try {
    tryRm(nextDir);
    console.log('[prebuild] .next supprimé');
    return;
  } catch (err) {
    const code = err && typeof err === 'object' && 'code' in err ? err.code : '';
    if (code !== 'EBUSY' && code !== 'EPERM' && code !== 'ENOTEMPTY') {
      throw err;
    }
  }

  const quarantine = `${nextDir}.old-${Date.now()}`;
  try {
    renameSync(nextDir, quarantine);
    console.log(`[prebuild] .next verrouillé → déplacé (${quarantine})`);
    try {
      tryRm(quarantine);
    } catch {
      console.warn('[prebuild] ancien .next laissé en quarantaine (suppression manuelle possible)');
    }
    return;
  } catch {
    // rename échoué aussi
  }

  if (process.platform === 'win32') {
    robocopyClear(nextDir);
    console.log('[prebuild] .next vidé via robocopy');
    return;
  }

  throw new Error(
    `Impossible de supprimer ${nextDir} (EBUSY). Fermez next dev, l’explorateur Windows sur ce dossier, puis relancez le build.`,
  );
}

purgeNextDir();
