import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { Plus, Trash2, User as UserIcon, Shield, Briefcase, Edit, Save, X } from 'lucide-react';

interface UserManagementProps {
  users: User[];
  onAddUser: (user: User) => void;
  onUpdateUser: (user: User) => void;
  onDeleteUser: (id: string) => void;
}

export const UserManagement: React.FC<UserManagementProps> = ({ users, onAddUser, onUpdateUser, onDeleteUser }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: UserRole.LEADER,
    password: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingId) {
      // Update existing user
      onUpdateUser({
        id: editingId,
        ...formData
      });
      // Reset logic
      setEditingId(null);
    } else {
      // Create new user
      onAddUser({
        id: `u-${Date.now()}`,
        ...formData
      });
    }
    
    // Clear form
    setFormData({ name: '', email: '', role: UserRole.LEADER, password: '' });
  };

  const handleEdit = (user: User) => {
    setEditingId(user.id);
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role,
      password: user.password || '' // Load current password or empty
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData({ name: '', email: '', role: UserRole.LEADER, password: '' });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Gestión de Usuarios</h2>
        <p className="text-slate-500">Administre el acceso del personal a la plataforma.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* User Form */}
        <div className="lg:col-span-1">
          <div className={`p-6 rounded-xl shadow-sm border transition-colors ${editingId ? 'bg-blue-50 border-blue-200' : 'bg-white border-slate-200'}`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className={`text-lg font-bold ${editingId ? 'text-blue-800' : 'text-slate-800'}`}>
                {editingId ? 'Editar Usuario' : 'Nuevo Usuario'}
              </h3>
              {editingId && (
                <button 
                  onClick={handleCancelEdit}
                  className="text-slate-400 hover:text-slate-600"
                  title="Cancelar edición"
                >
                  <X size={20} />
                </button>
              )}
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nombre Completo</label>
                <input 
                  required
                  type="text" 
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Correo Electrónico</label>
                <input 
                  required
                  type="email" 
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                  className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Rol</label>
                <select 
                  value={formData.role}
                  onChange={e => setFormData({...formData, role: e.target.value as UserRole})}
                  className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value={UserRole.LEADER}>Líder de Proceso (Solo Lectura)</option>
                  <option value={UserRole.ADMIN}>Administrador (Control Total)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Contraseña</label>
                <input 
                  required
                  type="text" 
                  value={formData.password}
                  onChange={e => setFormData({...formData, password: e.target.value})}
                  className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder={editingId ? "Dejar igual o cambiar" : "Asignar contraseña"}
                />
              </div>
              
              <div className="flex gap-2">
                {editingId && (
                  <button 
                    type="button"
                    onClick={handleCancelEdit}
                    className="flex-1 bg-white border border-slate-300 hover:bg-slate-50 text-slate-600 font-medium py-2 rounded-lg transition-colors"
                  >
                    Cancelar
                  </button>
                )}
                <button 
                  type="submit"
                  className={`flex-1 ${editingId ? 'bg-blue-600 hover:bg-blue-700' : 'bg-slate-800 hover:bg-slate-900'} text-white font-medium py-2 rounded-lg transition-colors flex items-center justify-center`}
                >
                  {editingId ? <Save size={18} className="mr-2" /> : <Plus size={18} className="mr-2" />}
                  {editingId ? 'Actualizar' : 'Crear Usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* User List */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-100 text-slate-600 font-semibold uppercase text-xs">
                <tr>
                  <th className="p-4">Usuario</th>
                  <th className="p-4">Rol</th>
                  <th className="p-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {users.map((user) => (
                  <tr key={user.id} className={`hover:bg-slate-50 transition-colors ${editingId === user.id ? 'bg-blue-50/50' : ''}`}>
                    <td className="p-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600">
                          <UserIcon size={16} />
                        </div>
                        <div>
                          <div className="font-medium text-slate-900">{user.name}</div>
                          <div className="text-xs text-slate-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.role === UserRole.ADMIN 
                          ? 'bg-purple-100 text-purple-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {user.role === UserRole.ADMIN ? <Shield size={12} className="mr-1" /> : <Briefcase size={12} className="mr-1" />}
                        {user.role}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <button 
                          onClick={() => handleEdit(user)}
                          className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 p-2 rounded-full transition-colors"
                          title="Editar usuario"
                        >
                          <Edit size={18} />
                        </button>
                        <button 
                          onClick={() => onDeleteUser(user.id)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-full transition-colors"
                          title="Eliminar usuario"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};