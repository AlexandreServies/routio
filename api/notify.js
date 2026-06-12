// Vercel serverless function: forwards waitlist / contact emails to Discord.
// The webhook URL is read from a server-side env var (DISCORD_WEBHOOK_URL) so it
// is never exposed to the browser. Set it in the Vercel project settings.
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'method_not_allowed' });
  }
  try {
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch { body = {}; }
    }
    const email = (body && body.email ? String(body.email) : '').trim();
    const source = (body && body.source ? String(body.source) : 'landing').slice(0, 40);
    // Minimal, permissive email sanity check — we only want to avoid garbage.
    if (!email || email.length > 254 || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return res.status(400).json({ ok: false, error: 'invalid_email' });
    }
    const hook = process.env.DISCORD_WEBHOOK_URL;
    if (hook) {
      await fetch(hook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: `📝 **New Routio signup** (${source}): ${email}` }),
      });
    }
    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(500).json({ ok: false, error: 'server_error' });
  }
}
