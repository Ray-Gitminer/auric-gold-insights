create table if not exists public.economic_events (
  id uuid primary key default gen_random_uuid(),
  external_id text not null,
  provider text not null,
  country text not null default 'US',
  currency text not null default 'USD',
  event_name text not null,
  category text,
  importance smallint not null default 1 check (importance between 1 and 3),
  scheduled_at timestamptz not null,
  actual text,
  forecast text,
  previous text,
  revised text,
  unit text,
  source_name text not null,
  source_url text not null,
  status text not null default 'scheduled' check (status in ('scheduled', 'released', 'revised', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider, external_id)
);

create table if not exists public.economic_event_analyses (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.economic_events(id) on delete cascade,
  gold_impact text not null check (gold_impact in ('positive', 'negative', 'neutral', 'mixed')),
  usd_impact text not null check (usd_impact in ('positive', 'negative', 'neutral', 'mixed')),
  confidence numeric(5,2) check (confidence between 0 and 100),
  reasons jsonb not null default '[]'::jsonb,
  scenario_above jsonb not null default '{}'::jsonb,
  scenario_inline jsonb not null default '{}'::jsonb,
  scenario_below jsonb not null default '{}'::jsonb,
  model text,
  prompt_version text,
  analyzed_at timestamptz not null default now()
);

create table if not exists public.weekly_market_briefs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  week_start date not null,
  title text not null,
  gold_bias text not null check (gold_bias in ('bullish', 'bearish', 'neutral', 'mixed')),
  confidence numeric(5,2) check (confidence between 0 and 100),
  narrative text not null,
  evidence jsonb not null default '[]'::jsonb,
  next_catalyst text,
  risk_note text,
  model text,
  prompt_version text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists economic_events_scheduled_idx on public.economic_events (scheduled_at desc);
create index if not exists economic_events_us_high_idx on public.economic_events (scheduled_at desc) where country = 'US' and importance = 3;
create index if not exists economic_event_analyses_event_idx on public.economic_event_analyses (event_id, analyzed_at desc);
create index if not exists weekly_market_briefs_user_week_idx on public.weekly_market_briefs (user_id, week_start desc);

alter table public.economic_events enable row level security;
alter table public.economic_event_analyses enable row level security;
alter table public.weekly_market_briefs enable row level security;

revoke all on public.economic_events, public.economic_event_analyses, public.weekly_market_briefs from anon;
grant select on public.economic_events, public.economic_event_analyses, public.weekly_market_briefs to authenticated;
grant all on public.economic_events, public.economic_event_analyses, public.weekly_market_briefs to service_role;

create policy economic_events_read_authenticated on public.economic_events for select to authenticated using (true);
create policy economic_event_analyses_read_authenticated on public.economic_event_analyses for select to authenticated using (true);
create policy weekly_market_briefs_select_own on public.weekly_market_briefs for select to authenticated using ((select auth.uid()) = user_id);
