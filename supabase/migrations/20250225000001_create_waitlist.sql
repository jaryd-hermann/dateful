-- Waitlist table for email signups (inserts via edge function only)
create table if not exists waitlist (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  created_at timestamptz default now()
);

create index if not exists idx_waitlist_email on waitlist(email);

-- RLS: no direct client access; edge function uses service role
alter table waitlist enable row level security;
