// /atelier/front-desk — the maison's self-learning AI front desk.
import * as store from '../../store.js';
import { frontDesk } from '../../agent.js';
import { renderMessages } from '../../components/frontdesk-widget.js';
import { esc, pct, num, kpi, mothMark, barList, relTime, dateFmt, toast, confirmDialog, formData } from '../../ui.js';

export const meta = { title: 'Front Desk AI' };

let tab = 'overview';
let openConvo = null;   // conversation id shown in the transcript viewer
let editing = null;     // knowledge id being edited
const rehearsals = new Map(); // shopId → [{ from, text, productIds?, confident?, q?, taught? }]

const TABS = [['overview', 'Overview'], ['teach', 'Teach'], ['knowledge', 'Knowledge'], ['persona', 'Persona'], ['conversations', 'Conversations'], ['rehearse', 'Rehearse']];
const TONES = [['warm', 'Warm', 'Gracious and personal'], ['formal', 'Formal', 'Composed and exact'], ['poetic', 'Poetic', 'Lyrical, a little theatrical']];
const sourceBadge = (k) => (k.source === 'learned' ? `<span class="badge badge-ok">Learned from you</span>` : `<span class="badge badge-plain">Written by you</span>`);
const emptyBlock = (title, text) => `<div class="empty">${mothMark(44)}<h2 class="h3">${title}</h2><p class="mt-1" style="max-width:54ch;margin-inline:auto">${text}</p></div>`;

/* ---------------------------------------------------------------- sections */
function overview(shop) {
  const desk = shop.frontDesk; const s = frontDesk.stats(shop.id);
  const used = s.topQuestions.filter((k) => k.uses > 0);
  return `
    <div class="kpis">
      ${kpi('Conversations', num(s.conversations))}
      ${kpi('Resolved without you', s.conversations ? pct(s.resolvedRate, 0) : '—')}
      ${kpi('Answers known', num(s.knowledge))}
      ${kpi('Learned from you', num(s.learned))}
      ${kpi('Awaiting your answer', num(s.unanswered))}
    </div>
    <div class="dash-grid">
      <section class="panel">
        <div class="panel-head"><h2 class="h3">Most-used answers</h2><button class="vd-open" data-tab="knowledge">All knowledge</button></div>
        ${used.length ? barList(used.map((k) => ({ label: k.q, value: k.uses, display: `${k.uses} use${k.uses === 1 ? '' : 's'}` })))
          : `<div class="vd-empty-inline">${mothMark(30)}${s.knowledge ? 'No answer has been called upon yet.' : `${esc(desk.name)} has no answers of its own yet. It will still speak for your catalogue and policies.`}</div>`}
        ${s.unanswered ? `<div class="row between row-wrap mt-3" style="--gap:12px"><p class="vd-note">${s.unanswered} question${s.unanswered === 1 ? ' is' : 's are'} waiting for your answer.</p><button class="btn btn-gold btn-sm" data-tab="teach">Teach ${esc(desk.name)}</button></div>` : ''}
      </section>
      <section class="panel">
        <div class="panel-head"><h2 class="h3">How ${esc(desk.name)} learns</h2></div>
        <ol class="vd-how">
          <li><b>I</b><div><strong>It answers from what it knows</strong>Your catalogue, your policies and every answer you have given it.</div></li>
          <li><b>II</b><div><strong>When unsure, it says so</strong>The guest is told you will reply, and the question arrives in your Teach inbox.</div></li>
          <li><b>III</b><div><strong>You answer once</strong>Your answer becomes permanent knowledge. The desk handles that question itself from then on.</div></li>
        </ol>
      </section>
    </div>`;
}

function teach(shop) {
  const desk = shop.frontDesk;
  if (!desk.unanswered.length) return emptyBlock('The desk has no open questions', `${esc(desk.name)} has answered every guest so far. When it meets a question it cannot answer with confidence, it will arrive here for you.`);
  return `
    <p class="vd-note" style="max-width:76ch">Guests asked these and ${esc(desk.name)} would not guess. Each answer you give becomes permanent knowledge, used word for word the next time.</p>
    <div>${desk.unanswered.map((u) => `
      <form class="vd-teach" data-teach="${esc(u.id)}">
        <div class="row between row-wrap" style="--gap:10px;align-items:flex-start">
          <h3 class="vd-q">${esc(u.q)}</h3>
          <span class="faint tiny caps nowrap">Asked ${u.count} time${u.count === 1 ? '' : 's'} · last ${relTime(u.lastAt)}</span>
        </div>
        <label><span class="label" style="margin:14px 0 0">Your answer</span><textarea class="textarea" name="a" placeholder="Answer as you would in person." maxlength="800"></textarea></label>
        <div class="vd-actions mt-2"><button class="btn btn-gold btn-sm">Teach</button><button type="button" class="btn btn-quiet btn-sm" data-dismiss="${esc(u.id)}">Dismiss</button></div>
      </form>`).join('')}</div>`;
}

