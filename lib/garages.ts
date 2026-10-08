const RESOURCE_ID = 'bb68386a-a331-4bbc-b668-bba2766d517d';
const PAGE_RECORDS = 100;

export const garagesSource = 'https://data.gov.il/he/datasets/ministry_of_transport/musachim';

type SourceGarage = {
  mispar_mosah: number | string | null;
  shem_mosah: string | null;
  yishuv: string | null;
  ktovet: string | null;
  telephone: string | null;
  miktzoa: string | null;
};

export type Garage = {
  license: string;
  name: string;
  city: string;
  address: string;
  phone: string;
  professions: string[];
};

export function parseGarageCity(input: unknown): string | null {
  if (typeof input !== 'string' || input.length > 60 || /[\u0000-\u001f\u007f]/.test(input)) return null;
  const city = input.normalize('NFC').trim().replace(/\s+/g, ' ');
  if (!city || city.length > 50) return null;
  const aliases: Record<string, string> = {
    'תל אביב': 'תל אביב -יפו', 'תל אביב-יפו': 'תל אביב -יפו', 'תל אביב יפו': 'תל אביב -יפו',
  };
  return aliases[city] ?? city;
}

export function parseGarageOffset(input: unknown): number {
  if (typeof input !== 'string' || !/^\d{1,5}$/.test(input)) return 0;
  const offset = Number(input);
  return offset >= 0 && offset <= 20000 ? offset : 0;
}

export type GarageResult = { garages: Garage[]; totalRecords: number; nextOffset: number | null; error: boolean };

export async function getGarages(city: string | null, offset: number): Promise<GarageResult> {
  const url = new URL('https://data.gov.il/api/3/action/datastore_search');
  url.searchParams.set('resource_id', RESOURCE_ID);
  url.searchParams.set('filters', JSON.stringify({ cod_sug_mosah: 6, ...(city ? { yishuv: city } : {}) }));
  url.searchParams.set('sort', 'mispar_mosah asc, _id asc');
  url.searchParams.set('limit', String(PAGE_RECORDS + 1));
  url.searchParams.set('offset', String(offset));

  try {
    const response = await fetch(url, { next: { revalidate: 3600 }, signal: AbortSignal.timeout(12000) });
    if (!response.ok) throw new Error(String(response.status));
    const data: unknown = await response.json();
    if (!data || typeof data !== 'object' || !('success' in data) || data.success !== true || !('result' in data)) throw new Error('Invalid response');
    const result = data.result as { records?: SourceGarage[]; total?: number };
    if (!Array.isArray(result.records) || typeof result.total !== 'number') throw new Error('Invalid response');

    const records = result.records;
    let count = Math.min(PAGE_RECORDS, records.length);
    // Keep the final garage's profession rows together across pages.
    if (records.length > PAGE_RECORDS) {
      const boundaryLicense = String(records[PAGE_RECORDS].mispar_mosah ?? '');
      const firstBoundary = records.findIndex(row => String(row.mispar_mosah ?? '') === boundaryLicense);
      if (firstBoundary > 0) count = firstBoundary;
    }
    const grouped = new Map<string, Garage & { professionSet: Set<string> }>();
    for (const row of records.slice(0, count)) {
      const license = String(row.mispar_mosah ?? '').trim();
      if (!/^\d+$/.test(license)) continue;
      let garage = grouped.get(license);
      if (!garage) {
        garage = {
          license,
          name: String(row.shem_mosah ?? '').trim() || 'שם המוסך לא זמין',
          city: String(row.yishuv ?? '').trim() || 'לא צוין יישוב',
          address: String(row.ktovet ?? '').trim(),
          phone: String(row.telephone ?? '').trim(),
          professions: [],
          professionSet: new Set<string>(),
        };
        grouped.set(license, garage);
      }
      const profession = String(row.miktzoa ?? '').trim();
      if (profession) garage.professionSet.add(profession);
    }
    const garages = [...grouped.values()].map(({ professionSet, ...garage }) => ({ ...garage, professions: [...professionSet] }));
    const nextOffset = offset + count < result.total ? offset + count : null;
    return { garages, totalRecords: result.total, nextOffset, error: false };
  } catch {
    return { garages: [], totalRecords: 0, nextOffset: null, error: true };
  }
}
