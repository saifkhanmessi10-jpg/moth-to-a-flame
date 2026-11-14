// A maison's storefront, dressed in its own theme.
import * as store from '../../store.js';
import { esc, icon, mothMark, monogram, themeAttrs, shopBanner, productCard, stars, toast } from '../../ui.js';
import { mountFrontDesk } from '../../components/frontdesk-widget.js';

export const meta = { title: 'Maison' };

const activeCollection = {}; // shopId → collection chip, kept across refreshes
const followers = (n) => `${n} ${n === 1 ? 'patron follows' : 'patrons follow'} this maison`;

const lost = (eyebrow, title, text) => `<section class="section center"><div class="container container-narrow">
  ${mothMark(56)}<div class="eyebrow mt-3">${eyebrow}</div><h1 class="h1 mt-2">${title}</h1><p class="lede mt-2">${text}</p>
  <div class="row row-wrap mt-4 mk-center"><a class="btn btn-gold" href="#/palace/maisons">Visit the maisons</a><a class="btn btn-ghost" href="#/palace">Return to the lobby</a></div>
</div></section>`;

function facts(shop) {
  const rating = Number(shop.rating) || 0;
  return `<ul class="mk-smeta">
    ${shop.location ? `<li>${icon('pin')}<span>${esc(shop.location)}</span></li>` : ''}
    ${shop.founded ? `<li>${icon('flame')}<span>Pouring since ${esc(shop.founded)}</span></li>` : ''}
    ${rating ? `<li>${stars(rating)}<span>${rating.toFixed(1)}</span></li>` : ''}
  </ul>`;
}
function follow(shop) {
  const on = store.isFollowing(shop.id);
  return `<div class="mk-follow">
    <button class="btn btn-sm ${on ? 'btn-gold' : ''}" type="button" data-follow aria-pressed="${on}">${on ? 'Following' : 'Follow the maison'}</button>
    <span class="small muted" data-followers>${followers(store.followerCount(shop.id))}</span>
  </div>`;
}

function hero(shop) {
  const style = ['centered', 'split', 'editorial'].includes(shop.heroStyle) ? shop.heroStyle : 'centered';
  const tagline = shop.tagline ? `<p class="lede mt-2">${esc(shop.tagline)}</p>` : '';
  if (style === 'split') {
    return `<header class="mk-shero mk-shero-split"><div class="container">
      <div class="mk-shero-text">
        <div class="eyebrow">A maison of the Palace</div>
        <h1 class="display mt-2 mk-wrap">${esc(shop.name)}</h1>
        ${tagline}<hr class="rule-short">${facts(shop)}${follow(shop)}
      </div>
      <div class="mk-shero-art">${shopBanner(shop)}</div>
    </div></header>`;
  }
  if (style === 'editorial') {
    return `<header class="mk-shero mk-shero-editorial"><div class="container">
      <div class="row between row-wrap mk-shero-top"><span class="eyebrow">A maison of the Palace</span>${shop.location ? `<span class="caps muted">${esc(shop.location)}</span>` : ''}</div>
      <h1 class="mk-shero-name mk-wrap">${esc(shop.name)}</h1>
      <div class="mk-shero-cols">
        <p class="lede">${esc(shop.tagline || shop.story || '')}</p>
        <div>${facts(shop)}${follow(shop)}</div>
      </div>
    </div></header>`;
  }
  return `<header class="mk-shero mk-shero-centered">
    <div class="mk-shero-bg" aria-hidden="true">${shopBanner(shop, { withMark: false })}</div>
    <div class="container container-narrow">
      ${monogram(shop, 84)}
      <div class="eyebrow mt-3">A maison of the Palace</div>
      <h1 class="display mt-2 mk-wrap">${esc(shop.name)}</h1>
      ${tagline}<hr class="rule-short">${facts(shop)}${follow(shop)}
    </div>
  </header>`;
}

