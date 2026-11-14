// Fees & Payouts — the Palace fee, what it earns, and what is owed to the maisons.
import * as store from '../../store.js';
import { esc, money, pct, num, mothMark, monogram, barChart, barList, toast, confirmDialog, dateFmt, dateShort, relTime } from '../../ui.js';

export const meta = { title: 'Fees & Payouts' };

const RANGES = [[7, '7 days'], [30, '30 days'], [60, '60 days'], [0, 'All time']];
let range = 30;

const rateFmt = (r) => pct(r, Number.isInteger(Math.round((r || 0) * 1000) / 10) ? 0 : 1);
const dollars = (cents) => `$${num(Math.round((cents || 0) / 100))}`;
const tile = (label, value, sub = '') => `<div class="kpi"><div class="k-label">${esc(label)}</div><div class="k-value">${value}</div>${sub ? `<div class="k-delta">${esc(sub)}</div>` : ''}</div>`;
const shopCell = (shop) => (shop ? `<div class="ad-cell">${monogram(shop, 34)}<span class="grow"><b>${esc(shop.name)}</b></span></div>` : '<span class="faint">A former maison</span>');

/** Fees per maison and per day over the chosen range, from the parcels themselves. */
function feeBreakdown() {
  const parcels = store.listParcels({});
  const now = Date.now();
  const oldest = parcels.reduce((t, x) => Math.min(t, x.order.createdAt), now);
  const days = range || Math.min(120, Math.max(7, Math.ceil((now - oldest) / store.DAY) + 1));
  const since = range ? now - range * store.DAY : 0;
  const keys = []; for (let i = days - 1; i >= 0; i--) keys.push(store.dayKey(now - i * store.DAY));
  const perDay = Object.fromEntries(keys.map((k) => [k, 0]));
  const perShop = new Map();
  parcels.forEach(({ order, parcel }) => {
    if (parcel.status === 'refunded' || order.createdAt < since) return;
    perShop.set(parcel.shopId, (perShop.get(parcel.shopId) || 0) + parcel.fee);
    const k = store.dayKey(order.createdAt);
    if (k in perDay) perDay[k] += parcel.fee;
  });
  return { keys, values: keys.map((k) => perDay[k]), perShop };
}