function knowledge(shop) {
  const desk = shop.frontDesk;
  return `
    <div class="dash-grid">
      <section class="panel">
        <div class="panel-head"><h2 class="h3">What ${esc(desk.name)} knows</h2><span class="faint tiny caps">${desk.knowledge.length} answer${desk.knowledge.length === 1 ? '' : 's'}</span></div>
        ${desk.knowledge.length ? `<ul class="vd-know">${desk.knowledge.map((k) => (editing === k.id ? `
          <li><form data-edit-form="${esc(k.id)}">
            <label class="field"><span class="label">Question</span><input class="input" name="q" value="${esc(k.q)}" maxlength="200"></label>
            <label class="field"><span class="label">Answer</span><textarea class="textarea" name="a" maxlength="800">${esc(k.a)}</textarea></label>
            <div class="vd-actions mt-2"><button class="btn btn-gold btn-sm">Save answer</button><button type="button" class="btn btn-quiet btn-sm" data-cancel-edit>Cancel</button></div>
          </form></li>` : `
          <li>
            <div class="vd-know-top"><h3 class="vd-know-q">${esc(k.q)}</h3>
              <div class="vd-actions"><button class="btn btn-quiet btn-sm" data-edit="${esc(k.id)}">Edit</button><button class="btn btn-quiet btn-sm" data-forget="${esc(k.id)}" style="color:var(--bad)">Forget</button></div></div>
            <p class="vd-know-a">${esc(k.a)}</p>
            <div class="vd-know-meta">${sourceBadge(k)}<span class="faint tiny caps">Used ${num(k.uses)} time${k.uses === 1 ? '' : 's'}</span></div>
          </li>`)).join('')}</ul>`
          : `<div class="vd-empty-inline">${mothMark(30)}Nothing taught yet. Add the first answer, or wait for a guest to ask.</div>`}
      </section>
      <section class="panel panel-gold">
        <div class="panel-head"><h2 class="h3">Add an answer</h2></div>
        <form data-add-know>
          <label class="field"><span class="label">When a guest asks</span><input class="input" name="q" maxlength="200" placeholder="Do you pour custom scents?"></label>
          <label class="field"><span class="label">${esc(desk.name)} should say</span><textarea class="textarea" name="a" maxlength="800" placeholder="Write it as you would say it."></textarea></label>
          <p class="vd-error" data-error role="alert"></p>
          <button class="btn btn-gold btn-sm btn-block">Add to knowledge</button>
        </form>
        <p class="hint mt-2">Answers written here win over everything else the desk knows. Shipping, returns and gifting are quoted from your policies in Settings.</p>
      </section>
    </div>`;
}

function persona(shop) {
  const desk = shop.frontDesk;
  return `
    <div class="dash-grid">
      <form class="panel" data-persona>
        <div class="vd-switch-row">
          <div><h2 class="h3">${esc(desk.name)} is ${desk.enabled ? 'at the desk' : 'off duty'}</h2><p class="vd-note mt-1">When off, guests see no assistant on your storefront.</p></div>
          <label class="switch" title="Front desk enabled"><input type="checkbox" name="enabled" ${desk.enabled ? 'checked' : ''} aria-label="Front desk enabled"><span></span></label>
        </div>
        <div class="form-grid">
          <label class="field"><span class="label">Assistant name</span><input class="input" name="name" value="${esc(desk.name)}" maxlength="24" required></label>
          <label class="field"><span class="label">Tone of voice</span><select class="select" name="tone">${TONES.map(([id, label, sub]) => `<option value="${id}" ${id === desk.tone ? 'selected' : ''}>${label} — ${sub}</option>`).join('')}</select></label>
          <label class="field span-2"><span class="label">Greeting</span><textarea class="textarea" name="greeting" maxlength="300" style="min-height:96px">${esc(desk.greeting)}</textarea></label>
          <label class="field span-2"><span class="label">Hand-off email</span><input class="input" type="email" name="handoffEmail" value="${esc(desk.handoffEmail || '')}" placeholder="you@yourmaison.com"><span class="hint" style="display:block">Where a guest is directed when they ask for you personally.</span></label>
        </div>
        <p class="vd-error" data-error role="alert"></p>
        <div class="vd-form-foot"><button class="btn btn-gold btn-sm">Save persona</button></div>
      </form>
      <section class="panel">
        <div class="panel-head"><h2 class="h3">As guests meet it</h2></div>
        <div class="chat-log">${renderMessages([{ from: 'desk', text: desk.greeting }], desk.name)}</div>
        <p class="hint mt-2">The greeting opens every conversation. Try the voice in <button class="link" data-tab="rehearse">Rehearse</button>.</p>
      </section>
    </div>`;
}

