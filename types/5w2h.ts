export type TaskPriority = 'Baixa' | 'Média' | 'Alta' | 'Urgente';

export type TaskStatus = 'Não iniciado' | 'Em andamento' | 'Concluído' | 'Atrasado' | 'Cancelado';

export type DeadlineSituation = 'No Prazo' | 'Atenção' | 'Atrasado' | 'Concluído' | 'Cancelado';

export interface Task5W2H {
  id: string;
  title: string;          // O quê
  why: string;            // Por quê
  where: string;          // Onde
  startDate: string;      // YYYY-MM-DD
  deadlineDate: string;   // YYYY-MM-DD (Quando)
  who: string;            // Quem
  how: string;            // Como
  howMuch: number;        // Quanto (R$)
  department: string;     // Departamento
  category: string;       // Categoria / Rotina
  competence: string;     // MM/YYYY
  priority: TaskPriority;
  status: TaskStatus;
  progressPercent: number; // 0 - 100
  completionDate?: string; // YYYY-MM-DD
  observations?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceConfig {
  workspaceName: string;
  departmentName: string;
  currencySymbol: string;
  attentionThresholdDays: number;
  departments: string[];
  categoriesByDepartment: Record<string, string[]>;
}

export interface FilterState {
  searchQuery: string;
  department: string;     // 'Todos' or specific
  category: string;       // 'Todas' or specific
  competence: string;     // 'Todas' or specific
  status: string;         // 'Todos' or specific
  priority: string;       // 'Todas' or specific
  who: string;            // 'Todos' or specific
  deadlineSituation: string; // 'Todas' or specific
}

export interface TaskCalculatedInfo {
  daysRemaining: number;
  deadlineSituation: DeadlineSituation;
}
