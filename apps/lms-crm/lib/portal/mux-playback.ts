import { createPrivateKey } from 'node:crypto';
import { SignJWT } from 'jose';

const PLAYBACK_TTL_SECONDS = 60 * 60;

/** Streams de test publics Mux — HLS sur test-streams.mux.dev, pas des playback IDs cloud. */
const MUX_DEMO_HLS_URLS: Record<string, string> = {
  x36xhzz: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
};

export function isMuxPublicPlaybackId(playbackId: string): boolean {
  return playbackId.trim() in MUX_DEMO_HLS_URLS;
}

export function muxDemoHlsUrl(playbackId: string): string | null {
  const url = MUX_DEMO_HLS_URLS[playbackId.trim()];
  return url ?? null;
}

function muxSigningKeyId(): string | null {
  const id = process.env.MUX_SIGNING_KEY_ID?.trim();
  return id || null;
}

function muxPrivateKeyPem(): string | null {
  const raw = process.env.MUX_SIGNING_PRIVATE_KEY?.trim();
  if (!raw) return null;
  if (raw.includes('BEGIN PRIVATE KEY')) return raw;
  return Buffer.from(raw, 'base64').toString('utf8');
}

export function isMuxPlaybackConfigured(): boolean {
  return Boolean(muxSigningKeyId() && muxPrivateKeyPem());
}

export async function createMuxPlaybackToken(playbackId: string): Promise<string | null> {
  if (isMuxPublicPlaybackId(playbackId)) return null;

  const keyId = muxSigningKeyId();
  const pem = muxPrivateKeyPem();
  if (!keyId || !pem || !playbackId) return null;

  const privateKey = createPrivateKey(pem);
  const exp = Math.floor(Date.now() / 1000) + PLAYBACK_TTL_SECONDS;

  return new SignJWT({ sub: playbackId, aud: 'v', exp })
    .setProtectedHeader({ alg: 'RS256', typ: 'JWT', kid: keyId })
    .sign(privateKey);
}

export type MuxPlaybackPayload = {
  provider: 'mux';
  playbackId: string;
  /** Manifest HLS direct (démo test-streams.mux.dev) — prioritaire sur playbackId cloud. */
  src?: string;
  token?: string;
  signed: boolean;
  expiresInSeconds?: number;
};

/** JWT uniquement pour les assets du compte Mux ; démo publique en lecture ouverte. */
export async function resolveMuxPlayback(playbackId: string): Promise<MuxPlaybackPayload | null> {
  const id = playbackId.trim();
  if (!id) return null;

  if (isMuxPublicPlaybackId(id)) {
    const src = muxDemoHlsUrl(id);
    return { provider: 'mux', playbackId: id, src: src ?? undefined, signed: false };
  }

  if (!isMuxPlaybackConfigured()) {
    return { provider: 'mux', playbackId: id, signed: false };
  }

  const token = await createMuxPlaybackToken(id);
  if (token) {
    return {
      provider: 'mux',
      playbackId: id,
      token,
      signed: true,
      expiresInSeconds: PLAYBACK_TTL_SECONDS,
    };
  }

  return { provider: 'mux', playbackId: id, signed: false };
}
