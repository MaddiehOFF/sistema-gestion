
import React, { useState } from 'react';
import { View, RoleAccessConfig, EmployeeRole } from '../types';
import { Settings, Shield, Plus, Trash2, Box, Wallet, Lock, Save, Briefcase } from 'lucide-react';
import { playSound } from '../utils/soundUtils';

interface SettingsViewProps {
  roleAccess: RoleAccessConfig;
  setRoleAccess: React.Dispatch<React.SetStateAction<RoleAccessConfig>>;
  customRoles: string[];
  setCustomRoles: React.Dispatch<React.SetStateAction<string[]>>;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ roleAccess, setRoleAccess, customRoles, setCustomRoles }) => {
  const [newRoleName, setNewRoleName] = useState('');

  // Default system roles
  const systemRoles: EmployeeRole[] = [
      'EMPRESA', 'GERENTE', 'COORDINADOR', 'JEFE_COCINA', 'ADMINISTRATIVO', 'MOSTRADOR', 'COCINA', 'REPARTIDOR'
  ];

  const allRoles = [...systemRoles, ...customRoles];

  const modules = [
      { id: View.INVENTORY, label: 'Inventario', icon: Box },
      { id: View.CASH_REGISTER, label: 'Caja / Movimientos', icon: Wallet },
      // Add more operational modules that members might need access to here
  ];

  const toggleAccess = (role: string, view: View) => {
      const currentAccess = roleAccess[role] || [];
      const hasAccess = currentAccess.includes(view);
      
      let newAccess;
      if (hasAccess) {
          newAccess = currentAccess.filter(v => v !== view);
      } else {
          newAccess = [...currentAccess, view];
      }

      setRoleAccess({ ...roleAccess, [role]: newAccess });
      playSound('CLICK');
  };

  const handleAddRole = (e: React.FormEvent) => {
      e.preventDefault();
      if (!newRoleName.trim()) return;
      const formattedName = newRoleName.toUpperCase().replace(/\s+/g, '_');
      
      if (allRoles.includes(formattedName)) {
          alert('Este rol ya existe.');
          return;
      }

      setCustomRoles([...customRoles, formattedName]);
      setNewRoleName('');
      playSound('SUCCESS');
  };

  const handleDeleteRole = (role: string) => {
      if (window.confirm(`¿Eliminar rol personalizado ${role}?`)) {
          setCustomRoles(customRoles.filter(r => r !== role));
          // Clean up permissions
          const newAccess = { ...roleAccess };
          delete newAccess[role];
          setRoleAccess(newAccess);
          playSound('CLICK');
      }
  };

  return (
    <div className="space-y-8 animate-fade-in">
        <div>
            <h2 className="text-3xl font-serif text-gray-900 dark:text-white flex items-center gap-3">
                <Settings className="w-8 h-8 text-sushi-gold" />
                Configuración del Sistema
            </h2>
            <p className="text-gray-500 dark:text-sushi-muted mt-2">Personaliza roles, permisos y funciones.</p>
        </div>

        {/* Role Permissions Matrix */}
        <div className="bg-white dark:bg-sushi-dark border border-gray-200 dark:border-white/5 rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
                <Shield className="w-6 h-6 text-blue-500" />
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Permisos de Roles (Miembros)</h3>
            </div>
            
            <p className="text-sm text-gray-500 dark:text-sushi-muted mb-6">
                Define qué herramientas operativas pueden ver los empleados según su rol en el portal de miembros.
            </p>

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50 dark:bg-black/20 text-xs uppercase tracking-wider text-gray-500 dark:text-sushi-muted">
                            <th className="p-4 rounded-tl-lg">Rol / Jerarquía</th>
                            {modules.map(mod => (
                                <th key={mod.id} className="p-4 text-center">
                                    <div className="flex flex-col items-center gap-1">
                                        <mod.icon className="w-4 h-4"/>
                                        {mod.label}
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                        {allRoles.map(role => (
                            <tr key={role} className="hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                                <td className="p-4 font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    {customRoles.includes(role) ? <Briefcase className="w-4 h-4 text-sushi-gold"/> : <Shield className="w-4 h-4 text-gray-400"/>}
                                    {role.replace(/_/g, ' ')}
                                </td>
                                {modules.map(mod => {
                                    const hasAccess = (roleAccess[role] || []).includes(mod.id);
                                    return (
                                        <td key={mod.id} className="p-4 text-center">
                                            <label className="relative inline-flex items-center cursor-pointer justify-center">
                                                <input 
                                                    type="checkbox" 
                                                    checked={hasAccess} 
                                                    onChange={() => toggleAccess(role, mod.id)} 
                                                    className="sr-only peer" 
                                                />
                                                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-white/10 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[calc(50%-16px)] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-sushi-gold peer-checked:after:left-[calc(50%-16px)]"></div>
                                            </label>
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>

        {/* Custom Role Creator */}
        <div className="bg-white dark:bg-sushi-dark border border-gray-200 dark:border-white/5 rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
                <Briefcase className="w-6 h-6 text-purple-500" />
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Roles Personalizados</h3>
            </div>

            <div className="flex gap-4 mb-6">
                <form onSubmit={handleAddRole} className="flex-1 flex gap-2">
                    <input 
                        type="text" 
                        value={newRoleName}
                        onChange={e => setNewRoleName(e.target.value)}
                        placeholder="Nombre del nuevo rol (Ej. Supervisor Limpieza)"
                        className="flex-1 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-lg px-4 py-2 outline-none focus:border-sushi-gold"
                    />
                    <button type="submit" className="bg-purple-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-purple-700 transition-colors flex items-center gap-2">
                        <Plus className="w-4 h-4"/> Crear
                    </button>
                </form>
            </div>

            <div className="flex flex-wrap gap-3">
                {customRoles.length === 0 && <p className="text-gray-400 dark:text-sushi-muted text-sm italic">No hay roles personalizados creados.</p>}
                {customRoles.map(role => (
                    <div key={role} className="flex items-center gap-2 bg-gray-100 dark:bg-white/5 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-white/10">
                        <span className="font-bold text-gray-700 dark:text-white text-sm">{role.replace(/_/g, ' ')}</span>
                        <button onClick={() => handleDeleteRole(role)} className="text-gray-400 hover:text-red-500">
                            <Trash2 className="w-3 h-3" />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    </div>
  );
};
