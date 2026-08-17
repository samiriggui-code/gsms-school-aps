export async function nextTicketReference(count: number) {
  return `TKT-${String(count + 1).padStart(4, '0')}`;
}

export async function nextIncidentReference(count: number) {
  return `INC-${String(count + 1).padStart(4, '0')}`;
}
