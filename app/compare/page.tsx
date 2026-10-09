import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo';
import { getComparisonGroups, hasComparisonData, comparisonName, type ComparisonRow } from '@/lib/comparison';
import { getVehicleReport, parsePlate } from '@/lib/vehicles';

export async function generateMetadata({ searchParams }: { searchParams: Promise<{ first?: string | string[]; second?: string | string[] }> }): Promise<Metadata> {
  const params = await searchParams;
  return {
    ...pageMetadata('/compare', 'השוואת רכבים לפי מספר רישוי', 'השוואה בין שני כלי רכב לפי מספר רישוי: פרטי הרכב, רישוי, נסועה בטסט האחרון, בעלות וריקולים ממאגרים ציבוריים בישראל.'),
    ...(params.first !== undefined || params.second !== undefined ? { robots: { index: false, follow: true } } : {}),
  };
}

function ComparisonGroup({ title, rows }: { title: string; rows: ComparisonRow[] }) {
  return <section className="compareGroup"><h2>{title}</h2><div className="compareTable" role="table" aria-label={title}><div className="srOnly" role="row"><span role="columnheader">נתון</span><span role="columnheader">רכב ראשון</span><span role="columnheader">רכב שני</span></div>
    {rows.map((row) => <div className="compareRow" role="row" key={row.label}>
      <div className="compareLabel" role="rowheader">{row.label}{row.hint && <small>{row.hint}</small>}</div>
      {row.values.map((entry, index) => <div className={`compareValue${entry === 'לא זמין' || entry === 'לא פורסמה רשומה' ? ' muted' : ''}`} role="cell" key={index}>{entry}</div>)}
    </div>)}
  </div></section>;
}

