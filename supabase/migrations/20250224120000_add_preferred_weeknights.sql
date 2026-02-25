-- Add preferred_weeknights for when users select Weeknight in preferred_days
alter table couples add column if not exists preferred_weeknights text[];
