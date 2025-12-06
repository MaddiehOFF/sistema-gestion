
import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { EmployeeManagement } from './components/EmployeeManagement';
import { OvertimeLog } from './components/OvertimeLog';
import { AIReport } from './components/AIReport';
import { SanctionsLog } from './components/SanctionsLog';
import { EmployeeFiles } from './components/EmployeeFiles';
import { Login } from './components/Login';
import { UserManagement } from './components/UserManagement';
import { MemberView } from './components/MemberView';
import { PayrollManagement } from './components/PayrollManagement';
import { ForumBoard } from './components/ForumBoard';
import { AdminHub } from './components/AdminHub';
import { ConstructionView } from './components/ConstructionView';
import { InventoryManager } from './components/InventoryManager';
import { CashRegister } from './components/CashRegister';
import { ProductManagement } from './components/ProductManagement';
import { FinanceDashboard } from './components/FinanceDashboard';
import { WalletView } from './components/WalletView';
import { RoyaltiesManagement } from './components/RoyaltiesManagement';
import { StatisticsDashboard } from './components/StatisticsDashboard';
import { SettingsView } from './components/SettingsView';
import { Employee, OvertimeRecord, View, SanctionRecord, User, AbsenceRecord, Task, ForumPost, AdminTask, InventoryItem, InventorySession, CashShift, Product, WalletTransaction, Partner, CalculatorProjection, FixedExpense, RoleAccessConfig, ChecklistSnapshot } from './types';
import { HelpAssistant } from './components/HelpAssistant';
import { TourGuide } from './components/TourGuide';
import { loadData, saveData } from './services/storage';
import { Loader2, Cloud } from 'lucide-react';

