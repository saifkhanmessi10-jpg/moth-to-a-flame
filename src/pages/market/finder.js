// "Find your flame" — three gentle questions, then a short list with reasons.
import * as store from '../../store.js';
import { esc, icon, mothMark, money, productCard } from '../../ui.js';

export const meta = { title: 'Find your flame' };

const STEPS = [
  { key: 'moment', q: 'When will it be lit?', hint: 'The hour shapes the scent.', options: [
    { id: 'evening', label: 'Evenings, winding down', sub: 'Soft, warm, restful', notes: ['lavender', 'sandalwood', 'musk', 'tonka', 'vanilla', 'milk', 'iris', 'incense', 'amber', 'honey'] },
    { id: 'morning', label: 'Mornings, beginning again', sub: 'Bright, clean, clear', notes: ['neroli', 'bergamot', 'tea', 'mint', 'citrus', 'orange', 'lime', 'linen', 'fig', 'thyme', 'pear'] },
    { id: 'gathering', label: 'A dinner or a gathering', sub: 'Generous, memorable', notes: ['saffron', 'amber', 'oud', 'rose', 'plum', 'pepper', 'leather', 'resin', 'clove', 'spice'] },
    { id: 'gift', label: 'As a gift for someone', sub: 'Boxed, ribboned, ready', notes: [], gift: true },
  ] },
  { key: 'family', q: 'Which scents draw you in?', hint: 'Choose the one that feels most like home.', options: [
    { id: 'Floral', label: 'Florals', sub: 'Rose, tuberose, gardenia', notes: ['rose', 'jasmine', 'tuberose', 'gardenia', 'peony', 'blossom', 'lily', 'ylang', 'iris', 'lavender'] },
    { id: 'Woody & Resin', label: 'Woods & smoke', sub: 'Cedar, oud, incense', notes: ['smoke', 'birch', 'oud', 'cedar', 'guaiac', 'pine', 'frankincense', 'myrrh', 'leather', 'palo', 'wood', 'amber'] },
    { id: 'Fresh & Coastal', label: 'Fresh & green', sub: 'Sea salt, herbs, citrus', notes: ['salt', 'sea', 'thyme', 'sage', 'juniper', 'neroli', 'tea', 'mint', 'linen', 'lichen', 'fig'] },
    { id: 'Gourmand', label: 'Warm & sweet', sub: 'Vanilla, honey, spice', notes: ['vanilla', 'sugar', 'honey', 'milk', 'brioche', 'tonka', 'almond', 'chai', 'cardamom', 'butter'] },
    { id: 'any', label: 'Surprise me', sub: 'Show me the house favourites', notes: [] },
  ] },
  { key: 'budget', q: 'And the budget?', hint: 'Delivery is always complimentary.', options: [
    { id: 'u75', label: 'Under $75', max: 7500 }, { id: 'u120', label: '$75 – $120', min: 7500, max: 12000 },
    { id: 'treat', label: 'A true indulgence', sub: '$120 and above', min: 12000 }, { id: 'any', label: 'No preference' },
  ] },
];
let answers = {};
let step = 0;

const opt = (k) => STEPS.find((x) => x.key === k).options.find((o) => o.id === answers[k]);
const hay = (p) => [p.notes.top, p.notes.heart, p.notes.base, p.name].join(' ').toLowerCase();
const hitsIn = (p, list = []) => list.filter((n) => new RegExp(`\\b${n}`).test(hay(p)));
/** Does this piece belong to the chosen scent family? */
function fits(p) {
  const fam = opt('family');
  if (!fam || fam.id === 'any') return true;
  return p.category === fam.id || hitsIn(p, fam.notes).length >= 2;
}
function score(p) {
  const fam = opt('family'); const moment = opt('moment');
  const why = []; let s = 0;
  if (fam && fam.id !== 'any') {
    const h = hitsIn(p, fam.notes);
    if (p.category === fam.id) { s += 5; why.push(fam.label.toLowerCase()); }
    if (h.length) { s += h.length * 1.5; why.push(h.slice(0, 2).join(' and ')); }
  }
  if (moment?.gift) { if (p.category === 'Gift Sets' || p.tags?.includes('gift')) { s += 6; why.push('arrives ready to give'); } }
  else if (moment) { const h = hitsIn(p, moment.notes); if (h.length) { s += h.length * 1.2; why.push(`made for ${moment.label.split(',')[0].toLowerCase()}`); } }
  if (p.tags?.includes('bestseller')) { s += 1; why.push('a patron favourite'); }
  return { p, s, why: [...new Set(why)] };
}
function matches() {
  const b = opt('budget') || {};
  const inBudget = (p) => (b.min == null || p.price >= b.min) && (b.max == null || p.price < b.max);
  const all = store.listProducts({ publicOnly: true }).filter((p) => p.stock > 0 && p.category !== 'Subscriptions');
  let pool = all.filter((p) => fits(p) && inBudget(p)); let widened = false;
  if (pool.length < 3) { pool = all.filter(fits); widened = true; }
  if (pool.length < 3) pool = all;
  const ranked = pool.map(score).map((r) => ({ ...r, s: r.s + (inBudget(r.p) ? 4 : 0) }));
  return { list: ranked.sort((x, y) => y.s - x.s || x.p.price - y.p.price).slice(0, 6), widened };
}

