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
  resources: { title: 'Access free resources.', description: 'Register your interest in our upcoming free booklets and practical guides.', help: 'Resources are coming soon. Submitting this form registers your interest; no download is available yet.' },
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
  document.querySelector('#intake-title').textContent = config.title;
  document.querySelector('#intake-description').textContent = config.description;
  document.querySelector('#intake-help').textContent = config.help;
  document.querySelector('#intake-subject').value = `New ${kind} form — Grover & Co.`;
  document.querySelector('#intake-type').value = kind;
  const fields = [
    { name: 'Name', label: 'Full name', autocomplete: 'name', required: true },
    { name: 'Phone', label: 'Phone number', type: 'tel', autocomplete: 'tel', required: true }
  ];
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
  }
  fields.forEach(field => addIntakeField(field, kind));
  intakeDialog.showModal();
}));
document.querySelector('.intake-close').addEventListener('click', () => intakeDialog.close());
