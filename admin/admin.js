import { createClient } from '@supabase/supabase-js';
import { matchCreators } from '../lib/matching.js';
const login = document.querySelector('#login-view'), dashboard = document.querySelector('#dashboard');
const loginStatus = document.querySelector('#login-status'), status = document.querySelector('#dashboard-status');
const signOut = document.querySelector('#sign-out');
let client, submissions = [];

function prepareIntroduction(business, creator) {
  const businessDetails = business.details || {}, creatorDetails = creator.details || {};
  const lines = [
    'Hello,',
    '',
    'Based on the information each of you opted to share, I would like to introduce you for a possible collaboration. Please review the details below and decide whether you would like to connect.',
    '',
    `Business: ${businessDetails['Business name'] || business.name}`,
    `Industry: ${businessDetails['Business domain'] || 'Not provided'}`,
    `Campaign goal: ${businessDetails['Campaign goal'] || 'Not provided'}`,
    `Preferred creator category: ${businessDetails['Category / niche'] || 'Not provided'}`,
    `Preferred platform and format: ${businessDetails.Platform || 'Not provided'} / ${businessDetails['Content format'] || 'Not provided'}`,
    '',
    `Creator: ${creatorDetails['Creator / brand name'] || creator.name}`,
    `Profile: ${creatorDetails['Profile links'] || 'Not provided'}`,
    `Category and platform: ${creatorDetails['Category / niche'] || 'Not provided'} / ${creatorDetails.Platform || 'Not provided'}`,
    `Location and formats: ${creatorDetails.Location || 'Not provided'} / ${creatorDetails['Content format'] || 'Not provided'}`,
    '',
    'Please take the conversation forward only if the collaboration feels right to both of you.',
    '',
    'Regards,',
    'Works by Nish / Grover & Co.'
  ];
  const to = [business.email, creator.email].filter(Boolean).join(',');
  const subject = `Potential collaboration: ${businessDetails['Business name'] || business.name} + ${creatorDetails['Creator / brand name'] || creator.name}`;
  return `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join('\n'))}`;
}

function renderMatches() {
  const id = document.querySelector('#match-business').value;
  const container = document.querySelector('#match-results'); container.replaceChildren();
  const business = submissions.find(item => item.id === id && item.kind === 'business');
  if (!business) return;
  if (!business.matching_consent) {
    const note = document.createElement('p'); note.textContent = 'This business has not opted into match sharing, so its brief is excluded from creator suggestions.'; container.append(note); return;
  }
  const eligible = submissions.filter(item => item.kind === 'creator' && item.matching_consent === true);
  const results = matchCreators(business, eligible);
  const note = document.createElement('p'); note.textContent = 'Suggestions use exact matches on platform, niche, location and content format. Only opted-in submissions appear. Introduction buttons create an unsent email draft for your review.'; container.append(note);
  if (!results.length) { const empty = document.createElement('p'); empty.textContent = 'No creator profiles have opted into matching yet.'; container.append(empty); return; }
  const candidates = document.createElement('div'); candidates.className = 'match-candidates';
  for (const { creator, reasons } of results) {
    const card = document.createElement('article'); card.className = 'match-candidate';
    const title = document.createElement('h3'); title.textContent = creator.details?.['Creator / brand name'] || creator.name;
    const meta = document.createElement('p'); meta.className = 'match-reasons'; meta.textContent = reasons.length ? `Matches ${reasons.length} of 4 criteria: ${reasons.join(', ')}` : 'No exact matches among the selected criteria';
    const profile = document.createElement('p'); profile.textContent = `${creator.details?.Platform || 'Platform not provided'} · ${creator.details?.['Category / niche'] || 'Niche not provided'} · ${creator.details?.Location || 'Location not provided'}`;
    card.append(title, meta, profile);
    if (reasons.length) {
      const draft = document.createElement('a'); draft.className = 'admin-link'; draft.href = prepareIntroduction(business, creator); draft.textContent = 'Prepare introduction draft';
      draft.setAttribute('aria-label', `Prepare an unsent introduction draft for ${creator.name} and ${business.name}`);
      card.append(draft);
    }
    candidates.append(card);
  }
  container.append(candidates);
}

async function adminRequest(session, method, body) {
  const response = await fetch('/api/admin-submissions', {
    method, headers: { Authorization: `Bearer ${session.access_token}`, ...(body ? { 'Content-Type': 'application/json' } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}), cache: 'no-store'
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || 'The dashboard could not complete that action.');
  return result;
}

async function currentSession() {
  const { data: { session } } = await client.auth.getSession();
  if (!session) throw new Error('Session expired. Please sign in again.');
  return session;
}

function render() {
  const select = document.querySelector('#match-business'), previous = select.value;
  select.replaceChildren(new Option('Select a business request', ''));
  for (const item of submissions.filter(item => item.kind === 'business')) select.add(new Option(`${item.details?.['Business name'] || item.name}${item.matching_consent ? '' : ' — matching not enabled'}`, item.id));
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
    for (const [key, value] of Object.entries({ Phone: item.phone, Email: item.email, Practice: item.practice, Service: item.service, 'Match sharing opted in': item.matching_consent ? 'Yes' : 'No', ...item.details })) {
      if (value == null || value === '') continue;
      const row = document.createElement('div'), dt = document.createElement('dt'), dd = document.createElement('dd');
      dt.textContent = key; dd.textContent = String(value); row.append(dt, dd); dl.append(row);
    }
    const controls = document.createElement('div'); controls.className = 'submission-controls';
    const stateLabel = document.createElement('label'); stateLabel.textContent = 'Follow-up status';
    const state = document.createElement('select'); state.setAttribute('aria-label', `Follow-up status for ${item.name}`);
    for (const option of ['new', 'reviewing', 'contacted', 'closed']) state.add(new Option(option[0].toUpperCase() + option.slice(1), option));
    state.value = item.status || 'new'; stateLabel.append(state);
    const save = document.createElement('button'); save.className = 'admin-link'; save.type = 'button'; save.textContent = 'Save status';
    save.addEventListener('click', async () => {
      save.disabled = true;
      try { const session = await currentSession(); await adminRequest(session, 'PATCH', { id: item.id, status: state.value }); item.status = state.value; status.textContent = `Status updated for ${item.name}.`; }
      catch (error) { status.textContent = error.message; }
      finally { save.disabled = false; }
    });
    const remove = document.createElement('button'); remove.className = 'admin-link danger'; remove.type = 'button'; remove.textContent = 'Delete';
    remove.setAttribute('aria-label', `Delete submission from ${item.name}`);
    remove.addEventListener('click', async () => {
      if (!window.confirm(`Permanently delete this ${item.kind} submission from ${item.name}? This cannot be undone.`)) return;
      remove.disabled = true;
      try { const session = await currentSession(); await adminRequest(session, 'DELETE', { id: item.id }); submissions = submissions.filter(entry => entry.id !== item.id); render(); status.textContent = `Submission from ${item.name} deleted.`; }
      catch (error) { status.textContent = error.message; remove.disabled = false; }
    });
    controls.append(stateLabel, save, remove);
    card.append(meta, title, dl, controls); list.append(card);
  }
}

async function load(session) {
  const result = await adminRequest(session, 'GET');
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
document.querySelector('#refresh').addEventListener('click', async () => { try { await load(await currentSession()); } catch (error) { status.textContent = error.message; } });
['#kind-filter', '#search'].forEach(selector => document.querySelector(selector).addEventListener('input', render));
document.querySelector('#match-business').addEventListener('change', renderMatches);
