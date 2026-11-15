const statuses = new Set(['new', 'reviewing', 'contacted', 'closed']);
const markers = new Set(['none', 'red', 'blue']);
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function authorize(req, res, env) {
  const { SUPABASE_URL: url, SUPABASE_ANON_KEY: publicKey, SUPABASE_SERVICE_ROLE_KEY: secret, ADMIN_EMAIL: allowed } = env;
  if (!url || !publicKey || !secret || !allowed) { res.status(503).json({ error: 'Admin access is not configured.' }); return null; }
  const match = /^Bearer ([A-Za-z0-9._-]+)$/.exec(req.headers.authorization || '');
  if (!match) { res.status(401).json({ error: 'Sign in required.' }); return null; }
  const base = url.replace(/\/$/, '');
  try {
    const response = await fetch(`${base}/auth/v1/user`, {
      headers: { apikey: publicKey, Authorization: `Bearer ${match[1]}` }, signal: AbortSignal.timeout(10000)
    });
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
  if (!['GET', 'PATCH', 'DELETE'].includes(req.method)) return res.status(405).json({ error: 'Method not allowed.' });
  if (['PATCH', 'DELETE'].includes(req.method) && !req.headers['content-type']?.toLowerCase().startsWith('application/json')) {
    return res.status(415).json({ error: 'Expected JSON.' });
  }
  const credentials = await authorize(req, res, process.env);
  if (!credentials) return;
  const { base, secret } = credentials;
  const headers = { apikey: secret, 'Content-Type': 'application/json', Prefer: 'return=representation' };
  try {
    if (req.method === 'GET') {
      const response = await fetch(`${base}/rest/v1/grover_submissions?select=*&order=created_at.desc&limit=500`, { headers: { apikey: secret }, signal: AbortSignal.timeout(10000) });
      if (!response.ok) return res.status(502).json({ error: 'Could not load submissions.' });
      return res.status(200).json({ submissions: await response.json() });
    }
    const id = typeof req.body?.id === 'string' && uuid.test(req.body.id) ? req.body.id : null;
    if (!id) return res.status(400).json({ error: 'A valid submission ID is required.' });
    if (req.method === 'PATCH') {
      if (req.body?.mark_contacted === true) {
        req.crmAction = 'mark_contacted';
      } else {
      const patch = {};
      if (Object.hasOwn(req.body || {}, 'status')) {
        if (!statuses.has(req.body.status)) return res.status(400).json({ error: 'Choose a valid status.' });
        patch.status = req.body.status;
      }
      if (Object.hasOwn(req.body || {}, 'source')) {
        if (typeof req.body.source !== 'string' || req.body.source.trim().length > 120) return res.status(400).json({ error: 'Choose a valid lead source.' });
        patch.source = req.body.source.trim() || 'Website';
      }
      if (Object.hasOwn(req.body || {}, 'marker')) {
        if (!markers.has(req.body.marker)) return res.status(400).json({ error: 'Choose a valid marker.' });
        patch.marker = req.body.marker;
      }
      if (Object.hasOwn(req.body || {}, 'notes')) {
        if (typeof req.body.notes !== 'string' || req.body.notes.length > 3000) return res.status(400).json({ error: 'Notes must be 3,000 characters or fewer.' });
        patch.notes = req.body.notes.trim();
      }
      if (Object.hasOwn(req.body || {}, 'follow_up_at')) {
        const value = req.body.follow_up_at;
        if (value !== null && (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value))) return res.status(400).json({ error: 'Choose a valid follow-up date.' });
        patch.follow_up_at = value || null;
      }
      if (Object.hasOwn(req.body || {}, 'status') && patch.status === 'contacted') {
        patch.last_contacted_at = new Date().toISOString();
      }
      if (Object.keys(patch).length === 0) return res.status(400).json({ error: 'No supported lead changes were provided.' });
      req.crmPatch = patch;
      }
    }
    const endpoint = `${base}/rest/v1/grover_submissions?id=eq.${encodeURIComponent(id)}&select=id,contact_count,last_contacted_at,status,source,marker,notes,follow_up_at`;
    const response = req.method === 'PATCH'
      ? req.crmAction === 'mark_contacted'
        ? await fetch(`${base}/rest/v1/rpc/grover_mark_submission_contacted`, { method: 'POST', headers, body: JSON.stringify({ target_submission_id: id }), signal: AbortSignal.timeout(10000) })
        : await fetch(endpoint, { method: 'PATCH', headers, body: JSON.stringify(req.crmPatch), signal: AbortSignal.timeout(10000) })
      : await fetch(endpoint, { method: 'DELETE', headers, signal: AbortSignal.timeout(10000) });
    if (!response.ok) return res.status(502).json({ error: req.method === 'PATCH' ? 'Could not update this submission.' : 'Could not delete this submission.' });
    const changed = await response.json();
    if (!changed.length) return res.status(404).json({ error: 'Submission not found.' });
    return res.status(200).json({ ok: true });
  } catch {
    return res.status(502).json({ error: 'Could not update the dashboard.' });
  }
}
