export const runtime = 'nodejs';

const topics = {
  general: 'שאלה כללית', data: 'דיווח על מידע שגוי', privacy: 'פרטיות',
  accessibility: 'נגישות', technical: 'תקלה באתר',
} as const;

function clean(value: unknown, max: number): string | null {
  if (typeof value !== 'string' || value.length > max) return null;
  const result = value.trim().replace(/[\u0000-\u001F\u007F]/g, ' ');
  return result || null;
}

function reply(status: number) {
  return Response.json({ ok: status === 202 }, { status, headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(request: Request) {
  const key = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO_EMAIL;
  const from = process.env.CONTACT_FROM_EMAIL;
  if (!key || !to || !from) return reply(503);

  const origin = request.headers.get('origin');
  if (!origin || origin !== new URL(request.url).origin) return reply(403);
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) return reply(415);
  if (Number(request.headers.get('content-length') || 0) > 5500) return reply(413);

  let input: Record<string, unknown>;
  try {
    const reader = request.body?.getReader();
    if (!reader) return reply(400);
    const chunks: Uint8Array[] = [];
    let bytes = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > 5500) { await reader.cancel(); return reply(413); }
      chunks.push(value);
    }
    const buffer = new Uint8Array(bytes);
    let offset = 0;
    for (const chunk of chunks) { buffer.set(chunk, offset); offset += chunk.byteLength; }
    input = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(buffer));
    if (!input || typeof input !== 'object' || Array.isArray(input)) return reply(400);
  } catch { return reply(400); }

  if (input.website) return reply(202);
  const name = clean(input.name, 80);
  const email = clean(input.email, 254);
  const message = clean(input.message, 4000);
  const topic = typeof input.topic === 'string' && Object.hasOwn(topics, input.topic) ? topics[input.topic as keyof typeof topics] : null;
  if (!name || !email || !message || !topic || message.length < 10 || !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(email)) return reply(400);
  if (!/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(to) || !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(from)) return reply(503);

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: `AUTOPEEK <${from}>`, to: [to], reply_to: email,
        subject: `AUTOPEEK | ${topic}`,
        text: `נושא: ${topic}\nשם: ${name}\nכתובת להשבה: ${email}\n\n${message}`,
      }),
      signal: AbortSignal.timeout(10000),
    });
    return reply(response.ok ? 202 : 502);
  } catch { return reply(502); }
}
