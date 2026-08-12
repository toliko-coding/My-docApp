-- ============================================================================
-- DocApp initial schema: users, documents, bills, payments, matching,
-- notifications. All user-owned tables carry `user_id` + Row Level Security
-- so one user can never read or write another user's rows.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- updated_at trigger helper
-- ----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ----------------------------------------------------------------------------
-- profiles: 1:1 extension of auth.users
-- ----------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  avatar_url text,
  locale text not null default 'he',
  currency text not null default 'ILS',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Auto-create a profile row whenever a new auth user signs up.
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ----------------------------------------------------------------------------
-- categories: system-seeded + user-defined, so new categories are cheap to add
-- ----------------------------------------------------------------------------
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade, -- null = system category
  key text not null, -- stable slug, e.g. 'electricity'
  name_en text not null,
  name_he text not null,
  icon text, -- icon name for the design system's icon set
  color text, -- optional accent override
  sort_order int not null default 0,
  is_system boolean not null default false,
  created_at timestamptz not null default now(),
  unique (user_id, key)
);

create index categories_user_id_idx on public.categories (user_id);

-- ----------------------------------------------------------------------------
-- providers: generic learned-or-seeded supplier directory (not hardcoded to
-- any fixed list — new providers are inserted the first time they're seen)
-- ----------------------------------------------------------------------------
create table public.providers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade, -- null = shared/system provider
  name text not null,
  normalized_name text not null, -- lowercased, diacritics/whitespace-stripped, for fuzzy matching
  default_category_id uuid references public.categories (id) on delete set null,
  country text default 'IL',
  aliases text[] not null default '{}',
  logo_url text,
  is_system boolean not null default false,
  created_at timestamptz not null default now()
);

create index providers_user_id_idx on public.providers (user_id);
create index providers_normalized_name_idx on public.providers (normalized_name);

-- ----------------------------------------------------------------------------
-- documents: the original uploaded file (camera/gallery/pdf/screenshot/...)
-- ----------------------------------------------------------------------------
create table public.documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  storage_path text not null, -- path within the private 'documents' bucket
  file_name text not null,
  mime_type text not null,
  file_size bigint not null,
  file_hash text not null, -- sha256 of file bytes, for duplicate detection
  source text not null check (source in ('camera', 'gallery', 'pdf', 'file', 'screenshot')),
  status text not null default 'uploaded'
    check (status in ('uploaded', 'processing', 'processed', 'failed')),
  processing_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index documents_user_id_idx on public.documents (user_id);
create index documents_file_hash_idx on public.documents (user_id, file_hash);

create trigger documents_set_updated_at
  before update on public.documents
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- document_extractions: raw structured AI/OCR output for a document, with
-- per-field confidence, before the user reviews/confirms it
-- ----------------------------------------------------------------------------
create table public.document_extractions (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  ai_provider text not null, -- which OCR/AI backend produced this (e.g. 'mock', 'google-document-ai')
  document_type text check (document_type in ('bill', 'receipt', 'tax_invoice', 'payment_demand', 'other')),
  provider_name_raw text,
  provider_id uuid references public.providers (id) on delete set null,
  category_id uuid references public.categories (id) on delete set null,
  amount numeric(12, 2),
  currency text default 'ILS',
  amount_before_vat numeric(12, 2),
  amount_after_vat numeric(12, 2),
  issue_date date,
  due_date date,
  billing_period_start date,
  billing_period_end date,
  invoice_number text,
  customer_number text,
  reference_number text,
  payment_method text,
  is_paid boolean,
  paid_date date,
  raw_ocr_text text,
  confidence jsonb not null default '{}', -- { field: 0..1 } per extracted field
  review_status text not null default 'pending_review'
    check (review_status in ('pending_review', 'confirmed', 'rejected')),
  created_at timestamptz not null default now()
);

create index document_extractions_document_id_idx on public.document_extractions (document_id);
create index document_extractions_user_id_idx on public.document_extractions (user_id);

