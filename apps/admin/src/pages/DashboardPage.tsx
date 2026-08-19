import React, { useState, useEffect } from 'react';
import { TrendingUp, Users, ShoppingBag, Clock } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export function DashboardPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    fetch('/v1/orders')
      .then(r => r.json())
      .then(d => {
        setOrders(d.data || []);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, []);

  const totalSales = orders.reduce((acc, o) => acc + (o.total || 0), 0);
  const activeOrders = orders.filter(o => o.status !== 'DELIVERED' && o.status !== 'COMPLETED').length;
  const newCustomers = new Set(orders.map(o => o.customerId)).size;

  const chartData = React.useMemo(() => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const data = days.map(day => ({ name: day, sales: 0 }));
    
    orders.forEach(o => {
      if (o.date) {
        const d = new Date(o.date);
        const dayIdx = (d.getDay() + 6) % 7; 
        if (data[dayIdx]) {
          data[dayIdx].sales += (o.total || 0);
        }
      }
    });
    
    return data;
  }, [orders]);

  const stats = [
    { label: "Total Sales", value: `₱${totalSales.toLocaleString()}`, icon: TrendingUp },
    { label: "Active Orders", value: activeOrders.toString(), icon: ShoppingBag },
    { label: "Avg Wait Time", value: "15 min", icon: Clock },
    { label: "New Customers", value: newCustomers.toString(), icon: Users },
  ];

  return (
    <div className="p-6 max-w-6xl mx-auto w-full bg-white dark:bg-gray-950 transition-colors">
      <h2 className="text-xl font-bold uppercase tracking-widest text-prime-text dark:text-gray-100 mb-6">Business Overview</h2>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="prime-card h-32 animate-pulse" />
          ))
        ) : stats.map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className="prime-card flex flex-col items-center justify-center py-6 border-prime-gray-200 hover:shadow-md transition-all">
              <Icon size={24} className="text-prime-text dark:text-gray-400 mb-3" />
              <div className="text-2xl font-bold text-prime-text dark:text-gray-100">{s.value}</div>
              <div className="text-[10px] font-bold text-prime-gray-500 uppercase tracking-widest mt-1">{s.label}</div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="prime-card border-prime-gray-200 p-6 flex flex-col">
          <h3 className="text-xs font-bold uppercase tracking-widest text-prime-gray-500 mb-6">Sales Trend</h3>
          <div className="flex-1 w-full h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#000000" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#000000" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6b7280' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6b7280' }} tickFormatter={(val) => `₱${val}`} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px', fontWeight: 'bold' }}
                  formatter={(value: number) => [`₱${value.toLocaleString()}`, 'Sales']}
                />
                <Area type="monotone" dataKey="sales" stroke="#000000" strokeWidth={2} fillOpacity={1} fill="url(#colorSales)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="prime-card border-prime-gray-200 p-6">
          <h3 className="text-xs font-bold uppercase tracking-widest text-prime-gray-500 mb-6">Recent Activity</h3>
          <div className="space-y-4">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-10 bg-prime-gray-100 animate-pulse rounded-lg" />
              ))
            ) : orders.slice(0, 5).map((o, i) => (
              <div key={o.id} className="flex gap-4 items-center p-3 rounded-lg bg-prime-gray-50 border border-prime-gray-100">
                <div className="w-8 h-8 rounded-lg bg-prime-text text-white flex items-center justify-center font-bold text-xs">
                  {i + 1}
                </div>
                <div className="flex-1">
                  <div className="text-xs font-bold text-prime-text">Order #{o.id.slice(-6)}</div>
                  <div className="text-[10px] text-prime-gray-500">{new Date(o.date).toLocaleTimeString()}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

