// App shell: hash router, the four layouts, role guards and global behaviours.
//
// PAGE CONTRACT — every file under src/pages/** exports:
//   export const meta = { title: 'Page title' }          (optional)
//   export function render(ctx)  → HTML string            (required)
//   export function mount(root, ctx)                      (optional; wire up events)
// ctx = { params, query: URLSearchParams, path, user, shop (vendor routes), navigate(path), refresh() }
// Links are plain anchors: <a href="#/palace">.

import * as store from './store.js';
import { esc, icon, mothMark, monogram, toast, revealOnScroll } from './ui.js';
import { openBag } from './components/bag-drawer.js';
import { openSearch } from './components/search-overlay.js';

const P = (file) => () => import(`./pages/${file}.js`);
// [pattern, loader, layout, options]
const ROUTES = [
  ['/', P('site/home'), 'site', { over: true }],
  ['/story', P('site/story'), 'site', { over: true }],
  ['/collections', P('site/collections'), 'site'],
  ['/flame-society', P('site/society'), 'site', { over: true }],
  ['/contact', P('site/contact'), 'site'],

  ['/palace', P('market/home'), 'palace', { over: true }],
  ['/palace/maisons', P('market/shops'), 'palace'],
  ['/palace/shop/:slug', P('market/storefront'), 'palace'],
  ['/palace/product/:id', P('market/product'), 'palace'],
  ['/palace/search', P('market/search'), 'palace'],
  ['/palace/finder', P('market/finder'), 'palace'],
  ['/palace/bag', P('market/bag'), 'palace'],
  ['/palace/checkout', P('market/checkout'), 'palace'],
  ['/palace/order/:id', P('market/order'), 'palace'],
  ['/palace/open-a-maison', P('market/apply'), 'palace'],
  ['/account', P('market/account'), 'palace', { role: 'any' }],
  ['/signin', P('market/signin'), 'palace'],

  ['/atelier', P('vendor/overview'), 'vendor'],
  ['/atelier/orders', P('vendor/orders'), 'vendor'],
  ['/atelier/products', P('vendor/products'), 'vendor'],
  ['/atelier/storefront', P('vendor/storefront'), 'vendor'],
  ['/atelier/front-desk', P('vendor/frontdesk'), 'vendor'],
  ['/atelier/agent', P('vendor/agent'), 'vendor'],
  ['/atelier/analytics', P('vendor/analytics'), 'vendor'],
  ['/atelier/payouts', P('vendor/payouts'), 'vendor'],
  ['/atelier/settings', P('vendor/settings'), 'vendor'],

  ['/keeper', P('admin/overview'), 'admin'],
  ['/keeper/applications', P('admin/applications'), 'admin'],
  ['/keeper/maisons', P('admin/maisons'), 'admin'],
  ['/keeper/orders', P('admin/orders'), 'admin'],
  ['/keeper/finance', P('admin/finance'), 'admin'],
  ['/keeper/patrons', P('admin/patrons'), 'admin'],
  ['/keeper/ai', P('admin/ai'), 'admin'],
  ['/keeper/curation', P('admin/curation'), 'admin'],
  ['/keeper/settings', P('admin/settings'), 'admin'],
];

const VENDOR_NAV = [
  ['/atelier', 'home', 'Overview'], ['/atelier/agent', 'spark', 'Moth Agent'], ['/atelier/orders', 'box', 'Orders'],
  ['/atelier/products', 'flame', 'Candles'], ['/atelier/storefront', 'brush', 'Storefront'], ['/atelier/front-desk', 'chat', 'Front Desk AI'],
  ['/atelier/analytics', 'chart', 'Analytics'], ['/atelier/payouts', 'coins', 'Payouts'], ['/atelier/settings', 'gear', 'Settings'],
];
const ADMIN_NAV = [
  ['/keeper', 'crown', 'Overview'], ['/keeper/applications', 'scroll', 'Applications'], ['/keeper/maisons', 'store', 'Maisons'],
  ['/keeper/orders', 'box', 'Orders'], ['/keeper/finance', 'coins', 'Fees & Payouts'], ['/keeper/patrons', 'users', 'Patrons'],
  ['/keeper/ai', 'spark', 'AI Oversight'], ['/keeper/curation', 'star', 'Curation'], ['/keeper/settings', 'gear', 'Settings'],
];

