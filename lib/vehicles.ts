export type Row = Record<string, string | number | null>;
export type SourceResult = { rows: Row[]; error: boolean };
// Accept only a short Israeli plate number before making any upstream request.
export function parsePlate(input: unknown): string | null {
  if (typeof input !== 'string' || input.length > 12 || !/^[0-9][0-9 -]*$/.test(input)) return null;
  const plate = input.replace(/[ -]/g, '');
  return plate.length >= 5 && plate.length <= 8 ? plate : null;
}
const resources = {
  vehicles: '053cea08-09bc-40ec-8f7a-156f0677aff3', extra: '0866573c-40cd-4ca8-91d2-9dd2d7a492e5',
  inactiveWithModel: 'f6efe89a-fb3d-43a4-bb61-9bf12a9b9099', inactiveWithoutModel: '6f6acd03-f351-4a8f-8ecf-df792f4f573a',
  history: '56063a99-8a3e-4ff4-912e-5966c0279bad', ownership: 'bb2355dc-9ec7-4f06-9c3f-3344672171da',
  openRecalls: '36bf1404-0be4-49d2-82dc-2f1ead4a8b93', canceledRecent: '851ecab1-0622-4dbe-a6c7-f950cf82abf9',
  canceled2010: '4e6b9724-4c1e-43f0-909a-154d4cc4e046', canceled2000: 'ec8cbc34-72e1-4b69-9c48-22821ba0bd6c',
  model: '142afde2-6228-49f9-8a29-9b6c3a0cbe40', prices: '39f455bf-6db0-4926-859d-017f34eacbcb', announcements: '2c33523f-87aa-44ec-a736-edbb0a82975e',
} as const;
export const sourceUrls = {
  vehicles: 'https://data.gov.il/he/datasets/ministry_of_transport/private-and-commercial-vehicles',
  inactiveWithModel: 'https://data.gov.il/he/datasets/ministry_of_transport/rechev_le_pail_with_degem',
  inactiveWithoutModel: 'https://data.gov.il/he/datasets/ministry_of_transport/rechev_le_pail_without-degem',
  history: 'https://data.gov.il/he/datasets/ministry_of_transport/shinui_mivne',
  openRecalls: 'https://data.gov.il/he/datasets/ministry_of_transport/hagbalat_recall',
  canceled: 'https://data.gov.il/he/datasets/ministry_of_transport/reshev_bitul_sofi',
  model: 'https://data.gov.il/he/datasets/ministry_of_transport/degem-rechev-wltp',
  prices: 'https://data.gov.il/he/datasets/ministry_of_transport/mehir_yevuan',
  announcements: 'https://data.gov.il/he/datasets/ministry_of_transport/recall',
};
async function query(resourceId: string, filters: Record<string, number | string>, limit = 100): Promise<SourceResult> {
  const url = new URL('https://data.gov.il/api/3/action/datastore_search');
  url.searchParams.set('resource_id', resourceId); url.searchParams.set('filters', JSON.stringify(filters)); url.searchParams.set('limit', String(limit));
  try {
    const response = await fetch(url, { next: { revalidate: 3600 }, signal: AbortSignal.timeout(12000) });
    if (!response.ok) throw new Error(String(response.status));
    const data = await response.json();
    if (!data.success || !Array.isArray(data.result?.records)) throw new Error('Invalid response');
    return { rows: data.result.records, error: false };
  } catch { return { rows: [], error: true }; }
}
export type VehicleReport = Awaited<ReturnType<typeof getVehicleReport>>;
export type VehicleStatus = 'active' | 'inactive' | 'canceled' | 'unknown' | 'unavailable';
export async function getVehicleReport(plate: string) {
  if (parsePlate(plate) !== plate) throw new Error('Invalid plate');
  const number = Number(plate);
  const [vehicle, extra, history, ownership, openRecalls, c1, c2, c3] = await Promise.all([
    query(resources.vehicles, { mispar_rechev: number }, 1), query(resources.extra, { mispar_rechev: number }, 1),
    query(resources.history, { mispar_rechev: number }, 1), query(resources.ownership, { mispar_rechev: number }, 100),
    query(resources.openRecalls, { MISPAR_RECHEV: number }, 100),
    query(resources.canceledRecent, { mispar_rechev: number }, 1), query(resources.canceled2010, { mispar_rechev: plate.padStart(8, '0') }, 1), query(resources.canceled2000, { mispar_rechev: plate.padStart(8, '0') }, 1),
  ]);
  // The inactive datasets are queried only when the active registry answered successfully with no match.
  const [inactiveWithModel, inactiveWithoutModel] = !vehicle.error && vehicle.rows.length === 0
    ? await Promise.all([
      query(resources.inactiveWithModel, { mispar_rechev: number }, 1),
      query(resources.inactiveWithoutModel, { mispar_rechev: number }, 1),
    ])
    : [{ rows: [], error: false }, { rows: [], error: false }];
  const inactive = inactiveWithModel.rows[0] ?? inactiveWithoutModel.rows[0] ?? null;
  const canceled = c1.rows[0] ?? c2.rows[0] ?? c3.rows[0] ?? null;
  const base = vehicle.rows[0] ?? inactive ?? canceled;
  const status: VehicleStatus = canceled ? 'canceled' : vehicle.rows[0] ? 'active' : inactive ? 'inactive'
    : vehicle.error || inactiveWithModel.error || inactiveWithoutModel.error || c1.error || c2.error || c3.error ? 'unavailable' : 'unknown';
  const modelFilters = base ? { tozeret_cd: Number(base.tozeret_cd), degem_cd: Number(base.degem_cd), shnat_yitzur: Number(base.shnat_yitzur) } : null;
  const [model, prices] = modelFilters && Number.isFinite(modelFilters.degem_cd) && modelFilters.degem_cd > 0
    ? await Promise.all([query(resources.model, modelFilters, 10), query(resources.prices, modelFilters, 10)])
    : [{ rows: [], error: false }, { rows: [], error: false }];
  return { base, baseSource: vehicle.rows[0] ? 'active' : inactiveWithModel.rows[0] ? 'inactiveWithModel' : inactiveWithoutModel.rows[0] ? 'inactiveWithoutModel' : canceled ? 'canceled' : null,
    status, inactive, extra: extra.rows[0] ?? null, history: history.rows[0] ?? null, ownership: ownership.rows, openRecalls: openRecalls.rows, canceled, model: model.rows, prices: prices.rows,
    errors: { vehicle: vehicle.error, inactive: inactiveWithModel.error || inactiveWithoutModel.error, extra: extra.error, history: history.error, ownership: ownership.error, openRecalls: openRecalls.error, canceled: c1.error || c2.error || c3.error, model: model.error, prices: prices.error } };
}
export function value(row: Row | null, key: string): string { const v = row?.[key]; return v === null || v === undefined || v === '' ? 'לא זמין' : String(v); }
export function date(value: unknown): string { if (!value) return 'לא זמין'; const s = String(value); if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s.split('-').reverse().join('.'); if (/^\d{6}$/.test(s)) return `${s.slice(4, 6)}.${s.slice(0, 4)}`; return s; }
export function yesNo(value: unknown): string { return value === 1 || value === '1' ? 'כן' : value === 0 || value === '0' ? 'לא' : 'לא זמין'; }
