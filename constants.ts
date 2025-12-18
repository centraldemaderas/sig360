
import { Activity, AreaStats, StandardType, User, UserRole, Periodicity } from './types';

export const AREAS = [
  'Gerencia',
  'Comercial',
  'HSEQ',
  'Inventarios',
  'Producción',
  'Compras',
  'Talento Humano',
  'Ventas',
  'Mantenimiento'
];

export const MONTHS = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
];

export const MOCK_USERS: User[] = [
  {
    id: 'u1',
    name: 'Carlos Auditor',
    email: 'admin@centralmaderas.com',
    role: UserRole.ADMIN,
    assignedArea: 'HSEQ',
    password: '123',
    notifications: {
      notifyOnRejection: true,
      notifyOnApproval: true,
      notifyOnNewUpload: true,
      emailEnabled: true
    }
  },
  {
    id: 'u2',
    name: 'Ana Ventas',
    email: 'ana@centralmaderas.com',
    role: UserRole.LEADER,
    assignedArea: 'Ventas',
    password: '123',
    notifications: {
      notifyOnRejection: true,
      notifyOnApproval: true,
      notifyOnNewUpload: false,
      emailEnabled: true
    }
  }
];

const generatePlan = (periodicity: Periodicity, isPast: boolean = false) => {
  return Array.from({ length: 12 }, (_, i) => {
    let isPlanned = false;
    switch (periodicity) {
      case Periodicity.MONTHLY: isPlanned = true; break;
      case Periodicity.ANNUAL: isPlanned = i === 11; break;
      case Periodicity.SEMIANNUAL: isPlanned = i === 5 || i === 11; break;
      case Periodicity.QUARTERLY: isPlanned = (i + 1) % 3 === 0; break;
      case Periodicity.BIMONTHLY: isPlanned = i % 2 === 0; break;
    }
    return {
      month: i,
      planned: isPlanned,
      executed: isPast && isPlanned && i < 6,
      delayed: false
    };
  });
};

export const MOCK_ACTIVITIES_GERENCIA: Activity[] = [
  {
    id: 'GER-001',
    clause: '4.1',
    subClause: '4.1.1',
    clauseTitle: 'Comprensión de la organización y su contexto',
    description: 'Se deben identificar, seguir y revisar aquellos aspectos internos y externos que ueden ser relevantes para la organización, su proposito y direccion estrategica y que pueden tener impacto para que el sistema de gestion de calidad alcance los resultados esperados. Dentro de estos factores legales, tegnologicos, competidores, economicos, ambientales, valores internos, la cultura organizacional, el conocimiento el desempeño. Es necesario evidenciar que estas actividades se llevan a cabo.',
    contextualization: 'Se han determinado las cuestiones internas y externas que son relevantes para la organización y para la propuesta estrategica de la misma que puedan afectar a los resultados esperados dentro del sistema de gestion?',
    relatedQuestions: '4.1.1 En la Matriz DOFA no se contemplan los Proveedores de la empresa',
    standards: [StandardType.ISO9001],
    responsibleArea: 'Gerencia',
    periodicity: Periodicity.ANNUAL,
    compliance2024: true, 
    compliance2025: true,
    plans: {
      2025: generatePlan(Periodicity.ANNUAL, true),
      2026: generatePlan(Periodicity.ANNUAL, false)
    },
    plantIds: ['MOSQUERA']
  },
  {
    id: 'GER-002',
    clause: '4.1',
    subClause: '4.1.2',
    clauseTitle: 'Comprensión de la organización y su contexto',
    description: 'Se deben identificar, seguir y revisar aquellos aspectos internos y externos que ueden ser relevantes para la organización, su proposito y direccion estrategica y que pueden tener impacto para que el sistema de gestion de calidad alcance los resultados esperados. Dentro de estos factores legales, tegnologicos, competidores, economicos, ambientales, valores internos, la cultura organizacional, el conocimiento el desempeño. Es necesario evidenciar que estas actividades se llevan a cabo.',
    contextualization: 'La organización puede demostrar que se hace seguimiento y revision de la informacion sobre las cuestiones internas y externas que influyen o pueden influir sobre el sistema de gestion?',
    relatedQuestions: '4.1.2 Revisión de la alta dirección Pendiente la del 2025',
    standards: [StandardType.ISO9001],
    responsibleArea: 'Gerencia',
    periodicity: Periodicity.ANNUAL,
    compliance2024: true, 
    compliance2025: true,
    plans: {
      2025: generatePlan(Periodicity.ANNUAL, true),
      2026: generatePlan(Periodicity.ANNUAL, false)
    },
    plantIds: ['MOSQUERA']
  },
  {
    id: 'GER-003',
    clause: '4.2',
    subClause: '4.2.1',
    clauseTitle: 'Comprensión de las necesidades y expectativas de las partes interesadas',
    description: 'La organización debe determinar las partes interesadas y los requisitos de las mismas que son relevantes para la organización. Dentro de las partes interesadas podemos encontrar a los clientes, entidades regulatorias, accionistas. La detterminacion de estas partes interesadas tiene que ser una actividad continua, ya que las partes interesadas cambian a lo largo del tiempo.',
    contextualization: 'La organización dispone de un procedimiento para la identificacion inicial de partes interesadas y de aquellos requisitos que se consideran relevantes para la oganización. ?',
    relatedQuestions: '4.2.1 No se evidencia procedimiento de Matriz de riesgos y oportunidades',
    standards: [StandardType.ISO9001],
    responsibleArea: 'Gerencia',
    periodicity: Periodicity.ANNUAL,
    compliance2024: true, 
    compliance2025: true,
    plans: {
      2025: generatePlan(Periodicity.ANNUAL, true),
      2026: generatePlan(Periodicity.ANNUAL, false)
    },
    plantIds: ['MOSQUERA']
  },
  {
    id: 'GER-004',
    clause: '4.2',
    subClause: '4.2.2',
    clauseTitle: 'Comprensión de las necesidades y expectativas de las partes interesadas',
    description: 'La organización debe determinar las partes interesadas y los requisitos de las mismas que son relevantes para la organización. Dentro de las partes interesadas podemos encontrar a los clientes, entidades regulatorias, accionistas. La detterminacion de estas partes interesadas tiene que ser una actividad continua, ya que las partes interesadas cambian a lo largo del tiempo.',
    contextualization: 'la organización puede demostrar que hace seguimiento y revisión de una forma regular de la informacion relevante de las partes interesadas',
    relatedQuestions: '4.2.2 Contestación a PQR internos, planes de acción a Reclamaciones, reunión de indicadores (Check)',
    standards: [StandardType.ISO9001],
    responsibleArea: 'Gerencia',
    periodicity: Periodicity.MONTHLY,
    compliance2024: true, 
    compliance2025: true,
    plans: {
      2025: generatePlan(Periodicity.MONTHLY, true),
      2026: generatePlan(Periodicity.MONTHLY, false)
    },
    plantIds: ['MOSQUERA']
  }
];

export const MOCK_AREA_STATS: AreaStats[] = [
  { id: 'area-1', name: 'Gerencia', totalActivities: 30, completedActivities: 25, compliancePercentage: 83, previousCompliance: 75 },
  { id: 'area-2', name: 'HSEQ', totalActivities: 25, completedActivities: 24, compliancePercentage: 96, previousCompliance: 90 }
];
