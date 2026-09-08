
-- ==========================================================
-- U39 AREA FRIA CONCEPT
-- Banco para cadastro, login, progresso e painel de acessos
-- ==========================================================

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  display_name text,
  role text not null default 'member' check (role in ('member','admin')),
  created_at timestamptz not null default now()
);

create table if not exists public.module_progress (
  user_id uuid not null references public.profiles(id) on delete cascade,
  module_id text not null,
  visited boolean not null default false,
  completed boolean not null default false,
  favorite boolean not null default false,
  last_opened_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (user_id,module_id)
);

create table if not exists public.access_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  started_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  ended_at timestamptz,
  current_module text,
  user_agent text
);

create index if not exists access_sessions_user_idx on public.access_sessions(user_id);
create index if not exists access_sessions_last_seen_idx on public.access_sessions(last_seen_at desc);

-- Cria automaticamente o perfil depois do cadastro no Auth.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles(id,username,display_name)
  values(
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email,'@',1)),
    coalesce(new.raw_user_meta_data->>'display_name', new.raw_user_meta_data->>'username')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- Função segura para verificar papel de administrador.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists(
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

alter table public.profiles enable row level security;
alter table public.module_progress enable row level security;
alter table public.access_sessions enable row level security;

-- PROFILES
drop policy if exists "profile own read" on public.profiles;
create policy "profile own read" on public.profiles
for select using (id = auth.uid() or public.is_admin());

-- PROGRESS
drop policy if exists "progress own all" on public.module_progress;
create policy "progress own all" on public.module_progress
for all using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "admin progress read" on public.module_progress;
create policy "admin progress read" on public.module_progress
for select using (public.is_admin());

-- SESSIONS
drop policy if exists "session own insert" on public.access_sessions;
create policy "session own insert" on public.access_sessions
for insert with check (user_id = auth.uid());

drop policy if exists "session own update" on public.access_sessions;
create policy "session own update" on public.access_sessions
for update using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "session own read" on public.access_sessions;
create policy "session own read" on public.access_sessions
for select using (user_id = auth.uid() or public.is_admin());

-- Depois de criar SUA conta, transforme-a em administrador:
-- UPDATE public.profiles SET role='admin' WHERE username='SEU_LOGIN';


-- ==========================================================
-- ADMINISTRADOR PADRÃO
-- Login visual: admin
-- E-mail técnico usado pelo Supabase Auth: admin@u39concept.app
--
-- IMPORTANTE:
-- A senha NÃO deve ser gravada neste arquivo SQL nem no JavaScript.
-- Crie o usuário admin@u39concept.app no painel Authentication > Users
-- com a senha definida pelo proprietário do projeto e depois execute:
--
-- UPDATE public.profiles
-- SET username='admin', display_name='Administrador', role='admin'
-- WHERE id = (SELECT id FROM auth.users WHERE email='admin@u39concept.app');
-- ==========================================================


-- ==========================================================
-- PERMISSÕES EXPLÍCITAS PARA O CLIENTE WEB
-- ==========================================================
grant usage on schema public to authenticated;

grant select on public.profiles to authenticated;
grant select, insert, update on public.module_progress to authenticated;
grant select, insert, update on public.access_sessions to authenticated;

-- SEGURANÇA:
-- Usuários comuns NÃO recebem permissão RLS para alterar profiles.role.
-- A promoção para administrador deve ser feita apenas pelo SQL Editor
-- usando a conta de banco do proprietário do projeto.


-- ==========================================================
-- CONTROLE REMOTO DE ACESSO - VERSÃO ATUAL
-- ==========================================================
-- Para instalação nova ou atualização, execute também o conteúdo de migration_access_approval.sql.


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
