
import React, { useMemo } from 'react';
import { AdminTask, Employee, InventorySession, OvertimeRecord, SanctionRecord, User, View, CashShift } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, AreaChart, Area } from 'recharts';
import { TrendingUp, Users, Clock, DollarSign, Plus, AlertTriangle, Box, Command, CheckCircle2, ArrowRight, Wallet } from 'lucide-react';

interface DashboardProps {
  employees: Employee[];
  records: OvertimeRecord[];
  tasks: AdminTask[];
  inventory: InventorySession[];
  sanctions: SanctionRecord[];
  cashShifts?: CashShift[]; // Optional prop
  currentUser: User | null;
  setView: (view: View) => void;
}

const QuickAction = ({ icon: Icon, label, onClick }: { icon: any, label: string, onClick: () => void }) => (
    <button 
        onClick={onClick}
        className="flex flex-col items-center justify-center gap-2 bg-white dark:bg-sushi-dark border border-gray-200 dark:border-white/5 p-4 rounded-xl hover:border-sushi-gold hover:shadow-lg hover:shadow-sushi-gold/10 transition-all group"
    >
        <div className="p-3 bg-gray-50 dark:bg-white/5 rounded-full text-gray-500 dark:text-sushi-muted group-hover:bg-sushi-gold group-hover:text-sushi-black transition-colors">
            <Icon className="w-6 h-6" />
        </div>
        <span className="text-xs font-bold text-gray-700 dark:text-white uppercase tracking-wide group-hover:text-sushi-gold">{label}</span>
    </button>
);

const StatCard = ({ title, value, sub, icon: Icon, colorClass }: any) => (
  <div className="bg-white dark:bg-sushi-dark p-6 rounded-xl border border-gray-200 dark:border-white/5 hover:border-sushi-gold/30 transition-all shadow-sm">
    <div className="flex justify-between items-start mb-4">
      <div>
        <p className="text-gray-500 dark:text-sushi-muted text-xs font-bold uppercase tracking-wider">{title}</p>
        <h3 className="text-3xl font-serif text-gray-900 dark:text-white mt-1">{value}</h3>
      </div>
      <div className={`p-3 rounded-lg bg-gray-50 dark:bg-white/5 ${colorClass}`}>
        <Icon className="w-6 h-6" />
      </div>
    </div>
    <p className="text-xs text-gray-400 dark:text-sushi-muted">{sub}</p>
  </div>
);

