import React, { useEffect, useState, useRef } from 'react';
import { Product } from '../../../../packages/domain/catalog';
import { CheckCircle2, Search } from 'lucide-react';

export function ShopPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsLoading(true);
    fetch('/v1/catalog')
      .then(r => r.json())
      .then(d => {
        setProducts(d.data || []);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
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

  const handleAddToCart = async (product: Product) => {
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
    <div className="p-2 w-full mx-auto pb-20">
      {toast && (
        <div className="fixed top-[100px] left-1/2 -translate-x-1/2 bg-black text-white px-4 py-2 rounded-full text-xs uppercase tracking-widest shadow-lg z-50 flex items-center gap-2">
          <CheckCircle2 size={14} />
          {toast}
        </div>
      )}
      <div className="sticky top-[env(safe-area-inset-top,0px)] bg-white dark:bg-gray-950 z-30 pb-2 pt-2 border-b border-gray-100 dark:border-gray-800 flex flex-col gap-2 transition-colors">
        <div className="flex gap-2 relative" ref={searchRef}>
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2 text-gray-400" size={14} />
            <input
              type="text"
              value={search}
              onFocus={() => setShowAutocomplete(true)}
              onChange={(e) => {
                setSearch(e.target.value);
                setShowAutocomplete(true);
              }}
              placeholder="SEARCH PRODUCTS..."
              className="w-full bg-gray-100 dark:bg-gray-800 border-none rounded-xl pl-8 pr-3 py-2 text-xs outline-none focus:ring-1 focus:ring-black dark:focus:ring-white transition-colors uppercase tracking-widest"
            />
          </div>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-1.5 text-[10px] font-bold rounded-full whitespace-nowrap transition-colors uppercase tracking-widest ${
                selectedCategory === cat ? 'bg-black dark:bg-white text-white dark:text-black' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mt-3">
        {isLoading ? (
          Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="flex flex-col border border-gray-100 dark:border-gray-900 rounded-xl overflow-hidden bg-white dark:bg-gray-950 animate-pulse">
              <div className="w-full aspect-square bg-gray-100 dark:bg-gray-900" />
              <div className="p-2 space-y-1">
                <div className="h-3 bg-gray-100 dark:bg-gray-900 rounded w-full" />
                <div className="h-3 bg-gray-100 dark:bg-gray-900 rounded w-1/2" />
              </div>
            </div>
          ))
        ) : filteredProducts.map((p) => (
<<<<<<< HEAD
          <div key={p.id} className="prime-card flex flex-col overflow-hidden bg-white dark:bg-gray-900 cursor-pointer relative shadow-sm group transition-colors">
            <div className="w-full aspect-[4/5] bg-gray-100 dark:bg-gray-800 relative overflow-hidden">
              <img src={p.media?.[0]?.url || p.image || 'https://placehold.co/400x500'} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              {p.availability !== "in_stock" && (
                <div className={`prime-badge absolute top-1 left-1 ${p.availability === "out_of_stock" ? 'badge-sale' : 'badge-low-stock'}`}>
                  {p.availability === "out_of_stock" ? "OUT OF STOCK" : "LOW STOCK"}
                </div>
              )}
            </div>
            <div className="p-3 flex flex-col flex-1">
              <div className="text-sm font-semibold leading-tight line-clamp-1 text-gray-900 dark:text-gray-100 uppercase tracking-tight">{p.name}</div>
              {p.subname && <div className="text-xs text-prime-gray-500 dark:text-gray-400 uppercase line-clamp-1">{p.subname}</div>}
              
              <div className="mt-auto pt-3 flex items-center justify-between">
                <div className="flex flex-col">
                  <div className="text-lg font-bold">₱{p.price.toLocaleString()}</div>
                  <div className={`text-[10px] font-semibold uppercase tracking-wider ${p.stockQuantity <= 5 ? 'text-prime-red' : 'text-prime-gray-500'}`}>
                    STOCKS: {p.stockQuantity || 0}
                  </div>
                </div>
                <button 
                  className="w-10 h-10 bg-prime-gray-100 dark:bg-gray-800 flex items-center justify-center rounded-lg text-lg font-bold text-gray-600 dark:text-gray-300 hover:bg-prime-text hover:text-white dark:hover:bg-white dark:hover:text-prime-text transition-colors"
=======
          <div key={p.id} className="flex flex-col border border-gray-100 dark:border-gray-800 rounded-xl overflow-hidden bg-white dark:bg-gray-900 shadow-sm transition-colors">
            <div className="w-full aspect-square bg-gray-100 dark:bg-gray-800 relative overflow-hidden">
              <img src={p.media?.[0]?.url || p.image || 'https://placehold.co/400x400'} alt={p.name} className="w-full h-full object-cover" />
            </div>
            <div className="p-2 flex flex-col flex-1">
              <div className="text-[10px] font-bold leading-tight line-clamp-1 text-gray-900 dark:text-gray-100 uppercase tracking-widest">{p.name}</div>
              <div className="mt-1 flex items-center justify-between pt-1">
                <div className="text-[11px] font-black tracking-widest">₱{p.price.toLocaleString()}</div>
                <button
                  className="w-7 h-7 bg-black text-white flex items-center justify-center rounded-lg text-lg hover:bg-gray-800 transition-colors"
>>>>>>> origin/gemini/phase-5-verification
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
