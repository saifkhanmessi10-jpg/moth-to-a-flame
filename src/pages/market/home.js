// The lobby of the Moth Market Palace.
import * as store from '../../store.js';
import { esc, icon, mothMark, productCard, maisonCard } from '../../ui.js';

export const meta = { title: 'The Lobby' };

const isPublic = (p) => !!p && p.status === 'live' && store.getShop(p.shopId)?.status === 'live';

const head = (eyebrow, title, sub, href, label) => `
  <header class="mk-head reveal">
    <div><div class="eyebrow">${esc(eyebrow)}</div><h2 class="h1 mt-1">${esc(title)}</h2>${sub ? `<p class="lede mt-1">${esc(sub)}</p>` : ''}</div>
    ${href ? `<a class="link-arrow" href="${href}">${esc(label)}</a>` : ''}
  </header>`;

export function render() {
  const settings = store.getSettings();
  const live = store.listShops({ status: 'live' });
  const featured = store.listShops({ status: 'live', featured: true });
  const edits = (settings.edits || [])
    .map((e) => ({ ...e, products: (e.productIds || []).map((id) => store.getProduct(id)).filter(isPublic) }))
    .filter((e) => e.products.length);
  const all = store.listProducts({ publicOnly: true, sort: 'new' });
  const arrivals = all.slice(0, 8);
  const cats = store.CATEGORIES.map((c) => ({ name: c, count: all.filter((p) => p.category === c).length })).filter((c) => c.count);

  return `
  <section class="mk-hero">
    <div class="mk-hero-stage">
      <div class="mk-hero-arch" aria-hidden="true"></div>
      <div class="mk-hero-inner">
        ${mothMark(84)}
        <h1 class="mk-hero-title"><span class="mk-hero-pre">The Moth Market</span><span class="mk-hero-word">Palace</span></h1>
        <div class="ornament" aria-hidden="true"><span>✦</span></div>
        <p class="lede mk-hero-lede">A house of independent candle maisons, curated by Moth to a Flame.</p>
        <div class="mk-hero-cta">
          <a class="btn btn-gold" href="#/palace/maisons">Visit the maisons</a>
          <a class="btn btn-ghost" href="#/palace/search">The Collection</a>
        </div>
        ${settings.announcement ? `<p class="mk-hero-note">${icon('truck')}<span>${esc(settings.announcement)}</span></p>` : ''}
      </div>
    </div>
    ${live.length ? `<nav class="mk-hero-foot" aria-label="Maisons in residence">
      <div class="container"><span class="mk-hero-foot-label">In residence</span>
        ${live.map((s) => `<a href="#/palace/shop/${esc(s.slug)}">${esc(s.name)}</a>`).join('')}</div>
    </nav>` : ''}
  </section>

  ${featured.length ? `<section class="section">
    <div class="container">
      ${head('The maisons', 'In residence this season', 'Each maison keeps its own rooms, its own voice and its own front desk.', '#/palace/maisons', 'All maisons')}
      <div class="mk-maison-grid">${featured.map((s) => `<div class="reveal">${maisonCard(s)}</div>`).join('')}</div>
    </div>
  </section>` : ''}

  ${edits.map((e, i) => `<section class="section mk-edit ${i % 2 ? '' : 'mk-edit-tint'}">
    <div class="container">
      <header class="mk-edit-head reveal">
        <div class="mk-edit-no" aria-hidden="true">${String(i + 1).padStart(2, '0')}</div>
        <div><div class="eyebrow">A Palace edit</div><h2 class="h1 mt-1">${esc(e.title)}</h2></div>
        ${e.subtitle ? `<p class="lede italic">${esc(e.subtitle)}</p>` : ''}
      </header>
      <div class="grid cols-4">${e.products.map((p) => `<div class="reveal">${productCard(p)}</div>`).join('')}</div>
    </div>
  </section>`).join('')}

  ${arrivals.length ? `<section class="section">
    <div class="container">
      ${head('New arrivals', 'Lately poured', 'The most recent pieces to arrive from the ateliers.', '#/palace/search', 'View the collection')}
      <div class="grid cols-4">${arrivals.map((p) => `<div class="reveal">${productCard(p)}</div>`).join('')}</div>
    </div>
  </section>` : ''}

  ${cats.length ? `<section class="section mk-edit-tint">
    <div class="container mk-cats">
      <div class="reveal">
        <div class="eyebrow">Browse by character</div>
        <h2 class="h1 mt-1">Find your way by scent</h2>
        <hr class="rule-short">
        <p class="muted">Every piece in the Palace is placed in a family, so you may wander by mood rather than by maker.</p>
      </div>
      <ul class="mk-cat-list reveal">
        ${cats.map((c, i) => `<li><a class="mk-cat" href="#/palace/search?category=${encodeURIComponent(c.name)}">
          <span class="n num">${String(i + 1).padStart(2, '0')}</span><span class="t">${esc(c.name)}</span>
          <span class="c">${c.count} ${c.count === 1 ? 'piece' : 'pieces'}</span>${icon('arrow')}</a></li>`).join('')}
      </ul>
    </div>
  </section>` : ''}

  <section class="mk-promise" aria-label="The Palace promise">
    <div class="container">
      <div class="mk-promise-item reveal">${icon('flame')}<h3 class="h4">Hand-poured, small batch</h3><p class="small muted">Every candle is made by the maison whose name it carries.</p></div>
      <div class="mk-promise-item reveal">${icon('truck')}<h3 class="h4">Complimentary insured delivery</h3><p class="small muted">On every Palace order, from every maison.</p></div>
      <div class="mk-promise-item reveal">${icon('chat')}<h3 class="h4">A front desk in every maison</h3><p class="small muted">Ask about a scent, a gift or an order, at any hour.</p></div>
    </div>
  </section>

  <section class="section mk-invite">
    <div class="container container-narrow center reveal">
      ${mothMark(52)}
      <div class="eyebrow mt-3">For makers</div>
      <h2 class="h1 mt-2">Open a maison</h2>
      <p class="lede mt-2">The Palace keeps a small number of rooms for artisans who pour by hand. If that is you, we would be glad to read your application.</p>
      <a class="btn mt-4" href="#/palace/open-a-maison">Apply for residency</a>
    </div>
  </section>`;
}
