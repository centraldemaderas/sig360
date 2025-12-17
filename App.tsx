import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { StandardView } from './components/StandardView';
import { RequirementsManager } from './components/RequirementsManager';
import { Login } from './components/Login';
import { UserManagement } from './components/UserManagement';
import { SystemSettings } from './components/SystemSettings';
import { StandardType, Activity, User } from './types';
import { dataService } from './services/dataService';
import { USE_CLOUD_DB } from './firebaseConfig';
import { Database, AlertTriangle, ExternalLink } from 'lucide-react';

function App() {
  // Authentication State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  // App Config State
  const [companyLogo, setCompanyLogo] = useState<string | null>(() => {
    const savedLogo = localStorage.getItem('company_logo');
    return savedLogo || null;
  });

  // Data State
  const [activities, setActivities] = useState<Activity[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dbError, setDbError] = useState<string | null>(null);
  const [isCloudConnected, setIsCloudConnected] = useState(false);
  
  // Year State
  const [currentYear, setCurrentYear] = useState<number>(2025);

  // --- DATA SUBSCRIPTIONS ---
  useEffect(() => {
    // Subscribe to Activities with Error Handling
    const unsubscribeActivities = dataService.subscribeToActivities(
      (data) => {
        setActivities(data);
        setIsLoading(false);
        setDbError(null); // Clear error if successful
        if (USE_CLOUD_DB) setIsCloudConnected(true);
      },
      (error) => {
        setIsLoading(false);
        if (USE_CLOUD_DB) setIsCloudConnected(false);
        // Detect common Firestore errors
        if (error?.code === 'permission-denied' || error?.code === 'not-found' || error?.code === 'failed-precondition') {
           setDbError("No se pudo conectar a la base de datos.");
        } else {
           setDbError("Error de conexión: " + error.message);
        }
      }
    );

    // Subscribe to Users
    const unsubscribeUsers = dataService.subscribeToUsers((data) => {
      setUsers(data);
    });

    // Helper for LocalStorage events (hybrid support)
    const handleLocalChange = () => {
      if (!USE_CLOUD_DB) {
         setIsCloudConnected(false);
         const localActs = localStorage.getItem('app_activities');
         if(localActs) setActivities(JSON.parse(localActs));
         
         const localUsers = localStorage.getItem('app_users');
         if(localUsers) setUsers(JSON.parse(localUsers));
      }
    };
    window.addEventListener('local-data-changed', handleLocalChange);

    return () => {
      unsubscribeActivities();
      unsubscribeUsers();
      window.removeEventListener('local-data-changed', handleLocalChange);
    };
  }, []);

  const handleLogoChange = (logo: string | null) => {
    setCompanyLogo(logo);
    if (logo) {
      localStorage.setItem('company_logo', logo);
    } else {
      localStorage.removeItem('company_logo');
    }
  };

  // --- Auth Handlers ---
  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setActiveView('dashboard');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setActiveView('dashboard');
  };

  // --- CRUD Handlers ---
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

  // --- LOADING SCREEN ---
  if (isLoading) {
    return <div className="flex h-screen items-center justify-center bg-slate-50 text-slate-500 font-medium">Cargando sistema...</div>;
  }

  // --- DB SETUP GUIDE SCREEN (If DB is missing) ---
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
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg flex items-start">
              <AlertTriangle className="text-amber-600 mr-3 mt-0.5 flex-shrink-0" size={20} />
              <p className="text-sm text-amber-800">
                Firebase está conectado, pero Firestore (la base de datos) no está creada o no tiene permisos.
              </p>
            </div>

            <div className="space-y-4">
               <h3 className="font-bold text-slate-800 border-b pb-2">Pasos para corregirlo (En tu navegador):</h3>
               <ol className="list-decimal pl-5 text-slate-600 space-y-3 text-sm">
                 <li>Ve a la <strong>Consola de Firebase</strong> (donde te registraste).</li>
                 <li>En el menú izquierdo, haz clic en <strong>Compilación (Build)</strong>.</li>
                 <li>Selecciona <strong>Firestore Database</strong>.</li>
                 <li>Haz clic en el botón <strong>"Crear base de datos"</strong>.</li>
                 <li>
                   <strong>MUY IMPORTANTE:</strong> Cuando te pregunte por las Reglas de Seguridad, selecciona 
                   <span className="font-bold text-slate-900 bg-slate-200 px-1 mx-1 rounded">Comenzar en modo de prueba</span> 
                   (Start in test mode).
                 </li>
                 <li>Haz clic en "Crear" o "Habilitar".</li>
               </ol>
            </div>

            <div className="text-center pt-2">
               <button 
                onClick={() => window.location.reload()}
                className="bg-slate-800 hover:bg-slate-900 text-white font-bold py-3 px-6 rounded-lg transition-colors w-full"
               >
                 Ya la creé, Recargar Página
               </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- LOGIN SCREEN ---
  if (!currentUser) {
    return (
      <>
        {!USE_CLOUD_DB && (
          <div className="bg-yellow-100 text-yellow-800 text-xs text-center p-1 fixed top-0 w-full z-50">
            Modo Local: Los datos no se sincronizan entre dispositivos. Configura Firebase para habilitar la Nube.
          </div>
        )}
        <Login onLogin={handleLogin} companyLogo={companyLogo} users={users} />
      </>
    );
  }

  // --- MAIN APP ---
  const renderContent = () => {
    switch (activeView) {
      case 'dashboard':
        return <Dashboard />;
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