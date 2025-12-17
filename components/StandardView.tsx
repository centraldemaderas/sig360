import React, { useState, useRef } from 'react';
import { MONTHS, AREAS } from '../constants';
import { Activity, StandardType, Periodicity } from '../types';
import { Check, Upload, AlertCircle, Filter, Eye, X, Cloud, HardDrive, Paperclip, Download, Loader2 } from 'lucide-react';
import { dataService } from '../services/dataService';

interface StandardViewProps {
  standard: StandardType;
  activities: Activity[];
  onUpdateActivity: (activity: Activity) => void;
  currentYear: number;
  setCurrentYear: (year: number) => void;
}

export const StandardView: React.FC<StandardViewProps> = ({ 
  standard, 
  activities, 
  onUpdateActivity,
  currentYear,
  setCurrentYear
}) => {
  const [selectedArea, setSelectedArea] = useState('ALL');
  const [viewingActivity, setViewingActivity] = useState<Activity | null>(null);
  
  // Upload Modal State
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [activeUploadId, setActiveUploadId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  // Hidden File Input
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter activities based on the selected area AND the current standard
  const filteredActivities = activities.filter(a => {
    const matchesStandard = a.standards.includes(standard);
    const matchesArea = selectedArea === 'ALL' || a.responsibleArea === selectedArea;
    return matchesStandard && matchesArea;
  });

  const openUploadModal = (activityId: string) => {
    setActiveUploadId(activityId);
    setUploadModalOpen(true);
    setIsUploading(false);
  };

  const handleLocalUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeUploadId) return;

    const activityToUpdate = activities.find(a => a.id === activeUploadId);
    if (!activityToUpdate) return;

    setIsUploading(true);
    try {
      // 1. Upload to Storage
      const downloadUrl = await dataService.uploadEvidence(file, activeUploadId, currentYear);
      
      // 2. Update Activity Record
      const updatedActivity: Activity = {
        ...activityToUpdate,
        evidenceFile: file.name, // Display name
        evidenceUrl: downloadUrl // Real URL form Firebase Storage
      };
      
      await onUpdateActivity(updatedActivity);
      
      setUploadModalOpen(false);
      setActiveUploadId(null);
    } catch (error) {
      alert("Error al subir el archivo: " + error);
    } finally {
      setIsUploading(false);
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDownloadEvidence = (activity: Activity) => {
    if (activity.evidenceUrl) {
      // Open the real Firebase Storage URL
      window.open(activity.evidenceUrl, '_blank');
    } else if (activity.evidenceFile) {
      // Fallback for legacy/mock data
      alert(`Archivo simulado (Sin URL real): ${activity.evidenceFile}`);
    } else {
      openUploadModal(activity.id);
    }
  };

  // Helper to determine cell structure based on periodicity
  const renderPeriodicityCells = (activity: Activity) => {
    const plan = activity.monthlyPlan;
    const cells = [];
    let i = 0;

    const isFutureYear = currentYear > 2025;

    const getCellContent = (startIndex: number, endIndex: number) => {
      let hasExecuted = false;
      let hasDelayed = false;
      let hasPlanned = false;

      for (let k = startIndex; k <= endIndex; k++) {
        if (!isFutureYear && plan[k]?.executed) hasExecuted = true;
        if (!isFutureYear && plan[k]?.delayed) hasDelayed = true;
        
        if (isFutureYear) {
           const monthIndex = k;
           let isPlannedMonth = false;
           switch (activity.periodicity) {
             case Periodicity.MONTHLY: isPlannedMonth = true; break;
             case Periodicity.BIMONTHLY: isPlannedMonth = monthIndex % 2 === 0; break;
             case Periodicity.QUARTERLY: isPlannedMonth = (monthIndex + 1) % 3 === 0; break;
             case Periodicity.SEMIANNUAL: isPlannedMonth = monthIndex === 5 || monthIndex === 11; break;
             case Periodicity.ANNUAL: isPlannedMonth = monthIndex === 11; break;
           }
           if (isPlannedMonth) hasPlanned = true;
        } else {
           if (plan[k]?.planned) hasPlanned = true;
        }
      }

      if (hasExecuted) {
        return (
          <button 
            onClick={(e) => { e.stopPropagation(); handleDownloadEvidence(activity); }}
            className="flex items-center justify-center w-full h-full hover:scale-110 transition-transform"
            title={`Descargar evidencia: ${activity.evidenceFile || 'Sin archivo'}`}
          >
             <Check size={14} className="mx-auto text-white" />
          </button>
        );
      }
      if (hasDelayed) return <AlertCircle size={14} className="mx-auto text-white" />;
      if (hasPlanned) return <span className="text-[10px] font-bold">P</span>;
      return null;
    };

    const getCellClass = (startIndex: number, endIndex: number) => {
      let hasExecuted = false;
      let hasDelayed = false;
      let hasPlanned = false;

      for (let k = startIndex; k <= endIndex; k++) {
        if (!isFutureYear && plan[k]?.executed) hasExecuted = true;
        if (!isFutureYear && plan[k]?.delayed) hasDelayed = true;
        
        if (isFutureYear) {
           const monthIndex = k;
           let isPlannedMonth = false;
           switch (activity.periodicity) {
             case Periodicity.MONTHLY: isPlannedMonth = true; break;
             case Periodicity.BIMONTHLY: isPlannedMonth = monthIndex % 2 === 0; break;
             case Periodicity.QUARTERLY: isPlannedMonth = (monthIndex + 1) % 3 === 0; break;
             case Periodicity.SEMIANNUAL: isPlannedMonth = monthIndex === 5 || monthIndex === 11; break;
             case Periodicity.ANNUAL: isPlannedMonth = monthIndex === 11; break;
           }
           if (isPlannedMonth) hasPlanned = true;
        } else {
           if (plan[k]?.planned) hasPlanned = true;
        }
      }

      if (hasExecuted) return "bg-blue-600 text-white cursor-pointer hover:bg-blue-700";
      if (hasDelayed) return "bg-red-500 text-white animate-pulse";
      if (hasPlanned) return "bg-blue-100 text-blue-800 border-2 border-blue-200";
      return "bg-slate-50 opacity-50"; 
    };

    while (i < 12) {
      let colSpan = 1;
      
      switch (activity.periodicity) {
        case Periodicity.ANNUAL: colSpan = 12; break;
        case Periodicity.SEMIANNUAL: colSpan = 6; break;
        case Periodicity.QUARTERLY: colSpan = 3; break;
        case Periodicity.BIMONTHLY: colSpan = 2; break;
        case Periodicity.MONTHLY: default: colSpan = 1; break;
      }

      if (i + colSpan > 12) colSpan = 12 - i;

      cells.push(
        <td 
          key={i} 
          colSpan={colSpan} 
          className={`border-r border-slate-200 p-1 text-center transition-colors ${getCellClass(i, i + colSpan - 1)}`}
          title={`Estado: ${activity.periodicity}`}
        >
          <div className="flex items-center justify-center h-full w-full">
            {getCellContent(i, i + colSpan - 1)}
          </div>
        </td>
      );

      i += colSpan;
    }
    return cells;
  };

  const getHistoricalCompliance = (activity: Activity) => {
    if (currentYear === 2025) return activity.compliance2024;
    if (currentYear === 2026) return activity.compliance2025;
    return false;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[calc(100vh-8rem)]">
      {/* Filters Toolbar */}
      <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center space-x-4">
          <div className="flex items-center bg-white border border-slate-300 rounded-lg p-1 shadow-sm">
             <button 
               onClick={() => setCurrentYear(2025)}
               className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${currentYear === 2025 ? 'bg-slate-800 text-white shadow' : 'text-slate-500 hover:bg-slate-50'}`}
             >
               2025
             </button>
             <button 
               onClick={() => setCurrentYear(2026)}
               className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${currentYear === 2026 ? 'bg-slate-800 text-white shadow' : 'text-slate-500 hover:bg-slate-50'}`}
             >
               2026
             </button>
          </div>

          <div className="h-6 w-px bg-slate-300"></div>

          <div className="bg-white p-2 border border-slate-300 rounded-lg flex items-center space-x-2 shadow-sm">
            <Filter size={18} className="text-slate-500" />
            <select 
              value={selectedArea} 
              onChange={(e) => setSelectedArea(e.target.value)}
              className="bg-transparent border-none outline-none text-sm font-medium text-slate-700 min-w-[150px]"
            >
              <option value="ALL">TODAS LAS ÁREAS</option>
              {AREAS.map(area => (
                <option key={area} value={area}>{area}</option>
              ))}
            </select>
          </div>
          <span className="text-sm text-slate-500 ml-2">
            <strong>{filteredActivities.length}</strong> actividades | Año: <strong className="text-blue-700">{currentYear}</strong>
          </span>
        </div>

        <div className="flex items-center space-x-4 text-xs font-medium text-slate-600">
          <div className="flex items-center"><span className="w-3 h-3 bg-green-100 border border-green-500 rounded-sm mr-1"></span> Cumple</div>
          <div className="flex items-center"><span className="w-3 h-3 bg-red-100 border border-red-500 rounded-sm mr-1"></span> No Cumple</div>
          <div className="flex items-center"><span className="w-3 h-3 bg-blue-100 border border-blue-500 rounded-sm mr-1"></span> Planificado</div>
        </div>
      </div>

      {/* Grid */}
      <div className="overflow-auto flex-1 scrollbar-thin">
        <table className="w-full text-xs text-left border-collapse">
          <thead className="bg-slate-100 text-slate-600 font-semibold sticky top-0 z-10 shadow-sm">
            <tr>
              <th className="p-3 border-r border-slate-200 min-w-[80px] text-center">Cláusula</th>
              <th className="p-3 border-r border-slate-200 min-w-[200px]">Requisito (Norma)</th>
              <th className="p-3 border-r border-slate-200 min-w-[200px] bg-slate-50 border-b-2 border-slate-300">Tarea Específica / Criterio</th>
              <th className="p-3 border-r border-slate-200 w-[60px] text-center">Detalle</th>
              <th className="p-3 border-r border-slate-200 min-w-[60px] text-center bg-slate-200">
                 {currentYear - 1}
              </th>
              {MONTHS.map(m => (
                <th key={m} className="p-2 border-r border-slate-200 text-center min-w-[40px]">{m}</th>
              ))}
              <th className="p-3 min-w-[80px] text-center sticky right-0 bg-slate-100 shadow-l">Evidencia</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filteredActivities.length > 0 ? (
              filteredActivities.map((activity) => {
                const historicalCompliance = getHistoricalCompliance(activity);

                return (
                <tr key={activity.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-3 border-r border-slate-200 text-center font-medium bg-white">
                    <div className="text-sm font-bold text-slate-700">{activity.clause}</div>
                    {activity.subClause && <div className="text-[10px] text-slate-500 bg-slate-100 px-1 rounded inline-block mt-1">{activity.subClause}</div>}
                    <div className="mt-1">
                      <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold border border-slate-100 px-1 rounded">
                        {activity.periodicity.substring(0,3)}
                      </span>
                    </div>
                  </td>
                  <td className="p-3 border-r border-slate-200 bg-white">
                    <div className="font-semibold text-slate-800 line-clamp-2" title={activity.clauseTitle}>{activity.clauseTitle}</div>
                    {selectedArea === 'ALL' && (
                       <span className="inline-block mt-1 px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-medium border border-slate-200">
                        {activity.responsibleArea}
                      </span>
                    )}
                  </td>

                  <td className="p-3 border-r border-slate-200 bg-white">
                    <div className="text-slate-600 text-[11px] leading-snug line-clamp-3" title={activity.relatedQuestions}>
                      {activity.relatedQuestions || <span className="text-slate-400 italic">Sin tarea específica definida</span>}
                    </div>
                  </td>
                  
                  <td className="p-3 border-r border-slate-200 text-center bg-white">
                    <button 
                      onClick={() => setViewingActivity(activity)}
                      className="text-blue-600 hover:bg-blue-50 p-1.5 rounded-full transition-colors"
                      title="Ver detalle completo"
                    >
                      <Eye size={16} />
                    </button>
                  </td>
                  
                  <td className={`p-3 border-r border-slate-200 text-center ${historicalCompliance ? 'bg-green-50' : 'bg-red-50'}`}>
                    <div className={`mx-auto w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold ${
                      historicalCompliance 
                        ? 'bg-green-100 text-green-700 border border-green-200' 
                        : 'bg-red-100 text-red-700 border border-red-200'
                    }`}>
                      {historicalCompliance ? '1' : '0'}
                    </div>
                  </td>

                  {/* DYNAMIC CELLS BASED ON PERIODICITY */}
                  {renderPeriodicityCells(activity)}

                  <td className="p-3 text-center sticky right-0 bg-white shadow-l border-l border-slate-200">
                    {activity.evidenceFile ? (
                      <div className="flex flex-col items-center">
                        <button 
                          onClick={() => handleDownloadEvidence(activity)} 
                          className="flex items-center text-blue-600 hover:underline mb-1 hover:bg-blue-50 p-1 rounded"
                        >
                          <Download size={14} className="mr-1" />
                          <span className="truncate max-w-[60px] text-[10px]">Ver</span>
                        </button>
                      </div>
                    ) : (
                      <button 
                        onClick={() => openUploadModal(activity.id)}
                        className="flex items-center justify-center p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full transition-colors mx-auto"
                        title="Subir evidencia"
                      >
                        <Upload size={14} />
                      </button>
                    )}
                  </td>
                </tr>
              )})
            ) : (
              <tr>
                <td colSpan={18} className="p-8 text-center text-slate-500">
                  No hay actividades registradas para esta selección.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {/* Legend Footer */}
      <div className="bg-slate-50 p-3 border-t border-slate-200 text-xs text-slate-500 flex justify-between">
        <div>Total de Puntos: <strong>{filteredActivities.length}</strong></div>
        <div>
           Eficiencia ({currentYear}): <strong>
             {currentYear > 2025 
                ? 'N/A (Planificación)' 
                : filteredActivities.length > 0 
                  ? ((filteredActivities.filter(a => a.compliance2025).length / filteredActivities.length) * 100).toFixed(1) + '%'
                  : '0%'
             }
           </strong>
        </div>
      </div>

      {/* DETAIL MODAL (Unchanged Logic, just rendering) */}
      {viewingActivity && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
             <div className="p-5 border-b border-slate-200 flex justify-between items-center sticky top-0 bg-white">
              <div>
                <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-full border border-blue-100 mb-1 inline-block">
                  {viewingActivity.clause} {viewingActivity.subClause ? `- ${viewingActivity.subClause}` : ''}
                </span>
                <h3 className="text-lg font-bold text-slate-800">{viewingActivity.clauseTitle}</h3>
              </div>
              <button onClick={() => setViewingActivity(null)} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <h4 className="text-sm font-semibold text-slate-900 mb-2">Descripción del Requisito (Norma)</h4>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-sm text-slate-700 leading-relaxed">
                  {viewingActivity.description}
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-semibold text-slate-900 mb-2">Contextualización (Central de Maderas)</h4>
                <div className="bg-amber-50 p-3 rounded-lg border border-amber-200 text-sm text-slate-800 leading-relaxed italic">
                  {viewingActivity.contextualization}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-slate-900 mb-2">Tarea / Criterio de Auditoría</h4>
                <div className="flex items-start bg-blue-50 p-3 rounded-lg border border-blue-100">
                   <AlertCircle size={18} className="text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
                   <p className="text-sm text-blue-900 font-medium">{viewingActivity.relatedQuestions}</p>
                </div>
              </div>
              
              <div className="flex justify-end pt-4 border-t border-slate-100">
                 <button 
                  onClick={() => setViewingActivity(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg transition-colors text-sm font-medium"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* UPLOAD MODAL */}
      {uploadModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[60] p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-800 flex items-center">
                <Paperclip size={20} className="mr-2 text-slate-500" />
                Cargar Evidencia ({currentYear})
              </h3>
              <button onClick={() => setUploadModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6">
              <p className="text-sm text-slate-600 mb-6 text-center">
                Seleccione el archivo para justificar el cumplimiento de este requisito.
              </p>

              {/* Hidden File Input */}
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
              />
              
              <div className="space-y-3">
                {isUploading ? (
                  <div className="p-8 flex flex-col items-center justify-center border border-slate-200 rounded-xl bg-slate-50">
                    <Loader2 size={32} className="animate-spin text-blue-600 mb-3" />
                    <span className="text-sm font-bold text-slate-700">Subiendo a la nube...</span>
                  </div>
                ) : (
                  <>
                    <button 
                      className="w-full flex items-center justify-between p-4 border border-slate-200 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-all group opacity-50 cursor-not-allowed"
                      title="Proximamente: Integración directa con SharePoint"
                    >
                      <div className="flex items-center">
                        <div className="bg-blue-100 text-blue-600 p-2.5 rounded-lg mr-4 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                          <Cloud size={24} />
                        </div>
                        <div className="text-left">
                          <span className="block font-bold text-slate-800">OneDrive / SharePoint</span>
                          <span className="text-xs text-slate-500">Próximamente</span>
                        </div>
                      </div>
                    </button>

                    <button 
                      onClick={handleLocalUploadClick}
                      className="w-full flex items-center justify-between p-4 border border-slate-200 rounded-xl hover:border-slate-400 hover:bg-slate-50 transition-all group shadow-sm hover:shadow-md"
                    >
                      <div className="flex items-center">
                        <div className="bg-slate-800 text-white p-2.5 rounded-lg mr-4 group-hover:bg-slate-700 transition-colors">
                          <HardDrive size={24} />
                        </div>
                        <div className="text-left">
                          <span className="block font-bold text-slate-800">Subir Archivo Local</span>
                          <span className="text-xs text-slate-500">PDF, Excel, Imagen (Max 10MB)</span>
                        </div>
                      </div>
                    </button>
                  </>
                )}
              </div>
            </div>
            
            <div className="bg-slate-50 p-3 text-center text-xs text-slate-400 border-t border-slate-100">
              Almacenamiento seguro en Google Cloud Storage
            </div>
          </div>
        </div>
      )}
    </div>
  );
};