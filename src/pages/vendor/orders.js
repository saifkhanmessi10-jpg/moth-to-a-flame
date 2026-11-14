// /atelier/orders — this maison's parcels.
import * as store from '../../store.js';
import { esc, money, pct, mothMark, statusBadge, dateFmt, dateShort, toast, modal, confirmDialog } from '../../ui.js';

export const meta = { title: 'Orders' };

let tab = 'all';
const TABS = [
  ['all', 'All', () => true],
  ['open', 'To prepare', (p) => p.status === 'placed' || p.status === 'preparing'],
  ['shipped', 'Shipped', (p) => p.status === 'shipped'],
  ['delivered', 'Delivered', (p) => p.status === 'delivered'],
  ['refunded', 'Refunded', (p) => p.status === 'refunded'],
];
const NEXT = {
  placed: ['preparing', 'Begin preparing', 'is now being prepared'],
  preparing: ['shipped', 'Mark as shipped', 'has left the atelier'],
  shipped: ['delivered', 'Mark delivered', 'has been delivered'],
};
const EMPTY = {
  all: 'No orders yet. When a patron chooses one of your pieces, the parcel will appear here.',
  open: 'Nothing to prepare. Every parcel has left the atelier.',
  shipped: 'No parcels are in transit at the moment.',
  delivered: 'No parcels have been delivered yet.',
  refunded: 'No refunds. Long may it stay so.',
};
const units = (parcel) => parcel.items.reduce((n, it) => n + it.qty, 0);

export function render({ shop }) {
  const all = store.listParcels({ shopId: shop.id });
  if (!TABS.some((t) => t[0] === tab)) tab = 'all';
  const test = TABS.find((t) => t[0] === tab)[2];
  const rows = all.filter((x) => test(x.parcel));

  return `
    <nav class="tabs" role="tablist" aria-label="Order status">${TABS.map(([id, label, fn]) => `<button class="tab ${id === tab ? 'is-active' : ''}" role="tab" aria-selected="${id === tab}" data-tab="${id}">${label}<span class="vd-tab-count">${all.filter((x) => fn(x.parcel)).length}</span></button>`).join('')}</nav>

    ${rows.length ? `<section class="panel vd-panel-flush">
      <div class="table-wrap" style="padding-top:8px">
        <table class="table">
          <thead><tr><th>Order</th><th>Date</th><th>Patron</th><th>Pieces</th><th class="right">Subtotal</th><th class="right">Palace fee</th><th class="right">Your net</th><th>Status</th><th class="right">Action</th></tr></thead>
          <tbody>${rows.map(({ order, parcel }) => {
            const next = NEXT[parcel.status];
            return `<tr class="vd-row" data-order="${esc(order.id)}">
              <td class="nowrap"><span class="gold">${esc(order.number)}</span></td>
              <td class="nowrap muted">${dateShort(order.createdAt)}</td>
              <td class="nowrap">${esc(order.customer)}${order.giftNote ? ' <span class="faint tiny">· gift</span>' : ''}</td>
              <td style="min-width:200px"><span class="muted small">${esc(parcel.items.map((it) => `${it.qty} × ${it.name}`).join(', '))}</span></td>
              <td class="right vd-figure">${money(parcel.subtotal)}</td>
              <td class="right num muted nowrap">${parcel.fee ? `− ${money(parcel.fee)}` : '—'}</td>
              <td class="right vd-figure gold">${money(parcel.net)}</td>
              <td>${statusBadge(parcel.status)}</td>
              <td class="right nowrap">${next ? `<button class="btn btn-sm btn-gold" data-advance="${esc(order.id)}">${next[1]}</button>` : `<button class="btn btn-sm btn-ghost" data-view="${esc(order.id)}">View</button>`}</td>
            </tr>`;
          }).join('')}</tbody>
        </table>
      </div>
    </section>
    <p class="faint small">Select any row for the delivery address, gift note and the full breakdown. Net proceeds become available for payout once a parcel has shipped.</p>`
    : `<div class="empty">${mothMark(44)}<h2 class="h3">${tab === 'all' ? 'The order book is open' : 'Nothing here'}</h2><p class="mt-1">${EMPTY[tab]}</p>${tab === 'all' ? `<a class="btn btn-ghost btn-sm mt-3" href="#/atelier/products">Review your candles</a>` : ''}</div>`}`;
}

