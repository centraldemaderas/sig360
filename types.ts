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

export interface MonthlyExecution {
  month: number; // 0-11
  planned: boolean;
  executed: boolean;
  delayed: boolean;
}

export interface Activity {
  id: string;
  clause: string; // e.g., "4.1"
  subClause: string; // e.g., "4.1.1" or "1" - The specific task identifier
  clauseTitle: string; // e.g., "Comprensión de la organización"
  description: string; // The standard requirement description
  contextualization: string; // "Explicación dentro de Central de Maderas"
  relatedQuestions: string;
  standards: StandardType[]; // Can belong to multiple standards
  responsibleArea: string;
  periodicity: Periodicity; // Added field
  compliance2024: boolean; // Historic data
  compliance2025: boolean; // Target
  monthlyPlan: MonthlyExecution[];
  evidenceFile?: string; // Mock file name
}

export interface AreaStats {
  id: string;
  name: string;
  totalActivities: number;
  completedActivities: number;
  compliancePercentage: number;
  previousCompliance: number; // For deterioration analysis
}

export interface GlobalStats {
  overallCompliance: number;
  targetCompliance: number;
  deterioration: number; // Negative value implies deterioration
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
  password?: string; // In a real app, never store plain text
}