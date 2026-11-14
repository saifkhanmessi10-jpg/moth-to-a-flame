// Open a maison — the residency invitation and application.
import * as store from '../../store.js';
import { esc, icon, mothMark, pct, statusBadge, dateFmt, formData } from '../../ui.js';

export const meta = { title: 'Open a Maison' };

let submittedId = null; // lets a guest see their confirmation after the page refreshes

const REQUIRED = {
  name: 'Please tell us your name.',
  email: 'Please enter an email we can reply to.',
  maisonName: 'Please name your maison.',
  location: 'Please tell us where you pour.',
  specialties: 'Please describe what you pour.',
  priceRange: 'Please give your usual price range.',
  story: 'Please share a little of your story.',
};

const field = (name, label, value, { type = 'text', auto = '', span = false, placeholder = '', optional = false } = {}) => `
  <div class="field ${span ? 'span-2' : ''}">
    <label class="label" for="mk-ap-${name}">${label}${optional ? ' <span class="faint">· optional</span>' : ''}</label>
    <input class="input" id="mk-ap-${name}" name="${name}" type="${type}" value="${esc(value || '')}" ${auto ? `autocomplete="${auto}"` : ''} ${placeholder ? `placeholder="${esc(placeholder)}"` : ''} ${optional ? '' : 'required'}>
    <p class="mk-err" data-err="${name}" hidden></p>
  </div>`;

function existing(user) {
  const all = store.listApplications();
  if (submittedId) { const mine = all.find((a) => a.id === submittedId); if (mine) return mine; submittedId = null; }
  if (!user) return null;
  const email = (user.email || '').toLowerCase();
  return all.find((a) => a.userId === user.id || (email && (a.email || '').toLowerCase() === email)) || null;
}

function statusPanel(app) {
  const copy = {
    pending: ['Your application is with the Keeper', 'Every application is read in full. You will hear from us by email once a decision has been made, and there is nothing more you need to do.'],
    approved: ['Welcome to the Palace', 'Your residency has been granted and your maison is open. Sign in with the email you applied with to enter your atelier.'],
    declined: ['Your application was not taken forward', 'Thank you for the care you put into it. The Palace keeps only a few rooms, and this was not the season.'],
  }[app.status] || ['Your application', ''];
  return `<div class="panel panel-gold center mk-apply-state">
    ${mothMark(56)}
    <div class="eyebrow mt-3">Residency application</div>
    <h2 class="h1 mt-2">${copy[0]}</h2>
    <p class="lede mt-2">${copy[1]}</p>
    <dl class="mk-facts mk-facts-inline mt-4">
      <div><dt>Maison</dt><dd>${esc(app.maisonName)}</dd></div>
      <div><dt>Received</dt><dd>${dateFmt(app.createdAt)}</dd></div>
      <div><dt>Status</dt><dd>${statusBadge(app.status)}</dd></div>
    </dl>
    ${app.note ? `<p class="mt-3 muted italic">“${esc(app.note)}”</p>` : ''}
    <div class="row row-wrap mt-4 mk-center">
      ${app.status === 'approved' ? `<a class="btn btn-gold" href="#/signin">Sign in</a>` : ''}
      <a class="btn btn-ghost" href="#/palace">Return to the lobby</a>
    </div>
  </div>`;
}

function formPanel(user) {
  return `<form class="panel panel-gold mk-apply-form" data-apply novalidate>
    <div class="center">
      <div class="eyebrow">The application</div>
      <h2 class="h1 mt-2">Apply for residency</h2>
      <p class="muted mt-2 mk-measure">Tell us about your work in your own words. The Keeper reads every application personally.</p>
    </div>
    <div class="form-grid mt-4">
      ${field('name', 'Your name', user?.name, { auto: 'name' })}
      ${field('email', 'Email', user?.email, { type: 'email', auto: 'email' })}
      ${field('maisonName', 'Maison name', '', { placeholder: 'The name above your door' })}
      ${field('location', 'Location', '', { placeholder: 'City, state or country' })}
      ${field('website', 'Website or Instagram', '', { optional: true, span: true })}
      ${field('specialties', 'What you pour', '', { span: true, placeholder: 'Your waxes, vessels and the scents you are known for' })}
      ${field('priceRange', 'Price range', '', { span: true, placeholder: 'For example, $60 – $140' })}
      <div class="field span-2">
        <label class="label" for="mk-ap-story">Your story</label>
        <textarea class="textarea" id="mk-ap-story" name="story" rows="6" maxlength="1500" placeholder="How you began, how you work, and what a batch looks like in your atelier" required></textarea>
        <p class="mk-err" data-err="story" hidden></p>
      </div>
      <div class="field span-2">
        <label class="check"><input type="checkbox" name="handPoured"><span>I confirm that my candles are hand-poured in small batches.</span></label>
        <p class="mk-err" data-err="handPoured" hidden></p>
      </div>
    </div>
    <div class="center mt-4">
      <button class="btn btn-gold" type="submit">Submit application</button>
      <p class="mk-err mt-2" data-form-err hidden></p>
      <p class="hint mt-2">There is no charge to apply.</p>
    </div>
  </form>`;
}

