// The House — Concierge (enquiry form).
import { esc, icon, mothMark, toast, formData } from '../../ui.js';

export const meta = { title: 'Concierge' };

const SUBJECTS = [
  ['order', 'An order'],
  ['gifting', 'Gifting & corporate'],
  ['society', 'The Flame Society'],
  ['maison', 'Opening a maison'],
  ['press', 'Press'],
];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function render(ctx) {
  const chosen = ctx.query?.get('subject') || '';
  return `
  <section class="st-sec st-head">
    <div class="container">
      <div class="eyebrow">Moth to a Flame</div>
      <h1 class="display mt-2">Concierge</h1>
      <span class="script st-script-line">at your service</span>
    </div>
  </section>

  <section class="st-sec section" style="padding-top:0">
    <div class="container">
      <div class="st-concierge">
        <div>
          <p class="lede reveal">Write to the house about an order, a gift, a season of the Society, or a maison of your own. Tell us what you have in mind and we will take it from there.</p>
          <nav class="st-ways reveal st-d1" aria-label="Other ways in">
            <a href="#/palace"><span class="h3">The Moth Market Palace</span><small>Walk the maisons and their collections.</small>${icon('arrow')}</a>
            <a href="#/palace/open-a-maison"><span class="h3">Open a maison</span><small>Makers apply for residency here.</small>${icon('arrow')}</a>
            <a href="#/flame-society"><span class="h3">The Flame Society</span><small>The seasons, and how the subscription works.</small>${icon('arrow')}</a>
          </nav>
        </div>

        <form class="st-form reveal st-d1" id="st-concierge-form" novalidate aria-describedby="st-form-note">
          <div class="row between mb-3"><h2 class="h2">Your enquiry</h2>${mothMark(34)}</div>
          <div class="form-grid">
            <label class="field"><span class="label">Name</span>
              <input class="input" name="name" type="text" autocomplete="name" required aria-describedby="st-err-name">
              <span class="st-err" id="st-err-name" data-err="name" aria-live="polite"></span></label>
            <label class="field"><span class="label">Email</span>
              <input class="input" name="email" type="email" autocomplete="email" inputmode="email" required aria-describedby="st-err-email">
              <span class="st-err" id="st-err-email" data-err="email" aria-live="polite"></span></label>
            <label class="field span-2"><span class="label">Subject</span>
              <select class="select" name="subject" required aria-describedby="st-err-subject">
                <option value=""${chosen ? '' : ' selected'}>Choose a subject</option>
                ${SUBJECTS.map(([v, l]) => `<option value="${v}"${v === chosen ? ' selected' : ''}>${esc(l)}</option>`).join('')}
              </select>
              <span class="st-err" id="st-err-subject" data-err="subject" aria-live="polite"></span></label>
            <label class="field span-2"><span class="label">Message</span>
              <textarea class="textarea" name="message" rows="6" required aria-describedby="st-err-message"></textarea>
              <span class="st-err" id="st-err-message" data-err="message" aria-live="polite"></span></label>
          </div>
          <button class="btn btn-gold btn-block mt-2" type="submit">Send to the concierge</button>
          <div class="st-sent" data-sent role="status" hidden>${mothMark(26)}<div><strong class="h4">Thank you. Your note is written.</strong><div class="muted small mt-1" data-sent-text></div></div></div>
          <p class="preview-note mt-3" id="st-form-note">This is a preview build. The form checks what you write, but your message is not transmitted or stored, and no one will receive it.</p>
        </form>
      </div>
    </div>
  </section>`;
}

export function mount(root) {
  const form = root.querySelector('#st-concierge-form');
  if (!form) return;
  const sent = form.querySelector('[data-sent]');
  const sentText = form.querySelector('[data-sent-text]');
  const field = (name) => form.querySelector(`[name="${name}"]`);
  const setErr = (name, msg) => {
    const el = form.querySelector(`[data-err="${name}"]`);
    if (el) el.textContent = msg || '';
    const input = field(name);
    if (input) { if (msg) input.setAttribute('aria-invalid', 'true'); else input.removeAttribute('aria-invalid'); }
  };
  const check = (data) => ({
    name: data.name ? '' : 'Please tell us your name.',
    email: !data.email ? 'Please leave an email address.' : EMAIL_RE.test(data.email) ? '' : 'That address does not look complete.',
    subject: data.subject ? '' : 'Please choose a subject.',
    message: !data.message ? 'Please write a few words.' : data.message.length < 10 ? 'A little more detail will help us.' : '',
  });

  // Clear a field's error as soon as it is corrected.
  ['name', 'email', 'subject', 'message'].forEach((name) => {
    const input = field(name);
    if (!input) return;
    const clear = () => { if (input.getAttribute('aria-invalid') && !check(formData(form))[name]) setErr(name, ''); };
    input.addEventListener('input', clear);
    input.addEventListener('change', clear);
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = formData(form);
    const errors = check(data);
    const bad = Object.keys(errors).filter((k) => errors[k]);
    Object.keys(errors).forEach((k) => setErr(k, errors[k]));
    if (bad.length) {
      sent.hidden = true;
      const first = field(bad[0]); if (first) first.focus();
      toast('Please complete the highlighted fields.');
      return;
    }
    const subject = SUBJECTS.find(([v]) => v === data.subject)?.[1] || 'Your enquiry';
    form.reset();
    sentText.textContent = `${data.name}, your enquiry about “${subject}” passed every check. In this preview nothing is transmitted — once the house is live, a reply would come to ${data.email}.`;
    sent.hidden = false;
    toast('Thank you. In this preview, your note is not transmitted.');
  });
}
