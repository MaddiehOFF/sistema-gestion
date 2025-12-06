
import React, { useState, useEffect } from 'react';
import { InventoryItem, InventorySession } from '../types';
import { Box, Plus, Save, History, ChefHat, ArrowRight, Trash2, Clock, Check, FileText, Copy, Loader2, Sparkles } from 'lucide-react';
import { generateInventoryEmail } from '../services/geminiService';

interface InventoryManagerProps {
  items: InventoryItem[];
  setItems: React.Dispatch<React.SetStateAction<InventoryItem[]>>;
  sessions: InventorySession[];
  setSessions: React.Dispatch<React.SetStateAction<InventorySession[]>>;
  userName: string;
}

export const InventoryManager: React.FC<InventoryManagerProps> = ({ items, setItems, sessions, setSessions, userName }) => {
  const [activeTab, setActiveTab] = useState<'SHIFT' | 'HISTORY'>('SHIFT');
  const [currentSession, setCurrentSession] = useState<InventorySession | null>(null);
  
  // Custom Item State
  const [showAddItem, setShowAddItem] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemUnit, setNewItemUnit] = useState('Kg');

  // Input States
  const [inputs, setInputs] = useState<Record<string, number>>({});

  // Time Selection State
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<'START' | 'END' | null>(null);
  const [manualTime, setManualTime] = useState('');

  // AI Report State
  const [generatingReportId, setGeneratingReportId] = useState<string | null>(null);
  const [reportText, setReportText] = useState<string | null>(null);

  useEffect(() => {
      // Check if there is an open session
      const open = sessions.find(s => s.status === 'OPEN');
      if (open) {
          setCurrentSession(open);
          // Pre-fill inputs with initial if needed, or leave blank
      }
  }, [sessions]);

  const initiateAction = (action: 'START' | 'END') => {
      setPendingAction(action);
      setManualTime(new Date().toLocaleTimeString('es-AR', {hour: '2-digit', minute:'2-digit'}));
      setShowTimeModal(true);
  };

  const confirmTime = (useCurrent: boolean) => {
      const time = useCurrent 
        ? new Date().toLocaleTimeString('es-AR', {hour: '2-digit', minute:'2-digit'}) 
        : manualTime;
      
      if (pendingAction === 'START') {
          handleStartSession(time);
      } else {
          handleCloseSession(time);
      }
      setShowTimeModal(false);
      setPendingAction(null);
  };

  const handleStartSession = (startTime: string) => {
      const session: InventorySession = {
          id: crypto.randomUUID(),
          date: new Date().toISOString(),
          status: 'OPEN',
          openedBy: userName,
          startTime: startTime,
          data: items.map(i => ({
              itemId: i.id,
              initial: isNaN(inputs[i.id]) ? 0 : (inputs[i.id] || 0)
          }))
      };
      setSessions([session, ...sessions]);
      setCurrentSession(session);
      setInputs({});
  };

  const handleCloseSession = (endTime: string) => {
      if (!currentSession) return;
      
      const updatedSession: InventorySession = {
          ...currentSession,
          status: 'CLOSED',
          closedBy: userName,
          endTime: endTime,
          data: currentSession.data.map(d => {
              const finalVal = isNaN(inputs[d.itemId]) ? 0 : (inputs[d.itemId] || 0);
              return {
                  ...d,
                  final: finalVal,
                  consumption: d.initial - finalVal
              };
          })
      };

      setSessions(sessions.map(s => s.id === currentSession.id ? updatedSession : s));
      setCurrentSession(null);
      setInputs({});
      setActiveTab('HISTORY');
  };

  const handleAddItem = (e: React.FormEvent) => {
      e.preventDefault();
      if (!newItemName) return;
      const item: InventoryItem = {
          id: crypto.randomUUID(),
          name: newItemName,
          unit: newItemUnit
      };
      setItems([...items, item]);
      setNewItemName('');
      setShowAddItem(false);
  };

  const deleteItem = (id: string) => {
      if (window.confirm("¿Eliminar este ítem del inventario?")) {
          setItems(items.filter(i => i.id !== id));
      }
  };

  const handleGenerateEmail = async (session: InventorySession) => {
      setGeneratingReportId(session.id);
      setReportText(null);
      const text = await generateInventoryEmail(session, items);
      setReportText(text);
      setGeneratingReportId(null);
  };

  const handleInputChange = (itemId: string, valStr: string) => {
      // Allow empty string to let user delete content
      if (valStr === '') {
          const newInputs = {...inputs};
          delete newInputs[itemId]; // Remove key to show placeholder/empty
          setInputs(newInputs);
          return;
      }
      const val = parseFloat(valStr);
      setInputs({...inputs, [itemId]: val});
  }

  return (
    <div className="space-y-6 animate-fade-in">
        <div className="flex justify-between items-center">
            <div>
                <h2 className="text-3xl font-serif text-gray-900 dark:text-white flex items-center gap-3">
                    <Box className="w-8 h-8 text-sushi-gold" />
                    Inventario de Cocina
                </h2>
                <p className="text-gray-500 dark:text-sushi-muted mt-2">Control de stock inicial y final por turno.</p>
            </div>
            <div className="flex gap-2 bg-gray-100 dark:bg-white/5 p-1 rounded-lg">
                <button 
                    onClick={() => setActiveTab('SHIFT')} 
                    className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all text-sm font-medium ${activeTab === 'SHIFT' ? 'bg-sushi-gold text-sushi-black' : 'text-gray-500 dark:text-sushi-muted hover:text-gray-900 dark:hover:text-white'}`}
                >
                    <ChefHat className="w-4 h-4" />
                    Turno Actual
                </button>
                <button 
                    onClick={() => setActiveTab('HISTORY')} 
                    className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all text-sm font-medium ${activeTab === 'HISTORY' ? 'bg-sushi-gold text-sushi-black' : 'text-gray-500 dark:text-sushi-muted hover:text-gray-900 dark:hover:text-white'}`}
                >
                    <History className="w-4 h-4" />
                    Reportes
                </button>
            </div>
        </div>

        {activeTab === 'SHIFT' && (
            <div className="bg-white dark:bg-sushi-dark border border-gray-200 dark:border-white/5 rounded-xl p-6 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                        {currentSession ? 'Cierre de Servicio (Final)' : 'Apertura de Servicio (Inicial)'}
                    </h3>
                    <button 
                        onClick={() => setShowAddItem(!showAddItem)}
                        className="text-xs bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 px-3 py-1.5 rounded-lg transition-colors"
                    >
                        + Item Personalizado
                    </button>
                </div>

                {showAddItem && (
                    <form onSubmit={handleAddItem} className="mb-6 p-4 bg-gray-50 dark:bg-black/20 rounded-lg flex gap-3 items-end border border-gray-200 dark:border-white/5 animate-slide-up">
                        <div className="flex-1">
                            <label className="text-[10px] uppercase text-gray-500 mb-1 block">Nombre Insumo</label>
                            <input 
                                value={newItemName}
                                onChange={e => setNewItemName(e.target.value)}
                                className="w-full p-2 rounded bg-white dark:bg-black/30 border border-gray-300 dark:border-white/10 text-sm outline-none focus:border-sushi-gold"
                                placeholder="Ej. Atún Rojo"
                            />
                        </div>
                        <div className="w-24">
                            <label className="text-[10px] uppercase text-gray-500 mb-1 block">Unidad</label>
                            <select 
                                value={newItemUnit}
                                onChange={e => setNewItemUnit(e.target.value)}
                                className="w-full p-2 rounded bg-white dark:bg-black/30 border border-gray-300 dark:border-white/10 text-sm outline-none"
                            >
                                <option value="Kg">Kg</option>
                                <option value="Un">Unidad</option>
                                <option value="Lts">Litros</option>
                                <option value="Paq">Paquete</option>
                            </select>
                        </div>
                        <button type="submit" className="bg-sushi-gold text-sushi-black p-2 rounded hover:bg-sushi-goldhover">
                            <Plus className="w-5 h-5" />
                        </button>
                    </form>
                )}

                <div className="space-y-4">
                    {items.map(item => (
                        <div key={item.id} className="flex items-center gap-4 py-2 border-b border-gray-100 dark:border-white/5 last:border-0">
                            <div className="flex-1">
                                <p className="font-bold text-gray-900 dark:text-white">{item.name}</p>
                                <p className="text-xs text-gray-500 dark:text-sushi-muted">Unidad: {item.unit}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <input 
                                    type="number"
                                    value={inputs[item.id] === undefined ? '' : inputs[item.id]}
                                    onChange={e => handleInputChange(item.id, e.target.value)}
                                    placeholder="0"
                                    className="w-24 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-lg py-2 px-3 text-right font-mono text-gray-900 dark:text-white focus:border-sushi-gold outline-none"
                                />
                                <span className="text-sm text-gray-400 w-8">{item.unit}</span>
                                <button onClick={() => deleteItem(item.id)} className="text-gray-300 hover:text-red-500 transition-colors">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-8 pt-4 border-t border-gray-200 dark:border-white/10">
                    {currentSession ? (
                        <button 
                            onClick={() => initiateAction('END')}
                            className="w-full bg-red-600 text-white font-bold py-3 rounded-xl hover:bg-red-700 transition-colors shadow-lg shadow-red-600/20 flex items-center justify-center gap-2"
                        >
                            <Save className="w-5 h-5" />
                            Cerrar Turno y Calcular Consumo
                        </button>
                    ) : (
                            <button 
                            onClick={() => initiateAction('START')}
                            className="w-full bg-sushi-gold text-sushi-black font-bold py-3 rounded-xl hover:bg-sushi-goldhover transition-colors shadow-lg shadow-sushi-gold/20 flex items-center justify-center gap-2"
                        >
                            <ArrowRight className="w-5 h-5" />
                            Iniciar Turno (Stock Apertura)
                        </button>
                    )}
                </div>
            </div>
        )}

        {activeTab === 'HISTORY' && (
            <div className="space-y-6">
                 {sessions.filter(s => s.status === 'CLOSED').length === 0 && (
                    <div className="p-8 text-center text-gray-400 dark:text-sushi-muted italic bg-white dark:bg-sushi-dark rounded-xl border border-gray-200 dark:border-white/5">
                        No hay reportes cerrados aún.
                    </div>
                 )}
                 
                 {sessions.filter(s => s.status === 'CLOSED').map(session => (
                    <div key={session.id} className="bg-white dark:bg-sushi-dark border border-gray-200 dark:border-white/5 rounded-xl overflow-hidden shadow-sm">
                        <div className="bg-gray-50 dark:bg-black/20 p-4 border-b border-gray-200 dark:border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div>
                                <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    <FileText className="w-5 h-5 text-sushi-gold" />
                                    Reporte de Consumo: {new Date(session.date).toLocaleDateString('es-AR')}
                                </h3>
                                <div className="flex gap-4 mt-2 text-xs text-gray-500 dark:text-sushi-muted">
                                    <span className="flex items-center gap-1"><Clock className="w-3 h-3"/> Apertura: {session.startTime} ({session.openedBy})</span>
                                    <span className="flex items-center gap-1"><Clock className="w-3 h-3"/> Cierre: {session.endTime} ({session.closedBy})</span>
                                </div>
                            </div>
                            <button 
                                onClick={() => handleGenerateEmail(session)}
                                disabled={!!generatingReportId}
                                className="bg-white dark:bg-white/10 border border-gray-200 dark:border-white/10 hover:border-sushi-gold px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all shadow-sm"
                            >
                                {generatingReportId === session.id ? <Loader2 className="w-4 h-4 animate-spin"/> : <Sparkles className="w-4 h-4 text-sushi-gold"/>}
                                Redactar Informe Email
                            </button>
                        </div>
                        
                        {/* AI Report Result Area */}
                        {reportText && generatingReportId === null && (
                            <div className="p-4 bg-yellow-50 dark:bg-sushi-gold/5 border-b border-yellow-100 dark:border-sushi-gold/10 relative">
                                <h4 className="text-xs font-bold uppercase text-yellow-700 dark:text-sushi-gold mb-2">Borrador Generado</h4>
                                <pre className="whitespace-pre-wrap text-sm text-gray-700 dark:text-sushi-text font-mono bg-white dark:bg-black/30 p-3 rounded border border-gray-200 dark:border-white/5 mb-2">
                                    {reportText}
                                </pre>
                                <button 
                                    onClick={() => {navigator.clipboard.writeText(reportText); setReportText(null); alert('Copiado al portapapeles');}}
                                    className="text-xs bg-sushi-gold text-sushi-black px-3 py-1 rounded font-bold flex items-center gap-1"
                                >
                                    <Copy className="w-3 h-3"/> Copiar
                                </button>
                                <button onClick={() => setReportText(null)} className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4"/></button>
                            </div>
                        )}

                        <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                            {session.data.map(d => {
                                const item = items.find(i => i.id === d.itemId);
                                if (!item) return null;
                                return (
                                    <div key={d.itemId} className="bg-gray-50 dark:bg-white/[0.02] p-2 rounded border border-gray-100 dark:border-white/5">
                                        <p className="text-xs text-gray-500 dark:text-sushi-muted uppercase">{item.name}</p>
                                        <p className="font-mono font-bold text-gray-900 dark:text-white">
                                            -{d.consumption?.toFixed(1)} <span className="text-xs font-normal">{item.unit}</span>
                                        </p>
                                        <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                                            <span>In: {d.initial}</span>
                                            <span>Fin: {d.final}</span>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                 ))}
            </div>
        )}

        {/* Time Modal */}
        {showTimeModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white dark:bg-sushi-dark w-full max-w-xs rounded-xl p-6 border border-gray-200 dark:border-white/10 shadow-2xl animate-fade-in text-center">
                  <div className="w-12 h-12 bg-sushi-gold text-sushi-black rounded-full flex items-center justify-center mx-auto mb-4">
                      <Clock className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                      {pendingAction === 'START' ? 'Horario de Apertura' : 'Horario de Cierre'}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-sushi-muted mb-4">
                      ¿Qué hora deseas registrar para este reporte?
                  </p>
                  
                  <div className="space-y-3">
                      <button 
                        onClick={() => confirmTime(true)}
                        className="w-full py-3 bg-sushi-gold text-sushi-black font-bold rounded-lg hover:bg-sushi-goldhover transition-colors flex items-center justify-center gap-2"
                      >
                          <Check className="w-4 h-4" /> Ahora Mismo
                      </button>
                      
                      <div className="relative">
                          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200 dark:border-white/10"></div></div>
                          <div className="relative flex justify-center text-xs uppercase"><span className="bg-white dark:bg-sushi-dark px-2 text-gray-400">O manual</span></div>
                      </div>

                      <div className="flex gap-2">
                          <input 
                            type="time" 
                            value={manualTime}
                            onChange={(e) => setManualTime(e.target.value)}
                            className="flex-1 bg-gray-100 dark:bg-black/30 border border-gray-300 dark:border-white/10 rounded-lg px-3 py-2 text-center text-gray-900 dark:text-white focus:border-sushi-gold outline-none [color-scheme:light] dark:[color-scheme:dark]"
                          />
                          <button 
                            onClick={() => confirmTime(false)}
                            className="bg-gray-200 dark:bg-white/10 hover:bg-gray-300 dark:hover:bg-white/20 text-gray-900 dark:text-white px-4 rounded-lg font-bold"
                          >
                              OK
                          </button>
                      </div>
                  </div>
                  <button onClick={() => setShowTimeModal(false)} className="mt-4 text-xs text-gray-400 hover:text-gray-900 dark:hover:text-white underline">Cancelar</button>
              </div>
          </div>
        )}
    </div>
  );
};
