// Shared UI helpers. Everything returns HTML strings unless noted.
import * as store from './store.js';

export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
/** money(16500) → "$165" · money(16550) → "$165.50" */
export const money = (cents) => {
  const v = (cents || 0) / 100;
  return v.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: Number.isInteger(v) ? 0 : 2, maximumFractionDigits: 2 });
};
export const pct = (x, digits = 1) => `${((x || 0) * 100).toFixed(digits)}%`;
export const num = (n) => (n || 0).toLocaleString('en-US');
export const dateFmt = (t) => new Date(t).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
export const dateShort = (t) => new Date(typeof t === 'string' && /^\d{4}-\d\d-\d\d$/.test(t) ? `${t}T12:00:00` : t).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
export function relTime(t) {
  const s = Math.max(1, Math.round((Date.now() - t) / 1000));
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.round(s / 60)} min ago`;
  if (s < 86400) return `${Math.round(s / 3600)} hr ago`;
  if (s < 86400 * 7) return `${Math.round(s / 86400)} d ago`;
  return dateShort(t);
}
/** deltaTag(0.12) → <span class="k-delta up">▲ 12% vs prior period</span> */
export function deltaTag(d, label = 'vs prior period') {
  if (d == null || !isFinite(d)) return `<div class="k-delta">— ${label}</div>`;
  const up = d >= 0;
  return `<div class="k-delta ${up ? 'up' : 'down'}">${up ? '▲' : '▼'} ${Math.abs(d * 100).toFixed(0)}% <span class="faint">${label}</span></div>`;
}
export const kpi = (label, value, delta) => `<div class="kpi"><div class="k-label">${esc(label)}</div><div class="k-value">${value}</div>${delta === undefined ? '' : deltaTag(delta)}</div>`;

/* ------------------------------------------------------------------ icons */
const PATHS = {
  bag: '<path d="M5 8h14l-1 12H6L5 8z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
  user: '<circle cx="12" cy="8" r="3.5"/><path d="M5 20c.8-3.5 3.5-5.5 7-5.5s6.200 2 7 5.500"/>',
  heart: '<path d="M12 20s-7-4.400-7-9.600A3.900 3.900 0 0 1 12 8a3.900 3.900 0 0 1 7 2.400c0 5.200-7 9.600-7 9.600z"/>',
  search: '<circle cx="11" cy="11" r="6"/><path d="M20 20l-4.500-4.500"/>',
  menu: '<path d="M4 8h16M4 16h16"/>',
  close: '<path d="M6 6l12 12M18 6L6 18"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  back: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
  check: '<path d="M5 12.500l4.500 4.500L19 7.500"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16v4z"/>',
  trash: '<path d="M5 7h14M10 7V5h4v2M7 7l1 13h8l1-13"/>',
  eye: '<path d="M2.500 12S6 5.500 12 5.500 21.500 12 21.500 12 18 18.500 12 18.500 2.500 12 2.500 12z"/><circle cx="12" cy="12" r="2.500"/>',
  chart: '<path d="M4 20V4M4 20h16M8 16v-4M12 16V8M16 16v-6"/>',
  box: '<path d="M4 8l8-4 8 4v8l-8 4-8-4V8z"/><path d="M4 8l8 4 8-4M12 12v8"/>',
  home: '<path d="M4 11l8-7 8 7v9H4v-9z"/><path d="M10 20v-5h4v5"/>',
  store: '<path d="M4 9l1.500-5h13L20 9M4 9v11h16V9M4 9h16"/><path d="M9 20v-6h6v6"/>',
  brush: '<path d="M14 4l6 6-8 8H6v-6l8-8z"/><path d="M4 20h16"/>',
  chat: '<path d="M4 5h16v11H9l-5 4V5z"/>',
  spark: '<path d="M12 3l1.800 5.400L19 10l-5.200 1.600L12 17l-1.800-5.400L5 10l5.200-1.600L12 3z"/><path d="M19 16l.700 2 2 .700-2 .700-.700 2-.700-2-2-.700 2-.700.700-2z"/>',
  coins: '<ellipse cx="12" cy="7" rx="7" ry="3"/><path d="M5 7v5c0 1.700 3.100 3 7 3s7-1.300 7-3V7M5 12v5c0 1.700 3.100 3 7 3s7-1.300 7-3v-5"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.600 5.600l2.100 2.100M16.300 16.300l2.100 2.100M5.600 18.400l2.100-2.100M16.300 7.700l2.100-2.100"/>',
  bell: '<path d="M6 16V11a6 6 0 0 1 12 0v5l1.500 2h-15L6 16z"/><path d="M10 20a2 2 0 0 0 4 0"/>',
  users: '<circle cx="9" cy="8" r="3"/><path d="M3 19c.600-3 2.800-4.500 6-4.500s5.400 1.500 6 4.500"/><path d="M16 5.500a3 3 0 0 1 0 5.500M17.500 14.800c2 .500 3.200 2 3.500 4.200"/>',
  scroll: '<path d="M7 4h11v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-1h10v1"/><path d="M7 4a2 2 0 0 0-2 2v11M10 9h5M10 12h5"/>',
  crown: '<path d="M4 18h16M4 18L3 8l5 4 4-7 4 7 5-4-1 10"/>',
  shield: '<path d="M12 3l7 3v6c0 4.500-3 7.500-7 9-4-1.500-7-4.500-7-9V6l7-3z"/>',
  truck: '<path d="M3 7h11v9H3zM14 10h4l3 3v3h-7"/><circle cx="7" cy="17.500" r="1.500"/><circle cx="17" cy="17.500" r="1.500"/>',
  star: '<path d="M12 4l2.400 5 5.600.700-4.100 3.800 1.100 5.500-5-2.800-5 2.800 1.100-5.500L4 9.700 9.600 9 12 4z"/>',
  out: '<path d="M10 5H5v14h5M15 8l4 4-4 4M19 12H9"/>',
  gift: '<path d="M4 10h16v10H4zM3 7h18v3H3zM12 7v13"/><path d="M12 7c-1-3-5-3-5-1s3 1 5 1zm0 0c1-3 5-3 5-1s-3 1-5 1z"/>',
  flame: '<path d="M12 3c1 3.500 5 5.500 5 10a5 5 0 0 1-10 0c0-2 1-3.500 2-4.500.300 1.500 1 2.500 2 2.500 0-3 .500-5.500 1-8z"/>',
  pin: '<path d="M12 21s-6-5.500-6-10.500a6 6 0 0 1 12 0C18 15.500 12 21 12 21z"/><circle cx="12" cy="10.500" r="2"/>',
  link: '<path d="M10 14a4 4 0 0 0 5.700 0l3-3a4 4 0 0 0-5.700-5.700l-1 1M14 10a4 4 0 0 0-5.700 0l-3 3A4 4 0 0 0 11 18.700l1-1"/>',
};
export const icon = (name) => `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true">${PATHS[name] || ''}</svg>`;
export const mothMark = (size = 40, color) => `<span class="moth-mark" style="--size:${size}px${color ? `;--mark-color:${color}` : ''}" role="img" aria-label="Moth to a Flame"></span>`;
export const stars = (rating) => `<span class="gold nowrap" aria-label="${rating.toFixed(1)} out of 5">${'★'.repeat(Math.round(rating))}<span class="faint">${'★'.repeat(5 - Math.round(rating))}</span></span>`;
export const monogram = (shop, size = 56) => `<span class="monogram" style="--size:${size}px;--gold:${esc(shop.accent || '#c9a35c')}">${esc(shop.monogram || shop.name[0])}</span>`;
/** Inline attributes that dress a wrapper in a maison's storefront theme. */
export const themeAttrs = (shop) => `data-theme="${esc(shop.theme || 'obsidian')}" data-font="${esc(shop.font || 'classic')}" style="--gold:${esc(shop.accent || '#c9a35c')};--gold-2:${esc(shop.accent || '#c9a35c')};--line:${esc(shop.accent || '#c9a35c')}40"`;

