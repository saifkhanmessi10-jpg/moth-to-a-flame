// Order confirmation and tracking.
import * as store from '../../store.js';
import { esc, money, icon, mothMark, monogram, candleArt, statusBadge, dateFmt } from '../../ui.js';

export const meta = { title: 'Your order' };

const STEPS = ['placed', 'preparing', 'shipped', 'delivered'];
const STEP_LABEL = { placed: 'Placed', preparing: 'Preparing', shipped: 'Shipped', delivered: 'Delivered' };
const STEP_NOTE = {
  placed: 'The maison has received your order.',
  preparing: 'Your pieces are being prepared and wrapped by hand.',
  shipped: 'Your parcel is on its way by insured courier.',
  delivered: 'Your parcel has been delivered.',
};

function timeline(parcel) {
  if (parcel.status === 'refunded') return `<p class="mk-refund">${statusBadge('refunded')}<span class="small muted">This parcel has been refunded.</span></p>`;
  const at = Math.max(0, STEPS.indexOf(parcel.status));
  return `<ol class="mk-steps" aria-label="Parcel progress">
    ${STEPS.map((s, i) => `<li class="mk-step ${i <= at ? 'is-done' : ''} ${i === at ? 'is-now' : ''}" ${i === at ? 'aria-current="step"' : ''}>${STEP_LABEL[s]}</li>`).join('')}
  </ol>
  <p class="small muted mt-2">${STEP_NOTE[STEPS[at]]}</p>`;
}

export function render(ctx) {
  const order = store.getOrder(ctx.params.id);
  if (!order) {
    return `<section class="section center"><div class="container container-narrow">
      ${mothMark(56)}<div class="eyebrow mt-3">Not found</div><h1 class="h1 mt-2">We could not find that order</h1>
      <p class="lede mt-2">Please check the link in your confirmation, or look in your account.</p>
      <div class="row row-wrap mt-4 mk-center"><a class="btn btn-gold" href="#/account">Your account</a><a class="btn btn-ghost" href="#/palace">Return to the lobby</a></div>
    </div></section>`;
  }
  const fresh = Date.now() - order.createdAt < 10 * 60 * 1000;
  const s = order.shipping || {};
  const address = [s.line1, [s.city, s.region, s.postal].filter(Boolean).join(', '), s.country].filter(Boolean);
  const first = String(order.customer || s.name || '').trim().split(/\s+/)[0];
  const parcels = order.parcels || [];

  return `
  <section class="section-tight mk-thanks center">
    <div class="container container-narrow">
      ${mothMark(fresh ? 72 : 52)}
      <div class="eyebrow mt-3">${fresh ? 'Order received' : 'Your order'}</div>
      <h1 class="${fresh ? 'display' : 'h1'} mt-2">${fresh ? `Thank you${first ? `, ${esc(first)}` : ''}` : `Order ${esc(order.number)}`}</h1>
      <div class="ornament mt-3" aria-hidden="true"><span>✦</span></div>
      <p class="lede mt-3">${fresh
        ? `Your order is with ${parcels.length > 1 ? 'the maisons' : 'the maison'} now. ${order.email ? `A confirmation is on its way to ${esc(order.email)}.` : ''}`
        : `Placed on ${dateFmt(order.createdAt)}.`}</p>
    </div>
  </section>

  <section class="mk-below-head">
    <div class="container mk-order">
      <div class="mk-parcels">
        ${parcels.map((parcel, i) => {
          const shop = store.getShop(parcel.shopId);
          return `<article class="panel mk-parcel">
            <header class="row between row-wrap">
              <div class="row" style="--gap:12px">${shop ? monogram(shop, 40) : ''}<div><div class="caps faint">Parcel ${i + 1} of ${parcels.length}</div>
                ${shop ? `<a class="h4" href="#/palace/shop/${esc(shop.slug)}">${esc(shop.name)}</a>` : '<span class="h4">A maison of the Palace</span>'}</div></div>
              ${statusBadge(parcel.status)}
            </header>
            ${timeline(parcel)}
            ${parcel.tracking ? `<p class="mk-tracking mt-3">${icon('truck')}<span class="caps faint">Tracking</span><span class="num">${esc(parcel.tracking)}</span></p>` : ''}
            <ul class="mk-parcel-items mt-3">
              ${parcel.items.map((it) => {
                const p = store.getProduct(it.productId);
                return `<li class="mk-sum-line">
                  ${p ? `<a class="art-frame mk-thumb-sm" href="#/palace/product/${esc(p.id)}">${candleArt(p, { lit: false })}</a>` : '<span class="art-frame mk-thumb-sm"></span>'}
                  <span class="grow"><span class="mk-sum-name">${esc(it.name)}</span><span class="tiny faint">Quantity ${it.qty}</span></span>
                  <span class="num small">${money(it.price * it.qty)}</span>
                </li>`;
              }).join('')}
            </ul>
          </article>`;
        }).join('')}
      </div>

      <aside class="panel panel-gold mk-summary" aria-label="Order details">
        <h2 class="h3">Order ${esc(order.number)}</h2>
        <dl class="mk-facts mt-3">
          <div><dt>Placed</dt><dd>${dateFmt(order.createdAt)}</dd></div>
          <div><dt>Delivering to</dt><dd>${esc(s.name || order.customer || '')}${address.map((l) => `<br>${esc(l)}`).join('')}</dd></div>
          ${order.giftNote ? `<div><dt>Gift note</dt><dd class="italic">“${esc(order.giftNote)}”</dd></div>` : ''}
        </dl>
        <dl class="mk-sum mt-3">
          <div><dt>Subtotal</dt><dd class="num">${money(order.subtotal)}</dd></div>
          <div><dt>Delivery</dt><dd>Complimentary</dd></div>
          <div class="mk-sum-total"><dt>Total</dt><dd class="num">${money(order.total)}</dd></div>
        </dl>
        ${fresh ? `<p class="preview-note mt-3">Preview build. No payment was taken for this order.</p>` : ''}
        <a class="btn btn-gold btn-block mt-3" href="#/palace/search">Continue browsing</a>
        <a class="btn btn-quiet btn-block mt-1" href="${ctx.user ? '#/account' : '#/signin'}">${ctx.user ? 'Your account' : 'Sign in to keep your orders'}</a>
      </aside>
    </div>
  </section>`;
}
