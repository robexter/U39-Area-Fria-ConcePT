# U39 Area Fria Concept

Portal PWA central que reúne as one pages da Área Fria da U-39.

## Módulos incluídos
1. E-3904/05 — Absorvedora Primária e Retificadora
2. E-3906 — Absorvedora Secundária
3. E-3907 — Desbutanizadora
4. E-3908 — Desetanizadora
5. E-3909 — Despropanizadora
6. E-3910 — Despropenizadora
7. E-3911 — Absorvedora de H₂S do Gás Combustível
8. E-3912 — Extratora de H₂S do GLP
9. E-3913 — Retificadora de DEA
10. E-3914 — Tratamento Merox do GLP
11. Merox Gasolina — Tratamento Merox da Gasolina

## O que já está pronto
- Cadastro de membro com login + senha
- Acesso imediato, sem aprovação do administrador
- Login por nome de usuário
- Portal com cards, busca, sequência, favoritos e progresso
- Visualizador integrado com Anterior / Próximo / Início
- PWA instalável
- Área de administrador oculta
- Registro de sessão, último acesso, usuário online, módulo atual e tempo acumulado

## Como funciona o cadastro
O portal usa Supabase Auth internamente. O usuário digita apenas um `login`.
O app transforma esse login em um e-mail técnico interno no formato:

`login@u39concept.app`

Por isso, no Supabase, desative a exigência de confirmação de e-mail:
**Authentication > Providers > Email > Confirm email = OFF**

Isso permite cadastro e acesso imediato, sem liberação de administrador.

## Configuração do Supabase
1. Crie um projeto Supabase.
2. Abra **SQL Editor**.
3. Execute todo o arquivo `schema.sql`.
4. Em **Authentication > Providers > Email**, deixe cadastro por e-mail habilitado e desative confirmação de e-mail.
5. Abra **Settings > API**.
6. Copie:
   - Project URL
   - Publishable key
7. Edite `supabase-config.js` e substitua os dois valores.

## Tornar sua conta administradora
Primeiro cadastre sua própria conta normalmente pelo app.

Depois execute no SQL Editor:

```sql
UPDATE public.profiles
SET role='admin'
WHERE username='SEU_LOGIN';
```

## Como abrir a área administrativa oculta
A área admin não aparece no menu normal.

Com uma conta cujo `role='admin'`:
- toque **7 vezes rapidamente no logotipo U39** no canto superior esquerdo.

A segurança real NÃO depende desse esconderijo. As políticas RLS do Supabase impedem usuários comuns de consultar as sessões de outras pessoas.

## O painel admin mostra
- membros cadastrados
- quem está online
- módulo atual
- última atividade
- tempo acumulado de acesso
- número de sessões

O portal atualiza `last_seen_at` aproximadamente a cada 60 segundos.
Um usuário é considerado online se sua última atividade tiver ocorrido há menos de ~130 segundos.

## Publicar no GitHub Pages
Envie **todos os arquivos e a pasta `icons`** para a raiz do repositório.

Depois:
**Settings > Pages > Deploy from branch > main > /(root)**

## Atualização de cache
Se publicar uma nova versão e o celular mantiver a anterior, altere em `sw.js`:

`u39-area-fria-concept-v1`

para:

`u39-area-fria-concept-v2`

e publique novamente.

## Observação sobre E-3914
O portal está configurado para:
`https://robexter.github.io/E-3914-concept/`

Se o seu repositório da E-3914 usar outra capitalização/endereço, edite a URL no array `MODULES` dentro de `app.js`.


## Administrador oculto

O portal foi configurado para usar:

- Login administrativo visível: `admin`
- E-mail técnico interno do Supabase: `admin@u39concept.app`

Por segurança, **a senha do administrador não fica escrita no HTML, JavaScript ou SQL**. Isso evita que qualquer pessoa que abra o código-fonte do GitHub descubra a senha.

### Como criar o administrador

No Supabase:

1. Vá em **Authentication > Users > Add user**.
2. Crie o usuário:
   - Email: `admin@u39concept.app`
   - Password: use a senha administrativa definida por você.
   - Marque o usuário como confirmado.
