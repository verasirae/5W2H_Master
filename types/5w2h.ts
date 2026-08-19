export type TaskPriority = 'Baixa' | 'Média' | 'Alta' | 'Urgente';

export type TaskStatus = 'Não iniciado' | 'Em andamento' | 'Concluído' | 'Atrasado' | 'Cancelado';

export type DeadlineSituation = 'No Prazo' | 'Atenção' | 'Atrasado' | 'Concluído' | 'Cancelado';

export type UserRole = 'admin' | 'gestor' | 'membro';
export type UserStatus = 'pendente' | 'ativo' | 'inativo';

export interface UserProfile {
  id: string;
  email: string;
  name?: string | null;
  avatarUrl?: string | null;
  role: UserRole;
  status: UserStatus;
  department?: string | null;
  jobTitle?: string | null;
  provider?: string;
  managedDepartments?: string[];
  managedTeams?: string[];
  memberDepartments?: string[];
  memberTeams?: string[];
  lastLoginAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface Task5W2H {
  id: string;
  title: string;          // O quê
  why: string;            // Por quê
  where: string;          // Onde
  startDate: string;      // YYYY-MM-DD
  deadlineDate: string;   // YYYY-MM-DD (Quando)
  who: string;            // Quem (Nome do responsável)
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
  departmentId?: string;
  categoryId?: string;
  assignedUserId?: string;
  createdById?: string;
  assignedUser?: {
    id: string;
    name?: string | null;
    email: string;
    avatarUrl?: string | null;
    role?: string;
    department?: string | null;
  };
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
