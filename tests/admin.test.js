import { test } from 'node:test';
import assert from 'node:assert/strict';
import handler from '../api/admin-submissions.js';
const makeRes = () => ({ setHeader() {}, status(n) { this.code = n; return this; }, json(value) { this.body = value; return this; } });
test('admin API rejects missing credentials and other users', async () => {
  const vars = ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY', 'ADMIN_EMAIL'];
  const old = Object.fromEntries(vars.map(k => [k, process.env[k]]));
  Object.assign(process.env, { SUPABASE_URL: 'https://db.example', SUPABASE_ANON_KEY: 'public', SUPABASE_SERVICE_ROLE_KEY: 'secret', ADMIN_EMAIL: 'admin@example.com' });
  const originalFetch = globalThis.fetch;
  try {
    let res = makeRes(); await handler({ method: 'GET', headers: {} }, res); assert.equal(res.code, 401);
    globalThis.fetch = async () => ({ ok: true, json: async () => ({ email: 'other@example.com', email_confirmed_at: '2026-01-01' }) });
    res = makeRes(); await handler({ method: 'GET', headers: { authorization: 'Bearer token' } }, res); assert.equal(res.code, 403);
    globalThis.fetch = async () => ({ ok: true, json: async () => ({ email: 'admin@example.com', email_confirmed_at: null }) });
    res = makeRes(); await handler({ method: 'GET', headers: { authorization: 'Bearer token' } }, res); assert.equal(res.code, 403);
  } finally {
    globalThis.fetch = originalFetch;
    for (const key of vars) { if (old[key] === undefined) delete process.env[key]; else process.env[key] = old[key]; }
  }
});
test('only verified configured admin can read submissions', async () => {
  const vars = ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY', 'ADMIN_EMAIL'];
  const old = Object.fromEntries(vars.map(k => [k, process.env[k]]));
  Object.assign(process.env, { SUPABASE_URL: 'https://db.example', SUPABASE_ANON_KEY: 'public', SUPABASE_SERVICE_ROLE_KEY: 'secret', ADMIN_EMAIL: 'admin@example.com' });
  const originalFetch = globalThis.fetch;
  try {
    let calls = 0;
    globalThis.fetch = async () => ++calls === 1
      ? { ok: true, json: async () => ({ email: 'admin@example.com', email_confirmed_at: '2026-01-01' }) }
      : { ok: true, json: async () => ([{ kind: 'creator', name: 'Example' }]) };
    const res = makeRes(); await handler({ method: 'GET', headers: { authorization: 'Bearer token' } }, res);
    assert.equal(res.code, 200); assert.equal(res.body.submissions[0].kind, 'creator'); assert.equal(calls, 2);
  } finally {
    globalThis.fetch = originalFetch;
    for (const key of vars) { if (old[key] === undefined) delete process.env[key]; else process.env[key] = old[key]; }
  }
});
