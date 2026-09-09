-- ==========================================================
-- U39 AREA FRIA CONCEPT
-- MIGRATION: LIBERAÇÃO REMOTA DE USUÁRIOS PELO ADMINISTRADOR
-- Execute UMA VEZ no SQL Editor do seu projeto Supabase.
-- Pode ser executada novamente com segurança.
-- ==========================================================

-- 1) Adiciona os campos de autorização.
DO $$
DECLARE
  primeira_instalacao boolean;
BEGIN
  SELECT NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema='public'
      AND table_name='profiles'
      AND column_name='access_status'
  ) INTO primeira_instalacao;

  IF primeira_instalacao THEN
    ALTER TABLE public.profiles
      ADD COLUMN access_status text NOT NULL DEFAULT 'pending',
      ADD COLUMN approved_at timestamptz,
      ADD COLUMN approved_by uuid REFERENCES public.profiles(id),
      ADD COLUMN access_updated_at timestamptz NOT NULL DEFAULT now();

    -- Preserva o acesso de quem JÁ estava cadastrado antes desta atualização.
    UPDATE public.profiles
    SET access_status='approved',
        approved_at=COALESCE(approved_at, now()),
        access_updated_at=now();
  ELSE
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS approved_at timestamptz;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS approved_by uuid REFERENCES public.profiles(id);
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS access_updated_at timestamptz NOT NULL DEFAULT now();
  END IF;
END $$;

-- 2) Valida os únicos estados permitidos.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname='profiles_access_status_check'
      AND conrelid='public.profiles'::regclass
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_access_status_check
      CHECK (access_status IN ('pending','approved','blocked'));
  END IF;
END $$;

-- 3) Garante que administradores existentes permaneçam liberados.
UPDATE public.profiles
SET access_status='approved',
    approved_at=COALESCE(approved_at, now()),
    access_updated_at=now()
WHERE role='admin';

-- 4) Função segura: somente admin pode liberar/bloquear outro usuário.
CREATE OR REPLACE FUNCTION public.set_user_access(
  target_user_id uuid,
  new_status text
)
RETURNS public.profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updated_profile public.profiles;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Apenas administradores podem alterar o acesso.';
  END IF;

  IF new_status NOT IN ('pending','approved','blocked') THEN
    RAISE EXCEPTION 'Status de acesso inválido.';
  END IF;

  IF target_user_id = auth.uid() AND new_status <> 'approved' THEN
    RAISE EXCEPTION 'O administrador não pode bloquear a própria conta.';
  END IF;

  UPDATE public.profiles
  SET access_status = new_status,
      approved_at = CASE WHEN new_status='approved' THEN now() ELSE approved_at END,
      approved_by = CASE WHEN new_status='approved' THEN auth.uid() ELSE approved_by END,
      access_updated_at = now()
  WHERE id = target_user_id
  RETURNING * INTO updated_profile;

  IF updated_profile.id IS NULL THEN
    RAISE EXCEPTION 'Usuário não encontrado.';
  END IF;

  RETURN updated_profile;
END;
$$;

REVOKE ALL ON FUNCTION public.set_user_access(uuid,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_user_access(uuid,text) TO authenticated;

-- 5) Mantém profiles protegido: membros leem o próprio perfil; admin lê todos.
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profile own read" ON public.profiles;
CREATE POLICY "profile own read" ON public.profiles
FOR SELECT USING (id = auth.uid() OR public.is_admin());

-- Nenhum membro recebe UPDATE direto em profiles.
-- A mudança pending/approved/blocked ocorre exclusivamente pela função acima.
REVOKE UPDATE ON public.profiles FROM anon, authenticated;
GRANT SELECT ON public.profiles TO authenticated;

-- 6) Confirmação opcional do estado atual.
SELECT username, display_name, role, access_status, approved_at
FROM public.profiles
ORDER BY created_at;
