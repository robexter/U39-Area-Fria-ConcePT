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


## Versão v7 — correção da E-3914

A URL do módulo E-3914 foi corrigida para corresponder exatamente ao nome
do repositório GitHub Pages:

`https://robexter.github.io/E-3914-Concept/`

O GitHub Pages diferencia maiúsculas/minúsculas no caminho. A versão anterior
usava `E-3914-concept`, fazendo o módulo não abrir corretamente.


## Versão v8 — segundo modelo de edição

Esta versão implementa dois níveis de edição:

### 1. Rascunho pessoal
- continua salvo somente no navegador/dispositivo do usuário;
- não altera o conteúdo dos demais usuários;
- o rascunho pessoal prevalece sobre a versão oficial naquele aparelho.

### 2. Publicação oficial
Somente uma conta com `role='admin'` recebe no visualizador os botões:
- `🌐 Publicar edição`
- `🌐 Publicar lâmpadas`

Ao publicar, o conteúdo é salvo no Supabase e passa a ser a versão oficial
exibida para todos os usuários autenticados que não possuam um rascunho pessoal
daquele mesmo item.

O botão `↩ Versão oficial` descarta o rascunho pessoal do item atual e volta
para a versão publicada pelo administrador.

### Ativação no Supabase
Antes de usar a publicação oficial, execute:
`migration_official_edits.sql`

no **SQL Editor** do projeto Supabase.

A publicação oficial funciona para as one pages quando elas são abertas dentro
do portal central `U39 Area Fria Concept`. Os links individuais das one pages
continuam independentes.


## Versão v9 — correção da publicação de textos

A v8 conseguia publicar as posições das lâmpadas, porém várias one pages
mais antigas usam os elementos `#body`, `#title` e `#subtitle` no painel.
A v9 reconhece tanto esse padrão quanto `#panelBody`, `#panelTitle` e
`#panelSubtitle`.

Com isso, o portal passa a:
- capturar corretamente o texto editado;
- publicar o texto no Supabase como versão oficial;
- carregar a versão oficial em outros aparelhos.

Não é necessário executar novo SQL se `migration_official_edits.sql`
já foi executado com sucesso.


## Versão v10 — correção reforçada do salvamento/publicação de texto

A v10 resolve o caso em que a posição das lâmpadas era publicada, mas o texto
editado não era localizado pelo portal.

Melhorias:
- memoriza o item já no toque/clique da lâmpada;
- reconhece o painel de texto antigo e novo;
- intercepta o botão "Salvar alterações" das one pages;
- mostra confirmação no portal: "Rascunho de texto salvo neste aparelho";
- mantém o último item editado mesmo que o painel perca a referência;
- "Publicar edição" usa o conteúdo aberto ou, como fallback, o último rascunho;
- após a publicação, o texto é salvo em `official_page_edits` e fica disponível
  para os outros aparelhos.

Não é necessário executar novo SQL se a migration da v8 já foi executada.


## Versão v11 — correção específica E-3914 + salvamento universal

A E-3914 usa um terceiro padrão de painel:
- `#drawerBody`
- `#drawerTitle`
- `#drawerSub`

A v11 adiciona suporte a esse padrão e também reforça o sistema para não
depender apenas do botão nativo da one page.

Novidades:
- E-3914 reconhecida corretamente;
- botão nativo `Salvar alterações` passa a gerar o rascunho do portal;
- autosave silencioso durante a digitação;
- novo botão central `💾 Salvar texto`;
- `🌐 Publicar edição` captura/salva o texto atual automaticamente;
- `Ver fluxo completo` da E-3914 é identificado como item `flow`;
- durante o modo edição, um toque simples na lâmpada continua abrindo o item;
  somente um arraste real bloqueia o clique.

Não é necessário executar novo SQL.


## Versão v12 — padronização universal das one pages

Foi feita uma auditoria das 11 one pages do portal. Foram encontrados três
padrões de estrutura de texto. A v12 cria um adaptador universal que normaliza
todas elas, em tempo de execução, para o mesmo contrato interno do portal.

Com isso:
- o Modo edição libera texto e lâmpadas em qualquer uma das 11 páginas;
- `💾 Salvar texto` não depende do botão interno da one page;
- o botão interno `Salvar alterações`, quando existe, também é reconhecido;
- o rascunho é salvo automaticamente durante a digitação;
- `🌐 Publicar edição` usa o mesmo padrão para todas as páginas;
- E-3904/05, E-3914 e as páginas com `panelBody` passam a ser tratadas de forma idêntica;
- novas páginas com classes equivalentes ainda têm um fallback genérico.

Nenhum novo SQL é necessário.


## Versão v13 — sincronização efetiva entre aparelhos

Correções:
- sincroniza `official_page_edits` automaticamente a cada 4 segundos enquanto
  uma one page está aberta;
- sincroniza ao tocar em uma lâmpada/atalho antes de exibir o texto;
- sincroniza ao voltar para o aplicativo ou navegador;
- adiciona botão `🔄 Sincronizar`;
- após `🌐 Publicar edição`, relê o registro do Supabase e só confirma sucesso
  se o conteúdo gravado for encontrado;
- uma publicação oficial mais nova passa a ter prioridade sobre um rascunho
  pessoal antigo do celular;
- remove a migração automática de localStorage legado, que podia esconder
  conteúdo oficial novo;
- mantém rascunhos novos do usuário, mas uma publicação oficial posterior
  passa a ser exibida automaticamente.

Nenhum novo SQL é necessário.
