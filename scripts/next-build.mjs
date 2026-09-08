/**
 * Lance `next build` avec un tas Node élargi.
 *
 * Sans ça le build échoue à la passe TypeScript de Next, APRÈS une compilation
 * pourtant réussie :
 *
 *   ✓ Compiled successfully in 4.4min
 *     Running TypeScript ...
 *   # Fatal process out of memory: Zone
 *   > Build error occurred — Error: spawn UNKNOWN
 *
 * Le message est trompeur : on croit à une erreur de code alors que c'est le
 * heap V8 qui sature. Avec 8 Go, le build passe (TypeScript ~6 min, 372 pages).
 *
 * Réglable via QATRIAL_BUILD_HEAP_MB si la machine est plus contrainte.
 * Wrapper plutôt que `cross-env` pour ne pas ajouter de dépendance ; même
 * convention que `clean-next-build.mjs` et `free-dev-port.mjs`.
 */
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';

const heapMb = process.env.NEXT_BUILD_HEAP_MB ?? '8192';
const existing = process.env.NODE_OPTIONS ?? '';
const nodeOptions = existing.includes('max-old-space-size')
  ? existing
  : `${existing} --max-old-space-size=${heapMb}`.trim();

// `next` n'est pas garanti dans le PATH du process enfant (pnpm + Windows) :
// on résout le binaire depuis le package installé.
const require = createRequire(`${process.cwd()}/`);
const nextBin = require.resolve('next/dist/bin/next');

const child = spawn(process.execPath, [nextBin, 'build', ...process.argv.slice(2)], {
  stdio: 'inherit',
  env: { ...process.env, NODE_OPTIONS: nodeOptions },
});

child.on('exit', (code) => process.exit(code ?? 1));
child.on('error', (error) => {
  console.error('[next-build] échec du lancement :', error.message);
  process.exit(1);
});
