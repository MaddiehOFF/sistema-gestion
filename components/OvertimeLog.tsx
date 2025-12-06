
import React, { useState, useMemo, useEffect } from 'react';
import { AbsenceRecord, Employee, OvertimeRecord } from '../types';
import { AlignLeft, Save, Trash2, ChevronLeft, ChevronRight, Clock, Info, CheckCircle2, Circle, XCircle, CalendarX, Check, Filter, Wallet, AlertOctagon, CalendarPlus, Sparkles } from 'lucide-react';

interface OvertimeLogProps {
  employees: Employee[];
  records: OvertimeRecord[];
  setRecords: React.Dispatch<React.SetStateAction<OvertimeRecord[]>>;
  absences: AbsenceRecord[];
  setAbsences: React.Dispatch<React.SetStateAction<AbsenceRecord[]>>;
  holidays?: string[]; // Array of ISO Date Strings
  setHolidays?: React.Dispatch<React.SetStateAction<string[]>>;
}

type TabMode = 'ATTENDANCE' | 'ABSENCE';

export const OvertimeLog: React.FC<OvertimeLogProps> = ({ employees, records, setRecords, absences, setAbsences, holidays = [], setHolidays }) => {
  const [selectedEmpId, setSelectedEmpId] = useState('');
  const [filterEmpId, setFilterEmpId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  // Toggle for Admin Holiday Management
  const [isHolidayMode, setIsHolidayMode] = useState(false);
  
  // Attendance State
  const [actualCheckIn, setActualCheckIn] = useState('');
  const [actualCheckOut, setActualCheckOut] = useState('');
  const [reason, setReason] = useState('');

  // Absence State
  const [absenceReason, setAbsenceReason] = useState('');

  // UI State
  const [mode, setMode] = useState<TabMode>('ATTENDANCE');

  // Sync form selection with filter
  useEffect(() => {
    if (filterEmpId) {
        setSelectedEmpId(filterEmpId);
    }
  }, [filterEmpId]);

  const formatMoney = (val: number) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(val);

  const timeToMinutes = (time: string) => {
    if (!time) return 0;
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  };

  const calculateDurationMinutes = (start: string, end: string) => {
    let startMin = timeToMinutes(start);
    let endMin = timeToMinutes(end);
    if (endMin < startMin) endMin += 24 * 60; // Crosses midnight
    return endMin - startMin;
  };

  const isHoliday = (d: string) => holidays.includes(d);

  const calculationPreview = useMemo(() => {
    if (!selectedEmpId || !actualCheckIn || !actualCheckOut) return null;
    
    const emp = employees.find(e => e.id === selectedEmpId);
    if (!emp) return null;

    const standardMinutes = calculateDurationMinutes(emp.scheduleStart, emp.scheduleEnd);
    const workedMinutes = calculateDurationMinutes(actualCheckIn, actualCheckOut);
    
    const overtimeMin = workedMinutes - standardMinutes;
    // Allow saving even if overtime is 0 or negative (undertime)
    const overtimeHours = overtimeMin > 0 ? overtimeMin / 60 : 0;
    
    const baseHourlyRate = emp.monthlySalary / 200;
    
    // HOLIDAY LOGIC: Double Pay if it's a holiday
    const isHolidayDate = isHoliday(date);
    const overtimeRate = baseHourlyRate * (isHolidayDate ? 2.0 : 1.5); // 2x for Holiday, 1.5x for Normal Overtime
    const totalAmount = overtimeHours * overtimeRate;

    return {
      workedHours: (workedMinutes / 60).toFixed(2),
      standardHours: (standardMinutes / 60).toFixed(2),
      overtimeHours: overtimeHours.toFixed(2),
      rate: overtimeRate,
      amount: totalAmount,
      isOvertime: overtimeHours > 0,
      isUndertime: overtimeMin < 0,
      isHoliday: isHolidayDate
    };
  }, [selectedEmpId, actualCheckIn, actualCheckOut, employees, date, holidays]);

  // Financial Summary for Selected Employee in Current Month
  const employeeMonthSummary = useMemo(() => {
      if (!filterEmpId) return null;
      
      const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
      
      const monthRecords = records.filter(r => {
          const rDate = new Date(r.date);
          return r.employeeId === filterEmpId && rDate >= startOfMonth && rDate <= endOfMonth;
      });

      const monthAbsences = absences.filter(a => {
          const aDate = new Date(a.date);
          return a.employeeId === filterEmpId && aDate >= startOfMonth && aDate <= endOfMonth;
      });

      return {
          totalDebt: monthRecords.filter(r => !r.paid).reduce((acc, curr) => acc + curr.overtimeAmount, 0),
          totalPaid: monthRecords.filter(r => r.paid).reduce((acc, curr) => acc + curr.overtimeAmount, 0),
          totalHours: monthRecords.reduce((acc, curr) => acc + curr.overtimeHours, 0),
          absences: monthAbsences.length
      };

  }, [filterEmpId, currentMonth, records, absences]);


  const handleAddRecord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmpId || !date) return;

    if (mode === 'ATTENDANCE') {
        if (!actualCheckIn || !actualCheckOut) return;

        const calc = calculationPreview;
        if (!calc) return;

        const newRecord: OvertimeRecord = {
            id: crypto.randomUUID(),
            employeeId: selectedEmpId,
            date: date,
            checkIn: actualCheckIn,
            checkOut: actualCheckOut,
            overtimeHours: parseFloat(calc.overtimeHours),
            overtimeAmount: calc.amount,
            reason: reason || (calc.isOvertime ? 'Horas Extras' : 'Turno Regular'),
            paid: false,
            isHoliday: calc.isHoliday
        };

        setRecords([newRecord, ...records]);
        setReason('');
        setActualCheckIn('');
        setActualCheckOut('');
    } else {
        // Absence Mode
        if (!absenceReason) return;
        
        const newAbsence: AbsenceRecord = {
            id: crypto.randomUUID(),
            employeeId: selectedEmpId,
            date: date,
            reason: absenceReason
        };

        setAbsences([newAbsence, ...absences]);
        setAbsenceReason('');
    }
    
    // Do not clear selectedEmpId if filtering
    if (!filterEmpId) setSelectedEmpId('');
  };

  const handleDeleteRecord = (id: string) => {
    if(window.confirm('¿Eliminar registro?')) {
      setRecords(records.filter(r => r.id !== id));
    }
  };

  const handleDeleteAbsence = (id: string) => {
    if(window.confirm('¿Eliminar falta?')) {
      setAbsences(absences.filter(a => a.id !== id));
    }
  };

  const togglePaidStatus = (id: string) => {
    setRecords(records.map(r => r.id === id ? { ...r, paid: !r.paid } : r));
  };

  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
  const startDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1; 

  const handleDateClick = (day: number) => {
    const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const dateStr = newDate.toISOString().split('T')[0];

    if (isHolidayMode && setHolidays) {
        if (holidays.includes(dateStr)) {
            setHolidays(holidays.filter(h => h !== dateStr));
        } else {
            setHolidays([...holidays, dateStr]);
        }
    } else {
        setDate(dateStr);
    }
  };

  const changeMonth = (delta: number) => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + delta, 1));
  };

  const getDayRecords = (d: string) => {
    return records.filter(r => r.date === d && (!filterEmpId || r.employeeId === filterEmpId));
  };

  const getDayAbsences = (d: string) => {
    return absences.filter(a => a.date === d && (!filterEmpId || a.employeeId === filterEmpId));
  };

  const getEmployeeName = (id: string) => {
      const emp = employees.find(e => e.id === id);
      return emp ? emp.name.split(' ')[0] : 'Ex-Staff';
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 h-full">
      {/* Left: Calendar & List */}
      <div className="xl:col-span-2 flex flex-col gap-6">
        
        {/* Calendar Toolbar */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white dark:bg-sushi-dark p-4 rounded-xl border border-gray-200 dark:border-white/5 shadow-sm">
            <div className="flex items-center gap-4">
                 <div className="flex gap-2">
                    <button onClick={() => changeMonth(-1)} className="p-2 bg-gray-100 dark:bg-white/5 rounded-lg hover:bg-gray-200 dark:hover:bg-white/10 text-gray-700 dark:text-white"><ChevronLeft className="w-5 h-5"/></button>
                    <button onClick={() => changeMonth(1)} className="p-2 bg-gray-100 dark:bg-white/5 rounded-lg hover:bg-gray-200 dark:hover:bg-white/10 text-gray-700 dark:text-white"><ChevronRight className="w-5 h-5"/></button>
                 </div>
                 <h3 className="text-xl font-serif text-gray-900 dark:text-white capitalize min-w-[150px]">
                    {currentMonth.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })}
                 </h3>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
                 {/* Holiday Toggle */}
                 {setHolidays && (
                     <button
                        onClick={() => setIsHolidayMode(!isHolidayMode)}
                        className={`px-3 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors ${isHolidayMode ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20' : 'bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-sushi-muted hover:text-purple-500'}`}
                     >
                         <CalendarPlus className="w-4 h-4" />
                         {isHolidayMode ? 'Terminar Edición' : 'Gestionar Feriados'}
                     </button>
                 )}

                <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-gray-400 dark:text-sushi-muted" />
                    <select 
                        value={filterEmpId}
                        onChange={(e) => setFilterEmpId(e.target.value)}
                        className="bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-lg py-2 px-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-sushi-gold"
                    >
                        <option value="">Ver Todos</option>
                        {employees.filter(e => e.active).map(emp => (
                            <option key={emp.id} value={emp.id}>{emp.name}</option>
                        ))}
                    </select>
                </div>
            </div>
        </div>

        {/* Employee Summary Card */}
        {filterEmpId && employeeMonthSummary && (
            <div className="grid grid-cols-3 gap-4 animate-fade-in">
                <div className="bg-white dark:bg-sushi-dark border border-gray-200 dark:border-white/5 p-4 rounded-xl flex items-center gap-4 shadow-sm">
                    <div className="p-3 rounded-full bg-sushi-gold/10 text-yellow-700 dark:text-sushi-gold">
                        <Clock className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-xs uppercase text-gray-500 dark:text-sushi-muted font-bold">Deuda Pendiente</p>
                        <p className="text-xl font-mono font-bold text-yellow-700 dark:text-sushi-gold">{formatMoney(employeeMonthSummary.totalDebt)}</p>
                    </div>
                </div>
                <div className="bg-white dark:bg-sushi-dark border border-gray-200 dark:border-white/5 p-4 rounded-xl flex items-center gap-4 shadow-sm">
                    <div className="p-3 rounded-full bg-green-100 dark:bg-green-500/10 text-green-600 dark:text-green-500">
                        <Wallet className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-xs uppercase text-gray-500 dark:text-sushi-muted font-bold">Total Abonado</p>
                        <p className="text-xl font-mono font-bold text-green-600 dark:text-green-500">{formatMoney(employeeMonthSummary.totalPaid)}</p>
                    </div>
                </div>
                <div className="bg-white dark:bg-sushi-dark border border-gray-200 dark:border-white/5 p-4 rounded-xl flex items-center gap-4 shadow-sm">
                    <div className="p-3 rounded-full bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-500">
                        <AlertOctagon className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-xs uppercase text-gray-500 dark:text-sushi-muted font-bold">Faltas Mes</p>
                        <p className="text-xl font-mono font-bold text-red-600 dark:text-red-500">{employeeMonthSummary.absences}</p>
                    </div>
                </div>
            </div>
        )}

        {/* Calendar Grid */}
        <div className={`bg-white dark:bg-sushi-dark border border-gray-200 dark:border-white/5 rounded-xl p-6 shadow-sm transition-all duration-300 ${isHolidayMode ? 'ring-2 ring-purple-500' : ''}`}>
          
          {isHolidayMode && (
              <div className="mb-4 text-center">
                  <span className="text-xs font-bold text-purple-600 bg-purple-100 dark:bg-purple-900/30 px-3 py-1 rounded-full uppercase tracking-wider animate-pulse">
                      Modo Edición de Feriados Activado
                  </span>
                  <p className="text-xs text-gray-400 mt-2">Haz clic en los días para marcarlos/desmarcarlos como feriados oficiales (Pago Doble).</p>
              </div>
          )}

          <div className="grid grid-cols-7 gap-2 mb-4 text-center">
            {['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'].map(d => (
              <div key={d} className="text-gray-400 dark:text-sushi-muted text-xs font-bold uppercase">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: startDay }).map((_, i) => (
              <div key={`empty-${i}`} className="h-24" />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateStr = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day).toISOString().split('T')[0];
              const dayRecs = getDayRecords(dateStr);
              const dayAbsences = getDayAbsences(dateStr);
              const hasRecords = dayRecs.length > 0;
              const hasAbsences = dayAbsences.length > 0;
              const isSelected = date === dateStr;
              const isToday = dateStr === new Date().toISOString().split('T')[0];
              const isDayHoliday = holidays.includes(dateStr);
              const hasUnpaid = dayRecs.some(r => !r.paid);
              
              // Visual styles based on filter and mode
              let cellBg = 'bg-gray-50 dark:bg-white/[0.02]';
              
              if (isDayHoliday) cellBg = 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-500/30';
              if (isSelected && !isHolidayMode) cellBg = 'bg-sushi-gold/5 dark:bg-sushi-gold/10';
              if (hasAbsences) cellBg = 'bg-red-50 dark:bg-red-900/10'; 

              return (
                <div 
                  key={day}
                  onClick={() => handleDateClick(day)}
                  className={`h-24 border rounded-lg p-2 cursor-pointer transition-all relative flex flex-col justify-between ${cellBg} ${isSelected && !isHolidayMode ? 'border-sushi-gold' : 'border-gray-100 dark:border-white/5 hover:bg-gray-100 dark:hover:bg-white/5'}`}
                >
                  <div className="flex justify-between items-start">
                     <span className={`text-sm font-medium ${isToday ? 'text-sushi-gold' : isDayHoliday ? 'text-purple-600 dark:text-purple-400' : 'text-gray-600 dark:text-sushi-text'}`}>{day}</span>
                     
                     <div className="flex gap-1">
                        {isDayHoliday && <Sparkles className="w-3 h-3 text-purple-500 fill-purple-500" />}
                        {hasRecords && !isHolidayMode && <div className={`w-2 h-2 rounded-full ${hasUnpaid ? 'bg-sushi-gold' : 'bg-green-500'}`} />}
                        {hasAbsences && !isHolidayMode && <div className="w-2 h-2 rounded-full bg-red-500" />}
                     </div>
                  </div>
                  
                  {!isHolidayMode && (
                      <div className="flex flex-col gap-1 overflow-hidden">
                          {dayAbsences.map(a => (
                              <div key={a.id} className="text-[10px] px-1.5 py-0.5 rounded truncate font-medium flex items-center gap-1 bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-500 border border-red-200 dark:border-red-500/20">
                                  <XCircle className="w-2 h-2" />
                                  {filterEmpId ? 'AUSENTE' : getEmployeeName(a.employeeId)}
                              </div>
                          ))}
                          {dayRecs.slice(0, 2 - Math.min(2, dayAbsences.length)).map(r => (
                            <div key={r.id} className={`text-[10px] px-1.5 py-0.5 rounded truncate font-medium flex items-center gap-1 ${r.paid ? 'bg-green-500/10 text-green-600 dark:text-green-400' : 'bg-sushi-gold/20 text-sushi-gold-dark dark:text-sushi-gold'}`}>
                              {filterEmpId ? (
                                  <div className="flex justify-between w-full">
                                      <span>{r.overtimeAmount > 0 ? formatMoney(r.overtimeAmount) : 'Regular'}</span>
                                      {r.paid ? <CheckCircle2 className="w-3 h-3"/> : <Clock className="w-3 h-3"/>}
                                  </div>
                              ) : (
                                  getEmployeeName(r.employeeId)
                              )}
                            </div>
                          ))}
                      </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Day Details (Hidden in Holiday Mode) */}
        {!isHolidayMode && (
            <div className="space-y-4">
            <div className="flex items-center gap-3 border-b border-gray-200 dark:border-white/10 pb-2">
                <h4 className="text-gray-900 dark:text-white font-serif text-lg">
                    Registros del {new Date(date).toLocaleDateString('es-AR', { dateStyle: 'full' })}
                </h4>
                {isHoliday(date) && (
                    <span className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        FERIADO OFICIAL
                    </span>
                )}
            </div>
            
            {getDayRecords(date).length === 0 && getDayAbsences(date).length === 0 ? (
                <p className="text-gray-500 dark:text-sushi-muted italic text-sm">No hay actividad registrada para este día.</p>
            ) : (
                <div className="grid gap-3">
                {/* Absences List */}
                {getDayAbsences(date).map(abs => {
                    const empName = employees.find(e => e.id === abs.employeeId)?.name || 'Desconocido (Ex-Staff)';
                    return (
                        <div key={abs.id} className="bg-red-50 dark:bg-red-500/5 border border-red-200 dark:border-red-500/20 p-4 rounded-lg flex items-center justify-between group">
                            <div className="flex items-center gap-4">
                                <div className="p-2 rounded-full bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-500">
                                    <CalendarX className="w-5 h-5"/>
                                </div>
                                <div>
                                    <p className="text-gray-900 dark:text-white font-bold">{empName}</p>
                                    <p className="text-xs text-red-600 dark:text-red-400 font-medium">FALTA REGISTRADA</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className="text-sm text-gray-600 dark:text-sushi-muted italic">"{abs.reason}"</span>
                                <button onClick={() => handleDeleteAbsence(abs.id)} className="text-gray-400 dark:text-sushi-muted hover:text-red-500 p-2 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg">
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    );
                })}

                {/* Attendance List */}
                {getDayRecords(date).map(rec => {
                    const isOvertime = rec.overtimeAmount > 0;
                    const empName = employees.find(e => e.id === rec.employeeId)?.name || 'Desconocido (Ex-Staff)';
                    return (
                    <div key={rec.id} className={`bg-white dark:bg-sushi-dark border p-4 rounded-lg flex items-center justify-between group transition-all ${rec.paid ? 'border-green-500/20 bg-green-50 dark:bg-green-500/5' : 'border-gray-200 dark:border-white/5 hover:border-sushi-gold/30'}`}>
                        <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-full ${rec.paid ? 'bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-500' : 'bg-sushi-gold/10 text-sushi-gold'}`}>
                            {rec.paid ? <CheckCircle2 className="w-5 h-5"/> : <Clock className="w-5 h-5" />}
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <p className="text-gray-900 dark:text-white font-bold">{empName}</p>
                                {rec.paid && <span className="text-[10px] text-green-600 dark:text-green-500 border border-green-200 dark:border-green-500/30 px-1 rounded uppercase tracking-wider">Pagado</span>}
                                {rec.isHoliday && <span className="text-[10px] text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/20 px-1 rounded uppercase tracking-wider font-bold">2x Feriado</span>}
                            </div>
                            <p className="text-xs text-gray-500 dark:text-sushi-muted">
                            Entrada: {rec.checkIn} | Salida: {rec.checkOut}
                            </p>
                        </div>
                        </div>
                        <div className="flex items-center gap-6">
                            <div className="text-right">
                                {isOvertime ? (
                                    <>
                                        <p className={`${rec.paid ? 'text-green-600 dark:text-green-500' : 'text-sushi-gold'} font-bold text-lg`}>{formatMoney(rec.overtimeAmount)}</p>
                                        <p className="text-xs text-gray-500 dark:text-sushi-muted">+{rec.overtimeHours.toFixed(2)} hrs extras</p>
                                    </>
                                ) : (
                                    <>
                                        <p className="text-gray-400 dark:text-sushi-muted font-bold text-lg">$0,00</p>
                                        <p className="text-xs text-gray-400 dark:text-sushi-muted">Turno Regular</p>
                                    </>
                                )}
                            </div>
                            <div className="flex gap-2">
                                {isOvertime && (
                                    <button 
                                        onClick={() => togglePaidStatus(rec.id)}
                                        className={`p-2 rounded-lg transition-colors ${rec.paid ? 'text-green-600 dark:text-green-500 hover:bg-green-100 dark:hover:bg-green-500/10' : 'text-gray-400 dark:text-sushi-muted hover:text-green-600 hover:bg-green-100 dark:hover:bg-green-500/10'}`}
                                        title={rec.paid ? "Marcar como pendiente" : "Marcar como pagado"}
                                    >
                                        {rec.paid ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                                    </button>
                                )}
                                <button onClick={() => handleDeleteRecord(rec.id)} className="text-gray-400 dark:text-sushi-muted hover:text-red-500 p-2 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg">
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>
                )})}
                </div>
            )}
            </div>
        )}
      </div>

      {/* Right: Add Form (Hidden in Holiday Mode) */}
      {!isHolidayMode && (
        <div className="xl:col-span-1">
            <div className="bg-white dark:bg-sushi-dark border border-gray-200 dark:border-white/5 p-6 rounded-xl sticky top-8 shadow-xl">
            <div className="flex items-center gap-2 mb-6">
                <h3 className="text-xl font-serif text-gray-900 dark:text-white">Libro de Actas</h3>
                <span className="text-xs bg-sushi-gold text-sushi-black px-2 py-0.5 rounded font-bold">DIARIO</span>
            </div>

            <div className="flex border-b border-gray-200 dark:border-white/10 mb-6">
                <button 
                    onClick={() => setMode('ATTENDANCE')}
                    className={`flex-1 pb-2 text-sm font-bold uppercase tracking-wide transition-colors ${mode === 'ATTENDANCE' ? 'text-sushi-gold border-b-2 border-sushi-gold' : 'text-gray-400 dark:text-sushi-muted hover:text-gray-900 dark:hover:text-white'}`}
                >
                    Registrar Turno
                </button>
                <button 
                    onClick={() => setMode('ABSENCE')}
                    className={`flex-1 pb-2 text-sm font-bold uppercase tracking-wide transition-colors ${mode === 'ABSENCE' ? 'text-red-500 border-b-2 border-red-500' : 'text-gray-400 dark:text-sushi-muted hover:text-red-400'}`}
                >
                    Registrar Falta
                </button>
            </div>

            <form onSubmit={handleAddRecord} className="space-y-5">
                <div>
                <label className="block text-xs uppercase tracking-wider text-gray-500 dark:text-sushi-muted mb-1">Empleado</label>
                <select 
                    value={selectedEmpId}
                    onChange={(e) => setSelectedEmpId(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-lg py-3 px-4 text-gray-900 dark:text-white focus:outline-none focus:border-sushi-gold transition-colors appearance-none"
                    required
                >
                    <option value="" disabled>Seleccionar Personal...</option>
                    {employees.filter(e => e.active).map(emp => (
                    <option key={emp.id} value={emp.id} className="dark:bg-sushi-dark">
                        {emp.name}
                    </option>
                    ))}
                </select>
                </div>

                {selectedEmpId && mode === 'ATTENDANCE' && (
                <div className="bg-blue-50 dark:bg-white/5 p-3 rounded-lg border border-blue-100 dark:border-white/10 flex gap-2 text-xs text-gray-600 dark:text-sushi-muted mb-2">
                    <Info className="w-4 h-4 text-blue-500 dark:text-sushi-gold" />
                    <span>Horario Oficial: <strong className="text-gray-900 dark:text-white">{employees.find(e => e.id === selectedEmpId)?.scheduleStart} - {employees.find(e => e.id === selectedEmpId)?.scheduleEnd}</strong></span>
                </div>
                )}

                <div>
                <label className="block text-xs uppercase tracking-wider text-gray-500 dark:text-sushi-muted mb-1">Fecha Registro</label>
                <input 
                    type="date" 
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-lg py-3 px-4 text-gray-900 dark:text-white focus:outline-none focus:border-sushi-gold transition-colors [color-scheme:light] dark:[color-scheme:dark]"
                    required
                />
                </div>

                {mode === 'ATTENDANCE' ? (
                    <>
                        <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs uppercase tracking-wider text-gray-500 dark:text-sushi-muted mb-1">Hora Real Ingreso</label>
                            <input 
                            type="time" 
                            value={actualCheckIn}
                            onChange={(e) => setActualCheckIn(e.target.value)}
                            className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-lg py-3 px-2 text-gray-900 dark:text-white focus:outline-none focus:border-sushi-gold [color-scheme:light] dark:[color-scheme:dark]"
                            required
                            />
                        </div>
                        <div>
                            <label className="block text-xs uppercase tracking-wider text-gray-500 dark:text-sushi-muted mb-1">Hora Real Salida</label>
                            <input 
                            type="time" 
                            value={actualCheckOut}
                            onChange={(e) => setActualCheckOut(e.target.value)}
                            className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-lg py-3 px-2 text-gray-900 dark:text-white focus:outline-none focus:border-sushi-gold [color-scheme:light] dark:[color-scheme:dark]"
                            required
                            />
                        </div>
                        </div>

                        <div>
                        <label className="block text-xs uppercase tracking-wider text-gray-500 dark:text-sushi-muted mb-1">Motivo / Notas</label>
                        <div className="relative">
                            <AlignLeft className="absolute left-3 top-3 w-5 h-5 text-gray-400 dark:text-sushi-muted" />
                            <input 
                            type="text" 
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Ej. Turno regular"
                            className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-lg py-3 pl-10 pr-4 text-gray-900 dark:text-white focus:outline-none focus:border-sushi-gold transition-colors"
                            />
                        </div>
                        </div>

                        {/* Live Calculation Result */}
                        {calculationPreview && (
                        <div className={`p-4 rounded-lg border transition-colors ${calculationPreview.isOvertime ? 'bg-sushi-gold/10 border-sushi-gold/30' : 'bg-green-50 dark:bg-green-500/10 border-green-200 dark:border-green-500/20'}`}>
                            {calculationPreview.isOvertime ? (
                            <>
                                <div className="flex justify-between items-end mb-1">
                                    <span className="text-gray-500 dark:text-sushi-muted text-xs uppercase">
                                        Valor Hora {calculationPreview.isHoliday ? '(2x Feriado)' : '(1.5x)'}
                                    </span>
                                    <span className="text-gray-900 dark:text-white font-mono text-sm">{formatMoney(calculationPreview.rate)}</span>
                                </div>
                                <div className="flex justify-between items-end border-t border-gray-300 dark:border-white/10 pt-2 mt-1">
                                    <span className="text-yellow-700 dark:text-sushi-gold font-bold">A PAGAR ({calculationPreview.overtimeHours}h)</span>
                                    <span className="text-yellow-700 dark:text-sushi-gold font-bold text-xl">{formatMoney(calculationPreview.amount)}</span>
                                </div>
                            </>
                            ) : (
                            <div className="flex items-center gap-3">
                                <div className="bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-500 p-2 rounded-full">
                                    <Check className="w-5 h-5" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-green-700 dark:text-green-500 text-sm">Turno Regular</h4>
                                    <p className="text-xs text-gray-500 dark:text-sushi-muted">
                                        {calculationPreview.workedHours}h trabajadas (Contrato: {calculationPreview.standardHours}h).
                                        <br />
                                        <span className="font-bold">No corresponde pago extra.</span>
                                    </p>
                                </div>
                            </div>
                            )}
                        </div>
                        )}

                        <button 
                        type="submit" 
                        className="w-full bg-sushi-gold text-sushi-black font-bold py-3 rounded-lg hover:bg-sushi-goldhover transition-colors flex justify-center items-center gap-2 mt-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-sushi-gold/20"
                        >
                        <Save className="w-5 h-5" />
                        Registrar en Actas
                        </button>
                    </>
                ) : (
                    // ABSENCE FORM
                    <>
                        <div>
                            <label className="block text-xs uppercase tracking-wider text-gray-500 dark:text-sushi-muted mb-1">Motivo de la Falta</label>
                            <textarea 
                                value={absenceReason}
                                onChange={(e) => setAbsenceReason(e.target.value)}
                                placeholder="Ej. Enfermedad sin aviso..."
                                rows={3}
                                className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-lg py-3 px-4 text-gray-900 dark:text-white focus:outline-none focus:border-red-500 transition-colors"
                                required
                            />
                        </div>
                        
                        <button 
                        type="submit" 
                        className="w-full bg-red-600 text-white font-bold py-3 rounded-lg hover:bg-red-700 transition-colors flex justify-center items-center gap-2 mt-2 shadow-lg shadow-red-600/20"
                        >
                        <CalendarX className="w-5 h-5" />
                        Registrar Ausencia
                        </button>
                    </>
                )}

            </form>
            </div>
        </div>
      )}
    </div>
  );
};
