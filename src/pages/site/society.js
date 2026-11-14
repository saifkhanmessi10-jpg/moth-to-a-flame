// The House — The Flame Society membership page.
import * as store from '../../store.js';
import { esc, money, mothMark } from '../../ui.js';

export const meta = { title: 'The Flame Society' };

const HOUSE = 'shop_mtaf';
const IMG = 'assets/img/';

const SEASONS = [
  {
    numeral: 'IV', name: 'Harvest & Harmony', re: /season\s*iv\b/i,
    affirmation: 'My abundance flows as steadily as my flame.',
    setting: 'Two candles on copper satin, in the black box.',
    img: 'society-season-iv.jpg', w: 1125, h: 1644, ar: '4/5', pos: '50% 62%',
    alt: 'Season IV, Harvest and Harmony: a black Flame Society box with two lit candles on copper satin and the affirmation card',
    theme: '',
  },
  {
    numeral: 'III', name: 'Sands of Desire', re: /season\s*iii\b/i,
    affirmation: 'I embody light that cannot be contained.',
    setting: 'Two candles on champagne satin, in the black box.',
    img: 'society-season-iii.jpg', w: 1125, h: 1119, ar: '1/1', pos: 'center',
    alt: 'Season III, Sands of Desire: a black Flame Society box with two candles on champagne satin and the affirmation card',
    theme: '',
  },
  {
    numeral: 'II', name: 'Tide & Bloom', re: /season\s*ii\b/i,
    affirmation: 'I bloom in divine timing.',
    setting: 'The ivory edition: two candles and blush satin, in an ivory box.',
    img: 'society-season-ii.jpg', w: 1125, h: 1103, ar: '1/1', pos: 'center',
    alt: 'Season II, Tide and Bloom: the ivory Flame Society box with two lit ivory and gold candles and the affirmation card',
    theme: 'ivory',
  },
];

const hrefFor = (p) => (p ? `#/palace/product/${esc(p.id)}` : '#/collections');
const notesOf = (p) => [p.notes?.top, p.notes?.heart, p.notes?.base].filter(Boolean).join(' · ');

function seasonRow(s, p, i) {
  const light = s.theme === 'ivory';
  return `
  <section class="st-sec st-season ${light ? 'st-light' : i % 2 ? 'st-deep' : 'st-warm'}" ${light ? 'data-theme="ivory"' : ''} aria-labelledby="st-season-${s.numeral}">
    <div class="container">
      <div class="st-feature ${i % 2 ? 'is-flip' : ''}">
        <figure class="st-media st-framed ${i % 2 ? '' : 'is-left'} reveal">
          <div class="st-frame is-lined" style="--ar:${s.ar};--pos:${s.pos}"><img src="${IMG}${s.img}" width="${s.w}" height="${s.h}" loading="lazy" alt="${esc(s.alt)}"></div>
        </figure>
        <div class="st-copy">
          <div class="st-chapter reveal"><b>Season ${s.numeral}</b><i></i></div>
          <h3 class="h1 mt-2 reveal" id="st-season-${s.numeral}">${esc(s.name)}</h3>
          <blockquote class="reveal st-d1" style="margin:0"><p class="st-affirm">“${esc(s.affirmation)}”</p></blockquote>
          <dl class="st-season-meta reveal st-d2">
            <dt>The box</dt><dd>${esc(s.setting)}</dd>
            ${p && notesOf(p) ? `<dt>The scent</dt><dd>${esc(notesOf(p))}</dd>` : ''}
            <dt>The card</dt><dd>The season’s affirmation, to keep.</dd>
          </dl>
          <div class="st-actions mt-4 reveal st-d3">
            <a class="btn" href="${hrefFor(p)}">${p ? `View Season ${s.numeral} · ${money(p.price)}` : 'View the collections'}</a>
            ${p && p.stock <= 0 ? '<span class="tiny caps faint">Resting between batches</span>' : ''}
          </div>
        </div>
      </div>
    </div>
  </section>`;
}