const App: React.FC = () => {
  // Theme State
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);
  
  // Loading State
  const [isLoading, setIsLoading] = useState(true);

  // Tour State
  const [showTour, setShowTour] = useState(false);

  // Auth State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentMember, setCurrentMember] = useState<Employee | null>(null);

  // App Data State
  const [currentView, setView] = useState<View>(View.DASHBOARD);
  
  // DATA STATES
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [records, setRecords] = useState<OvertimeRecord[]>([]);
  const [absences, setAbsences] = useState<AbsenceRecord[]>([]);
  const [sanctions, setSanctions] = useState<SanctionRecord[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [checklistSnapshots, setChecklistSnapshots] = useState<ChecklistSnapshot[]>([]);
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [adminTasks, setAdminTasks] = useState<AdminTask[]>([]);
  const [holidays, setHolidays] = useState<string[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [inventorySessions, setInventorySessions] = useState<InventorySession[]>([]);
  const [cashShifts, setCashShifts] = useState<CashShift[]>([]);
  const [walletTransactions, setWalletTransactions] = useState<WalletTransaction[]>([]);
  const [fixedExpenses, setFixedExpenses] = useState<FixedExpense[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [projections, setProjections] = useState<CalculatorProjection[]>([]);
  const [roleAccess, setRoleAccess] = useState<RoleAccessConfig>({});
  const [customRoles, setCustomRoles] = useState<string[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  // INITIAL DATA LOADING (ASYNC)
  useEffect(() => {
      const initApp = async () => {
          setIsLoading(true);
          
          // Theme
          const savedTheme = await loadData('theme', 'dark');
          setIsDarkMode(savedTheme === 'dark');

          // Employees
          const emps = await loadData<Employee[]>('employees', []);
          setEmployees(emps);

          // Records
          setRecords(await loadData('records', []));
          setAbsences(await loadData('absences', []));
          setSanctions(await loadData('sanctions', []));
          setTasks(await loadData('tasks', []));
          setChecklistSnapshots(await loadData('checklist_snapshots', []));
          setPosts(await loadData('posts', []));
          setAdminTasks(await loadData('admin_tasks', []));
          setHolidays(await loadData('holidays', []));
          
          // Inventory
          const defaultItems = [
            { id: '1', name: 'SALMON', unit: 'Kg' },
            { id: '2', name: 'QUESOS', unit: 'Kg' },
            { id: '3', name: 'PALTAS', unit: 'Kg' },
            { id: '4', name: 'ARROZ', unit: 'Kg' },
            { id: '5', name: 'ALGAS', unit: 'Paq' },
            { id: '6', name: 'LANGO BOLSA', unit: 'Un' },
            { id: '7', name: 'LANGO H', unit: 'Un' },
          ];
          setInventoryItems(await loadData('inv_items', defaultItems));
          setInventorySessions(await loadData('inv_sessions', []));

          // Cash
          setCashShifts(await loadData('cash_shifts', []));

          // Products
          const defaultProducts = [
            { id: '1', name: 'Avocado - X4 U', laborCost: 2200, materialCost: 1352, royalties: 914, profit: 2134 }
          ];
          setProducts(await loadData('products', defaultProducts));

          // Finance
          setWalletTransactions(await loadData('wallet_tx', []));
          setFixedExpenses(await loadData('fixed_expenses', []));
          const defaultPartners = [
            { id: '1', name: 'Socio 1', sharePercentage: 25, balance: 0 },
            { id: '2', name: 'Socio 2', sharePercentage: 25, balance: 0 },
            { id: '3', name: 'Socio 3', sharePercentage: 25, balance: 0 },
            { id: '4', name: 'Socio 4', sharePercentage: 25, balance: 0 },
          ];
          setPartners(await loadData('partners', defaultPartners));
          setProjections(await loadData('projections', []));

          // Config
          const defaultRoles = {
            'JEFE_COCINA': [View.INVENTORY],
            'COORDINADOR': [View.INVENTORY, View.CASH_REGISTER], 
            'MOSTRADOR': [View.CASH_REGISTER],
            'ADMINISTRATIVO': [View.CASH_REGISTER],
            'GERENTE': [View.INVENTORY, View.CASH_REGISTER],
            'EMPRESA': [View.INVENTORY, View.CASH_REGISTER],
          };
          setRoleAccess(await loadData('role_access', defaultRoles));
          setCustomRoles(await loadData('custom_roles', []));

          // Users
          const defaultAdmin: User[] = [{
            id: 'admin-1',
            username: 'admin',
            email: 'admin@sushiblack.com',
            password: 'admin',
            name: 'Administrador',
            role: 'ADMIN',
            permissions: {
                viewHr: true, manageHr: true,
                viewOps: true, manageOps: true,
                viewFinance: true, manageFinance: true,
                viewInventory: true, manageInventory: true,
                superAdmin: true
            }
          }];
          setUsers(await loadData('users', defaultAdmin));

          setIsLoading(false);
      };

      initApp();
  }, []);

  // ROBUST MIGRATION (Fix Permissions if older version data loaded)
  useEffect(() => {
      if (users.length > 0) {
          const needsFix = users.some(u => u.role === 'ADMIN' && !u.permissions.viewFinance);
          if (needsFix) {
              const fixedUsers = users.map(u => {
                  if (u.role === 'ADMIN') {
                      return {
                          ...u,
                          permissions: {
                              viewHr: true, manageHr: true,
                              viewOps: true, manageOps: true,
                              viewFinance: true, manageFinance: true,
                              viewInventory: true, manageInventory: true,
                              superAdmin: true
                          }
                      };
                  }
                  return u;
              });
              setUsers(fixedUsers);
              saveData('users', fixedUsers);
          }
      }
  }, [isLoading]); // Run once after loading

  // PERSISTENCE EFFECTS (Auto-Save to Cloud/Local)
  // We use a small delay or direct call. The 'saveData' service handles debouncing for cloud.
  useEffect(() => { if (!isLoading) saveData('employees', employees); }, [employees, isLoading]);
  useEffect(() => { if (!isLoading) saveData('records', records); }, [records, isLoading]);
  useEffect(() => { if (!isLoading) saveData('absences', absences); }, [absences, isLoading]);
  useEffect(() => { if (!isLoading) saveData('sanctions', sanctions); }, [sanctions, isLoading]);
  useEffect(() => { if (!isLoading) saveData('users', users); }, [users, isLoading]);
  useEffect(() => { if (!isLoading) saveData('tasks', tasks); }, [tasks, isLoading]);
  useEffect(() => { if (!isLoading) saveData('checklist_snapshots', checklistSnapshots); }, [checklistSnapshots, isLoading]);
  useEffect(() => { if (!isLoading) saveData('posts', posts); }, [posts, isLoading]);
  useEffect(() => { if (!isLoading) saveData('admin_tasks', adminTasks); }, [adminTasks, isLoading]);
  useEffect(() => { if (!isLoading) saveData('holidays', holidays); }, [holidays, isLoading]);
  useEffect(() => { if (!isLoading) saveData('inv_items', inventoryItems); }, [inventoryItems, isLoading]);
  useEffect(() => { if (!isLoading) saveData('inv_sessions', inventorySessions); }, [inventorySessions, isLoading]);
  useEffect(() => { if (!isLoading) saveData('cash_shifts', cashShifts); }, [cashShifts, isLoading]);
  useEffect(() => { if (!isLoading) saveData('products', products); }, [products, isLoading]);
  useEffect(() => { if (!isLoading) saveData('wallet_tx', walletTransactions); }, [walletTransactions, isLoading]);
  useEffect(() => { if (!isLoading) saveData('partners', partners); }, [partners, isLoading]);
  useEffect(() => { if (!isLoading) saveData('projections', projections); }, [projections, isLoading]);
  useEffect(() => { if (!isLoading) saveData('fixed_expenses', fixedExpenses); }, [fixedExpenses, isLoading]);
  useEffect(() => { if (!isLoading) saveData('role_access', roleAccess); }, [roleAccess, isLoading]);
  useEffect(() => { if (!isLoading) saveData('custom_roles', customRoles); }, [customRoles, isLoading]);
  useEffect(() => { if (!isLoading) saveData('theme', isDarkMode ? 'dark' : 'light'); }, [isDarkMode, isLoading]);

  // Auth Handlers
  const handleLogin = (user: User) => {
    const now = new Date().toISOString();
    const updatedUser = { ...user, lastLogin: now };
    // Optimistic update
    const newUsers = users.map(u => u.id === user.id ? updatedUser : u);
    setUsers(newUsers);
    saveData('users', newUsers);

    setCurrentUser(updatedUser);
    setCurrentMember(null);
    setView(View.DASHBOARD);

    const tourCompleted = localStorage.getItem('sushiblack_tour_completed');
    if (!tourCompleted) {
        setShowTour(true);
    }
  };

  const handleMemberLogin = (employee: Employee) => {
    setCurrentMember(employee);
    setCurrentUser(null);
    setView(View.MEMBER_HOME);

    const tourCompleted = localStorage.getItem(`sushiblack_tour_member_${employee.id}`);
    if (!tourCompleted) {
        setShowTour(true);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentMember(null);
  };

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  const completeTour = () => {
      setShowTour(false);
      if (currentUser) {
        localStorage.setItem('sushiblack_tour_completed', 'true');
      } else if (currentMember) {
        localStorage.setItem(`sushiblack_tour_member_${currentMember.id}`, 'true');
      }
  };

  const royaltyPool = partners.reduce((sum, p) => sum + (p.balance || 0), 0);
  const pendingPayroll = employees.filter(e => e.active).reduce((acc, curr) => acc + curr.monthlySalary, 0);
  const pendingDebt = pendingPayroll + royaltyPool;

  if (isLoading) {
      return (
          <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center text-white space-y-4">
              <Loader2 className="w-12 h-12 animate-spin text-yellow-500" />
              <div className="flex items-center gap-2 text-sm font-medium opacity-80">
                  <Cloud className="w-4 h-4" />
                  <span>Sincronizando con la nube...</span>
              </div>
          </div>
      );
  }

  return (
    <div className={isDarkMode ? 'dark' : 'light'}>
        <div className="min-h-screen bg-sushi-light dark:bg-sushi-black transition-colors duration-300" id="center-screen">
            {!currentUser && !currentMember ? (
                <Login 
                    users={users} 
                    employees={employees} 
                    onLogin={handleLogin} 
                    onMemberLogin={handleMemberLogin} 
                />
            ) : (
                <div className="flex h-screen overflow-hidden font-sans text-gray-900 dark:text-sushi-text">
                    <Sidebar 
                        currentView={currentView} 
                        setView={setView} 
                        currentUser={currentUser}
                        currentMember={currentMember}
                        onLogout={handleLogout}
                        isDarkMode={isDarkMode}
                        toggleTheme={toggleTheme}
                        roleAccess={roleAccess}
                    />
                    
                    <main className="flex-1 overflow-y-auto relative">
                        <div className="p-8 max-w-7xl mx-auto min-h-full">
                            
                            {/* ADMIN VIEWS */}
                            {currentUser && (
                                <>
                                    {currentView === View.DASHBOARD && 
                                        <Dashboard 
                                            employees={employees} 
                                            records={records} 
                                            tasks={adminTasks} 
                                            inventory={inventorySessions}
                                            sanctions={sanctions}
                                            cashShifts={cashShifts}
                                            currentUser={currentUser}
                                            setView={setView}
                                        />
                                    }
                                    {currentView === View.EMPLOYEES && (currentUser.permissions.viewHr ? <EmployeeManagement employees={employees} setEmployees={setEmployees} sanctions={sanctions} /> : <AccessDenied />)}
                                    {currentView === View.FILES && (currentUser.permissions.viewHr ? <EmployeeFiles employees={employees} setEmployees={setEmployees} sanctions={sanctions} absences={absences} tasks={tasks} setTasks={setTasks} checklistSnapshots={checklistSnapshots} /> : <AccessDenied />)}
                                    {currentView === View.OVERTIME && (currentUser.permissions.viewOps ? <OvertimeLog employees={employees} records={records} setRecords={setRecords} absences={absences} setAbsences={setAbsences} holidays={holidays} setHolidays={setHolidays} /> : <AccessDenied />)}
                                    {currentView === View.PAYROLL && (currentUser.permissions.viewFinance ? 
                                        <PayrollManagement 
                                            employees={employees} 
                                            setEmployees={setEmployees}
                                            transactions={walletTransactions}
                                            setTransactions={setWalletTransactions}
                                            currentUser={currentUser}
                                        /> 
                                        : <AccessDenied />)
                                    }
                                    {currentView === View.SANCTIONS && (currentUser.permissions.viewOps ? <SanctionsLog employees={employees} sanctions={sanctions} setSanctions={setSanctions} currentUser={currentUser} /> : <AccessDenied />)}
                                    {currentView === View.USERS && (currentUser.permissions.superAdmin ? <UserManagement users={users} setUsers={setUsers} currentUser={currentUser} /> : <AccessDenied />)}
                                    {currentView === View.SETTINGS && (currentUser.permissions.superAdmin ? <SettingsView roleAccess={roleAccess} setRoleAccess={setRoleAccess} customRoles={customRoles} setCustomRoles={setCustomRoles} /> : <AccessDenied />)}
                                    {currentView === View.AI_REPORT && <AIReport employees={employees} records={records} sanctions={sanctions} />}
                                    {currentView === View.FORUM && <ForumBoard posts={posts} setPosts={setPosts} currentUser={currentUser} currentMember={currentMember} />}
                                    {currentView === View.ADMIN_HUB && <AdminHub adminTasks={adminTasks} setAdminTasks={setAdminTasks} currentUser={currentUser} allUsers={users} />}
                                    {currentView === View.INVENTORY && (currentUser.permissions.viewInventory ? <InventoryManager items={inventoryItems} setItems={setInventoryItems} sessions={inventorySessions} setSessions={setInventorySessions} userName={currentUser.name} /> : <AccessDenied />)}
                                    {currentView === View.CASH_REGISTER && <CashRegister shifts={cashShifts} setShifts={setCashShifts} userName={currentUser.name} />}
                                    
                                    {/* Product and Finance Views */}
                                    {currentView === View.PRODUCTS && (currentUser.permissions.viewFinance ? <ProductManagement products={products} setProducts={setProducts} /> : <AccessDenied />)}
                                    {currentView === View.FINANCE && (currentUser.permissions.viewFinance ? 
                                        <FinanceDashboard 
                                            products={products} 
                                            setTransactions={setWalletTransactions} 
                                            transactions={walletTransactions}
                                            projections={projections}
                                            setProjections={setProjections}
                                            userName={currentUser.name}
                                            cashShifts={cashShifts}
                                            partners={partners}
                                            setPartners={setPartners}
                                        /> 
                                        : <AccessDenied />)
                                    }
                                    {currentView === View.WALLET && (currentUser.permissions.viewFinance ? 
                                        <WalletView 
                                            transactions={walletTransactions} 
                                            setTransactions={setWalletTransactions} 
                                            pendingDebt={pendingDebt} 
                                            userName={currentUser.name} 
                                            fixedExpenses={fixedExpenses}
                                            setFixedExpenses={setFixedExpenses}
                                            employees={employees}
                                            currentUser={currentUser}
                                        /> 
                                        : <AccessDenied />)
                                    }
                                    {currentView === View.ROYALTIES && (currentUser.permissions.viewFinance ? 
                                        <RoyaltiesManagement 
                                            partners={partners} 
                                            setPartners={setPartners} 
                                            royaltyPool={royaltyPool} 
                                            setTransactions={setWalletTransactions} 
                                            transactions={walletTransactions}
                                            userName={currentUser.name}
                                        /> 
                                        : <AccessDenied />)
                                    }
                                    {currentView === View.STATISTICS && (currentUser.permissions.viewFinance ? 
                                        <StatisticsDashboard 
                                            cashShifts={cashShifts}
                                            walletTransactions={walletTransactions}
                                        /> 
                                        : <AccessDenied />)
                                    }

                                    {currentView === View.AI_FOCUS && <ConstructionView title="Enfoque IA 2.0" description="Estamos entrenando modelos predictivos para anticipar la demanda de pedidos y optimizar turnos." />}
                                </>
                            )}

                            {/* MEMBER VIEWS */}
                            {currentMember && (
                                <>
                                    {currentView === View.MEMBER_HOME && (
                                        <MemberView 
                                            currentView={currentView} 
                                            member={currentMember} 
                                            records={records} 
                                            absences={absences} 
                                            sanctions={sanctions}
                                            tasks={tasks}
                                            setTasks={setTasks}
                                            posts={posts}
                                            setPosts={setPosts}
                                            setView={setView}
                                            checklistSnapshots={checklistSnapshots}
                                            setChecklistSnapshots={setChecklistSnapshots}
                                        />
                                    )}
                                    {(currentView === View.MEMBER_CALENDAR || currentView === View.MEMBER_TASKS || currentView === View.MEMBER_FILE || currentView === View.MEMBER_FORUM) && (
                                        <MemberView 
                                            currentView={currentView} 
                                            member={currentMember} 
                                            records={records} 
                                            absences={absences} 
                                            sanctions={sanctions}
                                            tasks={tasks}
                                            setTasks={setTasks}
                                            posts={posts}
                                            setPosts={setPosts}
                                            checklistSnapshots={checklistSnapshots}
                                            setChecklistSnapshots={setChecklistSnapshots}
                                        />
                                    )}
                                    {currentView === View.INVENTORY && (
                                        <InventoryManager items={inventoryItems} setItems={setInventoryItems} sessions={inventorySessions} setSessions={setInventorySessions} userName={currentMember.name} />
                                    )}
                                    {currentView === View.CASH_REGISTER && (
                                        <CashRegister shifts={cashShifts} setShifts={setCashShifts} userName={currentMember.name} />
                                    )}
                                </>
                            )}

                        </div>
                        {currentUser && (
                            <div id="help-button">
                                <HelpAssistant />
                            </div>
                        )}
                        <TourGuide 
                            isOpen={showTour} 
                            onComplete={completeTour} 
                            mode={currentUser ? 'ADMIN' : 'MEMBER'} 
                        />
                    </main>
                </div>
            )}
        </div>
    </div>
  );
};

const AccessDenied = () => (
    <div className="h-full flex flex-col items-center justify-center text-gray-400 dark:text-sushi-muted opacity-50">
        <span className="text-4xl">⚠️</span>
        <p className="mt-4 font-medium">Acceso Denegado</p>
    </div>
);

export default App;
