import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {
  metadataBase: new URL('https://autopeek.co.il'),
  title: 'AUTOPEEK | בדיקת מידע על רכב לפי מספר רישוי',
  description: 'חיפוש מידע ציבורי על כלי רכב בישראל לפי מספר רישוי.',
  alternates: { canonical: '/' },
  openGraph: { title: 'AUTOPEEK | בדיקת מידע על רכב לפי מספר רישוי', siteName: 'AUTOPEEK', locale: 'he_IL', type: 'website', url: 'https://autopeek.co.il' },
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="he" dir="rtl"><body>{children}</body></html>; }
