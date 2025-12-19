
import React, { useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  PieChart, Pie, Cell, ComposedChart, Area as AreaChart, Line
} from 'recharts';
import { 
  TrendingDown, TrendingUp, AlertTriangle, CheckCircle2, 
  ClipboardList, ShieldCheck, Factory, Target, Info
} from 'lucide-react';
import { Activity, Area, Plant, MonthlyExecution } from '../types';
import { MONTHS } from '../constants';

interface DashboardProps {
  activities: Activity[];
  areas: Area[];
  plants: Plant[];
}

const COLORS = ['#1e293b', '#b91c1c', '#2563eb', '#059669', '#d97706', '#7c3aed'];

const KPICard = ({ title, value, subtext, icon: Icon, trend, colorClass }: any) => (
  <div className="bg-white p-3 rounded-[1.2rem] shadow-sm border border-slate-100 flex items-center justify-between transition-all hover:shadow-md">
    <div>
      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{title}</p>
      <h3 className="text-xl font-black text-slate-900 tracking-tight">{value}</h3>
      <div className={`flex items-center mt-0.5 text-[7px] font-black uppercase tracking-wider ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
        {trend === 'up' ? <TrendingUp size={10} className="mr-1" /> : <TrendingDown size={10} className="mr-1" />}
        {subtext}
      </div>
    </div>
    <div className={`p-2 rounded-xl ${colorClass}`}>
      <Icon size={16} />
    </div>
  </div>
);

export const Dashboard: React.FC<DashboardProps> = ({ activities, areas, plants }) => {
  const currentYear = 2025;
  const currentMonth = new Date().getMonth();

  const stats = useMemo(() => {
    let totalPlanned = 0;
    let totalApproved = 0;
    let criticalCount = 0;

    const areaMap: Record<string, any> = {};
    const normMap: Record<string, any> = {};
    const plantDataMap: Record<string, { planned: number; approved: number }> = {};
    const monthlyData = MONTHS.map(m => ({ month: m, plan: 0, real: 0 }));

    plants.forEach(p => {
      plantDataMap[p.id.toUpperCase()] = { planned: 0, approved: 0 };
    });

    activities.forEach(activity => {
      const plan = activity.plans?.[currentYear] || [];
      if (!areaMap[activity.responsibleArea]) {
        areaMap[activity.responsibleArea] = { name: activity.responsibleArea, planned: 0, approved: 0 };
      }
      activity.standards.forEach(std => {
        if (!normMap[std]) normMap[std] = { name: std, planned: 0, approved: 0 };
      });
      plan.forEach((m: MonthlyExecution, idx: number) => {
        if (m.planned) {
          totalPlanned++;
          areaMap[activity.responsibleArea].planned++;
          activity.standards.forEach(std => normMap[std].planned++);
          activity.plantIds.forEach(pid => {
            const normalizedId = pid.toUpperCase();
            if (plantDataMap[normalizedId]) plantDataMap[normalizedId].planned++;
          });
          monthlyData[idx].plan++;
          if (m.evidence?.status === 'APPROVED') {
            totalApproved++;
            areaMap[activity.responsibleArea].approved++;
            activity.standards.forEach(std => normMap[std].approved++);
            activity.plantIds.forEach(pid => {
              const normalizedId = pid.toUpperCase();
              if (plantDataMap[normalizedId]) plantDataMap[normalizedId].approved++;
            });
            monthlyData[idx].real++;
          } else if (idx <= currentMonth) {
            criticalCount++;
          }
        }
      });
    });

    const areaStats = Object.values(areaMap).map((a: any) => ({
      name: a.name,
      cumplimiento: a.planned > 0 ? Math.round((a.approved / a.planned) * 100) : 0
    })).sort((a, b) => b.cumplimiento - a.cumplimiento);

    const normStats = Object.values(normMap).map((n: any) => ({
      name: n.name.split(' ')[0], 
      value: n.planned > 0 ? Math.round((n.approved / n.planned) * 100) : 0
    }));

    const plantStats = plants.map(p => {
      const data = plantDataMap[p.id.toUpperCase()] || { planned: 0, approved: 0 };
      return {
        name: p.name,
        cumplimiento: data.planned > 0 ? Math.round((data.approved / data.planned) * 100) : 0,
        isMain: p.isMain
      };
    }).sort((a, b) => b.cumplimiento - a.cumplimiento);

    const compliance = totalPlanned > 0 ? Math.round((totalApproved / totalPlanned) * 100) : 0;
    const deterioration = Math.max(0, 100 - compliance);

    return { compliance, criticalCount, deterioration, evidenceTotal: `${totalApproved}/${totalPlanned}`, areaStats, normStats, plantStats, monthlyData };
  }, [activities, plants, currentMonth]);

  return (
    <div className="flex flex-col gap-3 h-[calc(100vh-100px)] overflow-hidden">
      {/* Resumen de Auditoria - Compacto */}
      <div className="bg-slate-900 text-white p-4 rounded-[1.5rem] shadow-xl relative overflow-hidden border-l-[8px] border-red-600 shrink-0">
        <div className="relative z-10">
          <div className="flex items-center mb-1">
            <div className="bg-red-600 p-1 rounded-lg mr-3">
              <ShieldCheck size={16} className="text-white" />
            </div>
            <h2 className="text-sm font-black tracking-tight uppercase">Resumen de Auditoría Interna</h2>
            <span className="ml-3 px-2 py-0.5 bg-red-600 text-[7px] font-black rounded-full uppercase tracking-widest animate-pulse">Prioritario</span>
          </div>
          <p className="text-slate-400 max-w-5xl leading-tight text-[11px] font-medium italic">
            Bienvenido al panel integral de <strong className="text-white">Central de Maderas</strong>. Actualmente, el cumplimiento global es del <span className="text-white font-black text-lg">{stats.compliance}%</span>. 
            Se requiere atención en <strong className="text-red-400">Compras</strong> e <strong className="text-red-400">Inventarios</strong>.
          </p>
        </div>
        <div className="absolute right-0 top-0 h-full w-1/4 bg-gradient-to-l from-red-600/10 to-transparent skew-x-12 translate-x-20"></div>
      </div>

      {/* KPI Row - Compacto */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 shrink-0">
        <KPICard title="Cumplimiento Global" value={`${stats.compliance}%`} subtext="+5.2% vs mes anterior" icon={CheckCircle2} trend="up" colorClass="bg-green-50 text-green-600" />
        <KPICard title="Actividades Críticas" value={stats.criticalCount} subtext="Revisar vencimientos" icon={AlertTriangle} trend="down" colorClass="bg-red-50 text-red-600" />
        <KPICard title="Deterioro del Sistema" value={`${stats.deterioration}%`} subtext="Vs Línea Base" icon={TrendingDown} trend="down" colorClass="bg-orange-50 text-orange-600" />
        <KPICard title="Evidencias Cargadas" value={stats.evidenceTotal} subtext="En proceso" icon={ClipboardList} trend="up" colorClass="bg-blue-50 text-blue-600" />
      </div>

      {/* Main Charts Grid - Expandido */}
      <div className="grid grid-cols-12 gap-3 flex-1 min-h-0">
        <div className="col-span-12 lg:col-span-7 bg-white p-4 rounded-[1.5rem] shadow-sm border border-slate-200 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[10px] font-black text-slate-800 flex items-center uppercase tracking-widest">
              <div className="w-1 h-4 bg-red-600 rounded-full mr-2"></div>
              Cumplimiento por Área
            </h3>
          </div>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.areaStats} layout="vertical" margin={{ left: 5, right: 30 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" domain={[0, 100]} hide />
                <YAxis dataKey="name" type="category" width={80} stroke="#475569" fontSize={8} fontWeight={900} />
                <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '8px', border: 'none', fontSize: '10px'}} />
                <Bar dataKey="cumplimiento" name="Cumplimiento %" radius={[0, 4, 4, 0]} barSize={12}>
                  {stats.areaStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.cumplimiento < 80 ? '#ef4444' : '#22c55e'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-5 bg-white p-4 rounded-[1.5rem] shadow-sm border border-slate-200 flex flex-col">
          <h3 className="text-[10px] font-black text-slate-800 mb-3 flex items-center uppercase tracking-widest">
            <div className="w-1 h-4 bg-slate-800 rounded-full mr-2"></div>
            Evolución y Deterioro
          </h3>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={stats.monthlyData.slice(0, 6)}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={8} fontWeight={700} />
                <YAxis stroke="#94a3b8" fontSize={8} fontWeight={700} />
                <Tooltip contentStyle={{borderRadius: '8px', border: 'none', fontSize: '10px'}} />
                <Legend iconType="circle" wrapperStyle={{fontSize: '8px', fontWeight: 900}} />
                <AreaChart type="monotone" dataKey="plan" name="Planificado" fill="#f1f5f9" stroke="#cbd5e1" />
                <Line type="monotone" dataKey="real" name="Ejecutado" stroke="#b91c1c" strokeWidth={2} dot={{r: 3, fill: '#b91c1c'}} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-4 bg-white p-4 rounded-[1.5rem] shadow-sm border border-slate-200 flex flex-col">
          <h3 className="text-[10px] font-black text-slate-800 mb-2 flex items-center uppercase tracking-widest">
            <Target size={12} className="mr-2 text-blue-600" />
            Por Norma
          </h3>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={stats.normStats} innerRadius={35} outerRadius={50} paddingAngle={5} dataKey="value" nameKey="name">
                  {stats.normStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{fontSize: '7px', fontWeight: 900}} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-8 bg-white p-4 rounded-[1.5rem] shadow-sm border border-slate-200 flex flex-col">
          <h3 className="text-[10px] font-black text-slate-800 mb-2 flex items-center uppercase tracking-widest">
            <Factory size={12} className="mr-2 text-red-600" />
            Rendimiento por Planta
          </h3>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.plantStats} margin={{bottom: 10}}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={8} fontWeight={900} />
                <YAxis hide domain={[0, 100]} />
                <Tooltip cursor={{fill: 'transparent'}} />
                <Bar dataKey="cumplimiento" name="Cumplimiento %" radius={[4, 4, 0, 0]} barSize={24}>
                   {stats.plantStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.isMain ? '#ef4444' : entry.cumplimiento < 70 ? '#f59e0b' : '#3b82f6'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
