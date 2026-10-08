const RESOURCE_ID = '4a434d65-3ca2-45e5-8026-5d9819c3f95c';
const PAGE_SIZE = 24;

export const appraisersSource = 'https://data.gov.il/he/datasets/ministry_of_transport/shamaim_rechev';

type SourceAppraiser = {
  mispar_rishayon: number | string | null;
  shem_prati: string | null;
  shem_mishpaha: string | null;
  yishuv: string | null;
};

export type Appraiser = { license: string; name: string; city: string };
export type AppraiserResult = { appraisers: Appraiser[]; total: number; nextOffset: number | null; error: boolean };

export function parseAppraiserTerm(value: unknown): string | null {
  if (typeof value !== 'string' || value.length > 60 || /[\u0000-\u001f\u007f]/.test(value)) return null;
  const term = value.normalize('NFC').trim().replace(/\s+/g, ' ');
  if (term.length < 2 || term.length > 50 || !/^[\p{L}\p{M}\d '-]+$/u.test(term)) return null;
  return term;
}

export function parseAppraiserOffset(value: unknown): number {
  if (typeof value !== 'string' || !/^\d{1,4}$/.test(value)) return 0;
  const offset = Number(value);
  return offset <= 5000 && offset % PAGE_SIZE === 0 ? offset : 0;
}

export async function getAppraisers(city: string | null, name: string | null, offset: number): Promise<AppraiserResult> {
  const url = new URL('https://data.gov.il/api/3/action/datastore_search');
  url.searchParams.set('resource_id', RESOURCE_ID);
  if (city) url.searchParams.set('filters', JSON.stringify({ yishuv: city }));
  if (name) url.searchParams.set('q', name);
  url.searchParams.set('sort', 'mispar_rishayon asc');
  url.searchParams.set('limit', String(PAGE_SIZE));
  url.searchParams.set('offset', String(offset));

  try {
    const response = await fetch(url, { next: { revalidate: 3600 }, signal: AbortSignal.timeout(12000) });
    if (!response.ok) throw new Error(String(response.status));
    const data: unknown = await response.json();
    if (!data || typeof data !== 'object' || !('success' in data) || data.success !== true || !('result' in data)) throw new Error('Invalid response');
    const result = data.result as { records?: SourceAppraiser[]; total?: number };
    if (!Array.isArray(result.records) || typeof result.total !== 'number') throw new Error('Invalid response');
    const appraisers = result.records.map(row => ({
      license: String(row.mispar_rishayon ?? '').trim(),
      name: `${String(row.shem_prati ?? '').trim()} ${String(row.shem_mishpaha ?? '').trim()}`.trim(),
      city: String(row.yishuv ?? '').trim(),
    })).filter(row => /^\d+$/.test(row.license) && row.name);
    return { appraisers, total: result.total, nextOffset: offset + PAGE_SIZE < result.total && offset + PAGE_SIZE <= 5000 ? offset + PAGE_SIZE : null, error: false };
  } catch {
    return { appraisers: [], total: 0, nextOffset: null, error: true };
  }
}
