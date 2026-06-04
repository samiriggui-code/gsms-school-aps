import { withSentryConfig } from '@sentry/nextjs';
import { getAllowedDevOrigins } from '../../scripts/allowed-dev-origins.mjs';

/** @type {import('next').NextConfig} */
const basePathEnv = (process.env.NEXT_PUBLIC_BASE_PATH || '').trim();

let basePath = '';
/** Only non-loopback full URLs (e.g. CDN); never http://localhost — breaks LAN/mobile chunk loading */
let assetPrefix;

if (basePathEnv.startsWith('http')) {
  try {
    const u = new URL(basePathEnv);
    basePath = u.pathname.replace(/\/$/, '');
    const loopback =
      u.hostname === 'localhost' ||
      u.hostname === '127.0.0.1' ||
      u.hostname === '[::1]';
    if (!loopback) {
      assetPrefix = basePathEnv.replace(/\/$/, '');
    }
  } catch {
    basePath = '';
    assetPrefix = undefined;
  }
} else {
  basePath = basePathEnv.replace(/\/$/, '');
}

const nextConfig = {
  output: 'standalone',
  transpilePackages: ['@repo/i18n'],
  basePath: basePath || '',
  ...(assetPrefix ? { assetPrefix } : {}),
  images: {},
  outputFileTracingExcludes: {
    '*': ['next.config.mjs'],
  },
  allowedDevOrigins: getAllowedDevOrigins({ ports: [3000, 3001] }),
  experimental: {
    externalDir: true,
    /** Évite les erreurs « Persisting failed / SST » (cache Turbopack) surtout sous Windows si `.next` est supprimé à chaud. */
    turbopackFileSystemCacheForDev: false,
  },
  /**
   * Utilisé par `next build` et par `next dev --webpack` (pas par Turbopack en dev).
   * Dev Turbopack : garder allowedDevOrigins + pas d’assetPrefix localhost pour le LAN.
   */
  webpack: (config, { dev }) => {
    if (dev && config.output) {
      config.output.chunkLoadTimeout = 300000;
    }
    return config;
  },
  async rewrites() {
    return [
      {
        source: '/api/sections/gestion-ressources/rh/CandidatHub/:path*',
        destination: '/api/sections/gestion-ressources/rh/candidathub/:path*',
      },
      {
        source: '/api/sections/gestion-ressources/rh/CandidatHub',
        destination: '/api/sections/gestion-ressources/rh/candidathub',
      },
      {
        source: '/api/sections/gestion-ressources/rh/Candidatures/:path*',
        destination: '/api/sections/gestion-ressources/rh/candidatures/:path*',
      },
      {
        source: '/api/sections/gestion-ressources/rh/Candidatures',
        destination: '/api/sections/gestion-ressources/rh/candidatures',
      },
      {
        source: '/api/sections/gestion-ressources/rh/Etudiants/:path*',
        destination: '/api/sections/gestion-ressources/rh/etudiants/:path*',
      },
      {
        source: '/api/sections/gestion-ressources/rh/Etudiants',
        destination: '/api/sections/gestion-ressources/rh/etudiants',
      },
    ];
  },
  async redirects() {
    const legacy = {
      '/support-qualite/support/tickets/sessions': '/support-qualite/support/tickets',
      '/support-qualite/support/tickets/resultats': '/support-qualite/support/tickets',
      '/support-qualite/support/base-aide/sessions': '/support-qualite/support/base-aide',
      '/support-qualite/support/base-aide/resultats': '/support-qualite/support/base-aide',
      '/support-qualite/qualite/incidents/sessions': '/support-qualite/qualite/incidents',
      '/support-qualite/qualite/incidents/resultats': '/support-qualite/qualite/incidents',
      '/securite-configuration/acces/security-log': '/securite-configuration/acces/logs',
      '/pilotage-supervision/performance': '/pilotage-supervision/pilotage',
      '/pilotage-supervision/performance/kpi': '/pilotage-supervision/pilotage/indicateurs',
      '/pilotage-supervision/performance/predictives': '/pilotage-supervision/pilotage/indicateurs',
      '/pilotage-supervision/performance/rapports': '/pilotage-supervision/pilotage/rapports',
      '/pilotage-supervision/performance/export': '/pilotage-supervision/pilotage/rapports',
      '/pilotage-supervision/risques': '/pilotage-supervision/pilotage',
      '/pilotage-supervision/risques/evaluation': '/pilotage-supervision/pilotage/risques',
      '/pilotage-supervision/risques/incidents': '/pilotage-supervision/pilotage/risques',
      '/pilotage-supervision/risques/prevention': '/pilotage-supervision/pilotage/risques',
      '/pilotage-supervision/risques/veille': '/pilotage-supervision/pilotage/risques',
    };
    return Object.entries(legacy).map(([source, destination]) => ({
      source,
      destination,
      permanent: true,
    }));
  },
};

export default withSentryConfig(nextConfig, {
  silent: true,
});