const STATUS_BADGE = { live: 'ok', paid: 'ok', delivered: 'ok', approved: 'ok', shipped: '', preparing: 'warn', placed: 'warn', pending: 'warn', requested: 'warn', paused: 'mute', draft: 'mute', suspended: 'bad', declined: 'bad', refunded: 'bad' };
export const statusBadge = (status) => `<span class="badge ${STATUS_BADGE[status] ? `badge-${STATUS_BADGE[status]}` : ''}">${esc(status)}</span>`;

/* ------------------------------------------------------------ candle art */
let artId = 0;
const shade = (hex, amt) => {
  const n = parseInt(hex.replace('#', ''), 16);
  const ch = (v) => Math.max(0, Math.min(255, Math.round(v + amt * 255)));
  return `#${[ch(n >> 16), ch((n >> 8) & 255), ch(n & 255)].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
};
const lum = (hex) => { const n = parseInt(hex.replace('#', ''), 16); return (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255; };
/**
 * Product artwork. Uses the product photograph when it has one, otherwise
 * draws the candle from its `vessel` description so every maison has imagery.
 * opts: { lit = true, alt }
 */
export function candleArt(product, { lit = true, alt } = {}) {
  if (product.image) return `<img src="${esc(product.image)}" alt="${esc(alt || product.name)}" loading="lazy">`;
  const shop = store.getShop(product.shopId) || { banner: ['#1a1410', '#0b0a09'], monogram: 'M', name: '' };
  const v = { shape: 'tumbler', body: '#15120f', rim: '#c9a35c', wax: '#efe3c8', label: 'none', ink: '#c9a35c', ...(product.vessel || {}) };
  const [b1, b2] = shop.banner || ['#1a1410', '#0b0a09'];
  const id = `ca${++artId}`;
  const dark = lum(b2) < 0.5;
  const dims = { tumbler: [128, 250, 190, 10], jar: [120, 262, 176, 26], coupe: [112, 280, 150, 30], tin: [104, 318, 104, 12], pillar: [146, 190, 250, 6] }[v.shape] || [128, 250, 190, 10];
  const [x, y, h, rx] = dims; const w = 400 - x * 2; const cx = 200;
  const ry = v.shape === 'tin' ? 16 : 20;
  const flameY = v.shape === 'pillar' ? y - 8 : y - 2;
  const lid = v.shape === 'jar' && !lit ? `<rect x="${x - 4}" y="${y - 34}" width="${w + 8}" height="40" rx="6" fill="${v.rim}"/>` : '';
  const label = v.label && v.label !== 'none'
    ? `<rect x="${x + (v.shape === 'jar' ? 0 : 22)}" y="${y + h * 0.3}" width="${w - (v.shape === 'jar' ? 0 : 44)}" height="${h * 0.48}" fill="${v.label}"/>`
    : '';
  const markY = y + h * (v.shape === 'tin' ? 0.52 : 0.5);
  const mark = v.shape === 'pillar' ? '' : `
    <circle cx="${cx}" cy="${markY - 8}" r="${v.shape === 'tin' ? 15 : 21}" fill="none" stroke="${v.ink}" stroke-width="1"/>
    <text x="${cx}" y="${markY - (v.shape === 'tin' ? 2 : 0)}" text-anchor="middle" font-family="Cormorant Garamond, serif" font-size="${v.shape === 'tin' ? 18 : 26}" fill="${v.ink}">${esc(shop.monogram || 'M')}</text>
    ${v.shape === 'tin' ? '' : `<text x="${cx}" y="${markY + 34}" text-anchor="middle" font-family="Jost, sans-serif" font-size="7.500" letter-spacing="3" fill="${v.ink}">${esc(shop.name.toUpperCase().slice(0, 24))}</text>`}`;
  const flame = lit ? `
    <ellipse cx="${cx}" cy="${flameY - 46}" rx="120" ry="110" fill="url(#${id}g)"/>
    <g class="flame-anim"><path d="M${cx} ${flameY - 84}c9 20 18 31 18 46a18 18 0 0 1-36 0c0-15 9-26 18-46z" fill="url(#${id}f)"/>
    <path d="M${cx} ${flameY - 50}c4 8 7 12 7 18a7 7 0 0 1-14 0c0-6 3-10 7-18z" fill="#fff6dc" opacity=".9"/></g>` : '';
  const bodyFill = v.glass ? `url(#${id}gl)` : `url(#${id}b)`;
  return `<svg viewBox="0 0 400 500" preserveAspectRatio="xMidYMid slice" role="img" aria-label="${esc(alt || product.name)}">
    <defs>
      <radialGradient id="${id}bg" cx="50%" cy="38%" r="80%"><stop offset="0" stop-color="${b1}"/><stop offset="1" stop-color="${b2}"/></radialGradient>
      <linearGradient id="${id}b" x1="0" x2="1"><stop offset="0" stop-color="${shade(v.body, -0.05)}"/><stop offset=".28" stop-color="${shade(v.body, 0.07)}"/><stop offset=".62" stop-color="${v.body}"/><stop offset="1" stop-color="${shade(v.body, -0.09)}"/></linearGradient>
      <linearGradient id="${id}gl" x1="0" x2="1"><stop offset="0" stop-color="${v.wax}" stop-opacity=".75"/><stop offset=".3" stop-color="${shade(v.wax, 0.03)}"/><stop offset="1" stop-color="${shade(v.wax, -0.1)}" stop-opacity=".8"/></linearGradient>
      <radialGradient id="${id}g"><stop offset="0" stop-color="#ffd98a" stop-opacity="${dark ? 0.42 : 0.5}"/><stop offset="1" stop-color="#ffd98a" stop-opacity="0"/></radialGradient>
      <linearGradient id="${id}f" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe9b0"/><stop offset=".6" stop-color="#f7b955"/><stop offset="1" stop-color="#e58a2b"/></linearGradient>
    </defs>
    <rect width="400" height="500" fill="url(#${id}bg)"/>
    <ellipse cx="${cx}" cy="${y + h + 6}" rx="${w * 0.62}" ry="16" fill="#000" opacity="${dark ? 0.45 : 0.14}"/>
    <path d="M${x} ${y}h${w}v${h - rx}a${rx} ${rx} 0 0 1-${rx} ${rx}h-${w - rx * 2}a${rx} ${rx} 0 0 1-${rx}-${rx}z" fill="${bodyFill}"/>
    <ellipse cx="${cx}" cy="${y + h}" rx="${w / 2 - rx * 0.4}" ry="${ry * 0.5}" fill="${shade(v.body, -0.1)}" opacity=".35"/>
    ${label}${mark}
    <ellipse cx="${cx}" cy="${y}" rx="${w / 2}" ry="${ry}" fill="${v.inner || shade(v.body, -0.06)}" stroke="${v.rim}" stroke-width="1.500"/>
    <ellipse cx="${cx}" cy="${y + 3}" rx="${w / 2 - 9}" ry="${ry - 5}" fill="${v.wax}"/>
    ${lid}
    ${lit ? `<path d="M${cx} ${y + 2}v-12" stroke="#2a2018" stroke-width="2" stroke-linecap="round"/>` : ''}
    ${flame}
    <rect x="${x + w * 0.14}" y="${y + 20}" width="5" height="${h - 50}" rx="2.500" fill="#fff" opacity="${dark ? 0.06 : 0.25}"/>
  </svg>`;
}
/** Decorative banner for a maison (cards, storefront heroes). */
export function shopBanner(shop, { withMark = true } = {}) {
  const [b1, b2] = shop.banner || ['#1a1410', '#0b0a09'];
  if (shop.heroImage) return `<img src="${esc(shop.heroImage)}" alt="${esc(shop.name)}" style="width:100%;height:100%;object-fit:cover" loading="lazy">`;
  const ink = shop.accent || '#c9a35c';
  return `<div style="position:absolute;inset:0;background:radial-gradient(120% 90% at 50% 20%, ${b1}, ${b2})"></div>
    ${withMark ? `<div style="position:relative;text-align:center;color:${ink}"><span class="monogram" style="--size:76px;--gold:${ink}">${esc(shop.monogram)}</span>
    <div style="margin-top:14px;font-family:var(--serif);letter-spacing:.2em;text-transform:uppercase;font-size:.95rem">${esc(shop.name)}</div></div>` : ''}`;
}

/* --------------------------------------------------------- product / shop */
/** Standard product tile. Wishlist + quick-add buttons are handled globally by app.js. */
export function productCard(p, { showMaison = true } = {}) {
  const shop = store.getShop(p.shopId);
  const sold = p.stock <= 0;
  const flag = sold ? 'Resting' : p.tags?.includes('limited') ? 'Limited' : p.tags?.includes('new') ? 'New' : p.tags?.includes('bestseller') ? 'Most loved' : '';
  return `<article class="product-card">
    <a href="#/palace/product/${p.id}" class="art">${candleArt(p)}</a>
    ${flag ? `<span class="badge badge-plain flag">${flag}</span>` : ''}
    <button class="icon-btn wish ${store.isWished(p.id) ? 'is-on' : ''}" data-wish="${p.id}" aria-label="Save ${esc(p.name)}">${icon('heart')}</button>
    ${sold ? '' : `<button class="btn btn-sm quick" data-add-to-bag="${p.id}">Add to bag</button>`}
    <a href="#/palace/product/${p.id}" class="meta" style="display:block">
      ${showMaison && shop ? `<div class="maison">${esc(shop.name)}</div>` : ''}
      <div class="name">${esc(p.name)}</div>
      <div class="notes">${esc([p.notes.top, p.notes.heart].filter(Boolean).join(' · '))}</div>
      <div class="price">${money(p.price)}</div>
    </a>
  </article>`;
}
export function maisonCard(shop) {
  const count = store.listProducts({ shopId: shop.id, publicOnly: true }).length;
  return `<a class="maison-card" href="#/palace/shop/${shop.slug}">
    <div class="banner">${shopBanner(shop)}</div>
    <div class="body">
      <div class="row between"><div class="h3">${esc(shop.name)}</div>${shop.flagship ? '<span class="badge badge-plain">Founding house</span>' : ''}</div>
      <p class="muted small mt-1">${esc(shop.tagline)}</p>
      <p class="faint tiny mt-2 caps">${esc(shop.location)} · ${count} pieces</p>
    </div>
  </a>`;
}

/* ------------------------------------------------------------------ charts */
/** Area/line chart. values: number[]; labels: string[] (optional, same length). */
export function lineChart(values, { labels = [], height = 220, format = (v) => v, color = 'var(--gold)' } = {}) {
  const W = 720, H = height, pad = { l: 44, r: 8, t: 12, b: 26 };
  const max = Math.max(1, ...values) * 1.1; const n = values.length;
  const X = (i) => pad.l + (n <= 1 ? 0 : (i * (W - pad.l - pad.r)) / (n - 1));
  const Y = (v) => pad.t + (1 - v / max) * (H - pad.t - pad.b);
  const pts = values.map((v, i) => `${X(i).toFixed(1)},${Y(v).toFixed(1)}`).join(' ');
  const id = `lc${++artId}`;
  const grid = [0, 0.5, 1].map((f) => `<line x1="${pad.l}" x2="${W - pad.r}" y1="${Y(max * f / 1.1)}" y2="${Y(max * f / 1.1)}" stroke="var(--line-2)"/><text x="${pad.l - 8}" y="${Y(max * f / 1.1) + 3}" text-anchor="end">${esc(format(Math.round(max * f / 1.1)))}</text>`).join('');
  const step = Math.max(1, Math.ceil(n / 7));
  const xl = labels.map((l, i) => (i % step === 0 || i === n - 1) && !(i !== n - 1 && n - 1 - i < step / 2) ? `<text x="${X(i)}" y="${H - 6}" text-anchor="middle">${esc(l)}</text>` : '').join('');
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img"><defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${color}" stop-opacity=".28"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></linearGradient></defs>
    ${grid}<polygon points="${X(0)},${Y(0)} ${pts} ${X(n - 1)},${Y(0)}" fill="url(#${id})"/>
    <polyline points="${pts}" fill="none" stroke="${color}" stroke-width="1.600" stroke-linejoin="round"/>${xl}</svg>`;
}
export function barChart(values, { labels = [], height = 200, format = (v) => v } = {}) {
  const W = 720, H = height, pad = { l: 44, r: 8, t: 12, b: 26 };
  const max = Math.max(1, ...values) * 1.1; const n = values.length; const bw = (W - pad.l - pad.r) / n;
  const Y = (v) => pad.t + (1 - v / max) * (H - pad.t - pad.b);
  const step = Math.max(1, Math.ceil(n / 8));
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img">
    ${[0, 0.5, 1].map((f) => `<line x1="${pad.l}" x2="${W - pad.r}" y1="${Y(max * f / 1.1)}" y2="${Y(max * f / 1.1)}" stroke="var(--line-2)"/><text x="${pad.l - 8}" y="${Y(max * f / 1.1) + 3}" text-anchor="end">${esc(format(Math.round(max * f / 1.1)))}</text>`).join('')}
    ${values.map((v, i) => `<rect x="${pad.l + i * bw + bw * 0.2}" y="${Y(v)}" width="${bw * 0.6}" height="${Math.max(0, Y(0) - Y(v))}" fill="var(--gold)" opacity=".85"><title>${esc(labels[i] || '')}: ${esc(format(v))}</title></rect>`).join('')}
    ${labels.map((l, i) => i % step === 0 ? `<text x="${pad.l + i * bw + bw / 2}" y="${H - 6}" text-anchor="middle">${esc(l)}</text>` : '').join('')}</svg>`;
}
export function sparkline(values, { width = 120, height = 34 } = {}) {
  const max = Math.max(1, ...values), min = Math.min(...values); const n = values.length;
  const pts = values.map((v, i) => `${((i / (n - 1 || 1)) * width).toFixed(1)},${(height - 3 - ((v - min) / (max - min || 1)) * (height - 6)).toFixed(1)}`).join(' ');
  return `<svg viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" aria-hidden="true"><polyline points="${pts}" fill="none" stroke="var(--gold)" stroke-width="1.300"/></svg>`;
}
/** Horizontal ranked bars. rows: [{ label, value, display }] */
export function barList(rows) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return rows.map((r) => `<div class="bar-row"><span class="grow" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(r.label)}</span><span class="track"><span class="fill" style="display:block;width:${(r.value / max) * 100}%"></span></span><span class="num">${esc(r.display ?? r.value)}</span></div>`).join('');
}

