export function instructorDisplayName(
  mod: { name: string | null; firstName: string | null; lastName: string | null } | null,
): string | null {
  if (!mod) return null;
  if (mod.name) return mod.name;
  const full = [mod.firstName, mod.lastName].filter(Boolean).join(' ');
  return full.length > 0 ? full : null;
}
