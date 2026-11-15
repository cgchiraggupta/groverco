const KINDS = new Set(['service', 'resources', 'creator', 'business']);
const FIELDS = {
  service: ['business', 'industry', 'contactPreference', 'details'],
  resources: ['Resource requested'],
  creator: ['Creator / brand name', 'Profile links', 'Follower count', 'Portfolio', 'Category / niche', 'Platform', 'Location', 'Audience', 'Content format', 'Collaboration type', 'Budget / rate', 'Timeline / availability', 'Additional details'],
  business: ['Business name', 'Business domain', 'Business link', 'Campaign goal', 'Category / niche', 'Platform', 'Location', 'Audience', 'Content format', 'Collaboration type', 'Budget / rate', 'Timeline / availability', 'Additional details']
};
const REQUIRED = {
  service: ['details'], resources: ['Resource requested'],
  creator: ['Creator / brand name', 'Profile links', 'Category / niche', 'Platform', 'Location', 'Audience', 'Content format'],
  business: ['Business name', 'Business domain', 'Campaign goal', 'Category / niche', 'Platform', 'Location', 'Audience', 'Content format']
};
const clean = value => typeof value === 'string' ? value.trim() : '';

export function validateSubmission(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return { error: 'Invalid request.' };
  const kind = clean(input.kind);
  if (!KINDS.has(kind)) return { error: 'Invalid form type.' };
  const name = clean(input.name), phone = clean(input.phone), email = clean(input.email);
  if (!name || name.length > 120 || phone.length < 3 || phone.length > 40) return { error: 'Please provide a valid name and phone number.' };
  if ((kind !== 'resources' && !email) || (email && (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)))) return { error: 'Please provide a valid email address.' };
  if (input.consent !== true) return { error: 'Please confirm contact consent.' };
  if (!input.details || typeof input.details !== 'object' || Array.isArray(input.details)) return { error: 'Invalid form details.' };
  const details = {};
  for (const key of FIELDS[kind]) {
    const value = clean(input.details[key]);
    if (value.length > 3000) return { error: 'A response is too long.' };
    if (value) details[key] = value;
  }
  if (REQUIRED[kind].some(key => !details[key])) return { error: 'Please complete the required fields.' };
  const practice = clean(input.practice), service = clean(input.service);
  if (kind === 'service' && (!['Grover Strategy House', 'Works by Nish'].includes(practice) || !service || service.length > 160)) return { error: 'Please select a valid service.' };
  const matchingConsent = ['creator', 'business'].includes(kind) && input.matchingConsent === true;
  const source = clean(input.source) || 'Website';
  if (source.length > 120) return { error: 'Lead source is too long.' };
  return { data: { kind, name, phone, email: email || null, practice: practice || null, service: service || null, source, details, consent: true, matching_consent: matchingConsent } };
}