export function render(ctx) {
  const shop = store.getShop(ctx.params.slug);
  if (!shop) return lost('Not found', 'This maison is not in residence', 'The address may have changed, or the maison may have moved on. The other houses of the Palace are open.');
  if (shop.status !== 'live') {
    return lost('A quiet season', `${esc(shop.name)} is resting`, 'This maison has closed its doors for a little while. Its pieces will return to the Palace when it reopens.');
  }
  const products = store.listProducts({ shopId: shop.id, publicOnly: true });
  const collections = [...new Set(products.map((p) => p.collection).filter(Boolean))];
  const active = collections.includes(activeCollection[shop.id]) ? activeCollection[shop.id] : '';
  const policies = [['truck', 'Delivery', shop.policies?.shipping], ['shield', 'Returns', shop.policies?.returns], ['gift', 'Gifting', shop.policies?.gifting]].filter((x) => x[2]);

  return `<div class="mk-store" ${themeAttrs(shop)}>
    ${shop.announcement ? `<div class="mk-store-announce" role="note">${esc(shop.announcement)}</div>` : ''}
    ${hero(shop)}

    <section class="section-tight" id="mk-pieces">
      <div class="container">
        <header class="mk-head">
          <div><div class="eyebrow">The pieces</div><h2 class="h2 mt-1">From the atelier</h2></div>
          <span class="caps faint" data-piece-count>${products.length} ${products.length === 1 ? 'piece' : 'pieces'}</span>
        </header>
        ${collections.length > 1 ? `<div class="chips mb-4" role="group" aria-label="Collections">
          <button type="button" class="chip ${active ? '' : 'is-active'}" data-collection="" aria-pressed="${!active}">All</button>
          ${collections.map((c) => `<button type="button" class="chip ${active === c ? 'is-active' : ''}" data-collection="${esc(c)}" aria-pressed="${active === c}">${esc(c)}</button>`).join('')}
        </div>` : ''}
        ${products.length ? `<div class="grid cols-4">
          ${products.map((p) => `<div data-in="${esc(p.collection || '')}" ${active && p.collection !== active ? 'hidden' : ''}>${productCard(p, { showMaison: false })}</div>`).join('')}
        </div>` : `<div class="empty">${mothMark()}<p>The first pieces from this maison are still resting. Please call again soon.</p></div>`}
      </div>
    </section>

    ${shop.story ? `<section class="section mk-story">
      <div class="container container-narrow center reveal">
        ${monogram(shop, 64)}
        <div class="eyebrow mt-3">The maison</div>
        <p class="mk-story-text mt-3">${esc(shop.story)}</p>
        <p class="caps faint mt-3">${esc([shop.location, shop.founded ? `Est. ${shop.founded}` : ''].filter(Boolean).join(' · '))}</p>
      </div>
    </section>` : ''}

    ${policies.length ? `<section class="section-tight mk-policies">
      <div class="container">
        <div class="mk-policy-grid">
          ${policies.map(([ic, title, text]) => `<div class="mk-policy reveal">${icon(ic)}<h3 class="h4 mt-2">${title}</h3><p class="small muted mt-1">${esc(text)}</p></div>`).join('')}
        </div>
      </div>
    </section>` : ''}
  </div>`;
}

export function mount(root, ctx) {
  const shop = store.getShop(ctx.params.slug);
  if (!shop || shop.status !== 'live') return;
  store.track('shop_view', { shopId: shop.id });
  mountFrontDesk(shop.id);

  const btn = root.querySelector('[data-follow]');
  if (btn) btn.addEventListener('click', () => {
    if (!store.currentUser()) { toast('Sign in to follow a maison.', { href: '#/signin', action: 'Sign in' }); return; }
    const on = store.toggleFollow(shop.id);
    btn.classList.toggle('btn-gold', on);
    btn.setAttribute('aria-pressed', String(on));
    btn.textContent = on ? 'Following' : 'Follow the maison';
    const count = root.querySelector('[data-followers]');
    if (count) count.textContent = followers(store.followerCount(shop.id));
    toast(on ? `You now follow ${shop.name}` : `You no longer follow ${shop.name}`, on ? { href: '#/account?tab=maisons', action: 'View' } : {});
  });

  const chips = [...root.querySelectorAll('[data-collection]')];
  const cards = [...root.querySelectorAll('[data-in]')];
  const count = root.querySelector('[data-piece-count]');
  chips.forEach((chip) => chip.addEventListener('click', () => {
    const c = chip.dataset.collection;
    activeCollection[shop.id] = c;
    chips.forEach((x) => { const on = x === chip; x.classList.toggle('is-active', on); x.setAttribute('aria-pressed', String(on)); });
    let shown = 0;
    cards.forEach((el) => { const ok = !c || el.dataset.in === c; el.hidden = !ok; if (ok) shown++; });
    if (count) count.textContent = `${shown} ${shown === 1 ? 'piece' : 'pieces'}`;
  }));
}
