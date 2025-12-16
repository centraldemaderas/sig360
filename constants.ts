import { Activity, AreaStats, StandardType, User, UserRole, Periodicity } from './types';

export const AREAS = [
  'Gerencia',
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
    password: '123'
  },
  {
    id: 'u2',
    name: 'Ana Ventas',
    email: 'ana@centralmaderas.com',
    role: UserRole.LEADER,
    password: '123'
  }
];

// Mock Data simulating the "Gerencia" tab from the Excel
export const MOCK_ACTIVITIES_GERENCIA: Activity[] = [
  // --- EXISTING 4.1 & 4.2 ITEMS ---
  {
    id: 'GER-001',
    clause: '4.1',
    subClause: '4.1.1',
    clauseTitle: 'Comprensión de la organización y su contexto',
    description: 'Se deben identificar, seguir y revisar aquellos aspectos internos y externos que pueden ser relevantes para la organización...',
    contextualization: 'Se han determinado las cuestiones internas y externas que son relevantes para la organización...?',
    relatedQuestions: 'En la Matriz DOFA no se contemplan los Proveedores de la empresa',
    standards: [StandardType.ISO9001],
    responsibleArea: 'Gerencia',
    periodicity: Periodicity.ANNUAL,
    compliance2024: true, 
    compliance2025: true,
    monthlyPlan: Array.from({ length: 12 }, (_, i) => ({ month: i, planned: i === 11, executed: i === 11, delayed: false })) 
  },
  {
    id: 'GER-002',
    clause: '4.1',
    subClause: '4.1.2',
    clauseTitle: 'Comprensión de la organización y su contexto',
    description: 'Se deben identificar, seguir y revisar aquellos aspectos internos y externos...',
    contextualization: 'La organización puede demostrar que se hace seguimiento y revisión de la informacion sobre las cuestiones internas...?',
    relatedQuestions: 'Revisión de la alta dirección Pendiente la del 2025',
    standards: [StandardType.ISO9001],
    responsibleArea: 'Gerencia',
    periodicity: Periodicity.ANNUAL,
    compliance2024: true, 
    compliance2025: false,
    monthlyPlan: Array.from({ length: 12 }, (_, i) => ({ month: i, planned: i === 11, executed: false, delayed: false })) 
  },
  {
    id: 'GER-003',
    clause: '4.2',
    subClause: '4.2.1',
    clauseTitle: 'Comprensión de las necesidades y expectativas de las partes interesadas',
    description: 'La organización debe determinar las partes interesadas y los requisitos de las mismas...',
    contextualization: 'La organización dispone de un procedimiento para la identificación inicial de partes interesadas...?',
    relatedQuestions: 'No se evidencia procedimiento de Matriz de riesgos y oportunidades',
    standards: [StandardType.ISO9001],
    responsibleArea: 'Gerencia',
    periodicity: Periodicity.ANNUAL,
    compliance2024: false, 
    compliance2025: false,
    monthlyPlan: Array.from({ length: 12 }, (_, i) => ({ month: i, planned: i === 11, executed: false, delayed: true })) 
  },
  {
    id: 'GER-004',
    clause: '4.2',
    subClause: '4.2.2',
    clauseTitle: 'Comprensión de las necesidades y expectativas de las partes interesadas',
    description: 'La organización debe determinar las partes interesadas y los requisitos de las mismas...',
    contextualization: 'la organización puede demostrar que hace seguimiento y revisión de una forma regular...',
    relatedQuestions: 'Contestación a PQR internos, planes de acción a Reclamaciones, reunión de indicadores (Check)',
    standards: [StandardType.ISO9001],
    responsibleArea: 'Gerencia',
    periodicity: Periodicity.MONTHLY,
    compliance2024: true,
    compliance2025: true,
    monthlyPlan: Array.from({ length: 12 }, (_, i) => ({ month: i, planned: true, executed: i < 6, delayed: false })) 
  },
  
  // --- EXISTING 5.1 ITEMS ---
  {
    id: 'GER-005',
    clause: '5.1',
    subClause: '5.1.1',
    clauseTitle: 'Liderazgo y Compromiso',
    description: 'La alta direccan debe demostrar su liderazgo y compromiso con el sistema de gestion de calidad...',
    contextualization: 'La alta direccion se responsabiliza de la eficacia del SGC?',
    relatedQuestions: 'Indicadores mensuales, Revisión por la alta dirección, Planeacion estrategica',
    standards: [StandardType.ISO9001],
    responsibleArea: 'Gerencia',
    periodicity: Periodicity.MONTHLY,
    compliance2024: true,
    compliance2025: true,
    monthlyPlan: Array.from({ length: 12 }, (_, i) => ({ month: i, planned: true, executed: i < 6, delayed: false })) 
  },
  {
    id: 'GER-006',
    clause: '5.1',
    subClause: '5.1.2',
    clauseTitle: 'Liderazgo y Compromiso',
    description: 'La alta direccan debe demostrar su liderazgo y compromiso con el sistema de gestion de calidad...',
    contextualization: 'La alta direccion se asegura de que la politica y los objetivos de calidad se ha establecido y se han comunicado?',
    relatedQuestions: 'Como se socializan los objetivos de calidad? (Re socializar los objetivos en Julio)',
    standards: [StandardType.ISO9001],
    responsibleArea: 'Gerencia',
    periodicity: Periodicity.SEMIANNUAL,
    compliance2024: true,
    compliance2025: false,
    monthlyPlan: Array.from({ length: 12 }, (_, i) => ({ month: i, planned: i === 6 || i === 11, executed: false, delayed: false })) 
  },
  {
    id: 'GER-007',
    clause: '5.1',
    subClause: '5.1.3',
    clauseTitle: 'Liderazgo y Compromiso',
    description: 'La alta direccion tiene la obligacion de tomar la iniciativa dentro de la organización...',
    contextualization: 'la alta direccion se asegura que los requisitos del SGC se encuentran integrados dentro del propio negocio...?',
    relatedQuestions: 'Presupuesto 2025',
    standards: [StandardType.ISO9001],
    responsibleArea: 'Gerencia',
    periodicity: Periodicity.ANNUAL,
    compliance2024: true,
    compliance2025: false,
    monthlyPlan: Array.from({ length: 12 }, (_, i) => ({ month: i, planned: i === 11, executed: false, delayed: false })) 
  },
  {
    id: 'GER-008',
    clause: '5.1',
    subClause: '5.1.4',
    clauseTitle: 'Liderazgo y Compromiso',
    description: 'La alta direccion tiene la obligacion de tomar la iniciativa dentro de la organización...',
    contextualization: 'la alta direccion promueve la concienciacion del pensamiento basado en riesgos y en la gestion...?',
    relatedQuestions: 'Matriz de riesgos y oportunidades en todas las áreas',
    standards: [StandardType.ISO9001],
    responsibleArea: 'Gerencia',
    periodicity: Periodicity.ANNUAL,
    compliance2024: false,
    compliance2025: false,
    monthlyPlan: Array.from({ length: 12 }, (_, i) => ({ month: i, planned: i === 11, executed: false, delayed: true })) 
  },

  // --- EXISTING 5.1, 5.2, 5.3 ITEMS ---

  // 5.1.5 - Comunicación Importancia
  {
    id: 'GER-010',
    clause: '5.1',
    subClause: '5.1.5',
    clauseTitle: 'Liderazgo y Compromiso',
    description: 'La organización debe demostrar que la alta dirección está directamente involucrada en la gestión del sistema de calidad...',
    contextualization: 'la Alta direccion ha comunicado a todos los niveles de la organización la importancia de una gestion eficaz de la calidad?',
    relatedQuestions: 'SharePoint, publicación de politica, seguimiento al Planner, auditorias, re inducciones',
    standards: [StandardType.ISO9001],
    responsibleArea: 'Gerencia',
    periodicity: Periodicity.ANNUAL,
    compliance2024: true,
    compliance2025: true,
    monthlyPlan: Array.from({ length: 12 }, (_, i) => ({ month: i, planned: i === 11, executed: true, delayed: false })) 
  },
  // 5.1.6 - Requisitos Clientes
  {
    id: 'GER-011',
    clause: '5.1',
    subClause: '5.1.6',
    clauseTitle: 'Liderazgo y Compromiso',
    description: 'Se deben determinar adecuadamente todos los requisitos de los clientes asi como todos los requisitos legales y reglamentarios...',
    contextualization: 'se han determinado adecuadamente todos los requisitos de los clientes asi como todos los requisitos legales...?',
    relatedQuestions: 'Cotizaciones, Fichas tecnicas en donde se establecen los requisitos de los clientes (Verificar Contratos)',
    standards: [StandardType.ISO9001],
    responsibleArea: 'Gerencia',
    periodicity: Periodicity.ANNUAL,
    compliance2024: true,
    compliance2025: false,
    monthlyPlan: Array.from({ length: 12 }, (_, i) => ({ month: i, planned: i === 11, executed: false, delayed: false })) 
  },
  // 5.1.7 - Riesgos y Oportunidades
  {
    id: 'GER-012',
    clause: '5.1',
    subClause: '5.1.7',
    clauseTitle: 'Liderazgo y Compromiso',
    description: 'Los riesgos y oportunidades que pueden afectar a la conformidad de los productos o servicios... se han determinado y se actua sobre ellos?',
    contextualization: 'Los riesgos y oportunidades que pueden afectar a la conformidad de los productos... se han determinado y se actua sobre ellos?',
    relatedQuestions: 'La Matriz de riesgos y oportunidades debe tener trazabilidad con los procedimientos de cada área',
    standards: [StandardType.ISO9001],
    responsibleArea: 'Gerencia',
    periodicity: Periodicity.ANNUAL,
    compliance2024: false,
    compliance2025: false,
    monthlyPlan: Array.from({ length: 12 }, (_, i) => ({ month: i, planned: i === 11, executed: false, delayed: true })) 
  },
  // 5.2.1 - Política Calidad A-D
  {
    id: 'GER-013',
    clause: '5.2',
    subClause: '5.2.1',
    clauseTitle: 'Política',
    description: 'La alta dirección debe establecer una política de calidad. La politica debe ser apropiada para el contexto de la organización, asi como su proposito y visión...',
    contextualization: 'La alta direccion ha determinado una politica de calidad que cumple con los rquisitos del A al D de la clausula 5.2.1?',
    relatedQuestions: 'La alta direccion ha determinado una politica de calidad que cumple con los requisitos del A al D de la clausula 5.2.1?',
    standards: [StandardType.ISO9001],
    responsibleArea: 'Gerencia',
    periodicity: Periodicity.ANNUAL,
    compliance2024: true,
    compliance2025: true,
    monthlyPlan: Array.from({ length: 12 }, (_, i) => ({ month: i, planned: i === 11, executed: true, delayed: false })) 
  },
  // 5.2.2 - Política Documentada
  {
    id: 'GER-014',
    clause: '5.2',
    subClause: '5.2.2',
    clauseTitle: 'Política',
    description: 'La política de calidad debe ser mantenida como información documentada.',
    contextualization: 'La politica de calidad se encuentra documentada?',
    relatedQuestions: 'La politica de calidad se encuentra documentada?',
    standards: [StandardType.ISO9001],
    responsibleArea: 'Gerencia',
    periodicity: Periodicity.ANNUAL,
    compliance2024: true,
    compliance2025: true,
    monthlyPlan: Array.from({ length: 12 }, (_, i) => ({ month: i, planned: i === 11, executed: true, delayed: false })) 
  },
  // 5.2.3 - Política Comunicada
  {
    id: 'GER-015',
    clause: '5.2',
    subClause: '5.2.3',
    clauseTitle: 'Política',
    description: 'La política de calidad debe comunicarse, entenderse y aplicarse dentro de la organización.',
    contextualization: 'La politica de calidad se ha comunicado y es entendida dentro de la organización?',
    relatedQuestions: 'La politica de calidad se ha comunicado y es entendida dentro de la organización?',
    standards: [StandardType.ISO9001],
    responsibleArea: 'Gerencia',
    periodicity: Periodicity.ANNUAL,
    compliance2024: true,
    compliance2025: true,
    monthlyPlan: Array.from({ length: 12 }, (_, i) => ({ month: i, planned: i === 11, executed: true, delayed: false })) 
  },
  // 5.2.4 - Política Disponible (Web)
  {
    id: 'GER-016',
    clause: '5.2',
    subClause: '5.2.4',
    clauseTitle: 'Política',
    description: 'La política de calidad debe estar disponible para las partes interesadas pertinentes.',
    contextualization: 'La politica de calidad se encuentra disponible a aquellas partes interesadas que son relevantes para la organización?',
    relatedQuestions: 'Se encuentra publicada en pagina Web y Mosquera',
    standards: [StandardType.ISO9001],
    responsibleArea: 'Gerencia',
    periodicity: Periodicity.ANNUAL,
    compliance2024: true,
    compliance2025: true,
    monthlyPlan: Array.from({ length: 12 }, (_, i) => ({ month: i, planned: i === 11, executed: true, delayed: false })) 
  },
  // 5.3.1 - Roles y Responsabilidades (SST vs Calidad)
  {
    id: 'GER-017',
    clause: '5.3',
    subClause: '5.3.1',
    clauseTitle: 'Roles, responsabilidades y autoridades',
    description: 'La alta dirección debe asegurarse que las responsabilidades y autoridades para las distintas funciones implicadas en el SGC se asignan, comunican y entienden...',
    contextualization: 'La alta direccion se ha asegurado que dentro de la organización, las responsabilidades... se han asignado, comunicado y las mismas son entendidas',
    relatedQuestions: 'Se evidencia en el formato perfil de funciones de cargo, responsabilidades relacionadas a SST, sin embargo, es necesario ampliar las responsabilidades relacionadas a calidad de acuerdo con lo establecido por la ISO 9001:2015.',
    standards: [StandardType.ISO9001],
    responsibleArea: 'Gerencia',
    periodicity: Periodicity.ANNUAL,
    compliance2024: false,
    compliance2025: false,
    monthlyPlan: Array.from({ length: 12 }, (_, i) => ({ month: i, planned: i === 11, executed: false, delayed: true })) 
  },
  // 5.3.2 - Perfil HSEQ
  {
    id: 'GER-018',
    clause: '5.3',
    subClause: '5.3.2',
    clauseTitle: 'Roles, responsabilidades y autoridades',
    description: 'La organización ha asignado las responsabilidades dentro del SGC.',
    contextualization: 'La organización ha asignado las responsabilidades dentro del SGC',
    relatedQuestions: 'Perfil de cargo en HSEQ',
    standards: [StandardType.ISO9001],
    responsibleArea: 'Gerencia',
    periodicity: Periodicity.ANNUAL,
    compliance2024: true,
    compliance2025: true,
    monthlyPlan: Array.from({ length: 12 }, (_, i) => ({ month: i, planned: i === 11, executed: true, delayed: false })) 
  },
  // 5.3.3 - Cambios en SGC
  {
    id: 'GER-019',
    clause: '5.3',
    subClause: '5.3.3',
    clauseTitle: 'Roles, responsabilidades y autoridades',
    description: 'La alta dirección ha asignado responsabilidades y autoridades en el caso de que se vayan a realizar cambios en el sistema de gestion de calidad',
    contextualization: 'La alta direccion ha asignado responsabilidades y autoridades en el caso de que se vayan a realizar cambios en el sistema de gestion de calidad',
    relatedQuestions: 'Perfil de cargos con responsabilidades en Calidad',
    standards: [StandardType.ISO9001],
    responsibleArea: 'Gerencia',
    periodicity: Periodicity.ANNUAL,
    compliance2024: true,
    compliance2025: true,
    monthlyPlan: Array.from({ length: 12 }, (_, i) => ({ month: i, planned: i === 11, executed: true, delayed: false })) 
  },

  // --- NEW ITEMS FROM EXCEL IMAGE (6.1, 6.2) ---

  // 6.1.1 - Matriz Riesgos Sistematica
  {
    id: 'GER-020',
    clause: '6.1',
    subClause: '6.1.1',
    clauseTitle: 'Acciones para abordar riesgos y oportunidades',
    description: 'Esta vinculado a las clausulas 4.1 y 4.2. Una vez la organización ha trabajado y determinado los aspectos internos y externos...',
    contextualization: 'La organización dispone de una sistematica que asegure la identificación de los riesgos y oportunidades...?',
    relatedQuestions: 'Matriz de riesgos y oportunidades actualizar e identificar si los riesgo continuan siendo los mismos para todas las áreas',
    standards: [StandardType.ISO9001],
    responsibleArea: 'Gerencia',
    periodicity: Periodicity.SEMIANNUAL,
    compliance2024: true,
    compliance2025: true,
    monthlyPlan: Array.from({ length: 12 }, (_, i) => ({ month: i, planned: i === 5 || i === 11, executed: i === 5, delayed: false })) 
  },
  // 6.1.2 - Actuar sobre Riesgos
  {
    id: 'GER-021',
    clause: '6.1',
    subClause: '6.1.2',
    clauseTitle: 'Acciones para abordar riesgos y oportunidades',
    description: 'Se debe determinar acciones necesarias para hacer frente a los a los riesgos y aprovechar las oportunidades...',
    contextualization: 'La organización ha identificado y actuado sobre aquellos riesgos y oportunidades sobre los que es necesario actuar...?',
    relatedQuestions: 'Matriz de riesgos y oportunidades',
    standards: [StandardType.ISO9001],
    responsibleArea: 'Gerencia',
    periodicity: Periodicity.SEMIANNUAL,
    compliance2024: true,
    compliance2025: true,
    monthlyPlan: Array.from({ length: 12 }, (_, i) => ({ month: i, planned: i === 5 || i === 11, executed: i === 5, delayed: false })) 
  },
  // 6.1.3 - Integracion Acciones
  {
    id: 'GER-022',
    clause: '6.1',
    subClause: '6.1.3',
    clauseTitle: 'Acciones para abordar riesgos y oportunidades',
    description: 'La norma indica que las acciones a tomar frente a los riesgos y las oprotunidades deben ser proporcionales...',
    contextualization: 'La organización a planificado acciones sobre los riesgos y oportunidades identificados como relevantes...?',
    relatedQuestions: 'Matriz DOFA, Matriz de riesgos por area, falta socializarla, No se tiene documentado un procedimiento...',
    standards: [StandardType.ISO9001],
    responsibleArea: 'Gerencia',
    periodicity: Periodicity.ANNUAL,
    compliance2024: false,
    compliance2025: false,
    monthlyPlan: Array.from({ length: 12 }, (_, i) => ({ month: i, planned: i === 11, executed: false, delayed: true })) 
  },
  
  // 6.2 Objetivos
  // 6.2.1
  {
    id: 'GER-023',
    clause: '6.2',
    subClause: '6.2.1',
    clauseTitle: 'Objetivos de calidad y planificación',
    description: 'Los objetivos de calidad deben establecerse sobre aquellas funciones, niveles y procesos que se consideren relevantes...',
    contextualization: 'la organización ha establecido objetivos de calidad sobre las funciones, procesos y niveles relevantes?',
    relatedQuestions: 'la organización ha establecido objetivos de calidad sobre las funciones, procesos y niveles relevantes?',
    standards: [StandardType.ISO9001],
    responsibleArea: 'Gerencia',
    periodicity: Periodicity.ANNUAL,
    compliance2024: true,
    compliance2025: true,
    monthlyPlan: Array.from({ length: 12 }, (_, i) => ({ month: i, planned: i === 11, executed: true, delayed: false })) 
  },
  // 6.2.2
  {
    id: 'GER-024',
    clause: '6.2',
    subClause: '6.2.2',
    clauseTitle: 'Objetivos de calidad y planificación',
    description: 'Los objetivos establecidos deben ser coherentes con la política de calidad de la organización...',
    contextualization: 'Los objetivos de calidad estan en linea con la politica de calidad de la organización?',
    relatedQuestions: 'Los objetivos de calidad estan en linea con la politica de calidad de la organización?',
    standards: [StandardType.ISO9001],
    responsibleArea: 'Gerencia',
    periodicity: Periodicity.ANNUAL,
    compliance2024: true,
    compliance2025: true,
    monthlyPlan: Array.from({ length: 12 }, (_, i) => ({ month: i, planned: i === 11, executed: true, delayed: false })) 
  },
  // 6.2.3
  {
    id: 'GER-025',
    clause: '6.2',
    subClause: '6.2.3',
    clauseTitle: 'Objetivos de calidad y planificación',
    description: 'Los objetivos deben ser medibles y debe realizarse seguimiento sobre los mismos...',
    contextualization: 'Los objetivos de calidad son relevantes para la conformidad de los productos y servicios...?',
    relatedQuestions: 'Los objetivos de calidad son relevantes para la conformidad de los productos y servicios...?',
    standards: [StandardType.ISO9001],
    responsibleArea: 'Gerencia',
    periodicity: Periodicity.ANNUAL,
    compliance2024: true,
    compliance2025: true,
    monthlyPlan: Array.from({ length: 12 }, (_, i) => ({ month: i, planned: i === 11, executed: true, delayed: false })) 
  },
  // 6.2.4
  {
    id: 'GER-026',
    clause: '6.2',
    subClause: '6.2.4',
    clauseTitle: 'Objetivos de calidad y planificación',
    description: 'la organización debe planificar como se va a alcanzar los objetivos...',
    contextualization: 'los objetivos de la organización son medibles y tienen en cuenta los requisitos aplicables?',
    relatedQuestions: 'Los objetivos se deben actualizar a 2025',
    standards: [StandardType.ISO9001],
    responsibleArea: 'Gerencia',
    periodicity: Periodicity.ANNUAL,
    compliance2024: true,
    compliance2025: false,
    monthlyPlan: Array.from({ length: 12 }, (_, i) => ({ month: i, planned: i === 11, executed: false, delayed: false })) 
  },
  // 6.2.5
  {
    id: 'GER-027',
    clause: '6.2',
    subClause: '6.2.5',
    clauseTitle: 'Objetivos de calidad y planificación',
    description: 'La organización también debe determinar cómo evaluar las acciones llevadas a cabo.',
    contextualization: 'los objetivos son comunicados a traves de toda la organización?',
    relatedQuestions: 'GOASP',
    standards: [StandardType.ISO9001],
    responsibleArea: 'Gerencia',
    periodicity: Periodicity.ANNUAL,
    compliance2024: true,
    compliance2025: true,
    monthlyPlan: Array.from({ length: 12 }, (_, i) => ({ month: i, planned: i === 11, executed: true, delayed: false })) 
  },
  // 6.2.6 (Trimestral)
  {
    id: 'GER-028',
    clause: '6.2',
    subClause: '6.2.6',
    clauseTitle: 'Objetivos de calidad y planificación',
    description: 'La organización debe realizar seguimiento de los objetivos de calidad.',
    contextualization: 'la organización dispone de mecanismos para hacer seguimiento de los objetivos de calidad...?',
    relatedQuestions: 'resultados Plan estrategico, Plan de auditoria por procesos (indicadores de calidad)',
    standards: [StandardType.ISO9001],
    responsibleArea: 'Gerencia',
    periodicity: Periodicity.QUARTERLY,
    compliance2024: true,
    compliance2025: true,
    monthlyPlan: Array.from({ length: 12 }, (_, i) => ({ 
      month: i, 
      planned: (i + 1) % 3 === 0, // Mar, Jun, Sep, Dec 
      executed: (i + 1) % 3 === 0 && i < 6, // Executed up to June
      delayed: false 
    })) 
  },
  // 6.2.7
  {
    id: 'GER-029',
    clause: '6.2',
    subClause: '6.2.7',
    clauseTitle: 'Objetivos de calidad y planificación',
    description: 'la organización debe mantener información documentada sobre objetivos de calidad.',
    contextualization: 'la informacion sobre los objetivos se encuentra documentada y archivada?',
    relatedQuestions: 'la informacion sobre los objetivos se encuentra documentada y archivada?',
    standards: [StandardType.ISO9001],
    responsibleArea: 'Gerencia',
    periodicity: Periodicity.ANNUAL,
    compliance2024: true,
    compliance2025: true,
    monthlyPlan: Array.from({ length: 12 }, (_, i) => ({ month: i, planned: i === 11, executed: true, delayed: false })) 
  },
  // 6.2.8
  {
    id: 'GER-030',
    clause: '6.2',
    subClause: '6.2.8',
    clauseTitle: 'Objetivos de calidad y planificación',
    description: 'Cuando se planifica la consecución de objetivos se debe determinar acciones, recursos...',
    contextualization: 'cuando se planifica la consecución de de objetivos se tiene en cuenta : las acciones requeridas...?',
    relatedQuestions: 'cuando se planifica la consecución de de objetivos se tiene en cuenta : las acciones requeridas...',
    standards: [StandardType.ISO9001],
    responsibleArea: 'Gerencia',
    periodicity: Periodicity.ANNUAL,
    compliance2024: true,
    compliance2025: true,
    monthlyPlan: Array.from({ length: 12 }, (_, i) => ({ month: i, planned: i === 11, executed: true, delayed: false })) 
  }
];

