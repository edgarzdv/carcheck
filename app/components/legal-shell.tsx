export function LegalShell({ title, introduction, children }: { title: string; introduction: string; children: React.ReactNode }) {
  return <>
    <header className="topbar"><div className="topbarInner"><a className="brand" href="/" aria-label="RehevNet — דף הבית"><span className="brandMark">R<span>•</span></span><span>Rehev<span className="brandAccent">Net</span></span></a><a className="topLink" href="/">חזרה לחיפוש ←</a></div></header>
    <main id="main-content" tabIndex={-1} className="legalWrap"><a className="legalBack" href="/">← חזרה לחיפוש</a><div className="legalHeader"><h1>{title}</h1><p>{introduction}</p></div><article className="legalArticle">{children}</article></main>
    <footer><div className="footerInner"><div className="footerBrand"><strong>RehevNet</strong><span>© 2026 · שירות מידע עצמאי לרכב</span></div><nav className="footerLinks" aria-label="קישורי האתר"><a href="/compare">השוואת רכבים</a><a href="/garages">מוסכים מורשים</a><a href="/appraisers">שמאי רכב</a><a href="/guide">מדריך לבדיקה</a><a href="/terms">תנאי שימוש</a><a href="/privacy">פרטיות</a><a href="/accessibility">נגישות</a><a href="/contact">יצירת קשר</a></nav><p className="footerSource">מקור הנתונים: <a href="https://data.gov.il/he/organizations/ministry_of_transport" target="_blank" rel="noopener noreferrer">מאגרי משרד התחבורה באתר data.gov.il ↗</a></p></div></footer>
  </>;
}