export function render() {
  const settings = store.getSettings();
  const shops = store.listShops();
  const custom = shops.filter((s) => s.feeOverride != null);
  const fin = store.palaceFinance(range || undefined);
  const take = fin.gmv ? fin.fees / fin.gmv : 0;
  const label = RANGES.find(([d]) => d === range)[1].toLowerCase();
  const fees = feeBreakdown();
  const byShop = (range ? store.shopLeague(range).map((r) => ({ shop: r.shop, fees: r.fees })) : shops.map((shop) => ({ shop, fees: fees.perShop.get(shop.id) || 0 })))
    .sort((a, b) => b.fees - a.fees);
  const requests = store.listPayouts({ status: 'requested' });
  const history = store.listPayouts({ status: 'paid' }).sort((a, b) => (b.paidAt || 0) - (a.paidAt || 0)).slice(0, 30);
  const balances = shops.map((shop) => ({ shop, b: store.balance(shop.id) }));
  const sum = (k) => balances.reduce((t, x) => t + x.b[k], 0);
  const minPayout = settings.minPayout || 0;

  return `
  <section class="panel panel-gold ad-fee">
    <div>
      <div class="eyebrow">The Palace fee</div>
      <div class="ad-fee-rate mt-2">${rateFmt(settings.feeRate)}</div>
      <p class="muted mt-2">Taken from every parcel at checkout. The maison receives the remainder as its net proceeds.</p>
    </div>
    <div>
      <form class="ad-inline-form" data-fee-form novalidate>
        <label class="field"><span class="label">Palace rate (%)</span><input class="input" type="number" name="rate" min="0" max="30" step="0.5" inputmode="decimal" value="${+((settings.feeRate || 0) * 100).toFixed(2)}"></label>
        <button class="btn btn-gold btn-sm">Change the rate</button>
      </form>
      <p class="hint" data-fee-error hidden>Enter a rate between 0 and 30.</p>
      <p class="preview-note mt-2">A new rate applies to new orders only. The rate is frozen on each parcel at checkout, so past orders and balances never change.</p>
      <div class="label mt-3">Maisons on a custom rate</div>
      ${custom.length ? `<ul class="ad-rates">${custom.map((s) => `<li><span>${esc(s.name)}</span><span class="ad-num gold">${rateFmt(s.feeOverride)}</span></li>`).join('')}</ul>` : '<p class="muted small">None. Every maison pays the Palace rate.</p>'}
      <a class="link-arrow mt-2" href="#/keeper/maisons">Set a custom rate on a maison</a>
    </div>
  </section>

  <div class="page-head">
    <div><div class="eyebrow">Money through the Palace</div><h2 class="h3 mt-1">${range ? `The last ${range} days` : 'All time'}</h2></div>
    <div class="chips" role="group" aria-label="Date range">${RANGES.map(([d, l]) => `<button type="button" class="chip ${d === range ? 'is-active' : ''}" data-range="${d}" aria-pressed="${d === range}">${l}</button>`).join('')}</div>
  </div>
  <div class="kpis">
    ${tile('Sales through the Palace', money(fin.gmv), 'Refunded parcels excluded')}
    ${tile('Palace fees earned', `<span class="gold">${money(fin.fees)}</span>`, 'Kept by the Palace')}
    ${tile('Passed on to maisons', money(fin.net), 'Net proceeds')}
    ${tile('Orders', num(fin.orders), `${num(fin.parcels)} parcels`)}
    ${tile('Average order', money(fin.aov))}
    ${tile('Effective take rate', pct(take), 'Fees ÷ sales')}
  </div>

  <div class="ad-two">
    <section class="panel">
      <div class="panel-head"><div><div class="eyebrow">Fees by maison</div><h3 class="h3 mt-1">Where the fees come from</h3></div><span class="faint small">${esc(label)}</span></div>
      ${byShop.length ? barList(byShop.map((r) => ({ label: r.shop.name, value: r.fees, display: money(r.fees) }))) : '<p class="muted">No maisons yet.</p>'}
    </section>
    <section class="panel">
      <div class="panel-head"><div><div class="eyebrow">Fees per day</div><h3 class="h3 mt-1">Daily fee income</h3></div><span class="faint small">${fees.keys.length} days</span></div>
      ${barChart(fees.values, { labels: fees.keys.map((k) => dateShort(`${k}T12:00:00`)), format: dollars, height: 220 })}
    </section>
  </div>

  <section class="panel ${requests.length ? 'panel-gold' : ''}">
    <div class="panel-head"><div><div class="eyebrow">Payout requests</div><h3 class="h3 mt-1">${requests.length ? `${requests.length} awaiting settlement · ${money(requests.reduce((t, p) => t + p.amount, 0))}` : 'Nothing awaiting settlement'}</h3></div>
      <span class="faint small">Minimum payout ${money(minPayout)} · ${esc(settings.payoutSchedule || 'weekly')}</span></div>
    ${requests.length ? `<div class="table-wrap"><table class="table">
      <thead><tr><th>Maison</th><th class="right">Amount</th><th class="right">Parcels</th><th>Requested</th><th>Paid to</th><th class="right">Action</th></tr></thead>
      <tbody>${requests.map((p) => { const shop = store.getShop(p.shopId); return `<tr>
        <td>${shopCell(shop)}</td>
        <td class="right ad-num gold">${money(p.amount)}${p.amount < minPayout ? '<div class="faint tiny">Below the minimum</div>' : ''}</td>
        <td class="right num">${num(p.parcels)}</td>
        <td class="nowrap">${dateFmt(p.requestedAt)}<div class="faint tiny">${relTime(p.requestedAt)}</div></td>
        <td class="muted small">${esc(shop?.payoutMethod?.label || 'Not yet connected')}</td>
        <td class="right"><button type="button" class="btn btn-gold btn-sm" data-settle="${esc(p.id)}">Settle</button></td>
      </tr>`; }).join('')}</tbody></table></div>` : `<div class="empty">${mothMark(44)}<p>When a maison requests its available balance, it will wait here for you to settle.</p></div>`}
  </section>

  <section class="panel">
    <div class="panel-head"><div><div class="eyebrow">Outstanding balances</div><h3 class="h3 mt-1">What each maison is owed</h3></div></div>
    <div class="table-wrap"><table class="table">
      <thead><tr><th>Maison</th><th class="right">Available</th><th class="right">In preparation</th><th class="right">Requested</th><th class="right">Paid to date</th><th class="right">Fees to date</th></tr></thead>
      <tbody>${balances.map(({ shop, b }) => `<tr>
        <td>${shopCell(shop)}</td>
        <td class="right ad-num">${money(b.available)}</td>
        <td class="right ad-num muted">${money(b.pending)}</td>
        <td class="right ad-num ${b.requested ? 'ad-hot' : 'muted'}">${money(b.requested)}</td>
        <td class="right ad-num muted">${money(b.paid)}</td>
        <td class="right ad-num gold">${money(b.fees)}</td>
      </tr>`).join('')}
      <tr class="ad-total"><td>All maisons</td><td class="right ad-num">${money(sum('available'))}</td><td class="right ad-num">${money(sum('pending'))}</td><td class="right ad-num">${money(sum('requested'))}</td><td class="right ad-num">${money(sum('paid'))}</td><td class="right ad-num gold">${money(sum('fees'))}</td></tr>
      </tbody></table></div>
    <p class="faint small mt-2">Net proceeds become available once a parcel has shipped. Until then they are in preparation.</p>
  </section>

  <section class="panel">
    <div class="panel-head"><div><div class="eyebrow">Payout history</div><h3 class="h3 mt-1">Settled payouts</h3></div><span class="faint small">Most recent ${history.length}</span></div>
    ${history.length ? `<div class="table-wrap"><table class="table">
      <thead><tr><th>Maison</th><th class="right">Amount</th><th class="right">Parcels</th><th>Requested</th><th>Settled</th></tr></thead>
      <tbody>${history.map((p) => `<tr>
        <td>${shopCell(store.getShop(p.shopId))}</td>
        <td class="right ad-num">${money(p.amount)}</td>
        <td class="right num">${num(p.parcels)}</td>
        <td class="nowrap muted">${dateFmt(p.requestedAt)}</td>
        <td class="nowrap">${p.paidAt ? dateFmt(p.paidAt) : '<span class="faint">Not recorded</span>'}</td>
      </tr>`).join('')}</tbody></table></div>` : '<p class="muted">No payouts have been settled yet.</p>'}
  </section>`;
}

