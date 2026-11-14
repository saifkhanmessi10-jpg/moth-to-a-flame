// Checkout. Guests may check out. No card details are requested in the preview.
import * as store from '../../store.js';
import { esc, money, icon, mothMark, candleArt, formData, toast } from '../../ui.js';

export const meta = { title: 'Checkout' };

const REQUIRED = {
  email: 'Please enter the email for your confirmation.',
  name: 'Please enter the recipient’s full name.',
  line1: 'Please enter the delivery address.',
  city: 'Please enter the city.',
  region: 'Please enter the state or region.',
  postal: 'Please enter the postal code.',
  country: 'Please enter the country.',
};

const field = (name, label, value, { type = 'text', auto = '', span = false, placeholder = '' } = {}) => `
  <div class="field ${span ? 'span-2' : ''}">
    <label class="label" for="mk-co-${name}">${label}</label>
    <input class="input" id="mk-co-${name}" name="${name}" type="${type}" value="${esc(value || '')}" ${auto ? `autocomplete="${auto}"` : ''} ${placeholder ? `placeholder="${esc(placeholder)}"` : ''} required aria-describedby="mk-co-${name}-err">
    <p class="mk-err" id="mk-co-${name}-err" data-err="${name}" hidden></p>
  </div>`;

export function render(ctx) {
  const totals = store.bagTotals();
  if (!totals.count) {
    return `<section class="section center"><div class="container container-narrow">
      ${mothMark(56)}<div class="eyebrow mt-3">Checkout</div><h1 class="h1 mt-2">There is nothing to check out yet</h1>
      <p class="lede mt-2">Your bag is empty. Choose a piece from the collection and return here when you are ready.</p>
      <div class="row row-wrap mt-4 mk-center"><a class="btn btn-gold" href="#/palace/search">The Collection</a><a class="btn btn-ghost" href="#/palace/bag">View your bag</a></div>
    </div></section>`;
  }
  const u = ctx.user;
  const a = u?.address || {};
  return `<section class="section-tight">
    <div class="container">
      <header class="mk-head"><div><div class="eyebrow">Checkout</div><h1 class="h1 mt-1">Where shall we send it</h1></div>
        <a class="link-arrow" href="#/palace/bag">Return to your bag</a></header>
      <form class="mk-two" data-checkout novalidate>
        <div class="mk-co-steps">
          <fieldset class="mk-co-step">
            <legend><span class="num">01</span> Contact</legend>
            <div class="form-grid">${field('email', 'Email', u?.email, { type: 'email', auto: 'email', span: true, placeholder: 'For your confirmation' })}</div>
            ${u ? '' : `<p class="hint">Checking out as a guest. <a class="link" href="#/signin">Sign in</a> to keep your orders in one place.</p>`}
          </fieldset>

          <fieldset class="mk-co-step">
            <legend><span class="num">02</span> Delivery</legend>
            <div class="form-grid">
              ${field('name', 'Full name', u?.name, { auto: 'name', span: true })}
              ${field('line1', 'Address', a.line1, { auto: 'address-line1', span: true })}
              ${field('city', 'City', a.city, { auto: 'address-level2' })}
              ${field('region', 'State / region', a.region, { auto: 'address-level1' })}
              ${field('postal', 'Postal code', a.postal, { auto: 'postal-code' })}
              ${field('country', 'Country', a.country || 'United States', { auto: 'country-name' })}
            </div>
            <p class="hint">${icon('truck')} Insured delivery is complimentary on every Palace order.</p>
          </fieldset>

          <fieldset class="mk-co-step">
            <legend><span class="num">03</span> Gift note <span class="faint">· optional</span></legend>
            <div class="field">
              <label class="label" for="mk-co-gift">A message to enclose</label>
              <textarea class="textarea" id="mk-co-gift" name="giftNote" maxlength="400" placeholder="Written by hand and placed inside the parcel"></textarea>
            </div>
            <p class="hint">${icon('gift')} Gift-wrapped at no charge.</p>
          </fieldset>

          <fieldset class="mk-co-step">
            <legend><span class="num">04</span> Payment</legend>
            <div class="mk-pay">
              ${icon('shield')}
              <div>
                <p>In the live Palace, payment is taken securely at this step.</p>
                <p class="muted mt-1">This is a preview. No card is requested and nothing is charged.</p>
              </div>
            </div>
          </fieldset>
        </div>

        <aside class="panel panel-gold mk-summary" aria-label="Order summary">
          <h2 class="h3">Your order</h2>
          ${totals.byShop.map(({ shop, items, subtotal }) => `<div class="mk-sum-group">
            <div class="row between"><span class="caps gold">${esc(shop.name)}</span><span class="small num muted">${money(subtotal)}</span></div>
            <ul>${items.map((it) => `<li class="mk-sum-line">
              <span class="art-frame mk-thumb-sm">${candleArt(it.product, { lit: false })}</span>
              <span class="grow"><span class="mk-sum-name">${esc(it.product.name)}</span><span class="tiny faint">Quantity ${it.qty}</span></span>
              <span class="num small">${money(it.lineTotal)}</span>
            </li>`).join('')}</ul>
          </div>`).join('')}
          <dl class="mk-sum mt-3">
            <div><dt>Subtotal</dt><dd class="num">${money(totals.subtotal)}</dd></div>
            <div><dt>Delivery</dt><dd>Complimentary</dd></div>
            <div class="mk-sum-total"><dt>Total</dt><dd class="num">${money(totals.total)}</dd></div>
          </dl>
          <button class="btn btn-gold btn-block mt-3" type="submit">Place order</button>
          <p class="mk-err mt-2" data-form-err hidden></p>
          <p class="preview-note mt-3">Preview build. Placing this order charges nothing.</p>
        </aside>
      </form>
    </div>
  </section>`;
}

export function mount(root, ctx) {
  const form = root.querySelector('[data-checkout]');
  if (!form) return;
  const show = (name, message) => {
    const input = form.querySelector(`[name="${name}"]`);
    const err = form.querySelector(`[data-err="${name}"]`);
    err.textContent = message || '';
    err.hidden = !message;
    if (message) input.setAttribute('aria-invalid', 'true'); else input.removeAttribute('aria-invalid');
  };
  const check = (name, value) => {
    if (!value) return REQUIRED[name];
    if (name === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Please enter a complete email address.';
    return '';
  };
  Object.keys(REQUIRED).forEach((name) => {
    const input = form.querySelector(`[name="${name}"]`);
    input.addEventListener('input', () => { if (input.hasAttribute('aria-invalid')) show(name, check(name, input.value.trim())); });
  });

  let placing = false;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (placing) return;
    const data = formData(form);
    const formErr = form.querySelector('[data-form-err]');
    let first = null;
    Object.keys(REQUIRED).forEach((name) => {
      const message = check(name, data[name]);
      show(name, message);
      if (message && !first) first = name;
    });
    if (first) {
      formErr.textContent = 'A few details are still needed above.'; formErr.hidden = false;
      form.querySelector(`[name="${first}"]`).focus();
      return;
    }
    formErr.hidden = true;
    placing = true;
    const order = store.placeOrder({
      shipping: { name: data.name, line1: data.line1, city: data.city, region: data.region, postal: data.postal, country: data.country },
      giftNote: data.giftNote, email: data.email,
    });
    if (!order) { placing = false; toast('Your bag is empty.'); ctx.refresh(); return; }
    ctx.navigate(`/palace/order/${order.id}`);
  });
}
