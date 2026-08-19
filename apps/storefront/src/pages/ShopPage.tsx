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
    <div className="p-4 w-full mx-auto pb-24 bg-white dark:bg-gray-950 transition-colors">
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 bg-prime-text text-white px-6 py-3 rounded-full text-xs font-bold uppercase tracking-widest shadow-xl z-50 flex items-center gap-2">
          <CheckCircle2 size={16} />
          {toast}
        </div>
      )}
      
      <div className="sticky top-0 bg-white dark:bg-gray-950 z-30 pt-2 pb-4 border-b border-prime-gray-200">
        <div className="relative mb-3">
          <Search className="absolute left-3 top-2.5 text-prime-gray-500" size={18} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="SEARCH PRODUCTS..."
            className="w-full bg-prime-gray-100 dark:bg-gray-900 border-none rounded-lg pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-prime-text transition-colors uppercase font-bold tracking-wider"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-5 py-2 text-[11px] font-bold rounded-lg whitespace-nowrap transition-all uppercase tracking-wider ${
                selectedCategory === cat ? 'bg-prime-text text-white' : 'bg-prime-gray-100 dark:bg-gray-800 text-prime-gray-500 hover:bg-prime-gray-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mt-4">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="prime-card h-64 animate-pulse" />
          ))
        ) : filteredProducts.map((p) => (
          <div key={p.id} className="prime-card flex flex-col bg-white dark:bg-gray-900 border-prime-gray-200 group transition-all hover:shadow-md">
            <div className="w-full aspect-square bg-prime-gray-100 dark:bg-gray-800 rounded-lg relative overflow-hidden mb-3">
              <img src={p.media?.[0]?.url || p.image || 'https://placehold.co/400x500'} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              {p.availability !== "in_stock" && (
                <div className={`prime-badge absolute top-2 left-2 ${p.availability === "out_of_stock" ? 'badge-sale' : 'badge-low-stock'}`}>
                  {p.availability === "out_of_stock" ? "OUT" : "LOW"}
                </div>
              )}
            </div>
            <div className="flex flex-col flex-1">
              <h3 className="text-sm font-bold text-prime-text dark:text-gray-100 uppercase leading-tight">{p.name}</h3>
              <p className="text-xs text-prime-gray-500 uppercase mt-0.5">{p.subname || 'Standard'}</p>
              <div className="mt-auto pt-3 flex items-end justify-between">
                <span className="text-lg font-bold">₱{p.price.toLocaleString()}</span>
                <button 
                  className="w-9 h-9 bg-prime-text text-white rounded-lg font-bold hover:bg-gray-800 transition-colors"
                  onClick={() => handleAddToCart(p)}
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
