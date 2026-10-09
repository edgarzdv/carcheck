import type { Metadata } from 'next';
import { siteUrl } from '@/lib/site';
import { AnalyticsConsent } from './components/analytics-consent';
import { AccessibilityTools } from './components/accessibility-tools';
import './globals.css';
export const metadata: Metadata = {
  metadataBase: siteUrl,
  title: { default: 'בדיקת רכב לפי מספר רישוי בישראל | RehevNet', template: '%s | RehevNet' },
  description: 'בדיקת רכב חינם לפי מספר רישוי: פרטי רכב, תוקף רישוי, נסועה בטסט האחרון, היסטוריית בעלות וריקולים מתוך מאגרים ציבוריים בישראל.',
  alternates: { canonical: '/' },
  openGraph: { title: 'בדיקת רכב לפי מספר רישוי בישראל | RehevNet', description: 'מידע ציבורי על רכב בישראל, במקום אחד, לפני שמחליטים.', siteName: 'RehevNet', locale: 'he_IL', type: 'website', url: siteUrl.toString() },
  twitter: { card: 'summary', title: 'בדיקת רכב לפי מספר רישוי בישראל | RehevNet', description: 'בדקו מה פורסם על הרכב במאגרים ציבוריים בישראל.' },
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="he" dir="rtl"><body suppressHydrationWarning><a className="skipLink" href="#main-content">דילוג לתוכן הראשי</a>{children}<AnalyticsConsent measurementId={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || 'G-2Z4XZJ6FQM'}/><AccessibilityTools/></body></html>; }