export function mount(root, ctx) {
  const shop = ctx.shop;
  root.querySelectorAll('[data-tab]').forEach((b) => { b.onclick = () => { tab = b.dataset.tab; ctx.refresh(); }; });

  const advance = (orderId) => {
    const order = store.getOrder(orderId); const parcel = order?.parcels.find((p) => p.shopId === shop.id);
    const next = parcel && NEXT[parcel.status];
    if (!next) return;
    const updated = store.updateParcel(order.id, shop.id, { status: next[0] });
    toast(`${order.number} ${next[2]}${next[0] === 'shipped' && updated?.tracking ? ` · tracking ${updated.tracking}` : ''}.`);
    ctx.refresh();
  };

  const view = (orderId) => {
    const order = store.getOrder(orderId); const parcel = order?.parcels.find((p) => p.shopId === shop.id);
    if (!parcel) return;
    const s = order.shipping || {};
    const address = [s.name || order.customer, s.line1, s.line2, [s.city, s.region, s.postal].filter(Boolean).join(', '), s.country].filter(Boolean);
    const next = NEXT[parcel.status];
    const refunded = parcel.status === 'refunded';
    const body = `
      <div class="row row-wrap mb-3" style="--gap:12px">${statusBadge(parcel.status)}<span class="muted small">Placed ${dateFmt(order.createdAt)} · ${units(parcel)} piece${units(parcel) === 1 ? '' : 's'}</span></div>
      <div class="vd-order-grid">
        <div><div class="vd-block-label">Deliver to</div>${address.map((l) => `<div>${esc(l)}</div>`).join('')}${order.email ? `<div class="faint small mt-1">${esc(order.email)}</div>` : ''}</div>
        <div><div class="vd-block-label">Tracking</div>${parcel.tracking ? `<div class="vd-figure">${esc(parcel.tracking)}</div><div class="faint small mt-1">Insured, signature on delivery</div>` : `<div class="muted">Assigned when the parcel is marked as shipped.</div>`}</div>
      </div>
      ${order.giftNote ? `<div class="mt-3"><div class="vd-block-label">Gift note — to be handwritten</div><p class="vd-gift">${esc(order.giftNote)}</p></div>` : ''}
      <ul class="vd-lines">${parcel.items.map((it) => `<li><span>${esc(it.name)}</span><span class="muted num">${it.qty} × ${money(it.price)}</span><span class="vd-figure">${money(it.price * it.qty)}</span></li>`).join('')}</ul>
      <div class="vd-sum">
        <div><span class="muted">Subtotal</span><span class="num">${money(parcel.subtotal)}</span></div>
        <div><span class="muted">Palace fee · ${pct(parcel.feeRate, 0)}</span><span class="num">${refunded ? '—' : parcel.fee ? `− ${money(parcel.fee)}` : money(0)}</span></div>
        <div class="is-total"><span>Your net</span><span>${money(parcel.net)}</span></div>
      </div>
      ${refunded ? `<p class="preview-note mt-3">This parcel was refunded. No fee was taken and nothing is owed to the maison for it.</p>` : ''}`;

    const actions = [];
    if (!refunded) {
      actions.push({ label: 'Refund this parcel', kind: 'danger', onClick: async (_el, close) => {
        const ok = await confirmDialog({ title: `Refund ${order.number}?`, body: `${esc(order.customer)} will be refunded ${money(parcel.subtotal)} for this parcel. The Palace fee is waived and the net is removed from your balance.${parcel.payoutId ? ' As these proceeds were already included in a payout, the amount will be recovered from it or from your next proceeds.' : ''} This cannot be undone.`, confirm: 'Refund parcel', cancel: 'Keep the order', danger: true });
        if (!ok) return;
        store.updateParcel(order.id, shop.id, { status: 'refunded' });
        close(); toast(`${order.number} has been refunded.`); ctx.refresh();
      } });
    }
    actions.push({ label: 'Close', kind: 'ghost' });
    if (next) actions.push({ label: next[1], kind: 'gold', onClick: (_el, close) => { close(); advance(order.id); } });
    modal({ eyebrow: `Order for ${order.customer}`, title: order.number, width: 640, body, actions });
  };

  root.addEventListener('click', (e) => {
    const adv = e.target.closest('[data-advance]');
    if (adv) { advance(adv.dataset.advance); return; }
    const row = e.target.closest('[data-view], [data-order]');
    if (row) view(row.dataset.view || row.dataset.order);
  });
}
