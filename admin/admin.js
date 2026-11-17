import { createClient } from '@supabase/supabase-js';
import { matchCreators } from '../lib/matching.js';

const login = document.querySelector('#login-view');
const dashboard = document.querySelector('#dashboard');
const loginStatus = document.querySelector('#login-status');
const status = document.querySelector('#dashboard-status');
const signOut = document.querySelector('#sign-out');
const submissionsNode = document.querySelector('#submissions');
const sourceList = document.querySelector('#source-list');
let client, submissions = [], sources = [], includeArchived = false;
const activeSubmissions = () => submissions.filter(item => !item.archived_at);

function prepareIntroduction(business, creator) {
  const bd = business.details || {}, cd = creator.details || {};
  const lines = ['Hello,', '', 'Based on the information each of you opted to share, I would like to introduce you for a possible collaboration. Please review the details below and decide whether you would like to connect.', '', `Business: ${bd['Business name'] || business.name}`, `Industry: ${bd['Business domain'] || 'Not provided'}`, `Campaign goal: ${bd['Campaign goal'] || 'Not provided'}`, `Preferred creator category: ${bd['Category / niche'] || 'Not provided'}`, `Preferred platform and format: ${bd.Platform || 'Not provided'} / ${bd['Content format'] || 'Not provided'}`, '', `Creator: ${cd['Creator / brand name'] || creator.name}`, `Profile: ${cd['Profile links'] || 'Not provided'}`, `Category and platform: ${cd['Category / niche'] || 'Not provided'} / ${cd.Platform || 'Not provided'}`, `Location and formats: ${cd.Location || 'Not provided'} / ${cd['Content format'] || 'Not provided'}`, '', 'Please take the conversation forward only if the collaboration feels right to both of you.', '', 'Regards,', 'Works by Nish / Grover & Co.'];
  const to = [business.email, creator.email].filter(Boolean).join(',');
  const subject = `Potential collaboration: ${bd['Business name'] || business.name} + ${cd['Creator / brand name'] || creator.name}`;
  return `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join('\n'))}`;
}

async function adminRequest(session, endpoint, method = 'GET', body) {
  const response = await fetch(endpoint, { method, headers: { Authorization: `Bearer ${session.access_token}`, ...(body ? { 'Content-Type': 'application/json' } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}), cache: 'no-store' });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || 'The dashboard could not complete that action.');
  return result;
}

async function currentSession() {
  const { data: { session } } = await client.auth.getSession();
  if (!session) throw new Error('Session expired. Please sign in again.');
  return session;
}

function renderSummary() {
  const active = activeSubmissions();
  const total = active.length;
  const contacted = active.filter(item => item.status === 'contacted' || Number(item.contact_count) > 0).length;
  const newLeads = active.filter(item => !item.status || item.status === 'new').length;
  const urgent = active.filter(item => item.marker === 'red').length;
  const today = new Date().toISOString().slice(0, 10);
  const due = active.filter(item => item.follow_up_at && item.follow_up_at <= today && item.status !== 'closed').length;
  const totalTouches = active.reduce((sum, item) => sum + Number(item.contact_count || 0), 0);
  const stats = [['All leads', total], ['New', newLeads], ['Contacted leads', contacted], ['Contact attempts', totalTouches], ['Urgent · red', urgent], ['Follow-ups due', due]];
  const root = document.querySelector('#crm-summary'); root.replaceChildren();
  for (const [label, value] of stats) {
    const card = document.createElement('article'); card.className = 'summary-card';
    const count = document.createElement('strong'); count.textContent = String(value);
    const name = document.createElement('span'); name.textContent = label;
    card.append(count, name); root.append(card);
  }
  const totals = new Map();
  for (const item of active) { const source = item.source || 'Website'; totals.set(source, (totals.get(source) || 0) + 1); }
  const sourceReport = document.createElement('section'); sourceReport.className = 'source-report';
  const heading = document.createElement('h2'); heading.textContent = 'Leads by source'; sourceReport.append(heading);
  if (!totals.size) { const empty = document.createElement('p'); empty.textContent = 'Your lead sources will appear here as enquiries arrive.'; sourceReport.append(empty); }
  for (const [name, count] of [...totals].sort((a,b) => b[1] - a[1])) {
    const row = document.createElement('div'); row.className = 'source-report-row';
    const label = document.createElement('span'); label.textContent = name;
    const bar = document.createElement('span'); bar.className = 'source-bar'; bar.style.setProperty('--bar-width', `${Math.max(8, count / Math.max(1, total) * 100)}%`);
    const value = document.createElement('strong'); value.textContent = String(count); row.append(label, bar, value); sourceReport.append(row);
  }
  root.append(sourceReport);
}

