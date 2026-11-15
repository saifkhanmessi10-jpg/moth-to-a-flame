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

function score(p) {
  const moment = STEPS[0].options.find((o) => o.id === answers.moment);
  const family = STEPS[1].options.find((o) => o.id === answers.family);
  const hay = [p.notes.top, p.notes.heart, p.notes.base, p.name, p.description].join(' ').toLowerCase();
  const hits = (list = []) => list.filter((n) => hay.includes(n));
  const why = [];
  let s = 0;
  if (family?.id !== 'any') {
    const h = hits(family?.notes);
    if (p.category === family?.id) { s += 4; why.push(`a ${family.label.toLowerCase()} piece`); }
    if (h.length) { s += h.length * 1.5; why.push(`notes of ${h.slice(0, 2).join(' and ')}`); }
  } else if (p.tags?.includes('bestseller')) { s += 3; why.push('a patron favourite'); }
  if (moment?.gift) { if (p.category === 'Gift Sets' || p.tags?.includes('gift')) { s += 5; why.push('arrives ready to give'); } }
  else { const h = hits(moment?.notes); if (h.length) { s += h.length * 1.2; why.push(`suited to ${moment.label.split(',')[0].toLowerCase()}`); } }
  if (p.tags?.includes('bestseller')) s += 0.5;
  return { p, s, why: [...new Set(why)] };
}
function matches() {
  const b = STEPS[2].options.find((o) => o.id === answers.budget) || {};
  let list = store.listProducts({ publicOnly: true }).filter((p) => p.stock > 0 && p.category !== 'Subscriptions');
  const inBudget = list.filter((p) => (b.min == null || p.price >= b.min) && (b.max == null || p.price < b.max));
  const ranked = (inBudget.length ? inBudget : list).map(score).sort((a, c) => c.s - a.s);
  return { list: ranked.slice(0, 6), widened: !inBudget.length };
}

function stepView() {
  const s = STEPS[step];
  return `<div class="fd-step" data-step="${step}">
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
      ${widened ? `<p class="small gold mt-1">Nothing matched that budget exactly, so we have widened it a little.</p>` : ''}
    </div>
    <div class="grid cols-3 mt-4">${list.map(({ p, why }) => `<div class="fd-result">${productCard(p)}${why.length ? `<p class="fd-why">${icon('spark')}<span>Because it is ${esc(why.slice(0, 2).join(', '))}.</span></p>` : ''}</div>`).join('')}</div>
    <div class="row row-wrap mt-5" style="justify-content:center"><button class="btn btn-ghost" type="button" data-restart>Begin again</button><a class="btn btn-ghost" href="#/palace/search">Browse everything</a></div>
    <p class="small muted center mt-3">Want a second opinion? Every maison has a front desk — open any piece and ask.</p>
  </div>`;
}

export function render() {
  return `<section class="section fd">
    <div class="container ${step < STEPS.length ? 'container-narrow' : ''}">
      ${step === 0 && !Object.keys(answers).length ? `<header class="center mb-4"><div class="eyebrow">Find your flame</div><p class="lede mt-1">Three questions. No wrong answers.</p></header>` : ''}
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
