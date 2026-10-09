import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo';
import { garagesSource, getGarages, parseGarageCity, parseGarageOffset, type Garage } from '@/lib/garages';

type Params = { city?: string | string[]; offset?: string | string[]; trail?: string | string[] };

export async function generateMetadata({ searchParams }: { searchParams: Promise<Params> }): Promise<Metadata> {
  const params = await searchParams;
  return {
    ...pageMetadata('/garages', 'מוסכים מורשים בישראל לפי עיר', 'רשימת מוסכים מורשים ממאגר משרד התחבורה. חיפוש לפי עיר, כתובת, טלפון, מספר רישיון ומקצועות שהמוסך מורשה לבצע.'),
    ...(params.city !== undefined || params.offset !== undefined ? { robots: { index: false, follow: true } } : {}),
  };
}

function parseTrail(input: unknown): number[] {
  if (typeof input !== 'string' || input.length > 1200 || !/^\d{1,5}(,\d{1,5})*$/.test(input)) return [];
  const offsets = input.split(',').map(Number);
  return offsets.length <= 150 && offsets.every(offset => offset <= 20000) ? offsets : [];
}

function listingUrl(city: string | null, offset = 0, trail: number[] = []) {
  const params = new URLSearchParams();
  if (city) params.set('city', city);
  if (offset) params.set('offset', String(offset));
  if (trail.length) params.set('trail', trail.join(','));
  return `/garages${params.size ? `?${params.toString()}` : ''}`;
}

function GarageCard({ garage }: { garage: Garage }) {
  const phone = garage.phone.replace(/[^\d+]/g, '');
  const canCall = /^\+?\d{7,15}$/.test(phone);
  return <article className="garageCard">
    <div className="garageCardHead"><div><h3>{garage.name}</h3><p>{garage.city}{garage.address && <> · {garage.address}</>}</p></div><span>רישיון מוסך {garage.license}</span></div>
    <div className="garageProfessions" aria-label="מקצועות מורשים">{garage.professions.map(profession => <span key={profession}>{profession}</span>)}</div>
    {garage.phone && <p className="garagePhone">טלפון: {canCall ? <a href={`tel:${phone}`} dir="ltr">{garage.phone}</a> : <span dir="ltr">{garage.phone}</span>}</p>}
  </article>;
}

const popularCities = ['ירושלים', 'תל אביב -יפו', 'חיפה', 'באר שבע', 'ראשון לציון', 'פתח תקווה', 'אשדוד'];

