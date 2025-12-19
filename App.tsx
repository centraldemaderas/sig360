
import React, { useState, useEffect, useMemo } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { StandardView } from './components/StandardView';
import { RequirementsManager } from './components/RequirementsManager';
import { Login } from './components/Login';
import { UserManagement } from './components/UserManagement';
import { SystemSettings } from './components/SystemSettings';
import { StandardManager } from './components/StandardManager';
import { EvidenceDashboard } from './components/EvidenceDashboard';
import { PlantManager } from './components/PlantManager';
import { AreaManager } from './components/AreaManager';
import { Activity, User, StandardDefinition, Plant, Area } from './types';
import { dataService } from './services/dataService';
import { USE_CLOUD_DB } from './firebaseConfig';
import { Database, Loader2 } from 'lucide-react';

/**
 * SIG-Manager Pro - Arquitectura Modularizada
 * Módulos: 
 * - Dashboard (Control de Mando)
 * - Operación (Gestión de Normas por grilla)
 * - Hallazgos (Control de Evidencias)
 * - Administración (Configuración de Base)
 */
function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [standards, setStandards] = useState<StandardDefinition[]>([]);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  
  const [loadingStates, setLoadingStates] = useState({
    activities: true,
    users: true,
    standards: true,
    plants: true,
    areas: true,
    settings: true
  });

  const [dbError, setDbError] = useState<string | null>(null);
  const [isCloudConnected, setIsCloudConnected] = useState(false);
  const [currentYear, setCurrentYear] = useState<number>(new Date().getFullYear());
  const [activeView, setActiveView] = useState('dashboard');

  const isLoading = useMemo(() => Object.values(loadingStates).some(s => s), [loadingStates]);

  useEffect(() => {
    // Timer de seguridad para evitar loops infinitos de carga
    const safetyTimer = setTimeout(() => {
      setLoadingStates(prev => Object.keys(prev).reduce((acc, k) => ({...acc, [k]: false}), {} as any));
    }, 10000);

    const unsubscribes = [
      dataService.subscribeToActivities(
        (data) => { 
          setActivities(data); 
          setLoadingStates(s => ({...s, activities: false})); 
          if (USE_CLOUD_DB) setIsCloudConnected(true); 
        },
        (error) => { 
          setLoadingStates(s => ({...s, activities: false})); 
          if (error?.code === 'failed-precondition') setDbError("Faltan índices en la base de datos."); 
        }
      ),
      dataService.subscribeToUsers(data => { setUsers(data); setLoadingStates(s => ({...s, users: false})); }),
      dataService.subscribeToStandards(data => { setStandards(data); setLoadingStates(s => ({...s, standards: false})); }),
      dataService.subscribeToPlants(data => { setPlants(data); setLoadingStates(s => ({...s, plants: false})); }),
      dataService.subscribeToAreas(data => { setAreas(data); setLoadingStates(s => ({...s, areas: false})); }),
      dataService.subscribeToSettings(data => { setCompanyLogo(data?.companyLogo || null); setLoadingStates(s => ({...s, settings: false})); })
    ];

    return () => {
      clearTimeout(safetyTimer);
      unsubscribes.forEach(unsub => unsub());
    };
  }, []);

  const handlers = {
    standard: {
      update: async (std: StandardDefinition) => await dataService.updateStandard(std),
    },
    activity: {
      add: async (act: Activity) => await dataService.addActivity(act),
      update: async (act: Activity) => await dataService.updateActivity(act),
      delete: async (id: string) => { if (window.confirm("¿Confirmar eliminación?")) await dataService.deleteActivity(id); }
    },
    user: {
      add: async (u: User) => await dataService.addUser(u),
      update: async (u: User) => await dataService.updateUser(u),
      delete: async (id: string) => { if (window.confirm("¿Eliminar usuario?")) await dataService.deleteUser(id); }
    },
    plant: {
      add: async (p: Plant) => await dataService.addPlant(p),
      update: async (p: Plant) => await dataService.updatePlant(p),
      delete: async (id: string) => { await dataService.deletePlant(id); }
    },
    area: {
      add: async (a: Area) => await dataService.addArea(a),
      update: async (a: Area) => await dataService.updateArea(a),
      delete: async (id: string) => { await dataService.deleteArea(id); }
    }
  };

  const handleLogin = (user: User) => { setCurrentUser(user); setActiveView('dashboard'); };
  const handleLogout = () => { setCurrentUser(null); setActiveView('dashboard'); };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center space-y-4 flex-col bg-slate-50">
        <Loader2 className="animate-spin h-12 w-12 text-red-700" />
        <div className="text-center">
          <p className="font-black text-slate-800 uppercase tracking-widest text-sm">Sincronizando Sistema</p>
          <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 italic">Cargando Módulos Independientes...</p>
        </div>
      </div>
    );
  }

  if (dbError && USE_CLOUD_DB) {
    return (
      <div className="flex h-screen items-center justify-center p-8 text-center flex-col bg-white">
        <Database size={64} className="mb-6 text-red-600 animate-pulse" />
        <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Error de Conexión</h2>
        <p className="text-slate-500 mt-2 max-w-md font-medium">{dbError}</p>
        <button onClick={() => window.location.reload()} className="mt-8 bg-slate-900 text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl">Reintentar</button>
      </div>
    );
  }

  if (!currentUser) return <Login onLogin={handleLogin} companyLogo={companyLogo} users={users} />;

  const renderModule = () => {
    // Inyección de Módulos Dinámicos (Normas)
    if (activeView.startsWith('std-')) {
      const stdType = activeView.replace('std-', '');
      return (
        <StandardView 
          standard={stdType} 
          activities={activities} 
          areas={areas} 
          onUpdateActivity={handlers.activity.update} 
          currentYear={currentYear} 
          setCurrentYear={setCurrentYear} 
          currentUser={currentUser} 
        />
      );
    }

    // Módulos Independientes
    switch (activeView) {
      case 'dashboard': 
        return <Dashboard activities={activities} areas={areas} plants={plants} currentYear={currentYear} />;
      
      case 'evidence-dashboard': 
        return <EvidenceDashboard activities={activities} currentUser={currentUser} onUpdateActivity={handlers.activity.update} />;
      
      case 'norms': 
        return <StandardManager standards={standards} onUpdateStandard={handlers.standard.update} currentUser={currentUser} />;
      
      case 'requirements': 
        return <RequirementsManager activities={activities} onAdd={handlers.activity.add} onUpdate={handlers.activity.update} onDelete={handlers.activity.delete} standardsList={standards} currentUser={currentUser} areas={areas} />;
      
      case 'plants': 
        return <PlantManager plants={plants} onAdd={handlers.plant.add} onUpdate={handlers.plant.update} onDelete={handlers.plant.delete} />;
      
      case 'areas': 
        return <AreaManager areas={areas} users={users} onAdd={handlers.area.add} onUpdate={handlers.area.update} onDelete={handlers.area.delete} />;
      
      case 'users': 
        return <UserManagement users={users} onAddUser={handlers.user.add} onUpdateUser={handlers.user.update} onDeleteUser={handlers.user.delete} areas={areas} />;
      
      case 'settings': 
        return <SystemSettings currentLogo={companyLogo} onLogoChange={(logo) => setCompanyLogo(logo)} />;
      
      default: 
        return <Dashboard activities={activities} areas={areas} plants={plants} currentYear={currentYear} />;
    }
  };

  return (
    <Layout 
      activeView={activeView} 
      setActiveView={setActiveView} 
      currentUser={currentUser} 
      onLogout={handleLogout} 
      companyLogo={companyLogo} 
      isCloudConnected={isCloudConnected} 
      standards={standards}
    >
      {renderModule()}
    </Layout>
  );
}

export default App;
