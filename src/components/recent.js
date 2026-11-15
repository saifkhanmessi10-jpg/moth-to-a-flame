// "Recently viewed" — a per-viewer convenience kept in this browser only.
import * as store from '../store.js';

const KEY = 'mtaf.recent';
function read() { try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; } }

export function rememberViewed(productId) {
  try { localStorage.setItem(KEY, JSON.stringify([productId, ...read().filter((id) => id !== productId)].slice(0, 12))); } catch { /* storage unavailable */ }
}
/** Public products this viewer looked at, newest first. */
export function recentlyViewed(limit = 8, { exclude } = {}) {
  return read().filter((id) => id !== exclude).map((id) => store.getProduct(id))
    .filter((p) => p && p.status === 'live' && store.getShop(p.shopId)?.status === 'live').slice(0, limit);
}
