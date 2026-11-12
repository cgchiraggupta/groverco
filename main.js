const menu = document.querySelector('.menu');
const navigation = document.querySelector('#navigation');
function closeMenu() { navigation.classList.remove('open'); menu.setAttribute('aria-expanded', 'false'); }
menu.addEventListener('click', () => { const open = menu.getAttribute('aria-expanded') !== 'true'; menu.setAttribute('aria-expanded', String(open)); navigation.classList.toggle('open', open); });
navigation.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
document.addEventListener('keydown', e => { if (e.key === 'Escape' && menu.getAttribute('aria-expanded') === 'true') { closeMenu(); menu.focus(); } });
document.querySelectorAll('[data-practice]').forEach(link => link.addEventListener('click', () => { document.querySelector('#practice').value = link.dataset.practice; }));
document.querySelector('#brief-form').addEventListener('submit', event => {
  event.preventDefault();
  const field = document.querySelector('#brief');
  const brief = field.value.trim();
  if (brief.length < 20) { field.setCustomValidity('Please describe your project in at least 20 characters.'); field.reportValidity(); return; }
  field.setCustomValidity('');
  const text = `GROVER & CO. — PROJECT BRIEF\n\nPractice: ${document.querySelector('#practice').value}\n\nProject overview:\n${brief}\n\nThis brief was prepared locally. It has not been sent to Grover & Co.\n`;
  const url = URL.createObjectURL(new Blob([text], {type:'text/plain;charset=utf-8'}));
  const link = document.createElement('a'); link.href = url; link.download = 'grover-project-brief.txt'; document.body.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  document.querySelector('#form-status').textContent = 'Your brief is ready to download. Nothing has been sent or stored on a server.';
});
document.querySelector('#brief').addEventListener('input', event => event.target.setCustomValidity(''));
