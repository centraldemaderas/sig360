
import React, { useState } from 'react';
import { StandardDefinition, StandardType, User, UserRole } from '../types';
import { Book, Shield, TreePine, Save, MessageSquare, Plus, Clock, X, Briefcase } from 'lucide-react';
import { dataService } from '../services/dataService';

interface StandardManagerProps {
  standards: StandardDefinition[];
  onUpdateStandard: (std: StandardDefinition) => void;
  currentUser: User;
}

export const StandardManager: React.FC<StandardManagerProps> = ({ standards, onUpdateStandard, currentUser }) => {
  const [selectedStandard, setSelectedStandard] = useState<string>(StandardType.ISO9001);
  const [newComment, setNewComment] = useState('');
  const [isNewStandardModalOpen, setIsNewStandardModalOpen] = useState(false);
  const [newStandardForm, setNewStandardForm] = useState({
    type: '',
    description: '',
    objective: '',
    certifyingBody: ''
  });

  // Combine fixed enums with custom ones from DB
  const standardTypes = Array.from(new Set([
    ...Object.values(StandardType),
    ...standards.map(s => s.type)
  ]));

  const currentDef = standards.find(s => s.type === selectedStandard) || {
    id: `std-${Date.now()}`,
    type: selectedStandard,
    description: '',
    objective: '',
    certifyingBody: '',
    comments: []
  };

  const [formData, setFormData] = useState<StandardDefinition>(currentDef);

  React.useEffect(() => {
    const found = standards.find(s => s.type === selectedStandard);
    if (found) {
      setFormData(found);
    } else {
      setFormData({
        id: `std-${selectedStandard.replace(/\s/g, '').toLowerCase()}`,
        type: selectedStandard,
        description: '',
        objective: '',
        certifyingBody: '',
        comments: []
      });
    }
  }, [selectedStandard, standards]);

  const handleSaveInfo = () => {
    onUpdateStandard(formData);
    alert('Información de la norma actualizada.');
  };

  const handleAddComment = () => {
    if (!newComment.trim()) return;

    const comment = {
      id: `cmt-${Date.now()}`,
      text: newComment,
      author: currentUser.name,
      date: new Date().toLocaleString()
    };

    const updated = {
      ...formData,
      comments: [comment, ...formData.comments]
    };

    onUpdateStandard(updated);
    setNewComment('');
  };

  const handleAddNewStandard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStandardForm.type.trim()) return;

    const newStd: StandardDefinition = {
      id: `std-${Date.now()}`,
      type: newStandardForm.type,
      description: newStandardForm.description,
      objective: newStandardForm.objective,
      certifyingBody: newStandardForm.certifyingBody,
      comments: []
    };

    await dataService.addStandard(newStd);
    setSelectedStandard(newStd.type);
    setIsNewStandardModalOpen(false);
    setNewStandardForm({ type: '', description: '', objective: '', certifyingBody: '' });
  };

  const getIcon = (type: string) => {
    if (type === StandardType.ISO9001) return <Book className="mr-2" size={20} />;
    if (type === StandardType.SGSST) return <Shield className="mr-2" size={20} />;
    if (type === StandardType.FSC) return <TreePine className="mr-2" size={20} />;
    return <Briefcase className="mr-2" size={20} />;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Gestión de Normas</h2>
          <p className="text-slate-500">Administre la definición, alcance y seguimiento de cada estándar.</p>
        </div>
        {currentUser.role === UserRole.ADMIN && (
          <button 
            onClick={() => setIsNewStandardModalOpen(true)}
            className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-lg flex items-center shadow-sm transition-colors text-sm font-bold"
          >
            <Plus size={18} className="mr-2" />
            Añadir Norma
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-slate-200 overflow-x-auto scrollbar-thin">
        {standardTypes.map(std => (
          <button
            key={std}
            onClick={() => setSelectedStandard(std)}
            className={`px-4 py-3 text-sm font-bold flex items-center transition-all border-b-2 whitespace-nowrap ${
              selectedStandard === std 
                ? 'border-blue-600 text-blue-700 bg-blue-50/50' 
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}
          >
            {getIcon(std)}
            {std}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Info Column */}
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
              Información General
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Descripción de la Norma</label>
                <textarea 
                  rows={4}
                  className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  placeholder="Describa el alcance de la norma..."
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Objetivo General</label>
                <textarea 
                  rows={3}
                  className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.objective}
                  onChange={e => setFormData({...formData, objective: e.target.value})}
                  placeholder="¿Cuál es la meta principal?"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Ente Certificador / Auditor</label>
                <input 
                  type="text"
                  className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.certifyingBody}
                  onChange={e => setFormData({...formData, certifyingBody: e.target.value})}
                  placeholder="Ej. ICONTEC, SGS, Bureau Veritas..."
                />
              </div>

              <div className="pt-2">
                <button 
                  onClick={handleSaveInfo}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center hover:bg-blue-700 transition-colors shadow-sm"
                >
                  <Save size={16} className="mr-2" />
                  Guardar Información
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Comments / Log Column */}
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-full flex flex-col">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
              <MessageSquare className="mr-2 text-slate-500" size={20} />
              Bitácora de Avance
            </h3>

            <div className="flex-1 overflow-y-auto max-h-[400px] space-y-4 mb-4 pr-2 scrollbar-thin">
              {formData.comments.length > 0 ? (
                formData.comments.map(comment => (
                  <div key={comment.id} className="bg-slate-50 p-3 rounded-lg border border-slate-100 shadow-sm hover:border-slate-200 transition-colors">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-bold text-sm text-slate-700">{comment.author}</span>
                      <span className="text-xs text-slate-400 flex items-center">
                        <Clock size={10} className="mr-1" />
                        {comment.date}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed">{comment.text}</p>
                  </div>
                ))
              ) : (
                <div className="text-center text-slate-400 py-10 italic">
                  No hay comentarios registrados para esta norma.
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-100">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Nuevo Comentario</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                  className="flex-1 border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Escriba un reporte de avance..."
                  onKeyDown={e => e.key === 'Enter' && handleAddComment()}
                />
                <button 
                  onClick={handleAddComment}
                  className="bg-slate-800 text-white p-2 rounded-lg hover:bg-slate-900 transition-colors shadow-md"
                >
                  <Plus size={20} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* NEW STANDARD MODAL */}
      {isNewStandardModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[80] p-4 backdrop-blur-sm">
           <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                 <h3 className="text-xl font-bold text-slate-800 flex items-center">
                   <Plus className="mr-2 text-blue-600" /> Añadir Nueva Norma
                 </h3>
                 <button onClick={() => setIsNewStandardModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
              </div>
              <form onSubmit={handleAddNewStandard} className="p-6 space-y-4">
                 <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Nombre / Identificador de la Norma</label>
                    <input 
                      required
                      type="text" 
                      value={newStandardForm.type}
                      onChange={e => setNewStandardForm({...newStandardForm, type: e.target.value})}
                      className="w-full border border-slate-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="Ej: ISO 14001:2015"
                    />
                 </div>
                 <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Ente Certificador</label>
                    <input 
                      type="text" 
                      value={newStandardForm.certifyingBody}
                      onChange={e => setNewStandardForm({...newStandardForm, certifyingBody: e.target.value})}
                      className="w-full border border-slate-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="Ej: ICONTEC"
                    />
                 </div>
                 <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Descripción</label>
                    <textarea 
                      rows={3}
                      value={newStandardForm.description}
                      onChange={e => setNewStandardForm({...newStandardForm, description: e.target.value})}
                      className="w-full border border-slate-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="Describa brevemente el alcance..."
                    />
                 </div>
                 <div className="flex gap-3 pt-4 border-t border-slate-100 mt-2">
                    <button type="button" onClick={() => setIsNewStandardModalOpen(false)} className="flex-1 py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-xl">Cancelar</button>
                    <button type="submit" className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-500/20 transition-all">Crear Norma</button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};
