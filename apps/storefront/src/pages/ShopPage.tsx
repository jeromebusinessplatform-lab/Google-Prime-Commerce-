import React, { useEffect, useState, useRef } from 'react';
import { CheckCircle2, Search } from 'lucide-react';

export function ShopPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/v1/catalog')
      .then(r => r.json())
      .then(d => setProducts(d.data || []));
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowAutocomplete(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const categories = ['All', ...Array.from(new Set(products.map(p => p.category).filter(Boolean)))];

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleAddToCart = async (product: any) => {
    try {
      // First get current cart
      const cartRes = await fetch('/v1/cart');
      const cartData = await cartRes.json();
      const items = cartData.data?.items || [];
      const existing = items.find((i: any) => i.id === product.id);
      const newQuantity = (existing?.quantity || 0) + 1;
      
      await fetch(`/v1/cart/items/${product.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product, quantity: newQuantity })
      });
      setToast(`Added ${product.name} to cart!`);
      setTimeout(() => setToast(null), 2500);
      
      // Dispatch custom event to trigger badge update
      window.dispatchEvent(new CustomEvent('cart-updated'));
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="p-2 md:p-3 max-w-7xl mx-auto">
      {toast && (
        <div className="fixed top-[100px] left-1/2 -translate-x-1/2 bg-black text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg z-50 flex items-center gap-2 animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 size={16} />
          {toast}
        </div>
      )}
      <div className="sticky top-[calc(90px+env(safe-area-inset-top,0px))] bg-white z-30 pb-2 pt-2 border-b border-gray-100 flex flex-col gap-2">
        <div className="flex gap-2 relative" ref={searchRef}>
          <div className="relative flex-1">
            <Search className="absolute left-2 top-1.5 text-gray-400" size={16} />
            <input 
              type="text" 
              value={search} 
              onFocus={() => setShowAutocomplete(true)}
              onChange={(e) => {
                setSearch(e.target.value);
                setShowAutocomplete(true);
              }} 
              placeholder="Search products..." 
              className="w-full bg-gray-100 border-none rounded-md pl-8 pr-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-black" 
            />
            {showAutocomplete && search.length > 0 && filteredProducts.length > 0 && (
              <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 mt-1 rounded-md shadow-lg z-50 max-h-64 overflow-y-auto">
                {filteredProducts.slice(0, 5).map(p => (
                  <div 
                    key={p.id}
                    onClick={() => {
                      setSearch(p.name);
                      setShowAutocomplete(false);
                    }}
                    className="flex items-center gap-3 p-2 border-b border-gray-100 last:border-0 hover:bg-gray-50 cursor-pointer"
                  >
                    <img src={p.image} alt={p.name} className="w-10 h-10 object-cover rounded bg-gray-100" />
                    <div className="flex-1">
                      <div className="text-sm font-bold text-gray-900 line-clamp-1">{p.name}</div>
                      <div className="text-xs text-gray-500">₱{p.price.toLocaleString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 text-xs font-semibold rounded-full whitespace-nowrap transition-colors ${
                selectedCategory === cat ? 'bg-black text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 mt-3">
        {filteredProducts.map((p) => (
          <div key={p.id} className="flex flex-col border border-gray-200 rounded-md overflow-hidden bg-white cursor-pointer relative shadow-sm group">
            <div className="w-full aspect-[4/5] bg-gray-100 relative overflow-hidden">
              <img src={p.image} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              {p.availability !== "in_stock" && (
                <div className="absolute top-1 left-1 bg-gray-800 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                  {p.availability === "out_of_stock" ? "OUT OF STOCK" : "LOW STOCK"}
                </div>
              )}
            </div>
            <div className="p-1.5 flex flex-col flex-1">
              <div className="text-[11px] font-semibold leading-tight line-clamp-2 text-gray-900">{p.name}</div>
              <div className="mt-auto pt-1 flex items-end justify-between">
                <div>
                  <div className="text-[12px] font-bold">₱{p.price.toLocaleString()}</div>
                  {p.compareAtPrice && <div className="text-[10px] text-gray-400 line-through">₱{p.compareAtPrice.toLocaleString()}</div>}
                </div>
                <button 
                  className="w-6 h-6 bg-gray-100 flex items-center justify-center rounded text-lg font-bold text-gray-600 hover:bg-black hover:text-white transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddToCart(p);
                  }}
                >
                  +
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
