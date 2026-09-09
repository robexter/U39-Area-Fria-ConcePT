-- ==========================================================
-- U39 AREA FRIA CONCEPT — EDIÇÃO OFICIAL COMPARTILHADA
-- Execute UMA VEZ no SQL Editor do Supabase.
-- ==========================================================

create table if not exists public.official_page_edits (
  module_id text not null,
  item_id text not null,
  title text,
  subtitle text,
  content_html text not null,
  updated_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now(),
  primary key (module_id,item_id)
);

create table if not exists public.official_lamp_layouts (
  module_id text primary key,
  positions jsonb not null default '{}'::jsonb,
  updated_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now()
);

alter table public.official_page_edits enable row level security;
alter table public.official_lamp_layouts enable row level security;

-- Qualquer membro autenticado/liberado pode LER a versão oficial.
drop policy if exists "official edits authenticated read" on public.official_page_edits;
create policy "official edits authenticated read"
on public.official_page_edits
for select
to authenticated
using (true);

drop policy if exists "official lamps authenticated read" on public.official_lamp_layouts;
create policy "official lamps authenticated read"
on public.official_lamp_layouts
for select
to authenticated
using (true);

-- Somente ADMIN pode publicar, alterar ou apagar conteúdo oficial.
drop policy if exists "official edits admin insert" on public.official_page_edits;
create policy "official edits admin insert"
on public.official_page_edits
for insert
to authenticated
with check (public.is_admin());

drop policy if exists "official edits admin update" on public.official_page_edits;
create policy "official edits admin update"
on public.official_page_edits
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "official edits admin delete" on public.official_page_edits;
create policy "official edits admin delete"
on public.official_page_edits
for delete
to authenticated
using (public.is_admin());

drop policy if exists "official lamps admin insert" on public.official_lamp_layouts;
create policy "official lamps admin insert"
on public.official_lamp_layouts
for insert
to authenticated
with check (public.is_admin());

drop policy if exists "official lamps admin update" on public.official_lamp_layouts;
create policy "official lamps admin update"
on public.official_lamp_layouts
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "official lamps admin delete" on public.official_lamp_layouts;
create policy "official lamps admin delete"
on public.official_lamp_layouts
for delete
to authenticated
using (public.is_admin());

grant select on public.official_page_edits to authenticated;
grant select,insert,update,delete on public.official_page_edits to authenticated;

grant select on public.official_lamp_layouts to authenticated;
grant select,insert,update,delete on public.official_lamp_layouts to authenticated;
