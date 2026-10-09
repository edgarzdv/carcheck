'use client';

import { useEffect, useRef, useState } from 'react';

type Preferences = { textSize: 0 | 1 | 2; contrast: boolean; links: boolean; reduceMotion: boolean };
const storageKey = 'autopeek-accessibility-preferences';
const defaults: Preferences = { textSize: 0, contrast: false, links: false, reduceMotion: false };

export function AccessibilityTools() {
  const [open, setOpen] = useState(false);
  const [preferences, setPreferences] = useState<Preferences>(defaults);
  const closeButton = useRef<HTMLButtonElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || '{}');
      setPreferences({
        textSize: saved.textSize === 1 || saved.textSize === 2 ? saved.textSize : 0,
        contrast: saved.contrast === true,
        links: saved.links === true,
        reduceMotion: saved.reduceMotion === true,
      });
    } catch { /* Ignore damaged saved settings. */ }
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.a11yTextSize = String(preferences.textSize);
    root.dataset.a11yContrast = String(preferences.contrast);
    root.dataset.a11yLinks = String(preferences.links);
    root.dataset.a11yReduceMotion = String(preferences.reduceMotion);
    try { localStorage.setItem(storageKey, JSON.stringify(preferences)); } catch { /* Storage may be disabled. */ }
  }, [preferences]);

  useEffect(() => {
    if (open) closeButton.current?.focus();
  }, [open]);

  function close() {
    setOpen(false);
    trigger.current?.focus();
  }

  function reset() { setPreferences(defaults); }

  return <>
    <button ref={trigger} className="accessibilityTrigger" type="button" aria-label={open ? 'סגירת הגדרות נגישות' : 'פתיחת הגדרות נגישות'} aria-expanded={open} aria-controls="accessibility-panel" onClick={() => setOpen(value => !value)}>
      <span aria-hidden="true">♿</span>
    </button>
    {open && <aside id="accessibility-panel" className="accessibilityPanel" aria-label="הגדרות נגישות" onKeyDown={event => { if (event.key === 'Escape') close(); }}>
      <div className="accessibilityPanelHead"><h2>הגדרות נגישות</h2><button ref={closeButton} type="button" aria-label="סגירת הגדרות נגישות" onClick={close}>×</button></div>
      <p>התאימו את תצוגת האתר לצורכיכם. הבחירות נשמרות בדפדפן הזה.</p>
      <div className="accessibilityOptions">
        <fieldset><legend>גודל טקסט</legend><div className="accessibilitySizeChoices">
          {([0, 1, 2] as const).map((size) => <button key={size} type="button" aria-pressed={preferences.textSize === size} onClick={() => setPreferences(current => ({ ...current, textSize: size }))}>{size === 0 ? 'רגיל' : size === 1 ? 'גדול' : 'גדול מאוד'}</button>)}
        </div></fieldset>
        <button type="button" aria-pressed={preferences.contrast} onClick={() => setPreferences(current => ({ ...current, contrast: !current.contrast }))}>ניגודיות גבוהה <span aria-hidden="true">{preferences.contrast ? '✓' : '+'}</span></button>
        <button type="button" aria-pressed={preferences.links} onClick={() => setPreferences(current => ({ ...current, links: !current.links }))}>הדגשת קישורים <span aria-hidden="true">{preferences.links ? '✓' : '+'}</span></button>
        <button type="button" aria-pressed={preferences.reduceMotion} onClick={() => setPreferences(current => ({ ...current, reduceMotion: !current.reduceMotion }))}>צמצום תנועה <span aria-hidden="true">{preferences.reduceMotion ? '✓' : '+'}</span></button>
      </div>
      <div className="accessibilityPanelFoot"><button type="button" onClick={reset}>איפוס הגדרות</button><a href="/accessibility">הצהרת נגישות</a></div>
      <p className="accessibilityNote">הכלים משפרים את ההתאמה האישית; אפשר לדווח על קושי דרך עמוד יצירת הקשר.</p>
    </aside>}
  </>;
}
