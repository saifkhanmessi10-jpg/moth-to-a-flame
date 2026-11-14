// /atelier/analytics — traffic, sales and the path from visit to order.
import * as store from '../../store.js';
import { esc, money, pct, num, kpi, mothMark, lineChart, barChart, barList, dateShort } from '../../ui.js';

export const meta = { title: 'Analytics' };

let days = 30;
const dollars = (v) => `$${num(Math.round(v / 100))}`;

export function render({ shop }) {
  const m = store.metrics(shop.id, days);
  const t = m.totals;
  const labels = m.series.map((_, i) => dateShort(Date.now() - (m.series.length - 1 - i) * store.DAY));
  const top = store.topProducts(shop.id, days, 6);
  const aov = t.orders ? Math.round(t.revenue / t.orders) : 0;
  const prevAov = m.prev.orders ? Math.round(m.prev.revenue / m.prev.orders) : 0;
  const aovDelta = prevAov ? (aov - prevAov) / prevAov : null;
  const quiet = !t.visits && !t.orders && !t.productViews && !t.chats;
  const everything = store.metrics(shop.id, 60).totals;
  const neverVisited = quiet && !everything.visits && !everything.orders && !store.listParcels({ shopId: shop.id }).length;

  const range = `<div class="vd-toolbar">
      <div class="eyebrow">The last ${days} days · compared with the ${days} before</div>
      <div class="chips" role="group" aria-label="Range">${[7, 30, 60].map((d) => `<button class="chip ${d === days ? 'is-active' : ''}" data-days="${d}" aria-pressed="${d === days}">${d} days</button>`).join('')}</div>
    </div>`;

  if (neverVisited) {
    return `<div class="empty">${mothMark(44)}<h2 class="h3">The ledger is still blank</h2>
      <p class="mt-1" style="max-width:56ch;margin-inline:auto">Visits, product views, bag adds, orders and front-desk conversations are recorded from the first guest onward. Add a candle and dress the storefront, and the numbers will begin to gather here.</p>
      <div class="row row-wrap mt-3" style="justify-content:center"><a class="btn btn-gold btn-sm" href="#/atelier/products">Add a candle</a><a class="btn btn-ghost btn-sm" href="#/atelier/storefront">Dress the storefront</a></div></div>`;
  }

  const steps = [['Visits', t.visits], ['Product views', t.productViews], ['Bag adds', t.bagAdds], ['Orders', t.orders]];
  const base = Math.max(1, ...steps.map((s) => s[1]));
  const funnel = steps.map(([label, value], i) => {
    const prev = i ? steps[i - 1][1] : 0;
    return `${i ? `<div class="vd-funnel-drop"><b>${prev ? pct(value / prev) : '—'}</b> continue from ${esc(steps[i - 1][0].toLowerCase())}</div>` : ''}
      <div class="vd-funnel-step"><span class="vd-f-label">${label}</span><div class="vd-f-track"><div class="vd-f-fill" style="width:${((value / base) * 100).toFixed(2)}%"></div></div><span class="vd-figure">${num(value)}</span></div>`;
  }).join('');

  return `
    ${range}
    <div class="kpis">
      ${kpi('Revenue', money(t.revenue), m.delta.revenue)}
      ${kpi('Orders', num(t.orders), m.delta.orders)}
      ${kpi('Average order', money(aov), aovDelta)}
      ${kpi('Visits', num(t.visits), m.delta.visits)}
      ${kpi('Conversion', pct(t.conversion), m.delta.conversion)}
      ${kpi('Front-desk chats', num(t.chats), m.delta.chats)}
    </div>
    ${quiet ? `<p class="preview-note">No activity was recorded in this period. Try a longer range.</p>` : ''}

    <section class="panel">
      <div class="panel-head"><div class="vd-chart-legend"><h2 class="h3">Visits</h2><span class="vd-figure gold">${num(t.visits)}</span></div><span class="faint tiny caps">Guests stepping into the maison, per day</span></div>
      ${lineChart(m.series.map((r) => r.visits), { labels, height: 230, format: num })}
    </section>

    <div class="vd-grid-2">
      <section class="panel">
        <div class="panel-head"><div class="vd-chart-legend"><h2 class="h3">Revenue</h2><span class="vd-figure gold">${money(t.revenue)}</span></div><span class="faint tiny caps">Before the Palace fee</span></div>
        ${lineChart(m.series.map((r) => r.revenue), { labels, height: 240, format: dollars })}
      </section>
      <section class="panel">
        <div class="panel-head"><div class="vd-chart-legend"><h2 class="h3">Orders</h2><span class="vd-figure gold">${num(t.orders)}</span></div><span class="faint tiny caps">Per day</span></div>
        ${barChart(m.series.map((r) => r.orders), { labels, height: 240, format: num })}
      </section>
    </div>

    <div class="vd-grid-2">
      <section class="panel">
        <div class="panel-head"><h2 class="h3">From visit to order</h2><span class="faint tiny caps">${pct(t.conversion)} of visits became orders</span></div>
        <div class="vd-funnel">${funnel}</div>
      </section>
      <section class="panel">
        <div class="panel-head"><h2 class="h3">Most-loved pieces</h2><span class="faint tiny caps">By revenue</span></div>
        ${top.length ? barList(top.map((x) => ({ label: x.product.name, value: x.revenue, display: `${x.units} · ${money(x.revenue)}` })))
          : `<div class="vd-empty-inline">${mothMark(30)}No pieces sold in this period.</div>`}
      </section>
    </div>

    <section class="panel">
      <div class="panel-head"><div class="vd-chart-legend"><h2 class="h3">Front-desk conversations</h2><span class="vd-figure gold">${num(t.chats)}</span></div><a class="vd-open" href="#/atelier/front-desk">Open the front desk</a></div>
      ${lineChart(m.series.map((r) => r.chats), { labels, height: 150, format: num })}
      <p class="faint small mt-2">${t.visits ? `${pct(t.chats / t.visits)} of visits included a conversation with ${esc(shop.frontDesk.name)}.` : `${esc(shop.frontDesk.name)} is ready for the first guest.`}</p>
    </section>`;
}

export function mount(root, ctx) {
  root.querySelectorAll('[data-days]').forEach((b) => { b.onclick = () => { days = +b.dataset.days; ctx.refresh(); }; });
}
