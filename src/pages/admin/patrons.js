// Patrons & Makers — the people of the Palace.
import * as store from '../../store.js';
import { esc, money, num, mothMark, statusBadge, modal, dateFmt } from '../../ui.js';

export const meta = { title: 'Patrons' };

const SORTS = [['spend', 'Lifetime spend'], ['orders', 'Orders'], ['recent', 'Newest'], ['name', 'Name']];
let tab = 'patrons';
let q = '';
let sort = 'spend';

function patronRows() {
  return store.listUsers({ role: 'patron' }).map((u) => {
    const orders = store.listOrders({ userId: u.id });
    let spend = 0;
    orders.forEach((o) => o.parcels.forEach((p) => { if (p.status !== 'refunded') spend += p.subtotal; }));
    return { u, orders: orders.length, spend, saved: (u.wishlist || []).length, following: (u.following || []).length };
  });
}
const SORTERS = {
  spend: (a, b) => b.spend - a.spend, orders: (a, b) => b.orders - a.orders,
  recent: (a, b) => (b.u.createdAt || 0) - (a.u.createdAt || 0), name: (a, b) => String(a.u.name).localeCompare(String(b.u.name)),
};
const matches = (u, extra = '') => { const n = q.trim().toLowerCase(); return !n || [u.name, u.email, extra].join(' ').toLowerCase().includes(n); };
const joined = (u) => (u.createdAt ? dateFmt(u.createdAt) : '<span class="faint">Not recorded</span>');

function listHtml() {
  if (tab === 'makers') {
    const makers = store.listUsers({ role: 'vendor' }).map((u) => ({ u, shop: u.shopId ? store.getShop(u.shopId) : null })).filter((x) => matches(x.u, x.shop?.name));
    if (!makers.length) return `<div class="empty">${mothMark(44)}<p>No maker matches this search.</p></div>`;
    return `<div class="table-wrap"><table class="table">
      <thead><tr><th>Maker</th><th>Email</th><th>Maison</th><th>Maison status</th><th>Joined</th></tr></thead>
      <tbody>${makers.map(({ u, shop }) => `<tr>
        <td><b class="ad-name">${esc(u.name)}</b></td>
        <td class="muted">${esc(u.email)}</td>
        <td>${shop ? `<a class="link" href="#/keeper/maisons">${esc(shop.name)}</a>` : '<span class="faint">No maison</span>'}</td>
        <td>${shop ? statusBadge(shop.status) : ''}</td>
        <td class="nowrap">${joined(u)}</td>
      </tr>`).join('')}</tbody></table></div>
      <p class="faint small mt-2">${makers.length} maker${makers.length === 1 ? '' : 's'} shown.</p>`;
  }
  const rows = patronRows().filter((r) => matches(r.u)).sort(SORTERS[sort] || SORTERS.spend);
  if (!rows.length) return `<div class="empty">${mothMark(44)}<p>No patron matches this search.</p></div>`;
  return `<div class="table-wrap"><table class="table">
    <thead><tr><th>Patron</th><th>Email</th><th>Joined</th><th class="right">Orders</th><th class="right">Lifetime spend</th><th class="right">Saved pieces</th><th class="right">Maisons followed</th></tr></thead>
    <tbody>${rows.map((r) => `<tr>
      <td><button type="button" class="ad-rowbtn ad-name" data-user="${esc(r.u.id)}">${esc(r.u.name)}</button></td>
      <td class="muted">${esc(r.u.email)}</td>
      <td class="nowrap">${joined(r.u)}</td>
      <td class="right num">${num(r.orders)}</td>
      <td class="right ad-num ${r.spend ? 'gold' : 'muted'}">${money(r.spend)}</td>
      <td class="right num">${num(r.saved)}</td>
      <td class="right num">${num(r.following)}</td>
    </tr>`).join('')}</tbody></table></div>
    <p class="faint small mt-2">${rows.length} patron${rows.length === 1 ? '' : 's'} shown. Lifetime spend excludes refunded parcels.</p>`;
}

export function render() {
  const patrons = store.listUsers({ role: 'patron' }).length;
  const makers = store.listUsers({ role: 'vendor' }).length;
  return `
  <div class="tabs" role="tablist" aria-label="People">
    <button type="button" role="tab" aria-selected="${tab === 'patrons'}" class="tab ${tab === 'patrons' ? 'is-active' : ''}" data-tab="patrons">Patrons <span class="ad-count">${patrons}</span></button>
    <button type="button" role="tab" aria-selected="${tab === 'makers'}" class="tab ${tab === 'makers' ? 'is-active' : ''}" data-tab="makers">Makers <span class="ad-count">${makers}</span></button>
  </div>
  <div class="ad-toolbar">
    <label class="field ad-search"><span class="label">Search ${tab === 'makers' ? 'makers' : 'patrons'}</span><input class="input" type="search" data-q value="${esc(q)}" placeholder="${tab === 'makers' ? 'Name, email or maison' : 'Name or email'}" autocomplete="off"></label>
    ${tab === 'patrons' ? `<label class="field ad-narrow"><span class="label">Sort by</span><select class="select" data-sort>${SORTS.map(([id, l]) => `<option value="${id}" ${id === sort ? 'selected' : ''}>${l}</option>`).join('')}</select></label>` : ''}
  </div>
  <section class="panel" data-list>${listHtml()}</section>`;
}

function openPatron(userId) {
  const u = store.getUser(userId); if (!u) return;
  const orders = store.listOrders({ userId: u.id });
  const following = (u.following || []).map((id) => store.getShop(id)?.name).filter(Boolean);
  modal({
    eyebrow: 'Patron', title: u.name, width: 700,
    body: `<div class="ad-manage">
      <p class="muted">${esc(u.email)}${u.createdAt ? ` · joined ${dateFmt(u.createdAt)}` : ''}</p>
      ${following.length ? `<p class="small"><span class="label">Follows</span>${esc(following.join(', '))}</p>` : ''}
      <h3 class="ad-sub">Orders · ${orders.length}</h3>
      ${orders.length ? `<div class="table-wrap"><table class="table">
        <thead><tr><th>Order</th><th>Date</th><th class="right">Total</th><th>Parcels</th></tr></thead>
        <tbody>${orders.map((o) => `<tr>
          <td class="nowrap num">${esc(o.number)}</td>
          <td class="nowrap">${dateFmt(o.createdAt)}</td>
          <td class="right ad-num">${money(o.total)}</td>
          <td><div class="ad-parcels">${o.parcels.map((p) => `<span>${esc(store.getShop(p.shopId)?.name || 'A former maison')} ${statusBadge(p.status)}</span>`).join('')}</div></td>
        </tr>`).join('')}</tbody></table></div>` : '<p class="muted">This patron has not placed an order yet.</p>'}
    </div>`,
    actions: [{ label: 'Close', kind: 'ghost' }],
  });
}

export function mount(root, ctx) {
  const list = root.querySelector('[data-list]');
  root.querySelectorAll('[data-tab]').forEach((b) => { b.onclick = () => { tab = b.dataset.tab; q = ''; ctx.refresh(); }; });
  root.querySelector('[data-q]').addEventListener('input', (e) => { q = e.target.value; list.innerHTML = listHtml(); });
  const sel = root.querySelector('[data-sort]');
  if (sel) sel.onchange = () => { sort = sel.value; list.innerHTML = listHtml(); };
  list.addEventListener('click', (e) => { const b = e.target.closest('[data-user]'); if (b) openPatron(b.dataset.user); });
}
