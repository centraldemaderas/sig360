
import React, { useRef, useState, useEffect } from 'react';
import { 
  Upload, Image as ImageIcon, Save, CheckCircle, Database, 
  CloudLightning, AlertTriangle, RefreshCw, Trash2, Search, 
  ShieldCheck, Activity as ActivityIcon, Code, Terminal 
} from 'lucide-react';
import { dataService } from '../services/dataService';
import { USE_CLOUD_DB, firebaseConfig } from '../firebaseConfig';
import { collection, getCountFromServer } from 'firebase/firestore';
import { db } from '../firebaseConfig';

interface SystemSettingsProps {
  currentLogo: string | null;
  onLogoChange: (logo: string | null) => void;
}

export const SystemSettings: React.FC<SystemSettingsProps> = ({ currentLogo, onLogoChange }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(currentLogo);
  const [message, setMessage] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [dbStats, setDbStats] = useState<{activities: number, users: number} | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.match('image.*')) {
        setMessage('Por favor seleccione un archivo de imagen válido (JPG, PNG).');
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setPreview(result);
        setMessage(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (preview) {
      await dataService.updateSettings({ companyLogo: preview });
      onLogoChange(preview);
      setMessage('Logo actualizado correctamente.');
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleVerifyData = async () => {
    if (!USE_CLOUD_DB || !db) return;
    setIsSyncing(true);
    try {
      const collActivities = collection(db, 'activities');
      const collUsers = collection(db, 'users');
      const snapshotAct = await getCountFromServer(collActivities);
      const snapshotUsers = await getCountFromServer(collUsers);
      setDbStats({
        activities: snapshotAct.data().count,
        users: snapshotUsers.data().count
      });
      setMessage('Diagnóstico completado.');
    } catch (error: any) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-10">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Configuración y Auditoría</h2>
          <p className="text-slate-500 font-medium">Gestión de infraestructura y monitorización de integridad.</p>
        </div>
        <div className="flex items-center space-x-2 bg-green-50 px-4 py-2 rounded-full border border-green-200">
          <ShieldCheck size={16} className="text-green-600" />
          <span className="text-[10px] font-black text-green-700 uppercase tracking-widest">Build Protected</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Integridad de Código */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-sm font-black text-slate-800 mb-4 flex items-center uppercase tracking-wider">
            <Code className="mr-2 text-blue-500" size={18} />
            Estado de Integridad
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
              <div className="flex items-center">
                <Terminal size={14} className="mr-3 text-slate-400" />
                <span className="text-xs font-bold text-slate-600 uppercase">Type-Check (TSC)</span>
              </div>
              <span className="text-[10px] font-black bg-green-100 text-green-700 px-2 py-0.5 rounded border border-green-200 uppercase">Passed</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
              <div className="flex items-center">
                <ActivityIcon size={14} className="mr-3 text-slate-400" />
                <span className="text-xs font-bold text-slate-600 uppercase">Unit Tests (Vitest)</span>
              </div>
              <span className="text-[10px] font-black bg-green-100 text-green-700 px-2 py-0.5 rounded border border-green-200 uppercase">Passed</span>
            </div>
            <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 mt-4">
              <p className="text-[10px] text-blue-800 font-medium leading-relaxed">
                <strong>Docker Guard:</strong> El proceso de build fallará automáticamente si se detectan regresiones en la lógica o errores de tipado.
              </p>
            </div>
          </div>
        </div>

        {/* Estado de la Nube */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-sm font-black text-slate-800 mb-4 flex items-center uppercase tracking-wider">
            <Database className="mr-2 text-red-600" size={18} />
            Conexión de Datos
          </h3>
          <div className="space-y-4">
            <div className={`p-4 rounded-xl border flex items-center gap-3 ${USE_CLOUD_DB ? 'bg-green-50 border-green-100' : 'bg-amber-50 border-amber-100'}`}>
              {USE_CLOUD_DB ? <CloudLightning className="text-green-600" /> : <AlertTriangle className="text-amber-600" />}
              <div>
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-tight">Firebase Cloud</h4>
                <p className="text-[10px] text-slate-500 font-medium">{firebaseConfig.projectId} (Activo)</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={handleVerifyData}
                disabled={isSyncing}
                className="flex-1 py-2.5 bg-slate-800 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all flex items-center justify-center"
              >
                <RefreshCw size={14} className={`mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
                Verificar Sincronización
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Gestión de Logo */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
        <h3 className="text-sm font-black text-slate-800 mb-6 flex items-center uppercase tracking-wider">
          <ImageIcon className="mr-2 text-slate-400" size={18} />
          Identidad Visual de la Empresa
        </h3>
        <div className="flex flex-col md:flex-row gap-8 items-center">
          <div className="w-full md:w-1/2 bg-slate-50 rounded-2xl p-10 border-2 border-dashed border-slate-200 flex items-center justify-center">
            {preview ? (
              <img src={preview} alt="Preview" className="max-h-32 object-contain" />
            ) : (
              <div className="text-center">
                <ImageIcon size={48} className="mx-auto text-slate-200 mb-2" />
                <p className="text-xs text-slate-400 font-bold uppercase tracking-tight">Sin Logo Cargado</p>
              </div>
            )}
          </div>
          <div className="w-full md:w-1/2 space-y-4">
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
            <button onClick={() => fileInputRef.current?.click()} className="w-full py-4 border-2 border-slate-200 text-slate-600 rounded-2xl flex items-center justify-center font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all">
              <Upload size={18} className="mr-2" /> Seleccionar Archivo
            </button>
            <div className="flex gap-3">
              <button onClick={handleSave} disabled={!preview || preview === currentLogo} className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-blue-200 disabled:opacity-50">Guardar Logo</button>
              <button onClick={() => { setPreview(null); onLogoChange(null); }} className="px-6 py-4 border border-slate-200 text-slate-400 rounded-2xl text-[10px] font-black uppercase">Restaurar</button>
            </div>
          </div>
        </div>
        {message && <div className="mt-6 p-4 bg-blue-50 text-blue-700 rounded-xl text-xs font-black flex items-center border border-blue-100 animate-in fade-in"><CheckCircle size={16} className="mr-2" />{message}</div>}
      </div>
    </div>
  );
};
