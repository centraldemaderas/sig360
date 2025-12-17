
import React, { useState } from 'react';
import { Activity, Periodicity, MonthlyExecution, StandardDefinition } from '../types';
import { AREAS } from '../constants';
import { Plus, Edit2, Trash2, X, Search, AlertTriangle, ShieldCheck, FileText, TreePine, Briefcase, Truck } from 'lucide-react';

interface RequirementsManagerProps {
  activities: Activity[];
  onAdd: (activity: Activity) => void;
  onUpdate: (activity: Activity) => void;
  onDelete: (id: string) => void;
  standardsList: StandardDefinition[];
}

export const RequirementsManager: React.FC<RequirementsManagerProps> = ({ 
  activities, 
  onAdd, 
  onUpdate, 
  onDelete,
  standardsList
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [selectedPeriodicity, setSelectedPeriodicity] = useState<Periodicity>(Periodicity.MONTHLY);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<Activity>>({
    clause: '',
    subClause: '',
    clauseTitle: '',
    description: '',
    contextualization: '',
    relatedQuestions: '',
    responsibleArea: AREAS[0],
    standards: [],
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
        standards: standardsList.length > 0 ? [standardsList[0].type] : [],
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
      return { month: i, planned: isPlanned, executed: false, delayed: false };
    });
  };

  const handleToggleStandard = (stdType: string) => {
    const currentStds = formData.standards || [];
    if (currentStds.includes(stdType)) {
      setFormData({ ...formData, standards: currentStds.filter(s => s !== stdType) });
    } else {
      setFormData({ ...formData, standards: [...currentStds, stdType] });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!formData.standards || formData.standards.length === 0) {
      setErrorMsg("Debe seleccionar al menos un Sistema de Gestión (Norma).");
      return;
    }
    let finalPlans = editingActivity?.plans || {};
    if (!editingActivity || editingActivity.periodicity !== selectedPeriodicity) {
        finalPlans = { 2025: generateMonthlyPlan(selectedPeriodicity), 2026: generateMonthlyPlan(selectedPeriodicity) };
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
    if (editingActivity) onUpdate(activityData);
    else onAdd(activityData);
    setIsModalOpen(false);
  };

  const filteredActivities = activities.filter(a => 
    a.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.clause.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.responsibleArea.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.clauseTitle.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStandardIcon = (type: string) => {
    const t = type.toLowerCase();
    if (t.includes('9001')) return FileText;
    if (t.includes('sst')) return ShieldCheck;
    if (t.includes('fsc')) return TreePine;
    if (t.includes('vial') || t.includes('pesv')) return Truck;
    return Briefcase;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Requisitos y Matriz</h2>
          <p className="text-slate-500 font-medium">Configure actividades, responsables y periodicidad para los distintos estándares.</p>
        </div>
        <button onClick={() => handleOpenModal()} className="bg-slate-900 hover:bg-black text-white px-6 py-2.5 rounded-xl flex items-center shadow-lg text-xs font-black uppercase tracking-widest transition-all active:scale-95">
          <Plus size={18} className="mr-2" /> Nuevo Requisito
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-5 border-b border-slate-100 bg-slate-50/50">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
            <input type="text" placeholder="Buscar requisitos..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm font-medium transition-all" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-slate-50 text-slate-400 font-black uppercase text-[10px] tracking-[0.2em]">
              <tr>
                <th className="p-5 w-28 text-center border-r border-slate-100">Cláusula</th>
                <th className="p-5">Requisito / Norma</th>
                <th className="p-5">Tarea Específica / Criterio</th>
                <th className="p-5 w-40">Responsable</th>
                <th className="p-5 w-32 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredActivities.map((activity) => (
                <tr key={activity.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="p-5 text-center font-black text-slate-700 border-r border-slate-100">{activity.clause}<div className="text-[9px] text-slate-400 font-bold">{activity.subClause}</div></td>
                  <td className="p-5">
                    <div className="font-black text-slate-800 mb-1">{activity.clauseTitle}</div>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {activity.standards.map((s, idx) => {
                        const Icon = getStandardIcon(s);
                        return <span key={idx} className="text-[8px] font-black px-2 py-0.5 bg-blue-50 text-blue-600 rounded border border-blue-100 uppercase tracking-tighter flex items-center"><Icon size={10} className="mr-1" />{s}</span>;
                      })}
                    </div>
                  </td>
                  <td className="p-5"><div className="text-slate-600 line-clamp-2 italic font-medium">{activity.relatedQuestions || 'Sin tarea definida'}</div></td>
                  <td className="p-5"><span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-black uppercase tracking-tighter border border-slate-200">{activity.responsibleArea}</span></td>
                  <td className="p-5 text-center">
                    <div className="flex justify-center space-x-2">
                      <button onClick={() => handleOpenModal(activity)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-all" title="Editar"><Edit2 size={16} /></button>
                      <button onClick={() => onDelete(activity.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all" title="Eliminar"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredActivities.length === 0 && <tr><td colSpan={5} className="p-16 text-center text-slate-300 italic">No se encontraron requisitos.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[5000] p-4 backdrop-blur-md">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-4xl max-h-[95vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-300 border border-slate-200">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
              <div><h3 className="text-2xl font-black text-slate-900 tracking-tight">{editingActivity ? 'Editar Requisito' : 'Nuevo Requisito'}</h3><p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] mt-1">Matriz de cumplimiento integral</p></div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-900 transition-colors p-2 hover:bg-slate-100 rounded-full"><X size={28} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-8 overflow-y-auto scrollbar-thin bg-white">
              {errorMsg && <div className="bg-red-50 border border-red-200 p-4 rounded-2xl flex items-center text-red-800 text-xs font-black animate-pulse"><AlertTriangle size={18} className="mr-3 shrink-0" />{errorMsg}</div>}
              <div className="space-y-3">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Sistemas de Gestión Aplicables (Normas)</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {standardsList.map((std) => {
                    const Icon = getStandardIcon(std.type);
                    const isSelected = formData.standards?.includes(std.type);
                    return (
                      <button key={std.id} type="button" onClick={() => handleToggleStandard(std.type)} className={`flex items-center p-3 rounded-2xl border-2 transition-all text-left group ${isSelected ? `bg-blue-50 border-blue-500 text-blue-900 shadow-sm` : 'bg-slate-50 border-slate-100 text-slate-400 hover:border-slate-300'}`}>
                        <div className={`p-1.5 rounded-lg mr-2 ${isSelected ? `bg-blue-200` : 'bg-white'}`}><Icon size={18} className={isSelected ? `text-blue-700` : 'text-slate-300'} /></div>
                        <span className="text-[9px] font-black uppercase tracking-tight leading-tight">{std.type}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="col-span-1"><label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Cláusula</label><input required type="text" value={formData.clause} onChange={e => setFormData({...formData, clause: e.target.value})} className="w-full border-2 border-slate-100 rounded-2xl p-3.5 text-sm focus:border-blue-500 font-black bg-slate-50" placeholder="Ej: 4.1" /></div>
                <div className="col-span-1"><label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Sub-numeral</label><input required type="text" value={formData.subClause} onChange={e => setFormData({...formData, subClause: e.target.value})} className="w-full border-2 border-slate-100 rounded-2xl p-3.5 text-sm focus:border-blue-500 font-black bg-slate-50" placeholder="Ej: 4.1.1" /></div>
                <div className="col-span-2"><label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Área Responsable</label><select value={formData.responsibleArea} onChange={e => setFormData({...formData, responsibleArea: e.target.value})} className="w-full border-2 border-slate-100 rounded-2xl p-3.5 text-sm focus:border-blue-500 font-black bg-slate-50">{AREAS.map(area => <option key={area} value={area}>{area}</option>)}</select></div>
              </div>
              <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Título del Requisito</label><input required type="text" value={formData.clauseTitle} onChange={e => setFormData({...formData, clauseTitle: e.target.value})} className="w-full border-2 border-slate-100 rounded-2xl p-3.5 text-sm focus:border-blue-500 font-black bg-slate-50" /></div>
              <div className="space-y-6">
                <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Norma (Descripción Técnica)</label><textarea rows={4} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full border-2 border-slate-100 rounded-2xl p-5 text-sm font-medium bg-slate-50/50" /></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div><label className="block text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] mb-2">Contextualización</label><textarea rows={4} value={formData.contextualization} onChange={e => setFormData({...formData, contextualization: e.target.value})} className="w-full border-2 border-blue-50 rounded-2xl p-5 text-sm font-semibold bg-blue-50/20" /></div>
                  <div><label className="block text-[10px] font-black text-amber-600 uppercase tracking-[0.2em] mb-2">Tarea Específica / Criterio</label><textarea rows={4} value={formData.relatedQuestions} onChange={e => setFormData({...formData, relatedQuestions: e.target.value})} className="w-full border-2 border-amber-50 rounded-2xl p-5 text-sm font-black bg-amber-50/20" /></div>
                </div>
              </div>
              <div className="bg-slate-900 p-8 rounded-[1.5rem] border-2 border-slate-800 shadow-xl shadow-slate-200">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4">Periodicidad</label>
                <select value={selectedPeriodicity} onChange={e => setSelectedPeriodicity(e.target.value as Periodicity)} className="w-full bg-slate-800 border-2 border-slate-700 text-white rounded-2xl p-4 text-sm font-black outline-none">{Object.values(Periodicity).map(p => <option key={p} value={p}>{p}</option>)}</select>
              </div>
              <div className="flex justify-end gap-4 pt-4 pb-6"><button type="button" onClick={() => setIsModalOpen(false)} className="px-8 py-4 text-slate-400 font-black text-xs uppercase tracking-widest hover:bg-slate-50 rounded-2xl">Cancelar</button><button type="submit" className="px-12 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl hover:bg-black transition-all border border-slate-700">Guardar Requisito</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