-- ----------------------------------------------------------------------------
-- bills: the confirmed, user-facing record the whole app is built around
-- ----------------------------------------------------------------------------
create table public.bills (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  provider_id uuid references public.providers (id) on delete set null,
  category_id uuid references public.categories (id) on delete set null,
  document_id uuid references public.documents (id) on delete set null,
  invoice_number text,
  customer_number text,
  amount numeric(12, 2) not null,
  currency text not null default 'ILS',
  amount_before_vat numeric(12, 2),
  amount_after_vat numeric(12, 2),
  issue_date date,
  due_date date,
  billing_period_start date,
  billing_period_end date,
  status text not null default 'pending'
    check (status in ('pending', 'paid', 'overdue', 'partially_paid', 'unknown')),
  paid_date date,
  payment_method text,
  reference_number text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index bills_user_id_idx on public.bills (user_id);
create index bills_status_idx on public.bills (user_id, status);
create index bills_due_date_idx on public.bills (user_id, due_date);
create index bills_provider_id_idx on public.bills (provider_id);
create index bills_category_id_idx on public.bills (category_id);

create trigger bills_set_updated_at
  before update on public.bills
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- payments: one bill can have one or more payment records (partial payments)
-- ----------------------------------------------------------------------------
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  bill_id uuid not null references public.bills (id) on delete cascade,
  document_id uuid references public.documents (id) on delete set null, -- the receipt, if any
  amount numeric(12, 2) not null,
  currency text not null default 'ILS',
  paid_date date not null,
  payment_method text,
  reference_number text,
  notes text,
  created_at timestamptz not null default now()
);

create index payments_bill_id_idx on public.payments (bill_id);
create index payments_user_id_idx on public.payments (user_id);

-- ----------------------------------------------------------------------------
-- document_matches: candidate/confirmed links between a bill and a later
-- receipt document (bill/receipt matching), kept even when rejected so the
-- matching heuristics can be tuned later without losing history
-- ----------------------------------------------------------------------------
create table public.document_matches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  bill_id uuid not null references public.bills (id) on delete cascade,
  document_id uuid not null references public.documents (id) on delete cascade,
  match_type text not null default 'bill_receipt' check (match_type in ('bill_receipt', 'duplicate')),
  confidence numeric(4, 3) not null, -- 0..1
  matched_fields jsonb not null default '{}', -- which fields agreed (provider/amount/period/invoice_number/...)
  status text not null default 'suggested' check (status in ('suggested', 'confirmed', 'rejected')),
  created_at timestamptz not null default now()
);

create index document_matches_bill_id_idx on public.document_matches (bill_id);
create index document_matches_document_id_idx on public.document_matches (document_id);

-- ----------------------------------------------------------------------------
-- notifications: scheduled payment reminders
-- ----------------------------------------------------------------------------
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  bill_id uuid not null references public.bills (id) on delete cascade,
  type text not null check (type in ('due_reminder_7d', 'due_reminder_3d', 'due_reminder_1d', 'due_today')),
  scheduled_for timestamptz not null,
  sent_at timestamptz,
  status text not null default 'scheduled' check (status in ('scheduled', 'sent', 'cancelled')),
  created_at timestamptz not null default now()
);

create index notifications_user_id_idx on public.notifications (user_id);
create index notifications_scheduled_for_idx on public.notifications (status, scheduled_for);

