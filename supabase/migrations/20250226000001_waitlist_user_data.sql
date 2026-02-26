-- Add user survey fields to waitlist (filled in modal after join)
alter table waitlist add column if not exists in_us boolean;
alter table waitlist add column if not exists date_frequency text;
alter table waitlist add column if not exists would_pay_amount text;
