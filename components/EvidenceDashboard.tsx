
import React, { useState } from 'react';
import { Activity, User } from '../types';
import { MONTHS } from '../constants';
import { AlertCircle, CheckCircle, Clock, ExternalLink, RefreshCw, Search, ShieldAlert, ThumbsUp } from 'lucide-react';

interface EvidenceDashboardProps {
  activities: Activity[];
  currentUser: User;
  onUpdateActivity: (activity: Activity) => void;
}

export const EvidenceDashboard: React.FC<EvidenceDashboardProps> = ({ activities, currentUser, onUpdateActivity }) => {
  const [filter, setFilter] = useState<'ALL' | 'REJECTED' | 'PENDING' | 'APPROVED'>('REJECTED');

  // Flatten logic to find all problematic/notable evidences
  const issues = activities.flatMap(activity => 
    activity.monthlyPlan.map((plan, index) => ({
      activity,
      monthIndex: index,
      plan
    }))
  ).filter(item => {
    if (!item.plan.evidence) return false;
    
    // Default to PENDING if status is missing but evidence exists
    const status = item.plan.evidence.status || 'PENDING';

    if (filter === 'ALL') return true;
    if (filter === 'REJECTED') return status === 'REJECTED';
    if (filter === 'PENDING') return status === 'PENDING';
    if (filter === 'APPROVED') return status === 'APPROVED';
    return false;
  }).sort((a, b) => {
    // Sort by rejection date or upload date, newest first
    const dateA = a.plan.evidence?.rejectionDate || a.plan.evidence?.uploadedAt || '';
    const dateB = b.plan.evidence?.rejectionDate || b.plan.evidence?.uploadedAt || '';
    return new Date(dateB).getTime() - new Date(dateA).getTime();
  });

  const getDaysOpen = (dateString?: string) => {
    if (!dateString) return 0;
    const start = new Date(dateString).getTime();
    const now = new Date().getTime();
    return Math.floor((now - start) / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Control de Hallazgos y Evidencias</h2>
          <p className="text-slate-500">Gestión de no conformidades documentales y validaciones del sistema.</p>
        </div>
        <div className="flex bg-white p-1 rounded-lg border border-slate-200 shadow-sm flex-wrap">
           <button 
             onClick={() => setFilter('REJECTED')}
             className={`px-3 py-2 text-xs font-bold rounded-md transition-colors ${filter === 'REJECTED' ? 'bg-orange-100 text-orange-800' : 'text-slate-500 hover:bg-slate-50'}`}
           >
             Rechazadas
           </button>
           <button 
             onClick={() => setFilter('PENDING')}
             className={`px-3 py-2 text-xs font-bold rounded-md transition-colors ${filter === 'PENDING' ? 'bg-blue-100 text-blue-800' : 'text-slate-500 hover:bg-slate-50'}`}
           >
             Por Verificar
           </button>
           <button 
             onClick={() => setFilter('APPROVED')}
             className={`px-3 py-2 text-xs font-bold rounded-md transition-colors ${filter === 'APPROVED' ? 'bg-green-100 text-green-800' : 'text-slate-500 hover:bg-slate-50'}`}
           >
             Aprobadas
           </button>
           <button 
             onClick={() => setFilter('ALL')}
             className={`px-3 py-2 text-xs font-bold rounded-md transition-colors ${filter === 'ALL' ? 'bg-slate-100 text-slate-800' : 'text-slate-500 hover:bg-slate-50'}`}
           >
             Todo el Historial
           </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-l-4 border-l-orange-500 border-slate-200">
           <div className="flex justify-between items-start">
             <div>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Evidencias Rechazadas</p>
               <h3 className="text-2xl font-black text-orange-600 mt-1">
                 {activities.flatMap(a => a.monthlyPlan).filter(p => p.evidence?.status === 'REJECTED').length}
               </h3>
             </div>
             <div className="p-2 bg-orange-50 rounded-lg text-orange-500"><ShieldAlert size={20}/></div>
           </div>
           <p className="text-[10px] text-slate-500 mt-2 font-medium">Requieren corrección inmediata</p>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-l-4 border-l-blue-500 border-slate-200">
           <div className="flex justify-between items-start">
             <div>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Por Verificar (Pendientes)</p>
               <h3 className="text-2xl font-black text-blue-600 mt-1">
                 {activities.flatMap(a => a.monthlyPlan).filter(p => p.evidence && (!p.evidence.status || p.evidence.status === 'PENDING')).length}
               </h3>
             </div>
             <div className="p-2 bg-blue-50 rounded-lg text-blue-500"><Clock size={20}/></div>
           </div>
           <p className="text-[10px] text-slate-500 mt-2 font-medium">Pendientes de aprobación del administrador</p>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-l-4 border-l-green-500 border-slate-200">
           <div className="flex justify-between items-start">
             <div>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Aprobadas (Total)</p>
               <h3 className="text-2xl font-black text-green-600 mt-1">
                 {activities.flatMap(a => a.monthlyPlan).filter(p => p.evidence?.status === 'APPROVED').length}
               </h3>
             </div>
             <div className="p-2 bg-green-50 rounded-lg text-green-500"><CheckCircle size={20}/></div>
           </div>
           <p className="text-[10px] text-slate-500 mt-2 font-medium">Cumplimiento total validado</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-100 text-slate-600 font-bold uppercase text-[10px] tracking-widest">
              <tr>
                <th className="p-4">Estado</th>
                <th className="p-4">Requisito / Actividad</th>
                <th className="p-4">Periodo</th>
                <th className="p-4">Responsable</th>
                <th className="p-4">Detalle / Nota Admin</th>
                <th className="p-4 text-center">Gestión</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {issues.map((item, idx) => {
                const status = item.plan.evidence?.status || 'PENDING';
                const daysOpen = getDaysOpen(item.plan.evidence?.rejectionDate);
                
                return (
                  <tr key={`${item.activity.id}-${item.monthIndex}`} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4">
                      {status === 'REJECTED' && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-orange-800 border border-orange-200">
                          <AlertCircle size={10} className="mr-1" />
                          Rechazado
                        </span>
                      )}
                      {status === 'PENDING' && (
                         <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                          <Clock size={10} className="mr-1" />
                          Por Verificar
                        </span>
                      )}
                      {status === 'APPROVED' && (
                         <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-800 border border-green-200">
                          <CheckCircle size={10} className="mr-1" />
                          Aprobado
                        </span>
                      )}
                      {status === 'REJECTED' && <div className="text-[9px] text-orange-600 mt-1 font-black uppercase">{daysOpen} días abierto</div>}
                    </td>
                    <td className="p-4">
                      <div className="font-bold text-slate-800">{item.activity.clause} {item.activity.clauseTitle}</div>
                      <div className="text-[10px] text-slate-400 truncate max-w-xs">{item.activity.relatedQuestions}</div>
                    </td>
                    <td className="p-4 font-bold text-slate-700">
                      {MONTHS[item.monthIndex]}
                    </td>
                    <td className="p-4">
                      <div className="text-xs font-medium text-slate-700">{item.plan.evidence?.uploadedBy}</div>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 bg-slate-100 rounded text-slate-500 border border-slate-200 uppercase">{item.activity.responsibleArea}</span>
                    </td>
                    <td className="p-4">
                       {status === 'REJECTED' ? (
                         <div className="bg-orange-50 p-2 rounded border border-orange-100 text-[10px] text-orange-800">
                           <strong className="uppercase">Motivo:</strong> {item.plan.evidence?.adminComment || 'Sin comentario'}
                         </div>
                       ) : status === 'APPROVED' ? (
                         <div className="bg-green-50 p-2 rounded border border-green-100 text-[10px] text-green-800">
                           <div className="flex items-center">
                             <ThumbsUp size={12} className="mr-1.5" />
                             <span className="font-medium">Validado por {item.plan.evidence?.approvedBy || 'Admin'}</span>
                           </div>
                           {item.plan.evidence?.adminComment && <p className="mt-1 opacity-80">{item.plan.evidence.adminComment}</p>}
                         </div>
                       ) : (
                         <div className="text-[10px] text-slate-400 italic flex items-center">
                           <RefreshCw size={12} className="mr-1.5 animate-spin-slow" />
                           Esperando revisión administrativa...
                         </div>
                       )}
                    </td>
                    <td className="p-4 text-center">
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
                        className="inline-flex items-center text-blue-600 hover:text-blue-800 text-[10px] font-black uppercase bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg border border-blue-100 transition-all"
                      >
                         <ExternalLink size={14} className="mr-1.5" /> Ver Evidencia
                       </button>
                    </td>
                  </tr>
                );
              })}
              {issues.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-16 text-center text-slate-400">
                    <div className="flex flex-col items-center">
                      <CheckCircle size={48} className="mb-4 text-slate-200" />
                      <p className="text-sm font-medium">No se encontraron registros en este estado.</p>
                      <button 
                        onClick={() => setFilter('ALL')}
                        className="mt-4 text-blue-600 text-xs font-bold hover:underline"
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
