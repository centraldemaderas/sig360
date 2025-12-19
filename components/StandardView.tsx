
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { MONTHS } from '../constants';
import { Activity, Area, Periodicity, User, Evidence, CommentLog, MonthlyExecution, Plant } from '../types';
import { 
  Check, X, Cloud, FileText, AlertCircle, Filter, Eye, Clock, History, 
  ShieldCheck, CheckCircle, Info, BookOpen, Target, Factory, Shield, 
  FileUp, ExternalLink, ListChecks, ArrowRight, Layers, MapPin, BadgeCheck,
  TreePine, Upload, Move, Link, Globe, ShieldAlert, Folder, Search,
  UserCircle, ChevronLeft
} from 'lucide-react';
import { dataService } from '../services/dataService';

interface StandardViewProps {
  standard: string;
  activities: Activity[];
  areas: Area[];
  onUpdateActivity: (activity: Activity) => void;
  currentYear: number;
  setCurrentYear: (year: number) => void;
  currentUser: User;
}

// Mock de sistema de archivos para el simulador de OneDrive con soporte de carpetas
const ONEDRIVE_FS: Record<string, any[]> = {
  'root': [
    { id: 'f1', name: 'Auditoría 2025', type: 'folder', items: 'auditoria' },
    { id: 'f2', name: 'Documentos Legales', type: 'folder', items: 'legal' },
    { id: '1', name: 'Manual_Calidad_G&S.pdf', size: '2.4 MB', type: 'pdf' },
  ],
  'auditoria': [
    { id: '2', name: 'Acta de Gerencia_2025.pdf', size: '1.2 MB', type: 'pdf' },
    { id: '3', name: 'Matriz_Riesgos_V2.xlsx', size: '450 KB', type: 'excel' },
    { id: '4', name: 'Politica_Calidad_Firmada.jpg', size: '2.8 MB', type: 'image' },
    { id: '5', name: 'Evidencia_Auditoria_Interna.pdf', size: '5.1 MB', type: 'pdf' },
    { id: '6', name: 'Plan_Estrategico_G&S.docx', size: '890 KB', type: 'word' },
  ],
  'legal': [
    { id: '7', name: 'Camara_Comercio_2025.pdf', size: '1.1 MB', type: 'pdf' },
    { id: '8', name: 'RUT_Actualizado.pdf', size: '300 KB', type: 'pdf' },
  ]
};

