
import React, { useState } from 'react';
import { Employee, OvertimeRecord, AbsenceRecord, Task, SanctionRecord, View, ForumPost, ChecklistSnapshot } from '../types';
import { TaskChecklist } from './TaskChecklist';
import { Clock, Wallet, AlertOctagon, Calendar, User as UserIcon, Bell, CreditCard, ChevronLeft, ChevronRight, Hash, Phone, MapPin, Building, Briefcase, CheckCircle2, UserCheck, X, Eye, EyeOff, Box, ArrowRight } from 'lucide-react';
import { AIReport } from './AIReport';
import { RankBadge } from './EmployeeManagement';
import { ForumBoard } from './ForumBoard';

interface MemberViewProps {
  currentView: View;
  member: Employee;
  records: OvertimeRecord[];
  absences: AbsenceRecord[];
  sanctions: SanctionRecord[];
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  posts?: ForumPost[];
  setPosts?: React.Dispatch<React.SetStateAction<ForumPost[]>>;
  setView?: (view: View) => void; 
  setChecklistSnapshots?: React.Dispatch<React.SetStateAction<ChecklistSnapshot[]>>; // Added for finalizing tasks
  checklistSnapshots?: ChecklistSnapshot[];
}

// Reuse InfoItem for consistency
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

export const MemberView: React.FC<MemberViewProps> = ({ currentView, member, records, absences, sanctions, tasks, setTasks, posts, setPosts, setView, setChecklistSnapshots, checklistSnapshots }) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [isPrivacyMode, setIsPrivacyMode] = useState(false); 
  
  const myRecords = records.filter(r => r.employeeId === member.id);
  const myAbsences = absences.filter(a => a.employeeId === member.id);
  const mySanctions = sanctions.filter(s => s.employeeId === member.id);
  
  const myPendingTasks = tasks.filter(t => t.employeeId === member.id && t.status === 'PENDING');
  const pendingTasksCount = myPendingTasks.length;

  const totalPending = myRecords.filter(r => !r.paid).reduce((acc, curr) => acc + curr.overtimeAmount, 0);

  const formatMoney = (val: number) => {
      if (isPrivacyMode) return '****';
      return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(val);
  };

  const safeDisplay = (val: string | undefined) => {
      if (!val) return 'N/A';
      if (isPrivacyMode) return '****';
      return val;
  };

  // Calendar Logic for Member View
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  const renderCalendar = () => {
      const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
      const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
      const startDay = firstDay === 0 ? 6 : firstDay - 1; 

      return (
          <div className="grid grid-cols-7 gap-2">
            {['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'].map(d => (
              <div key={d} className="text-gray-400 dark:text-sushi-muted text-xs font-bold uppercase text-center mb-2">{d}</div>
            ))}
            {Array.from({ length: startDay }).map((_, i) => (
              <div key={`empty-${i}`} className="h-20" />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
               const day = i + 1;
               const dateStr = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day).toISOString().split('T')[0];
               const rec = myRecords.find(r => r.date === dateStr);
               const abs = myAbsences.find(a => a.date === dateStr);
               const sanc = mySanctions.find(s => s.date === dateStr && (s.type === 'DESCUENTO' || s.type === 'SUSPENSION'));
               
               let cellClass = "bg-gray-50 dark:bg-white/[0.02] border-gray-100 dark:border-white/5";
               let statusText = "";
               let statusColor = "text-gray-400";

               if (rec) {
                   if (rec.paid) {
                       cellClass = "bg-green-50 dark:bg-green-500/10 border-green-200 dark:border-green-500/20";
                       statusText = "Pagado";
                       statusColor = "text-green-600 dark:text-green-500";
                   } else {
                       cellClass = "bg-yellow-50 dark:bg-yellow-500/5 border-yellow-200 dark:border-yellow-500/20";
                       statusText = "Pendiente";
                       statusColor = "text-yellow-600 dark:text-sushi-gold";
                   }
               } else if (abs) {
                   cellClass = "bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20";
                   statusText = "Falta";
                   statusColor = "text-red-500";
               } else if (sanc) {
                   cellClass = "bg-purple-50 dark:bg-purple-500/10 border-purple-200 dark:border-purple-500/20";
                   statusText = "Descuento";
                   statusColor = "text-purple-500";
               }

               return (
                   <div key={day} className={`h-20 border rounded-lg p-2 flex flex-col justify-between ${cellClass}`}>
                       <span className={`text-sm font-bold ${statusColor}`}>{day}</span>
                       <div className="text-right">
                           {rec && rec.overtimeAmount > 0 && <span className={`block text-[10px] font-bold ${statusColor}`}>{formatMoney(rec.overtimeAmount)}</span>}
                           <span className={`text-[9px] uppercase font-medium ${statusColor}`}>{statusText}</span>
                       </div>
                   </div>
               )
            })}
          </div>
      );
  };

  const handleFinalizeChecklist = (snapshot: ChecklistSnapshot) => {
      if (setChecklistSnapshots && checklistSnapshots) {
          setChecklistSnapshots([snapshot, ...checklistSnapshots]);
      }
  };

  if (currentView === View.MEMBER_HOME) {
      return (
          <div className="space-y-8 animate-fade-in relative">
              {/* Header with Privacy Toggle & Notification */}
              <div className="flex justify-between items-center bg-white dark:bg-sushi-dark p-4 rounded-xl border border-gray-200 dark:border-white/5 shadow-sm">
                  <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full overflow-hidden border border-gray-200 dark:border-white/10">
                          {member.photoUrl ? <img src={member.photoUrl} className="w-full h-full object-cover" /> : <UserIcon className="w-full h-full p-2 text-gray-300" />}
                      </div>
                      <div>
                        <h2 className="text-xl font-serif text-gray-900 dark:text-white flex items-center gap-2">
                            Hola, {member.name.split(' ')[0]} 
                            <RankBadge role={member.role} />
                        </h2>
                        <p className="text-xs text-gray-500 dark:text-sushi-muted uppercase tracking-wider">{member.position}</p>
                      </div>
                  </div>
                  <div className="flex gap-2 relative">
                      {/* Privacy Toggle */}
                      <button 
                        id="privacy-toggle"
                        onClick={() => setIsPrivacyMode(!isPrivacyMode)}
                        className={`p-2 rounded-lg transition-colors border ${isPrivacyMode ? 'bg-sushi-gold/20 text-sushi-gold border-sushi-gold/50' : 'bg-gray-100 dark:bg-white/5 text-gray-400 dark:text-sushi-muted border-transparent'}`}
                        title={isPrivacyMode ? "Mostrar datos sensibles" : "Ocultar datos sensibles"}
                      >
                          {isPrivacyMode ? <EyeOff className="w-6 h-6" /> : <Eye className="w-6 h-6" />}
                      </button>

                      {/* Notifications */}
                      <button 
                        onClick={() => setShowNotifications(!showNotifications)}
                        className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-colors border border-transparent hover:border-gray-200 dark:hover:border-white/5"
                      >
                        <Bell className="w-6 h-6 text-gray-400 dark:text-sushi-muted" />
                        {pendingTasksCount > 0 && (
                            <div className="absolute top-0 right-0 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-[9px] font-bold text-white border-2 border-white dark:border-sushi-dark animate-pulse">
                                {pendingTasksCount}
                            </div>
                        )}
                      </button>

                      {/* Dropdown Notifications */}
                      {showNotifications && (
                          <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-sushi-dark rounded-xl shadow-2xl border border-gray-200 dark:border-white/10 z-50 overflow-hidden animate-fade-in">
                              <div className="p-4 border-b border-gray-200 dark:border-white/10 flex justify-between items-center bg-gray-50 dark:bg-black/20">
                                  <h4 className="font-bold text-gray-900 dark:text-white text-sm flex items-center gap-2">
                                    <Bell className="w-4 h-4 text-sushi-gold"/> Notificaciones
                                  </h4>
                                  <button onClick={() => setShowNotifications(false)} className="text-gray-400 hover:text-gray-900 dark:hover:text-white">
                                    <X className="w-4 h-4" />
                                  </button>
                              </div>
                              <div className="max-h-64 overflow-y-auto p-2">
                                  {pendingTasksCount === 0 ? (
                                      <div className="p-6 text-center text-gray-500 dark:text-sushi-muted text-sm flex flex-col items-center gap-2">
                                          <CheckCircle2 className="w-8 h-8 text-green-500/50" />
                                          <p>¡Estás al día!</p>
                                      </div>
                                  ) : (
                                      <div className="space-y-2">
                                          {myPendingTasks.map(t => (
                                              <div key={t.id} className="p-3 bg-white dark:bg-white/5 rounded-lg border border-gray-100 dark:border-white/5 hover:border-sushi-gold/30 transition-colors">
                                                  <p className="text-sm font-medium text-gray-900 dark:text-white">{t.description}</p>
                                                  <span className="text-[10px] bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-500 px-1.5 py-0.5 rounded font-bold mt-1 inline-block">PENDIENTE</span>
                                              </div>
                                          ))}
                                      </div>
                                  )}
                              </div>
                          </div>
                      )}
                  </div>
              </div>

              {/* SECTION 1: OPERATIONAL TOOLS (PRIORITY) */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Checklist takes 2/3 width */}
                  <div className="lg:col-span-2">
                      <TaskChecklist 
                        tasks={tasks} 
                        setTasks={setTasks} 
                        employeeId={member.id} 
                        onFinalize={handleFinalizeChecklist}
                        userName={member.name}
                      />
                  </div>

                  {/* Quick Access Cards */}
                  <div className="space-y-4">
                      {/* Access controlled by Sidebar prop indirectly or checking role */}
                      <button 
                        onClick={() => setView && setView(View.INVENTORY)}
                        className="w-full bg-gradient-to-br from-gray-900 to-black dark:from-white/5 dark:to-white/[0.02] border border-gray-200 dark:border-white/10 p-6 rounded-xl text-left hover:border-sushi-gold/50 hover:shadow-lg transition-all group relative overflow-hidden"
                      >
                          <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-4 translate-y-4">
                              <Box className="w-24 h-24 text-white" />
                          </div>
                          <div className="relative z-10">
                              <div className="p-3 bg-sushi-gold rounded-lg w-fit mb-3 text-sushi-black">
                                  <Box className="w-6 h-6" />
                              </div>
                              <h3 className="text-white font-bold text-lg group-hover:text-sushi-gold transition-colors">Inventario</h3>
                              <p className="text-gray-400 text-xs mt-1">Registrar Stock Inicial/Final</p>
                          </div>
                      </button>
                      
                      <div className="bg-white dark:bg-sushi-dark p-6 rounded-xl border border-gray-200 dark:border-white/5 shadow-sm">
                          <h3 className="font-serif text-lg text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                              <UserIcon className="w-5 h-5 text-sushi-gold" />
                              Mi Perfil Rápido
                          </h3>
                          <div className="space-y-3 text-sm">
                              <div className="flex justify-between py-2 border-b border-gray-100 dark:border-white/5">
                                  <span className="text-gray-500 dark:text-sushi-muted">Rango</span>
                                  <RankBadge role={member.role} />
                              </div>
                              <div className="flex justify-between py-2 border-b border-gray-100 dark:border-white/5">
                                  <span className="text-gray-500 dark:text-sushi-muted">Horario</span>
                                  <span className="text-gray-900 dark:text-white font-medium">{member.scheduleStart} - {member.scheduleEnd}</span>
                              </div>
                              <div className="flex justify-between py-2 border-b border-gray-100 dark:border-white/5">
                                  <span className="text-gray-500 dark:text-sushi-muted">Sueldo Base</span>
                                  <span className="text-gray-900 dark:text-white font-medium">{formatMoney(member.monthlySalary)}</span>
                              </div>
                          </div>
                      </div>
                  </div>
              </div>

              {/* SECTION 2: FINANCIALS (HIDDEN BY PRIVACY MODE) */}
              <div className={`transition-all duration-300 ${isPrivacyMode ? 'opacity-50 grayscale' : 'opacity-100'}`}>
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white dark:bg-sushi-dark p-6 rounded-xl border border-gray-200 dark:border-white/5 shadow-sm">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <p className="text-gray-500 dark:text-sushi-muted text-xs uppercase font-bold">Pendiente de Cobro</p>
                                    <h3 className="text-2xl font-mono font-bold text-gray-900 dark:text-white mt-1">{formatMoney(totalPending)}</h3>
                                </div>
                                <div className="p-3 bg-yellow-100 dark:bg-yellow-500/10 text-yellow-600 dark:text-sushi-gold rounded-lg">
                                    <Wallet className="w-6 h-6" />
                                </div>
                            </div>
                        </div>
                        
                        <div className="bg-white dark:bg-sushi-dark p-6 rounded-xl border border-gray-200 dark:border-white/5 shadow-sm md:col-span-2 flex flex-col justify-between">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="font-serif text-lg text-gray-900 dark:text-white flex items-center gap-2">
                                        <CreditCard className="w-5 h-5 text-sushi-gold" />
                                        Próximo Pago
                                    </h3>
                                    {member.nextPaymentDate ? (
                                        <div className="mt-3">
                                            <p className="text-3xl font-bold text-gray-900 dark:text-white">
                                                {new Date(member.nextPaymentDate).toLocaleDateString('es-AR', { day: 'numeric', month: 'long' })}
                                            </p>
                                            <p className="text-sm text-gray-500 dark:text-sushi-muted mt-1">
                                                Modalidad: <span className="font-bold text-sushi-gold">{member.nextPaymentMethod}</span>
                                            </p>
                                        </div>
                                    ) : (
                                        <p className="text-gray-400 dark:text-sushi-muted mt-2 italic">Fecha aún no asignada.</p>
                                    )}
                                </div>
                                <div className="text-right">
                                    <p className="text-xs uppercase text-gray-500 dark:text-sushi-muted font-bold">Cuenta Destino</p>
                                    <p className="font-mono text-gray-900 dark:text-white mt-1">{safeDisplay(member.bankName)}</p>
                                    <p className="text-xs text-gray-400 dark:text-sushi-muted font-mono">{member.cbu ? (isPrivacyMode ? '****' : `*${member.cbu.slice(-4)}`) : '***'}</p>
                                </div>
                            </div>
                        </div>
                   </div>
              </div>
          </div>
      );
  }

  // ... (Rest of component methods remain largely the same)

  if (currentView === View.MEMBER_FORUM && posts && setPosts) {
      return (
          <ForumBoard 
            posts={posts}
            setPosts={setPosts}
            currentUser={null}
            currentMember={member}
          />
      );
  }

  if (currentView === View.MEMBER_TASKS) {
      return (
          <div className="max-w-2xl mx-auto pt-10 animate-fade-in">
              <TaskChecklist 
                tasks={tasks} 
                setTasks={setTasks} 
                employeeId={member.id} 
                onFinalize={handleFinalizeChecklist}
                userName={member.name}
              />
          </div>
      )
  }

  if (currentView === View.MEMBER_CALENDAR) {
     return (
        <div className="bg-white dark:bg-sushi-dark p-6 rounded-xl border border-gray-200 dark:border-white/5 shadow-sm animate-fade-in">
             <div className="flex justify-between items-center mb-6">
                <h3 className="font-serif text-xl text-gray-900 dark:text-white flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-sushi-gold" />
                    Historial Visual
                </h3>
                <div className="flex items-center gap-4 bg-gray-50 dark:bg-black/20 p-2 rounded-lg">
                    <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))} className="p-1 hover:bg-gray-200 dark:hover:bg-white/10 rounded"><ChevronLeft className="w-5 h-5 text-gray-600 dark:text-white" /></button>
                    <span className="font-bold text-gray-900 dark:text-white w-32 text-center capitalize">
                        {currentMonth.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })}
                    </span>
                    <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))} className="p-1 hover:bg-gray-200 dark:hover:bg-white/10 rounded"><ChevronRight className="w-5 h-5 text-gray-600 dark:text-white" /></button>
                </div>
             </div>
            
            {renderCalendar()}

            <div className="mt-6 flex gap-4 text-xs justify-center">
                <div className="flex items-center gap-2"><div className="w-3 h-3 bg-green-500 rounded-full"></div><span className="text-gray-500 dark:text-sushi-muted">Pagado</span></div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 bg-sushi-gold rounded-full"></div><span className="text-gray-500 dark:text-sushi-muted">Pendiente</span></div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 bg-red-500 rounded-full"></div><span className="text-gray-500 dark:text-sushi-muted">Falta</span></div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 bg-purple-500 rounded-full"></div><span className="text-gray-500 dark:text-sushi-muted">Descuento</span></div>
            </div>
        </div>
     )
  }

  if (currentView === View.MEMBER_FILE) {
      return (
          <div className="space-y-8 animate-fade-in relative">
              <button 
                  onClick={() => setIsPrivacyMode(!isPrivacyMode)}
                  className={`absolute top-4 right-4 z-10 p-2 rounded-lg border ${isPrivacyMode ? 'bg-sushi-gold/20 text-sushi-gold border-sushi-gold' : 'bg-gray-100 dark:bg-white/5 border-transparent text-gray-500'}`}
              >
                  {isPrivacyMode ? <EyeOff className="w-5 h-5"/> : <Eye className="w-5 h-5"/>}
              </button>

             <div className="bg-white dark:bg-sushi-dark p-8 rounded-xl border border-gray-200 dark:border-white/5 shadow-sm">
                 <div className="flex items-center gap-6 mb-8 border-b border-gray-200 dark:border-white/10 pb-6">
                    <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-sushi-gold/20">
                        {member.photoUrl ? <img src={member.photoUrl} className="w-full h-full object-cover" /> : <UserIcon className="w-full h-full p-6 text-gray-300 dark:text-sushi-muted" />}
                    </div>
                    <div>
                        <h2 className="text-3xl font-serif text-gray-900 dark:text-white flex items-center gap-2">
                            {member.name}
                            <RankBadge role={member.role} />
                        </h2>
                        <p className="text-sushi-gold font-bold uppercase tracking-widest">{member.position}</p>
                    </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     <div className="space-y-4">
                        <h4 className="font-bold text-gray-900 dark:text-white border-b border-gray-200 dark:border-white/10 pb-2">Información Personal</h4>
                        <InfoItem icon={UserIcon} label="DNI" value={safeDisplay(member.dni)} />
                        <InfoItem icon={Hash} label="CUIL" value={safeDisplay(member.cuil)} />
                        <InfoItem icon={Phone} label="Teléfono" value={safeDisplay(member.phone)} />
                        <InfoItem icon={MapPin} label="Dirección" value={safeDisplay(member.address)} />
                     </div>

                     <div className="space-y-4">
                        <h4 className="font-bold text-gray-900 dark:text-white border-b border-gray-200 dark:border-white/10 pb-2">Datos Bancarios</h4>
                        <InfoItem icon={Building} label="Banco" value={safeDisplay(member.bankName)} />
                        <InfoItem icon={CreditCard} label="CBU / CVU" value={safeDisplay(member.cbu)} />
                        <InfoItem icon={Hash} label="Alias" value={safeDisplay(member.alias)} />
                        <InfoItem icon={CreditCard} label="Nro Cuenta" value={safeDisplay(member.bankAccountNumber)} />
                     </div>
                     
                     <div className="space-y-4">
                        <h4 className="font-bold text-gray-900 dark:text-white border-b border-gray-200 dark:border-white/10 pb-2">Contrato</h4>
                        <InfoItem icon={Calendar} label="Fecha Ingreso" value={member.startDate} />
                        <InfoItem icon={CheckCircle2} label="Modalidad" value={member.paymentModality} />
                        <InfoItem icon={UserCheck} label="Entrevistador" value={member.interviewer} />
                        <InfoItem icon={Briefcase} label="Sueldo Base" value={formatMoney(member.monthlySalary)} />
                     </div>
                 </div>
             </div>

             <AIReport employees={[member]} records={myRecords} sanctions={mySanctions} />
          </div>
      )
  }

  return null;
};
