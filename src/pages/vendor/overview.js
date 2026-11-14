// /atelier — the morning view.
import * as store from '../../store.js';
import { mothAgent } from '../../agent.js';
import { esc, money, pct, num, kpi, mothMark, lineChart, barList, eventLine, statusBadge, dateShort, relTime } from '../../ui.js';

export const meta = { title: 'Overview' };

let days = 30;
let chart = 'revenue';

const KIND = { win: 'Going well', watch: 'Needs attention', idea: 'An idea' };
const dollars = (v) => `$${num(Math.round(v / 100))}`;

export function render({ shop }) {
  const brief = mothAgent.briefing(shop.id);
  const m = store.metrics(shop.id, days);
  const t = m.totals;
  const labels = m.series.map((_, i) => dateShort(Date.now() - (m.series.length - 1 - i) * store.DAY));
  const products = store.listProducts({ shopId: shop.id });
  const parcels = store.listParcels({ shopId: shop.id });
  const open = parcels.filter((x) => ['placed', 'preparing'].includes(x.parcel.status)).sort((a, b) => a.order.createdAt - b.order.createdAt);
  const events = store.listEvents({ shopId: shop.id, limit: 12 });
  const top = store.topProducts(shop.id, days, 5);
  const isNew = !products.length && !parcels.length;

  const firstSteps = isNew ? `
    <section>
      <div class="vd-steps">
        <div class="vd-step"><span class="vd-step-n">I</span><h3 class="h3">Dress your storefront</h3><p>Choose a theme, an accent and a monogram so guests recognise the maison at the door.</p><a class="vd-open" href="#/atelier/storefront">Open the customiser</a></div>
        <div class="vd-step"><span class="vd-step-n">II</span><h3 class="h3">Add your first candle</h3><p>Describe the piece, set its price and design the vessel. It can rest as a draft until you are ready.</p><a class="vd-open" href="#/atelier/products">Open candles</a></div>
        <div class="vd-step"><span class="vd-step-n">III</span><h3 class="h3">Brief ${esc(shop.frontDesk.name)}</h3><p>Your front desk answers guests in your voice. Teach it the questions only you can answer.</p><a class="vd-open" href="#/atelier/front-desk">Open the front desk</a></div>
      </div>
    </section>` : '';

  return `
    <section class="panel panel-gold vd-brief">
      ${mothMark(56)}
      <div>
        <div class="row between row-wrap" style="--gap:12px"><div class="eyebrow">Moth Agent · today’s briefing</div><a class="vd-open" href="#/atelier/agent">Speak with the agent</a></div>
        <h2 class="vd-brief-head">${esc(brief.greeting)} <span>${esc(brief.headline)}</span></h2>
        ${isNew
          ? `<p class="muted mt-2" style="max-width:68ch">The maison is open and the ledger is clean. Once guests begin to arrive, I will report on visits, orders, conversations and payouts here each morning.</p>`
          : `<ul class="vd-bullets">${brief.bullets.map((b) => `<li>${esc(b)}</li>`).join('')}</ul>`}
      </div>
    </section>

    ${firstSteps}

    <section>
      <div class="vd-toolbar mb-2">
        <div class="eyebrow">The last ${days} days</div>
        <div class="chips" role="group" aria-label="Range">${[7, 30, 60].map((d) => `<button class="chip ${d === days ? 'is-active' : ''}" data-days="${d}" aria-pressed="${d === days}">${d} days</button>`).join('')}</div>
      </div>
      <div class="kpis">
        ${kpi('Revenue', money(t.revenue), m.delta.revenue)}
        ${kpi('Orders', num(t.orders), m.delta.orders)}
        ${kpi('Visits', num(t.visits), m.delta.visits)}
        ${kpi('Conversion', pct(t.conversion), m.delta.conversion)}
        ${kpi('Front-desk chats', num(t.chats), m.delta.chats)}
      </div>
    </section>

    ${brief.insights.length ? `<section>
      <div class="eyebrow mb-2">What the agent would look at</div>
      <div class="vd-insights">${brief.insights.map((i) => `
        <a class="vd-insight is-${esc(i.kind)}" href="#${esc(i.link || '/atelier')}">
          <span class="vd-kind">${KIND[i.kind] || 'Note'}</span>
          <h3 class="h4">${esc(i.title)}</h3>
          <p>${esc(i.body)}</p>
          <span class="vd-open">Open</span>
        </a>`).join('')}</div>
    </section>` : ''}

    <section class="dash-grid">
      <div class="vd-stack">
        <div class="panel">
          <div class="panel-head">
            <div class="vd-chart-legend"><h2 class="h3">${chart === 'revenue' ? 'Revenue' : 'Visits'}</h2><span class="vd-figure gold">${chart === 'revenue' ? money(t.revenue) : num(t.visits)}</span></div>
            <div class="chips" role="group" aria-label="Chart">${[['revenue', 'Revenue'], ['visits', 'Visits']].map(([k, l]) => `<button class="chip ${k === chart ? 'is-active' : ''}" data-chart="${k}" aria-pressed="${k === chart}">${l}</button>`).join('')}</div>
          </div>
          ${lineChart(m.series.map((r) => r[chart]), { labels, height: 240, format: chart === 'revenue' ? dollars : num })}
        </div>

        <div class="panel">
          <div class="panel-head"><h2 class="h3">Awaiting dispatch</h2>${open.length ? `<a class="vd-open" href="#/atelier/orders">All orders</a>` : ''}</div>
          ${open.length ? `<ul class="vd-list">${open.slice(0, 5).map(({ order, parcel }) => `
            <li>
              <div class="grow"><a href="#/atelier/orders" class="gold">${esc(order.number)}</a> · ${esc(order.customer)}
                <div class="faint small" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(parcel.items.map((it) => `${it.qty} × ${it.name}`).join(', '))} · placed ${relTime(order.createdAt)}</div></div>
              <span class="vd-figure">${money(parcel.subtotal)}</span>
              ${statusBadge(parcel.status)}
            </li>`).join('')}</ul>
            ${open.length > 5 ? `<p class="faint small mt-2">And ${open.length - 5} more awaiting preparation.</p>` : ''}`
            : `<div class="vd-empty-inline">${mothMark(30)}${parcels.length ? 'Nothing is waiting. Every parcel has left the atelier.' : 'Your first order will appear here the moment it is placed.'}</div>`}
        </div>

        <div class="panel">
          <div class="panel-head"><h2 class="h3">Most-loved pieces</h2><a class="vd-open" href="#/atelier/analytics">Analytics</a></div>
          ${top.length ? barList(top.map((x) => ({ label: x.product.name, value: x.revenue, display: `${x.units} sold · ${money(x.revenue)}` })))
            : `<div class="vd-empty-inline">${mothMark(30)}No pieces sold in this period yet.</div>`}
        </div>
      </div>

      <div class="panel">
        <div class="panel-head"><h2 class="h3">Live in the maison</h2><span class="badge badge-ok">Live</span></div>
        ${events.length ? `<ul class="feed">${events.map((e) => eventLine(e)).join('')}</ul>`
          : `<div class="vd-empty-inline">${mothMark(30)}Quiet for now. Visits, saved pieces and orders will appear here as they happen.</div>`}
      </div>
    </section>`;
}

export function mount(root, ctx) {
  root.querySelectorAll('[data-days]').forEach((b) => { b.onclick = () => { days = +b.dataset.days; ctx.refresh(); }; });
  root.querySelectorAll('[data-chart]').forEach((b) => { b.onclick = () => { chart = b.dataset.chart; ctx.refresh(); }; });
}
