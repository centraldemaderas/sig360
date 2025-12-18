
import React, { useState, useEffect, useMemo } from 'react';
import { MONTHS } from '../constants';
import { Activity, Area, Periodicity, User, Evidence, CommentLog, MonthlyExecution, Plant } from '../types';
import { 
  Check, X, Cloud, FileText, AlertCircle, Filter, Eye, Clock, History, 
  ShieldCheck, CheckCircle, Info, BookOpen, Target, Factory, Shield, 
  FileUp, ExternalLink, ListChecks, ArrowRight, Layers, MapPin, BadgeCheck,
  // Added missing TreePine icon import
  TreePine
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

  useEffect(() => {
    setSelectedStandard(initialStandard);
  }, [initialStandard]);

  useEffect(() => {
    const unsub = dataService.subscribeToPlants(data => {
      setPlants(data);
    });
    return () => unsub();
  }, []);

  const getStandardIcon = (type: string) => {
    const t = type.toLowerCase();
    if (t.includes('9001')) return FileText;
    if (t.includes('sst')) return ShieldCheck;
    if (t.includes('fsc')) return TreePine;
    if (t.includes('vial') || t.includes('pesv')) return Factory;
    return Shield;
  };

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
    let approved = 0;
    let loaded = 0;
    let rejected = 0;
    let overdue = 0;
    const currentRealMonth = new Date().getMonth();
    const currentRealYear = new Date().getFullYear();

    filteredActivities.forEach(activity => {
      const plan = activity.plans?.[currentYear] || [];
      plan.forEach((m, idx) => {
        if (m.planned) {
          if (m.evidence) {
            if (m.evidence.status === 'APPROVED') approved++;
            else if (m.evidence.status === 'REJECTED') rejected++;
            else if (m.evidence.status === 'PENDING') loaded++;
          } else {
            const isPast = currentYear < currentRealYear || (currentYear === currentRealYear && idx <= currentRealMonth);
            if (isPast) overdue++;
          }
        }
      });
    });
    return { approved, loaded, rejected, overdue, totalActive: filteredActivities.length };
  }, [filteredActivities, currentYear]);

  const availableStandards = Array.from(new Set(activities.flatMap(a => a.standards))).sort();

  const openModal = (activityId: string, monthIndex: number) => {
    setActiveActivityId(activityId);
    setActiveMonthIndex(monthIndex);
    setModalOpen(true);
    setAdminComment('');
    setIsSaving(false);
  };

  const openInfoModal = (activityId: string) => {
    setActiveActivityId(activityId);
    setInfoModalOpen(true);
  };

  const getPlanForYear = (activity: Activity, year: number): MonthlyExecution[] => {
    if (activity.plans && activity.plans[year]) return activity.plans[year];
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
    setIsSaving(false);
    setModalOpen(false);
  };

  const renderPeriodicityCells = (activity: Activity) => {
    const plan = getPlanForYear(activity, currentYear);
    const cells = [];
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
      let isPlanned = false;
      let plannedIndex = -1;
      for (let k = i; k < i + colSpan; k++) {
        if (plan[k]?.evidence) { evidenceFound = plan[k].evidence; evidenceIndex = k; }
        if (plan[k]?.planned) { isPlanned = true; plannedIndex = k; }
      }
      let interactionIndex = evidenceIndex !== -1 ? evidenceIndex : (plannedIndex !== -1 ? plannedIndex : i + colSpan - 1);
      let cellBg = "bg-white"; 
      let cellContent = null;
      if (evidenceFound) {
        if (evidenceFound.status === 'APPROVED') { cellBg = "bg-green-50/50"; cellContent = <Check size={14} className="text-green-500" />; } 
        else if (evidenceFound.status === 'REJECTED') { cellBg = "bg-orange-50/50"; cellContent = <div className="p-1.5 bg-orange-100 rounded-full flex items-center justify-center"><AlertCircle size={10} className="text-orange-600" /></div>; } 
        else { cellBg = "bg-blue-50/50"; cellContent = <Clock size={14} className="text-blue-500" />; }
      } else if (isPlanned) {
        const currentRealMonth = new Date().getMonth();
        const currentRealYear = new Date().getFullYear();
        const isOverdue = currentYear < currentRealYear || (currentYear === currentRealYear && i <= currentRealMonth);
        if (isOverdue) { cellBg = "bg-red-50/30"; cellContent = <span className="text-red-400 font-bold text-sm">!</span>; } 
        else { cellBg = "bg-white"; cellContent = <span className="text-slate-200 font-bold text-[10px]">P</span>; }
      }
      cells.push(<td key={i} colSpan={colSpan} className={`border-r p-0 text-center transition-all relative group ${cellBg} border-slate-100 border-b h-14`}><div onClick={() => isPlanned && openModal(activity.id, interactionIndex)} className={`w-full h-full flex items-center justify-center ${isPlanned ? 'cursor-pointer' : ''}`}>{cellContent}</div></td>);
      i += colSpan;
    }
    return cells;
  };

  const getYearStatus = (activity: Activity) => {
    const plan = getPlanForYear(activity, currentYear);
    let totalPlanned = 0, totalExecuted = 0, totalApproved = 0, totalOverdue = 0;
    const currentRealMonth = new Date().getMonth(), currentRealYear = new Date().getFullYear();
    plan.forEach((m, idx) => {
      if (m.planned) {
        totalPlanned++;
        if (m.evidence) { totalExecuted++; if (m.evidence.status === 'APPROVED') totalApproved++; } 
        else if (currentYear < currentRealYear || (currentYear === currentRealYear && idx <= currentRealMonth)) { totalOverdue++; }
      }
    });
    if (totalOverdue > 0) return { status: 'DELAYED', color: 'bg-red-50 text-red-600 border-red-100', label: `${totalOverdue} PEND` };
    if (totalPlanned === 0) return { status: 'NONE', color: 'bg-slate-50 text-slate-300', label: '-' };
    if (totalExecuted === totalPlanned) {
      if (totalApproved === totalPlanned) return { status: 'COMPLIANT', color: 'bg-green-50 text-green-600 border-green-100', label: 'LISTO' };
      return { status: 'REVIEW', color: 'bg-blue-50 text-blue-600 border-blue-100', label: 'REV' };
    }
    return { status: 'PROGRESS', color: 'bg-blue-50 text-blue-600 border-blue-100', label: 'REV' };
  };

  const getProgressStats = (activity: Activity) => {
     const plan = getPlanForYear(activity, currentYear);
     const executed = plan.filter(m => m.evidence && m.evidence.status === 'APPROVED').length;
     const planned = plan.filter(m => m.planned).length;
     return { executed, planned };
  };

  const activeActivity = activeActivityId ? activities.find(a => a.id === activeActivityId) : null;
  const activePlan = activeActivity && activeMonthIndex !== null ? getPlanForYear(activeActivity, currentYear)[activeMonthIndex] : null;
  const activeEvidence = activePlan?.evidence || null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[calc(100vh-8rem)]">
      <div className="p-4 border-b border-slate-200 bg-white flex flex-col gap-4 shrink-0">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex items-center bg-white border border-slate-200 rounded-lg p-1 shadow-sm">
               <button onClick={() => setCurrentYear(2025)} className={`px-4 py-1.5 text-xs font-black rounded-md transition-all ${currentYear === 2025 ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:bg-slate-50'}`}>2025</button>
               <button onClick={() => setCurrentYear(2026)} className={`px-4 py-1.5 text-xs font-black rounded-md transition-all ${currentYear === 2026 ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:bg-slate-50'}`}>2026</button>
            </div>
            <div className="bg-white p-2 border border-slate-200 rounded-lg flex items-center space-x-2 shadow-sm min-w-[200px]"><Factory size={16} className="text-red-600" /><select value={selectedPlant} onChange={(e) => setSelectedPlant(e.target.value)} className="bg-transparent border-none outline-none text-[10px] font-black text-slate-800 flex-1 uppercase tracking-tight"><option value="ALL">TODAS LAS PLANTAS</option>{plants.map(p => <option key={p.id} value={p.id}>{p.name} {p.isMain ? '(MATRIZ)' : ''}</option>)}</select></div>
            <div className="bg-white p-2 border border-slate-200 rounded-lg flex items-center space-x-2 shadow-sm min-w-[180px]"><Filter size={16} className="text-slate-400" /><select value={selectedArea} onChange={(e) => setSelectedArea(e.target.value)} className="bg-transparent border-none outline-none text-[10px] font-black text-slate-800 flex-1 uppercase tracking-tight"><option value="ALL">TODAS LAS ÁREAS</option>{areas.map(area => <option key={area.id} value={area.name}>{area.name}</option>)}</select></div>
            <div className="bg-white p-2 border border-slate-200 rounded-lg flex items-center space-x-2 shadow-sm min-w-[200px]"><Shield size={16} className="text-blue-600" /><select value={selectedStandard} onChange={(e) => setSelectedStandard(e.target.value)} className="bg-transparent border-none outline-none text-[10px] font-black text-slate-800 flex-1 uppercase tracking-tight"><option value="ALL">TODAS LAS NORMAS</option>{availableStandards.map(std => <option key={std} value={std}>{std}</option>)}</select></div>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center bg-slate-100 px-3 py-2 rounded-xl border border-slate-200 shadow-inner"><ListChecks size={16} className="text-slate-500 mr-2" /><div className="flex flex-col"><span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">Activos</span><span className="text-xs font-black text-slate-800">{stats.totalActive} REQUISITOS</span></div></div>
            <div className="flex flex-wrap gap-2 text-[10px] font-black uppercase tracking-wider bg-white p-2 rounded-xl border border-slate-200 shadow-sm"><div className="flex items-center px-2 py-1 bg-green-50 rounded-lg border border-green-100 group transition-all hover:shadow-sm"><div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div><span className="text-green-800 mr-1.5">APROBADO</span><span className="bg-green-600 text-white px-1.5 py-0.5 rounded-md text-[9px] min-w-[1.5rem] text-center">{stats.approved}</span></div><div className="flex items-center px-2 py-1 bg-blue-50 rounded-lg border border-blue-100 group transition-all hover:shadow-sm"><div className="w-2 h-2 bg-blue-400 rounded-full mr-2"></div><span className="text-blue-800 mr-1.5">CARGADO</span><span className="bg-blue-600 text-white px-1.5 py-0.5 rounded-md text-[9px] min-w-[1.5rem] text-center">{stats.loaded}</span></div><div className="flex items-center px-2 py-1 bg-orange-50 rounded-lg border border-orange-100 group transition-all hover:shadow-sm"><div className="w-2 h-2 bg-orange-400 rounded-full mr-2"></div><span className="text-orange-800 mr-1.5">RECHAZADO</span><span className="bg-orange-600 text-white px-1.5 py-0.5 rounded-md text-[9px] min-w-[1.5rem] text-center">{stats.rejected}</span></div><div className="flex items-center px-2 py-1 bg-red-50 rounded-lg border border-red-100 group transition-all hover:shadow-sm"><div className="w-2 h-2 bg-red-400 rounded-full mr-2"></div><span className="text-red-800 mr-1.5">VENCIDO</span><span className="bg-red-600 text-white px-1.5 py-0.5 rounded-md text-[9px] min-w-[1.5rem] text-center">{stats.overdue}</span></div></div>
          </div>
        </div>
      </div>

      <div className="overflow-auto flex-1 scrollbar-thin">
        <table className="w-full text-[11px] text-left border-collapse table-fixed">
          <thead className="bg-slate-50 text-slate-400 font-black uppercase text-[10px] tracking-widest sticky top-0 z-10 shadow-sm border-b border-slate-200">
            <tr><th className="p-3 border-r border-slate-200 w-16 text-center">Cláusula</th><th className="p-3 border-r border-slate-200 min-w-[160px]">Requisito (Norma)</th><th className="p-3 border-r border-slate-200 min-w-[200px] bg-slate-50/50">Tarea Específica / Criterio</th><th className="p-3 border-r border-slate-200 w-16 text-center bg-slate-100/50">{currentYear}</th>{MONTHS.map(m => <th key={m} className="p-3 border-r border-slate-200 text-center w-10">{m}</th>)}<th className="p-3 w-16 text-center sticky right-0 bg-slate-50 shadow-l">Avance</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredActivities.map((activity) => {
                const yearStatus = getYearStatus(activity);
                const progress = getProgressStats(activity);
                return (<tr key={activity.id} className="hover:bg-slate-50/30 transition-colors h-14"><td className="p-3 border-r border-slate-100 text-center font-black bg-white"><div className="text-[12px] text-slate-800">{activity.clause}</div><div className="text-[9px] text-slate-400 font-bold">{activity.subClause}</div></td><td className="p-3 border-r border-slate-100 bg-white"><div className="flex justify-between items-start"><div className="font-bold text-slate-800 text-[10px] leading-tight line-clamp-2 pr-1">{activity.clauseTitle}</div><button onClick={() => openInfoModal(activity.id)} className="text-blue-400 hover:text-blue-600 p-0.5"><Info size={12} /></button></div><div className="flex flex-wrap gap-1 mt-1.5"><span className="px-1 py-0.5 bg-slate-100 text-slate-500 rounded text-[7px] font-black uppercase border border-slate-200">{activity.responsibleArea}</span>{activity.plantIds.map(pid => { const pName = plants.find(p => p.id.toUpperCase() === pid.toUpperCase())?.name || pid; return <span key={pid} className={`px-1 py-0.5 rounded text-[7px] font-black uppercase border ${pid.toUpperCase() === 'MOSQUERA' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-slate-50 text-slate-400 border-slate-200'}`}>{pName}</span>; })}</div></td><td className="p-3 border-r border-slate-100 bg-white"><div className="text-slate-600 text-[10px] leading-snug line-clamp-2">{activity.relatedQuestions}</div></td><td className={`p-2 border-r border-slate-100 text-center`}><div className={`mx-auto px-1 py-0.5 rounded text-[9px] font-black border uppercase tracking-tighter ${yearStatus.color}`}>{yearStatus.label}</div></td>{renderPeriodicityCells(activity)}<td className="p-3 text-center sticky right-0 bg-white shadow-l border-l border-slate-100"><div className="flex flex-col items-center"><div className="text-[9px] font-black text-slate-700 mb-1">{progress.executed}/{progress.planned}</div><div className="w-10 h-1 bg-slate-100 rounded-full overflow-hidden border border-slate-200"><div className={`h-full ${yearStatus.status === 'DELAYED' ? 'bg-red-500' : 'bg-green-500'}`} style={{ width: `${(progress.executed / (progress.planned || 1)) * 100}%` }}></div></div></div></td></tr>);
            })}
          </tbody>
        </table>
      </div>

      {modalOpen && activeActivity && activeMonthIndex !== null && (
        <div className="fixed inset-0 bg-slate-950/80 flex items-center justify-center z-[9999] p-4 backdrop-blur-sm animate-in fade-in duration-300"><div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"><div className="p-6 bg-[#1e293b] text-white flex justify-between items-center shrink-0"><div className="flex items-center"><div className="p-3 bg-red-600 rounded-2xl mr-4 shadow-xl"><FileUp size={24} className="text-white" /></div><div><h3 className="text-lg font-black uppercase tracking-tight">Gestión de Evidencia</h3><p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.1em]">{MONTHS[activeMonthIndex]} {currentYear} • {activeActivity.clauseTitle}</p></div></div><button onClick={() => setModalOpen(false)} className="p-2 hover:bg-slate-700 rounded-full transition-all text-slate-400 hover:text-white"><X size={24} /></button></div><div className="flex-1 overflow-y-auto p-10 grid grid-cols-1 lg:grid-cols-2 gap-12 scrollbar-thin"><div className="space-y-8"><div className="bg-[#f8fafc] p-6 rounded-2xl border border-slate-100 space-y-5"><h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center"><Info size={14} className="mr-2" /> Estado de Entrega</h4>{activeEvidence ? (<div className="space-y-4"><div className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-200 shadow-sm group"><div className="flex items-center"><FileText className="text-blue-500 mr-3" /><div className="overflow-hidden"><p className="text-xs font-black text-slate-800 truncate">{activeEvidence.fileName}</p><p className="text-[9px] text-slate-400 font-bold uppercase">Subido por {activeEvidence.uploadedBy}</p></div></div><button onClick={() => { if(activeEvidence.type==='LINK') window.open(activeEvidence.url,'_blank'); else {const link=document.createElement("a"); link.href=activeEvidence.url; link.download=activeEvidence.fileName; document.body.appendChild(link); link.click(); document.body.removeChild(link);}}} className="p-2 bg-slate-50 hover:bg-slate-100 rounded-lg text-slate-600"><ExternalLink size={18} /></button></div><div className={`p-4 rounded-xl border flex items-start gap-3 bg-[#eff6ff] border-blue-100`}><Clock className="text-blue-600 mt-0.5" size={18} /><div><p className="text-[10px] font-black uppercase tracking-widest text-blue-800 mb-1">Resultado de Revisión:</p><p className="text-xs font-semibold text-blue-900 leading-relaxed">"{activeEvidence.adminComment || 'Carga inicial de evidencia.'}"</p></div></div></div>) : (<div className="p-10 text-center border-2 border-dashed border-slate-200 rounded-2xl"><Cloud size={32} className="mx-auto text-slate-300 mb-2" /><p className="text-[11px] text-slate-400 font-bold uppercase">Sin archivos en este periodo</p></div>)}</div><div className="space-y-5"><h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center px-1"><History size={14} className="mr-2" /> Historial de Versiones</h4><div className="space-y-4">{activeEvidence?.history?.map((log, idx) => (<div key={idx} className="flex gap-4"><div className="flex flex-col items-center"><div className={`w-2.5 h-2.5 rounded-full mt-1 ${log.status === 'APPROVED' ? 'bg-green-500' : log.status === 'REJECTED' ? 'bg-orange-500' : 'bg-blue-600'}`}></div><div className="w-px flex-1 bg-slate-100 mt-2"></div></div><div className="pb-4"><div className="flex items-center gap-3 mb-1"><p className="text-[10px] font-black text-slate-800 uppercase">{log.author}</p><p className="text-[10px] text-slate-400 font-bold">{log.date}</p></div><p className="text-[11px] text-slate-500 font-medium leading-relaxed">{log.text}</p></div></div>))}</div></div></div><div className="bg-[#f8fafc] p-8 rounded-3xl border border-slate-200"><h4 className="text-xs font-black text-slate-700 uppercase tracking-widest mb-6 flex items-center"><ShieldCheck size={18} className="mr-2 text-red-600" /> Panel de Verificación</h4><p className="text-[11px] text-slate-500 mb-6 leading-relaxed font-medium">Como administrador/auditor, valide si el documento cumple con los requisitos normativos de la cláusula.</p><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Comentario de Validación</label><textarea value={adminComment} onChange={e => setAdminComment(e.target.value)} rows={6} className="w-full bg-white border border-slate-200 rounded-2xl p-5 text-xs font-semibold focus:border-red-600 transition-all outline-none shadow-sm" placeholder="Escriba los motivos de aprobación o rechazo..." /><div className="grid grid-cols-2 gap-4 mt-8"><button onClick={() => handleAdminVerification('REJECTED')} className="py-4 bg-[#fef3c7] text-[#9a3412] rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-[#ffedd5] transition-all border border-[#fde68a]">Rechazar</button><button onClick={() => handleAdminVerification('APPROVED')} className="py-4 bg-[#22c55e] text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-[#16a34a] transition-all shadow-lg shadow-green-200">Aprobar Evidencia</button></div></div></div><div className="p-6 bg-white border-t border-slate-100 flex justify-end"><button onClick={() => setModalOpen(false)} className="px-10 py-3 bg-[#0f172a] text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-black transition-all">Cerrar</button></div></div></div>
      )}

      {/* MODAL DE INFORMACIÓN DEL REQUISITO - 100% DATOS RESTAURADOS */}
      {infoModalOpen && activeActivity && (
        <div className="fixed inset-0 bg-slate-950/85 flex items-start justify-center z-[9999] p-4 pt-10 backdrop-blur-md overflow-hidden animate-in fade-in duration-300">
          <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col animate-in slide-in-from-top-4 duration-300 border border-slate-200 overflow-hidden">
             {/* Cabecera Pro */}
             <div className="p-8 bg-[#1e293b] text-white flex justify-between items-center shrink-0">
                <div className="flex items-center">
                   <div className="p-4 bg-red-600 rounded-3xl mr-6 shadow-2xl shadow-red-900/40">
                     <BookOpen size={32} className="text-white" />
                   </div>
                   <div>
                      <h3 className="text-xl font-black leading-tight tracking-tight uppercase max-w-xl line-clamp-2">{activeActivity.clauseTitle}</h3>
                      <div className="flex gap-2 mt-3">
                        <span className="text-blue-200 text-[10px] font-black uppercase tracking-[0.2em] bg-blue-900/60 px-4 py-1.5 rounded-full border border-blue-700/50">Norma: {activeActivity.clause}</span>
                        <span className="text-slate-300 text-[10px] font-black uppercase tracking-[0.2em] bg-slate-800 px-4 py-1.5 rounded-full border border-slate-700">Sub-Numeral: {activeActivity.subClause}</span>
                      </div>
                   </div>
                </div>
                <button onClick={() => setInfoModalOpen(false)} className="p-2.5 hover:bg-slate-700 rounded-full transition-all text-slate-400 hover:text-white">
                  <X size={32} />
                </button>
             </div>

             <div className="p-10 space-y-10 overflow-y-auto scrollbar-thin bg-white flex-1">
                {/* Metadatos Dinámicos restaurados */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100 space-y-2">
                    <div className="flex items-center gap-2 text-slate-400 font-black text-[9px] uppercase tracking-widest"><Layers size={14} /> Responsable</div>
                    <div className="text-xs font-black text-slate-800 uppercase">{activeActivity.responsibleArea}</div>
                  </div>
                  <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100 space-y-2">
                    <div className="flex items-center gap-2 text-slate-400 font-black text-[9px] uppercase tracking-widest"><Clock size={14} /> Periodicidad</div>
                    <div className="text-xs font-black text-slate-800 uppercase">{activeActivity.periodicity}</div>
                  </div>
                  <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100 space-y-2">
                    <div className="flex items-center gap-2 text-slate-400 font-black text-[9px] uppercase tracking-widest"><BadgeCheck size={14} /> Normas Aplicables</div>
                    <div className="flex flex-wrap gap-1">
                      {activeActivity.standards.map(s => {
                        const Icon = getStandardIcon(s);
                        return <span key={s} className="flex items-center gap-1.5 text-[8px] font-black bg-blue-100 text-blue-600 px-2 py-1 rounded-lg border border-blue-200 uppercase"><Icon size={10}/>{s}</span>
                      })}
                    </div>
                  </div>
                  <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100 space-y-2">
                    <div className="flex items-center gap-2 text-slate-400 font-black text-[9px] uppercase tracking-widest"><MapPin size={14} /> Sedes / Plantas</div>
                    <div className="flex flex-wrap gap-1">
                      {activeActivity.plantIds.map(pid => {
                        const plant = plants.find(p => p.id.toUpperCase() === pid.toUpperCase());
                        return <span key={pid} className={`text-[8px] font-black px-2 py-1 rounded-lg border uppercase ${pid.toUpperCase() === 'MOSQUERA' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>{plant?.name || pid}</span>
                      })}
                    </div>
                  </div>
                </div>

                {/* Secciones de Texto Oficial */}
                <div className="space-y-4">
                   <div className="flex items-center text-slate-400 font-black text-[10px] uppercase tracking-[0.3em] px-2"><ShieldCheck size={16} className="mr-3 text-slate-300" /> Descripción Oficial del Estándar</div>
                   <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 text-[14px] text-slate-600 leading-relaxed italic font-medium relative">
                     <div className="absolute top-4 left-4 text-slate-200"><BookOpen size={24} /></div>
                     <span className="relative z-10 block pl-8">"{activeActivity.description}"</span>
                   </div>
                </div>

                <div className="space-y-4">
                   <div className="flex items-center text-blue-600 font-black text-[10px] uppercase tracking-[0.3em] px-2"><Target size={16} className="mr-3 opacity-50" /> Explicación y Contexto</div>
                   <div className="bg-blue-50/30 p-8 rounded-[2.5rem] border border-blue-100/50 text-[14px] text-slate-800 leading-relaxed font-semibold">
                     {activeActivity.contextualization}
                   </div>
                </div>

                <div className="space-y-4">
                   <div className="flex items-center text-orange-600 font-black text-[10px] uppercase tracking-[0.3em] px-2"><BadgeCheck size={16} className="mr-3 opacity-50" /> Tarea Específica / Criterio de Auditoría</div>
                   <div className="bg-orange-50/30 p-8 rounded-[2.5rem] border border-orange-100/50 text-[14px] text-orange-950 font-black">
                     {activeActivity.relatedQuestions}
                   </div>
                </div>
             </div>

             <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-end shrink-0 gap-4">
                <div className="flex-1 flex items-center">
                  <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest flex items-center"><Info size={14} className="mr-2" /> ID Registro: {activeActivity.id}</span>
                </div>
                <button onClick={() => setInfoModalOpen(false)} className="px-12 py-4 bg-[#0f172a] text-white rounded-[1.5rem] text-xs font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl active:scale-95 flex items-center gap-3">
                  Cerrar Consulta
                  <ArrowRight size={18} />
                </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};
