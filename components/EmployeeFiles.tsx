
import React, { useState } from 'react';
import { AbsenceRecord, Employee, SanctionRecord, Task, ChecklistSnapshot } from '../types';
import { Calendar, User, Phone, MapPin, Building, CreditCard, Hash, Briefcase, FileText, CheckCircle2, UserCheck, AlertTriangle, Clock, Link, Check, ClipboardList, History, Eye } from 'lucide-react';
import { TaskChecklist } from './TaskChecklist';
import { RankBadge } from './EmployeeManagement';

interface EmployeeFilesProps {
  employees: Employee[];
  setEmployees: React.Dispatch<React.SetStateAction<Employee[]>>;
  sanctions: SanctionRecord[];
  absences: AbsenceRecord[];
  // Props for task management
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  // Snapshots
  checklistSnapshots?: ChecklistSnapshot[]; // Optional for now
}

// FIX: Component defined outside
const InfoItem = ({ icon: Icon, label, value }: { icon: any, label: string, value?: string | number }) => (
  <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-black/20 rounded-lg border border-gray-200 dark:border-white/5">
    <div className="p-2 bg-white dark:bg-white/5 rounded-full text-gray-400 dark:text-sushi-muted">
      <Icon className="w-4 h-4" />
    </div>
    <div>
      <p className="text-[10px] uppercase tracking-wider text-gray-500 dark:text-sushi-muted font-bold">{label}</p>
      <p className="text-sm font-medium text-gray-900 dark:text-white break-all">{value || '-'}</p>
    </div>
  </div>
);