export const MOCK_AREA_STATS: AreaStats[] = [
  {
    id: 'area-1',
    name: 'Gerencia',
    totalActivities: 30, // Updated count (was 19)
    completedActivities: 25,
    compliancePercentage: 83,
    previousCompliance: 75
  },
  {
    id: 'area-2',
    name: 'HSEQ',
    totalActivities: 25,
    completedActivities: 24,
    compliancePercentage: 96,
    previousCompliance: 90
  },
  {
    id: 'area-3',
    name: 'Inventarios',
    totalActivities: 10,
    completedActivities: 4,
    compliancePercentage: 40,
    previousCompliance: 50
  },
  {
    id: 'area-4',
    name: 'Producción',
    totalActivities: 30,
    completedActivities: 28,
    compliancePercentage: 93,
    previousCompliance: 92
  },
  {
    id: 'area-5',
    name: 'Compras',
    totalActivities: 12,
    completedActivities: 5,
    compliancePercentage: 41,
    previousCompliance: 60
  },
  {
    id: 'area-6',
    name: 'Talento Humano',
    totalActivities: 18,
    completedActivities: 16,
    compliancePercentage: 88,
    previousCompliance: 85
  },
  {
    id: 'area-7',
    name: 'Ventas',
    totalActivities: 20,
    completedActivities: 19,
    compliancePercentage: 95,
    previousCompliance: 94
  },
  {
    id: 'area-8',
    name: 'Mantenimiento',
    totalActivities: 8,
    completedActivities: 7,
    compliancePercentage: 87,
    previousCompliance: 80
  }
];
