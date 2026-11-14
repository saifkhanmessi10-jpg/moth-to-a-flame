// /atelier/agent — the Moth Agent's room.
import * as store from '../../store.js';
import { mothAgent } from '../../agent.js';
import { esc, money, num, mothMark, eventLine, relTime } from '../../ui.js';

export const meta = { title: 'Moth Agent' };

// Transcript per maison, kept for the session: [{ from: 'agent' | 'me', text, link? }]
const transcripts = new Map();
const pending = new Map(); // shopId → replies still being composed

const LINK_LABEL = {
  '/atelier/orders': 'Open orders', '/atelier/products': 'Open candles', '/atelier/analytics': 'Open analytics',
  '/atelier/payouts': 'Open payouts', '/atelier/front-desk': 'Open the front desk', '/atelier/storefront': 'Open the storefront',
};

function transcriptFor(shop) {
  if (!transcripts.has(shop.id)) {
    const b = mothAgent.briefing(shop.id);
    transcripts.set(shop.id, [
      { from: 'agent', text: `${b.greeting} ${b.headline}` },
      { from: 'agent', text: `I keep watch over ${shop.name} — sales, clicks, traffic, visits and front-desk conversations. Ask me anything, or choose a question below.` },
    ]);
  }
  return transcripts.get(shop.id);
}

const bubble = (m) => (m.from === 'me'
  ? `<div class="msg msg-me">${esc(m.text)}</div>`
  : `<div class="msg msg-them"><span class="who">Moth Agent</span>${esc(m.text)}${m.link ? `<br><a class="vd-msg-link" href="#${esc(m.link)}">${LINK_LABEL[m.link] || 'Open'} →</a>` : ''}</div>`);
const typing = () => `<div class="msg msg-them" data-typing><span class="who">Moth Agent</span><span class="vd-typing">···</span></div>`;

export function render({ shop }) {
  const log = transcriptFor(shop);
  const today = mothAgent.briefing(shop.id).today;
  const notes = store.listNotifications(shop.id).slice(0, 12);
  const unread = notes.filter((n) => !n.read).length;
  const events = store.listEvents({ shopId: shop.id, limit: 10 });

  return `
    <div class="vd-agent">
      <section class="panel panel-gold vd-chat" aria-label="Conversation with the Moth Agent">
        <div class="vd-chat-top">${mothMark(36)}
          <div class="grow"><h2 class="h3">The Moth Agent</h2><div class="tiny faint caps">Watching ${esc(shop.name)}</div></div>
          <span class="badge badge-ok">Attentive</span>
        </div>
        <div class="chat-log" id="vd-agent-log" aria-live="polite">${log.map(bubble).join('')}${pending.get(shop.id) ? typing() : ''}</div>
        <div class="suggests">${mothAgent.suggestions().map((s) => `<button type="button" data-suggest>${esc(s)}</button>`).join('')}</div>
        <form class="chat-form" data-ask autocomplete="off">
          <input name="q" placeholder="Ask about sales, traffic, stock, payouts…" aria-label="Ask the Moth Agent">
          <button>Ask</button>
        </form>
      </section>

      <div class="vd-stack">
        <section>
          <div class="eyebrow mb-2">Since you were last here · today</div>
          <div class="vd-tiles">
            <div class="vd-tile"><div class="k-label">Visits</div><div class="k-value">${num(today.visits)}</div></div>
            <div class="vd-tile"><div class="k-label">Orders</div><div class="k-value">${num(today.orders)}</div></div>
            <div class="vd-tile"><div class="k-label">Revenue</div><div class="k-value">${money(today.revenue)}</div></div>
            <div class="vd-tile"><div class="k-label">Chats</div><div class="k-value">${num(today.chats)}</div></div>
          </div>
        </section>

        <section class="panel">
          <div class="panel-head"><h2 class="h3">Notices${unread ? ` <span class="gold vd-serif">· ${unread} new</span>` : ''}</h2>
            ${unread ? `<button class="vd-open" data-read-all>Mark all read</button>` : ''}</div>
          ${notes.length ? `<ul class="vd-notes">${notes.map((n) => {
            const inner = `<span class="vd-pip"></span><div><div class="vd-note-title">${esc(n.title)}</div>${n.body ? `<div class="faint small">${esc(n.body)}</div>` : ''}</div><time>${relTime(n.at)}</time>`;
            return `<li class="${n.read ? '' : 'is-unread'}">${n.link ? `<a href="#${esc(n.link)}">${inner}</a>` : `<div class="vd-note-item">${inner}</div>`}</li>`;
          }).join('')}</ul>` : `<div class="vd-empty-inline">${mothMark(30)}No notices. I will leave word here when something needs you.</div>`}
        </section>

        <section class="panel">
          <div class="panel-head"><h2 class="h3">Live in the maison</h2></div>
          ${events.length ? `<ul class="feed">${events.map((e) => eventLine(e)).join('')}</ul>`
            : `<div class="vd-empty-inline">${mothMark(30)}Quiet for now. Visits, clicks and orders will appear here as they happen.</div>`}
        </section>

        <p class="preview-note">In this preview the Moth Agent reads your maison’s live numbers on this device. Nothing leaves your browser.</p>
      </div>
    </div>`;
}

export function mount(root, ctx) {
  const shop = ctx.shop;
  const form = root.querySelector('[data-ask]');
  const input = form.querySelector('input');
  // The log is looked up fresh each time, so a reply still lands if the page re-rendered while the agent was composing.
  const liveLog = () => document.getElementById('vd-agent-log');
  const toEnd = () => { const l = liveLog(); if (l) l.scrollTop = l.scrollHeight; };
  toEnd();

  const send = (raw) => {
    const text = String(raw || '').trim();
    if (!text) return;
    const log = transcriptFor(shop);
    const mine = { from: 'me', text };
    log.push(mine);
    pending.set(shop.id, (pending.get(shop.id) || 0) + 1);
    const el = liveLog();
    if (el) { el.querySelector('[data-typing]')?.remove(); el.insertAdjacentHTML('beforeend', bubble(mine) + typing()); }
    input.value = ''; input.focus(); toEnd();
    setTimeout(() => {
      let reply;
      try { const r = mothAgent.ask(shop.id, text); reply = { from: 'agent', text: r.text, link: r.link }; }
      catch { reply = { from: 'agent', text: 'I could not read the ledger just now. Please ask me again in a moment.' }; }
      log.push(reply);
      const left = Math.max(0, (pending.get(shop.id) || 1) - 1); pending.set(shop.id, left);
      const now = liveLog();
      if (!now) return;
      now.querySelector('[data-typing]')?.remove();
      now.insertAdjacentHTML('beforeend', bubble(reply) + (left ? typing() : ''));
      toEnd();
    }, 520 + Math.random() * 380);
  };

  form.addEventListener('submit', (e) => { e.preventDefault(); send(input.value); });
  root.querySelectorAll('[data-suggest]').forEach((b) => { b.onclick = () => send(b.textContent); });
  const readAll = root.querySelector('[data-read-all]');
  if (readAll) readAll.onclick = () => { store.markNotificationsRead(shop.id); ctx.refresh(); };
}
