
import React, { useState } from 'react';
import { MONTHS, AREAS } from '../constants';
import { Activity, StandardType, Periodicity, User, UserRole, Evidence, CommentLog, MonthlyExecution } from '../types';
import { 
  Check, Upload, FileText, AlertCircle, Filter, Eye, X, Cloud, 
  HardDrive, Paperclip, Calendar, Download, Link as LinkIcon, 
  Image as ImageIcon, ExternalLink, RefreshCw, ThumbsUp, ThumbsDown, 
  MessageSquare, Clock, History, User as UserIcon, Send, ShieldCheck, 
  CheckCircle, Info, BookOpen, Target, Briefcase
} from 'lucide-react';
import { dataService } from '../services/dataService';

interface StandardViewProps {
  standard: StandardType;
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
  
  // Modals state
  const [modalOpen, setModalOpen] = useState(false);
  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const [activeActivityId, setActiveActivityId] = useState<string | null>(null);
  const [activeMonthIndex, setActiveMonthIndex] = useState<number | null>(null);
  
  // Form states
  const [uploadType, setUploadType] = useState<'file' | 'link' | null>(null);
  const [linkInput, setLinkInput] = useState('');
  const [adminComment, setAdminComment] = useState('');
  const [updateNote, setUpdateNote] = useState('');
  
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const filteredActivities = activities.filter(a => {
    const matchesStandard = a.standards.includes(standard);
    const matchesArea = selectedArea === 'ALL' || a.responsibleArea === selectedArea;
    return matchesStandard && matchesArea;
  });

  const openModal = (activityId: string, monthIndex: number) => {
    setActiveActivityId(activityId);
    setActiveMonthIndex(monthIndex);
    setModalOpen(true);
    setUploadType(null);
    setLinkInput('');
    setAdminComment('');
    setUpdateNote('');
  };

