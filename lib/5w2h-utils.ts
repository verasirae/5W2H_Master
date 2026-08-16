import { Task5W2H, TaskCalculatedInfo, WorkspaceConfig, DeadlineSituation } from '@/types/5w2h';
import * as XLSX from 'xlsx';

export const DEFAULT_WORKSPACE_CONFIG: WorkspaceConfig = {
  workspaceName: '5W2H Master - Control Center',
  departmentName: 'Operações Corporativas',
  currencySymbol: 'R$',
  attentionThresholdDays: 3,
  departments: [
    'RH/DP',
    'Financeiro',
    'Compras',
    'Marketing',
    'TI & Infraestrutura',
    'Jurídico',
    'Operações',
    'Qualidade',
    'Sucesso do Cliente'
  ],
  categoriesByDepartment: {
    'RH/DP': ['Admissão', 'Rescisão', 'Folha de Pagamento', 'eSocial', 'Férias', 'Treinamento & DHO'],
    'Financeiro': ['Contas a Pagar', 'Contas a Receber', 'Fechamento Contábil', 'Conciliação Bancária', 'Fluxo de Caixa', 'Orçamento'],
    'Compras': ['Cotações', 'Gestão de Fornecedores', 'Emissão de Pedidos', 'Homologação', 'Negociação de Contratos'],
    'Marketing': ['Campanhas Digitais', 'Inbound Marketing', 'Eventos', 'SEO & Conteúdo', 'Redes Sociais', 'Branding'],
    'TI & Infraestrutura': ['Infraestrutura & Servidores', 'Suporte Técnico', 'Segurança da Informação', 'Sistemas ERP', 'Cloud & DevOps'],
    'Jurídico': ['Análise de Contratos', 'Compliance', 'Processos Trabalhistas', 'LGPD', 'Societário'],
    'Operações': ['Manutenção Preventiva', 'Logística & Distribuição', 'Controle de Estoque', 'Mapeamento de Processos', 'Segurança do Trabalho'],
    'Qualidade': ['Auditoria Interna', 'Certificação ISO 9001', 'Não Conformidades', 'Melhoria Contínua (KAIZEN)', 'Garantia da Qualidade'],
    'Sucesso do Cliente': ['Onboarding', 'Pesquisa de NPS', 'Gestão de Churn', 'Renovação de Contratos', 'Atendimento VIP']
  }
};

export const INITIAL_SAMPLE_TASKS: Task5W2H[] = [
  {
    id: 'TSK-2026-001',
    title: 'Migração do Cluster de Servidores para Nuvem',
    why: 'Eliminar gargalos de I/O e garantir alta disponibilidade para o fechamento do trimestre',
    where: 'Data Center Principal / AWS Cloud',
    startDate: '2026-08-01',
    deadlineDate: '2026-08-16',
    who: 'Eng. Roberto Silva',
    how: 'Migração gradual com replicação assíncrona dos bancos de dados durante janela de manutenção',
    howMuch: 15000,
    department: 'TI & Infraestrutura',
    category: 'Infraestrutura & Servidores',
    competence: '08/2026',
    priority: 'Urgente',
    status: 'Em andamento',
    progressPercent: 60,
    observations: 'Hardware já entregue. Início da fase de testes de carga.',
    createdAt: '2026-08-01T10:00:00Z',
    updatedAt: '2026-08-12T14:30:00Z'
  },
  {
    id: 'TSK-2026-002',
    title: 'Campanha de Marketing Q3 - Lançamento da Plataforma',
    why: 'Aumentar a aquisição de novos clientes em 35% no próximo trimestre',
    where: 'Canais Digitais (Google Ads, LinkedIn e Meta)',
    startDate: '2026-08-05',
    deadlineDate: '2026-09-01',
    who: 'Ana Chen',
    how: 'Anúncios segmentados para tomadores de decisão e landing pages otimizadas para conversão',
    howMuch: 45000,
    department: 'Marketing',
    category: 'Campanhas Digitais',
    competence: '08/2026',
    priority: 'Alta',
    status: 'Em andamento',
    progressPercent: 25,
    observations: 'Copywriting aprovado. Criativos em fase final de produção visual.',
    createdAt: '2026-08-02T11:00:00Z',
    updatedAt: '2026-08-10T09:15:00Z'
  },
  {
    id: 'TSK-2026-003',
    title: 'Auditoria de Conformidade LGPD e Segurança',
    why: 'Atender requisitos regulatórios e prevenir sanções legais',
    where: 'Sede Administrativa / Servidores',
    startDate: '2026-07-15',
    deadlineDate: '2026-08-10',
    who: 'Marcos Davis',
    how: 'Mapeamento de fluxo de dados de clientes e revisão dos termos de privacidade',
    howMuch: 8500,
    department: 'Jurídico',
    category: 'LGPD',
    competence: '07/2026',
    priority: 'Alta',
    status: 'Atrasado',
    progressPercent: 80,
    observations: 'Aguardando validação do relatório pelo comitê diretivo.',
    createdAt: '2026-07-15T08:00:00Z',
    updatedAt: '2026-08-11T16:00:00Z'
  },
  {
    id: 'TSK-2026-004',
    title: 'Fechamento da Folha de Pagamento - Competência 08/2026',
    why: 'Garantir o crédito de salários e recolhimento correto de encargos até o prazo legal',
    where: 'Departamento de Pessoal / Sistema ERP',
    startDate: '2026-08-20',
    deadlineDate: '2026-08-28',
    who: 'Juliana Mendes',
    how: 'Consolidação de pontos, cálculo de variáveis e envio de eventos para o eSocial',
    howMuch: 0,
    department: 'RH/DP',
    category: 'Folha de Pagamento',
    competence: '08/2026',
    priority: 'Urgente',
    status: 'Não iniciado',
    progressPercent: 0,
    observations: 'Rotina mensal padrão.',
    createdAt: '2026-08-05T14:00:00Z',
    updatedAt: '2026-08-05T14:00:00Z'
  },
  {
    id: 'TSK-2026-005',
    title: 'Renovação do Certificado ISO 9001',
    why: 'Manter a certificação de qualidade exigida pelos grandes contratos comerciais',
    where: 'Planta Industrial / Todos os Setores',
    startDate: '2026-06-01',
    deadlineDate: '2026-08-05',
    who: 'Carlos Oliveira',
    how: 'Execução de auditoria interna prévia e tratamento das não conformidades apontadas',
    howMuch: 12000,
    department: 'Qualidade',
    category: 'Certificação ISO 9001',
    competence: '08/2026',
    priority: 'Média',
    status: 'Concluído',
    progressPercent: 100,
    completionDate: '2026-08-04',
    observations: 'Auditoria externa finalizada com sucesso e recomendação de renovação.',
    createdAt: '2026-06-01T09:00:00Z',
    updatedAt: '2026-08-04T18:00:00Z'
  }
];

