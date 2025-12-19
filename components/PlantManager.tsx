
import React, { useState } from 'react';
import { Plant } from '../types';
import { 
  Factory, Plus, Edit2, Trash2, X, MapPin, Building2, 
  Save, MapPinned, Info, ArrowRight, Home
} from 'lucide-react';

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

  const handleDelete = (e: React.MouseEvent, id: string, name: string) => {
    e.preventDefault();
    e.stopPropagation(); // CRITICO: Evita que el click active la tarjeta completa
    if (window.confirm(`¿Está seguro que desea eliminar la planta "${name.toUpperCase()}"?`)) {
      onDelete(id);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) return;

    const plantData: Plant = {
      id: editingPlant ? editingPlant.id : `PLT-${Date.now()}`,
      name: formData.name.trim(),
      location: formData.location || '',
      isMain: formData.isMain || false,
      description: formData.description || ''
    };

    if (editingPlant) onUpdate(plantData);
    else onAdd(plantData);
    
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
      <div className="flex items-center justify-between bg-white px-8 py-5 rounded-[2.5rem] shadow-sm border border-slate-200">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-red-600 text-white rounded-2xl shadow-xl shadow-red-100">
            <Factory size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight uppercase">Plantas y Sedes</h2>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">{plants.length} Ubicaciones</p>
            </div>
          </div>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-slate-900 hover:bg-black text-white px-8 py-4 rounded-2xl flex items-center shadow-lg text-xs font-black uppercase tracking-widest transition-all active:scale-95"
        >
          <Plus size={18} className="mr-2" />
          Nueva Planta
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plants.map((plant) => (
          <div 
            key={plant.id} 
            className={`bg-white rounded-[2.5rem] border-2 flex flex-col hover:shadow-2xl transition-all duration-300 relative overflow-hidden h-fit ${
              plant.isMain ? 'border-red-100' : 'border-slate-100'
            }`}
          >
            <div className="absolute top-6 right-6 flex gap-2 z-30">
              <button 
                onClick={() => handleOpenModal(plant)}
                className="p-2.5 bg-white/80 backdrop-blur-sm text-slate-400 hover:text-blue-600 rounded-xl transition-all border border-slate-100 shadow-sm"
              >
                <Edit2 size={16} />
              </button>
              <button 
                onClick={(e) => handleDelete(e, plant.id, plant.name)} 
                className="p-2.5 bg-white/80 backdrop-blur-sm text-slate-400 hover:text-red-600 rounded-xl transition-all border border-slate-100 shadow-sm"
              >
                <Trash2 size={16} />
              </button>
            </div>

            <div className="p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                  plant.isMain ? 'bg-red-600 text-white shadow-lg' : 'bg-slate-50 text-slate-400'
                }`}>
                  {plant.isMain ? <Home size={24} /> : <MapPinned size={24} />}
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 uppercase tracking-tight pr-16 truncate">
                    {plant.name}
                  </h3>
                  {plant.isMain && (
                    <span className="text-[8px] font-black text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-100 uppercase tracking-widest mt-1 inline-block">Sede Matriz</span>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <MapPin size={16} className="text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Localización</p>
                    <p className="text-xs font-bold text-slate-700">{plant.location}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Info size={16} className="text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Descripción</p>
                    <p className="text-xs text-slate-500 font-medium italic line-clamp-2">
                      {plant.description || 'Sin descripción.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <button 
              onClick={() => handleOpenModal(plant)}
              className="w-full py-4 bg-slate-50 hover:bg-slate-900 text-slate-400 hover:text-white text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 border-t border-slate-100"
            >
              Configurar Planta
              <ArrowRight size={14} />
            </button>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 flex items-center justify-center z-[6000] p-4 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-lg animate-in zoom-in-95 duration-300 border border-slate-200 overflow-hidden">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-slate-900 text-white rounded-3xl shadow-xl">
                  {editingPlant ? <Edit2 size={24} /> : <Plus size={24} />}
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase">
                    {editingPlant ? 'Editar Planta' : 'Nueva Planta'}
                  </h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Infraestructura Corporativa</p>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-900 transition-colors p-2 hover:bg-slate-100 rounded-full">
                <X size={32} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Nombre de la Sede</label>
                <div className="relative">
                  <Building2 size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    required 
                    type="text" 
                    value={formData.name} 
                    onChange={e => setFormData({...formData, name: e.target.value})} 
                    className="w-full pl-12 pr-6 py-4 border-2 border-slate-100 rounded-2xl text-sm font-black bg-slate-50 focus:bg-white focus:border-red-600 transition-all outline-none" 
                    placeholder="Ej: PLANTA MOSQUERA" 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Ubicación</label>
                <div className="relative">
                  <MapPin size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    required 
                    type="text" 
                    value={formData.location} 
                    onChange={e => setFormData({...formData, location: e.target.value})} 
                    className="w-full pl-12 pr-6 py-4 border-2 border-slate-100 rounded-2xl text-sm font-black bg-slate-50 focus:bg-white focus:border-red-600 transition-all outline-none" 
                    placeholder="Ej: Cundinamarca, Colombia" 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Descripción</label>
                <textarea 
                  rows={3} 
                  value={formData.description} 
                  onChange={e => setFormData({...formData, description: e.target.value})} 
                  className="w-full border-2 border-slate-100 rounded-2xl p-5 text-sm font-medium bg-slate-50 focus:bg-white focus:border-red-600 transition-all outline-none resize-none" 
                  placeholder="Detalles sobre el proceso..." 
                />
              </div>

              <div className="flex items-center bg-red-50/50 p-5 rounded-3xl border border-red-100">
                <input 
                  id="isMain"
                  type="checkbox" 
                  checked={formData.isMain} 
                  onChange={e => setFormData({...formData, isMain: e.target.checked})} 
                  className="w-6 h-6 rounded-lg border-red-200 text-red-600 focus:ring-red-500"
                />
                <label htmlFor="isMain" className="ml-4 text-[11px] font-black text-red-900 uppercase tracking-tight">
                  Establecer como Sede Matriz Principal
                </label>
              </div>

              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-5 text-slate-400 font-black text-xs uppercase tracking-widest">Cancelar</button>
                <button type="submit" className="flex-[2] py-5 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-black transition-all">
                  <Save size={20} className="mr-3" /> GUARDAR
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
