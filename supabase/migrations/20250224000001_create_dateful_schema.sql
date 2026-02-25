-- Dateful schema migration
-- Handles circular dependency: users <-> couples by creating in stages

-- 1. USERS table (without couple_id first)
create table users (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users(id) on delete cascade,
  email text unique,
  phone text unique not null,
  name text default '',
  role text not null check (role in ('primary', 'partner')),
  google_calendar_connected boolean default false,
  google_calendar_refresh_token text,
  preferred_channel text default 'sms' check (preferred_channel in ('sms', 'whatsapp')),
  created_at timestamptz default now()
);

-- 2. COUPLES table (references users)
create table couples (
  id uuid primary key default gen_random_uuid(),
  primary_user_id uuid not null references users(id),
  partner_user_id uuid references users(id),
  city text not null,
  neighborhood text,
  travel_radius text,
  budget text,
  frequency text default 'biweekly' check (frequency in ('weekly', 'biweekly', 'monthly')),
  preferred_days text[],
  interests text[],
  dietary_restrictions text,
  surprise_preference text default 'approve_first' check (surprise_preference in ('approve_first', 'surprise_me')),
  onboarding_complete boolean default false,
  free_date_used boolean default false,
  subscription_status text default 'none' check (subscription_status in ('none', 'per_date', 'annual', 'cancelled')),
  stripe_customer_id text,
  stripe_subscription_id text,
  created_at timestamptz default now()
);

-- 3. Add couple_id to users (completing the circle)
alter table users add column couple_id uuid references couples(id);

-- 4. OTP verifications (for phone verification during signup)
create table otp_verifications (
  id uuid primary key default gen_random_uuid(),
  phone text not null,
  code text not null,
  expires_at timestamptz not null,
  verified_at timestamptz,
  created_at timestamptz default now()
);

create index idx_otp_verifications_phone on otp_verifications(phone);
create index idx_otp_verifications_expires on otp_verifications(expires_at);

-- 5. COUPLE PREFERENCES
create table couple_preferences (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid references couples(id) not null,
  user_id uuid references users(id) not null,
  preference_type text not null,
  category text,
  value text not null,
  sentiment text check (sentiment in ('positive', 'negative', 'neutral')),
  source text,
  created_at timestamptz default now()
);

-- 6. SWIPE CARDS
create table swipe_cards (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid references couples(id) not null,
  title text not null,
  description text not null,
  venue_type text,
  neighborhood text,
  estimated_cost text,
  vibe_tags text[],
  image_url text,
  created_at timestamptz default now()
);

create table swipe_responses (
  id uuid primary key default gen_random_uuid(),
  card_id uuid references swipe_cards(id) not null,
  user_id uuid references users(id) not null,
  response text not null check (response in ('like', 'dislike')),
  created_at timestamptz default now(),
  unique(card_id, user_id)
);

-- 7. DATE PLANS
create table date_plans (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid references couples(id) not null,
  status text default 'proposed' check (status in (
    'researching', 'proposed', 'approved_by_primary', 'sent_to_partner',
    'confirmed', 'booked', 'completed', 'declined', 'cancelled'
  )),
  proposed_date date not null,
  proposed_time_start time,
  proposed_time_end time,
  plan_summary text not null,
  total_estimated_cost text,
  agent_reasoning text,
  is_free_date boolean default false,
  deeplink_token text unique,
  created_at timestamptz default now(),
  confirmed_at timestamptz,
  completed_at timestamptz
);

create table date_plan_activities (
  id uuid primary key default gen_random_uuid(),
  date_plan_id uuid references date_plans(id) not null,
  sequence_order integer not null,
  activity_name text not null,
  venue_name text,
  venue_address text,
  google_place_id text,
  latitude decimal,
  longitude decimal,
  time_start time,
  time_end time,
  estimated_cost text,
  booking_url text,
  booking_notes text,
  image_url text,
  category text,
  created_at timestamptz default now()
);

-- 8. DATE FEEDBACK
create table date_feedback (
  id uuid primary key default gen_random_uuid(),
  date_plan_id uuid references date_plans(id) not null,
  user_id uuid references users(id) not null,
  overall_rating integer check (overall_rating between 1 and 5),
  feedback_text text,
  would_return boolean,
  created_at timestamptz default now()
);

-- 9. CONVERSATIONS (agent context)
create table conversations (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid references couples(id) not null,
  user_id uuid references users(id),
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  channel text check (channel in ('sms', 'whatsapp', 'web')),
  context_type text,
  related_date_plan_id uuid references date_plans(id),
  twilio_message_sid text,
  created_at timestamptz default now()
);

-- 10. VENUES (crowd-sourced over time)
create table venues (
  id uuid primary key default gen_random_uuid(),
  google_place_id text unique,
  name text not null,
  address text,
  city text not null,
  neighborhood text,
  latitude decimal,
  longitude decimal,
  category text,
  cuisine_type text,
  price_level integer,
  google_rating decimal,
  google_ratings_count integer,
  booking_url text,
  website text,
  phone text,
  image_url text,
  tags text[],
  times_proposed integer default 0,
  times_confirmed integer default 0,
  times_completed integer default 0,
  avg_user_rating decimal,
  last_verified_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Indexes
create index idx_users_phone on users(phone);
create index idx_users_auth_user on users(auth_user_id);
create index idx_users_couple on users(couple_id);
create index idx_couples_primary on couples(primary_user_id);
create index idx_couples_partner on couples(partner_user_id);
create index idx_date_plans_couple on date_plans(couple_id);
create index idx_date_plans_status on date_plans(status);
create index idx_date_plans_deeplink on date_plans(deeplink_token);
create index idx_conversations_couple on conversations(couple_id, created_at desc);
create index idx_venues_city on venues(city);
create index idx_venues_place_id on venues(google_place_id);
create index idx_couple_prefs_couple on couple_preferences(couple_id);
