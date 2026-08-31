-- AURIQ Phase 1 schema draft.
-- Apply to project zmywolaaiuqfyxppbjxh after the correct Supabase connection is available.
-- Browser access is user-scoped. Connector writes must use a server-only secret key.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  timezone text not null default 'Asia/Bangkok',
  preferred_locale text not null default 'th' check (preferred_locale in ('th', 'en')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles add column if not exists preferred_locale text not null default 'th';

create table if not exists public.broker_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  broker text not null default 'IBKR' check (broker = 'IBKR'),
  environment text not null default 'paper' check (environment in ('paper', 'live')),
  mode text not null default 'read_only' check (mode = 'read_only'),
  status text not null default 'offline' check (status in ('offline', 'connecting', 'online', 'stale', 'error')),
  connector_label text not null,
  last_heartbeat_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, connector_label)
);

create table if not exists public.broker_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  connection_id uuid not null references public.broker_connections(id) on delete cascade,
  broker_account_id text not null,
  display_name text,
  base_currency text not null default 'USD',
  account_type text not null default 'paper' check (account_type in ('paper', 'live')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (connection_id, broker_account_id)
);

create table if not exists public.portfolio_snapshots (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  account_id uuid not null references public.broker_accounts(id) on delete cascade,
  net_liquidation numeric(20, 4),
  cash_balance numeric(20, 4),
  buying_power numeric(20, 4),
  margin_used numeric(20, 4),
  realized_pnl numeric(20, 4),
  unrealized_pnl numeric(20, 4),
  drawdown_pct numeric(9, 4),
  source_timestamp timestamptz not null,
  received_at timestamptz not null default now(),
  raw_payload jsonb
);

create table if not exists public.ibkr_positions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  account_id uuid not null references public.broker_accounts(id) on delete cascade,
  broker_position_key text not null,
  symbol text not null,
  asset_class text not null,
  currency text not null default 'USD',
  quantity numeric(20, 8) not null,
  average_cost numeric(20, 8),
  market_price numeric(20, 8),
  market_value numeric(20, 4),
  realized_pnl numeric(20, 4),
  unrealized_pnl numeric(20, 4),
  source_timestamp timestamptz not null,
  received_at timestamptz not null default now(),
  unique (account_id, broker_position_key)
);

create table if not exists public.ibkr_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  account_id uuid not null references public.broker_accounts(id) on delete cascade,
  broker_order_id text not null,
  symbol text not null,
  side text not null check (side in ('BUY', 'SELL')),
  order_type text not null,
  quantity numeric(20, 8) not null,
  limit_price numeric(20, 8),
  stop_price numeric(20, 8),
  status text not null,
  submitted_at timestamptz,
  source_timestamp timestamptz not null,
  received_at timestamptz not null default now(),
  unique (account_id, broker_order_id)
);

create table if not exists public.ibkr_executions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  account_id uuid not null references public.broker_accounts(id) on delete cascade,
  order_id uuid references public.ibkr_orders(id) on delete set null,
  broker_execution_id text not null,
  symbol text not null,
  side text not null check (side in ('BUY', 'SELL')),
  quantity numeric(20, 8) not null,
  price numeric(20, 8) not null,
  commission numeric(20, 4),
  realized_pnl numeric(20, 4),
  executed_at timestamptz not null,
  received_at timestamptz not null default now(),
  unique (account_id, broker_execution_id)
);

create table if not exists public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  execution_id uuid references public.ibkr_executions(id) on delete set null,
  title text not null,
  thesis text,
  setup text,
  emotion text,
  mistakes text,
  review text,
  discipline_score smallint check (discipline_score between 1 and 10),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.news_items (
  id uuid primary key default gen_random_uuid(),
  source_name text not null,
  source_url text not null,
  canonical_url text not null,
  headline text not null,
  summary text,
  published_at timestamptz not null,
  fingerprint text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.news_analyses (
  id uuid primary key default gen_random_uuid(),
  news_item_id uuid not null references public.news_items(id) on delete cascade,
  gold_impact text not null check (gold_impact in ('positive', 'negative', 'neutral', 'mixed')),
  confidence smallint not null check (confidence between 0 and 100),
  short_term_reason text not null,
  medium_term_reason text,
  model text not null,
  prompt_version text not null,
  analyzed_at timestamptz not null default now(),
  unique (news_item_id, prompt_version)
);

create table if not exists public.alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category text not null,
  severity text not null check (severity in ('info', 'warning', 'critical')),
  title text not null,
  message text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.notification_channels (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  channel_type text not null check (channel_type in ('in_app', 'line', 'email', 'discord')),
  enabled boolean not null default false,
  destination_hint text,
  preferences jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, channel_type)
);

