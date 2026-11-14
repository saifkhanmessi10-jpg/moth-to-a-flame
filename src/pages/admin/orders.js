// Orders — every parcel across the Palace.
import * as store from '../../store.js';
import { esc, money, pct, num, mothMark, statusBadge, toast, modal, confirmDialog, dateFmt, dateShort, relTime } from '../../ui.js';

export const meta = { title: 'Orders' };

const PAGE = 40;
const LATE_DAYS = 3;
const OPEN = ['placed', 'preparing'];
const STATUSES = ['placed', 'preparing', 'shipped', 'delivered', 'refunded'];
let status = 'all';
let shopId = '';
let q = '';
let lateOnly = false;
let limit = PAGE;

const isLate = ({ order, parcel }) => OPEN.includes(parcel.status) && Date.now() - order.createdAt > LATE_DAYS * store.DAY;
const rateFmt = (r) => pct(r, Number.isInteger(Math.round((r || 0) * 1000) / 10) ? 0 : 1);
const shopName = (id) => store.getShop(id)?.name || 'A former maison';
const itemsLine = (parcel) => parcel.items.map((it) => `${it.qty > 1 ? `${it.qty} × ` : ''}${it.name}`).join(', ');

function filtered() {
  const needle = q.trim().toLowerCase();
  return store.listParcels({}).filter((x) => {
    if (status !== 'all' && x.parcel.status !== status) return false;
    if (shopId && x.parcel.shopId !== shopId) return false;
    if (lateOnly && !isLate(x)) return false;
    if (needle && ![x.order.number, x.order.customer, x.order.email].join(' ').toLowerCase().includes(needle)) return false;
    return true;
  });
}

function listHtml() {
  const all = filtered();
  if (!all.length) return `<div class="empty">${mothMark(44)}<p>No parcels match this view.</p></div>`;
  const rows = all.slice(0, limit);
  return `<div class="table-wrap"><table class="table">
    <thead><tr><th>Order</th><th>Date</th><th>Patron</th><th>Maison</th><th>Items</th><th class="right">Subtotal</th><th class="right">Fee</th><th class="right">Net to maison</th><th>Status</th></tr></thead>
    <tbody>${rows.map((x) => {
      const { order, parcel } = x; const late = isLate(x);
      return `<tr class="${late ? 'ad-late' : ''}">
        <td class="nowrap"><button type="button" class="ad-rowbtn" data-open="${esc(order.id)}" data-shop-id="${esc(parcel.shopId)}">${esc(order.number)}</button></td>
        <td class="nowrap">${dateShort(order.createdAt)}<div class="faint tiny">${relTime(order.createdAt)}</div></td>
        <td>${esc(order.customer || 'A guest')}</td>
        <td>${esc(shopName(parcel.shopId))}</td>
        <td class="ad-items muted small">${esc(itemsLine(parcel))}</td>
        <td class="right ad-num">${money(parcel.subtotal)}</td>
        <td class="right ad-num gold">${money(parcel.fee)}</td>
        <td class="right ad-num">${money(parcel.net)}</td>
        <td class="nowrap">${statusBadge(parcel.status)}${late ? ' <span class="badge badge-warn badge-plain">Late</span>' : ''}</td>
      </tr>`;
    }).join('')}</tbody></table></div>
    <div class="row between row-wrap mt-2">
      <p class="faint small">Showing ${num(rows.length)} of ${num(all.length)} parcel${all.length === 1 ? '' : 's'}.</p>
      ${all.length > rows.length ? '<button type="button" class="btn btn-ghost btn-sm" data-more>Show more</button>' : ''}
    </div>`;
}

export function render() {
  const all = store.listParcels({});
  const counts = { all: all.length };
  STATUSES.forEach((s) => { counts[s] = all.filter((x) => x.parcel.status === s).length; });
  const lateCount = all.filter(isLate).length;
  const shops = store.listShops();
  return `
  <div class="tabs" role="tablist" aria-label="Parcel status">
    ${[['all', 'All'], ...STATUSES.map((s) => [s, s])].map(([id, label]) => `<button type="button" role="tab" aria-selected="${id === status}" class="tab ${id === status ? 'is-active' : ''}" data-status="${id}">${esc(label)} <span class="ad-count">${counts[id]}</span></button>`).join('')}
  </div>
  <div class="ad-toolbar">
    <label class="field ad-search"><span class="label">Search orders</span><input class="input" type="search" data-q value="${esc(q)}" placeholder="Order number or patron" autocomplete="off"></label>
    <label class="field ad-narrow"><span class="label">Maison</span><select class="select" data-shop>
      <option value="">All maisons</option>${shops.map((s) => `<option value="${esc(s.id)}" ${s.id === shopId ? 'selected' : ''}>${esc(s.name)}</option>`).join('')}</select></label>
    <button type="button" class="chip ${lateOnly ? 'is-active' : ''}" data-late aria-pressed="${lateOnly}">Late to dispatch · ${lateCount}</button>
  </div>
  <section class="panel" data-list>${listHtml()}</section>
  <p class="preview-note">A parcel is late when it is still placed or in preparation more than ${LATE_DAYS} days after the order. The fee and net shown are the amounts frozen on the parcel at checkout.</p>`;
}

