import type { NextRequest } from 'next/server';
import { createVehiclePdf } from '@/lib/report-pdf';
import { getVehicleReport, parsePlate } from '@/lib/vehicles';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const plate = parsePlate(request.nextUrl.searchParams.get('plate'));
  if (!plate) return new Response('Invalid plate number', { status: 400, headers: { 'Cache-Control': 'no-store' } });
  const report = await getVehicleReport(plate);
  const found = Boolean(report.base || report.history || report.ownership.length || report.openRecalls.length || report.disabledParkingTag);
  if (!found && Object.values(report.errors).some(Boolean)) return new Response('Data source temporarily unavailable', { status: 503, headers: { 'Cache-Control': 'no-store', 'Retry-After': '60' } });
  if (!found) return new Response('Vehicle not found', { status: 404, headers: { 'Cache-Control': 'no-store' } });
  const pdf = await createVehiclePdf(plate, report);
  return new Response(new Uint8Array(pdf), {
    headers: {
      'X-Robots-Tag': 'noindex',
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="AUTOPEEK-${plate}.pdf"`,
      'Content-Length': String(pdf.length),
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
