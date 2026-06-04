/** Limite les retries quand l’API renvoie 5xx — évite liste bloquée et attentes ×4 par défaut TanStack. */
export const formationsApiQueryOptions = {
  retry: 1,
  retryDelay: (failureCount: number) => Math.min(1500 * 2 ** failureCount, 10_000),
};
