import React, { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, X } from 'lucide-react';

export function CatalogPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    price: '',
    compareAtPrice: '',
    availability: 'in_stock',
    image: 'https://placehold.co/400x500'
  });

  const fetchProducts = () => {
    fetch('/v1/catalog')
      .then(r => r.json())
      .then(d => setProducts(d.data || []));
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      category: '',
      price: '',
      compareAtPrice: '',
      availability: 'in_stock',
      image: 'https://placehold.co/400x500'
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (product: any) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      category: product.category || '',
      price: product.price.toString(),
      compareAtPrice: product.compareAtPrice ? product.compareAtPrice.toString() : '',
      availability: product.availability || 'in_stock',
      image: product.image || 'https://placehold.co/400x500'
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      await fetch(`/v1/catalog/products/${id}`, { method: 'DELETE' });
      fetchProducts();
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...formData,
      price: Number(formData.price),
      compareAtPrice: formData.compareAtPrice ? Number(formData.compareAtPrice) : null
    };

    try {
      if (editingProduct) {
        await fetch(`/v1/catalog/products/${editingProduct.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } else {
        await fetch('/v1/catalog/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }
      setIsModalOpen(false);
      fetchProducts();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-4 max-w-6xl mx-auto w-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Catalog Management</h2>
        <button onClick={handleOpenAdd} className="bg-black text-white px-4 py-2 rounded-md font-bold text-sm flex items-center gap-2 hover:bg-gray-800">
          <Plus size={16} /> ADD PRODUCT
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-md shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-[11px] uppercase text-gray-500 font-bold">
                <th className="p-3">Product</th>
                <th className="p-3">Category</th>
                <th className="p-3">Price</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map(p => (
                <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <img src={p.image} alt={p.name} className="w-10 h-10 object-cover rounded bg-gray-100" />
                      <div>
                        <div className="font-bold text-sm text-gray-900">{p.name}</div>
                        <div className="text-[11px] text-gray-500">{p.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-3 text-sm text-gray-600">{p.category}</td>
                  <td className="p-3">
                    <div className="text-sm font-bold">₱{p.price.toLocaleString()}</div>
                    {p.compareAtPrice && <div className="text-[11px] text-gray-400 line-through">₱{p.compareAtPrice.toLocaleString()}</div>}
                  </td>
                  <td className="p-3">
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      p.availability === 'in_stock' ? 'bg-green-100 text-green-800' :
                      p.availability === 'low_stock' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {p.availability.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <button onClick={() => handleOpenEdit(p)} className="p-1.5 text-gray-400 hover:text-black rounded"><Edit2 size={16} /></button>
                    <button onClick={() => handleDelete(p.id)} className="p-1.5 text-gray-400 hover:text-red-600 rounded ml-1"><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {products.length === 0 && (
            <div className="p-8 text-center text-gray-500 text-sm">No products found.</div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-4 border-b border-gray-200">
              <h3 className="font-bold text-lg">{editingProduct ? 'Edit Product' : 'Add New Product'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-black"><X size={20} /></button>
            </div>
            
            <div className="p-4 overflow-y-auto">
              <form id="productForm" onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="product-name" className="block text-xs font-bold text-gray-700 mb-1">PRODUCT NAME</label>
                  <input id="product-name" required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:border-black outline-none" />
                </div>
                <div>
                  <label htmlFor="product-category" className="block text-xs font-bold text-gray-700 mb-1">CATEGORY</label>
                  <input id="product-category" type="text" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:border-black outline-none" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="product-price" className="block text-xs font-bold text-gray-700 mb-1">PRICE (₱)</label>
                    <input id="product-price" required type="number" min="0" step="0.01" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:border-black outline-none" />
                  </div>
                  <div>
                    <label htmlFor="product-compare-price" className="block text-xs font-bold text-gray-700 mb-1">COMPARE AT (₱)</label>
                    <input id="product-compare-price" type="number" min="0" step="0.01" value={formData.compareAtPrice} onChange={e => setFormData({...formData, compareAtPrice: e.target.value})} className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:border-black outline-none" />
                  </div>
                </div>
                <div>
                  <label htmlFor="product-status" className="block text-xs font-bold text-gray-700 mb-1">STATUS</label>
                  <select id="product-status" value={formData.availability} onChange={e => setFormData({...formData, availability: e.target.value})} className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:border-black outline-none">
                    <option value="in_stock">In Stock</option>
                    <option value="low_stock">Low Stock</option>
                    <option value="out_of_stock">Out of Stock</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="product-image" className="block text-xs font-bold text-gray-700 mb-1">IMAGE UPLOAD</label>
                  <div 
                    className="w-full border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors relative cursor-pointer"
                    onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const file = e.dataTransfer.files[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (ev) => setFormData({...formData, image: ev.target?.result as string});
                        reader.readAsDataURL(file);
                      }
                    }}
                  >
                    <input 
                      id="product-image"
                      type="file" 
                      accept="image/*" 
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (ev) => setFormData({...formData, image: ev.target?.result as string});
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                    {formData.image && formData.image !== 'https://placehold.co/400x500' ? (
                      <img src={formData.image} alt="Preview" className="w-32 h-32 object-cover rounded mb-2" />
                    ) : (
                      <div className="w-12 h-12 mb-2 bg-gray-100 rounded-full flex items-center justify-center">
                        <Plus size={24} className="text-gray-400" />
                      </div>
                    )}
                    <span className="text-xs font-semibold">Click or drag image to upload</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200 flex justify-end gap-2 mt-4">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border border-gray-300 rounded font-bold text-sm hover:bg-gray-50">CANCEL</button>
                  <button type="submit" className="px-4 py-2 bg-black text-white rounded font-bold text-sm hover:bg-gray-800">SAVE PRODUCT</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
