// Directory of live maisons.
import * as store from '../../store.js';
import { esc, icon, mothMark, maisonCard } from '../../ui.js';

export const meta = { title: 'The Maisons' };

export function render() {
  const shops = store.listShops({ status: 'live' })
    .sort((a, b) => (b.flagship ? 1 : 0) - (a.flagship ? 1 : 0) || a.name.localeCompare(b.name));
  return `
  <section class="section-tight mk-page-head">
    <div class="container center">
      <div class="eyebrow">The Moth Market Palace</div>
      <h1 class="h1 mt-2">The Maisons</h1>
      <p class="lede mt-2 mk-measure">${shops.length ? `${shops.length} independent ${shops.length === 1 ? 'house' : 'houses'} in residence, each pouring by hand in small batches.` : 'The rooms of the Palace are being prepared.'}</p>
      ${shops.length ? `<label class="mk-search mt-4">
        <span class="mk-sr">Search maisons by name or location</span>${icon('search')}
        <input class="input" type="search" data-filter placeholder="Search by name or place" autocomplete="off">
      </label>` : ''}
    </div>
  </section>
  <section class="mk-below-head">
    <div class="container">
      ${shops.length ? `<p class="caps faint mb-3" data-count aria-live="polite">${shops.length} ${shops.length === 1 ? 'maison' : 'maisons'}</p>
      <div class="mk-maison-grid">
        ${shops.map((s) => `<div data-hay="${esc(`${s.name} ${s.location} ${s.tagline}`.toLowerCase())}">${maisonCard(s)}</div>`).join('')}
      </div>
      <div class="empty mt-3" data-none hidden>${mothMark()}<p>No maison answers to that name or place.</p><button class="link mt-2" type="button" data-clear>Clear the search</button></div>`
    : `<div class="empty">${mothMark()}<p>No maisons are in residence at the moment.</p></div>`}
    </div>
  </section>`;
}

export function mount(root) {
  const input = root.querySelector('[data-filter]');
  if (!input) return;
  const cards = [...root.querySelectorAll('[data-hay]')];
  const count = root.querySelector('[data-count]');
  const none = root.querySelector('[data-none]');
  const apply = () => {
    const words = input.value.trim().toLowerCase().split(/\s+/).filter(Boolean);
    let shown = 0;
    cards.forEach((el) => { const ok = words.every((w) => el.dataset.hay.includes(w)); el.hidden = !ok; if (ok) shown++; });
    count.textContent = `${shown} ${shown === 1 ? 'maison' : 'maisons'}`;
    none.hidden = shown > 0;
  };
  input.addEventListener('input', apply);
  root.querySelector('[data-clear]').addEventListener('click', () => { input.value = ''; apply(); input.focus(); });
}
