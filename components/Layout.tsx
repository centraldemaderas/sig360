import React from 'react';
import { 
  LayoutDashboard, 
  FileText, 
  ShieldCheck, 
  TreePine, 
  Menu, 
  Bell, 
  UserCircle,
  Settings,
  Users,
  LogOut,
  Sliders
} from 'lucide-react';
import { User, UserRole } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  activeView: string;
  setActiveView: (view: string) => void;
  currentUser: User;
  onLogout: () => void;
  companyLogo?: string | null;
}

export const Layout: React.FC<LayoutProps> = ({ children, activeView, setActiveView, currentUser, onLogout, companyLogo }) => {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);

  const navItems = [
    { id: 'dashboard', label: 'Tablero de Control', icon: LayoutDashboard },
    { id: 'iso9001', label: 'ISO 9001:2015', icon: FileText },
    { id: 'sgsst', label: 'SG-SST', icon: ShieldCheck },
    { id: 'fsc', label: 'FSC', icon: TreePine },
  ];

  // Config items only for Admins
  const configItems = currentUser.role === UserRole.ADMIN ? [
    { id: 'requirements', label: 'Gestión de Requisitos', icon: Settings },
    { id: 'users', label: 'Usuarios', icon: Users },
    { id: 'settings', label: 'Configuración', icon: Sliders },
  ] : [];

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar - Changed to White to support colored Logo */}
      <aside 
        className={`${
          isSidebarOpen ? 'w-64' : 'w-20'
        } bg-white transition-all duration-300 flex flex-col shadow-xl z-20 border-r border-slate-200`}
      >
        <div className="h-20 flex items-center justify-center border-b border-slate-100 p-4 overflow-hidden">
          {isSidebarOpen ? (
            companyLogo ? (
              <img src={companyLogo} alt="Company Logo" className="h-10 object-contain transition-all duration-300" />
            ) : (
              <svg viewBox="0 0 280 80" className="h-10 w-auto transition-all duration-300">
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
            )
          ) : (
             // Icon Only for collapsed state
             companyLogo ? (
               <img src={companyLogo} alt="Logo" className="h-8 w-8 object-contain rounded" />
             ) : (
                <svg viewBox="0 0 100 80" className="h-10 w-auto">
                   <g strokeLinecap="round" strokeLinejoin="round" fill="none">
                    <path d="M 10 60 L 30 30 L 50 60" stroke="#B91C1C" strokeWidth="8" />
                    <path d="M 30 60 L 50 30 L 70 60" stroke="#1F2937" strokeWidth="8" />
                    <path d="M 50 60 L 70 30 L 90 60" stroke="#B91C1C" strokeWidth="8" />
                    <rect x="64" y="52" width="12" height="12" transform="rotate(45 70 58)" fill="#1F2937" stroke="none" />
                  </g>
                </svg>
             )
          )}
        </div>

        <div className="flex justify-end px-4 py-2">
           <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-lg transition-colors"
          >
            <Menu size={20} />
          </button>
        </div>

        <nav className="flex-1 py-4 flex flex-col justify-between overflow-y-auto scrollbar-thin px-3">
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => setActiveView(item.id)}
                  className={`w-full flex items-center px-3 py-3 rounded-xl transition-all relative group font-medium ${
                    activeView === item.id 
                      ? 'bg-red-700 text-white shadow-md shadow-red-900/10' 
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <item.icon 
                    size={22} 
                    className={`min-w-[22px] transition-colors ${
                      activeView === item.id ? 'text-white' : 'text-slate-400 group-hover:text-red-600'
                    }`} 
                  />
                  {isSidebarOpen && (
                    <span className="ml-3 text-sm truncate">{item.label}</span>
                  )}
                </button>
              </li>
            ))}
          </ul>

          {configItems.length > 0 && (
            <ul className="space-y-1 border-t border-slate-100 pt-4 mt-2">
              <li className="px-2 pb-2">
                {isSidebarOpen && <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-2">Administración</span>}
              </li>
               {configItems.map((item) => (
                <li key={item.id}>
                  <button
                    onClick={() => setActiveView(item.id)}
                    className={`w-full flex items-center px-3 py-3 rounded-xl transition-all relative group font-medium ${
                      activeView === item.id 
                        ? 'bg-slate-800 text-white shadow-md' 
                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <item.icon 
                      size={22} 
                      className={`min-w-[22px] transition-colors ${
                        activeView === item.id ? 'text-white' : 'text-slate-400 group-hover:text-slate-800'
                      }`} 
                    />
                    {isSidebarOpen && (
                      <span className="ml-3 text-sm truncate">{item.label}</span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </nav>

        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 overflow-hidden">
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-slate-400 border border-slate-200 shadow-sm">
                <UserCircle size={24} />
              </div>
              {isSidebarOpen && (
                <div className="flex flex-col overflow-hidden">
                  <span className="text-sm font-bold truncate text-slate-700">{currentUser.name}</span>
                  <span className="text-[10px] text-slate-500 truncate uppercase tracking-wide">{currentUser.role}</span>
                </div>
              )}
            </div>
            {isSidebarOpen && (
              <button 
                onClick={onLogout}
                className="text-slate-400 hover:text-red-600 p-2 hover:bg-white rounded-lg transition-all shadow-sm" 
                title="Cerrar Sesión"
              >
                <LogOut size={18} />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative bg-slate-50">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-6 z-10 sticky top-0 shadow-sm">
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">
              {navItems.find(n => n.id === activeView)?.label || configItems.find(n => n.id === activeView)?.label || 'Sistema de Gestión'}
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            <div className="hidden md:flex flex-col items-end mr-2">
               <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Estado del Sistema</span>
               <span className="flex items-center text-green-600 font-bold text-sm bg-green-50 px-2 py-0.5 rounded-full border border-green-100">
                 <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-2 animate-pulse"></span>
                 CERTIFICADO
               </span>
            </div>
            <div className="h-8 w-px bg-slate-200 mx-2"></div>
            <button className="relative p-2 text-slate-400 hover:bg-slate-50 rounded-full transition-colors hover:text-slate-600 border border-transparent hover:border-slate-200">
              <Bell size={20} />
              <span className="absolute top-1.5 right-2 w-2 h-2 bg-red-600 rounded-full border border-white"></span>
            </button>
          </div>
        </header>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-auto p-6 scrollbar-thin">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};