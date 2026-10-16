-- =====================================================================
-- Huddle — database setup for Supabase
-- Paste this whole file into Supabase › SQL Editor › New query › Run.
-- It is safe to run on a brand-new project. Running it twice will fail
-- on "already exists" — that just means it is already set up.
-- =====================================================================

-- ---------- People ----------------------------------------------------
create table public.profiles (
  id           uuid primary key references auth.users on delete cascade,
  username     text not null unique check (username ~ '^[a-z0-9._]{3,24}$'),
  display_name text not null check (char_length(display_name) between 1 and 40),
  created_at   timestamptz not null default now()
);

-- A profile is created automatically when someone signs up.
create function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    lower(new.raw_user_meta_data->>'username'),
    coalesce(nullif(trim(new.raw_user_meta_data->>'display_name'), ''), new.raw_user_meta_data->>'username')
  );
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Lets the sign-up screen check a username before creating the account.
create function public.username_available(p_username text)
returns boolean language sql security definer stable set search_path = public as $$
  select not exists (select 1 from public.profiles where username = lower(p_username));
$$;
grant execute on function public.username_available(text) to anon, authenticated;

-- ---------- Groups ----------------------------------------------------
create table public.groups (
  id             uuid primary key default gen_random_uuid(),
  owner_id       uuid not null default auth.uid() references public.profiles on delete cascade,
  name           text not null check (char_length(name) between 1 and 40),
  color          text not null default 'cobalt'
                 check (color in ('tangerine','blush','olive','cobalt','sun','slate')),
  default_detail text not null default 'busy' check (default_detail in ('full','busy')),
  created_at     timestamptz not null default now()
);

create table public.group_members (
  group_id uuid not null references public.groups on delete cascade,
  user_id  uuid not null references public.profiles on delete cascade,
  added_at timestamptz not null default now(),
  primary key (group_id, user_id)
);
create index on public.group_members (user_id);

-- The person who makes a group is automatically in it.
create function public.add_group_owner()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.group_members (group_id, user_id) values (new.id, new.owner_id)
  on conflict do nothing;
  return new;
end $$;

create trigger on_group_created
  after insert on public.groups
  for each row execute function public.add_group_owner();

-- ---------- Events & reminders ---------------------------------------
create table public.events (
  id            uuid primary key default gen_random_uuid(),
  owner_id      uuid not null default auth.uid() references public.profiles on delete cascade,
  kind          text not null default 'event' check (kind in ('event','reminder')),
  reminder_type text check (reminder_type in ('birthday','anniversary','bill','other')),
  title         text not null check (char_length(title) between 1 and 120),
  starts_at     timestamptz not null,
  ends_at       timestamptz not null,
  all_day       boolean not null default false,
  location      text,
  notes         text,
  is_private    boolean not null default true,
  detail        text not null default 'busy' check (detail in ('full','busy')),
  repeat        text not null default 'none' check (repeat in ('none','weekly','monthly','yearly')),
  alerts        integer[] not null default '{}',   -- minutes before start
  group_id      uuid references public.groups on delete set null, -- set for group events
  created_at    timestamptz not null default now(),
  check (ends_at >= starts_at)
);
create index on public.events (owner_id, starts_at);

-- Which groups can see an event (empty = only you).
create table public.event_shares (
  event_id uuid not null references public.events on delete cascade,
  group_id uuid not null references public.groups on delete cascade,
  primary key (event_id, group_id)
);
create index on public.event_shares (group_id);

-- Invites to group events.
create table public.invites (
  event_id     uuid not null references public.events on delete cascade,
  user_id      uuid not null references public.profiles on delete cascade,
  status       text not null default 'pending' check (status in ('pending','going','declined')),
  invited_at   timestamptz not null default now(),
  responded_at timestamptz,
  primary key (event_id, user_id)
);
create index on public.invites (user_id);

