export function parsePagination(searchParams: URLSearchParams) {
  const page = Math.max(1, Number(searchParams.get('page') || 1));
  const limit = Math.max(1, Number(searchParams.get('limit') || 10));

  return {
    page,
    limit,
    skip: (page - 1) * limit,
  };
}
