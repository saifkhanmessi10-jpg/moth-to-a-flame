// AI Oversight — every maison's front desk, seen from the Keeper's Office.
import * as store from '../../store.js';
import { frontDesk } from '../../agent.js';
import { renderMessages } from '../../components/frontdesk-widget.js';
import { esc, pct, num, mothMark, monogram, statusBadge, toast, modal, confirmDialog, relTime, dateFmt } from '../../ui.js';

export const meta = { title: 'AI Oversight' };

const RECENT = 12;
let shopFilter = '';

const tile = (label, value, sub = '') => `<div class="kpi"><div class="k-label">${esc(label)}</div><div class="k-value">${value}</div>${sub ? `<div class="k-delta">${esc(sub)}</div>` : ''}</div>`;
const lastGuestLine = (c) => [...(c.messages || [])].reverse().find((m) => m.from === 'visitor')?.text || 'No question recorded';

function convoRow(c) {
  const shop = store.getShop(c.shopId);
  return `<li>
    <span class="dot">${shop ? esc(shop.monogram || shop.name[0]) : '·'}</span>
    <div><button type="button" class="ad-rowbtn" data-convo="${esc(c.id)}">${esc(c.visitor || 'A guest')}</button>
      <span class="faint small"> · ${esc(shop?.name || 'A former maison')}</span> ${c.resolved ? '' : '<span class="badge badge-warn badge-plain">Awaiting owner</span>'}
      <div class="muted small ad-clip">“${esc(lastGuestLine(c))}”</div></div>
    <time>${relTime(c.updatedAt)}</time></li>`;
}

export function render() {
  const settings = store.getSettings();
  const on = settings.aiEnabled !== false;
  const shops = store.listShops();
  const rows = shops.map((shop) => ({ shop, desk: shop.frontDesk || {}, s: frontDesk.stats(shop.id) }));
  const convos = store.listConversations();
  const open = convos.filter((c) => !c.resolved);
  const total = {
    conversations: convos.length, resolved: convos.length ? convos.filter((c) => c.resolved).length / convos.length : 1,
    knowledge: rows.reduce((t, r) => t + r.s.knowledge, 0), learned: rows.reduce((t, r) => t + r.s.learned, 0), unanswered: rows.reduce((t, r) => t + r.s.unanswered, 0),
  };
  const active = rows.filter((r) => r.desk.enabled && r.shop.status === 'live').length;
  const recent = convos.filter((c) => !shopFilter || c.shopId === shopFilter).slice(0, RECENT);

  return `
  <section class="panel ${on ? 'panel-gold' : ''} ad-master">
    <div class="grow">
      <div class="eyebrow">All front desks</div>
      <h2 class="h3 mt-1">${on ? 'The assistants are on duty' : 'Every assistant is switched off'}</h2>
      <p class="muted small mt-1">${on ? 'Each maison’s assistant greets guests on its storefront, unless that maison’s own switch is off.' : 'The guest chat is hidden on every storefront in the Palace, whatever each maison has chosen. Nothing is lost: knowledge and transcripts are kept.'}</p>
    </div>
    <label class="ad-switch-label"><span class="caps">${on ? 'On' : 'Off'}</span><span class="switch"><input type="checkbox" data-master ${on ? 'checked' : ''} aria-label="Front desk assistants across the Palace"><span></span></span></label>
  </section>

  <div class="kpis">
    ${tile('Conversations', num(total.conversations), 'Across the Palace')}
    ${tile('Resolved without the owner', pct(total.resolved, 0))}
    ${tile('Answers known', num(total.knowledge), `${num(total.learned)} learned from owners`)}
    ${tile('Awaiting an owner', `<span class="${total.unanswered ? 'ad-hot' : ''}">${num(total.unanswered)}</span>`, 'Questions in teach inboxes')}
    ${tile('Desks on duty', on ? num(active) : '0', `of ${num(rows.length)} maisons`)}
  </div>

  <section class="panel">
    <div class="panel-head"><div><div class="eyebrow">Per maison</div><h3 class="h3 mt-1">Each front desk</h3></div></div>
    <div class="table-wrap"><table class="table">
      <thead><tr><th>Maison</th><th>Assistant</th><th>Tone</th><th>Enabled</th><th class="right">Conversations</th><th class="right">Resolved alone</th><th class="right">Answers known</th><th class="right">Learned</th><th class="right">Awaiting owner</th></tr></thead>
      <tbody>${rows.map(({ shop, desk, s }) => `<tr>
        <td><div class="ad-cell">${monogram(shop, 34)}<span class="grow"><b>${esc(shop.name)}</b>${shop.status === 'live' ? '' : `<small>${esc(shop.status)}</small>`}</span></div></td>
        <td>${esc(desk.name || 'Assistant')}</td>
        <td class="muted">${esc(desk.tone || 'warm')}</td>
        <td><label class="switch"><input type="checkbox" data-desk="${esc(shop.id)}" ${desk.enabled ? 'checked' : ''} aria-label="${esc(shop.name)} front desk"><span></span></label></td>
        <td class="right num">${num(s.conversations)}</td>
        <td class="right num">${s.conversations ? pct(s.resolvedRate, 0) : '<span class="faint">No chats</span>'}</td>
        <td class="right num">${num(s.knowledge)}</td>
        <td class="right num">${num(s.learned)}</td>
        <td class="right ad-num ${s.unanswered >= 3 ? 'ad-hot' : ''}">${num(s.unanswered)}${s.unanswered >= 3 ? ' <span class="badge badge-warn badge-plain">Needs coaching</span>' : ''}</td>
      </tr>`).join('')}
      <tr class="ad-total"><td colspan="4">The whole Palace</td><td class="right ad-num">${num(total.conversations)}</td><td class="right ad-num">${pct(total.resolved, 0)}</td><td class="right ad-num">${num(total.knowledge)}</td><td class="right ad-num">${num(total.learned)}</td><td class="right ad-num">${num(total.unanswered)}</td></tr>
      </tbody></table></div>
  </section>

  <div class="ad-two">
    <section class="panel">
      <div class="panel-head"><div><div class="eyebrow">Needs attention</div><h3 class="h3 mt-1">${open.length ? `${open.length} conversation${open.length === 1 ? '' : 's'} handed to an owner` : 'No conversation is waiting'}</h3></div></div>
      ${open.length ? `<ul class="feed ad-convos">${open.slice(0, 20).map(convoRow).join('')}</ul>` : `<div class="empty">${mothMark(44)}<p>Every guest has been answered by an assistant.</p></div>`}
    </section>
    <section class="panel">
      <div class="panel-head"><div><div class="eyebrow">Recent conversations</div><h3 class="h3 mt-1">Latest at the desks</h3></div>
        <label class="field ad-narrow"><span class="label">Maison</span><select class="select" data-shop><option value="">All maisons</option>${shops.map((s) => `<option value="${esc(s.id)}" ${s.id === shopFilter ? 'selected' : ''}>${esc(s.name)}</option>`).join('')}</select></label></div>
      ${recent.length ? `<ul class="feed ad-convos">${recent.map(convoRow).join('')}</ul>` : '<p class="muted">No conversations here yet.</p>'}
    </section>
  </div>

  <p class="preview-note">In this preview the assistants run on this device, using retrieval and rules over each maison’s catalogue, policies and taught answers. No conversation leaves the browser. In production the same seam is served by a hosted model.</p>`;
}

