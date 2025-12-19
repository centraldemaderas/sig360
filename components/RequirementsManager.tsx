
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Activity, Periodicity, MonthlyExecution, StandardDefinition, Plant, User, UserRole, Area } from '../types';
import { AREAS } from '../constants';
import { dataService } from '../services/dataService';
import { 
  Plus, Edit2, Trash2, X, Search, ShieldCheck, FileText, 
  TreePine, Briefcase, Truck, Factory, CheckSquare, Square, FileUp, 
  Save, Filter, BookOpen, Layers, ClipboardCheck, AlignLeft, Target,
  ChevronDown, Loader2, Move,
  // Added AlertCircle to fix the missing import error
  AlertCircle
} from 'lucide-react';

interface RequirementsManagerProps {
  activities: Activity[];
  onAdd: (activity: Activity) => void;
  onUpdate: (activity: Activity) => void;
  onDelete: (id: string) => void;
  standardsList: StandardDefinition[];
  currentUser: User;
  areas: Area[];
}

interface PendingImport {
  rawIndex: number;
  data: Activity;
  errors: string[];
  isDuplicate: boolean;
  existingActivity?: Activity;
}

export const RequirementsManager: React.FC<RequirementsManagerProps> = ({ 
  activities, 
  onAdd, 
  onUpdate, 
  onDelete,
  standardsList,
  currentUser,
  areas
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStandardFilter, setSelectedStandardFilter] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [selectedPeriodicity, setSelectedPeriodicity] = useState<Periodicity>(Periodicity.MONTHLY);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [plants, setPlants] = useState<Plant[]>([]);
  
  const [bulkInput, setBulkInput] = useState('');
  const [importStep, setImportStep] = useState(1); 
  const [pendingImports, setPendingImports] = useState<PendingImport[]>([]);
  const [isImporting, setIsImporting] = useState(false);

  // Estados para Draggable
  const [modalPos, setModalPos] = useState({ x: 80, y: 0 }); // Inicialmente a la derecha
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{ startX: number; startY: number }>({ startX: 0, startY: 0 });

  useEffect(() => {
    const unsub = dataService.subscribeToPlants(data => setPlants(data));
    return () => unsub();
  }, []);

  // Lógica de arrastre
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

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragRef.current.startX = e.clientX - modalPos.x;
    dragRef.current.startY = e.clientY - modalPos.y;
  };

  const filteredActivities = useMemo(() => {
    return activities.filter(activity => {
      const matchesStandard = selectedStandardFilter === 'ALL' || activity.standards.includes(selectedStandardFilter);
      const term = searchTerm.toLowerCase().trim();
      const matchesSearch = !term || 
        activity.clauseTitle.toLowerCase().includes(term) ||
        activity.subClause.toLowerCase().includes(term) ||
        activity.responsibleArea.toLowerCase().includes(term);
      return matchesStandard && matchesSearch;
    }).sort((a, b) => {
      return a.subClause.localeCompare(b.subClause, undefined, { numeric: true, sensitivity: 'base' });
    });
  }, [activities, searchTerm, selectedStandardFilter]);

  const currentAreaList = areas.length > 0 ? areas.map(a => a.name) : AREAS;

  const [formData, setFormData] = useState<Partial<Activity>>({
    clause: '', subClause: '', clauseTitle: '', description: '', contextualization: '',
    relatedQuestions: '', responsibleArea: currentAreaList[0], standards: [], plantIds: ['MOSQUERA'], 
    compliance2024: false, compliance2025: false
  });

  const handleOpenModal = (activity?: Activity) => {
    setErrorMsg(null);
    setModalPos({ x: 80, y: 0 }); // Reset pos con desplazamiento inicial a la derecha
    if (activity) {
      setEditingActivity(activity);
      setFormData({
        ...activity,
        plantIds: activity.plantIds.map(id => id.toUpperCase())
      });
      setSelectedPeriodicity(activity.periodicity || Periodicity.MONTHLY); 
    } else {
      setEditingActivity(null);
      setFormData({
        clause: '', subClause: '', clauseTitle: '', description: '', contextualization: '',
        relatedQuestions: '', responsibleArea: currentAreaList[0], standards: standardsList.length > 0 ? [standardsList[0].type] : [],
        plantIds: ['MOSQUERA'], compliance2024: false, compliance2025: false
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
    setFormData({ ...formData, standards: currentStds.includes(stdType) ? currentStds.filter(s => s !== stdType) : [...currentStds, stdType] });
  };

  const handleTogglePlant = (plantId: string) => {
    const currentPlants = formData.plantIds || [];
    const targetId = plantId.toUpperCase();
    const isSelected = currentPlants.map(id => id.toUpperCase()).includes(targetId);
    if (targetId === 'MOSQUERA' && isSelected && currentPlants.length === 1) return;
    setFormData({ 
      ...formData, 
      plantIds: isSelected 
        ? currentPlants.filter(p => p.toUpperCase() !== targetId) 
        : [...currentPlants, targetId] 
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.standards?.length || !formData.plantIds?.length) {
      setErrorMsg("Debe seleccionar al menos una Norma y una Planta.");
      return;
    }
    const finalPlans = editingActivity?.plans || { 2025: generateMonthlyPlan(selectedPeriodicity), 2026: generateMonthlyPlan(selectedPeriodicity) };
    const activityData: Activity = {
      id: editingActivity?.id || `ACT-${Date.now()}`,
      clause: formData.clause || '', subClause: formData.subClause || '', clauseTitle: formData.clauseTitle || '',
      description: formData.description || '', contextualization: formData.contextualization || '',
      relatedQuestions: formData.relatedQuestions || '', responsibleArea: formData.responsibleArea || currentAreaList[0],
      standards: formData.standards || [], plantIds: formData.plantIds || ['MOSQUERA'],
      periodicity: selectedPeriodicity, compliance2024: formData.compliance2024 || false,
      compliance2025: formData.compliance2025 || false, plans: finalPlans,
    };
    editingActivity ? onUpdate(activityData) : onAdd(activityData);
    setIsModalOpen(false);
  };

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
        <div><h2 className="text-2xl font-black text-slate-800 tracking-tight">Requisitos y Matriz</h2><p className="text-slate-500 font-medium">Configure actividades, responsables y periodicidad.</p></div>
        <div className="flex gap-3">
          {currentUser.role === UserRole.ADMIN && (
            <button onClick={() => { setIsBulkModalOpen(true); setImportStep(1); setBulkInput(''); }} className="bg-white hover:bg-slate-50 text-slate-900 border border-slate-200 px-6 py-2.5 rounded-xl flex items-center shadow-sm text-xs font-black uppercase tracking-widest"><FileUp size={18} className="mr-2 text-red-600" /> Carga Masiva</button>
          )}
          <button onClick={() => handleOpenModal()} className="bg-slate-900 hover:bg-black text-white px-6 py-2.5 rounded-xl flex items-center shadow-lg text-xs font-black uppercase tracking-widest transition-all"><Plus size={18} className="mr-2" /> Nuevo Requisito</button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Buscar por numeral, título o área..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm font-medium" 
            />
          </div>
          <div className="w-full md:w-72 relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={16} />
            <select value={selectedStandardFilter} onChange={(e) => setSelectedStandardFilter(e.target.value)} className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm font-black uppercase tracking-tight bg-white">
              <option value="ALL">TODAS LAS NORMAS</option>
              {standardsList.map(s => <option key={s.id} value={s.type}>{s.type}</option>)}
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-slate-50 text-slate-400 font-black uppercase text-[10px] tracking-[0.2em]"><tr><th className="p-5 w-28 text-center border-r border-slate-100">Numeral</th><th className="p-5">Requisito / Norma</th><th className="p-5">Plantas</th><th className="p-5 w-40">Área</th><th className="p-5 w-32 text-center">Acciones</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {filteredActivities.map((activity) => (
                <tr key={activity.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="p-5 text-center font-black text-slate-700 border-r border-slate-100"><div className="bg-slate-800 text-white px-2 py-1 rounded text-[11px] font-black shadow-sm mb-1">{activity.subClause}</div></td>
                  <td className="p-5"><div className="font-black text-slate-800 mb-1">{activity.clauseTitle}</div><div className="flex flex-wrap gap-1.5 mt-1.5">{activity.standards.map((s, idx) => { const Icon = getStandardIcon(s); return <span key={idx} className="text-[8px] font-black px-2 py-0.5 bg-blue-50 text-blue-600 rounded border border-blue-100 uppercase tracking-tighter flex items-center"><Icon size={10} className="mr-1" />{s}</span>; })}</div></td>
                  <td className="p-5"><div className="flex flex-wrap gap-1">{activity.plantIds?.map(pid => { const plant = plants.find(p => p.id.toUpperCase() === pid.toUpperCase()); return <span key={pid} className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase ${plant?.isMain ? 'bg-red-50 text-red-600 border-red-100' : 'bg-slate-50 text-slate-600 border-slate-100'}`}>{plant?.name || pid}</span>; })}</div></td>
                  <td className="p-5"><span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-black uppercase tracking-tighter border border-slate-200">{activity.responsibleArea}</span></td>
                  <td className="p-5 text-center"><div className="flex justify-center space-x-2"><button onClick={() => handleOpenModal(activity)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-all"><Edit2 size={16} /></button><button onClick={() => onDelete(activity.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all"><Trash2 size={16} /></button></div></td>
                </tr>
              ))}
              {filteredActivities.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-20 text-center">
                    <div className="flex flex-col items-center">
                      <Search size={40} className="text-slate-200 mb-4" />
                      <p className="text-sm font-black text-slate-400 uppercase tracking-widest">No se encontraron requisitos con estos filtros</p>
                      <button onClick={() => {setSearchTerm(''); setSelectedStandardFilter('ALL');}} className="mt-4 text-blue-600 text-[10px] font-black uppercase tracking-widest hover:underline">Limpiar Filtros</button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/90 flex items-center justify-center z-[5000] p-4 backdrop-blur-md animate-in fade-in duration-300">
          <div 
            style={{ transform: `translate(${modalPos.x}px, ${modalPos.y}px)` }}
            className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-200 relative animate-in zoom-in-95 duration-200"
          >
            <div 
              onMouseDown={handleMouseDown}
              className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0 cursor-move active:cursor-grabbing select-none"
            >
              <div className="flex items-center">
                <div className="p-3 bg-slate-900 text-white rounded-2xl mr-4 shadow-lg">
                  {editingActivity ? <Edit2 size={24} /> : <Plus size={24} />}
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase leading-none mb-1">
                    {editingActivity ? 'Editar Requisito' : 'Nuevo Requisito'}
                  </h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">Matriz de Cumplimiento Integral</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-slate-200 rounded-lg text-slate-500"><Move size={14} /></div>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-900 p-2 hover:bg-slate-200 rounded-full transition-colors"><X size={24} /></button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-8 overflow-y-auto scrollbar-thin flex-1">
              {errorMsg && (
                <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-2xl flex items-center gap-3 text-xs font-black uppercase animate-pulse">
                  <AlertCircle size={18} /> {errorMsg}
                </div>
              )}

              <div className="space-y-4">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Normas Asociadas</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {standardsList.map((std) => {
                    const Icon = getStandardIcon(std.type);
                    const isS = formData.standards?.includes(std.type);
                    return (
                      <button key={std.id} type="button" onClick={() => handleToggleStandard(std.type)} 
                              className={`flex items-center p-4 rounded-2xl border-2 transition-all ${isS ? `bg-blue-50 border-blue-500 text-blue-900 shadow-sm` : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'}`}>
                        <div className={`p-2 rounded-lg mr-3 ${isS ? `bg-blue-200` : 'bg-slate-50'}`}><Icon size={18} className={isS ? `text-blue-700` : 'text-slate-300'} /></div>
                        <span className="text-[10px] font-black uppercase tracking-tight text-left">{std.type}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-4">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Sedes / Plantas</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                  {plants.map((plt) => { 
                    const isS = formData.plantIds?.map(id => id.toUpperCase()).includes(plt.id.toUpperCase());
                    return (
                      <button key={plt.id} type="button" onClick={() => handleTogglePlant(plt.id)} 
                              className={`flex items-center p-3 rounded-xl border-2 transition-all ${isS ? `bg-red-50 border-red-500 text-red-900` : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'}`}>
                        {isS ? <CheckSquare size={16} className="mr-2 text-red-600" /> : <Square size={16} className="mr-2 text-slate-300" />}
                        <span className="text-[9px] font-black uppercase tracking-tight truncate">{plt.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Numeral (Tarea)</label>
                  <input required type="text" value={formData.subClause} 
                         onChange={e => setFormData({...formData, subClause: e.target.value, clause: e.target.value.split('.').slice(0,2).join('.')})} 
                         className="w-full px-5 py-4 border-2 border-slate-100 rounded-2xl text-sm font-black bg-slate-50 focus:bg-white focus:border-blue-500 transition-all outline-none" placeholder="Ej: 4.1.1" />
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Área Responsable</label>
                  <select value={formData.responsibleArea} onChange={e => setFormData({...formData, responsibleArea: e.target.value})} 
                          className="w-full px-5 py-4 border-2 border-slate-100 rounded-2xl text-sm font-black bg-slate-50 focus:bg-white focus:border-blue-500 transition-all outline-none">
                    {currentAreaList.map(area => <option key={area} value={area}>{area.toUpperCase()}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Título descriptivo</label>
                <input required type="text" value={formData.clauseTitle} onChange={e => setFormData({...formData, clauseTitle: e.target.value})} 
                       className="w-full px-5 py-4 border-2 border-slate-100 rounded-2xl text-sm font-black bg-slate-50 focus:bg-white focus:border-blue-500 transition-all outline-none" 
                       placeholder="Título del requisito..." />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center">
                    <AlignLeft size={14} className="mr-2" /> Descripción Normativa
                  </label>
                  <textarea rows={4} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} 
                            className="w-full border-2 border-slate-100 rounded-3xl p-5 text-sm font-medium bg-slate-50 focus:bg-white focus:border-blue-500 transition-all outline-none italic" 
                            placeholder="Descripción textual de la norma..." />
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center">
                    <Target size={14} className="mr-2" /> Explicación Operativa
                  </label>
                  <textarea rows={4} value={formData.contextualization} onChange={e => setFormData({...formData, contextualization: e.target.value})} 
                            className="w-full border-2 border-slate-100 rounded-3xl p-5 text-sm font-bold bg-slate-50 focus:bg-white focus:border-blue-500 transition-all outline-none" 
                            placeholder="Interpretación interna..." />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center">
                  <ClipboardCheck size={14} className="mr-2" /> Criterio de Auditoría / Tarea
                </label>
                <textarea rows={3} value={formData.relatedQuestions} onChange={e => setFormData({...formData, relatedQuestions: e.target.value})} 
                          className="w-full border-2 border-slate-100 rounded-3xl p-5 text-sm font-black bg-slate-50 focus:bg-white focus:border-blue-500 transition-all outline-none" 
                          placeholder="Puntos a auditar..." />
              </div>

              <div className="bg-slate-900 p-8 rounded-[2.5rem] border-2 border-slate-800 shadow-xl">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4">Periodicidad de Seguimiento</label>
                <div className="relative">
                  <select value={selectedPeriodicity} onChange={e => setSelectedPeriodicity(e.target.value as Periodicity)} 
                          className="w-full bg-slate-800 border-2 border-slate-700 text-white rounded-2xl p-5 text-sm font-black focus:border-blue-500 outline-none appearance-none">
                    {Object.values(Periodicity).map(p => <option key={p} value={p}>{p.toUpperCase()}</option>)}
                  </select>
                  <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={20} />
                </div>
              </div>

              <div className="flex gap-4 pt-6 pb-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-5 text-slate-400 font-black text-xs uppercase tracking-widest hover:bg-slate-50 rounded-[1.5rem] transition-all">Cancelar</button>
                <button type="submit" className="flex-[2] py-5 bg-slate-900 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl hover:bg-black transition-all flex items-center justify-center active:scale-95">
                  <Save size={20} className="mr-3" /> GUARDAR REQUISITO
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
