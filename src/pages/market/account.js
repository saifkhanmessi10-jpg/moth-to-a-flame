// The patron's private rooms: orders, saved pieces, followed maisons, details.
import * as store from '../../store.js';
import { esc, money, icon, mothMark, productCard, maisonCard, statusBadge, dateFmt, formData, toast } from '../../ui.js';

export const meta = { title: 'Your account' };

const TABS = [['orders', 'Orders'], ['saved', 'Saved pieces'], ['maisons', 'Maisons you follow'], ['details', 'Details']];
const tabOf = (query) => (TABS.some((t) => t[0] === query.get('tab')) ? query.get('tab') : 'orders');

const none = (text, href, label) => `<div class="empty">${mothMark()}<p>${text}</p><a class="link-arrow mt-3" href="${href}">${label}</a></div>`;

function orders(user) {
  const list = store.listOrders({ userId: user.id });
  if (!list.length) return none('You have not placed an order yet.', '#/palace/search', 'The Collection');
  return `<ul class="mk-orders">${list.map((o) => {
    const parcels = o.parcels || [];
    const units = parcels.reduce((n, p) => n + p.items.reduce((m, it) => m + it.qty, 0), 0);
    return `<li><a class="panel mk-order-card" href="#/palace/order/${esc(o.id)}">
      <div class="row between row-wrap">
        <div><div class="caps faint">${dateFmt(o.createdAt)}</div><div class="h3 mt-1">Order ${esc(o.number)}</div></div>
        <div class="right"><div class="num gold">${money(o.total)}</div><div class="tiny faint">${units} ${units === 1 ? 'piece' : 'pieces'}</div></div>
      </div>
      <ul class="mk-order-parcels mt-2">
        ${parcels.map((p) => `<li><span class="grow"><span class="small">${esc(store.getShop(p.shopId)?.name || 'A maison of the Palace')}</span>
          <span class="tiny faint mk-clip">${esc(p.items.map((it) => `${it.name}${it.qty > 1 ? ` × ${it.qty}` : ''}`).join(', '))}</span></span>${statusBadge(p.status)}</li>`).join('')}
      </ul>
      <span class="link-arrow mt-2">View order</span>
    </a></li>`;
  }).join('')}</ul>`;
}

function saved(user) {
  const list = (user.wishlist || []).map((id) => store.getProduct(id))
    .filter((p) => p && p.status === 'live' && store.getShop(p.shopId)?.status === 'live');
  if (!list.length) return none('Nothing saved yet. Tap the heart on any piece to keep it here.', '#/palace/search', 'The Collection');
  return `<div class="grid cols-4" data-saved>${list.map((p) => productCard(p)).join('')}</div>`;
}

function maisons(user) {
  const list = (user.following || []).map((id) => store.getShop(id)).filter((s) => s && s.status === 'live');
  if (!list.length) return none('You are not following a maison yet.', '#/palace/maisons', 'Visit the maisons');
  return `<div class="mk-maison-grid">${list.map((s) => maisonCard(s)).join('')}</div>`;
}

function details(user) {
  const a = user.address || {};
  const f = (name, label, value, { type = 'text', auto = '', span = false } = {}) => `<div class="field ${span ? 'span-2' : ''}">
    <label class="label" for="mk-ac-${name}">${label}</label>
    <input class="input" id="mk-ac-${name}" name="${name}" type="${type}" value="${esc(value || '')}" ${auto ? `autocomplete="${auto}"` : ''}>
    ${name === 'name' || name === 'email' ? `<p class="mk-err" data-err="${name}" hidden></p>` : ''}</div>`;
  return `<form class="panel mk-details-form" data-details novalidate>
    <h2 class="h3">Your details</h2>
    <div class="form-grid mt-3">
      ${f('name', 'Full name', user.name, { auto: 'name' })}
      ${f('email', 'Email', user.email, { type: 'email', auto: 'email' })}
    </div>
    <h3 class="caps gold mt-4 mb-2">Delivery address</h3>
    <div class="form-grid">
      ${f('line1', 'Address', a.line1, { auto: 'address-line1', span: true })}
      ${f('city', 'City', a.city, { auto: 'address-level2' })}
      ${f('region', 'State / region', a.region, { auto: 'address-level1' })}
      ${f('postal', 'Postal code', a.postal, { auto: 'postal-code' })}
      ${f('country', 'Country', a.country, { auto: 'country-name' })}
    </div>
    <button class="btn btn-gold mt-4" type="submit">Save details</button>
  </form>`;
}

