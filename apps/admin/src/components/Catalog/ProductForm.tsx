import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, GripVertical, Image as ImageIcon, Barcode, DollarSign, Package, Settings, Globe, Layers } from 'lucide-react';
import { Product, ProductVariant, Media, BundleItem, Category } from '../../../../../packages/domain/catalog';

interface ProductFormProps {
  initialData?: Partial<Product>;
  categories: Category[];
  allProducts: Product[]; // For bundling
  onSubmit: (data: any) => void;
  onClose: () => void;
}

export function ProductForm({ initialData, categories, allProducts, onSubmit, onClose }: ProductFormProps) {
  const [activeTab, setActiveTab] = useState('general');
  const [formData, setFormData] = useState<any>({
    name: '',
    subname: '',
    slug: '',
    categories: [],
    status: 'draft',
    shortDescription: '',
    fullDescription: '',
    tags: [],
    attributes: {},
    searchKeywords: [],
    price: 0,
    compareAtPrice: 0,
    cost: 0,
    currency: 'PHP',
    sku: '',
    barcode: '',
    stockPolicy: 'tracked',
    stockQuantity: 0,
    minOrderQuantity: 1,
    maxOrderQuantity: 99,
    orderIncrement: 1,
    media: [],
    hasVariants: false,
    variants: [],
    isBundle: false,
    bundleItems: [],
    isFeatured: false,
    featuredOrder: 0,
    badges: [],
    channels: ['telegram'],
    seo: { title: '', description: '', keywords: [] },
    ...initialData
  });

  const tabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'pricing', label: 'Pricing', icon: DollarSign },
    { id: 'inventory', label: 'Inventory', icon: Package },
    { id: 'media', label: 'Media', icon: ImageIcon },
    { id: 'bundling', label: 'Bundling', icon: Layers },
    { id: 'seo', label: 'SEO', icon: Globe },
  ];

  const handleAddMedia = (url: string) => {
    const newMedia: Media = {
      id: Math.random().toString(36).substring(7),
      url,
      altText: formData.name,
      order: formData.media.length
    };
    setFormData({ ...formData, media: [...formData.media, newMedia] });
  };

  const handleAddBundleItem = (productId: string) => {
    const newItem: BundleItem = { productId, quantity: 1, specialPrice: 0 };
    setFormData({ ...formData, bundleItems: [...formData.bundleItems, newItem] });
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-4xl flex flex-col max-h-[90vh] transition-colors">
      <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-800">
        <h3 className=" text-lg">{initialData?.id ? 'Edit Product' : 'Add New Product'}</h3>
        <button onClick={onClose} className="text-gray-400 dark:text-gray-500 hover:text-black dark:hover:text-white"><X size={20} /></button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Tabs */}
        <div className="w-48 bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-800 overflow-y-auto p-2 space-y-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm  transition-colors ${
                activeTab === tab.id ? 'bg-black text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-white dark:bg-gray-900">
          <form id="productForm" onSubmit={(e) => { e.preventDefault(); onSubmit(formData); }} className="space-y-6">
            {activeTab === 'general' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-xs  text-gray-700 dark:text-gray-300 mb-1">PRODUCT NAME</label>
                    <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full border border-gray-300 dark:border-gray-700 rounded px-3 py-2 text-sm focus:border-black dark:focus:border-white outline-none" placeholder="e.g. Premium Espresso Roast" />
                  </div>
                  <div>
                    <label className="block text-xs  text-gray-700 dark:text-gray-300 mb-1">SUBNAME / EDITION</label>
                    <input type="text" value={formData.subname} onChange={e => setFormData({...formData, subname: e.target.value})} className="w-full border border-gray-300 dark:border-gray-700 rounded px-3 py-2 text-sm focus:border-black dark:focus:border-white outline-none" placeholder="e.g. Winter Limited 2024" />
                  </div>
                  <div>
                    <label className="block text-xs  text-gray-700 dark:text-gray-300 mb-1">SLUG</label>
                    <input type="text" value={formData.slug} onChange={e => setFormData({...formData, slug: e.target.value})} className="w-full border border-gray-300 dark:border-gray-700 rounded px-3 py-2 text-sm focus:border-black dark:focus:border-white outline-none bg-gray-50 dark:bg-gray-800" placeholder="auto-generated" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs  text-gray-700 dark:text-gray-300 mb-1">CATEGORIES</label>
                  <select 
                    multiple 
                    value={formData.categories} 
                    onChange={e => {
                      const options = Array.from(e.target.selectedOptions);
                      const values = options.map((o: HTMLOptionElement) => o.value);
                      setFormData({...formData, categories: values});
                    }}
                    className="w-full border border-gray-300 dark:border-gray-700 rounded px-3 py-2 text-sm focus:border-black dark:focus:border-white outline-none min-h-[100px]"
                  >
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple categories</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs  text-gray-700 dark:text-gray-300 mb-1">VISIBILITY STATUS</label>
                    <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full border border-gray-300 dark:border-gray-700 rounded px-3 py-2 text-sm focus:border-black dark:focus:border-white outline-none">
                      <option value="draft">Draft</option>
                      <option value="active">Active</option>
                      <option value="scheduled">Scheduled</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs  text-gray-700 dark:text-gray-300 mb-1">IS FEATURED?</label>
                    <div className="flex items-center gap-2 mt-2">
                      <input type="checkbox" checked={formData.isFeatured} onChange={e => setFormData({...formData, isFeatured: e.target.checked})} className="w-4 h-4 accent-black" />
                      <span className="text-sm ">Promote to top</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs  text-gray-700 dark:text-gray-300 mb-1">MARKETING BADGES</label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {['NEW ARRIVAL', 'SALE', 'LIMITED STOCKS', 'BEST-SELLER', 'OUT OF STOCK'].map(badge => (
                      <button
                        key={badge}
                        type="button"
                        onClick={() => {
                          const badges = formData.badges.includes(badge)
                            ? formData.badges.filter((b: string) => b !== badge)
                            : [...formData.badges, badge];
                          setFormData({ ...formData, badges });
                        }}
                        className={`px-3 py-1 rounded-full text-[10px]  border transition-all ${
                          formData.badges.includes(badge) ? 'bg-black text-white border-black' : 'bg-white dark:bg-gray-900 text-gray-400 dark:text-gray-500 border-gray-200 dark:border-gray-800'
                        }`}
                      >
                        {badge}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs  text-gray-700 dark:text-gray-300 mb-1">SHORT DESCRIPTION</label>
                  <textarea value={formData.shortDescription} onChange={e => setFormData({...formData, shortDescription: e.target.value})} className="w-full border border-gray-300 dark:border-gray-700 rounded px-3 py-2 text-sm focus:border-black dark:focus:border-white outline-none h-20" placeholder="Brief catchphrase for listing cards..." />
                </div>

                <div>
                  <label className="block text-xs  text-gray-700 dark:text-gray-300 mb-1">FULL DESCRIPTION</label>
                  <textarea value={formData.fullDescription} onChange={e => setFormData({...formData, fullDescription: e.target.value})} className="w-full border border-gray-300 dark:border-gray-700 rounded px-3 py-2 text-sm focus:border-black dark:focus:border-white outline-none h-32" placeholder="Detailed product information, origin, brewing guide..." />
                </div>
              </div>
            )}

            {activeTab === 'pricing' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs  text-gray-700 dark:text-gray-300 mb-1">BASE PRICE ({formData.currency})</label>
                    <input required type="number" step="0.01" value={formData.price} onChange={e => setFormData({...formData, price: Number(e.target.value)})} className="w-full border border-gray-300 dark:border-gray-700 rounded px-3 py-2 text-sm  focus:border-black dark:focus:border-white outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs  text-gray-700 dark:text-gray-300 mb-1">COMPARE-AT PRICE</label>
                    <input type="number" step="0.01" value={formData.compareAtPrice} onChange={e => setFormData({...formData, compareAtPrice: Number(e.target.value)})} className="w-full border border-gray-300 dark:border-gray-700 rounded px-3 py-2 text-sm focus:border-black dark:focus:border-white outline-none text-red-500" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs  text-gray-700 dark:text-gray-300 mb-1">COST PER ITEM (INTERNAL ONLY)</label>
                  <input type="number" step="0.01" value={formData.cost} onChange={e => setFormData({...formData, cost: Number(e.target.value)})} className="w-full border border-gray-300 dark:border-gray-700 rounded px-3 py-2 text-sm focus:border-black dark:focus:border-white outline-none bg-gray-50 dark:bg-gray-800" />
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">Only visible to authorized admin roles. Used for margin reports.</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs  text-gray-700 dark:text-gray-300 mb-1">EFFECTIVE START</label>
                    <input type="datetime-local" value={formData.effectiveDateStart} onChange={e => setFormData({...formData, effectiveDateStart: e.target.value})} className="w-full border border-gray-300 dark:border-gray-700 rounded px-3 py-2 text-sm focus:border-black dark:focus:border-white outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs  text-gray-700 dark:text-gray-300 mb-1">EFFECTIVE END</label>
                    <input type="datetime-local" value={formData.effectiveDateEnd} onChange={e => setFormData({...formData, effectiveDateEnd: e.target.value})} className="w-full border border-gray-300 dark:border-gray-700 rounded px-3 py-2 text-sm focus:border-black dark:focus:border-white outline-none" />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'inventory' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs  text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1">
                      <Barcode size={12} /> SKU (INTERNAL ID)
                    </label>
                    <input type="text" value={formData.sku} onChange={e => setFormData({...formData, sku: e.target.value})} className="w-full border border-gray-300 dark:border-gray-700 rounded px-3 py-2 text-sm font-mono focus:border-black dark:focus:border-white outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs  text-gray-700 dark:text-gray-300 mb-1">BARCODE (EAN/UPC)</label>
                    <div className="flex gap-2">
                      <input type="text" value={formData.barcode} onChange={e => setFormData({...formData, barcode: e.target.value})} className="flex-1 border border-gray-300 dark:border-gray-700 rounded px-3 py-2 text-sm font-mono focus:border-black dark:focus:border-white outline-none" />
                      <button 
                        type="button" 
                        onClick={() => setFormData({...formData, barcode: Math.floor(Math.random() * 10000000000000).toString().padStart(13, '0')})}
                        className="px-2 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
                        title="Generate Barcode"
                      >
                        <Barcode size={16} />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs  text-gray-700 dark:text-gray-300 mb-1 uppercase tracking-widest">Unit / Display Qty</label>
                    <input type="text" value={formData.unitDisplay} onChange={e => setFormData({...formData, unitDisplay: e.target.value})} className="w-full border border-gray-300 dark:border-gray-700 rounded px-3 py-2 text-sm focus:border-black dark:focus:border-white outline-none" placeholder="e.g. 500g, 1 Box, 6-Pack" />
                  </div>
                  <div>
                    <label className="block text-xs  text-gray-700 dark:text-gray-300 mb-1 uppercase tracking-widest">Volumetric Weight</label>
                    <input type="text" value={formData.volumetricText} onChange={e => setFormData({...formData, volumetricText: e.target.value})} className="w-full border border-gray-300 dark:border-gray-700 rounded px-3 py-2 text-sm focus:border-black dark:focus:border-white outline-none" placeholder="e.g. Approx 1.2kg" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs  text-gray-700 dark:text-gray-300 mb-1 uppercase">Stock Policy</label>
                    <select value={formData.stockPolicy} onChange={e => setFormData({...formData, stockPolicy: e.target.value})} className="w-full border border-gray-300 dark:border-gray-700 rounded px-3 py-2 text-sm focus:border-black dark:focus:border-white outline-none">
                      <option value="tracked">Tracked Inventory</option>
                      <option value="untracked">Untracked (Always available)</option>
                      <option value="allow_backorder">Allow Backorders</option>
                      <option value="stop_at_zero">Stop Selling at Zero</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs  text-gray-700 dark:text-gray-300 mb-1">CURRENT STOCK LEVEL</label>
                    <input type="number" value={formData.stockQuantity} onChange={e => setFormData({...formData, stockQuantity: Number(e.target.value)})} className="w-full border border-gray-300 dark:border-gray-700 rounded px-3 py-2 text-sm  focus:border-black dark:focus:border-white outline-none" />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs  text-gray-700 dark:text-gray-300 mb-1 uppercase">Min Qty</label>
                    <input type="number" value={formData.minOrderQuantity} onChange={e => setFormData({...formData, minOrderQuantity: Number(e.target.value)})} className="w-full border border-gray-300 dark:border-gray-700 rounded px-3 py-2 text-sm focus:border-black dark:focus:border-white outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs  text-gray-700 dark:text-gray-300 mb-1 uppercase">Max Qty</label>
                    <input type="number" value={formData.maxOrderQuantity} onChange={e => setFormData({...formData, maxOrderQuantity: Number(e.target.value)})} className="w-full border border-gray-300 dark:border-gray-700 rounded px-3 py-2 text-sm focus:border-black dark:focus:border-white outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs  text-gray-700 dark:text-gray-300 mb-1 uppercase">Increment</label>
                    <input type="number" value={formData.orderIncrement} onChange={e => setFormData({...formData, orderIncrement: Number(e.target.value)})} className="w-full border border-gray-300 dark:border-gray-700 rounded px-3 py-2 text-sm focus:border-black dark:focus:border-white outline-none" />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'media' && (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  {formData.media.map((item: Media, index: number) => (
                    <div key={item.id} className="relative group border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden aspect-square bg-gray-50 dark:bg-gray-800 shadow-sm">
                      <img src={item.url} alt={item.altText} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button type="button" className="p-2 bg-white dark:bg-gray-900 rounded-full text-gray-800 dark:text-gray-100 hover:text-red-500 shadow-lg"><Trash2 size={16} /></button>
                      </div>
                      <div className="absolute top-2 left-2 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded backdrop-blur-sm">#{index + 1}</div>
                    </div>
                  ))}
                  <div className="border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-lg aspect-square flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 hover:border-black dark:hover:border-white hover:text-black dark:hover:text-white transition-all cursor-pointer bg-gray-50 dark:bg-gray-800">
                    <input 
                      type="file" 
                      className="absolute inset-0 opacity-0 cursor-pointer" 
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = ev => handleAddMedia(ev.target?.result as string);
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                    <Plus size={32} />
                    <span className="text-[10px]  mt-2 uppercase tracking-widest">Add Media</span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'bundling' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <input type="checkbox" checked={formData.isBundle} onChange={e => setFormData({...formData, isBundle: e.target.checked})} className="w-4 h-4 accent-black" />
                  <span className="text-sm  uppercase">This is a bundled product</span>
                </div>

                {formData.isBundle && (
                  <div className="space-y-3">
                    {formData.bundleItems.map((item: BundleItem, idx: number) => {
                      const p = allProducts.find(x => x.id === item.productId);
                      return (
                        <div key={idx} className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-800 rounded-md">
                          <img src={p?.media?.[0]?.url || 'https://placehold.co/100x100'} className="w-12 h-12 object-cover rounded border border-gray-200 dark:border-gray-800" />
                          <div className="flex-1">
                            <div className="text-sm  text-gray-900 dark:text-gray-100">{p?.name || 'Unknown Product'}</div>
                            <div className="text-[10px] text-gray-500 dark:text-gray-400">#{item.productId}</div>
                          </div>
                          <div className="w-20">
                            <label className="text-[9px]  text-gray-400 dark:text-gray-500 uppercase">Qty</label>
                            <input type="number" value={item.quantity} className="w-full border border-gray-300 dark:border-gray-700 rounded px-2 py-1 text-xs" />
                          </div>
                          <div className="w-24">
                            <label className="text-[9px]  text-gray-400 dark:text-gray-500 uppercase">Bundle Price</label>
                            <input type="number" value={item.specialPrice} className="w-full border border-gray-300 dark:border-gray-700 rounded px-2 py-1 text-xs " />
                          </div>
                          <button type="button" className="text-gray-400 dark:text-gray-500 hover:text-red-500"><Trash2 size={16} /></button>
                        </div>
                      );
                    })}
                    <button type="button" className="w-full py-3 border-2 border-dotted border-gray-300 dark:border-gray-700 rounded-md text-xs  text-gray-400 dark:text-gray-500 hover:border-black dark:hover:border-white hover:text-black dark:hover:text-white transition-all uppercase tracking-widest">+ Add Secondary Product to Bundle</button>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'seo' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs  text-gray-700 dark:text-gray-300 mb-1">SEO TITLE</label>
                  <input type="text" value={formData.seo.title} onChange={e => setFormData({...formData, seo: {...formData.seo, title: e.target.value}})} className="w-full border border-gray-300 dark:border-gray-700 rounded px-3 py-2 text-sm focus:border-black dark:focus:border-white outline-none" />
                </div>
                <div>
                  <label className="block text-xs  text-gray-700 dark:text-gray-300 mb-1">META DESCRIPTION</label>
                  <textarea value={formData.seo.description} onChange={e => setFormData({...formData, seo: {...formData.seo, description: e.target.value}})} className="w-full border border-gray-300 dark:border-gray-700 rounded px-3 py-2 text-sm focus:border-black dark:focus:border-white outline-none h-24" />
                </div>
              </div>
            )}
          </form>
        </div>
      </div>

      <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 flex justify-between items-center rounded-b-lg">
        <div className="text-[10px] text-gray-400 dark:text-gray-500  uppercase tracking-widest">
          Last Updated: {formData.updatedAt ? new Date(formData.updatedAt).toLocaleString() : 'Never'}
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={onClose} className="px-6 py-2 border border-gray-300 dark:border-gray-700 rounded  text-xs uppercase tracking-widest hover:bg-gray-100 dark:bg-gray-800 transition-colors shadow-sm">Cancel</button>
          <button form="productForm" type="submit" className="px-6 py-2 bg-black text-white rounded  text-xs uppercase tracking-widest hover:bg-gray-800 transition-all shadow-md shadow-black/20">Save Product Record</button>
        </div>
      </div>
    </div>
  );
}
