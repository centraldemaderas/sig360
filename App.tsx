
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
import { PlantManager } from './components/PlantManager';
import { StandardType, Activity, User, StandardDefinition, Plant } from './types';
import { dataService } from './services/dataService';
import { USE_CLOUD_DB } from './firebaseConfig';
import { Database } from 'lucide-react';

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [standards, setStandards] = useState<StandardDefinition[]>([]);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [activitiesLoaded, setActivitiesLoaded] = useState(false);
  const [usersLoaded, setUsersLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [dbError, setDbError] = useState<string | null>(null);
  const [isCloudConnected, setIsCloudConnected] = useState(false);
  const [currentYear, setCurrentYear] = useState<number>(2025);
  const [activeView, setActiveView] = useState('dashboard');

  useEffect(() => {
    if (activitiesLoaded && usersLoaded) setIsLoading(false);
  }, [activitiesLoaded, usersLoaded]);

  useEffect(() => {
    const safetyTimer = setTimeout(() => setIsLoading(false), 5000);

    const unsubscribeActivities = dataService.subscribeToActivities(
      (data) => { setActivities(data); setActivitiesLoaded(true); if (USE_CLOUD_DB) setIsCloudConnected(true); },
      (error) => { setActivitiesLoaded(true); if (USE_CLOUD_DB) setIsCloudConnected(false); if (error?.code === 'failed-precondition') setDbError("Falta base de datos."); }
    );

    const unsubscribeUsers = dataService.subscribeToUsers(data => { setUsers(data); setUsersLoaded(true); });
    const unsubscribeStandards = dataService.subscribeToStandards(data => setStandards(data));
    const unsubscribePlants = dataService.subscribeToPlants(data => setPlants(data));
    const unsubscribeSettings = dataService.subscribeToSettings(data => setCompanyLogo(data?.companyLogo || null));

    return () => {
      clearTimeout(safetyTimer);
      unsubscribeActivities();
      unsubscribeUsers();
      unsubscribeStandards();
      unsubscribePlants();
      unsubscribeSettings();
    };
  }, []);

  const handleUpdateStandard = async (std: StandardDefinition) => await dataService.updateStandard(std);
  const handleLogoChange = (logo: string | null) => setCompanyLogo(logo);
  const handleLogin = (user: User) => { setCurrentUser(user); setActiveView('dashboard'); };
  const handleLogout = () => { setCurrentUser(null); setActiveView('dashboard'); };
  const handleAddActivity = async (newActivity: Activity) => await dataService.addActivity(newActivity);
  const handleUpdateActivity = async (updatedActivity: Activity) => await dataService.updateActivity(updatedActivity);
  const handleDeleteActivity = async (id: string) => { if (window.confirm("¿Está seguro?")) await dataService.deleteActivity(id); };
  const handleAddUser = async (u: User) => await dataService.addUser(u);
  const handleUpdateUser = async (u: User) => await dataService.updateUser(u);
  const handleDeleteUser = async (id: string) => { if (window.confirm("¿Está seguro?")) await dataService.deleteUser(id); };
  const handleAddPlant = async (p: Plant) => await dataService.addPlant(p);
  const handleUpdatePlant = async (p: Plant) => await dataService.updatePlant(p);
  const handleDeletePlant = async (id: string) => { if (window.confirm("¿Desea eliminar esta planta?")) await dataService.deletePlant(id); };

  if (isLoading) return <div className="flex h-screen items-center justify-center space-y-4 flex-col"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-red-700"></div><p>Cargando...</p></div>;

  if (dbError && USE_CLOUD_DB) return <div className="flex h-screen items-center justify-center p-4 text-center flex-col"><Database size={48} className="mb-4 text-red-600" /><h2 className="text-xl font-bold">Error de Conexión</h2><button onClick={() => window.location.reload()} className="mt-4 bg-slate-800 text-white px-6 py-2 rounded-lg">Recargar</button></div>;

  if (!currentUser) return <Login onLogin={handleLogin} companyLogo={companyLogo} users={users} />;

  const renderContent = () => {
    if (activeView.startsWith('std-')) {
      const stdType = activeView.replace('std-', '');
      return <StandardView standard={stdType} activities={activities} onUpdateActivity={handleUpdateActivity} currentYear={currentYear} setCurrentYear={setCurrentYear} currentUser={currentUser} />;
    }
    switch (activeView) {
      case 'dashboard': return <Dashboard />;
      case 'evidence-dashboard': return <EvidenceDashboard activities={activities} currentUser={currentUser} onUpdateActivity={handleUpdateActivity} />;
      case 'norms': return <StandardManager standards={standards} onUpdateStandard={handleUpdateStandard} currentUser={currentUser} />;
      case 'requirements': return <RequirementsManager activities={activities} onAdd={handleAddActivity} onUpdate={handleUpdateActivity} onDelete={handleDeleteActivity} standardsList={standards} />;
      case 'plants': return <PlantManager plants={plants} onAdd={handleAddPlant} onUpdate={handleUpdatePlant} onDelete={handleDeletePlant} />;
      case 'users': return <UserManagement users={users} onAddUser={handleAddUser} onUpdateUser={handleUpdateUser} onDeleteUser={handleDeleteUser} />;
      case 'settings': return <SystemSettings currentLogo={companyLogo} onLogoChange={handleLogoChange} />;
      default: return <Dashboard />;
    }
  };

  return <Layout activeView={activeView} setActiveView={setActiveView} currentUser={currentUser} onLogout={handleLogout} companyLogo={companyLogo} isCloudConnected={isCloudConnected} standards={standards}>{renderContent()}</Layout>;
}

export default App;
