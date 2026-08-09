export async function GET() {
  const raw = process.env.DATABASE_URL;
  return Response.json({
    exists: !!raw,
    length: raw?.length ?? 0,
    value: JSON.stringify(raw), // this will reveal \n, \r, or weird chars
    firstChar: raw?.[0],
    lastChar: raw?.[raw.length - 1],
  });
}
