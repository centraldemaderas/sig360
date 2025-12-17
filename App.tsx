
import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { StandardView } from './components/StandardView';
import { RequirementsManager } from './components/RequirementsManager';
import { Login } from './components/Login';
import { UserManagement } from './components/UserManagement';
import { SystemSettings } from './components/SystemSettings';
import { StandardManager } from './components/StandardManager';
import { EvidenceDashboard } from './components/EvidenceDashboard';
import { StandardType, Activity, User, StandardDefinition } from './types';
import { dataService } from './services/dataService';
import { USE_CLOUD_DB } from './firebaseConfig';
import { Database, AlertTriangle } from 'lucide-react';

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  // App Config State
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);

  // Data State
  const [activities, setActivities] = useState<Activity[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [standards, setStandards] = useState<StandardDefinition[]>([]);
  
  const [activitiesLoaded, setActivitiesLoaded] = useState(false);
  const [usersLoaded, setUsersLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const [dbError, setDbError] = useState<string | null>(null);
  const [isCloudConnected, setIsCloudConnected] = useState(false);
  
  const [currentYear, setCurrentYear] = useState<number>(2025);

  useEffect(() => {
    if (activitiesLoaded && usersLoaded) {
      setIsLoading(false);
    }
  }, [activitiesLoaded, usersLoaded]);

  // --- DATA SUBSCRIPTIONS ---
  useEffect(() => {
    const safetyTimer = setTimeout(() => {
      setIsLoading(false);
    }, 5000);

    const unsubscribeActivities = dataService.subscribeToActivities(
      (data) => {
        setActivities(data);
        setActivitiesLoaded(true);
        setDbError(null); 
        if (USE_CLOUD_DB) setIsCloudConnected(true);
      },
      (error) => {
        setActivitiesLoaded(true); 
        if (USE_CLOUD_DB) setIsCloudConnected(false);
        if (error?.code === 'permission-denied' || error?.code === 'not-found' || error?.code === 'failed-precondition') {
           setDbError("No se pudo conectar a la base de datos.");
        } else {
           setDbError("Error de conexión: " + error.message);
        }
      }
    );

    const unsubscribeUsers = dataService.subscribeToUsers(
      (data) => {
        setUsers(data);
        setUsersLoaded(true);
      },
      (error) => {
        console.error("Error loading users", error);
        setUsersLoaded(true); 
      }
    );

    // Subscribe to Norms
    const unsubscribeStandards = dataService.subscribeToStandards((data) => {
      setStandards(data);
    });

    // Subscribe to Settings (Logo)
    const unsubscribeSettings = dataService.subscribeToSettings((data) => {
      if (data && data.companyLogo) {
        setCompanyLogo(data.companyLogo);
      } else {
        setCompanyLogo(null);
      }
    });

    return () => {
      clearTimeout(safetyTimer);
      unsubscribeActivities();
      unsubscribeUsers();
      unsubscribeStandards();
      unsubscribeSettings();
    };
  }, []);

  const handleUpdateStandard = async (std: StandardDefinition) => {
    await dataService.updateStandard(std);
  };

  const handleLogoChange = (logo: string | null) => {
    // Optimistic UI Update
    setCompanyLogo(logo);
  };

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setActiveView('dashboard');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setActiveView('dashboard');
  };

  const handleAddActivity = async (newActivity: Activity) => {
    await dataService.addActivity(newActivity);
  };

  const handleUpdateActivity = async (updatedActivity: Activity) => {
    await dataService.updateActivity(updatedActivity);
  };

  const handleDeleteActivity = async (id: string) => {
    if (window.confirm("¿Está seguro de eliminar este requisito?")) {
      await dataService.deleteActivity(id);
    }
  };

  const handleAddUser = async (newUser: User) => {
    await dataService.addUser(newUser);
  };

  const handleUpdateUser = async (updatedUser: User) => {
    await dataService.updateUser(updatedUser);
  };

  const handleDeleteUser = async (id: string) => {
    if (window.confirm("¿Está seguro de eliminar este usuario?")) {
      await dataService.deleteUser(id);
    }
  };

  const [activeView, setActiveView] = useState('dashboard');

  if (isLoading) {
    return (
      <div className="flex flex-col h-screen items-center justify-center bg-slate-50 text-slate-500 font-medium space-y-4">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-red-700"></div>
        <p>Conectando con {USE_CLOUD_DB ? 'Firebase Cloud' : 'Datos Locales'}...</p>
      </div>
    );
  }

  if (dbError && USE_CLOUD_DB) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
        <div className="bg-white max-w-lg w-full rounded-2xl shadow-xl overflow-hidden border border-red-100">
          <div className="bg-red-600 p-6 text-white text-center">
             <Database size={48} className="mx-auto mb-2 opacity-90" />
             <h2 className="text-2xl font-bold">Falta Base de Datos</h2>
             <p className="text-red-100 mt-1 text-sm">El sistema está configurado pero no encuentra la base de datos.</p>
          </div>
           <div className="p-8 space-y-6">
             <p className="text-slate-600">Por favor, habilita Firestore en la consola de Firebase.</p>
             <button 
              onClick={() => window.location.reload()}
              className="bg-slate-800 hover:bg-slate-900 text-white font-bold py-3 px-6 rounded-lg w-full"
             >
               Recargar Página
             </button>
           </div>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <Login onLogin={handleLogin} companyLogo={companyLogo} users={users} />
    );
  }

  const renderContent = () => {
    switch (activeView) {
      case 'dashboard':
        return <Dashboard />;
      case 'evidence-dashboard':
        return (
          <EvidenceDashboard 
            activities={activities}
            currentUser={currentUser}
            onUpdateActivity={handleUpdateActivity}
          />
        );
      case 'norms':
        return (
          <StandardManager 
            standards={standards} 
            onUpdateStandard={handleUpdateStandard}
            currentUser={currentUser}
          />
        );
      case 'requirements':
        return (
          <RequirementsManager 
            activities={activities}
            onAdd={handleAddActivity}
            onUpdate={handleUpdateActivity}
            onDelete={handleDeleteActivity}
          />
        );
      case 'users':
        return (
          <UserManagement 
             users={users}
             onAddUser={handleAddUser}
             onUpdateUser={handleUpdateUser}
             onDeleteUser={handleDeleteUser}
          />
        );
      case 'settings':
        return (
          <SystemSettings 
            currentLogo={companyLogo}
            onLogoChange={handleLogoChange}
          />
        );
      case 'iso9001':
        return (
          <StandardView 
            standard={StandardType.ISO9001} 
            activities={activities} 
            onUpdateActivity={handleUpdateActivity}
            currentYear={currentYear}
            setCurrentYear={setCurrentYear}
            currentUser={currentUser}
          />
        );
      case 'sgsst':
        return (
          <StandardView 
            standard={StandardType.SGSST} 
            activities={activities} 
            onUpdateActivity={handleUpdateActivity}
            currentYear={currentYear}
            setCurrentYear={setCurrentYear}
            currentUser={currentUser}
          />
        );
      case 'fsc':
        return (
          <StandardView 
            standard={StandardType.FSC} 
            activities={activities} 
            onUpdateActivity={handleUpdateActivity}
            currentYear={currentYear}
            setCurrentYear={setCurrentYear}
            currentUser={currentUser}
          />
        );
      default:
        return <Dashboard />;
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
    >
      {renderContent()}
    </Layout>
  );
}

export default App;
