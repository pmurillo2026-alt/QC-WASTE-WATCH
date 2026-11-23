-- QC Waste Watch Supabase Schema
-- Run this SQL in your Supabase project's SQL Editor to enable persistent storage.

create table if not exists public.residents (
  id text primary key,
  full_name text not null,
  address text not null,
  mobile_number text unique not null,
  home_barangay_id text not null,
  subscribed_barangay_ids jsonb not null default '[]'::jsonb,
  password_hash text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.role_credentials (
  role text primary key,
  passcode_hash text not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.barangays (
  id text primary key,
  name text not null,
  district integer not null,
  sub_area text,
  zip_code text not null,
  regular_days jsonb not null default '[]'::jsonb,
  pickup_window text not null,
  waste_type text not null,
  next_scheduled_date text not null,
  next_scheduled_time text not null,
  contractor text not null,
  truck_code text not null,
  status text not null default 'ON_SCHEDULE',
  current_delay jsonb
);

create table if not exists public.notifications (
  id text primary key,
  barangay_id text not null,
  barangay_name text not null,
  district integer not null,
  type text not null,
  title text not null,
  scheduled_date text not null,
  scheduled_time text not null,
  cause_of_delay text,
  delay_category text,
  original_time text,
  rescheduled_date text,
  rescheduled_time text,
  advisory text,
  timestamp_label text not null,
  is_read boolean not null default false,
  severity text not null default 'normal',
  updated_by text,
  telemetry_eta_formatted text,
  is_sla_breach boolean default false,
  driver_id text,
  truck_code text,
  created_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id text primary key,
  admin_name text not null,
  action text not null,
  barangay_name text not null,
  details text not null,
  timestamp_label text not null,
  created_at timestamptz not null default now()
);
