import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, MapPin, Receipt, Camera } from 'lucide-react';

export function OrderDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<any>(null);

  useEffect(() => {
    fetch('/v1/orders')
      .then(r => r.json())
      .then(d => {
        const found = d.data?.find((o: any) => o.id === id);
        if (found) {
          setOrder({
            id: found.id,
            status: found.status || 'PENDING',
            date: found.date,
            items: (found.items || []).map((i: any) => ({ ...i, qty: i.quantity || 1 })),
            address: found.address || 'In-store',
            paymentMethod: 'Cash / Local',
            subtotal: found.total || 0,
            deliveryFee: 0,
            total: found.total || 0,
            needsProof: false
          });
        }
      });
  }, [id]);

  if (!order) return <div className="p-4 text-center mt-10">Loading...</div>;

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="fixed top-0 left-0 right-0 h-[55px] bg-white border-b border-gray-200 z-50 flex items-center px-4 pt-[env(safe-area-inset-top,0px)]">
        <button onClick={() => navigate('/orders')} className="p-2 -ml-2 text-gray-700">
          <ChevronLeft size={24} />
        </button>
        <div className="font-bold text-lg flex-1 text-center mr-6">
          ORDER {order.id}
        </div>
      </div>

      <div className="pt-[calc(55px+env(safe-area-inset-top,0px))] pb-[100px] max-w-2xl mx-auto p-3 space-y-3">
        
        {/* Status Tracker */}
        <div className="bg-white p-4 rounded-md border border-gray-200 shadow-sm">
          <h3 className="font-bold text-sm mb-4">TRACKING</h3>
          <div className="relative border-l-2 border-gray-200 ml-3 space-y-6">
            <div className="relative pl-6">
              <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-black border-4 border-white"></div>
              <div className="text-[13px] font-bold text-gray-900 leading-none">Order Placed</div>
              <div className="text-[11px] text-gray-500 mt-1">{new Date(order.date).toLocaleString()}</div>
            </div>
            <div className="relative pl-6">
              <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-blue-500 border-4 border-white"></div>
              <div className="text-[13px] font-bold text-blue-600 leading-none">Processing</div>
              <div className="text-[11px] text-gray-500 mt-1">We are preparing your items.</div>
            </div>
            <div className="relative pl-6">
              <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-gray-200 border-4 border-white"></div>
              <div className="text-[13px] font-bold text-gray-400 leading-none">Dispatched</div>
            </div>
            <div className="relative pl-6">
              <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-gray-200 border-4 border-white"></div>
              <div className="text-[13px] font-bold text-gray-400 leading-none">Delivered</div>
            </div>
          </div>
        </div>

        {/* Action Required: Proof of Payment */}
        {order.needsProof && (
          <div className="bg-yellow-50 p-4 rounded-md border border-yellow-200 shadow-sm">
            <h3 className="font-bold text-sm text-yellow-800 mb-2 flex items-center gap-2">
              <Receipt size={16} /> PAYMENT PROOF REQUIRED
            </h3>
            <p className="text-[12px] text-yellow-700 mb-3">
              Please upload your transfer screenshot for <strong>{order.paymentMethod}</strong> to confirm your order.
            </p>
            <button className="w-full bg-white border border-yellow-400 text-yellow-800 font-bold py-2 rounded flex items-center justify-center gap-2 text-sm hover:bg-yellow-100">
              <Camera size={16} /> UPLOAD SCREENSHOT
            </button>
          </div>
        )}

        {/* Delivery Details */}
        <div className="bg-white p-3 rounded-md border border-gray-200 shadow-sm">
          <h3 className="font-bold text-sm mb-2 flex items-center gap-2"><MapPin size={16} /> DELIVERY</h3>
          <div className="text-[13px] text-gray-700 leading-tight">
            {order.address}
          </div>
        </div>

        {/* Items Details */}
        <div className="bg-white p-3 rounded-md border border-gray-200 shadow-sm">
          <h3 className="font-bold text-sm mb-3">ITEMS</h3>
          <div className="space-y-3">
            {order.items.map(item => (
              <div key={item.id} className="flex gap-3">
                <img src={item.image} alt={item.name} className="w-12 h-12 rounded bg-gray-100 object-cover" />
                <div className="flex-1">
                  <div className="text-[12px] font-semibold">{item.name}</div>
                  <div className="text-[11px] text-gray-500">Qty: {item.qty}</div>
                </div>
                <div className="text-[12px] font-bold">
                  ₱{(item.price * item.qty).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100 space-y-1 text-[13px]">
            <div className="flex justify-between">
              <span className="text-gray-500">Subtotal</span>
              <span>₱{order.subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Delivery Fee</span>
              <span>₱{order.deliveryFee.toLocaleString()}</span>
            </div>
            <div className="flex justify-between font-bold pt-1">
              <span>Total Paid</span>
              <span>₱{order.total.toLocaleString()}</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
