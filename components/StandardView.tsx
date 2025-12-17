
import React, { useState } from 'react';
import { MONTHS, AREAS } from '../constants';
import { Activity, StandardType, Periodicity, User } from '../types';
import { Check, Upload, FileText, AlertCircle, Filter, Eye, X, Cloud, HardDrive, Paperclip, Calendar, Download, Link as LinkIcon, Image as ImageIcon } from 'lucide-react';

interface StandardViewProps {
  standard: StandardType;
  activities: Activity[];
  onUpdateActivity: (activity: Activity) => void;
  currentYear: number;
  setCurrentYear: (year: number) => void;
  currentUser: User;
}

export const StandardView: React.FC<StandardViewProps> = ({ 
  standard, 
  activities, 
  onUpdateActivity,
  currentYear,
  setCurrentYear,
  currentUser
}) => {
  const [selectedArea, setSelectedArea] = useState('ALL');
  const [viewingActivity, setViewingActivity] = useState<Activity | null>(null);
  
  // Upload Modal State
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [activeUploadId, setActiveUploadId] = useState<string | null>(null);
  const [uploadType, setUploadType] = useState<'file' | 'link' | null>(null);
  const [linkInput, setLinkInput] = useState('');
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Filter activities based on the selected area AND the current standard
  const filteredActivities = activities.filter(a => {
    const matchesStandard = a.standards.includes(standard);
    const matchesArea = selectedArea === 'ALL' || a.responsibleArea === selectedArea;
    return matchesStandard && matchesArea;
  });

  const openUploadModal = (activityId: string) => {
    setActiveUploadId(activityId);
    setUploadModalOpen(true);
    setUploadType(null);
    setLinkInput('');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeUploadId) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      const activityToUpdate = activities.find(a => a.id === activeUploadId);
      if (!activityToUpdate) return;

      const updatedActivity: Activity = {
        ...activityToUpdate,
        evidence: {
          url: base64,
          type: 'FILE',
          fileName: file.name,
          uploadedBy: currentUser.name,
          uploadedAt: new Date().toLocaleDateString()
        }
      };

      onUpdateActivity(updatedActivity);
      setUploadModalOpen(false);
      setActiveUploadId(null);
    };
    reader.readAsDataURL(file);
  };

  const handleLinkSubmit = () => {
    if (!linkInput.trim() || !activeUploadId) return;
    
    const activityToUpdate = activities.find(a => a.id === activeUploadId);
    if (!activityToUpdate) return;

    const updatedActivity: Activity = {
      ...activityToUpdate,
      evidence: {
        url: linkInput,
        type: 'LINK',
        fileName: 'Enlace Externo',
        uploadedBy: currentUser.name,
        uploadedAt: new Date().toLocaleDateString()
      }
    };
    onUpdateActivity(updatedActivity);
    setUploadModalOpen(false);
    setActiveUploadId(null);
  };

  const handleDownloadEvidence = (activity: Activity) => {
    if (activity.evidence) {
      if (activity.evidence.type === 'LINK') {
        window.open(activity.evidence.url, '_blank');
      } else {
        // Create a temporary link for Base64 download
        const link = document.createElement("a");
        link.href = activity.evidence.url;
        link.download = activity.evidence.fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
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
    const hasEvidence = !!activity.evidence;

    const getCellContent = (startIndex: number, endIndex: number) => {
      // If there is global evidence attached to the activity, show Check everywhere for simplicity 
      // OR implement logic to check if that specific month was executed.
      // For this requirement, if evidence exists, we assume the task is done.
      if (hasEvidence) {
         return (
          <div className="group relative w-full h-full flex items-center justify-center">
             <button 
              onClick={(e) => { e.stopPropagation(); handleDownloadEvidence(activity); }}
              className="flex items-center justify-center w-full h-full hover:scale-110 transition-transform"
            >
               <Check size={14} className="mx-auto text-white" />
            </button>
            
            {/* Tooltip on hover */}
            <div className="absolute bottom-full mb-1 hidden group-hover:block bg-slate-800 text-white text-[10px] p-2 rounded shadow-lg z-20 w-32 whitespace-normal leading-tight">
               <strong>Subido por:</strong><br/>{activity.evidence?.uploadedBy}<br/>
               <span className="opacity-75">{activity.evidence?.uploadedAt}</span>
            </div>
          </div>
        );
      }

      // Check planning
      let hasPlanned = false;
      for (let k = startIndex; k <= endIndex; k++) {
        if (plan[k]?.planned) hasPlanned = true;
      }
      
      if (hasPlanned) return <span className="text-[10px] font-bold">P</span>;
      return null;
    };

    const getCellClass = (startIndex: number, endIndex: number) => {
      // Logic simplified: If evidence exists, it's green/blue. If not and planned, it's pending.
      if (hasEvidence) return "bg-blue-600 text-white cursor-pointer hover:bg-blue-700";

      let hasPlanned = false;
      for (let k = startIndex; k <= endIndex; k++) {
        if (plan[k]?.planned) hasPlanned = true;
      }

      if (hasPlanned) return "bg-blue-100 text-blue-800 border-2 border-blue-200";
      return "bg-slate-50 opacity-50"; 
    };

    while (i < 12) {
      let colSpan = 1;
      // ... same logic for colspan
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
    // Si la columna es 2025 (currentYear), queremos ver el histórico (2024).
    if (currentYear === 2025) return activity.compliance2024; 
    // Si estamos en 2026, el historico es 2025.
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
                 {/* Explicit Header Change requested by user */}
                 {currentYear === 2025 ? '2025' : (currentYear - 1)}
              </th>
              {MONTHS.map(m => (
                <th key={m} className="p-2 border-r border-slate-200 text-center min-w-[40px]">{m}</th>
              ))}
              <th className="p-3 min-w-[80px] text-center sticky right-0 bg-slate-100 shadow-l">Evidencia</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filteredActivities.map((activity) => {
                const historicalCompliance = getHistoricalCompliance(activity);

                return (
                <tr key={activity.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-3 border-r border-slate-200 text-center font-medium bg-white">
                    <div className="text-sm font-bold text-slate-700">{activity.clause}</div>
                    {activity.subClause && <div className="text-[10px] text-slate-500 bg-slate-100 px-1 rounded inline-block mt-1">{activity.subClause}</div>}
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
                    <div className="text-slate-600 text-[11px] leading-snug line-clamp-3">
                      {activity.relatedQuestions || <span className="text-slate-400 italic">Sin tarea específica definida</span>}
                    </div>
                  </td>
                  <td className="p-3 border-r border-slate-200 text-center bg-white">
                    <button onClick={() => setViewingActivity(activity)} className="text-blue-600 hover:bg-blue-50 p-1.5 rounded-full">
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

                  {renderPeriodicityCells(activity)}

                  <td className="p-3 text-center sticky right-0 bg-white shadow-l border-l border-slate-200">
                    {activity.evidence ? (
                      <button 
                        onClick={() => handleDownloadEvidence(activity)} 
                        className="flex flex-col items-center justify-center text-blue-600 hover:text-blue-800 mx-auto group"
                        title={`Subido por: ${activity.evidence.uploadedBy}`}
                      >
                         {activity.evidence.type === 'LINK' ? <LinkIcon size={18} /> : <FileText size={18} />}
                         <span className="text-[9px] mt-1 max-w-[60px] truncate">{activity.evidence.fileName}</span>
                      </button>
                    ) : (
                      <button 
                        onClick={() => openUploadModal(activity.id)}
                        className="flex items-center justify-center p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full mx-auto"
                      >
                        <Upload size={14} />
                      </button>
                    )}
                  </td>
                </tr>
              )})}
          </tbody>
        </table>
      </div>

      {/* UPLOAD MODAL */}
      {uploadModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[60] p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-800 flex items-center">
                <Paperclip size={20} className="mr-2 text-slate-500" />
                Cargar Evidencia
              </h3>
              <button onClick={() => setUploadModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6">
              {!uploadType ? (
                 <div className="space-y-3">
                   <button 
                    onClick={() => setUploadType('link')}
                    className="w-full flex items-center p-4 border border-slate-200 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-all group"
                  >
                    <div className="bg-blue-100 text-blue-600 p-2.5 rounded-lg mr-4 group-hover:bg-blue-600 group-hover:text-white">
                      <Cloud size={24} />
                    </div>
                    <div className="text-left">
                      <span className="block font-bold text-slate-800">OneDrive / SharePoint</span>
                      <span className="text-xs text-slate-500">Pegar enlace del archivo</span>
                    </div>
                  </button>

                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full flex items-center p-4 border border-slate-200 rounded-xl hover:border-slate-400 hover:bg-slate-50 transition-all group"
                  >
                    <div className="bg-slate-100 text-slate-600 p-2.5 rounded-lg mr-4 group-hover:bg-slate-800 group-hover:text-white">
                      <ImageIcon size={24} />
                    </div>
                    <div className="text-left">
                      <span className="block font-bold text-slate-800">Foto o Archivo Local</span>
                      <span className="text-xs text-slate-500">Subir imagen o PDF (Max 1MB)</span>
                    </div>
                  </button>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    onChange={handleFileUpload} 
                    accept="image/*,application/pdf"
                  />
                 </div>
              ) : (
                <div className="space-y-4">
                   <p className="text-sm text-slate-600">Pegue el enlace del documento de OneDrive/SharePoint:</p>
                   <input 
                    type="text" 
                    value={linkInput}
                    onChange={e => setLinkInput(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500"
                    placeholder="https://sharepoint.com/..."
                   />
                   <div className="flex justify-end gap-2">
                     <button onClick={() => setUploadType(null)} className="px-3 py-1.5 text-slate-500 hover:bg-slate-100 rounded">Atrás</button>
                     <button onClick={handleLinkSubmit} className="px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700">Guardar Enlace</button>
                   </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