const app = document.getElementById('app');
let current = null; // { path, ctx, mod }

export function navigate(path) { const target = `#${path}`; if (location.hash === target) renderRoute(); else location.hash = target; }
const homeFor = (user) => (!user ? '/signin' : user.role === 'admin' ? '/keeper' : user.role === 'vendor' ? '/atelier' : '/account');

function match(path) {
  for (const [pattern, loader, layout, opts = {}] of ROUTES) {
    const keys = []; const re = new RegExp(`^${pattern.replace(/:[^/]+/g, (k) => { keys.push(k.slice(1)); return '([^/]+)'; })}/?$`);
    const m = path.match(re);
    if (m) return { pattern, loader, layout, opts, params: Object.fromEntries(keys.map((k, i) => [k, decodeURIComponent(m[i + 1])])) };
  }
  return null;
}

/* ----------------------------------------------------------------- shells */
function publicHeader(layout, path, over) {
  const user = store.currentUser();
  const is = (p) => (path === p || (p !== '/' && p !== '/palace' && path.startsWith(p)) ? 'is-active' : '');
  const nav = layout === 'site'
    ? `<a href="#/collections" class="${is('/collections')}">Collections</a><a href="#/flame-society" class="${is('/flame-society')}">The Flame Society</a><a href="#/story" class="${is('/story')}">Our Story</a><a href="#${homeFor(user)}" class="nav-account">${user ? 'Your account' : 'Sign in'}</a><a href="#/palace" class="palace-pill">Enter the Palace</a>`
    : `<a href="#/palace/maisons" class="${is('/palace/maisons')}">Maisons</a><a href="#/palace/search" class="${is('/palace/search')}">The Collection</a><a href="#/palace/finder" class="${is('/palace/finder')}">Find your flame</a><a href="#/palace/open-a-maison" class="${is('/palace/open-a-maison')}">Open a Maison</a><a href="#${homeFor(user)}" class="nav-account">${user ? 'Your account' : 'Sign in'}</a><a href="#/">Moth to a Flame</a>`;
  const brand = layout === 'site'
    ? `<a class="brand" href="#/" aria-label="Moth to a Flame — home">${mothMark(34)}<span class="wordmark">Moth to a Flame<small>Luxury Candle Co.</small></span></a>`
    : `<a class="brand" href="#/palace" aria-label="The Moth Market Palace">${mothMark(34)}<span class="wordmark">Moth Market Palace<small>By Moth to a Flame</small></span></a>`;
  return `${layout === 'palace' && !over && store.getSettings().announcement ? `<div class="announce">${esc(store.getSettings().announcement)}</div>` : ''}
  <header class="site-header ${over ? 'is-over' : ''}">
    <div class="container bar">
      <div class="row" style="--gap:8px"><button class="icon-btn nav-toggle" aria-label="Menu">${icon('menu')}</button><nav class="site-nav" aria-label="Primary">${nav}</nav></div>
      ${brand}
      <div class="tools">
        <a class="icon-btn" href="#/palace/search" data-open-search aria-label="Search the Palace">${icon('search')}</a>
        <a class="icon-btn hide-xs" href="#${homeFor(user)}" aria-label="${user ? esc(user.name) : 'Sign in'}">${icon('user')}</a>
        <a class="icon-btn" href="#/palace/bag" data-open-bag aria-label="Your bag">${icon('bag')}<span class="count-dot" data-bag-count>${store.bagCount() || ''}</span></a>
      </div>
    </div>
  </header>`;
}
function publicFooter() {
  return `<footer class="site-footer"><div class="container">
    <div class="cols">
      <div>${mothMark(46)}<div class="wordmark mt-2" style="font-size:1.05rem">Moth to a Flame<small>Luxury Candle Co.</small></div>
        <p class="mt-3 small" style="max-width:34ch">A house of hand-poured candles, and the Palace it built for the makers it admires.</p></div>
      <div><h4>The House</h4><ul><li><a href="#/collections">Collections</a></li><li><a href="#/flame-society">The Flame Society</a></li><li><a href="#/story">Our Story</a></li><li><a href="#/contact">Concierge</a></li></ul></div>
      <div><h4>The Palace</h4><ul><li><a href="#/palace">The Lobby</a></li><li><a href="#/palace/maisons">All Maisons</a></li><li><a href="#/palace/search">The Collection</a></li><li><a href="#/palace/open-a-maison">Open a Maison</a></li></ul></div>
      <div><h4>Private Wings</h4><ul><li><a href="#/account">Patron account</a></li><li><a href="#/atelier">Maison Atelier</a></li><li><a href="#/keeper">The Keeper’s Office</a></li><li><a href="#/signin">Sign in</a></li></ul></div>
    </div>
    <div class="legal"><span>© ${new Date().getFullYear()} Moth to a Flame Luxury Candle Co.</span><span>Preview build · no payment is taken</span></div>
  </div></footer>`;
}
function dashShell(kind, path, title, inner, user, shop) {
  const nav = kind === 'vendor' ? VENDOR_NAV : ADMIN_NAV;
  const target = kind === 'vendor' ? shop.id : 'admin';
  const unread = store.listNotifications(target, { unreadOnly: true }).length;
  const counts = kind === 'vendor'
    ? { '/atelier/orders': store.listParcels({ shopId: shop.id }).filter((x) => ['placed', 'preparing'].includes(x.parcel.status)).length, '/atelier/front-desk': shop.frontDesk.unanswered.length }
    : { '/keeper/applications': store.listApplications('pending').length, '/keeper/finance': store.listPayouts({ status: 'requested' }).length };
  return `<div class="dash">
    <aside class="dash-side">
      <a class="brand brand-row" href="#${kind === 'vendor' ? '/atelier' : '/keeper'}">${mothMark(30)}<span class="wordmark" style="font-size:.78rem">${kind === 'vendor' ? 'Maison Atelier' : 'The Keeper’s Office'}<small>Moth Market Palace</small></span></a>
      <div class="who">${kind === 'vendor' ? monogram(shop, 40) : `<span class="monogram" style="--size:40px">${icon('crown')}</span>`}
        <div class="grow"><div class="h4" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(kind === 'vendor' ? shop.name : 'Super Admin')}</div><div class="tiny faint">${esc(user.name)}</div></div></div>
      <nav class="dash-nav" aria-label="Sections">${nav.map(([href, ic, label]) => `<a href="#${href}" class="${path === href ? 'is-active' : ''}">${icon(ic)}<span>${label}</span>${counts[href] ? `<span class="count">${counts[href]}</span>` : ''}</a>`).join('')}
        <div class="sep"></div>
        ${kind === 'vendor' ? `<a href="#/palace/shop/${shop.slug}">${icon('eye')}<span>View storefront</span></a>` : `<a href="#/palace">${icon('eye')}<span>View the Palace</span></a>`}
      </nav>
      <div class="foot"><button class="btn btn-quiet btn-sm" data-signout>${icon('out')} Sign out</button></div>
    </aside>
    <div style="min-width:0">
      <div class="dash-top"><div><div class="eyebrow">${kind === 'vendor' ? esc(shop.name) : 'Moth Market Palace'}</div><h1 class="h2">${esc(title)}</h1></div>
        <div class="row" style="--gap:6px">
          <a class="icon-btn" href="#${kind === 'vendor' ? '/atelier/agent' : '/keeper'}" aria-label="Notifications" data-notes>${icon('bell')}<span class="count-dot">${unread || ''}</span></a>
          <a class="icon-btn" href="#${kind === 'vendor' ? `/palace/shop/${shop.slug}` : '/palace'}" aria-label="View public side">${icon('eye')}</a>
        </div></div>
      <main class="dash-main" id="page">${inner}</main>
    </div>
  </div>`;
}
function gate(kind) {
  const copy = kind === 'vendor'
    ? ['The Maison Atelier', 'This wing is reserved for resident makers. Sign in with your maison account, or apply for residency.', '/palace/open-a-maison', 'Apply for residency']
    : kind === 'admin' ? ['The Keeper’s Office', 'This wing is reserved for the keepers of the Palace.', '/palace', 'Return to the lobby']
    : ['Your private account', 'Sign in to see your orders, saved pieces and the maisons you follow.', '/palace', 'Return to the lobby'];
  return `<section class="section center"><div class="container container-narrow">${mothMark(64)}<div class="eyebrow mt-3">Private wing</div><h1 class="h1 mt-2">${copy[0]}</h1>
    <p class="lede mt-2">${copy[1]}</p><div class="row row-wrap mt-4" style="justify-content:center"><a class="btn btn-gold" href="#/signin">Sign in</a><a class="btn btn-ghost" href="#${copy[2]}">${copy[3]}</a></div>
    <p class="preview-note mt-4" style="display:inline-block;text-align:left">Reviewing the preview? Use “Preview as” in the lower-left corner to step into any role.</p></div></section>`;
}
const notReady = (path) => `<section class="section center"><div class="container container-narrow">${mothMark(56)}<div class="eyebrow mt-3">One moment</div><h1 class="h2 mt-2">This room is being prepared</h1><p class="muted mt-2">${esc(path)} is not open yet.</p><a class="btn btn-ghost mt-4" href="#/">Return to the house</a></div></section>`;

