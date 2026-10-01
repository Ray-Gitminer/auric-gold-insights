-- MT5 read-only portfolio ingestion for AURIQ.
-- No trade command grants or browser-side writes are introduced here.

create table if not exists public.connector_agents (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  machine_label text,
  platform text not null default 'windows',
  status text not null default 'offline' check (status in ('offline','online','stale','error')),
  version text,
  capabilities jsonb not null default '{}'::jsonb,
  secret_ref text,
  last_seen_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, name)
);

create table if not exists public.mt5_accounts (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  connector_agent_id bigint references public.connector_agents(id) on delete set null,
  broker text not null,
  server text not null,
  login text not null,
  display_name text not null,
  currency text not null default 'USD',
  account_type text,
  status text not null default 'disconnected',
  auto_trade_enabled boolean not null default false check (auto_trade_enabled = false),
  magic_number bigint,
  terminal_path_hint text,
  risk_settings jsonb not null default '{}'::jsonb,
  last_sync_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, server, login)
);

alter table public.mt5_accounts add column if not exists account_type text;

create table if not exists public.account_snapshots (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  account_id bigint not null references public.mt5_accounts(id) on delete cascade,
  balance numeric(20,4) not null,
  equity numeric(20,4) not null,
  floating_pnl numeric(20,4) not null default 0,
  drawdown_pct numeric(9,4) not null default 0,
  margin numeric(20,4),
  free_margin numeric(20,4),
  margin_level numeric(20,4),
  buy_count integer not null default 0,
  buy_lots numeric(20,4) not null default 0,
  buy_pnl numeric(20,4) not null default 0,
  sell_count integer not null default 0,
  sell_lots numeric(20,4) not null default 0,
  sell_pnl numeric(20,4) not null default 0,
  captured_at timestamptz not null default now()
);

create table if not exists public.positions (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  account_id bigint not null references public.mt5_accounts(id) on delete cascade,
  ticket bigint not null,
  symbol text not null,
  side text not null check (side in ('BUY','SELL')),
  volume numeric(20,8) not null,
  open_price numeric(20,8) not null,
  current_price numeric(20,8) not null,
  stop_loss numeric(20,8),
  take_profit numeric(20,8),
  profit numeric(20,4) not null default 0,
  swap numeric(20,4) not null default 0,
  commission numeric(20,4) not null default 0,
  magic_number bigint,
  opened_at timestamptz not null,
  observed_at timestamptz not null default now(),
  unique (account_id, ticket)
);

create table if not exists public.deals (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  account_id bigint not null references public.mt5_accounts(id) on delete cascade,
  ticket bigint not null,
  position_ticket bigint,
  symbol text not null,
  side text not null check (side in ('BUY','SELL')),
  entry_type text not null,
  volume numeric(20,8) not null,
  price numeric(20,8) not null,
  profit numeric(20,4) not null default 0,
  commission numeric(20,4) not null default 0,
  swap numeric(20,4) not null default 0,
  magic_number bigint,
  executed_at timestamptz not null,
  unique (account_id, ticket)
);

create table if not exists public.mt5_candles (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  account_id bigint not null references public.mt5_accounts(id) on delete cascade,
  symbol text not null,
  timeframe text not null check (timeframe in ('M1','M5','M15','M30','H1','H4','D1')),
  open_time timestamptz not null,
  open numeric(20,8) not null,
  high numeric(20,8) not null,
  low numeric(20,8) not null,
  close numeric(20,8) not null,
  tick_volume bigint not null default 0,
  spread integer not null default 0,
  unique (account_id,symbol,timeframe,open_time)
);

create index if not exists account_snapshots_account_time_idx on public.account_snapshots(account_id, captured_at desc);
create unique index if not exists connector_agents_user_name_uidx on public.connector_agents(user_id, name);
create unique index if not exists mt5_accounts_user_server_login_uidx on public.mt5_accounts(user_id, server, login);
create unique index if not exists positions_account_ticket_uidx on public.positions(account_id, ticket);
create unique index if not exists deals_account_ticket_uidx on public.deals(account_id, ticket);
create index if not exists positions_user_account_idx on public.positions(user_id, account_id);
create index if not exists deals_user_time_idx on public.deals(user_id, executed_at desc);
create index if not exists mt5_candles_lookup_idx on public.mt5_candles(account_id, symbol, timeframe,open_time desc);

alter table public.connector_agents enable row level security;
alter table public.mt5_accounts enable row level security;
alter table public.account_snapshots enable row level security;
alter table public.positions enable row level security;
alter table public.deals enable row level security;
alter table public.mt5_candles enable row level security;

revoke all on public.connector_agents, public.mt5_accounts, public.account_snapshots,
  public.positions, public.deals, public.mt5_candles from anon, authenticated;
grant select on public.connector_agents, public.mt5_accounts, public.account_snapshots,
  public.positions, public.deals, public.mt5_candles to authenticated;
grant all on public.connector_agents, public.mt5_accounts, public.account_snapshots,
  public.positions, public.deals, public.mt5_candles to service_role;
grant usage, select on all sequences in schema public to service_role;

drop policy if exists connector_agents_select_own on public.connector_agents;
create policy connector_agents_select_own on public.connector_agents for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists mt5_accounts_select_own on public.mt5_accounts;
create policy mt5_accounts_select_own on public.mt5_accounts for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists account_snapshots_select_own on public.account_snapshots;
create policy account_snapshots_select_own on public.account_snapshots for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists positions_select_own on public.positions;
create policy positions_select_own on public.positions for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists deals_select_own on public.deals;
create policy deals_select_own on public.deals for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists mt5_candles_select_own on public.mt5_candles;
create policy mt5_candles_select_own on public.mt5_candles for select to authenticated using ((select auth.uid()) = user_id);

-- Realtime publication is managed defensively because a table may already be present.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'account_snapshots'
  ) then alter publication supabase_realtime add table public.account_snapshots; end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'positions'
  ) then alter publication supabase_realtime add table public.positions; end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'mt5_candles'
  ) then alter publication supabase_realtime add table public.mt5_candles; end if;
end $$;