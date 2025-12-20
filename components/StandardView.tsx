
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { MONTHS } from '../constants';
import { Activity, Area, Periodicity, User, Evidence, CommentLog, MonthlyExecution, Plant } from '../types';
import { 
  Check, X, Cloud, FileText, AlertCircle, Filter, Eye, Clock, History, 
  ShieldCheck, CheckCircle, Info, BookOpen, Target, Factory, Shield, 
  FileUp, ExternalLink, ListChecks, ArrowRight, Layers, MapPin, BadgeCheck,
  TreePine, Upload, Move, Link, Globe, ShieldAlert, Folder, Search,
  UserCircle, ChevronLeft, Library, Download, Briefcase, Tags, FileSearch, Monitor,
  Loader2, TableProperties
} from 'lucide-react';
import { dataService } from '../services/dataService';
import * as XLSX from 'xlsx';

interface StandardViewProps {
  standard: string;
  activities: Activity[];
  areas: Area[];
  onUpdateActivity: (activity: Activity) => void;
  currentYear: number;
  setCurrentYear: (year: number) => void;
  currentUser: User;
}

// Simulador de Biblioteca SIG
const SIG_LIBRARY_FS: Record<string, any[]> = {
  'root': [
    { id: 'f1', name: 'Repositorio Auditoría 2025', type: 'folder', items: 'auditoria' },
    { id: 'f2', name: 'Documentación Legal Central', type: 'folder', items: 'legal' },
    { id: '1', name: 'Manual_Gestion_Calidad_V5.pdf', size: '2.4 MB', type: 'pdf' },
  ],
  'auditoria': [
    { id: '2', name: 'Acta_Revision_Gerencia_Q1.pdf', size: '1.2 MB', type: 'pdf' },
    { id: '3', name: 'Matriz_Riesgos_Consolidada.xlsx', size: '450 KB', type: 'excel' },
    { id: '4', name: 'Certificado_ISO_9001_2025.jpg', size: '2.8 MB', type: 'image' },
    { id: '5', name: 'Evidencia_Capacitacion_HSEQ.pdf', size: '5.1 MB', type: 'pdf' },
  ],
  'legal': [
    { id: '7', name: 'Camara_Comercio_Actualizada.pdf', size: '1.1 MB', type: 'pdf' },
    { id: '8', name: 'RUT_Central_Maderas.pdf', size: '300 KB', type: 'pdf' },
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
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [activeActivityId, setActiveActivityId] = useState<string | null>(null);
  const [activeMonthIndex, setActiveMonthIndex] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [adminComment, setAdminComment] = useState('');
  const [uploadTab, setUploadTab] = useState<'FILE' | 'LINK'>('FILE');
  const [externalUrl, setExternalUrl] = useState('');
  const [previewFile, setPreviewFile] = useState<{url: string, name: string, blobUrl?: string} | null>(null);
  const [excelPreview, setExcelPreview] = useState<string | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);

  // Sincronizar norma seleccionada cuando cambia desde el padre (sidebar)
  useEffect(() => {
    setSelectedStandard(initialStandard);
  }, [initialStandard]);

  // Estados Biblioteca SIG
  const [showLibraryPicker, setShowLibraryPicker] = useState(false);
  const [currentFolderPath, setCurrentFolderPath] = useState<string[]>(['root']);

  // Estados para Draggable (Modal de Carga)
  const [modalPos, setModalPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{ startX: number; startY: number }>({ startX: 0, startY: 0 });

  // Estados para Draggable (Modal de Visor/Preview)
  const [previewModalPos, setPreviewModalPos] = useState({ x: 0, y: 0 });
  const [isPreviewDragging, setIsPreviewDragging] = useState(false);
  const previewDragRef = useRef<{ startX: number; startY: number }>({ startX: 0, startY: 0 });

  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * When the sidebar is visible, "center of viewport" can visually land under it.
   * Compensate initial modal X by half the sidebar width so the modal opens centered
   * within the remaining content area (matches expected UX in screenshots).
   */
  const getInitialModalOffset = () => {
    try {
      const sidebar = document.querySelector('aside') as HTMLElement | null;
      const sidebarWidth = sidebar?.getBoundingClientRect().width ?? 0;
      return { x: Math.round(sidebarWidth / 2), y: 0 };
    } catch {
      return { x: 0, y: 0 };
    }
  };

  useEffect(() => {
    const unsub = dataService.subscribeToPlants(data => setPlants(data));
    return () => unsub();
  }, []);

  // Función crítica para convertir Base64 a Blob URL (Visualización Garantizada)
  const createBlobUrl = (dataUri: string) => {
    try {
      if (!dataUri.startsWith('data:')) return dataUri;
      
      const parts = dataUri.split(';base64,');
      const contentType = parts[0].split(':')[1];
      const raw = window.atob(parts[1]);
      const rawLength = raw.length;
      const uInt8Array = new Uint8Array(rawLength);

      for (let i = 0; i < rawLength; ++i) {
        uInt8Array[i] = raw.charCodeAt(i);
      }

      const blob = new Blob([uInt8Array], { type: contentType });
      return URL.createObjectURL(blob);
    } catch (e) {
      console.error("Error creando Blob URL:", e);
      return dataUri;
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragRef.current.startX = e.clientX - modalPos.x;
    dragRef.current.startY = e.clientY - modalPos.y;
  };

  const handlePreviewMouseDown = (e: React.MouseEvent) => {
    setIsPreviewDragging(true);
    previewDragRef.current.startX = e.clientX - previewModalPos.x;
    previewDragRef.current.startY = e.clientY - previewModalPos.y;
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        setModalPos({
          x: e.clientX - dragRef.current.startX,
          y: e.clientY - dragRef.current.startY
        });
      }
      if (isPreviewDragging) {
        setPreviewModalPos({
          x: e.clientX - previewDragRef.current.startX,
          y: e.clientY - previewDragRef.current.startY
        });
      }
    };
    
    const handleMouseUp = () => {
      setIsDragging(false);
      setIsPreviewDragging(false);
    };

    if (isDragging || isPreviewDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isPreviewDragging]);

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
    setModalPos(getInitialModalOffset());
    setShowLibraryPicker(false);
    setCurrentFolderPath(['root']);
  };

  const openInfoModal = (activityId: string) => {
    setActiveActivityId(activityId);
    setInfoModalOpen(true);
  };

  const openPreview = async (url: string, name: string) => {
    setIsPreviewLoading(true);
    setExcelPreview(null);
    setPreviewModalPos(getInitialModalOffset()); // Reset position when opening
    const bUrl = createBlobUrl(url);
    setPreviewFile({ url, name, blobUrl: bUrl });
    setPreviewModalOpen(true);

    // Motor de Previsualización de Excel
    if (name.toLowerCase().endsWith('.xlsx') || name.toLowerCase().endsWith('.xls')) {
      try {
        const response = await fetch(bUrl);
        const arrayBuffer = await response.arrayBuffer();
        const data = new Uint8Array(arrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const html = XLSX.utils.sheet_to_html(worksheet);
        
        // Estilos para la tabla Excel en el visor
        const styledHtml = `
          <style>
            table { width: 100%; border-collapse: collapse; font-family: 'Inter', sans-serif; font-size: 11px; color: #1e293b; background: white; }
            th, td { border: 1px solid #e2e8f0; padding: 10px; text-align: left; min-width: 100px; }
            th { background-color: #f8fafc; font-weight: 800; text-transform: uppercase; color: #64748b; letter-spacing: 0.05em; }
            tr:nth-child(even) { background-color: #f1f5f9; }
            tr:hover { background-color: #e2e8f0; }
          </style>
          ${html}
        `;
        setExcelPreview(styledHtml);
      } catch (e) {
        console.error("Error renderizando Excel:", e);
      }
    }
    setIsPreviewLoading(false);
  };

  // Limpieza de Blob URLs para evitar fugas de memoria
  useEffect(() => {
    return () => {
      if (previewFile?.blobUrl && previewFile.blobUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewFile.blobUrl);
      }
    };
  }, [previewFile]);

  const handleDownload = (url: string, name: string) => {
    if (!url) return;
    const link = document.createElement('a');
    link.href = url;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleEvidenceSubmit = async (type: 'FILE' | 'LINK', data: string, name?: string) => {
    if (!activeActivityId || activeMonthIndex === null) return;
    setIsSaving(true);
    const activityToUpdate = activities.find(a => a.id === activeActivityId);
    if (!activityToUpdate) return;

    const currentPlans = activityToUpdate.plans || {};
    let currentYearPlan = [...(currentPlans[currentYear] || [])];
    
    if (currentYearPlan.length === 0) {
      currentYearPlan = Array.from({ length: 12 }, (_, i) => ({
        month: i, planned: false, executed: false, delayed: false
      }));
    }

    const previousEvidence = currentYearPlan[activeMonthIndex].evidence;
    const historyEntry: CommentLog = {
      id: 'h-' + Date.now(),
      text: previousEvidence?.status === 'REJECTED' 
        ? `Re-carga de evidencia tras rechazo. Nueva versión: ${name || data}` 
        : `Carga inicial de evidencia: ${name || data}`,
      author: currentUser.name,
      date: new Date().toLocaleString(),
      status: 'PENDING',
      fileUrl: previousEvidence?.url,
      fileName: previousEvidence?.fileName
    };

    const newEvidence: Evidence = {
      url: data,
      type: type,
      fileName: name || (type === 'LINK' ? 'Enlace Biblioteca SIG' : 'Documento'),
      uploadedBy: currentUser.name,
      uploadedAt: new Date().toLocaleString(),
      status: 'PENDING',
      history: [historyEntry, ...(previousEvidence?.history || [])]
    };

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

  const selectLibraryFile = (file: any) => {
    if (file.type === 'folder') {
      setCurrentFolderPath([...currentFolderPath, file.items]);
      return;
    }
    const url = `sig-internal-lib://view?id=${file.id}`;
    handleEvidenceSubmit('LINK', url, file.name);
    setShowLibraryPicker(false);
  };

  const goBackLibrary = () => {
    if (currentFolderPath.length > 1) {
      setCurrentFolderPath(currentFolderPath.slice(0, -1));
    }
  };

  const getCurrentLibraryFiles = () => {
    const last = currentFolderPath[currentFolderPath.length - 1];
    return SIG_LIBRARY_FS[last] || [];
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
      
      for (let k = i; k < i + colSpan; k++) {
        let isMonthPlanned = false;
        if (plan.length > 0) {
          if (plan[k]?.planned) isMonthPlanned = true;
        } else {
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
          if (plannedIndex === -1) plannedIndex = k; 
          if (plan[k]?.evidence) {
            evidenceFound = plan[k].evidence;
            evidenceIndex = k;
          } else {
            if (currentYear < currentRealYear || (currentYear === currentRealYear && k <= currentRealMonth)) {
              isOverdue = true;
            }
          }
        }
      }

      let cellBg = "bg-white";
      let cellContent = null;
      let interactionIndex = evidenceIndex !== -1 ? evidenceIndex : (plannedIndex !== -1 ? plannedIndex : i);

      if (evidenceFound) {
        if (evidenceFound.status === 'APPROVED') { 
          cellBg = "bg-green-50/50"; cellContent = <Check size={14} className="text-green-500" />; 
        } else if (evidenceFound.status === 'REJECTED') { 
          cellBg = "bg-orange-50/50"; cellContent = <div className="p-1 bg-orange-100 rounded-full"><AlertCircle size={10} className="text-orange-600" /></div>; 
        } else { 
          cellBg = "bg-blue-50/50"; cellContent = <Clock size={14} className="text-blue-500" />; 
        }
      } else if (hasAnyPlannedInSpan) {
        if (isOverdue) { 
          cellBg = "bg-red-50/30"; cellContent = <span className="text-red-400 font-bold text-xs">!</span>; 
        } else { 
          cellBg = "bg-white"; cellContent = <span className="text-slate-200 font-bold text-[9px]">P</span>; 
        }
      }

      cells.push(
        <td key={i} colSpan={colSpan} className={`border-r p-0 text-center transition-all relative group ${cellBg} border-slate-100 border-b h-10`}>
          <div 
            onClick={() => openModal(activity.id, interactionIndex)} 
            className="w-full h-full flex items-center justify-center cursor-pointer hover:bg-slate-100/50 transition-colors"
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
      switch (activity.periodicity) {
        case Periodicity.MONTHLY: planned = 12; break;
        case Periodicity.BIMONTHLY: planned = 6; break;
        case Periodicity.QUARTERLY: planned = 4; break;
        case Periodicity.SEMIANNUAL: planned = 2; break;
        case Periodicity.ANNUAL: planned = 1; break;
        default: planned = 0;
      }
    }
    return { pending: planned - approved, approved, total: planned };
  };

  const activeActivity = activeActivityId ? activities.find(a => a.id === activeActivityId) : null;
  const activePlan = activeActivity && activeMonthIndex !== null ? (activeActivity.plans?.[currentYear] || [])[activeMonthIndex] : null;
  const activeEvidence = activePlan?.evidence || null;
  const isRejected = activeEvidence?.status === 'REJECTED';

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadstart = () => setIsSaving(true);
      reader.onload = (event) => {
        if (event.target?.result) {
          handleEvidenceSubmit('FILE', event.target.result as string, file.name);
        }
      };
      reader.onerror = () => {
        setIsSaving(false);
        alert('Error al leer el archivo.');
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[calc(100vh-8rem)]">
      <div className="p-4 border-b border-slate-200 bg-white space-y-4 shrink-0">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex items-center bg-slate-100 border border-slate-200 rounded-xl p-1 shadow-inner">
               <button onClick={() => setCurrentYear(2025)} className={`px-4 py-1.5 text-[11px] font-black rounded-lg transition-all ${currentYear === 2025 ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>2025</button>
               <button onClick={() => setCurrentYear(2026)} className={`px-4 py-1.5 text-[11px] font-black rounded-lg transition-all ${currentYear === 2026 ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>2026</button>
            </div>
            <select value={selectedPlant} onChange={(e) => setSelectedPlant(e.target.value)} className="bg-white px-3 py-2 border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-tight shadow-sm outline-none">
              <option value="ALL">TODAS LAS PLANTAS</option>
              {plants.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <select value={selectedArea} onChange={(e) => setSelectedArea(e.target.value)} className="bg-white px-3 py-2 border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-tight shadow-sm outline-none">
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
                  <tr key={activity.id} className="hover:bg-slate-50/30 transition-colors h-10 group">
                    <td className="p-2 border-r border-slate-100 text-center font-black bg-white">{activity.subClause}</td>
                    <td className="p-2 border-r border-slate-100 bg-white">
                      <div className="flex items-center justify-between">
                        <div className="font-bold text-slate-800 text-[9px] leading-tight line-clamp-1">{activity.clauseTitle}</div>
                        <button 
                          onClick={() => openInfoModal(activity.id)} 
                          className="p-1 bg-slate-100 rounded hover:bg-red-600 hover:text-white transition-all ml-1 shrink-0 shadow-sm border border-slate-200"
                          title="Ver más detalles"
                        >
                          <Eye size={12} />
                        </button>
                      </div>
                      <div className="text-[7px] text-slate-400 font-black uppercase mt-0.5">{activity.responsibleArea}</div>
                    </td>
                    <td className="p-2 border-r border-slate-100 bg-white">
                      <div className="text-slate-600 text-[9px] line-clamp-2 italic font-medium">"{activity.relatedQuestions}"</div>
                    </td>
                    {renderPeriodicityCells(activity)}
                    <td className="p-2 text-center sticky right-0 bg-white shadow-l border-l border-slate-100">
                      <div className={`px-1 py-0.5 rounded text-[8px] font-black border ${
                        isReady ? 'bg-green-50 text-green-600 border-green-200 shadow-sm' : 'bg-slate-50 text-slate-500 border-slate-100'
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
            className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[95vh] flex flex-col overflow-hidden border border-slate-200 relative animate-in zoom-in-95 duration-200"
          >
            {/* Cabecera Arrastrable de Gestión de Evidencia */}
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
                    <span className="w-1.5 h-1.5 bg-slate-700 rounded-full"></span>
                    <span className="text-[9px] text-red-400 font-black uppercase tracking-widest truncate max-w-[400px]">Numeral {activeActivity.subClause}: {activeActivity.clauseTitle}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="p-2 bg-slate-800 rounded-xl text-slate-400 border border-slate-700/50 flex items-center gap-2">
                   <Move size={14} />
                   <span className="text-[8px] font-black uppercase tracking-widest hidden sm:inline">Mover</span>
                </div>
                <button onClick={() => setModalOpen(false)} className="p-2 hover:bg-red-600 transition-colors rounded-xl text-white/50 hover:text-white border border-transparent hover:border-red-400"><X size={20} /></button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin bg-slate-50/30">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center">
                        <Cloud size={14} className="mr-2 text-red-600" /> Método de Entrega
                      </h4>
                      <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
                        <button onClick={() => setUploadTab('FILE')} className={`px-4 py-1.5 text-[9px] font-black rounded-lg transition-all ${uploadTab === 'FILE' ? 'bg-white text-slate-900 shadow-sm border border-slate-200' : 'text-slate-400 hover:text-slate-600'}`}>ARCHIVO</button>
                        <button onClick={() => setUploadTab('LINK')} className={`px-4 py-1.5 text-[9px] font-black rounded-lg transition-all ${uploadTab === 'LINK' ? 'bg-white text-slate-900 shadow-sm border border-slate-200' : 'text-slate-400 hover:text-slate-600'}`}>BIBLIOTECA</button>
                      </div>
                    </div>

                    {activeEvidence && !isRejected ? (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200">
                          <div className="flex items-center min-w-0">
                            {activeEvidence.type === 'FILE' ? <FileText className="text-red-600 mr-3 shrink-0" size={24} /> : <Library className="text-purple-600 mr-3 shrink-0" size={24} />}
                            <div className="min-w-0">
                              <p className="text-[11px] font-black text-slate-800 truncate leading-none mb-1">{activeEvidence.fileName}</p>
                              <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">Subido: {activeEvidence.uploadedAt.split(',')[0]}</p>
                            </div>
                          </div>
                          <div className="flex gap-2 shrink-0">
                            <button 
                              onClick={() => openPreview(activeEvidence.url, activeEvidence.fileName)}
                              className="p-2.5 bg-white hover:bg-slate-900 text-slate-600 hover:text-white rounded-xl transition-all shadow-sm border border-slate-200"
                              title="Previsualizar"
                            >
                              <Eye size={16} />
                            </button>
                            <button 
                              onClick={() => window.open(activeEvidence.url, '_blank')}
                              className="p-2.5 bg-white hover:bg-slate-900 text-slate-600 hover:text-white rounded-xl transition-all shadow-sm border border-slate-200"
                              title="Enlace Externo"
                            >
                              <ExternalLink size={16} />
                            </button>
                          </div>
                        </div>
                        <div className={`p-4 rounded-2xl border-2 text-[10px] font-black uppercase text-center tracking-widest flex items-center justify-center gap-2 ${
                          activeEvidence.status === 'APPROVED' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-blue-50 border-blue-200 text-blue-700'
                        }`}>
                          {activeEvidence.status === 'APPROVED' ? <CheckCircle size={14}/> : <Clock size={14}/>}
                          Estado: {activeEvidence.status === 'APPROVED' ? 'APROBADO' : 'PENDIENTE DE REVISIÓN'}
                        </div>
                      </div>
                    ) : (
                      uploadTab === 'FILE' ? (
                        <div 
                          onClick={() => !isSaving && fileInputRef.current?.click()}
                          className={`p-12 text-center border-3 border-dashed border-slate-200 rounded-[2rem] hover:bg-red-50/30 hover:border-red-400 transition-all cursor-pointer group bg-slate-50/50 ${isSaving ? 'opacity-50 cursor-wait' : ''}`}
                        >
                          <input type="file" ref={fileInputRef} onChange={handleFileInputChange} className="hidden" />
                          {isSaving ? (
                            <Loader2 size={40} className="mx-auto text-red-600 mb-4 animate-spin" />
                          ) : (
                            <Upload size={40} className="mx-auto text-slate-300 mb-4 group-hover:text-red-600 transition-transform group-hover:-translate-y-1" />
                          )}
                          <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] group-hover:text-red-700 leading-relaxed">
                            {isSaving ? 'PROCESANDO ARCHIVO...' : isRejected ? 'REINTENTAR CARGA TRAS RECHAZO' : 'CLIC PARA ADJUNTAR EVIDENCIA'}
                          </p>
                          <p className="text-[8px] text-slate-300 font-bold uppercase mt-2 tracking-widest">PDF, PNG, JPG o XLSX (Máx 20MB)</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 shadow-inner">
                            <div className="flex items-center gap-3 mb-4">
                              <div className="p-2 bg-purple-100 text-purple-600 rounded-xl shadow-sm"><Library size={20}/></div>
                              <span className="text-[10px] font-black uppercase tracking-widest text-slate-700">Biblioteca SIG Central</span>
                            </div>
                            
                            <div className="space-y-3">
                               <button 
                                onClick={() => setShowLibraryPicker(true)}
                                className="w-full flex items-center justify-center gap-2 py-4 bg-purple-600 text-white text-[10px] font-black uppercase rounded-2xl shadow-lg shadow-purple-100 hover:bg-purple-700 transition-all active:scale-95"
                              >
                                 <Folder size={16} /> Explorar Directorio SIG
                              </button>
                              
                              <div className="relative flex items-center py-4">
                                 <div className="flex-grow border-t border-slate-200"></div>
                                 <span className="flex-shrink mx-4 text-[8px] font-black text-slate-300 uppercase tracking-widest">vínculo manual</span>
                                 <div className="flex-grow border-t border-slate-200"></div>
                              </div>

                              <input 
                                type="text" 
                                placeholder="Pegue la URL del documento compartido..." 
                                value={externalUrl}
                                onChange={(e) => setExternalUrl(e.target.value)}
                                className="w-full bg-white p-4 rounded-2xl border border-slate-200 text-[10px] font-bold outline-none focus:border-purple-500 shadow-sm"
                              />
                              
                              <button 
                                onClick={() => externalUrl && handleEvidenceSubmit('LINK', externalUrl)}
                                className="w-full py-3 bg-white text-slate-600 text-[9px] font-black uppercase rounded-xl border border-slate-200 hover:bg-slate-50 tracking-widest transition-colors"
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
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center px-2"><History size={14} className="mr-2 text-slate-400" /> Historial de Revisiones</h4>
                    <div className="space-y-3 max-h-56 overflow-y-auto pr-3 scrollbar-thin">
                      {activeEvidence?.history?.map((log, idx) => (
                        <div key={idx} className="flex gap-4 text-[10px] p-4 bg-white rounded-2xl border border-slate-100 relative overflow-hidden shadow-sm group">
                          <div className={`w-1.5 absolute left-0 top-0 h-full ${log.status === 'APPROVED' ? 'bg-green-500' : log.status === 'REJECTED' ? 'bg-orange-500' : 'bg-red-600'}`}></div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-center mb-1.5">
                              <span className="font-black text-slate-900 uppercase tracking-tight">{log.author}</span>
                              <span className="text-slate-400 text-[8px] font-bold">{log.date}</span>
                            </div>
                            <p className="text-slate-500 font-medium leading-relaxed italic border-l-2 border-slate-100 pl-3">"{log.text}"</p>
                            
                            {(log.fileUrl || (idx > 0 && activeEvidence?.url)) && (
                              <div className="mt-3 pt-3 border-t border-slate-50 flex items-center gap-3">
                                 <button 
                                  onClick={() => openPreview(log.fileUrl || activeEvidence!.url, log.fileName || activeEvidence!.fileName)}
                                  className="flex items-center gap-1.5 text-blue-600 hover:text-blue-800 font-black text-[9px] uppercase tracking-tighter transition-all"
                                 >
                                   <Eye size={12} /> Previsualizar
                                 </button>
                                 <button 
                                  onClick={() => handleDownload(log.fileUrl || activeEvidence!.url, log.fileName || activeEvidence!.fileName)}
                                  className="flex items-center gap-1.5 text-slate-600 hover:text-slate-800 font-black text-[9px] uppercase tracking-tighter transition-all"
                                 >
                                   <Download size={12} /> Descargar versión
                                 </button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                      {!activeEvidence && <p className="text-[10px] text-slate-300 font-bold italic text-center py-6 border-2 border-dashed border-slate-100 rounded-3xl uppercase tracking-[0.2em]">Sin trazabilidad previa</p>}
                    </div>
                  </div>
                </div>

                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 flex flex-col shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-red-600/5 rounded-full -translate-y-12 translate-x-12"></div>
                  <div className="flex items-center gap-4 mb-8">
                    <div className="p-3 bg-red-50 rounded-2xl border border-red-100 shadow-sm"><ShieldCheck size={24} className="text-red-600" /></div>
                    <div>
                      <h4 className="text-xs font-black text-slate-900 uppercase tracking-tight leading-none mb-1.5">Veredicto Auditor</h4>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">Criterio de Evaluación SIG</p>
                    </div>
                  </div>
                  
                  <textarea 
                    value={adminComment} 
                    onChange={e => setAdminComment(e.target.value)} 
                    rows={8} 
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-5 text-[11px] font-bold text-slate-700 focus:border-red-600 focus:bg-white transition-all outline-none shadow-inner flex-1 resize-none mb-6 placeholder:text-slate-400" 
                    placeholder="Ingrese comentarios técnicos, no conformidades o notas de cumplimiento..." 
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <button onClick={() => handleAdminVerification('REJECTED')} className="py-5 bg-white hover:bg-orange-50 text-orange-700 rounded-2xl text-[10px] font-black uppercase border-2 border-orange-100 transition-all flex items-center justify-center gap-2 active:scale-95">
                      <X size={18} /> Rechazar Hallazgo
                    </button>
                    <button onClick={() => handleAdminVerification('APPROVED')} className="py-5 bg-slate-900 hover:bg-black text-white rounded-2xl text-[10px] font-black uppercase shadow-xl shadow-slate-200 transition-all flex items-center justify-center gap-2 active:scale-95">
                      <BadgeCheck size={18} /> Validar Cumplimiento
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-6 bg-white border-t border-slate-100 flex justify-end gap-3 shrink-0">
               <button onClick={() => setModalOpen(false)} className="px-12 py-4 bg-slate-900 text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.3em] shadow-xl hover:bg-black transition-all active:scale-95 flex items-center gap-3">
                 Cerrar Consulta
                 <ArrowRight size={16}/>
               </button>
            </div>

            {/* EXPLORADOR BIBLIOTECA SIG */}
            {showLibraryPicker && (
              <div className="absolute inset-0 z-[10000] bg-white animate-in slide-in-from-bottom duration-300 flex flex-col">
                <div className="p-5 bg-slate-900 border-b flex justify-between items-center shrink-0">
                   <div className="flex items-center gap-4">
                      <div className="p-2.5 bg-purple-600 text-white rounded-2xl shadow-lg"><Library size={20}/></div>
                      <span className="text-sm font-black uppercase tracking-tight text-white">Biblioteca Central SIG Central Maderas</span>
                   </div>
                   <button onClick={() => setShowLibraryPicker(false)} className="p-3 hover:bg-slate-700 rounded-full text-white/50 hover:text-white transition-colors"><X size={20} /></button>
                </div>

                <div className="flex-1 flex flex-col min-h-0">
                  <div className="p-4 border-b flex gap-4 items-center shrink-0 bg-slate-50">
                      <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input type="text" placeholder="Buscar documentos, manuales o registros..." className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:border-purple-500 outline-none shadow-sm" />
                      </div>
                      <div className="flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase text-slate-600 bg-white border border-slate-200 rounded-xl shadow-sm">
                        <UserCircle className="text-purple-600" size={16} /> {currentUser.name}
                      </div>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-6 scrollbar-thin bg-white">
                      <div className="grid grid-cols-1 gap-2 max-w-4xl mx-auto">
                        {currentFolderPath.length > 1 && (
                          <div 
                            onClick={goBackLibrary}
                            className="flex items-center p-4 text-purple-600 text-[11px] font-black uppercase hover:bg-purple-50 cursor-pointer rounded-2xl border-2 border-purple-100 mb-4 transition-all shadow-sm active:scale-[0.98]"
                          >
                              <div className="p-2 bg-purple-100 rounded-xl mr-4">
                                <ChevronLeft size={20} />
                              </div>
                              Nivel Superior / Carpeta Anterior
                          </div>
                        )}

                        <div className="flex items-center p-3 text-slate-400 text-[10px] font-black uppercase tracking-widest mb-4 border-b-2 border-slate-50">
                            Ubicación Actual: {currentFolderPath.join(' / ').toUpperCase()}
                        </div>

                        {getCurrentLibraryFiles().map(file => (
                            <div 
                            key={file.id} 
                            onClick={() => selectLibraryFile(file)}
                            className={`flex items-center justify-between p-5 border-2 border-transparent hover:border-purple-200 hover:bg-purple-50 cursor-pointer rounded-2xl transition-all group shadow-sm mb-2 ${file.type === 'folder' ? 'bg-slate-50' : 'bg-white'}`}
                            >
                              <div className="flex items-center min-w-0">
                                  <div className={`p-3 rounded-2xl mr-5 shadow-sm transition-transform group-hover:scale-110 ${
                                    file.type === 'folder' ? 'bg-purple-600 text-white' : 
                                    file.type === 'pdf' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'
                                  }`}>
                                    {file.type === 'folder' ? <Folder size={24} /> : <FileText size={24} />}
                                  </div>
                                  <div className="min-w-0">
                                    <p className={`text-[12px] font-black uppercase tracking-tight group-hover:text-purple-700 truncate ${file.type === 'folder' ? 'text-purple-600' : 'text-slate-700'}`}>
                                      {file.name}
                                    </p>
                                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1 flex items-center gap-2">
                                      {file.type === 'folder' ? <><Layers size={10}/> Repositorio Organizado</> : <><History size={10}/> Versión Actualizada • {file.size}</>}
                                    </p>
                                  </div>
                              </div>
                              <div className="flex items-center gap-3 shrink-0">
                                <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest group-hover:text-purple-400 transition-colors">{file.type === 'folder' ? 'Abrir' : 'Seleccionar'}</span>
                                <ArrowRight size={18} className="text-slate-200 group-hover:text-purple-500 transform translate-x-0 group-hover:translate-x-1 transition-all" />
                              </div>
                            </div>
                        ))}
                      </div>
                  </div>
                  <div className="p-6 bg-slate-50 border-t flex justify-end">
                      <button onClick={() => setShowLibraryPicker(false)} className="px-10 py-3.5 bg-white border-2 border-slate-200 rounded-2xl text-[11px] font-black uppercase text-slate-400 hover:text-slate-900 shadow-sm transition-all hover:border-slate-300">Cancelar y Volver</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* MODAL DE PREVISUALIZACIÓN REDISEÑADO (SOLUCIÓN BLOB URL + MOTOR EXCEL + PDF FIX) */}
      {previewModalOpen && previewFile && (
        <div className="fixed inset-0 bg-slate-950/95 flex items-center justify-center z-[10001] p-4 backdrop-blur-xl animate-in fade-in duration-300">
           <div 
             style={{ transform: `translate(${previewModalPos.x}px, ${previewModalPos.y}px)` }}
             className="bg-white rounded-[2rem] shadow-2xl w-[95%] max-w-5xl h-[85vh] flex flex-col overflow-hidden border border-white/10 animate-in zoom-in-95 duration-200"
           >
              {/* Header del Visor Arrastrable */}
              <div 
                onMouseDown={handlePreviewMouseDown}
                className="p-5 bg-slate-900 text-white flex justify-between items-center shrink-0 border-b border-white/5 cursor-move active:cursor-grabbing select-none"
              >
                 <div className="flex items-center gap-5">
                    <div className="p-3 bg-blue-600 rounded-2xl shadow-xl shadow-blue-900/40 group">
                      <Monitor size={22} className="text-white group-hover:scale-110 transition-transform" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-black uppercase tracking-widest leading-none mb-1.5 flex items-center gap-2">
                        Visor de Evidencia SIG 
                        <span className="text-[8px] bg-white/10 px-2 py-0.5 rounded border border-white/10 text-white/50 uppercase tracking-tighter">Renderizado Dinámico HSEQ</span>
                      </h3>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.15em] truncate max-w-[400px]">{previewFile.name}</p>
                    </div>
                 </div>
                 <div className="flex items-center gap-4">
                    <button 
                      onClick={() => handleDownload(previewFile.url, previewFile.name)}
                      className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-900/30 active:scale-95"
                    >
                      <Download size={16} /> Descargar Archivo
                    </button>
                    <div className="w-px h-8 bg-white/10 mx-2"></div>
                    <button onClick={() => setPreviewModalOpen(false)} className="p-3 hover:bg-red-600 transition-colors rounded-2xl text-white/50 hover:text-white border border-transparent hover:border-red-400 active:scale-90">
                      <X size={28} />
                    </button>
                 </div>
              </div>
              
              {/* Área de Visualización Real */}
              <div className="flex-1 bg-slate-800 flex items-center justify-center relative overflow-hidden">
                 <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:20px_20px]"></div>
                 
                 <div className="w-full h-full flex flex-col items-center justify-center p-0">
                    {isPreviewLoading ? (
                      <div className="text-center space-y-4 animate-in fade-in duration-300">
                         <Loader2 size={64} className="mx-auto text-blue-500 animate-spin" />
                         <p className="text-xs font-black text-slate-400 uppercase tracking-[0.3em]">Preparando visualización segura...</p>
                      </div>
                    ) : excelPreview ? (
                      /* CASO: EXCEL RENDERIZADO */
                      <div className="w-full h-full bg-white overflow-auto p-10 scrollbar-thin animate-in slide-in-from-bottom-4 duration-500">
                         <div className="flex items-center gap-3 mb-8 p-4 bg-green-50 text-green-700 border border-green-200 rounded-2xl max-w-fit shadow-sm">
                            <TableProperties size={24} />
                            <div>
                               <p className="text-[10px] font-black uppercase tracking-widest">Vista Interactiva Excel</p>
                               <p className="text-[8px] opacity-70 font-bold uppercase tracking-tighter">Hoja de Cálculo SIG Corporativa</p>
                            </div>
                         </div>
                         <div className="overflow-x-auto shadow-2xl rounded-xl border border-slate-100" dangerouslySetInnerHTML={{ __html: excelPreview }} />
                      </div>
                    ) : previewFile.url.startsWith('sig-internal-lib://') ? (
                      /* Caso: Documento de Biblioteca Interna */
                      <div className="text-center p-12 bg-white/5 rounded-[3rem] backdrop-blur-md border border-white/10 max-w-lg space-y-6">
                         <div className="p-8 bg-purple-600/20 text-purple-400 rounded-full inline-block mb-4 shadow-2xl">
                           <Library size={80} className="animate-pulse" />
                         </div>
                         <h4 className="text-xl font-black text-white uppercase tracking-tight">Recurso de Biblioteca Central</h4>
                         <p className="text-xs text-slate-400 font-medium leading-relaxed">Este documento reside en el almacenamiento centralizado de la organización. El acceso se realiza mediante el sistema de gestión de archivos interno.</p>
                         <div className="pt-6 flex gap-3">
                            <button onClick={() => window.open(previewFile.url.replace('sig-internal-lib://view?id=', 'https://docs.google.com/open?id='), '_blank')} className="flex-1 px-8 py-4 bg-purple-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-purple-700 transition-all flex items-center justify-center gap-3">
                               <ExternalLink size={16} /> Abrir en Biblioteca
                            </button>
                         </div>
                      </div>
                    ) : (previewFile.name.toLowerCase().endsWith('.pdf') || previewFile.url.startsWith('data:application/pdf')) ? (
                      /* Caso: PDF Real (FIX: Usando embed para máxima compatibilidad con visor nativo) */
                      <div className="w-full h-full relative flex items-center justify-center bg-slate-900/50">
                        <embed 
                          src={previewFile.blobUrl} 
                          type="application/pdf" 
                          className="w-full h-full border-none shadow-2xl" 
                        />
                        <div className="absolute top-4 left-4 bg-slate-900/60 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 opacity-0 hover:opacity-100 transition-opacity">
                           <p className="text-[10px] text-white font-black uppercase tracking-widest">Navegación nativa PDF activa</p>
                        </div>
                      </div>
                    ) : (previewFile.name.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)$/) || previewFile.url.startsWith('data:image')) ? (
                      /* Caso: Imagen Real */
                      <div className="w-full h-full flex items-center justify-center p-8 overflow-auto">
                        <img 
                          src={previewFile.blobUrl || previewFile.url} 
                          alt="Evidencia" 
                          className="max-w-full max-h-full object-contain rounded-xl shadow-2xl ring-4 ring-white/5 transition-transform hover:scale-[1.02]" 
                        />
                      </div>
                    ) : (
                      /* Caso: Fallback Formatos No Compatibles Directamente (Word/ZIP) */
                      <div className="text-center p-12 bg-white/5 rounded-[3rem] backdrop-blur-md border border-white/10 max-w-lg space-y-8">
                         <div className="p-8 bg-blue-600/20 text-blue-400 rounded-full inline-block mb-4 shadow-2xl">
                           <FileSearch size={80} />
                         </div>
                         <div className="space-y-4">
                           <h4 className="text-2xl font-black text-white uppercase tracking-tight">Formato Solo Descarga</h4>
                           <p className="text-xs text-slate-400 font-medium leading-relaxed">Este tipo de archivo (Word o ZIP) requiere una aplicación externa para ser procesado manteniendo su integridad original.</p>
                         </div>
                         <button 
                          onClick={() => handleDownload(previewFile.url, previewFile.name)}
                          className="w-full py-5 bg-white text-slate-900 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-2xl hover:bg-slate-100 transition-all flex items-center justify-center gap-3"
                         >
                           <Download size={20} /> Descargar Copia Local
                         </button>
                      </div>
                    )}
                 </div>
              </div>
              
              {/* Footer Informativo */}
              <div className="p-4 bg-slate-900 border-t border-white/5 flex justify-center text-slate-500 overflow-hidden shrink-0">
                 <p className="text-[10px] font-black uppercase tracking-[0.4em] animate-pulse">
                   CONTROL DE SEGURIDAD INTEGRAL SIG • CENTRAL DE MADERAS
                 </p>
              </div>
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
