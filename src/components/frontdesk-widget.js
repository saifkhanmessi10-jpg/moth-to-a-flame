// Guest-facing Front Desk: a floating button that opens the maison's assistant.
// Usage (from a page's mount):  const off = mountFrontDesk(shopId);  → call off() is not
// required; app.js clears #desk-root on every navigation.
import * as store from '../store.js';
import { frontDesk } from '../agent.js';
import { esc, icon, candleArt, money } from '../ui.js';

export function renderMessages(messages, deskName) {
  return messages.map((m) => {
    const mine = m.from === 'visitor' || m.from === 'owner';
    const products = (m.productIds || []).map((id) => store.getProduct(id)).filter(Boolean);
    return `<div class="msg ${mine ? 'msg-me' : 'msg-them'}">${mine ? '' : `<span class="who">${esc(deskName)}</span>`}${esc(m.text)}${products.length ? `<div class="msg-products">${products.map((p) => `<a href="#/palace/product/${p.id}"><div class="art-frame">${candleArt(p, { lit: false })}</div>${esc(p.name)}<br><span class="gold">${money(p.price)}</span></a>`).join('')}</div>` : ''}</div>`;
  }).join('');
}

export function mountFrontDesk(shopId) {
  const shop = store.getShop(shopId);
  const host = document.getElementById('desk-root');
  if (!host || !shop || !shop.frontDesk.enabled || !store.getSettings().aiEnabled) { if (host) host.innerHTML = ''; return () => {}; }
  const desk = shop.frontDesk;
  let convo = null; let open = false;

  const draw = () => {
    if (!open) {
      host.innerHTML = `<button class="desk-fab" aria-label="Open the front desk"><span class="moth-mark"></span><span class="txt">Ask ${esc(desk.name)}</span></button>`;
      host.querySelector('.desk-fab').onclick = () => { open = true; if (!convo) convo = store.startConversation(shopId); draw(); };
      return;
    }
    host.innerHTML = `<section class="desk-panel" aria-label="${esc(shop.name)} front desk">
      <header><span class="moth-mark" style="--size:30px"></span>
        <div class="grow"><div class="h4">${esc(desk.name)}</div><div class="tiny faint caps">Front desk · ${esc(shop.name)}</div></div>
        <button class="icon-btn" data-close aria-label="Close">${icon('close')}</button></header>
      <div class="chat-log">${renderMessages(convo.messages, desk.name)}</div>
      <footer>
        <div class="suggests">${frontDesk.suggestions(shopId).map((s) => `<button type="button">${esc(s)}</button>`).join('')}</div>
        <form class="chat-form"><input name="q" placeholder="Ask about a scent, a gift, delivery…" autocomplete="off" aria-label="Your message"><button>Send</button></form>
        <p class="tiny faint mt-1">An AI assistant trained by the maison. It will ask the maker when unsure.</p>
      </footer></section>`;
    const log = host.querySelector('.chat-log'); log.scrollTop = log.scrollHeight;
    host.querySelector('[data-close]').onclick = () => { open = false; draw(); };
    const send = (text) => {
      if (!text.trim()) return;
      log.insertAdjacentHTML('beforeend', `<div class="msg msg-me">${esc(text)}</div><div class="msg msg-them" data-typing><span class="who">${esc(desk.name)}</span>…</div>`);
      log.scrollTop = log.scrollHeight;
      host.querySelector('input').value = '';
      setTimeout(() => { frontDesk.reply(shopId, convo.id, text); convo = store.getConversation(convo.id); draw(); host.querySelector('input')?.focus(); }, 650);
    };
    host.querySelector('form').onsubmit = (e) => { e.preventDefault(); send(host.querySelector('input').value); };
    host.querySelectorAll('.suggests button').forEach((b) => { b.onclick = () => send(b.textContent); });
  };
  draw();
  return () => { host.innerHTML = ''; };
}
