import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo';
import { LegalShell } from '../components/legal-shell';

export const metadata: Metadata = pageMetadata('/accessibility', 'נגישות', 'מידע על נגישות אתר RehevNet ודרכי פנייה');
export const dynamic = 'force-dynamic';

export default function Accessibility() {
  const contactEnabled = Boolean(process.env.RESEND_API_KEY && process.env.CONTACT_TO_EMAIL && process.env.CONTACT_FROM_EMAIL);
  return <LegalShell title="נגישות" introduction="עודכן: 9 באוקטובר 2026 · מידע על התאמות הנגישות באתר ומצב ערוץ הפנייה.">
    <section><h2>השימוש באתר</h2><p>אפשר להשתמש באתר באמצעות מקלדת, ויש בו כותרות, תוויות לשדות, סימון שפת העמוד וקישור לדילוג לתוכן. תפריט הנגישות מאפשר התאמה אישית של גודל הטקסט, הניגודיות, מראה הקישורים והתנועה. אנחנו ממשיכים לבדוק ולשפר את הנגישות; אין בהצהרה זו אישור לעמידה מלאה בתקן נגישות מסוים.</p></section>
    <section><h2>דוחות PDF</h2><p>דוחות ה־PDF נוצרים עם סימון שפה, כותרות ופסקאות לקריאה בסדר מובנה. עדיין לא הושלמה בדיקה שלהם בכל קוראי המסך. המידע מוצג גם בעמודי התוצאות וההשוואה באתר.</p></section>
    <section><h2>דיווח על בעיה</h2><p>אם נתקלתם בקושי בנגישות האתר או דרושה לכם דרך חלופית לקבלת מידע, {contactEnabled && <>פנו דרך <a href="/contact">דף יצירת הקשר</a>, או </>}שלחו הודעה לכתובת <a href="mailto:rehevnet@outlook.co.il" dir="ltr">rehevnet@outlook.co.il</a>. כדאי לציין את כתובת העמוד, הפעולה שניסיתם לבצע, הדפדפן או הטכנולוגיה המסייעת שבה השתמשתם, ותיאור קצר של הבעיה.</p></section>
  </LegalShell>;
}
