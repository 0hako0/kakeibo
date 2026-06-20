create extension if not exists pgcrypto;

create type monthly_row_type as enum (
  'income',
  'income_deduction',
  'fixed_expense',
  'card_payment',
  'investment',
  'other_expense'
);

create type card_detail_category as enum (
  'food',
  'daily_goods',
  'dining',
  'cat_goods',
  'gasoline',
  'medical',
  'entertainment',
  'communication',
  'other'
);

create type burden_type as enum (
  'household',
  'husband',
  'wife',
  'household_advanced_by_husband',
  'household_advanced_by_wife'
);

create table monthly_sheets (
  id uuid primary key default gen_random_uuid(),
  year_month text not null unique check (year_month ~ '^[0-9]{4}-[0-9]{2}$'),
  previous_month_balance integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table payment_sources (
  id uuid primary key default gen_random_uuid(),
  sheet_id uuid not null references monthly_sheets(id) on delete cascade,
  name text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table monthly_rows (
  id uuid primary key default gen_random_uuid(),
  sheet_id uuid not null references monthly_sheets(id) on delete cascade,
  type monthly_row_type not null,
  item text not null default '',
  amount integer not null default 0,
  payment_source_id uuid not null references payment_sources(id),
  burden_type burden_type not null default 'household',
  memo text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table card_details (
  id uuid primary key default gen_random_uuid(),
  monthly_row_id uuid not null references monthly_rows(id) on delete cascade,
  category card_detail_category not null default 'other',
  amount integer not null default 0,
  memo text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index payment_sources_sheet_id_sort_order_idx on payment_sources(sheet_id, sort_order);
create index monthly_rows_sheet_id_sort_order_idx on monthly_rows(sheet_id, sort_order);
create index monthly_rows_payment_source_id_idx on monthly_rows(payment_source_id);
create index card_details_monthly_row_id_sort_order_idx on card_details(monthly_row_id, sort_order);

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger monthly_sheets_set_updated_at
before update on monthly_sheets
for each row execute function set_updated_at();

create trigger monthly_rows_set_updated_at
before update on monthly_rows
for each row execute function set_updated_at();

create trigger payment_sources_set_updated_at
before update on payment_sources
for each row execute function set_updated_at();

create trigger card_details_set_updated_at
before update on card_details
for each row execute function set_updated_at();
