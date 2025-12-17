
import React, { useState, useEffect } from 'react';
import { MONTHS, AREAS } from '../constants';
import { Activity, StandardType, Periodicity, User, UserRole, Evidence, CommentLog, MonthlyExecution, Plant } from '../types';
import { 
  Check, Upload, FileText, AlertCircle, Filter, Eye, X, Cloud, 
  HardDrive, Paperclip, Calendar, Download, Link as LinkIcon, 
  Image as ImageIcon, ExternalLink, RefreshCw, ThumbsUp, ThumbsDown, 
  MessageSquare, Clock, History, User as UserIcon, Send, ShieldCheck, 
  CheckCircle, Info, BookOpen, Target, Briefcase, Loader2, Factory, MapPin
} from 'lucide-react';
import { dataService } from '../services/dataService';

interface StandardViewProps {
  standard: string;
  activities: Activity[];
  onUpdateActivity: (activity: Activity) => void;
  currentYear: number;
  setCurrentYear: (year: number) => void;
  currentUser: User;
}

export const StandardView: React.FC<StandardViewProps> = ({ 
  standard, 
  activities, 
  onUpdateActivity,
  currentYear,
  setCurrentYear,
  currentUser
}) => {
  const [selectedArea, setSelectedArea] = useState('ALL');
  const [selectedPlant, setSelectedPlant] = useState('MOSQUERA'); 
  const [plants, setPlants] = useState<Plant[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const [activeActivityId, setActiveActivityId] = useState<string | null>(null);
  const [activeMonthIndex, setActiveMonthIndex] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadType, setUploadType] = useState<'file' | 'link' | null>(null);
  const [linkInput, setLinkInput] = useState('');
  const [adminComment, setAdminComment] = useState('');
  const [updateNote, setUpdateNote] = useState('');
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsub = dataService.subscribeToPlants(data => setPlants(data));
    return () => unsub();
  }, []);

  const filteredActivities = activities.filter(a => {
    const matchesStandard = a.standards.includes(standard);
    const matchesArea = selectedArea === 'ALL' || a.responsibleArea === selectedArea;
    const matchesPlant = selectedPlant === 'ALL' || 
                         selectedPlant === 'MOSQUERA' || 
                         a.plantIds?.includes(selectedPlant);
                         
    return matchesStandard && matchesArea && matchesPlant;
  });

  const openModal = (activityId: string, monthIndex: number) => {
    setActiveActivityId(activityId);
    setActiveMonthIndex(monthIndex);
    setModalOpen(true);
    setUploadType(null);
    setLinkInput('');
    setAdminComment('');
    setUpdateNote('');
    setIsSaving(false);
  };

  const openInfoModal = (activityId: string) => {
    setActiveActivityId(activityId);
    setInfoModalOpen(true);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeActivityId || activeMonthIndex === null) return;
    setIsSaving(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      updateActivityEvidence(base64, 'FILE', file.name);
    };
    reader.readAsDataURL(file);
  };

  const handleLinkSubmit = () => {
    if (!linkInput.trim() || !activeActivityId || activeMonthIndex === null) return;
    setIsSaving(true);
    updateActivityEvidence(linkInput, 'LINK', 'Enlace OneDrive/Web');
  };

  const getPlanForYear = (activity: Activity, year: number): MonthlyExecution[] => {
    if (activity.plans && activity.plans[year]) return activity.plans[year];
    if (year === 2025 && activity.monthlyPlan) return activity.monthlyPlan;
    return Array.from({ length: 12 }, (_, i) => {
      let isPlanned = false;
      switch (activity.periodicity) {
        case Periodicity.MONTHLY: isPlanned = true; break;
        case Periodicity.BIMONTHLY: isPlanned = i % 2 === 0; break;
        case Periodicity.QUARTERLY: isPlanned = (i + 1) % 3 === 0; break;
        case Periodicity.SEMIANNUAL: isPlanned = i === 5 || i === 11; break;
        case Periodicity.ANNUAL: isPlanned = i === 11; break;
      }
      return { month: i, planned: isPlanned, executed: false, delayed: false };
    });
  };

  const updateActivityEvidence = async (url: string, type: 'FILE' | 'LINK', fileName: string) => {
      const activityToUpdate = activities.find(a => a.id === activeActivityId);
      if (!activityToUpdate || activeMonthIndex === null) return;
      const currentYearPlan = getPlanForYear(activityToUpdate, currentYear);
      const existingItem = currentYearPlan[activeMonthIndex];
      const existingHistory = existingItem.evidence?.history || [];
      const initialStatus = 'PENDING';
      const updateLog: CommentLog = {
        id: `log-upd-${Date.now()}`,
        text: updateNote || (existingItem.evidence ? 'Se cargó una nueva versión de la evidencia para revisión.' : 'Carga inicial de evidencia.'),
        author: currentUser.name,
        date: new Date().toLocaleString(),
        status: initialStatus
      };
      const newYearPlan = currentYearPlan.map((item, index) => {
        if (index !== activeMonthIndex) return item;
        return {
          ...item,
          executed: true,
          evidence: {
            url, type, fileName,
            uploadedBy: currentUser.name,
            uploadedAt: new Date().toLocaleString(),
            status: initialStatus,
            adminComment: updateLog.text,
            history: [updateLog, ...existingHistory]
          } as Evidence
        };
      });
      const updatedActivity: Activity = {
        ...activityToUpdate,
        plans: { ...(activityToUpdate.plans || {}), [currentYear]: newYearPlan }
      };
      await onUpdateActivity(updatedActivity);
      const allUsers = await dataService.getUsersOnce();
      const targetUsers = allUsers.filter(u => u.role === UserRole.ADMIN || (u.assignedArea === activityToUpdate.responsibleArea));
      for (const target of targetUsers) {
        await dataService.createNotification({
          userId: target.id,
          title: 'Nueva Evidencia Subida',
          message: `${currentUser.name} ha cargado evidencia para "${activityToUpdate.clauseTitle}" del área ${activityToUpdate.responsibleArea} (${MONTHS[activeMonthIndex]} ${currentYear})`,
          date: new Date().toLocaleString(),
          read: false,
          type: 'NEW_UPLOAD'
        });
      }
      setIsSaving(false);
      setModalOpen(false);
  };

  const handleAdminVerification = async (status: 'APPROVED' | 'REJECTED') => {
    if (!activeActivityId || activeMonthIndex === null) return;
    setIsSaving(true);
    const activityToUpdate = activities.find(a => a.id === activeActivityId);
    if (!activityToUpdate) return;
    const currentYearPlan = getPlanForYear(activityToUpdate, currentYear);
    const targetPlan = currentYearPlan[activeMonthIndex];
    if (!targetPlan || !targetPlan.evidence) return;
    const newCommentEntry: CommentLog = {
      id: `log-adm-${Date.now()}`,
      text: adminComment || (status === 'APPROVED' ? 'Evidencia validada y aprobada.' : 'Evidencia rechazada por inconformidad.'),
      author: currentUser.name,
      date: new Date().toLocaleString(),
      status: status
    };
    const newYearPlan = currentYearPlan.map((item, index) => {
      if (index !== activeMonthIndex) return item;
      const updatedEvidence: Evidence = {
        ...(item.evidence as Evidence),
        status: status,
        adminComment: newCommentEntry.text,
        approvedBy: status === 'APPROVED' ? currentUser.name : null as any,
        rejectionDate: status === 'REJECTED' ? new Date().toISOString() : null as any,
        history: [newCommentEntry, ...(item.evidence?.history || [])]
      };
      return { ...item, evidence: updatedEvidence };
    });
    const updatedActivity: Activity = {
      ...activityToUpdate,
      plans: { ...(activityToUpdate.plans || {}), [currentYear]: newYearPlan }
    };
    await onUpdateActivity(updatedActivity);
    const allUsers = await dataService.getUsersOnce();
    const areaUsers = allUsers.filter(u => u.assignedArea === activityToUpdate.responsibleArea);
    for (const targetUser of areaUsers) {
      await dataService.createNotification({
        userId: targetUser.id,
        title: status === 'APPROVED' ? '✅ Evidencia Aprobada' : '❌ Evidencia Rechazada',
        message: status === 'APPROVED' 
          ? `Tu evidencia para "${activityToUpdate.clauseTitle}" de ${activityToUpdate.responsibleArea} ha sido validada.`
          : `Tu evidencia para "${activityToUpdate.clauseTitle}" fue rechazada por el auditor: ${adminComment}`,
        date: new Date().toLocaleString(),
        read: false,
        type: status === 'APPROVED' ? 'APPROVAL' : 'REJECTION'
      });
    }
    setIsSaving(false);
    setModalOpen(false);
  };

  const handleDownloadEvidence = (url: string, fileName: string, type: 'FILE' | 'LINK') => {
    if (type === 'LINK') { window.open(url, '_blank'); } 
    else {
      const link = document.createElement("a");
      link.href = url; link.download = fileName;
      document.body.appendChild(link); link.click();
      document.body.removeChild(link);
    }
  };

  const renderPeriodicityCells = (activity: Activity) => {
    const plan = getPlanForYear(activity, currentYear);
    const cells = [];
    let i = 0;
    const isFutureYear = currentYear > new Date().getFullYear();
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
      let isPlanned = false;
      let plannedIndex = -1;
      for (let k = i; k < i + colSpan; k++) {
        if (plan[k]?.evidence) { evidenceFound = plan[k].evidence; evidenceIndex = k; }
        if (plan[k]?.planned) { isPlanned = true; plannedIndex = k; }
      }
      let interactionIndex = evidenceIndex !== -1 ? evidenceIndex : (plannedIndex !== -1 ? plannedIndex : i + colSpan - 1);
      let cellBg = "bg-slate-50"; 
      let cellContent = null;
      let borderColor = "border-slate-200";
      if (evidenceFound) {
        if (evidenceFound.status === 'APPROVED') { cellBg = "bg-green-100 border-green-300"; } 
        else if (evidenceFound.status === 'REJECTED') { cellBg = "bg-orange-100 border-orange-300"; } 
        else { cellBg = "bg-blue-100 border-blue-300"; }
      } else if (isPlanned) {
         if (isFutureYear) { cellBg = "bg-slate-200 text-slate-400"; cellContent = <span className="text-[9px] font-bold">P</span>; } 
         else {
            const currentRealMonth = new Date().getMonth();
            const currentRealYear = new Date().getFullYear();
            const isOverdue = currentYear < currentRealYear || (currentYear === currentRealYear && i <= currentRealMonth);
            if (isOverdue) { cellBg = "bg-red-50 border-red-200"; cellContent = <span className="text-[10px] font-bold text-red-300">!</span>; } 
            else { cellBg = "bg-slate-200 border-slate-300"; cellContent = <span className="text-[9px] font-bold text-slate-400">P</span>; }
         }
      } else { cellBg = "bg-slate-50 opacity-50"; }
      cells.push(
        <td key={i} colSpan={colSpan} className={`border-r p-1 text-center transition-all relative group ${cellBg} ${borderColor} border-b`}>
          <div className="w-full h-full min-h-[40px] flex items-center justify-center relative">
             {evidenceFound ? (
               <div className="flex space-x-1">
                 {evidenceFound.status === 'APPROVED' && <Check size={14} className="text-green-600" />}
                 {evidenceFound.status === 'REJECTED' && <AlertCircle size={14} className="text-orange-600" />}
                 {evidenceFound.status === 'PENDING' && <Clock size={14} className="text-blue-600" />}
                 <div className="absolute inset-0 bg-white/90 hidden group-hover:flex items-center justify-center space-x-2 rounded shadow-sm z-10">
                    <button onClick={() => handleDownloadEvidence(evidenceFound!.url, evidenceFound!.fileName, evidenceFound!.type)} className="p-1 hover:bg-slate-100 rounded text-slate-600" title="Ver Evidencia"><Eye size={14} /></button>
                    <button onClick={() => openModal(activity.id, interactionIndex)} className="p-1 hover:bg-slate-100 rounded text-blue-600" title={currentUser.role === UserRole.ADMIN ? "Verificar" : "Actualizar"}>
                      {currentUser.role === UserRole.ADMIN ? <Check size={14} /> : <RefreshCw size={14} />}
                    </button>
                 </div>
               </div>
             ) : (
               <div onClick={() => isPlanned && openModal(activity.id, interactionIndex)} className={`w-full h-full flex items-center justify-center ${isPlanned ? 'cursor-pointer' : ''}`}>
                 {cellContent}
               </div>
             )}
          </div>
        </td>
      );
      i += colSpan;
    }
    return cells;
  };

  const getYearStatus = (activity: Activity) => {
    const plan = getPlanForYear(activity, currentYear);
    if (currentYear > new Date().getFullYear()) return { status: 'FUTURE', color: 'bg-slate-100 text-slate-400', label: 'Futuro' };
    let totalPlanned = 0, totalExecuted = 0, totalApproved = 0, totalOverdue = 0;
    const currentRealMonth = new Date().getMonth(), currentRealYear = new Date().getFullYear();
    plan.forEach((m, idx) => {
      if (m.planned) {
        totalPlanned++;
        if (m.evidence) { totalExecuted++; if (m.evidence.status === 'APPROVED') totalApproved++; } 
        else if (currentYear < currentRealYear || (currentYear === currentRealYear && idx <= currentRealMonth)) { totalOverdue++; }
      }
    });
    if (totalOverdue > 0) return { status: 'DELAYED', color: 'bg-red-100 text-red-700 border-red-200', label: `${totalOverdue} Pend` };
    if (totalPlanned === 0) return { status: 'NONE', color: 'bg-slate-50 text-slate-400', label: '-' };
    if (totalExecuted === totalPlanned) {
      if (totalApproved === totalPlanned) return { status: 'COMPLIANT', color: 'bg-green-100 text-green-700 border-green-200', label: 'Listo' };
      return { status: 'REVIEW', color: 'bg-blue-100 text-blue-700 border-blue-200', label: 'Rev' };
    }
    return { status: 'PROGRESS', color: 'bg-blue-50 text-blue-600 border-blue-100', label: 'Proceso' };
  };

  const getProgressStats = (activity: Activity) => {
     const plan = getPlanForYear(activity, currentYear);
     const executed = plan.filter(m => m.evidence).length;
     const planned = plan.filter(m => m.planned).length;
     return { executed, planned };
  };

  const activeActivity = activeActivityId ? activities.find(a => a.id === activeActivityId) : null;
  const activePlan = activeActivity && activeMonthIndex !== null ? getPlanForYear(activeActivity, currentYear)[activeMonthIndex] : null;
  const activeEvidence = activePlan?.evidence || null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[calc(100vh-8rem)]">
      <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center bg-white border border-slate-300 rounded-lg p-1 shadow-sm">
             <button onClick={() => setCurrentYear(2025)} className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${currentYear === 2025 ? 'bg-slate-800 text-white shadow' : 'text-slate-500 hover:bg-slate-50'}`}>2025</button>
             <button onClick={() => setCurrentYear(2026)} className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${currentYear === 2026 ? 'bg-slate-800 text-white shadow' : 'text-slate-500 hover:bg-slate-50'}`}>2026</button>
          </div>
          <div className="h-8 w-px bg-slate-200"></div>
          {/* Planta Filter */}
          <div className="bg-white p-2 border border-slate-300 rounded-lg flex items-center space-x-2 shadow-sm min-w-[200px]">
            <Factory size={16} className="text-red-600" />
            <select value={selectedPlant} onChange={(e) => setSelectedPlant(e.target.value)} className="bg-transparent border-none outline-none text-xs font-black text-slate-800 flex-1 uppercase tracking-tight">
              <option value="ALL">TODAS LAS PLANTAS</option>
              {plants.map(p => <option key={p.id} value={p.id}>{p.name} {p.isMain ? '(MATRIZ)' : ''}</option>)}
            </select>
          </div>
          {/* Area Filter */}
          <div className="bg-white p-2 border border-slate-300 rounded-lg flex items-center space-x-2 shadow-sm">
            <Filter size={16} className="text-slate-500" />
            <select value={selectedArea} onChange={(e) => setSelectedArea(e.target.value)} className="bg-transparent border-none outline-none text-xs font-bold text-slate-700 min-w-[150px]">
              <option value="ALL">TODAS LAS ÁREAS</option>
              {AREAS.map(area => <option key={area} value={area}>{area}</option>)}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 text-[10px] font-bold">
          <div className="flex items-center"><div className="w-2.5 h-2.5 bg-green-100 border border-green-300 rounded mr-1"></div><span className="text-slate-600">Aprobado</span></div>
          <div className="flex items-center"><div className="w-2.5 h-2.5 bg-blue-100 border border-blue-300 rounded mr-1"></div><span className="text-slate-600">Cargado</span></div>
          <div className="flex items-center"><div className="w-2.5 h-2.5 bg-orange-100 border border-orange-300 rounded mr-1"></div><span className="text-slate-600">Rechazado</span></div>
          <div className="flex items-center"><div className="w-2.5 h-2.5 bg-red-50 border border-red-200 rounded mr-1"></div><span className="text-slate-600">Vencido</span></div>
        </div>
      </div>

      <div className="overflow-auto flex-1 scrollbar-thin">
        <table className="w-full text-xs text-left border-collapse">
          <thead className="bg-slate-100 text-slate-600 font-semibold sticky top-0 z-10 shadow-sm">
            <tr>
              <th className="p-3 border-r border-slate-200 min-w-[80px] text-center">Cláusula</th>
              <th className="p-3 border-r border-slate-200 min-w-[200px]">Requisito (Norma)</th>
              <th className="p-3 border-r border-slate-200 min-w-[200px] bg-slate-50 border-b-2 border-slate-300">Tarea Específica / Criterio</th>
              <th className="p-3 border-r border-slate-200 min-w-[60px] text-center bg-slate-200">{currentYear}</th>
              {MONTHS.map(m => <th key={m} className="p-2 border-r border-slate-200 text-center min-w-[40px]">{m}</th>)}
              <th className="p-3 min-w-[80px] text-center sticky right-0 bg-slate-100 shadow-l">Avance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filteredActivities.map((activity) => {
                const yearStatus = getYearStatus(activity);
                const progress = getProgressStats(activity);
                
                // CRÍTICO: Limpiar duplicados de plantas y filtrar IDs inexistentes para evitar badges azules de "PLT-MOSQUERA"
                // Fixed type inference by using a type predicate (p): p is Plant
                const uniquePlants = Array.from(new Set<Plant>(
                  (activity.plantIds || [])
                    .map(pid => plants.find(p => p.id === pid))
                    .filter((p): p is Plant => p !== undefined)
                ));

                return (
                <tr key={activity.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-3 border-r border-slate-200 text-center font-medium bg-white">
                    <div className="text-sm font-bold text-slate-700">{activity.clause}</div>
                    {activity.subClause && <div className="text-[10px] text-slate-500 bg-slate-100 px-1 rounded inline-block mt-1">{activity.subClause}</div>}
                  </td>
                  <td className="p-3 border-r border-slate-200 bg-white relative">
                    <div className="flex justify-between items-start group">
                      <div className="font-semibold text-slate-800 line-clamp-2 pr-6" title={activity.clauseTitle}>{activity.clauseTitle}</div>
                      <button onClick={() => openInfoModal(activity.id)} className="text-blue-400 hover:text-blue-600 transition-colors p-1 rounded-full hover:bg-blue-50" title="Ver detalles del requisito">
                        <Info size={14} />
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedArea === 'ALL' && <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[9px] font-black border border-slate-200 uppercase">{activity.responsibleArea}</span>}
                      {uniquePlants.map(plant => (
                        <span key={plant.id} className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase border ${plant.isMain ? 'bg-red-50 text-red-600 border-red-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                          {plant.name}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="p-3 border-r border-slate-200 bg-white"><div className="text-slate-600 text-[11px] leading-snug line-clamp-3">{activity.relatedQuestions || <span className="text-slate-400 italic">Sin tarea específica definida</span>}</div></td>
                  <td className={`p-3 border-r border-slate-200 text-center ${yearStatus.color.split(' ')[0]}`}><div className={`mx-auto px-2 py-1 rounded text-[10px] font-bold border ${yearStatus.color}`}>{yearStatus.label}</div></td>
                  {renderPeriodicityCells(activity)}
                  <td className="p-3 text-center sticky right-0 bg-white shadow-l border-l border-slate-200">
                     {progress.planned > 0 ? (
                       <div className="flex flex-col items-center">
                         <div className="text-[10px] font-bold text-slate-600 mb-1">{progress.executed}/{progress.planned}</div>
                         <div className="w-12 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                           <div className={`h-full ${yearStatus.status === 'DELAYED' ? 'bg-red-500' : 'bg-green-500'}`} style={{ width: `${(progress.executed / progress.planned) * 100}%` }}></div>
                         </div>
                       </div>
                    ) : <span className="text-slate-300">-</span>}
                  </td>
                </tr>
              )})}
          </tbody>
        </table>
      </div>

      {/* Info Modal */}
      {infoModalOpen && activeActivity && (
        <div className="fixed inset-0 bg-slate-900/80 flex items-start justify-center z-[9999] p-4 pt-12 backdrop-blur-md overflow-hidden">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl max-h-[85vh] flex flex-col animate-in fade-in slide-in-from-top-8 duration-500 border border-slate-200">
             <div className="p-6 bg-slate-900 text-white flex justify-between items-center shrink-0">
                <div className="flex items-center">
                   <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl mr-5 shadow-xl shadow-blue-500/30"><BookOpen size={24} className="text-white" /></div>
                   <div>
                      <h3 className="text-lg font-black leading-tight tracking-tight">{activeActivity.clauseTitle}</h3>
                      <div className="flex gap-2 mt-1.5">
                        <span className="text-blue-100 text-[9px] font-black uppercase tracking-[0.1em] bg-blue-900/60 px-2 py-0.5 rounded-full border border-blue-700/50">Norma: {activeActivity.clause}</span>
                      </div>
                   </div>
                </div>
                <button onClick={() => setInfoModalOpen(false)} className="p-2 hover:bg-slate-800 rounded-full transition-all text-slate-400 hover:text-white group"><X size={24} /></button>
             </div>
             <div className="p-6 space-y-6 overflow-y-auto scrollbar-thin bg-white flex-1">
                <div className="space-y-3">
                   <div className="flex items-center text-slate-400 font-black text-[9px] uppercase tracking-[0.2em]"><ShieldCheck size={14} className="mr-2 text-slate-300" /> Descripción Oficial</div>
                   <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 text-[13px] text-slate-700 leading-relaxed italic whitespace-pre-wrap font-medium">"{activeActivity.description}"</div>
                </div>
                <div className="space-y-3">
                   <div className="flex items-center text-blue-600 font-black text-[9px] uppercase tracking-[0.2em]"><Target size={14} className="mr-2" /> Explicación</div>
                   <div className="bg-blue-50/40 p-5 rounded-2xl border border-blue-100/50 text-[13px] text-slate-800 leading-relaxed font-semibold">{activeActivity.contextualization}</div>
                </div>
                <div className="space-y-3">
                   <div className="flex items-center text-amber-600 font-black text-[9px] uppercase tracking-[0.2em]"><CheckCircle size={14} className="mr-2" /> Tarea Específica</div>
                   <div className="bg-amber-50/40 p-5 rounded-2xl border border-amber-100/50 text-[13px] text-amber-950 font-black">{activeActivity.relatedQuestions}</div>
                </div>
                <div className="space-y-3">
                   <div className="flex items-center text-red-600 font-black text-[9px] uppercase tracking-[0.2em]"><Factory size={14} className="mr-2" /> Plantas Asignadas</div>
                   <div className="flex flex-wrap gap-2">
                     {/* Fixed type inference by using a type predicate (p): p is Plant and explicit Set typing */}
                     {Array.from(new Set<Plant>((activeActivity.plantIds || []).map(pid => plants.find(p => p.id === pid)).filter((p): p is Plant => p !== undefined))).map(plant => (
                        <div key={plant.id} className="px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-200 text-xs font-black text-slate-700 uppercase tracking-tight flex items-center"><MapPin size={12} className="mr-1.5 text-red-500" /> {plant.name}</div>
                     ))}
                   </div>
                </div>
             </div>
             <div className="p-5 bg-slate-50 border-t border-slate-100 flex justify-end shrink-0">
                <button onClick={() => setInfoModalOpen(false)} className="px-8 py-3 bg-slate-900 text-white rounded-xl text-xs font-black hover:bg-slate-800 transition-all shadow-xl border border-slate-700">Cerrar</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};
