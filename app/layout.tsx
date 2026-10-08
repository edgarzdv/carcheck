import type { Metadata } from 'next';
import { siteUrl } from '@/lib/site';
import { AnalyticsConsent } from './components/analytics-consent';
import './globals.css';
export const metadata: Metadata = {
  metadataBase: siteUrl,
  title: { default: 'בדיקת רכב לפי מספר רישוי בישראל | AUTOPEEK', template: '%s | AUTOPEEK' },
  description: 'בדיקת רכב חינם לפי מספר רישוי: פרטי רכב, תוקף רישוי, נסועה בטסט האחרון, היסטוריית בעלות וריקולים מתוך מאגרים ציבוריים בישראל.',
  alternates: { canonical: '/' },
  openGraph: { title: 'בדיקת רכב לפי מספר רישוי בישראל | AUTOPEEK', description: 'מידע ציבורי על רכב בישראל, במקום אחד, לפני שמחליטים.', siteName: 'AUTOPEEK', locale: 'he_IL', type: 'website', url: siteUrl.toString() },
  twitter: { card: 'summary_large_image', title: 'בדיקת רכב לפי מספר רישוי בישראל | AUTOPEEK', description: 'בדקו מה פורסם על הרכב במאגרים ציבוריים בישראל.' },
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="he" dir="rtl"><body>{children}<AnalyticsConsent measurementId={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || 'G-2Z4XZJ6FQM'}/></body></html>; }
