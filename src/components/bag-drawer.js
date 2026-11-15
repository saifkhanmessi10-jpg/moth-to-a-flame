// Slide-in bag. Opens when a piece is added (and from the header bag icon), so a
// patron can adjust quantities or go straight to checkout without leaving the page.
import * as store from '../store.js';
import { esc, icon, money, candleArt, productCard } from '../ui.js';

let el = null;
let lastFocus = null;
let justAdded = null;

function suggestions(items) {
  const inBag = new Set(items.map((it) => it.productId));
  const shopIds = [...new Set(items.map((it) => it.product.shopId))];
  const pool = store.listProducts({ publicOnly: true }).filter((p) => p.stock > 0 && !inBag.has(p.id));
  const same = pool.filter((p) => shopIds.includes(p.shopId));
  return [...same, ...pool.filter((p) => !shopIds.includes(p.shopId) && p.tags?.includes('bestseller'))].slice(0, 2);
}

function draw() {
  if (!el) return;
  const t = store.bagTotals();
  const items = store.getBag();
  const added = justAdded && store.getProduct(justAdded);
  el.querySelector('.bd-panel').innerHTML = `
    <header class="bd-head">
      <div><div class="eyebrow">Your bag</div><h2 class="h3 mt-1">${t.count ? `${t.count} ${t.count === 1 ? 'piece' : 'pieces'}` : 'Nothing chosen yet'}</h2></div>
      <button class="icon-btn" data-bd-close aria-label="Close your bag">${icon('close')}</button>
    </header>
    ${added ? `<p class="bd-added">${icon('check')}<span><em>${esc(added.name)}</em> is in your bag.</span></p>` : ''}
    <div class="bd-body">
      ${items.length ? `<ul class="bd-lines">${items.map((it) => `
        <li class="bd-line">
          <a class="bd-thumb art-frame" href="#/palace/product/${esc(it.productId)}">${candleArt(it.product, { lit: false })}</a>
          <div class="bd-info">
            <div class="tiny faint caps">${esc(it.shop.name)}</div>
            <a class="bd-name" href="#/palace/product/${esc(it.productId)}">${esc(it.product.name)}</a>
            <div class="row between mt-1">
              <div class="qty qty-sm" role="group" aria-label="Quantity of ${esc(it.product.name)}">
                <button type="button" data-bd-step="-1" data-id="${esc(it.productId)}" aria-label="${it.qty === 1 ? 'Remove' : 'Fewer'}">${it.qty === 1 ? icon('trash') : '−'}</button>
                <span>${it.qty}</span>
                <button type="button" data-bd-step="1" data-id="${esc(it.productId)}" aria-label="More" ${it.qty >= it.product.stock ? 'disabled' : ''}>+</button>
              </div>
              <span class="gold num">${money(it.lineTotal)}</span>
            </div>
            ${it.qty >= it.product.stock ? `<div class="tiny faint mt-1">That is every piece the atelier has.</div>` : ''}
          </div>
        </li>`).join('')}</ul>
        ${(() => { const s = suggestions(items); return s.length ? `<div class="bd-suggest"><div class="eyebrow mb-2">Pairs beautifully with</div><div class="bd-suggest-grid">${s.map((p) => productCard(p)).join('')}</div></div>` : ''; })()}`
      : `<div class="bd-empty"><span class="moth-mark" style="--size:46px"></span><p class="muted mt-2">Your bag is waiting for its first flame.</p>
          <div class="bd-empty-cta"><a class="btn btn-gold btn-sm" href="#/palace/finder">Find your flame</a><a class="btn btn-ghost btn-sm" href="#/palace/search">Browse the collection</a></div></div>`}
    </div>
    ${items.length ? `<footer class="bd-foot">
      <div class="row between"><span class="muted">Subtotal</span><span class="num">${money(t.subtotal)}</span></div>
      <div class="row between small mt-1"><span class="muted">Insured delivery</span><span class="gold">Complimentary</span></div>
      <a class="btn btn-gold btn-block mt-3" href="#/palace/checkout">Checkout · ${money(t.total)}</a>
      <div class="bd-foot-links"><a href="#/palace/bag">View full bag</a><button type="button" data-bd-close>Keep browsing</button></div>
      <p class="tiny faint center mt-2">Gift wrapping and a handwritten note are free at checkout.</p>
    </footer>` : ''}`;
}

export function closeBag() {
  if (!el || !el.classList.contains('is-open')) return;
  el.classList.remove('is-open');
  document.body.classList.remove('bd-lock');
  justAdded = null;
  if (lastFocus && document.contains(lastFocus)) lastFocus.focus();
}

/** Open the drawer. Pass the id of a piece that was just added to acknowledge it. */
export function openBag(addedId = null) {
  if (!el) {
    el = document.createElement('div');
    el.className = 'bd';
    el.innerHTML = '<div class="bd-scrim" data-bd-close></div><aside class="bd-panel" role="dialog" aria-modal="true" aria-label="Your bag"></aside>';
    document.body.appendChild(el);
    el.addEventListener('click', (e) => {
      if (e.target.closest('[data-bd-close]')) { closeBag(); return; }
      const step = e.target.closest('[data-bd-step]');
      if (step) {
        const line = store.getBag().find((b) => b.productId === step.dataset.id);
        if (line) store.setBagQty(line.productId, line.qty + Number(step.dataset.bdStep));
        justAdded = null; draw();
        return;
      }
      if (e.target.closest('a[href^="#"]')) closeBag();
    });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeBag(); });
    window.addEventListener('hashchange', closeBag);
    store.subscribe(() => { if (el.classList.contains('is-open')) draw(); });
  }
  justAdded = addedId;
  lastFocus = document.activeElement;
  draw();
  requestAnimationFrame(() => { el.classList.add('is-open'); document.body.classList.add('bd-lock'); el.querySelector('[data-bd-close].icon-btn')?.focus(); });
}