export const EmployeeFiles: React.FC<EmployeeFilesProps> = ({ employees, setEmployees, sanctions, absences, tasks, setTasks, checklistSnapshots = [] }) => {
  const [selectedEmpId, setSelectedEmpId] = useState<string | null>(null);
  const [justCopied, setJustCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'PROFILE' | 'CHECKLIST_HISTORY'>('PROFILE');

  const getSanctionStats = (empId: string) => {
    const empSanctions = sanctions.filter(s => s.employeeId === empId);
    return {
      strikes: empSanctions.filter(s => s.type === 'STRIKE').length,
      discounts: empSanctions.reduce((acc, curr) => acc + (curr.amount || 0), 0)
    };
  };

  const getAbsenceCount = (empId: string) => {
    return absences.filter(a => a.employeeId === empId).length;
  };

  const toggleDay = (emp: Employee, day: string) => {
    const currentDays = emp.assignedDays || [];
    let newDays;
    if (currentDays.includes(day)) {
        newDays = currentDays.filter(d => d !== day);
    } else {
        newDays = [...currentDays, day];
    }
    setEmployees(employees.map(e => e.id === emp.id ? { ...e, assignedDays: newDays } : e));
  };

  const shareSchedule = (emp: Employee) => {
    const days = emp.assignedDays?.join(', ') || 'Ninguno';
    const text = `*CRONOGRAMA SUSHIBLACK*\n\nHola ${emp.name},\nSe han actualizado tus días asignados para esta semana.\n\n📅 *Días:* ${days}\n⏰ *Horario:* ${emp.scheduleStart} - ${emp.scheduleEnd}\n\nIngresa aquí para confirmar: https://sushiblack.app/schedule/${emp.id}`;
    
    navigator.clipboard.writeText(text);
    setJustCopied(true);
    setTimeout(() => setJustCopied(false), 2000);
  };

  return (
    <div className="h-full">
      {!selectedEmpId ? (
        <div className="space-y-6">
          <div>
            <h2 className="text-3xl font-serif text-gray-900 dark:text-white">Expedientes</h2>
            <p className="text-gray-500 dark:text-sushi-muted mt-2">Base de datos completa del personal de Sushiblack.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {employees.filter(e => e.active).map(emp => {
              const stats = getSanctionStats(emp.id);
              const absenceCount = getAbsenceCount(emp.id);
              return (
                <button 
                  key={emp.id}
                  onClick={() => { setSelectedEmpId(emp.id); setActiveTab('PROFILE'); }}
                  className="bg-white dark:bg-sushi-dark border border-gray-200 dark:border-white/5 p-6 rounded-xl flex flex-col items-center text-center gap-4 hover:border-sushi-gold/50 hover:shadow-lg dark:hover:shadow-sushi-gold/5 transition-all group"
                >
                  <div className="w-24 h-24 rounded-full border-2 border-sushi-gold/20 overflow-hidden bg-gray-100 dark:bg-black/30 group-hover:border-sushi-gold transition-colors">
                     {emp.photoUrl ? <img src={emp.photoUrl} className="w-full h-full object-cover" /> : <User className="w-full h-full p-6 text-gray-300 dark:text-sushi-muted" />}
                  </div>
                  <div>
                    <h3 className="font-serif font-bold text-lg text-gray-900 dark:text-white">{emp.name}</h3>
                    <div className="flex items-center justify-center gap-1.5 mt-1">
                        <RankBadge role={emp.role} />
                    </div>
                    <p className="text-xs uppercase tracking-widest text-gray-500 dark:text-sushi-muted mt-1">{emp.position}</p>
                  </div>
                  <div className="flex gap-2 text-[10px] font-bold">
                    {stats.strikes > 0 && <span className="px-2 py-1 bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-500 rounded border border-red-200 dark:border-red-500/20">{stats.strikes} STRIKES</span>}
                    {absenceCount > 0 && <span className="px-2 py-1 bg-orange-100 dark:bg-orange-500/10 text-orange-600 dark:text-orange-500 rounded border border-orange-200 dark:border-orange-500/20">{absenceCount} FALTAS</span>}
                    {stats.strikes === 0 && absenceCount === 0 && <span className="px-2 py-1 bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-sushi-muted rounded">LIMPIO</span>}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      ) : (
        <div className="max-w-5xl mx-auto animate-fade-in">
           <button 
             onClick={() => setSelectedEmpId(null)} 
             className="mb-6 flex items-center gap-2 text-gray-500 dark:text-sushi-muted hover:text-sushi-gold transition-colors"
           >
             ← Volver al listado
           </button>

           {(() => {
             const emp = employees.find(e => e.id === selectedEmpId);
             if (!emp) return null;
             const stats = getSanctionStats(emp.id);
             const absenceCount = getAbsenceCount(emp.id);
             const empSanctions = sanctions.filter(s => s.employeeId === emp.id).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
             const weekDays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
             const empSnapshots = checklistSnapshots.filter(s => s.employeeId === emp.id).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());

             return (
               <div className="bg-white dark:bg-sushi-dark rounded-2xl border border-gray-200 dark:border-white/5 overflow-hidden shadow-2xl">
                 
                 {/* Header Banner */}
                 <div className="h-32 bg-gradient-to-r from-gray-900 to-black relative">
                    <div className="absolute inset-0 bg-sushi-gold/10 pattern-dots"></div>
                 </div>

                 <div className="px-8 pb-8">
                    <div className="flex flex-col md:flex-row justify-between items-start -mt-12 mb-8">
                       <div className="flex items-end gap-6">
                          <div className="w-32 h-32 rounded-2xl bg-white dark:bg-sushi-dark p-1 shadow-xl">
                             <div className="w-full h-full rounded-xl bg-gray-100 dark:bg-black/50 overflow-hidden relative">
                                {emp.photoUrl ? <img src={emp.photoUrl} className="w-full h-full object-cover" /> : <User className="w-full h-full p-8 text-gray-300" />}
                             </div>
                          </div>
                          <div className="pb-2">
                             <h1 className="text-3xl font-serif text-gray-900 dark:text-white flex items-center gap-2">
                                 {emp.name}
                                 <RankBadge role={emp.role} />
                             </h1>
                             <p className="text-sushi-gold font-bold uppercase tracking-wide text-sm">{emp.position}</p>
                          </div>
                       </div>
                       
                       <div className="mt-4 md:mt-0 pt-14 flex gap-4">
                          <div className="text-center px-4 py-2 bg-gray-50 dark:bg-black/20 rounded-lg border border-gray-200 dark:border-white/5">
                             <span className="block text-2xl font-bold text-gray-900 dark:text-white">{new Date().getFullYear() - new Date(emp.startDate || new Date()).getFullYear()}</span>
                             <span className="text-[10px] text-gray-500 dark:text-sushi-muted uppercase">Años Antig.</span>
                          </div>
                       </div>
                    </div>

                    {/* Navigation Tabs */}
                    <div className="flex border-b border-gray-200 dark:border-white/10 mb-8">
                        <button 
                            onClick={() => setActiveTab('PROFILE')}
                            className={`px-6 py-3 font-bold text-sm flex items-center gap-2 transition-colors ${activeTab === 'PROFILE' ? 'border-b-2 border-sushi-gold text-sushi-gold' : 'text-gray-500 dark:text-sushi-muted hover:text-white'}`}
                        >
                            <FileText className="w-4 h-4" /> Perfil & Desempeño
                        </button>
                        <button 
                            onClick={() => setActiveTab('CHECKLIST_HISTORY')}
                            className={`px-6 py-3 font-bold text-sm flex items-center gap-2 transition-colors ${activeTab === 'CHECKLIST_HISTORY' ? 'border-b-2 border-sushi-gold text-sushi-gold' : 'text-gray-500 dark:text-sushi-muted hover:text-white'}`}
                        >
                            <History className="w-4 h-4" /> Historial Check-list
                        </button>
                    </div>

                    {activeTab === 'CHECKLIST_HISTORY' && (
                        <div className="space-y-6">
                            {empSnapshots.length === 0 ? (
                                <div className="text-center py-12 border border-dashed border-gray-200 dark:border-white/10 rounded-xl">
                                    <ClipboardList className="w-12 h-12 text-gray-300 dark:text-sushi-muted mx-auto mb-3" />
                                    <p className="text-gray-500 dark:text-sushi-muted">No hay check-lists archivados para este empleado.</p>
                                </div>
                            ) : (
                                empSnapshots.map(snap => (
                                    <div key={snap.id} className="bg-gray-50 dark:bg-white/[0.02] border border-gray-200 dark:border-white/5 rounded-xl overflow-hidden">
                                        <div className="p-4 border-b border-gray-200 dark:border-white/5 flex justify-between items-center bg-white dark:bg-black/10">
                                            <div>
                                                <h4 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                                    <Calendar className="w-4 h-4 text-sushi-gold" />
                                                    {new Date(snap.date).toLocaleDateString()}
                                                </h4>
                                                <p className="text-xs text-gray-500 dark:text-sushi-muted">
                                                    Finalizado a las {snap.finalizedAt} por {snap.finalizedBy}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-2xl font-bold text-sushi-gold">
                                                    {Math.round((snap.tasks.filter(t => t.status === 'COMPLETED').length / snap.tasks.length) * 100)}%
                                                </span>
                                                <span className="text-[10px] uppercase block text-gray-400">Cumplimiento</span>
                                            </div>
                                        </div>
                                        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-2">
                                            {snap.tasks.map(t => (
                                                <div key={t.id} className="flex items-center gap-2 text-sm p-2 rounded bg-white dark:bg-white/5 border border-gray-100 dark:border-white/5">
                                                    {t.status === 'COMPLETED' ? <CheckCircle2 className="w-4 h-4 text-green-500"/> : t.status === 'SKIPPED' ? <AlertTriangle className="w-4 h-4 text-red-500"/> : <Clock className="w-4 h-4 text-gray-400"/>}
                                                    <span className={t.status !== 'COMPLETED' ? 'text-gray-500' : 'text-gray-900 dark:text-white'}>{t.description}</span>
                                                    {t.completedAt && <span className="text-[10px] text-gray-400 ml-auto">{t.completedAt}</span>}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {activeTab === 'PROFILE' && (
                        <>
                            {/* Disciplinary Status Card */}
                            <div className={`mb-8 p-4 rounded-xl border flex items-center justify-between ${stats.strikes > 0 ? 'bg-red-50 dark:bg-red-500/5 border-red-200 dark:border-red-500/20' : 'bg-green-50 dark:bg-green-500/5 border-green-200 dark:border-green-500/20'}`}>
                                <div className="flex items-center gap-4">
                                    <div className={`p-3 rounded-full ${stats.strikes > 0 ? 'bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-500' : 'bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-500'}`}>
                                        {stats.strikes > 0 ? <AlertTriangle className="w-6 h-6" /> : <CheckCircle2 className="w-6 h-6" />}
                                    </div>
                                    <div>
                                        <h3 className={`font-bold text-lg ${stats.strikes > 0 ? 'text-red-800 dark:text-red-400' : 'text-green-800 dark:text-green-400'}`}>
                                            {stats.strikes > 0 ? 'Atención Requerida' : 'Expediente Limpio'}
                                        </h3>
                                        <p className="text-sm text-gray-600 dark:text-sushi-muted">
                                            {stats.strikes > 0 ? `Este empleado acumula ${stats.strikes} faltas graves (Strikes).` : 'No se registran faltas graves activas.'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-6 text-right">
                                    <div>
                                        <span className="block text-2xl font-bold text-gray-900 dark:text-white">{absenceCount}</span>
                                        <span className="text-xs uppercase tracking-wide text-gray-500 dark:text-sushi-muted">Faltas Total</span>
                                    </div>
                                    <div>
                                        <span className="block text-2xl font-bold text-gray-900 dark:text-white">{stats.strikes}</span>
                                        <span className="text-xs uppercase tracking-wide text-gray-500 dark:text-sushi-muted">Strikes</span>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            
                            {/* Cronograma / Schedule */}
                            <div className="md:col-span-2 bg-white dark:bg-sushi-dark border border-gray-200 dark:border-white/5 p-6 rounded-xl shadow-sm">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="font-serif text-xl text-gray-900 dark:text-white flex items-center gap-2">
                                        <Clock className="w-5 h-5 text-sushi-gold" />
                                        Cronograma Semanal
                                    </h3>
                                    <button 
                                        onClick={() => shareSchedule(emp)}
                                        className="text-xs bg-sushi-gold text-sushi-black px-3 py-1.5 rounded-lg font-bold flex items-center gap-1 hover:bg-sushi-goldhover transition-colors"
                                    >
                                        {justCopied ? <Check className="w-3 h-3"/> : <Link className="w-3 h-3"/>}
                                        {justCopied ? 'Enlace Copiado' : 'Compartir URL'}
                                    </button>
                                </div>
                                
                                <div className="flex flex-col sm:flex-row items-center gap-6">
                                    <div className="flex flex-wrap gap-2 justify-center">
                                        {weekDays.map(day => {
                                            const isAssigned = (emp.assignedDays || []).includes(day);
                                            return (
                                                <button
                                                    key={day}
                                                    onClick={() => toggleDay(emp, day)}
                                                    className={`w-12 h-12 rounded-lg font-bold text-sm transition-all border ${
                                                        isAssigned 
                                                        ? 'bg-sushi-gold text-sushi-black border-sushi-gold' 
                                                        : 'bg-gray-50 dark:bg-black/20 text-gray-400 dark:text-sushi-muted border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/30'
                                                    }`}
                                                >
                                                    {day}
                                                </button>
                                            )
                                        })}
                                    </div>
                                    <div className="h-full w-px bg-gray-200 dark:bg-white/10 hidden sm:block"></div>
                                    <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
                                        <p className="text-xs uppercase text-gray-500 dark:text-sushi-muted font-bold tracking-wider">Horario de Turno</p>
                                        <p className="text-2xl text-gray-900 dark:text-white font-mono mt-1">{emp.scheduleStart} - {emp.scheduleEnd}</p>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Task Assignment */}
                            <div className="md:col-span-2">
                                    <TaskChecklist tasks={tasks} setTasks={setTasks} employeeId={emp.id} />
                            </div>

                            <div className="space-y-6">
                                <h3 className="font-serif text-xl text-gray-900 dark:text-white border-b border-gray-200 dark:border-white/10 pb-2 flex items-center gap-2">
                                    <FileText className="w-5 h-5 text-sushi-gold" />
                                    Información Personal
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <InfoItem icon={User} label="DNI" value={emp.dni} />
                                    <InfoItem icon={Hash} label="CUIL" value={emp.cuil} />
                                    <InfoItem icon={Phone} label="Teléfono" value={emp.phone} />
                                    <InfoItem icon={Calendar} label="Fecha Nac." value={emp.birthDate} />
                                    <InfoItem icon={MapPin} label="Dirección" value={emp.address} />
                                </div>
                            </div>

                            <div className="space-y-6">
                                <h3 className="font-serif text-xl text-gray-900 dark:text-white border-b border-gray-200 dark:border-white/10 pb-2 flex items-center gap-2">
                                    <Briefcase className="w-5 h-5 text-sushi-gold" />
                                    Datos Contractuales
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <InfoItem icon={Calendar} label="Fecha Ingreso" value={emp.startDate} />
                                    <InfoItem icon={CheckCircle2} label="Modalidad" value={emp.paymentModality} />
                                    <InfoItem icon={UserCheck} label="Entrevistador" value={emp.interviewer} />
                                    <InfoItem icon={Briefcase} label="Sueldo" value={`$${emp.monthlySalary}`} />
                                </div>
                            </div>

                            <div className="space-y-6 md:col-span-2">
                                <h3 className="font-serif text-xl text-gray-900 dark:text-white border-b border-gray-200 dark:border-white/10 pb-2 flex items-center gap-2">
                                    <Building className="w-5 h-5 text-sushi-gold" />
                                    Información Bancaria
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                    <InfoItem icon={User} label="Titular" value={emp.bankAccountHolder} />
                                    <InfoItem icon={Building} label="Banco" value={emp.bankName} />
                                    <InfoItem icon={CreditCard} label="Tipo de Cuenta" value={emp.bankAccountType === 'CAJA_AHORRO' ? 'Caja de Ahorro' : 'Cta. Corriente'} />
                                    <InfoItem icon={Hash} label="Número de Cuenta" value={emp.bankAccountNumber} />
                                    <InfoItem icon={CreditCard} label="CBU / CVU" value={emp.cbu} />
                                    <InfoItem icon={Hash} label="Alias" value={emp.alias} />
                                </div>
                            </div>

                            {/* Sanciones Detail List */}
                            <div className="md:col-span-2 space-y-6 mt-4">
                                <h3 className="font-serif text-xl text-gray-900 dark:text-white border-b border-gray-200 dark:border-white/10 pb-2 flex items-center gap-2">
                                        <AlertTriangle className="w-5 h-5 text-sushi-gold" />
                                        Historial de Novedades y Sanciones
                                </h3>
                                <div className="relative border-l-2 border-gray-200 dark:border-white/10 ml-3 space-y-8">
                                        {empSanctions.length === 0 && (
                                            <p className="ml-6 text-gray-400 dark:text-sushi-muted italic">Este empleado tiene un expediente limpio. No hay novedades registradas.</p>
                                        )}
                                        {empSanctions.map(s => {
                                            let colorClass = "bg-blue-500";
                                            if(s.type === 'STRIKE') colorClass = 'bg-red-600';
                                            if(s.type === 'SUSPENSION') colorClass = 'bg-orange-500';
                                            if(s.type === 'DESCUENTO') colorClass = 'bg-yellow-500';

                                            return (
                                                <div key={s.id} className="relative ml-6">
                                                    <div className={`absolute -left-[31px] w-4 h-4 rounded-full border-2 border-white dark:border-sushi-black ${colorClass}`}></div>
                                                    <div className="bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/10 p-4 rounded-lg hover:border-sushi-gold/20 transition-colors">
                                                        <div className="flex justify-between mb-2">
                                                            <span className={`text-xs font-bold px-2 py-0.5 rounded text-white ${colorClass}`}>{s.type}</span>
                                                            <span className="text-xs text-gray-500 dark:text-sushi-muted">{s.date}</span>
                                                        </div>
                                                        <p className="text-gray-700 dark:text-white text-sm">{s.description}</p>
                                                        {s.amount && <p className="text-red-500 dark:text-red-400 text-sm mt-1 font-mono">-${s.amount} ARS</p>}
                                                    </div>
                                                </div>
                                            )
                                        })}
                                </div>
                            </div>
                            </div>
                        </>
                    )}
                 </div>
               </div>
             );
           })()}
        </div>
      )}
    </div>
  );
};
