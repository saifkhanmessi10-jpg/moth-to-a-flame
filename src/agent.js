// The two AI roles of the Palace.
//
//   frontDesk  — each maison's own guest-facing assistant. It answers from the
//                maison's catalogue, policies and whatever the owner has taught
//                it. Questions it cannot answer are logged for the owner; once
//                answered they become knowledge, so the desk improves with use.
//   mothAgent  — the owner-facing (and Keeper-facing) analyst. It reads sales,
//                traffic, chats and stock, and reports in plain language.
//
// In this preview both run on-device with retrieval and rules, so the site works
// without keys or a server. `frontDesk.reply` and `mothAgent.ask` are the two
// seams where a hosted language model plugs in for production: same inputs,
// same return shape (see docs/ARCHITECTURE.md → "AI").

import * as store from './store.js';
import { money, pct, num } from './ui.js';

const STOP = new Set('a an the is are do does did you your i my me we our it its of for to in on at and or with can could would will be have has how what when where which who why this that there any some much many long about from as by so if please hi hello hey thanks thank'.split(' '));
const tokens = (s) => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter((w) => w.length > 1 && !STOP.has(w)).map((w) => w.replace(/(ing|es|s)$/, ''));
const overlap = (a, b) => { const B = new Set(b); let n = 0; new Set(a).forEach((w) => { if (B.has(w)) n++; }); return n; };

const TONE = {
  warm: { open: ['Of course.', 'Happily.', 'With pleasure.'], miss: 'That is a lovely question, and I would rather not guess. I have passed it to the maison, who will reply personally.', close: 'Is there anything else I may help you with?' },
  formal: { open: ['Certainly.', 'Of course.', 'Allow me.'], miss: 'I do not wish to mislead you, so I have referred your question to the maison directly. You may expect a personal reply.', close: 'May I assist with anything further?' },
  poetic: { open: ['Gladly.', 'Let me light the way.', 'Of course.'], miss: 'Some answers deserve the maker’s own voice. I have carried your question to the atelier, and they will answer you themselves.', close: 'What else may I illuminate for you?' },
};
const pickOpen = (tone, seed) => TONE[tone].open[seed % TONE[tone].open.length];

const MOODS = [
  { keys: ['sleep', 'bedroom', 'night', 'evening', 'relax', 'calm', 'unwind', 'bath', 'rest'], notes: ['lavender', 'sandalwood', 'musk', 'tonka', 'vanilla', 'milk', 'iris', 'incense'], say: 'For winding down' },
  { keys: ['morning', 'fresh', 'clean', 'kitchen', 'bright', 'energ', 'focus', 'office', 'work'], notes: ['neroli', 'bergamot', 'tea', 'mint', 'salt', 'thyme', 'citrus', 'orange', 'lime', 'sage', 'linen'], say: 'For a brighter room' },
  { keys: ['smok', 'wood', 'cozy', 'cosy', 'fire', 'winter', 'masculine', 'dark', 'resin', 'oud', 'leather', 'incense'], notes: ['smoke', 'birch', 'oud', 'cedar', 'guaiac', 'pine', 'frankincense', 'myrrh', 'leather', 'palo', 'amber'], say: 'For something deeper' },
  { keys: ['floral', 'flower', 'rose', 'romantic', 'feminine', 'spring', 'garden', 'bloom'], notes: ['rose', 'jasmine', 'tuberose', 'gardenia', 'peony', 'blossom', 'lily', 'ylang'], say: 'If you love flowers' },
  { keys: ['sweet', 'gourmand', 'vanilla', 'dessert', 'bakery', 'cozy', 'comfort'], notes: ['vanilla', 'sugar', 'honey', 'milk', 'brioche', 'tonka', 'almond', 'chai'], say: 'For something comforting' },
];
const INTENT = [
  { id: 'greeting', re: /^(hi|hello|hey|good (morning|afternoon|evening)|bonjour)\b/i },
  { id: 'thanks', re: /\b(thank|thanks|merci|perfect|wonderful|great)\b/i },
  { id: 'human', re: /\b(human|person|owner|maker|speak to|talk to|call me|email me)\b/i },
  { id: 'gift', re: /\b(gift|present|wrap|birthday|anniversary|wedding|housewarming|hostess)\b/i },
  { id: 'price', re: /\b(price|cost|how much|cheapest|least expensive|under \$?\d+|budget|most expensive)\b/i },
  { id: 'stock', re: /\b(in stock|available|back in stock|restock|sold out|left)\b/i },
  { id: 'burn', re: /\b(burn time|how long.*(burn|last)|hours)\b/i },
  { id: 'best', re: /\b(best ?seller|most popular|most loved|favou?rite|recommend|suggest|which (one|candle)|what should i|new arrival|newest)\b/i },
  { id: 'order', re: /\b(my order|track|tracking|where is|delivery status|order status)\b/i },
];

