
import React, { useState } from 'react';
import { Product } from '../types';
import { Tag, Plus, Pencil, Trash2, Search, DollarSign, Box, Crown, TrendingUp } from 'lucide-react';

interface ProductManagementProps {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
}

export const ProductManagement: React.FC<ProductManagementProps> = ({ products = [], setProducts }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const initialForm = {
      name: '',
      laborCost: 0,
      materialCost: 0,
      royalties: 0,
      profit: 0
  };
  const [formData, setFormData] = useState(initialForm);

  const formatMoney = (val: number) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(val);

  const filteredProducts = (products || []).filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

  const handleEdit = (p: Product) => {
      setEditingId(p.id);
      setFormData({
          name: p.name,
          laborCost: p.laborCost,
          materialCost: p.materialCost,
          royalties: p.royalties,
          profit: p.profit
      });
      setShowModal(true);
  };

  const handleAdd = () => {
      setEditingId(null);
      setFormData(initialForm);
      setShowModal(true);
  };

  const handleDelete = (id: string) => {
      if (window.confirm('¿Eliminar producto?')) {
          setProducts(products.filter(p => p.id !== id));
      }
  };

  const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (editingId) {
          setProducts(products.map(p => p.id === editingId ? { ...p, id: editingId, ...formData } : p));
      } else {
          setProducts([...products, { id: crypto.randomUUID(), ...formData }]);
      }
      setShowModal(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
                <h2 className="text-3xl font-serif text-gray-900 dark:text-white flex items-center gap-3">
                    <Tag className="w-8 h-8 text-sushi-gold" />
                    Catálogo de Productos
                </h2>
                <p className="text-gray-500 dark:text-sushi-muted mt-2">Gestiona costos y precios de tu carta.</p>
            </div>
            <div className="flex gap-4 w-full md:w-auto">
                <div className="relative flex-1 md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                        type="text" 
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        placeholder="Buscar producto..."
                        className="w-full bg-white dark:bg-sushi-dark border border-gray-200 dark:border-white/10 rounded-lg py-2 pl-9 pr-4 text-sm focus:border-sushi-gold outline-none"
                    />
                </div>
                <button 
                    onClick={handleAdd}
                    className="bg-sushi-gold text-sushi-black px-4 py-2 rounded-lg font-bold hover:bg-sushi-goldhover transition-colors flex items-center gap-2 shadow-lg shadow-sushi-gold/20"
                >
                    <Plus className="w-5 h-5" /> Nuevo
                </button>
            </div>
        </div>

        <div className="bg-white dark:bg-sushi-dark border border-gray-200 dark:border-white/5 rounded-xl overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50 dark:bg-black/20 border-b border-gray-200 dark:border-white/5 text-[10px] uppercase tracking-wider text-gray-500 dark:text-sushi-muted">
                            <th className="p-4">Producto</th>
                            <th className="p-4 text-right">Mano de Obra</th>
                            <th className="p-4 text-right">Materia Prima</th>
                            <th className="p-4 text-right">Ganancia</th>
                            <th className="p-4 text-right">Regalías</th>
                            <th className="p-4 text-right">Total (Ref)</th>
                            <th className="p-4 text-center">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-white/5 text-sm">
                        {filteredProducts.length === 0 && (
                            <tr>
                                <td colSpan={7} className="p-8 text-center text-gray-400 dark:text-sushi-muted italic">
                                    No hay productos registrados.
                                </td>
                            </tr>
                        )}
                        {filteredProducts.map(p => {
                            const total = p.laborCost + p.materialCost + p.royalties + p.profit;
                            return (
                                <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors group">
                                    <td className="p-4 font-bold text-gray-900 dark:text-white">{p.name}</td>
                                    <td className="p-4 text-right text-blue-600 dark:text-blue-400 font-mono">{formatMoney(p.laborCost)}</td>
                                    <td className="p-4 text-right text-gray-600 dark:text-gray-400 font-mono">{formatMoney(p.materialCost)}</td>
                                    <td className="p-4 text-right text-green-600 dark:text-green-500 font-mono font-bold">{formatMoney(p.royalties)}</td>
                                    <td className="p-4 text-right text-purple-600 dark:text-purple-400 font-mono">{formatMoney(p.profit)}</td>
                                    <td className="p-4 text-right text-gray-400 dark:text-gray-600 font-mono italic">{formatMoney(total)}</td>
                                    <td className="p-4 flex justify-center gap-2">
                                        <button onClick={() => handleEdit(p)} className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400 hover:text-sushi-gold transition-colors">
                                            <Pencil className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => handleDelete(p.id)} className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400 hover:text-red-500 transition-colors">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>

        {showModal && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-white dark:bg-sushi-dark w-full max-w-lg rounded-2xl p-6 border border-gray-200 dark:border-white/10 shadow-2xl animate-fade-in">
                    <h3 className="text-xl font-serif text-gray-900 dark:text-white mb-6 border-b border-gray-200 dark:border-white/10 pb-4">
                        {editingId ? 'Editar Producto' : 'Nuevo Producto'}
                    </h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="text-xs uppercase text-gray-500 dark:text-sushi-muted mb-1 block">Nombre Producto</label>
                            <input 
                                type="text" 
                                required
                                value={formData.name}
                                onChange={e => setFormData({...formData, name: e.target.value})}
                                className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-lg p-3 text-gray-900 dark:text-white outline-none focus:border-sushi-gold"
                                placeholder="Ej. Combinado Zen"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs uppercase text-blue-600 dark:text-blue-400 mb-1 block font-bold flex items-center gap-1"><DollarSign className="w-3 h-3"/> Mano Obra</label>
                                <input 
                                    type="number" 
                                    required
                                    value={formData.laborCost}
                                    onChange={e => setFormData({...formData, laborCost: parseFloat(e.target.value) || 0})}
                                    className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-lg p-3 text-gray-900 dark:text-white outline-none focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label className="text-xs uppercase text-gray-500 dark:text-gray-400 mb-1 block font-bold flex items-center gap-1"><Box className="w-3 h-3"/> Materia Prima</label>
                                <input 
                                    type="number" 
                                    required
                                    value={formData.materialCost}
                                    onChange={e => setFormData({...formData, materialCost: parseFloat(e.target.value) || 0})}
                                    className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-lg p-3 text-gray-900 dark:text-white outline-none focus:border-gray-500"
                                />
                            </div>
                            <div>
                                <label className="text-xs uppercase text-green-600 dark:text-green-500 mb-1 block font-bold flex items-center gap-1"><TrendingUp className="w-3 h-3"/> Ganancia</label>
                                <input 
                                    type="number" 
                                    required
                                    value={formData.royalties}
                                    onChange={e => setFormData({...formData, royalties: parseFloat(e.target.value) || 0})}
                                    className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-lg p-3 text-gray-900 dark:text-white outline-none focus:border-green-500"
                                />
                            </div>
                            <div>
                                <label className="text-xs uppercase text-purple-600 dark:text-purple-400 mb-1 block font-bold flex items-center gap-1"><Crown className="w-3 h-3"/> Regalías</label>
                                <input 
                                    type="number" 
                                    required
                                    value={formData.profit}
                                    onChange={e => setFormData({...formData, profit: parseFloat(e.target.value) || 0})}
                                    className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-lg p-3 text-gray-900 dark:text-white outline-none focus:border-purple-500"
                                />
                            </div>
                        </div>
                        <div className="flex gap-3 pt-4">
                            <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-gray-100 dark:bg-white/5 py-3 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10 font-bold">Cancelar</button>
                            <button type="submit" className="flex-1 bg-sushi-gold text-sushi-black font-bold py-3 rounded-lg hover:bg-sushi-goldhover">Guardar</button>
                        </div>
                    </form>
                </div>
            </div>
        )}
    </div>
  );
};