function conversations(shop) {
  const desk = shop.frontDesk; const list = store.listConversations({ shopId: shop.id });
  if (!list.length) return emptyBlock('No conversations yet', `When a guest speaks with ${esc(desk.name)} on your storefront, the full transcript is kept here.`);
  const current = list.find((c) => c.id === openConvo) || list[0];
  const lastGuest = (c) => [...c.messages].reverse().find((m) => m.from === 'visitor')?.text || 'Opened the desk, asked nothing';
  return `
    <div class="vd-convos">
      <section class="panel vd-panel-flush"><div class="vd-convo-list">${list.map((c) => `
        <button class="${c.id === current.id ? 'is-active' : ''}" data-convo="${esc(c.id)}" aria-current="${c.id === current.id}">
          <span class="vd-convo-top"><span>${esc(c.visitor)}</span><span class="faint tiny nowrap">${relTime(c.updatedAt)}</span></span>
          <span class="vd-convo-snip">${esc(lastGuest(c))}</span>
          ${c.resolved ? `<span class="badge badge-ok">Resolved</span>` : `<span class="badge badge-warn">Needs you</span>`}
        </button>`).join('')}</div></section>
      <section class="panel vd-transcript">
        <div class="panel-head"><div><h2 class="h3">${esc(current.visitor)}</h2><div class="faint tiny caps mt-1">${dateFmt(current.startedAt)} · ${current.messages.length} messages</div></div>
          ${current.resolved ? `<span class="badge badge-ok">Resolved by ${esc(desk.name)}</span>` : `<span class="badge badge-warn">Needs you</span>`}</div>
        <div class="chat-log">${renderMessages(current.messages, desk.name)}</div>
        ${current.resolved ? '' : `<p class="preview-note mt-3">${esc(desk.name)} was not confident here and told the guest you would reply. If the question is in your <button class="link" data-tab="teach">Teach inbox</button>, one answer settles it for every future guest.</p>`}
      </section>
    </div>`;
}

const verdict = (m) => (m.confident
  ? `<div class="vd-verdict">Confident · answered without you</div>`
  : `<div class="vd-verdict is-unsure">Not confident · a guest would be told you will reply</div>`);
const inlineTeach = (m, i, name) => (m.taught
  ? `<div class="vd-verdict">Taught · ask again to hear it</div>`
  : `<form class="vd-inline-teach" data-rehearse-teach="${i}"><div class="vd-block-label" style="margin:0">Teach this answer</div>
      <label><span class="label" style="margin:8px 0 0">${esc(name)} should say</span><textarea class="textarea" name="a" maxlength="800" placeholder="Your answer to “${esc(m.q)}”"></textarea></label>
      <button class="btn btn-gold btn-sm">Teach this answer</button></form>`);
const rehearsalBubble = (m, i, name) => (m.from === 'visitor'
  ? renderMessages([m], name)
  : `${renderMessages([m], name)}${verdict(m)}${m.confident ? '' : inlineTeach(m, i, name)}`);

function rehearse(shop) {
  const desk = shop.frontDesk; const log = rehearsals.get(shop.id) || [];
  return `
    <div class="dash-grid">
      <section class="panel panel-gold vd-rehearse">
        <div class="panel-head" style="margin-bottom:12px"><div><h2 class="h3">Play the guest</h2><div class="faint tiny caps mt-1">A private rehearsal with ${esc(desk.name)}</div></div>
          ${log.length ? `<button class="vd-open" data-rehearse-reset>Begin again</button>` : ''}</div>
        <div class="chat-log" id="vd-rehearse-log" aria-live="polite">${renderMessages([{ from: 'desk', text: desk.greeting }], desk.name)}${log.map((m, i) => rehearsalBubble(m, i, desk.name)).join('')}</div>
        <div class="suggests">${frontDesk.suggestions(shop.id).map((s) => `<button type="button" data-rehearse-suggest>${esc(s)}</button>`).join('')}</div>
        <form class="chat-form" data-rehearse-form autocomplete="off"><input name="q" placeholder="Ask as a guest would…" aria-label="Your question as a guest"><button>Send</button></form>
      </section>
      <section class="panel">
        <div class="panel-head"><h2 class="h3">About the rehearsal</h2></div>
        <ul class="vd-standards">
          <li>You see exactly what a guest would be told, with the same catalogue, policies and knowledge.</li>
          <li>Nothing here is logged to your Teach inbox or counted as a conversation.</li>
          <li>When the desk is not confident, teach it on the spot. The answer is saved to its knowledge at once.</li>
        </ul>
      </section>
    </div>`;
}

