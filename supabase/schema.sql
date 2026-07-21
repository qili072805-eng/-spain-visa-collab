create extension if not exists "uuid-ossp";

create table if not exists tasks(
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  module text,
  owner text,
  priority text default '中',
  due_date date,
  status text default '未开始',
  notes text,
  sort_order int default 0,
  created_at timestamptz default now()
);

create table if not exists documents(
  id uuid primary key default uuid_generate_v4(),
  category text,
  requirement text not null,
  person_a_status text default '',
  person_b_status text default '',
  shared text default '否',
  due_date date,
  status text default '未开始',
  notes text,
  source_url text,
  sort_order int default 0,
  created_at timestamptz default now()
);

create table if not exists itinerary(
  id uuid primary key default uuid_generate_v4(),
  date date,
  route text,
  transport text,
  activities text,
  accommodation text,
  visa_note text,
  status text default '未开始',
  sort_order int default 0,
  created_at timestamptz default now()
);

create table if not exists expenses(
  id uuid primary key default uuid_generate_v4(),
  date date,
  category text,
  item text,
  payer text,
  amount numeric default 0,
  currency text default 'CNY',
  payment_status text default '未付',
  notes text,
  sort_order int default 0,
  created_at timestamptz default now()
);

alter table tasks enable row level security;
alter table documents enable row level security;
alter table itinerary enable row level security;
alter table expenses enable row level security;

create policy "authenticated all tasks" on tasks for all to authenticated using (true) with check (true);
create policy "authenticated all documents" on documents for all to authenticated using (true) with check (true);
create policy "authenticated all itinerary" on itinerary for all to authenticated using (true) with check (true);
create policy "authenticated all expenses" on expenses for all to authenticated using (true) with check (true);
