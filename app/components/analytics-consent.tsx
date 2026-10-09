'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Script from 'next/script';

const consentKey = 'rehevnet-analytics-consent';
type Consent = 'accepted' | 'rejected' | null;

declare global {
  interface Window {
    dataLayer?: unknown[][];
    gtag?: (...args: unknown[]) => void;
  }
}

export function AnalyticsConsent({ measurementId }: { measurementId: string }) {
  const pathname = usePathname();
  const [consent, setConsent] = useState<Consent>(null);
  const [loaded, setLoaded] = useState(false);
  const [showChoice, setShowChoice] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(consentKey);
    if (saved === 'accepted' || saved === 'rejected') setConsent(saved);
    else setShowChoice(true);
  }, []);

  useEffect(() => {
    if (!loaded || consent !== 'accepted' || !window.gtag) return;
    // Search and comparison query parameters can contain license plates.
    const safeUrl = `${window.location.origin}${pathname}`;
    window.gtag('event', 'page_view', {
      page_location: safeUrl,
      page_path: pathname,
      page_referrer: window.location.origin,
    });
  }, [loaded, consent, pathname]);

  function choose(value: Exclude<Consent, null>) {
    localStorage.setItem(consentKey, value);
    setConsent(value);
    setShowChoice(false);
    if (value === 'rejected') {
      // Remove analytics cookies if a prior choice is withdrawn.
      for (const cookie of document.cookie.split(';')) {
        const name = cookie.split('=')[0].trim();
        if (name === '_ga' || name.startsWith('_ga_')) document.cookie = `${name}=; Max-Age=0; Path=/; SameSite=Lax`;
      }
      if (loaded) window.location.reload();
    }
  }

  return <>
    {consent === 'accepted' && <Script
      src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`}
      strategy="afterInteractive"
      onLoad={() => {
        window.dataLayer = window.dataLayer || [];
        window.gtag = (...args: unknown[]) => { window.dataLayer?.push(args); };
        window.gtag('js', new Date());
        window.gtag('set', { page_location: `${window.location.origin}${window.location.pathname}`, page_referrer: window.location.origin });
        window.gtag('config', measurementId, {
          send_page_view: false,
          allow_google_signals: false,
          allow_ad_personalization_signals: false,
        });
        setLoaded(true);
      }}
    />}
    {showChoice && <div className="analyticsConsent" role="region" aria-label="בחירת מדידת שימוש">
      <p>נוכל למדוד ביקורים באתר באמצעות Google Analytics, בלי לשלוח מספרי רישוי שבכתובת העמוד. המדידה תתחיל רק אם תאשרו. <a href="/privacy">פרטים במדיניות הפרטיות</a></p>
      <div><button type="button" onClick={() => choose('accepted')}>אישור מדידה</button><button type="button" onClick={() => choose('rejected')}>ללא מדידה</button></div>
    </div>}
    {!showChoice && <button className="analyticsSettings" type="button" onClick={() => setShowChoice(true)}>הגדרות פרטיות</button>}
  </>;
}
