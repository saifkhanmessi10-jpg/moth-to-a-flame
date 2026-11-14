// The House — landing page.
import * as store from '../../store.js';
import { esc, money, mothMark, candleArt, maisonCard } from '../../ui.js';

export const meta = { title: 'Luxury Candle Co.' };

const HOUSE = 'shop_mtaf';
const IMG = 'assets/img/';
const hrefFor = (p, fallback = '#/collections') => (p ? `#/palace/product/${esc(p.id)}` : fallback);
const notesOf = (p) => [p.notes?.top, p.notes?.heart, p.notes?.base].filter(Boolean).join(' · ');

function duoSide(p, { side, when, name, line, quote }) {
  return `<article class="st-duo-side is-${side} reveal">
    ${p ? `<a class="art-frame st-duo-art" href="${hrefFor(p)}">${candleArt(p, { alt: `${name} candle` })}</a>` : ''}
    <div class="eyebrow">${when}</div>
    <h3 class="h2 mt-1">${name}</h3>
    <p class="st-serif-it mt-2">${quote}</p>
    <p class="muted mt-2">${line}</p>
    ${p ? `<p class="st-notes mt-2">${esc(notesOf(p))}</p>
    <a class="link-arrow mt-3" href="${hrefFor(p)}">${name} · ${money(p.price)}</a>` : ''}
  </article>`;
}