export const Dashboard: React.FC<DashboardProps> = ({ employees, records, tasks, inventory, sanctions, cashShifts = [], currentUser, setView }) => {
  // OPTIMIZATION: Memoize expensive calculations
  const activeEmployeesCount = useMemo(() => employees.filter(e => e.active).length, [employees]);
  const totalCost = useMemo(() => records.reduce((acc, curr) => acc + curr.overtimeAmount, 0), [records]);
  const openInventory = useMemo(() => inventory.find(s => s.status === 'OPEN'), [inventory]);
  const openCashShift = useMemo(() => cashShifts.find(s => s.status === 'OPEN'), [cashShifts]);

  // Cash logic: Calculate physical cash balance
  const cashBalance = useMemo(() => {
    if (!openCashShift) return 0;
    
    const cashIncome = openCashShift.transactions
        .filter(t => t.type === 'INCOME' && t.method === 'CASH')
        .reduce((acc, t) => acc + t.amount, 0);
      
    const cashExpenses = openCashShift.transactions
        .filter(t => t.type === 'EXPENSE' && t.method === 'CASH')
        .reduce((acc, t) => acc + t.amount, 0);
      
    return openCashShift.initialAmount + cashIncome - cashExpenses;
  }, [openCashShift]);

  const formatMoney = (val: number) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(val);

  // Recent Sanctions (exclude deleted)
  const recentSanctions = useMemo(() => {
      return [...sanctions]
      .filter(s => !s.deletedAt)
      .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 3);
  }, [sanctions]);

  // Chart Data: Cost per Month (Simulated based on records dates)
  const chartData = useMemo(() => {
      return records.reduce((acc: any[], curr) => {
        const month = new Date(curr.date).toLocaleDateString('es-AR', { month: 'short' });
        const existing = acc.find(item => item.name === month);
        if (existing) {
            existing.amount += curr.overtimeAmount;
        } else {
            acc.push({ name: month, amount: curr.overtimeAmount });
        }
        return acc;
    }, []).slice(-6); // Last 6 months
  }, [records]);

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
           <h2 className="text-3xl font-serif text-gray-900 dark:text-white">Panel General</h2>
           <p className="text-gray-500 dark:text-sushi-muted mt-2">Bienvenido, <span className="text-sushi-gold font-bold">{currentUser?.name}</span>. Resumen operativo de Sushiblack.</p>
        </div>
        <div className="flex items-center gap-2">
            <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>
            <span className="text-xs font-bold text-gray-500 dark:text-sushi-muted uppercase tracking-wider">Sistema Operativo</span>
        </div>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Staff Activo" 
          value={activeEmployeesCount} 
          sub="Empleados en nómina"
          icon={Users}
          colorClass="text-blue-500"
        />
        <StatCard 
          title="Costo Extras (Total)" 
          value={formatMoney(totalCost)} 
          sub="Acumulado histórico"
          icon={DollarSign}
          colorClass="text-green-500"
        />
        
        {/* Cash Register Card */}
        <div className="bg-white dark:bg-sushi-dark p-6 rounded-xl border border-gray-200 dark:border-white/5 hover:border-sushi-gold/30 transition-all shadow-sm relative overflow-hidden">
            <div className="flex justify-between items-start mb-4 relative z-10">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <p className="text-gray-500 dark:text-sushi-muted text-xs font-bold uppercase tracking-wider">Caja Activa (Efectivo)</p>
                        {openCashShift && (
                             <span className="flex h-2 w-2 relative">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                            </span>
                        )}
                    </div>
                    <h3 className="text-3xl font-serif text-gray-900 dark:text-white mt-1">
                        {openCashShift ? formatMoney(cashBalance) : 'CERRADA'}
                    </h3>
                </div>
                <div className="p-3 rounded-lg bg-gray-50 dark:bg-white/5 text-yellow-500">
                    <Wallet className="w-6 h-6" />
                </div>
            </div>
            <p className="text-xs text-gray-400 dark:text-sushi-muted relative z-10">
                {openCashShift ? 'Turno en curso' : 'Requiere Apertura'}
            </p>
            {openCashShift && <div className="absolute inset-0 bg-green-500/5 z-0 pointer-events-none"></div>}
        </div>

        <div className="bg-white dark:bg-sushi-dark p-6 rounded-xl border border-gray-200 dark:border-white/5 shadow-sm relative overflow-hidden group">
            <div className={`absolute top-0 right-0 p-20 rounded-full blur-3xl -mr-10 -mt-10 transition-colors ${openInventory ? 'bg-green-500/10' : 'bg-red-500/10'}`}></div>
            <div className="relative z-10">
                <p className="text-gray-500 dark:text-sushi-muted text-xs font-bold uppercase tracking-wider">Estado Cocina</p>
                <h3 className="text-xl font-serif text-gray-900 dark:text-white mt-2 flex items-center gap-2">
                    {openInventory ? (
                        <>
                            <span className="w-3 h-3 rounded-full bg-green-500"></span>
                            Inventario Abierto
                        </>
                    ) : (
                        <>
                            <span className="w-3 h-3 rounded-full bg-red-500"></span>
                            Turno Cerrado
                        </>
                    )}
                </h3>
                <p className="text-xs text-gray-400 mt-2">
                    {openInventory 
                        ? `Apertura: ${openInventory.startTime} (${openInventory.openedBy})` 
                        : 'No hay servicio activo registrado.'}
                </p>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Quick Actions */}
          <div className="lg:col-span-2 space-y-6">
              <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Accesos Rápidos</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <QuickAction icon={Plus} label="Nuevo Empleado" onClick={() => setView(View.EMPLOYEES)} />
                      <QuickAction icon={Clock} label="Registrar Turno" onClick={() => setView(View.OVERTIME)} />
                      <QuickAction icon={Box} label="Inventario" onClick={() => setView(View.INVENTORY)} />
                      <QuickAction icon={AlertTriangle} label="Nueva Sanción" onClick={() => setView(View.SANCTIONS)} />
                  </div>
              </div>

              {/* Chart */}
              <div className="bg-white dark:bg-sushi-dark p-6 rounded-xl border border-gray-200 dark:border-white/5 shadow-sm">
                  <div className="flex items-center gap-2 mb-6">
                    <TrendingUp className="text-sushi-gold w-5 h-5" />
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Evolución de Costos (Extras)</h3>
                  </div>
                  <div className="h-[250px] w-full">
                    {chartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                            <defs>
                                <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#d4af37" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#d4af37" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} vertical={false} />
                            <XAxis dataKey="name" stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="#888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val/1000}k`} />
                            <Tooltip 
                                contentStyle={{ backgroundColor: '#18181b', borderColor: '#333', color: '#fff', borderRadius: '8px' }}
                                itemStyle={{ color: '#d4af37' }}
                                formatter={(value: number) => formatMoney(value)}
                            />
                            <Area type="monotone" dataKey="amount" stroke="#d4af37" fillOpacity={1} fill="url(#colorCost)" />
                        </AreaChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400 dark:text-sushi-muted">
                            <p>Sin datos suficientes para graficar.</p>
                        </div>
                    )}
                  </div>
              </div>
          </div>

          {/* Activity Feed */}
          <div className="lg:col-span-1 space-y-6">
              <div className="bg-white dark:bg-sushi-dark p-6 rounded-xl border border-gray-200 dark:border-white/5 shadow-sm h-full">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center justify-between">
                      <span>Últimas Novedades</span>
                      <button onClick={() => setView(View.SANCTIONS)} className="text-xs text-sushi-gold hover:underline">Ver todo</button>
                  </h3>
                  
                  <div className="space-y-4">
                      {recentSanctions.length === 0 && <p className="text-sm text-gray-500 dark:text-sushi-muted italic">No hay actividad reciente.</p>}
                      {recentSanctions.map(s => {
                          const emp = employees.find(e => e.id === s.employeeId);
                          return (
                              <div key={s.id} className="flex items-start gap-3 pb-3 border-b border-gray-100 dark:border-white/5 last:border-0 last:pb-0">
                                  <div className={`mt-1 w-2 h-2 rounded-full ${s.type === 'STRIKE' ? 'bg-red-500' : 'bg-blue-500'}`}></div>
                                  <div>
                                      <p className="text-sm font-bold text-gray-900 dark:text-white">{emp?.name || 'Unknown'}</p>
                                      <p className="text-xs text-gray-500 dark:text-sushi-muted line-clamp-1">{s.description}</p>
                                      <div className="flex gap-2 mt-1">
                                          <span className="text-[10px] bg-gray-100 dark:bg-white/10 px-1.5 rounded text-gray-600 dark:text-gray-400">{s.type}</span>
                                          <span className="text-[10px] text-gray-400">{new Date(s.date).toLocaleDateString()}</span>
                                      </div>
                                  </div>
                              </div>
                          )
                      })}
                  </div>

                  <div className="mt-8 pt-6 border-t border-gray-200 dark:border-white/10">
                      <h4 className="text-xs font-bold uppercase text-gray-500 dark:text-sushi-muted mb-4">Administradores Activos</h4>
                      <div className="flex -space-x-2">
                          <div className="w-8 h-8 rounded-full bg-sushi-gold flex items-center justify-center text-sushi-black font-bold border-2 border-white dark:border-sushi-dark z-10" title={currentUser?.name}>
                              {currentUser?.name.charAt(0)}
                          </div>
                          {/* Placeholder for other online users simulation */}
                          <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-white/10 flex items-center justify-center text-xs border-2 border-white dark:border-sushi-dark">
                              +2
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      </div>
    </div>
  );
};
