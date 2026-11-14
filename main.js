const menu = document.querySelector('.menu');
const navigation = document.querySelector('#navigation');
function closeMenu() {
  navigation.classList.remove('open');
  menu.setAttribute('aria-expanded', 'false');
}
menu.addEventListener('click', () => {
  const open = menu.getAttribute('aria-expanded') !== 'true';
  menu.setAttribute('aria-expanded', String(open));
  navigation.classList.toggle('open', open);
});
navigation.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && menu.getAttribute('aria-expanded') === 'true') {
    closeMenu();
    menu.focus();
  }
});
document.querySelectorAll('a[href$="-services"]').forEach(link => {
  link.addEventListener('click', () => {
    const group = document.querySelector(link.getAttribute('href'));
    if (group) group.open = true;
  });
});

const dialog = document.querySelector('.enquiry-dialog');
const enquiryForm = document.querySelector('#enquiry-form');
const enquiryService = document.querySelector('#enquiry-service');
const detailsLabel = document.querySelector('#details-label');
const detailsField = document.querySelector('#enquiry-details');
const prompts = [
  ['What GST registration or filing support do you need?', 'What is your business type and what support are you looking for?'],
  ['What working capital or financial management support do you need?', 'Briefly describe your business needs and goals.'],
  ['What accounting or bookkeeping support do you need?', 'Tell us about your business and the records you need help with.'],
  ['What income tax filing support do you need?', 'Tell us the type of filing and the relevant financial year.'],
  ['What financial advisory or virtual CFO support do you need?', 'Describe your business and the decisions or goals you need help with.'],
  ['What corporate filing or ROC compliance support do you need?', 'Tell us your entity type and the support you need.'],
  ['What kind of company or LLP would you like to register?', 'Tell us about the proposed business and your expected timeline.'],
  ['What business growth challenge would you like help with?', 'Tell us about your business, goals and current challenges.'],
  ['What non-statutory audit support do you need?', 'Describe the area you would like reviewed and your objectives.'],
  ['What kind of support do you need?', 'Tell us about your business and the support you are looking for.'],
  ['What kind of script do you need?', 'Tell us the platform, topic, audience and approximate number of scripts.'],
  ['What content would you like to shoot?', 'Tell us about the content, location and expected timeline.'],
  ['What social media marketing support do you need?', 'Tell us about your brand, platforms and goals.'],
  ['What would you like your content strategy to achieve?', 'Tell us about your audience, platforms and goals.'],
  ['What advertising support are you looking for?', 'Tell us about your campaign, audience and preferred platforms.'],
  ['What marketing setup support do you need?', 'Tell us about your business and what you would like to set up.'],
  ['Tell us about your event or exhibition.', 'Include the event type, location, expected date and support needed.'],
  ['What startup or founder marketing support do you need?', 'Tell us about your startup, stage and marketing goals.'],
  ['What would you like us to review?', 'Tell us about your business page or creator setup and your goals.'],
  ['What would you like us to create for you?', 'Tell us about your brand, your idea and the support you need.']
];
function openEnquiry(practice, title, prompt) {
  enquiryForm.reset();
  enquiryForm.querySelector('[type=submit]').disabled = false;
  enquiryForm.querySelector('.submit-status').textContent = '';
  enquiryService.textContent = `${practice} / ${title}`;
  document.querySelector('#enquiry-practice').value = practice;
  document.querySelector('#enquiry-selected-service').value = title;
  document.querySelector('#enquiry-subject').value = `New enquiry: ${practice} — ${title}`;
  detailsLabel.firstChild.textContent = `${prompt[0]} `;
  detailsField.placeholder = prompt[1];
  dialog.showModal();
}
document.querySelectorAll('.service-card').forEach((card, index) => {
  const title = card.querySelector('h4').textContent;
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'service-enquire';
  button.setAttribute('aria-label', `Enquire about ${title}`);
  button.textContent = 'Enquire about this service ↗';
  card.append(button);
  button.addEventListener('click', () => {
    const practice = card.closest('#strategy-services') ? 'Grover Strategy House' : 'Works by Nish';
    openEnquiry(practice, title, prompts[index < 9 ? index : index + 1]);
  });
});
document.querySelectorAll('.custom-enquiry').forEach(button => {
  button.addEventListener('click', () => {
    const strategy = Boolean(button.closest('#strategy-services'));
    openEnquiry(strategy ? 'Grover Strategy House' : 'Works by Nish', 'Other / Custom Requirement', prompts[strategy ? 9 : 19]);
  });
});
document.querySelector('.dialog-close').addEventListener('click', () => dialog.close());

