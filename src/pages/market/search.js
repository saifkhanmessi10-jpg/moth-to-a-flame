// The Collection — every public piece in the Palace, searchable and shareable.
import * as store from '../../store.js';
import { esc, icon, mothMark, productCard } from '../../ui.js';

export const meta = { title: 'The Collection' };

const SORTS = [['new', 'Newest'], ['price-asc', 'Price, low to high'], ['price-desc', 'Price, high to low'], ['name', 'Name']];

function readState(query) {
  const category = query.get('category') || '';
  const maison = query.get('maison') || '';
  const sort = query.get('sort') || 'new';
  const shop = maison ? store.getShop(maison) : null;
  return {
    q: (query.get('q') || '').trim(),
    category: store.CATEGORIES.includes(category) ? category : '',
    maison: shop && shop.status === 'live' ? shop.slug : '',
    sort: SORTS.some((s) => s[0] === sort) ? sort : 'new',
  };
}
function pathFor(state) {
  const qs = new URLSearchParams();
  if (state.q) qs.set('q', state.q);
  if (state.category) qs.set('category', state.category);
  if (state.maison) qs.set('maison', state.maison);
  if (state.sort !== 'new') qs.set('sort', state.sort);
  const s = qs.toString();
  return `/palace/search${s ? `?${s}` : ''}`;
}
function results(state) {
  const shop = state.maison ? store.getShop(state.maison) : null;
  const list = store.listProducts({ publicOnly: true, q: state.q, category: state.category || undefined, shopId: shop?.id, sort: state.sort });
  const filtered = state.q || state.category || state.maison;
  const count = `<p class="caps faint mb-3" aria-live="polite">${list.length} ${list.length === 1 ? 'piece' : 'pieces'}${state.q ? ` for “${esc(state.q)}”` : ''}</p>`;
  if (!list.length) {
    return `${count}<div class="empty">${mothMark()}<p>${filtered ? 'Nothing in the Palace matches that just now.' : 'The collection is being prepared.'}</p>
      ${filtered ? `<button class="link mt-2" type="button" data-reset>Clear the filters</button>` : ''}</div>`;
  }
  return `${count}<div class="grid cols-4">${list.map((p) => productCard(p)).join('')}</div>`;
}

export function render(ctx) {
  const state = readState(ctx.query);
  const shops = store.listShops({ status: 'live' }).sort((a, b) => a.name.localeCompare(b.name));
  return `
  <section class="section-tight mk-page-head">
    <div class="container center">
      <div class="eyebrow">The Moth Market Palace</div>
      <h1 class="h1 mt-2">The Collection</h1>
      <p class="lede mt-2 mk-measure">Every piece from every maison, gathered in one room.</p>
      <label class="mk-search mt-4">
        <span class="mk-sr">Search the collection</span>${icon('search')}
        <input class="input" type="search" data-q value="${esc(state.q)}" placeholder="Search by scent, note or maison" autocomplete="off">
      </label>
    </div>
  </section>
  <section class="mk-below-head">
    <div class="container">
      <div class="mk-filters">
        <div class="chips" role="group" aria-label="Scent family">
          <button type="button" class="chip ${state.category ? '' : 'is-active'}" data-cat="" aria-pressed="${!state.category}">All</button>
          ${store.CATEGORIES.map((c) => `<button type="button" class="chip ${state.category === c ? 'is-active' : ''}" data-cat="${esc(c)}" aria-pressed="${state.category === c}">${esc(c)}</button>`).join('')}
        </div>
        <div class="mk-filter-selects">
          <label><span class="mk-sr">Maison</span>
            <select class="select" data-maison><option value="">All maisons</option>
              ${shops.map((s) => `<option value="${esc(s.slug)}" ${state.maison === s.slug ? 'selected' : ''}>${esc(s.name)}</option>`).join('')}</select></label>
          <label><span class="mk-sr">Sort by</span>
            <select class="select" data-sort>${SORTS.map(([v, l]) => `<option value="${v}" ${state.sort === v ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
        </div>
      </div>
      <div class="mt-4" data-results>${results(state)}</div>
    </div>
  </section>`;
}

export function mount(root, ctx) {
  const state = readState(ctx.query);
  const box = root.querySelector('[data-results]');
  const input = root.querySelector('[data-q]');
  let timer = null;

  // Typing updates only the results and rewrites the address in place, so the
  // field keeps its focus and caret. Discrete choices go through the router.
  input.addEventListener('input', () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      state.q = input.value.trim();
      box.innerHTML = results(state);
      try { history.replaceState(null, '', `#${pathFor(state)}`); } catch { /* address stays as it was */ }
    }, 220);
  });
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); input.blur(); } });

  const go = (patch) => { clearTimeout(timer); Object.assign(state, { q: input.value.trim() }, patch); ctx.navigate(pathFor(state)); };
  root.querySelectorAll('[data-cat]').forEach((chip) => chip.addEventListener('click', () => go({ category: chip.dataset.cat })));
  root.querySelector('[data-maison]').addEventListener('change', (e) => go({ maison: e.target.value }));
  root.querySelector('[data-sort]').addEventListener('change', (e) => go({ sort: e.target.value }));
  box.addEventListener('click', (e) => {
    if (!e.target.closest('[data-reset]')) return;
    input.value = '';
    go({ q: '', category: '', maison: '' });
  });
}
