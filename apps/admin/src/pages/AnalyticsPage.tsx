import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area } from 'recharts';
import { DollarSign, ShoppingBag, TrendingUp, Clock, Package } from 'lucide-react';

export function AnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/v1/orders')
      .then(r => r.json())
      .then(d => {
        const orders = d.data || [];
        
        // Revenue over time
        const revenueMap = new Map();
        const categoryMap = new Map();
        
        orders.forEach((o: any) => {
          const date = new Date(o.date).toLocaleDateString();
          revenueMap.set(date, (revenueMap.get(date) || 0) + o.total);
          
          o.items?.forEach((i: any) => {
            const cat = i.category || 'General';
            categoryMap.set(cat, (categoryMap.get(cat) || 0) + (i.price * i.qty));
          });
        });

        const revenueData = Array.from(revenueMap.entries()).map(([date, amount]) => ({ date, amount })).reverse();
        const categoryData = Array.from(categoryMap.entries()).map(([name, value]) => ({ name, value }));

        setData({
          totalRevenue: orders.reduce((acc: number, o: any) => acc + o.total, 0),
          totalOrders: orders.length,
          avgOrderValue: orders.length ? orders.reduce((acc: number, o: any) => acc + o.total, 0) / orders.length : 0,
          revenueData,
          categoryData,
          orders
        });
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="p-8 text-center uppercase tracking-widest text-gray-400">Aggregating Financial Data...</div>;

  const stats = [
    { label: 'Total Revenue', value: `₱${data.totalRevenue.toLocaleString()}`, icon: DollarSign, color: 'text-green-600' },
    { label: 'Total Orders', value: data.totalOrders, icon: ShoppingBag, color: 'text-blue-600' },
    { label: 'Avg Order Value', value: `₱${data.avgOrderValue.toFixed(2)}`, icon: TrendingUp, color: 'text-purple-600' },
    { label: 'Fulfillment Time', value: '2.4h', icon: Clock, color: 'text-orange-600' },
  ];

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto w-full min-h-screen bg-gray-50/50 space-y-6">
      <div>
        <h1 className="text-3xl tracking-tighter text-gray-900 uppercase">Financial Intelligence</h1>
        <p className="text-xs text-gray-400 mt-1 uppercase tracking-widest">Business Performance & Revenue Metrics</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map(s => (
          <div key={s.label} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className={`p-2 rounded-lg bg-gray-50 ${s.color}`}>
                <s.icon size={16} />
              </div>
              <div className="text-[10px] uppercase tracking-widest text-gray-400">{s.label}</div>
            </div>
            <div className="text-xl tracking-tighter">{s.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <h3 className="text-xs uppercase tracking-widest text-gray-400 mb-6">Revenue Trajectory</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.revenueData}>
                <defs>
                  <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#000" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#000" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="date" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `₱${v}`} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ fontSize: '10px', textTransform: 'uppercase' }}
                />
                <Area type="monotone" dataKey="amount" stroke="#000" strokeWidth={2} fillOpacity={1} fill="url(#colorAmount)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <h3 className="text-xs uppercase tracking-widest text-gray-400 mb-6">Category Performance</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.categoryData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" fontSize={10} tickLine={false} axisLine={false} width={80} />
                <Tooltip 
                   cursor={{ fill: 'transparent' }}
                   contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                   itemStyle={{ fontSize: '10px', textTransform: 'uppercase' }}
                />
                <Bar dataKey="value" fill="#000" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-50 flex justify-between items-center">
          <h3 className="text-xs uppercase tracking-widest text-gray-400">Recent Transactions</h3>
          <button className="text-[10px] uppercase text-gray-400 hover:text-black">Export Ledger</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-200 text-[9px] uppercase text-gray-400 tracking-widest">
                <th className="p-4">Reference</th>
                <th className="p-4">Customer</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 text-right">Value</th>
              </tr>
            </thead>
            <tbody>
              {data.orders.slice(0, 5).map((o: any) => (
                <tr key={o.id} className="border-b border-gray-50 text-[11px]">
                  <td className="p-4 uppercase tracking-tighter">{o.id}</td>
                  <td className="p-4 uppercase">{o.customerName}</td>
                  <td className="p-4 text-center">
                    <span className={`px-2 py-0.5 rounded text-[8px] uppercase ${o.payment?.status === 'PAID' ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'}`}>
                      {o.payment?.status}
                    </span>
                  </td>
                  <td className="p-4 text-right tracking-tighter">₱{o.total.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
