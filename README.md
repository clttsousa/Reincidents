# RecorrênciaOS v4.3 — performance por rota + dashboard gerencial + refinamento premium

Painel interno para gestão de clientes recorrentes com problemas de conexão, contatos, ordens de serviço, timeline por cliente, gestão administrativa de usuários e dashboard operacional. Esta entrega consolida as evoluções das versões **v4.1, v4.2 e v4.3** sobre a base estabilizada v4.0.

## O que esta versão entrega

### v4.1 — arquitetura e performance

- `ClientsProvider` desacoplado do layout global e carregado apenas em:
  - `/dashboard`
  - `/clientes`
  - `/fila`
- criação de camada de serviços para dados de clientes e timeline
- novo hook de busca com debounce para reduzir reprocessamento na carteira
- versões de dependências fixadas por faixa estável em `package.json`
- novo script `npm run typecheck`

### v4.2 — visão gerencial

- dashboard com seletor de período: **7, 15 e 30 dias**
- comparação com período anterior em indicadores-chave
- bloco de **SLA e gargalos**
- ranking de **produtividade por responsável**
- painel de **recorrência e pressão operacional**
- atalhos gerenciais para abrir a carteira já filtrada
- exportação CSV da carteira filtrada
- presets rápidos na tela de clientes

### v4.3 — refinamento premium

- overlays com melhor comportamento de foco, `Escape` e travamento de scroll
- melhorias de acessibilidade nos toasts com `aria-live`
- login com mostrar/ocultar senha e orientação mais clara
- cadastro com indicador visual de força da senha
- carteira com:
  - atalho `/` para buscar
  - atalho `N` para novo cliente
  - alternância entre densidade confortável e compacta
- responsividade refinada em navegação mobile e telas operacionais

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

4. No projeto Supabase, abra o **SQL Editor** e execute:

   - para base nova: `database/schema.sql`
   - para base existente: rode os updates em sequência

   ```txt
   database/update-v3.3-admin-users.sql
   database/update-v3.5-operacional.sql
   database/update-v3.7-admin-dashboard.sql
   database/update-v4.0-hardening.sql
   ```

   As versões v4.1, v4.2 e v4.3 **não exigem novo SQL obrigatório**.

5. Rode as validações locais recomendadas:

   ```bash
   npm run lint
   npm run typecheck
   npm run build
   ```

6. Rode o projeto:

   ```bash
   npm run dev
   ```

7. Acesse `http://localhost:3000`.

## Checklist de homologação

### Auth
- `/login`
- `/register`
- mostrar/ocultar senha
- mensagens de bloqueio e confirmação de conta

### Dashboard
- troca de período 7 / 15 / 30 dias
- cards principais
- SLA e gargalos
- produtividade por responsável
- atalhos gerenciais

### Clientes
- busca com `/`
- atalho `N`
- exportação CSV
- presets rápidos
- troca entre modo confortável e compacto
- novo cliente
- edição
- troca de status com confirmação
- timeline

### Fila
- busca
- filtro por responsável
- ordenação
- abrir carteira a partir das colunas

### Configurações
- mudança de cargo
- ativar/desativar usuário
- motivo de desativação
- último acesso

## Passo a passo para subir na Vercel

1. Garanta que o Supabase já recebeu os SQLs até a v4.0.
2. Suba o projeto para um repositório Git.
3. No terminal:

   ```bash
   git add .
   git commit -m "feat: recorrenciaos v4.3"
   git push
   ```

4. Conecte o repositório na Vercel, ou apenas faça push se ela já estiver integrada.
5. Em **Project Settings > Environment Variables**, configure:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - `NEXT_PUBLIC_APP_URL`
6. Em **Authentication > URL Configuration** no Supabase, ajuste:
   - **Site URL** = URL final da Vercel
   - **Redirect URLs** = `http://localhost:3000/**` e `https://SEU-PROJETO.vercel.app/**`
7. Faça o deploy.

## Observações importantes

- A página de configurações continua exigindo perfil `ADMIN`.
- O endurecimento administrativo continua dependendo do `update-v4.0-hardening.sql` já aplicado no banco.
- Como esta versão moveu a carga de clientes para páginas específicas, a área de configurações fica mais leve por não carregar a carteira inteira em segundo plano.
- Rode sempre `npm run lint`, `npm run typecheck` e `npm run build` no seu ambiente antes do deploy final.


## Verificação antes do deploy

Rode sempre nesta ordem antes de subir para a Vercel:

```bash
npm install
npm run lint
npm run typecheck
npm run build
```

Se existir um arquivo `eslint.config.mjs` antigo na raiz, remova antes do commit. O projeto usa `.eslintrc.json`.
