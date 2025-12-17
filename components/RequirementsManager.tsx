
import React, { useState } from 'react';
import { Activity, Periodicity, MonthlyExecution, StandardType } from '../types';
import { AREAS } from '../constants';
import { Plus, Edit2, Trash2, Save, X, Search, Calendar, AlertTriangle, CheckSquare } from 'lucide-react';

interface RequirementsManagerProps {
  activities: Activity[];
  onAdd: (activity: Activity) => void;
  onUpdate: (activity: Activity) => void;
  onDelete: (id: string) => void;
}

export const RequirementsManager: React.FC<RequirementsManagerProps> = ({ 
  activities, 
  onAdd, 
  onUpdate, 
  onDelete 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [selectedPeriodicity, setSelectedPeriodicity] = useState<Periodicity>(Periodicity.MONTHLY);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<Activity>>({
    clause: '',
    subClause: '',
    clauseTitle: '',
    description: '',
    contextualization: '',
    relatedQuestions: '',
    responsibleArea: AREAS[0],
    standards: [StandardType.ISO9001],
    compliance2024: false,
    compliance2025: false
  });

  const handleOpenModal = (activity?: Activity) => {
    setErrorMsg(null);
    if (activity) {
      setEditingActivity(activity);
      setFormData(activity);
      setSelectedPeriodicity(activity.periodicity || Periodicity.MONTHLY); 
    } else {
      setEditingActivity(null);
      setFormData({
        clause: '',
        subClause: '',
        clauseTitle: '',
        description: '',
        contextualization: '',
        relatedQuestions: '',
        responsibleArea: AREAS[0],
        standards: [StandardType.ISO9001],
        compliance2024: false,
        compliance2025: false
      });
      setSelectedPeriodicity(Periodicity.MONTHLY);
    }
    setIsModalOpen(true);
  };

  const generateMonthlyPlan = (periodicity: Periodicity): MonthlyExecution[] => {
    return Array.from({ length: 12 }, (_, i) => {
      let isPlanned = false;
      switch (periodicity) {
        case Periodicity.MONTHLY: isPlanned = true; break;
        case Periodicity.BIMONTHLY: isPlanned = i % 2 === 0; break;
        case Periodicity.QUARTERLY: isPlanned = (i + 1) % 3 === 0; break;
        case Periodicity.SEMIANNUAL: isPlanned = i === 5 || i === 11; break;
        case Periodicity.ANNUAL: isPlanned = i === 11; break;
      }
      return {
        month: i,
        planned: isPlanned,
        executed: false,
        delayed: false
      };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!formData.standards || formData.standards.length === 0) {
      setErrorMsg("Debe seleccionar al menos un Sistema de Gestión.");
      return;
    }
    
    let finalPlans = editingActivity?.plans || {};
    
    // If new or periodicity changed, regenerate plans for consistency
    if (!editingActivity || editingActivity.periodicity !== selectedPeriodicity) {
        finalPlans = {
            2025: generateMonthlyPlan(selectedPeriodicity),
            2026: generateMonthlyPlan(selectedPeriodicity)
        };
    }

    const activityData: Activity = {
      id: editingActivity ? editingActivity.id : `ACT-${Date.now()}`,
      clause: formData.clause || '',
      subClause: formData.subClause || '',
      clauseTitle: formData.clauseTitle || '',
      description: formData.description || '',
      contextualization: formData.contextualization || '',
      relatedQuestions: formData.relatedQuestions || '',
      responsibleArea: formData.responsibleArea || AREAS[0],
      standards: formData.standards || [],
      periodicity: selectedPeriodicity,
      compliance2024: formData.compliance2024 || false,
      compliance2025: formData.compliance2025 || false,
      plans: finalPlans,
    };

    if (editingActivity) {
      onUpdate(activityData);
    } else {
      onAdd(activityData);
    }
    setIsModalOpen(false);
  };

  const filteredActivities = activities.filter(a => 
    a.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.clause.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.subClause?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.responsibleArea.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Gestión de Requisitos</h2>
          <p className="text-slate-500">Configure actividades, responsables y periodicidad.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center shadow-sm text-sm font-bold"
        >
          <Plus size={18} className="mr-2" />
          Nuevo Requisito
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Buscar cláusula, descripción..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-100 text-slate-600 font-semibold uppercase text-xs">
              <tr>
                <th className="p-4 w-28 text-center">Cláusula</th>
                <th className="p-4">Requisito</th>
                <th className="p-4 w-40">Responsable</th>
                <th className="p-4 w-32 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredActivities.map((activity) => (
                <tr key={activity.id} className="hover:bg-slate-50">
                  <td className="p-4 text-center font-bold text-slate-700">{activity.clause}</td>
                  <td className="p-4">
                    <div className="font-bold text-slate-800">{activity.clauseTitle}</div>
                    <div className="text-slate-500 text-[10px] mt-1 line-clamp-1">{activity.description}</div>
                  </td>
                  <td className="p-4"><span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs font-bold uppercase">{activity.responsibleArea}</span></td>
                  <td className="p-4 text-center">
                    <div className="flex justify-center space-x-2">
                      <button onClick={() => handleOpenModal(activity)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"><Edit2 size={16} /></button>
                      <button onClick={() => onDelete(activity.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[5000] p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[95vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50 shrink-0">
              <h3 className="text-xl font-bold text-slate-800">{editingActivity ? 'Editar Requisito' : 'Nuevo Requisito'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors p-1"><X size={24} /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 space-y-6 overflow-y-auto scrollbar-thin">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="col-span-1">
                   <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Cláusula</label>
                   <input required type="text" value={formData.clause} onChange={e => setFormData({...formData, clause: e.target.value})} className="w-full border-2 border-slate-200 rounded-xl p-3 text-sm focus:border-blue-500 outline-none transition-all font-bold" />
                </div>
                <div className="col-span-1">
                   <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Sub-numeral</label>
                   <input required type="text" value={formData.subClause} onChange={e => setFormData({...formData, subClause: e.target.value})} className="w-full border-2 border-slate-200 rounded-xl p-3 text-sm focus:border-blue-500 outline-none transition-all font-bold" />
                </div>
                <div className="col-span-2">
                   <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Área Responsable</label>
                   <select value={formData.responsibleArea} onChange={e => setFormData({...formData, responsibleArea: e.target.value})} className="w-full border-2 border-slate-200 rounded-xl p-3 text-sm focus:border-blue-500 outline-none transition-all font-bold">
                    {AREAS.map(area => <option key={area} value={area}>{area}</option>)}
                   </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Título del Requisito</label>
                <input required type="text" value={formData.clauseTitle} onChange={e => setFormData({...formData, clauseTitle: e.target.value})} className="w-full border-2 border-slate-200 rounded-xl p-3 text-sm focus:border-blue-500 outline-none transition-all font-bold" />
              </div>

              <div className="space-y-4">
                <div>
                   <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Norma (Descripción)</label>
                   <textarea rows={3} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full border-2 border-slate-200 rounded-xl p-4 text-sm outline-none focus:border-blue-500 transition-all font-medium bg-slate-50" placeholder="Escriba la descripción oficial de la norma..." />
                </div>
                <div>
                   <label className="block text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1.5">Contextualización Central de Maderas</label>
                   <textarea rows={3} value={formData.contextualization} onChange={e => setFormData({...formData, contextualization: e.target.value})} className="w-full border-2 border-blue-100 rounded-xl p-4 text-sm outline-none focus:border-blue-500 transition-all font-medium bg-blue-50/30" placeholder="¿Cómo aplica este requisito internamente?" />
                </div>
                {/* FIELD ADDED: relatedQuestions (Specific Task) */}
                <div>
                   <label className="block text-[10px] font-black text-amber-600 uppercase tracking-widest mb-1.5">Tarea Específica / Criterio de Cumplimiento</label>
                   <textarea rows={3} value={formData.relatedQuestions} onChange={e => setFormData({...formData, relatedQuestions: e.target.value})} className="w-full border-2 border-amber-100 rounded-xl p-4 text-sm outline-none focus:border-blue-500 transition-all font-bold bg-amber-50/30" placeholder="Escriba la tarea específica a realizar..." />
                </div>
              </div>

              <div className="bg-slate-100 p-5 rounded-2xl border-2 border-slate-200">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2.5">Periodicidad de Control</label>
                <select 
                  value={selectedPeriodicity}
                  onChange={e => setSelectedPeriodicity(e.target.value as Periodicity)}
                  className="w-full border-2 border-slate-300 rounded-xl p-3 text-sm font-bold outline-none focus:border-blue-500 transition-all"
                >
                  {Object.values(Periodicity).map(p => <option key={p} value={p}>{p}</option>)}
                </select>
                <p className="text-[10px] text-slate-500 mt-3 font-medium flex items-center">
                  <AlertTriangle size={12} className="mr-1.5 text-amber-500" />
                  Al cambiar la periodicidad se resetearán los planes mensuales para todos los años.
                </p>
              </div>

              <div className="flex justify-end space-x-4 pt-4 shrink-0">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3 text-slate-500 font-black text-sm hover:bg-slate-50 rounded-xl transition-colors">Cancelar</button>
                <button type="submit" className="px-10 py-3 bg-blue-600 text-white rounded-xl font-black text-sm shadow-xl shadow-blue-500/20 hover:bg-blue-700 transition-all active:scale-95">Guardar Requisito</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