-- ----------------------------------------------------------------------------
-- user_settings
-- ----------------------------------------------------------------------------
create table public.user_settings (
  user_id uuid primary key references auth.users (id) on delete cascade,
  theme text not null default 'system' check (theme in ('light', 'dark', 'system')),
  notifications_enabled boolean not null default true,
  reminder_days_before int[] not null default '{7, 3, 1, 0}',
  push_token text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger user_settings_set_updated_at
  before update on public.user_settings
  for each row execute function public.set_updated_at();

-- ============================================================================
-- Row Level Security
-- ============================================================================
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.providers enable row level security;
alter table public.documents enable row level security;
alter table public.document_extractions enable row level security;
alter table public.bills enable row level security;
alter table public.payments enable row level security;
alter table public.document_matches enable row level security;
alter table public.notifications enable row level security;
alter table public.user_settings enable row level security;

create policy "profiles: owner read/write" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

create policy "categories: read system or own" on public.categories
  for select using (user_id is null or auth.uid() = user_id);
create policy "categories: insert own" on public.categories
  for insert with check (auth.uid() = user_id);
create policy "categories: update own" on public.categories
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "categories: delete own" on public.categories
  for delete using (auth.uid() = user_id);

create policy "providers: read system or own" on public.providers
  for select using (user_id is null or auth.uid() = user_id);
create policy "providers: insert own" on public.providers
  for insert with check (auth.uid() = user_id);
create policy "providers: update own" on public.providers
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "documents: owner only" on public.documents
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "document_extractions: owner only" on public.document_extractions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "bills: owner only" on public.bills
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "payments: owner only" on public.payments
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "document_matches: owner only" on public.document_matches
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "notifications: owner only" on public.notifications
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "user_settings: owner only" on public.user_settings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================================
-- Seed: baseline system categories (Israel-first labels, generic keys)
-- ============================================================================
insert into public.categories (key, name_en, name_he, icon, is_system, sort_order) values
  ('electricity', 'Electricity', 'חשמל', 'zap', true, 10),
  ('water', 'Water', 'מים', 'droplet', true, 20),
  ('gas', 'Gas', 'גז', 'flame', true, 30),
  ('property_tax', 'Property Tax', 'ארנונה', 'building', true, 40),
  ('building_committee', 'Building Committee', 'ועד בית', 'home', true, 50),
  ('internet', 'Internet', 'אינטרנט', 'wifi', true, 60),
  ('tv', 'TV', 'טלוויזיה', 'tv', true, 70),
  ('mobile', 'Mobile / Phone', 'טלפון / סלולר', 'smartphone', true, 80),
  ('insurance', 'Insurance', 'ביטוחים', 'shield', true, 90),
  ('rent', 'Rent', 'שכירות', 'key', true, 100),
  ('mortgage', 'Mortgage', 'משכנתא', 'landmark', true, 110),
  ('credit_card', 'Credit Cards', 'כרטיסי אשראי', 'credit-card', true, 120),
  ('bank', 'Bank', 'בנק', 'banknote', true, 130),
  ('car', 'Car', 'רכב', 'car', true, 140),
  ('fuel', 'Fuel', 'דלק', 'fuel', true, 150),
  ('parking', 'Parking', 'חניה', 'parking-circle', true, 160),
  ('education', 'Education', 'חינוך', 'graduation-cap', true, 170),
  ('medical', 'Medical', 'רפואה', 'stethoscope', true, 180),
  ('government', 'Government / Taxes', 'ממשלה / מיסים', 'landmark', true, 190),
  ('subscriptions', 'Subscriptions', 'מנויים', 'repeat', true, 200),
  ('shopping', 'Shopping', 'קניות', 'shopping-bag', true, 210),
  ('home_services', 'Home Services', 'שירותים לבית', 'wrench', true, 220),
  ('business', 'Business Invoices', 'חשבוניות עסקיות', 'briefcase', true, 230),
  ('other', 'Other', 'אחר', 'more-horizontal', true, 999);

-- ============================================================================
-- Seed: a handful of well-known Israeli providers (a starting point only —
-- the provider directory is designed to grow via the generic learn-on-upload
-- mechanism in src/services/document-processor, not a hardcoded list)
-- ============================================================================
insert into public.providers (name, normalized_name, is_system, country) values
  ('Israel Electric Corporation', 'israel electric corporation', true, 'IL'),
  ('Mei Shava', 'mei shava', true, 'IL'),
  ('Bezeq', 'bezeq', true, 'IL'),
  ('HOT', 'hot', true, 'IL'),
  ('yes', 'yes', true, 'IL'),
  ('Partner', 'partner', true, 'IL'),
  ('Cellcom', 'cellcom', true, 'IL'),
  ('Pelephone', 'pelephone', true, 'IL');
