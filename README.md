# 5W2H Master - Sistema Integrado de Gestão e Planos de Ação Estratégicos

**5W2H Master** é uma plataforma corporativa completa desenvolvida em **Next.js 15 (App Router)**, **TypeScript**, **Tailwind CSS**, **Prisma ORM** e **PostgreSQL**, potencializada com inteligência artificial via **Google Gemini API**.

A aplicação automatiza, padroniza e eleva a governança na criação, monitoramento e execução de planos de ação empresariais utilizando a metodologia clássica **5W2H** aliada a recursos modernos de colaboração em equipe, matrizes de decisão, relatórios executivos com IA e exportações profissionais.

---

## 🚀 Tecnologias e Stacks Utilizadas

### Frontend
- **Framework:** [Next.js 15 (App Router)](https://nextjs.org/)
- **Linguagem:** [TypeScript 5](https://www.typescriptlang.org/)
- **Biblioteca de Interface:** [React 19](https://react.dev/)
- **Estilização:** [Tailwind CSS v4](https://tailwindcss.com/) com design system de alta densidade e tipografia técnica mono-espaçada
- **Ícones:** [Lucide React](https://lucide.dev/)
- **Gráficos e Dashboards:** [Recharts](https://recharts.org/)
- **Exportação de Documentos:** [jsPDF](https://github.com/parallax/jsPDF) & [jspdf-autotable](https://github.com/simonbengtsson/jsPDF-AutoTable) para PDFs executivos; [XLSX](https://github.com/SheetJS/sheetjs) para planilhas
- **Renderização Markdown:** `react-markdown` para relatórios executivos gerados por IA

### Backend & Persistência
- **API Engine:** Next.js Route Handlers (`/api/*`) com proxy seguro de chaves
- **ORM:** [Prisma ORM](https://www.prisma.io/) com cliente otimizado para PostgreSQL (`@prisma/adapter-pg`)
- **Banco de Dados:** PostgreSQL relacional com suporte a fallback e sincronização automática
- **Inteligência Artificial:** [Google GenAI SDK (`@google/genai`)](https://github.com/google-gemini/gemini-js) utilizando modelos Gemini Flash (com suporte a fallback inteligente)

---

## 📋 A Metodologia 5W2H no Sistema

Cada plano de ação é fundamentado nos 7 pilares essenciais:

| Pilar | Descrição | Campo no Sistema |
| :--- | :--- | :--- |
| **What (O quê)** | O que será realizado ou construído? | Título e Descrição da Ação |
| **Why (Por quê)** | Qual a justificativa e o impacto esperado? | Justificativa Estratégica |
| **Where (Onde)** | Em qual setor, unidade física ou sistema? | Local / Setor de Aplicação |
| **When (Quando)** | Qual o prazo de início e data limite? | Data de Início e Prazo Final |
| **Who (Quem)** | Quem é o responsável direto pela entrega? | Líder / Responsável Nomeado |
| **How (Como)** | Qual o método operacional ou passo a passo? | Metodologia & Etapas Operacionais |
| **How Much (Quanto)** | Qual o custo ou investimento orçado? | Orçamento em Moeda Local (R$) |

---

## ✨ Principais Funcionalidades

### 1. 📊 Múltiplas Visões de Gerenciamento
- **Tabela Técnica (Spreadsheet View):** Edição rápida, filtros avançados por departamento, competência, status e prioridade, além de paginação e ordenação por colunas.
- **Visualização em Cards (Bento Grid):** Resumo visual com indicadores de progresso percentual, badges de prioridade e cálculo de dias restantes até o prazo.
- **Quadro Kanban:** Visualização por colunas de status (*Não iniciado*, *Em andamento*, *Atrasado*, *Concluído*, *Arquivado*) com atualização fluida de status.
- **Matriz 5W2H Interativa:** Visão tabular consolidada em tela cheia com visualização estruturada dos 7 pilares e botão de **Exportação direta para PDF e Excel**.
- **Painel de Monitoramento de Equipe:** Indicadores por colaborador, carga de trabalho, tarefas pendentes e taxa de conclusão no prazo.

### 2. 🗄️ Gestão de Status e Arquivamento
- Status disponíveis: `Não iniciado`, `Em andamento`, `Atrasado`, `Concluído` e `Arquivado`.
- Seletor de escopo no topo (`Ativas`, `Arquivadas`, `Todas`) para manter a área de trabalho limpa e reduzir a poluição visual, preservando o histórico para auditoria.

### 3. 🤖 Gerador Inteligente 5W2H com Gemini AI
- Converte objetivos ou problemas descritos em linguagem natural em planos de ação completos com todos os 7 pilares 5W2H preenchidos.
- **Rascunhos 100% Editáveis:** Todos os campos gerados (Título, Por quê, Como, Onde, Quem, Quando, Custo, Departamento e Categoria) podem ser revisados e ajustados pelo usuário antes de salvar.
- Adição individual ou em lote para o workspace.

### 4. 📈 Diagnóstico e Relatório Executivo com IA
- Analisa o panorama completo das tarefas ativas da organização.
- Identifica automaticamente sobrecargas de colaboradores (Who), gargalos orçamentários (How Much) e prazos críticos em risco (When).
- Gera recomendações práticas de contingência e permite **copiar para a área de transferência**, **imprimir** ou **exportar como PDF formatado**.

### 5. 👥 Grupos, Listas e Colaboração Multi-usuário
- Criação de Grupos de Tarefas e Listas personalizadas por projeto ou departamento.
- Gerenciamento de Membros e Compartilhamento de Listas com controle de permissões (Editor / Visualizador).
- Modal de convite de membros integrado com a base de usuários do sistema.

### 6. 🔒 Perfis e Gestão de Usuários (RBAC)
- Suporte a papéis corporativos: `SUPER_ADMIN`, `ADMIN`, `MEMBER` e `VIEWER`.
- Associação de colaboradores aos seus respectivos departamentos e visualização de métricas individuais de entrega.

---

## 🛠️ Configuração e Execução do Projeto

### Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto (consulte `.env.example`):

```env
# Banco de Dados PostgreSQL
DATABASE_URL="postgresql://usuario:senha@localhost:5432/db_5w2h?schema=public"

# Chave da API Google Gemini
GEMINI_API_KEY="sua_chave_gemini_aqui"
```

### Instalação de Dependências

```bash
npm install
```

### Inicialização do Banco de Dados com Prisma

```bash
# Gerar o client Prisma
npm run prisma:generate

# Sincronizar o schema com o banco de dados
npm run prisma:push

# Popular dados iniciais (semente)
npm run db:seed
```

### Execução em Desenvolvimento

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000) no seu navegador.

### Build de Produção

```bash
npm run build
npm start
```

---

## 📂 Estrutura de Diretórios

```text
├── app/
│   ├── api/
│   │   ├── auth/          # Rotas de sessão e autenticação
│   │   ├── gemini/        # Geração 5W2H e Relatórios com IA
│   │   ├── tasks/         # Endpoints REST para CRUD de tarefas
│   │   └── users/         # Gestão de usuários e permissões
│   ├── layout.tsx         # Layout raiz com fontes e temas
│   ├── page.tsx           # Ponto de entrada e orquestração das views
│   └── globals.css        # Estilos globais e tokens do Tailwind
├── components/
│   ├── AiGeneratorView.tsx # Gerador 5W2H e Diagnóstico Executivo com IA
│   ├── FiltersBar.tsx     # Barra de filtros, busca e alternância Ativas/Arquivadas
│   ├── MatrixModal.tsx    # Modal da Matriz 5W2H com exportação PDF/Excel
│   ├── ShareListModal.tsx # Gerenciamento de membros e compartilhamento
│   ├── TaskCardsView.tsx  # Visão em Grid de Cards com status e arquivamento
│   ├── TaskFormModal.tsx  # Formulário de criação/edição 5W2H
│   ├── TaskGroupsView.tsx # Grupos, listas e gestão colaborativa
│   ├── TaskKanbanView.tsx # Quadro Kanban de arrastar e acompanhar status
│   ├── TaskTableView.tsx  # Tabela técnica detalhada de tarefas
│   ├── TeamMonitoringView.tsx # Painel de desempenho e carga de equipe
│   └── UserManagementView.tsx # Gestão de usuários e permissões
├── hooks/
│   └── use5w2h.ts         # Hook central com estado, filtros e persistência
├── lib/
│   ├── 5w2h-utils.ts      # Funções de formatação de moedas, datas e cálculos
│   └── prisma.ts          # Singleton de conexão com PostgreSQL
├── prisma/
│   ├── schema.prisma      # Definição do schema relacional do banco
│   └── seed.ts            # Script de inicialização de dados demonstrativos
└── types/
    └── 5w2h.ts            # Tipagens TypeScript completas do sistema
```

---

## 📄 Licença

Este projeto está sob licença proprietária de uso corporativo. Desenvolvido para governança de planos de ação e alta performance executiva.
