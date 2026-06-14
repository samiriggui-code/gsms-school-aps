/**
 * Libère le port dev CRM (3001) si un ancien node Next.js écoute encore.
 * Windows uniquement — ignoré silencieusement sur les autres OS.
 */
import { execSync } from 'node:child_process';

const port = process.argv[2] ?? '3001';

if (process.platform !== 'win32') {
  process.exit(0);
}

try {
  const lines = execSync(`netstat -ano | findstr ":${port}" | findstr "LISTENING"`, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  })
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const pids = new Set(
    lines
      .map((line) => line.split(/\s+/).at(-1))
      .filter((pid) => pid && pid !== '0'),
  );

  for (const pid of pids) {
    try {
      const info = execSync(`tasklist /FI "PID eq ${pid}" /FO CSV /NH`, {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      });
      if (!info.toLowerCase().includes('node.exe')) continue;
      execSync(`taskkill /PID ${pid} /F`, { stdio: 'ignore' });
      console.log(`[predev] Port ${port} libéré (node.exe PID ${pid}).`);
    } catch {
      // process déjà terminé
    }
  }
} catch {
  // port libre
}