/* ----------------------------------------------------------------- render */
async function renderRoute() {
  const raw = location.hash.slice(1) || '/';
  const [pathPart, queryPart = ''] = raw.split('?');
  const path = pathPart.replace(/\/+$/, '') || '/';
  const found = match(path);
  const user = store.currentUser();
  const deskRoot = document.getElementById('desk-root'); if (deskRoot) deskRoot.innerHTML = '';
  document.querySelectorAll('.modal-back, .toasts').forEach((m) => m.remove());
  if (!found) { app.innerHTML = publicHeader('site', path, false) + `<main class="page">${notReady(path)}</main>` + publicFooter(); wireShell(); return; }

  const { layout, opts, params } = found;
  const shop = user?.role === 'vendor' ? store.getShop(user.shopId) : null;
  const ctx = { params, query: new URLSearchParams(queryPart), path, user, shop, navigate, refresh: renderRoute };

  const blocked = (layout === 'vendor' && !shop) || (layout === 'admin' && user?.role !== 'admin') || (opts.role === 'any' && !user);
  let html = ''; let mod = null; let title = '';
  if (blocked) html = gate(layout === 'vendor' ? 'vendor' : layout === 'admin' ? 'admin' : 'account');
  else {
    try { mod = await found.loader(); html = mod.render(ctx); title = mod.meta?.title || ''; }
    catch (err) { console.error(`Page failed: ${path}`, err); html = notReady(path); mod = null; }
  }
  if ((location.hash.slice(1) || '/') !== raw) return; // navigated away while loading

  const samePage = current && current.path === path && !blocked;
  const scrollY = window.scrollY;
  if ((layout === 'vendor' || layout === 'admin') && !blocked) {
    app.innerHTML = dashShell(layout, path, title, html, user, shop);
  } else {
    const shellLayout = layout === 'site' ? 'site' : 'palace';
    const over = !!opts.over && !blocked && !!mod;
    app.innerHTML = publicHeader(shellLayout, path, over) + `<main class="page" id="page">${html}</main>` + publicFooter();
  }
  document.title = `${title ? `${title} · ` : ''}${layout === 'site' ? 'Moth to a Flame' : 'Moth Market Palace'}`;
  wireShell();
  const root = document.getElementById('page');
  if (mod?.mount && root) { try { mod.mount(root, ctx); } catch (err) { console.error(`Mount failed: ${path}`, err); } }
  revealOnScroll(app);
  window.scrollTo(0, samePage ? scrollY : 0);
  current = { path, ctx, mod };
}

