import type { Metadata } from 'next';
import { LegalShell } from '../components/legal-shell';
import { ContactForm } from './contact-form';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'יצירת קשר', description: 'פניות ושאלות לצוות AUTOPEEK', alternates: { canonical: '/contact' } };

export default function Contact() {
  const enabled = Boolean(process.env.RESEND_API_KEY && process.env.CONTACT_TO_EMAIL && process.env.CONTACT_FROM_EMAIL);
  return <LegalShell title="יצירת קשר" introduction="יש שאלה, מצאתם טעות או נתקלתם בקושי באתר? שלחו לנו פנייה ונבדוק.">
    <section className="contactIntro"><h2>איך אפשר לעזור?</h2><p>אפשר לפנות אלינו בנושאי מידע שגוי, פרטיות, נגישות ותקלות באתר. אם מדובר בנתון שהופיע במאגר ממשלתי, מומלץ לציין מספר רישוי ותיאור קצר כדי שנוכל לאתר את הרשומה. אין לשלוח מסמכים או מידע אישי רגיש.</p></section>
    <section><h2>שליחת פנייה</h2><ContactForm enabled={enabled}/></section>
  </LegalShell>;
}
