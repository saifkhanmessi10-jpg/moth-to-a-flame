# Architecture

Moth to a Flame is one web app with four wings:

| Wing | Routes | Who | Layout |
| --- | --- | --- | --- |
| The House (brand site) | `/`, `/collections`, `/flame-society`, `/story`, `/contact` | everyone | `site` |
| The Moth Market Palace (marketplace) | `/palace/**`, `/account`, `/signin` | guests and patrons | `palace` |
| The Maison Atelier (vendor dashboard) | `/atelier/**` | resident makers | `vendor` |
| The Keeper's Office (super admin) | `/keeper/**` | Palace staff | `admin` |

Vocabulary used everywhere in the UI: a shop is a **maison**, a buyer is a **patron**, a vendor's
dashboard is the **atelier**, the super admin is the **Keeper**, a cart is a **bag**. Vendors *apply for
residency*; they do not "sign up". Keep the copy quiet, confident and unhurried — no exclamation marks,
no discount language, no urgency gimmicks.

## Stack

Dependency-free static app: native ES modules, a hash router, one design-system stylesheet. No build
step, so GitHub Pages serves the repository as-is.

```
index.html
assets/css/base.css            design tokens + every shared component
assets/css/pages-<wing>.css    styles that belong to one wing only
assets/img/                    brand photography + moth-mark.png (used as a CSS mask)
src/app.js                     router, layouts, role guards, global click handlers, preview switcher
src/store.js                   data layer (the only place that touches storage)
src/seed.js                    seeded preview data
src/agent.js                   frontDesk (guest AI per maison) + mothAgent (owner / Keeper analyst)
src/ui.js                      formatting, icons, candle artwork, charts, toast, modal
src/components/                shared widgets (front desk chat)
src/pages/<wing>/<page>.js     one module per route
docs/schema.sql                production database schema (Postgres / Supabase)
```

## Page contract

```js
import * as store from '../../store.js';
import { esc, money } from '../../ui.js';

export const meta = { title: 'Orders' };          // shown in the tab and the dashboard top bar
export function render(ctx) { return `<section>…</section>`; }   // HTML string
export function mount(root, ctx) { /* attach listeners inside root */ }
```

`ctx = { params, query, path, user, shop, navigate(path), refresh() }`

- `ctx.shop` is the signed-in vendor's maison on `/atelier/**` routes (guaranteed non-null there).
- `ctx.user` is guaranteed to be an admin on `/keeper/**` and non-null on `/account`.
- After changing data call `ctx.refresh()`; it re-renders the current route and keeps scroll position.
- Local UI state that must survive a refresh (active tab, filter) lives in a module-level variable or the query string.
- Dashboard pages return only their content; `app.js` supplies sidebar and the title bar (do not repeat the page title as an `<h1>`).
- Public pages return full-width `<section>`s and use `.container` themselves. Routes flagged `over` in
  `app.js` have a transparent header floating over the first section, so that section needs top padding
  (`padding-top: calc(var(--header-h) + …)`) or a full-height hero.
- Always escape user/seed text with `esc()`.

### Global behaviours (already wired in app.js)

- `<button data-add-to-bag="PRODUCT_ID" data-qty="2">` adds to the bag and shows a toast.
- `<button data-wish="PRODUCT_ID">` toggles the wishlist (prompts guests to sign in).
- `[data-bag-count]` elements are kept up to date.
- Elements with class `reveal` fade in on scroll.
- `mountFrontDesk(shopId)` from `src/components/frontdesk-widget.js` shows a maison's AI front desk.

## Data model (see `src/store.js` JSDoc for the full surface)

Money is always integer cents. Times are epoch milliseconds.

- **user** `{ id, name, email, role: 'patron'|'vendor'|'admin', shopId?, wishlist[], following[], address? }`
- **shop** `{ id, slug, name, ownerId, status: 'live'|'paused'|'suspended', tagline, story, location, founded,
  theme, accent, heroStyle: 'centered'|'split'|'editorial', font: 'classic'|'couture'|'modern', monogram,
  banner: [hex, hex], heroImage?, announcement, policies: { shipping, returns, gifting }, feeOverride: number|null,
  rating, payoutMethod, frontDesk: { enabled, name, tone: 'warm'|'formal'|'poetic', greeting,
  knowledge: [{ id, q, a, source: 'owner'|'learned', uses }], unanswered: [{ id, q, count, lastAt }] } }`
- **product** `{ id, shopId, name, collection, category, price, stock, status: 'live'|'draft', notes: { top, heart, base },
  burnTime, weight, description, tags[], image?, vessel: { shape, body, rim, wax, label, ink } }`
- **order** `{ id, number, userId, customer, email, createdAt, shipping, giftNote, subtotal, total,
  parcels: [{ shopId, items: [{ productId, name, price, qty }], subtotal, feeRate, fee, net, status, tracking, payoutId }] }`
  One order holds one **parcel per maison**; a maison only ever sees its own parcel.
- **payout** `{ id, shopId, amount, parcels, status: 'requested'|'paid', requestedAt, paidAt }`
- **application** `{ id, name, email, maisonName, location, website, specialties, priceRange, story, status, note }`

### Platform fee

`fee = round(parcel.subtotal × feeRateFor(shop))`, `net = subtotal − fee`. The Palace-wide rate is
`settings.feeRate` (12% by default); the Keeper can override it per maison (`shop.feeOverride`). The rate is
frozen onto the parcel at checkout, so later changes never rewrite history.

Parcel lifecycle: `placed → preparing → shipped → delivered` (or `refunded`). Net proceeds become *available*
once shipped; a maison requests a payout, the Keeper settles it.

## AI

- **Front Desk** (`frontDesk` in `agent.js`) — one per maison, with its own name, tone and greeting. It answers
  from the catalogue, the maison's policies and its knowledge base. When it is not confident it says so,
  logs the question to the owner's *teach* inbox and notifies them; the owner's answer becomes knowledge and
  the desk handles that question itself from then on. Usage counts reinforce which answers rank first.
- **Moth Agent** (`mothAgent`) — reads metrics, orders, stock, payouts and desk activity, and produces a
  briefing, ranked insights and plain-language answers for owners (`briefing`, `ask`) and for the Keeper
  (`palaceBriefing`).

In the preview both run on-device (retrieval + rules), so the site needs no keys. For production,
`frontDesk.think()` and `mothAgent.ask()` are the seams: send the same context (catalogue, policies,
knowledge, metrics) to a hosted model from a server function and return the same shapes. The learning loop,
storage and UI stay unchanged.

## Going to production

1. Host the app on any static host; move `store.js` onto a real API (schema in `docs/schema.sql`,
   row-level security so a maison reads only its own parcels, conversations and stats).
2. Payments and the platform fee: a marketplace payment provider with split payouts (for example Stripe
   Connect — destination charges with an application fee equal to the parcel `fee`).
3. Replace the two AI seams with server-side model calls; keep keys off the client.
4. Email (order confirmations, application decisions) and image uploads for vendor product photography.
