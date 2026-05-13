create extension if not exists btree_gist;

alter table public.resources
  add column if not exists requires_approval boolean not null default false,
  add column if not exists description text;

create table if not exists public.booking_types (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  resource_id uuid not null references public.resources(id) on delete cascade,
  name text not null,
  slug text not null,
  start_time time not null,
  end_time time not null,
  sort_order integer not null default 0,
  unique(resource_id, slug)
);

alter table public.bookings
  add column if not exists guest_email text,
  add column if not exists purpose text,
  add column if not exists booking_type_id uuid references public.booking_types(id);

create table if not exists public.blocked_periods (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  resource_id uuid not null references public.resources(id) on delete cascade,
  start_time timestamptz not null,
  end_time timestamptz not null,
  reason text,
  constraint blocked_periods_time_order check (end_time > start_time)
);

alter table public.bookings
  drop constraint if exists bookings_no_overlap_per_resource;

alter table public.bookings
  add constraint bookings_no_overlap_per_resource
  exclude using gist (
    resource_id with =,
    tstzrange(start_time, end_time, '[)') with &&
  )
  where (status in ('confirmed', 'requested', 'approved'));

insert into public.resources (name, slug, opens_at, closes_at, booking_interval_minutes, requires_approval, description)
values
  ('Tennisbane', 'tennisbane', '08:00', '22:00', 60, false, 'Utendørsbane'),
  ('Velhuset', 'velhuset', '08:00', '23:00', 60, true, 'Utleie av velhuset')
on conflict (slug) do update set
  requires_approval = excluded.requires_approval,
  description = excluded.description;

insert into public.booking_types (resource_id, name, slug, start_time, end_time, sort_order)
select resources.id, booking_type.name, booking_type.slug, booking_type.start_time::time, booking_type.end_time::time, booking_type.sort_order
from public.resources
cross join (
  values
    ('Dag', 'dag', '08:00', '16:00', 1),
    ('Kveld', 'kveld', '17:00', '23:00', 2),
    ('Hel dag', 'hel-dag', '08:00', '23:00', 3)
) as booking_type(name, slug, start_time, end_time, sort_order)
where resources.slug = 'velhuset'
on conflict (resource_id, slug) do update set
  name = excluded.name,
  start_time = excluded.start_time,
  end_time = excluded.end_time,
  sort_order = excluded.sort_order;

create or replace function public.update_booking_request(
  p_booking_id uuid,
  p_status text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_status not in ('approved', 'rejected') then
    raise exception 'Invalid booking request status';
  end if;

  update public.bookings
  set status = p_status
  where id = p_booking_id
    and status = 'requested';

  if not found then
    raise exception 'Booking request not found';
  end if;
end;
$$;
