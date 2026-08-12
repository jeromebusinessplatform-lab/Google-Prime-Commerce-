import React, { useState, useEffect } from 'react';
import { Package, ChevronRight, Clock, CheckCircle2 } from 'lucide-react';
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
    <div className="p-3 max-w-3xl mx-auto flex flex-col min-h-[calc(100vh-55px-35px-44px-18px)] space-y-4">
      <div className="space-y-4">
        <h2 className="text-2xl tracking-tighter uppercase">My Orders</h2>
        
        <div className="flex flex-wrap gap-2">
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs uppercase tracking-widest focus:ring-black focus:border-black"
          >
            <option value="all">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="PREPARING">Preparing</option>
            <option value="READY">Ready</option>
            <option value="FOR_PICKUP">For Pickup</option>
            <option value="DISPATCHED">Dispatched</option>
            <option value="DELIVERED">Delivered</option>
            <option value="HOLD">Hold</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
          
          <div className="flex-1 flex gap-1">
            <input 
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-1/2 bg-white border border-gray-200 rounded-lg px-2 py-2 text-[10px] focus:ring-black focus:border-black"
            />
            <input 
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-1/2 bg-white border border-gray-200 rounded-lg px-2 py-2 text-[10px] focus:ring-black focus:border-black"
            />
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {filteredOrders.length === 0 ? (
          <div className="text-center text-gray-400 mt-20 uppercase tracking-widest text-[10px]">No orders found for this criteria</div>
        ) : (
          filteredOrders.map(o => (
            <div 
              key={o.id} 
              onClick={() => navigate(`/orders/${o.id}`)}
              className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm cursor-pointer hover:border-black/10 transition-all active:scale-[0.98]"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="text-sm tracking-tighter uppercase">{o.id}</div>
                  <div className="text-[10px] text-gray-400 mt-1 uppercase tracking-widest">{new Date(o.date).toLocaleString()}</div>
                </div>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-medium uppercase tracking-widest ${
                  o.status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                  o.status === 'CONFIRMED' ? 'bg-blue-100 text-blue-700' :
                  o.status === 'PREPARING' ? 'bg-indigo-100 text-indigo-700' :
                  o.status === 'READY' ? 'bg-purple-100 text-purple-700' :
                  o.status === 'DISPATCHED' ? 'bg-black text-white' :
                  o.status === 'DELIVERED' ? 'bg-emerald-100 text-emerald-700' :
                  o.status === 'HOLD' ? 'bg-red-100 text-red-700' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  {o.status === 'DELIVERED' ? <CheckCircle2 size={10} /> : <Clock size={10} />}
                  {o.status.replace('_', ' ')}
                </span>
              </div>
              <div className="flex justify-between items-end">
                <div className="text-[10px] text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Package size={14} className="text-gray-300" /> {o.items?.length || 0} {o.items?.length === 1 ? 'Unit' : 'Units'}
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-lg tracking-tighter">₱{o.total.toLocaleString()}</div>
                  <ChevronRight size={16} className="text-gray-300" />
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
