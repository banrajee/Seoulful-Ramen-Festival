-- Additive migration: does not modify shop products, prices, status, or QR settings.
-- Matches the existing owner authentication model (authenticated users manage menu).
begin;
create table public.festival_items (
 id uuid primary key default gen_random_uuid(),
 menu_item_id uuid not null unique references public.menu_items(id) on delete cascade,
 section text not null check(section in ('ramen','addons','snacks','drinks')),
 price numeric(10,2) not null check(price >= 0),
 status text not null default 'hidden' check(status in ('available','out_of_stock','hidden')),
 sort_order integer not null default 10
);
create table public.festival_combos (
 id uuid primary key default gen_random_uuid(),
 name text not null check(length(trim(name)) between 1 and 120),
 description text not null default '' check(length(description)<=240),
 image_url text,
 price numeric(10,2) not null check(price >= 0),
 status text not null default 'hidden' check(status in ('available','out_of_stock','hidden')),
 sort_order integer not null default 10
);
alter table public.festival_items enable row level security;
alter table public.festival_combos enable row level security;
create policy "Public festival items" on public.festival_items for select to anon using(status <> 'hidden');
create policy "Owner festival items" on public.festival_items for all to authenticated using(true) with check(true);
create policy "Public festival combos" on public.festival_combos for select to anon using(status <> 'hidden');
create policy "Owner festival combos" on public.festival_combos for all to authenticated using(true) with check(true);
grant select on public.festival_items, public.festival_combos to anon;
grant select,insert,update,delete on public.festival_items, public.festival_combos to authenticated;
-- Draft candidates reference actual products. Prices are examples copied once, not linked.
-- Keep hidden until the owner confirms the prepared festival price and selection.
insert into public.festival_items(menu_item_id,section,price,status,sort_order)
select id,'ramen',coalesce(self_cook_price,price),'hidden',
 case when lower(name)='nongshim shin ramyeon' then 10
 when lower(name)='samyang carbonara' then 20
 when lower(name)='nongshim shin toomba' then 30 else 40 end
from public.menu_items where lower(name) in ('nongshim shin ramyeon','samyang carbonara','nongshim shin toomba','nongshim soon veggie');
insert into public.festival_items(menu_item_id,section,price,status,sort_order)
select id,'addons',price,'hidden',case when lower(name)='spring onions' then 10 when lower(name)='boiled egg' then 20 else 30 end
from public.menu_items where category_id='addons' and lower(name) in ('spring onions','boiled egg','sliced cheese');
commit;
