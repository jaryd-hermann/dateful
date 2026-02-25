-- Row Level Security policies
-- Users can only access their own couple's data

alter table users enable row level security;
alter table couples enable row level security;
alter table couple_preferences enable row level security;
alter table swipe_cards enable row level security;
alter table swipe_responses enable row level security;
alter table date_plans enable row level security;
alter table date_plan_activities enable row level security;
alter table date_feedback enable row level security;
alter table conversations enable row level security;
alter table venues enable row level security;

-- Helper: get current user's id from our users table
create or replace function public.current_user_id()
returns uuid as $$
  select id from public.users where auth_user_id = auth.uid()
$$ language sql security definer stable;

-- Helper: get current user's couple_id
create or replace function public.current_couple_id()
returns uuid as $$
  select couple_id from public.users where auth_user_id = auth.uid()
$$ language sql security definer stable;

-- USERS: read own row or partner's row (same couple)
create policy "Users can read self and partner" on users
  for select using (
    auth_user_id = auth.uid()
    or couple_id = (select couple_id from users where auth_user_id = auth.uid())
  );

create policy "Users can update own" on users
  for update using (auth_user_id = auth.uid());

-- COUPLES: access if user is primary or partner
create policy "Couple members can read" on couples
  for select using (
    id = (select couple_id from users where auth_user_id = auth.uid())
  );

create policy "Primary can update couple" on couples
  for update using (
    primary_user_id = (select id from users where auth_user_id = auth.uid())
  );

-- COUPLE_PREFERENCES, SWIPE_CARDS, etc.: access via couple_id
create policy "Couple prefs read" on couple_preferences for select using (
  couple_id = (select couple_id from users where auth_user_id = auth.uid())
);
create policy "Couple prefs insert" on couple_preferences for insert with check (
  couple_id = (select couple_id from users where auth_user_id = auth.uid())
);

create policy "Swipe cards read" on swipe_cards for select using (
  couple_id = (select couple_id from users where auth_user_id = auth.uid())
);

create policy "Swipe responses read" on swipe_responses for select using (
  user_id = (select id from users where auth_user_id = auth.uid())
  or user_id in (select partner_user_id from couples where id = (select couple_id from users where auth_user_id = auth.uid()))
);
create policy "Swipe responses insert" on swipe_responses for insert with check (
  user_id = (select id from users where auth_user_id = auth.uid())
  or user_id = (select partner_user_id from couples where id = (select couple_id from users where auth_user_id = auth.uid()))
);

create policy "Date plans read" on date_plans for select using (
  couple_id = (select couple_id from users where auth_user_id = auth.uid())
);

create policy "Date plan activities read" on date_plan_activities for select using (
  date_plan_id in (select id from date_plans where couple_id = (select couple_id from users where auth_user_id = auth.uid()))
);

create policy "Date feedback read" on date_feedback for select using (
  user_id = (select id from users where auth_user_id = auth.uid())
);
create policy "Date feedback insert" on date_feedback for insert with check (
  user_id = (select id from users where auth_user_id = auth.uid())
);

create policy "Conversations read" on conversations for select using (
  couple_id = (select couple_id from users where auth_user_id = auth.uid())
);

-- Venues are shared/read-only
create policy "Venues read all" on venues for select using (true);

-- OTP verifications: no user access (Edge Functions use service role which bypasses RLS)
alter table otp_verifications enable row level security;
create policy "No direct access to otp" on otp_verifications for select using (false);