function stepView() {
  const s = STEPS[step];
  return `<div class="fd-step" data-step="${step}">
    ${step === 0 ? `<header class="center mb-4"><div class="eyebrow">Find your flame</div><p class="lede mt-1">Three questions. No wrong answers.</p></header>` : ''}
    <div class="fd-progress" aria-label="Question ${step + 1} of ${STEPS.length}">${STEPS.map((_, i) => `<span class="${i <= step ? 'is-on' : ''}"></span>`).join('')}</div>
    <div class="eyebrow mt-3">Question ${step + 1} of ${STEPS.length}</div>
    <h2 class="h1 mt-1">${esc(s.q)}</h2><p class="muted mt-1">${esc(s.hint)}</p>
    <div class="fd-options">${s.options.map((o) => `<button type="button" class="fd-option ${answers[s.key] === o.id ? 'is-on' : ''}" data-pick="${esc(o.id)}">
      <span class="fd-option-label">${esc(o.label)}</span>${o.sub ? `<span class="fd-option-sub">${esc(o.sub)}</span>` : ''}</button>`).join('')}</div>
    ${step ? `<button type="button" class="btn btn-quiet btn-sm mt-3" data-back>${icon('back')} Back</button>` : ''}
  </div>`;
}
function resultView() {
  const { list, widened } = matches();
  const label = (k) => STEPS.find((s) => s.key === k).options.find((o) => o.id === answers[k])?.label || '';
  return `<div class="fd-results">
    <div class="center">${mothMark(48)}<div class="eyebrow mt-2">Chosen for you</div>
      <h2 class="h1 mt-1">Your flames</h2>
      <p class="muted mt-1">${esc(label('moment'))} · ${esc(label('family'))} · ${esc(label('budget'))}</p>
      ${widened ? `<p class="small gold mt-1">Only a few pieces sit in that budget, so we have included the closest beyond it.</p>` : ''}
    </div>
    <div class="grid cols-3 mt-4">${list.map(({ p, why }) => `<div class="fd-result">${productCard(p)}${why.length ? `<p class="fd-why">${icon('spark')}<span>${esc((why.slice(0, 3).join(' · ')).replace(/^./, (c) => c.toUpperCase()))}</span></p>` : ''}</div>`).join('')}</div>
    <div class="row row-wrap mt-5" style="justify-content:center"><button class="btn btn-ghost" type="button" data-restart>Begin again</button><a class="btn btn-ghost" href="#/palace/search">Browse everything</a></div>
    <p class="small muted center mt-3">Want a second opinion? Every maison has a front desk — open any piece and ask.</p>
  </div>`;
}

export function render() {
  return `<section class="section fd">
    <div class="container ${step < STEPS.length ? 'container-narrow' : ''}">
            <div data-fd-stage>${step < STEPS.length ? stepView() : resultView()}</div>
    </div></section>`;
}

export function mount(root) {
  const stage = root.querySelector('[data-fd-stage]');
  const redraw = () => { stage.innerHTML = step < STEPS.length ? stepView() : resultView(); stage.querySelector('button, a')?.focus({ preventScroll: true }); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  stage.addEventListener('click', (e) => {
    const pick = e.target.closest('[data-pick]');
    if (pick) { answers[STEPS[step].key] = pick.dataset.pick; pick.classList.add('is-on'); step += 1; setTimeout(redraw, 180); return; }
    if (e.target.closest('[data-back]')) { step = Math.max(0, step - 1); redraw(); return; }
    if (e.target.closest('[data-restart]')) { answers = {}; step = 0; redraw(); }
  });
}
