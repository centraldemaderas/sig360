
import React, { useState, useEffect, useRef } from 'react';
import { Activity, Periodicity, MonthlyExecution, StandardDefinition, Plant, User, UserRole, Area } from '../types';
import { AREAS } from '../constants';
import { dataService } from '../services/dataService';
import * as XLSX from 'https://esm.sh/xlsx';
import { 
  Plus, Edit2, Trash2, X, Search, AlertTriangle, ShieldCheck, FileText, 
  TreePine, Briefcase, Truck, Factory, CheckSquare, Square, FileUp, 
  ChevronRight, Info, HelpCircle, Copy, CheckCircle2, AlertCircle,
  Eye, ListChecks, ArrowRight, ShieldAlert, Check, Loader2, FileSpreadsheet, Upload,
  AlignLeft, MessageSquare, Target, ClipboardCheck, Hash, Database, Trash, Filter,
  BookOpen, Layers, Save, MapPin, BadgeCheck,
  // Added missing icon imports
  ChevronDown, Clock
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
  const [isDuplicateModalOpen, setIsDuplicateModalOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [selectedPeriodicity, setSelectedPeriodicity] = useState<Periodicity>(Periodicity.MONTHLY);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [plants, setPlants] = useState<Plant[]>([]);
  
  // States for Bulk Import Flow
  const [bulkInput, setBulkInput] = useState('');
  const [importStep, setImportStep] = useState(1); 
  const [importMode, setImportMode] = useState<'PASTE' | 'FILE'>('PASTE');
  const [pendingImports, setPendingImports] = useState<PendingImport[]>([]);
  const [duplicateQueue, setDuplicateQueue] = useState<PendingImport[]>([]);
  const [currentDuplicate, setCurrentDuplicate] = useState<PendingImport | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsub = dataService.subscribeToPlants(data => setPlants(data));
    return () => unsub();
  }, []);

  const currentAreaList = areas.length > 0 ? areas.map(a => a.name) : AREAS;

  const [formData, setFormData] = useState<Partial<Activity>>({
    clause: '', subClause: '', clauseTitle: '', description: '', contextualization: '',
    relatedQuestions: '', responsibleArea: currentAreaList[0], standards: [], plantIds: ['MOSQUERA'], 
    compliance2024: false, compliance2025: false
  });

  const handleOpenModal = (activity?: Activity) => {
    setErrorMsg(null);
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
    if (targetId === 'MOSQUERA' && currentPlants.map(id => id.toUpperCase()).includes(targetId) && currentPlants.length === 1) return;
    const isSelected = currentPlants.map(id => id.toUpperCase()).includes(targetId);
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

  const processRawMatrix = (matrix: any[]) => {
    const parsed: PendingImport[] = [];
    const startIndex = matrix[0]?.some((cell: any) => String(cell).toLowerCase().includes('norma')) ? 1 : 0;
    for (let i = startIndex; i < matrix.length; i++) {
      const cols = matrix[i];
      if (!cols || cols.length < 2) continue;
      const errors: string[] = [];
      const rawNorma = String(cols[0] || '').trim();
      const fullTitle = String(cols[1] || '').trim();
      const rawDesc = String(cols[2] || '').trim();
      const rawContext = String(cols[3] || '').trim();
      const rawTarea = String(cols[4] || '').trim();
      const rawPeriodicity = String(cols[5] || '').trim();
      const rawArea = String(cols[6] || '').trim();
      const numeralMatch = rawTarea.match(/^(\d+(\.\d+)+|\d+\.\d+|\d+)\s*(.*)/);
      const subClause = numeralMatch ? numeralMatch[1] : '';
      const tareaSinNumeral = numeralMatch ? numeralMatch[3] : rawTarea;
      const clauseParts = subClause.split('.');
      const clause = clauseParts.length > 1 ? clauseParts.slice(0, 2).join('.') : subClause;
      if (!rawNorma) errors.push("Falta Norma");
      if (!subClause) errors.push("Sin Numeral");
      if (!fullTitle) errors.push("Sin Título");
      let periodicity = Periodicity.ANNUAL;
      const pL = rawPeriodicity.toLowerCase();
      if (pL.includes('mensual')) periodicity = Periodicity.MONTHLY;
      else if (pL.includes('bimestral')) periodicity = Periodicity.BIMONTHLY;
      else if (pL.includes('trimestral')) periodicity = Periodicity.QUARTERLY;
      else if (pL.includes('semestral')) periodicity = Periodicity.SEMIANNUAL;
      const area = currentAreaList.find(a => a.toLowerCase() === rawArea.toLowerCase()) || currentAreaList[0];
      if (!rawArea) errors.push("Falta Área");
      const assignedPlantIds: string[] = [];
      const plantColMap = [
        { idx: 7, id: 'MOSQUERA' }, { idx: 8, id: 'PLT-CARTAGENA' }, { idx: 9, id: 'PLT-YALI' }, 
        { idx: 10, id: 'PLT-DILUVIO' }, { idx: 11, id: 'PLT-CALI' }, { idx: 12, id: 'PLT-ECOCENTRAL' }, { idx: 13, id: 'PLT-SOCIALWAY' }
      ];
      plantColMap.forEach(p => { 
        const cellValue = String(cols[p.idx] || '').trim().toLowerCase();
        if ((cellValue === '1' || cellValue === 'x') && !assignedPlantIds.includes(p.id)) assignedPlantIds.push(p.id); 
      });
      if (assignedPlantIds.length === 0) assignedPlantIds.push('MOSQUERA');
      const newItem: Activity = {
        id: `ACT-IMP-${Date.now()}-${i}`,
        clause, subClause, clauseTitle: fullTitle, description: rawDesc, contextualization: rawContext,
        relatedQuestions: tareaSinNumeral, standards: [rawNorma], responsibleArea: area, periodicity, plantIds: assignedPlantIds,
        compliance2024: false, compliance2025: false, plans: { 2025: generateMonthlyPlan(periodicity), 2026: generateMonthlyPlan(periodicity) }
      };
      const existing = activities.find(a => a.subClause === subClause);
      parsed.push({ rawIndex: i, data: newItem, errors, isDuplicate: !!existing, existingActivity: existing });
    }
    setPendingImports(parsed);
    setImportStep(2);
  };

  const finalizeImport = async () => {
    const cleanImports = pendingImports.filter(p => p.errors.length === 0);
    const originals = cleanImports.filter(p => !p.isDuplicate);
    const duplicates = cleanImports.filter(p => p.isDuplicate);
    setIsImporting(true);
    for (const p of originals) await onAdd(p.data);
    if (duplicates.length > 0) {
      setDuplicateQueue(duplicates);
      setCurrentDuplicate(duplicates[0]);
      setIsDuplicateModalOpen(true);
    } else {
      setIsBulkModalOpen(false);
      alert('Importación finalizada.');
    }
    setIsImporting(false);
  };

  const handleDuplicateDecision = async (decision: 'SKIP' | 'OVERWRITE' | 'KEEP_BOTH') => {
    if (!currentDuplicate) return;
    if (decision === 'OVERWRITE') await onUpdate({ ...currentDuplicate.data, id: currentDuplicate.existingActivity!.id });
    else if (decision === 'KEEP_BOTH') await onAdd(currentDuplicate.data);
    const remaining = duplicateQueue.slice(1);
    setDuplicateQueue(remaining);
    if (remaining.length > 0) setCurrentDuplicate(remaining[0]);
    else { setIsDuplicateModalOpen(false); setIsBulkModalOpen(false); alert('Duplicados gestionados.'); }
  };

  const filteredActivities = activities
    .filter(a => {
      const matchesSearch = a.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           a.clause.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           a.responsibleArea.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           a.clauseTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           a.subClause.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStandard = selectedStandardFilter === 'ALL' || a.standards.includes(selectedStandardFilter);
      return matchesSearch && matchesStandard;
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

  const getStandardIcon = (type: string) => {
    const t = type.toLowerCase();
    if (t.includes('9001')) return FileText;
    if (t.includes('sst')) return ShieldCheck;
    if (t.includes('fsc')) return TreePine;
    if (t.includes('vial') || t.includes('pesv')) return Truck;
    return Briefcase;
  };

  const isAdmin = currentUser.role === UserRole.ADMIN;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div><h2 className="text-2xl font-black text-slate-800 tracking-tight">Requisitos y Matriz</h2><p className="text-slate-500 font-medium">Configure actividades, responsables y periodicidad para los distintos estándares y plantas.</p></div>
        <div className="flex gap-3">
          {isAdmin && (
            <button onClick={() => { setIsBulkModalOpen(true); setImportStep(1); setBulkInput(''); setPendingImports([]); }} className="bg-white hover:bg-slate-50 text-slate-900 border border-slate-200 px-6 py-2.5 rounded-xl flex items-center shadow-sm text-xs font-black uppercase tracking-widest transition-all active:scale-95"><FileUp size={18} className="mr-2 text-red-600" /> Carga Masiva</button>
          )}
          <button onClick={() => handleOpenModal()} className="bg-slate-900 hover:bg-black text-white px-6 py-2.5 rounded-xl flex items-center shadow-lg text-xs font-black uppercase tracking-widest transition-all active:scale-95"><Plus size={18} className="mr-2" /> Nuevo Requisito</button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
            <input type="text" placeholder="Buscar por numeral, título, área o descripción..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm font-medium transition-all" />
          </div>
          <div className="w-full md:w-72 relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={16} />
            <select value={selectedStandardFilter} onChange={(e) => setSelectedStandardFilter(e.target.value)} className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm font-black uppercase tracking-tight bg-white">
              <option value="ALL">TODAS LAS NORMAS</option>
              {standardsList.map(s => <option key={s.id} value={s.type}>{s.type}</option>)}
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-slate-50 text-slate-400 font-black uppercase text-[10px] tracking-[0.2em]"><tr><th className="p-5 w-28 text-center border-r border-slate-100">Numeral</th><th className="p-5">Requisito / Norma</th><th className="p-5">Plantas Asignadas</th><th className="p-5 w-40">Responsable</th><th className="p-5 w-32 text-center">Acciones</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {filteredActivities.map((activity) => (
                <tr key={activity.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="p-5 text-center font-black text-slate-700 border-r border-slate-100"><div className="bg-slate-800 text-white px-2 py-1 rounded text-[11px] font-black shadow-sm mb-1">{activity.subClause}</div><div className="text-[9px] text-slate-400 font-bold uppercase">Cláusula {activity.clause}</div></td>
                  <td className="p-5"><div className="font-black text-slate-800 mb-1">{activity.clauseTitle}</div><div className="flex flex-wrap gap-1.5 mt-1.5">{activity.standards.map((s, idx) => { const Icon = getStandardIcon(s); return <span key={idx} className="text-[8px] font-black px-2 py-0.5 bg-blue-50 text-blue-600 rounded border border-blue-100 uppercase tracking-tighter flex items-center"><Icon size={10} className="mr-1" />{s}</span>; })}</div></td>
                  <td className="p-5"><div className="flex flex-wrap gap-1">{activity.plantIds?.map(pid => { const plant = plants.find(p => p.id.toUpperCase() === pid.toUpperCase()); if (!plant) return null; return <span key={pid} className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase ${plant.isMain ? 'bg-red-50 text-red-600 border-red-100' : 'bg-slate-50 text-slate-600 border-slate-100'}`}>{plant.name}</span>; })}</div></td>
                  <td className="p-5"><span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-black uppercase tracking-tighter border border-slate-200">{activity.responsibleArea}</span></td>
                  <td className="p-5 text-center"><div className="flex justify-center space-x-2"><button onClick={() => handleOpenModal(activity)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-all" title="Editar"><Edit2 size={16} /></button><button onClick={() => onDelete(activity.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all" title="Eliminar"><Trash2 size={16} /></button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* FORMULARIO INTEGRAL - RESTAURACIÓN 100% DATOS */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/90 flex items-center justify-center z-[5000] p-4 backdrop-blur-md overflow-hidden animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-200 relative">
            
            {/* Cabecera */}
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-slate-900 text-white rounded-[1.5rem] shadow-xl">
                  {editingActivity ? <Edit2 size={24} /> : <Plus size={24} />}
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight uppercase">
                    {editingActivity ? 'Editar Requisito' : 'Nuevo Requisito'}
                  </h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-1">Matriz de Cumplimiento Integral • Central de Maderas</p>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-900 transition-colors p-2 hover:bg-slate-100 rounded-full">
                <X size={28} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-8 overflow-y-auto scrollbar-thin bg-white flex-1">
              {errorMsg && <div className="bg-red-50 border border-red-200 p-4 rounded-2xl flex items-center text-red-800 text-xs font-black animate-pulse"><AlertTriangle size={18} className="mr-3 shrink-0" />{errorMsg}</div>}

              {/* Sección 1: Normas y Plantas (Igual a imagen 2) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-4">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Normas Relacionadas</label>
                  <div className="grid grid-cols-2 gap-2">
                    {standardsList.map((std) => {
                      const Icon = getStandardIcon(std.type);
                      const isS = formData.standards?.includes(std.type);
                      return (
                        <button key={std.id} type="button" onClick={() => handleToggleStandard(std.type)} 
                                className={`flex items-center p-3 rounded-2xl border-2 transition-all h-14 ${isS ? `bg-blue-50 border-blue-500 text-blue-900 shadow-sm` : 'bg-slate-50 border-slate-100 text-slate-400 hover:border-slate-200'}`}>
                          <div className={`p-1.5 rounded-lg mr-2 ${isS ? `bg-blue-200` : 'bg-white'}`}><Icon size={16} className={isS ? `text-blue-700` : 'text-slate-300'} /></div>
                          <span className="text-[9px] font-black uppercase tracking-tight text-left leading-tight">{std.type}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Plantas / Sedes de Aplicación</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {plants.map((plt) => { 
                      const isSelected = formData.plantIds?.map(id => id.toUpperCase()).includes(plt.id.toUpperCase());
                      return (
                        <button key={plt.id} type="button" onClick={() => handleTogglePlant(plt.id)} 
                                className={`flex items-center p-2.5 rounded-xl border-2 transition-all h-12 ${isSelected ? `bg-red-50 border-red-500 text-red-900` : 'bg-slate-50 border-slate-100 text-slate-400 hover:border-slate-200'}`}>
                          {isSelected ? <CheckSquare size={16} className="mr-2 text-red-600" /> : <Square size={16} className="mr-2 text-slate-300" />}
                          <span className="text-[9px] font-black uppercase tracking-tight truncate">{plt.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Sección 2: Datos del Requisito */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="col-span-1 space-y-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Numeral (Tarea)</label>
                  <div className="relative">
                    <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                    <input required type="text" value={formData.subClause} 
                           onChange={e => setFormData({...formData, subClause: e.target.value, clause: e.target.value.split('.').slice(0,2).join('.')})} 
                           className="w-full pl-11 pr-4 py-3.5 border-2 border-slate-100 rounded-2xl text-sm font-black bg-slate-50 focus:bg-white focus:border-blue-500 transition-all outline-none" 
                           placeholder="Ej: 4.1.1" />
                  </div>
                </div>
                <div className="col-span-3 space-y-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Área Responsable del Proceso</label>
                  <div className="relative">
                    <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                    <select value={formData.responsibleArea} onChange={e => setFormData({...formData, responsibleArea: e.target.value})} 
                            className="w-full pl-11 pr-10 py-3.5 border-2 border-slate-100 rounded-2xl text-sm font-black bg-slate-50 focus:bg-white focus:border-blue-500 transition-all appearance-none outline-none">
                      {currentAreaList.map(area => <option key={area} value={area}>{area.toUpperCase()}</option>)}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Título del Requisito / Cláusula</label>
                <div className="relative">
                  <BookOpen className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                  <input required type="text" value={formData.clauseTitle} onChange={e => setFormData({...formData, clauseTitle: e.target.value})} 
                         className="w-full pl-12 pr-4 py-4 border-2 border-slate-100 rounded-2xl text-sm font-black bg-slate-50 focus:bg-white focus:border-blue-500 transition-all outline-none" 
                         placeholder="Ej: Comprensión de la organización y su contexto" />
                </div>
              </div>

              {/* Sección 3: Bloques de Texto Restaurados (Imagen 1) */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 flex items-center">
                    <AlignLeft size={14} className="mr-2 text-slate-300" /> Descripción Oficial del Estándar
                  </label>
                  <textarea rows={4} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} 
                            className="w-full border-2 border-slate-100 rounded-3xl p-5 text-sm font-medium bg-slate-50 focus:bg-white focus:border-blue-500 transition-all outline-none resize-none shadow-inner italic" 
                            placeholder="Cargue aquí la descripción textual de la norma..." />
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] ml-1 flex items-center">
                    <Target size={14} className="mr-2 text-blue-300" /> Explicación y Contextualización
                  </label>
                  <textarea rows={4} value={formData.contextualization} onChange={e => setFormData({...formData, contextualization: e.target.value})} 
                            className="w-full border-2 border-slate-50 rounded-3xl p-5 text-sm font-bold bg-blue-50/20 focus:bg-white focus:border-blue-500 transition-all outline-none resize-none shadow-inner" 
                            placeholder="Defina cómo se interpreta este requisito para la organización..." />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-black text-orange-400 uppercase tracking-[0.2em] ml-1 flex items-center">
                  <ClipboardCheck size={14} className="mr-2 text-orange-300" /> Tarea Específica / Criterio de Auditoría
                </label>
                <textarea rows={3} value={formData.relatedQuestions} onChange={e => setFormData({...formData, relatedQuestions: e.target.value})} 
                          className="w-full border-2 border-slate-50 rounded-3xl p-5 text-sm font-black bg-orange-50/20 focus:bg-white focus:border-orange-500 transition-all outline-none resize-none shadow-inner" 
                          placeholder="Puntos específicos a verificar durante el seguimiento..." />
              </div>

              {/* Sección 4: Periodicidad (Igual a imagen 2 - Bloque Oscuro) */}
              <div className="bg-slate-900 p-8 rounded-[2.5rem] border-2 border-slate-800 shadow-xl relative overflow-hidden group">
                <div className="absolute right-[-2rem] top-[-2rem] p-10 bg-white/5 rounded-full blur-2xl group-hover:bg-white/10 transition-all"></div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4 relative z-10 flex items-center">
                   <Clock size={16} className="mr-2" /> Frecuencia de Ejecución
                </label>
                <div className="relative z-10">
                  <select value={selectedPeriodicity} onChange={e => setSelectedPeriodicity(e.target.value as Periodicity)} 
                          className="w-full bg-slate-800 border-2 border-slate-700 text-white rounded-2xl p-5 text-sm font-black focus:border-blue-500 outline-none appearance-none transition-all cursor-pointer">
                    {Object.values(Periodicity).map(p => <option key={p} value={p}>{p.toUpperCase()}</option>)}
                  </select>
                  <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={20} />
                </div>
              </div>

              {/* Acciones Finales */}
              <div className="flex gap-4 pt-6 pb-10">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-5 text-slate-400 font-black text-xs uppercase tracking-widest hover:bg-slate-50 rounded-[1.5rem] transition-all">
                  Cancelar Operación
                </button>
                <button type="submit" className="flex-[2] py-5 bg-slate-900 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl hover:bg-black transition-all flex items-center justify-center active:scale-95">
                  <Save size={20} className="mr-3" />
                  Guardar Requisito en Matriz
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Indicador de Carga Masiva */}
      {isImporting && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[7000] flex items-center justify-center">
          <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl text-center space-y-4">
            <div className="relative w-20 h-20 mx-auto">
              <div className="absolute inset-0 border-4 border-slate-100 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-slate-900 rounded-full border-t-transparent animate-spin"></div>
            </div>
            <p className="text-xs font-black text-slate-800 uppercase tracking-widest">Sincronizando Matriz...</p>
          </div>
        </div>
      )}

      {/* Reutilización del Asistente de Carga Masiva ya existente */}
      {isBulkModalOpen && (
        <div className="fixed inset-0 bg-slate-950/90 flex items-center justify-center z-[5500] p-4 md:p-8 backdrop-blur-sm overflow-hidden animate-in fade-in duration-300">
           <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-6xl max-h-full flex flex-col overflow-hidden border border-slate-200 relative">
             <div className="p-6 md:p-8 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center bg-slate-50 shrink-0 gap-6">
                <div className="flex items-center"><div className="p-3 bg-red-600 rounded-2xl mr-4 shadow-xl"><FileUp size={28} className="text-white" /></div><div><h3 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Asistente de Carga Masiva</h3><p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] mt-1">Sincronización Inteligente de Matriz</p></div></div>
                <button onClick={() => setIsBulkModalOpen(false)} className="text-slate-400 hover:text-slate-900 transition-colors p-2 hover:bg-slate-100 rounded-full"><X size={28} /></button>
             </div>
             <div className="flex-1 overflow-hidden flex flex-col">
               {importStep === 1 && (
                 <div className="flex-1 overflow-y-auto p-6 md:p-10 grid grid-cols-1 lg:grid-cols-3 gap-8 scrollbar-thin">
                    <div className="lg:col-span-1 space-y-6">
                       <div className="bg-[#f8fafc] p-6 rounded-3xl border border-slate-100 space-y-4">
                         <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center"><HelpCircle size={18} className="mr-2 text-blue-500" /> Preparación del Excel</h4>
                         <div className="space-y-3 text-[11px] text-slate-600 font-medium leading-relaxed">
                           <p>1. Asegúrese de que las primeras 7 columnas coincidan con el orden requerido.</p>
                           <p>2. El sistema detectará automáticamente el numeral dentro de la tarea.</p>
                           <p>3. Use <strong>X</strong> o <strong>1</strong> para asignar plantas.</p>
                         </div>
                         <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                           <h5 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Orden de Columnas Requerido:</h5>
                           <div className="grid grid-cols-2 gap-2 text-[8px] font-black text-slate-500 uppercase tracking-tighter">
                             {['1. Norma', '2. Título', '3. Descripción', '4. Explicación', '5. Tarea (Numeral)', '6. Periodicidad', '7. Área', 'MQS', 'CTG', 'YAL', 'DIL', 'CAL', 'ECO', 'SOC'].map(col => <span key={col} className="bg-slate-50 p-1.5 rounded border border-slate-100 truncate">{col}</span>)}
                           </div>
                         </div>
                       </div>
                    </div>
                    <div className="lg:col-span-2 flex flex-col space-y-4">
                       <div className="flex-1 flex flex-col bg-[#f1f5f9] rounded-3xl p-6 border border-slate-200 min-h-[300px]">
                         <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center"><Copy size={16} className="mr-2" /> Pegue los datos aquí</label>
                         <textarea value={bulkInput} onChange={e => setBulkInput(e.target.value)} placeholder="Pegue aquí las celdas copiadas de su archivo Excel..." className="flex-1 w-full bg-white border border-slate-200 rounded-2xl p-6 text-xs font-medium focus:border-red-600 transition-all outline-none shadow-inner scrollbar-thin resize-none" />
                       </div>
                       <div className="flex justify-end pt-2">
                         <button onClick={() => processRawMatrix(bulkInput.split('\n').filter(r => r.trim()).map(row => row.split('\t')))} disabled={!bulkInput.trim()} className="bg-slate-900 text-white px-10 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-black transition-all">Siguiente: Validar Registros</button>
                       </div>
                    </div>
                 </div>
               )}
               {importStep === 2 && (
                 <div className="flex-1 flex flex-col overflow-hidden bg-white">
                    <div className="p-4 bg-blue-50/50 border-b border-blue-100 flex justify-between items-center shrink-0">
                       <span className="text-xs font-black text-slate-800 uppercase tracking-tight">Previsualización de {pendingImports.length} registros</span>
                       <button onClick={finalizeImport} className="px-10 py-3 bg-red-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-red-700 transition-all">Procesar Importación</button>
                    </div>
                    <div className="flex-1 overflow-auto scrollbar-thin p-4">
                       <table className="w-full text-left border-collapse min-w-[1500px]">
                          <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-200">
                             <tr><th className="p-4">Numeral</th><th className="p-4">Título</th><th className="p-4">Descripción</th><th className="p-4">Explicación</th><th className="p-4">Área</th><th className="p-4">Plantas</th></tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {pendingImports.map((p, idx) => (
                              <tr key={idx} className="text-xs">
                                <td className="p-4 font-black">{p.data.subClause}</td>
                                <td className="p-4 font-bold">{p.data.clauseTitle}</td>
                                <td className="p-4 line-clamp-1">{p.data.description}</td>
                                <td className="p-4 line-clamp-1">{p.data.contextualization}</td>
                                <td className="p-4 uppercase">{p.data.responsibleArea}</td>
                                <td className="p-4">{p.data.plantIds.length} Sedes</td>
                              </tr>
                            ))}
                          </tbody>
                       </table>
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
