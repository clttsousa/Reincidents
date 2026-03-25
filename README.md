# InfraOS Recorrência v3.0 — Supabase

Base operacional do sistema para gestão de clientes recorrentes com problemas de conexão, agora preparada para **Supabase Auth + Supabase Database**.

## Stack

- Next.js (App Router)
- TypeScript
- Tailwind CSS
- shadcn/ui style components
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

3. Preencha `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.

4. No projeto Supabase, abra o **SQL Editor** e execute o arquivo `database/schema.sql`.

5. Rode o projeto:

   ```bash
   npm run dev
   ```

6. Acesse `http://localhost:3000`.

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
    clientes/
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
```

## Banco de dados

O arquivo `database/schema.sql` cria:

- `profiles`
- `clients`
- `client_history`
- `client_notes`
- trigger automático para criar perfil após cadastro no Auth
- políticas RLS iniciais
- seed inicial com os clientes da sua planilha

## Autenticação

- login com e-mail e senha
- registro com criação automática de perfil `ATTENDANT`
- logout
- proteção de rotas internas
- controle de acesso por perfil (`ADMIN`, `SUPERVISOR`, `ATTENDANT`)

## Observações importantes

- Para um fluxo mais simples em desenvolvimento, você pode desativar a confirmação de e-mail no Supabase Auth.
- A página de configurações exige perfil `ADMIN`.
- A tabela de clientes funciona com Supabase; se as variáveis não estiverem preenchidas, ela cai para os dados mock/localStorage.

## Próximos passos sugeridos

- Conectar histórico e observações em telas dedicadas
- Criar gestão de usuários por admin
- Subir responsável por usuário real em vez de nome livre
- Adicionar importação de planilha e filtros por data
