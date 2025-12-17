import React, { useState, useMemo } from 'react';
import { Activity, User, MonthlyExecution } from '../types';
import { MONTHS } from '../constants';
import { AlertCircle, CheckCircle, Clock, ExternalLink, RefreshCw, Search, ShieldAlert, ThumbsUp } from 'lucide-react';

interface EvidenceDashboardProps {
  activities: Activity[];
  currentUser: User;
  onUpdateActivity: (activity: Activity) => void;
}

interface EvidenceItem {
  activity: Activity;
  monthIndex: number;
  plan: MonthlyExecution;
  year: number;
}

export const EvidenceDashboard: React.FC<EvidenceDashboardProps> = ({ activities, currentUser, onUpdateActivity }) => {
  const [filter, setFilter] = useState<'ALL' | 'REJECTED' | 'PENDING' | 'APPROVED'>('REJECTED');

  // Helper to extract unique evidence entries from an activity across all possible storage locations
  const getUniqueEvidenceItems = (activity: Activity): EvidenceItem[] => {
    const uniqueItems: Map<string, EvidenceItem> = new Map();

    // 1. Process 'plans' (the most modern and structured storage)
    if (activity.plans) {
      Object.entries(activity.plans).forEach(([yearStr, monthPlans]) => {
        const year = parseInt(yearStr);
        (monthPlans as MonthlyExecution[]).forEach((plan, monthIndex) => {
          if (plan.evidence) {
            const key = `${year}-${monthIndex}`;
            uniqueItems.set(key, { activity, monthIndex, plan, year });
          }
        });
      });
    }

    // 2. Process legacy 'monthlyPlan' (assumed to be 2025 if not present in plans)
    if (Array.isArray(activity.monthlyPlan)) {
      activity.monthlyPlan.forEach((plan, monthIndex) => {
        if (plan.evidence) {
          const key = `2025-${monthIndex}`;
          // Only add if not already present from the structured 'plans' for 2025
          if (!uniqueItems.has(key)) {
            uniqueItems.set(key, { activity, monthIndex, plan, year: 2025 });
          }
        }
      });
    }

    return Array.from(uniqueItems.values());
  };

  // Memoize all unique items for performance and consistency
  const allUniqueItems = useMemo(() => {
    return activities.flatMap(a => getUniqueEvidenceItems(a));
  }, [activities]);

  const filteredIssues = useMemo(() => {
    return allUniqueItems.filter(item => {
      const status = item.plan.evidence?.status || 'PENDING';
      if (filter === 'ALL') return true;
      if (filter === 'REJECTED') return status === 'REJECTED';
      if (filter === 'PENDING') return status === 'PENDING';
      if (filter === 'APPROVED') return status === 'APPROVED';
      return false;
    }).sort((a, b) => {
      const dateA = a.plan.evidence?.rejectionDate || a.plan.evidence?.uploadedAt || '';
      const dateB = b.plan.evidence?.rejectionDate || b.plan.evidence?.uploadedAt || '';
      return new Date(dateB).getTime() - new Date(dateA).getTime();
    });
  }, [allUniqueItems, filter]);

  const getDaysOpen = (dateString?: string) => {
    if (!dateString) return 0;
    const start = new Date(dateString).getTime();
    const now = new Date().getTime();
    return Math.floor((now - start) / (1000 * 60 * 60 * 24));
  };

  const countByStatus = (status: 'REJECTED' | 'PENDING' | 'APPROVED') => {
    return allUniqueItems.filter(item => {
       const s = item.plan.evidence?.status || (item.plan.evidence ? 'PENDING' : '');
       return s === status;
    }).length;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Control de Hallazgos y Evidencias</h2>
          <p className="text-slate-500 font-medium">Gestión de no conformidades documentales y validaciones del sistema.</p>
        </div>
        <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm flex-wrap">
           <button 
             onClick={() => setFilter('REJECTED')}
             className={`px-4 py-2 text-xs font-black rounded-lg transition-all ${filter === 'REJECTED' ? 'bg-orange-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
           >
             Rechazadas
           </button>
           <button 
             onClick={() => setFilter('PENDING')}
             className={`px-4 py-2 text-xs font-black rounded-lg transition-all ${filter === 'PENDING' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
           >
             Por Verificar
           </button>
           <button 
             onClick={() => setFilter('APPROVED')}
             className={`px-4 py-2 text-xs font-black rounded-lg transition-all ${filter === 'APPROVED' ? 'bg-green-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
           >
             Aprobadas
           </button>
           <button 
             onClick={() => setFilter('ALL')}
             className={`px-4 py-2 text-xs font-black rounded-lg transition-all ${filter === 'ALL' ? 'bg-slate-800 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
           >
             Todo el Historial
           </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border-2 border-orange-50 relative overflow-hidden group">
           <div className="absolute top-0 left-0 w-1.5 h-full bg-orange-500"></div>
           <div className="flex justify-between items-start relative z-10">
             <div>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Evidencias Rechazadas</p>
               <h3 className="text-3xl font-black text-orange-600">{countByStatus('REJECTED')}</h3>
             </div>
             <div className="p-3 bg-orange-50 rounded-xl text-orange-500 group-hover:scale-110 transition-transform"><ShieldAlert size={24}/></div>
           </div>
           <p className="text-[10px] text-slate-500 mt-4 font-bold flex items-center">
             <AlertCircle size={12} className="mr-1.5" /> Requieren corrección inmediata
           </p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border-2 border-blue-50 relative overflow-hidden group">
           <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-500"></div>
           <div className="flex justify-between items-start relative z-10">
             <div>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Por Verificar (Pendientes)</p>
               <h3 className="text-3xl font-black text-blue-600">{countByStatus('PENDING')}</h3>
             </div>
             <div className="p-3 bg-blue-50 rounded-xl text-blue-500 group-hover:scale-110 transition-transform"><Clock size={24}/></div>
           </div>
           <p className="text-[10px] text-slate-500 mt-4 font-bold flex items-center">
             <RefreshCw size={12} className="mr-1.5" /> Pendientes de aprobación auditora
           </p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border-2 border-green-50 relative overflow-hidden group">
           <div className="absolute top-0 left-0 w-1.5 h-full bg-green-500"></div>
           <div className="flex justify-between items-start relative z-10">
             <div>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Aprobadas (Total)</p>
               <h3 className="text-3xl font-black text-green-600">{countByStatus('APPROVED')}</h3>
             </div>
             <div className="p-3 bg-green-50 rounded-xl text-green-500 group-hover:scale-110 transition-transform"><CheckCircle size={24}/></div>
           </div>
           <p className="text-[10px] text-slate-500 mt-4 font-bold flex items-center">
             <ThumbsUp size={12} className="mr-1.5" /> Cumplimiento total validado
           </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse">
            <thead className="bg-slate-50 text-slate-400 font-black uppercase text-[10px] tracking-[0.2em] border-b border-slate-100">
              <tr>
                <th className="p-5">Estado</th>
                <th className="p-5">Requisito / Actividad</th>
                <th className="p-5">Periodo</th>
                <th className="p-5">Responsable</th>
                <th className="p-5">Detalle / Nota Admin</th>
                <th className="p-5 text-center">Gestión</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredIssues.map((item) => {
                const status = item.plan.evidence?.status || 'PENDING';
                const daysOpen = getDaysOpen(item.plan.evidence?.rejectionDate);
                
                return (
                  <tr key={`${item.activity.id}-${item.year}-${item.monthIndex}`} className="hover:bg-slate-50/80 transition-all group">
                    <td className="p-5">
                      <div className="flex flex-col gap-1.5">
                        {status === 'REJECTED' && (
                          <span className="inline-flex items-center w-fit px-3 py-1 rounded-full text-[9px] font-black bg-orange-100 text-orange-800 border border-orange-200 uppercase tracking-wider">
                            <AlertCircle size={10} className="mr-1.5" />
                            Rechazado
                          </span>
                        )}
                        {status === 'PENDING' && (
                           <span className="inline-flex items-center w-fit px-3 py-1 rounded-full text-[9px] font-black bg-blue-100 text-blue-800 border border-blue-200 uppercase tracking-wider">
                            <Clock size={10} className="mr-1.5" />
                            Por Verificar
                          </span>
                        )}
                        {status === 'APPROVED' && (
                           <span className="inline-flex items-center w-fit px-3 py-1 rounded-full text-[9px] font-black bg-green-100 text-green-800 border border-green-200 uppercase tracking-wider">
                            <CheckCircle size={10} className="mr-1.5" />
                            Aprobado
                          </span>
                        )}
                        {status === 'REJECTED' && (
                          <div className="text-[9px] text-orange-600 font-black uppercase flex items-center">
                            <Clock size={10} className="mr-1" />
                            {daysOpen === 0 ? 'Hoy' : `${daysOpen} días abierto`}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-5">
                      <div className="font-black text-slate-800 text-xs">{item.activity.clause} {item.activity.clauseTitle}</div>
                      <div className="text-[10px] text-slate-400 truncate max-w-[200px] mt-1 font-medium">{item.activity.relatedQuestions}</div>
                    </td>
                    <td className="p-5">
                      <div className="font-black text-slate-700 text-xs">
                        {MONTHS[item.monthIndex]} <span className="text-slate-400 font-bold">{item.year}</span>
                      </div>
                    </td>
                    <td className="p-5">
                      <div className="text-xs font-black text-slate-700">{item.plan.evidence?.uploadedBy}</div>
                      <span className="text-[9px] font-black px-2 py-0.5 bg-slate-100 rounded-md text-slate-500 border border-slate-200 uppercase tracking-tighter inline-block mt-1">
                        {item.activity.responsibleArea}
                      </span>
                    </td>
                    <td className="p-5">
                       {status === 'REJECTED' ? (
                         <div className="bg-orange-50/50 p-3 rounded-xl border border-orange-100/50 text-[10px] text-orange-950 font-medium">
                           <strong className="uppercase font-black block mb-1 tracking-widest text-[8px]">Motivo del Rechazo:</strong>
                           {item.plan.evidence?.adminComment || 'Sin comentario detallado'}
                         </div>
                       ) : status === 'APPROVED' ? (
                         <div className="bg-green-50/50 p-3 rounded-xl border border-green-100/50 text-[10px] text-green-950 font-medium">
                           <div className="flex items-center mb-1">
                             <ThumbsUp size={12} className="mr-1.5 text-green-600" />
                             <span className="font-black uppercase tracking-widest text-[8px]">Validado por {item.plan.evidence?.approvedBy || 'Admin'}</span>
                           </div>
                           {item.plan.evidence?.adminComment && <p className="opacity-80 italic">"{item.plan.evidence.adminComment}"</p>}
                         </div>
                       ) : (
                         <div className="text-[10px] text-slate-400 font-bold italic flex items-center">
                           <RefreshCw size={12} className="mr-2 animate-spin-slow text-blue-500" />
                           Esperando revisión administrativa...
                         </div>
                       )}
                    </td>
                    <td className="p-5 text-center">
                       <button 
                        onClick={() => {
                           if (item.plan.evidence?.type === 'LINK') {
                             window.open(item.plan.evidence.url, '_blank');
                           } else {
                             const link = document.createElement("a");
                             link.href = item.plan.evidence!.url;
                             link.download = item.plan.evidence!.fileName;
                             document.body.appendChild(link);
                             link.click();
                             document.body.removeChild(link);
                           }
                        }}
                        className="inline-flex items-center text-blue-600 hover:text-white text-[10px] font-black uppercase bg-blue-50 hover:bg-blue-600 px-4 py-2 rounded-xl border border-blue-100 transition-all shadow-sm active:scale-95"
                      >
                         <ExternalLink size={14} className="mr-2" /> Ver Evidencia
                       </button>
                    </td>
                  </tr>
                );
              })}
              {filteredIssues.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-20 text-center">
                    <div className="flex flex-col items-center">
                      <div className="p-5 bg-slate-50 rounded-full mb-4">
                        <CheckCircle size={48} className="text-slate-200" />
                      </div>
                      <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Sin registros encontrados</p>
                      <button 
                        onClick={() => setFilter('ALL')}
                        className="mt-6 text-blue-600 text-xs font-black hover:bg-blue-50 px-6 py-3 rounded-xl border border-blue-100 transition-all uppercase tracking-widest"
                      >
                        Ver todo el historial
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};