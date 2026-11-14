// The House — the house's own range, grouped by collection.
import * as store from '../../store.js';
import { esc, mothMark, productCard } from '../../ui.js';

export const meta = { title: 'Collections' };

const HOUSE = 'shop_mtaf';
const IMG = 'assets/img/';
const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];

// Editorial copy for the collections the house is known for. Any other
// collection the atelier adds later still appears, with a quiet default intro.
const KNOWN = [
  {
    name: 'Signature',
    script: 'where the house began',
    intro: 'Amber glass jars under matte black labels, each kept in a black box foiled in gold. The house in its plainest form.',
    tile: { src: 'signature-boxes.jpg', w: 1600, h: 1067, alt: 'Two matte black Moth to a Flame boxes with the gold moth mark', caption: 'Every jar leaves the house in matte black, foiled in gold.' },
  },
  {
    name: 'The Sanctuary Collection',
    script: 'morning to evening serenity',
    intro: 'A duo for the two thresholds of the day. Morning Renewal is a breath of light, clarity, and quiet strength; Evening Sanctuary, a cocoon of peace, intimacy, and restoration.',
    verse: 'They are your morning awakening and evening exhale — your personal sanctuary, captured in light.',
  },
  {
    name: 'The Flame Society',
    script: 'a season, kept in a box',
    intro: 'The seasonal box: two candles on satin with the season’s affirmation card. Held singly, or received through the Quarterly Subscription — two candles, four times a year.',
    link: ['#/flame-society', 'About the Society'],
  },
];
const sortFor = {
  // newest season first, the subscription last
  'The Flame Society': (a, b) => (a.category === 'Subscriptions') - (b.category === 'Subscriptions') || b.name.localeCompare(a.name),
  'The Sanctuary Collection': (a, b) => a.price - b.price,
};

function groups() {
  const products = store.listProducts({ shopId: HOUSE, publicOnly: true });
  const by = new Map();
  products.forEach((p) => { const k = p.collection || 'The House'; if (!by.has(k)) by.set(k, []); by.get(k).push(p); });
  const out = [];
  KNOWN.forEach((k) => { if (by.has(k.name)) { out.push({ ...k, items: by.get(k.name) }); by.delete(k.name); } });
  by.forEach((items, name) => out.push({ name, script: '', intro: 'Poured by hand in small batches at the house.', items }));
  out.forEach((g) => { if (sortFor[g.name]) g.items.sort(sortFor[g.name]); });
  return out;
}

export function render() {
  const list = groups();
  const total = list.reduce((n, g) => n + g.items.length, 0);

  const head = `
  <section class="st-sec st-head">
    <div class="container">
      <div class="eyebrow">Moth to a Flame · Luxury Candle Co.</div>
      <h1 class="display mt-2">The Collections</h1>
      <span class="script st-script-line">poured by hand, in small batches</span>
      <p class="lede mt-3">The house’s own range, as it stands today. Each piece opens in our flagship maison within the Palace.</p>
    </div>
  </section>`;

  if (!list.length) {
    return `${head}<section class="st-sec section-tight"><div class="container"><div class="empty">${mothMark(44)}<p>The atelier is between batches. The collections return shortly.</p><a class="link-arrow mt-3" href="#/palace">Walk the Palace meanwhile</a></div></div></section>`;
  }

  return `${head}
  <nav class="st-jump" aria-label="Jump to a collection">
    <div class="container"><div class="chips">
      ${list.map((g, i) => `<button type="button" class="chip${i === 0 ? ' is-active' : ''}" data-jump="st-coll-${i}">${esc(g.name)}</button>`).join('')}
    </div></div>
  </nav>
  ${list.map((g, i) => `
  <section class="st-sec section st-coll" id="st-coll-${i}" aria-labelledby="st-coll-h-${i}">
    <div class="container">
      <div class="st-coll-grid">
        <header class="st-coll-intro reveal">
          <div class="st-numeral" aria-hidden="true">${ROMAN[i] || i + 1}</div>
          <h2 class="h1" id="st-coll-h-${i}">${esc(g.name)}</h2>
          ${g.script ? `<span class="script st-script-line">${esc(g.script)}</span>` : ''}
          <p class="muted mt-3">${esc(g.intro)}</p>
          ${g.verse ? `<blockquote class="st-verse"><p class="st-serif-it">${esc(g.verse)}</p></blockquote>` : ''}
          ${g.link ? `<a class="link-arrow mt-3" href="${g.link[0]}">${esc(g.link[1])}</a>` : ''}
          <p class="tiny caps faint st-coll-count">${g.items.length} ${g.items.length === 1 ? 'piece' : 'pieces'}</p>
        </header>
        <div class="st-coll-items">
          ${g.items.map((p) => `<div class="reveal">${productCard(p, { showMaison: false })}</div>`).join('')}
          ${g.tile ? `<figure class="st-tile reveal st-d1"><div class="st-frame"><img src="${IMG}${g.tile.src}" width="${g.tile.w}" height="${g.tile.h}" loading="lazy" alt="${esc(g.tile.alt)}"></div><figcaption>${esc(g.tile.caption)}</figcaption></figure>` : ''}
        </div>
      </div>
    </div>
  </section>`).join('')}
  <section class="st-sec section st-palace center">
    <div class="container container-narrow">
      <div class="ornament reveal">${mothMark(34)}</div>
      <div class="eyebrow mt-4 reveal">${total} pieces from the house · many more beyond it</div>
      <h2 class="h1 mt-2 reveal st-d1">The Palace continues where the house ends</h2>
      <p class="lede mt-3 reveal st-d2" style="max-width:46ch;margin-inline:auto">Our flagship maison sits among a curated company of independent candle makers. Step through and meet them.</p>
      <div class="st-actions mt-4 reveal st-d3">
        <a class="btn btn-gold" href="#/palace">Enter the Palace</a>
        <a class="st-quiet" href="#/palace/maisons">All maisons</a>
      </div>
    </div>
  </section>`;
}

export function mount(root) {
  const chips = [...root.querySelectorAll('[data-jump]')];
  if (!chips.length) return;
  const setActive = (id) => chips.forEach((c) => c.classList.toggle('is-active', c.dataset.jump === id));
  const calm = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  chips.forEach((chip) => chip.addEventListener('click', () => {
    const target = root.querySelector(`#${chip.dataset.jump}`);
    if (!target) return;
    target.scrollIntoView({ behavior: calm ? 'auto' : 'smooth', block: 'start' });
    setActive(chip.dataset.jump);
  }));
  // Keep the active chip in step with the collection in view.
  if (!('IntersectionObserver' in window)) return;
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) setActive(e.target.id); });
  }, { rootMargin: '-45% 0px -50% 0px' });
  root.querySelectorAll('.st-coll').forEach((s) => io.observe(s));
}