export function render() {
  const products = store.listProducts({ shopId: HOUSE, publicOnly: true });
  const seasonProduct = (s) => products.find((p) => s.re.test(p.name) || p.name.toLowerCase().includes(s.name.toLowerCase())) || null;
  const quarterly = products.find((p) => /quarterly/i.test(p.name)) || products.find((p) => p.category === 'Subscriptions') || null;
  const lead = SEASONS[0];
  const leadProduct = seasonProduct(lead);

  return `
  <section class="st-sec st-soc-hero">
    <div class="container">
      <div class="st-feature is-slim is-flip">
        <figure class="st-media st-framed reveal">
          <div class="st-frame is-lined" style="--ar:1125/1644"><img src="${IMG}${lead.img}" width="${lead.w}" height="${lead.h}" alt="${esc(lead.alt)}"></div>
        </figure>
        <div class="st-copy">
          <div class="eyebrow reveal">Membership · Moth to a Flame</div>
          <h1 class="display mt-2 reveal st-d1">The Flame Society</h1>
          <span class="script st-script-line reveal st-d1">a season, kept in a box</span>
          <p class="lede mt-3 reveal st-d2">Each season the house composes a box for its Society: two candles laid on satin, and a card bearing the affirmation the season was poured around.</p>
          <div class="st-actions mt-4 reveal st-d3">
            <a class="btn btn-gold" href="${hrefFor(quarterly)}">Begin the subscription</a>
            <a class="link-arrow" href="${hrefFor(leadProduct)}">Season ${lead.numeral} · ${esc(lead.name)}</a>
          </div>
        </div>
      </div>
    </div>
  </section>

  <section class="st-sec section" aria-labelledby="st-h-arrives">
    <div class="container">
      <div class="eyebrow reveal">What arrives</div>
      <h2 class="h1 mt-2 reveal st-d1" id="st-h-arrives" style="max-width:20ch">Opened slowly, four times a year</h2>
      <ul class="st-arrives">
        <li class="reveal"><b>i.</b><h3 class="h3">Two candles</h3><p>A pair poured by hand for the season, made to be burned together or apart.</p></li>
        <li class="reveal st-d1"><b>ii.</b><h3 class="h3">A bed of satin</h3><p>Each box is lined in a satin chosen for the season — copper, champagne, blush.</p></li>
        <li class="reveal st-d2"><b>iii.</b><h3 class="h3">The affirmation card</h3><p>One line to read as you light the wick, and to keep long after the wax is gone.</p></li>
        <li class="reveal st-d3"><b>iv.</b><h3 class="h3">A scent story</h3><p>Every season has its own: the notes, and the feeling they were gathered to hold.</p></li>
      </ul>
    </div>
  </section>

  <section class="st-sec section-tight center" aria-labelledby="st-h-archive">
    <div class="container container-narrow">
      <div class="ornament reveal">${mothMark(32)}</div>
      <div class="eyebrow mt-4 reveal">The archive</div>
      <h2 class="h1 mt-2 reveal st-d1" id="st-h-archive">The seasons so far</h2>
    </div>
  </section>
  ${SEASONS.map((s, i) => seasonRow(s, seasonProduct(s), i)).join('')}

  <section class="st-sec section st-light" data-theme="blush" aria-labelledby="st-h-sub">
    <div class="container">
      <div class="st-feature is-top">
        <figure class="st-media st-framed is-left reveal">
          <div class="st-frame" style="--ar:1125/1103"><img src="${IMG}quarterly-subscription.jpg" width="1125" height="1103" loading="lazy" alt="Quarterly Subscription: two white candles in clear glass with gold moth labels on a blush background, with a pink rose and lavender"></div>
        </figure>
        <div class="st-copy">
          <div class="eyebrow reveal">The Quarterly Subscription</div>
          <h2 class="h1 mt-2 reveal st-d1" id="st-h-sub">How it works</h2>
          <ol class="st-steps reveal st-d2">
            <li><div><strong>Two candles</strong><span>Every delivery holds a pair, poured by hand at the house.</span></div></li>
            <li><div><strong>Four times a year</strong><span>One delivery for each season.</span></div></li>
            <li><div><strong>A scent story and an affirmation</strong><span>Each season arrives with its own, on the card that accompanies the candles.</span></div></li>
          </ol>
          ${quarterly ? `<p class="mt-3 reveal st-d2"><span class="st-price">${money(quarterly.price)}</span> <span class="tiny caps faint">· ${esc(quarterly.name)}</span></p>` : ''}
          <div class="st-actions mt-3 reveal st-d3">
            <a class="btn btn-gold" href="${hrefFor(quarterly)}">${quarterly ? 'Begin the subscription' : 'View the collections'}</a>
            <a class="st-quiet" href="#/contact?subject=society">Ask the concierge</a>
          </div>
          <p class="preview-note mt-4 reveal">This is a preview build. No payment is taken and no subscription is started.</p>
        </div>
      </div>
    </div>
  </section>

  <section class="st-sec section st-band">
    <div class="container container-narrow">
      <div class="ornament reveal">${mothMark(34)}</div>
      <p class="st-affirm mt-4 reveal st-d1">Light the candle. Read the line. Begin.</p>
      <div class="st-actions mt-5 reveal st-d2">
        <a class="link-arrow" href="#/collections">The collections</a>
        <a class="st-quiet" href="#/palace">Enter the Palace</a>
      </div>
    </div>
  </section>`;
}
