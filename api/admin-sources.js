const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function authorize(req, res) {
  const { SUPABASE_URL: url, SUPABASE_ANON_KEY: publicKey, SUPABASE_SERVICE_ROLE_KEY: secret, ADMIN_EMAIL: allowed } = process.env;
  if (!url || !publicKey || !secret || !allowed) { res.status(503).json({ error: 'Admin access is not configured.' }); return null; }
  const match = /^Bearer ([A-Za-z0-9._-]+)$/.exec(req.headers.authorization || '');
  if (!match) { res.status(401).json({ error: 'Sign in required.' }); return null; }
  const base = url.replace(/\/$/, '');
  try {
    const response = await fetch(`${base}/auth/v1/user`, { headers: { apikey: publicKey, Authorization: `Bearer ${match[1]}` }, signal: AbortSignal.timeout(10000) });
    if (!response.ok) { res.status(401).json({ error: 'Session expired. Please sign in again.' }); return null; }
    const user = await response.json();
    if (!user.email_confirmed_at || typeof user.email !== 'string' || user.email.toLowerCase() !== allowed.toLowerCase()) {
      res.status(403).json({ error: 'This account does not have admin access.' }); return null;
    }
    return { base, secret };
  } catch {
    res.status(502).json({ error: 'Could not verify admin access.' }); return null;
  }
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (!['GET', 'POST', 'PATCH'].includes(req.method)) return res.status(405).json({ error: 'Method not allowed.' });
  if (req.method !== 'GET' && !req.headers['content-type']?.toLowerCase().startsWith('application/json')) return res.status(415).json({ error: 'Expected JSON.' });
  const credentials = await authorize(req, res);
  if (!credentials) return;
  const { base, secret } = credentials;
  const headers = { apikey: secret, 'Content-Type': 'application/json', Prefer: 'return=representation' };
  try {
    if (req.method === 'GET') {
      const response = await fetch(`${base}/rest/v1/grover_lead_sources?select=id,label,is_active,created_at&order=created_at.asc`, { headers: { apikey: secret }, signal: AbortSignal.timeout(10000) });
      if (!response.ok) return res.status(502).json({ error: 'Could not load lead sources.' });
      return res.status(200).json({ sources: await response.json() });
    }
    if (req.method === 'POST') {
      const label = typeof req.body?.label === 'string' ? req.body.label.trim() : '';
      if (!label || label.length > 80) return res.status(400).json({ error: 'Source name must be 1–80 characters.' });
      const response = await fetch(`${base}/rest/v1/grover_lead_sources?select=id,label,is_active,created_at`, { method: 'POST', headers, body: JSON.stringify({ label, is_active: true }), signal: AbortSignal.timeout(10000) });
      if (response.status === 409) return res.status(409).json({ error: 'That source already exists.' });
      if (!response.ok) return res.status(502).json({ error: 'Could not add this lead source.' });
      return res.status(201).json({ source: (await response.json())[0] });
    }
    const id = typeof req.body?.id === 'string' && uuid.test(req.body.id) ? req.body.id : null;
    if (!id) return res.status(400).json({ error: 'A valid source ID is required.' });
    const patch = {};
    if (Object.hasOwn(req.body || {}, 'label')) {
      const label = typeof req.body.label === 'string' ? req.body.label.trim() : '';
      if (!label || label.length > 80) return res.status(400).json({ error: 'Source name must be 1–80 characters.' });
      patch.label = label;
    }
    if (Object.hasOwn(req.body || {}, 'is_active')) {
      if (typeof req.body.is_active !== 'boolean') return res.status(400).json({ error: 'Choose whether the source is active.' });
      patch.is_active = req.body.is_active;
    }
    if (!Object.keys(patch).length) return res.status(400).json({ error: 'No source changes were provided.' });
    const response = await fetch(`${base}/rest/v1/grover_lead_sources?id=eq.${encodeURIComponent(id)}&select=id,label,is_active,created_at`, { method: 'PATCH', headers, body: JSON.stringify(patch), signal: AbortSignal.timeout(10000) });
    if (response.status === 409) return res.status(409).json({ error: 'That source name already exists.' });
    if (!response.ok) return res.status(502).json({ error: 'Could not update this lead source.' });
    const rows = await response.json();
    if (!rows.length) return res.status(404).json({ error: 'Source not found.' });
    return res.status(200).json({ source: rows[0] });
  } catch {
    return res.status(502).json({ error: 'Could not update lead sources.' });
  }
}
