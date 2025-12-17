import React, { useRef, useState } from 'react';
import { Upload, Image as ImageIcon, Save, CheckCircle, Database, CloudLightning, AlertTriangle, RefreshCw } from 'lucide-react';
import { dataService } from '../services/dataService';
import { USE_CLOUD_DB } from '../firebaseConfig';

interface SystemSettingsProps {
  currentLogo: string | null;
  onLogoChange: (logo: string | null) => void;
}

export const SystemSettings: React.FC<SystemSettingsProps> = ({ currentLogo, onLogoChange }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(currentLogo);
  const [message, setMessage] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.match('image.*')) {
        setMessage('Por favor seleccione un archivo de imagen válido (JPG, PNG).');
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
        setMessage(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    if (preview) {
      onLogoChange(preview);
      setMessage('Logo actualizado correctamente.');
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleReset = () => {
    setPreview(null);
    onLogoChange(null); // Restore default SVG
    setMessage('Logo restaurado a la versión predeterminada.');
    setTimeout(() => setMessage(null), 3000);
  };

  const handleSeedData = async () => {
    if (!confirm("Esto cargará los datos de prueba (Gerencia, Usuarios) en la base de datos de la nube. Si ya existen datos, se sobrescribirán los que tengan el mismo ID. ¿Continuar?")) return;
    
    setIsSyncing(true);
    try {
      await dataService.seedInitialData();
      setMessage('✅ Datos sincronizados con la Nube exitosamente.');
    } catch (error: any) {
      console.error(error);
      if (error.code === 'permission-denied') {
        setMessage('❌ Error: Permiso denegado. Revisa las "Reglas" en Firebase Console.');
      } else {
        setMessage('❌ Error al sincronizar: ' + error.message);
      }
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
          <div>
            <h4 className={`font-bold text-sm ${USE_CLOUD_DB ? 'text-green-800' : 'text-amber-800'}`}>
              {USE_CLOUD_DB ? 'Conectado a Firebase Cloud' : 'Modo Local (Sin Nube)'}
            </h4>
            <p className={`text-sm mt-1 ${USE_CLOUD_DB ? 'text-green-700' : 'text-amber-700'}`}>
              {USE_CLOUD_DB 
                ? 'Los datos se guardan en tiempo real en los servidores de Google.' 
                : 'Los datos solo viven en este navegador. Activa Firebase para persistencia.'}
            </p>
          </div>
        </div>

        {USE_CLOUD_DB && (
          <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
            <h4 className="font-bold text-slate-700 mb-2">Inicialización de Datos</h4>
            <p className="text-sm text-slate-500 mb-4">
              Si acabas de crear la base de datos en Firebase, estará vacía. Utiliza este botón para cargar los datos de demostración (Actividades de Gerencia, Usuarios base).
            </p>
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
              {isSyncing ? 'Sincronizando...' : 'Cargar Datos Iniciales a la Nube'}
            </button>
            {message && message.includes('Sincronizados') && (
              <p className="mt-3 text-sm text-green-600 font-medium">{message}</p>
            )}
            {message && message.includes('Error') && (
              <p className="mt-3 text-sm text-red-600 font-medium">{message}</p>
            )}
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
          {/* Preview Section */}
          <div className="flex-1 bg-slate-50 rounded-xl p-6 border border-slate-200 flex flex-col items-center justify-center min-h-[200px] w-full">
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-4">Vista Previa</p>
            <div className="bg-white p-4 rounded shadow-sm border border-slate-100">
               {preview ? (
                <img src={preview} alt="Logo Preview" className="max-h-24 max-w-full object-contain" />
              ) : (
                <div className="text-slate-400 text-sm flex flex-col items-center">
                   {/* Default SVG Preview */}
                   <svg viewBox="0 0 280 80" className="h-16 w-auto opacity-50 grayscale">
                    <g strokeLinecap="round" strokeLinejoin="round" fill="none">
                      <path d="M 10 60 L 30 30 L 50 60" stroke="#B91C1C" strokeWidth="8" />
                      <path d="M 30 60 L 50 30 L 70 60" stroke="#1F2937" strokeWidth="8" />
                      <path d="M 50 60 L 70 30 L 90 60" stroke="#B91C1C" strokeWidth="8" />
                      <rect x="64" y="52" width="12" height="12" transform="rotate(45 70 58)" fill="#1F2937" stroke="none" />
                    </g>
                    <g fontFamily="sans-serif">
                      <text x="100" y="45" fontSize="22" fontWeight="800" fill="#1F2937">Central de</text>
                      <text x="100" y="65" fontSize="22" fontWeight="800" fill="#1F2937">Maderas</text>
                    </g>
                  </svg>
                  <span className="mt-2">(Logo Predeterminado)</span>
                </div>
              )}
            </div>
          </div>

          {/* Controls Section */}
          <div className="flex-1 space-y-4">
            <p className="text-sm text-slate-600">
              Suba una imagen en formato JPG o PNG para reemplazar el logo en la barra lateral y en la pantalla de inicio de sesión.
            </p>
            
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
                  Guardar Cambios
                </button>
                <button 
                  onClick={handleReset}
                  className="px-4 py-2.5 border border-slate-300 hover:bg-red-50 hover:text-red-600 hover:border-red-200 text-slate-600 rounded-lg transition-all font-medium"
                >
                  Restaurar
                </button>
              </div>
            </div>

            {message && !message.includes('Error') && !message.includes('Sincronizados') && (
              <div className={`mt-4 p-3 rounded-lg text-sm flex items-center ${message.includes('restaurado') ? 'bg-amber-50 text-amber-700' : 'bg-green-50 text-green-700'}`}>
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