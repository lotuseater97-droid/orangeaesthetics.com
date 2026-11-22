-- ORANGE AESTHETICS — REVIEW-ONLY STAGING SCHEMA, NOT APPLIED
-- Requires a dedicated Orange Aesthetics Supabase project and security review.
-- Business-only records: never store symptoms, diagnoses, clinical notes or card data.
create extension if not exists pgcrypto;
create schema if not exists oa_private;
create table if not exists public.oa_organizations (
 id uuid primary key default gen_random_uuid(),
 name text not null,
 created_at timestamptz not null default now()
);
create table if not exists public.oa_team_members (
 id uuid primary key default gen_random_uuid(),
 organization_id uuid not null references public.oa_organizations(id),
 user_id uuid not null references auth.users(id),
 role text not null check (role in ('owner','manager','clinician','ma')),
 active boolean not null default true,
 created_at timestamptz not null default now(),
 unique(organization_id,user_id)
);
create table if not exists public.oa_contacts (
 id uuid primary key default gen_random_uuid(),
 organization_id uuid not null references public.oa_organizations(id),
 display_name text not null,
 email text,
 phone text,
 created_at timestamptz not null default now(),
 unique(organization_id,id)
);
create table if not exists public.oa_inquiries (
 id uuid primary key default gen_random_uuid(),
 organization_id uuid not null references public.oa_organizations(id),
 contact_id uuid,
 status text not null default 'new' check (status in ('new','contacted','qualified','converted','closed')),
 source text,
 assigned_to uuid,
 created_at timestamptz not null default now(),
 unique(organization_id,id),
 foreign key (organization_id,contact_id) references public.oa_contacts(organization_id,id)
);
create table if not exists public.oa_appointments (
 id uuid primary key default gen_random_uuid(),
 organization_id uuid not null references public.oa_organizations(id),
 contact_id uuid not null,
 service_code text not null,
 requested_at timestamptz not null,
 status text not null default 'requested' check(status in ('requested','under_review','confirmed','completed','cancelled','declined','no_show')),
 assigned_to uuid,
 created_at timestamptz not null default now(),
 unique(organization_id,id),
 foreign key (organization_id,contact_id) references public.oa_contacts(organization_id,id)
);
create table if not exists public.oa_vendors (
 id uuid primary key default gen_random_uuid(),
 organization_id uuid not null references public.oa_organizations(id),
 name text not null,
 created_at timestamptz not null default now(),
 unique(organization_id,id)
);
create table if not exists public.oa_invoices (
 id uuid primary key default gen_random_uuid(),
 organization_id uuid not null references public.oa_organizations(id),
 contact_id uuid not null,
 status text not null default 'draft' check(status in ('draft','issued','partially_paid','paid','refunded','void')),
 currency text not null default 'USD' check(currency='USD'),
 total_cents bigint not null check(total_cents>=0),
 balance_cents bigint not null check(balance_cents>=0 and balance_cents<=total_cents),
 due_at timestamptz,
 created_at timestamptz not null default now(),
 unique(organization_id,id),
 foreign key (organization_id,contact_id) references public.oa_contacts(organization_id,id)
);
create table if not exists public.oa_payments (
 id uuid primary key default gen_random_uuid(),
 organization_id uuid not null references public.oa_organizations(id),
 invoice_id uuid not null,
 amount_cents bigint not null check(amount_cents>0),
 method text not null check(method in ('card','cash','check','other')),
 status text not null check(status in ('pending','succeeded','failed','refunded')),
 external_reference text,
 deposited_at timestamptz,
 created_at timestamptz not null default now(),
 unique(organization_id,id),
 foreign key (organization_id,invoice_id) references public.oa_invoices(organization_id,id)
);
create table if not exists public.oa_expenses (
 id uuid primary key default gen_random_uuid(),
 organization_id uuid not null references public.oa_organizations(id),
 vendor_id uuid,
 category text not null,
 amount_cents bigint not null check(amount_cents>=0),
 incurred_on date not null,
 status text not null default 'draft' check(status in ('draft','submitted','approved','paid','rejected')),
 created_at timestamptz not null default now(),
 unique(organization_id,id),
 foreign key (organization_id,vendor_id) references public.oa_vendors(organization_id,id)
);
create table if not exists public.oa_inventory_items (
 id uuid primary key default gen_random_uuid(),
 organization_id uuid not null references public.oa_organizations(id),
 sku text not null,
 description text not null,
 reorder_threshold integer not null default 0 check(reorder_threshold>=0),
 created_at timestamptz not null default now(),
 unique(organization_id,id), unique(organization_id,sku)
);
create table if not exists public.oa_inventory_movements (
 id uuid primary key default gen_random_uuid(),
 organization_id uuid not null references public.oa_organizations(id),
 item_id uuid not null,
 quantity_delta integer not null check(quantity_delta<>0),
 reason text not null,
 created_at timestamptz not null default now(),
 unique(organization_id,id),
 foreign key (organization_id,item_id) references public.oa_inventory_items(organization_id,id)
);
create table if not exists public.oa_tasks (
 id uuid primary key default gen_random_uuid(),
 organization_id uuid not null references public.oa_organizations(id),
 title text not null,
 status text not null default 'open' check(status in ('open','in_progress','done','cancelled')),
 due_at timestamptz,
 assigned_to uuid,
 created_at timestamptz not null default now()
);
create table if not exists public.oa_idempotency_keys (
 id uuid primary key default gen_random_uuid(),
 organization_id uuid not null references public.oa_organizations(id),
 key text not null,
 request_hash text not null,
 result_ref text,
 created_at timestamptz not null default now(),
 unique(organization_id,key)
);
create table if not exists public.oa_audit_events (
 id uuid primary key default gen_random_uuid(),
 organization_id uuid not null references public.oa_organizations(id),
 actor_id uuid,
 entity_type text not null,
 entity_id uuid,
 action text not null,
 occurred_at timestamptz not null default now()
);
-- Default deny: no direct access to business tables from browser roles.
-- Backend may use an audited trusted service connection after independent review.
do $$ declare t text; begin
 foreach t in array array['oa_organizations','oa_team_members','oa_contacts','oa_inquiries','oa_appointments','oa_vendors','oa_invoices','oa_payments','oa_expenses','oa_inventory_items','oa_inventory_movements','oa_tasks','oa_idempotency_keys','oa_audit_events']
 loop
 execute format('alter table public.%I enable row level security',t);
 execute format('revoke all on public.%I from anon, authenticated',t);
 end loop;
end $$;
-- No permissive policies. This is intentionally inaccessible to browser clients.
-- Before launch: implement verified session mapping, authorization, transactions,
-- append-only audit protection, per-org policies, backups, and negative RLS tests.
