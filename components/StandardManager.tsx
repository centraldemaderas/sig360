
import React, { useState } from 'react';
import { StandardDefinition, StandardType, User } from '../types';
import { Book, Shield, TreePine, Save, MessageSquare, Plus, Clock } from 'lucide-react';

interface StandardManagerProps {
  standards: StandardDefinition[];
  onUpdateStandard: (std: StandardDefinition) => void;
  currentUser: User;
}

export const StandardManager: React.FC<StandardManagerProps> = ({ standards, onUpdateStandard, currentUser }) => {
  const [selectedStandard, setSelectedStandard] = useState<StandardType>(StandardType.ISO9001);
  const [newComment, setNewComment] = useState('');

  // Encuentra la definición actual o crea una dummy si no existe
  const currentDef = standards.find(s => s.type === selectedStandard) || {
    id: `std-${Date.now()}`,
    type: selectedStandard,
    description: '',
    objective: '',
    certifyingBody: '',
    comments: []
  };

  const [formData, setFormData] = useState<StandardDefinition>(currentDef);

  // Sync internal form state when selection changes
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

  const getIcon = (type: StandardType) => {
    if (type === StandardType.ISO9001) return <Book className="mr-2" size={20} />;
    if (type === StandardType.SGSST) return <Shield className="mr-2" size={20} />;
    return <TreePine className="mr-2" size={20} />;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Gestión de Normas</h2>
        <p className="text-slate-500">Administre la definición, alcance y seguimiento de cada estándar.</p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-slate-200">
        {Object.values(StandardType).map(std => (
          <button
            key={std}
            onClick={() => setSelectedStandard(std)}
            className={`px-4 py-3 text-sm font-medium flex items-center transition-all border-b-2 ${
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
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center hover:bg-blue-700 transition-colors"
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
                  <div key={comment.id} className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-bold text-sm text-slate-700">{comment.author}</span>
                      <span className="text-xs text-slate-400 flex items-center">
                        <Clock size={10} className="mr-1" />
                        {comment.date}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600">{comment.text}</p>
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
                  className="bg-slate-800 text-white p-2 rounded-lg hover:bg-slate-900 transition-colors"
                >
                  <Plus size={20} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
