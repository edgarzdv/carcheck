'use client';

import { useState, type FormEvent } from 'react';

type State = 'idle' | 'sending' | 'sent' | 'error';

export function ContactForm({ enabled }: { enabled: boolean }) {
  const [state, setState] = useState<State>('idle');
  const [error, setError] = useState('');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (state === 'sending') return;
    const form = event.currentTarget;
    const data = new FormData(form);
    setState('sending');
    setError('');
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.get('name'), email: data.get('email'), topic: data.get('topic'),
          message: data.get('message'), website: data.get('website'),
        }),
      });
      if (!response.ok) {
        setError(response.status === 429 ? 'נשלחו יותר מדי פניות בזמן קצר. נסו שוב מאוחר יותר.' : response.status === 400 ? 'כדאי לבדוק את פרטי הטופס ולנסות שוב.' : 'לא הצלחנו לשלוח את הפנייה כרגע. אם זו פניית נגישות, אפשר להשתמש בכתובת הדוא״ל שמופיעה בהמשך העמוד.');
        setState('error');
        return;
      }
      form.reset();
      setState('sent');
    } catch {
      setError('לא הצלחנו להתחבר כרגע. אם זו פניית נגישות, אפשר להשתמש בכתובת הדוא״ל שמופיעה בהמשך העמוד.');
      setState('error');
    }
  }

  if (!enabled) return <div className="contactUnavailable" role="status"><strong>טופס הפניות עדיין לא הופעל</strong><p>הדף מוכן, אך שליחת הודעות תתאפשר לאחר חיבור שירות הדוא״ל. אין צורך להזין כאן פרטים בינתיים.</p></div>;

  return <form className="contactForm" onSubmit={submit}>
    <div className="contactFormGrid">
      <label>שם<span>איך לפנות אליך</span><input name="name" type="text" autoComplete="name" maxLength={80} required/></label>
      <label>כתובת דוא״ל<span>כדי שנוכל להשיב לפנייה</span><input name="email" type="email" autoComplete="email" maxLength={254} required dir="ltr"/></label>
    </div>
    <label>נושא הפנייה<select name="topic" defaultValue="general" required>
      <option value="general">שאלה כללית</option>
      <option value="data">דיווח על מידע שגוי</option>
      <option value="privacy">פרטיות</option>
      <option value="accessibility">נגישות</option>
      <option value="technical">תקלה באתר</option>
    </select></label>
    <label>הודעה<span>אין לשלוח תעודת זהות, פרטי אשראי או מידע אישי רגיש.</span><textarea name="message" rows={7} minLength={10} maxLength={4000} required/></label>
    <div className="contactHoneypot" aria-hidden="true"><label>השאירו את השדה ריק<input name="website" type="text" tabIndex={-1} autoComplete="off"/></label></div>
    <div className="contactSubmit"><button type="submit" disabled={state === 'sending'}>{state === 'sending' ? 'שולחים…' : 'שליחת הפנייה ←'}</button><p>הפרטים יישלחו אלינו לצורך טיפול בפנייה. <a href="/privacy">מידע על פרטיות</a></p></div>
    {state === 'sent' && <p className="contactFeedback success" role="status">הפנייה נשלחה. תודה שכתבת לנו.</p>}
    {state === 'error' && <p className="contactFeedback error" role="alert">{error}</p>}
  </form>;
}
