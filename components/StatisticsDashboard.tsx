import React, { useState, useMemo } from 'react';
import { CashShift, WalletTransaction } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, Legend } from 'recharts';
import { Calendar, Banknote, CreditCard, ShoppingBag, DollarSign, TrendingUp, TrendingDown } from 'lucide-react';

interface StatisticsDashboardProps {
  cashShifts: CashShift[];
  walletTransactions: WalletTransaction[];
}

type Period = 'WEEK' | 'MONTH' | 'YEAR';

export const StatisticsDashboard: React.FC<StatisticsDashboardProps> = ({ cashShifts, walletTransactions }) => {
  const [period, setPeriod] = useState<Period>('WEEK');

  // Filter Shifts based on Period
  const filteredShifts = useMemo(() => {
      const now = new Date();
      const cutoff = new Date();
      if (period === 'WEEK') cutoff.setDate(now.getDate() - 7);
      if (period === 'MONTH') cutoff.setMonth(now.getMonth() - 1);
      if (period === 'YEAR') cutoff.setFullYear(now.getFullYear() - 1);

      return cashShifts.filter(s => new Date(s.date) >= cutoff && s.status === 'CLOSED').sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [cashShifts, period]);

  // Aggregate Data for KPIs
  const stats = useMemo(() => {
      let totalFudo = 0;
      let totalPy = 0;
      let totalIncome = 0;
      let totalExpenses = 0;
      
      // Calculate Income from Cash Register Shifts (The Source of Truth for Daily Sales)
      // We look at the transactions within the shifts that are INCOME + VENTA
      // But maybe simpler to look at the Closed Shift Totals?
      // A Closed Shift has transactions.
      
      filteredShifts.forEach(shift => {
          totalFudo += shift.ordersFudo || 0;
          totalPy += shift.ordersPedidosYa || 0;
          
          shift.transactions.forEach(t => {
              if (t.type === 'INCOME') totalIncome += t.amount;
              if (t.type === 'EXPENSE') totalExpenses += t.amount;
          });
      });

      const totalOrders = totalFudo + totalPy;
      const avgTicket = totalOrders > 0 ? totalIncome / totalOrders : 0;

      return { totalFudo, totalPy, totalOrders, totalIncome, totalExpenses, avgTicket };
  }, [filteredShifts]);

  // Chart Data: Revenue vs Expense per Day
  const barData = useMemo(() => {
      return filteredShifts.map(s => {
          const income = s.transactions.filter(t => t.type === 'INCOME').reduce((a,b) => a + b.amount, 0);
          const expense = s.transactions.filter(t => t.type === 'EXPENSE').reduce((a,b) => a + b.amount, 0);
          return {
              name: new Date(s.date).toLocaleDateString('es-AR', {day: 'numeric', month: 'short'}),
              ingresos: income,
              gastos: expense
          };
      });
  }, [filteredShifts]);

  // Chart Data: Payment Methods
  const pieDataMethods = useMemo(() => {
      let cash = 0;
      let transfer = 0;
      filteredShifts.forEach(s => {
          s.transactions.filter(t => t.type === 'INCOME').forEach(t => {
              if (t.method === 'CASH') cash += t.amount;
              else transfer += t.amount;
          });
      });
      return [
          { name: 'Efectivo', value: cash, color: '#22c55e' },
          { name: 'Transferencia', value: transfer, color: '#3b82f6' }
      ].filter(d => d.value > 0);
  }, [filteredShifts]);

  // Chart Data: Orders
  const pieDataOrders = useMemo(() => {
      return [
          { name: 'Fudo', value: stats.totalFudo, color: '#eab308' }, // Yellow
          { name: 'PedidosYa', value: stats.totalPy, color: '#ef4444' } // Red
      ].filter(d => d.value > 0);
  }, [stats]);

  const formatMoney = (val: number) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(val);

  return (
    <div className="space-y-6 animate-fade-in">
        <div className="flex justify-between items-center">
            <div>
                <h2 className="text-3xl font-serif text-gray-900 dark:text-white flex items-center gap-3">
                    <TrendingUp className="w-8 h-8 text-sushi-gold" />
                    Estadísticas Comerciales
                </h2>
                <p className="text-gray-500 dark:text-sushi-muted mt-2">Métricas de facturación, pedidos y gastos.</p>
            </div>
            
            <div className="flex bg-gray-100 dark:bg-white/5 p-1 rounded-lg">
                {(['WEEK', 'MONTH', 'YEAR'] as Period[]).map(p => (
                    <button
                        key={p}
                        onClick={() => setPeriod(p)}
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${period === p ? 'bg-sushi-gold text-sushi-black' : 'text-gray-500 dark:text-sushi-muted hover:text-white'}`}
                    >
                        {p === 'WEEK' ? 'Semana' : p === 'MONTH' ? 'Mes' : 'Año'}
                    </button>
                ))}
            </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-sushi-dark p-6 rounded-xl border border-gray-200 dark:border-white/5 shadow-sm">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-xs uppercase text-gray-500 font-bold mb-1">Facturado Bruto</p>
                        <h3 className="text-2xl font-mono font-bold text-gray-900 dark:text-white">{formatMoney(stats.totalIncome)}</h3>
                    </div>
                    <div className="p-2 bg-green-100 dark:bg-green-500/20 text-green-600 rounded-lg">
                        <DollarSign className="w-5 h-5" />
                    </div>
                </div>
            </div>
            <div className="bg-white dark:bg-sushi-dark p-6 rounded-xl border border-gray-200 dark:border-white/5 shadow-sm">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-xs uppercase text-gray-500 font-bold mb-1">Gastos Operativos</p>
                        <h3 className="text-2xl font-mono font-bold text-red-500">{formatMoney(stats.totalExpenses)}</h3>
                    </div>
                    <div className="p-2 bg-red-100 dark:bg-red-500/20 text-red-600 rounded-lg">
                        <TrendingDown className="w-5 h-5" />
                    </div>
                </div>
            </div>
            <div className="bg-white dark:bg-sushi-dark p-6 rounded-xl border border-gray-200 dark:border-white/5 shadow-sm">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-xs uppercase text-gray-500 font-bold mb-1">Pedidos Totales</p>
                        <h3 className="text-2xl font-mono font-bold text-blue-500">{stats.totalOrders}</h3>
                        <p className="text-[10px] text-gray-400 mt-1">Fudo: {stats.totalFudo} | PY: {stats.totalPy}</p>
                    </div>
                    <div className="p-2 bg-blue-100 dark:bg-blue-500/20 text-blue-600 rounded-lg">
                        <ShoppingBag className="w-5 h-5" />
                    </div>
                </div>
            </div>
            <div className="bg-white dark:bg-sushi-dark p-6 rounded-xl border border-gray-200 dark:border-white/5 shadow-sm">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-xs uppercase text-gray-500 font-bold mb-1">Ticket Promedio</p>
                        <h3 className="text-2xl font-mono font-bold text-purple-500">{formatMoney(stats.avgTicket)}</h3>
                    </div>
                    <div className="p-2 bg-purple-100 dark:bg-purple-500/20 text-purple-600 rounded-lg">
                        <Banknote className="w-5 h-5" />
                    </div>
                </div>
            </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Bar Chart: Income vs Expense */}
            <div className="bg-white dark:bg-sushi-dark p-6 rounded-xl border border-gray-200 dark:border-white/5 shadow-sm h-[350px]">
                <h3 className="font-bold text-gray-900 dark:text-white mb-6">Flujo de Caja (Diario)</h3>
                <ResponsiveContainer width="100%" height="85%">
                    <BarChart data={barData}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.1} vertical={false} />
                        <XAxis dataKey="name" fontSize={12} stroke="#888" axisLine={false} tickLine={false} />
                        <YAxis fontSize={12} stroke="#888" axisLine={false} tickLine={false} tickFormatter={(val) => `$${val/1000}k`} />
                        <Tooltip 
                            contentStyle={{ backgroundColor: '#18181b', borderColor: '#333', color: '#fff', borderRadius: '8px' }}
                            formatter={(value: number) => formatMoney(value)}
                        />
                        <Legend />
                        <Bar dataKey="ingresos" name="Ingresos" fill="#22c55e" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="gastos" name="Gastos" fill="#ef4444" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* Pie Charts Container */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-[350px]">
                
                {/* Orders Pie */}
                <div className="bg-white dark:bg-sushi-dark p-6 rounded-xl border border-gray-200 dark:border-white/5 shadow-sm flex flex-col items-center">
                    <h3 className="font-bold text-gray-900 dark:text-white mb-2 w-full text-left">Origen Pedidos</h3>
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={pieDataOrders}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {pieDataOrders.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                                ))}
                            </Pie>
                            <Tooltip formatter={(value: number) => value} contentStyle={{ backgroundColor: '#18181b', borderColor: '#333', color: '#fff' }} />
                            <Legend verticalAlign="bottom" height={36} iconType="circle" />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                {/* Methods Pie */}
                <div className="bg-white dark:bg-sushi-dark p-6 rounded-xl border border-gray-200 dark:border-white/5 shadow-sm flex flex-col items-center">
                    <h3 className="font-bold text-gray-900 dark:text-white mb-2 w-full text-left">Medios de Pago</h3>
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={pieDataMethods}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {pieDataMethods.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                                ))}
                            </Pie>
                            <Tooltip formatter={(value: number) => formatMoney(value)} contentStyle={{ backgroundColor: '#18181b', borderColor: '#333', color: '#fff' }} />
                            <Legend verticalAlign="bottom" height={36} iconType="circle" />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    </div>
  );
};