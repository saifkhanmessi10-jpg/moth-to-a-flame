// The bag — lines grouped by maison.
import * as store from '../../store.js';
import { esc, money, icon, mothMark, monogram, candleArt } from '../../ui.js';

export const meta = { title: 'Your bag' };

export function render() {
  const totals = store.bagTotals();
  if (!totals.count) {
    return `<section class="section center"><div class="container container-narrow">
      ${mothMark(56)}<div class="eyebrow mt-3">Your bag</div><h1 class="h1 mt-2">Your bag is empty</h1>
      <p class="lede mt-2">Nothing has been chosen yet. The maisons are open, and there is no hurry.</p>
      <div class="row row-wrap mt-4 mk-center"><a class="btn btn-gold" href="#/palace/search">The Collection</a><a class="btn btn-ghost" href="#/palace/maisons">Visit the maisons</a></div>
    </div></section>`;
  }
  return `<section class="section-tight">
    <div class="container">
      <header class="mk-head"><div><div class="eyebrow">Your bag</div><h1 class="h1 mt-1">${totals.count} ${totals.count === 1 ? 'piece' : 'pieces'}, chosen</h1></div>
        <a class="link-arrow" href="#/palace/search">Continue browsing</a></header>
      <div class="mk-two">
        <div class="mk-groups">
          ${totals.byShop.map(({ shop, items, subtotal }) => `<section class="mk-group" aria-label="${esc(shop.name)}">
            <header class="mk-group-head">
              <a class="row" href="#/palace/shop/${esc(shop.slug)}" style="--gap:12px">${monogram(shop, 38)}<span><span class="caps faint">From the maison</span><br><span class="h4">${esc(shop.name)}</span></span></a>
            </header>
            <ul>
              ${items.map((it) => `<li class="mk-line">
                <a class="art-frame mk-thumb" href="#/palace/product/${esc(it.product.id)}">${candleArt(it.product, { lit: false })}</a>
                <div class="mk-line-main">
                  <a class="h4" href="#/palace/product/${esc(it.product.id)}">${esc(it.product.name)}</a>
                  <div class="small muted">${esc([it.product.notes?.top, it.product.notes?.heart].filter(Boolean).join(' · '))}</div>
                  <div class="small faint num">${money(it.product.price)} each</div>
                  <div class="mk-line-ctl">
                    <div class="qty" role="group" aria-label="Quantity of ${esc(it.product.name)}">
                      <button type="button" data-qty-set="${esc(it.productId)}" data-to="${it.qty - 1}" aria-label="Fewer">−</button><span>${it.qty}</span><button type="button" data-qty-set="${esc(it.productId)}" data-to="${it.qty + 1}" aria-label="More" ${it.qty >= it.product.stock ? 'disabled' : ''}>+</button>
                    </div>
                    <button type="button" class="mk-remove" data-qty-set="${esc(it.productId)}" data-to="0">${icon('trash')}<span>Remove</span></button>
                  </div>
                  ${it.qty >= it.product.stock ? `<div class="tiny faint mt-1">All that remain of this batch</div>` : ''}
                </div>
                <div class="mk-line-price num">${money(it.lineTotal)}</div>
              </li>`).join('')}
            </ul>
            <footer class="mk-group-foot"><span class="caps faint">Maison subtotal</span><span class="num">${money(subtotal)}</span></footer>
          </section>`).join('')}
        </div>
        <aside class="panel panel-gold mk-summary" aria-label="Summary">
          <h2 class="h3">Summary</h2>
          <dl class="mk-sum mt-3">
            <div><dt>Subtotal</dt><dd class="num">${money(totals.subtotal)}</dd></div>
            <div><dt>Delivery</dt><dd>Complimentary</dd></div>
            <div class="mk-sum-total"><dt>Total</dt><dd class="num">${money(totals.total)}</dd></div>
          </dl>
          <a class="btn btn-gold btn-block mt-3" href="#/palace/checkout">Proceed to checkout</a>
          <a class="btn btn-quiet btn-block mt-1" href="#/palace/search">Continue browsing</a>
          <p class="small muted mt-3">${totals.byShop.length > 1 ? `Your order will arrive as ${totals.byShop.length} parcels, one from each maison. ` : ''}Every parcel travels insured, and may be gift-wrapped at no charge.</p>
        </aside>
      </div>
    </div>
  </section>`;
}

export function mount(root, ctx) {
  root.querySelectorAll('[data-qty-set]').forEach((b) => b.addEventListener('click', () => {
    store.setBagQty(b.dataset.qtySet, Number(b.dataset.to));
    ctx.refresh();
  }));
}