-- ---------- Helper checks (used by the privacy rules) ------------------
create function public.is_group_member(p_group uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists (select 1 from public.group_members where group_id = p_group and user_id = auth.uid());
$$;

create function public.is_group_owner(p_group uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists (select 1 from public.groups where id = p_group and owner_id = auth.uid());
$$;

create function public.is_event_owner(p_event uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists (select 1 from public.events where id = p_event and owner_id = auth.uid());
$$;

create function public.is_invited(p_event uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists (select 1 from public.invites where event_id = p_event and user_id = auth.uid());
$$;

-- True when the event is shared, with full details, to a group I'm in.
create function public.can_see_details(p_event uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists (
    select 1
    from public.events e
    join public.event_shares s on s.event_id = e.id
    join public.group_members m on m.group_id = s.group_id and m.user_id = auth.uid()
    where e.id = p_event and not e.is_private and e.detail = 'full'
  );
$$;

-- True when two people are in at least one group together.
create function public.shares_group_with(p_user uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from public.group_members a
    join public.group_members b on b.group_id = a.group_id
    where a.user_id = auth.uid() and b.user_id = p_user
  );
$$;

-- ---------- Privacy rules (Row Level Security) -------------------------
alter table public.profiles      enable row level security;
alter table public.groups        enable row level security;
alter table public.group_members enable row level security;
alter table public.events        enable row level security;
alter table public.event_shares  enable row level security;
alter table public.invites       enable row level security;

-- Profiles: signed-in people can look each other up by username.
create policy "profiles readable" on public.profiles
  for select to authenticated using (true);
create policy "edit own profile" on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- Groups: members see them; only the owner changes them.
create policy "members see group" on public.groups
  for select to authenticated using (owner_id = auth.uid() or public.is_group_member(id));
create policy "create own group" on public.groups
  for insert to authenticated with check (owner_id = auth.uid());
create policy "owner edits group" on public.groups
  for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "owner deletes group" on public.groups
  for delete to authenticated using (owner_id = auth.uid());

-- Members: visible to fellow members; owner adds/removes; anyone can leave.
create policy "members see members" on public.group_members
  for select to authenticated using (public.is_group_member(group_id));
create policy "owner adds members" on public.group_members
  for insert to authenticated with check (public.is_group_owner(group_id));
create policy "owner removes or member leaves" on public.group_members
  for delete to authenticated using (public.is_group_owner(group_id) or user_id = auth.uid());

-- Events: owner, invitees, and groups given full details can read the row.
-- (Busy-only viewers never read the row — they use visible_events() below,
--  which hides the title, place and notes.)
create policy "read events I may see" on public.events
  for select to authenticated
  using (owner_id = auth.uid() or public.is_invited(id) or public.can_see_details(id));
create policy "create own events" on public.events
  for insert to authenticated with check (owner_id = auth.uid());
create policy "edit own events" on public.events
  for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "delete own events" on public.events
  for delete to authenticated using (owner_id = auth.uid());

-- Shares: the event owner picks groups they belong to.
create policy "see shares" on public.event_shares
  for select to authenticated
  using (public.is_event_owner(event_id) or public.is_group_member(group_id));
create policy "owner shares event" on public.event_shares
  for insert to authenticated
  with check (public.is_event_owner(event_id) and public.is_group_member(group_id));
create policy "owner unshares event" on public.event_shares
  for delete to authenticated using (public.is_event_owner(event_id));

-- Invites: the host invites people they share a group with; guests reply.
create policy "see my invites" on public.invites
  for select to authenticated using (user_id = auth.uid() or public.is_event_owner(event_id));
create policy "host invites" on public.invites
  for insert to authenticated
  with check (public.is_event_owner(event_id) and public.shares_group_with(user_id) and status = 'pending');
create policy "guest replies" on public.invites
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "host or guest removes" on public.invites
  for delete to authenticated using (public.is_event_owner(event_id) or user_id = auth.uid());

-- ---------- What appears on my calendar --------------------------------
-- Everything I'm allowed to see between two dates, with busy-only events
-- stripped of title, place and notes. Repeating events are returned once;
-- the app works out each repeat.
create function public.visible_events(p_from timestamptz, p_to timestamptz)
returns table (
  id uuid, owner_id uuid, owner_name text, owner_username text,
  kind text, reminder_type text, title text,
  starts_at timestamptz, ends_at timestamptz, all_day boolean,
  location text, notes text, is_private boolean, detail text, repeat text,
  alerts integer[], group_id uuid, share_group_ids uuid[],
  is_mine boolean, busy_only boolean, my_status text
)
language sql security definer stable set search_path = public as $$
  with me as (select auth.uid() as uid),
  my_groups as (select group_id from public.group_members, me where user_id = me.uid),
  candidates as (
    select e.*,
           (e.owner_id = me.uid) as mine,
           i.status as inv_status,
           exists (select 1 from public.event_shares s
                   where s.event_id = e.id and s.group_id in (select group_id from my_groups)) as shared_to_me
    from public.events e
    cross join me
    left join public.invites i on i.event_id = e.id and i.user_id = me.uid
    where (e.starts_at < p_to and (e.ends_at > p_from or e.repeat <> 'none'))
  )
  select c.id, c.owner_id, p.display_name, p.username,
         c.kind, c.reminder_type,
         case when busy then null else c.title end,
         c.starts_at, c.ends_at, c.all_day,
         case when busy then null else c.location end,
         case when busy then null else c.notes end,
         c.is_private, c.detail, c.repeat,
         case when c.mine then c.alerts else '{}'::integer[] end,
         c.group_id,
         coalesce((select array_agg(s.group_id) from public.event_shares s
                   where s.event_id = c.id
                     and (c.mine or s.group_id in (select group_id from my_groups))), '{}'),
         c.mine, busy, c.inv_status
  from candidates c
  join public.profiles p on p.id = c.owner_id
  cross join lateral (select (not c.mine and coalesce(c.inv_status, 'declined') = 'declined' and c.detail = 'busy') as busy) b
  where c.mine
     or (c.inv_status is not null and c.inv_status <> 'declined')
     or (not c.is_private and c.shared_to_me);
$$;
grant execute on function public.visible_events(timestamptz, timestamptz) to authenticated;

-- ---------- Find a time --------------------------------------------------
-- Busy times for everyone in a group. Only counts events each person has
-- shared with THIS group (or group events they're going to), plus all of
-- your own events. No titles are returned.
create function public.group_busy(p_group uuid, p_from timestamptz, p_to timestamptz)
returns table (user_id uuid, starts_at timestamptz, ends_at timestamptz, all_day boolean, repeat text)
language plpgsql security definer stable set search_path = public as $$
begin
  if not public.is_group_member(p_group) then
    raise exception 'Not a member of this group';
  end if;
  return query
    select e.owner_id, e.starts_at, e.ends_at, e.all_day, e.repeat
    from public.events e
    where e.kind = 'event'
      and e.starts_at < p_to and (e.ends_at > p_from or e.repeat <> 'none')
      and e.owner_id in (select m.user_id from public.group_members m where m.group_id = p_group)
      and (
        e.owner_id = auth.uid()
        or (not e.is_private and exists (select 1 from public.event_shares s
                                         where s.event_id = e.id and s.group_id = p_group))
      )
    union all
    select i.user_id, e.starts_at, e.ends_at, e.all_day, e.repeat
    from public.invites i
    join public.events e on e.id = i.event_id
    where i.status = 'going'
      and i.user_id in (select m.user_id from public.group_members m where m.group_id = p_group)
      and e.starts_at < p_to and (e.ends_at > p_from or e.repeat <> 'none');
end $$;
grant execute on function public.group_busy(uuid, timestamptz, timestamptz) to authenticated;

-- Add someone to a group by their username (group owner only).
create function public.add_member_by_username(p_group uuid, p_username text)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_user uuid;
begin
  if not public.is_group_owner(p_group) then
    raise exception 'Only the group owner can add people';
  end if;
  select id into v_user from public.profiles where username = lower(trim(both '@' from p_username));
  if v_user is null then
    raise exception 'No one has the username %', p_username;
  end if;
  insert into public.group_members (group_id, user_id) values (p_group, v_user)
  on conflict do nothing;
  return v_user;
end $$;
grant execute on function public.add_member_by_username(uuid, text) to authenticated;