function openParcel(orderId, parcelShopId, ctx) {
  const order = store.getOrder(orderId); const parcel = order?.parcels.find((p) => p.shopId === parcelShopId);
  if (!parcel) return;
  const ship = order.shipping || {};
  const address = [ship.name, ship.line1, ship.line2, [ship.city, ship.region, ship.postal].filter(Boolean).join(', '), ship.country].filter(Boolean);
  const refunded = parcel.status === 'refunded';
  const late = isLate({ order, parcel });
  const line = (label, value, cls = '') => `<div class="ad-line ${cls}"><span>${label}</span><span class="ad-num">${value}</span></div>`;
  const m = modal({
    eyebrow: `${shopName(parcel.shopId)} · ${dateFmt(order.createdAt)}`, title: `Order ${order.number}`, width: 680,
    body: `<div class="ad-manage">
      <div class="row row-wrap" style="--gap:10px">${statusBadge(parcel.status)}${late ? '<span class="badge badge-warn badge-plain">Late to dispatch</span>' : ''}${parcel.payoutId ? '<span class="badge badge-plain">In a payout</span>' : ''}</div>
      <div class="ad-split">
        <div><div class="label">Deliver to</div>${address.length ? address.map((l) => `<div>${esc(l)}</div>`).join('') : '<div class="muted">No address on record</div>'}
          ${order.email ? `<div class="faint small mt-1">${esc(order.email)}</div>` : ''}</div>
        <div><div class="label">Tracking</div><div class="num">${parcel.tracking ? esc(parcel.tracking) : '<span class="muted">Not yet dispatched</span>'}</div>
          <div class="label mt-2">Gift note</div><div class="${order.giftNote ? 'ad-quote' : 'muted'}">${order.giftNote ? esc(order.giftNote) : 'None'}</div></div>
      </div>
      <h3 class="ad-sub">Items in this parcel</h3>
      <div>${parcel.items.map((it) => line(`${esc(it.name)} <span class="faint">× ${num(it.qty)}</span>`, money(it.price * it.qty))).join('')}</div>
      <h3 class="ad-sub">Money</h3>
      <div>
        ${line('Subtotal', money(parcel.subtotal))}
        ${line(`Palace fee <span class="faint">· ${rateFmt(parcel.feeRate)} at checkout</span>`, money(parcel.fee), 'gold')}
        ${line('Net to maison', money(parcel.net), 'ad-line-total')}
      </div>
      ${order.parcels.length > 1 ? `<p class="faint small">This order holds ${order.parcels.length} parcels, one per maison. The order total is ${money(order.total)}.</p>` : ''}
      <h3 class="ad-sub">Keeper actions</h3>
      ${refunded ? '<p class="muted small">This parcel has been refunded. Its fee and net proceeds are zero, and its status is final.</p>' : `
      <div class="ad-inline-form">
        <label class="field"><span class="label">Parcel status</span><select class="select" data-set-status>${STATUSES.filter((s) => s !== 'refunded').map((s) => `<option value="${s}" ${s === parcel.status ? 'selected' : ''}>${s[0].toUpperCase()}${s.slice(1)}</option>`).join('')}</select></label>
        <button type="button" class="btn btn-gold btn-sm" data-apply>Update status</button>
        <button type="button" class="btn btn-danger btn-sm" data-refund>Refund parcel</button>
      </div>`}
    </div>`,
    actions: [{ label: 'Close', kind: 'ghost' }],
  });
  const el = m.el;
  const apply = el.querySelector('[data-apply]');
  if (apply) apply.onclick = () => {
    const next = el.querySelector('[data-set-status]').value;
    if (next === parcel.status) { toast('The parcel already has that status.'); return; }
    store.updateParcel(order.id, parcel.shopId, { status: next });
    m.close(); toast(`${order.number} is now ${next}.`); ctx.refresh();
  };
  const refund = el.querySelector('[data-refund]');
  if (refund) refund.onclick = async () => {
    const ok = await confirmDialog({
      title: `Refund ${order.number}?`,
      body: `${money(parcel.subtotal)} will be returned to ${esc(order.customer || 'the patron')}. The Palace fee of ${money(parcel.fee)} and the ${money(parcel.net)} due to ${esc(shopName(parcel.shopId))} are both cancelled. This cannot be undone.${parcel.payoutId ? ' This parcel is already part of a payout, so that payout will need to be reconciled with the maison separately.' : ''}`,
      confirm: 'Refund parcel', danger: true,
    });
    if (!ok) return;
    store.updateParcel(order.id, parcel.shopId, { status: 'refunded' });
    m.close(); toast(`${order.number} has been refunded.`); ctx.refresh();
  };
}

export function mount(root, ctx) {
  const list = root.querySelector('[data-list]');
  const redraw = () => { list.innerHTML = listHtml(); };
  root.querySelectorAll('[data-status]').forEach((b) => { b.onclick = () => { status = b.dataset.status; limit = PAGE; ctx.refresh(); }; });
  root.querySelector('[data-shop]').onchange = (e) => { shopId = e.target.value; limit = PAGE; redraw(); };
  root.querySelector('[data-late]').onclick = () => { lateOnly = !lateOnly; limit = PAGE; ctx.refresh(); };
  root.querySelector('[data-q]').addEventListener('input', (e) => { q = e.target.value; limit = PAGE; redraw(); });
  list.addEventListener('click', (e) => {
    if (e.target.closest('[data-more]')) { limit += PAGE; redraw(); return; }
    const b = e.target.closest('[data-open]');
    if (b) openParcel(b.dataset.open, b.dataset.shopId, ctx);
  });
}