export function generateUniqueTaskId(existingTasks: Task5W2H[]): string {
  const currentYear = new Date().getFullYear();
  const prefix = `TSK-${currentYear}-`;

  let maxNum = 0;
  if (Array.isArray(existingTasks)) {
    existingTasks.forEach((t) => {
      if (t?.id && typeof t.id === 'string' && t.id.startsWith(prefix)) {
        const parts = t.id.replace(prefix, '').split('-');
        const numPart = parseInt(parts[0], 10);
        if (!isNaN(numPart) && numPart > maxNum) {
          maxNum = numPart;
        }
      }
    });
  }

  const nextNum = maxNum + 1;
  return `${prefix}${nextNum.toString().padStart(3, '0')}`;
}

export function deduplicateTaskIds(taskList: Task5W2H[]): Task5W2H[] {
  if (!Array.isArray(taskList)) return [];
  const seenIds = new Set<string>();
  const currentYear = new Date().getFullYear();
  let counter = 1;

  return taskList.map((task, idx) => {
    let id = task?.id;
    if (!id || typeof id !== 'string' || seenIds.has(id)) {
      while (seenIds.has(`TSK-${currentYear}-${counter.toString().padStart(3, '0')}`)) {
        counter++;
      }
      id = `TSK-${currentYear}-${counter.toString().padStart(3, '0')}`;
      counter++;
    }
    seenIds.add(id);
    return {
      ...task,
      id,
    };
  });
}

export function calculateTaskDeadlineInfo(
  deadlineDateStr: string,
  status: string,
  attentionThresholdDays: number = 3
): TaskCalculatedInfo {
  if (status === 'Concluído') {
    return { daysRemaining: 0, deadlineSituation: 'Concluído' };
  }
  if (status === 'Cancelado') {
    return { daysRemaining: 0, deadlineSituation: 'Cancelado' };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const deadline = new Date(deadlineDateStr + 'T00:00:00');
  deadline.setHours(0, 0, 0, 0);

  const diffTime = deadline.getTime() - today.getTime();
  const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (daysRemaining < 0 || status === 'Atrasado') {
    return { daysRemaining, deadlineSituation: 'Atrasado' };
  } else if (daysRemaining <= attentionThresholdDays) {
    return { daysRemaining, deadlineSituation: 'Atenção' };
  } else {
    return { daysRemaining, deadlineSituation: 'No Prazo' };
  }
}

export function formatCurrency(amount: number, currencySymbol: string = 'R$'): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: currencySymbol === 'R$' ? 'BRL' : 'USD',
    minimumFractionDigits: 2,
  }).format(amount).replace('BRL', currencySymbol).replace('USD', currencySymbol);
}

export function formatShortDate(dateStr: string): string {
  if (!dateStr) return '-';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

export function exportTasksToExcel(tasks: Task5W2H[], attentionThresholdDays: number = 3) {
  const exportData = tasks.map(t => {
    const calc = calculateTaskDeadlineInfo(t.deadlineDate, t.status, attentionThresholdDays);
    return {
      'Código (ID)': t.id,
      'O quê (Título)': t.title,
      'Por quê (Justificativa)': t.why,
      'Onde (Setor/Local)': t.where,
      'Data de Início': formatShortDate(t.startDate),
      'Prazo (Quando)': formatShortDate(t.deadlineDate),
      'Dias Restantes': calc.daysRemaining,
      'Situação do Prazo': calc.deadlineSituation,
      'Quem (Responsável)': t.who,
      'Como (Método)': t.how,
      'Quanto (Custo)': t.howMuch,
      'Departamento': t.department,
      'Categoria/Rotina': t.category,
      'Competência': t.competence,
      'Prioridade': t.priority,
      'Status': t.status,
      '% Concluído': `${t.progressPercent}%`,
      'Data Conclusão': t.completionDate ? formatShortDate(t.completionDate) : '-',
      'Observações': t.observations || '-'
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Plano_5W2H');

  const fileName = `Plano_de_Acao_5W2H_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(workbook, fileName);
}