function renderMatches() {
  const select = document.querySelector('#match-business'), previous = select.value;
  select.replaceChildren(new Option('Select a business request', ''));
  for (const item of activeSubmissions().filter(item => item.kind === 'business')) select.add(new Option(`${item.details?.['Business name'] || item.name}${item.matching_consent ? '' : ' — matching not enabled'}`, item.id));
  select.value = previous;
  const container = document.querySelector('#match-results'); container.replaceChildren();
  const business = submissions.find(item => item.id === select.value && item.kind === 'business');
  if (!business) return;
  if (!business.matching_consent) { const note = document.createElement('p'); note.textContent = 'This business has not opted into match sharing, so its brief is excluded from creator suggestions.'; container.append(note); return; }
  const results = matchCreators(business, activeSubmissions().filter(item => item.kind === 'creator' && item.matching_consent === true));
  const note = document.createElement('p'); note.textContent = 'Exact matches use platform, niche, location and content format. Introduction links create an unsent email draft.'; container.append(note);
  if (!results.length) { const empty = document.createElement('p'); empty.textContent = 'No opted-in creator profiles match this business yet.'; container.append(empty); return; }
  const candidates = document.createElement('div'); candidates.className = 'match-candidates';
  for (const { creator, reasons } of results) {
    const card = document.createElement('article'); card.className = 'match-candidate';
    const title = document.createElement('h3'); title.textContent = creator.details?.['Creator / brand name'] || creator.name;
    const meta = document.createElement('p'); meta.className = 'match-reasons'; meta.textContent = `Matches ${reasons.length} of 4 criteria: ${reasons.join(', ')}`;
    const profile = document.createElement('p'); profile.textContent = `${creator.details?.Platform || 'Platform not provided'} · ${creator.details?.['Category / niche'] || 'Niche not provided'} · ${creator.details?.Location || 'Location not provided'}`;
    const draft = document.createElement('a'); draft.className = 'admin-link'; draft.href = prepareIntroduction(business, creator); draft.textContent = 'Prepare introduction draft';
    card.append(title, meta, profile, draft); candidates.append(card);
  }
  container.append(candidates);
}

function renderSources() {
  sourceList.replaceChildren();
  const ordered = [...sources].sort((a,b) => Number(b.is_active) - Number(a.is_active) || a.label.localeCompare(b.label));
  for (const source of ordered) {
    const row = document.createElement('form'); row.className = `source-row${source.is_active ? '' : ' is-paused'}`;
    const nameLabel = document.createElement('label'); nameLabel.textContent = 'Source name';
    const input = document.createElement('input'); input.value = source.label; input.maxLength = 80; input.required = true;
    nameLabel.append(input);
    const activeLabel = document.createElement('label'); activeLabel.className = 'source-active';
    const active = document.createElement('input'); active.type = 'checkbox'; active.checked = !!source.is_active;
    activeLabel.append(active, document.createTextNode(source.is_active ? ' Active in forms' : ' Paused'));
    const save = document.createElement('button'); save.className = 'admin-link'; save.type = 'submit'; save.textContent = 'Save';
    row.append(nameLabel, activeLabel, save);
    row.addEventListener('submit', async event => {
      event.preventDefault(); save.disabled = true;
      try { const session = await currentSession(); const result = await adminRequest(session, '/api/admin-sources', 'PATCH', { id: source.id, label: input.value, is_active: active.checked }); Object.assign(source, result.source); renderSources(); render(); status.textContent = `Source “${source.label}” updated.`; }
      catch (error) { status.textContent = error.message; save.disabled = false; }
    });
    sourceList.append(row);
  }
}

