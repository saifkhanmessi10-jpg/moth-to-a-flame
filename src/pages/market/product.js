// A single piece, shown in its maison's theme.
import * as store from '../../store.js';
import { rememberViewed, recentlyViewed } from '../../components/recent.js';
import { esc, money, icon, mothMark, monogram, themeAttrs, candleArt, productCard, stars, dateFmt, formData } from '../../ui.js';
import { mountFrontDesk } from '../../components/frontdesk-widget.js';

export const meta = { title: 'A piece from the Palace' };

let skipTrack = false; // a refresh after a review is not a new view

const find = (id) => {
  const p = store.getProduct(id);
  const shop = p ? store.getShop(p.shopId) : null;
  return p && p.status === 'live' && shop && shop.status === 'live' ? { p, shop } : null;
};

export function render(ctx) {
  const found = find(ctx.params.id);
  if (!found) {
    return `<section class="section center"><div class="container container-narrow">
      ${mothMark(56)}<div class="eyebrow mt-3">Not on view</div><h1 class="h1 mt-2">This piece is not in the Palace</h1>
      <p class="lede mt-2">It may have been withdrawn, or its maison may be resting. The rest of the collection is open.</p>
      <div class="row row-wrap mt-4 mk-center"><a class="btn btn-gold" href="#/palace/search">The Collection</a><a class="btn btn-ghost" href="#/palace/maisons">Visit the maisons</a></div>
    </div></section>`;
  }
  const { p, shop } = found;
  const sold = p.stock <= 0;
  const low = !sold && p.stock <= 5;
  const rating = store.ratingFor(p.id);
  const reviews = store.listReviews({ productId: p.id });
  const more = store.listProducts({ shopId: shop.id, publicOnly: true }).filter((x) => x.id !== p.id).slice(0, 4);
  const notes = [['Top', p.notes?.top], ['Heart', p.notes?.heart], ['Base', p.notes?.base]].filter((n) => n[1]);
  const details = [['Burn time', p.burnTime ? `About ${p.burnTime} hours` : ''], ['Weight', p.weight], ['Collection', p.collection], ['Family', p.category]].filter((d) => d[1]);
  const wished = store.isWished(p.id);

  return `<div class="mk-store" ${themeAttrs(shop)}>
    <section class="section-tight">
      <div class="container">
        <nav class="mk-crumbs" aria-label="Breadcrumb">
          <a href="#/palace">The Palace</a><span aria-hidden="true">/</span><a href="#/palace/shop/${esc(shop.slug)}">${esc(shop.name)}</a><span aria-hidden="true">/</span><span aria-current="page">${esc(p.name)}</span>
        </nav>
        <div class="mk-pdp">
          <div class="art-frame mk-pdp-art">${candleArt(p)}</div>
          <div class="mk-pdp-info">
            <a class="eyebrow" href="#/palace/shop/${esc(shop.slug)}">${esc(shop.name)}</a>
            <h1 class="h1 mt-2 mk-wrap">${esc(p.name)}</h1>
            ${rating.count ? `<a class="row mt-2 small muted mk-rating" href="#mk-reviews" data-to-reviews>${stars(rating.average)}<span>${rating.average.toFixed(1)} · ${rating.count} ${rating.count === 1 ? 'review' : 'reviews'}</span></a>` : ''}
            <div class="mk-pdp-price mt-3"><span class="num">${money(p.price)}</span>
              <span class="mk-stock ${sold ? 'is-out' : low ? 'is-low' : ''}">${sold ? 'Resting between batches' : low ? `Only ${p.stock} remain` : 'In stock'}</span></div>
            ${p.description ? `<p class="lede mt-3">${esc(p.description)}</p>` : ''}

            ${notes.length ? `<dl class="mk-notes mt-4" aria-label="Scent pyramid">
              ${notes.map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join('')}
            </dl>` : ''}

            <div class="mk-buy mt-4">
              ${sold ? '' : `<div class="qty" role="group" aria-label="Quantity">
                <button type="button" data-step="-1" aria-label="Fewer">−</button><span data-qty-val aria-live="polite">1</span><button type="button" data-step="1" aria-label="More">+</button>
              </div>`}
              <button class="btn btn-gold mk-buy-add" type="button" ${sold ? 'disabled' : `data-add-to-bag="${esc(p.id)}" data-qty="1"`}>${sold ? 'Resting between batches' : 'Add to bag'}</button>
              <button class="btn btn-ghost mk-wish ${wished ? 'is-on' : ''}" type="button" data-wish="${esc(p.id)}" aria-label="Save ${esc(p.name)} to your list">${icon('heart')}<span class="mk-wish-off">Save</span><span class="mk-wish-on">Saved</span></button>
            </div>
            ${sold ? `<p class="small muted mt-2">This piece returns when the next batch has rested. The maison’s front desk can tell you more.</p>` : ''}

            <ul class="mk-assure mt-4">
              <li>${icon('truck')}<span>Complimentary insured delivery on every Palace order.</span></li>
              <li>${icon('gift')}<span>Gift-wrapped with a handwritten note at no charge.</span></li>
              <li>${icon('flame')}<span>Hand-poured in small batches by ${esc(shop.name)}.</span></li>
            </ul>

            ${details.length ? `<dl class="mk-details mt-4">
              ${details.map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join('')}
            </dl>` : ''}
          </div>
        </div>
      </div>
    </section>

    <section class="section-tight mk-band" id="mk-reviews">
      <div class="container mk-reviews">
        <div>
          <div class="eyebrow">From patrons</div>
          <h2 class="h2 mt-1">Reviews</h2>
          ${rating.count ? `<div class="mk-review-score mt-3"><span class="num">${rating.average.toFixed(1)}</span><div>${stars(rating.average)}<div class="small muted">${rating.count} ${rating.count === 1 ? 'review' : 'reviews'}</div></div></div>` : `<p class="muted mt-2">No reviews yet for this piece.</p>`}
          ${ctx.user ? `<form class="mk-review-form mt-4" data-review novalidate>
            <h3 class="h4">Leave a review</h3>
            <label class="field mt-2"><span class="label">Your rating</span>
              <select class="select" name="rating">${[5, 4, 3, 2, 1].map((n) => `<option value="${n}">${'★'.repeat(n)} · ${n} of 5</option>`).join('')}</select></label>
            <label class="field"><span class="label">Your impressions</span>
              <textarea class="textarea" name="text" maxlength="600" placeholder="How does it burn, and how does the room feel?"></textarea></label>
            <p class="mk-err" data-review-err hidden></p>
            <button class="btn btn-sm mt-2" type="submit">Share review</button>
          </form>` : `<p class="small muted mt-4"><a class="link" href="#/signin">Sign in</a> to leave a review.</p>`}
        </div>
        <ul class="mk-review-list">
          ${reviews.length ? reviews.map((r) => `<li>
            <div class="row between row-wrap">${stars(Number(r.rating) || 0)}<time class="tiny faint">${dateFmt(r.at)}</time></div>
            <p class="mt-1">${esc(r.text)}</p><p class="caps faint mt-1">${esc(r.userName)}</p>
          </li>`).join('') : `<li class="muted">Be the first to share your impressions.</li>`}
        </ul>
      </div>
    </section>

    <section class="section">
      <div class="container">
        <a class="mk-maison-mini reveal" href="#/palace/shop/${esc(shop.slug)}">
          ${monogram(shop, 68)}
          <div class="grow"><div class="eyebrow">The maison</div><div class="h3 mt-1">${esc(shop.name)}</div>
            <p class="small muted mt-1">${esc([shop.tagline, shop.location].filter(Boolean).join(' · '))}</p></div>
          <span class="link-arrow">Visit the maison</span>
        </a>
        ${(() => { const recent = recentlyViewed(4, { exclude: p.id }); return recent.length ? `<header class="mk-head mt-5"><div><div class="eyebrow">Your trail</div><h2 class="h2 mt-1">Recently viewed</h2></div></header>
        <div class="grid cols-4">${recent.map((x) => `<div>${productCard(x)}</div>`).join('')}</div>` : ''; })()}
        ${more.length ? `<header class="mk-head mt-5"><div><div class="eyebrow">Also from the atelier</div><h2 class="h2 mt-1">More from this maison</h2></div></header>
        <div class="grid cols-4">${more.map((x) => `<div class="reveal">${productCard(x, { showMaison: false })}</div>`).join('')}</div>` : ''}
      </div>
    </section>
    ${sold ? '' : `<div class="mk-buybar" data-buybar aria-hidden="true">
      <div class="mk-buybar-info"><span class="mk-buybar-name">${esc(p.name)}</span><span class="gold num">${money(p.price)}</span></div>
      <button class="btn btn-gold btn-sm" type="button" data-add-to-bag="${esc(p.id)}" data-qty="1" tabindex="-1">Add to bag</button>
    </div>`}
  </div>`;
}

