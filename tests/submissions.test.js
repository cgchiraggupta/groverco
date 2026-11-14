import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateSubmission } from '../lib/submissions.js';
import handler from '../api/submissions.js';

const resource = { kind: 'resources', name: 'Jane', phone: '1234567890', consent: true, details: { 'Resource requested': 'Business Readiness Checklist' } };
test('validates consent and rejects malformed or overlong input', () => {
  assert.ok(validateSubmission(resource).data);
  assert.ok(validateSubmission({ ...resource, consent: false }).error);
  assert.ok(validateSubmission({ ...resource, name: 'x'.repeat(121) }).error);
  assert.ok(validateSubmission({ ...resource, kind: 'admin' }).error);
  assert.ok(validateSubmission({ ...resource, kind: 'creator', email: 'a@b.com' }).error);
});
test('requires a selected free guide and keeps match sharing opt-in', () => {
  assert.ok(validateSubmission({ ...resource, details: {} }).error);
  const creator = { kind: 'creator', name: 'Asha', phone: '1234567890', email: 'asha@example.com', consent: true, matchingConsent: true, details: { 'Creator / brand name': 'Asha', 'Profile links': 'https://example.com', 'Category / niche': 'Food', Platform: 'Instagram', Location: 'Delhi', Audience: 'Local food fans', 'Content format': 'Reels' } };
  assert.equal(validateSubmission(creator).data.matching_consent, true);
  assert.equal(validateSubmission({ ...creator, matchingConsent: false }).data.matching_consent, false);
});
test('retains only fields appropriate for the form', () => {
  const result = validateSubmission({ ...resource, kind: 'service', email: 'a@example.com', practice: 'Works by Nish', service: 'Script Writing', details: { details: 'A short campaign', status: 'closed' } });
  assert.deepEqual(result.data.details, { details: 'A short campaign' });
});
test('endpoint rejects untrusted origins and never accepts public reads', async () => {
  const res = { statusCode: 0, setHeader() {}, status(n) { this.statusCode = n; return this; }, json(body) { this.body = body; return this; } };
  await handler({ method: 'GET', headers: {} }, res); assert.equal(res.statusCode, 405);
  await handler({ method: 'POST', headers: { 'content-type': 'application/json', origin: 'https://evil.example' }, body: resource }, res); assert.equal(res.statusCode, 403);
});

test('stores validated submissions without returning personal data', async () => {
  const oldFetch = globalThis.fetch;
  const oldUrl = process.env.SUPABASE_URL;
  const oldKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  let saved;
  process.env.SUPABASE_URL = 'https://db.example';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-only';
  globalThis.fetch = async (url, options) => { if (url.includes('/rpc/')) return { ok: true, json: async () => true }; saved = JSON.parse(options.body); return { ok: true }; };
  const res = { setHeader() {}, status(n) { this.statusCode = n; return this; }, json(body) { this.body = body; return this; } };
  try {
    await handler({ method: 'POST', headers: { 'content-type': 'application/json', origin: 'https://groverco.in', 'x-vercel-forwarded-for': '192.0.2.10' }, body: resource }, res);
    assert.equal(res.statusCode, 201);
    assert.equal(saved.kind, 'resources');
    assert.deepEqual(res.body, { ok: true });
  } finally {
    globalThis.fetch = oldFetch;
    if (oldUrl === undefined) delete process.env.SUPABASE_URL; else process.env.SUPABASE_URL = oldUrl;
    if (oldKey === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY; else process.env.SUPABASE_SERVICE_ROLE_KEY = oldKey;
  }
});
test('rate limit rejection prevents a database insert', async () => {
  const oldFetch = globalThis.fetch;
  const oldUrl = process.env.SUPABASE_URL, oldKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  process.env.SUPABASE_URL = 'https://db.example'; process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-only';
  let calls = 0;
  globalThis.fetch = async () => { calls++; return { ok: true, json: async () => false }; };
  const res = { setHeader() {}, status(n) { this.statusCode = n; return this; }, json(body) { this.body = body; return this; } };
  try {
    await handler({ method: 'POST', headers: { 'content-type': 'application/json', origin: 'https://groverco.in', 'x-vercel-forwarded-for': '192.0.2.10' }, body: resource }, res);
    assert.equal(res.statusCode, 429); assert.equal(calls, 1);
  } finally {
    globalThis.fetch = oldFetch;
    if (oldUrl === undefined) delete process.env.SUPABASE_URL; else process.env.SUPABASE_URL = oldUrl;
    if (oldKey === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY; else process.env.SUPABASE_SERVICE_ROLE_KEY = oldKey;
  }
});
