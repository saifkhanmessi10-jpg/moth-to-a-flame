-- Moth Market Palace — production schema (PostgreSQL / Supabase).
-- Mirrors the shapes used by src/store.js so the preview data layer can be
-- re-implemented against it one function at a time. Money is integer cents.

create type user_role      as enum ('patron', 'vendor', 'admin');
create type shop_status    as enum ('live', 'paused', 'suspended');
create type product_status as enum ('live', 'draft');
create type parcel_status  as enum ('placed', 'preparing', 'shipped', 'delivered', 'refunded');
create type payout_status  as enum ('requested', 'paid');
create type app_status     as enum ('pending', 'approved', 'declined');

create table profiles (
  id          uuid primary key references auth.users on delete cascade,
  name        text not null,
  email       text not null unique,
  role        user_role not null default 'patron',
  address     jsonb,
  created_at  timestamptz not null default now()
);

create table shops (
  id            uuid primary key default gen_random_uuid(),
  owner_id      uuid not null references profiles,
  slug          text not null unique,
  name          text not null,
  status        shop_status not null default 'live',
  is_flagship   boolean not null default false,
  tagline       text, story text, location text, founded int,
  -- storefront dressing
  theme         text not null default 'obsidian',
  accent        text not null default '#c9a35c',
  hero_style    text not null default 'centered',
  font          text not null default 'classic',
  monogram      text, banner text[2], hero_image text, announcement text,
  policies      jsonb not null default '{}',
  fee_override  numeric(5,4) check (fee_override between 0 and 0.5),  -- null → Palace rate
  payout_account text,           -- payment-provider connected account id
  created_at    timestamptz not null default now()
);

create table products (
  id          uuid primary key default gen_random_uuid(),
  shop_id     uuid not null references shops on delete cascade,
  name        text not null,
  collection  text, category text,
  price       int not null check (price >= 0),
  stock       int not null default 0 check (stock >= 0),
  status      product_status not null default 'live',
  notes       jsonb not null default '{}',     -- { top, heart, base }
  burn_time   int, weight text, description text,
  tags        text[] not null default '{}',
  image       text, vessel jsonb,
  created_at  timestamptz not null default now()
);
create index on products (shop_id, status);

create table orders (
  id          uuid primary key default gen_random_uuid(),
  number      text not null unique,
  user_id     uuid references profiles,          -- null for guest checkout
  customer    text not null, email text not null,
  shipping    jsonb not null, gift_note text,
  subtotal    int not null, total int not null,
  payment_ref text,                              -- payment-provider reference
  created_at  timestamptz not null default now()
);

-- One parcel per maison per order. The fee rate is frozen here at checkout.
create table parcels (
  id          uuid primary key default gen_random_uuid(),
  order_id    uuid not null references orders on delete cascade,
  shop_id     uuid not null references shops,
  subtotal    int not null,
  fee_rate    numeric(5,4) not null,
  fee         int not null,                      -- round(subtotal * fee_rate)
  net         int not null,                      -- subtotal - fee
  status      parcel_status not null default 'placed',
  tracking    text,
  payout_id   uuid,
  unique (order_id, shop_id)
);
create index on parcels (shop_id, status);

create table parcel_items (
  parcel_id   uuid not null references parcels on delete cascade,
  product_id  uuid references products on delete set null,
  name        text not null, price int not null, qty int not null check (qty > 0)
);

create table payouts (
  id            uuid primary key default gen_random_uuid(),
  shop_id       uuid not null references shops,
  amount        int not null,
  status        payout_status not null default 'requested',
  requested_at  timestamptz not null default now(),
  paid_at       timestamptz
);
alter table parcels add foreign key (payout_id) references payouts;

create table applications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references profiles,
  name text not null, email text not null, maison_name text not null,
  location text, website text, specialties text, price_range text, story text,
  status      app_status not null default 'pending',
  note text, shop_id uuid references shops,
  created_at  timestamptz not null default now(), decided_at timestamptz
);

-- Shopper signals. Raw events feed the activity streams; daily_stats is the
-- roll-up the dashboards and the Moth Agent read.
create table events (
  id bigint generated always as identity primary key,
  shop_id uuid not null references shops on delete cascade,
  product_id uuid references products on delete set null,
  type text not null check (type in ('shop_view','product_view','bag_add','chat','order','wish','follow')),
  meta jsonb not null default '{}', at timestamptz not null default now()
);
create index on events (shop_id, at desc);
create table daily_stats (
  shop_id uuid not null references shops on delete cascade, day date not null,
  visits int not null default 0, product_views int not null default 0, bag_adds int not null default 0,
  chats int not null default 0, orders int not null default 0, revenue int not null default 0,
  primary key (shop_id, day)
);

-- AI front desk: one persona, one knowledge base and one teach-inbox per maison.
create table front_desks (
  shop_id uuid primary key references shops on delete cascade,
  enabled boolean not null default true,
  name text not null, tone text not null default 'warm', greeting text, handoff_email text
);
create table desk_knowledge (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references shops on delete cascade,
  question text not null, answer text not null,
  source text not null default 'owner' check (source in ('owner','learned')),
  uses int not null default 0, created_at timestamptz not null default now()
);
create table desk_unanswered (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references shops on delete cascade,
  question text not null, asked_count int not null default 1, last_at timestamptz not null default now()
);
create table conversations (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references shops on delete cascade,
  visitor text, resolved boolean not null default true,
  messages jsonb not null default '[]',
  started_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products on delete cascade,
  user_id uuid references profiles, rating int not null check (rating between 1 and 5),
  body text, created_at timestamptz not null default now()
);
create table wishlists (user_id uuid references profiles on delete cascade, product_id uuid references products on delete cascade, primary key (user_id, product_id));
create table follows   (user_id uuid references profiles on delete cascade, shop_id uuid references shops on delete cascade, primary key (user_id, shop_id));
create table notifications (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid references shops on delete cascade,   -- null → for the Keeper
  kind text, title text not null, body text, link text,
  read boolean not null default false, at timestamptz not null default now()
);
create table palace_settings (
  id boolean primary key default true check (id),     -- single row
  fee_rate numeric(5,4) not null default 0.12,
  announcement text, applications_open boolean not null default true,
  min_payout int not null default 5000, payout_schedule text not null default 'weekly',
  ai_enabled boolean not null default true,
  featured_shop_ids uuid[] not null default '{}', edits jsonb not null default '[]'
);

-- Row-level security (outline). Enable RLS on every table, then:
--   • public read: live shops, live products of live shops, reviews, palace_settings
--   • a vendor reads/writes only rows whose shop_id is a shop they own
--     (products, parcels, parcel_items, payouts, daily_stats, events, front desk tables, conversations)
--   • a patron reads only their own orders, wishlists, follows
--   • admins (profiles.role = 'admin') have full access
--   • fee_rate, fee, net, fee_override and payouts.status are written only by server functions
create or replace function owns_shop(target uuid) returns boolean language sql stable as
$$ select exists (select 1 from shops where id = target and owner_id = auth.uid()) $$;
create or replace function is_admin() returns boolean language sql stable as
$$ select exists (select 1 from profiles where id = auth.uid() and role = 'admin') $$;
