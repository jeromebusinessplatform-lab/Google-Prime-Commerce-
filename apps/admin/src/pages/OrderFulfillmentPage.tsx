import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, PackageCheck, Truck, CheckCircle2, Receipt, AlertCircle } from 'lucide-react';

export function OrderFulfillmentPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<any>(null);

  useEffect(() => {
    fetch('/v1/orders')
      .then(r => r.json())
      .then(d => {
        const found = d.data?.find((o: any) => o.id === id);
        if (found) {
          // Normalize to UI structure
          setOrder({
            id: found.id,
            status: found.status || 'PENDING',
            date: found.date,
            customer: {
              name: found.customerName || 'Walk-in',
              phone: found.customerPhone || 'N/A',
              address: found.address || 'In-store'
            },
            items: (found.items || []).map((i: any) => ({ ...i, qty: i.quantity || 1 })),
            payment: { method: 'Cash', status: 'VERIFIED', proofUrl: null },
            total: found.total || 0
          });
        }
      });
  }, [id]);

  const updateStatus = async (newStatus: string) => {
    try {
      await fetch(`/v1/orders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      setOrder((prev: any) => ({ ...prev, status: newStatus }));
    } catch (e) {
      console.error("Failed to update status", e);
    }
  };

  const approvePayment = async () => {
    try {
      await fetch(`/v1/orders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'PROCESSING', payment: { ...order.payment, status: 'VERIFIED' } })
      });
      setOrder((prev: any) => ({ 
        ...prev, 
        status: 'PROCESSING',
        payment: { ...prev.payment, status: 'VERIFIED' } 
      }));
    } catch (e) {
      console.error("Failed to approve payment", e);
    }
  };

  if (!order) return <div className="p-4 text-center mt-10">Loading...</div>;

  return (
    <div className="bg-gray-50 flex-1 flex flex-col">
      <div className="bg-white border-b border-gray-200 p-4 sticky top-0 z-20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/orders')} className="text-gray-500 hover:text-black">
            <ChevronLeft size={24} />
          </button>
          <div>
            <h2 className="text-lg font-bold">Order {order.id}</h2>
            <div className="text-xs text-gray-500">{new Date(order.date).toLocaleString()}</div>
          </div>
        </div>
        <div>
          <span className={`inline-flex items-center px-3 py-1 rounded text-xs font-bold uppercase ${
            order.status === 'QUEUED' ? 'bg-yellow-100 text-yellow-800' :
            order.status === 'PROCESSING' ? 'bg-blue-100 text-blue-800' :
            order.status === 'DISPATCHED' ? 'bg-purple-100 text-purple-800' :
            'bg-green-100 text-green-800'
          }`}>
            {order.status}
          </span>
        </div>
      </div>

      <div className="p-4 max-w-6xl mx-auto w-full grid grid-cols-1 md:grid-cols-3 gap-4 pb-[100px]">
        <div className="md:col-span-2 space-y-4">
          
          {/* Action Bar */}
          <div className="bg-white p-4 rounded-md border border-gray-200 shadow-sm flex gap-2">
            <button 
              disabled={order.status !== 'QUEUED'}
              onClick={() => updateStatus('PROCESSING')}
              className="flex-1 py-2 px-3 bg-blue-50 text-blue-700 font-bold text-sm rounded border border-blue-200 hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <PackageCheck size={18} /> PREPARE ORDER
            </button>
            <button 
              disabled={order.status !== 'PROCESSING'}
              onClick={() => updateStatus('DISPATCHED')}
              className="flex-1 py-2 px-3 bg-purple-50 text-purple-700 font-bold text-sm rounded border border-purple-200 hover:bg-purple-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Truck size={18} /> DISPATCH
            </button>
            <button 
              disabled={order.status !== 'DISPATCHED'}
              onClick={() => updateStatus('DELIVERED')}
              className="flex-1 py-2 px-3 bg-green-50 text-green-700 font-bold text-sm rounded border border-green-200 hover:bg-green-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <CheckCircle2 size={18} /> DELIVERED
            </button>
          </div>

          <div className="bg-white p-4 rounded-md border border-gray-200 shadow-sm">
            <h3 className="font-bold text-sm mb-3">ORDER ITEMS</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-200 text-xs text-gray-500 uppercase">
                    <th className="pb-2">Item</th>
                    <th className="pb-2">Qty</th>
                    <th className="pb-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map(item => (
                    <tr key={item.id} className="border-b border-gray-100 last:border-0">
                      <td className="py-2 text-sm font-semibold">{item.name}</td>
                      <td className="py-2 text-sm">{item.qty}</td>
                      <td className="py-2 text-sm text-right font-bold">₱{(item.price * item.qty).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white p-4 rounded-md border border-gray-200 shadow-sm">
            <h3 className="font-bold text-sm mb-3 flex items-center gap-2"><Receipt size={16} /> PAYMENT PROOF</h3>
            {order.payment.status === 'VERIFICATION_PENDING' ? (
              <div className="bg-yellow-50 p-3 rounded mb-3 border border-yellow-200">
                <div className="flex gap-2 text-yellow-800 text-sm font-bold mb-2">
                  <AlertCircle size={18} /> NEEDS VERIFICATION
                </div>
                <img src={order.payment.proofUrl} alt="Proof" className="w-full h-auto rounded border border-gray-200 mb-2 cursor-pointer hover:opacity-90" />
                <button 
                  onClick={approvePayment}
                  className="w-full bg-green-600 text-white font-bold py-2 rounded hover:bg-green-700"
                >
                  APPROVE PAYMENT
                </button>
              </div>
            ) : (
              <div className="bg-green-50 p-3 rounded mb-3 border border-green-200 text-green-800 text-sm font-bold flex items-center gap-2">
                <CheckCircle2 size={18} /> PAYMENT VERIFIED
              </div>
            )}
            <div className="text-sm">
              <span className="text-gray-500">Method:</span> <span className="font-semibold">{order.payment.method}</span>
            </div>
            <div className="text-sm mt-1">
              <span className="text-gray-500">Amount:</span> <span className="font-bold text-lg">₱{order.total.toLocaleString()}</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-md border border-gray-200 shadow-sm">
            <h3 className="font-bold text-sm mb-3 text-gray-500">CUSTOMER DETAILS</h3>
            <div className="text-sm font-bold">{order.customer.name}</div>
            <div className="text-sm text-gray-600 mt-1">{order.customer.phone}</div>
            <div className="text-sm text-gray-600 mt-2 p-2 bg-gray-50 rounded border border-gray-100">
              {order.customer.address}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