  const openInfoModal = (activityId: string) => {
    setActiveActivityId(activityId);
    setInfoModalOpen(true);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeActivityId || activeMonthIndex === null) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      updateActivityEvidence(base64, 'FILE', file.name);
    };
    reader.readAsDataURL(file);
  };

  const handleLinkSubmit = () => {
    if (!linkInput.trim() || !activeActivityId || activeMonthIndex === null) return;
    updateActivityEvidence(linkInput, 'LINK', 'Enlace OneDrive/Web');
  };

  const getPlanForYear = (activity: Activity, year: number): MonthlyExecution[] => {
    if (activity.plans && activity.plans[year]) {
      return activity.plans[year];
    }
    
    if (year === 2025 && activity.monthlyPlan) {
      return activity.monthlyPlan;
    }

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

      const updateLog: CommentLog = {
        id: `log-upd-${Date.now()}`,
        text: updateNote || (existingItem.evidence ? 'Se cargó una nueva versión de la evidencia para revisión.' : 'Carga inicial de evidencia.'),
        author: currentUser.name,
        date: new Date().toLocaleString(),
        status: 'PENDING'
      };

      const newYearPlan = currentYearPlan.map((item, index) => {
        if (index !== activeMonthIndex) return item;
        return {
          ...item,
          executed: true,
          evidence: {
            url,
            type,
            fileName,
            uploadedBy: currentUser.name,
            uploadedAt: new Date().toLocaleString(),
            status: 'PENDING',
            adminComment: updateLog.text,
            history: [updateLog, ...existingHistory]
          } as Evidence
        };
      });

      const updatedActivity: Activity = {
        ...activityToUpdate,
        plans: {
          ...(activityToUpdate.plans || {}),
          [currentYear]: newYearPlan
        }
      };

      onUpdateActivity(updatedActivity);
      
      const allUsers = await dataService.getUsersOnce();
      // Targeted Notification: Admins and Leaders associated with THIS specific area
      const targetUsers = allUsers.filter(u => 
        u.role === UserRole.ADMIN || (u.assignedArea === activityToUpdate.responsibleArea)
      );

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

      setModalOpen(false);
  };

  const handleAdminVerification = async (status: 'APPROVED' | 'REJECTED') => {
    if (!activeActivityId || activeMonthIndex === null) return;
    
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
      plans: {
        ...(activityToUpdate.plans || {}),
        [currentYear]: newYearPlan
      }
    };

    onUpdateActivity(updatedActivity);

    const allUsers = await dataService.getUsersOnce();
    // Targeted Notification: Notify ALL users linked to the area of the activity
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

    setModalOpen(false);
  };

  const handleDownloadEvidence = (url: string, fileName: string, type: 'FILE' | 'LINK') => {
    if (type === 'LINK') {
      window.open(url, '_blank');
    } else {
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
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
        if (plan[k]?.evidence) {
          evidenceFound = plan[k].evidence;
          evidenceIndex = k;
        }
        if (plan[k]?.planned) {
          isPlanned = true;
          plannedIndex = k;
        }
      }
      
      let interactionIndex = evidenceIndex !== -1 ? evidenceIndex : (plannedIndex !== -1 ? plannedIndex : i + colSpan - 1);
      let cellBg = "bg-slate-50"; 
      let cellContent = null;
      let borderColor = "border-slate-200";

      if (evidenceFound) {
        if (evidenceFound.status === 'APPROVED') {
          cellBg = "bg-green-100 border-green-300";
        } else if (evidenceFound.status === 'REJECTED') {
           cellBg = "bg-orange-100 border-orange-300";
        } else {
           cellBg = "bg-blue-100 border-blue-300";
        }
      } else if (isPlanned) {
         if (isFutureYear) {
            cellBg = "bg-slate-200 text-slate-400"; 
            cellContent = <span className="text-[9px] font-bold">P</span>;
         } else {
            const currentRealMonth = new Date().getMonth();
            const currentRealYear = new Date().getFullYear();
            const isOverdue = currentYear < currentRealYear || (currentYear === currentRealYear && i <= currentRealMonth);
            
            if (isOverdue) {
              cellBg = "bg-red-50 border-red-200"; 
              cellContent = <span className="text-[10px] font-bold text-red-300">!</span>;
            } else {
              cellBg = "bg-slate-200 border-slate-300"; 
              cellContent = <span className="text-[9px] font-bold text-slate-400">P</span>;
            }
         }
      } else {
        cellBg = "bg-slate-50 opacity-50"; 
      }

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
        if (m.evidence) {
          totalExecuted++;
          if (m.evidence.status === 'APPROVED') totalApproved++;
        } else if (currentYear < currentRealYear || (currentYear === currentRealYear && idx <= currentRealMonth)) {
          totalOverdue++;
        }
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
  const activePlan = activeActivity && activeMonthIndex !== null 
    ? getPlanForYear(activeActivity, currentYear)[activeMonthIndex]
    : null;
  const activeEvidence = activePlan?.evidence || null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[calc(100vh-8rem)]">
      <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
        <div className="flex flex-wrap gap-3 text-xs">
          <div className="flex items-center"><div className="w-3 h-3 bg-green-100 border border-green-300 rounded mr-1"></div><span className="text-slate-600">Aprobado</span></div>
          <div className="flex items-center"><div className="w-3 h-3 bg-blue-100 border border-blue-300 rounded mr-1"></div><span className="text-slate-600">Cargado (Rev)</span></div>
          <div className="flex items-center"><div className="w-3 h-3 bg-orange-100 border border-orange-300 rounded mr-1"></div><span className="text-slate-600">Rechazado</span></div>
          <div className="flex items-center"><div className="w-3 h-3 bg-red-50 border border-red-200 rounded mr-1"></div><span className="text-slate-600">Vencido</span></div>
          <div className="flex items-center"><div className="w-3 h-3 bg-slate-200 border border-slate-300 rounded mr-1"></div><span className="text-slate-600">Planificado</span></div>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center bg-white border border-slate-300 rounded-lg p-1 shadow-sm">
             <button onClick={() => setCurrentYear(2025)} className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${currentYear === 2025 ? 'bg-slate-800 text-white shadow' : 'text-slate-500 hover:bg-slate-50'}`}>2025</button>
             <button onClick={() => setCurrentYear(2026)} className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${currentYear === 2026 ? 'bg-slate-800 text-white shadow' : 'text-slate-500 hover:bg-slate-50'}`}>2026</button>
          </div>
          <div className="h-6 w-px bg-slate-300"></div>
          <div className="bg-white p-2 border border-slate-300 rounded-lg flex items-center space-x-2 shadow-sm">
            <Filter size={18} className="text-slate-500" />
            <select value={selectedArea} onChange={(e) => setSelectedArea(e.target.value)} className="bg-transparent border-none outline-none text-sm font-medium text-slate-700 min-w-[150px]">
              <option value="ALL">TODAS LAS ÁREAS</option>
              {AREAS.map(area => <option key={area} value={area}>{area}</option>)}
            </select>
          </div>
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
                return (
                <tr key={activity.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-3 border-r border-slate-200 text-center font-medium bg-white">
                    <div className="text-sm font-bold text-slate-700">{activity.clause}</div>
                    {activity.subClause && <div className="text-[10px] text-slate-500 bg-slate-100 px-1 rounded inline-block mt-1">{activity.subClause}</div>}
                  </td>
                  <td className="p-3 border-r border-slate-200 bg-white relative">
                    <div className="flex justify-between items-start group">
                      <div className="font-semibold text-slate-800 line-clamp-2 pr-6" title={activity.clauseTitle}>{activity.clauseTitle}</div>
                      <button 
                        onClick={() => openInfoModal(activity.id)}
                        className="text-blue-400 hover:text-blue-600 transition-colors p-1 rounded-full hover:bg-blue-50"
                        title="Ver detalles del requisito"
                      >
                        <Info size={14} />
                      </button>
                    </div>
                    {selectedArea === 'ALL' && <span className="inline-block mt-1 px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-medium border border-slate-200">{activity.responsibleArea}</span>}
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

      {/* INFO MODAL: COMPACT AND TOP-POSITIONED */}
      {infoModalOpen && activeActivity && (
        <div className="fixed inset-0 bg-slate-900/80 flex items-start justify-center z-[9999] p-4 pt-12 backdrop-blur-md overflow-hidden">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl max-h-[85vh] flex flex-col animate-in fade-in slide-in-from-top-8 duration-500 border border-slate-200">
             <div className="p-6 bg-slate-900 text-white flex justify-between items-center shrink-0">
                <div className="flex items-center">
                   <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl mr-5 shadow-xl shadow-blue-500/30">
                      <BookOpen size={24} className="text-white" />
                   </div>
                   <div>
                      <h3 className="text-lg font-black leading-tight tracking-tight">{activeActivity.clauseTitle}</h3>
                      <div className="flex gap-2 mt-1.5">
                        <span className="text-blue-100 text-[9px] font-black uppercase tracking-[0.1em] bg-blue-900/60 px-2 py-0.5 rounded-full border border-blue-700/50">Norma: {activeActivity.clause}</span>
                        <span className="text-blue-100 text-[9px] font-black uppercase tracking-[0.1em] bg-blue-900/60 px-2 py-0.5 rounded-full border border-blue-700/50">ID: {activeActivity.subClause}</span>
                      </div>
                   </div>
                </div>
                <button onClick={() => setInfoModalOpen(false)} className="p-2 hover:bg-slate-800 rounded-full transition-all text-slate-400 hover:text-white group">
                  <X size={24} className="group-active:scale-90 transition-transform" />
                </button>
             </div>
             
             <div className="p-6 space-y-6 overflow-y-auto scrollbar-thin bg-white flex-1">
                {/* Description - FULL CONTENT */}
                <div className="space-y-3">
                   <div className="flex items-center text-slate-400 font-black text-[9px] uppercase tracking-[0.2em]">
                      <ShieldCheck size={14} className="mr-2 text-slate-300" /> Descripción Oficial Integra
                   </div>
                   <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 text-[13px] text-slate-700 leading-relaxed italic whitespace-pre-wrap font-medium shadow-inner">
                      "{activeActivity.description}"
                   </div>
                </div>

                {/* Context - FULL CONTENT */}
                <div className="space-y-3">
                   <div className="flex items-center text-blue-600 font-black text-[9px] uppercase tracking-[0.2em]">
                      <Target size={14} className="mr-2" /> Explicación Detallada
                   </div>
                   <div className="bg-blue-50/40 p-5 rounded-2xl border border-blue-100/50 text-[13px] text-slate-800 leading-relaxed font-semibold whitespace-pre-wrap shadow-inner">
                      {activeActivity.contextualization}
                   </div>
                </div>

                {/* Responsible & Periodicity Grid */}
                <div className="grid grid-cols-2 gap-4">
                   <div className="p-4 bg-white rounded-xl border border-slate-100 shadow-sm flex items-center">
                      <div className="p-2 bg-slate-50 rounded-lg mr-3 shrink-0">
                        <Briefcase size={18} className="text-slate-400" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Responsable</div>
                        <p className="text-xs font-black text-slate-900 truncate">{activeActivity.responsibleArea}</p>
                      </div>
                   </div>
                   <div className="p-4 bg-white rounded-xl border border-slate-100 shadow-sm flex items-center">
                      <div className="p-2 bg-slate-50 rounded-lg mr-3 shrink-0">
                        <Calendar size={18} className="text-slate-400" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Periodicidad</div>
                        <p className="text-xs font-black text-slate-900 truncate">{activeActivity.periodicity}</p>
                      </div>
                   </div>
                </div>

                {/* Specific Task - FULL CONTENT */}
                <div className="space-y-3">
                   <div className="flex items-center text-amber-600 font-black text-[9px] uppercase tracking-[0.2em]">
                      <CheckCircle size={14} className="mr-2" /> Tarea Específica / Criterio
                   </div>
                   <div className="bg-amber-50/40 p-5 rounded-2xl border border-amber-100/50 text-[13px] text-amber-950 leading-relaxed whitespace-pre-wrap font-black shadow-inner">
                      {activeActivity.relatedQuestions}
                   </div>
                </div>
             </div>

             <div className="p-5 bg-slate-50 border-t border-slate-100 flex justify-end shrink-0">
                <button 
                  onClick={() => setInfoModalOpen(false)}
                  className="px-8 py-3 bg-slate-900 text-white rounded-xl text-xs font-black hover:bg-slate-800 transition-all shadow-xl active:scale-95 border border-slate-700"
                >
                   Finalizar Consulta
                </button>
             </div>
          </div>
        </div>
      )}

      {/* VERIFICATION MODAL: COMPACT AND TOP-POSITIONED */}
      {modalOpen && activeActivity && activeMonthIndex !== null && (
        <div className="fixed inset-0 bg-black/80 flex items-start justify-center z-[9000] p-4 pt-12 backdrop-blur-sm overflow-hidden">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl max-h-[85vh] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-300 border border-slate-200">
            <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center shrink-0">
              <div>
                <h3 className="text-xl font-black text-slate-900 flex items-center tracking-tight">
                   {currentUser.role === UserRole.ADMIN ? 'Verificación Auditora' : 'Evidencias del Sistema'}
                </h3>
                <p className="text-[10px] text-slate-500 font-bold mt-1 uppercase tracking-widest">{MONTHS[activeMonthIndex]} {currentYear} • {activeActivity.clauseTitle}</p>
              </div>
              <button onClick={() => setModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"><X size={24} /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-thin">
              {activeEvidence ? (
                <div className="bg-blue-50/30 border border-blue-100 p-5 rounded-2xl">
                   <div className="flex justify-between items-start mb-4">
                      <span className="text-[10px] font-black text-blue-900 uppercase tracking-[0.2em] bg-blue-100/50 px-2 py-1 rounded-lg border border-blue-200/50">Soporte</span>
                      <span className={`text-[9px] font-black px-3 py-1 rounded-full shadow-sm border ${
                        activeEvidence.status === 'APPROVED' ? 'bg-green-100 text-green-800 border-green-200' : 
                        activeEvidence.status === 'REJECTED' ? 'bg-orange-100 text-orange-800 border-orange-200' : 
                        'bg-blue-100 text-blue-800 border-blue-200'
                      }`}>
                         {activeEvidence.status === 'PENDING' ? 'Bajo Revisión' : activeEvidence.status === 'APPROVED' ? 'Certificado' : 'No Conforme'}
                      </span>
                   </div>
                   <div className="flex items-center space-x-4 mb-6">
                      <div className="p-3 bg-white rounded-xl shadow-sm border border-blue-100/50 shrink-0">
                        <FileText className="text-blue-600" size={24} />
                      </div>
                      <span className="text-sm text-slate-900 font-black truncate pr-4">{activeEvidence.fileName}</span>
                   </div>
                   <div className="flex">
                      <button onClick={() => handleDownloadEvidence(activeEvidence.url, activeEvidence.fileName, activeEvidence.type)} className="flex-1 bg-white border border-blue-100 text-blue-700 py-3 rounded-xl text-xs font-black hover:bg-blue-50 flex items-center justify-center shadow-sm transition-all"><ExternalLink size={16} className="mr-2" /> Abrir Documento</button>
                   </div>
                </div>
              ) : (
                <div className="text-center py-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center">
                   <Upload size={40} className="text-slate-300 mb-3" />
                   <p className="text-slate-500 text-sm font-black text-center px-4">No se ha registrado evidencia para este periodo</p>
                </div>
              )}

              {/* BITACORA */}
              {activeEvidence && activeEvidence.history && activeEvidence.history.length > 0 && (
                <div className="space-y-4">
                   <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center">
                     <History size={14} className="mr-2" /> Trazabilidad de Gestión
                   </h4>
                   <div className="space-y-4 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
                     {activeEvidence.history.map((log) => (
                       <div key={log.id} className="relative pl-8">
                         <div className={`absolute left-0 top-1 w-6 h-6 rounded-full flex items-center justify-center border-2 shadow-sm z-10 ${
                           log.status === 'APPROVED' ? 'bg-green-100 border-green-500 text-green-600' : 
                           log.status === 'REJECTED' ? 'bg-orange-100 border-orange-500 text-orange-600' : 
                           'bg-blue-100 border-blue-500 text-blue-600'
                         }`}>
                            {log.status === 'APPROVED' ? <Check size={12} /> : log.status === 'REJECTED' ? <ThumbsDown size={12} /> : <Upload size={12} />}
                         </div>
                         <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm">
                           <div className="flex justify-between items-center mb-1">
                             <span className="text-xs font-black text-slate-900">{log.author}</span>
                             <span className="text-[9px] text-slate-400 font-bold">{log.date}</span>
                           </div>
                           <p className="text-[11px] text-slate-600 leading-relaxed font-semibold">{log.text}</p>
                         </div>
                       </div>
                     ))}
                   </div>
                </div>
              )}

              {/* ADMIN ACTION - COMPACTED BUTTONS */}
              {currentUser.role === UserRole.ADMIN && activeEvidence && activeEvidence.status !== 'APPROVED' && (
                <div className="space-y-4 border-t border-slate-100 pt-6">
                   <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
                      <p className="text-[11px] text-amber-950 font-black flex items-center uppercase tracking-widest"><ShieldCheck size={16} className="mr-2" /> Decisión Auditora</p>
                   </div>
                   <textarea value={adminComment} onChange={e => setAdminComment(e.target.value)} className="w-full border border-slate-200 rounded-xl p-4 text-sm focus:border-blue-500 outline-none min-h-[100px] bg-slate-50 transition-all font-bold placeholder:text-slate-300" placeholder="Escriba aquí los hallazgos de la revisión..." />
                   <div className="flex space-x-3">
                      <button onClick={() => handleAdminVerification('REJECTED')} className="flex-1 bg-white border-2 border-orange-200 text-orange-700 py-2.5 rounded-2xl font-black text-xs hover:bg-orange-50 flex items-center justify-center shadow-md transition-all active:scale-95"><ThumbsDown size={18} className="mr-2.5" /> Rechazar</button>
                      <button onClick={() => handleAdminVerification('APPROVED')} className="flex-1 bg-green-600 text-white py-2.5 rounded-2xl font-black text-xs hover:bg-green-700 flex items-center justify-center shadow-xl transition-all active:scale-95"><ThumbsUp size={18} className="mr-2.5" /> Verificar</button>
                   </div>
                </div>
              )}

              {/* LEADER UPLOAD / RE-UPLOAD */}
              {(currentUser.role === UserRole.LEADER || !activeEvidence || activeEvidence?.status === 'REJECTED') && (
                 <div className="space-y-4 pt-4 border-t border-slate-100">
                    <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
                        <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center">
                          <RefreshCw size={14} className="mr-2 text-blue-600" /> 
                          {activeEvidence ? 'Corregir Evidencia' : 'Gestionar Carga'}
                        </h4>
                        <textarea 
                          value={updateNote}
                          onChange={e => setUpdateNote(e.target.value)}
                          placeholder="Descripción del documento..."
                          className="w-full border border-slate-200 rounded-xl p-4 text-sm mb-4 outline-none focus:border-blue-500 bg-white min-h-[100px] transition-all font-bold placeholder:text-slate-300"
                        />

                        {!uploadType ? (
                          <div className="grid grid-cols-2 gap-4">
                              <button onClick={() => setUploadType('link')} className="flex items-center justify-center p-4 border border-slate-200 rounded-xl hover:border-blue-200 hover:bg-blue-50 bg-white font-black text-[10px] text-slate-700 transition-all shadow-sm active:scale-95">
                                <Cloud size={20} className="text-blue-500 mr-2" /> Enlace
                              </button>
                              <button onClick={() => fileInputRef.current?.click()} className="flex items-center justify-center p-4 border border-slate-200 rounded-xl hover:border-slate-300 hover:bg-slate-50 bg-white font-black text-[10px] text-slate-700 transition-all shadow-sm active:scale-95">
                                <ImageIcon size={20} className="text-slate-500 mr-2" /> Archivo
                              </button>
                              <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} accept="image/*,application/pdf" />
                          </div>
                        ) : (
                          <div className="space-y-4 bg-white p-5 rounded-xl border border-slate-100 shadow-xl animate-in fade-in slide-in-from-top-4">
                            <input type="text" value={linkInput} onChange={e => setLinkInput(e.target.value)} className="w-full border border-slate-200 rounded-lg p-3 text-xs outline-none focus:border-blue-500 bg-slate-50 font-bold" placeholder="URL de la evidencia..." />
                            <div className="flex justify-end gap-3">
                              <button onClick={() => setUploadType(null)} className="px-4 py-2 text-slate-500 text-[10px] font-black hover:bg-slate-100 rounded-lg transition-colors">Atrás</button>
                              <button onClick={handleLinkSubmit} className="px-6 py-2 bg-blue-600 text-white rounded-lg text-[10px] font-black flex items-center shadow-lg hover:bg-blue-700 transition-all active:scale-95">
                                <Send size={16} className="mr-2" /> Registrar
                              </button>
                            </div>
                          </div>
                        )}
                    </div>
                 </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
