import React, { useState, useEffect } from 'react';
import { FileText, MoreHorizontal, Printer } from 'lucide-react';
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
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-base font-bold">Orders Management</h2>
      </div>

      <div className="bg-white border border-gray-200 rounded-md shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-[10px] uppercase text-gray-500 font-bold tracking-wider">
                <th className="p-2.5">Order ID</th>
                <th className="p-2.5">Time</th>
                <th className="p-2.5">Customer</th>
                <th className="p-2.5">Total</th>
                <th className="p-2.5">Status</th>
                <th className="p-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(o => (
                <tr key={o.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="p-2.5 font-bold text-xs">{o.id}</td>
                  <td className="p-2.5 text-xs text-gray-600">{o.time}</td>
                  <td className="p-2.5">
                    <div className="text-xs font-semibold">{o.customerName}</div>
                    <div className="text-[10px] text-gray-500">{o.customerPhone}</div>
                  </td>
                  <td className="p-2.5 font-bold text-xs">₱{o.total.toLocaleString()}</td>
                  <td className="p-2.5">
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      o.status === 'QUEUED' || o.status === 'PENDING' ? 'bg-amber-100 text-amber-800' :
                      o.status === 'PROCESSING' ? 'bg-blue-100 text-blue-800' :
                      o.status === 'DISPATCHED' || o.status === 'DELIVERED' || o.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {o.status}
                    </span>
                  </td>
                  <td className="p-2.5 text-right">
                    <button onClick={() => navigate(`/orders/${o.id}`)} className="p-1 text-gray-400 hover:text-black rounded" title="Manage Fulfillment"><FileText size={15} /></button>
                    <button onClick={() => navigate(`/orders/${o.id}?print=true`)} className="p-1 text-gray-400 hover:text-black rounded ml-1" title="Print Packing Slip"><Printer size={15} /></button>
                    <button className="p-1 text-gray-400 hover:text-black rounded ml-1" title="More options"><MoreHorizontal size={15} /></button>
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-xs text-gray-400">
                    No orders found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
