# RecorrênciaOS v3.3 — Supabase

Painel interno para gestão de clientes recorrentes com problemas de conexão, contatos, ordens de serviço e agora também com **gestão administrativa de usuários**.

## Stack

- Next.js (App Router)
- TypeScript
- Tailwind CSS
- componentes estilo shadcn/ui
- Supabase Auth
- Supabase Database com RLS
- `@supabase/ssr` para sessão via cookies

## Como rodar localmente

1. Instale as dependências:

   ```bash
   npm install
   ```

2. Copie o arquivo de ambiente:

   ```bash
   cp .env.example .env.local
   ```

   No Windows:

   ```powershell
   copy .env.example .env.local
   ```

3. Preencha `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` e `NEXT_PUBLIC_APP_URL`.

4. No projeto Supabase, abra o **SQL Editor** e execute o arquivo `database/schema.sql`.

   Se você já tinha uma versão anterior rodando, execute também `database/update-v3.3-admin-users.sql`.

5. Rode o projeto:

   ```bash
   npm run dev
   ```

6. Acesse `http://localhost:3000`.

## O que a versão 3.3 entrega

- área **Configurações** funcional e restrita a `ADMIN`
- listagem de usuários do Supabase
- busca por nome e e-mail
- alteração de cargo (`ADMIN`, `SUPERVISOR`, `ATTENDANT`)
- ativação e desativação de usuários
- confirmação antes de alterar cargo ou status
- bloqueio de acesso para usuários inativos
- experiência responsiva para desktop e celular

## Como atualizar um projeto que já estava funcionando

1. Baixe a nova versão e substitua os arquivos do projeto antigo.
2. Rode:

   ```bash
   npm install
   ```

3. No Supabase, abra o **SQL Editor** e execute:

   ```txt
   database/update-v3.3-admin-users.sql
   ```

4. Faça um novo deploy na Vercel.
5. Teste com uma conta `ADMIN` na aba **Configurações**.

## Deploy na Vercel

1. Suba este projeto em um repositório no GitHub.
2. Importe o repositório na Vercel.
3. Em **Settings > Environment Variables**, cadastre:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - `NEXT_PUBLIC_APP_URL` com a URL final do projeto, por exemplo `https://seu-projeto.vercel.app`
4. Faça o deploy.
5. No Supabase, ajuste:
   - **Authentication > URL Configuration > Site URL** para a URL final da Vercel
   - **Redirect URLs** para incluir a URL final e, se quiser preview, `https://*.vercel.app/**`
6. No **SQL Editor** do Supabase:
   - projeto novo: execute `database/schema.sql`
   - projeto já existente: execute `database/update-v3.3-admin-users.sql`

## Estrutura principal

```txt
src/
  app/
    (auth)/
      login/
      register/
    (app)/
      dashboard/
      clientes/
      fila/
      configuracoes/
  components/
    auth/
    brand/
    clientes/
    configuracoes/
    dashboard/
    layout/
    providers/
    ui/
  lib/
    auth/
    supabase/
    client-helpers.ts
    mock-data.ts
    navigation.ts
    utils.ts
  types/
public/
  logo-recorrenciaos.svg
database/
  schema.sql
  update-v3.3-admin-users.sql
```

## Banco de dados

O arquivo `database/schema.sql` cria:

- `profiles`
- `clients`
- `client_history`
- `client_notes`
- trigger automático para criar perfil após cadastro no Auth
- políticas RLS iniciais
- políticas de atualização administrativa para gestão de usuários

## Autenticação

- login com e-mail e senha
- registro com criação automática de perfil `ATTENDANT`
- logout
- proteção de rotas internas
- controle de acesso por perfil (`ADMIN`, `SUPERVISOR`, `ATTENDANT`)
- bloqueio de navegação para contas inativas

## Observações importantes

- Para um fluxo mais simples em desenvolvimento, você pode desativar a confirmação de e-mail no Supabase Auth.
- A página de configurações exige perfil `ADMIN`.
- A gestão de usuários depende de executar o SQL de atualização no Supabase.
