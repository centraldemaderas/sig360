import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  LineChart, Line, ComposedChart, Area, Cell
} from 'recharts';
import { TrendingDown, TrendingUp, AlertTriangle, CheckCircle2, ClipboardList } from 'lucide-react';
import { MOCK_AREA_STATS } from '../constants';

const KPICard = ({ title, value, subtext, icon: Icon, trend }: any) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-start justify-between transition-shadow hover:shadow-md">
    <div>
      <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
      <h3 className="text-2xl font-bold text-slate-800">{value}</h3>
      <div className={`flex items-center mt-2 text-xs font-medium ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
        {trend === 'up' ? <TrendingUp size={14} className="mr-1" /> : <TrendingDown size={14} className="mr-1" />}
        {subtext}
      </div>
    </div>
    <div className={`p-3 rounded-lg ${trend === 'up' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
      <Icon size={24} />
    </div>
  </div>
);

export const Dashboard: React.FC = () => {
  // Sort by lowest compliance to highlight problem areas
  const sortedData = [...MOCK_AREA_STATS].sort((a, b) => a.compliancePercentage - b.compliancePercentage);

  return (
    <div className="space-y-6">
      {/* Intro Section - The "Auditor" Summary */}
      <div className="bg-zinc-900 text-white p-6 rounded-xl shadow-lg relative overflow-hidden border-l-4 border-red-600">
        <div className="relative z-10">
          <div className="flex items-center mb-2">
            <h2 className="text-2xl font-bold">Resumen de Auditoría Interna</h2>
            <span className="ml-3 px-2 py-0.5 bg-red-600 text-xs font-bold rounded uppercase tracking-wider">Prioritario</span>
          </div>
          <p className="text-zinc-300 max-w-3xl leading-relaxed">
            Bienvenido al panel de control integral de <strong className="text-white">Central de Maderas</strong>. 
            Actualmente, el sistema muestra un cumplimiento global del <span className="font-bold text-white text-lg">85%</span>. 
            Se requiere atención inmediata en las áreas de <span className="text-red-400 font-semibold border-b border-red-400/50">Compras</span> y <span className="text-yellow-400 font-semibold border-b border-yellow-400/50">Inventarios</span> para mantener la conformidad con la norma ISO 9001.
          </p>
        </div>
        {/* Abstract shapes for branding feel */}
        <div className="absolute right-0 top-0 h-full w-64 bg-gradient-to-l from-red-900/40 to-transparent transform skew-x-12"></div>
        <div className="absolute right-10 top-[-50%] h-[200%] w-20 bg-zinc-800/30 transform rotate-12"></div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard 
          title="Cumplimiento Global ISO 9001" 
          value="85.0%" 
          subtext="+5.2% vs mes anterior" 
          icon={CheckCircle2} 
          trend="up" 
        />
        <KPICard 
          title="Actividades Críticas" 
          value="12" 
          subtext="3 Vencidas esta semana" 
          icon={AlertTriangle} 
          trend="down" 
        />
        <KPICard 
          title="Deterioro del Sistema" 
          value="4.1%" 
          subtext="Desviación vs Línea Base" 
          icon={TrendingDown} 
          trend="down" 
        />
        <KPICard 
          title="Evidencias Cargadas" 
          value="148/163" 
          subtext="90% Documentación lista" 
          icon={ClipboardList} 
          trend="up" 
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Compliance by Area */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
            <span className="w-1.5 h-6 bg-red-600 rounded-sm mr-2"></span>
            Cumplimiento por Área
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sortedData} layout="vertical" margin={{ left: 40 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                <XAxis type="number" domain={[0, 100]} stroke="#64748b" />
                <YAxis dataKey="name" type="category" width={100} stroke="#64748b" style={{ fontSize: '12px', fontWeight: 500 }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  cursor={{ fill: '#f1f5f9' }}
                />
                <Bar dataKey="compliancePercentage" name="Cumplimiento %" radius={[0, 4, 4, 0]}>
                  {sortedData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.compliancePercentage < 80 ? '#dc2626' : '#16a34a'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Evolution/Deterioration Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
            <span className="w-1.5 h-6 bg-zinc-600 rounded-sm mr-2"></span>
            Evolución y Deterioro (Últimos 6 meses)
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={[
                { month: 'Ene', plan: 10, real: 10, deterioration: 0 },
                { month: 'Feb', plan: 25, real: 24, deterioration: 1 },
                { month: 'Mar', plan: 45, real: 40, deterioration: 5 },
                { month: 'Abr', plan: 60, real: 55, deterioration: 5 },
                { month: 'May', plan: 75, real: 70, deterioration: 5 },
                { month: 'Jun', plan: 90, real: 85, deterioration: 5 },
              ]}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="plan" name="Planificado" fill="#f4f4f5" stroke="#71717a" />
                <Line type="monotone" dataKey="real" name="Ejecutado" stroke="#dc2626" strokeWidth={2} />
                <Line type="monotone" dataKey="deterioration" name="Brecha (Deterioro)" stroke="#f59e0b" strokeDasharray="5 5" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};