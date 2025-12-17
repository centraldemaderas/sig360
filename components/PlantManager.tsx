
import React, { useState } from 'react';
import { Plant } from '../types';
import { Factory, Plus, Edit2, Trash2, X, MapPin, Building2, Save } from 'lucide-react';

interface PlantManagerProps {
  plants: Plant[];
  onAdd: (plant: Plant) => void;
  onUpdate: (plant: Plant) => void;
  onDelete: (id: string) => void;
}

export const PlantManager: React.FC<PlantManagerProps> = ({ plants, onAdd, onUpdate, onDelete }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlant, setEditingPlant] = useState<Plant | null>(null);
  const [formData, setFormData] = useState<Partial<Plant>>({
    name: '',
    location: '',
    isMain: false,
    description: ''
  });

  const handleOpenModal = (plant?: Plant) => {
    if (plant) {
      setEditingPlant(plant);
      setFormData(plant);
    } else {
      setEditingPlant(null);
      setFormData({ name: '', location: '', isMain: false, description: '' });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const plantData: Plant = {
      id: editingPlant ? editingPlant.id : `PLT-${Date.now()}`,
      name: formData.name || '',
      location: formData.location || '',
      isMain: formData.isMain || false,
      description: formData.description || ''
    };

    if (editingPlant) onUpdate(plantData);
    else onAdd(plantData);
    
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Gestión de Plantas y Centros de Costos</h2>
          <p className="text-slate-500 font-medium">Administre las ubicaciones operativas de la organización.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-slate-900 hover:bg-black text-white px-6 py-2.5 rounded-xl flex items-center shadow-lg text-xs font-black uppercase tracking-widest transition-all active:scale-95"
        >
          <Plus size={18} className="mr-2" />
          Nueva Planta
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plants.map((plant) => (
          <div key={plant.id} className={`bg-white rounded-2xl shadow-sm border-2 p-6 transition-all hover:shadow-md ${plant.isMain ? 'border-red-100 bg-red-50/10' : 'border-slate-100'}`}>
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-2xl ${plant.isMain ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                <Factory size={24} />
              </div>
              <div className="flex space-x-1">
                <button onClick={() => handleOpenModal(plant)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"><Edit2 size={16} /></button>
                <button onClick={() => onDelete(plant.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"><Trash2 size={16} /></button>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-slate-800 tracking-tight">{plant.name}</h3>
                {plant.isMain && <span className="text-[8px] font-black bg-red-100 text-red-600 px-2 py-0.5 rounded border border-red-200 uppercase tracking-widest">Matriz</span>}
              </div>
              <p className="text-xs text-slate-500 flex items-center font-bold">
                <MapPin size={12} className="mr-1 text-slate-400" />
                {plant.location}
              </p>
              <p className="text-xs text-slate-600 leading-relaxed font-medium mt-3">
                {plant.description || 'Sin descripción detallada.'}
              </p>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[5000] p-4 backdrop-blur-md">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg animate-in fade-in zoom-in duration-300 border border-slate-200">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">{editingPlant ? 'Editar Planta' : 'Nueva Planta'}</h3>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] mt-1">Configuración de Sede Operativa</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-900 transition-colors p-2 hover:bg-slate-100 rounded-full"><X size={28} /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Nombre de la Planta / Centro de Costo</label>
                <div className="relative">
                  <Building2 size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    required 
                    type="text" 
                    value={formData.name} 
                    onChange={e => setFormData({...formData, name: e.target.value})} 
                    className="w-full pl-10 pr-4 py-3.5 border-2 border-slate-100 rounded-2xl text-sm focus:border-blue-500 font-black bg-slate-50" 
                    placeholder="Ej: Cartagena" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Ubicación Geográfica</label>
                <div className="relative">
                  <MapPin size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    required 
                    type="text" 
                    value={formData.location} 
                    onChange={e => setFormData({...formData, location: e.target.value})} 
                    className="w-full pl-10 pr-4 py-3.5 border-2 border-slate-100 rounded-2xl text-sm focus:border-blue-500 font-black bg-slate-50" 
                    placeholder="Ej: Zona Industrial Mamonal" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Descripción / Uso</label>
                <textarea 
                  rows={3} 
                  value={formData.description} 
                  onChange={e => setFormData({...formData, description: e.target.value})} 
                  className="w-full border-2 border-slate-100 rounded-2xl p-4 text-sm font-medium bg-slate-50 outline-none focus:border-blue-500 transition-all" 
                  placeholder="Detalles sobre el tipo de operación..." 
                />
              </div>

              <div className="flex items-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <input 
                  id="isMain"
                  type="checkbox" 
                  checked={formData.isMain} 
                  onChange={e => setFormData({...formData, isMain: e.target.checked})} 
                  className="w-5 h-5 rounded border-slate-300 text-red-600 focus:ring-red-500"
                />
                <label htmlFor="isMain" className="ml-3 text-xs font-black text-slate-700 uppercase tracking-tight">Marcar como Sede Matriz Principal</label>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3 text-slate-400 font-black text-xs uppercase tracking-widest hover:bg-slate-50 rounded-xl transition-all">Cancelar</button>
                <button type="submit" className="px-10 py-3 bg-slate-900 text-white rounded-xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-black transition-all flex items-center">
                  <Save size={16} className="mr-2" />
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
