
import React, { useRef, useState } from 'react';
import { Upload, Image as ImageIcon, Save, CheckCircle, Database, CloudLightning, AlertTriangle, RefreshCw, Fingerprint, Search, ShieldCheck } from 'lucide-react';
import { dataService } from '../services/dataService';
import { USE_CLOUD_DB, firebaseConfig, DATABASE_ID } from '../firebaseConfig';
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
        // Basic check for size to prevent huge base64 strings
        if (result.length > 800000) { // ~800KB limit warning
           alert("La imagen es muy grande. Se recomienda usar imágenes menores a 500KB para optimizar la base de datos.");
        }
        setPreview(result);
        setMessage(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (preview) {
      // Guardar en Base de Datos (a través del servicio)
      await dataService.updateSettings({ companyLogo: preview });
      // Actualizar estado local
      onLogoChange(preview);
      setMessage('Logo actualizado correctamente en la Base de Datos.');
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleReset = async () => {
    setPreview(null);
    await dataService.updateSettings({ companyLogo: null });
    onLogoChange(null);
    setMessage('Logo restaurado a la versión predeterminada.');
    setTimeout(() => setMessage(null), 3000);
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
      console.error(error);
      setMessage(`Error leyendo datos: ${error.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSeedData = async () => {
    if (!confirm(`Se enviarán datos al proyecto "${firebaseConfig.projectId}". ¿Continuar?`)) return;
    
    setIsSyncing(true);
    try {
      await dataService.seedInitialData();
      setMessage('✅ ¡Éxito! Datos sincronizados con Firebase Cloud.');
      handleVerifyData();
    } catch (error: any) {
      setMessage(`❌ Error: ${error.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-10">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Configuración del Sistema</h2>
        <p className="text-slate-500">Personalización e infraestructura de la plataforma.</p>
      </div>

      {/* --- DATABASE SECTION --- */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
         <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
          <Database className="mr-2 text-slate-500" />
          Estado de Base de Datos
        </h3>

        <div className={`p-4 rounded-lg border flex items-start mb-6 ${USE_CLOUD_DB ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
          {USE_CLOUD_DB ? (
            <CloudLightning className="text-green-600 mr-3 mt-0.5" />
          ) : (
             <AlertTriangle className="text-amber-600 mr-3 mt-0.5" />
          )}
          <div className="w-full">
            <h4 className={`font-bold text-sm ${USE_CLOUD_DB ? 'text-green-800' : 'text-amber-800'}`}>
              {USE_CLOUD_DB ? 'Conectado a Firebase Cloud' : 'Modo Local (Sin Nube)'}
            </h4>
            <p className={`text-sm mt-1 ${USE_CLOUD_DB ? 'text-green-700' : 'text-amber-700'}`}>
              {USE_CLOUD_DB 
                ? 'Los datos (incluyendo el Logo y las Evidencias) se guardan en la nube.' 
                : 'Los datos solo viven en este navegador.'}
            </p>
          </div>
        </div>

        {USE_CLOUD_DB && (
          <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 space-y-4">
            <div className="flex flex-wrap gap-3">
              <button 
                onClick={handleSeedData}
                disabled={isSyncing}
                className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors ${
                  isSyncing 
                    ? 'bg-slate-300 text-slate-500 cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
                }`}
              >
                <RefreshCw size={18} className={`mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
                {isSyncing ? 'Procesando...' : `Cargar Datos Iniciales`}
              </button>
              
              <button 
                onClick={handleVerifyData}
                disabled={isSyncing}
                className="flex items-center px-4 py-2 rounded-lg font-medium bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <Search size={18} className="mr-2" />
                Verificar Integridad
              </button>
            </div>
          </div>
        )}
      </div>

      {/* --- LOGO SECTION --- */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
        <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center">
          <ImageIcon className="mr-2 text-slate-500" />
          Logo de la Empresa
        </h3>

        <div className="flex flex-col md:flex-row gap-8 items-start">
          <div className="flex-1 bg-slate-50 rounded-xl p-6 border border-slate-200 flex flex-col items-center justify-center min-h-[200px] w-full">
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-4">Vista Previa</p>
            <div className="bg-white p-4 rounded shadow-sm border border-slate-100">
               {preview ? (
                <img src={preview} alt="Logo Preview" className="max-h-24 max-w-full object-contain" />
              ) : (
                <span className="text-slate-400 text-sm">Logo Predeterminado</span>
              )}
            </div>
          </div>

          <div className="flex-1 space-y-4">
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/jpeg, image/png"
              className="hidden"
            />

            <div className="flex flex-col gap-3">
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-2.5 border-2 border-dashed border-slate-300 hover:border-blue-500 hover:bg-blue-50 text-slate-600 hover:text-blue-600 rounded-lg transition-all flex items-center justify-center font-medium"
              >
                <Upload size={18} className="mr-2" />
                Seleccionar Imagen
              </button>

              <div className="flex gap-3">
                <button 
                  onClick={handleSave}
                  disabled={!preview || preview === currentLogo}
                  className={`flex-1 py-2.5 rounded-lg flex items-center justify-center font-bold transition-all shadow-sm ${
                    preview && preview !== currentLogo
                      ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <Save size={18} className="mr-2" />
                  Guardar en BD
                </button>
                <button 
                  onClick={handleReset}
                  className="px-4 py-2.5 border border-slate-300 hover:bg-red-50 hover:text-red-600 hover:border-red-200 text-slate-600 rounded-lg transition-all font-medium"
                >
                  Restaurar
                </button>
              </div>
            </div>
             {message && (
              <div className={`mt-4 p-3 rounded-lg text-sm flex items-center bg-blue-50 text-blue-700`}>
                <CheckCircle size={16} className="mr-2" />
                {message}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
