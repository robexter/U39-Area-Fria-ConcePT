-- ==========================================================
-- U39 AREA FRIA CONCEPT v14
-- CORREÇÃO DE SINCRONIZAÇÃO DE TEXTO OFICIAL ENTRE USUÁRIOS
--
-- Execute UMA VEZ no SQL Editor do Supabase.
-- Esta migration:
-- 1) garante RLS/grants da tabela official_page_edits;
-- 2) cria uma função segura para leitura por usuários aprovados;
-- 3) mantém escrita oficial somente para administrador.
-- ==========================================================

-- Garante a estrutura da tabela
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

alter table public.official_page_edits enable row level security;

-- Recria explicitamente as políticas para evitar policy antiga/incompleta.
drop policy if exists "official edits authenticated read" on public.official_page_edits;
drop policy if exists "official edits approved read" on public.official_page_edits;
drop policy if exists "official edits admin insert" on public.official_page_edits;
drop policy if exists "official edits admin update" on public.official_page_edits;
drop policy if exists "official edits admin delete" on public.official_page_edits;

-- Usuário autenticado só lê se estiver aprovado ou for admin.
create policy "official edits approved read"
on public.official_page_edits
for select
to authenticated
using (
  public.is_admin()
  or exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.access_status = 'approved'
  )
);

create policy "official edits admin insert"
on public.official_page_edits
for insert
to authenticated
with check (public.is_admin());

create policy "official edits admin update"
on public.official_page_edits
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "official edits admin delete"
on public.official_page_edits
for delete
to authenticated
using (public.is_admin());

grant select, insert, update, delete on public.official_page_edits to authenticated;

-- Função de leitura robusta.
-- SECURITY DEFINER evita que uma configuração inconsistente da policy de SELECT
-- impeça a sincronização, mas a própria função valida se o usuário está aprovado.
create or replace function public.get_official_page_edits(p_module_id text)
returns table (
  module_id text,
  item_id text,
  title text,
  subtitle text,
  content_html text,
  updated_at timestamptz,
  updated_by uuid
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'authentication required';
  end if;

  if not (
    public.is_admin()
    or exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.access_status = 'approved'
    )
  ) then
    raise exception 'user is not approved';
  end if;

  return query
  select
    e.module_id,
    e.item_id,
    e.title,
    e.subtitle,
    e.content_html,
    e.updated_at,
    e.updated_by
  from public.official_page_edits e
  where e.module_id = p_module_id
  order by e.item_id;
end;
$$;

revoke all on function public.get_official_page_edits(text) from public;
grant execute on function public.get_official_page_edits(text) to authenticated;

-- Atualiza updated_at automaticamente em updates futuros.
create or replace function public.set_official_edit_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_official_page_edits_updated_at
on public.official_page_edits;

create trigger trg_official_page_edits_updated_at
before update on public.official_page_edits
for each row
execute function public.set_official_edit_updated_at();

-- Diagnóstico opcional após executar:
-- select * from public.official_page_edits order by updated_at desc;
