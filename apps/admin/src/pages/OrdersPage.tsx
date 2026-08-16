import React, { useEffect, useState } from 'react';
import { FileText, Printer } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const STATUS_OPTIONS = [
  ['all', 'All States'],
  ['payment_review', 'Review'],
  ['CONFIRMED', 'Payment Confirmed'],
  ['PACKING', 'Start Packing'],
  ['READY', 'Ready'],
  ['AWAITING_RIDER', 'Awaiting Rider'],
  ['DISPATCHED', 'Dispatched'],
  ['DELIVERED', 'Delivered'],
  ['HOLD_ORDER', 'Hold Order'],
  ['CANCELLED', 'Cancelled'],
] as const;

const statusClass = (status: string) => {
  if (status === 'payment_review') return 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400';
  if (status === 'CONFIRMED') return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400';
  if (status === 'PACKING') return 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400';
  if (status === 'READY') return 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400';
  if (status === 'AWAITING_RIDER') return 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400';
  if (status === 'DISPATCHED') return 'bg-black text-white';
  if (status === 'DELIVERED') return 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400';
  if (status.startsWith('HOLD')) return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400';
  if (status === 'CANCELLED') return 'bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400';
  return 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400';
};

const displayStatus = (status: string) => status === 'payment_review' ? 'REVIEW' : status.replace(/_/g, ' ');

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
    return (statusFilter === 'all' || o.status === statusFilter) &&
      (!startDate || orderDate >= startDate) && (!endDate || orderDate <= endDate);
  });

  return (
    <div className="p-4 max-w-6xl mx-auto w-full space-y-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl tracking-tighter uppercase">Orders Management</h2>
          <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-0.5">Orchestration & Fulfillment Logistics</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg px-2 py-1 shadow-sm">
            <span className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-widest mr-2">Status</span>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="text-xs uppercase bg-transparent border-none focus:ring-0 p-0 cursor-pointer">
              {STATUS_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </div>
          <div className="flex items-center bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg px-2 py-1 shadow-sm">
            <span className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-widest mr-2">From</span>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="text-xs border-none focus:ring-0 p-0 cursor-pointer" />
          </div>
          <div className="flex items-center bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg px-2 py-1 shadow-sm">
            <span className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-widest mr-2">To</span>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="text-xs border-none focus:ring-0 p-0 cursor-pointer" />
          </div>
        </div>
      </div>
      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl shadow-sm overflow-hidden transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead><tr className="bg-gray-50/50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800 text-[10px] uppercase text-gray-400 dark:text-gray-500 tracking-widest">
              <th className="p-4">Order ID</th><th className="p-4">Timestamp</th><th className="p-4">Customer Intelligence</th><th className="p-4 text-right">Value</th><th className="p-4 text-center">Status State</th><th className="p-4 text-right">Actions</th>
            </tr></thead>
            <tbody>{filteredOrders.map(o => (
              <tr key={o.id} className="border-b border-gray-50 dark:border-gray-800/50 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">
                <td className="p-4 text-xs tracking-tighter uppercase">{o.id}</td>
                <td className="p-4 text-[11px] text-gray-500 dark:text-gray-400">{new Date(o.date).toLocaleString()}</td>
                <td className="p-4"><div className="text-xs uppercase">{o.customerName}</div><div className="text-[10px] text-gray-400 dark:text-gray-500 tracking-widest mt-0.5">{o.customerPhone}</div></td>
                <td className="p-4 text-xs text-right tracking-tighter">₱{Number(o.total || 0).toLocaleString()}</td>
                <td className="p-4 text-center"><span className={`inline-block px-2 py-0.5 rounded-[4px] text-[9px] font-medium uppercase tracking-widest ${statusClass(String(o.status || ''))}`}>{displayStatus(String(o.status || ''))}</span></td>
                <td className="p-4 text-right"><div className="flex justify-end gap-1">
                  <button onClick={() => navigate(`/orders/${o.id}`)} className="p-2 text-gray-400 dark:text-gray-500 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all" title="Manage Fulfillment"><FileText size={16} /></button>
                  <button onClick={() => navigate(`/orders/${o.id}?print=true`)} className="p-2 text-gray-400 dark:text-gray-500 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all" title="Print Packing Slip"><Printer size={16} /></button>
                </div></td>
              </tr>
            ))}
            {filteredOrders.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-xs text-gray-400 dark:text-gray-500">No orders found</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
