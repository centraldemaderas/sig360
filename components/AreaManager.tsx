
import React, { useState } from 'react';
import { Area, User } from '../types';
import { Users, Plus, Trash2, Edit2, X, Briefcase, Save, UserCircle, AlertCircle, ExternalLink } from 'lucide-react';

interface AreaManagerProps {
  areas: Area[];
  users: User[];
  onAdd: (area: Area) => void;
  onUpdate: (area: Area) => void;
  onDelete: (id: string) => void;
}

export const AreaManager: React.FC<AreaManagerProps> = ({ areas, users, onAdd, onUpdate, onDelete }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingArea, setEditingArea] = useState<Area | null>(null);
  const [formData, setFormData] = useState<Partial<Area>>({
    name: '',
    description: ''
  });

  const handleOpenModal = (area?: Area) => {
    if (area) {
      setEditingArea(area);
      setFormData({ name: area.name, description: area.description });
    } else {
      setEditingArea(null);
      setFormData({ name: '', description: '' });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) return;

    if (editingArea) {
      onUpdate({
        ...editingArea,
        name: formData.name.trim(),
        description: formData.description?.trim() || ''
      });
    } else {
      const areaData: Area = {
        id: `area-${Date.now()}`,
        name: formData.name.trim(),
        description: formData.description?.trim() || ''
      };
      onAdd(areaData);
    }

    setFormData({ name: '', description: '' });
    setIsModalOpen(false);
  };

  const getUsersInArea = (areaName: string) => {
    return users.filter(u => u.assignedArea === areaName);
  };

  const handleForceDelete = (e: React.MouseEvent, id: string, name: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm(`¿Desea eliminar definitivamente el área "${name.toUpperCase()}"?`)) {
      onDelete(id);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
      {/* Header Compacto Pro */}
      <div className="flex items-center justify-between bg-white px-8 py-5 rounded-[2rem] shadow-sm border border-slate-200">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-slate-900 text-white rounded-2xl shadow-xl">
            <Briefcase size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight uppercase">Dependencias</h2>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">{areas.length} Áreas Configuradas</p>
            </div>
          </div>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl flex items-center shadow-lg shadow-blue-100 text-xs font-black uppercase tracking-widest transition-all active:scale-95 group"
        >
          <Plus size={18} className="mr-2 group-hover:rotate-90 transition-transform" />
          Nueva Dependencia
        </button>
      </div>

      {/* Grid de Tarjetas Optimizadas */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {areas.map((area) => {
          const areaUsers = getUsersInArea(area.name);
          return (
            <div 
              key={area.id} 
              className="bg-white rounded-[2rem] border-2 border-slate-100 flex flex-col hover:border-blue-500 hover:shadow-2xl transition-all duration-300 group relative overflow-hidden h-fit"
            >
              {/* Acciones Superiores - Siempre Visibles */}
              <div className="absolute top-4 right-4 flex gap-2 z-30">
                <button 
                  onClick={() => handleOpenModal(area)}
                  className="p-2.5 bg-slate-50 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all border border-slate-100 hover:border-blue-200 shadow-sm"
                  title="Editar"
                >
                  <Edit2 size={16} />
                </button>
                <button 
                  onClick={(e) => handleForceDelete(e, area.id, area.name)} 
                  className="p-2.5 bg-slate-50 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all border border-slate-100 hover:border-red-200 shadow-sm"
                  title="Eliminar"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <div className="p-6 pb-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <Briefcase size={20} />
                  </div>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight pr-20 truncate">
                    {area.name}
                  </h3>
                </div>

                <p className="text-[11px] text-slate-500 font-medium leading-relaxed italic line-clamp-2 h-[2.5rem] mb-4">
                  {area.description || 'Sin descripción de responsabilidades cargada.'}
                </p>

                <div className="pt-4 border-t border-slate-50">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Users size={14} className="text-slate-400" />
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Equipo Responsable</span>
                    </div>
                    <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">{areaUsers.length}</span>
                  </div>

                  {/* Listado de integrantes con nombres visibles */}
                  <div className="flex flex-wrap gap-2 max-h-[80px] overflow-y-auto scrollbar-thin">
                    {areaUsers.length > 0 ? (
                      areaUsers.map(user => (
                        <div key={user.id} className="flex items-center bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100 group/user hover:border-blue-200 transition-all">
                          <UserCircle size={14} className="text-slate-300 mr-2 group-hover/user:text-blue-500" />
                          <span className="text-[10px] font-bold text-slate-600 group-hover/user:text-slate-900">{user.name}</span>
                        </div>
                      ))
                    ) : (
                      <div className="flex items-center text-[10px] text-slate-400 font-bold italic p-3 bg-slate-50/50 w-full justify-center rounded-xl border border-dashed border-slate-200">
                        <AlertCircle size={12} className="mr-2" />
                        Sin personal asignado
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Botón Detalles Funcional */}
              <button 
                onClick={() => handleOpenModal(area)}
                className="w-full py-4 bg-slate-50 hover:bg-blue-600 text-slate-400 hover:text-white text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 border-t border-slate-100"
              >
                <ExternalLink size={14} />
                Ver Detalles Completos
              </button>
            </div>
          );
        })}
      </div>

      {/* Modal Rediseñado */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/80 flex items-center justify-center z-[6000] p-4 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg animate-in zoom-in-95 duration-300 border border-slate-200 overflow-hidden">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-slate-900 text-white rounded-2xl shadow-xl">
                  {editingArea ? <Edit2 size={20} /> : <Plus size={20} />}
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 tracking-tight uppercase">
                    {editingArea ? 'Actualizar Área' : 'Nuevo Registro'}
                  </h3>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Gestión Organizacional</p>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-900 transition-colors p-2 hover:bg-slate-100 rounded-full">
                <X size={28} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Nombre del Área / Proceso</label>
                <input 
                  required 
                  type="text" 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})} 
                  className="w-full px-5 py-4 border-2 border-slate-100 rounded-2xl text-sm font-black bg-slate-50 focus:bg-white focus:border-blue-500 transition-all outline-none shadow-inner" 
                  placeholder="Ej: TALENTO HUMANO" 
                />
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Descripción de Responsabilidades</label>
                <textarea 
                  rows={4} 
                  value={formData.description} 
                  onChange={e => setFormData({...formData, description: e.target.value})} 
                  className="w-full border-2 border-slate-100 rounded-2xl p-5 text-sm font-medium bg-slate-50 focus:bg-white focus:border-blue-500 transition-all outline-none resize-none shadow-inner" 
                  placeholder="Defina el alcance de este departamento..." 
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-4 text-slate-400 font-black text-xs uppercase tracking-widest hover:bg-slate-50 rounded-2xl transition-all">
                  Cancelar
                </button>
                <button type="submit" className="flex-[2] py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all flex items-center justify-center active:scale-95">
                  <Save size={18} className="mr-2" />
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
