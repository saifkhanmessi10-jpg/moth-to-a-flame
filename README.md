# Moth to a Flame — Luxury Candle Co. & the Moth Market Palace

The brand website for **Moth to a Flame**, with the **Moth Market Palace** behind it: a curated marketplace
where independent candle makers open their own maisons, dress their own storefronts and sell — and the
Palace takes a platform fee on each sale.

**Live preview:** https://saifkhanmessi10-jpg.github.io/moth-to-a-flame/

## The four wings

| Wing | Start here | What it does |
| --- | --- | --- |
| **The House** | `#/` | Brand site: collections, The Flame Society, story, concierge — and the doorway into the Palace |
| **The Palace** | `#/palace` | Marketplace: lobby, maison directory, themed storefronts, product pages, bag, checkout, patron account |
| **Maison Atelier** | `#/atelier` | Vendor dashboard: orders, candles, storefront customiser, AI Front Desk, Moth Agent, analytics, payouts |
| **The Keeper's Office** | `#/keeper` | Super admin: applications, maisons, all orders, platform fee & payouts, patrons, AI oversight, curation |

## Reviewing the preview

Use **Preview as** (lower-left corner) to step into any role without signing in:

| Role | Account | Password |
| --- | --- | --- |
| Patron (shopper) | `celeste@patron.demo` | `flame` |
| Maison owner | `isolde@soleilnoir.demo` — Maison Soleil Noir | `flame` |
| House atelier | `atelier@mothtoaflame.demo` — Moth to a Flame's own shop | `flame` |
| Palace Keeper (super admin) | `keeper@mothtoaflame.demo` | `flame` |

A walk worth taking:

1. As a **guest**: home → *Enter the Palace* → a maison → a candle → ask the front desk a question → bag → checkout.
2. As the **maison owner**: see the order arrive, read the Moth Agent briefing, answer a question in
   *Front Desk AI → Teach*, then ask the same question again on the storefront — the desk now knows it.
   Restyle the storefront and publish.
3. As a **guest**: *Open a Maison* → submit an application.
4. As the **Keeper**: grant the residency, change the Palace fee, settle a payout, feature a maison.

*Reset preview data* in the same menu restores the seeded Palace.

## What is real and what is simulated in this preview

The preview is a static build so it can be reviewed from a link with nothing to install.

- **Real:** every screen, flow and role; the order → parcel-per-maison split; fee and payout arithmetic;
  storefront theming; the front desk's teach-and-learn loop; analytics computed from recorded activity.
- **Simulated:** data is seeded and stored in your browser (each reviewer sees their own copy); no payment
  is taken; no email is sent; the AI assistants run on-device rather than on a hosted language model.
  All maisons other than Moth to a Flame, and all patrons, are fictional.

`docs/ARCHITECTURE.md` describes how the pieces fit and the path to production; `docs/schema.sql` is the
production database schema.

## Run locally

```
node tools/serve.mjs      # http://localhost:4173
```

No dependencies and no build step.
