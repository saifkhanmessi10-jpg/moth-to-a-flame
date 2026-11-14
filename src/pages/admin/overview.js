// The Keeper's Office — the whole Palace at a glance.
import * as store from '../../store.js';
import { mothAgent } from '../../agent.js';
import { esc, money, pct, num, deltaTag, icon, mothMark, monogram, statusBadge, lineChart, eventLine, toast, dateShort, relTime } from '../../ui.js';

export const meta = { title: 'Overview' };

const RANGES = [7, 30, 60];
let range = 30;

const change = (now, prev) => (prev ? (now - prev) / prev : null);
const note = (text) => `<div class="k-delta">${esc(text)}</div>`;
const tile = (label, value, sub = '') => `<div class="kpi"><div class="k-label">${esc(label)}</div><div class="k-value">${value}</div>${sub}</div>`;
const dollars = (cents) => `$${num(Math.round((cents || 0) / 100))}`;
const KIND_LABEL = { watch: 'Needs a decision', win: 'Going well', idea: 'Worth a look' };

export function render() {
  const brief = mothAgent.palaceBriefing();
  const fin = store.palaceFinance(range);
  const both = store.palaceFinance(range * 2);
  const prev = { gmv: both.gmv - fin.gmv, fees: both.fees - fin.fees, orders: both.orders - fin.orders };
  prev.aov = prev.orders > 0 ? Math.round(prev.gmv / prev.orders) : 0;
  const m = store.metrics(null, range);
  const league = store.shopLeague(range);
  const shops = store.listShops();
  const live = shops.filter((s) => s.status === 'live').length;
  const patrons = store.listUsers({ role: 'patron' }).length;
  const events = store.listEvents({ limit: 14 });
  const notes = store.listNotifications('admin').slice(0, 8);
  const unread = store.listNotifications('admin', { unreadOnly: true }).length;
  const today = brief.today || { visits: 0, orders: 0, revenue: 0, chats: 0 };

  return `
  <section class="ad-brief">
    <span class="ad-brief-mark" aria-hidden="true">${mothMark(260)}</span>
    <div class="ad-brief-main">
      <div class="eyebrow">Palace briefing · the Moth Agent</div>
      <h2 class="h1 mt-2">${esc(brief.greeting)}</h2>
      <p class="lede mt-2">${esc(brief.headline)}</p>
      <ul class="ad-brief-list mt-3">${brief.bullets.map((b) => `<li>${esc(b)}</li>`).join('')}</ul>
    </div>
    <div class="ad-brief-today" aria-label="Today so far">
      <div class="eyebrow">Today so far</div>
      <div class="ad-today-grid mt-2">
        <div><span class="ad-today-v">${money(today.revenue)}</span><span class="ad-today-l">Sales</span></div>
        <div><span class="ad-today-v">${num(today.orders)}</span><span class="ad-today-l">Orders</span></div>
        <div><span class="ad-today-v">${num(today.visits)}</span><span class="ad-today-l">Visits</span></div>
        <div><span class="ad-today-v">${num(today.chats)}</span><span class="ad-today-l">Desk chats</span></div>
      </div>
    </div>
  </section>

  <div class="page-head">
    <div><div class="eyebrow">The ecosystem</div><h2 class="h3 mt-1">The last ${range} days</h2></div>
    <div class="chips" role="group" aria-label="Date range">${RANGES.map((d) => `<button type="button" class="chip ${d === range ? 'is-active' : ''}" data-range="${d}" aria-pressed="${d === range}">${d} days</button>`).join('')}</div>
  </div>

  <div class="kpis">
    ${tile('Sales through the Palace', money(fin.gmv), deltaTag(change(fin.gmv, prev.gmv)))}
    ${tile('Palace fees earned', `<span class="gold">${money(fin.fees)}</span>`, deltaTag(change(fin.fees, prev.fees)))}
    ${tile('Orders', num(fin.orders), deltaTag(change(fin.orders, prev.orders)))}
    ${tile('Average order', money(fin.aov), deltaTag(change(fin.aov, prev.aov)))}
    ${tile('Visits', num(m.totals.visits), deltaTag(m.delta.visits))}
    ${tile('Conversion', pct(m.totals.conversion), deltaTag(m.delta.conversion))}
    ${tile('Live maisons', num(live), note(`${num(shops.length)} in residence`))}
    ${tile('Patrons', num(patrons), note('Registered accounts'))}
  </div>

  <section class="panel">
    <div class="panel-head"><div><div class="eyebrow">Sales</div><h3 class="h3 mt-1">Daily sales across every maison</h3></div><span class="faint small">${money(m.totals.revenue)} over ${range} days</span></div>
    ${lineChart(m.series.map((d) => d.revenue), { labels: m.series.map((d) => dateShort(`${d.date}T12:00:00`)), format: dollars, height: 240 })}
  </section>

  <section>
    <div class="page-head mb-2"><div><div class="eyebrow">Needs your attention</div><h2 class="h3 mt-1">${brief.insights.length ? 'What the Palace is asking of you' : 'Nothing is waiting on you'}</h2></div></div>
    ${brief.insights.length ? `<div class="ad-insights">${brief.insights.map((i) => `
      <a class="ad-insight ad-insight-${esc(i.kind)}" href="#${esc(i.link || '/keeper')}">
        <span class="ad-insight-kind">${esc(KIND_LABEL[i.kind] || 'Note')}</span>
        <span class="h4">${esc(i.title)}</span>
        <span class="muted small">${esc(i.body)}</span>
        <span class="link-arrow mt-1">Open</span>
      </a>`).join('')}</div>` : `<div class="empty">${mothMark(44)}<p>Applications, payouts and dispatch are all in order.</p></div>`}
  </section>

  <section class="panel">
    <div class="panel-head"><div><div class="eyebrow">Maison league</div><h3 class="h3 mt-1">Every maison, ranked by sales</h3></div><a class="link-arrow" href="#/keeper/maisons">Manage maisons</a></div>
    <div class="table-wrap"><table class="table">
      <thead><tr><th>#</th><th>Maison</th><th class="right">Visits</th><th class="right">Orders</th><th class="right">Conversion</th><th class="right">Sales</th><th class="right">Palace fees</th></tr></thead>
      <tbody>${league.map((r, i) => `<tr>
        <td class="faint num">${i + 1}</td>
        <td><a class="ad-cell" href="#/keeper/maisons">${monogram(r.shop, 36)}<span class="grow"><b>${esc(r.shop.name)}</b><small>${esc(r.shop.location || '')}</small></span>${r.shop.status === 'live' ? '' : statusBadge(r.shop.status)}</a></td>
        <td class="right num">${num(r.visits)}</td>
        <td class="right num">${num(r.orders)}</td>
        <td class="right num">${pct(r.conversion)}</td>
        <td class="right ad-num">${money(r.revenue)}</td>
        <td class="right ad-num gold">${money(r.fees)}</td>
      </tr>`).join('')}</tbody>
    </table></div>
  </section>

  <div class="ad-two">
    <section class="panel">
      <div class="panel-head"><div><div class="eyebrow">Live</div><h3 class="h3 mt-1">Activity across the Palace</h3></div></div>
      ${events.length ? `<ul class="feed">${events.map((e) => eventLine(e, { showShop: true })).join('')}</ul>` : '<p class="muted">The Palace is quiet for the moment.</p>'}
    </section>
    <section class="panel">
      <div class="panel-head"><div><div class="eyebrow">For the Keeper</div><h3 class="h3 mt-1">Notifications${unread ? ` <span class="ad-count">${unread} new</span>` : ''}</h3></div>
        ${unread ? '<button type="button" class="btn btn-quiet btn-sm" data-read-all>Mark all read</button>' : ''}</div>
      ${notes.length ? `<ul class="feed">${notes.map((n) => `<li class="${n.read ? 'ad-read' : ''}">
        <span class="dot">${icon(n.kind === 'payout' ? 'coins' : n.kind === 'application' ? 'scroll' : 'bell')}</span>
        <div>${n.link ? `<a href="#${esc(n.link)}">${esc(n.title)}</a>` : esc(n.title)}${n.body ? `<div class="faint tiny">${esc(n.body)}</div>` : ''}</div>
        <time>${relTime(n.at)}</time></li>`).join('')}</ul>` : '<p class="muted">No notifications yet.</p>'}
    </section>
  </div>`;
}

export function mount(root, ctx) {
  root.querySelectorAll('[data-range]').forEach((b) => { b.onclick = () => { range = Number(b.dataset.range); ctx.refresh(); }; });
  const readAll = root.querySelector('[data-read-all]');
  if (readAll) readAll.onclick = () => { store.markNotificationsRead('admin'); toast('All notifications marked as read.'); ctx.refresh(); };
}