export default async function Garages({ searchParams }: { searchParams: Promise<Params> }) {
  const params = await searchParams;
  const rawCity = typeof params.city === 'string' && params.city.length <= 60 ? params.city : '';
  const city = rawCity.trim() ? parseGarageCity(rawCity) : null;
  const invalidCity = params.city !== undefined && rawCity.trim() !== '' && !city;
  const offset = parseGarageOffset(params.offset);
  const trail = parseTrail(params.trail);
  const result = invalidCity ? null : await getGarages(city, offset);
  const previousOffset = trail.at(-1);

  return <>
    <header className="topbar"><div className="topbarInner"><a className="brand" href="/" aria-label="AUTOPEEK — דף הבית"><span className="brandMark">A<span>•</span></span><span>AUTO<span className="brandAccent">PEEK</span></span></a><nav className="topLinks" aria-label="ניווט ראשי"><a className="topLink" href="/">בדיקת רכב</a><a className="topLink" href="/compare">השוואה</a></nav></div></header>
    <main id="main-content" tabIndex={-1} className="pageWrap garagesPage">
      <section className="garagesHero"><span className="eyebrow small">משרד התחבורה · מאגר ציבורי</span><h1>מוסכים מורשים בישראל</h1><p>חפשו מוסך לפי עיר וראו כתובת, טלפון, מספר רישיון ומקצועות מורשים. הרשימה מציגה מוסכים שסווגו במאגר משרד התחבורה כ״מוסך מורשה״.</p>
        <form className="garagesSearch" action="/garages" method="get"><label htmlFor="garage-city">חיפוש לפי עיר</label><div><input id="garage-city" name="city" type="search" maxLength={50} placeholder="למשל: חיפה" defaultValue={city ?? rawCity} autoComplete="address-level2" aria-invalid={invalidCity || undefined} aria-describedby={invalidCity ? 'garage-city-error' : undefined}/><button type="submit">חיפוש מוסכים ←</button></div></form>
        <nav className="citySuggestions" aria-label="ערים נפוצות"><span>ערים נפוצות:</span>{popularCities.map(name => <a key={name} href={listingUrl(name)}>{name}</a>)}</nav>
        {invalidCity && <p className="formError" id="garage-city-error" role="alert">יש להזין שם עיר תקין באורך של עד 50 תווים.</p>}
      </section>
      <section className="garagesResults" aria-label="רשימת המוסכים">
        <div className="garagesResultsHead"><div><h2>{city ? `מוסכים מורשים ב${city}` : 'רשימת מוסכים מורשים'}</h2><p>כל מוסך מוצג פעם אחת בעמוד, גם אם הוא מורשה למספר מקצועות.</p></div></div>
        {result?.error && <div className="notice warning" role="status">מאגר המוסכים אינו זמין כרגע. אפשר לנסות שוב מאוחר יותר.</div>}
        {result && !result.error && result.garages.length === 0 && <div className="card garagesEmpty"><h3>לא נמצאו מוסכים בחיפוש הזה</h3><p>{city ? 'נסו את שם היישוב כפי שהוא מופיע במאגר, או בחרו אחת מהערים הנפוצות.' : 'לא נמצאו רשומות בעמוד זה. חזרו לתחילת הרשימה.'}</p><a href="/garages">לכל המוסכים ←</a></div>}
        {result && !result.error && result.garages.length > 0 && <><p className="garagesCount">מוצגים {result.garages.length} מוסכים בעמוד זה. במאגר נמצאו {new Intl.NumberFormat('he-IL').format(result.totalRecords)} רשומות מקצוע{city ? ` בעיר ${city}` : ''}; למוסך אחד עשויות להיות כמה רשומות.</p><div className="garagesGrid">{result.garages.map(garage => <GarageCard key={garage.license} garage={garage}/>)}</div><nav className="garagesPager" aria-label="עמודי רשימת המוסכים">{offset > 0 && <a href={previousOffset !== undefined ? listingUrl(city, previousOffset, trail.slice(0, -1)) : listingUrl(city)}>← לעמוד הקודם</a>}{result.nextOffset !== null && <a href={listingUrl(city, result.nextOffset, [...trail, offset])}>לעמוד הבא ←</a>}</nav></>}
      </section>
      <section className="garagesNote"><h2>מה פירוש ״מוסך מורשה״?</h2><p>הסיווג ברשימה נלקח ממאגר משרד התחבורה. המקצועות המוצגים הם תחומי העבודה הרשומים לכל מוסך במאגר; הרשימה אינה מאשרת הסמכה מטעם יבואן רכב. רישיון מוסך אינו המלצה על איכות השירות, זמינות תור או התאמה לרכב מסוים. לפני הגעה כדאי להתקשר ולוודא פרטים עדכניים.</p></section>
    </main>
    <footer><div className="footerInner"><div className="footerBrand"><strong>AUTOPEEK</strong><span>© 2026 · שירות מידע עצמאי לרכב</span></div><nav className="footerLinks" aria-label="קישורי האתר"><a href="/">בדיקת רכב</a><a href="/compare">השוואת רכבים</a><a href="/garages">מוסכים מורשים</a><a href="/appraisers">שמאי רכב</a><a href="/guide">מדריך לבדיקה</a><a href="/terms">תנאי שימוש</a><a href="/privacy">פרטיות</a><a href="/accessibility">נגישות</a><a href="/contact">יצירת קשר</a></nav><p className="footerSource">מקור רשימת המוסכים: <a href={garagesSource} target="_blank" rel="noopener noreferrer">מאגר מוסכים ומכוני רישוי באתר data.gov.il ↗</a> · רישיון CC BY</p></div></footer>
  </>;
}
