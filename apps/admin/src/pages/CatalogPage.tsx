import React, { useEffect, useState } from 'react';
import { 
  Plus, Edit2, Trash2, X, Copy, Download, Upload, Filter, Search, 
  ChevronDown, CheckCircle, AlertTriangle, Archive, Layers 
} from 'lucide-react';
import { ProductForm } from '../components/Catalog/ProductForm';
import { CategoryManager } from '../components/Catalog/CategoryManager';
import { GlossyBadge } from '../components/Catalog/GlossyBadge';
import { Product, Category } from '../../../../packages/domain/catalog';

export function CatalogPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isBulkStockModalOpen, setIsBulkStockModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const fetchData = async () => {
    try {
      const [prodRes, catRes] = await Promise.all([
        fetch('/v1/catalog'),
        fetch('/v1/catalog/categories')
      ]);
      const [prodData, catData] = await Promise.all([prodRes.json(), catRes.json()]);
      setProducts(prodData.data || []);
      setCategories(catData.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setIsProductModalOpen(true);
  };

  const handleOpenEdit = (product: Product) => {
    setEditingProduct(product);
    setIsProductModalOpen(true);
  };

  const handleDuplicate = async (id: string) => {
    try {
      await fetch(`/v1/catalog/products/${id}/duplicate`, { method: 'POST' });
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Archive this product? (It will be hidden from the storefront)')) return;
    try {
      await fetch(`/v1/catalog/products/${id}`, { method: 'DELETE' });
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleProductSubmit = async (data: any, explicitId?: string) => {
    try {
      const id = explicitId || editingProduct?.id;
      const url = id ? `/v1/catalog/products/${id}` : '/v1/catalog/products';
      const method = id ? 'PATCH' : 'POST';
      
      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      setIsProductModalOpen(false);
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleCategoryUpsert = async (cat: Partial<Category>) => {
    try {
      const url = cat.id ? `/v1/catalog/categories/${cat.id}` : '/v1/catalog/categories';
      const method = cat.id ? 'PATCH' : 'POST';
      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cat)
      });
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleExport = () => {
    window.location.href = '/v1/catalog/export';
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    setSelectedIds(selectedIds.length === filteredProducts.length ? [] : filteredProducts.map(p => p.id));
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.sku.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || p.categories.includes(categoryFilter);
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto w-full min-h-screen bg-gray-50/50">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-gray-900 uppercase italic">Catalog Ledger</h1>
          <p className="text-xs font-bold text-gray-400 mt-1 uppercase tracking-widest">Inventory Control & Product Orchestration</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExport} className="p-2 border border-gray-300 rounded hover:bg-white transition-colors" title="Export CSV">
            <Download size={18} />
          </button>
          <button onClick={() => setIsCategoryModalOpen(true)} className="px-4 py-2 border border-gray-300 rounded-md font-bold text-xs uppercase tracking-widest hover:bg-white transition-colors flex items-center gap-2">
            <Layers size={16} /> Categories
          </button>
          <button onClick={handleOpenAdd} className="bg-black text-white px-6 py-2 rounded-md font-bold text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-gray-800 shadow-lg shadow-black/20 transition-all active:scale-95">
            <Plus size={16} /> New Product
          </button>
        </div>
      </div>

      {/* Filters & Bulk Actions */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm mb-6 p-4 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input 
            type="text" 
            placeholder="Search by Name or SKU..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:border-black outline-none bg-gray-50 transition-all focus:bg-white" 
          />
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-gray-400" />
            <select 
              value={categoryFilter} 
              onChange={e => setCategoryFilter(e.target.value)}
              className="border-none bg-transparent text-xs font-bold uppercase tracking-wider outline-none cursor-pointer"
            >
              <option value="all">All Categories</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          
          {selectedIds.length > 0 && (
            <div className="flex items-center gap-2 pl-4 border-l border-gray-200 animate-in fade-in slide-in-from-right-4">
              <span className="text-[10px] font-black text-gray-400 uppercase">{selectedIds.length} Selected</span>
              <button onClick={() => setIsBulkStockModalOpen(true)} className="text-[10px] font-bold text-black uppercase hover:underline">Adjust Stock</button>
              <button onClick={() => setSelectedIds([])} className="text-[10px] font-bold text-gray-400 uppercase hover:underline">Clear</button>
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-200 text-[10px] uppercase text-gray-400 font-black tracking-[0.2em]">
                <th className="p-4 w-10">
                  <input type="checkbox" checked={selectedIds.length === filteredProducts.length && filteredProducts.length > 0} onChange={toggleSelectAll} className="accent-black" />
                </th>
                <th className="p-4">Identity</th>
                <th className="p-4">Logistics</th>
                <th className="p-4">Financials</th>
                <th className="p-4">Exposure</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map(p => (
                <tr key={p.id} className={`border-b border-gray-50 hover:bg-gray-50/50 transition-colors ${selectedIds.includes(p.id) ? 'bg-gray-50' : ''}`}>
                  <td className="p-4">
                    <input type="checkbox" checked={selectedIds.includes(p.id)} onChange={() => toggleSelect(p.id)} className="accent-black" />
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="relative group">
                        <img src={p.media?.[0]?.url || 'https://placehold.co/400x500'} alt={p.name} className="w-12 h-16 object-cover rounded shadow-sm border border-gray-100" />
                        {p.isFeatured && <div className="absolute -top-1 -left-1 bg-yellow-400 w-3 h-3 rounded-full border-2 border-white shadow-sm" title="Featured Product" />}
                      </div>
                      <div>
                        <div className="font-black text-sm text-gray-900 leading-none mb-1 uppercase tracking-tighter">{p.name}</div>
                        <div className="text-[10px] font-bold text-gray-400 flex items-center gap-2">
                          <span className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-500">{p.sku}</span>
                          <span className="italic">{p.subname}</span>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {p.badges?.map(b => <GlossyBadge key={b} type={b as any} />)}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="space-y-1">
                      <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{categories.find(c => p.categories.includes(c.id))?.name || 'Uncategorized'}</div>
                      <div className="flex items-center gap-2">
                         <span className={`text-[10px] font-black ${p.stockQuantity <= 5 ? 'text-red-500' : 'text-gray-900'}`}>
                           {p.stockQuantity} UNIT{p.stockQuantity !== 1 ? 'S' : ''}
                         </span>
                         <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 uppercase">{p.stockPolicy.replace('_', ' ')}</span>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="font-black text-sm text-gray-900">₱{p.price.toLocaleString()}</div>
                    {p.compareAtPrice && (
                      <div className="text-[10px] text-red-400 font-bold line-through">₱{p.compareAtPrice.toLocaleString()}</div>
                    )}
                    {p.cost && <div className="text-[8px] text-gray-400 mt-1 uppercase font-bold tracking-widest">Cost: ₱{p.cost}</div>}
                  </td>
                  <td className="p-4">
                    <GlossyBadge type={p.status.toUpperCase() as any} />
                    <div className="mt-1 flex items-center gap-1 opacity-50">
                      {p.channels.includes('telegram') && <span className="text-[8px] font-bold bg-blue-100 text-blue-600 px-1 rounded uppercase">TG</span>}
                      {p.channels.includes('web') && <span className="text-[8px] font-bold bg-purple-100 text-purple-600 px-1 rounded uppercase">WEB</span>}
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => handleDuplicate(p.id)} className="p-2 text-gray-300 hover:text-black hover:bg-white rounded transition-all" title="Duplicate Record"><Copy size={16} /></button>
                      <button onClick={() => handleOpenEdit(p)} className="p-2 text-gray-300 hover:text-black hover:bg-white rounded transition-all" title="Edit Metadata"><Edit2 size={16} /></button>
                      <button onClick={() => handleDelete(p.id)} className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded transition-all" title="Archive Entry"><Archive size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredProducts.length === 0 && (
            <div className="p-20 text-center flex flex-col items-center justify-center space-y-4">
               <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-gray-300">
                  <Search size={32} />
               </div>
               <div>
                  <p className="text-sm font-black uppercase italic text-gray-300">No matching records found in the ledger</p>
                  <button onClick={() => {setSearchQuery(''); setCategoryFilter('all');}} className="text-[10px] font-bold text-black uppercase hover:underline mt-2">Clear all filters</button>
               </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {isProductModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <ProductForm 
            initialData={editingProduct || {}} 
            categories={categories}
            allProducts={products}
            onClose={() => setIsProductModalOpen(false)}
            onSubmit={handleProductSubmit}
          />
        </div>
      )}

      {isCategoryModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <CategoryManager 
            categories={categories}
            onClose={() => setIsCategoryModalOpen(false)}
            onUpsert={handleCategoryUpsert}
          />
        </div>
      )}

      {isBulkStockModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
               <h3 className="font-black text-xs uppercase tracking-widest">Bulk Stock Adjustment</h3>
               <button onClick={() => setIsBulkStockModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full"><X size={20}/></button>
            </div>
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
               {products.filter(p => selectedIds.includes(p.id)).map(p => (
                 <div key={p.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                    <div className="flex items-center gap-3">
                       <img src={p.media?.[0]?.url || 'https://placehold.co/100x100'} className="w-8 h-10 object-cover rounded border" />
                       <div>
                          <div className="text-[10px] font-black uppercase tracking-tighter">{p.name}</div>
                          <div className="text-[8px] font-bold text-gray-400">CURRENT: {p.stockQuantity}</div>
                       </div>
                    </div>
                    <div className="flex items-center gap-2">
                       <button 
                         onClick={() => {
                            const newQty = Math.max(0, p.stockQuantity - 1);
                            handleProductSubmit({ stockQuantity: newQty }, p.id);
                         }}
                         className="w-6 h-6 flex items-center justify-center bg-white border border-gray-200 rounded font-black text-xs hover:bg-gray-50">-</button>
                       <input 
                         type="number" 
                         value={p.stockQuantity}
                         onChange={(e) => handleProductSubmit({ stockQuantity: parseInt(e.target.value) || 0 }, p.id)}
                         className="w-12 text-center text-xs font-black bg-white border border-gray-200 rounded py-1" />
                       <button 
                         onClick={() => {
                            const newQty = p.stockQuantity + 1;
                            handleProductSubmit({ stockQuantity: newQty }, p.id);
                         }}
                         className="w-6 h-6 flex items-center justify-center bg-white border border-gray-200 rounded font-black text-xs hover:bg-gray-50">+</button>
                    </div>
                 </div>
               ))}
            </div>
            <div className="mt-8 flex justify-end">
               <button onClick={() => setIsBulkStockModalOpen(false)} className="px-8 py-3 bg-black text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-800 shadow-xl shadow-black/20">Done</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