export function render(ctx) {
  const settings = store.getSettings();
  const user = ctx.user;
  const fee = pct(settings.feeRate, 0);
  const isVendor = user?.role === 'vendor';
  const vendorShop = isVendor ? store.getShop(user.shopId) : null;
  const app = isVendor ? null : existing(user);

  let action;
  if (isVendor) {
    action = `<div class="panel panel-gold center mk-apply-state">
      ${mothMark(56)}<div class="eyebrow mt-3">Already in residence</div>
      <h2 class="h1 mt-2">${vendorShop ? esc(vendorShop.name) : 'Your maison'} has its rooms</h2>
      <p class="lede mt-2">You are a resident maker of the Palace. Your atelier is where you dress the storefront, teach the front desk and follow your sales.</p>
      <div class="row row-wrap mt-4 mk-center"><a class="btn btn-gold" href="#/atelier">Enter your atelier</a>${vendorShop ? `<a class="btn btn-ghost" href="#/palace/shop/${esc(vendorShop.slug)}">View your storefront</a>` : ''}</div>
    </div>`;
  } else if (app && app.status !== 'declined') action = statusPanel(app);
  else if (!settings.applicationsOpen) {
    action = `${app ? statusPanel(app) : ''}<div class="panel center mk-apply-state ${app ? 'mt-3' : ''}">
      ${mothMark(56)}<div class="eyebrow mt-3">Applications are closed</div>
      <h2 class="h1 mt-2">Residency is currently full</h2>
      <p class="lede mt-2">Every room in the Palace is taken for now. Applications will reopen when a room becomes free.</p>
      <div class="row row-wrap mt-4 mk-center"><a class="btn btn-ghost" href="#/palace/maisons">Meet the maisons in residence</a></div>
    </div>`;
  } else action = `${app ? `${statusPanel(app)}<p class="center muted mt-4 mb-3">You are welcome to apply again when your work has moved on.</p>` : ''}${formPanel(user)}`;

  const includes = [
    ['brush', 'A storefront of your own', 'Your maison is dressed your way: a palette, an accent colour, typography and a choice of hero layouts. It looks like your house, not ours.'],
    ['chat', 'Your own AI front desk', 'A front desk that learns your maison’s voice and answers guests day and night. When it is unsure it asks you, and remembers your answer.'],
    ['spark', 'The Moth Agent', 'A private analyst that keeps you informed of sales, visits, clicks and conversations, and answers your questions in plain language.'],
    ['coins', 'Payouts, plainly', `One transparent Palace fee of ${fee} per sale. Your proceeds become available once a parcel ships, and you request a payout when you wish.`],
  ];

  return `
  <section class="section mk-apply-hero center">
    <div class="container container-narrow">
      ${mothMark(64)}
      <div class="eyebrow mt-3">Residency at the Moth Market Palace</div>
      <h1 class="display mt-2">Open a maison</h1>
      <div class="ornament mt-3" aria-hidden="true"><span>✦</span></div>
      <p class="lede mt-3">A small number of rooms, kept for artisans who pour by hand. Bring your candles and your point of view. The Palace provides the address, the front desk and the patrons.</p>
      <div class="row row-wrap mt-4 mk-center"><a class="btn btn-gold" href="#mk-apply" data-to-apply>${isVendor ? 'Your residency' : app && app.status !== 'declined' ? 'Your application' : 'Apply for residency'}</a><a class="btn btn-ghost" href="#/palace/maisons">Meet the residents</a></div>
    </div>
  </section>

  <section class="section mk-edit-tint">
    <div class="container">
      <header class="mk-head reveal"><div><div class="eyebrow">What residency includes</div><h2 class="h1 mt-1">Everything a maison needs, and nothing it does not</h2></div></header>
      <div class="mk-includes">
        ${includes.map(([ic, title, text], i) => `<article class="mk-include reveal">
          <div class="row between"><span class="mk-include-icon">${icon(ic)}</span><span class="tiny faint num">${String(i + 1).padStart(2, '0')}</span></div>
          <h3 class="h3 mt-3">${title}</h3><p class="muted mt-1">${esc(text)}</p>
        </article>`).join('')}
      </div>
    </div>
  </section>

  <section class="section">
    <div class="container mk-fee">
      <div class="mk-fee-figure reveal"><span class="num">${fee}</span><span class="caps muted">per sale</span></div>
      <div class="reveal">
        <div class="eyebrow">The Palace fee</div>
        <h2 class="h1 mt-1">One fee, stated plainly</h2>
        <hr class="rule-short">
        <p class="lede">The Palace keeps ${fee} of each sale. That is the whole arrangement.</p>
        <ul class="mk-ticks mt-3">
          <li>${icon('check')}<span>The rate is fixed on each order when it is placed, so later changes never rewrite your history.</span></li>
          <li>${icon('check')}<span>Your atelier shows every sale, the fee taken and what is owed to you.</span></li>
          <li>${icon('check')}<span>Delivery to patrons is complimentary across the Palace, so every maison is presented alike.</span></li>
        </ul>
      </div>
    </div>
  </section>

  <section class="section mk-edit-tint">
    <div class="container mk-standards">
      <div class="reveal">
        <div class="eyebrow">Curation</div>
        <h2 class="h1 mt-1">Who the Palace is for</h2>
        <hr class="rule-short">
        <p class="muted">The Palace is curated, and that is what makes an address here worth having. We look for makers with a clear hand and a clear voice.</p>
      </div>
      <ul class="mk-standard-list reveal">
        <li><h3 class="h4">Hand-poured</h3><p class="small muted">Made by you or your own atelier, not bought in and relabelled.</p></li>
        <li><h3 class="h4">Small batch</h3><p class="small muted">Poured in quantities you can stand behind, one batch at a time.</p></li>
        <li><h3 class="h4">A point of view</h3><p class="small muted">A recognisable character in scent, vessel and story.</p></li>
        <li><h3 class="h4">Care for the patron</h3><p class="small muted">Orders prepared promptly and wrapped as a gift would be.</p></li>
      </ul>
    </div>
  </section>

  <section class="section">
    <div class="container">
      <header class="mk-head reveal"><div><div class="eyebrow">How it unfolds</div><h2 class="h1 mt-1">From application to opening</h2></div></header>
      <ol class="mk-path">
        <li class="reveal"><span class="num">01</span><h3 class="h4">Apply</h3><p class="small muted">Tell us about your maison, your candles and how you work.</p></li>
        <li class="reveal"><span class="num">02</span><h3 class="h4">The Keeper reads</h3><p class="small muted">Each application is reviewed against the standards above. You will hear by email.</p></li>
        <li class="reveal"><span class="num">03</span><h3 class="h4">Dress your maison</h3><p class="small muted">Choose your theme, add your pieces and teach your front desk how you speak.</p></li>
        <li class="reveal"><span class="num">04</span><h3 class="h4">Open your doors</h3><p class="small muted">Your storefront joins the Palace and the Moth Agent begins its reports.</p></li>
      </ol>
    </div>
  </section>

  <section class="section mk-edit-tint" id="mk-apply">
    <div class="container container-narrow">${action}</div>
  </section>`;
}

