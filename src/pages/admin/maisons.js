// Maisons — every shop in the Palace, its standing, its fee and its featured place.
import * as store from '../../store.js';
import { frontDesk } from '../../agent.js';
import { esc, money, pct, num, icon, mothMark, monogram, statusBadge, toast, modal, confirmDialog, dateFmt } from '../../ui.js';

export const meta = { title: 'Maisons' };

const FILTERS = [['all', 'All'], ['live', 'Live'], ['paused', 'Paused'], ['suspended', 'Suspended']];
let filter = 'all';
let q = '';

const rateFmt = (r) => pct(r, Number.isInteger(Math.round((r || 0) * 1000) / 10) ? 0 : 1);
const fact = (label, value) => `<div class="ad-fact"><span class="ad-fact-l">${esc(label)}</span><span class="ad-fact-v">${value}</span></div>`;

function visible() {
  const needle = q.trim().toLowerCase();
  return store.listShops().filter((s) => {
    if (filter !== 'all' && s.status !== filter) return false;
    if (!needle) return true;
    const owner = store.getUser(s.ownerId);
    return [s.name, s.location, s.tagline, owner?.name, owner?.email].join(' ').toLowerCase().includes(needle);
  });
}

function listHtml() {
  const list = visible();
  if (!list.length) return `<div class="empty">${mothMark(44)}<p>No maison matches this view.</p></div>`;
  const league = new Map(store.shopLeague(30).map((r) => [r.shop.id, r]));
  return `<div class="table-wrap"><table class="table">
    <thead><tr><th>Maison</th><th>Owner</th><th>Status</th><th class="right">Pieces</th><th class="right">30-day sales</th><th class="right">Palace fees</th><th class="right">Fee rate</th><th>Featured</th><th class="right">Actions</th></tr></thead>
    <tbody>${list.map((s) => {
      const owner = store.getUser(s.ownerId);
      const row = league.get(s.id) || { revenue: 0, fees: 0 };
      const pieces = store.listProducts({ shopId: s.id }).length;
      return `<tr>
        <td><div class="ad-cell">${monogram(s, 38)}<span class="grow"><b>${esc(s.name)}</b><small>${esc(s.location || '')}</small>${s.flagship ? '<span class="badge badge-plain ad-tag">Founding house</span>' : ''}</span></div></td>
        <td>${owner ? `${esc(owner.name)}<div class="faint tiny">${esc(owner.email)}</div>` : '<span class="faint">No owner on record</span>'}</td>
        <td>${statusBadge(s.status)}</td>
        <td class="right num">${num(pieces)}</td>
        <td class="right ad-num">${money(row.revenue)}</td>
        <td class="right ad-num gold">${money(row.fees)}</td>
        <td class="right nowrap"><span class="ad-num">${rateFmt(store.feeRateFor(s))}</span>${s.feeOverride != null ? ' <span class="badge badge-plain ad-tag">custom</span>' : ''}</td>
        <td><label class="switch" title="Featured in the lobby"><input type="checkbox" data-featured="${esc(s.id)}" ${store.isFeatured(s.id) ? 'checked' : ''} aria-label="Feature ${esc(s.name)}"><span></span></label></td>
        <td class="right nowrap"><a class="btn btn-quiet btn-sm" href="#/palace/shop/${esc(s.slug)}" aria-label="View the ${esc(s.name)} storefront">${icon('eye')} View</a>
          <button type="button" class="btn btn-ghost btn-sm" data-manage="${esc(s.id)}">Manage</button></td>
      </tr>`;
    }).join('')}</tbody></table></div>
    <p class="faint small mt-2">${list.length} maison${list.length === 1 ? '' : 's'} shown. Sales and fees cover the last 30 days.</p>`;
}