function addControlLabel(parent, text, control) {
  const label = document.createElement('label'); label.className = 'lead-field';
  const caption = document.createElement('span'); caption.textContent = text; label.append(caption, control); parent.append(label); return label;
}

function deleteLeadButton(item) {
  const remove = document.createElement('button');
  remove.className = 'admin-link delete-action';
  remove.type = 'button'; remove.textContent = 'Delete lead';
  remove.addEventListener('click', async () => {
    if (!confirm(`Permanently delete ${item.name}? This cannot be undone.`)) return;
    remove.disabled = true;
    try { const session = await currentSession(); await adminRequest(session, '/api/admin-submissions', 'DELETE', { id: item.id }); await load(session); status.textContent = `Lead deleted for ${item.name}.`; }
    catch (error) { status.textContent = error.message; remove.disabled = false; }
  });
  return remove;
}

function renderSubmission(item) {
  const archived = !!item.archived_at;
  const card = document.createElement('article'); card.className = `submission marker-${item.marker || 'none'}${archived ? ' is-archived' : ''}`;
  const meta = document.createElement('p'); meta.className = 'meta'; meta.textContent = `${item.kind} · ${new Date(item.created_at).toLocaleString()}`;
  const title = document.createElement('h2'); title.textContent = item.name;
  const chips = document.createElement('div'); chips.className = 'lead-chips';
  const sourceChip = document.createElement('span'); sourceChip.className = 'lead-chip'; sourceChip.textContent = `Source: ${item.source || 'Website'}`;
  const markerChip = document.createElement('span'); markerChip.className = `lead-chip marker-chip ${item.marker || 'none'}`; markerChip.textContent = item.marker === 'red' ? 'Urgent' : item.marker === 'blue' ? 'Follow up' : 'Standard';
  chips.append(sourceChip, markerChip);
  if (archived) { const archivedChip = document.createElement('span'); archivedChip.className = 'lead-chip archived-chip'; archivedChip.textContent = `Archived ${new Date(item.archived_at).toLocaleDateString()}`; chips.append(archivedChip); }
  const dl = document.createElement('dl');
  for (const [key, value] of Object.entries({ Phone: item.phone, Email: item.email, Practice: item.practice, Service: item.service, 'Match sharing opted in': item.matching_consent ? 'Yes' : 'No', ...item.details })) {
    if (value == null || value === '') continue;
    const row = document.createElement('div'), dt = document.createElement('dt'), dd = document.createElement('dd'); dt.textContent = key; dd.textContent = String(value); row.append(dt, dd); dl.append(row);
  }
  const controls = document.createElement('div'); controls.className = 'lead-controls';
  const sourceSelect = document.createElement('select'); sourceSelect.setAttribute('aria-label', `Lead source for ${item.name}`);
  const sourceValues = [...new Set([item.source || 'Website', ...sources.filter(source => source.is_active).map(source => source.label)])];
  sourceValues.forEach(value => sourceSelect.add(new Option(value, value)));
  sourceSelect.value = item.source || 'Website'; addControlLabel(controls, 'Source', sourceSelect);
  const markerSelect = document.createElement('select'); markerSelect.setAttribute('aria-label', `Lead marker for ${item.name}`);
  [['none','Standard · no marker'],['red','Red · urgent'],['blue','Blue · follow up']].forEach(([value,label]) => markerSelect.add(new Option(label,value)));
  markerSelect.value = item.marker || 'none'; addControlLabel(controls, 'Priority marker', markerSelect);
  const followUp = document.createElement('input'); followUp.type = 'date'; followUp.value = item.follow_up_at || ''; followUp.setAttribute('aria-label', `Next follow-up for ${item.name}`); addControlLabel(controls, 'Next follow-up', followUp);
  const state = document.createElement('select'); state.setAttribute('aria-label', `Follow-up status for ${item.name}`);
  [['new','New'],['reviewing','Reviewing'],['contacted','Contacted'],['closed','Closed']].forEach(([value,label]) => state.add(new Option(label,value)));
  state.value = item.status || 'new'; addControlLabel(controls, 'Lead status', state);
  const notes = document.createElement('textarea'); notes.maxLength = 3000; notes.value = item.notes || ''; notes.placeholder = 'Call outcome, decision maker, next step…'; notes.setAttribute('aria-label', `Notes for ${item.name}`); addControlLabel(controls, 'Internal notes', notes);
  const actions = document.createElement('div'); actions.className = 'lead-actions';
  const archive = document.createElement('button'); archive.className = `admin-link${archived ? '' : ' archive-action'}`; archive.type = 'button'; archive.textContent = archived ? 'Restore lead' : 'Archive lead';
  archive.addEventListener('click', async () => {
    archive.disabled = true;
    try { const session = await currentSession(); await adminRequest(session, '/api/admin-submissions', 'PATCH', { id: item.id, ...(archived ? { restore: true } : { archive: true }) }); await load(session); status.textContent = archived ? `Lead restored for ${item.name}.` : `Lead archived for ${item.name}.`; }
    catch (error) { status.textContent = error.message; archive.disabled = false; }
  });
  if (archived) { actions.append(archive, deleteLeadButton(item)); card.append(meta, title, chips, dl, actions); return card; }
  const save = document.createElement('button'); save.className = 'admin-link'; save.type = 'button'; save.textContent = 'Save lead details';
  save.addEventListener('click', async () => {
    save.disabled = true;
    try { const session = await currentSession(); await adminRequest(session, '/api/admin-submissions', 'PATCH', { id: item.id, source: sourceSelect.value, marker: markerSelect.value, follow_up_at: followUp.value || null, status: state.value, notes: notes.value }); Object.assign(item, { source: sourceSelect.value, marker: markerSelect.value, follow_up_at: followUp.value || null, status: state.value, notes: notes.value }); render(); status.textContent = `Lead details saved for ${item.name}.`; }
    catch (error) { status.textContent = error.message; save.disabled = false; }
  });
  const contacted = document.createElement('button'); contacted.className = 'admin-link contact-action'; contacted.type = 'button'; const contactCount = Number(item.contact_count || 0); contacted.textContent = `Mark contacted · ${contactCount} ${contactCount === 1 ? 'attempt' : 'attempts'}`;
  contacted.addEventListener('click', async () => {
    contacted.disabled = true;
    try { const session = await currentSession(); await adminRequest(session, '/api/admin-submissions', 'PATCH', { id: item.id, mark_contacted: true }); item.contact_count = Number(item.contact_count || 0) + 1; item.last_contacted_at = new Date().toISOString(); item.status = 'contacted'; render(); status.textContent = `Contact attempt recorded for ${item.name}.`; }
    catch (error) { status.textContent = error.message; contacted.disabled = false; }
  });
  const last = document.createElement('p'); last.className = 'last-contacted'; last.textContent = item.last_contacted_at ? `Last contacted ${new Date(item.last_contacted_at).toLocaleString()}` : 'No contact attempt recorded yet';
  actions.append(save, contacted, archive, deleteLeadButton(item), last); card.append(meta, title, chips, dl, controls, actions); return card;
}

