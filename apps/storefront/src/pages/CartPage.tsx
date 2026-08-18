import React, { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function CartPage() {
  const navigate = useNavigate();
  const [cart, setCart] = useState<any>(null);
  
  const fetchCart = () => {
    fetch('/v1/cart')
      .then(r => r.json())
      .then(d => {
        const items = d.data?.items || [];
        // Add selected property locally if not present
        const processedItems = items.map((i: any) => ({ ...i, selected: i.selected !== undefined ? i.selected : true }));
        setCart({ items: processedItems });
      });
  };

  useEffect(() => {
    fetchCart();
  }, []);

  if (!cart) return <div className="p-4 text-center">Loading cart...</div>;

  const updateQuantity = async (product: any, newQuantity: number) => {
    try {
      await fetch(`/v1/cart/items/${product.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product, quantity: newQuantity })
      });
      fetchCart();
      window.dispatchEvent(new CustomEvent('cart-updated'));
    } catch (e) {
      console.error(e);
    }
  };

  const toggleSelection = (itemId: string) => {
    setCart(prev => ({
      ...prev,
      items: prev.items.map(item => item.id === itemId ? { ...item, selected: !item.selected } : item)
    }));
  };

  const selectAll = (selected: boolean) => {
    setCart(prev => ({
      ...prev,
      items: prev.items.map(item => ({ ...item, selected }))
    }));
  };

  const allSelected = cart.items.length > 0 && cart.items.every(i => i.selected);
  const selectedTotal = cart.items.filter(i => i.selected).reduce((acc, i) => acc + (i.price * i.quantity), 0);
  const selectedCount = cart.items.filter(i => i.selected).reduce((acc, i) => acc + i.quantity, 0);

  return (
    <div className="p-4 max-w-3xl mx-auto flex flex-col h-full bg-white dark:bg-gray-950 transition-colors">
      <div className="flex justify-between items-center pb-4 border-b border-prime-gray-200">
        <h2 className="text-lg font-bold uppercase tracking-wider">My Cart</h2>
        {cart.items.length > 0 && (
          <button 
            onClick={() => selectAll(!allSelected)}
            className="text-xs font-bold text-prime-gray-500 hover:text-prime-text uppercase tracking-wider transition-colors"
          >
            {allSelected ? "CLEAR SELECTION" : "SELECT ALL"}
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto mt-4 space-y-4">
        {cart.items.length === 0 ? (
          <div className="text-center text-prime-gray-500 mt-10">Your cart is empty.</div>
        ) : (
          cart.items.map(item => (
            <div key={item.id} className="prime-card flex gap-4 bg-white dark:bg-gray-900 shadow-sm border border-prime-gray-200 transition-colors">
              <div className="flex items-center">
                <input 
                  type="checkbox" 
                  checked={item.selected} 
                  onChange={() => toggleSelection(item.id)}
                  className="w-5 h-5 accent-prime-text cursor-pointer"
                />
              </div>
              <img src={item.image} alt={item.name} className="w-20 h-20 object-cover bg-prime-gray-100 dark:bg-gray-800 rounded-lg" />
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <div className="text-sm font-bold uppercase text-prime-text dark:text-gray-100">{item.name}</div>
                  <div className="text-xs text-prime-gray-500 uppercase">{item.subname || 'Standard Edition'}</div>
                  <div className="text-base font-bold mt-1">₱{item.price.toLocaleString()}</div>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center border border-prime-gray-200 rounded-lg overflow-hidden h-9">
                    <button onClick={() => updateQuantity(item, item.quantity - 1)} className="px-3 bg-prime-gray-100 hover:bg-prime-gray-200 text-prime-gray-500">-</button>
                    <span className="px-3 text-sm font-bold min-w-[32px] text-center">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item, item.quantity + 1)} className="px-3 bg-prime-gray-100 hover:bg-prime-gray-200 text-prime-gray-500">+</button>
                  </div>
                  <button onClick={() => updateQuantity(item, 0)} className="text-prime-gray-500 hover:text-prime-red p-1">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="pt-4 border-t border-prime-gray-200 mt-4 bg-white dark:bg-gray-950 sticky bottom-0">
        <div className="flex justify-between items-end mb-4">
          <div className="text-prime-gray-500 text-xs font-bold uppercase">
            Selected ({selectedCount})
          </div>
          <div className="text-right">
            <div className="text-xs text-prime-gray-500">Subtotal</div>
            <div className="text-xl font-bold leading-none">₱{selectedTotal.toLocaleString()}</div>
          </div>
        </div>
        <button 
          disabled={selectedCount === 0}
          onClick={() => navigate('/checkout')}
          className="w-full bg-prime-text text-white font-bold py-4 rounded-lg hover:bg-gray-800 disabled:bg-prime-gray-200"
        >
          CHECKOUT {selectedCount > 0 ? `(${selectedCount})` : ''}
        </button>
      </div>
    </div>
  );
}
