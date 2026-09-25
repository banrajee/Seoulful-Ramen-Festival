-- Additive migration for the owner-controlled festival NEW badge.
alter table public.festival_items
add column if not exists is_new boolean not null default false;

alter table public.festival_combos
add column if not exists is_new boolean not null default false;
