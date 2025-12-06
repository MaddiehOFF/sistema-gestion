
import React, { useState, useEffect } from 'react';
import { User, Employee, DatabaseConfig } from '../types';
import { Lock, User as UserIcon, Shield, CreditCard, ArrowRight, Key, Settings, Cloud, Database, CheckCircle2, AlertTriangle, Terminal, Copy } from 'lucide-react';
import { playSound } from '../utils/soundUtils';
import { saveDbConfig, clearDbConfig } from '../services/supabaseClient';

interface LoginProps {
  users: User[];
  employees?: Employee[]; // Pass employees for member login
  onLogin: (user: User) => void;
  onMemberLogin?: (employee: Employee) => void;
}

type LoginMode = 'ADMIN' | 'MEMBER';

export const Login: React.FC<LoginProps> = ({ users, employees = [], onLogin, onMemberLogin }) => {
  const [mode, setMode] = useState<LoginMode>('ADMIN');
  
  // Admin State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  // Member State
  const [dni, setDni] = useState('');
  const [memberPassword, setMemberPassword] = useState('');

  const [error, setError] = useState('');

  // Settings Modal State
  const [showConfig, setShowConfig] = useState(false);
  const [showSql, setShowSql] = useState(false);
  const [dbUrl, setDbUrl] = useState('');
  const [dbKey, setDbKey] = useState('');
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
      const saved = localStorage.getItem('sushiblack_db_config');
      if (saved) {
          const config: DatabaseConfig = JSON.parse(saved);
          if (config.isConfigured) {
              setDbUrl(config.url);
              setDbKey(config.key);
              setIsConnected(true);
          }
      }
  }, []);

  const handleAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const user = users.find(u => u.username === username && u.password === password);
    
    if (user) {
      playSound('LOGIN');
      onLogin(user);
    } else {
      playSound('ERROR');
      setError('Credenciales de administrador inválidas');
    }
  };

  const handleMemberSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onMemberLogin) return;

    // Remove dots/dashes for comparison
    const cleanDni = dni.replace(/\D/g, '');
    
    const member = employees.find(emp => {
        const empDni = (emp.dni || '').replace(/\D/g, '');
        return empDni === cleanDni && emp.active;
    });

    if (member) {
        if (member.password === memberPassword) {
             playSound('LOGIN');
             onMemberLogin(member);
        } else {
             playSound('ERROR');
             setError('Contraseña incorrecta.');
        }
    } else {
        playSound('ERROR');
        setError('DNI no encontrado o empleado inactivo. Contacte a un administrador.');
    }
  };

  const handleSaveConfig = (e: React.FormEvent) => {
      e.preventDefault();
      saveDbConfig(dbUrl, dbKey);
      setIsConnected(true);
      setShowConfig(false);
      playSound('SUCCESS');
      // Reload page to force data sync
      window.location.reload();
  };

  const handleDisconnect = () => {
      clearDbConfig();
      setDbUrl('');
      setDbKey('');
      setIsConnected(false);
      playSound('CLICK');
  };

  const sqlScript = `create table if not exists app_data (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz default now()
);
alter table app_data enable row level security;
create policy "Public Access" on app_data for all using (true) with check (true);`;

  const copySql = () => {
      navigator.clipboard.writeText(sqlScript);
      alert("SQL copiado al portapapeles. Pégalo en el SQL Editor de Supabase.");
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-sushi-black flex items-center justify-center p-4 transition-colors duration-300 relative">
      
      {/* Config Button */}
      <button 
        onClick={() => setShowConfig(true)}
        className="absolute top-6 right-6 p-2 rounded-full bg-white dark:bg-white/5 text-gray-400 hover:text-sushi-gold shadow-sm border border-gray-200 dark:border-white/10 transition-colors"
        title="Configuración de Nube"
      >
          <Settings className="w-5 h-5" />
      </button>

      <div className="w-full max-w-md bg-white dark:bg-sushi-dark border border-gray-200 dark:border-white/5 rounded-2xl shadow-2xl relative overflow-hidden flex flex-col animate-slide-up">
        
        {/* Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-sushi-gold/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="text-center pt-8 pb-4 relative z-10 px-8">
          <div className="inline-flex p-3 border-2 border-sushi-gold rounded-lg mb-4 animate-fade-in">
             <span className="font-serif text-3xl font-bold text-sushi-gold">SB</span>
          </div>
          <h1 className="font-serif text-3xl font-bold text-gray-900 dark:text-white tracking-wide">Sushiblack</h1>
          <p className="text-gray-500 dark:text-sushi-muted text-sm uppercase tracking-widest mt-1">
              {mode === 'ADMIN' ? 'Acceso Gerencial' : 'Portal del Colaborador'}
          </p>
          {isConnected && (
              <div className="flex items-center justify-center gap-1 mt-2 text-[10px] text-green-500 font-bold bg-green-500/10 py-0.5 px-2 rounded-full w-fit mx-auto border border-green-500/20">
                  <Cloud className="w-3 h-3" /> NUBE CONECTADA
              </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-white/10 px-8">
            <button 
                onClick={() => { setMode('ADMIN'); setError(''); playSound('CLICK'); }}
                className={`flex-1 pb-3 text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-2 border-b-2 transition-colors ${mode === 'ADMIN' ? 'border-sushi-gold text-sushi-gold' : 'border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-white'}`}
            >
                <Shield className="w-4 h-4" /> Admin
            </button>
            <button 
                onClick={() => { setMode('MEMBER'); setError(''); playSound('CLICK'); }}
                className={`flex-1 pb-3 text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-2 border-b-2 transition-colors ${mode === 'MEMBER' ? 'border-sushi-gold text-sushi-gold' : 'border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-white'}`}
            >
                <UserIcon className="w-4 h-4" /> Miembro
            </button>
        </div>

        <div className="p-8 relative z-10">
            {mode === 'ADMIN' ? (
                <form onSubmit={handleAdminSubmit} className="space-y-6">
                <div>
                    <label className="block text-xs uppercase tracking-wider text-gray-500 dark:text-sushi-muted mb-1">Usuario</label>
                    <div className="relative">
                    <UserIcon className="absolute left-3 top-3 w-5 h-5 text-gray-400 dark:text-sushi-muted" />
                    <input 
                        type="text" 
                        value={username}
                        onChange={e => setUsername(e.target.value)}
                        className="w-full bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/10 rounded-lg py-3 pl-10 pr-4 text-gray-900 dark:text-white focus:outline-none focus:border-sushi-gold transition-colors"
                        placeholder="admin"
                    />
                    </div>
                </div>

                <div>
                    <label className="block text-xs uppercase tracking-wider text-gray-500 dark:text-sushi-muted mb-1">Contraseña</label>
                    <div className="relative">
                    <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-400 dark:text-sushi-muted" />
                    <input 
                        type="password" 
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        className="w-full bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/10 rounded-lg py-3 pl-10 pr-4 text-gray-900 dark:text-white focus:outline-none focus:border-sushi-gold transition-colors"
                        placeholder="••••••"
                    />
                    </div>
                </div>

                {error && (
                    <div className="text-red-500 dark:text-red-400 text-sm text-center bg-red-100 dark:bg-red-400/10 py-2 rounded animate-shake">
                    {error}
                    </div>
                )}

                <button 
                    type="submit" 
                    className="w-full bg-sushi-gold text-sushi-black font-bold py-3 rounded-lg hover:bg-sushi-goldhover transition-colors shadow-lg shadow-sushi-gold/10 transform active:scale-95 duration-100"
                >
                    Ingresar al Panel
                </button>
                </form>
            ) : (
                <form onSubmit={handleMemberSubmit} className="space-y-6">
                    <div className="bg-blue-50 dark:bg-blue-500/10 p-4 rounded-lg text-sm text-blue-800 dark:text-blue-300 mb-4">
                        Bienvenido al portal de empleados. Ingresa con tu DNI y la contraseña provista por administración.
                    </div>

                    <div>
                        <label className="block text-xs uppercase tracking-wider text-gray-500 dark:text-sushi-muted mb-1">Número de Documento (DNI)</label>
                        <div className="relative">
                        <CreditCard className="absolute left-3 top-3 w-5 h-5 text-gray-400 dark:text-sushi-muted" />
                        <input 
                            type="text" 
                            value={dni}
                            onChange={e => setDni(e.target.value)}
                            className="w-full bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/10 rounded-lg py-3 pl-10 pr-4 text-gray-900 dark:text-white focus:outline-none focus:border-sushi-gold transition-colors"
                            placeholder="Ej. 35123456"
                        />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs uppercase tracking-wider text-gray-500 dark:text-sushi-muted mb-1">Contraseña</label>
                        <div className="relative">
                        <Key className="absolute left-3 top-3 w-5 h-5 text-gray-400 dark:text-sushi-muted" />
                        <input 
                            type="password" 
                            value={memberPassword}
                            onChange={e => setMemberPassword(e.target.value)}
                            className="w-full bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/10 rounded-lg py-3 pl-10 pr-4 text-gray-900 dark:text-white focus:outline-none focus:border-sushi-gold transition-colors"
                            placeholder="••••••"
                        />
                        </div>
                    </div>

                    {error && (
                        <div className="text-red-500 dark:text-red-400 text-sm text-center bg-red-100 dark:bg-red-400/10 py-2 rounded animate-shake">
                        {error}
                        </div>
                    )}

                    <button 
                        type="submit" 
                        className="w-full bg-white dark:bg-white/10 border border-gray-200 dark:border-white/20 text-gray-900 dark:text-white font-bold py-3 rounded-lg hover:bg-gray-50 dark:hover:bg-white/20 transition-colors flex items-center justify-center gap-2 transform active:scale-95 duration-100"
                    >
                        Ingresar <ArrowRight className="w-4 h-4" />
                    </button>
                </form>
            )}
        </div>
      </div>

      {/* Config Modal */}
      {showConfig && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white dark:bg-sushi-dark w-full max-w-lg rounded-2xl p-6 border border-gray-200 dark:border-white/10 shadow-2xl animate-fade-in max-h-[90vh] overflow-y-auto">
                  <div className="flex items-center gap-3 mb-6 border-b border-gray-200 dark:border-white/10 pb-4">
                      <div className="bg-gray-100 dark:bg-white/10 p-2 rounded-lg">
                          <Database className="w-6 h-6 text-gray-700 dark:text-white" />
                      </div>
                      <div>
                          <h3 className="text-xl font-bold text-gray-900 dark:text-white">Conexión a Nube</h3>
                          <p className="text-xs text-gray-500 dark:text-sushi-muted">Configura Supabase para sincronizar datos.</p>
                      </div>
                  </div>

                  <form onSubmit={handleSaveConfig} className="space-y-4">
                      <div>
                          <label className="block text-xs uppercase tracking-wider text-gray-500 dark:text-sushi-muted mb-1">Project URL</label>
                          <input 
                            type="text" 
                            value={dbUrl}
                            onChange={e => setDbUrl(e.target.value)}
                            placeholder="https://xyz.supabase.co"
                            className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-lg p-3 text-sm focus:border-sushi-gold outline-none text-gray-900 dark:text-white"
                            required
                          />
                      </div>
                      <div>
                          <label className="block text-xs uppercase tracking-wider text-gray-500 dark:text-sushi-muted mb-1">
                              API Key <span className="text-green-500 font-bold">(ANON PUBLIC)</span>
                          </label>
                          <input 
                            type="password" 
                            value={dbKey}
                            onChange={e => setDbKey(e.target.value)}
                            placeholder="eyJh..."
                            className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-lg p-3 text-sm focus:border-sushi-gold outline-none text-gray-900 dark:text-white"
                            required
                          />
                          <p className="text-[10px] text-red-500 mt-1 flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3"/> NO uses la key "service_role" (SECRET).
                          </p>
                      </div>

                      {/* SQL HELP SECTION */}
                      <div className="border-t border-gray-200 dark:border-white/10 pt-4 mt-2">
                          <button 
                            type="button"
                            onClick={() => setShowSql(!showSql)}
                            className="flex items-center gap-2 text-xs font-bold text-sushi-gold hover:underline"
                          >
                              <Terminal className="w-3 h-3" />
                              {showSql ? 'Ocultar SQL' : '¿Error de Tabla? Ver SQL de Instalación'}
                          </button>
                          
                          {showSql && (
                              <div className="mt-2 bg-gray-900 rounded-lg p-3 relative">
                                  <pre className="text-[10px] text-gray-300 font-mono whitespace-pre-wrap">
                                      {sqlScript}
                                  </pre>
                                  <button 
                                    type="button"
                                    onClick={copySql}
                                    className="absolute top-2 right-2 p-1.5 bg-white/10 hover:bg-white/20 rounded text-white"
                                    title="Copiar SQL"
                                  >
                                      <Copy className="w-3 h-3" />
                                  </button>
                                  <p className="text-[10px] text-gray-500 mt-2">
                                      Pega esto en el <strong>SQL Editor</strong> de Supabase para crear la tabla necesaria.
                                  </p>
                              </div>
                          )}
                      </div>

                      <div className="flex gap-3 pt-2">
                          <button 
                            type="button" 
                            onClick={() => setShowConfig(false)} 
                            className="flex-1 bg-gray-100 dark:bg-white/5 py-3 rounded-lg text-gray-600 dark:text-gray-300 font-bold hover:bg-gray-200 dark:hover:bg-white/10"
                          >
                              Cancelar
                          </button>
                          {isConnected ? (
                              <button 
                                type="button" 
                                onClick={handleDisconnect}
                                className="flex-1 bg-red-600 text-white font-bold py-3 rounded-lg hover:bg-red-700"
                              >
                                  Desconectar
                              </button>
                          ) : (
                              <button 
                                type="submit" 
                                className="flex-1 bg-sushi-gold text-sushi-black font-bold py-3 rounded-lg hover:bg-sushi-goldhover"
                              >
                                  Guardar y Conectar
                              </button>
                          )}
                      </div>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
};