export function mount(root, ctx) {
  root.querySelectorAll('[data-range]').forEach((b) => { b.onclick = () => { range = Number(b.dataset.range); ctx.refresh(); }; });

  const form = root.querySelector('[data-fee-form]');
  form.onsubmit = async (e) => {
    e.preventDefault();
    const raw = form.querySelector('[name="rate"]').value.trim();
    const v = Number(raw);
    const err = root.querySelector('[data-fee-error]');
    if (raw === '' || !isFinite(v) || v < 0 || v > 30) { err.hidden = false; return; }
    err.hidden = true;
    const rate = +(v / 100).toFixed(4);
    const current = store.getSettings().feeRate;
    if (rate === current) { toast('The Palace rate is already set to that.'); return; }
    const ok = await confirmDialog({
      title: 'Change the Palace fee?',
      body: `The rate moves from ${rateFmt(current)} to ${rateFmt(rate)} for every maison without a custom rate. It applies to new orders only: the rate is frozen on each parcel at checkout, so existing orders, balances and payouts stay exactly as they are.`,
      confirm: `Set to ${rateFmt(rate)}`,
    });
    if (!ok) return;
    store.updateSettings({ feeRate: rate });
    toast(`The Palace fee is now ${rateFmt(rate)}.`);
    ctx.refresh();
  };

  root.querySelectorAll('[data-settle]').forEach((b) => {
    b.onclick = async () => {
      const p = store.listPayouts({ status: 'requested' }).find((x) => x.id === b.dataset.settle); if (!p) return;
      const name = store.getShop(p.shopId)?.name || 'the maison';
      const ok = await confirmDialog({ title: 'Settle this payout?', body: `${money(p.amount)} for ${num(p.parcels)} parcel${p.parcels === 1 ? '' : 's'} will be marked as paid to ${esc(name)}, and the maison will be notified. In this preview no money moves.`, confirm: `Settle ${money(p.amount)}` });
      if (!ok) return;
      store.settlePayout(p.id);
      toast(`${money(p.amount)} settled to ${name}.`);
      ctx.refresh();
    };
  });
}
