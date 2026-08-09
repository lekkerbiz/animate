-- AniMate — calendario de tomas y eventos
--
-- El modelo anterior solo sabía responder sobre HOY: las pautas no tenían
-- vigencia, las tomas no guardaban de qué eran y no había forma de anotar una
-- toma fallida ni nada que no fuese medicación. Esta migración hace posible
-- preguntar "qué estaba previsto el día D y qué pasó realmente".

-- ============================================================
-- Vigencia de las pautas
-- ============================================================

alter table public.medications
  -- una pauta genera tomas entre estas dos fechas; sin fin = indefinida
  add column starts_on date,
  add column ends_on   date;

-- Las medicinas que ya existen empezaron el día que se crearon
update public.medications set starts_on = created_at::date where starts_on is null;

-- A partir de aquí la vigencia la deciden las fechas, no el booleano. Una
-- medicina desactivada equivale a una pauta terminada hoy: deja de generar
-- tomas de mañana en adelante, pero su historial sigue siendo válido.
update public.medications set ends_on = current_date where active = false and ends_on is null;

alter table public.medications
  alter column starts_on set not null,
  alter column starts_on set default current_date;

alter table public.medications
  add constraint medications_range_check
    check (ends_on is null or ends_on >= starts_on);

-- ============================================================
-- Registro de tomas: qué se dio, de qué era y qué pasó
-- ============================================================

alter table public.dose_logs
  -- 'dada' era el único caso posible antes: no existía forma de registrar un fallo
  add column status text not null default 'dada',
  -- copia del momento de la toma: si mañana se borra la medicina o se cambia la
  -- pauta, el historial tiene que seguir contando qué se dio exactamente
  add column medication_name text,
  add column medication_dose text,
  add column scheduled_time  time,
  -- denormalizado para poder pintar el calendario de una mascota sin joins
  add column pet_id uuid references public.pets(id) on delete cascade;

alter table public.dose_logs
  add constraint dose_logs_status_check
    check (status in ('dada', 'omitida', 'rechazada'));

update public.dose_logs d
set medication_name = m.name,
    medication_dose = m.dose,
    scheduled_time  = s.time,
    pet_id          = m.pet_id
from public.schedules s
join public.medications m on m.id = s.medication_id
where d.schedule_id = s.id
  and d.medication_name is null;

create index dose_logs_pet_date_idx on public.dose_logs (pet_id, date);

-- ============================================================
-- Eventos: síntomas, visitas, vacunas, peso...
-- ============================================================

create table public.events (
  id           uuid primary key default gen_random_uuid(),
  -- household_id denormalizado igual que en dose_logs: RLS simple y
  -- suscripción Realtime por hogar sin joins
  household_id uuid not null references public.households(id) on delete cascade,
  pet_id       uuid not null references public.pets(id) on delete cascade,
  kind         text not null,
  -- fecha obligatoria y hora opcional: muchos eventos se anotan a posteriori
  -- ("el martes vomitó") sin recordar el momento exacto
  occurred_on  date not null,
  occurred_at  time,
  title        text not null,
  notes        text,
  -- para eventos medibles (peso en kg, temperatura en ºC); nulos en el resto
  value        numeric(8, 2),
  unit         text,
  created_by   uuid references public.caregivers(id) on delete set null,
  created_at   timestamptz not null default now()
);

alter table public.events
  add constraint events_kind_check
    check (kind in ('sintoma', 'visita', 'vacuna', 'peso', 'otro'));

create index events_pet_occurred_idx on public.events (pet_id, occurred_on desc);
create index events_household_occurred_idx on public.events (household_id, occurred_on desc);

alter table public.events enable row level security;

create policy "members full access events" on public.events
  for all using (public.is_household_member(household_id))
  with check (public.is_household_member(household_id));

alter publication supabase_realtime add table public.events;
