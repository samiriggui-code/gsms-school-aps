/** Valeurs d'en-têtes HTTP limitées à Latin-1 / ByteString (Fetch API). */
export function toAsciiHeaderValue(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x20-\x7E]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function cnapsPrefilledPdfResponse(
  buffer: Buffer,
  input: { filename: string; missingFields: string[] },
): Response {
  const safeFilename = toAsciiHeaderValue(input.filename).replace(/["\\]/g, '_') || 'cnaps-prefill.pdf';
  const missingHeader = input.missingFields.map(toAsciiHeaderValue).filter(Boolean).join('|');

  const headers: Record<string, string> = {
    'Content-Type': 'application/pdf',
    'Content-Disposition': `attachment; filename="${safeFilename}"`,
    'Cache-Control': 'no-store',
  };

  if (missingHeader) {
    headers['X-Cnaps-Missing-Fields'] = missingHeader;
  }

  return new Response(new Uint8Array(buffer), { status: 200, headers });
}
