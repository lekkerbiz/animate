-- AniMate — esquema inicial (PRD §8)
-- Household 1─n Caregiver / Pet · Pet 1─n Medication · Medication 1─n Schedule / DoseLog

-- ============================================================
-- Tablas
-- ============================================================

create table public.households (
  id         uuid primary key default gen_random_uuid(),
  name       text not null default 'Mi hogar',
  created_at timestamptz not null default now()
);

create table public.caregivers (
  id           uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  -- set null: el historial sobrevive si se elimina la cuenta (PRD §8)
  user_id      uuid references auth.users(id) on delete set null,
  name         text not null,
  emoji        text not null default '🙂',
  created_at   timestamptz not null default now(),
  unique (household_id, user_id)
);

create table public.pets (
  id           uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  name         text not null,
  species      text not null default 'gato',
  emoji        text not null default '🐱',
  notes        text,
  created_at   timestamptz not null default now()
);

create table public.medications (
  id           uuid primary key default gen_random_uuid(),
  pet_id       uuid not null references public.pets(id) on delete cascade,
  name         text not null,
  -- dosis como texto libre, no number+unit (PRD §8)
  dose         text not null,
  instructions text,
  active       boolean not null default true,
  created_at   timestamptz not null default now()
);

create table public.schedules (
  id            uuid primary key default gen_random_uuid(),
  medication_id uuid not null references public.medications(id) on delete cascade,
  time          time not null,
  unique (medication_id, time)
);

create table public.dose_logs (
  id           uuid primary key default gen_random_uuid(),
  -- denormalizado para RLS simple, suscripción Realtime por hogar
  -- y para que el historial sobreviva al borrado de la medicina
  household_id uuid not null references public.households(id) on delete cascade,
  schedule_id  uuid references public.schedules(id) on delete set null,
  -- fecha PROGRAMADA en hora local del hogar; given_at es el momento real (PRD §8)
  date         date not null,
  given_by     uuid references public.caregivers(id) on delete set null,
  given_at     timestamptz not null default now(),
  notes        text,
  -- imposible registrar dos veces la misma toma del mismo día (PRD §8)
  unique (schedule_id, date)
);

create table public.invites (
  id           uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  code         text not null unique default upper(substring(md5(random()::text) from 1 for 6)),
  created_by   uuid references auth.users(id) on delete set null,
  created_at   timestamptz not null default now(),
  expires_at   timestamptz not null default now() + interval '7 days',
  used_by      uuid references auth.users(id) on delete set null,
  used_at      timestamptz
);

create index caregivers_user_id_idx on public.caregivers (user_id);
create index pets_household_id_idx on public.pets (household_id);
create index medications_pet_id_idx on public.medications (pet_id);
create index schedules_medication_id_idx on public.schedules (medication_id);
create index dose_logs_household_date_idx on public.dose_logs (household_id, date);

-- ============================================================
-- RLS: cada hogar aislado del resto (PRD §7)
-- ============================================================

-- security definer para no recursar sobre las políticas de caregivers
create or replace function public.is_household_member(h uuid)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from caregivers
    where household_id = h and user_id = auth.uid()
  );
$$;

alter table public.households  enable row level security;
alter table public.caregivers  enable row level security;
alter table public.pets        enable row level security;
alter table public.medications enable row level security;
alter table public.schedules   enable row level security;
alter table public.dose_logs   enable row level security;
alter table public.invites     enable row level security;

create policy "members read household" on public.households
  for select using (public.is_household_member(id));
create policy "members update household" on public.households
  for update using (public.is_household_member(id));
-- el alta de hogar se hace vía RPC create_household

create policy "members read caregivers" on public.caregivers
  for select using (public.is_household_member(household_id));
create policy "own caregiver update" on public.caregivers
  for update using (user_id = auth.uid());
create policy "members delete caregivers" on public.caregivers
  for delete using (public.is_household_member(household_id));
-- el alta de cuidador se hace vía RPC (create_household / accept_invite)

create policy "members full access pets" on public.pets
  for all using (public.is_household_member(household_id))
  with check (public.is_household_member(household_id));

create policy "members full access medications" on public.medications
  for all using (
    exists (select 1 from public.pets p
            where p.id = pet_id and public.is_household_member(p.household_id))
  ) with check (
    exists (select 1 from public.pets p
            where p.id = pet_id and public.is_household_member(p.household_id))
  );

create policy "members full access schedules" on public.schedules
  for all using (
    exists (select 1 from public.medications m
            join public.pets p on p.id = m.pet_id
            where m.id = medication_id and public.is_household_member(p.household_id))
  ) with check (
    exists (select 1 from public.medications m
            join public.pets p on p.id = m.pet_id
            where m.id = medication_id and public.is_household_member(p.household_id))
  );

create policy "members full access dose_logs" on public.dose_logs
  for all using (public.is_household_member(household_id))
  with check (public.is_household_member(household_id));

create policy "members read invites" on public.invites
  for select using (public.is_household_member(household_id));
create policy "members create invites" on public.invites
  for insert with check (public.is_household_member(household_id) and created_by = auth.uid());
create policy "members delete invites" on public.invites
  for delete using (public.is_household_member(household_id));

-- ============================================================
-- RPCs de onboarding (evitan el huevo-gallina de RLS al crear
-- hogar/cuidador, y validan invitaciones de un solo uso)
-- ============================================================

-- Registro (F4): crea hogar + cuidador + mascota en una transacción
create or replace function public.create_household(
  p_household_name text,
  p_caregiver_name text,
  p_caregiver_emoji text,
  p_pet_name text,
  p_pet_species text,
  p_pet_emoji text
) returns uuid
language plpgsql security definer
set search_path = public
as $$
declare
  v_household uuid;
begin
  if auth.uid() is null then
    raise exception 'No autenticado';
  end if;

  insert into households (name) values (p_household_name) returning id into v_household;
  insert into caregivers (household_id, user_id, name, emoji)
    values (v_household, auth.uid(), p_caregiver_name, p_caregiver_emoji);
  insert into pets (household_id, name, species, emoji)
    values (v_household, p_pet_name, p_pet_species, p_pet_emoji);

  return v_household;
end;
$$;

-- Unirse a un hogar con código de un solo uso (F4)
create or replace function public.accept_invite(
  p_code text,
  p_name text,
  p_emoji text
) returns uuid
language plpgsql security definer
set search_path = public
as $$
declare
  v_invite record;
begin
  if auth.uid() is null then
    raise exception 'No autenticado';
  end if;

  select * into v_invite
  from invites
  where code = upper(p_code)
  for update;

  if v_invite is null then
    raise exception 'Código no válido';
  end if;
  if v_invite.used_at is not null then
    raise exception 'Este código ya se ha usado';
  end if;
  if v_invite.expires_at < now() then
    raise exception 'Este código ha caducado';
  end if;

  insert into caregivers (household_id, user_id, name, emoji)
    values (v_invite.household_id, auth.uid(), p_name, p_emoji);

  update invites set used_by = auth.uid(), used_at = now()
    where id = v_invite.id;

  return v_invite.household_id;
end;
$$;

revoke execute on function public.create_household from anon, public;
revoke execute on function public.accept_invite from anon, public;
grant execute on function public.create_household to authenticated;
grant execute on function public.accept_invite to authenticated;

-- ============================================================
-- Realtime: cambios visibles en otros dispositivos < 2 s (PRD §7)
-- ============================================================

alter publication supabase_realtime add table
  public.caregivers,
  public.pets,
  public.medications,
  public.schedules,
  public.dose_logs;
