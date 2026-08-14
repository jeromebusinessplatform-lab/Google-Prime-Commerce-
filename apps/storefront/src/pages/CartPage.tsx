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
    <div className="p-2 md:p-3 max-w-3xl mx-auto flex flex-col h-[calc(100vh-55px-35px-44px-18px)]">
      <div className="flex justify-between items-center pb-2 border-b border-gray-200 dark:border-gray-800 transition-colors">
        <h2 className="text-base ">My Cart</h2>
        {cart.items.length > 0 && (
          <button 
            onClick={() => selectAll(!allSelected)}
            className="text-xs  text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white uppercase transition-colors"
          >
            {allSelected ? "CLEAR SELECTION" : "SELECT ALL"}
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto mt-2 space-y-3">
        {cart.items.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-gray-400 mt-10 transition-colors">Your cart is empty.</div>
        ) : (
          cart.items.map(item => (
            <div key={item.id} className="flex gap-3 bg-white dark:bg-gray-900 p-2 rounded-md shadow-sm border border-gray-100 dark:border-gray-800 transition-colors">
              <div className="flex items-center">
                <input 
                  type="checkbox" 
                  checked={item.selected} 
                  onChange={() => toggleSelection(item.id)}
                  className="w-5 h-5 accent-black cursor-pointer"
                />
              </div>
              <img src={item.image} alt={item.name} className="w-16 h-16 object-cover bg-gray-100 dark:bg-gray-800 rounded transition-colors" />
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <div className=" text-[12px] uppercase leading-tight text-gray-900 dark:text-gray-100 tracking-tighter transition-colors">{item.name}</div>
                  <div className="text-[9px]  text-gray-400 dark:text-gray-500 uppercase tracking-widest transition-colors">{item.subname || 'Standard Edition'}</div>
                  <div className="text-[14px]  mt-1 tracking-tight">₱{item.price.toLocaleString()}</div>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center border border-gray-300 dark:border-gray-700 rounded overflow-hidden h-7 transition-colors">
                    <button onClick={() => updateQuantity(item, item.quantity - 1)} className="px-2 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors">-</button>
                    <span className="px-2 text-[12px]  min-w-[24px] text-center">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item, item.quantity + 1)} className="px-2 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors">+</button>
                  </div>
                  <button onClick={() => updateQuantity(item, 0)} className="text-gray-400 dark:text-gray-500 hover:text-red-600 p-1 transition-colors">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="pt-3 border-t border-gray-200 dark:border-gray-800 mt-auto bg-white dark:bg-gray-950 sticky bottom-0 transition-colors">
        <div className="flex justify-between items-end mb-3">
          <div className="text-gray-600 dark:text-gray-300 text-[12px] uppercase transition-colors">
            Selected ({selectedCount})
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-500 dark:text-gray-400 transition-colors">Subtotal</div>
            <div className="text-base  leading-none">₱{selectedTotal.toLocaleString()}</div>
          </div>
        </div>
        <button 
          disabled={selectedCount === 0}
          onClick={() => navigate('/checkout')}
          className="w-full bg-black text-white  py-3 rounded-md hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          CHECKOUT {selectedCount > 0 ? `(${selectedCount})` : ''}
        </button>
      </div>
    </div>
  );
}