export const StandardView: React.FC<StandardViewProps> = ({ 
  standard: initialStandard, 
  activities, 
  areas,
  onUpdateActivity,
  currentYear,
  setCurrentYear,
  currentUser
}) => {
  const [selectedArea, setSelectedArea] = useState('ALL');
  const [selectedPlant, setSelectedPlant] = useState('ALL'); 
  const [selectedStandard, setSelectedStandard] = useState(initialStandard);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const [activeActivityId, setActiveActivityId] = useState<string | null>(null);
  const [activeMonthIndex, setActiveMonthIndex] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [adminComment, setAdminComment] = useState('');
  const [uploadTab, setUploadTab] = useState<'FILE' | 'LINK'>('FILE');
  const [externalUrl, setExternalUrl] = useState('');

  // Estados OneDrive
  const [showOneDrivePicker, setShowOneDrivePicker] = useState(false);
  const [isOneDriveLoggingIn, setIsOneDriveLoggingIn] = useState(false);
  const [isOneDriveAuthenticated, setIsOneDriveAuthenticated] = useState(false);
  const [currentFolderPath, setCurrentFolderPath] = useState<string[]>(['root']);

  // Estados para Draggable
  const [modalPos, setModalPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{ startX: number; startY: number }>({ startX: 0, startY: 0 });

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setSelectedStandard(initialStandard);
  }, [initialStandard]);

  useEffect(() => {
    const unsub = dataService.subscribeToPlants(data => setPlants(data));
    return () => unsub();
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragRef.current.startX = e.clientX - modalPos.x;
    dragRef.current.startY = e.clientY - modalPos.y;
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      setModalPos({
        x: e.clientX - dragRef.current.startX,
        y: e.clientY - dragRef.current.startY
      });
    };
    const handleMouseUp = () => setIsDragging(false);

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const filteredActivities = useMemo(() => {
    return activities
      .filter(a => {
        const matchesStandard = selectedStandard === 'ALL' || a.standards.includes(selectedStandard);
        const matchesArea = selectedArea === 'ALL' || a.responsibleArea === selectedArea;
        const matchesPlant = selectedPlant === 'ALL' || 
          (a.plantIds && a.plantIds.map(id => id.toUpperCase()).includes(selectedPlant.toUpperCase()));
        return matchesStandard && matchesArea && matchesPlant;
      })
      .sort((a, b) => {
        const pA = a.subClause.split('.').map(n => parseInt(n) || 0);
        const pB = b.subClause.split('.').map(n => parseInt(n) || 0);
        for (let i = 0; i < Math.max(pA.length, pB.length); i++) {
          const valA = pA[i] || 0;
          const valB = pB[i] || 0;
          if (valA !== valB) return valA - valB;
        }
        return 0;
      });
  }, [activities, selectedStandard, selectedArea, selectedPlant]);

  const stats = useMemo(() => {
    let approved = 0, pending = 0, rejected = 0, overdue = 0;
    const currentRealMonth = new Date().getMonth(), currentRealYear = new Date().getFullYear();
    filteredActivities.forEach(activity => {
      const plan = activity.plans?.[currentYear] || [];
      plan.forEach((m, idx) => {
        if (m.planned) {
          if (m.evidence) {
            if (m.evidence.status === 'APPROVED') approved++;
            else if (m.evidence.status === 'REJECTED') rejected++;
            else pending++;
          } else {
            if (currentYear < currentRealYear || (currentYear === currentRealYear && idx <= currentRealMonth)) overdue++;
          }
        }
      });
    });
    return { approved, pending, rejected, overdue, totalActive: filteredActivities.length };
  }, [filteredActivities, currentYear]);

  const openModal = (activityId: string, monthIndex: number) => {
    setActiveActivityId(activityId);
    setActiveMonthIndex(monthIndex);
    setModalOpen(true);
    setAdminComment('');
    setIsSaving(false);
    setUploadTab('FILE');
    setExternalUrl('');
    setModalPos({ x: 0, y: 0 }); 
    setShowOneDrivePicker(false);
    setCurrentFolderPath(['root']);
  };

  const handleEvidenceSubmit = async (type: 'FILE' | 'LINK', data: string, name?: string) => {
    if (!activeActivityId || activeMonthIndex === null) return;
    setIsSaving(true);
    const activityToUpdate = activities.find(a => a.id === activeActivityId);
    if (!activityToUpdate) return;

    const currentPlans = activityToUpdate.plans || {};
    let currentYearPlan = [...(currentPlans[currentYear] || [])];
    
    // Si el plan está vacío para este año, lo inicializamos con 12 meses vacíos
    if (currentYearPlan.length === 0) {
      currentYearPlan = Array.from({ length: 12 }, (_, i) => ({
        month: i,
        planned: false,
        executed: false,
        delayed: false
      }));
    }

    const newEvidence: Evidence = {
      url: data,
      type: type,
      fileName: name || (type === 'LINK' ? 'Enlace OneDrive/Externo' : 'Documento'),
      uploadedBy: currentUser.name,
      uploadedAt: new Date().toLocaleString(),
      status: 'PENDING',
      history: [{
        id: 'h-' + Date.now(),
        text: `Carga de evidencia (${type}): ${name || data}`,
        author: currentUser.name,
        date: new Date().toLocaleString(),
        status: 'PENDING'
      }]
    };

    // Al subir evidencia, nos aseguramos que ese mes cuente como "planificado" 
    currentYearPlan[activeMonthIndex] = { 
      ...currentYearPlan[activeMonthIndex], 
      planned: true, 
      evidence: newEvidence 
    };

    const updatedActivity: Activity = { 
      ...activityToUpdate, 
      plans: { ...currentPlans, [currentYear]: currentYearPlan } 
    };
    await onUpdateActivity(updatedActivity);
    setIsSaving(false);
  };

  const handleAdminVerification = async (status: 'APPROVED' | 'REJECTED') => {
    if (!activeActivityId || activeMonthIndex === null) return;
    setIsSaving(true);
    const activityToUpdate = activities.find(a => a.id === activeActivityId);
    if (!activityToUpdate) return;
    const currentYearPlan = [...(activityToUpdate.plans?.[currentYear] || [])];
    const targetPlan = currentYearPlan[activeMonthIndex];
    if (!targetPlan?.evidence) return;
    
    const newCommentEntry: CommentLog = {
      id: `log-adm-${Date.now()}`,
      text: adminComment || (status === 'APPROVED' ? 'Evidencia validada y aprobada.' : 'Evidencia rechazada por inconformidad.'),
      author: currentUser.name,
      date: new Date().toLocaleString(),
      status: status
    };
    
    const updatedEvidence: Evidence = {
      ...targetPlan.evidence,
      status: status,
      adminComment: newCommentEntry.text,
      approvedBy: status === 'APPROVED' ? currentUser.name : null as any,
      rejectionDate: status === 'REJECTED' ? new Date().toISOString() : null as any,
      history: [newCommentEntry, ...targetPlan.evidence.history]
    };

    currentYearPlan[activeMonthIndex] = { ...targetPlan, evidence: updatedEvidence };
    const updatedActivity: Activity = { ...activityToUpdate, plans: { ...(activityToUpdate.plans || {}), [currentYear]: currentYearPlan } };
    await onUpdateActivity(updatedActivity);
    setIsSaving(false);
    setModalOpen(false);
  };

  const handleOneDriveLogin = () => {
    setIsOneDriveLoggingIn(true);
    setTimeout(() => {
      setIsOneDriveLoggingIn(false);
      setIsOneDriveAuthenticated(true);
    }, 1500);
  };

  const selectOneDriveFile = (file: any) => {
    if (file.type === 'folder') {
      setCurrentFolderPath([...currentFolderPath, file.items]);
      return;
    }
    const url = `https://onedrive.live.com/view?id=${file.id}`;
    handleEvidenceSubmit('LINK', url, file.name);
    setShowOneDrivePicker(false);
  };

  const goBackOneDrive = () => {
    if (currentFolderPath.length > 1) {
      setCurrentFolderPath(currentFolderPath.slice(0, -1));
    }
  };

  const getCurrentFiles = () => {
    const last = currentFolderPath[currentFolderPath.length - 1];
    return ONEDRIVE_FS[last] || [];
  };

  const renderPeriodicityCells = (activity: Activity) => {
    const plan = activity.plans?.[currentYear] || [];
    const cells = [];
    const currentRealMonth = new Date().getMonth();
    const currentRealYear = new Date().getFullYear();
    
    let i = 0;
    while (i < 12) {
      let colSpan = 1;
      switch (activity.periodicity) {
        case Periodicity.ANNUAL: colSpan = 12; break;
        case Periodicity.SEMIANNUAL: colSpan = 6; break;
        case Periodicity.QUARTERLY: colSpan = 3; break;
        case Periodicity.BIMONTHLY: colSpan = 2; break;
        case Periodicity.MONTHLY: default: colSpan = 1; break;
      }
      if (i + colSpan > 12) colSpan = 12 - i;
      
      let evidenceFound = null;
      let evidenceIndex = -1;
      let hasAnyPlannedInSpan = false;
      let plannedIndex = -1;
      let isOverdue = false;
      
      // Analizamos cada mes dentro del colSpan
      for (let k = i; k < i + colSpan; k++) {
        let isMonthPlanned = false;
        
        // 1. Verificar si está planificado físicamente o virtualmente
        if (plan.length > 0) {
          if (plan[k]?.planned) isMonthPlanned = true;
        } else {
          // Lógica virtual
          switch (activity.periodicity) {
            case Periodicity.MONTHLY: isMonthPlanned = true; break;
            case Periodicity.ANNUAL: isMonthPlanned = k === 11; break;
            case Periodicity.SEMIANNUAL: isMonthPlanned = k === 5 || k === 11; break;
            case Periodicity.QUARTERLY: isMonthPlanned = (k + 1) % 3 === 0; break;
            case Periodicity.BIMONTHLY: isMonthPlanned = k % 2 === 0; break;
          }
        }

        if (isMonthPlanned) {
          hasAnyPlannedInSpan = true;
          // Guardamos el índice para la interacción del modal
          if (plannedIndex === -1) plannedIndex = k; 

          // 2. Verificar evidencia para este mes específico
          if (plan[k]?.evidence) {
            evidenceFound = plan[k].evidence;
            evidenceIndex = k;
            // Si hay evidencia, paramos de buscar "vencidos" en este span para priorizar el estado de la evidencia
          } else {
            // 3. Si no hay evidencia y es un mes pasado en el año actual o un año pasado
            if (currentYear < currentRealYear || (currentYear === currentRealYear && k <= currentRealMonth)) {
              isOverdue = true;
            }
          }
        }
      }

      // Prioridad de renderizado: Evidencia > Vencido (!) > Pendiente (P)
      let cellBg = "bg-white";
      let cellContent = null;
      let interactionIndex = evidenceIndex !== -1 ? evidenceIndex : (plannedIndex !== -1 ? plannedIndex : i);

      if (evidenceFound) {
        if (evidenceFound.status === 'APPROVED') { 
          cellBg = "bg-green-50/50"; 
          cellContent = <Check size={14} className="text-green-500" />; 
        } else if (evidenceFound.status === 'REJECTED') { 
          cellBg = "bg-orange-50/50"; 
          cellContent = <div className="p-1 bg-orange-100 rounded-full"><AlertCircle size={10} className="text-orange-600" /></div>; 
        } else { 
          cellBg = "bg-blue-50/50"; 
          cellContent = <Clock size={14} className="text-blue-500" />; 
        }
      } else if (hasAnyPlannedInSpan) {
        if (isOverdue) { 
          cellBg = "bg-red-50/30"; 
          cellContent = <span className="text-red-400 font-bold text-xs">!</span>; 
        } else { 
          cellBg = "bg-white"; 
          cellContent = <span className="text-slate-200 font-bold text-[9px]">P</span>; 
        }
      }

      cells.push(
        <td key={i} colSpan={colSpan} className={`border-r p-0 text-center transition-all relative group ${cellBg} border-slate-100 border-b h-10`}>
          <div 
            onClick={() => openModal(activity.id, interactionIndex)} 
            className="w-full h-full flex items-center justify-center cursor-pointer hover:bg-slate-100/50 transition-colors"
            title="Haga clic para gestionar evidencia"
          >
            {cellContent}
          </div>
        </td>
      );
      i += colSpan;
    }
    return cells;
  };

  const getMissingTasks = (activity: Activity) => {
    const plan = activity.plans?.[currentYear] || [];
    let planned = 0, approved = 0;
    
    if (plan.length > 0) {
      plan.forEach(m => {
        if (m.planned) {
          planned++;
          if (m.evidence?.status === 'APPROVED') approved++;
        }
      });
    } else {
      // Cálculo virtual de tareas basado en la periodicidad para el contador de avance
      switch (activity.periodicity) {
        case Periodicity.MONTHLY: planned = 12; break;
        case Periodicity.BIMONTHLY: planned = 6; break;
        case Periodicity.QUARTERLY: planned = 4; break;
        case Periodicity.SEMIANNUAL: planned = 2; break;
        case Periodicity.ANNUAL: planned = 1; break;
        default: planned = 0;
      }
      approved = 0;
    }

    return { pending: planned - approved, approved, total: planned };
  };

  const activeActivity = activeActivityId ? activities.find(a => a.id === activeActivityId) : null;
  const activePlan = activeActivity && activeMonthIndex !== null ? (activeActivity.plans?.[currentYear] || [])[activeMonthIndex] : null;
  const activeEvidence = activePlan?.evidence || null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[calc(100vh-8rem)]">
      <div className="p-4 border-b border-slate-200 bg-white space-y-4 shrink-0">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex items-center bg-slate-100 border border-slate-200 rounded-xl p-1 shadow-inner">
               <button onClick={() => setCurrentYear(2025)} className={`px-4 py-1.5 text-[11px] font-black rounded-lg transition-all ${currentYear === 2025 ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>2025</button>
               <button onClick={() => setCurrentYear(2026)} className={`px-4 py-1.5 text-[11px] font-black rounded-lg transition-all ${currentYear === 2026 ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>2026</button>
            </div>
            <select value={selectedPlant} onChange={(e) => setSelectedPlant(e.target.value)} className="bg-white px-3 py-2 border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-tight shadow-sm outline-none focus:ring-2 focus:ring-red-600/20">
              <option value="ALL">TODAS LAS PLANTAS</option>
              {plants.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <select value={selectedArea} onChange={(e) => setSelectedArea(e.target.value)} className="bg-white px-3 py-2 border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-tight shadow-sm outline-none focus:ring-2 focus:ring-red-600/20">
              <option value="ALL">TODAS LAS ÁREAS</option>
              {areas.map(area => <option key={area.id} value={area.name}>{area.name}</option>)}
            </select>
          </div>

          <div className="flex gap-2 flex-wrap xl:flex-nowrap">
            <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl">
              <ListChecks size={14} className="text-slate-500" />
              <div className="flex flex-col"><span className="text-[14px] font-black text-slate-800 leading-none">{stats.totalActive}</span><span className="text-[7px] font-bold text-slate-400 uppercase">Total Requisitos</span></div>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-100 rounded-xl">
              <Check size={14} className="text-green-600" />
              <div className="flex flex-col"><span className="text-[14px] font-black text-green-700 leading-none">{stats.approved}</span><span className="text-[7px] font-bold text-green-600 uppercase">Aprobados</span></div>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-100 rounded-xl">
              <Clock size={14} className="text-blue-600" />
              <div className="flex flex-col"><span className="text-[14px] font-black text-blue-700 leading-none">{stats.pending}</span><span className="text-[7px] font-bold text-blue-600 uppercase">Pendientes</span></div>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 bg-orange-50 border border-orange-100 rounded-xl">
              <AlertCircle size={14} className="text-orange-600" />
              <div className="flex flex-col"><span className="text-[14px] font-black text-orange-700 leading-none">{stats.rejected}</span><span className="text-[7px] font-bold text-orange-600 uppercase">Rechazados</span></div>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-100 rounded-xl">
              <ShieldAlert size={14} className="text-red-600" />
              <div className="flex flex-col"><span className="text-[14px] font-black text-red-700 leading-none">{stats.overdue}</span><span className="text-[7px] font-bold text-red-600 uppercase">Vencidos</span></div>
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-auto flex-1 scrollbar-thin">
        <table className="w-full text-[10px] text-left border-collapse table-fixed">
          <thead className="bg-slate-50 text-slate-400 font-black uppercase text-[9px] tracking-widest sticky top-0 z-10 shadow-sm border-b border-slate-200">
            <tr>
              <th className="p-2 border-r w-12 text-center">Claus..</th>
              <th className="p-2 border-r min-w-[150px]">Requisito</th>
              <th className="p-2 border-r min-w-[180px]">Criterio Auditoría</th>
              {MONTHS.map(m => <th key={m} className="p-2 border-r text-center w-8">{m}</th>)}
              <th className="p-2 w-16 text-center sticky right-0 bg-slate-50 border-l">Avance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredActivities.map((activity) => {
                const { pending, total, approved } = getMissingTasks(activity);
                const isReady = total > 0 && pending === 0;

                return (
                  <tr key={activity.id} className="hover:bg-slate-50/30 transition-colors h-10">
                    <td className="p-2 border-r border-slate-100 text-center font-black bg-white">{activity.subClause}</td>
                    <td className="p-2 border-r border-slate-100 bg-white">
                      <div className="font-bold text-slate-800 text-[9px] leading-tight line-clamp-1">{activity.clauseTitle}</div>
                      <div className="text-[7px] text-slate-400 font-black uppercase mt-0.5">{activity.responsibleArea}</div>
                    </td>
                    <td className="p-2 border-r border-slate-100 bg-white">
                      <div className="text-slate-600 text-[9px] line-clamp-2 italic font-medium">"{activity.relatedQuestions}"</div>
                    </td>
                    {renderPeriodicityCells(activity)}
                    <td className="p-2 text-center sticky right-0 bg-white shadow-l border-l border-slate-100">
                      <div className={`px-1 py-0.5 rounded text-[8px] font-black border transition-colors ${
                        isReady 
                          ? 'bg-green-50 text-green-600 border-green-200 shadow-sm' 
                          : 'bg-slate-50 text-slate-500 border-slate-100'
                      }`}>
                        {isReady ? 'LISTO' : `${approved}/${total}`}
                      </div>
                    </td>
                  </tr>
                );
            })}
          </tbody>
        </table>
      </div>

      {modalOpen && activeActivity && activeMonthIndex !== null && (
        <div className="fixed inset-0 bg-slate-950/60 flex items-center justify-center z-[9999] p-4 backdrop-blur-sm animate-in fade-in duration-300">
          <div 
            style={{ transform: `translate(${modalPos.x}px, ${modalPos.y}px)` }}
            className="bg-white rounded-3xl shadow-[0_35px_60px_-15px_rgba(0,0,0,0.3)] w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200 shadow-2xl relative"
          >
            <div 
              onMouseDown={handleMouseDown}
              className="p-5 bg-slate-900 text-white flex justify-between items-center shrink-0 cursor-move active:cursor-grabbing select-none"
            >
              <div className="flex items-center">
                <div className="p-2.5 bg-red-600 rounded-2xl mr-4 shadow-lg shadow-red-900/40">
                  <FileUp size={22} className="text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-tight leading-none mb-1">Gestión de Evidencia</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{MONTHS[activeMonthIndex]} {currentYear}</span>
                    <span className="w-1 h-1 bg-slate-700 rounded-full"></span>
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest truncate max-w-[300px]">{activeActivity.clauseTitle}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-slate-800 rounded-lg text-slate-500"><Move size={14} /></div>
                <button onClick={() => setModalOpen(false)} className="p-2 hover:bg-red-600 transition-colors rounded-xl text-white/50 hover:text-white"><X size={20} /></button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-2 gap-8 scrollbar-thin">
              <div className="space-y-6">
                <div className="bg-[#f8fafc] p-5 rounded-2xl border border-slate-100 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center">
                      <Cloud size={14} className="mr-2" /> Método de Entrega
                    </h4>
                    <div className="flex bg-slate-200 p-1 rounded-lg">
                      <button onClick={() => setUploadTab('FILE')} className={`px-2 py-1 text-[8px] font-black rounded ${uploadTab === 'FILE' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>ARCHIVO</button>
                      <button onClick={() => setUploadTab('LINK')} className={`px-2 py-1 text-[8px] font-black rounded ${uploadTab === 'LINK' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>ENLACE</button>
                    </div>
                  </div>

                  {activeEvidence ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
                        <div className="flex items-center">
                          {activeEvidence.type === 'FILE' ? <FileText className="text-blue-500 mr-3" size={20} /> : <Globe className="text-purple-500 mr-3" size={20} />}
                          <div className="overflow-hidden">
                            <p className="text-[11px] font-black text-slate-800 truncate leading-none mb-1">{activeEvidence.fileName}</p>
                            <p className="text-[8px] text-slate-400 font-bold uppercase">Subido por {activeEvidence.uploadedBy}</p>
                          </div>
                        </div>
                        <button onClick={() => window.open(activeEvidence.url, '_blank')} className="p-2 bg-slate-50 hover:bg-slate-900 text-slate-600 hover:text-white rounded-xl transition-all shadow-sm border border-slate-100">
                          <ExternalLink size={16} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    uploadTab === 'FILE' ? (
                      <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="p-10 text-center border-2 border-dashed border-slate-200 rounded-3xl hover:bg-blue-50/50 hover:border-blue-400 transition-all cursor-pointer group"
                      >
                        <input type="file" ref={fileInputRef} onChange={(e) => {
                          const f = e.target.files?.[0];
                          if(f) handleEvidenceSubmit('FILE', 'mock_url_'+f.name, f.name);
                        }} className="hidden" />
                        <Upload size={32} className="mx-auto text-slate-300 mb-3 group-hover:text-blue-500 transition-transform group-hover:-translate-y-1" />
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest group-hover:text-blue-600">Click para adjuntar del PC</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="p-4 bg-white rounded-2xl border border-slate-200">
                          <div className="flex items-center gap-3 mb-3">
                            <img src="https://upload.wikimedia.org/wikipedia/commons/3/3c/Microsoft_Office_OneDrive_%282019%E2%80%93present%29.svg" className="w-5 h-5" alt="OneDrive" />
                            <span className="text-[10px] font-black uppercase tracking-tighter text-slate-700">OneDrive / Link Corporativo</span>
                          </div>
                          
                          <div className="space-y-3">
                             <button 
                              onClick={() => setShowOneDrivePicker(true)}
                              className="w-full flex items-center justify-center gap-2 py-4 bg-[#0078d4] text-white text-[10px] font-black uppercase rounded-xl shadow-lg shadow-blue-200 hover:bg-[#005a9e] transition-all"
                            >
                               <ExternalLink size={14} /> Seleccionar de OneDrive
                            </button>
                            
                            <div className="relative flex items-center py-2">
                               <div className="flex-grow border-t border-slate-200"></div>
                               <span className="flex-shrink mx-4 text-[8px] font-black text-slate-300 uppercase tracking-widest">o enlace manual</span>
                               <div className="flex-grow border-t border-slate-200"></div>
                            </div>

                            <input 
                              type="text" 
                              placeholder="Pegue aquí el enlace compartido..." 
                              value={externalUrl}
                              onChange={(e) => setExternalUrl(e.target.value)}
                              className="w-full bg-slate-50 p-3 rounded-xl border border-slate-100 text-[10px] font-bold outline-none focus:border-blue-500 transition-all"
                            />
                            
                            <button 
                              onClick={() => externalUrl && handleEvidenceSubmit('LINK', externalUrl)}
                              className="w-full py-2 bg-slate-100 text-slate-600 text-[9px] font-black uppercase rounded-lg hover:bg-slate-200 transition-all"
                            >
                              Vincular URL Manual
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  )}
                </div>
                
                <div className="space-y-3">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center px-1"><History size={14} className="mr-2" /> Historial de Cambios</h4>
                  <div className="space-y-3 max-h-48 overflow-y-auto pr-2 scrollbar-thin">
                    {activeEvidence?.history?.map((log, idx) => (
                      <div key={idx} className="flex gap-3 text-[10px] p-3 bg-slate-50/50 rounded-2xl border border-slate-100">
                        <div className={`w-2 h-2 rounded-full mt-1 shrink-0 ${log.status === 'APPROVED' ? 'bg-green-500' : log.status === 'REJECTED' ? 'bg-orange-500' : 'bg-blue-600'}`}></div>
                        <div>
                          <p className="font-black text-slate-800 uppercase leading-none mb-1">{log.author} <span className="text-slate-400 mx-1">•</span> <span className="text-slate-400">{log.date}</span></p>
                          <p className="text-slate-500 font-medium leading-relaxed italic">"{log.text}"</p>
                        </div>
                      </div>
                    ))}
                    {!activeEvidence && <p className="text-[10px] text-slate-400 italic text-center py-4">Sin registros previos.</p>}
                  </div>
                </div>
              </div>

              <div className="bg-[#f8fafc] p-6 rounded-3xl border-2 border-slate-100 flex flex-col shadow-inner">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-sm"><ShieldCheck size={20} className="text-red-600" /></div>
                  <div>
                    <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-tighter leading-none mb-1">Verificación Auditora</h4>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Panel de Validación Normativa</p>
                  </div>
                </div>
                
                <textarea 
                  value={adminComment} 
                  onChange={e => setAdminComment(e.target.value)} 
                  rows={6} 
                  className="w-full bg-white border border-slate-200 rounded-2xl p-4 text-[11px] font-bold text-slate-700 focus:border-red-600 transition-all outline-none shadow-sm flex-1 resize-none mb-4" 
                  placeholder="Describa motivos técnicos de aprobación o rechazo..." 
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <button onClick={() => handleAdminVerification('REJECTED')} className="py-4 bg-orange-100 hover:bg-orange-200 text-orange-800 rounded-2xl text-[10px] font-black uppercase border border-orange-200 transition-all flex items-center justify-center gap-2">
                    <X size={16} /> Rechazar
                  </button>
                  <button onClick={() => handleAdminVerification('APPROVED')} className="py-4 bg-green-600 hover:bg-green-700 text-white rounded-2xl text-[10px] font-black uppercase shadow-xl shadow-green-200 transition-all flex items-center justify-center gap-2">
                    <CheckCircle size={16} /> Aprobar
                  </button>
                </div>
              </div>
            </div>
            
            <div className="p-5 bg-white border-t border-slate-100 flex justify-end">
              <button onClick={() => setModalOpen(false)} className="px-10 py-3.5 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl">Cerrar Panel</button>
            </div>

            {/* SIMULADOR DE ONEDRIVE PICKER */}
            {showOneDrivePicker && (
              <div className="absolute inset-0 z-[10000] bg-white animate-in slide-in-from-bottom duration-300 flex flex-col">
                <div className="p-4 bg-[#f3f2f1] border-b flex justify-between items-center shrink-0">
                   <div className="flex items-center gap-3">
                      <img src="https://upload.wikimedia.org/wikipedia/commons/3/3c/Microsoft_Office_OneDrive_%282019%E2%80%93present%29.svg" className="w-5 h-5" alt="OneDrive" />
                      <span className="text-[11px] font-black uppercase tracking-tight text-slate-700">Explorador de OneDrive</span>
                   </div>
                   <button onClick={() => setShowOneDrivePicker(false)} className="p-2 hover:bg-slate-200 rounded-full text-slate-400"><X size={18} /></button>
                </div>

                {!isOneDriveAuthenticated ? (
                  <div className="flex-1 flex flex-col items-center justify-center p-10 bg-[#faf9f8]">
                     <img src="https://upload.wikimedia.org/wikipedia/commons/3/3c/Microsoft_Office_OneDrive_%282019%E2%80%93present%29.svg" className="w-16 h-16 mb-6" alt="OneDrive" />
                     <h4 className="text-lg font-bold text-slate-800 mb-2">Inicia sesión en Microsoft</h4>
                     <p className="text-xs text-slate-500 mb-6 text-center max-w-xs">Para vincular archivos directamente desde su nube corporativa de Microsoft 365.</p>
                     
                     <button 
                      onClick={handleOneDriveLogin}
                      disabled={isOneDriveLoggingIn}
                      className="flex items-center gap-3 px-8 py-3 bg-white border border-slate-300 shadow-sm rounded hover:bg-slate-50 transition-all font-semibold text-sm"
                     >
                       {isOneDriveLoggingIn ? (
                         <div className="animate-spin h-5 w-5 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                       ) : (
                         <>
                           <img src="https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg" className="w-5" alt="MS" />
                           Iniciar sesión
                         </>
                       )}
                     </button>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col min-h-0">
                    <div className="p-3 border-b flex gap-3 items-center shrink-0">
                       <div className="relative flex-1">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                          <input type="text" placeholder="Buscar en mis archivos..." className="w-full pl-9 pr-4 py-2 bg-slate-100 border-transparent rounded text-xs focus:bg-white focus:border-blue-500 outline-none" />
                       </div>
                       <div className="flex items-center gap-2 px-3 text-[10px] font-bold text-slate-600 bg-slate-100 rounded-full">
                          <UserCircle className="text-blue-600" size={14} /> {currentUser.name}
                       </div>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-4 scrollbar-thin bg-white">
                       <div className="grid grid-cols-1 gap-1">
                          {currentFolderPath.length > 1 && (
                            <div 
                              onClick={goBackOneDrive}
                              className="flex items-center p-3 text-blue-600 text-[10px] font-black uppercase hover:bg-blue-50 cursor-pointer rounded border border-blue-100 mb-2 transition-all"
                            >
                               <div className="p-2 bg-blue-100 rounded-lg mr-3 shadow-sm">
                                  <ChevronLeft size={16} />
                                </div>
                               Regresar / Subir de Nivel
                            </div>
                          )}

                          <div className="flex items-center p-2 text-slate-400 text-[9px] font-black uppercase tracking-widest mb-2 border-b border-slate-100">
                             Ruta: {currentFolderPath.join(' / ')}
                          </div>

                          {getCurrentFiles().map(file => (
                             <div 
                              key={file.id} 
                              onClick={() => selectOneDriveFile(file)}
                              className={`flex items-center justify-between p-4 border border-transparent hover:border-blue-200 hover:bg-blue-50 cursor-pointer rounded-2xl transition-all group shadow-sm mb-1 ${file.type === 'folder' ? 'bg-slate-50/50' : 'bg-white'}`}
                             >
                                <div className="flex items-center">
                                   <div className={`p-2.5 rounded-xl mr-4 shadow-sm ${
                                      file.type === 'folder' ? 'bg-blue-600 text-white' : 
                                      file.type === 'pdf' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'
                                   }`}>
                                      {file.type === 'folder' ? <Folder size={20} /> : <FileText size={20} />}
                                   </div>
                                   <div>
                                      <p className={`text-[11px] font-black uppercase tracking-tight group-hover:text-blue-700 ${file.type === 'folder' ? 'text-blue-600' : 'text-slate-700'}`}>
                                        {file.name}
                                      </p>
                                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                                        {file.type === 'folder' ? 'Directorio corporativo' : `Modificado: Ayer • ${file.size}`}
                                      </p>
                                   </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  {file.type === 'folder' && <span className="text-[8px] font-black text-blue-400 uppercase mr-2">Abrir</span>}
                                  <ArrowRight size={16} className="text-slate-300 group-hover:text-blue-500 transform translate-x-0 group-hover:translate-x-1 transition-all" />
                                </div>
                             </div>
                          ))}
                       </div>
                    </div>
                    <div className="p-4 bg-slate-50 border-t flex justify-end">
                       <button onClick={() => setShowOneDrivePicker(false)} className="px-8 py-2.5 bg-white border border-slate-300 rounded-xl text-[10px] font-black uppercase text-slate-500 hover:text-slate-800 shadow-sm transition-all">Cancelar</button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
      
      {infoModalOpen && activeActivity && (
        <div className="fixed inset-0 bg-slate-950/70 flex items-start justify-center z-[9999] p-4 pt-10 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col animate-in slide-in-from-top-4 duration-300 border border-slate-200 overflow-hidden">
             <div className="p-6 bg-[#1e293b] text-white flex justify-between items-center shrink-0">
                <div className="flex items-center">
                   <div className="p-3 bg-red-600 rounded-xl mr-4 shadow-xl">
                     <BookOpen size={24} className="text-white" />
                   </div>
                   <div>
                      <h3 className="text-sm font-black leading-tight tracking-tight uppercase line-clamp-2">{activeActivity.clauseTitle}</h3>
                      <div className="flex gap-2 mt-2">
                        <span className="text-[8px] font-black uppercase tracking-wider bg-blue-900/60 px-2 py-1 rounded border border-blue-700/50">Numeral: {activeActivity.subClause}</span>
                        <span className="text-[8px] font-black uppercase tracking-wider bg-slate-800 px-2 py-1 rounded border border-slate-700">{activeActivity.periodicity}</span>
                      </div>
                   </div>
                </div>
                <button onClick={() => setInfoModalOpen(false)} className="p-2 hover:bg-slate-700 rounded-full text-slate-400 hover:text-white"><X size={24} /></button>
             </div>
             <div className="p-6 space-y-6 overflow-y-auto scrollbar-thin flex-1">
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 text-[11px] text-slate-600 leading-relaxed italic font-medium">
                  <div className="flex items-center text-slate-400 font-black text-[9px] uppercase tracking-widest mb-3"><ShieldCheck size={14} className="mr-2" /> Descripción</div>
                  "{activeActivity.description}"
                </div>
                <div className="bg-blue-50/30 p-6 rounded-2xl border border-blue-100/50 text-[11px] text-slate-800 leading-relaxed font-semibold">
                  <div className="flex items-center text-blue-600 font-black text-[9px] uppercase tracking-widest mb-3"><Target size={14} className="mr-2" /> Contexto Interno</div>
                  {activeActivity.contextualization}
                </div>
                <div className="bg-orange-50/30 p-6 rounded-2xl border border-orange-100/50 text-[11px] text-orange-950 font-black">
                  <div className="flex items-center text-orange-600 font-black text-[9px] uppercase tracking-widest mb-3"><BadgeCheck size={14} className="mr-2" /> Criterio de Auditoría</div>
                  {activeActivity.relatedQuestions}
                </div>
             </div>
             <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
                <button onClick={() => setInfoModalOpen(false)} className="px-8 py-3 bg-[#0f172a] text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg flex items-center gap-2">Cerrar Consulta <ArrowRight size={14}/></button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};
