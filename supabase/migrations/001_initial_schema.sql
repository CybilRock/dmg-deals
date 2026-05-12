-- DMG Deal Desk — Initial Schema
-- Run this in your Supabase SQL editor

-- People: consultants and bookers
create table people (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz default now(),
  name        text not null,
  role        text not null check (role in ('consultant', 'booker', 'both')),
  email       text,
  phone       text,
  active      boolean default true
);

-- Deals: every DVC or HolidayCorp sale
create table deals (
  id                  uuid primary key default gen_random_uuid(),
  created_at          timestamptz default now(),
  deal_date           date not null default current_date,

  -- Client
  client_name         text not null,
  client_phone        text,
  client_email        text,

  -- Source
  source_brand        text not null check (source_brand in (
                        'Doctor Travel', 'Advocate Travel', 'Holiday Brokers',
                        'Online', 'Referral', 'Walk-in')),
  product             text not null check (product in ('DVC', 'HolidayCorp')),

  -- Deal structure
  points              numeric not null,
  deposit_type        text not null check (deposit_type in (
                        '10pct', '25to49pct', '50pct', 'no_deposit',
                        'self_generated', 'upgrade')),
  self_generated      boolean default false,

  -- DMG income from DHR (all in ZAR)
  deal_value          numeric not null,   -- points × R20
  dmg_rate            numeric not null,   -- e.g. 0.45
  commission          numeric not null,   -- deal_value × dmg_rate
  retention_rate      numeric not null,   -- 0.10 or 0.15
  retention           numeric not null,   -- commission × retention_rate
  dmg_receives        numeric not null,   -- commission − retention
  vat                 numeric not null,   -- dmg_receives × 15/115
  net_excl_vat        numeric not null,   -- dmg_receives − vat

  -- Contractor payouts (base: points × R15.50)
  contractor_base     numeric not null,
  consultant_id       uuid references people(id),
  consultant_rate     numeric,
  consultant_payout   numeric,
  booker_id           uuid references people(id),
  booker_rate         numeric,
  booker_payout       numeric,
  dmg_net             numeric not null,   -- net_excl_vat − consultant_payout − booker_payout

  -- Lifecycle
  status              text default 'active' check (status in (
                        'active', 'cancelled', 'clawback', 'paid')),
  fica_checked        boolean default false,
  drip_deal           boolean default false,  -- no-deposit finance deals
  notes               text
);

-- Leads: pipeline from all channels
create table leads (
  id                  uuid primary key default gen_random_uuid(),
  created_at          timestamptz default now(),

  -- Contact
  name                text not null,
  phone               text,
  email               text,

  -- Source
  source_brand        text check (source_brand in (
                        'Doctor Travel', 'Advocate Travel', 'Holiday Brokers', 'Online')),
  source_channel      text check (source_channel in (
                        'meta_ad', 'tiktok_ad', 'referral', 'walk_in', 'cold_call', 'other')),
  external_lead_id    text unique,  -- dedup: raw for Meta, 'tiktok_{id}' for TikTok

  -- Pipeline
  status              text default 'new' check (status in (
                        'new', 'contacted', 'qualified', 'appointment',
                        'presented', 'closed_won', 'closed_lost')),
  assigned_to         uuid references people(id),
  appointment_at      timestamptz,
  deal_id             uuid references deals(id),  -- set when lead converts to deal

  notes               text
);

-- Payout runs: Friday DHR settlements + 7th contractor runs
create table payout_runs (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz default now(),
  run_date      date not null,
  run_type      text not null check (run_type in ('friday_dhr', 'seventh_contractor')),
  total_amount  numeric not null default 0,
  status        text default 'pending' check (status in ('pending', 'paid')),
  notes         text
);

-- DHR debt ledger: track the running balance deal by deal
create table dhr_debt_ledger (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz default now(),
  deal_id       uuid references deals(id),
  entry_type    text not null check (entry_type in ('retention_added', 'debt_repaid', 'opening_balance')),
  amount        numeric not null,  -- positive = debt increases, negative = debt reduces
  notes         text
);

-- Indexes
create index on deals(deal_date desc);
create index on deals(status);
create index on deals(source_brand);
create index on leads(status);
create index on leads(source_brand);
create index on leads(assigned_to);
create index on leads(external_lead_id);
