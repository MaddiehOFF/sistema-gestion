
import React, { useState } from 'react';
import { Employee, PaymentMethod, WalletTransaction, User } from '../types';
import { Banknote, Calendar, CreditCard, ChevronRight, Clock, Wallet, History, Check } from 'lucide-react';
import { playSound } from '../utils/soundUtils';

interface PayrollManagementProps {
  employees: Employee[];
  setEmployees: React.Dispatch<React.SetStateAction<Employee[]>>;
  transactions?: WalletTransaction[]; // Need to access wallet history
  setTransactions?: React.Dispatch<React.SetStateAction<WalletTransaction[]>>;
  currentUser?: User | null;
}

export const PayrollManagement: React.FC<PayrollManagementProps> = ({ employees, setEmployees, transactions = [], setTransactions, currentUser }) => {
  const [activeTab, setActiveTab] = useState<'ACTIVE' | 'HISTORY'>('ACTIVE');
  const activeEmployees = employees.filter(e => e.active);

  const updateEmployeePayment = (id: string, field: 'nextPaymentDate' | 'nextPaymentMethod', value: string) => {
    setEmployees(employees.map(e => e.id === id ? { ...e, [field]: value } : e));
  };

  const getDaysUntilPayment = (dateStr?: string) => {
      if (!dateStr) return null;
      const today = new Date();
      today.setHours(0,0,0,0);
      const paymentDate = new Date(dateStr);
      paymentDate.setHours(0,0,0,0);
      
      const diffTime = paymentDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      return diffDays;
  };

  const handlePay = (emp: Employee, e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation(); // Prevents row click or other bubbles
      
      if (!setTransactions) {
          console.error("setTransactions is missing in PayrollManagement");
          alert("Error del sistema: No se puede conectar con la Billetera. Contacte a soporte.");
          return;
      }

      if (!currentUser) {
          alert("Debes estar logueado para realizar pagos.");
          return;
      }

      if (window.confirm(`¿Confirmar pago de nómina a ${emp.name} por $${emp.monthlySalary}? Esto se descontará de la Billetera Global.`)) {
          
          // 1. Create Transaction
          const newTx: WalletTransaction = {
              id: crypto.randomUUID(),
              date: new Date().toISOString(),
              time: new Date().toLocaleTimeString('es-AR', {hour: '2-digit', minute:'2-digit'}),
              amount: emp.monthlySalary,
              type: 'EXPENSE',
              category: 'Sueldos',
              description: `Pago Nómina: ${emp.name}`,
              createdBy: currentUser.name,
              method: emp.nextPaymentMethod || 'TRANSFERENCIA'
          };
          
          // Safe state update
          setTransactions(prev => [newTx, ...(prev || [])]);

          // 2. Update Employee Last Payment
          setEmployees(prev => prev.map(e => e.id === emp.id ? { ...e, lastPaymentDate: new Date().toISOString() } : e));
          
          playSound('SUCCESS');
      }
  };

  const isPaidRecently = (dateStr?: string) => {
      if (!dateStr) return false;
      const paymentDate = new Date(dateStr);
      const today = new Date();
      // Considered "paid" if paid in the current month
      return paymentDate.getMonth() === today.getMonth() && paymentDate.getFullYear() === today.getFullYear();
  };

  const formatMoney = (val: number) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(val);

  return (
    <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col md:flex-row justify-between items-start gap-4">
            <div>
                <h2 className="text-3xl font-serif text-gray-900 dark:text-white">Pagos y Nómina</h2>
                <p className="text-gray-500 dark:text-sushi-muted mt-2">Agenda y gestiona las fechas de cobro del personal.</p>
            </div>
            <div className="flex gap-4">
                <div className="bg-white dark:bg-sushi-dark px-4 py-2 rounded-lg border border-gray-200 dark:border-white/10 flex items-center gap-3 shadow-sm">
                    <div className="p-2 bg-sushi-gold/20 text-yellow-700 dark:text-sushi-gold rounded-full">
                        <Banknote className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-xs uppercase font-bold text-gray-500 dark:text-sushi-muted">Total Nómina (Est.)</p>
                        <p className="text-lg font-mono font-bold text-gray-900 dark:text-white">
                            {formatMoney(activeEmployees.reduce((acc, curr) => acc + curr.monthlySalary, 0))}
                        </p>
                    </div>
                </div>
                <div className="flex bg-gray-100 dark:bg-white/5 p-1 rounded-lg self-center">
                    <button 
                        onClick={() => { setActiveTab('ACTIVE'); playSound('CLICK'); }}
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'ACTIVE' ? 'bg-sushi-gold text-sushi-black' : 'text-gray-500 dark:text-sushi-muted'}`}
                    >
                        Activos
                    </button>
                    <button 
                        onClick={() => { setActiveTab('HISTORY'); playSound('CLICK'); }}
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'HISTORY' ? 'bg-sushi-gold text-sushi-black' : 'text-gray-500 dark:text-sushi-muted'}`}
                    >
                        Historial Pagos
                    </button>
                </div>
            </div>
        </div>

        {activeTab === 'ACTIVE' ? (
            <div className="bg-white dark:bg-sushi-dark rounded-xl border border-gray-200 dark:border-white/5 overflow-hidden shadow-lg">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 dark:bg-black/20 border-b border-gray-200 dark:border-white/5 text-xs uppercase tracking-wider text-gray-500 dark:text-sushi-muted">
                                <th className="p-4">Empleado</th>
                                <th className="p-4">Modalidad</th>
                                <th className="p-4">Próximo Pago</th>
                                <th className="p-4">Monto</th>
                                <th className="p-4">Método</th>
                                <th className="p-4">Estado / Acción</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                            {activeEmployees.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-gray-400 dark:text-sushi-muted italic">
                                        No hay empleados activos para gestionar nómina.
                                    </td>
                                </tr>
                            )}
                            {activeEmployees.map(emp => {
                                const daysUntil = getDaysUntilPayment(emp.nextPaymentDate);
                                const isPaid = isPaidRecently(emp.lastPaymentDate);
                                
                                return (
                                    <tr key={emp.id} className={`transition-colors group ${isPaid ? 'bg-green-50/50 dark:bg-green-900/10 opacity-60' : 'hover:bg-gray-50 dark:hover:bg-white/[0.02]'}`}>
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-white/10 overflow-hidden">
                                                    {emp.photoUrl ? <img src={emp.photoUrl} className={`w-full h-full object-cover ${isPaid ? 'grayscale' : ''}`} /> : null}
                                                </div>
                                                <div>
                                                    <p className={`font-bold text-gray-900 dark:text-white text-sm ${isPaid ? 'line-through decoration-green-500' : ''}`}>{emp.name}</p>
                                                    <p className="text-xs text-gray-500 dark:text-sushi-muted">{emp.position}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className="text-xs font-medium bg-gray-100 dark:bg-white/10 px-2 py-1 rounded text-gray-600 dark:text-sushi-muted border border-gray-200 dark:border-white/5">
                                                {emp.paymentModality}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <div className="relative max-w-[140px]">
                                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                <input 
                                                    type="date"
                                                    value={emp.nextPaymentDate || ''}
                                                    onChange={(e) => updateEmployeePayment(emp.id, 'nextPaymentDate', e.target.value)}
                                                    className="w-full bg-white dark:bg-black/30 border border-gray-200 dark:border-white/10 rounded-lg py-2 pl-9 pr-2 text-sm text-gray-900 dark:text-white focus:border-sushi-gold outline-none transition-colors [color-scheme:light] dark:[color-scheme:dark]"
                                                    disabled={isPaid}
                                                />
                                            </div>
                                        </td>
                                        <td className="p-4 font-mono font-bold text-gray-900 dark:text-white">
                                            {formatMoney(emp.monthlySalary)}
                                        </td>
                                        <td className="p-4">
                                            <div className="relative max-w-[140px]">
                                                {emp.nextPaymentMethod === 'EFECTIVO' ? (
                                                    <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />
                                                ) : (
                                                    <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500" />
                                                )}
                                                <select
                                                    value={emp.nextPaymentMethod || 'TRANSFERENCIA'}
                                                    onChange={(e) => updateEmployeePayment(emp.id, 'nextPaymentMethod', e.target.value)}
                                                    className="w-full bg-white dark:bg-black/30 border border-gray-200 dark:border-white/10 rounded-lg py-2 pl-9 pr-2 text-sm text-gray-900 dark:text-white focus:border-sushi-gold outline-none transition-colors appearance-none"
                                                    disabled={isPaid}
                                                >
                                                    <option value="TRANSFERENCIA">Transferencia</option>
                                                    <option value="EFECTIVO">Efectivo</option>
                                                </select>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            {isPaid ? (
                                                <span className="flex items-center gap-1 text-xs font-bold text-green-600 dark:text-green-500 bg-green-100 dark:bg-green-500/10 px-3 py-1.5 rounded w-fit border border-green-200 dark:border-green-500/20">
                                                    <Check className="w-3 h-3"/> Abonado
                                                </span>
                                            ) : (
                                                <div className="flex items-center justify-between gap-2">
                                                    {daysUntil !== null && (
                                                        <span className={`text-xs font-medium ${daysUntil < 0 ? 'text-red-500' : 'text-gray-500'}`}>
                                                            {daysUntil < 0 ? `Vencido ${Math.abs(daysUntil)}d` : `${daysUntil} días`}
                                                        </span>
                                                    )}
                                                    <button 
                                                        type="button"
                                                        onClick={(e) => handlePay(emp, e)}
                                                        className="bg-sushi-gold text-sushi-black px-3 py-1.5 rounded text-xs font-bold hover:bg-sushi-goldhover shadow-sm transform active:scale-95 transition-all z-10 relative"
                                                    >
                                                        Abonar
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        ) : (
            <div className="bg-white dark:bg-sushi-dark rounded-xl border border-gray-200 dark:border-white/5 overflow-hidden shadow-lg p-6">
                <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <History className="w-5 h-5 text-sushi-gold" /> Historial de Pagos Realizados
                </h3>
                <div className="space-y-2">
                    {transactions
                        .filter(t => t.type === 'EXPENSE' && (t.category === 'Sueldos' || t.category === 'Personal'))
                        .length === 0 ? (
                            <p className="text-gray-400 italic text-sm text-center py-8">No hay registros históricos de pagos de sueldo.</p>
                        ) : (
                            transactions
                            .filter(t => t.type === 'EXPENSE' && (t.category === 'Sueldos' || t.category === 'Personal'))
                            .map(t => (
                                <div key={t.id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-black/20 rounded-lg border border-gray-100 dark:border-white/5">
                                    <div>
                                        <p className="font-bold text-gray-900 dark:text-white text-sm">{t.description}</p>
                                        <div className="flex gap-2 text-xs text-gray-500 dark:text-sushi-muted">
                                            <span>{new Date(t.date).toLocaleDateString()}</span>
                                            <span>•</span>
                                            <span>{t.time}</span>
                                            <span>•</span>
                                            <span className="uppercase">{t.method}</span>
                                        </div>
                                    </div>
                                    <p className="font-mono font-bold text-red-500 dark:text-red-400">-{formatMoney(t.amount)}</p>
                                </div>
                            ))
                        )
                    }
                </div>
            </div>
        )}
    </div>
  );
};
