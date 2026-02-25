-- Add food_dislikes and anything_else for onboarding
alter table couples add column if not exists food_dislikes text;
alter table couples add column if not exists anything_else text;
