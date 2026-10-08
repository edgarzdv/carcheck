import { date, disabledParkingTagStatus, groupOwnership, value, type Row, type VehicleReport, type VehicleStatus } from './vehicles';

export type ComparisonRow = { label: string; values: [string, string]; hint?: string };
export type ComparisonGroup = { title: string; rows: ComparisonRow[] };

const statusLabels: Record<VehicleStatus, string> = {
  active: 'נמצא במאגר הפעילים',
  inactive: 'נמצא במאגר הלא פעילים',
  canceled: 'נמצאה רשומת ביטול סופי',
  unknown: 'לא נמצאה רשומת סטטוס',
  unavailable: 'לא ניתן לקבוע - מאגר אינו זמין',
};
const number = new Intl.NumberFormat('he-IL');
const text = (row: Row | null, key: string) => value(row, key);
const dated = (row: Row | null, key: string) => row?.[key] ? date(row[key]) : 'לא זמין';

function mileage(report: VehicleReport) {
  if (!report.history) return 'לא פורסמה רשומה';
  const reading = report.history.kilometer_test_aharon;
  return reading != null && reading !== '' && Number.isFinite(Number(reading))
    ? `${number.format(Number(reading))} ק״מ`
    : 'לא זמין';
}
function ownerHistory(report: VehicleReport) {
  return report.ownership.length ? `${groupOwnership(report.ownership).length} קבוצות רישום` : 'לא פורסמה רשומה';
}
function recallCount(report: VehicleReport) {
  return report.openRecalls.length ? `${report.openRecalls.length} רשומות במאגר` : 'לא נמצאה רשומה';
}
function importerPrice(report: VehicleReport) {
  if (report.errors.prices && !report.prices.length) return 'מאגר לא זמין';
  const amount = Number(report.prices[0]?.mehir);
  return Number.isFinite(amount) && amount > 0 ? `₪${number.format(amount)}` : 'לא זמין';
}

export function comparisonName(report: VehicleReport) {
  return [report.base?.tozeret_nm, report.base?.kinuy_mishari || report.base?.degem_nm].filter(Boolean).join(' ') || 'פרטי דגם לא זמינים';
}
export function hasComparisonData(report: VehicleReport) {
  return Boolean(report.base || report.history || report.ownership.length || report.openRecalls.length || report.disabledParkingTag);
}

export function getComparisonGroups(first: VehicleReport, second: VehicleReport): ComparisonGroup[] {
  const row = (label: string, read: (report: VehicleReport) => string, hint?: string): ComparisonRow => ({
    label, values: [read(first), read(second)], hint,
  });
  return [
    { title: 'פרטי הרכב', rows: [
      row('יצרן', report => text(report.base, 'tozeret_nm')),
      row('דגם / שם מסחרי', report => text(report.base, report.base?.kinuy_mishari ? 'kinuy_mishari' : 'degem_nm')),
      row('שנת ייצור', report => text(report.base, 'shnat_yitzur')),
      row('רמת גימור', report => text(report.base, 'ramat_gimur')),
      row('סוג דלק', report => text(report.base, 'sug_delek_nm')),
      row('צבע', report => text(report.base, 'tzeva_rechev')),
      row('נפח מנוע', report => report.base?.nefach_manoa ? text(report.base, 'nefach_manoa') : text(report.model[0] ?? null, 'nefah_manoa')),
      row('צמיג קדמי', report => text(report.base, 'zmig_kidmi')),
      row('צמיג אחורי', report => text(report.base, 'zmig_ahori')),
    ] },
    { title: 'רישוי וסטטוס', rows: [
      row('סטטוס במאגרים', report => statusLabels[report.status], 'יש לאמת מצב עדכני מול משרד התחבורה'),
      row('טסט אחרון', report => dated(report.base, 'mivchan_acharon_dt')),
      row('תוקף רישוי מדווח', report => dated(report.base, 'tokef_dt'), 'לא אישור רישוי בזמן אמת'),
      row('סוג בעלות נוכחית', report => text(report.base, 'baalut')),
      row('תג חניה לנכה', disabledParkingTagStatus, 'התאמה לרכב במאגר; אינה מעידה על זכאות בעל הרכב או עוברת לקונה'),
      row('ביטול סופי', report => report.canceled ? `נמצאה רשומה - ${dated(report.canceled, 'bitul_dt')}` : report.errors.canceled ? 'מאגר לא זמין' : 'לא נמצאה רשומה'),
    ] },
    { title: 'היסטוריה וריקולים', rows: [
      row('נסועה בטסט האחרון', report => report.errors.history && !report.history ? 'מאגר לא זמין' : mileage(report), 'מדידה אחת בלבד; לא היסטוריית נסועה'),
      row('רישום ראשון', report => dated(report.history, 'rishum_rishon_dt')),
      row('רשומות בעלות', report => report.errors.ownership && !report.ownership.length ? 'מאגר לא זמין' : ownerHistory(report), 'קבוצות רישום אינן מספר בעלים'),
      row('ריקולים שלא בוצעו', report => report.errors.openRecalls && !report.openRecalls.length ? 'מאגר לא זמין' : recallCount(report), 'היעדר רשומה אינו אישור שאין ריקול'),
    ] },
    { title: 'נתוני דגם ומחיר יבואן', rows: [
      row('כוח סוס', report => report.errors.model && !report.model.length ? 'מאגר לא זמין' : text(report.model[0] ?? null, 'koah_sus'), 'התאמה ברמת דגם; עשויה להשתנות בין רמות גימור'),
      row('מספר מושבים', report => text(report.model[0] ?? null, 'mispar_moshavim')),
      row('פליטת CO₂ WLTP', report => text(report.model[0] ?? null, 'CO2_WLTP'), 'גרם לק״מ לפי נתוני הדגם'),
      row('ציון בטיחות', report => text(report.model[0] ?? null, 'nikud_betihut')),
      row('מחיר יבואן לרכב חדש', importerPrice, 'מחיר שדווח לדגם חדש; אינו שווי רכב משומש'),
    ] },
  ];
}