export function render() {
  const shops = store.listShops();
  const counts = { all: shops.length };
  FILTERS.slice(1).forEach(([id]) => { counts[id] = shops.filter((s) => s.status === id).length; });
  return `
  <div class="ad-toolbar">
    <div class="chips" role="group" aria-label="Filter by status">${FILTERS.map(([id, label]) => `<button type="button" class="chip ${id === filter ? 'is-active' : ''}" data-filter="${id}" aria-pressed="${id === filter}">${label} · ${counts[id]}</button>`).join('')}</div>
    <label class="field ad-search"><span class="label">Search maisons</span><input class="input" type="search" data-q value="${esc(q)}" placeholder="Name, owner or location" autocomplete="off"></label>
  </div>
  <section class="panel" data-list>${listHtml()}</section>
  <p class="preview-note">A suspended maison disappears from the public Palace at once. Its orders, balance and history stay intact.</p>`;
}

function manage(shopId, ctx) {
  const s = store.getShop(shopId); if (!s) return;
  const owner = store.getUser(s.ownerId);
  const bal = store.balance(s.id);
  const desk = frontDesk.stats(s.id);
  const palaceRate = store.getSettings().feeRate;
  const custom = s.feeOverride != null;
  const suspended = s.status === 'suspended';
  const m = modal({
    eyebrow: 'Manage maison', title: s.name, width: 720,
    body: `<div class="ad-manage">
      <div class="row row-wrap" style="--gap:10px">${statusBadge(s.status)}${s.flagship ? '<span class="badge badge-plain">Founding house</span>' : ''}${store.isFeatured(s.id) ? '<span class="badge badge-plain">Featured</span>' : ''}</div>
      ${s.tagline ? `<p class="lede">${esc(s.tagline)}</p>` : ''}
      <p class="muted small">${esc(s.story || 'This maison has not written its story yet.')}</p>
      <div class="ad-facts">
        ${fact('Location', esc(s.location || 'Not given'))}
        ${fact('Joined', s.createdAt ? dateFmt(s.createdAt) : esc(`Founded ${s.founded || ''}`))}
        ${fact('Followers', num(store.followerCount(s.id)))}
        ${fact('Owner', owner ? esc(owner.name) : 'None on record')}
      </div>
      <h3 class="ad-sub">Balance</h3>
      <div class="ad-facts">
        ${fact('Available', money(bal.available))}
        ${fact('In preparation', money(bal.pending))}
        ${fact('Requested', money(bal.requested))}
        ${fact('Paid to date', money(bal.paid))}
      </div>
      <h3 class="ad-sub">Front desk · ${esc(s.frontDesk?.name || 'Assistant')}</h3>
      <div class="ad-facts">
        ${fact('Conversations', num(desk.conversations))}
        ${fact('Resolved alone', pct(desk.resolvedRate, 0))}
        ${fact('Answers known', num(desk.knowledge))}
        ${fact('Awaiting owner', num(desk.unanswered))}
      </div>
      <h3 class="ad-sub">Palace fee</h3>
      <p class="muted small">${custom ? `This maison pays a custom rate of <b class="gold">${rateFmt(s.feeOverride)}</b>. The Palace rate is ${rateFmt(palaceRate)}.` : `This maison pays the Palace rate of <b class="gold">${rateFmt(palaceRate)}</b>.`} A change applies to new orders only.</p>
      <div class="ad-inline-form mt-2">
        <label class="field"><span class="label">Custom rate (%)</span><input class="input" type="number" min="0" max="50" step="0.5" inputmode="decimal" data-fee value="${custom ? +(s.feeOverride * 100).toFixed(2) : ''}" placeholder="${+(palaceRate * 100).toFixed(2)}"></label>
        <button type="button" class="btn btn-gold btn-sm" data-fee-save>Set custom rate</button>
        ${custom ? '<button type="button" class="btn btn-ghost btn-sm" data-fee-clear>Use Palace rate</button>' : ''}
      </div>
      <p class="hint" data-fee-error hidden>Enter a rate between 0 and 50.</p>
      <h3 class="ad-sub">Standing and support</h3>
      <div class="row row-wrap" style="--gap:10px">
        ${suspended ? '<button type="button" class="btn btn-gold btn-sm" data-reinstate>Reinstate maison</button>' : '<button type="button" class="btn btn-danger btn-sm" data-suspend>Suspend maison</button>'}
        ${owner ? `<button type="button" class="btn btn-ghost btn-sm" data-enter>${icon('out')} Enter atelier as owner</button>` : ''}
        <a class="btn btn-quiet btn-sm" href="#/palace/shop/${esc(s.slug)}">${icon('eye')} Storefront</a>
      </div>
    </div>`,
    actions: [{ label: 'Close', kind: 'ghost' }],
  });
  const el = m.el;
  const finish = (message) => { m.close(); toast(message); ctx.refresh(); };

  el.querySelector('[data-fee-save]').onclick = async () => {
    const raw = el.querySelector('[data-fee]').value.trim();
    const v = Number(raw);
    const err = el.querySelector('[data-fee-error]');
    if (raw === '' || !isFinite(v) || v < 0 || v > 50) { err.hidden = false; return; }
    err.hidden = true;
    const rate = +(v / 100).toFixed(4);
    const ok = await confirmDialog({ title: 'Set a custom fee?', body: `${esc(s.name)} will pay ${rateFmt(rate)} on every new order, in place of the Palace rate of ${rateFmt(palaceRate)}. Existing orders keep the rate they were placed at.`, confirm: 'Set custom rate' });
    if (!ok) return;
    store.updateShop(s.id, { feeOverride: rate });
    finish(`${s.name} now pays ${rateFmt(rate)}.`);
  };
  const clear = el.querySelector('[data-fee-clear]');
  if (clear) clear.onclick = async () => {
    const ok = await confirmDialog({ title: 'Return to the Palace rate?', body: `${esc(s.name)} will pay ${rateFmt(palaceRate)} on every new order. Existing orders keep the rate they were placed at.`, confirm: 'Use Palace rate' });
    if (!ok) return;
    store.updateShop(s.id, { feeOverride: null });
    finish(`${s.name} now pays the Palace rate.`);
  };
  const suspend = el.querySelector('[data-suspend]');
  if (suspend) suspend.onclick = async () => {
    const ok = await confirmDialog({ title: `Suspend ${s.name}?`, body: 'The maison and its pieces will disappear from the public Palace at once. Its orders, balance and atelier stay intact, and you can reinstate it at any time.', confirm: 'Suspend maison', danger: true });
    if (!ok) return;
    store.updateShop(s.id, { status: 'suspended' });
    finish(`${s.name} has been suspended.`);
  };
  const reinstate = el.querySelector('[data-reinstate]');
  if (reinstate) reinstate.onclick = async () => {
    const ok = await confirmDialog({ title: `Reinstate ${s.name}?`, body: 'The maison and its live pieces will return to the public Palace.', confirm: 'Reinstate maison' });
    if (!ok) return;
    store.updateShop(s.id, { status: 'live' });
    finish(`${s.name} is live again.`);
  };
  const enter = el.querySelector('[data-enter]');
  if (enter) enter.onclick = async () => {
    const ok = await confirmDialog({ title: 'Enter the atelier as its owner?', body: `You will be signed out of the Keeper’s Office and signed in as ${esc(owner.name)}, the owner of ${esc(s.name)}. Anything you change there is changed for the maison. Sign in as the Keeper again to return.`, confirm: 'Enter atelier' });
    if (!ok) return;
    m.close();
    store.signInAs(s.ownerId);
    ctx.navigate('/atelier');
  };
}

export function mount(root, ctx) {
  const list = root.querySelector('[data-list]');
  root.querySelectorAll('[data-filter]').forEach((b) => { b.onclick = () => { filter = b.dataset.filter; ctx.refresh(); }; });
  root.querySelector('[data-q]').addEventListener('input', (e) => { q = e.target.value; list.innerHTML = listHtml(); });
  list.addEventListener('change', (e) => {
    const sw = e.target.closest('[data-featured]'); if (!sw) return;
    const s = store.getShop(sw.dataset.featured);
    store.setFeatured(sw.dataset.featured, sw.checked);
    toast(sw.checked ? `${s?.name || 'The maison'} is now featured in the lobby.` : `${s?.name || 'The maison'} is no longer featured.`);
  });
  list.addEventListener('click', (e) => {
    const b = e.target.closest('[data-manage]'); if (b) manage(b.dataset.manage, ctx);
  });
}