create table if not exists public.auriq_audit_logs (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists portfolio_snapshots_account_time_idx on public.portfolio_snapshots (account_id, source_timestamp desc);
create index if not exists portfolio_snapshots_user_idx on public.portfolio_snapshots (user_id);
create index if not exists broker_accounts_user_idx on public.broker_accounts (user_id);
create index if not exists ibkr_positions_user_account_idx on public.ibkr_positions (user_id, account_id);
create index if not exists ibkr_orders_user_account_time_idx on public.ibkr_orders (user_id, account_id, source_timestamp desc);
create index if not exists ibkr_executions_user_time_idx on public.ibkr_executions (user_id, executed_at desc);
create index if not exists ibkr_executions_order_idx on public.ibkr_executions (order_id) where order_id is not null;
create index if not exists journal_entries_user_time_idx on public.journal_entries (user_id, created_at desc);
create index if not exists journal_entries_execution_idx on public.journal_entries (execution_id) where execution_id is not null;
create index if not exists news_items_published_idx on public.news_items (published_at desc);
create index if not exists alerts_user_unread_idx on public.alerts (user_id, created_at desc) where read_at is null;
create index if not exists auriq_audit_logs_user_time_idx on public.auriq_audit_logs (user_id, created_at desc);

alter table public.profiles enable row level security;
alter table public.broker_connections enable row level security;
alter table public.broker_accounts enable row level security;
alter table public.portfolio_snapshots enable row level security;
alter table public.ibkr_positions enable row level security;
alter table public.ibkr_orders enable row level security;
alter table public.ibkr_executions enable row level security;
alter table public.journal_entries enable row level security;
alter table public.news_items enable row level security;
alter table public.news_analyses enable row level security;
alter table public.alerts enable row level security;
alter table public.notification_channels enable row level security;
alter table public.auriq_audit_logs enable row level security;

revoke all on public.broker_connections, public.broker_accounts, public.portfolio_snapshots,
  public.ibkr_positions, public.ibkr_orders, public.ibkr_executions, public.journal_entries,
  public.news_items, public.news_analyses, public.alerts, public.notification_channels,
  public.auriq_audit_logs from anon;
grant usage on schema public to authenticated;
grant select on public.profiles, public.broker_connections, public.broker_accounts,
  public.portfolio_snapshots, public.ibkr_positions, public.ibkr_orders, public.ibkr_executions,
  public.news_items, public.news_analyses, public.alerts, public.auriq_audit_logs to authenticated;
grant select, insert, update, delete on public.journal_entries, public.notification_channels to authenticated;
grant insert (id, display_name, timezone, preferred_locale) on public.profiles to authenticated;
grant update (display_name, timezone, preferred_locale, updated_at) on public.profiles to authenticated;
grant update (read_at) on public.alerts to authenticated;
grant all on public.broker_connections, public.broker_accounts, public.portfolio_snapshots,
  public.ibkr_positions, public.ibkr_orders, public.ibkr_executions, public.journal_entries,
  public.news_items, public.news_analyses, public.alerts, public.notification_channels,
  public.auriq_audit_logs to service_role;
grant usage, select on sequence public.portfolio_snapshots_id_seq, public.auriq_audit_logs_id_seq to service_role;

create policy broker_connections_select_own on public.broker_connections for select to authenticated using ((select auth.uid()) = user_id);
create policy broker_accounts_select_own on public.broker_accounts for select to authenticated using ((select auth.uid()) = user_id);
create policy portfolio_snapshots_select_own on public.portfolio_snapshots for select to authenticated using ((select auth.uid()) = user_id);
create policy ibkr_positions_select_own on public.ibkr_positions for select to authenticated using ((select auth.uid()) = user_id);
create policy ibkr_orders_select_own on public.ibkr_orders for select to authenticated using ((select auth.uid()) = user_id);
create policy ibkr_executions_select_own on public.ibkr_executions for select to authenticated using ((select auth.uid()) = user_id);
create policy journal_entries_manage_own on public.journal_entries for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy news_items_read_authenticated on public.news_items for select to authenticated using (true);
create policy news_analyses_read_authenticated on public.news_analyses for select to authenticated using (true);
create policy alerts_select_own on public.alerts for select to authenticated using ((select auth.uid()) = user_id);
create policy alerts_update_own on public.alerts for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy notification_channels_manage_own on public.notification_channels for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy auriq_audit_logs_select_own on public.auriq_audit_logs for select to authenticated using ((select auth.uid()) = user_id);

-- Realtime is opt-in. Do not alter the locked realtime schema.
alter publication supabase_realtime add table public.portfolio_snapshots, public.ibkr_positions, public.ibkr_orders, public.alerts;

-- ---------------------------------------------------------------------------
-- News analysis runs — one row per "ส่งวิเคราะห์ข่าว" request.
-- Mirrors src/lib/news/analysis-types.ts (AnalysisRunRecord). Not yet wired to
-- Lovable Cloud: the app currently persists runs in the browser.
-- ---------------------------------------------------------------------------
create table if not exists public.news_analysis_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  selected_event_ids text[] not null default '{}',
  event_snapshot jsonb not null,
  analysis_result jsonb,
  model_name text not null,
  sources text[] not null default '{}',
  requested_at timestamptz not null default now(),
  completed_at timestamptz,
  status text not null default 'pending' check (status in ('pending','completed','failed'))
);

grant select, insert, update, delete on public.news_analysis_runs to authenticated;
grant all on public.news_analysis_runs to service_role;

alter table public.news_analysis_runs enable row level security;

create policy "Users read their own analysis runs"
  on public.news_analysis_runs for select
  to authenticated using (auth.uid() = user_id);

create policy "Users create their own analysis runs"
  on public.news_analysis_runs for insert
  to authenticated with check (auth.uid() = user_id);

create policy "Users update their own analysis runs"
  on public.news_analysis_runs for update
  to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists news_analysis_runs_user_requested_idx
  on public.news_analysis_runs (user_id, requested_at desc);
