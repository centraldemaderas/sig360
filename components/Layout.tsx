
import React, { useState, useEffect } from 'react';
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
  Sliders,
  CloudLightning,
  HardDrive,
  BookOpen,
  AlertOctagon,
  X,
  Check,
  Mail,
  BellRing,
  Trash2,
  Clock,
  Briefcase,
  ChevronDown,
  ChevronUp,
  Shield,
  Truck
} from 'lucide-react';
import { User, UserRole, Notification, StandardDefinition } from '../types';
import { dataService } from '../services/dataService';

interface LayoutProps {
  children: React.ReactNode;
  activeView: string;
  setActiveView: (view: string) => void;
  currentUser: User;
  onLogout: () => void;
  companyLogo?: string | null;
  isCloudConnected?: boolean;
  standards: StandardDefinition[];
}

export const Layout: React.FC<LayoutProps> = ({ 
  children, 
  activeView, 
  setActiveView, 
  currentUser, 
  onLogout, 
  companyLogo,
  isCloudConnected = false,
  standards
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(typeof window !== 'undefined' ? window.innerWidth >= 1024 : false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isAdminExpanded, setIsAdminExpanded] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const unsub = dataService.subscribeToNotifications(currentUser.id, (data) => {
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.read).length);
    });
    return () => unsub();
  }, [currentUser.id]);

  const handleMarkRead = async (notif: Notification) => {
    if (!notif.read) {
      await dataService.markNotificationAsRead(notif.id, currentUser.id);
    }
  };

  const getStandardIcon = (type: string) => {
    const t = type.toLowerCase();
    if (t.includes('9001')) return FileText;
    if (t.includes('sst')) return ShieldCheck;
    if (t.includes('fsc')) return TreePine;
    if (t.includes('vial') || t.includes('pesv')) return Truck;
    return Briefcase;
  };

  // Main items: Dashboard + Dynamic Standards
  const mainItems = [
    { id: 'dashboard', label: 'Tablero de Control', icon: LayoutDashboard },
    ...standards.map(std => ({
      id: `std-${std.type}`,
      label: std.type,
      icon: getStandardIcon(std.type)
    }))
  ];

  const managementItems = [
     { id: 'evidence-dashboard', label: 'Hallazgos y Evidencias', icon: AlertOctagon },
  ];

  const adminItems = [
    { id: 'norms', label: 'Gestión de Normas', icon: BookOpen },
    { id: 'requirements', label: 'Requisitos y Matriz', icon: Settings },
    { id: 'users', label: 'Usuarios', icon: Users },
    { id: 'settings', label: 'Configuración Global', icon: Sliders },
  ];

  const isAdmin = currentUser.role === UserRole.ADMIN;

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <aside 
        className={`${
          isSidebarOpen ? 'w-64' : 'w-20'
        } bg-white transition-all duration-300 flex flex-col shadow-xl z-[1000] border-r border-slate-200`}
      >
        <div className="h-28 flex items-center justify-center border-b border-slate-100 p-2 overflow-hidden bg-slate-50/30">
          {isSidebarOpen ? (
            companyLogo ? (
              <img src={companyLogo} alt="Company Logo" className="h-20 object-contain transition-all duration-300" />
            ) : (
              <svg viewBox="0 0 280 80" className="h-16 w-auto transition-all duration-300">
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
             companyLogo ? (
               <img src={companyLogo} alt="Logo" className="h-14 w-14 object-contain rounded transition-all" />
             ) : (
                <svg viewBox="0 0 100 80" className="h-14 w-auto transition-all">
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

        <div className="flex justify-end px-4 py-2 shrink-0 border-b border-slate-50">
           <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-lg transition-colors shadow-sm"
          >
            <Menu size={20} />
          </button>
        </div>

        <nav className="flex-1 py-4 flex flex-col overflow-y-auto scrollbar-thin px-3">
          <ul className="space-y-1 mb-6">
            {mainItems.map((item) => (
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

          <ul className="space-y-1 border-t border-slate-100 pt-4 mb-4">
             <li className="px-2 pb-2">
                {isSidebarOpen && <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-2">Gestión Operativa</span>}
              </li>
              {managementItems.map((item) => (
                <li key={item.id}>
                  <button
                    onClick={() => setActiveView(item.id)}
                    className={`w-full flex items-center px-3 py-3 rounded-xl transition-all relative group font-medium ${
                      activeView === item.id 
                        ? 'bg-amber-100 text-amber-900 shadow-sm' 
                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <item.icon 
                      size={22} 
                      className={`min-w-[22px] transition-colors ${
                        activeView === item.id ? 'text-amber-700' : 'text-slate-400 group-hover:text-amber-600'
                      }`} 
                    />
                    {isSidebarOpen && (
                      <span className="ml-3 text-sm truncate">{item.label}</span>
                    )}
                  </button>
                </li>
              ))}
          </ul>

          {isAdmin && (
            <div className="border-t border-slate-100 pt-4 mt-2">
              <button 
                onClick={() => setIsAdminExpanded(!isAdminExpanded)}
                className={`w-full flex items-center justify-between px-3 py-3 rounded-xl transition-all group font-bold text-slate-600 hover:bg-slate-50 ${isAdminExpanded ? 'text-slate-900' : ''}`}
              >
                <div className="flex items-center">
                  <Shield size={22} className={`min-w-[22px] ${isAdminExpanded ? 'text-slate-900' : 'text-slate-400 group-hover:text-slate-900'}`} />
                  {isSidebarOpen && <span className="ml-3 text-sm uppercase tracking-wider text-[11px]">Administración</span>}
                </div>
                {isSidebarOpen && (
                  isAdminExpanded ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />
                )}
              </button>
              
              <div className={`mt-1 space-y-1 overflow-hidden transition-all duration-300 ${isAdminExpanded ? 'max-h-64 opacity-100' : 'max-h-0 opacity-0'}`}>
                {adminItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveView(item.id)}
                    className={`w-full flex items-center px-3 py-2.5 rounded-xl transition-all relative group font-medium ${
                      activeView === item.id 
                        ? 'bg-slate-800 text-white shadow-md' 
                        : 'text-slate-500 hover:bg-slate-100/50 hover:text-slate-900'
                    } ${isSidebarOpen ? 'ml-4 w-[calc(100%-1rem)]' : ''}`}
                  >
                    <item.icon 
                      size={18} 
                      className={`min-w-[18px] transition-colors ${
                        activeView === item.id ? 'text-white' : 'text-slate-400 group-hover:text-slate-800'
                      }`} 
                    />
                    {isSidebarOpen && (
                      <span className="ml-3 text-xs truncate">{item.label}</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </nav>

        <div className="p-4 border-t border-slate-100 bg-slate-50/50 shrink-0">
          <div className="flex items-center justify-between">
            <button 
              onClick={() => setActiveView('users')}
              className="flex items-center space-x-3 overflow-hidden group hover:opacity-80 transition-opacity flex-1"
            >
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-slate-400 border border-slate-200 shadow-sm group-hover:border-blue-400 group-hover:text-blue-500 transition-all">
                <UserCircle size={24} />
              </div>
              {isSidebarOpen && (
                <div className="flex flex-col overflow-hidden text-left">
                  <span className="text-sm font-bold truncate text-slate-700 group-hover:text-blue-600">{currentUser.name}</span>
                  <span className="text-[10px] text-slate-500 truncate uppercase tracking-wide">{currentUser.role}</span>
                </div>
              )}
            </button>
            {isSidebarOpen && (
              <button 
                onClick={onLogout}
                className="text-slate-400 hover:text-red-600 p-2 hover:bg-white rounded-lg transition-all shadow-sm ml-2" 
                title="Cerrar Sesión"
              >
                <LogOut size={18} />
              </button>
            )}
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden relative bg-slate-50">
        <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-6 z-[2000] sticky top-0 shadow-sm overflow-visible">
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">
              {[...mainItems, ...managementItems, ...adminItems].find(n => n.id === activeView)?.label || 'Sistema de Gestión'}
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            <div className="hidden md:flex flex-col items-end mr-2">
               <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-0.5">Estado de Conexión</span>
               {isCloudConnected ? (
                 <span className="flex items-center text-green-600 font-bold text-sm bg-green-50 px-2 py-0.5 rounded-full border border-green-100">
                   <CloudLightning size={14} className="mr-1.5" />
                   NUBE ACTIVA
                 </span>
               ) : (
                 <span className="flex items-center text-amber-600 font-bold text-sm bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
                   <HardDrive size={14} className="mr-1.5" />
                   MODO LOCAL
                 </span>
               )}
            </div>
            <div className="h-8 w-px bg-slate-200 mx-2"></div>
            
            <div className="relative">
              <button 
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                className={`relative p-2 rounded-full transition-all border ${isNotifOpen ? 'bg-red-50 border-red-200 text-red-600 shadow-inner' : 'text-slate-400 border-transparent hover:bg-slate-50 hover:text-slate-600 hover:border-slate-200'}`}
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 text-white text-[9px] font-black flex items-center justify-center rounded-full border-2 border-white shadow-sm animate-bounce">
                    {unreadCount > 9 ? '+9' : unreadCount}
                  </span>
                )}
              </button>

              {isNotifOpen && (
                <>
                  <div className="fixed inset-0 z-[2500]" onClick={() => setIsNotifOpen(false)}></div>
                  <div className="absolute right-0 mt-3 w-85 bg-white rounded-3xl shadow-2xl border border-slate-200 z-[3000] overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300 origin-top-right ring-1 ring-black/5">
                    <div className="p-5 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                      <h3 className="font-black text-slate-900 text-xs flex items-center uppercase tracking-widest">
                        <BellRing size={16} className="mr-2 text-red-600" />
                        Notificaciones
                      </h3>
                      <button onClick={() => setIsNotifOpen(false)} className="p-1 hover:bg-slate-200 rounded-full transition-colors text-slate-400 hover:text-slate-900">
                        <X size={18} />
                      </button>
                    </div>
                    <div className="max-h-[70vh] overflow-y-auto scrollbar-thin">
                      {notifications.length > 0 ? (
                        <div className="divide-y divide-slate-100">
                          {notifications.map(notif => (
                            <div 
                              key={notif.id} 
                              onClick={() => { handleMarkRead(notif); }}
                              className={`p-5 hover:bg-slate-50 transition-all cursor-pointer relative group ${!notif.read ? 'bg-blue-50/40' : ''}`}
                            >
                              {!notif.read && <div className="absolute left-1.5 top-5 w-1.5 h-10 bg-blue-600 rounded-full shadow-sm"></div>}
                              <div className="flex justify-between items-start mb-1.5">
                                <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded border ${
                                  notif.type === 'REJECTION' ? 'bg-orange-100 text-orange-800 border-orange-200' :
                                  notif.type === 'APPROVAL' ? 'bg-green-100 text-green-800 border-green-200' :
                                  notif.type === 'NEW_UPLOAD' ? 'bg-blue-100 text-blue-800 border-blue-200' : 'bg-slate-100 text-slate-700 border-slate-200'
                                }`}>
                                  {notif.type}
                                </span>
                                <span className="text-[9px] text-slate-400 flex items-center font-bold">
                                  <Clock size={10} className="mr-1" />
                                  {notif.date.split(',')[0]}
                                </span>
                              </div>
                              <h4 className={`text-xs font-black leading-tight ${!notif.read ? 'text-slate-900' : 'text-slate-600'}`}>{notif.title}</h4>
                              <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed line-clamp-2 font-medium">{notif.message}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-14 text-center flex flex-col items-center">
                          <Check size={48} className="text-slate-100 mb-3" />
                          <p className="text-sm text-slate-400 font-bold">Bandeja de entrada vacía</p>
                        </div>
                      )}
                    </div>
                    <div className="p-4 bg-slate-50 border-t border-slate-200 text-center">
                       <button onClick={() => { setActiveView('users'); setIsNotifOpen(false); }} className="text-[10px] font-black text-blue-600 hover:text-blue-800 uppercase tracking-widest hover:underline decoration-2 underline-offset-4 transition-all">Configurar Preferencias</button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-6 scrollbar-thin z-0 bg-slate-50/30">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};
