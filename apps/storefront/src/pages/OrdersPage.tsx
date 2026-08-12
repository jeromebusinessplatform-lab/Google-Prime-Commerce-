import React, { useState, useEffect } from 'react';
import { Package, ChevronRight, Clock, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function OrdersPage() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    fetch('/v1/orders')
      .then(r => r.json())
      .then(d => setOrders(d.data || []));
  }, []);

  return (
    <div className="p-2 md:p-3 max-w-3xl mx-auto flex flex-col min-h-[calc(100vh-55px-35px-44px-18px)]">
      <div className="flex justify-between items-center pb-2 border-b border-gray-200 mb-3">
        <h2 className="text-xl font-bold">My Orders</h2>
      </div>

      <div className="space-y-3">
        {orders.length === 0 ? (
          <div className="text-center text-gray-500 mt-10">You have no orders yet.</div>
        ) : (
          orders.map(o => (
            <div 
              key={o.id} 
              onClick={() => navigate(`/orders/${o.id}`)}
              className="bg-white border border-gray-200 rounded-md p-3 shadow-sm cursor-pointer hover:border-gray-300"
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="font-bold text-sm text-gray-900">{o.id}</div>
                  <div className="text-[11px] text-gray-500">{new Date(o.date).toLocaleString()}</div>
                </div>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                  o.status === 'QUEUED' || o.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                  o.status === 'PROCESSING' ? 'bg-blue-100 text-blue-800' :
                  o.status === 'DISPATCHED' ? 'bg-purple-100 text-purple-800' :
                  o.status === 'DELIVERED' || o.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {o.status === 'DELIVERED' || o.status === 'COMPLETED' ? <CheckCircle2 size={10} /> : <Clock size={10} />}
                  {o.status}
                </span>
              </div>
              <div className="flex justify-between items-end mt-4">
                <div className="text-[12px] text-gray-600 font-semibold flex items-center gap-1.5">
                  <Package size={14} /> {o.items?.length || 0} {o.items?.length === 1 ? 'Item' : 'Items'}
                </div>
                <div className="flex items-center gap-2">
                  <div className="font-bold text-sm">₱{o.total.toLocaleString()}</div>
                  <ChevronRight size={16} className="text-gray-400" />
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
