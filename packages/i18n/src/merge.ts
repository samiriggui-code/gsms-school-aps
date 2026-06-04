type JsonObject = Record<string, unknown>;

function isPlainObject(value: unknown): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Fusion profonde pour les arbres de traduction i18n. */
export function mergeTranslations(...sources: JsonObject[]): JsonObject {
  return sources.reduce<JsonObject>((acc, source) => {
    for (const [key, value] of Object.entries(source)) {
      const existing = acc[key];
      if (isPlainObject(existing) && isPlainObject(value)) {
        acc[key] = mergeTranslations(existing, value);
      } else {
        acc[key] = value;
      }
    }
    return acc;
  }, {});
}