export default async function Compare({ searchParams }: { searchParams: Promise<{ first?: string | string[]; second?: string | string[] }> }) {
  const params = await searchParams;
  const rawFirst = typeof params.first === 'string' && params.first.length <= 12 ? params.first.trim() : '';
  const rawSecond = typeof params.second === 'string' && params.second.length <= 12 ? params.second.trim() : '';
  const first = parsePlate(rawFirst);
  const second = parsePlate(rawSecond);
  const submitted = params.first !== undefined && params.second !== undefined;
  const invalid = submitted && (!first || !second);
  const same = submitted && first !== null && first === second;
  const reports = submitted && !invalid && !same
    ? await Promise.all([getVehicleReport(first!), getVehicleReport(second!)])
    : null;
  const [left, right] = reports ?? [];
  const bothFound = Boolean(left && right && hasComparisonData(left) && hasComparisonData(right));
  const groups = left && right ? getComparisonGroups(left, right) : [];

  return <>
    <header className="topbar"><div className="topbarInner"><a className="brand" href="/" aria-label="AUTOPEEK — דף הבית"><span className="brandMark">A<span>•</span></span><span>AUTO<span className="brandAccent">PEEK</span></span></a><a className="topLink" href="/">חזרה לחיפוש ←</a></div></header>
    <main id="main-content" tabIndex={-1} className="pageWrap comparePage">
      <section className="compareHero"><span className="eyebrow small">לפני קנייה</span><h1>השוואת שני רכבים</h1><p>הזינו שני מספרי רישוי ישראליים וראו את הנתונים הציבוריים זה לצד זה. הנתונים עוזרים לשאול שאלות טובות יותר; הם אינם קובעים איזה רכב כדאי לקנות.</p>
        <form className="compareForm" action="/compare" method="get">
          <label>רכב ראשון<input name="first" type="text" inputMode="numeric" pattern="[0-9\- ]{5,12}" maxLength={12} autoComplete="off" placeholder="מספר רישוי ראשון" defaultValue={rawFirst} aria-invalid={(invalid || same) || undefined} aria-describedby={invalid ? "compare-invalid" : same ? "compare-same" : undefined} required/></label>
          <label>רכב שני<input name="second" type="text" inputMode="numeric" pattern="[0-9\- ]{5,12}" maxLength={12} autoComplete="off" placeholder="מספר רישוי שני" defaultValue={rawSecond} aria-invalid={(invalid || same) || undefined} aria-describedby={invalid ? "compare-invalid" : same ? "compare-same" : undefined} required/></label>
          <button type="submit">השוואת רכבים ←</button>
        </form>
        {invalid && <p className="formError" id="compare-invalid" role="alert">יש להזין שני מספרי רישוי ישראליים בני 5 עד 8 ספרות.</p>}
        {same && <p className="formError" id="compare-same" role="alert">כדי להשוות, הזינו שני מספרי רישוי שונים.</p>}
      </section>
      {reports && <section className="compareResults" aria-label="תוצאות ההשוואה">
        <div className="compareIntro"><h2>תוצאות ההשוואה</h2><p>ההשוואה מבוססת על הרשומות שהתקבלו כעת. מידע חסר או היעדר ריקול אינם אישור לתקינות הרכב.</p></div>
        {reports.some(hasComparisonData) && <div className="compareActions"><a className="downloadButton" href={`/api/compare-report?first=${encodeURIComponent(first!)}&second=${encodeURIComponent(second!)}`} download={`AUTOPEEK-compare-${first}-${second}.pdf`}>↓ הורדת דוח השוואה PDF</a><span>הדוח משקף את המידע שהתקבל בזמן ההפקה.</span></div>}
        <div className="compareColumnHeads"><span>נתון</span>{[first!, second!].map((plate, i) => <div key={plate}><strong>{i === 0 ? 'רכב ראשון' : 'רכב שני'}</strong><span dir="ltr">{plate}</span><small>{comparisonName(reports[i])}</small><a href={`/?plate=${encodeURIComponent(plate)}`}>לדוח המלא ←</a></div>)}</div>
        {reports.some(report => !hasComparisonData(report)) && <div className="notice warning compareNotice" role="status">{reports.map((report, i) => !hasComparisonData(report) ? <p key={i}>לרכב {i === 0 ? 'הראשון' : 'השני'} ({i === 0 ? first : second}) {Object.values(report.errors).some(Boolean) ? 'לא התקבלו נתונים וחלק מהמאגרים אינם זמינים כרגע. כדאי לנסות שוב מאוחר יותר.' : 'לא נמצאה רשומה במאגרים שנבדקו. ייתכן שמספר הרישוי מחוץ לטווח הכיסוי.'}</p> : null)} אין להסיק מהיעדר נתונים שהרכב תקין.</div>}
        {bothFound && <p className="compareHint">הבדלים מוצגים לצורך עיון בלבד. הנתונים עשויים להגיע ממאגרים בעלי כיסוי ומועדי עדכון שונים.</p>}
        {groups.map(group => <ComparisonGroup key={group.title} title={group.title} rows={group.rows}/>)}
        <section className="compareNext"><h2>לפני שמחליטים</h2><p>השוו את הפרטים לרישיונות הרכב ולרכבים עצמם, בדקו שעבודים ודיווח גניבה בשירותים הרשמיים, ובררו ריקולים מול היבואן. כדאי לבצע בדיקה מקצועית לשני הרכבים.</p><a href="/guide">למדריך לבדיקת רכב לפני קנייה ←</a></section>
      </section>}
    </main>
    <footer><div className="footerInner"><div className="footerBrand"><strong>AUTOPEEK</strong><span>© 2026 · שירות מידע עצמאי לרכב</span></div><nav className="footerLinks" aria-label="קישורי האתר"><a href="/">בדיקת רכב</a><a href="/garages">מוסכים מורשים</a><a href="/appraisers">שמאי רכב</a><a href="/guide">מדריך לבדיקה</a><a href="/terms">תנאי שימוש</a><a href="/privacy">פרטיות</a><a href="/accessibility">נגישות</a><a href="/contact">יצירת קשר</a></nav><p className="footerSource">מקור הנתונים: <a href="https://data.gov.il/he/organizations/ministry_of_transport" target="_blank" rel="noopener noreferrer">מאגרי משרד התחבורה באתר data.gov.il ↗</a></p></div></footer>
  </>;
}
