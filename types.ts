
export enum StandardType {
  ISO9001 = 'ISO 9001:2015 (Calidad)',
  SGSST = 'SG-SST (Seguridad y Salud)',
  FSC = 'FSC (Cadena de Custodia)',
  PESV = 'Plan Estratégico de Seguridad Vial'
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

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  date: string;
  read: boolean;
  type: 'REJECTION' | 'APPROVAL' | 'NEW_UPLOAD' | 'SYSTEM';
}

export interface NotificationSettings {
  notifyOnRejection: boolean;
  notifyOnApproval: boolean;
  notifyOnNewUpload: boolean;
  emailEnabled: boolean;
}

export interface Evidence {
  url: string; 
  type: 'FILE' | 'LINK';
  fileName: string;
  uploadedBy: string; 
  uploadedAt: string; 
  status: EvidenceStatus;
  adminComment?: string;
  rejectionDate?: string;
  approvedBy?: string;
  history: CommentLog[];
}

export interface MonthlyExecution {
  month: number; 
  planned: boolean;
  executed: boolean;
  delayed: boolean;
  evidence?: Evidence; 
}

export interface AreaStats {
  id: string;
  name: string;
  totalActivities: number;
  completedActivities: number;
  compliancePercentage: number;
  previousCompliance: number;
}

export interface Area {
  id: string;
  name: string;
  description?: string;
}

export interface Plant {
  id: string;
  name: string;
  location: string;
  isMain?: boolean;
  description?: string;
}

export interface Activity {
  id: string;
  clause: string; 
  subClause: string; 
  clauseTitle: string; 
  description: string; 
  contextualization: string; 
  relatedQuestions: string; 
  standards: string[]; 
  responsibleArea: string;
  periodicity: Periodicity; 
  compliance2024: boolean; 
  compliance2025: boolean; 
  plans?: { [year: number]: MonthlyExecution[] };
  monthlyPlan?: MonthlyExecution[];
  plantIds: string[]; // Requisito multi-planta
}

export interface StandardDefinition {
  id: string;
  type: string; 
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
  companyLogo: string | null; 
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
  assignedArea?: string; 
  password?: string;
  notifications?: NotificationSettings;
}
