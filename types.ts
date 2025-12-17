
export enum StandardType {
  ISO9001 = 'ISO 9001:2015 (Calidad)',
  SGSST = 'SG-SST (Seguridad y Salud)',
  FSC = 'FSC (Cadena de Custodia)'
}

export enum ComplianceStatus {
  COMPLIANT = 'CUMPLE',
  NON_COMPLIANT = 'NO CUMPLE',
  PENDING = 'PENDIENTE',
  IN_PROGRESS = 'EN PROCESO'
}

export enum Periodicity {
  MONTHLY = 'Mensual',
  BIMONTHLY = 'Bimestral',
  QUARTERLY = 'Trimestral',
  SEMIANNUAL = 'Semestral',
  ANNUAL = 'Anual'
}

export type EvidenceStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface CommentLog {
  id: string;
  text: string;
  author: string;
  date: string;
  status: EvidenceStatus;
}

export interface Evidence {
  url: string; // Base64 string or HTTP Link
  type: 'FILE' | 'LINK';
  fileName: string;
  uploadedBy: string; // User Name
  uploadedAt: string; // ISO Date String
  status: EvidenceStatus;
  adminComment?: string; // Latest comment for quick access
  rejectionDate?: string;
  approvedBy?: string;
  history: CommentLog[]; // Full traceability history
}

export interface MonthlyExecution {
  month: number; // 0-11
  planned: boolean;
  executed: boolean;
  delayed: boolean;
  evidence?: Evidence; 
}

export interface Activity {
  id: string;
  clause: string; 
  subClause: string; 
  clauseTitle: string; 
  description: string; 
  contextualization: string; 
  relatedQuestions: string;
  standards: StandardType[]; 
  responsibleArea: string;
  periodicity: Periodicity; 
  compliance2024: boolean; 
  compliance2025: boolean; 
  monthlyPlan: MonthlyExecution[];
}

export interface StandardDefinition {
  id: string;
  type: StandardType;
  description: string;
  objective: string;
  certifyingBody: string; 
  comments: {
    id: string;
    text: string;
    author: string;
    date: string;
  }[];
}

export interface AppSettings {
  companyLogo: string | null; // Base64
}

export interface AreaStats {
  id: string;
  name: string;
  totalActivities: number;
  completedActivities: number;
  compliancePercentage: number;
  previousCompliance: number; 
}

export interface GlobalStats {
  overallCompliance: number;
  targetCompliance: number;
  deterioration: number; 
}

export enum UserRole {
  ADMIN = 'Administrador',
  LEADER = 'Líder de Proceso'
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  password?: string; 
}
