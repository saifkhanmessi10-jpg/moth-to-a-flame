// /atelier/storefront — the storefront customiser with a live preview.
import * as store from '../../store.js';
import { esc, money, icon, monogram, themeAttrs, candleArt, toast, confirmDialog } from '../../ui.js';

export const meta = { title: 'Storefront' };

const drafts = new Map(); // shopId → unpublished draft
let device = 'desktop';

// [id, label, page colour, surface colour, ink colour]
const THEMES = [
  ['obsidian', 'Obsidian', '#0b0a09', '#1a1714', '#efe7d8'], ['espresso', 'Espresso', '#1b120d', '#2c1f16', '#f1e4d2'], ['midnight', 'Midnight', '#0a0d14', '#171c28', '#e8e9ee'],
  ['ivory', 'Ivory', '#f6f0e6', '#e6dccb', '#2a241c'], ['blush', 'Blush', '#f3dfdb', '#e3c5bf', '#2e2222'], ['sage', 'Sage', '#e3e6da', '#cbd0bd', '#242a20'],
];
const ACCENTS = [['#c9a35c', 'Gold'], ['#d8c08a', 'Champagne'], ['#c98f7a', 'Rose gold'], ['#b0785f', 'Copper'], ['#a9adb5', 'Pewter'], ['#7d7446', 'Olive']];
const FONTS = [['classic', 'Classic', 'var(--serif)'], ['couture', 'Couture', '"Playfair Display", var(--serif)'], ['modern', 'Modern', 'var(--sans)']];
const HEROES = [['centered', 'Centered'], ['split', 'Split'], ['editorial', 'Editorial']];
const PRESETS = {
  obsidian: [['#1a1410', '#0b0a09'], ['#2a1d12', '#0d0a08'], ['#231f1a', '#0b0a09']],
  espresso: [['#3a2416', '#1b120d'], ['#4a2c1a', '#1f140e'], ['#2c1f16', '#140d09']],
  midnight: [['#1b2438', '#0a0d14'], ['#232a3d', '#0c1019'], ['#2a2338', '#0b0c14']],
  ivory: [['#fbf7f0', '#e6dccb'], ['#f6efe2', '#d9ccb4'], ['#2a241c', '#14110c']],
  blush: [['#f9ece9', '#e3c5bf'], ['#f4dcd6', '#d6aea6'], ['#3a2626', '#1c1212']],
  sage: [['#eef0e7', '#cbd0bd'], ['#e2e6d6', '#b8bfa6'], ['#2a3024', '#12160f']],
};
const hex = (v, fallback) => (/^#[0-9a-f]{6}$/i.test(v || '') ? v.toLowerCase() : fallback);
const lum = (h) => { const n = parseInt(h.slice(1), 16); return (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255; };
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

const published = (shop) => ({
  theme: PRESETS[shop.theme] ? shop.theme : 'obsidian', accent: hex(shop.accent, '#c9a35c'),
  font: FONTS.some((f) => f[0] === shop.font) ? shop.font : 'classic', heroStyle: HEROES.some((h) => h[0] === shop.heroStyle) ? shop.heroStyle : 'centered',
  monogram: shop.monogram || '', banner: [hex(shop.banner?.[0], '#1a1410'), hex(shop.banner?.[1], '#0b0a09')],
  tagline: shop.tagline || '', announcement: shop.announcement || '', story: shop.story || '',
});
const draftFor = (shop) => { if (!drafts.has(shop.id)) drafts.set(shop.id, published(shop)); return drafts.get(shop.id); };

/* ------------------------------------------------------------ the preview */
function previewHtml(shop, d) {
  const mark = (d.monogram || shop.name[0] || 'M').slice(0, 2);
  const view = { ...shop, ...d, monogram: mark };
  let pieces = store.listProducts({ shopId: shop.id, status: 'live' });
  if (!pieces.length) pieces = store.listProducts({ shopId: shop.id });
  const placeholder = !pieces.length;
  if (placeholder) pieces = ['tumbler', 'jar', 'coupe', 'tin'].map((shape, i) => ({ shopId: shop.id, name: ['Your first candle', 'A second pour', 'A limited edition', 'A travel tin'][i], price: 0, vessel: { shape, body: i % 2 ? '#efe6d6' : '#15120f', rim: d.accent, wax: '#efe3c8', label: 'none', ink: i % 2 ? '#14110c' : d.accent } }));
  pieces = pieces.slice(0, 4);

  // candleArt reads the banner and monogram from the stored maison, so the draft
  // values are lent to it for the duration of this synchronous draw and then restored.
  const lent = { banner: shop.banner, monogram: shop.monogram };
  let cards = '';
  try {
    shop.banner = d.banner; shop.monogram = mark;
    cards = pieces.map((p) => `<div class="vd-pv-card"><div class="vd-pv-art">${candleArt(p)}</div><div class="n">${esc(p.name)}</div><div class="p">${placeholder ? 'Awaiting its price' : money(p.price)}</div></div>`).join('');
  } finally { shop.banner = lent.banner; shop.monogram = lent.monogram; }

  const on = lum(d.banner[0]) * 0.5 + lum(d.banner[1]) * 0.5 > 0.55 ? '#231d15' : '#f1e9da';
  const vars = `--vd-b1:${d.banner[0]};--vd-b2:${d.banner[1]};--vd-on:${on}`;
  const tagline = d.tagline || 'Your tagline will rest here.';
  const place = [shop.location, shop.founded ? `Est. ${shop.founded}` : ''].filter(Boolean).join(' · ') || 'Resident of the Palace';
  const cta = `<span class="vd-pv-btn">Explore the collection</span>`;
  let hero;
  if (d.heroStyle === 'split') {
    const img = shop.heroImage ? `;background-image:url('${esc(encodeURI(shop.heroImage))}')` : '';
    hero = `<div class="vd-pv-hero is-split">
      <div class="vd-pv-copy"><div class="vd-pv-eyebrow">${esc(place)}</div><div class="vd-pv-title" style="margin-top:.35em">${esc(shop.name)}</div><div class="vd-pv-tag">${esc(tagline)}</div>${cta}</div>
      <div class="vd-pv-banner" style="${vars}${img}">${shop.heroImage ? '' : monogram(view, 64)}</div></div>`;
  } else if (d.heroStyle === 'editorial') {
    hero = `<div class="vd-pv-hero is-editorial"><div class="vd-pv-banner" style="${vars}">
      <div><div class="vd-pv-eyebrow">${esc(place)}</div><div class="vd-pv-title">${esc(shop.name)}</div>${cta}</div>
      <div class="vd-pv-side"><div class="vd-pv-tag" style="margin-top:0">${esc(tagline)}</div></div></div></div>`;
  } else {
    hero = `<div class="vd-pv-hero is-centered"><div class="vd-pv-banner" style="${vars}">
      ${monogram(view, 64)}<div class="vd-pv-title">${esc(shop.name)}</div><div class="vd-pv-tag">${esc(tagline)}</div>${cta}</div></div>`;
  }
  const story = d.story.length > 260 ? `${d.story.slice(0, 260).replace(/\s+\S*$/, '')}…` : d.story;

  return `<div class="vd-pv" ${themeAttrs(view)}>
    ${d.announcement ? `<div class="vd-pv-announce">${esc(d.announcement)}</div>` : ''}
    <div class="vd-pv-nav"><span>The collection</span><b>${esc(shop.name)}</b><span>Our story</span></div>
    ${hero}
    ${story ? `<p class="vd-pv-story">${esc(story)}</p>` : ''}
    <div class="vd-pv-pieces">
      <div class="vd-pv-pieces-head"><span class="h">The collection</span><span class="vd-pv-eyebrow">${placeholder ? 'Sample pieces' : 'View all'}</span></div>
      <div class="vd-pv-grid">${cards}</div>
    </div>
  </div>`;
}

const presetsHtml = (d) => (PRESETS[d.theme] || PRESETS.obsidian).map(([a, b], i) => `<button type="button" class="vd-preset ${same([a, b], d.banner) ? 'is-active' : ''}" data-preset="${i}" style="--vd-a:${a};--vd-b:${b}" aria-label="Banner preset ${i + 1}"></button>`).join('');

export function render({ shop }) {
  const d = draftFor(shop);
  const dirty = !same(d, published(shop));
  const custom = !ACCENTS.some(([c]) => c === d.accent);
  return `
    <div class="vd-sf-bar">
      <div class="row row-wrap" style="--gap:16px">
        <span class="vd-dirty ${dirty ? '' : 'is-clean'}" data-dirty>${dirty ? 'Unsaved changes' : 'Published'}</span>
        <a class="vd-open" href="#/palace/shop/${esc(shop.slug)}">View the live storefront</a>
      </div>
      <div class="vd-actions">
        <button class="btn btn-ghost btn-sm" data-discard ${dirty ? '' : 'disabled'}>Discard</button>
        <button class="btn btn-gold btn-sm" data-publish ${dirty ? '' : 'disabled'}>Publish changes</button>
      </div>
    </div>

    <div class="vd-sf">
      <form class="panel" data-controls autocomplete="off">
        <div class="vd-ctl">
          <div class="label" id="vd-l-theme">Theme</div>
          <div class="vd-swatches" role="group" aria-labelledby="vd-l-theme">${THEMES.map(([id, label, a, b, c]) => `<button type="button" class="vd-theme ${id === d.theme ? 'is-active' : ''}" data-set="theme" data-value="${id}" aria-pressed="${id === d.theme}" style="--vd-a:${a};--vd-b:${b};--vd-c:${c}"><i></i>${label}</button>`).join('')}</div>
        </div>

        <div class="vd-ctl">
          <div class="label" id="vd-l-accent">Accent</div>
          <div class="vd-swatches" role="group" aria-labelledby="vd-l-accent" style="align-items:center">
            ${ACCENTS.map(([c, label]) => `<button type="button" class="vd-accent ${c === d.accent ? 'is-active' : ''}" data-set="accent" data-value="${c}" style="--vd-a:${c}" aria-label="${label}" title="${label}" aria-pressed="${c === d.accent}"></button>`).join('')}
            <label class="vd-custom-colour"><input type="color" class="vd-swatch-input" data-field="accent" value="${esc(d.accent)}"><span data-custom-label>${custom ? 'Custom' : 'Or your own'}</span></label>
          </div>
        </div>

        <div class="vd-ctl">
          <div class="label" id="vd-l-font">Typography</div>
          <div class="vd-seg" role="group" aria-labelledby="vd-l-font">${FONTS.map(([id, label, fam]) => `<button type="button" class="${id === d.font ? 'is-active' : ''}" data-set="font" data-value="${id}" aria-pressed="${id === d.font}">${label}<small style="font-family:${esc(fam)}">Aa</small></button>`).join('')}</div>
        </div>

        <div class="vd-ctl">
          <div class="label" id="vd-l-hero">Hero layout</div>
          <div class="vd-seg" role="group" aria-labelledby="vd-l-hero">${HEROES.map(([id, label]) => `<button type="button" class="${id === d.heroStyle ? 'is-active' : ''}" data-set="heroStyle" data-value="${id}" aria-pressed="${id === d.heroStyle}">${label}</button>`).join('')}</div>
        </div>

        <div class="vd-ctl">
          <div class="vd-banner-row">
            <label class="field"><span class="label">Monogram</span><input class="input" data-field="monogram" maxlength="2" value="${esc(d.monogram)}" placeholder="${esc(shop.name[0] || 'M')}" style="font-family:var(--serif);font-size:1.3rem;text-align:center"></label>
            <div><div class="label" id="vd-l-banner">Banner gradient</div>
              <div class="vd-banner-row" role="group" aria-labelledby="vd-l-banner">
                <input type="color" class="vd-swatch-input" data-field="banner0" value="${esc(d.banner[0])}" aria-label="Banner centre colour" style="height:50px">
                <input type="color" class="vd-swatch-input" data-field="banner1" value="${esc(d.banner[1])}" aria-label="Banner edge colour" style="height:50px">
              </div></div>
          </div>
          <div class="row row-wrap mt-2" style="--gap:10px"><span class="faint tiny caps">Suited to this theme</span><span class="vd-swatches" data-presets>${presetsHtml(d)}</span></div>
        </div>

        <div class="vd-ctl">
          <label class="field"><span class="label">Tagline</span><input class="input" data-field="tagline" maxlength="120" value="${esc(d.tagline)}" placeholder="One line a guest will remember"></label>
          <label class="field"><span class="label">Announcement line</span><input class="input" data-field="announcement" maxlength="110" value="${esc(d.announcement)}" placeholder="Leave empty to show none"></label>
          <label class="field"><span class="label">The maison’s story</span><textarea class="textarea" data-field="story" maxlength="1200" placeholder="Where you pour, and why.">${esc(d.story)}</textarea></label>
        </div>
      </form>

      <div class="vd-sf-side">
        <div class="vd-toolbar mb-2">
          <div class="eyebrow">Live preview</div>
          <div class="chips" role="group" aria-label="Preview width">${[['desktop', 'Wide'], ['mobile', 'Narrow']].map(([k, l]) => `<button type="button" class="chip ${k === device ? 'is-active' : ''}" data-device="${k}" aria-pressed="${k === device}">${l}</button>`).join('')}</div>
        </div>
        <div class="vd-frame ${device === 'mobile' ? 'is-mobile' : ''}" data-frame>
          <div class="vd-frame-bar"><i></i><i></i><i></i><span>mothmarketpalace · /shop/${esc(shop.slug)}</span></div>
          <div class="vd-pv-wrap" data-preview aria-label="Storefront preview">${previewHtml(shop, d)}</div>
        </div>
        <p class="faint small mt-2">A likeness of your storefront. Guests see nothing new until you publish.</p>
      </div>
    </div>`;
}

export function mount(root, ctx) {
  const shop = ctx.shop;
  const d = draftFor(shop);
  const preview = root.querySelector('[data-preview]');
  const dirtyEl = root.querySelector('[data-dirty]');
  const publish = root.querySelector('[data-publish]');
  const discard = root.querySelector('[data-discard]');
  const controls = root.querySelector('[data-controls]');
  const colourInput = (field) => controls.querySelector(`[data-field="${field}"]`);

  // Redraws the preview and the small state marks only — never the text inputs, so focus is kept.
  const sync = () => {
    preview.innerHTML = previewHtml(shop, d);
    const dirty = !same(d, published(shop));
    dirtyEl.textContent = dirty ? 'Unsaved changes' : 'Published';
    dirtyEl.classList.toggle('is-clean', !dirty);
    publish.disabled = !dirty; discard.disabled = !dirty;
    controls.querySelectorAll('[data-set]').forEach((b) => { const on = d[b.dataset.set] === b.dataset.value; b.classList.toggle('is-active', on); b.setAttribute('aria-pressed', on); });
    controls.querySelector('[data-presets]').innerHTML = presetsHtml(d);
    controls.querySelector('[data-custom-label]').textContent = ACCENTS.some(([c]) => c === d.accent) ? 'Or your own' : 'Custom';
    [['accent', d.accent], ['banner0', d.banner[0]], ['banner1', d.banner[1]]].forEach(([f, v]) => { const el = colourInput(f); if (el && el.value !== v) el.value = v; });
  };

  controls.addEventListener('submit', (e) => e.preventDefault());
  controls.addEventListener('input', (e) => {
    const f = e.target.dataset.field; if (!f) return;
    const v = e.target.value;
    if (f === 'banner0') d.banner = [hex(v, d.banner[0]), d.banner[1]];
    else if (f === 'banner1') d.banner = [d.banner[0], hex(v, d.banner[1])];
    else if (f === 'accent') d.accent = hex(v, d.accent);
    else if (f === 'monogram') d.monogram = v.trim().slice(0, 2);
    else d[f] = f === 'story' ? v : v.replace(/\s+/g, ' ');
    sync();
  });
  controls.addEventListener('click', (e) => {
    const set = e.target.closest('[data-set]');
    if (set) {
      const { set: key, value } = set.dataset;
      if (key === 'theme' && value !== d.theme) {
        // If the banner is still one of the old theme's presets, let it follow the new theme.
        const i = (PRESETS[d.theme] || []).findIndex((p) => same(p, d.banner));
        if (i >= 0) d.banner = [...PRESETS[value][i]];
      }
      d[key] = value; sync(); return;
    }
    const preset = e.target.closest('[data-preset]');
    if (preset) { d.banner = [...(PRESETS[d.theme] || PRESETS.obsidian)[+preset.dataset.preset]]; sync(); }
  });

  root.querySelectorAll('[data-device]').forEach((b) => { b.onclick = () => {
    device = b.dataset.device;
    root.querySelector('[data-frame]').classList.toggle('is-mobile', device === 'mobile');
    root.querySelectorAll('[data-device]').forEach((x) => { const on = x === b; x.classList.toggle('is-active', on); x.setAttribute('aria-pressed', on); });
  }; });

  publish.onclick = () => {
    const mark = d.monogram || shop.name[0]?.toUpperCase() || 'M';
    store.updateShop(shop.id, { theme: d.theme, accent: d.accent, font: d.font, heroStyle: d.heroStyle, monogram: mark, banner: [...d.banner], tagline: d.tagline.trim(), announcement: d.announcement.trim(), story: d.story.trim() });
    drafts.delete(shop.id);
    toast('Your storefront has been published.', { href: `#/palace/shop/${shop.slug}`, action: 'View' });
    ctx.refresh();
  };
  discard.onclick = async () => {
    const ok = await confirmDialog({ title: 'Discard your changes?', body: 'The customiser will return to the storefront as it is published today.', confirm: 'Discard', cancel: 'Keep editing' });
    if (!ok) return;
    drafts.delete(shop.id); toast('Changes discarded.'); ctx.refresh();
  };
}
