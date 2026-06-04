/**
 * Origines LAN pour Next.js allowedDevOrigins (landing, CRM).
 * .env.local : ALLOWED_DEV_ORIGINS=192.168.1.6,192.168.1.100
 * (legacy CRM : NEXT_DEV_ALLOWED_ORIGINS — toujours lu)
 */
const DEFAULT_HOSTS = ['localhost', '127.0.0.1', '192.168.1.6', '192.168.1.37'];

export function getAllowedDevOrigins(options = {}) {
	const { ports = [] } = options;
	const fromEnv = [
		...(process.env.ALLOWED_DEV_ORIGINS?.split(',') ?? []),
		...(process.env.NEXT_DEV_ALLOWED_ORIGINS?.split(',') ?? []),
	]
		.map((s) => s.trim())
		.filter(Boolean);

	const withPorts = [];
	for (const host of DEFAULT_HOSTS) {
		withPorts.push(host);
		for (const port of ports) {
			withPorts.push(`${host}:${port}`);
		}
	}

	return [...new Set([...withPorts, ...fromEnv])];
}
