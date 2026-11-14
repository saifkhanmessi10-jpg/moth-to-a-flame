// The Palace data layer.
// In this preview the "backend" is a seeded database kept in localStorage, behind
// the same function surface a hosted API would expose. Every page talks to the
// store only through these exports, so swapping in a real backend later means
// re-implementing this one file (see docs/ARCHITECTURE.md and docs/schema.sql).

import { buildSeed, dayKey } from './seed.js';

const KEY = 'mtaf.palace.v1';
const DAY = 86400000;
let db = load();
const subs = new Set();

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) { const d = JSON.parse(raw); if (d && d.version === 1) return d; }
  } catch { /* storage unavailable — run in memory */ }
  const fresh = buildSeed();
  persist(fresh);
  return fresh;
}
function persist(d = db) { try { localStorage.setItem(KEY, JSON.stringify(d)); } catch { /* in-memory only */ } }
function commit() { persist(); subs.forEach((fn) => { try { fn(); } catch (e) { console.error(e); } }); }
const uid = (p) => `${p}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
const clone = (x) => JSON.parse(JSON.stringify(x));
const slugify = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/** Subscribe to any data change. Returns an unsubscribe function. */
export function subscribe(fn) { subs.add(fn); return () => subs.delete(fn); }
/** Wipe the preview back to its seeded state. */
export function resetDemo() { db = buildSeed(); commit(); }

/* ----------------------------------------------------------------- session */
export function currentUser() { return db.users.find((u) => u.id === db.session.userId) || null; }
export function signIn(email, password) {
  const u = db.users.find((x) => x.email.toLowerCase() === String(email).trim().toLowerCase());
  if (!u || u.password !== password) return { ok: false, error: 'We could not find that invitation. Please check your details.' };
  db.session.userId = u.id; commit();
  return { ok: true, user: u };
}
export function signInAs(userId) { db.session.userId = userId; commit(); return currentUser(); }
export function signOut() { db.session.userId = null; commit(); }
export function signUp({ name, email, password }) {
  email = String(email).trim().toLowerCase();
  if (!name || !email || !password) return { ok: false, error: 'Please complete every field.' };
  if (db.users.some((u) => u.email.toLowerCase() === email)) return { ok: false, error: 'An account already exists for that address.' };
  const u = { id: uid('u'), name: name.trim(), email, password, role: 'patron', createdAt: Date.now(), wishlist: [], following: [] };
  db.users.push(u); db.session.userId = u.id; commit();
  return { ok: true, user: u };
}
export function updateUser(id, patch) {
  const u = db.users.find((x) => x.id === id); if (!u) return null;
  Object.assign(u, patch); commit(); return u;
}
export function listUsers({ role } = {}) { return db.users.filter((u) => !role || u.role === role); }
export function getUser(id) { return db.users.find((u) => u.id === id) || null; }

/* ---------------------------------------------------------------- settings */
export function getSettings() { return db.settings; }
export function updateSettings(patch) { Object.assign(db.settings, patch); commit(); return db.settings; }

/* ------------------------------------------------------------------- shops */
/** status: 'live' | 'paused' | 'suspended' | undefined (all) */
export function listShops({ status, featured } = {}) {
  return db.shops.filter((s) => (!status || s.status === status) && (featured == null || (db.settings.featuredShopIds.includes(s.id) && s.status === 'live') === featured));
}
export function getShop(idOrSlug) { return db.shops.find((s) => s.id === idOrSlug || s.slug === idOrSlug) || null; }
export function updateShop(id, patch) {
  const s = getShop(id); if (!s) return null;
  Object.assign(s, patch); commit(); return s;
}
export function isFeatured(shopId) { return db.settings.featuredShopIds.includes(shopId); }
export function setFeatured(shopId, on) {
  const set = new Set(db.settings.featuredShopIds);
  on ? set.add(shopId) : set.delete(shopId);
  db.settings.featuredShopIds = [...set]; commit();
}
/** The commission rate charged to a maison: its own override, else the Palace rate. */
export function feeRateFor(shop) {
  const s = typeof shop === 'string' ? getShop(shop) : shop;
  return s && s.feeOverride != null ? s.feeOverride : db.settings.feeRate;
}

/* ---------------------------------------------------------------- products */
export const CATEGORIES = ['Signature', 'Floral', 'Woody & Resin', 'Fresh & Coastal', 'Gourmand', 'Gift Sets', 'Subscriptions'];
/**
 * listProducts({ shopId, status, q, category, sort, publicOnly })
 * sort: 'new' | 'price-asc' | 'price-desc' | 'name'
 * publicOnly hides drafts and products of maisons that are not live.
 */
export function listProducts({ shopId, status, q, category, sort = 'new', publicOnly = false } = {}) {
  const needle = (q || '').trim().toLowerCase();
  let list = db.products.filter((p) => {
    if (shopId && p.shopId !== shopId) return false;
    if (status && p.status !== status) return false;
    if (category && p.category !== category) return false;
    if (publicOnly) { if (p.status !== 'live') return false; const s = getShop(p.shopId); if (!s || s.status !== 'live') return false; }
    if (needle) {
      const hay = [p.name, p.collection, p.category, p.notes.top, p.notes.heart, p.notes.base, p.description, getShop(p.shopId)?.name].join(' ').toLowerCase();
      if (!needle.split(/\s+/).every((w) => hay.includes(w))) return false;
    }
    return true;
  });
  const sorters = { new: (a, b) => b.createdAt - a.createdAt, 'price-asc': (a, b) => a.price - b.price, 'price-desc': (a, b) => b.price - a.price, name: (a, b) => a.name.localeCompare(b.name) };
  return list.sort(sorters[sort] || sorters.new);
}
export function getProduct(id) { return db.products.find((p) => p.id === id) || null; }
/** Create (no id) or update a product. Prices are integer cents. */
export function saveProduct(data) {
  if (data.id) {
    const p = getProduct(data.id); if (!p) return null;
    Object.assign(p, data); commit(); return p;
  }
  const p = {
    id: uid('p'), status: 'live', stock: 0, tags: [], image: null, description: '', collection: '', category: 'Signature',
    notes: { top: '', heart: '', base: '' }, burnTime: 50, weight: '10 oz',
    vessel: { shape: 'tumbler', body: '#15120f', rim: '#c9a35c', wax: '#efe3c8', label: 'none', ink: '#c9a35c' },
    createdAt: Date.now(), ...data,
  };
  db.products.unshift(p); commit(); return p;
}
export function deleteProduct(id) { db.products = db.products.filter((p) => p.id !== id); db.bag = db.bag.filter((b) => b.productId !== id); commit(); }

/* --------------------------------------------------------------------- bag */
export function getBag() {
  return db.bag.map((b) => ({ ...b, product: getProduct(b.productId) })).filter((b) => b.product).map((b) => ({ ...b, shop: getShop(b.product.shopId), lineTotal: b.product.price * b.qty }));
}
export function bagCount() { return db.bag.reduce((n, b) => n + b.qty, 0); }
export function addToBag(productId, qty = 1) {
  const p = getProduct(productId); if (!p || p.stock <= 0) return false;
  const line = db.bag.find((b) => b.productId === productId);
  if (line) line.qty = Math.min(p.stock, line.qty + qty); else db.bag.push({ productId, qty: Math.min(p.stock, qty) });
  track('bag_add', { shopId: p.shopId, productId }); commit(); return true;
}
export function setBagQty(productId, qty) {
  const p = getProduct(productId);
  if (qty <= 0 || !p) db.bag = db.bag.filter((b) => b.productId !== productId);
  else { const line = db.bag.find((b) => b.productId === productId); if (line) line.qty = Math.min(p.stock, qty); }
  commit();
}
export function clearBag() { db.bag = []; commit(); }
/** { subtotal, delivery, total, count, byShop: [{ shop, items, subtotal }] } — delivery is complimentary. */
export function bagTotals() {
  const items = getBag();
  const byShop = [];
  items.forEach((it) => {
    let g = byShop.find((x) => x.shop.id === it.shop.id);
    if (!g) byShop.push((g = { shop: it.shop, items: [], subtotal: 0 }));
    g.items.push(it); g.subtotal += it.lineTotal;
  });
  const subtotal = items.reduce((s, it) => s + it.lineTotal, 0);
  return { subtotal, delivery: 0, total: subtotal, count: bagCount(), byShop };
}

/* ------------------------------------------------------------------ orders */
export const PARCEL_STATUSES = ['placed', 'preparing', 'shipped', 'delivered', 'refunded'];
/**
 * Turn the bag into one order with a parcel per maison. The platform fee is
 * taken per parcel: fee = subtotal × feeRateFor(shop); net = subtotal − fee.
 * No payment is taken in the preview.
 */
export function placeOrder({ shipping, giftNote = '', email = '' }) {
  // Trim the bag to what is still in stock before charging for it.
  db.bag = db.bag.map((b) => ({ ...b, qty: Math.min(b.qty, getProduct(b.productId)?.stock || 0) })).filter((b) => b.qty > 0);
  const totals = bagTotals();
  if (!totals.count) return null;
  const user = currentUser();
  const n = 1000 + db.orders.length + 41 + Math.floor(Math.random() * 3);
  const parcels = totals.byShop.map(({ shop, items, subtotal }) => {
    const feeRate = feeRateFor(shop);
    const fee = Math.round(subtotal * feeRate);
    return { shopId: shop.id, items: items.map((it) => ({ productId: it.productId, name: it.product.name, price: it.product.price, qty: it.qty })), subtotal, feeRate, fee, net: subtotal - fee, status: 'placed', tracking: '', payoutId: null };
  });
  const order = { id: uid('o'), number: `MP-${n}`, userId: user?.id || null, customer: shipping.name, email: email || user?.email || '', createdAt: Date.now(), shipping, giftNote, parcels, subtotal: totals.subtotal, total: totals.total };
  db.orders.unshift(order);
  parcels.forEach((parcel) => {
    parcel.items.forEach((it) => { const p = getProduct(it.productId); if (p) { p.stock = Math.max(0, p.stock - it.qty); if (p.stock > 0 && p.stock <= 5) pushNote(parcel.shopId, 'stock', `${p.name} is running low`, `Only ${p.stock} remain in the atelier.`, '/atelier/products'); } });
    track('order', { shopId: parcel.shopId, productId: parcel.items[0].productId, amount: parcel.subtotal, number: order.number, customer: order.customer });
    pushNote(parcel.shopId, 'order', 'A new order has arrived', `${order.number} · ${parcel.items.map((i) => i.name).join(', ')}`, '/atelier/orders');
  });
  if (user && shipping.line1 && !user.address) user.address = { line1: shipping.line1, city: shipping.city, region: shipping.region, postal: shipping.postal, country: shipping.country };
  db.bag = [];
  commit();
  return order;
}
export function listOrders({ userId, shopId } = {}) {
  return db.orders.filter((o) => (!userId || o.userId === userId) && (!shopId || o.parcels.some((p) => p.shopId === shopId)));
}
export function getOrder(id) { return db.orders.find((o) => o.id === id || o.number === id) || null; }
/** Flattened [{ order, parcel }] — what a maison (or the Keeper) works from. */
export function listParcels({ shopId, status } = {}) {
  const out = [];
  db.orders.forEach((order) => order.parcels.forEach((parcel) => {
    if ((!shopId || parcel.shopId === shopId) && (!status || parcel.status === status)) out.push({ order, parcel });
  }));
  return out;
}
export function updateParcel(orderId, shopId, patch) {
  const order = getOrder(orderId); const parcel = order?.parcels.find((p) => p.shopId === shopId);
  if (!parcel) return null;
  Object.assign(parcel, patch);
  if (patch.status === 'shipped' && !parcel.tracking) parcel.tracking = `MP${Math.floor(10000000 + Math.random() * 89999999)}`;
  if (patch.status === 'refunded') {
    // Money already requested is taken back out of the request; money already paid is clawed back from the next payout.
    const payout = parcel.payoutId && db.payouts.find((p) => p.id === parcel.payoutId);
    if (payout && payout.status === 'requested') { payout.amount -= parcel.net; payout.parcels -= 1; parcel.payoutId = null; if (payout.parcels <= 0) db.payouts = db.payouts.filter((p) => p !== payout); }
    else if (payout) parcel.clawback = parcel.net;
    parcel.fee = 0; parcel.net = 0;
  }
  commit(); return parcel;
}

/* ------------------------------------------------------ fees and payouts */
/** { gross, fees, net, pending, available, paid, requested } in cents for one maison. */
export function balance(shopId) {
  const b = { gross: 0, fees: 0, net: 0, pending: 0, available: 0, paid: 0, requested: 0 };
  listParcels({ shopId }).forEach(({ parcel: p }) => {
    if (p.status === 'refunded') { b.available -= p.clawback || 0; return; }
    b.gross += p.subtotal; b.fees += p.fee; b.net += p.net;
    if (p.payoutId) return;
    if (p.status === 'shipped' || p.status === 'delivered') b.available += p.net; else b.pending += p.net;
  });
  db.payouts.filter((p) => p.shopId === shopId).forEach((p) => { if (p.status === 'paid') b.paid += p.amount; else b.requested += p.amount; });
  return b;
}
export function listPayouts({ shopId, status } = {}) {
  return db.payouts.filter((p) => (!shopId || p.shopId === shopId) && (!status || p.status === status)).sort((a, b) => b.requestedAt - a.requestedAt);
}
/** Maison asks for its available balance. Creates a 'requested' payout for the Keeper to settle. */
export function requestPayout(shopId) {
  const included = listParcels({ shopId }).map((x) => x.parcel).filter((p) => !p.payoutId && (p.status === 'shipped' || p.status === 'delivered'));
  const owed = listParcels({ shopId }).map((x) => x.parcel).filter((p) => p.clawback > 0); // refunded after an earlier payout
  const amount = included.reduce((s, p) => s + p.net, 0) - owed.reduce((s, p) => s + p.clawback, 0);
  if (amount > 0) owed.forEach((p) => { p.clawback = 0; });
  if (amount <= 0) return null;
  const payout = { id: uid('po'), shopId, amount, parcels: included.length, status: 'requested', requestedAt: Date.now(), paidAt: null };
  included.forEach((p) => { p.payoutId = payout.id; });
  db.payouts.push(payout);
  pushNote('admin', 'payout', `${getShop(shopId).name} requested a payout`, `Awaiting settlement.`, '/keeper/finance');
  commit(); return payout;
}
export function settlePayout(id) {
  const p = db.payouts.find((x) => x.id === id); if (!p) return null;
  p.status = 'paid'; p.paidAt = Date.now();
  pushNote(p.shopId, 'payout', 'Your payout has been settled', 'The funds are on their way to your account.', '/atelier/payouts');
  commit(); return p;
}
/** Palace-wide money: { gmv, fees, net, orders, parcels, aov } over the last `days` (all time if omitted). */
export function palaceFinance(days) {
  const since = days ? Date.now() - days * DAY : 0;
  const f = { gmv: 0, fees: 0, net: 0, orders: 0, parcels: 0, aov: 0 };
  db.orders.forEach((o) => {
    if (o.createdAt < since) return;
    let counted = false;
    o.parcels.forEach((p) => { if (p.status === 'refunded') return; f.gmv += p.subtotal; f.fees += p.fee; f.net += p.net; f.parcels++; counted = true; });
    if (counted) f.orders++;
  });
  f.aov = f.orders ? Math.round(f.gmv / f.orders) : 0;
  return f;
}

/* -------------------------------------------------- analytics and events */
const STAT_KEY = { shop_view: 'v', product_view: 'p', bag_add: 'b', chat: 'c', order: 'o' };
/**
 * Record a shopper signal. type: 'shop_view' | 'product_view' | 'bag_add' | 'chat' | 'order' | 'wish' | 'follow'
 * Persists silently (does not notify subscribers) so it is safe to call from render/mount.
 */
export function track(type, { shopId, productId = null, ...meta } = {}) {
  if (!shopId) return;
  const key = dayKey(Date.now());
  const shopStats = (db.stats[shopId] ||= {});
  const day = (shopStats[key] ||= { v: 0, p: 0, b: 0, c: 0, o: 0, r: 0 });
  if (STAT_KEY[type]) day[STAT_KEY[type]] += 1;
  if (type === 'order') day.r += meta.amount || 0;
  db.events.unshift({ id: uid('e'), type, shopId, productId, at: Date.now(), meta });
  if (db.events.length > 400) db.events.length = 400;
  persist();
}
export function listEvents({ shopId, type, limit = 40 } = {}) {
  return db.events.filter((e) => (!shopId || e.shopId === shopId) && (!type || e.type === type)).slice(0, limit);
}
/**
 * metrics(shopId | null, days) — null means the whole Palace.
 * Returns { series: [{ date, visits, productViews, bagAdds, chats, orders, revenue }],
 *           totals: {…same keys, conversion}, prev: {…previous period}, delta: {…% change} }
 */
export function metrics(shopId = null, days = 30) {
  const ids = shopId ? [shopId] : db.shops.map((s) => s.id);
  const read = (offset) => {
    const row = { visits: 0, productViews: 0, bagAdds: 0, chats: 0, orders: 0, revenue: 0 };
    const key = dayKey(Date.now() - offset * DAY);
    ids.forEach((id) => { const d = db.stats[id]?.[key]; if (d) { row.visits += d.v; row.productViews += d.p; row.bagAdds += d.b; row.chats += d.c; row.orders += d.o; row.revenue += d.r; } });
    return { date: key, ...row };
  };
  const sum = (rows) => {
    const t = { visits: 0, productViews: 0, bagAdds: 0, chats: 0, orders: 0, revenue: 0 };
    rows.forEach((r) => Object.keys(t).forEach((k) => { t[k] += r[k]; }));
    t.conversion = t.visits ? t.orders / t.visits : 0;
    return t;
  };
  const series = []; const before = [];
  for (let i = days - 1; i >= 0; i--) series.push(read(i));
  for (let i = days * 2 - 1; i >= days; i--) before.push(read(i));
  const totals = sum(series); const prev = sum(before);
  const delta = {};
  Object.keys(totals).forEach((k) => { delta[k] = prev[k] ? (totals[k] - prev[k]) / prev[k] : null; });
  return { series, totals, prev, delta };
}
/** Best sellers: [{ product, units, revenue }] for a maison (or the Palace) over `days`. */
export function topProducts(shopId = null, days = 30, limit = 5) {
  const since = Date.now() - days * DAY; const map = new Map();
  db.orders.forEach((o) => { if (o.createdAt < since) return; o.parcels.forEach((p) => { if (shopId && p.shopId !== shopId) return; if (p.status === 'refunded') return; p.items.forEach((it) => { const m = map.get(it.productId) || { units: 0, revenue: 0 }; m.units += it.qty; m.revenue += it.qty * it.price; map.set(it.productId, m); }); }); });
  return [...map.entries()].map(([id, m]) => ({ product: getProduct(id), ...m })).filter((x) => x.product).sort((a, b) => b.revenue - a.revenue).slice(0, limit);
}
/** Per-maison league table for the Keeper: [{ shop, revenue, fees, orders, visits, conversion }] */
export function shopLeague(days = 30) {
  return db.shops.map((shop) => {
    const m = metrics(shop.id, days).totals; let fees = 0;
    const since = Date.now() - days * DAY;
    listParcels({ shopId: shop.id }).forEach(({ order, parcel }) => { if (order.createdAt >= since && parcel.status !== 'refunded') fees += parcel.fee; });
    return { shop, revenue: m.revenue, fees, orders: m.orders, visits: m.visits, conversion: m.conversion };
  }).sort((a, b) => b.revenue - a.revenue);
}

/* ----------------------------------------------------------- applications */
export function listApplications(status) { return db.applications.filter((a) => !status || a.status === status).sort((a, b) => b.createdAt - a.createdAt); }
export function submitApplication(data) {
  const app = { id: uid('app'), status: 'pending', createdAt: Date.now(), userId: currentUser()?.id || null, ...data };
  db.applications.unshift(app);
  pushNote('admin', 'application', `${app.maisonName} has applied for residency`, 'A new maison is awaiting your review.', '/keeper/applications');
  commit(); return app;
}
/**
 * decision: 'approved' | 'declined'. Approval opens the maison: creates the shop,
 * and gives the applicant a vendor account (password "flame" in the preview).
 */
export function decideApplication(id, decision, note = '') {
  const app = db.applications.find((a) => a.id === id); if (!app || app.status !== 'pending') return null;
  app.status = decision; app.decidedAt = Date.now(); app.note = note;
  if (decision === 'approved') {
    let owner = (app.userId && getUser(app.userId)) || db.users.find((u) => u.email.toLowerCase() === app.email.toLowerCase());
    if (!owner) { owner = { id: uid('u'), name: app.name, email: app.email, password: 'flame', createdAt: Date.now(), wishlist: [], following: [] }; db.users.push(owner); }
    let slug = slugify(app.maisonName); if (getShop(slug)) slug += `-${Math.floor(Math.random() * 90 + 10)}`;
    const shop = {
      id: uid('shop'), slug, name: app.maisonName, ownerId: owner.id, status: 'live', tagline: app.specialties || '', location: app.location || '',
      founded: new Date().getFullYear(), story: app.story || '', theme: 'obsidian', accent: '#c9a35c', heroStyle: 'centered', font: 'classic',
      monogram: app.maisonName.replace(/^(maison|atelier|the)\s+/i, '')[0]?.toUpperCase() || 'M', banner: ['#1a1410', '#0b0a09'],
      feeOverride: null, rating: 5, createdAt: Date.now(), announcement: '',
      policies: {
        shipping: 'Orders are prepared within two working days and travel by insured courier. Delivery is complimentary on every Palace order.',
        returns: 'Unlit candles may be returned within 30 days for a full refund.',
        gifting: 'Every order can be gift-wrapped with a handwritten note at no charge.',
      },
      payoutMethod: { type: 'bank', label: 'Not yet connected' },
      frontDesk: { enabled: true, name: 'Lumi', tone: 'warm', greeting: `Welcome to ${app.maisonName}. How may I help you today?`, knowledge: [], unanswered: [], handoffEmail: owner.email },
    };
    db.shops.push(shop); db.stats[shop.id] = {};
    owner.role = 'vendor'; owner.shopId = shop.id; app.shopId = shop.id;
    pushNote(shop.id, 'welcome', 'Welcome to the Palace', 'Your maison is open. Begin by dressing your storefront and adding your first candle.', '/atelier/storefront');
  }
  commit(); return app;
}

/* ---------------------------------------------------------- notifications */
function pushNote(target, kind, title, body, link) { db.notifications.unshift({ id: uid('n'), target, kind, title, body, at: Date.now(), read: false, link }); if (db.notifications.length > 200) db.notifications.length = 200; }
/** target: a shop id, or 'admin'. kind is a free label ('order' | 'desk' | 'stock' | 'payout' | 'application' | …). */
export function notify(target, { kind = 'note', title, body = '', link = '' }) { pushNote(target, kind, title, body, link); commit(); }
export function listNotifications(target, { unreadOnly = false } = {}) { return db.notifications.filter((n) => n.target === target && (!unreadOnly || !n.read)); }
export function markNotificationsRead(target) { db.notifications.forEach((n) => { if (n.target === target) n.read = true; }); commit(); }

/* ---------------------------------------------------- wishlist and follows */
export function toggleWish(productId) {
  const u = currentUser(); if (!u) return null;
  const i = u.wishlist.indexOf(productId);
  if (i >= 0) u.wishlist.splice(i, 1); else { u.wishlist.push(productId); const p = getProduct(productId); if (p) track('wish', { shopId: p.shopId, productId }); }
  commit(); return i < 0;
}
export function isWished(productId) { return !!currentUser()?.wishlist.includes(productId); }
export function toggleFollow(shopId) {
  const u = currentUser(); if (!u) return null;
  const i = u.following.indexOf(shopId);
  if (i >= 0) u.following.splice(i, 1); else { u.following.push(shopId); track('follow', { shopId }); }
  commit(); return i < 0;
}
export function isFollowing(shopId) { return !!currentUser()?.following.includes(shopId); }
export function followerCount(shopId) { return db.users.filter((u) => u.following?.includes(shopId)).length; }

/* ----------------------------------------------------------------- reviews */
export function listReviews({ productId, shopId } = {}) { return db.reviews.filter((r) => (!productId || r.productId === productId) && (!shopId || r.shopId === shopId)).sort((a, b) => b.at - a.at); }
export function addReview({ productId, rating, text }) {
  const p = getProduct(productId); const u = currentUser(); if (!p) return null;
  const rv = { id: uid('r'), productId, shopId: p.shopId, userName: u ? u.name.replace(/(\S+)\s+(\S).*/, '$1 $2.') : 'A patron', rating, text, at: Date.now() };
  db.reviews.unshift(rv); commit(); return rv;
}
export function ratingFor(productId) {
  const list = listReviews({ productId });
  return { count: list.length, average: list.length ? list.reduce((s, r) => s + r.rating, 0) / list.length : 0 };
}

/* ----------------------------------------------- front desk conversations */
// The conversational logic lives in agent.js; the store only keeps the records.
export function listConversations({ shopId } = {}) { return db.conversations.filter((c) => !shopId || c.shopId === shopId).sort((a, b) => b.updatedAt - a.updatedAt); }
export function getConversation(id) { return db.conversations.find((c) => c.id === id) || null; }
export function startConversation(shopId, visitor) {
  const shop = getShop(shopId); const now = Date.now();
  const c = { id: uid('c'), shopId, visitor: visitor || currentUser()?.name || 'A guest', startedAt: now, updatedAt: now, resolved: true, messages: [{ from: 'desk', text: shop.frontDesk.greeting, at: now }] };
  db.conversations.unshift(c); persist(); return c;
}
export function appendMessage(conversationId, message, { resolved } = {}) {
  const c = getConversation(conversationId); if (!c) return null;
  c.messages.push({ at: Date.now(), ...message }); c.updatedAt = Date.now();
  if (resolved != null) c.resolved = resolved;
  persist(); return c;
}
/** Persist a change the caller made directly to a shop.frontDesk object, and notify. */
export function saveFrontDesk(shopId, patch = {}) { const s = getShop(shopId); if (!s) return null; Object.assign(s.frontDesk, patch); commit(); return s.frontDesk; }

export { DAY, dayKey, clone, slugify };