const SECTIONS = { overview, teach, knowledge, persona, conversations, rehearse };

export function render({ shop }) {
  const desk = shop.frontDesk;
  if (!SECTIONS[tab]) tab = 'overview';
  const counts = { teach: desk.unanswered.length };
  const palaceOff = store.getSettings().aiEnabled === false;
  return `
    <div class="vd-desk-head">${mothMark(40)}
      <div class="grow"><h2 class="h3">${esc(desk.name)}</h2><div class="faint tiny caps">Front desk of ${esc(shop.name)} · ${esc(desk.tone)} tone</div></div>
      ${desk.enabled && !palaceOff ? `<span class="badge badge-ok">At the desk</span>` : `<span class="badge badge-mute">Off duty</span>`}
    </div>
    ${palaceOff ? `<p class="preview-note">The Keeper has paused AI assistants across the Palace. You may keep teaching ${esc(desk.name)}; it will return to guests when assistants are restored.</p>` : ''}
    <nav class="tabs" role="tablist" aria-label="Front desk sections">${TABS.map(([id, label]) => `<button class="tab ${id === tab ? 'is-active' : ''}" role="tab" aria-selected="${id === tab}" data-tab="${id}">${label}${counts[id] ? `<span class="vd-tab-count gold">${counts[id]}</span>` : ''}</button>`).join('')}</nav>
    ${SECTIONS[tab](shop)}`;
}

