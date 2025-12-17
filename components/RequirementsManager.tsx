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
    standards: [StandardType.ISO9001], // Default
    compliance2024: false,
    compliance2025: false
  });

  const handleOpenModal = (activity?: Activity) => {
    setErrorMsg(null);
    if (activity) {
      setEditingActivity(activity);
      setFormData(activity);
      setSelectedPeriodicity(Periodicity.MONTHLY); // Default/Reset
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

  const toggleStandard = (std: StandardType) => {
    const currentStandards = formData.standards || [];
    if (currentStandards.includes(std)) {
      setFormData({
        ...formData,
        standards: currentStandards.filter(s => s !== std)
      });
    } else {
      setFormData({
        ...formData,
        standards: [...currentStandards, std]
      });
    }
  };

  const generateMonthlyPlan = (periodicity: Periodicity): MonthlyExecution[] => {
    return Array.from({ length: 12 }, (_, i) => {
      let isPlanned = false;
      switch (periodicity) {
        case Periodicity.MONTHLY:
          isPlanned = true;
          break;
        case Periodicity.BIMONTHLY:
          isPlanned = i % 2 === 0; // Jan, Mar, May...
          break;
        case Periodicity.QUARTERLY:
          isPlanned = (i + 1) % 3 === 0; // Mar, Jun, Sep, Dec
          break;
        case Periodicity.SEMIANNUAL:
          isPlanned = i === 5 || i === 11; // Jun, Dec
          break;
        case Periodicity.ANNUAL:
          isPlanned = i === 11; // Dec
          break;
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

    // Basic Validation
    if (!formData.standards || formData.standards.length === 0) {
      setErrorMsg("Debe seleccionar al menos un Sistema de Gestión.");
      return;
    }

    // Duplicate Check
    if (!editingActivity) {
      const isDuplicate = activities.some(
        a => a.clause === formData.clause && 
             a.subClause === formData.subClause &&
             a.clauseTitle === formData.clauseTitle && 
             a.responsibleArea === formData.responsibleArea
      );
      if (isDuplicate) {
        setErrorMsg("Ya existe un requisito con esta Cláusula, Sub-numeral y Título para esta área.");
        return;
      }
    }
    
    const monthlyPlan = editingActivity 
      ? editingActivity.monthlyPlan 
      : generateMonthlyPlan(selectedPeriodicity);

    const finalPlan = (!editingActivity) ? monthlyPlan : formData.monthlyPlan || monthlyPlan;

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
      monthlyPlan: finalPlan,
      evidence: formData.evidence
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
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Gestión de Requisitos</h2>
          <p className="text-slate-500">Configure las actividades, responsables y periodicidad de control.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center shadow-sm transition-colors"
        >
          <Plus size={20} className="mr-2" />
          Nuevo Requisito
        </button>
      </div>

      {/* Search & List */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Buscar por cláusula, sub-numeral, descripción o área..." 
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
                <th className="p-4 w-28 text-center">Cláusula / Sub</th>
                <th className="p-4">Detalle del Requisito</th>
                <th className="p-4 w-40">Área Responsable</th>
                <th className="p-4 w-48">Sistemas Asociados</th>
                <th className="p-4 w-32 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredActivities.map((activity) => (
                <tr key={activity.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4 text-center font-medium text-slate-700">
                    <div className="text-sm">{activity.clause}</div>
                    {activity.subClause && <div className="text-xs text-slate-500 mt-1 bg-slate-100 px-1 py-0.5 rounded inline-block">{activity.subClause}</div>}
                  </td>
                  <td className="p-4">
                    <div className="font-medium text-slate-800">{activity.clauseTitle}</div>
                    <div className="text-slate-500 text-xs mt-1 italic">
                      {activity.contextualization.substring(0, 100)}...
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="inline-block px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs font-medium">
                      {activity.responsibleArea}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-wrap gap-1">
                      {activity.standards.map((std, idx) => (
                        <span key={idx} className="px-1.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 rounded text-[10px]">
                          {std.split(' ')[0]} {/* Takes just 'ISO', 'SG-SST' etc */}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex justify-center space-x-2">
                      <button 
                        onClick={() => handleOpenModal(activity)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title="Editar"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => onDelete(activity.id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredActivities.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">
                    No se encontraron requisitos.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[95vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center sticky top-0 bg-white z-10">
              <h3 className="text-xl font-bold text-slate-800">
                {editingActivity ? 'Editar Requisito' : 'Nuevo Requisito'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              
              {errorMsg && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg flex items-center text-sm">
                  <AlertTriangle size={18} className="mr-2 flex-shrink-0" />
                  {errorMsg}
                </div>
              )}

              {/* Systems Selection */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">Sistema(s) de Gestión Asociado(s)</label>
                <div className="flex flex-wrap gap-3">
                  {Object.values(StandardType).map((std) => (
                    <label key={std} className={`
                      flex items-center space-x-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors
                      ${formData.standards?.includes(std) 
                        ? 'bg-blue-50 border-blue-300 text-blue-800' 
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}
                    `}>
                      <input 
                        type="checkbox" 
                        className="hidden"
                        checked={formData.standards?.includes(std)}
                        onChange={() => toggleStandard(std)}
                      />
                      <CheckSquare size={16} className={formData.standards?.includes(std) ? 'text-blue-600' : 'text-slate-300'} />
                      <span className="text-sm font-medium">{std}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Cláusula</label>
                  <input 
                    type="text" 
                    required
                    value={formData.clause}
                    onChange={e => setFormData({...formData, clause: e.target.value})}
                    className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Ej. 4.1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Sub-numeral</label>
                  <input 
                    type="text" 
                    required
                    value={formData.subClause}
                    onChange={e => setFormData({...formData, subClause: e.target.value})}
                    className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Ej. 4.1.1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Área Responsable</label>
                  <select 
                    value={formData.responsibleArea}
                    onChange={e => setFormData({...formData, responsibleArea: e.target.value})}
                    className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    {AREAS.map(area => <option key={area} value={area}>{area}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Título del Requisito</label>
                <input 
                  type="text" 
                  required
                  value={formData.clauseTitle}
                  onChange={e => setFormData({...formData, clauseTitle: e.target.value})}
                  className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Ej. Comprensión de la organización"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Descripción del Requisito (Norma)</label>
                  <textarea 
                    required
                    rows={4}
                    value={formData.description}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                    className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                    placeholder="Texto oficial de la norma..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Explicación dentro de Central de Maderas</label>
                  <textarea 
                    required
                    rows={4}
                    value={formData.contextualization}
                    onChange={e => setFormData({...formData, contextualization: e.target.value})}
                    className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-slate-50"
                    placeholder="Contexto específico de la empresa..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tarea / Criterio de Auditoría</label>
                <textarea 
                  rows={2}
                  value={formData.relatedQuestions}
                  onChange={e => setFormData({...formData, relatedQuestions: e.target.value})}
                  className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  placeholder="¿Qué actividad específica o tarea se debe verificar?"
                />
              </div>

              {/* Logic for Periodicity */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                <div className="flex items-center mb-2">
                  <Calendar size={18} className="text-blue-600 mr-2" />
                  <span className="font-semibold text-blue-800 text-sm">Planificación</span>
                </div>
                
                {!editingActivity ? (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Periodicidad de Control</label>
                    <select 
                      value={selectedPeriodicity}
                      onChange={e => setSelectedPeriodicity(e.target.value as Periodicity)}
                      className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      {Object.values(Periodicity).map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                    <p className="text-xs text-slate-500 mt-1">
                      Esto generará automáticamente el calendario de cumplimiento.
                    </p>
                  </div>
                ) : (
                  <div className="text-sm text-slate-600">
                    <p>La planificación mensual ya está establecida. Para reprogramar, edite directamente en la vista de calendario (Próximamente).</p>
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-4">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={formData.compliance2024}
                    onChange={e => setFormData({...formData, compliance2024: e.target.checked})}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-slate-700">Cumplimiento Histórico (2024)</span>
                </label>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm transition-colors flex items-center"
                >
                  <Save size={18} className="mr-2" />
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};