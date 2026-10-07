import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {
  metadataBase: new URL('https://autopeek.co.il'),
  title: 'AUTOPEEK | כל המידע על הרכב במקום אחד',
  description: 'חיפוש מידע ציבורי על כלי רכב בישראל לפי מספר רישוי, מתוך מאגרי משרד התחבורה.',
  alternates: { canonical: '/' },
  openGraph: { title: 'AUTOPEEK | כל המידע על הרכב במקום אחד', siteName: 'AUTOPEEK', locale: 'he_IL', type: 'website', url: 'https://autopeek.co.il' },
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="he" dir="rtl"><body>{children}</body></html>; }