export function mount(root, ctx) {
  const shop = ctx.shop; const desk = shop.frontDesk;
  const go = () => ctx.refresh();
  root.querySelectorAll('[data-tab]').forEach((b) => { b.onclick = () => { tab = b.dataset.tab; editing = null; go(); }; });

  /* teach */
  root.querySelectorAll('[data-teach]').forEach((form) => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const u = desk.unanswered.find((x) => x.id === form.dataset.teach); const a = form.elements.a.value.trim();
      if (!u) { go(); return; }
      if (!a) { form.elements.a.focus(); toast('Write your answer first, then teach it.'); return; }
      frontDesk.teach(shop.id, { q: u.q, a, unansweredId: u.id });
      toast(`${desk.name} has learned your answer.`); go();
    });
  });
  root.querySelectorAll('[data-dismiss]').forEach((b) => { b.onclick = () => { frontDesk.dismiss(shop.id, b.dataset.dismiss); toast('Question dismissed.'); go(); }; });

  /* knowledge */
  const add = root.querySelector('[data-add-know]');
  if (add) add.addEventListener('submit', (e) => {
    e.preventDefault();
    const d = formData(add);
    if (!d.q || !d.a) { add.querySelector('[data-error]').textContent = 'Please write both the question and the answer.'; return; }
    frontDesk.teach(shop.id, { q: d.q, a: d.a, source: 'owner' });
    toast('Added to the desk’s knowledge.'); go();
  });
  root.querySelectorAll('[data-edit]').forEach((b) => { b.onclick = () => { editing = b.dataset.edit; go(); }; });
  root.querySelectorAll('[data-cancel-edit]').forEach((b) => { b.onclick = () => { editing = null; go(); }; });
  root.querySelectorAll('[data-edit-form]').forEach((form) => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const k = desk.knowledge.find((x) => x.id === form.dataset.editForm); const d = formData(form);
      if (!d.q || !d.a) { toast('An answer needs both a question and a reply.'); return; }
      if (k) { k.q = d.q; k.a = d.a; store.saveFrontDesk(shop.id); toast('Answer updated.'); }
      editing = null; go();
    });
  });
  root.querySelectorAll('[data-forget]').forEach((b) => { b.onclick = async () => {
    const k = desk.knowledge.find((x) => x.id === b.dataset.forget); if (!k) return;
    const ok = await confirmDialog({ title: 'Forget this answer?', body: `${esc(desk.name)} will no longer answer “${esc(k.q)}” on its own, and will ask you if a guest raises it again.`, confirm: 'Forget', cancel: 'Keep it', danger: true });
    if (!ok) return;
    frontDesk.forget(shop.id, k.id); toast('Answer forgotten.'); go();
  }; });

  /* persona */
  const pf = root.querySelector('[data-persona]');
  if (pf) pf.addEventListener('submit', (e) => {
    e.preventDefault();
    const d = formData(pf); const err = pf.querySelector('[data-error]');
    if (!d.name) { err.textContent = 'Please give your assistant a name.'; return; }
    if (d.handoffEmail && !/^\S+@\S+\.\S+$/.test(d.handoffEmail)) { err.textContent = 'That hand-off email does not look complete.'; return; }
    store.saveFrontDesk(shop.id, { enabled: d.enabled, name: d.name, tone: TONES.some((t) => t[0] === d.tone) ? d.tone : 'warm', greeting: d.greeting || `Welcome to ${shop.name}. How may I help you today?`, handoffEmail: d.handoffEmail });
    toast('The front desk persona has been saved.'); go();
  });

  /* conversations */
  root.querySelectorAll('[data-convo]').forEach((b) => { b.onclick = () => { openConvo = b.dataset.convo; go(); }; });
  const transcript = root.querySelector('.vd-transcript .chat-log'); if (transcript) transcript.scrollTop = 0;

  /* rehearse — appended in place so the input keeps focus */
  const rf = root.querySelector('[data-rehearse-form]');
  if (rf) {
    const input = rf.querySelector('input');
    const liveLog = () => document.getElementById('vd-rehearse-log');
    const toEnd = () => { const l = liveLog(); if (l) l.scrollTop = l.scrollHeight; };
    const history = () => { if (!rehearsals.has(shop.id)) rehearsals.set(shop.id, []); return rehearsals.get(shop.id); };
    toEnd();
    const send = (raw) => {
      const text = String(raw || '').trim(); if (!text) return;
      const log = history(); const mine = { from: 'visitor', text };
      log.push(mine);
      const el = liveLog();
      if (el) el.insertAdjacentHTML('beforeend', `${renderMessages([mine], desk.name)}<div class="msg msg-them" data-typing><span class="who">${esc(desk.name)}</span><span class="vd-typing">···</span></div>`);
      input.value = ''; input.focus(); toEnd();
      setTimeout(() => {
        let answer;
        try { answer = frontDesk.think(shop, text, log.length); } catch { answer = { text: 'The desk could not compose a reply to that.', productIds: [], confident: false }; }
        // With an empty catalogue the shared engine can produce a malformed price or burn-time line; never show that.
        if (/undefined|Infinity|NaN/.test(answer.text)) answer = { text: 'There are no live pieces in the maison yet, so the desk has nothing to quote. Add a candle and ask again.', productIds: [], confident: true };
        const reply = { from: 'desk', text: answer.text, productIds: answer.productIds || [], confident: !!answer.confident, q: text };
        log.push(reply);
        const now = liveLog(); if (!now) return;
        now.querySelector('[data-typing]')?.remove();
        now.insertAdjacentHTML('beforeend', rehearsalBubble(reply, log.length - 1, desk.name));
        toEnd();
      }, 480);
    };
    rf.addEventListener('submit', (e) => { e.preventDefault(); send(input.value); });
    root.querySelectorAll('[data-rehearse-suggest]').forEach((b) => { b.onclick = () => send(b.textContent); });
    const reset = root.querySelector('[data-rehearse-reset]');
    if (reset) reset.onclick = () => { rehearsals.delete(shop.id); go(); };
    root.querySelector('#vd-rehearse-log').addEventListener('submit', (e) => {
      const form = e.target.closest('[data-rehearse-teach]'); if (!form) return;
      e.preventDefault();
      const m = history()[+form.dataset.rehearseTeach]; const a = form.elements.a.value.trim();
      if (!m) return;
      if (!a) { form.elements.a.focus(); return; }
      frontDesk.teach(shop.id, { q: m.q, a }); m.taught = true;
      form.outerHTML = `<div class="vd-verdict">Taught · ask again to hear it</div>`;
      toast(`${desk.name} has learned your answer.`);
      // The Teach count in the tab bar and sidebar is unchanged: rehearsal questions never enter the inbox.
    });
  }
}
