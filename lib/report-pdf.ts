import path from 'node:path';
import { createPdf, type DocumentBlock } from 'rtl-pdf';
import { date, disabledParkingTagStatus, groupOwnership, value, yesNo, type VehicleReport, type VehicleStatus, type Row } from './vehicles';

const font = path.join(process.cwd(), 'assets/fonts/NotoSansHebrew-Medium.ttf');
const ink = '#0c1831';
const blue = '#245ee9';
const muted = '#66758e';
const statusLabels: Record<VehicleStatus, string> = {
  active: 'רשומה במאגר הפעילים', inactive: 'רשומה במאגר הלא פעילים', canceled: 'נמצאה רשומת ביטול סופי',
  unknown: 'לא נקבע סטטוס', unavailable: 'חלק ממאגרי הסטטוס אינם זמינים',
};

function clean(input: unknown, max = 600): string {
  return String(input ?? 'לא זמין').replace(/[\u0000-\u001F\u007F]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max) || 'לא זמין';
}

export async function createVehiclePdf(plate: string, report: VehicleReport): Promise<Uint8Array> {
  const blocks: DocumentBlock[] = [];
  const text = (content: string, fontSize = 10, color = ink, marginBottom = 4) =>
    blocks.push({ type: 'text', text: clean(content, 1200), direction: 'rtl', align: 'right', fontSize, color, marginBottom, lineHeight: 1.4 });
  const heading = (title: string) => {
    blocks.push({ type: 'spacer', height: 10 });
    text(title, 15, blue, 4);
    blocks.push({ type: 'rule', color: '#dce5f4', marginBottom: 8 });
  };
  const field = (label: string, data: unknown) => text(`${label}: ${clean(data)}`, 10, ink, 4);
  const note = (message: string) => text(message, 9, muted, 8);
  const fields = (row: Row, items: [string, string][]) => items.forEach(([key, label]) => field(label, value(row, key)));

  text('AUTOPEEK', 25, ink, 1);
  text(`דוח מידע לרכב ${plate}`, 13, blue, 3);
  field('מועד הפקה', new Intl.DateTimeFormat('he-IL', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Jerusalem' }).format(new Date()));
  blocks.push({ type: 'rule', color: '#dce5f4', marginTop: 5 });
  heading('סיכום הבדיקה');
  field('רישום הרכב', statusLabels[report.status]);
  field('תוקף רישוי במאגר', report.base?.tokef_dt ? date(report.base.tokef_dt) : 'לא זמין');
  field('נסועה בטסט האחרון', report.history?.kilometer_test_aharon != null ? `${value(report.history, 'kilometer_test_aharon')} ק״מ` : report.errors.history ? 'המאגר לא זמין' : 'לא פורסמה רשומה');
  field('היסטוריית בעלות', report.ownership.length ? `${report.ownership.length} רשומות מקור` : report.errors.ownership ? 'המאגר לא זמין' : 'לא פורסמה רשומה');
  field('ריקולים שלא בוצעו', report.openRecalls.length ? `${report.openRecalls.length} רשומות` : report.errors.openRecalls ? 'המאגר לא זמין' : 'לא נמצאה רשומה');
  field('תג חניה לנכה', disabledParkingTagStatus(report));
  note('זהו סיכום הרשומות שפורסמו במאגרים שנבדקו. היעדר מידע אינו אישור לתקינות או למצב משפטי של הרכב.');
  if (report.canceled) { heading('התראת סטטוס'); field('ביטול סופי', date(report.canceled.bitul_dt)); note('יש לאמת סטטוס עדכני מול משרד התחבורה.'); }
  else if (report.status === 'inactive') { heading('התראת סטטוס'); note('הרכב מופיע במאגר רכב לא פעיל. יש לאמת את מצב הרישוי העדכני מול משרד התחבורה.'); }
  if (report.openRecalls.length) { heading('התראת ריקול'); field('קריאות שלא בוצעו', report.openRecalls.length); note('יש לפנות ליבואן או למוסך מורשה לבירור ולטיפול.'); }
  heading('פרטי הרכב');
  if (report.base) {
    fields(report.base, report.baseSource === 'inactiveWithoutModel' ? [
      ['tozeret_nm','יצרן'], ['degem_nm','דגם'], ['shnat_yitzur','שנת ייצור'],
      ['sug_delek_nm','סוג דלק'], ['nefach_manoa','נפח מנוע (סמ״ק)'], ['hanaa_nm','הנעה'],
    ] : [
      ['tozeret_nm','יצרן'], ['kinuy_mishari','שם מסחרי'], ['degem_nm','קוד דגם'], ['shnat_yitzur','שנת ייצור'],
      ['ramat_gimur','רמת גימור'], ['tzeva_rechev','צבע'], ['sug_delek_nm','סוג דלק'], ['baalut','סוג בעלות נוכחית'],
      ['zmig_kidmi','צמיג קדמי'], ['zmig_ahori','צמיג אחורי'], ['moed_aliya_lakvish','עלייה לכביש'],
      ['kvutzat_zihum','קבוצת זיהום'], ['ramat_eivzur_betihuty','רמת אבזור בטיחותי'],
    ]);
    if (report.base.mivchan_acharon_dt) field('מועד טסט אחרון', date(report.base.mivchan_acharon_dt));
    if (report.base.tokef_dt) field('תוקף רישוי', date(report.base.tokef_dt));
  } else note(report.errors.vehicle ? 'מאגר פרטי הרכב לא היה זמין בעת הפקת הדוח.' : 'לא נמצאה רשומה במאגר פרטי הרכב.');
  if (report.extra) { heading('פרטים נוספים'); fields(report.extra, [
    ['kod_omes_tzmig_kidmi','קוד עומס צמיג קדמי'], ['kod_omes_tzmig_ahori','קוד עומס צמיג אחורי'],
    ['kod_mehirut_tzmig_kidmi','קוד מהירות קדמי'], ['kod_mehirut_tzmig_ahori','קוד מהירות אחורי'], ['grira_nm','אבזור גרירה'],
  ]); }
  heading('נסועה ושינויי מבנה');
  if (report.history) {
    field('נסועה בטסט האחרון', `${value(report.history, 'kilometer_test_aharon')} ק״מ`);
    field('תאריך רישום ראשון', date(report.history.rishum_rishon_dt));
    field('מקוריות', value(report.history, 'mkoriut_nm'));
    field('שינוי מבנה', yesNo(report.history.shinui_mivne_ind));
    field('גפ״מ', yesNo(report.history.gapam_ind));
    field('שינוי צבע', yesNo(report.history.shnui_zeva_ind));
    field('שינוי צמיגים', yesNo(report.history.shinui_zmig_ind));
    note('הנסועה היא מדידה אחת מהטסט האחרון, לא היסטוריית טיפולים או רצף מדידות.');
  } else {
    note(report.errors.history ? 'מאגר ההיסטוריה לא היה זמין בעת הפקת הדוח.' : 'לא פורסמה לרכב זה רשומה במאגר ההיסטוריה. אין לנו ממנו נתון נסועה או שינויי מבנה.');
    if (report.base?.mivchan_acharon_dt) field('מועד טסט אחרון במאגר הרכב', date(report.base.mivchan_acharon_dt));
  }
  heading('היסטוריית בעלות');
  const ownershipGroups = groupOwnership(report.ownership);
  if (ownershipGroups.length) {
    ownershipGroups.forEach((group) => field(`דווח לחודש ${date(group.month)}`, `${group.kind}${group.count > 1 ? ` (${group.count} רשומות זהות במקור)` : ''}`));
    if (ownershipGroups.some(group => group.count > 1)) note('רשומות עם אותו חודש וסוג בעלות מוצגות יחד. לא ניתן לקבוע אם הן כפילויות טכניות או העברות נפרדות.');
  }
  else {
    note(report.errors.ownership ? 'מאגר הבעלויות לא היה זמין בעת הפקת הדוח.' : 'לא פורסמה לרכב זה רשומת היסטוריית בעלות. אין מכך להסיק שלא היו בעלים קודמים.');
    if (report.base?.baalut) field('סוג בעלות נוכחית במאגר הרכב', value(report.base, 'baalut'));
  }
  note('המאגר כולל סוגי בעלות ותאריכים בלבד, ללא שמות בעלים.');
  // Give this section room so its heading does not end a page on its own.
  blocks.push({ type: 'spacer', height: 65 });
  heading('ריקולים שלא בוצעו');
  if (report.openRecalls.length) report.openRecalls.forEach((row) => {
    field('מספר קריאה', value(row,'RECALL_ID'));
    field('תאריך פתיחה', date(row.TAARICH_PTICHA));
    field('סוג תקלה', value(row,'SUG_TAKALA'));
    field('תיאור התקלה', value(row,'TEUR_TAKALA'));
  });
  else note(report.errors.openRecalls ? 'מאגר הריקולים לא היה זמין בעת הפקת הדוח.' : 'לא נמצאה רשומה במאגר ריקולים שלא בוצעו. היעדר רשומה אינו אישור שאין ריקול אחר.');
  heading('תג חניה לנכה');
  field('רישום במאגר', disabledParkingTagStatus(report));
  note(report.disabledParkingTag ? 'מספר הרישוי מופיע במאגר הרכבים המורשים לשאת תג חניה לנכה. התג אישי לבעל הזכאות ואינו חלק מהרכב הנמכר.' : report.errors.disabledParkingTag ? 'המאגר לא היה זמין בעת הפקת הדוח. לא ניתן לקבוע אם הרכב מופיע בו.' : 'לא נמצאה רשומה לפי מספר הרישוי במאגר שנבדק. אין בכך אישור שאין תג תקף.');
  note('שיוך רכב לתג אינו מעיד על זהות בעל הרכב או על מצבו הרפואי.');
  heading('סטטוס ביטול סופי');
  field('סטטוס במאגר', report.canceled ? `ביטול סופי בתאריך ${date(report.canceled.bitul_dt)}` : report.errors.canceled ? 'המאגר לא היה זמין' : 'לא נמצאה רשומה במאגרים שנבדקו');
  if (report.model[0]) {
    heading('מפרט דגם ו־WLTP');
    fields(report.model[0], [
      ['nefah_manoa','נפח מנוע (סמ״ק)'], ['koah_sus','כוח סוס'], ['mispar_moshavim','מושבים'], ['merkav','מרכב'],
      ['hanaa_nm','הנעה'], ['technologiat_hanaa_nm','טכנולוגיית הנעה'], ['CO2_WLTP','פליטת CO₂ WLTP (גרם/ק״מ)'],
      ['madad_yarok','מדד ירוק'], ['nikud_betihut','ציון בטיחות'],
    ]);
    note('התאמה לפי קוד יצרן, קוד דגם ושנת ייצור. נתוני דגם עשויים להשתנות בין רמות גימור.');
  }
  if (report.prices[0]) {
    heading('מחיר יבואן לרכב חדש');
    field('מחיר מדווח', `₪${value(report.prices[0],'mehir')}`);
    field('יבואן', value(report.prices[0],'shem_yevuan'));
    field('שנת דגם', value(report.prices[0],'shnat_yitzur'));
    note('מחיר יבואן לרכב חדש אינו שווי שוק של רכב משומש.');
  }
  heading('בדיקות לפני קנייה');
  note('השוו את מספר הרישוי, מספר השלדה ופרטי הרכב לרישיון ולרכב עצמו.');
  note('בדקו דיווח גניבה בשירות משטרת ישראל: https://www.gov.il/apps/police/stolencar/');
  note('בדקו שעבודים ומשכונות בשירות רשות התאגידים: https://www.gov.il/he/service/pawn_perusal');
  note('בררו ריקולים מול היבואן ובצעו בדיקה מקצועית. מידע ממשלתי: https://www.gov.il/he/Departments/DynamicCollectors/cars-recall');
  heading('מקורות והבהרות');
  note('מקור הנתונים: מאגרי משרד התחבורה באתר data.gov.il.');
  text('https://data.gov.il/he/organizations/ministry_of_transport', 8, muted, 4);
  note('AUTOPEEK הוא שירות עצמאי, לא אתר ממשלתי. הדוח משקף מידע ציבורי כפי שהתקבל בעת הפקתו; הוא אינו מסמך רשמי, בדיקת תקינות או אישור שווי. היעדר רשומה אינו אישור להיעדר בעיה. לפני רכישה יש לבצע בדיקה מקצועית ולאמת נתונים מול הגורמים המוסמכים.');
  return createPdf({ fonts: { rtl: font }, metadata: { title: `AUTOPEEK - ${plate}`, author: 'AUTOPEEK', subject: 'דוח מידע ציבורי על רכב', language: 'he' }, page: { size: 'A4', margins: { top: 46, bottom: 46, left: 50, right: 50 } }, defaults: { direction: 'rtl', color: ink }, blocks });
}
