
import React, { useState, useMemo } from 'react';
import { CalculatorProjection, Product, WalletTransaction, CashShift, Partner } from '../types';
import { Calculator, DollarSign, Users, Box, Crown, TrendingUp, RefreshCcw, Save, Check, History, Clock, ArrowRight } from 'lucide-react';

interface FinanceDashboardProps {
  products: Product[];
  setTransactions?: React.Dispatch<React.SetStateAction<WalletTransaction[]>>;
  transactions?: WalletTransaction[];
  projections?: CalculatorProjection[];
  setProjections?: React.Dispatch<React.SetStateAction<CalculatorProjection[]>>;
  userName?: string;
  cashShifts?: CashShift[]; // Injected for deductions
  partners?: Partner[];
  setPartners?: React.Dispatch<React.SetStateAction<Partner[]>>;
  // Removed setRoyaltyPool as we update partners directly
}

export const FinanceDashboard: React.FC<FinanceDashboardProps> = ({ products, setTransactions, transactions, projections, setProjections, userName, cashShifts, partners, setPartners }) => {
  const [activeTab, setActiveTab] = useState<'CALCULATOR' | 'HISTORY'>('CALCULATOR');
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [showCommitModal, setShowCommitModal] = useState(false);
  const [realSalesInput, setRealSalesInput] = useState('');

  // Calculate Cash Deductions (Looking at Open/Recent Shifts)
  const cashDeductions = useMemo(() => {
      if (!cashShifts) return { labor: 0, material: 0 };
      
      // Consider transactions from the currently OPEN shift, or maybe recently closed ones? 
      // For simplicity and relevance to "daily payment", we look at the OPEN shift.
      const openShift = cashShifts.find(s => s.status === 'OPEN');
      if (!openShift) return { labor: 0, material: 0 };

      const labor = openShift.transactions
        .filter(t => t.type === 'EXPENSE' && t.category === 'PERSONAL')
        .reduce((acc, t) => acc + t.amount, 0);

      const material = openShift.transactions
        .filter(t => t.type === 'EXPENSE' && t.category === 'INSUMOS')
        .reduce((acc, t) => acc + t.amount, 0);

      return { labor, material };
  }, [cashShifts]);

  const handleQtyChange = (id: string, val: string) => {
      const num = parseInt(val) || 0;
      setQuantities(prev => ({ ...prev, [id]: num }));
  };

  const resetCalculator = () => setQuantities({});

  const totals = useMemo(() => {
      let labor = 0;
      let material = 0;
      let royalties = 0;
      let profit = 0;

      Object.entries(quantities).forEach(([id, qty]) => {
          const product = products.find(p => p.id === id);
          if (product && qty > 0) {
              labor += product.laborCost * qty;
              material += product.materialCost * qty;
              royalties += product.royalties * qty;
              profit += product.profit * qty;
          }
      });

      return { labor, material, royalties, profit, total: labor + material + royalties + profit };
  }, [quantities, products]);

  // Adjusted Totals (Theoretical - Cash Paid)
  const payableLabor = Math.max(0, totals.labor - cashDeductions.labor);
  const payableMaterial = Math.max(0, totals.material - cashDeductions.material);

  const initiateCommit = () => {
      setRealSalesInput(totals.total.toString());
      setShowCommitModal(true);
  };

  const handleCommit = () => {
      if (!setTransactions || !transactions || !userName || !setProjections || !projections || !partners || !setPartners) return;

      const realSales = parseFloat(realSalesInput) || 0;

      // Logic:
      // Profit (Royalties for partners) = Real Sales - (Labor Cost) - (Material Cost) - (Company Profit/Net Profit margin if fixed?)
      // However, usually: Profit = Real Sales - Expenses.
      // Here: Theoretical Expenses are `totals.labor` and `totals.material` (regardless if paid by cash or not, cost is cost).
      // `totals.royalties` (Net Profit in UI due to swap) is the company cut?
      
      // Let's assume the "Regalías" (Partners cut, labeled profit in product) adjusts based on Real Sales.
      // New Partner Profit = Real Sales - Labor - Material - Company Net Profit.
      // Or simply: Scale everything? No, usually Labor/Material are fixed costs.
      
      // Let's use: Real Profit = Real Sales - Labor(Theo) - Material(Theo) - NetProfit(Theo).
      // If negative, partners lose money.
      
      const realPartnerProfit = realSales - totals.labor - totals.material - totals.royalties;
      // NOTE: "totals.royalties" is mapped to "Ganancia Neta" (Green) in UI.
      // "totals.profit" is mapped to "Regalías" (Purple) in UI.
      
      // Actually, simplest approach: Adjust the Partner Profit by the difference in Sales.
      const diff = realSales - totals.total;
      const adjustedPartnerProfit = totals.profit + diff; 

      // 1. Add Total Sales to Wallet (Income)
      const incomeTx: WalletTransaction = {
          id: crypto.randomUUID(),
          date: new Date().toISOString(),
          time: new Date().toLocaleTimeString('es-AR', {hour: '2-digit', minute:'2-digit'}),
          amount: realSales,
          type: 'INCOME',
          category: 'Ventas',
          description: 'Cierre Calculadora (Venta Real)',
          createdBy: userName
      };
      setTransactions([incomeTx, ...transactions]);

      // 2. Distribute Profit to Partners (Add to their individual Balance)
      const updatedPartners = partners.map(p => {
          // Calculate share: (TotalProfit * Percentage) / 100
          const shareAmount = (adjustedPartnerProfit * p.sharePercentage) / 100;
          return {
              ...p,
              balance: (p.balance || 0) + shareAmount
          };
      });
      setPartners(updatedPartners);

      // 3. Save to History
      const itemsSnapshot = Object.entries(quantities)
        .filter(([_, qty]) => qty > 0)
        .map(([id, qty]) => {
            const prod = products.find(p => p.id === id);
            return { name: prod?.name || 'Unknown', qty };
        });

      const newProjection: CalculatorProjection = {
          id: crypto.randomUUID(),
          date: new Date().toISOString(),
          totalSales: totals.total, // Theoretical
          realSales: realSales, // Actual
          netProfit: totals.royalties,
          royalties: adjustedPartnerProfit, // Adjusted
          itemsSnapshot,
          createdBy: userName
      };
      setProjections([newProjection, ...projections]);

      setShowCommitModal(false);
      resetCalculator();
  };

  const formatMoney = (val: number) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(val);

  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-6 animate-fade-in h-full flex flex-col">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
                <h2 className="text-3xl font-serif text-gray-900 dark:text-white flex items-center gap-3">
                    <Calculator className="w-8 h-8 text-sushi-gold" />
                    Calculadora de Rentabilidad
                </h2>
                <p className="text-gray-500 dark:text-sushi-muted mt-2">Proyecta la mano de obra y ganancias según volumen de venta.</p>
            </div>
            <div className="flex gap-2 bg-gray-100 dark:bg-white/5 p-1 rounded-lg">
                <button 
                    onClick={() => setActiveTab('CALCULATOR')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all text-sm font-medium ${activeTab === 'CALCULATOR' ? 'bg-sushi-gold text-sushi-black' : 'text-gray-500 dark:text-sushi-muted hover:text-gray-900 dark:hover:text-white'}`}
                >
                    <Calculator className="w-4 h-4" />
                    Simulador
                </button>
                <button 
                    onClick={() => setActiveTab('HISTORY')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all text-sm font-medium ${activeTab === 'HISTORY' ? 'bg-sushi-gold text-sushi-black' : 'text-gray-500 dark:text-sushi-muted hover:text-gray-900 dark:hover:text-white'}`}
                >
                    <History className="w-4 h-4" />
                    Historial
                </button>
            </div>
        </div>

        {activeTab === 'CALCULATOR' ? (
            <>
                <div className="flex justify-end gap-2 mb-2">
                    <button 
                        onClick={resetCalculator}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-sushi-muted hover:text-red-500 transition-colors"
                    >
                        <RefreshCcw className="w-4 h-4" /> Reiniciar
                    </button>
                    {setTransactions && totals.total > 0 && (
                        <button 
                            onClick={initiateCommit}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg font-bold bg-green-600 text-white hover:bg-green-700 transition-colors shadow-lg shadow-green-600/20"
                        >
                            <Save className="w-4 h-4" /> Abrir Ficha / Cerrar Proyección
                        </button>
                    )}
                </div>

                {/* Results Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-500/20 rounded-xl relative overflow-hidden group">
                        <p className="text-xs uppercase font-bold text-blue-600 dark:text-blue-400 mb-1 flex items-center gap-1"><Users className="w-3 h-3"/> Mano de Obra</p>
                        <p className="text-2xl font-mono font-bold text-blue-700 dark:text-blue-300">{formatMoney(payableLabor)}</p>
                        {cashDeductions.labor > 0 && (
                            <div className="text-[10px] text-blue-500 mt-1 flex items-center gap-1">
                                <ArrowRight className="w-3 h-3" /> Adelanto Caja: -{formatMoney(cashDeductions.labor)}
                            </div>
                        )}
                    </div>
                    <div className="p-4 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl">
                        <p className="text-xs uppercase font-bold text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1"><Box className="w-3 h-3"/> Costo Mercadería</p>
                        <p className="text-2xl font-mono font-bold text-gray-700 dark:text-white">{formatMoney(payableMaterial)}</p>
                        {cashDeductions.material > 0 && (
                            <div className="text-[10px] text-gray-500 mt-1 flex items-center gap-1">
                                <ArrowRight className="w-3 h-3" /> Pago Caja: -{formatMoney(cashDeductions.material)}
                            </div>
                        )}
                    </div>
                    {/* Swapped Cards */}
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-500/20 rounded-xl">
                        <p className="text-xs uppercase font-bold text-green-600 dark:text-green-400 mb-1 flex items-center gap-1"><TrendingUp className="w-3 h-3"/> Ganancia Neta</p>
                        <p className="text-2xl font-mono font-bold text-green-700 dark:text-green-300">{formatMoney(totals.royalties)}</p>
                    </div>
                    <div className="p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-500/20 rounded-xl">
                        <p className="text-xs uppercase font-bold text-purple-600 dark:text-purple-400 mb-1 flex items-center gap-1"><Crown className="w-3 h-3"/> Regalías (Socios)</p>
                        <p className="text-2xl font-mono font-bold text-purple-700 dark:text-purple-300">{formatMoney(totals.profit)}</p>
                    </div>
                    <div className="p-4 bg-sushi-gold/10 border border-sushi-gold/30 rounded-xl">
                        <p className="text-xs uppercase font-bold text-yellow-700 dark:text-sushi-gold mb-1 flex items-center gap-1"><DollarSign className="w-3 h-3"/> Venta Teórica</p>
                        <p className="text-2xl font-mono font-bold text-yellow-800 dark:text-sushi-gold">{formatMoney(totals.total)}</p>
                    </div>
                </div>

                {/* Calculator Input Area */}
                <div className="flex-1 bg-white dark:bg-sushi-dark border border-gray-200 dark:border-white/5 rounded-xl overflow-hidden flex flex-col shadow-lg">
                    <div className="p-4 border-b border-gray-200 dark:border-white/5 bg-gray-50 dark:bg-black/20">
                        <input 
                            type="text" 
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            placeholder="Buscar producto para agregar a la simulación..."
                            className="w-full bg-white dark:bg-black/30 border border-gray-200 dark:border-white/10 rounded-lg py-3 px-4 text-sm focus:border-sushi-gold outline-none"
                        />
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {filteredProducts.map(p => (
                                <div key={p.id} className={`p-3 rounded-lg border transition-all flex justify-between items-center ${quantities[p.id] > 0 ? 'bg-sushi-gold/5 border-sushi-gold/30' : 'bg-white dark:bg-white/[0.02] border-gray-100 dark:border-white/5'}`}>
                                    <div className="flex-1 overflow-hidden mr-2">
                                        <p className="font-bold text-sm text-gray-900 dark:text-white truncate" title={p.name}>{p.name}</p>
                                        <p className="text-[10px] text-gray-500 dark:text-sushi-muted">Mano Obra: {formatMoney(p.laborCost)}</p>
                                    </div>
                                    <div className="flex items-center gap-2 bg-gray-100 dark:bg-black/30 rounded-lg p-1">
                                        <button 
                                            onClick={() => handleQtyChange(p.id, String(Math.max(0, (quantities[p.id] || 0) - 1)))}
                                            className="w-6 h-6 flex items-center justify-center bg-white dark:bg-white/10 rounded text-gray-600 dark:text-white hover:bg-gray-200 dark:hover:bg-white/20"
                                        >-
                                        </button>
                                        <input 
                                            type="text" 
                                            value={quantities[p.id] || 0}
                                            onChange={(e) => handleQtyChange(p.id, e.target.value)}
                                            className="w-10 text-center bg-transparent text-sm font-bold text-gray-900 dark:text-white outline-none"
                                        />
                                        <button 
                                            onClick={() => handleQtyChange(p.id, String((quantities[p.id] || 0) + 1))}
                                            className="w-6 h-6 flex items-center justify-center bg-sushi-gold text-sushi-black rounded hover:bg-sushi-goldhover"
                                        >+
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </>
        ) : (
            <div className="flex-1 bg-white dark:bg-sushi-dark border border-gray-200 dark:border-white/5 rounded-xl overflow-hidden shadow-lg p-6">
                <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-6 border-b border-gray-200 dark:border-white/5 pb-4">
                    Historial de Cierres
                </h3>
                
                {!projections || projections.length === 0 ? (
                    <div className="text-center py-12 text-gray-400 dark:text-sushi-muted">
                        <History className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>No hay proyecciones guardadas en el historial.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {projections.map(proj => (
                            <div key={proj.id} className="bg-gray-50 dark:bg-black/20 rounded-xl p-4 border border-gray-100 dark:border-white/5 hover:border-sushi-gold/30 transition-all">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-center gap-2">
                                        <div className="p-2 bg-sushi-gold/10 rounded-full text-yellow-700 dark:text-sushi-gold">
                                            <Check className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-900 dark:text-white">
                                                Cierre: {new Date(proj.date).toLocaleDateString('es-AR', {day: 'numeric', month: 'long'})}
                                            </p>
                                            <p className="text-[10px] text-gray-500 dark:text-sushi-muted flex items-center gap-1">
                                                <Clock className="w-3 h-3" /> 
                                                {new Date(proj.date).toLocaleTimeString('es-AR', {hour: '2-digit', minute:'2-digit'})} • Por {proj.createdBy}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs uppercase text-gray-500 font-bold">Venta Real</p>
                                        <p className="text-lg font-mono font-bold text-green-600 dark:text-green-500">{formatMoney(proj.realSales || proj.totalSales)}</p>
                                        {proj.realSales && proj.realSales !== proj.totalSales && (
                                            <p className="text-[10px] text-gray-400 line-through">Teórico: {formatMoney(proj.totalSales)}</p>
                                        )}
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-2 mb-4 text-sm bg-white dark:bg-white/5 p-3 rounded-lg">
                                    <div className="flex justify-between">
                                        <span className="text-gray-500 dark:text-sushi-muted">Ganancia Neta</span>
                                        <span className="font-mono text-green-600 dark:text-green-500 font-bold">{formatMoney(proj.netProfit)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500 dark:text-sushi-muted">Regalías</span>
                                        <span className="font-mono text-purple-600 dark:text-purple-400 font-bold">{formatMoney(proj.royalties)}</span>
                                    </div>
                                </div>

                                <div className="text-xs">
                                    <p className="text-gray-400 mb-1 uppercase font-bold tracking-wider">Resumen Items</p>
                                    <div className="flex flex-wrap gap-2">
                                        {proj.itemsSnapshot.slice(0, 5).map((item, idx) => (
                                            <span key={idx} className="bg-gray-200 dark:bg-white/10 px-2 py-0.5 rounded text-gray-700 dark:text-gray-300">
                                                {item.qty}x {item.name}
                                            </span>
                                        ))}
                                        {proj.itemsSnapshot.length > 5 && (
                                            <span className="text-gray-400 px-2">+{proj.itemsSnapshot.length - 5} más...</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        )}

        {/* Confirmation Modal */}
        {showCommitModal && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-white dark:bg-sushi-dark w-full max-w-sm rounded-2xl p-6 border border-gray-200 dark:border-white/10 shadow-2xl animate-fade-in">
                    <div className="w-16 h-16 bg-sushi-gold text-sushi-black rounded-full flex items-center justify-center mx-auto mb-4">
                        <Check className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 text-center">Confirmar Ingreso</h3>
                    <p className="text-sm text-gray-500 dark:text-sushi-muted mb-6 text-center">
                        Se actualizará la billetera global y se distribuirán las regalías a las cuentas de los socios según porcentaje.
                    </p>
                    
                    <div className="mb-6">
                        <label className="text-xs uppercase text-gray-500 mb-1 block font-bold">Venta Total Real (Dinero en Mano)</label>
                        <input 
                            type="number"
                            value={realSalesInput}
                            onChange={(e) => setRealSalesInput(e.target.value)}
                            className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-lg p-3 text-lg font-mono font-bold text-gray-900 dark:text-white focus:border-sushi-gold outline-none"
                        />
                        <p className="text-[10px] text-gray-400 mt-1">Sugerido (Teórico): {formatMoney(totals.total)}</p>
                    </div>

                    <div className="space-y-3 mb-6 text-left bg-gray-50 dark:bg-black/20 p-4 rounded-lg">
                        <div className="flex justify-between items-center">
                            <span className="text-xs uppercase text-gray-500 font-bold">Diferencia</span>
                            <span className={`font-mono font-bold ${parseFloat(realSalesInput) - totals.total >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                {formatMoney(parseFloat(realSalesInput) - totals.total)}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-xs uppercase text-gray-500 font-bold">Regalías Ajustadas (Total)</span>
                            <span className="font-mono font-bold text-purple-600 dark:text-purple-400">
                                {formatMoney(totals.profit + (parseFloat(realSalesInput) - totals.total))}
                            </span>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <button 
                            onClick={() => setShowCommitModal(false)}
                            className="flex-1 bg-gray-100 dark:bg-white/5 py-3 rounded-lg text-gray-600 dark:text-gray-300 font-bold hover:bg-gray-200 dark:hover:bg-white/10"
                        >
                            Cancelar
                        </button>
                        <button 
                            onClick={handleCommit}
                            className="flex-1 bg-sushi-gold text-sushi-black py-3 rounded-lg font-bold hover:bg-sushi-goldhover"
                        >
                            Confirmar
                        </button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};