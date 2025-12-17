
import React, { useState } from 'react';
import { MONTHS, AREAS } from '../constants';
import { Activity, StandardType, Periodicity, User, UserRole, Evidence, CommentLog } from '../types';
// Added missing icon imports: ShieldCheck and CheckCircle
import { Check, Upload, FileText, AlertCircle, Filter, Eye, X, Cloud, HardDrive, Paperclip, Calendar, Download, Link as LinkIcon, Image as ImageIcon, ExternalLink, RefreshCw, ThumbsUp, ThumbsDown, MessageSquare, Clock, History, User as UserIcon, Send, ShieldCheck, CheckCircle } from 'lucide-react';

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
  
  const [modalOpen, setModalOpen] = useState(false);
  const [activeActivityId, setActiveActivityId] = useState<string | null>(null);
  const [activeMonthIndex, setActiveMonthIndex] = useState<number | null>(null);
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

  const updateActivityEvidence = (url: string, type: 'FILE' | 'LINK', fileName: string) => {
      const activityToUpdate = activities.find(a => a.id === activeActivityId);
      if (!activityToUpdate || activeMonthIndex === null) return;

      const existingItem = activityToUpdate.monthlyPlan[activeMonthIndex];
      const existingHistory = existingItem.evidence?.history || [];

      // Create log for the update/upload
      const updateLog: CommentLog = {
        id: `log-upd-${Date.now()}`,
        text: updateNote || (existingItem.evidence ? 'Se cargó una nueva versión de la evidencia para revisión.' : 'Carga inicial de evidencia.'),
        author: currentUser.name,
        date: new Date().toLocaleString(),
        status: 'PENDING'
      };

      const newMonthlyPlan = activityToUpdate.monthlyPlan.map((item, index) => {
        if (index !== activeMonthIndex) return item;
        return {
          ...item,
          executed: true,
          evidence: {
            url,
            type,
            fileName,
            uploadedBy: currentUser.name,
            uploadedAt: new Date().toLocaleDateString(),
            status: 'PENDING',
            adminComment: updateLog.text,
            history: [updateLog, ...existingHistory]
          } as Evidence
        };
      });

      onUpdateActivity({ ...activityToUpdate, monthlyPlan: newMonthlyPlan });
      setModalOpen(false);
  };

  const handleAdminVerification = (status: 'APPROVED' | 'REJECTED') => {
    if (!activeActivityId || activeMonthIndex === null) return;
    
    const activityToUpdate = activities.find(a => a.id === activeActivityId);
    if (!activityToUpdate) return;
    
    const targetPlan = activityToUpdate.monthlyPlan[activeMonthIndex];
    if (!targetPlan || !targetPlan.evidence) return;

    const newCommentEntry: CommentLog = {
      id: `log-adm-${Date.now()}`,
      text: adminComment || (status === 'APPROVED' ? 'Evidencia validada y aprobada.' : 'Evidencia rechazada por inconformidad.'),
      author: currentUser.name,
      date: new Date().toLocaleString(),
      status: status
    };

    const newMonthlyPlan = activityToUpdate.monthlyPlan.map((item, index) => {
      if (index !== activeMonthIndex) return item;
      
      const updatedEvidence: Evidence = {
        ...(item.evidence as Evidence),
        status: status,
        adminComment: newCommentEntry.text,
        approvedBy: status === 'APPROVED' ? currentUser.name : null as any,
        rejectionDate: status === 'REJECTED' ? new Date().toISOString() : null as any,
        history: [newCommentEntry, ...(item.evidence?.history || [])]
      };

      return {
        ...item,
        evidence: updatedEvidence
      };
    });

    onUpdateActivity({ ...activityToUpdate, monthlyPlan: newMonthlyPlan });
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
    const plan = activity.monthlyPlan;
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
            cellBg = "bg-slate-100 text-slate-400"; 
            cellContent = <span className="text-[9px] font-bold">P</span>;
         } else {
            const currentRealMonth = new Date().getMonth();
            const currentRealYear = new Date().getFullYear();
            const isOverdue = currentYear < currentRealYear || (currentYear === currentRealYear && i <= currentRealMonth);
            
            if (isOverdue) {
              cellBg = "bg-red-50 border-red-200"; 
              cellContent = <span className="text-[10px] font-bold text-red-300">!</span>;
            } else {
              cellBg = "bg-blue-50 border-blue-100"; 
              cellContent = <span className="text-[9px] font-bold text-blue-300">P</span>;
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
    if (currentYear > new Date().getFullYear()) return { status: 'FUTURE', color: 'bg-slate-100 text-slate-400', label: 'Futuro' };
    let totalPlanned = 0, totalExecuted = 0, totalApproved = 0, totalOverdue = 0;
    const currentRealMonth = new Date().getMonth(), currentRealYear = new Date().getFullYear();
    activity.monthlyPlan.forEach((m, idx) => {
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
     const executed = activity.monthlyPlan.filter(m => m.evidence).length;
     const planned = activity.monthlyPlan.filter(m => m.planned).length;
     return { executed, planned };
  };

  const activeEvidence = activeActivityId && activeMonthIndex !== null 
    ? activities.find(a => a.id === activeActivityId)?.monthlyPlan[activeMonthIndex]?.evidence 
    : null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[calc(100vh-8rem)]">
      <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap gap-3 text-xs">
          <div className="flex items-center"><div className="w-3 h-3 bg-green-100 border border-green-300 rounded mr-1"></div><span className="text-slate-600">Aprobado</span></div>
          <div className="flex items-center"><div className="w-3 h-3 bg-blue-100 border border-blue-300 rounded mr-1"></div><span className="text-slate-600">Cargado (Rev)</span></div>
          <div className="flex items-center"><div className="w-3 h-3 bg-orange-100 border border-orange-300 rounded mr-1"></div><span className="text-slate-600">Rechazado</span></div>
          <div className="flex items-center"><div className="w-3 h-3 bg-red-50 border border-red-200 rounded mr-1"></div><span className="text-slate-600">Vencido</span></div>
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
                  <td className="p-3 border-r border-slate-200 bg-white">
                    <div className="font-semibold text-slate-800 line-clamp-2" title={activity.clauseTitle}>{activity.clauseTitle}</div>
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

      {modalOpen && activeActivityId && activeMonthIndex !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[60] p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
            <div className="p-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-slate-800 flex items-center">
                   {currentUser.role === UserRole.ADMIN ? 'Gestión y Verificación de Evidencia' : 'Cargar / Actualizar Evidencia'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">{MONTHS[activeMonthIndex]} - {activities.find(a => a.id === activeActivityId)?.clauseTitle}</p>
              </div>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin">
              {activeEvidence ? (
                <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg">
                   <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-bold text-blue-800">Archivo Actual:</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${activeEvidence.status === 'APPROVED' ? 'bg-green-200 text-green-800' : activeEvidence.status === 'REJECTED' ? 'bg-orange-200 text-orange-800' : 'bg-blue-200 text-blue-800'}`}>
                         {activeEvidence.status === 'PENDING' ? 'Por Verificar' : activeEvidence.status === 'APPROVED' ? 'Aprobado' : 'Rechazado'}
                      </span>
                   </div>
                   <div className="flex items-center space-x-2 mb-3">
                      <FileText className="text-blue-600" size={20} />
                      <span className="text-sm text-slate-700 truncate font-medium">{activeEvidence.fileName}</span>
                   </div>
                   <div className="flex space-x-3">
                      <button onClick={() => handleDownloadEvidence(activeEvidence.url, activeEvidence.fileName, activeEvidence.type)} className="flex-1 bg-white border border-blue-200 text-blue-700 py-2 rounded text-sm hover:bg-blue-100 font-medium flex items-center justify-center"><ExternalLink size={14} className="mr-2" /> Ver Documento</button>
                   </div>
                </div>
              ) : (
                <div className="text-center py-6 bg-slate-50 rounded-lg border border-dashed border-slate-300">
                   <p className="text-slate-400 text-sm">No hay evidencia cargada para este periodo.</p>
                </div>
              )}

              {/* TRACEABILITY HISTORY */}
              {activeEvidence && activeEvidence.history && activeEvidence.history.length > 0 && (
                <div className="space-y-3">
                   <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center">
                     <History size={14} className="mr-2" /> Historial de Gestión (Bitácora)
                   </h4>
                   <div className="space-y-3 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                     {activeEvidence.history.map((log) => (
                       <div key={log.id} className="relative pl-8">
                         <div className={`absolute left-0 top-1 w-6 h-6 rounded-full flex items-center justify-center border-2 shadow-sm ${log.status === 'APPROVED' ? 'bg-green-100 border-green-500 text-green-600' : log.status === 'REJECTED' ? 'bg-orange-100 border-orange-500 text-orange-600' : 'bg-blue-100 border-blue-500 text-blue-600'}`}>
                            {log.status === 'APPROVED' ? <Check size={12} /> : log.status === 'REJECTED' ? <ThumbsDown size={12} /> : <Upload size={12} />}
                         </div>
                         <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-sm hover:border-slate-300 transition-colors">
                           <div className="flex justify-between items-center mb-1">
                             <div className="flex items-center space-x-2">
                               <span className="text-xs font-bold text-slate-700 flex items-center"><UserIcon size={12} className="mr-1" /> {log.author}</span>
                               <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase ${log.status === 'APPROVED' ? 'bg-green-100 text-green-700' : log.status === 'REJECTED' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
                                 {log.status === 'APPROVED' ? 'Aprobado' : log.status === 'REJECTED' ? 'Rechazado' : 'Actualización'}
                               </span>
                             </div>
                             <span className="text-[10px] text-slate-400">{log.date}</span>
                           </div>
                           <p className="text-xs text-slate-600 leading-relaxed font-medium">{log.text}</p>
                         </div>
                       </div>
                     ))}
                   </div>
                </div>
              )}

              {/* ADMIN ACTION: VERIFY */}
              {currentUser.role === UserRole.ADMIN && activeEvidence && activeEvidence.status !== 'APPROVED' && (
                <div className="space-y-4 border-t border-slate-100 pt-6">
                   <div className="bg-amber-50 p-3 rounded-lg border border-amber-100 mb-2">
                      <p className="text-xs text-amber-800 font-bold flex items-center"><ShieldCheck size={14} className="mr-2" /> Panel de Validación Administrativa</p>
                   </div>
                   <div>
                     <label className="block text-sm font-bold text-slate-700 mb-2">Comentario de Evaluación</label>
                     <textarea value={adminComment} onChange={e => setAdminComment(e.target.value)} className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none min-h-[100px]" placeholder="Escriba los hallazgos de la auditoría documental o el motivo del rechazo para que el líder lo corrija..." />
                   </div>
                   <div className="flex space-x-3">
                      <button onClick={() => handleAdminVerification('REJECTED')} className="flex-1 bg-orange-100 text-orange-700 py-3 rounded-xl font-bold hover:bg-orange-200 flex items-center justify-center border border-orange-200 transition-colors shadow-sm"><ThumbsDown size={18} className="mr-2" /> Rechazar Evidencia</button>
                      <button onClick={() => handleAdminVerification('APPROVED')} className="flex-1 bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 flex items-center justify-center shadow-md transition-colors"><ThumbsUp size={18} className="mr-2" /> Aprobar y Validar</button>
                   </div>
                </div>
              )}

              {/* USER ACTION: UPLOAD/UPDATE */}
              {(currentUser.role !== UserRole.ADMIN || (activeEvidence && activeEvidence.status === 'APPROVED')) && (
                 <div className="space-y-4 pt-2 border-t border-slate-100">
                    {activeEvidence && (
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                        <h4 className="text-sm font-bold text-slate-700 mb-3 flex items-center"><RefreshCw size={16} className="mr-2 text-blue-600" /> ¿Desea actualizar la evidencia?</h4>
                        <div className="mb-4">
                           <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Nota de actualización / Corrección</label>
                           <textarea 
                             value={updateNote}
                             onChange={e => setUpdateNote(e.target.value)}
                             placeholder="Explique qué cambios realizó o responda a las observaciones del auditor..."
                             className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none min-h-[80px]"
                           />
                        </div>
                      </div>
                    )}

                   {!uploadType ? (
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <button onClick={() => setUploadType('link')} className="flex items-center p-4 border border-slate-200 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-all group shadow-sm bg-white">
                          <Cloud size={20} className="text-blue-500 mr-3" />
                          <span className="text-sm font-bold text-slate-700">Actualizar por Link (OneDrive)</span>
                        </button>
                        <button onClick={() => fileInputRef.current?.click()} className="flex items-center p-4 border border-slate-200 rounded-xl hover:border-slate-400 hover:bg-slate-50 transition-all group shadow-sm bg-white">
                          <ImageIcon size={20} className="text-slate-500 mr-3" />
                          <span className="text-sm font-bold text-slate-700">Subir Nuevo Archivo Local</span>
                        </button>
                        <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} accept="image/*,application/pdf" />
                     </div>
                   ) : (
                     <div className="space-y-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                       <p className="text-sm text-slate-600 font-bold">Pegar nuevo enlace de documento:</p>
                       <input type="text" value={linkInput} onChange={e => setLinkInput(e.target.value)} className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="https://..." />
                       <div className="flex justify-end gap-2">
                         <button onClick={() => setUploadType(null)} className="px-4 py-2 text-slate-500 text-sm font-bold">Atrás</button>
                         <button onClick={handleLinkSubmit} className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 font-bold shadow-md flex items-center">
                           <Send size={16} className="mr-2" /> Enviar para Revisión
                         </button>
                       </div>
                     </div>
                   )}
                 </div>
              )}
              
              {/* ADMIN VIEW ONLY FOR APPROVED */}
              {currentUser.role === UserRole.ADMIN && activeEvidence && activeEvidence.status === 'APPROVED' && (
                <div className="bg-green-50 p-4 rounded-xl border border-green-200 flex items-center text-green-800">
                   <CheckCircle className="mr-3" />
                   <div className="text-sm">
                      <p className="font-bold">Esta evidencia ya fue validada.</p>
                      <p className="opacity-80">No se requieren acciones adicionales.</p>
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
