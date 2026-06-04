import { getAllowedDevOrigins } from '../../scripts/allowed-dev-origins.mjs';

/** @type {import('next').NextConfig} */
const nextConfig = {
	allowedDevOrigins: getAllowedDevOrigins({ ports: [3000] }),
	output: 'standalone',
	transpilePackages: ['@repo/i18n'],
	// For local development, basePath is '/'
	// This file will be overwritten during deployment with the appropriate basePath
	images: {
		remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        port: "",
        pathname: "/**",
      },
    ],
	},
};

export default nextConfig;
