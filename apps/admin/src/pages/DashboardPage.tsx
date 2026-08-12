import React, { useState, useEffect } from 'react';
import { TrendingUp, Users, ShoppingBag, Clock } from 'lucide-react';

export function DashboardPage() {
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    fetch('/v1/orders')
      .then(r => r.json())
      .then(d => setOrders(d.data || []));
  }, []);

  const totalSales = orders.reduce((acc, o) => acc + (o.total || 0), 0);
  const activeOrders = orders.filter(o => o.status !== 'DELIVERED' && o.status !== 'COMPLETED').length;
  const newCustomers = new Set(orders.map(o => o.customerId)).size;

  const stats = [
    { label: "Total Sales", value: `₱${totalSales.toLocaleString()}`, icon: TrendingUp },
    { label: "Active Orders", value: activeOrders.toString(), icon: ShoppingBag },
    { label: "Avg Wait Time", value: "15 min", icon: Clock },
    { label: "New Customers", value: newCustomers.toString(), icon: Users },
  ];

  return (
    <div className="p-4 max-w-6xl mx-auto w-full">
      <h2 className="text-xl font-bold mb-6">Business Overview</h2>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {stats.map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className="bg-white p-4 rounded-md border border-gray-200 shadow-sm flex flex-col items-center justify-center text-center py-6">
              <Icon size={24} className="text-gray-400 mb-2" />
              <div className="text-2xl font-bold">{s.value}</div>
              <div className="text-xs text-gray-500 uppercase font-semibold mt-1">{s.label}</div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-md border border-gray-200 shadow-sm min-h-[300px] flex flex-col">
          <h3 className="font-bold text-sm mb-4 text-gray-700">SALES TREND</h3>
          <div className="flex-1 flex items-center justify-center text-gray-400 text-sm border-2 border-dashed border-gray-100 rounded bg-gray-50">
            [Chart Component Placeholder]
          </div>
        </div>
        <div className="bg-white p-4 rounded-md border border-gray-200 shadow-sm min-h-[300px]">
          <h3 className="font-bold text-sm mb-4 text-gray-700">RECENT ACTIVITY</h3>
          <div className="space-y-4">
            {orders.slice(0, 5).map((o, i) => (
              <div key={o.id} className="flex gap-3 items-start border-b border-gray-100 pb-3 last:border-0">
                <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0 text-blue-600 font-bold text-xs">
                  {i + 1}
                </div>
                <div>
                  <div className="text-sm font-semibold">New order {o.id} received</div>
                  <div className="text-[11px] text-gray-500">{new Date(o.date).toLocaleString()}</div>
                </div>
              </div>
            ))}
            {orders.length === 0 && <div className="text-sm text-gray-500">No recent activity</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
