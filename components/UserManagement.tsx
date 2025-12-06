
import React, { useState } from 'react';
import { User, UserPermissions } from '../types';
import { UserCog, Trash2, Shield, User as UserIcon, Mail, Clock, Check, Lock, Grid, Users, Wallet, Archive, Box } from 'lucide-react';
import { playSound } from '../utils/soundUtils';

interface UserManagementProps {
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  currentUser: User;
}

export const UserManagement: React.FC<UserManagementProps> = ({ users, setUsers, currentUser }) => {
  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
    password: '',
    name: '',
  });

  const [permissions, setPermissions] = useState<UserPermissions>({
    viewHr: true,
    manageHr: false,
    viewOps: true,
    manageOps: false,
    viewFinance: false,
    manageFinance: false,
    viewInventory: true,
    manageInventory: true,
    superAdmin: false
  });

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.username || !newUser.password) return;
    
    if (users.some(u => u.username === newUser.username)) {
      alert('El nombre de usuario ya existe');
      playSound('ERROR');
      return;
    }

    const user: User = {
      id: crypto.randomUUID(),
      ...newUser,
      role: permissions.superAdmin ? 'ADMIN' : 'MANAGER', 
      permissions: permissions
    };

    setUsers([...users, user]);
    playSound('SUCCESS');
    
    // Reset Form
    setNewUser({ username: '', email: '', password: '', name: '' });
    setPermissions({
      viewHr: true,
      manageHr: false,
      viewOps: true,
      manageOps: false,
      viewFinance: false,
      manageFinance: false,
      viewInventory: true,
      manageInventory: true,
      superAdmin: false
    });
  };

  const handleDelete = (id: string) => {
    if (id === currentUser.id) {
      alert("No puedes eliminar tu propio usuario.");
      return;
    }
    if (window.confirm("¿Eliminar usuario del sistema?")) {
      setUsers(users.filter(u => u.id !== id));
      playSound('CLICK');
    }
  };

  const togglePermission = (key: keyof UserPermissions) => {
      setPermissions(prev => ({ ...prev, [key]: !prev[key] }));
      playSound('CLICK');
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 animate-fade-in">
      {/* List Users */}
      <div>
        <h2 className="text-3xl font-serif text-gray-900 dark:text-white mb-6">Gestión de Accesos</h2>
        <div className="space-y-4">
          {users.map(u => (
            <div key={u.id} className="bg-white dark:bg-sushi-dark border border-gray-200 dark:border-white/5 p-5 rounded-xl flex items-center justify-between group hover:border-sushi-gold/30 transition-all shadow-sm">
              <div className="flex items-center gap-4">
                 <div className={`p-3 rounded-xl ${u.permissions.superAdmin ? 'bg-sushi-gold/20 text-yellow-700 dark:text-sushi-gold' : 'bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-sushi-muted'}`}>
                    {u.permissions.superAdmin ? <Shield className="w-6 h-6"/> : <UserIcon className="w-6 h-6"/>}
                 </div>
                 <div>
                    <div className="flex items-center gap-2">
                        <p className="text-gray-900 dark:text-white font-bold text-lg">{u.name}</p>
                        {u.permissions.superAdmin && <span className="text-[10px] bg-sushi-gold text-sushi-black px-1.5 rounded font-bold">ADMIN</span>}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-sushi-muted flex flex-col sm:flex-row gap-x-4 mt-1">
                        <span className="flex items-center gap-1"><UserIcon className="w-3 h-3"/> @{u.username}</span>
                        {u.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3"/> {u.email}</span>}
                    </div>
                    
                    {/* Permissions Badges */}
                    <div className="flex flex-wrap gap-1 mt-2">
                        {u.permissions.manageFinance && <span className="text-[9px] bg-green-100 dark:bg-green-500/10 text-green-600 dark:text-green-500 border border-green-200 dark:border-green-500/20 px-1 rounded">Finanzas Full</span>}
                        {u.permissions.manageHr && <span className="text-[9px] bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-500 px-1 rounded">RRHH</span>}
                        {u.permissions.manageOps && <span className="text-[9px] bg-orange-100 dark:bg-orange-500/10 text-orange-600 dark:text-orange-500 px-1 rounded">Operaciones</span>}
                    </div>
                 </div>
              </div>
              {u.id !== currentUser.id && (
                <button 
                    onClick={() => handleDelete(u.id)} 
                    className="text-gray-400 dark:text-sushi-muted hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 p-2 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                    title="Eliminar usuario"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Create User Form */}
      <div className="bg-white dark:bg-sushi-dark border border-gray-200 dark:border-white/5 p-8 rounded-xl h-fit shadow-xl">
        <div className="flex items-center gap-2 mb-6 border-b border-gray-200 dark:border-white/10 pb-4">
            <UserCog className="w-6 h-6 text-sushi-gold" />
            <h3 className="text-xl font-medium text-gray-900 dark:text-white">Crear Nuevo Perfil</h3>
        </div>
        
        <form onSubmit={handleAddUser} className="space-y-6">
          <div className="space-y-4">
            <div>
                <label className="block text-xs uppercase tracking-wider text-gray-500 dark:text-sushi-muted mb-1">Nombre Real</label>
                <input 
                type="text"
                required
                value={newUser.name}
                onChange={e => setNewUser({...newUser, name: e.target.value})}
                className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-lg py-3 px-4 text-gray-900 dark:text-white focus:outline-none focus:border-sushi-gold transition-colors"
                placeholder="Ej. Martín Gomez"
                />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs uppercase tracking-wider text-gray-500 dark:text-sushi-muted mb-1">Usuario</label>
                    <input 
                    type="text"
                    required
                    value={newUser.username}
                    onChange={e => setNewUser({...newUser, username: e.target.value})}
                    className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-lg py-3 px-4 text-gray-900 dark:text-white focus:outline-none focus:border-sushi-gold transition-colors"
                    placeholder="mgomez"
                    />
                </div>
                <div>
                    <label className="block text-xs uppercase tracking-wider text-gray-500 dark:text-sushi-muted mb-1">Contraseña</label>
                    <input 
                    type="password"
                    required
                    value={newUser.password}
                    onChange={e => setNewUser({...newUser, password: e.target.value})}
                    className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-lg py-3 px-4 text-gray-900 dark:text-white focus:outline-none focus:border-sushi-gold transition-colors"
                    placeholder="••••••"
                    />
                </div>
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-white/10 pt-4">
            <div className="flex items-center gap-2 mb-4">
                <Lock className="w-4 h-4 text-sushi-gold" />
                <label className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">Matriz de Permisos</label>
            </div>
            
            {/* Permission Matrix */}
            <div className="bg-gray-50 dark:bg-black/20 rounded-lg p-4 border border-gray-200 dark:border-white/5">
                <div className="grid grid-cols-3 gap-2 mb-2 text-[10px] uppercase font-bold text-gray-500 dark:text-sushi-muted border-b border-gray-200 dark:border-white/5 pb-2">
                    <span>Módulo</span>
                    <span className="text-center">Ver (Lectura)</span>
                    <span className="text-center">Gestionar (Total)</span>
                </div>

                <PermissionRow 
                    label="RRHH" 
                    icon={Users} 
                    viewKey="viewHr" 
                    manageKey="manageHr" 
                    permissions={permissions} 
                    toggle={togglePermission} 
                />
                <PermissionRow 
                    label="Operaciones" 
                    icon={Clock} 
                    viewKey="viewOps" 
                    manageKey="manageOps" 
                    permissions={permissions} 
                    toggle={togglePermission} 
                />
                <PermissionRow 
                    label="Finanzas" 
                    icon={Wallet} 
                    viewKey="viewFinance" 
                    manageKey="manageFinance" 
                    permissions={permissions} 
                    toggle={togglePermission} 
                />
                <PermissionRow 
                    label="Inventario" 
                    icon={Box} 
                    viewKey="viewInventory" 
                    manageKey="manageInventory" 
                    permissions={permissions} 
                    toggle={togglePermission} 
                />
            </div>

            <div className="mt-4 flex items-center justify-between p-3 bg-sushi-gold/10 rounded-lg border border-sushi-gold/30">
                <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-sushi-gold" />
                    <div>
                        <p className="text-xs font-bold text-gray-900 dark:text-white uppercase">Super Admin</p>
                        <p className="text-[10px] text-gray-500 dark:text-sushi-muted">Acceso total + Gestión de Usuarios</p>
                    </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                        type="checkbox" 
                        checked={permissions.superAdmin} 
                        onChange={() => togglePermission('superAdmin')} 
                        className="sr-only peer" 
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-white/10 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sushi-gold"></div>
                </label>
            </div>
          </div>

          <button type="submit" className="w-full bg-sushi-gold text-sushi-black font-bold py-3 rounded-lg hover:bg-sushi-goldhover mt-2 shadow-lg shadow-sushi-gold/10 transition-colors flex items-center justify-center gap-2 transform active:scale-95">
            <Check className="w-5 h-5" />
            Registrar Usuario
          </button>
        </form>
      </div>
    </div>
  );
};

// Helper Row Component
const PermissionRow = ({ label, icon: Icon, viewKey, manageKey, permissions, toggle }: any) => (
    <div className="grid grid-cols-3 gap-2 py-2 items-center border-b border-gray-100 dark:border-white/5 last:border-0">
        <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-white font-medium">
            <Icon className="w-4 h-4 text-gray-400" /> {label}
        </div>
        <div className="flex justify-center">
            <input 
                type="checkbox" 
                checked={permissions[viewKey]} 
                onChange={() => toggle(viewKey)}
                className="w-4 h-4 accent-sushi-gold cursor-pointer"
            />
        </div>
        <div className="flex justify-center">
            <input 
                type="checkbox" 
                checked={permissions[manageKey]} 
                onChange={() => toggle(manageKey)}
                className="w-4 h-4 accent-sushi-gold cursor-pointer"
            />
        </div>
    </div>
);
