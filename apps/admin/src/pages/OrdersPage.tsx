import React, { useState, useEffect } from 'react';
import { FileText, MoreHorizontal, Printer } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function OrdersPage() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    fetch('/v1/orders')
      .then(r => r.json())
      .then(d => setOrders(d.data || []));
  }, []);

  const filteredOrders = orders.filter(o => {
    const orderDate = new Date(o.date).toISOString().split('T')[0];
    const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
    const matchesStart = !startDate || orderDate >= startDate;
    const matchesEnd = !endDate || orderDate <= endDate;
    return matchesStatus && matchesStart && matchesEnd;
  });

  return (
    <div className="p-4 max-w-6xl mx-auto w-full space-y-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl tracking-tighter uppercase">Orders Management</h2>
          <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-0.5">Orchestration & Fulfillment Logistics</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center bg-white border border-gray-200 rounded-lg px-2 py-1 shadow-sm">
            <span className="text-[10px] text-gray-400 uppercase tracking-widest mr-2">Status</span>
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs uppercase bg-transparent border-none focus:ring-0 p-0 cursor-pointer"
            >
              <option value="all">All States</option>
              <option value="PENDING">Pending</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="PREPARING">Preparing</option>
              <option value="READY">Ready</option>
              <option value="FOR_PICKUP">For Pickup</option>
              <option value="DISPATCHED">Dispatched</option>
              <option value="DELIVERED">Delivered</option>
              <option value="HOLD">On Hold</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          <div className="flex items-center bg-white border border-gray-200 rounded-lg px-2 py-1 shadow-sm">
            <span className="text-[10px] text-gray-400 uppercase tracking-widest mr-2">From</span>
            <input 
              type="date" 
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="text-xs border-none focus:ring-0 p-0 cursor-pointer"
            />
          </div>

          <div className="flex items-center bg-white border border-gray-200 rounded-lg px-2 py-1 shadow-sm">
            <span className="text-[10px] text-gray-400 uppercase tracking-widest mr-2">To</span>
            <input 
              type="date" 
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="text-xs border-none focus:ring-0 p-0 cursor-pointer"
            />
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100 text-[10px] uppercase text-gray-400  tracking-widest">
                <th className="p-4">Order ID</th>
                <th className="p-4">Timestamp</th>
                <th className="p-4">Customer Intelligence</th>
                <th className="p-4 text-right">Value</th>
                <th className="p-4 text-center">Status State</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map(o => (
                <tr key={o.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="p-4 text-xs tracking-tighter uppercase">{o.id}</td>
                  <td className="p-4 text-[11px] text-gray-500">{new Date(o.date).toLocaleString()}</td>
                  <td className="p-4">
                    <div className="text-xs uppercase">{o.customerName}</div>
                    <div className="text-[10px] text-gray-400 tracking-widest mt-0.5">{o.customerPhone}</div>
                  </td>
                  <td className="p-4 text-xs text-right tracking-tighter">₱{o.total.toLocaleString()}</td>
                  <td className="p-4 text-center">
                    <span className={`inline-block px-2 py-0.5 rounded-[4px] text-[9px] font-medium uppercase tracking-widest ${
                      o.status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                      o.status === 'CONFIRMED' ? 'bg-blue-100 text-blue-700' :
                      o.status === 'PREPARING' ? 'bg-indigo-100 text-indigo-700' :
                      o.status === 'READY' ? 'bg-purple-100 text-purple-700' :
                      o.status === 'DISPATCHED' ? 'bg-black text-white' :
                      o.status === 'DELIVERED' ? 'bg-emerald-100 text-emerald-700' :
                      o.status === 'HOLD' ? 'bg-red-100 text-red-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {o.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => navigate(`/orders/${o.id}`)} className="p-2 text-gray-400 hover:text-black hover:bg-gray-100 rounded-lg transition-all" title="Manage Fulfillment"><FileText size={16} /></button>
                      <button onClick={() => navigate(`/orders/${o.id}?print=true`)} className="p-2 text-gray-400 hover:text-black hover:bg-gray-100 rounded-lg transition-all" title="Print Packing Slip"><Printer size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredOrders.length === 0 && (
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
