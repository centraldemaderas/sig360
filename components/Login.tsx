import React, { useState } from 'react';
import { Lock, User } from 'lucide-react';
import { User as UserType } from '../types';

interface LoginProps {
  onLogin: (user: UserType) => void;
  companyLogo?: string | null;
  users: UserType[]; // Receive the current list of users from App state
}

export const Login: React.FC<LoginProps> = ({ onLogin, companyLogo, users }) => {
  const [email, setEmail] = useState('admin@centralmaderas.com');
  const [password, setPassword] = useState('123');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Validate against the dynamic 'users' prop, not the static constant
    const user = users.find(u => u.email === email && u.password === password);
    
    if (user) {
      onLogin(user);
    } else {
      setError('Credenciales inválidas o usuario no encontrado.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decorative Element */}
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-slate-100 to-slate-200"></div>
      <div className="absolute right-0 top-0 w-1/2 h-full bg-red-700 opacity-5 transform skew-x-[-10deg] translate-x-20"></div>

      <div className="bg-white rounded-2xl shadow-xl p-10 w-full max-w-md relative z-10 border border-slate-200">
        <div className="text-center mb-10">
          <div className="flex justify-center mb-6 h-24 items-center">
            {companyLogo ? (
              <img src={companyLogo} alt="Logo Empresa" className="max-h-full max-w-full object-contain" />
            ) : (
              /* Custom SVG Logo for Central de Maderas */
              <svg viewBox="0 0 320 100" className="h-24 w-auto">
                <g strokeLinecap="round" strokeLinejoin="round" fill="none">
                  {/* Chevron 1 - Red (Left) */}
                  <path d="M 20 70 L 45 35 L 70 70" stroke="#B91C1C" strokeWidth="10" />
                  {/* Chevron 2 - Black (Middle) */}
                  <path d="M 45 70 L 70 35 L 95 70" stroke="#1F2937" strokeWidth="10" />
                  {/* Chevron 3 - Red (Right) */}
                  <path d="M 70 70 L 95 35 L 120 70" stroke="#B91C1C" strokeWidth="10" />
                  {/* Diamond - Black (Under 3rd chevron) */}
                  <rect x="88" y="60" width="14" height="14" transform="rotate(45 95 67)" fill="#1F2937" stroke="none" />
                </g>
                {/* Text */}
                <g fontFamily="sans-serif">
                  <text x="135" y="65" fontSize="24" fontWeight="800" fill="#1F2937">Central de Maderas</text>
                  <text x="180" y="88" fontSize="18" fontWeight="500" fill="#4B5563" letterSpacing="0.05em">G&S SAS</text>
                </g>
              </svg>
            )}
          </div>
          <h2 className="text-2xl font-bold text-slate-800">Bienvenido</h2>
          <p className="text-slate-500 mt-2">Sistema Integrado de Gestión (SIG)</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          {error && (
            <div className="bg-red-50 text-red-700 p-4 rounded-xl text-sm text-center border border-red-100 font-medium">
              {error}
            </div>
          )}
          
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Correo Electrónico</label>
            <div className="relative group">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 group-focus-within:text-red-600 transition-colors" size={20} />
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-600 focus:border-red-600 outline-none transition-all bg-slate-50 focus:bg-white"
                placeholder="usuario@centralmaderas.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Contraseña</label>
            <div className="relative group">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 group-focus-within:text-red-600 transition-colors" size={20} />
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-600 focus:border-red-600 outline-none transition-all bg-slate-50 focus:bg-white"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="w-full bg-gradient-to-r from-red-700 to-red-600 hover:from-red-800 hover:to-red-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg hover:shadow-red-700/30 transform hover:-translate-y-0.5"
          >
            INGRESAR
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-400">
            © 2025 Central de Maderas G&S SAS<br/>
            Gestión de Calidad, Seguridad y Medio Ambiente
          </p>
        </div>
      </div>
    </div>
  );
};