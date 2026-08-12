import React, { useEffect, useState } from 'react';

export function POSPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [cart, setCart] = useState<any[]>([]);

  useEffect(() => {
    fetch('/v1/catalog')
      .then(r => r.json())
      .then(d => setProducts(d.data || []));
  }, []);

  const addToCart = (product: any) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === product.id);
      if (existing) {
        return prev.map(i => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const clearCart = () => setCart([]);

  const total = cart.reduce((acc, i) => acc + (i.price * i.quantity), 0);

  const charge = async () => {
    if (cart.length === 0) return;
    try {
      await fetch('/v1/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart,
          receiverName: "Walk-in Customer",
          receiverPhone: "",
          address: "In-Store",
          totals: { total }
        })
      });
      clearCart();
      alert('Order charged successfully!');
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="flex flex-1 overflow-hidden h-full min-h-[calc(100vh-108px)]">
      {/* Product Grid */}
      <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
        <h2 className="text-xl font-bold mb-4">Point of Sale</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {products.map(p => (
            <div key={p.id} onClick={() => addToCart(p)} className="bg-white p-3 rounded-md border border-gray-200 shadow-sm cursor-pointer hover:border-black text-center flex flex-col items-center transition-colors">
              <img src={p.image} alt={p.name} className="w-16 h-16 rounded bg-gray-100 object-cover mb-2" />
              <div className="text-[11px] font-semibold leading-tight line-clamp-2">{p.name}</div>
              <div className="text-sm font-bold mt-1 text-gray-700">₱{p.price.toLocaleString()}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Cart Sidebar */}
      <div className="w-80 bg-white border-l border-gray-200 flex flex-col shadow-lg z-10 hidden md:flex">
        <div className="p-4 border-b border-gray-200 font-bold flex justify-between items-center bg-gray-50">
          <span>Current Order</span>
          <button onClick={clearCart} className="text-xs font-semibold text-red-600 hover:underline">CLEAR</button>
        </div>
        
        {cart.length === 0 ? (
          <div className="flex-1 overflow-y-auto p-4 flex flex-col items-center justify-center text-gray-400 text-sm">
            <div className="w-16 h-16 border-2 border-dashed border-gray-300 rounded-full flex items-center justify-center mb-2">
              +
            </div>
            Select items to add to cart
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {cart.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center text-sm">
                <div className="flex-1">
                  <div className="font-semibold text-gray-900 leading-tight">{item.name}</div>
                  <div className="text-xs text-gray-500">x{item.quantity}</div>
                </div>
                <div className="font-bold">₱{(item.price * item.quantity).toLocaleString()}</div>
              </div>
            ))}
          </div>
        )}

        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-between font-bold text-lg mb-4">
            <span>Total</span>
            <span>₱{total.toLocaleString()}</span>
          </div>
          <button onClick={charge} disabled={cart.length === 0} className="w-full bg-black text-white font-bold py-3.5 rounded-md hover:bg-gray-800 disabled:opacity-50 transition-colors">
            CHARGE
          </button>
        </div>
      </div>
    </div>
  );
}