function scoreProduct(p, words) {
  const hay = tokens([p.name, p.collection, p.category, p.notes.top, p.notes.heart, p.notes.base, p.description, (p.tags || []).join(' ')].join(' '));
  return overlap(words, hay) * 2 + (tokens(p.name).some((w) => words.includes(w)) ? 3 : 0);
}
const describe = (p) => `${p.name} — ${[p.notes.top, p.notes.heart, p.notes.base].filter(Boolean).join(' · ')} (${money(p.price)})`;

export const frontDesk = {
  /** Opening suggestions shown as chips under the conversation. */
  suggestions(shopId) {
    const top = store.getShop(shopId)?.frontDesk.knowledge.filter((k) => k.source !== 'owner' || k.uses > 0).sort((a, b) => b.uses - a.uses)[0];
    const base = ['What do you recommend?', 'Something for a gift', 'How long is delivery?', 'Which is best for evenings?'];
    return top && top.source !== 'owner' ? [top.q.split('?')[0] + '?', ...base.slice(0, 3)] : base;
  },
  /**
   * Answer a guest. Returns { text, productIds, confident }.
   * Side effects: stores both messages on the conversation, counts the chat,
   * reinforces whichever knowledge entry was used, and — when the desk cannot
   * answer — logs the question for the owner and notifies them.
   */
  reply(shopId, conversationId, text) {
    const shop = store.getShop(shopId); const desk = shop.frontDesk; const tone = TONE[desk.tone] ? desk.tone : 'warm';
    const convo = store.getConversation(conversationId);
    const firstGuestMessage = !convo.messages.some((m) => m.from === 'visitor');
    store.appendMessage(conversationId, { from: 'visitor', text });
    if (firstGuestMessage) store.track('chat', { shopId });
    const answer = this.think(shop, text, convo.messages.length);
    if (!answer.confident) {
      const words = tokens(text);
      const known = desk.unanswered.find((u) => overlap(tokens(u.q), words) >= Math.max(2, Math.ceil(words.length * 0.6)));
      if (known) { known.count += 1; known.lastAt = Date.now(); } else desk.unanswered.unshift({ id: `uq_${Date.now().toString(36)}`, q: text, count: 1, lastAt: Date.now() });
      store.saveFrontDesk(shopId);
      store.notify(shopId, { kind: 'desk', title: `${desk.name} needs your guidance`, body: `A guest asked: “${text.slice(0, 90)}”`, link: '/atelier/front-desk' });
    }
    store.appendMessage(conversationId, { from: 'desk', text: answer.text, productIds: answer.productIds }, { resolved: answer.confident });
    return answer;
  },
  /** Pure reasoning step — no side effects except reinforcing a used knowledge entry. */
  think(shop, text, seed = 0) {
    const desk = shop.frontDesk; const tone = TONE[desk.tone] ? desk.tone : 'warm';
    const words = tokens(text); const raw = text.toLowerCase();
    const catalogue = store.listProducts({ shopId: shop.id, status: 'live' });
    const inStock = catalogue.filter((p) => p.stock > 0);
    const intents = INTENT.filter((i) => i.re.test(text)).map((i) => i.id);
    const out = (t, productIds = [], confident = true) => ({ text: t, productIds, confident });

    // 1 — what the owner has taught (or the desk has learned) always wins.
    const ranked = desk.knowledge.map((k) => ({ k, s: overlap(words, tokens(k.q)) + (k.source === 'learned' ? 0.5 : 0) })).sort((a, b) => b.s - a.s || b.k.uses - a.k.uses);
    const best = ranked[0];
    const strong = best && best.s >= Math.min(2, Math.max(1, words.length));
    const named = catalogue.map((p) => ({ p, s: scoreProduct(p, words) })).filter((x) => x.s >= 3).sort((a, b) => b.s - a.s);
    if (strong && !(named.length && intents.some((i) => ['price', 'stock', 'burn'].includes(i)))) {
      best.k.uses += 1; store.saveFrontDesk(shop.id);
      return out(`${pickOpen(tone, seed)} ${best.k.a}`);
    }

    if (!catalogue.length) {
      if (intents.includes('greeting')) return out(`Good day, and welcome to ${shop.name}. The maison is still arranging its first pieces — I can answer questions about delivery, gifting and care in the meantime.`);
      if (intents.includes('thanks')) return out(`It is my pleasure. ${TONE[tone].close}`);
      return out(TONE[tone].miss, [], false);
    }

    // 2 — questions about a specific candle.
    if (named.length) {
      const p = named[0].p;
      if (intents.includes('burn')) return out(`${p.name} burns for roughly ${p.burnTime} hours (${p.weight}).`, [p.id]);
      if (intents.includes('stock')) return out(p.stock > 0 ? `${p.name} is available — ${p.stock <= 5 ? `only ${p.stock} remain` : 'ready to leave the atelier'}.` : `${p.name} is resting between batches at the moment. Follow the maison and you will be the first to know when it returns.`, [p.id], true);
      if (intents.includes('price')) return out(`${p.name} is ${money(p.price)}, with complimentary insured delivery.`, [p.id]);
      return out(`${pickOpen(tone, seed)} ${describe(p)}. ${p.description}`, named.slice(0, 3).map((x) => x.p.id));
    }

    // 3 — intents that need no catalogue match.
    if (intents.includes('human')) return out(`Of course — I have asked ${shop.name} to reach out to you personally. They usually reply within a day.`, [], false);
    if (intents.includes('order')) return out('For anything about an existing order, your account page shows each parcel and its tracking number the moment it leaves the atelier. If something looks amiss, tell me the order number and I will alert the maison.');
    if (intents.includes('gift')) {
      const sets = inStock.filter((p) => p.category === 'Gift Sets' || p.tags?.includes('gift')).slice(0, 3);
      const list = sets.length ? sets : inStock.slice(0, 2);
      return out(`${pickOpen(tone, seed)} ${shop.policies.gifting}${list.length ? ` For a gift, I would suggest ${list.map((p) => p.name).join(' or ')}.` : ''}`, list.map((p) => p.id));
    }
    if (intents.includes('price')) {
      const sorted = [...inStock].sort((a, b) => a.price - b.price);
      const cap = raw.match(/under \$?(\d+)/); const pool = cap ? sorted.filter((p) => p.price <= +cap[1] * 100) : sorted;
      if (!pool.length) return out(`Our pieces begin at ${money(sorted[0]?.price)}. The most accessible is ${sorted[0]?.name}.`, sorted.slice(0, 1).map((p) => p.id));
      const sel = /most expensive|finest/.test(raw) ? pool.slice(-2).reverse() : pool.slice(0, 3);
      return out(`${shop.name} pieces range from ${money(sorted[0].price)} to ${money(sorted[sorted.length - 1].price)}. ${cap ? `Within ${money(+cap[1] * 100)}:` : 'To begin:'} ${sel.map((p) => `${p.name} (${money(p.price)})`).join(', ')}.`, sel.map((p) => p.id));
    }

    // 4 — mood and scent-note matching.
    const mood = MOODS.map((m) => ({ m, s: m.keys.filter((k) => raw.includes(k)).length })).sort((a, b) => b.s - a.s)[0];
    const scored = inStock.map((p) => {
      const hay = [p.notes.top, p.notes.heart, p.notes.base, p.name, p.category].join(' ').toLowerCase();
      return { p, s: scoreProduct(p, words) + (mood.s ? mood.m.notes.filter((n) => hay.includes(n)).length * 1.5 : 0) };
    }).filter((x) => x.s > 0).sort((a, b) => b.s - a.s).slice(0, 3);
    if (scored.length && (mood.s || scored[0].s >= 2)) {
      return out(`${mood.s ? mood.m.say : 'From what you describe'}, I would reach for ${scored.map((x) => describe(x.p)).join('; ')}.`, scored.map((x) => x.p.id));
    }
    if (intents.includes('best')) {
      const top = store.topProducts(shop.id, 60, 3).map((x) => x.product).filter((p) => p.stock > 0);
      const list = top.length ? top : inStock.slice(0, 3);
      const fresh = /new/.test(raw) ? [...inStock].sort((a, b) => b.createdAt - a.createdAt).slice(0, 3) : list;
      return out(`${/new/.test(raw) ? 'The newest pours are' : 'Our patrons return most often to'} ${fresh.map((p) => p.name).join(', ')}. Tell me the mood you are after — evening, fresh, floral, smoky — and I will narrow it down.`, fresh.map((p) => p.id));
    }
    if (intents.includes('stock')) { const low = inStock.filter((p) => p.stock <= 5); return out(low.length ? `Nearly everything is available. ${low.map((p) => p.name).join(' and ')} ${low.length > 1 ? 'are' : 'is'} down to the last few.` : 'Everything shown in the maison is available and ready to leave the atelier.', low.map((p) => p.id)); }
    if (intents.includes('burn')) return out(`Our candles burn between ${Math.min(...catalogue.map((p) => p.burnTime))} and ${Math.max(...catalogue.map((p) => p.burnTime))} hours depending on the size. Which piece are you considering?`);
    if (best && best.s >= 1 && words.length <= 4) { best.k.uses += 1; store.saveFrontDesk(shop.id); return out(`${pickOpen(tone, seed)} ${best.k.a}`); }
    if (intents.includes('greeting')) return out(`Good day, and welcome to ${shop.name}. Tell me a mood, a room or a person you are shopping for, and I will find the right flame.`);
    if (intents.includes('thanks')) return out(`It is my pleasure. ${TONE[tone].close}`);

    // 5 — honest fallback: hand to the owner and learn from the answer.
    return out(TONE[tone].miss, [], false);
  },
  /** Owner teaches the desk. Optionally resolves an item from the unanswered inbox. */
  teach(shopId, { q, a, unansweredId = null, source = 'learned' }) {
    const desk = store.getShop(shopId).frontDesk;
    desk.knowledge.unshift({ id: `k_${Date.now().toString(36)}`, q, a, source, uses: 0, at: Date.now() });
    if (unansweredId) desk.unanswered = desk.unanswered.filter((u) => u.id !== unansweredId);
    store.saveFrontDesk(shopId);
  },
  forget(shopId, knowledgeId) { const desk = store.getShop(shopId).frontDesk; desk.knowledge = desk.knowledge.filter((k) => k.id !== knowledgeId); store.saveFrontDesk(shopId); },
  dismiss(shopId, unansweredId) { const desk = store.getShop(shopId).frontDesk; desk.unanswered = desk.unanswered.filter((u) => u.id !== unansweredId); store.saveFrontDesk(shopId); },
  /** { conversations, resolvedRate, knowledge, learned, unanswered, topQuestions } */
  stats(shopId) {
    const desk = store.getShop(shopId).frontDesk; const convos = store.listConversations({ shopId });
    return {
      conversations: convos.length, resolvedRate: convos.length ? convos.filter((c) => c.resolved).length / convos.length : 1,
      knowledge: desk.knowledge.length, learned: desk.knowledge.filter((k) => k.source === 'learned').length, unanswered: desk.unanswered.length,
      topQuestions: [...desk.knowledge].sort((a, b) => b.uses - a.uses).slice(0, 5),
    };
  },
};

