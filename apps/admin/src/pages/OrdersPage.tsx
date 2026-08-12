import React, { useState, useEffect } from 'react';
import { FileText, MoreHorizontal } from 'lucide-react';
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
    <div className="p-4 max-w-6xl mx-auto w-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Orders Management</h2>
      </div>

      <div className="bg-white border border-gray-200 rounded-md shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-[11px] uppercase text-gray-500 font-bold">
                <th className="p-3">Order ID</th>
                <th className="p-3">Time</th>
                <th className="p-3">Customer</th>
                <th className="p-3">Total</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(o => (
                <tr key={o.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="p-3 font-bold text-sm">{o.id}</td>
                  <td className="p-3 text-sm text-gray-600">{o.time}</td>
                  <td className="p-3">
                    <div className="text-sm font-semibold">{o.customerName}</div>
                    <div className="text-[11px] text-gray-500">{o.customerPhone}</div>
                  </td>
                  <td className="p-3 font-bold text-sm">₱{o.total.toLocaleString()}</td>
                  <td className="p-3">
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      o.status === 'QUEUED' || o.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                      o.status === 'PROCESSING' ? 'bg-blue-100 text-blue-800' :
                      o.status === 'DISPATCHED' || o.status === 'DELIVERED' || o.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {o.status}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <button onClick={() => navigate(`/orders/${o.id}`)} className="p-1 text-gray-400 hover:text-black rounded"><FileText size={16} /></button>
                    <button className="p-1 text-gray-400 hover:text-black rounded ml-1"><MoreHorizontal size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
