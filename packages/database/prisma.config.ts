import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'prisma/config';

/** Charge `.env` avant lecture de DATABASE_URL (comme `seed.js`), pour que `pnpm exec prisma …` marche sans `--env-file`. */
function loadEnvFromDisk(): void {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const cwd = process.cwd();
  const candidates = [
    path.join(here, '../../.env'),
    path.join(here, '../.env'),
    path.join(here, '.env'),
    path.join(cwd, '.env'),
    path.join(cwd, '../../.env'),
    path.join(cwd, '../../../.env'),
  ];

  for (const envPath of candidates) {
    if (!fs.existsSync(envPath)) continue;
    const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq <= 0) continue;
      const key = trimmed.slice(0, eq).trim();
      let val = trimmed.slice(eq + 1).trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      if (process.env[key] === undefined) process.env[key] = val;
    }
    break;
  }
}

/**
 * URL datasource pour la CLI. Les commandes qui ne touchent pas à la DB (`generate`, `validate`, …)
 * acceptent une URL factice si aucune variable n’est définie (ex. CI sans secrets).
 */
function datasourceUrl(): string {
  loadEnvFromDisk();
  const url = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
  if (url) return url;

  const argv = process.argv.join(' ');
  const offlineCli =
    /\bgenerate\b/.test(argv) ||
    /\bvalidate\b/.test(argv) ||
    /\bformat\b/.test(argv) ||
    /\bversion\b/.test(argv);

  if (offlineCli) {
    return (
      process.env.PRISMA_OFFLINE_DATABASE_URL ??
      'postgresql://prisma:prisma@127.0.0.1:5432/prisma_cli_placeholder?schema=public'
    );
  }

  const hint = path.join(path.dirname(fileURLToPath(import.meta.url)), '../../.env');
  throw new Error(
    [
      'Prisma CLI requires DATABASE_URL or DIRECT_URL.',
      `No value found after loading env files (expected monorepo root .env near: ${hint}).`,
      'Copy packages/database/.env.example to the repo root as .env, or export DATABASE_URL.',
    ].join(' '),
  );
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'node prisma/seed.js',
  },
  datasource: {
    url: datasourceUrl(),
  },
});
