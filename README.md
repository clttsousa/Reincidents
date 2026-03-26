# RecorrênciaOS v3.7 — gestão administrativa + dashboard inteligente

Painel interno para gestão de clientes recorrentes com problemas de conexão, contatos, ordens de serviço, timeline por cliente, gestão administrativa de usuários e agora também com **auditoria administrativa** e **dashboard com métricas acionáveis**.

## Stack

- Next.js (App Router)
- TypeScript
- Tailwind CSS
- componentes estilo shadcn/ui
- Supabase Auth
- Supabase Database com RLS
- `@supabase/ssr` para sessão via cookies

## O que a versão 3.6 + 3.7 entrega

### v3.6 — gestão de usuários mais madura

- filtros por cargo e status na área de usuários
- trilha de auditoria administrativa em `admin_audit_log`
- histórico recente de promoções, reativações e desativações
- toasts de sucesso/erro na área administrativa
- painel de configuração mais útil para admins

### v3.7 — dashboard mais inteligente

- cards clicáveis com filtros prontos para `/clientes`
- métricas operacionais extras:
  - atualizações hoje
  - resolvidos em 7 dias
  - próximas ações vencidas
  - sem responsável
- distribuição por status com barras visuais
- ranking de carga por responsável
- filtros da página de clientes pré-carregados por query string (`view=...`)

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

   Se você já tinha uma versão anterior rodando, execute em sequência:

   ```txt
   database/update-v3.3-admin-users.sql
   database/update-v3.5-operacional.sql
   database/update-v3.7-admin-dashboard.sql
   ```

5. Rode o projeto:

   ```bash
   npm run dev
   ```

6. Acesse `http://localhost:3000`.

## Como atualizar um projeto que já estava funcionando

1. Baixe a nova versão e substitua os arquivos do projeto antigo.
2. Rode:

   ```bash
   npm install
   ```

3. No Supabase, abra o **SQL Editor** e execute nesta ordem:

   ```txt
   database/update-v3.3-admin-users.sql
   database/update-v3.5-operacional.sql
   database/update-v3.7-admin-dashboard.sql
   ```

4. Reinicie o projeto local com `npm run dev`.
5. Teste com uma conta `ADMIN`:
   - `/configuracoes`
   - `/dashboard`
   - `/clientes`
   - mudança de cargo
   - ativar/desativar usuário
   - cards do dashboard abrindo filtros prontos

## Deploy / atualização na Vercel

1. Substitua os arquivos do projeto com esta versão.
2. Rode os SQLs de update no Supabase.
3. Se já usa GitHub + Vercel:

   ```bash
   git add .
   git commit -m "feat: v3.7 admin audit + smart dashboard"
   git push
   ```

4. A Vercel faz deploy automático se o repositório já estiver conectado.
5. Confira as variáveis em **Project Settings > Environment Variables**:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - `NEXT_PUBLIC_APP_URL`
6. Se você mudar qualquer variável de ambiente, faça um **redeploy**.
7. No Supabase, ajuste em **Authentication > URL Configuration**:
   - **Site URL** = URL final da Vercel
   - **Redirect URLs** = `http://localhost:3000/**` e `https://SEU-PROJETO.vercel.app/**`

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
  update-v3.5-operacional.sql
  update-v3.7-admin-dashboard.sql
```

## Banco de dados

O arquivo `database/schema.sql` cria:

- `profiles`
- `clients`
- `client_history`
- `client_notes`
- `admin_audit_log`
- trigger automático para criar perfil após cadastro no Auth
- políticas RLS iniciais
- índices para status, atualização, responsável, último contato e próxima ação

## Observações importantes

- Para um fluxo mais simples em desenvolvimento, você pode desativar a confirmação de e-mail no Supabase Auth.
- A página de configurações exige perfil `ADMIN`.
- A timeline do cliente depende de executar o SQL da v3.5 se você já vier de uma base anterior.
- A auditoria administrativa depende de executar o SQL da v3.7 em bases já existentes.
