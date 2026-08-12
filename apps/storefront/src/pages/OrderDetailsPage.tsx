import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, MapPin, Receipt, Camera } from 'lucide-react';

export function OrderDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<any>(null);

  useEffect(() => {
    fetch(`/v1/orders/${id}`)
      .then(r => r.json())
      .then(d => {
        if (d.data) {
          setOrder({
            ...d.data,
            items: (d.data.items || []).map((i: any) => ({ ...i, qty: i.qty || i.quantity || 1 })),
            subtotal: d.data.total - (d.data.delivery?.fee || 0),
            deliveryFee: d.data.delivery?.fee || 0,
          });
        }
      });
  }, [id]);

  if (!order) return <div className="p-4 text-center mt-10">Loading...</div>;

  const isAnalyzing = order.receipt && !order.receipt.analysis?.referenceNumber && !order.receipt.analysis?.error;
  const isVerified = order.payment?.status === 'PAID';

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="fixed top-0 left-0 right-0 h-[55px] bg-white border-b border-gray-200 z-50 flex items-center px-4 pt-[env(safe-area-inset-top,0px)]">
        <button onClick={() => navigate('/orders')} className="p-2 -ml-2 text-gray-700">
          <ChevronLeft size={24} />
        </button>
        <div className=" text-lg flex-1 text-center mr-6 uppercase tracking-tighter">
          ORDER {order.id}
        </div>
      </div>

      <div className="pt-[calc(55px+env(safe-area-inset-top,0px))] pb-[100px] max-w-2xl mx-auto p-3 space-y-3">
        
        {/* Status Tracker */}
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">Tracking Manifest</h3>
          <div className="relative border-l-2 border-gray-100 ml-3 space-y-8">
            <div className="relative pl-6">
              <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-black border-4 border-white shadow-sm"></div>
              <div className="text-[13px] leading-none uppercase tracking-tighter">Order Synchronized</div>
              <div className="text-[10px] text-gray-400 mt-1">{new Date(order.date).toLocaleString()}</div>
            </div>

            {order.payment?.method !== 'COD' && (
              <div className="relative pl-6">
                <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-4 border-white shadow-sm transition-all ${order.receipt ? (isVerified ? 'bg-green-500' : 'bg-blue-500 animate-pulse') : 'bg-gray-100'}`}></div>
                <div className={`text-[13px] leading-none uppercase tracking-tighter ${order.receipt ? (isVerified ? 'text-green-600' : 'text-blue-600') : 'text-gray-400'}`}>
                  {isVerified ? 'Payment Verified' : (order.receipt ? 'AI Receipt Audit' : 'Awaiting Payment')}
                </div>
                <div className="text-[10px] text-gray-400 mt-1">
                  {isVerified ? `Verified by AI Engine` : (order.receipt ? 'Gemini is analyzing your receipt...' : 'Please upload your proof of payment')}
                </div>
              </div>
            )}

            <div className="relative pl-6">
              <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-4 border-white shadow-sm ${order.status === 'SHIPPED' || order.status === 'DELIVERED' ? 'bg-black' : 'bg-gray-100'}`}></div>
              <div className={`text-[13px] leading-none uppercase tracking-tighter ${order.status === 'SHIPPED' || order.status === 'DELIVERED' ? 'text-black' : 'text-gray-400'}`}>Logistics Dispatch</div>
            </div>

            <div className="relative pl-6">
              <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-4 border-white shadow-sm ${order.status === 'DELIVERED' ? 'bg-black' : 'bg-gray-100'}`}></div>
              <div className={`text-[13px] leading-none uppercase tracking-tighter ${order.status === 'DELIVERED' ? 'text-black' : 'text-gray-400'}`}>Final Fulfillment</div>
            </div>
          </div>
        </div>

        {/* Action Required: Proof of Payment */}
        {order.needsProof && (
          <div className="bg-yellow-50 p-4 rounded-md border border-yellow-200 shadow-sm">
            <h3 className=" text-sm text-yellow-800 mb-2 flex items-center gap-2">
              <Receipt size={16} /> PAYMENT PROOF REQUIRED
            </h3>
            <p className="text-[12px] text-yellow-700 mb-3">
              Please upload your transfer screenshot for <strong>{order.paymentMethod}</strong> to confirm your order.
            </p>
            <button className="w-full bg-white border border-yellow-400 text-yellow-800  py-2 rounded flex items-center justify-center gap-2 text-sm hover:bg-yellow-100">
              <Camera size={16} /> UPLOAD SCREENSHOT
            </button>
          </div>
        )}

        {/* Delivery Details */}
        <div className="bg-white p-3 rounded-md border border-gray-200 shadow-sm">
          <h3 className=" text-sm mb-2 flex items-center gap-2"><MapPin size={16} /> DELIVERY</h3>
          <div className="text-[13px] text-gray-700 leading-tight">
            {order.address}
          </div>
        </div>

        {/* Items Details */}
        <div className="bg-white p-3 rounded-md border border-gray-200 shadow-sm">
          <h3 className=" text-sm mb-3">ITEMS</h3>
          <div className="space-y-3">
            {order.items.map(item => (
              <div key={item.id} className="flex gap-3">
                <img src={item.image} alt={item.name} className="w-12 h-12 rounded bg-gray-100 object-cover" />
                <div className="flex-1">
                  <div className="text-[12px] ">{item.name}</div>
                  <div className="text-[11px] text-gray-500">Qty: {item.qty}</div>
                </div>
                <div className="text-[12px] ">
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
            <div className="flex justify-between  pt-1">
              <span>Total Paid</span>
              <span>₱{order.total.toLocaleString()}</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
