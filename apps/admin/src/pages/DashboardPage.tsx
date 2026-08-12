import React, { useState, useEffect } from 'react';
import { TrendingUp, Users, ShoppingBag, Clock } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

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

  // Generate chart data from orders
  // Using a simple 7-day mock grouping or mapping actual dates if they exist
  // We'll create a 7-day span based on current date, filling in order totals
  const chartData = React.useMemo(() => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    // Default zero data
    const data = days.map(day => ({ name: day, sales: 0 }));
    
    // Aggregate by day of week if orders have dates
    orders.forEach(o => {
      if (o.date) {
        const d = new Date(o.date);
        const dayIdx = (d.getDay() + 6) % 7; // Monday = 0
        if (data[dayIdx]) {
          data[dayIdx].sales += (o.total || 0);
        }
      }
    });
    
    // If no orders have dates or data is empty, put some mock trends for the preview
    if (totalSales === 0) {
      return [
        { name: 'Mon', sales: 0 },
        { name: 'Tue', sales: 0 },
        { name: 'Wed', sales: 0 },
        { name: 'Thu', sales: 0 },
        { name: 'Fri', sales: 0 },
        { name: 'Sat', sales: 0 },
        { name: 'Sun', sales: 0 },
      ];
    }
    
    return data;
  }, [orders, totalSales]);

  const stats = [
    { label: "Total Sales", value: `₱${totalSales.toLocaleString()}`, icon: TrendingUp },
    { label: "Active Orders", value: activeOrders.toString(), icon: ShoppingBag },
    { label: "Avg Wait Time", value: "15 min", icon: Clock },
    { label: "New Customers", value: newCustomers.toString(), icon: Users },
  ];

  return (
    <div className="p-4 max-w-6xl mx-auto w-full">
      <h2 className="text-base font-bold mb-4">Business Overview</h2>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {stats.map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className="bg-white p-3 rounded-md border border-gray-200 shadow-xs flex flex-col items-center justify-center text-center py-4">
              <Icon size={20} className="text-gray-400 mb-1" />
              <div className="text-lg font-bold tracking-tight">{s.value}</div>
              <div className="text-[11px] text-gray-500 uppercase font-semibold mt-0.5">{s.label}</div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-md border border-gray-200 shadow-xs min-h-[260px] flex flex-col">
          <h3 className="font-bold text-xs uppercase tracking-wider mb-3 text-gray-600">SALES TREND</h3>
          <div className="flex-1 w-full h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#000000" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#000000" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#888' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#888' }} tickFormatter={(val) => `₱${val}`} />
                <Tooltip 
                  contentStyle={{ borderRadius: '4px', border: '1px solid #eaeaea', fontSize: '12px', fontWeight: 'bold' }}
                  formatter={(value: number) => [`₱${value.toLocaleString()}`, 'Sales']}
                />
                <Area type="monotone" dataKey="sales" stroke="#000000" strokeWidth={2} fillOpacity={1} fill="url(#colorSales)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-white p-4 rounded-md border border-gray-200 shadow-xs min-h-[260px]">
          <h3 className="font-bold text-xs uppercase tracking-wider mb-3 text-gray-600">RECENT ACTIVITY</h3>
          <div className="space-y-3">
            {orders.slice(0, 5).map((o, i) => (
              <div key={o.id} className="flex gap-3 items-start border-b border-gray-100 pb-2.5 last:border-0">
                <div className="w-7 h-7 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0 text-blue-600 font-bold text-xs">
                  {i + 1}
                </div>
                <div>
                  <div className="text-xs font-semibold">New order {o.id} received</div>
                  <div className="text-[10px] text-gray-500">{new Date(o.date).toLocaleString()}</div>
                </div>
              </div>
            ))}
            {orders.length === 0 && <div className="text-xs text-gray-500">No recent activity</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
