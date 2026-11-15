export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed.' });
  const { SUPABASE_URL: url, SUPABASE_SERVICE_ROLE_KEY: key } = process.env;
  if (!url || !key) return res.status(503).json({ error: 'Lead sources are temporarily unavailable.' });
  try {
    const response = await fetch(`${url.replace(/\/$/, '')}/rest/v1/grover_lead_sources?select=label&is_active=eq.true&order=label.asc`, {
      headers: { apikey: key }, signal: AbortSignal.timeout(10000)
    });
    if (!response.ok) return res.status(502).json({ error: 'Could not load lead sources.' });
    return res.status(200).json({ sources: await response.json() });
  } catch {
    return res.status(502).json({ error: 'Could not load lead sources.' });
  }
}
