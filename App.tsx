import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { StandardView } from './components/StandardView';
import { RequirementsManager } from './components/RequirementsManager';
import { Login } from './components/Login';
import { UserManagement } from './components/UserManagement';
import { SystemSettings } from './components/SystemSettings';
import { StandardType, Activity, User } from './types';
import { MOCK_ACTIVITIES_GERENCIA, MOCK_USERS } from './constants';

function App() {
  // Authentication State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  // Data State
  const [activeView, setActiveView] = useState('dashboard');
  const [activities, setActivities] = useState<Activity[]>(MOCK_ACTIVITIES_GERENCIA);
  const [users, setUsers] = useState<User[]>(MOCK_USERS);
  
  // Year State (New functionality for 2025/2026 toggle)
  const [currentYear, setCurrentYear] = useState<number>(2025);
  
  // App Config State - Initialize from LocalStorage
  const [companyLogo, setCompanyLogo] = useState<string | null>(() => {
    const savedLogo = localStorage.getItem('company_logo');
    return savedLogo || null;
  });

  // Handler to update Logo and LocalStorage
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

  // --- Activity Handlers ---
  const handleAddActivity = (newActivity: Activity) => {
    setActivities([...activities, newActivity]);
  };

  const handleUpdateActivity = (updatedActivity: Activity) => {
    setActivities(activities.map(act => act.id === updatedActivity.id ? updatedActivity : act));
  };

  const handleDeleteActivity = (id: string) => {
    if (window.confirm("¿Está seguro de eliminar este requisito?")) {
      setActivities(activities.filter(act => act.id !== id));
    }
  };

  // --- User Handlers ---
  const handleAddUser = (newUser: User) => {
    setUsers([...users, newUser]);
  };

  const handleUpdateUser = (updatedUser: User) => {
    setUsers(users.map(user => user.id === updatedUser.id ? updatedUser : user));
  };

  const handleDeleteUser = (id: string) => {
    if (window.confirm("¿Está seguro de eliminar este usuario?")) {
      setUsers(users.filter(user => user.id !== id));
    }
  };

  // If not logged in, show Login screen
  if (!currentUser) {
    return <Login onLogin={handleLogin} companyLogo={companyLogo} />;
  }

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
    >
      {renderContent()}
    </Layout>
  );
}

export default App;