3. Depois execute no **SQL Editor**:

```sql
UPDATE public.profiles
SET username='admin',
    display_name='Administrador',
    role='admin'
WHERE id = (
  SELECT id
  FROM auth.users
  WHERE email='admin@u39concept.app'
);
```

### Como abrir a área administrativa

A área administrativa continua oculta:

1. Entre normalmente no portal.
2. Toque **7 vezes rapidamente no logotipo U39**.
3. Será aberta a tela de login administrativo.
4. Use `admin` e a senha administrativa.

O painel mostra:
- usuários online;
- módulo que cada usuário está visualizando;
- última atividade;
- tempo total acumulado;
- quantidade de sessões.



## Segurança do perfil administrativo

O `schema.sql` desta versão foi endurecido para impedir que um membro comum altere o próprio campo `role` para `admin`. A promoção de administrador deve ser feita somente pelo **SQL Editor** do Supabase.


## Supabase configurado

Este pacote já está configurado com a Project URL e a Publishable Key fornecidas para o projeto Supabase.
Não é necessário editar `supabase-config.js` antes de publicar no GitHub Pages.


## Nova versão: liberação remota pelo administrador

O cadastro de novos membros agora funciona assim:

`Cadastro → Pendente → Administrador libera → Acesso ao portal`

### Atualização obrigatória no Supabase
Antes de publicar esta versão no GitHub Pages:

1. Abra **Supabase > SQL Editor > New Query**.
2. Abra o arquivo `migration_access_approval.sql` deste pacote.
3. Copie todo o conteúdo e clique em **Run**.
4. Confirme que a consulta final mostra a coluna `access_status`.

A migration preserva como **approved** os usuários que já existiam antes da atualização. Novos cadastros passam a nascer como **pending**.

### Painel administrativo
Com a conta `admin`, abra a área oculta tocando 7 vezes no logotipo U39. O painel permite:

- **Liberar acesso** de usuários pendentes;
- **Bloquear** usuários já liberados;
- **Liberar novamente** um usuário bloqueado;
- ver quem está online;
- ver o módulo atual;
- acompanhar última atividade, tempo total e quantidade de sessões.

O usuário pendente verifica automaticamente a autorização a cada 15 segundos. Se um usuário já conectado for bloqueado, o aplicativo verifica o status durante a sessão e o remove do portal em aproximadamente até 1 minuto.


## Correção v4 — configuração Supabase

A versão v4 não depende mais do carregamento de `supabase-config.js`.
A Project URL e a Publishable Key públicas foram incorporadas diretamente em `app.js`.

Isso evita o erro de "Configuração pendente" causado por uma versão antiga de
`supabase-config.js` mantida no cache do navegador/PWA.

O Service Worker foi atualizado para `u39-area-fria-concept-v4`.


## Correção v5 — limpeza automática de cache

A versão v5 removeu completamente o bloqueio que exibia a mensagem
`Configuração pendente`.

A configuração pública do Supabase está incorporada diretamente em `app.js`.

Na primeira abertura da versão v5, o portal:
1. remove Service Workers antigos;
2. apaga caches antigos do PWA;
3. recarrega a página com `?v=5`;
4. carrega `app.js?v=5`;
5. registra o novo Service Worker `u39-area-fria-concept-v5`.

Isso foi feito especificamente para eliminar versões antigas mantidas pelo navegador.


## Versão v6 — edição universal das lâmpadas

Ao abrir qualquer one page pelo visualizador integrado do portal, a barra inferior agora possui:

- `✏️ Modo edição`: ativa o arraste das lâmpadas/hotspots da one page.
- `↺ Restaurar lâmpadas`: remove as posições personalizadas e retorna ao layout original daquela página.

As posições são salvas automaticamente no `localStorage`, separadamente para cada módulo.
A função atua no portal central e não exige alterar individualmente os repositórios das one pages,
desde que elas estejam hospedadas no mesmo domínio `robexter.github.io`.

Quando a one page já possui seu próprio botão `Modo edição`, o portal procura sincronizar o modo
nativo (edição de texto) com o modo universal de reposicionamento das lâmpadas.
