import React, { useState, useEffect } from 'react';
import { Save, Truck, CreditCard, Receipt, Store, Globe, Mail, Phone, MapPin } from 'lucide-react';

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState('identity');
  const [tenant, setTenant] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetch('/v1/tenant')
      .then(r => r.json())
      .then(d => setTenant(d.data));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await fetch('/v1/tenant', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tenant)
      });
      alert('Settings saved successfully');
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  if (!tenant) return <div className="p-8 text-center text-xs  uppercase text-gray-300 dark:text-gray-500">Synchronizing Identity...</div>;

  return (
    <div className="p-4 max-w-6xl mx-auto w-full flex flex-col md:flex-row gap-6 bg-gray-50/30 dark:bg-gray-950 min-h-screen transition-colors">
      <div className="w-full md:w-64 flex-shrink-0">
        <h2 className="tracking-tighter text-gray-900 dark:text-gray-100 uppercase mb-6">Orchestration</h2>
        <div className="flex flex-col space-y-1">
          <button 
            onClick={() => setActiveTab('identity')} 
            className={`flex items-center gap-2 p-3 text-xs  uppercase tracking-widest rounded-xl transition-all ${activeTab === 'identity' ? 'bg-black text-white shadow-xl shadow-black/20' : 'hover:bg-white dark:hover:bg-gray-800 text-gray-400 dark:text-gray-400 hover:text-black dark:hover:text-white border border-transparent hover:border-gray-100 dark:hover:border-gray-800'}`}
          >
            <Store size={16} /> Store Identity
          </button>
          <button 
            onClick={() => setActiveTab('couriers')} 
            className={`flex items-center gap-2 p-3 text-xs  uppercase tracking-widest rounded-xl transition-all ${activeTab === 'couriers' ? 'bg-black text-white shadow-xl shadow-black/20' : 'hover:bg-white dark:hover:bg-gray-800 text-gray-400 dark:text-gray-400 hover:text-black dark:hover:text-white border border-transparent hover:border-gray-100 dark:hover:border-gray-800'}`}
          >
            <Truck size={16} /> Shipping Rates
          </button>
          <button 
            onClick={() => setActiveTab('payments')} 
            className={`flex items-center gap-2 p-3 text-xs  uppercase tracking-widest rounded-xl transition-all ${activeTab === 'payments' ? 'bg-black text-white shadow-xl shadow-black/20' : 'hover:bg-white dark:hover:bg-gray-800 text-gray-400 dark:text-gray-400 hover:text-black dark:hover:text-white border border-transparent hover:border-gray-100 dark:hover:border-gray-800'}`}
          >
            <CreditCard size={16} /> Payment Methods
          </button>
          <button 
            onClick={() => setActiveTab('charges')} 
            className={`flex items-center gap-2 p-3 text-xs  uppercase tracking-widest rounded-xl transition-all ${activeTab === 'charges' ? 'bg-black text-white shadow-xl shadow-black/20' : 'hover:bg-white dark:hover:bg-gray-800 text-gray-400 dark:text-gray-400 hover:text-black dark:hover:text-white border border-transparent hover:border-gray-100 dark:hover:border-gray-800'}`}
          >
            <Receipt size={16} /> Taxes & Fees
          </button>
        </div>
      </div>

      <div className="flex-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm p-8 transition-colors">
        {activeTab === 'identity' && (
          <form onSubmit={handleSave} className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="flex justify-between items-center border-b border-gray-50 dark:border-gray-800/50 pb-4">
              <div>
                <h3 className="text-xl  tracking-tighter uppercase">Store Identity</h3>
                <p className="text-[10px]  text-gray-400 dark:text-gray-500 uppercase tracking-widest">Global Branding & Metadata</p>
              </div>
              <button 
                type="submit" 
                disabled={isSaving}
                className="bg-black text-white px-8 py-2.5 rounded-xl  text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-gray-800 shadow-xl shadow-black/20 disabled:opacity-50"
              >
                <Save size={16} /> {isSaving ? 'SAVING...' : 'PERSIST CHANGES'}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="group">
                  <label className="block text-[10px]  uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-2 group-focus-within:text-black dark:group-focus-within:text-white transition-colors">Store Name</label>
                  <div className="relative">
                    <Store className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 dark:text-gray-500" size={16} />
                    <input 
                      type="text" 
                      value={tenant.name}
                      onChange={e => setTenant({...tenant, name: e.target.value})}
                      className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl px-10 py-3 text-sm  focus:bg-white dark:focus:bg-gray-900 focus:border-black dark:focus:border-white outline-none transition-all" 
                    />
                  </div>
                </div>

                <div className="group">
                  <label className="block text-[10px]  uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-2 group-focus-within:text-black dark:group-focus-within:text-white transition-colors">Public Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 dark:text-gray-500" size={16} />
                    <input 
                      type="email" 
                      value={tenant.contactEmail}
                      onChange={e => setTenant({...tenant, contactEmail: e.target.value})}
                      className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl px-10 py-3 text-sm  focus:bg-white dark:focus:bg-gray-900 focus:border-black dark:focus:border-white outline-none transition-all" 
                    />
                  </div>
                </div>

                <div className="group">
                  <label className="block text-[10px]  uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-2 group-focus-within:text-black dark:group-focus-within:text-white transition-colors">Contact Phone</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 dark:text-gray-500" size={16} />
                    <input 
                      type="text" 
                      value={tenant.contactPhone}
                      onChange={e => setTenant({...tenant, contactPhone: e.target.value})}
                      className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl px-10 py-3 text-sm  focus:bg-white dark:focus:bg-gray-900 focus:border-black dark:focus:border-white outline-none transition-all" 
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="group">
                  <label className="block text-[10px]  uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-2 group-focus-within:text-black dark:group-focus-within:text-white transition-colors">Physical Address</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 text-gray-300 dark:text-gray-500" size={16} />
                    <textarea 
                      rows={4}
                      value={tenant.address}
                      onChange={e => setTenant({...tenant, address: e.target.value})}
                      className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl px-10 py-3 text-sm  focus:bg-white dark:focus:bg-gray-900 focus:border-black dark:focus:border-white outline-none transition-all resize-none" 
                    />
                  </div>
                </div>

                <div className="group">
                  <label className="block text-[10px]  uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-2 group-focus-within:text-black dark:group-focus-within:text-white transition-colors">Store Logo URL</label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 dark:text-gray-500" size={16} />
                    <input 
                      type="text" 
                      value={tenant.logoUrl}
                      onChange={e => setTenant({...tenant, logoUrl: e.target.value})}
                      className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl px-10 py-3 text-sm  focus:bg-white dark:focus:bg-gray-900 focus:border-black dark:focus:border-white outline-none transition-all" 
                    />
                  </div>
                  {tenant.logoUrl && (
                    <div className="mt-2 p-2 border border-gray-100 dark:border-gray-800 rounded-xl bg-gray-50/50 dark:bg-gray-800/50">
                      <img src={tenant.logoUrl} className="h-8 object-contain" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </form>
        )}

        {activeTab === 'couriers' && (
          <div className="animate-in fade-in duration-300">
            <h3 className="text-xl  tracking-tighter uppercase mb-6">Shipping Rates</h3>
            <div className="space-y-4">
              <div className="border border-gray-100 dark:border-gray-800 p-6 rounded-2xl flex items-center justify-between bg-gray-50/30 dark:bg-gray-800/30">
                <div>
                  <h4 className=" text-xs uppercase tracking-widest">Lalamove Integration</h4>
                  <p className="text-[10px]  text-gray-400 dark:text-gray-500 mt-1 uppercase tracking-widest">Real-time quote engine active</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" defaultChecked className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 dark:after:border-gray-600 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black"></div>
                </label>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'payments' && (
          <div className="animate-in fade-in duration-300">
            <h3 className="text-xl  tracking-tighter uppercase mb-6">Payment Methods</h3>
            <div className="space-y-4">
              <div className="border border-gray-100 dark:border-gray-800 p-6 rounded-2xl flex items-center justify-between bg-gray-50/30 dark:bg-gray-800/30">
                <div>
                  <h4 className=" text-xs uppercase tracking-widest">GCash</h4>
                  <p className="text-[10px]  text-gray-400 dark:text-gray-500 mt-1 uppercase tracking-widest">Manual QR verification</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" defaultChecked className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 dark:after:border-gray-600 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black"></div>
                </label>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
