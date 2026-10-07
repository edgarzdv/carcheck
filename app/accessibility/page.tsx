import type { Metadata } from 'next';
import { LegalShell } from '../components/legal-shell';

export const metadata: Metadata = { title: 'נגישות | AUTOPEEK', description: 'מידע על נגישות אתר AUTOPEEK ודרכי פנייה', alternates: { canonical: '/accessibility' } };

export default function Accessibility() {
  return <LegalShell title="נגישות" introduction="עודכן: 7 באוקטובר 2026 · נשמח לשמוע על קושי ולהציע דרך חלופית לקבלת מידע.">
    <section><h2>השימוש באתר</h2><p>אנחנו פועלים כדי שהחיפוש והמידע באתר יהיו נוחים לשימוש גם באמצעות מקלדת וטכנולוגיות מסייעות. באתר נעשה שימוש בכותרות, תוויות לשדה החיפוש, סימון שפת העמוד ומצבי מיקוד גלויים. אנחנו ממשיכים לבדוק ולשפר את הנגישות; אין בהצהרה זו משום אישור לעמידה מלאה בתקן נגישות מסוים.</p></section>
    <section><h2>דוחות PDF</h2><p>דוח ה־PDF עשוי להיות פחות נוח לשימוש עם חלק מטכנולוגיות הסיוע. מרבית המידע המופיע בו מוצג גם בעמוד התוצאות. אם דרושה לכם דרך חלופית לקבלת המידע, פנו אלינו ונשתדל לסייע.</p></section>
    <section><h2>דיווח על בעיה</h2><p>אם נתקלתם בקושי בנגישות האתר, כתבו ל־<a href="mailto:edgarzdv@gmail.com">edgarzdv@gmail.com</a>. כדאי לציין את כתובת העמוד, הפעולה שניסיתם לבצע, הדפדפן או הטכנולוגיה המסייעת שבה השתמשתם, ותיאור קצר של הבעיה.</p></section>
  </LegalShell>;
}