const intakeDialog = document.querySelector('.intake-dialog');
const intakeForm = document.querySelector('#intake-form');
const intakeFields = document.querySelector('#intake-fields');
const sharedFields = [
  { name: 'Category / niche', creator: 'Your content category / niche', business: 'Preferred creator category / niche', placeholder: 'e.g. lifestyle, food, technology', required: true },
  { name: 'Platform', creator: 'Primary platform', business: 'Preferred platform', options: ['Instagram', 'YouTube', 'Facebook', 'LinkedIn', 'Other'], required: true },
  { name: 'Location', creator: 'Your location', business: 'Preferred creator location', placeholder: 'City or region', required: true },
  { name: 'Audience', creator: 'Your audience', business: 'Target audience', placeholder: 'Age range, interests and location', required: true },
  { name: 'Content format', creator: 'Content formats you create', business: 'Preferred content formats', placeholder: 'e.g. reels, videos, stories', required: true },
  { name: 'Collaboration type', creator: 'Collaboration types you offer', business: 'Collaboration types needed', placeholder: 'e.g. sponsored content, event, UGC' },
  { name: 'Budget / rate', creator: 'Expected rates or rate card', business: 'Campaign budget', placeholder: 'Optional; include currency and range' },
  { name: 'Timeline / availability', creator: 'Availability', business: 'Campaign timeline', placeholder: 'e.g. dates or timeframe' }
];
const intakeConfigs = {
  resources: { title: 'Access free resources.', description: 'Choose a free, practical checklist and unlock it after you submit your details.', help: 'Your guide opens as soon as your details are saved. It is general information, not legal, tax or financial advice.' },
  creator: { title: 'Join as a creator.', description: 'Tell us about your work so we can consider you for relevant brand collaborations.', help: 'Please share information you are comfortable providing. A submission does not guarantee a collaboration.' },
  business: { title: 'Find your creator fit.', description: 'Tell us about your brand and the creator collaboration you have in mind.', help: 'Your answers use the same categories as the creator form to make future matching easier.' }
};
function addIntakeField(field, kind) {
  const label = document.createElement('label');
  label.append(document.createTextNode((field[kind] || field.label || field.name) + (field.required ? ' *' : '')));
  let control;
  if (field.options) {
    control = document.createElement('select');
    const empty = document.createElement('option'); empty.value = ''; empty.textContent = 'Select an option'; control.append(empty);
    field.options.forEach(value => { const option = document.createElement('option'); option.value = value; option.textContent = value; control.append(option); });
  } else {
    control = document.createElement(field.multiline ? 'textarea' : 'input');
    if (!field.multiline) control.type = field.type || 'text';
    if (field.placeholder) control.placeholder = field.placeholder;
    if (field.autocomplete) control.autocomplete = field.autocomplete;
    control.maxLength = field.multiline ? 2000 : 300;
  }
  control.name = field.name;
  control.required = !!field.required;
  label.append(control); intakeFields.append(label);
}
document.querySelectorAll('[data-intake]').forEach(button => button.addEventListener('click', () => {
  const kind = button.dataset.intake;
  const config = intakeConfigs[kind];
  intakeForm.reset(); intakeFields.replaceChildren();
  intakeForm.querySelector('[type=submit]').disabled = false;
  intakeForm.querySelector('.submit-status').textContent = '';
  intakeForm.querySelector('.resource-download').hidden = true;
  document.querySelector('#intake-title').textContent = config.title;
  document.querySelector('#intake-description').textContent = config.description;
  document.querySelector('#intake-help').textContent = config.help;
  document.querySelector('#intake-subject').value = `New ${kind} form — Grover & Co.`;
  document.querySelector('#intake-type').value = kind;
  const fields = [
    { name: 'Name', label: 'Full name', autocomplete: 'name', required: true },
    { name: 'Phone', label: 'Phone number', type: 'tel', autocomplete: 'tel', required: true }
  ];
  let sharing;
  if (kind === 'resources') fields.push({
    name: 'Resource requested', label: 'Choose a free guide', options: [
      'Business Readiness Checklist', 'Creator Collaboration Readiness Checklist'
    ], required: true
  });
  if (kind !== 'resources') {
    fields.push({ name: 'Email', label: 'Email address', type: 'email', autocomplete: 'email', required: true });
    if (kind === 'creator') fields.push(
      { name: 'Creator / brand name', label: 'Creator name or handle', required: true },
      { name: 'Profile links', label: 'Social profile links', placeholder: 'Links to your primary profiles', required: true },
      { name: 'Follower count', label: 'Follower count on primary platform', type: 'number' },
      { name: 'Portfolio', label: 'Portfolio or media kit link', placeholder: 'Optional' }
    );
    else fields.push(
      { name: 'Business name', label: 'Business / brand name', required: true },
      { name: 'Business domain', label: 'Business industry / domain', placeholder: 'e.g. hospitality, fashion', required: true },
      { name: 'Business link', label: 'Website or social profile link', placeholder: 'Optional' },
      { name: 'Campaign goal', label: 'Campaign goal', placeholder: 'e.g. awareness, content, launches', required: true }
    );
    fields.push(...sharedFields, { name: 'Additional details', label: 'Anything else we should know?', multiline: true });
    sharing = document.createElement('label');
    sharing.className = 'consent matching-consent';
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox'; checkbox.name = 'Match sharing consent'; checkbox.value = 'Yes';
    sharing.append(checkbox, document.createTextNode(' I agree that relevant details from this form may be shared with a suitable potential collaborator after Grover & Co. reviews a match. Contact details are shared only in a reviewed introduction.'));
  }
  fields.forEach(field => addIntakeField(field, kind));
  if (sharing) intakeFields.append(sharing);
  intakeDialog.showModal();
}));
document.querySelector('.intake-close').addEventListener('click', () => intakeDialog.close());

