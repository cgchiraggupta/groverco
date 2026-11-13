import { validateSubmission } from '../lib/submissions.js';
import { createHmac } from 'node:crypto';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed.' });
  if (!req.headers['content-type']?.toLowerCase().startsWith('application/json')) return res.status(415).json({ error: 'Expected JSON.' });
  const origin = req.headers.origin;
  const allowedOrigins = ['https://groverco.in', 'https://www.groverco.in', 'https://groverco.vercel.app'];
  if (process.env.VERCEL_URL) allowedOrigins.push(`https://${process.env.VERCEL_URL}`);
  if (!origin || !allowedOrigins.includes(origin)) return res.status(403).json({ error: 'Origin not allowed.' });
  if (Number(req.headers['content-length'] || 0) > 20000) return res.status(413).json({ error: 'Request too large.' });
  if (Buffer.byteLength(JSON.stringify(req.body ?? null), 'utf8') > 20000) return res.status(413).json({ error: 'Request too large.' });
  const { data, error } = validateSubmission(req.body);
  if (error) return res.status(400).json({ error });
  const url = process.env.SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return res.status(503).json({ error: 'Enquiries are temporarily unavailable.' });
  try {
    const address = req.headers['x-vercel-forwarded-for']?.split(',')[0]?.trim();
    if (!address) return res.status(503).json({ error: 'Enquiries are temporarily unavailable.' });
    const fingerprint = createHmac('sha256', key).update(address).digest('hex');
    const limitResponse = await fetch(`${url.replace(/\/$/, '')}/rest/v1/rpc/grover_check_submission_limit`, {
      method: 'POST', headers: { apikey: key, 'Content-Type': 'application/json' },
      body: JSON.stringify({ fingerprint_value: fingerprint }), signal: AbortSignal.timeout(10000)
    });
    if (!limitResponse.ok) return res.status(503).json({ error: 'Enquiries are temporarily unavailable.' });
    if (!(await limitResponse.json())) return res.status(429).json({ error: 'Too many requests. Please try again later.' });
    const response = await fetch(`${url.replace(/\/$/, '')}/rest/v1/grover_submissions`, {
      method: 'POST',
      headers: { apikey: key, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify(data),
      signal: AbortSignal.timeout(10000)
    });
    if (!response.ok) { console.error('Supabase insert failed with status', response.status); return res.status(502).json({ error: 'Could not save your enquiry. Please try again.' }); }
    return res.status(201).json({ ok: true });
  } catch (error) {
    console.error('Supabase connection error:', error.name);
    return res.status(502).json({ error: 'Could not save your enquiry. Please try again.' });
  }
}
