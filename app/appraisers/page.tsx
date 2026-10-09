import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo';
import { appraisersSource, getAppraisers, parseAppraiserOffset, parseAppraiserTerm } from '@/lib/appraisers';

type Params = { city?: string | string[]; name?: string | string[]; offset?: string | string[] };

export async function generateMetadata({ searchParams }: { searchParams: Promise<Params> }): Promise<Metadata> {
  const params = await searchParams;
  return {
    ...pageMetadata('/appraisers', 'חיפוש שמאי רכב מורשים בישראל', 'חיפוש שמאי רכב מורשים לפי שם ויישוב במאגר משרד התחבורה, כולל מספר רישיון.'),
    ...(Object.keys(params).length ? { robots: { index: false, follow: true } } : {}),
  };
}

function listingUrl(city: string | null, name: string | null, offset: number) {
  const params = new URLSearchParams();
  if (city) params.set('city', city);
  if (name) params.set('name', name);
  if (offset) params.set('offset', String(offset));
  return `/appraisers${params.size ? `?${params.toString()}` : ''}`;
}

export default async function Appraisers({ searchParams }: { searchParams: Promise<Params> }) {
  const params = await searchParams;
  const rawCity = typeof params.city === 'string' ? params.city : '';
  const rawName = typeof params.name === 'string' ? params.name : '';
  const city = rawCity.trim() ? parseAppraiserTerm(rawCity) : null;
  const name = rawName.trim() ? parseAppraiserTerm(rawName) : null;
  const invalidCity = Array.isArray(params.city) || (!!rawCity.trim() && !city);
  const invalidName = Array.isArray(params.name) || (!!rawName.trim() && !name);
  const invalid = invalidCity || invalidName;
  const offset = parseAppraiserOffset(params.offset);
  const result = invalid ? null : await getAppraisers(city, name, offset);

  return <>
    <header className="topbar"><div className="topbarInner"><a className="brand" href="/" aria-label="RehevNet — דף הבית"><span className="brandMark">R<span>•</span></span><span>Rehev<span className="brandAccent">Net</span></span></a><nav className="topLinks" aria-label="ניווט ראשי"><a className="topLink" href="/">בדיקת רכב</a><a className="topLink" href="/garages">מוסכים מורשים</a></nav></div></header>
    <main id="main-content" tabIndex={-1} className="pageWrap garagesPage">
      <section className="garagesHero"><span className="eyebrow small">משרד התחבורה · מאגר ציבורי</span><h1>שמאי רכב מורשים</h1><p>חפשו שמאי רכב לפי שם או יישוב ובדקו את מספר הרישיון המופיע במאגר משרד התחבורה.</p>
        <form className="garagesSearch appraisersSearch" action="/appraisers" method="get">
          <div className="appraisersFields"><label htmlFor="appraiser-name">שם או מילת חיפוש<input id="appraiser-name" name="name" type="search" maxLength={50} placeholder="למשל: כהן" defaultValue={name ?? rawName} aria-invalid={invalidName || undefined} aria-describedby={invalidName ? 'appraiser-error' : undefined}/></label><label htmlFor="appraiser-city">יישוב<input id="appraiser-city" name="city" type="search" maxLength={50} placeholder="למשל: חיפה" defaultValue={city ?? rawCity} autoComplete="address-level2" aria-invalid={invalidCity || undefined} aria-describedby={invalidCity ? 'appraiser-error' : undefined}/></label><button type="submit">חיפוש שמאים ←</button></div>
        </form>
        {invalid && <p className="formError" id="appraiser-error" role="alert">אפשר לחפש בשם או ביישוב באורך של 2–50 תווים, ללא סימנים מיוחדים.</p>}
      </section>
      <section className="garagesResults" aria-label="רשימת השמאים"><div className="garagesResultsHead"><div><h2>{city ? `שמאי רכב ב${city}` : 'רשימת שמאי הרכב'}</h2><p>הרשימה מבוססת על המאגר הרשמי ומתעדכנת לפי הפרסום בו.</p></div></div>
        {result?.error && <div className="notice warning" role="status">מאגר השמאים אינו זמין כרגע. נסו שוב מאוחר יותר.</div>}
        {result && !result.error && result.appraisers.length === 0 && <div className="card garagesEmpty"><h3>לא נמצאו שמאים בחיפוש הזה</h3><p>נסו שם או יישוב אחר, או חזרו לרשימה המלאה.</p><a href="/appraisers">לכל השמאים ←</a></div>}
        {result && !result.error && result.appraisers.length > 0 && <><p className="garagesCount">מוצגים {result.appraisers.length} מתוך {new Intl.NumberFormat('he-IL').format(result.total)} שמאים שנמצאו במאגר.</p><div className="garagesGrid">{result.appraisers.map(appraiser => <article className="garageCard" key={appraiser.license}><div className="garageCardHead"><div><h3>{appraiser.name}</h3><p>{appraiser.city || 'יישוב לא צוין'}</p></div><span>רישיון {appraiser.license}</span></div></article>)}</div><nav className="garagesPager" aria-label="עמודי רשימת השמאים">{offset > 0 && <a href={listingUrl(city, name, Math.max(0, offset - 24))}>← לעמוד הקודם</a>}{result.nextOffset !== null && <a href={listingUrl(city, name, result.nextOffset)}>לעמוד הבא ←</a>}</nav></>}
      </section>
      <section className="garagesNote"><h2>לפני שפונים לשמאי</h2><p>המאגר מציג שם, יישוב ומספר רישיון בלבד. הוא אינו כולל פרטי קשר, זמינות או המלצה על שירות. פרטי הרישוי עשויים להשתנות; כדאי לאמת אותם מול משרד התחבורה לפני הזמנת עבודה.</p></section>
    </main>
    <footer><div className="footerInner"><div className="footerBrand"><strong>RehevNet</strong><span>© 2026 · שירות מידע עצמאי לרכב</span></div><nav className="footerLinks" aria-label="קישורי האתר"><a href="/">בדיקת רכב</a><a href="/compare">השוואת רכבים</a><a href="/garages">מוסכים מורשים</a><a href="/appraisers">שמאי רכב</a><a href="/guide">מדריך לבדיקה</a><a href="/terms">תנאי שימוש</a><a href="/privacy">פרטיות</a><a href="/accessibility">נגישות</a><a href="/contact">יצירת קשר</a></nav><p className="footerSource">מקור רשימת השמאים: <a href={appraisersSource} target="_blank" rel="noopener noreferrer">מאגר שמאי רכב באתר data.gov.il ↗</a> · רישיון CC BY</p></div></footer>
  </>;
}
