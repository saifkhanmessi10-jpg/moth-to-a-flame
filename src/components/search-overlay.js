// Full-screen search with instant results for pieces and maisons.
import * as store from '../store.js';
import { esc, icon, money, candleArt, monogram } from '../ui.js';
import { recentlyViewed } from './recent.js';

const MOODS = [
  ['Evening calm', 'lavender'], ['Smoky & woody', 'smoke'], ['White florals', 'tuberose'],
  ['Fresh & coastal', 'salt'], ['Sweet comfort', 'vanilla'], ['Gifts', 'gift'],
];
let el = null;

function results(q) {
  const needle = q.trim().toLowerCase();
  if (!needle) {
    const recent = recentlyViewed(4);
    return `<div class="so-section"><div class="eyebrow mb-2">Search by mood</div>
        <div class="chips">${MOODS.map(([label, term]) => `<button class="chip" type="button" data-so-term="${esc(term)}">${esc(label)}</button>`).join('')}</div></div>
      <a class="so-finder" href="#/palace/finder"><span class="moth-mark" style="--size:34px"></span><span><strong>Not sure where to begin?</strong><br><span class="muted small">Answer three questions and we will suggest a flame.</span></span>${icon('arrow')}</a>
      ${recent.length ? `<div class="so-section"><div class="eyebrow mb-2">Recently viewed</div><ul class="so-list">${recent.map(row).join('')}</ul></div>` : ''}`;
  }
  const products = store.listProducts({ publicOnly: true, q: needle }).slice(0, 6);
  const shops = store.listShops({ status: 'live' }).filter((s) => [s.name, s.tagline, s.location].join(' ').toLowerCase().includes(needle)).slice(0, 3);
  if (!products.length && !shops.length) {
    return `<div class="so-none"><p class="lede">Nothing yet for “${esc(q)}”.</p><p class="muted small mt-1">Try a scent note — amber, rose, cedar, sea salt — or let us help.</p>
      <a class="btn btn-sm mt-3" href="#/palace/finder">Find your flame</a></div>`;
  }
  return `${shops.length ? `<div class="so-section"><div class="eyebrow mb-2">Maisons</div><ul class="so-list">${shops.map((s) => `<li><a class="so-row" href="#/palace/shop/${esc(s.slug)}">${monogram(s, 44)}<span class="grow"><span class="so-name">${esc(s.name)}</span><span class="tiny faint">${esc(s.tagline)}</span></span>${icon('arrow')}</a></li>`).join('')}</ul></div>` : ''}
    ${products.length ? `<div class="so-section"><div class="eyebrow mb-2">Pieces</div><ul class="so-list">${products.map(row).join('')}</ul></div>` : ''}
    <a class="link-arrow mt-3" href="#/palace/search?q=${encodeURIComponent(q.trim())}">See every result</a>`;
}
function row(p) {
  const shop = store.getShop(p.shopId);
  return `<li><a class="so-row" href="#/palace/product/${esc(p.id)}"><span class="so-thumb art-frame">${candleArt(p, { lit: false })}</span>
    <span class="grow"><span class="so-name">${esc(p.name)}</span><span class="tiny faint">${esc(shop?.name || '')} · ${esc([p.notes.top, p.notes.heart].filter(Boolean).join(' · '))}</span></span>
    <span class="gold num small">${money(p.price)}</span></a></li>`;
}

export function closeSearch() {
  if (!el || !el.classList.contains('is-open')) return;
  el.classList.remove('is-open'); document.body.classList.remove('bd-lock');
}
export function openSearch() {
  if (!el) {
    el = document.createElement('div');
    el.className = 'so';
    el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-label', 'Search the Palace');
    el.innerHTML = `<div class="so-inner container container-narrow">
      <form class="so-form" role="search"><span aria-hidden="true">${icon('search')}</span>
        <input type="search" name="q" placeholder="Search scents, pieces or maisons" autocomplete="off" aria-label="Search the Palace">
        <button class="icon-btn" type="button" data-so-close aria-label="Close search">${icon('close')}</button></form>
      <div class="so-results" aria-live="polite"></div></div>`;
    document.body.appendChild(el);
    const input = el.querySelector('input'); const out = el.querySelector('.so-results');
    let timer;
    input.addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(() => { out.innerHTML = results(input.value); }, 120); });
    el.querySelector('form').addEventListener('submit', (e) => { e.preventDefault(); const q = input.value.trim(); closeSearch(); location.hash = `#/palace/search${q ? `?q=${encodeURIComponent(q)}` : ''}`; });
    el.addEventListener('click', (e) => {
      if (e.target.closest('[data-so-close]') || e.target === el) { closeSearch(); return; }
      const term = e.target.closest('[data-so-term]');
      if (term) { input.value = term.dataset.soTerm; out.innerHTML = results(input.value); input.focus(); return; }
      if (e.target.closest('a[href^="#"]')) closeSearch();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeSearch();
      if (e.key === '/' && !/input|textarea|select/i.test(document.activeElement?.tagName || '') && !document.querySelector('.modal-back')) { e.preventDefault(); openSearch(); }
    });
    window.addEventListener('hashchange', closeSearch);
  }
  const input = el.querySelector('input');
  el.querySelector('.so-results').innerHTML = results(input.value);
  el.classList.add('is-open'); document.body.classList.add('bd-lock');
  setTimeout(() => { input.focus(); input.select(); }, 60);
}
