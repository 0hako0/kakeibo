create table monthly_sheets (
  year_month text primary key check (year_month ~ '^[0-9]{4}-[0-9]{2}$'),
  data jsonb not null,
  updated_at timestamptz not null default now()
);
