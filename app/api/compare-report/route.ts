import type { NextRequest } from 'next/server';
import { createComparisonPdf } from '@/lib/comparison-pdf';
import { hasComparisonData } from '@/lib/comparison';
import { getVehicleReport, parsePlate } from '@/lib/vehicles';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const firstValues = request.nextUrl.searchParams.getAll('first');
  const secondValues = request.nextUrl.searchParams.getAll('second');
  const first = firstValues.length === 1 ? parsePlate(firstValues[0]) : null;
  const second = secondValues.length === 1 ? parsePlate(secondValues[0]) : null;
  const noStore = { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' };
  if (!first || !second || first === second) return new Response('Two different valid plate numbers are required', { status: 400, headers: noStore });

  const [firstReport, secondReport] = await Promise.all([getVehicleReport(first), getVehicleReport(second)]);
  if (!hasComparisonData(firstReport) && !hasComparisonData(secondReport)) {
    const unavailable = [firstReport, secondReport].some(report => Object.values(report.errors).some(Boolean));
    return new Response(unavailable ? 'Data source temporarily unavailable' : 'Vehicles not found', {
      status: unavailable ? 503 : 404,
      headers: unavailable ? { ...noStore, 'Retry-After': '60' } : noStore,
    });
  }

  const pdf = await createComparisonPdf(first, firstReport, second, secondReport);
  return new Response(new Uint8Array(pdf), {
    headers: {
      'X-Robots-Tag': 'noindex',
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="RehevNet-compare-${first}-${second}.pdf"`,
      'Content-Length': String(pdf.length),
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
