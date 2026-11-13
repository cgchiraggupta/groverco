import { createClient } from '@supabase/supabase-js';
import { matchCreators } from '../lib/matching.js';
const login = document.querySelector('#login-view'), dashboard = document.querySelector('#dashboard');
const loginStatus = document.querySelector('#login-status'), status = document.querySelector('#dashboard-status');
const signOut = document.querySelector('#sign-out');
let client, submissions = [];
function renderMatches() {
  const id = document.querySelector('#match-business').value;
  const container = document.querySelector('#match-results'); container.replaceChildren();
  const business = submissions.find(item => item.id === id && item.kind === 'business');
  if (!business) return;
  const results = matchCreators(business, submissions.filter(item => item.kind === 'creator'));
  const note = document.createElement('p'); note.textContent = 'Suggestions use exact matches on platform, niche, location and content format. Review every profile before making a connection.'; container.append(note);
  if (!results.length) { const empty = document.createElement('p'); empty.textContent = 'No creator profiles yet.'; container.append(empty); return; }
  for (const { creator, reasons } of results) {
    const line = document.createElement('p');
    line.textContent = `${creator.name} — ${reasons.length ? 'Matches: ' + reasons.join(', ') : 'No exact matches found'}`;
    container.append(line);
  }
}
function render() {
  const select = document.querySelector('#match-business'), previous = select.value;
  select.replaceChildren(new Option('Select a business request', ''));
  for (const item of submissions.filter(item => item.kind === 'business')) select.add(new Option(`${item.details?.['Business name'] || item.name} — ${item.name}`, item.id));
  select.value = previous; renderMatches();
  const kind = document.querySelector('#kind-filter').value;
  const query = document.querySelector('#search').value.trim().toLowerCase();
  const list = document.querySelector('#submissions'); list.replaceChildren();
  const shown = submissions.filter(item => (kind === 'all' || item.kind === kind) && (!query || JSON.stringify(item).toLowerCase().includes(query)));
  status.textContent = `${shown.length} submission${shown.length === 1 ? '' : 's'} shown`;
  for (const item of shown) {
    const card = document.createElement('article'); card.className = 'submission';
    const meta = document.createElement('p'); meta.className = 'meta'; meta.textContent = `${item.kind} · ${new Date(item.created_at).toLocaleString()}`;
    const title = document.createElement('h2'); title.textContent = item.name;
    const dl = document.createElement('dl');
    for (const [key, value] of Object.entries({ Phone: item.phone, Email: item.email, Practice: item.practice, Service: item.service, ...item.details })) {
      if (value == null || value === '') continue;
      const row = document.createElement('div'), dt = document.createElement('dt'), dd = document.createElement('dd');
      dt.textContent = key; dd.textContent = String(value); row.append(dt, dd); dl.append(row);
    }
    card.append(meta, title, dl); list.append(card);
  }
}
async function load(session) {
  const response = await fetch('/api/admin-submissions', { headers: { Authorization: `Bearer ${session.access_token}` }, cache: 'no-store' });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'Unable to load submissions.');
  submissions = result.submissions; login.hidden = true; dashboard.hidden = false; signOut.hidden = false; render();
}
async function initialize() {
 try {
  const configResponse = await fetch('/api/admin-config', { cache: 'no-store' });
  if (!configResponse.ok || !configResponse.headers.get('content-type')?.includes('application/json')) throw new Error('Admin access is not configured yet.');
  const config = await configResponse.json();
  client = createClient(config.url, config.key, { auth: { storage: window.sessionStorage, autoRefreshToken: true } });
  const { data: { session } } = await client.auth.getSession();
  if (session) await load(session);
 } catch (error) { loginStatus.textContent = error.message; }
}
initialize();
document.querySelector('#login-form').addEventListener('submit', async event => {
  event.preventDefault(); loginStatus.textContent = 'Signing in…';
  if (!client) { loginStatus.textContent = 'Admin access is not configured yet.'; return; }
  const { data, error } = await client.auth.signInWithPassword({ email: document.querySelector('#email').value.trim(), password: document.querySelector('#password').value });
  document.querySelector('#password').value = '';
  if (error) { loginStatus.textContent = 'Unable to sign in. Check your credentials and try again.'; return; }
  try { await load(data.session); loginStatus.textContent = ''; }
  catch (err) { await client.auth.signOut(); loginStatus.textContent = err.message; }
});
signOut.addEventListener('click', async () => { await client.auth.signOut(); submissions = []; document.querySelector('#submissions').replaceChildren(); dashboard.hidden = true; signOut.hidden = true; login.hidden = false; });
document.querySelector('#refresh').addEventListener('click', async () => { try { const { data: { session } } = await client.auth.getSession(); if (!session) throw new Error('Session expired. Please sign in again.'); await load(session); } catch (error) { status.textContent = error.message; } });
['#kind-filter', '#search'].forEach(selector => document.querySelector(selector).addEventListener('input', render));

document.querySelector('#match-business').addEventListener('change', renderMatches);