export function mount(root, ctx) {
  const jump = root.querySelector('[data-to-apply]');
  if (jump) jump.addEventListener('click', (e) => { e.preventDefault(); root.querySelector('#mk-apply').scrollIntoView({ behavior: 'smooth' }); });

  const form = root.querySelector('[data-apply]');
  if (!form) return;
  const show = (name, message) => {
    const input = form.querySelector(`[name="${name}"]`);
    const err = form.querySelector(`[data-err="${name}"]`);
    err.textContent = message || '';
    err.hidden = !message;
    if (message) input.setAttribute('aria-invalid', 'true'); else input.removeAttribute('aria-invalid');
  };
  const check = (name, value) => {
    if (name === 'handPoured') return value ? '' : 'The Palace is reserved for hand-poured, small-batch candles.';
    if (!value) return REQUIRED[name];
    if (name === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Please enter a complete email address.';
    return '';
  };
  const names = [...Object.keys(REQUIRED), 'handPoured'];
  names.forEach((name) => {
    const input = form.querySelector(`[name="${name}"]`);
    input.addEventListener(input.type === 'checkbox' ? 'change' : 'input', () => {
      if (input.hasAttribute('aria-invalid')) show(name, check(name, input.type === 'checkbox' ? input.checked : input.value.trim()));
    });
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = formData(form);
    const formErr = form.querySelector('[data-form-err]');
    let first = null;
    names.forEach((name) => {
      const message = check(name, data[name]);
      show(name, message);
      if (message && !first) first = name;
    });
    if (first) {
      formErr.textContent = 'A few details are still needed above.'; formErr.hidden = false;
      form.querySelector(`[name="${first}"]`).focus();
      return;
    }
    const app = store.submitApplication({
      name: data.name, email: data.email, maisonName: data.maisonName, location: data.location,
      website: data.website, specialties: data.specialties, priceRange: data.priceRange, story: data.story,
    });
    submittedId = app.id;
    ctx.refresh();
  });
}