export function render() {
  const products = store.listProducts({ shopId: HOUSE, publicOnly: true });
  const find = (re) => products.find((p) => re.test(p.name));
  const signature = products.find((p) => p.collection === 'Signature');
  const morning = find(/morning renewal/i);
  const evening = find(/evening sanctuary/i);
  const duo = find(/sanctuary duo/i);
  const seasonIV = find(/season\s*iv\b/i) || find(/harvest/i);
  const quarterly = find(/quarterly/i) || products.find((p) => p.category === 'Subscriptions');
  const maisons = store.listShops({ status: 'live', featured: true });

  return `
  <section class="st-hero" aria-label="Moth to a Flame">
    <div class="container st-hero-in">
      <div class="st-hero-mark"><span class="st-glow" aria-hidden="true"></span>${mothMark(200)}</div>
      <h1 class="st-hero-title">Moth to a Flame</h1>
      <p class="st-hero-sub">Luxury Candle Co.</p>
      <p class="st-hero-promise">Hand-poured candles for the quiet rituals that bring you back to yourself.</p>
      <div class="st-actions">
        <a class="btn btn-gold" href="#/collections">Discover the collections</a>
        <a class="btn" href="#/palace">Enter the Palace</a>
      </div>
    </div>
    <div class="st-hero-foot">
      <ul>
        <li><a href="#/collections">Signature</a></li>
        <li><a href="#/collections">The Sanctuary Collection</a></li>
        <li><a href="#/flame-society">The Flame Society</a></li>
        <li><a href="#/palace">The Moth Market Palace</a></li>
      </ul>
      <i aria-hidden="true"></i>
    </div>
  </section>

  <section class="st-sec section st-manifesto">
    <div class="container container-narrow">
      <div class="eyebrow reveal">The house</div>
      <p class="st-statement reveal st-d1">A moth does not question the flame. It turns toward what is warm, <em>and goes.</em></p>
      <div class="st-prose reveal st-d2">
        <p>We make candles for that same pull — the moment in a day when you put everything down and turn toward a single, steady light. Each one is poured by hand in small batches, dressed in matte black and gold, and named for the feeling it is meant to keep.</p>
      </div>
      <div class="ornament mt-5 reveal st-d3">${mothMark(34)}</div>
    </div>
  </section>

  <section class="st-sec section st-light" data-theme="ivory" aria-labelledby="st-h-sig">
    <div class="container">
      <div class="st-feature is-wide">
        <figure class="st-media st-framed reveal">
          <div class="st-frame" style="--ar:4/3"><img src="${IMG}signature-jars.jpg" width="1500" height="1125" loading="lazy" alt="Signature amber glass candles with matte black labels beside their black and gold boxes on a pale stone ledge, one candle lit"></div>
        </figure>
        <div class="st-copy reveal st-d1">
          <div class="st-chapter"><b>I</b><i></i><span class="eyebrow">The collections</span></div>
          <h2 class="h1 mt-3" id="st-h-sig">Signature</h2>
          <span class="script st-script-line">where the house began</span>
          <p class="muted mt-3">Amber glass under a matte black label, kept in a black box foiled in gold. The Signature jar is the house in its plainest form: a slow, golden burn that fills a room without raising its voice.</p>
          <div class="st-actions mt-4">
            <a class="btn" href="${hrefFor(signature)}">${signature ? `The Signature jar · ${money(signature.price)}` : 'View Signature'}</a>
          </div>
        </div>
      </div>
    </div>
  </section>

  <section class="st-sec section" aria-labelledby="st-h-san">
    <div class="container">
      <div class="center">
        <div class="st-chapter reveal" style="justify-content:center"><i></i><b>II</b><i></i></div>
        <div class="eyebrow mt-3 reveal">Morning to evening serenity</div>
        <h2 class="h1 mt-2 reveal st-d1" id="st-h-san">The Sanctuary Collection</h2>
        <p class="st-statement mt-4 reveal st-d2" style="max-width:24ch;margin-inline:auto">There is a stillness between light and dark — a sacred space where renewal meets rest.</p>
      </div>
      <div class="st-duo">
        ${duoSide(morning, { side: 'morning', when: 'At first light', name: 'Morning Renewal', line: 'A breath of light, clarity, and quiet strength.', quote: 'It whispers, “Today is new, and so are you.”' })}
        <div class="st-duo-rule" aria-hidden="true">${mothMark(30)}</div>
        ${duoSide(evening, { side: 'evening', when: 'As night falls', name: 'Evening Sanctuary', line: 'A cocoon of peace, intimacy, and restoration.', quote: '“Rest is not retreat — it’s sacred.”' })}
      </div>
      <div class="center mt-5 reveal">
        <p class="lede" style="max-width:52ch;margin-inline:auto">Together, they form more than a pair of candles. They are your morning awakening and evening exhale — your personal sanctuary, captured in light.</p>
        <div class="st-actions mt-4">
          <a class="btn" href="${hrefFor(duo)}">${duo ? `The Sanctuary Duo · ${money(duo.price)}` : 'View the collection'}</a>
        </div>
      </div>
    </div>
  </section>

  <section class="st-sec section st-warm" aria-labelledby="st-h-soc">
    <div class="container">
      <div class="st-feature is-slim is-top">
        <figure class="st-media st-framed is-left reveal">
          <div class="st-frame is-lined" style="--ar:1125/1644"><img src="${IMG}society-season-iv.jpg" width="1125" height="1644" loading="lazy" alt="The Flame Society Season IV box, Harvest and Harmony: two lit black and gold candles on copper satin beside the season’s affirmation card"></div>
        </figure>
        <div class="st-copy" style="align-self:center">
          <div class="st-chapter reveal"><b>III</b><i></i><span class="eyebrow">The Flame Society</span></div>
          <p class="tiny caps faint mt-4 reveal">Season IV · Harvest &amp; Harmony</p>
          <blockquote class="reveal st-d1" style="margin:0"><p class="st-affirm mt-2" id="st-h-soc">“My abundance flows as steadily as my flame.”</p></blockquote>
          <hr class="rule-short reveal st-d2">
          <p class="muted reveal st-d2" style="max-width:44ch">Each season the Society receives a box: two candles resting on satin, and a card bearing the affirmation the season was poured around. Light the candle, read the line, and let the two do their work.</p>
          <div class="st-actions mt-4 reveal st-d3">
            <a class="btn btn-gold" href="#/flame-society">Enter the Society</a>
            <a class="link-arrow" href="${hrefFor(seasonIV, '#/flame-society')}">${seasonIV ? `Season IV · ${money(seasonIV.price)}` : 'The seasons'}</a>
          </div>
        </div>
      </div>
    </div>
  </section>

  <section class="st-sec section st-light" data-theme="blush" aria-labelledby="st-h-qtr">
    <div class="container">
      <div class="st-feature is-slim is-flip">
        <figure class="st-media st-framed reveal">
          <div class="st-frame" style="--ar:1/1;--pos:50% 78%"><img src="${IMG}quarterly-subscription.jpg" width="1125" height="1103" loading="lazy" alt="Two white candles in clear glass with gold moth labels on a blush background, beside a pink rose and a sprig of lavender"></div>
        </figure>
        <div class="st-copy reveal st-d1">
          <div class="st-chapter"><b>IV</b><i></i><span class="eyebrow">Quarterly Subscription</span></div>
          <h2 class="h1 mt-3" id="st-h-qtr">Two candles, four times a year</h2>
          <span class="script st-script-line">a standing appointment with stillness</span>
          <p class="muted mt-3" style="max-width:44ch">One decision, and the seasons arrive on their own — each with its scent story and its affirmation card.</p>
          <div class="st-actions mt-4">
            <a class="btn" href="${hrefFor(quarterly, '#/flame-society')}">${quarterly ? `Begin the subscription · ${money(quarterly.price)}` : 'How it works'}</a>
            <a class="st-quiet" href="#/flame-society">How it works</a>
          </div>
        </div>
      </div>
    </div>
  </section>

  <section class="st-sec section st-palace" aria-labelledby="st-h-pal">
    <div class="container">
      <div class="st-palace-head">
        <a class="st-door reveal" href="#/palace" aria-label="Enter the Moth Market Palace">
          ${mothMark(110)}
          <span class="wordmark">Moth Market Palace<small>By Moth to a Flame</small></span>
          <span class="link-arrow st-door-cta">Enter</span>
        </a>
        <div>
          <div class="eyebrow reveal">Beyond the house</div>
          <h2 class="display mt-2 reveal st-d1" id="st-h-pal" style="font-size:clamp(2.3rem,5vw,4.4rem)">The Moth Market Palace</h2>
          <span class="script st-script-line reveal st-d1">one roof, many flames</span>
          <p class="lede mt-3 reveal st-d2" style="max-width:48ch">The house keeps a palace: a curated company of independent candle maisons, each with its own rooms, its own hand and its own way with wax and flame.</p>
          <p class="muted mt-2 reveal st-d2" style="max-width:52ch">We opened it because a flame loses nothing by lighting another. Walk the maisons, gather pieces from any of them into a single bag, and find the makers we admire in a setting as considered as their work.</p>
          <div class="st-actions mt-4 reveal st-d3">
            <a class="btn btn-gold" href="#/palace">Enter the Palace</a>
            <a class="st-quiet" href="#/palace/open-a-maison">Open a maison</a>
          </div>
        </div>
      </div>
      ${maisons.length ? `
      <div class="st-maisons-head reveal">
        <h3 class="h2">Maisons in residence</h3>
        <a class="link-arrow" href="#/palace/maisons">Meet every maison</a>
      </div>
      <div class="st-maisons">${maisons.map((s, i) => `<div class="reveal st-d${Math.min(i, 4) || 1}">${maisonCard(s)}</div>`).join('')}</div>` : ''}
    </div>
  </section>

  <section class="st-sec section st-light" data-theme="ivory" aria-labelledby="st-h-rit">
    <div class="container">
      <div class="eyebrow reveal">The ritual</div>
      <h2 class="h1 mt-2 reveal st-d1" id="st-h-rit" style="max-width:18ch">How to keep a flame</h2>
      <ol class="st-ritual">
        <li class="reveal"><b>i.</b><h3 class="h3">The first burn</h3><p>Let the wax melt to the edge of the glass before you put it out. A candle remembers its first pool.</p></li>
        <li class="reveal st-d1"><b>ii.</b><h3 class="h3">Trim the wick</h3><p>A quarter inch before each lighting keeps the flame calm and the glass clear.</p></li>
        <li class="reveal st-d2"><b>iii.</b><h3 class="h3">Give it an evening</h3><p>Three to four hours at a time is enough. Let it rest and cool before the next.</p></li>
        <li class="reveal st-d3"><b>iv.</b><h3 class="h3">Stay with it</h3><p>Keep a lit candle in sight, on a level surface, away from draughts. Attention is part of the ritual.</p></li>
      </ol>
      <div class="st-actions mt-5 reveal">
        <a class="link-arrow" href="#/story">Read our story</a>
        <a class="st-quiet" href="#/contact">Speak with the concierge</a>
      </div>
    </div>
  </section>`;
}
