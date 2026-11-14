// The House — philosophy, craft and the Palace.
import { mothMark } from '../../ui.js';

export const meta = { title: 'Our Story' };

const IMG = 'assets/img/';

const chapter = (numeral, label, title, body, pull) => `
  <div class="st-ch">
    <div class="st-ch-label reveal">
      <span class="st-numeral" aria-hidden="true">${numeral}</span>
      <div><div class="eyebrow">${label}</div><h2 class="h2 mt-1">${title}</h2></div>
    </div>
    <div class="st-ch-body">
      <div class="st-prose reveal st-d1">${body}</div>
      ${pull ? `<blockquote class="st-pull reveal st-d2"><p>${pull}</p></blockquote>` : ''}
    </div>
  </div>`;

export function render() {
  return `
  <section class="st-sec st-story-hero">
    <div class="container container-narrow">
      <div class="reveal">${mothMark(84)}</div>
      <div class="eyebrow mt-4 reveal">Our story</div>
      <h1 class="display mt-2 reveal st-d1">Drawn to the light</h1>
      <span class="script st-script-line reveal st-d2">a house built around a single flame</span>
      <p class="lede mt-4 reveal st-d3" style="max-width:44ch;margin-inline:auto">Why a moth, why a flame, and why a candle house came to keep a palace for other makers.</p>
    </div>
  </section>

  <section class="st-sec section">
    <div class="container">
      ${chapter('I', 'The name', 'The moth and the flame', `
        <p>A moth does not deliberate. Somewhere in the dark there is a light, and it goes. We have always found that honest — the plain admission that some things draw us, and that we are better for moving toward them.</p>
        <p>Our mark is that moment drawn in one gold line: a moth whose body is the flame itself. Not a creature circling a light, but one that carries it. It is on every box, every label and every card we make, and it is the nearest thing the house has to a creed.</p>`,
        'Not a creature circling the light, but one that carries it.')}
    </div>
  </section>

  <section class="st-sec section st-deep" style="border-block:1px solid var(--line-2)">
    <div class="container">
      ${chapter('II', 'The ritual', 'A candle is a sentence you finish yourself', `
        <p>We think of a candle as a small ceremony rather than an object. Striking the match is a decision: this hour is mine. The room changes, and so does the person in it.</p>
        <p>That is why so much of what we pour is paired with words. The Sanctuary candles are named for the two thresholds of the day — a morning that says <em>today is new, and so are you</em>, and an evening that insists rest is not retreat. Each Flame Society season is composed around an affirmation, printed on a card to be read as the wick takes. Scent opens the door; the line gives you somewhere to stand once you are through it.</p>`,
        'Scent opens the door. The affirmation gives you somewhere to stand.')}
    </div>
  </section>

  <section class="st-sec section st-light" data-theme="ivory">
    <div class="container">
      <div class="st-feature is-wide is-flip is-top">
        <figure class="st-media st-framed reveal">
          <div class="st-frame" style="--ar:4/3"><img src="${IMG}signature-jars.jpg" width="1500" height="1125" loading="lazy" alt="Signature amber glass candles and their matte black, gold-foiled boxes on a pale stone ledge, one candle lit"></div>
          <figcaption class="st-cap">Signature — amber glass, matte black, gold foil</figcaption>
        </figure>
        <div class="st-copy">
          <div class="st-chapter reveal"><b>III</b><i></i><span class="eyebrow">The craft</span></div>
          <h2 class="h1 mt-3 reveal st-d1">Poured by hand, a few at a time</h2>
          <div class="st-prose mt-3 reveal st-d2">
            <p>Every candle the house makes is poured by hand in small batches. It is slower, and that is the point: a small batch can be watched. Each vessel is filled, left to settle, and looked at properly before it is dressed.</p>
            <p>The dressing matters to us as much as the pour. Matte black and metallic gold for the house; ivory and blush for its lighter editions. Capitals set wide, a single line of script, nothing shouted.</p>
          </div>
          <blockquote class="st-pull reveal st-d3"><p>A small batch can be watched. That is the whole of the method.</p></blockquote>
        </div>
      </div>
    </div>
  </section>

  <section class="st-sec section">
    <div class="container">
      ${chapter('IV', 'The Palace', 'Why the house opened its doors', `
        <p>A flame loses nothing by lighting another. Once the house had a home of its own, it seemed wrong to keep the rooms to ourselves — there are independent makers whose work we admire, and whose candles deserve a setting as considered as the things they pour.</p>
        <p>So we built the Moth Market Palace: a curated company of candle maisons under one roof. Each keeps its own rooms, its own name and its own way of working. Moth to a Flame is the founding house and holds a maison there like any other. Makers apply for residency; the Palace stays small enough to be walked.</p>`,
        'A flame loses nothing by lighting another.')}
      <div class="st-actions is-center mt-5 reveal">
        <a class="btn btn-gold" href="#/palace">Enter the Palace</a>
        <a class="st-quiet" href="#/palace/open-a-maison">Open a maison</a>
      </div>
    </div>
  </section>

  <section class="st-sec section st-palace st-band">
    <div class="container container-narrow">
      <div class="ornament reveal">${mothMark(36)}</div>
      <p class="st-affirm mt-4 reveal st-d1">Turn toward what is warm.</p>
      <div class="st-actions mt-5 reveal st-d2">
        <a class="btn" href="#/collections">Discover the collections</a>
        <a class="link-arrow" href="#/flame-society">The Flame Society</a>
      </div>
    </div>
  </section>`;
}