function wireShell() {
  const header = app.querySelector('.site-header');
  if (header) {
    const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 40);
    if (header.classList.contains('is-over')) { window.onscroll = onScroll; onScroll(); } else window.onscroll = null;
    const toggle = header.querySelector('.nav-toggle');
    toggle.onclick = () => { const open = header.classList.toggle('nav-open'); const nav = header.querySelector('.site-nav'); const top = Math.max(0, header.getBoundingClientRect().bottom); nav.style.top = `${top}px`; nav.style.height = `calc(100vh - ${top}px)`; toggle.innerHTML = icon(open ? 'close' : 'menu'); toggle.setAttribute('aria-expanded', open); document.body.style.overflow = open ? 'hidden' : ''; };
    document.body.style.overflow = '';
  } else window.onscroll = null;
  const out = app.querySelector('[data-signout]');
  if (out) out.onclick = () => { store.signOut(); navigate('/palace'); toast('You have been signed out.'); };
  const notes = app.querySelector('[data-notes]');
  if (notes) notes.addEventListener('click', () => { const u = store.currentUser(); store.markNotificationsRead(u.role === 'admin' ? 'admin' : u.shopId); });
}

/* ------------------------------------------------- global click behaviours */
document.addEventListener('click', (e) => {
  if (e.target.closest('[data-open-search]')) { e.preventDefault(); openSearch(); return; }
  if (e.target.closest('[data-open-bag]') && !location.hash.startsWith('#/palace/bag')) { e.preventDefault(); openBag(); return; }
  const add = e.target.closest('[data-add-to-bag]');
  if (add) {
    e.preventDefault();
    const p = store.getProduct(add.dataset.addToBag);
    const qty = Number(add.dataset.qty || 1);
    if (p && store.addToBag(p.id, qty)) openBag(p.id);
    else toast('This piece is resting between batches.');
    return;
  }
  const wish = e.target.closest('[data-wish]');
  if (wish) {
    e.preventDefault();
    if (!store.currentUser()) { toast('Sign in to keep a list of saved pieces.', { href: '#/signin', action: 'Sign in' }); return; }
    const on = store.toggleWish(wish.dataset.wish);
    wish.classList.toggle('is-on', on);
    toast(on ? 'Saved to your list' : 'Removed from your list', on ? { href: '#/account?tab=saved', action: 'View' } : {});
  }
});
store.subscribe(() => { document.querySelectorAll('[data-bag-count]').forEach((el) => { el.textContent = store.bagCount() || ''; }); });

