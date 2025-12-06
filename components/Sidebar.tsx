
import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Users, Clock, BrainCircuit, AlertTriangle, UserCog, LogOut, Sun, Moon, FolderOpen, ClipboardCheck, CalendarRange, User, Banknote, MessageSquare, Briefcase, Box, LineChart, Sparkles, Command, Wallet, Tag, Crown, BarChart3, Settings } from 'lucide-react';
import { View, User as UserType, Employee, RoleAccessConfig } from '../types';
import { playSound } from '../utils/soundUtils';

interface SidebarProps {
  currentView: View;
  setView: (view: View) => void;
  currentUser: UserType | null;
  currentMember: Employee | null;
  onLogout: () => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
  roleAccess: RoleAccessConfig; // Dynamic config
}

const DigitalClock = () => {
    const [date, setDate] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setDate(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="px-6 py-4 mb-2 flex flex-col items-center justify-center border-t border-gray-100 dark:border-white/5 mx-4">
            <span className="text-3xl font-mono font-bold text-gray-800 dark:text-white tracking-tighter leading-none">
                {date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
            </span>
            <span className="text-[10px] uppercase tracking-widest text-sushi-gold font-bold mt-1">
                {date.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'short' })}
            </span>
        </div>
    );
};

export const Sidebar: React.FC<SidebarProps> = ({ currentView, setView, currentUser, currentMember, onLogout, isDarkMode, toggleTheme, roleAccess }) => {
  
  // Member Navigation with Dynamic Permissions
  if (currentMember) {
      const myRole = currentMember.role || 'COCINA';
      const myPermissions = roleAccess[myRole] || [];

      const canSeeInventory = myPermissions.includes(View.INVENTORY);
      const canSeeCash = myPermissions.includes(View.CASH_REGISTER);

      const navItems = [
          { id: View.MEMBER_HOME, label: 'Mi Panel', icon: LayoutDashboard, visible: true, domId: 'mem-home' },
          { id: View.MEMBER_FORUM, label: 'Muro Social', icon: MessageSquare, visible: true, domId: 'mem-forum' },
          { id: View.MEMBER_TASKS, label: 'Mi Check-List', icon: ClipboardCheck, visible: true, domId: 'mem-tasks' },
          { id: View.MEMBER_CALENDAR, label: 'Mi Calendario', icon: CalendarRange, visible: true, domId: 'mem-calendar' },
          { id: View.MEMBER_FILE, label: 'Mi Expediente', icon: User, visible: true, domId: 'mem-file' },
          { id: View.INVENTORY, label: 'Inventario Cocina', icon: Box, visible: canSeeInventory, domId: 'mem-inv' },
          { id: View.CASH_REGISTER, label: 'Caja / Movimientos', icon: Wallet, visible: canSeeCash, domId: 'mem-cash' },
      ];

      return (
        <div className="w-64 bg-white dark:bg-sushi-dark border-r border-gray-200 dark:border-white/10 flex flex-col h-full sticky top-0 transition-colors duration-300">
           {/* Brand Header */}
           <div className="p-8 flex items-center gap-4 border-b border-gray-200 dark:border-white/5">
                <div className="w-10 h-10 border-2 border-sushi-gold rounded-lg flex items-center justify-center">
                    <span className="font-serif font-bold text-xl text-sushi-gold leading-none pt-1">SB</span>
                </div>
                <div>
                <h1 className="font-serif text-lg font-bold text-gray-900 dark:text-white tracking-wide">Sushiblack</h1>
                <p className="text-[10px] text-gray-500 dark:text-sushi-muted uppercase tracking-widest font-medium">Portal Miembro</p>
                </div>
            </div>
            <nav className="flex-1 p-4 space-y-2 mt-4 overflow-y-auto">
                {navItems.filter(i => i.visible).map((item) => (
                     <button
                        key={item.id}
                        id={item.domId}
                        onClick={() => { setView(item.id); playSound('CLICK'); }}
                        className={`w-full flex items-center gap-4 px-4 py-3 rounded-lg transition-all duration-200 group ${currentView === item.id ? 'bg-sushi-gold text-sushi-black font-semibold' : 'text-gray-500 dark:text-sushi-muted hover:bg-gray-100 dark:hover:bg-white/5'}`}
                     >
                         <item.icon className="w-5 h-5"/>
                         <span>{item.label}</span>
                     </button>
                ))}
            </nav>
            <DigitalClock />
            <Footer 
                currentUser={currentUser} 
                currentMember={currentMember} 
                onLogout={onLogout} 
                isDarkMode={isDarkMode} 
                toggleTheme={toggleTheme} 
            />
        </div>
      );
  }

  // ADMIN NAVIGATION GROUPS
  const adminGroups = [
    {
        title: 'Principal',
        items: [
            { id: View.DASHBOARD, label: 'Panel General', icon: LayoutDashboard, visible: true, domId: 'nav-dashboard' },
        ]
    },
    {
        title: 'Gestión Operativa',
        items: [
            { id: View.EMPLOYEES, label: 'Empleados', icon: Users, visible: currentUser?.permissions.viewHr, domId: 'nav-employees' },
            { id: View.FILES, label: 'Expedientes', icon: FolderOpen, visible: currentUser?.permissions.viewHr, domId: 'nav-files' },
            { id: View.OVERTIME, label: 'Asistencia', icon: Clock, visible: currentUser?.permissions.viewOps, domId: 'nav-overtime' },
            { id: View.SANCTIONS, label: 'Novedades', icon: AlertTriangle, visible: currentUser?.permissions.viewOps, domId: 'nav-sanctions' },
            { id: View.CASH_REGISTER, label: 'Caja / Movimientos', icon: Tag, visible: true, domId: 'nav-cash' },
        ]
    },
    {
        title: 'Finanzas',
        items: [
            { id: View.WALLET, label: 'Billetera Global', icon: Wallet, visible: currentUser?.permissions.viewFinance, domId: 'nav-wallet' },
            { id: View.ROYALTIES, label: 'Regalías Socios', icon: Crown, visible: currentUser?.permissions.viewFinance, domId: 'nav-royalties' },
            { id: View.PAYROLL, label: 'Pagos y Nómina', icon: Banknote, visible: currentUser?.permissions.viewFinance, domId: 'nav-payroll' },
            { id: View.FINANCE, label: 'Calculadora Costos', icon: LineChart, visible: currentUser?.permissions.viewFinance, domId: 'nav-fin' },
            { id: View.STATISTICS, label: 'Estadísticas', icon: BarChart3, visible: currentUser?.permissions.viewFinance, domId: 'nav-stats' },
        ]
    },
    {
        title: 'Administración',
        items: [
            { id: View.ADMIN_HUB, label: 'Central Admin', icon: Command, visible: true, domId: 'nav-hub' },
            { id: View.INVENTORY, label: 'Inventario', icon: Box, visible: currentUser?.permissions.viewInventory, domId: 'nav-inv' },
            { id: View.USERS, label: 'Usuarios', icon: UserCog, visible: currentUser?.permissions.superAdmin, domId: 'nav-users' },
            { id: View.PRODUCTS, label: 'Productos', icon: Box, visible: currentUser?.permissions.viewFinance, domId: 'nav-products' },
            { id: View.SETTINGS, label: 'Configuración', icon: Settings, visible: currentUser?.permissions.superAdmin, domId: 'nav-settings' },
        ]
    },
    {
        title: 'Estratégico',
        items: [
            { id: View.FORUM, label: 'Foro Social', icon: MessageSquare, visible: true, domId: 'nav-forum' },
            { id: View.AI_REPORT, label: 'Consultor IA', icon: BrainCircuit, visible: true, domId: 'nav-ai-report' },
        ]
    },
    {
        title: 'En Desarrollo',
        items: [
            { id: View.AI_FOCUS, label: 'Enfoque IA', icon: Sparkles, visible: true, domId: 'nav-ai-focus' },
        ]
    }
  ];

  return (
    <div className="w-64 bg-white dark:bg-sushi-dark border-r border-gray-200 dark:border-white/10 flex flex-col h-full sticky top-0 transition-colors duration-300">
      
      {/* Brand Header */}
      <div className="p-8 flex items-center gap-4 border-b border-gray-200 dark:border-white/10">
        <div className="w-10 h-10 border-2 border-sushi-gold rounded-lg flex items-center justify-center">
            <span className="font-serif font-bold text-xl text-sushi-gold leading-none pt-1">SB</span>
        </div>
        <div>
          <h1 className="font-serif text-lg font-bold text-gray-900 dark:text-white tracking-wide">Sushiblack</h1>
          <p className="text-[10px] text-gray-500 dark:text-sushi-muted uppercase tracking-widest font-medium">Manager System</p>
        </div>
      </div>

      <nav id="sidebar-nav" className="flex-1 p-4 space-y-6 mt-2 overflow-y-auto">
        {adminGroups.map((group, idx) => {
            const visibleItems = group.items.filter(i => i.visible);
            if (visibleItems.length === 0) return null;

            return (
                <div key={idx}>
                    <p className="px-4 text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-sushi-muted mb-2">{group.title}</p>
                    <div className="space-y-1">
                        {visibleItems.map((item) => {
                             const isActive = currentView === item.id;
                             return (
                                <button
                                key={item.id}
                                id={item.domId}
                                onClick={() => { setView(item.id); playSound('CLICK'); }}
                                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 group text-sm ${
                                    isActive 
                                    ? 'bg-sushi-gold text-sushi-black font-bold shadow-md shadow-sushi-gold/20' 
                                    : 'text-gray-500 dark:text-sushi-muted hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white'
                                }`}
                                >
                                <item.icon className={`w-4 h-4 ${isActive ? 'text-sushi-black' : 'text-gray-400 dark:text-sushi-muted group-hover:text-gray-900 dark:group-hover:text-white'}`} />
                                <span>{item.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )
        })}
      </nav>

      <DigitalClock />

      <Footer 
        currentUser={currentUser} 
        currentMember={currentMember} 
        onLogout={onLogout} 
        isDarkMode={isDarkMode} 
        toggleTheme={toggleTheme} 
      />
    </div>
  );
};

const Footer = ({ currentUser, currentMember, onLogout, isDarkMode, toggleTheme }: any) => {
    const userName = currentUser ? currentUser.name : (currentMember ? currentMember.name : 'Invitado');
    const userRole = currentUser ? 'Administración' : 'Miembro';

    return (
        <div className="p-4 border-t border-gray-200 dark:border-white/10 space-y-4 bg-gray-50 dark:bg-black/10">
            {/* Theme Toggle */}
            <div id="theme-toggle" className="flex items-center justify-between px-2 py-2 bg-white dark:bg-black/20 rounded-lg border border-gray-200 dark:border-white/5">
                <span className="text-xs font-medium text-gray-500 dark:text-sushi-muted px-2">Apariencia</span>
                <button 
                    onClick={() => { toggleTheme(); playSound('CLICK'); }}
                    className="flex items-center gap-2 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-md p-1.5 shadow-sm hover:border-sushi-gold/50 transition-colors"
                >
                    {isDarkMode ? (
                        <>
                            <Moon className="w-3 h-3 text-sushi-gold" />
                            <span className="text-[10px] text-white">Oscuro</span>
                        </>
                    ) : (
                        <>
                            <Sun className="w-3 h-3 text-sushi-gold" />
                            <span className="text-[10px] text-gray-900">Claro</span>
                        </>
                    )}
                </button>
            </div>

            <div className="flex items-center gap-3 px-2">
                <div className="w-8 h-8 rounded-full bg-sushi-gold text-sushi-black flex items-center justify-center font-bold uppercase shadow-sm overflow-hidden border border-sushi-gold/30">
                    {currentMember?.photoUrl ? (
                        <img src={currentMember.photoUrl} alt="" className="w-full h-full object-cover"/>
                    ) : (
                        userName.charAt(0)
                    )}
                </div>
                <div className="overflow-hidden">
                    <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{userName}</p>
                    <p className="text-xs text-gray-500 dark:text-sushi-muted truncate">{userRole}</p>
                </div>
            </div>
            <button 
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 text-gray-500 dark:text-sushi-muted hover:text-red-500 dark:hover:text-red-400 text-xs px-2 py-1 transition-colors"
            >
            <LogOut className="w-3 h-3" />
            <span>Cerrar Sesión</span>
            </button>
        </div>
    )
}