/* ------------------------------------------------------------- Moth Agent */
const trend = (d) => (d == null ? '' : d >= 0 ? ` (up ${Math.abs(d * 100).toFixed(0)}%)` : ` (down ${Math.abs(d * 100).toFixed(0)}%)`);
const hourGreeting = () => { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'; };

export const mothAgent = {
  /**
   * The owner's briefing. Returns
   * { greeting, headline, today: {visits, orders, revenue, chats}, bullets: [string],
   *   insights: [{ kind: 'win'|'watch'|'idea', title, body, link }] }
   */
  briefing(shopId) {
    const shop = store.getShop(shopId); const owner = store.getUser(shop.ownerId);
    const d1 = store.metrics(shopId, 1).totals; const d7 = store.metrics(shopId, 7); const d30 = store.metrics(shopId, 30);
    const top = store.topProducts(shopId, 30, 3); const bal = store.balance(shopId);
    const products = store.listProducts({ shopId });
    const low = products.filter((p) => p.status === 'live' && p.stock > 0 && p.stock <= 5); const out = products.filter((p) => p.status === 'live' && p.stock === 0);
    const open = store.listParcels({ shopId }).filter((x) => ['placed', 'preparing'].includes(x.parcel.status));
    const desk = shop.frontDesk;
    const bullets = [
      `${num(d7.totals.visits)} guests visited in the last seven days${trend(d7.delta.visits)}, viewing ${num(d7.totals.productViews)} pieces.`,
      `${d7.totals.orders} order${d7.totals.orders === 1 ? '' : 's'} worth ${money(d7.totals.revenue)}${trend(d7.delta.revenue)} — a ${pct(d7.totals.conversion)} conversion.`,
      `${d7.totals.chats} conversation${d7.totals.chats === 1 ? '' : 's'} at the front desk; ${desk.unanswered.length ? `${desk.unanswered.length} question${desk.unanswered.length === 1 ? '' : 's'} await your answer` : `${desk.name} answered every one`}.`,
      `${money(bal.available)} is ready for payout, with ${money(bal.pending)} still in preparation.`,
    ];
    const insights = [];
    if (open.length) insights.push({ kind: 'watch', title: `${open.length} parcel${open.length === 1 ? '' : 's'} to prepare`, body: `The oldest was placed ${Math.max(1, Math.round((Date.now() - Math.min(...open.map((x) => x.order.createdAt))) / 3600000))} hours ago. Patrons here expect dispatch within two working days.`, link: '/atelier/orders' });
    if (desk.unanswered.length) insights.push({ kind: 'watch', title: `Teach ${desk.name} ${desk.unanswered.length} new answer${desk.unanswered.length === 1 ? '' : 's'}`, body: `“${desk.unanswered[0].q}” has been asked ${desk.unanswered[0].count} time${desk.unanswered[0].count === 1 ? '' : 's'}. Answer once and the desk will handle it from then on.`, link: '/atelier/front-desk' });
    if (low.length) insights.push({ kind: 'watch', title: `${low[0].name} is nearly gone`, body: `${low.map((p) => `${p.name} (${p.stock})`).join(', ')}. Consider pouring the next batch.`, link: '/atelier/products' });
    if (out.length) insights.push({ kind: 'idea', title: `${out.length} piece${out.length === 1 ? ' is' : 's are'} resting`, body: `${out.map((p) => p.name).join(', ')} still draw${out.length === 1 ? 's' : ''} visits. Restock, or mark as a limited edition to keep the desire alive.`, link: '/atelier/products' });
    if (top[0]) insights.push({ kind: 'win', title: `${top[0].product.name} leads the maison`, body: `${top[0].units} sold for ${money(top[0].revenue)} this month${top[1] ? `, ahead of ${top[1].product.name}` : ''}. It deserves the first position on your storefront.`, link: '/atelier/storefront' });
    if (d30.totals.bagAdds > d30.totals.orders * 2.5) insights.push({ kind: 'idea', title: 'Bags are being filled, then left', body: `${d30.totals.bagAdds} pieces were added to bags this month but only ${d30.totals.orders} orders followed. A short storefront announcement about complimentary gift wrapping often closes that gap.`, link: '/atelier/storefront' });
    if (d7.delta.visits != null && d7.delta.visits > 0.1) insights.push({ kind: 'win', title: 'Footfall is rising', body: `Visits are up ${(d7.delta.visits * 100).toFixed(0)}% week over week. A new arrival now would meet the most eyes.`, link: '/atelier/analytics' });
    return {
      greeting: `${hourGreeting()}, ${owner?.name.split(' ')[0] || 'maker'}.`,
      headline: d1.orders ? `${d1.orders} order${d1.orders === 1 ? '' : 's'} today, ${money(d1.revenue)} so far.` : `${num(d1.visits)} guests have stepped inside today.`,
      today: { visits: d1.visits, orders: d1.orders, revenue: d1.revenue, chats: d1.chats }, bullets, insights,
    };
  },
  suggestions: () => ['How were sales this week?', 'What is my best seller?', 'How is traffic?', 'What is running low?', 'How much will I be paid?', 'What should I do next?'],
  /** Owner asks a question in plain language. Returns { text, link? }. */
  ask(shopId, question) {
    const q = question.toLowerCase(); const shop = store.getShop(shopId);
    const days = /today/.test(q) ? 1 : /month|30/.test(q) ? 30 : /quarter|90|60/.test(q) ? 60 : 7;
    const label = days === 1 ? 'today' : days === 7 ? 'in the last seven days' : `in the last ${days} days`;
    const m = store.metrics(shopId, days); const t = m.totals;
    if (/(pay|payout|paid|balance|fee|commission|earn)/.test(q)) {
      const b = store.balance(shopId); const rate = store.feeRateFor(shop);
      return { text: `${money(b.available)} is available for payout now and ${money(b.pending)} is still in preparation. To date the maison has sold ${money(b.gross)}; the Palace fee of ${pct(rate, 0)} came to ${money(b.fees)}, leaving you ${money(b.net)}. ${money(b.paid)} has already been paid out.`, link: '/atelier/payouts' };
    }
    if (/(best|top|popular|seller|selling)/.test(q)) {
      const top = store.topProducts(shopId, Math.max(days, 30), 3);
      return top.length ? { text: `Your leaders this month:\n${top.map((x, i) => `${i + 1}. ${x.product.name} — ${x.units} sold, ${money(x.revenue)}`).join('\n')}`, link: '/atelier/analytics' } : { text: 'No sales yet in that period — once the first order arrives I will rank your pieces here.' };
    }
    if (/(low|stock|inventory|restock|sold out)/.test(q)) {
      const ps = store.listProducts({ shopId, status: 'live' }); const low = ps.filter((p) => p.stock <= 5).sort((a, b) => a.stock - b.stock);
      return { text: low.length ? `Watch these:\n${low.map((p) => `• ${p.name} — ${p.stock === 0 ? 'resting (none left)' : `${p.stock} left`}`).join('\n')}` : 'Every live piece has comfortable stock.', link: '/atelier/products' };
    }
    if (/(traffic|visit|click|view|footfall|guest)/.test(q)) return { text: `${num(t.visits)} visits ${label}${trend(m.delta.visits)}, ${num(t.productViews)} product views and ${num(t.bagAdds)} bag adds. ${pct(t.conversion)} of visits became orders.`, link: '/atelier/analytics' };
    if (/(chat|desk|question|conversation|ask)/.test(q)) {
      const s = frontDesk.stats(shopId);
      return { text: `${shop.frontDesk.name} held ${t.chats} conversations ${label} and resolves ${pct(s.resolvedRate, 0)} without you. It knows ${s.knowledge} answers (${s.learned} learned from you) and has ${s.unanswered} question${s.unanswered === 1 ? '' : 's'} waiting.`, link: '/atelier/front-desk' };
    }
    if (/(order|ship|fulfil|parcel|dispatch)/.test(q) && !/sales/.test(q)) {
      const open = store.listParcels({ shopId }).filter((x) => ['placed', 'preparing'].includes(x.parcel.status));
      return { text: open.length ? `${open.length} parcel${open.length === 1 ? '' : 's'} awaiting dispatch:\n${open.slice(0, 5).map((x) => `• ${x.order.number} — ${x.parcel.items.map((i) => i.name).join(', ')}`).join('\n')}` : 'Nothing is waiting — every parcel has been dispatched.', link: '/atelier/orders' };
    }
    if (/(sale|revenue|sold|money|doing|perform|how (was|were|is|are))/.test(q)) return { text: `${t.orders} order${t.orders === 1 ? '' : 's'} worth ${money(t.revenue)} ${label}${trend(m.delta.revenue)}. Average order ${money(t.orders ? Math.round(t.revenue / t.orders) : 0)}; conversion ${pct(t.conversion)}.`, link: '/atelier/analytics' };
    if (/(next|advice|suggest|improve|grow|should i|idea|recommend)/.test(q)) {
      const b = this.briefing(shopId);
      return { text: b.insights.length ? `Three things I would do:\n${b.insights.slice(0, 3).map((i, n) => `${n + 1}. ${i.title} — ${i.body}`).join('\n')}` : 'The maison is in fine order. A new arrival or a limited pour would be the next thing to try.' };
    }
    return { text: `I keep watch over sales, traffic, front-desk conversations, stock and payouts for ${shop.name}. Ask me, for example, “How were sales this month?” or “What is running low?”` };
  },
  /** The Keeper's view of the whole Palace. Same shape as briefing(). */
  palaceBriefing() {
    const d1 = store.metrics(null, 1).totals; const d7 = store.metrics(null, 7); const fin7 = store.palaceFinance(7); const league = store.shopLeague(30);
    const pending = store.listApplications('pending'); const requested = store.listPayouts({ status: 'requested' });
    const late = store.listParcels({}).filter((x) => ['placed', 'preparing'].includes(x.parcel.status) && Date.now() - x.order.createdAt > 3 * store.DAY);
    const struggling = store.listShops({ status: 'live' }).filter((s) => s.frontDesk.unanswered.length >= 3);
    const insights = [];
    if (pending.length) insights.push({ kind: 'watch', title: `${pending.length} residency application${pending.length === 1 ? '' : 's'} to review`, body: `${pending.map((a) => a.maisonName).join(', ')}.`, link: '/keeper/applications' });
    if (requested.length) insights.push({ kind: 'watch', title: `${requested.length} payout${requested.length === 1 ? '' : 's'} awaiting settlement`, body: `${money(requested.reduce((s, p) => s + p.amount, 0))} requested by maisons.`, link: '/keeper/finance' });
    if (late.length) insights.push({ kind: 'watch', title: `${late.length} parcel${late.length === 1 ? ' is' : 's are'} late to dispatch`, body: `${[...new Set(late.map((x) => store.getShop(x.parcel.shopId).name))].join(', ')} — beyond the three-day house standard.`, link: '/keeper/orders' });
    if (struggling.length) insights.push({ kind: 'idea', title: 'Front desks that need coaching', body: `${struggling.map((s) => s.name).join(', ')} have several unanswered guest questions.`, link: '/keeper/ai' });
    if (league[0]) insights.push({ kind: 'win', title: `${league[0].shop.name} leads the Palace`, body: `${money(league[0].revenue)} in sales this month from ${league[0].orders} orders.`, link: '/keeper/maisons' });
    return {
      greeting: `${hourGreeting()}, Keeper.`,
      headline: `${money(fin7.gmv)} passed through the Palace this week, earning ${money(fin7.fees)} in fees.`,
      today: { visits: d1.visits, orders: d1.orders, revenue: d1.revenue, chats: d1.chats },
      bullets: [
        `${num(d7.totals.visits)} visits across ${store.listShops({ status: 'live' }).length} live maisons${trend(d7.delta.visits)}.`,
        `${fin7.orders} orders, average ${money(fin7.aov)}${trend(d7.delta.revenue)}.`,
        `${d7.totals.chats} front-desk conversations handled by the maisons’ assistants.`,
      ],
      insights,
    };
  },
};