/* -------------------------------------------------------- toast and modal */
const overlays = () => document.getElementById('overlays');
/** toast('Added to your bag', { href: '#/palace/bag', action: 'View bag' }) */
export function toast(message, { href, action } = {}) {
  let wrap = document.querySelector('.toasts');
  if (!wrap) { wrap = document.createElement('div'); wrap.className = 'toasts'; overlays().appendChild(wrap); }
  const el = document.createElement('div'); el.className = 'toast';
  el.innerHTML = `<span class="moth-mark"></span><span>${esc(message)}</span>${href ? `<a href="${esc(href)}">${esc(action || 'View')}</a>` : ''}`;
  wrap.appendChild(el);
  setTimeout(() => { el.style.transition = 'opacity .5s'; el.style.opacity = '0'; setTimeout(() => el.remove(), 500); }, 3600);
}
/**
 * modal({ title, eyebrow, body, width, actions: [{ label, kind: 'gold'|'ghost'|'danger', value, onClick(modalEl, close) }] })
 * Returns { el, close }. An action without onClick closes the modal. `body` is trusted HTML.
 */
export function modal({ title = '', eyebrow = '', body = '', width, actions = [], onClose } = {}) {
  const back = document.createElement('div'); back.className = 'modal-back';
  back.innerHTML = `<div class="modal" role="dialog" aria-modal="true" ${width ? `style="--modal-w:${width}px"` : ''}>
    <button class="icon-btn modal-close" aria-label="Close">${icon('close')}</button>
    ${eyebrow ? `<div class="eyebrow mb-1">${esc(eyebrow)}</div>` : ''}${title ? `<h2 class="h2 mb-3">${esc(title)}</h2>` : ''}
    <div class="modal-body">${body}</div>
    ${actions.length ? `<div class="modal-actions">${actions.map((a, i) => `<button class="btn btn-sm ${a.kind === 'gold' ? 'btn-gold' : a.kind === 'danger' ? 'btn-danger' : 'btn-ghost'}" data-i="${i}">${esc(a.label)}</button>`).join('')}</div>` : ''}
  </div>`;
  const close = (value) => { back.remove(); document.removeEventListener('keydown', onKey); onClose && onClose(value); };
  const onKey = (e) => { if (e.key === 'Escape') close(); };
  document.addEventListener('keydown', onKey);
  back.addEventListener('mousedown', (e) => { if (e.target === back) close(); });
  back.querySelector('.modal-close').onclick = () => close();
  back.querySelectorAll('[data-i]').forEach((b) => { b.onclick = () => { const a = actions[+b.dataset.i]; if (a.onClick) a.onClick(back.querySelector('.modal'), close); else close(a.value); }; });
  overlays().appendChild(back);
  const first = back.querySelector('input, textarea, select'); if (first) first.focus();
  return { el: back.querySelector('.modal'), close };
}
/** Promise<boolean> confirmation in the house style. */
export function confirmDialog({ title, body = '', confirm = 'Confirm', cancel = 'Cancel', danger = false }) {
  return new Promise((resolve) => {
    let done = false;
    const m = modal({ title, body: `<p class="muted">${body}</p>`, onClose: () => { if (!done) resolve(false); },
      actions: [{ label: cancel, kind: 'ghost' }, { label: confirm, kind: danger ? 'danger' : 'gold', onClick: () => { done = true; m.close(); resolve(true); } }] });
  });
}
/** Read a <form>'s named fields into an object (checkboxes → boolean). */
export function formData(form) {
  const out = {};
  form.querySelectorAll('[name]').forEach((el) => { out[el.name] = el.type === 'checkbox' ? el.checked : el.value.trim(); });
  return out;
}
/** Fade elements with .reveal in as they scroll into view. Call from mount(). */
export function revealOnScroll(root = document) {
  const els = root.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window)) { els.forEach((el) => el.classList.add('is-in')); return; }
  const io = new IntersectionObserver((entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } }), { threshold: 0.12 });
  els.forEach((el) => io.observe(el));
}
export const EVENT_COPY = {
  shop_view: ['eye', 'A guest stepped into the maison'], product_view: ['eye', 'viewed'], bag_add: ['bag', 'added to a bag'],
  chat: ['chat', 'A guest spoke with the front desk'], order: ['coins', 'Order'], wish: ['heart', 'saved'], follow: ['star', 'A patron began following the maison'],
};
/** One line of an activity feed for a store event. */
export function eventLine(e, { showShop = false } = {}) {
  const [ic, verb] = EVENT_COPY[e.type] || ['spark', e.type];
  const p = e.productId ? store.getProduct(e.productId) : null;
  const shop = showShop ? store.getShop(e.shopId) : null;
  let text;
  if (e.type === 'order') text = `Order ${esc(e.meta?.number || '')} · <span class="gold">${money(e.meta?.amount)}</span>${e.meta?.customer ? ` from ${esc(e.meta.customer)}` : ''}`;
  else if (p) text = `<em>${esc(p.name)}</em> ${verb}`;
  else text = verb;
  const where = [shop?.name, e.meta?.city].filter(Boolean).map(esc).join(' · ');
  return `<li><span class="dot">${icon(ic)}</span><div>${text}${where ? `<div class="faint tiny">${where}</div>` : ''}</div><time>${relTime(e.at)}</time></li>`;
}