/* -------------------------------------------------------- preview switcher */
function mountPreviewSwitch() {
  const el = document.createElement('div'); el.className = 'preview-switch';
  document.body.appendChild(el);
  let open = false;
  const roles = [
    [null, 'Guest', 'Browsing without an account', '/'],
    ['u_patron', 'Patron', 'Celeste Ashworth · shopper', '/account'],
    ['u_vendor', 'Maison owner', 'Isolde Marchetti · Maison Soleil Noir', '/atelier'],
    ['u_house', 'House atelier', 'Moth to a Flame’s own shop', '/atelier'],
    ['u_admin', 'Palace Keeper', 'Super admin · the whole ecosystem', '/keeper'],
  ];
  const draw = () => {
    const user = store.currentUser();
    const label = !user ? 'Guest' : (roles.find((r) => r[0] === user.id)?.[1] || (user.role === 'vendor' ? 'Maison owner' : user.role === 'admin' ? 'Palace Keeper' : 'Patron'));
    el.innerHTML = `${open ? `<div class="menu">${roles.map(([id, name, sub], i) => `<button data-i="${i}" class="${(user?.id || null) === id ? 'is-active' : ''}">${name}<small>${sub}</small></button>`).join('')}<hr><button data-reset>Reset preview data<small>Restore the seeded Palace</small></button></div>` : ''}
      <button aria-expanded="${open}">Preview as <b>${esc(label)}</b> ${open ? '▾' : '▴'}</button>`;
    el.lastElementChild.onclick = () => { open = !open; draw(); };
    el.querySelectorAll('[data-i]').forEach((b) => { b.onclick = () => { const [id, , , home] = roles[+b.dataset.i]; open = false; if (id) store.signInAs(id); else store.signOut(); draw(); navigate(home); }; });
    const reset = el.querySelector('[data-reset]');
    if (reset) reset.onclick = () => { store.resetDemo(); open = false; draw(); navigate('/'); toast('The preview has been restored.'); };
  };
  document.addEventListener('click', (e) => { if (open && !el.contains(e.target)) { open = false; draw(); } });
  store.subscribe(() => { if (!open) draw(); });
  draw();
}

const desk = document.createElement('div'); desk.id = 'desk-root'; document.body.appendChild(desk);
mountPreviewSwitch();
window.addEventListener('hashchange', renderRoute);
renderRoute();