function openConvo(id) {
  const c = store.getConversation(id); if (!c) return;
  const shop = store.getShop(c.shopId);
  modal({
    eyebrow: `${shop?.name || 'A former maison'} · ${dateFmt(c.startedAt || c.updatedAt)}`, title: c.visitor || 'A guest', width: 620,
    body: `<div class="row row-wrap mb-2" style="--gap:10px">${c.resolved ? '<span class="badge badge-ok">Resolved by the assistant</span>' : '<span class="badge badge-warn">Awaiting the owner</span>'}${shop ? statusBadge(shop.status) : ''}</div>
      <div class="chat-log ad-transcript">${renderMessages(c.messages || [], shop?.frontDesk?.name || 'Front desk')}</div>
      <p class="faint small mt-2">The Keeper reads transcripts for oversight. Replies to guests come from the maison.</p>`,
    actions: [{ label: 'Close', kind: 'ghost' }],
  });
}

export function mount(root, ctx) {
  const master = root.querySelector('[data-master]');
  master.onchange = async () => {
    const on = master.checked;
    if (!on) {
      const ok = await confirmDialog({ title: 'Switch off every front desk?', body: 'The guest chat will be hidden on every storefront in the Palace until you switch it back on. Each maison keeps its knowledge and transcripts.', confirm: 'Switch off', danger: true });
      if (!ok) { master.checked = true; return; }
    }
    store.updateSettings({ aiEnabled: on });
    toast(on ? 'The front desks are on duty again.' : 'Every front desk has been switched off.');
    ctx.refresh();
  };
  root.querySelectorAll('[data-desk]').forEach((sw) => {
    sw.onchange = () => {
      const shop = store.getShop(sw.dataset.desk);
      store.saveFrontDesk(sw.dataset.desk, { enabled: sw.checked });
      toast(`${shop?.frontDesk?.name || 'The assistant'} at ${shop?.name || 'the maison'} is ${sw.checked ? 'on duty' : 'off duty'}.`);
      ctx.refresh();
    };
  });
  root.querySelector('[data-shop]').onchange = (e) => { shopFilter = e.target.value; ctx.refresh(); };
  root.querySelectorAll('[data-convo]').forEach((b) => { b.onclick = () => openConvo(b.dataset.convo); });
}
