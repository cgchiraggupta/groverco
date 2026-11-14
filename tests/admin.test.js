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

test('admin can update a submission status only after authentication', async () => {
  const vars = ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY', 'ADMIN_EMAIL'];
  const old = Object.fromEntries(vars.map(k => [k, process.env[k]]));
  Object.assign(process.env, { SUPABASE_URL: 'https://db.example', SUPABASE_ANON_KEY: 'public', SUPABASE_SERVICE_ROLE_KEY: 'secret', ADMIN_EMAIL: 'admin@example.com' });
  const originalFetch = globalThis.fetch;
  let update;
  try {
    globalThis.fetch = async (url, options) => {
      if (url.endsWith('/auth/v1/user')) return { ok: true, json: async () => ({ email: 'admin@example.com', email_confirmed_at: '2026-01-01' }) };
      update = { url, options };
      return { ok: true, json: async () => [{ id: '123e4567-e89b-12d3-a456-426614174000' }] };
    };
    const res = makeRes();
    await handler({ method: 'PATCH', headers: { 'content-type': 'application/json', authorization: 'Bearer token' }, body: { id: '123e4567-e89b-12d3-a456-426614174000', status: 'contacted' } }, res);
    assert.equal(res.code, 200); assert.deepEqual(JSON.parse(update.options.body), { status: 'contacted' });
  } finally {
    globalThis.fetch = originalFetch;
    for (const key of vars) { if (old[key] === undefined) delete process.env[key]; else process.env[key] = old[key]; }
  }
});

test('admin rejects invalid status before writing', async () => {
  const vars = ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY', 'ADMIN_EMAIL'];
  const old = Object.fromEntries(vars.map(k => [k, process.env[k]]));
  Object.assign(process.env, { SUPABASE_URL: 'https://db.example', SUPABASE_ANON_KEY: 'public', SUPABASE_SERVICE_ROLE_KEY: 'secret', ADMIN_EMAIL: 'admin@example.com' });
  const originalFetch = globalThis.fetch; let calls = 0;
  try {
    globalThis.fetch = async () => { calls++; return { ok: true, json: async () => ({ email: 'admin@example.com', email_confirmed_at: '2026-01-01' }) }; };
    const res = makeRes();
    await handler({ method: 'PATCH', headers: { 'content-type': 'application/json', authorization: 'Bearer token' }, body: { id: '123e4567-e89b-12d3-a456-426614174000', status: 'deleted' } }, res);
    assert.equal(res.code, 400); assert.equal(calls, 1);
  } finally {
    globalThis.fetch = originalFetch;
    for (const key of vars) { if (old[key] === undefined) delete process.env[key]; else process.env[key] = old[key]; }
  }
});