export function render(ctx) {
  const user = ctx.user;
  const tab = tabOf(ctx.query);
  const first = String(user.name || '').trim().split(/\s+/)[0];
  const wing = user.role === 'vendor' ? ['#/atelier', 'Enter your atelier', 'You are a resident maker.']
    : user.role === 'admin' ? ['#/keeper', 'The Keeper’s Office', 'You hold the keys to the Palace.'] : null;
  const body = tab === 'saved' ? saved(user) : tab === 'maisons' ? maisons(user) : tab === 'details' ? details(user) : orders(user);
  const counts = { orders: store.listOrders({ userId: user.id }).length, saved: (user.wishlist || []).length, maisons: (user.following || []).length };

  return `<section class="section-tight">
    <div class="container">
      <header class="mk-head">
        <div><div class="eyebrow">Your account</div><h1 class="h1 mt-1">Welcome back${first ? `, ${esc(first)}` : ''}</h1>
          <p class="muted mt-1">${esc(user.email || '')}</p></div>
        <button class="btn btn-ghost btn-sm" type="button" data-out>${icon('out')} Sign out</button>
      </header>
      ${wing ? `<a class="mk-wing" href="${wing[0]}"><span class="muted">${wing[2]}</span><span class="link-arrow">${wing[1]}</span></a>` : ''}
      <nav class="tabs" aria-label="Account sections">
        ${TABS.map(([id, label]) => `<a class="tab ${tab === id ? 'is-active' : ''}" href="#/account?tab=${id}" ${tab === id ? 'aria-current="page"' : ''}>${label}${counts[id] ? ` <span class="faint num">${counts[id]}</span>` : ''}</a>`).join('')}
      </nav>
      <div class="mt-4">${body}</div>
    </div>
  </section>`;
}

export function mount(root, ctx) {
  root.querySelector('[data-out]').addEventListener('click', () => {
    store.signOut();
    ctx.navigate('/palace');
    toast('You have been signed out.');
  });

  // The global handler toggles the wishlist; once it has run, drop the card from this list.
  const savedGrid = root.querySelector('[data-saved]');
  if (savedGrid) savedGrid.addEventListener('click', (e) => { if (e.target.closest('[data-wish]')) setTimeout(() => ctx.refresh(), 0); });

  const form = root.querySelector('[data-details]');
  if (form) form.addEventListener('submit', (e) => {
    e.preventDefault();
    const d = formData(form);
    const fail = (name, message) => { const el = form.querySelector(`[data-err="${name}"]`); el.textContent = message; el.hidden = !message; return !!message; };
    const emailTaken = store.listUsers().some((u) => u.id !== ctx.user.id && (u.email || '').toLowerCase() === d.email.toLowerCase());
    const badName = fail('name', d.name ? '' : 'Please enter your name.');
    const badEmail = fail('email', !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email) ? 'Please enter a complete email address.' : emailTaken ? 'Another account already uses that address.' : '');
    if (badName || badEmail) { form.querySelector(`[name="${badName ? 'name' : 'email'}"]`).focus(); return; }
    const address = { line1: d.line1, city: d.city, region: d.region, postal: d.postal, country: d.country };
    store.updateUser(ctx.user.id, { name: d.name, email: d.email, address: Object.values(address).some(Boolean) ? address : null });
    toast('Your details have been saved.');
    ctx.refresh();
  });
}
