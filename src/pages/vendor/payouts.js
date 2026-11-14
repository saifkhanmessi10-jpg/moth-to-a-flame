// /atelier/payouts — balance, the Palace fee, payout requests and the ledger.
import * as store from '../../store.js';
import { esc, money, pct, num, kpi, mothMark, statusBadge, dateFmt, dateShort, toast, confirmDialog } from '../../ui.js';

export const meta = { title: 'Payouts' };

const ledgerClawback = (shopId) => store.listParcels({ shopId }).reduce((s, x) => s + (x.parcel.status === 'refunded' ? x.parcel.clawback || 0 : 0), 0);
const STATE_LABEL = { paid: 'Paid', requested: 'Requested', available: 'Available', pending: 'In preparation', none: '—' };

export function render({ shop }) {
  const b = store.balance(shop.id);
  // Refunds on parcels already paid out are recovered from the balance; never show or request a negative figure.
  const clawed = ledgerClawback(shop.id);
  const owed = Math.max(0, -b.available);
  b.available = Math.max(0, b.available);
  const rate = store.feeRateFor(shop);
  const settings = store.getSettings();
  const min = settings.minPayout || 0;
  const payouts = store.listPayouts({ shopId: shop.id });
  const byId = new Map(payouts.map((p) => [p.id, p]));
  const ledger = store.listParcels({ shopId: shop.id });
  const method = shop.payoutMethod?.label || 'Not yet connected';
  const connected = !!shop.payoutMethod?.label && !/not yet/i.test(shop.payoutMethod.label);

  let reason = '';
  if (owed > 0) reason = `${money(owed)} from a refunded parcel that had already been paid is being recovered from your next proceeds.`;
  else if (b.available <= 0) reason = b.pending > 0 ? `Nothing is available yet. ${money(b.pending)} will be released as those parcels ship.` : 'Nothing is available yet. Proceeds are released once a parcel has shipped.';
  else if (b.available < min) reason = `The Palace settles payouts from ${money(min)}. You are ${money(min - b.available)} away.`;
  const can = !reason;

  const stateOf = (parcel) => {
    if (parcel.status === 'refunded') return 'none';
    if (parcel.payoutId) return byId.get(parcel.payoutId)?.status === 'paid' ? 'paid' : 'requested';
    return parcel.status === 'shipped' || parcel.status === 'delivered' ? 'available' : 'pending';
  };

  return `
    <section class="panel panel-gold vd-payout-hero">
      <div>
        <div class="eyebrow">Available for payout</div>
        <div class="vd-balance mt-1 ${b.available > 0 ? 'gold' : ''}">${money(b.available)}</div>
        <p class="vd-note mt-2" style="max-width:60ch">${rate > 0
          ? `The Palace keeps <span class="gold">${pct(rate, 0)}</span> of each sale and you keep the rest. The rate is fixed on each parcel when the order is placed, so later changes never rewrite your history.`
          : `As the founding house, no commission applies to your sales. Every sale is yours in full.`}</p>
      </div>
      <div>
        <button class="btn btn-gold" data-request ${can ? '' : 'disabled'}>Request payout</button>
        <p class="faint small mt-2" style="max-width:34ch">${can ? `The Keeper settles requests ${esc(settings.payoutSchedule || 'weekly')}, to ${esc(method)}.` : esc(reason)}</p>
      </div>
    </section>

    <div class="kpis">
      ${kpi('Available', money(b.available))}
      ${kpi('In preparation', money(b.pending))}
      ${kpi('Requested', money(b.requested))}
      ${kpi('Paid to date', money(b.paid))}
      ${kpi('Lifetime gross', money(b.gross))}
      ${kpi('Palace fees', money(b.fees))}
    </div>

    <div class="dash-grid">
      <section class="panel vd-panel-flush">
        <div class="panel-head"><h2 class="h3">Payout history</h2><span class="faint tiny caps">${payouts.length} payout${payouts.length === 1 ? '' : 's'}</span></div>
        ${payouts.length ? `<div class="table-wrap"><table class="table">
          <thead><tr><th>Requested</th><th class="right">Parcels</th><th class="right">Amount</th><th>Status</th><th>Paid</th></tr></thead>
          <tbody>${payouts.map((p) => `<tr><td class="nowrap">${dateFmt(p.requestedAt)}</td><td class="right num">${num(p.parcels)}</td><td class="right vd-figure">${money(p.amount)}</td><td>${statusBadge(p.status)}</td><td class="nowrap muted">${p.paidAt ? dateFmt(p.paidAt) : 'Awaiting the Keeper'}</td></tr>`).join('')}</tbody>
        </table></div>` : `<div class="vd-empty-inline">${mothMark(30)}No payouts yet. Your first request will be recorded here.</div>`}
      </section>

      <section class="panel">
        <div class="panel-head"><h2 class="h3">Payout method</h2><a class="vd-open" href="#/atelier/settings">Change in settings</a></div>
        <div class="row" style="--gap:14px"><span class="badge ${connected ? 'badge-ok' : 'badge-warn'}">${connected ? 'Connected' : 'To connect'}</span><span>${esc(method)}</span></div>
        <ul class="vd-terms mt-2">
          <li><span>Palace fee</span><span class="vd-figure">${rate > 0 ? pct(rate, 0) : 'None'}</span></li>
          <li><span>Smallest payout</span><span class="vd-figure">${money(min)}</span></li>
          <li><span>Settled</span><span style="text-transform:capitalize">${esc(settings.payoutSchedule || 'weekly')}</span></li>
        </ul>
        <p class="hint mt-2">Proceeds from a parcel become available once it has shipped. Refunded parcels carry no fee and no proceeds.${clawed ? ` ${money(clawed)} already paid on refunded parcels has been set against your balance.` : ''}</p>
      </section>
    </div>

    <section class="panel vd-panel-flush">
      <div class="panel-head"><h2 class="h3">Ledger</h2><span class="faint tiny caps">Every parcel, newest first</span></div>
      ${ledger.length ? `<div class="table-wrap"><table class="table">
        <thead><tr><th>Order</th><th>Date</th><th class="right">Gross</th><th class="right">Fee</th><th class="right">Net</th><th>Parcel</th><th>Payout</th></tr></thead>
        <tbody>${ledger.map(({ order, parcel }) => { const st = stateOf(parcel); return `<tr>
          <td class="nowrap gold">${esc(order.number)}</td><td class="nowrap muted">${dateShort(order.createdAt)}</td>
          <td class="right num">${money(parcel.subtotal)}</td><td class="right num muted nowrap">${parcel.fee ? `− ${money(parcel.fee)}` : '—'}</td>
          <td class="right vd-figure">${money(parcel.net)}</td><td>${statusBadge(parcel.status)}</td>
          <td>${parcel.clawback ? `<span class="vd-state is-requested">Recovered − ${money(parcel.clawback)}</span>` : `<span class="vd-state is-${st}">${STATE_LABEL[st]}</span>`}</td></tr>`; }).join('')}</tbody>
      </table></div>` : `<div class="vd-empty-inline">${mothMark(30)}The ledger opens with your first order. Each parcel will be listed with its gross, fee and net.</div>`}
    </section>`;
}

export function mount(root, ctx) {
  const shop = ctx.shop;
  const btn = root.querySelector('[data-request]');
  if (btn) btn.onclick = async () => {
    const b = store.balance(shop.id);
    if (b.available <= 0) return;
    const ok = await confirmDialog({ title: `Request ${money(b.available)}?`, body: `Every shipped and delivered parcel not yet paid will be included, and sent to ${esc(shop.payoutMethod?.label || 'your payout method')} once the Keeper settles it.`, confirm: 'Request payout', cancel: 'Not yet' });
    if (!ok) return;
    const payout = store.requestPayout(shop.id);
    toast(payout ? `Payout of ${money(payout.amount)} requested. The Keeper has been told.` : 'There is nothing available to request just now.');
    ctx.refresh();
  };
}