function render() {
  renderSummary(); renderMatches(); renderSources();
  const kind = document.querySelector('#kind-filter').value;
  const query = document.querySelector('#search').value.trim().toLowerCase();
  submissionsNode.replaceChildren();
  const shown = submissions.filter(item => (includeArchived || !item.archived_at) && (kind === 'all' || item.kind === kind) && (!query || JSON.stringify(item).toLowerCase().includes(query)));
  status.textContent = `${shown.length} lead${shown.length === 1 ? '' : 's'} shown`;
  for (const item of shown) submissionsNode.append(renderSubmission(item));
}

function csvCell(value) {
  let text = value == null ? '' : typeof value === 'object' ? JSON.stringify(value) : String(value);
  if (/^[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"','""')}"`;
}
function exportCsv() {
  const columns = ['ID','Created at','Type','Name','Phone','Email','Lead source','Status','Marker','Contact attempts','Last contacted','Next follow-up','Business / brand','Service','Internal notes','Form details'];
  const rows = [columns, ...activeSubmissions().map(item => [item.id,item.created_at,item.kind,item.name,item.phone,item.email,item.source || 'Website',item.status || 'new',item.marker || 'none',item.contact_count || 0,item.last_contacted_at,item.follow_up_at,item.practice || item.details?.['Business name'] || item.details?.business,item.service,item.notes,item.details])];
  const csv = `\uFEFF${rows.map(row => row.map(csvCell).join(',')).join('\r\n')}`;
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a'); link.href = url; link.download = `grover-leads-${new Date().toISOString().slice(0,10)}.csv`; link.click(); URL.revokeObjectURL(url);
}

async function load(session) {
  const archivedQuery = includeArchived ? '?include_archived=true' : '';
  const [leadResult, sourceResult] = await Promise.all([
    adminRequest(session, `/api/admin-submissions${archivedQuery}`), adminRequest(session, '/api/admin-sources')
  ]);
  submissions = leadResult.submissions; sources = sourceResult.sources; login.hidden = true; dashboard.hidden = false; signOut.hidden = false; render();
}

async function initialize() {
  try {
    const response = await fetch('/api/admin-config', { cache: 'no-store' });
    if (!response.ok || !response.headers.get('content-type')?.includes('application/json')) throw new Error('Admin access is not configured yet.');
    const config = await response.json();
    client = createClient(config.url, config.key, { auth: { storage: window.sessionStorage, autoRefreshToken: true } });
    const { data: { session } } = await client.auth.getSession(); if (session) await load(session);
  } catch (error) { loginStatus.textContent = error.message; }
}

initialize();
document.querySelector('#login-form').addEventListener('submit', async event => {
  event.preventDefault(); loginStatus.textContent = 'Signing in…';
  if (!client) { loginStatus.textContent = 'Admin access is not configured yet.'; return; }
  const { data, error } = await client.auth.signInWithPassword({ email: document.querySelector('#email').value.trim(), password: document.querySelector('#password').value });
  document.querySelector('#password').value = '';
  if (error) { loginStatus.textContent = 'Unable to sign in. Check your credentials and try again.'; return; }
  try { await load(data.session); loginStatus.textContent = ''; } catch (err) { await client.auth.signOut(); loginStatus.textContent = err.message; }
});
signOut.addEventListener('click', async () => { await client.auth.signOut(); submissions = []; sources = []; submissionsNode.replaceChildren(); dashboard.hidden = true; signOut.hidden = true; login.hidden = false; });
document.querySelector('#refresh').addEventListener('click', async () => { try { await load(await currentSession()); status.textContent = `Loaded ${submissions.length} leads and ${sources.length} sources.`; } catch (error) { status.textContent = error.message; } });
document.querySelector('#export-csv').addEventListener('click', exportCsv);
document.querySelector('#match-business').addEventListener('change', renderMatches);
document.querySelector('#include-archived').addEventListener('change', async event => { includeArchived = event.currentTarget.checked; try { await load(await currentSession()); } catch (error) { status.textContent = error.message; } });
['#kind-filter','#search'].forEach(selector => document.querySelector(selector).addEventListener('input', render));
document.querySelector('#source-form').addEventListener('submit', async event => {
  event.preventDefault(); const input = document.querySelector('#new-source-label'), label = input.value.trim(); if (!label) return;
  const button = event.currentTarget.querySelector('button'); button.disabled = true;
  try { const session = await currentSession(); const result = await adminRequest(session, '/api/admin-sources', 'POST', { label }); sources.push(result.source); input.value = ''; render(); status.textContent = `Source “${label}” added. It is now available in new forms.`; }
  catch (error) { status.textContent = error.message; }
  finally { button.disabled = false; }
});
