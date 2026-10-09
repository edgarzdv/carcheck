import path from 'node:path';
import { createAccessiblePdf, type AccessibleDocumentBlock } from './accessible-pdf';
import { comparisonName, getComparisonGroups, hasComparisonData } from './comparison';
import type { VehicleReport } from './vehicles';

const font = path.join(process.cwd(), 'assets/fonts/NotoSansHebrew-Medium.ttf');
const ink = '#0c1831';
const blue = '#245ee9';
const muted = '#66758e';

function clean(input: unknown, max = 300): string {
  return String(input ?? 'לא זמין').replace(/[\u0000-\u001F\u007F]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max) || 'לא זמין';
}

export async function createComparisonPdf(
  firstPlate: string, firstReport: VehicleReport,
  secondPlate: string, secondReport: VehicleReport,
): Promise<Uint8Array> {
  const blocks: AccessibleDocumentBlock[] = [];
  const text = (content: string, fontSize = 10, color = ink, marginBottom = 5, headingLevel?: 1 | 2 | 3, minFollowingHeight?: number) => {
    blocks.push({ type: 'text', text: clean(content, 600), direction: 'rtl', align: 'right', fontSize, color, marginBottom, lineHeight: 1.4, headingLevel, minFollowingHeight });
  };
  const heading = (title: string) => {
    blocks.push({ type: 'spacer', height: 11 });
    text(title, 15, blue, 4, 2, 75);
    blocks.push({ type: 'rule', color: '#dce5f4', marginBottom: 8 });
  };
  const note = (content: string) => text(content, 9, muted, 8);

  text('AUTOPEEK', 25, ink, 1);
  text('דוח השוואת רכבים לפי מספר רישוי', 14, blue, 5, 1);
  text(`רכב ראשון: ${firstPlate} - ${comparisonName(firstReport)}`, 11, ink, 2);
  text(`רכב שני: ${secondPlate} - ${comparisonName(secondReport)}`, 11, ink, 5);
  note(`מועד הפקה: ${new Intl.DateTimeFormat('he-IL', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Jerusalem' }).format(new Date())}`);
  blocks.push({ type: 'rule', color: '#dce5f4', marginBottom: 8 });
  note('הדוח מציג מידע ציבורי שהתקבל בעת הפקתו. מידע חסר, היעדר ריקול או הבדל בין הרשומות אינם קובעים איזה רכב תקין או עדיף לקנייה.');
  [firstReport, secondReport].forEach((report, index) => {
    if (hasComparisonData(report)) return;
    const reason = Object.values(report.errors).some(Boolean)
      ? 'לא התקבלו נתונים וחלק מהמאגרים לא היו זמינים בעת הפקת הדוח.'
      : 'לא נמצאה רשומה במאגרים שנבדקו. ייתכן שהרכב מחוץ לטווח הכיסוי.';
    text(`רכב ${index === 0 ? 'ראשון' : 'שני'}: ${reason}`, 10, '#a15c16', 7);
  });

  for (const group of getComparisonGroups(firstReport, secondReport)) {
    heading(group.title);
    for (const row of group.rows) {
      text(row.label, 11, blue, 2, undefined, 75);
      text(`רכב ראשון - ${row.values[0]}`, 10, ink, 1);
      text(`רכב שני - ${row.values[1]}`, 10, ink, 2);
      if (row.hint) text(row.hint, 8, muted, 5);
      blocks.push({ type: 'rule', color: '#eef1f6', marginBottom: 4 });
    }
  }

  heading('לפני שמחליטים');
  note('השוו את הפרטים לרישיונות הרכב ולרכבים עצמם. בדקו שעבודים ודיווח גניבה בשירותים הרשמיים, בררו ריקולים מול היבואן ובצעו בדיקה מקצועית לשני הרכבים.');
  heading('מקורות והבהרות');
  note('מקור הנתונים: מאגרי משרד התחבורה באתר data.gov.il.');
  text('https://data.gov.il/he/organizations/ministry_of_transport', 8, muted, 7);
  note('AUTOPEEK הוא שירות עצמאי, לא אתר ממשלתי. הדוח אינו מסמך רשמי, אישור רישוי, בדיקת תקינות, אישור על היעדר שעבוד או הערכת שווי. נתוני הדגם עשויים להשתנות בין רמות גימור, ומחיר יבואן לרכב חדש אינו שווי שוק של רכב משומש. יש לאמת נתונים מהותיים מול הגורמים המוסמכים.');

  return createAccessiblePdf({
    fonts: { rtl: font },
    metadata: { title: `AUTOPEEK - השוואת רכבים ${firstPlate} ${secondPlate}`, author: 'AUTOPEEK', subject: 'השוואת מידע ציבורי על שני רכבים', language: 'he-IL' },
    page: { size: 'A4', margins: { top: 46, bottom: 46, left: 50, right: 50 } },
    defaults: { direction: 'rtl', color: ink },
    blocks,
  });
}