// Store first; email forwarding is best-effort and never masks a saved enquiry.
for (const form of [enquiryForm, intakeForm]) {
  form.addEventListener('submit', async event => {
    event.preventDefault();
    const values = new FormData(form);
    const kind = form === enquiryForm ? 'service' : values.get('Form type');
    const details = {};
    const commonFields = new Set(['name', 'phone', 'email', 'Name', 'Phone', 'Email', 'Form type', 'Business practice', 'Service', 'Contact consent', 'Match sharing consent', '_subject', '_template']);
    for (const [key, value] of values.entries()) if (!commonFields.has(key) && typeof value === 'string') details[key] = value;
    const payload = {
      kind, name: values.get('name') || values.get('Name'), phone: values.get('phone') || values.get('Phone'),
      email: values.get('email') || values.get('Email') || '', consent: values.get('Contact consent') === 'Yes',
      matchingConsent: values.get('Match sharing consent') === 'Yes',
      practice: values.get('Business practice') || '', service: values.get('Service') || '', details
    };
    const button = form.querySelector('[type="submit"]'), feedback = form.querySelector('.submit-status');
    button.disabled = true; feedback.textContent = 'Submitting your details…';
    try {
      const response = await fetch('/api/submissions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!response.ok) { const result = await response.json().catch(() => ({})); throw new Error(result.error || 'Could not submit. Please try again.'); }
      // Email forwarding is independent of database storage. FormSubmit can
      // require recipient activation, so never promise that email was delivered.
      const emailPayload = Object.fromEntries([...values.entries()].filter(([, value]) => typeof value === 'string'));
      emailPayload._cc = 'chiraggupta0999@gmail.com';
      let emailDelivered = false;
      try {
        const emailResponse = await fetch('https://formsubmit.co/ajax/worksbynish@gmail.com', {
          method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify(emailPayload), signal: AbortSignal.timeout(12000)
        });
        const emailResult = await emailResponse.json().catch(() => ({}));
        emailDelivered = emailResponse.ok && emailResult.success !== false && emailResult.success !== 'false';
      } catch { /* the saved enquiry remains available in the private dashboard */ }
      feedback.textContent = emailDelivered
        ? 'Thank you. Your details were saved and email alerts were sent.'
        : 'Your details were saved. Email forwarding could not be confirmed; the enquiry is available in the private dashboard.';
      if (kind === 'resources') {
        const selected = values.get('Resource requested');
        const resourceLink = form.querySelector('.resource-download');
        const resourceFiles = {
          'Business Readiness Checklist': '/resources/business-readiness.html',
          'Creator Collaboration Readiness Checklist': '/resources/creator-readiness.html'
        };
        resourceLink.href = resourceFiles[selected] || '/resources/';
        resourceLink.hidden = false;
      }
    } catch (error) {
      feedback.textContent = error.message || 'Could not submit. Please try again.';
      button.disabled = false;
    }
  });
}
