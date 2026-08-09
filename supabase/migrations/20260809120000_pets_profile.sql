-- AniMate — ficha de mascota
-- Amplía public.pets con los datos que pinta la ficha del Figma
-- (frames «iPhone 17 - 1» 2063:3065 y «iPhone 17 - 7» 2065:5442)
-- y añade el bucket privado donde vive la foto de cabecera.

-- ============================================================
-- Campos de la ficha
-- ============================================================

alter table public.pets
  add column breed      text,
  add column sex        text,
  add column birth_date date,
  add column weight_kg  numeric(5, 2),
  add column height_cm  numeric(5, 1),
  add column color      text,
  -- texto libre bajo las características ("Dante es el rey de la casa...")
  add column bio        text,
  -- la ficha pinta cada rasgo en su propia fila, no como un párrafo
  add column behavior   text[] not null default '{}',
  -- nº de chip ISO 11784/11785; el alta puede leerlo por NFC
  add column microchip  text,
  -- ruta dentro del bucket, no una URL: el bucket es privado y se firma al leer
  add column photo_path text;

alter table public.pets
  add constraint pets_sex_check
    check (sex is null or sex in ('macho', 'hembra', 'desconocido')),
  add constraint pets_weight_check
    check (weight_kg is null or weight_kg > 0),
  add constraint pets_height_check
    check (height_cm is null or height_cm > 0);

-- ============================================================
-- Foto de la mascota
-- ============================================================

-- Devuelve null en vez de reventar si el texto no es un uuid: las políticas de
-- abajo lo aplican sobre rutas que escribe el cliente, y un cast directo
-- abortaría la consulta en lugar de denegar el acceso.
create or replace function public.try_uuid(value text)
returns uuid
language plpgsql immutable
as $$
begin
  return value::uuid;
exception when others then
  return null;
end;
$$;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'pet-photos',
  'pet-photos',
  false,
  5242880, -- 5 MB
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic']
)
on conflict (id) do nothing;

-- Convención de ruta: {household_id}/{pet_id}/{fichero}
-- La primera carpeta es el hogar, así reusamos is_household_member y la foto
-- queda aislada por hogar igual que el resto de tablas (PRD §7).
create policy "members read pet photos" on storage.objects
  for select using (
    bucket_id = 'pet-photos'
    and public.is_household_member(public.try_uuid((storage.foldername(name))[1]))
  );

create policy "members upload pet photos" on storage.objects
  for insert with check (
    bucket_id = 'pet-photos'
    and public.is_household_member(public.try_uuid((storage.foldername(name))[1]))
  );

create policy "members update pet photos" on storage.objects
  for update using (
    bucket_id = 'pet-photos'
    and public.is_household_member(public.try_uuid((storage.foldername(name))[1]))
  );

create policy "members delete pet photos" on storage.objects
  for delete using (
    bucket_id = 'pet-photos'
    and public.is_household_member(public.try_uuid((storage.foldername(name))[1]))
  );
