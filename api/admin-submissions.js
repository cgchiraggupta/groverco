export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed.' });
  const { SUPABASE_URL: url, SUPABASE_ANON_KEY: publicKey, SUPABASE_SERVICE_ROLE_KEY: secret, ADMIN_EMAIL: allowed } = process.env;
  if (!url || !publicKey || !secret || !allowed) return res.status(503).json({ error: 'Admin access is not configured.' });
  const match = /^Bearer ([A-Za-z0-9._-]+)$/.exec(req.headers.authorization || '');
  if (!match) return res.status(401).json({ error: 'Sign in required.' });
  const base = url.replace(/\/$/, '');
  try {
    const authResponse = await fetch(`${base}/auth/v1/user`, { headers: { apikey: publicKey, Authorization: `Bearer ${match[1]}` }, signal: AbortSignal.timeout(10000) });
    if (!authResponse.ok) return res.status(401).json({ error: 'Session expired. Please sign in again.' });
    const user = await authResponse.json();
    if (!user.email_confirmed_at || typeof user.email !== 'string' || user.email.toLowerCase() !== allowed.toLowerCase()) return res.status(403).json({ error: 'This account does not have admin access.' });
    const dataResponse = await fetch(`${base}/rest/v1/grover_submissions?select=*&order=created_at.desc&limit=500`, { headers: { apikey: secret }, signal: AbortSignal.timeout(10000) });
    if (!dataResponse.ok) return res.status(502).json({ error: 'Could not load submissions.' });
    return res.status(200).json({ submissions: await dataResponse.json() });
  } catch {
    return res.status(502).json({ error: 'Could not load submissions.' });
  }
}