export function mount(root, ctx) {
  const found = find(ctx.params.id);
  if (!found) return;
  const { p } = found;
  if (!skipTrack) store.track('product_view', { shopId: p.shopId, productId: p.id });
  skipTrack = false;
  mountFrontDesk(p.shopId);
  rememberViewed(p.id);

  const add = root.querySelector('.mk-buy-add');
  const val = root.querySelector('[data-qty-val]');
  let qty = 1;
  root.querySelectorAll('[data-step]').forEach((b) => b.addEventListener('click', () => {
    qty = Math.max(1, Math.min(p.stock, qty + Number(b.dataset.step)));
    val.textContent = String(qty);
    add.dataset.qty = String(qty);
    const barBtn = root.querySelector('[data-buybar] [data-add-to-bag]'); if (barBtn) barBtn.dataset.qty = String(qty);
  }));

  // Sticky buy bar: appears once the main Add to bag button scrolls out of view.
  const bar = root.querySelector('[data-buybar]');
  if (bar && add && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver(([en]) => { const show = !en.isIntersecting && en.boundingClientRect.top < 0; bar.classList.toggle('is-on', show); bar.setAttribute('aria-hidden', String(!show)); bar.querySelector('button').tabIndex = show ? 0 : -1; document.body.classList.toggle('has-buybar', show); });
    io.observe(add);
    window.addEventListener('hashchange', () => { io.disconnect(); document.body.classList.remove('has-buybar'); }, { once: true });
  }

  const jump = root.querySelector('[data-to-reviews]');
  if (jump) jump.addEventListener('click', (e) => { e.preventDefault(); root.querySelector('#mk-reviews').scrollIntoView({ behavior: 'smooth' }); });

  const form = root.querySelector('[data-review]');
  if (form) form.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = formData(form);
    const err = form.querySelector('[data-review-err]');
    if (!data.text) { err.textContent = 'Please share a few words about the piece.'; err.hidden = false; form.querySelector('[name="text"]').focus(); return; }
    store.addReview({ productId: p.id, rating: Number(data.rating) || 5, text: data.text });
    skipTrack = true;
    ctx.refresh();
  });
}
