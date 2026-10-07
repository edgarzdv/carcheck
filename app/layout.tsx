import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'carCheck | כל המידע על הרכב במקום אחד', description: 'חיפוש מידע ציבורי על כלי רכב בישראל לפי מספר רישוי, מתוך מאגרי משרד התחבורה.' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="he" dir="rtl"><body>{children}</body></html>; }
