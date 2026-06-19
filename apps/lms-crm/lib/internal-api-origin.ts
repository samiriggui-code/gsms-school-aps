/**
 * Origine pour les appels API serveur → serveur (proxy internes).
 * En Docker, ne jamais utiliser `url.origin` (HTTPS via Traefik) : Node fetch échoue (SSL / HTTP2).
 */
export function internalApiOrigin(): string {
  const port = process.env.PORT || '3001';
  const host = process.env.HOSTNAME === '0.0.0.0' ? '127.0.0.1' : process.env.HOSTNAME || '127.0.0.1';
  return `http://${host}:${port}`;
}
