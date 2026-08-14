import React, { useState, useEffect } from 'react';
import { Truck, MapPin, Plus, Settings, Edit2, Archive, CheckCircle, AlertTriangle, ChevronRight, Globe, Layers } from 'lucide-react';
import { Courier, DeliveryOrigin } from '../../../../packages/domain/courier';
import { CourierForm } from '../components/Delivery/CourierForm';
import { OriginManager } from '../components/Delivery/OriginManager';

export function CourierPage() {
  const [couriers, setCouriers] = useState<Courier[]>([]);
  const [origins, setOrigins] = useState<DeliveryOrigin[]>([]);
  const [activeTab, setActiveTab] = useState<'couriers' | 'origins'>('couriers');
  const [isCourierModalOpen, setIsCourierModalOpen] = useState(false);
  const [isOriginModalOpen, setIsOriginModalOpen] = useState(false);
  const [editingCourier, setEditingCourier] = useState<Partial<Courier> | null>(null);

  const fetchData = async () => {
    const [cRes, oRes] = await Promise.all([
      fetch('/v1/couriers'),
      fetch('/v1/delivery-origins')
    ]);
    const [cData, oData] = await Promise.all([cRes.json(), oRes.json()]);
    setCouriers(cData.data || []);
    setOrigins(oData.data || []);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleToggleCourier = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'available' ? 'unavailable' : 'available';
    const reason = prompt(`Reason for making this courier ${newStatus}:`);
    if (!reason) return;

    await fetch(`/v1/couriers/${id}/toggle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus, reason, operator: 'admin' })
    });
    fetchData();
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto w-full min-h-screen bg-gray-50/50 dark:bg-gray-950 transition-colors">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl  tracking-tighter text-gray-900 dark:text-gray-100 uppercase">Courier Orchestration</h1>
          <p className="text-xs  text-gray-400 dark:text-gray-500 mt-1 uppercase tracking-widest">Last-Mile Delivery & Origin Registry</p>
        </div>
        <div className="flex gap-2">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-1 flex">
            <button 
              onClick={() => setActiveTab('couriers')}
              className={`px-4 py-1.5 rounded-md text-[10px]  uppercase tracking-widest transition-all ${activeTab === 'couriers' ? 'bg-black text-white shadow-lg shadow-black/20' : 'text-gray-400 dark:text-gray-400 hover:text-black dark:hover:text-white'}`}
            >
              Fleets
            </button>
            <button 
              onClick={() => setActiveTab('origins')}
              className={`px-4 py-1.5 rounded-md text-[10px]  uppercase tracking-widest transition-all ${activeTab === 'origins' ? 'bg-black text-white shadow-lg shadow-black/20' : 'text-gray-400 dark:text-gray-400 hover:text-black dark:hover:text-white'}`}
            >
              Origins
            </button>
          </div>
          <button 
            onClick={() => activeTab === 'couriers' ? setIsCourierModalOpen(true) : setIsOriginModalOpen(true)}
            className="bg-black text-white px-6 py-2 rounded-md  text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-gray-800 shadow-lg shadow-black/20"
          >
            <Plus size={16} /> New {activeTab === 'couriers' ? 'Courier' : 'Origin'}
          </button>
        </div>
      </div>

      {activeTab === 'couriers' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {couriers.map(courier => (
            <div key={courier.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all group">
              <div className="p-6 border-b border-gray-50 dark:border-gray-800/50">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 bg-gray-50 dark:bg-gray-800 rounded-xl flex items-center justify-center overflow-hidden border border-gray-100 dark:border-gray-700 p-2">
                    <img src={courier.logoUrl} alt={courier.name} className="w-full h-full object-contain" />
                  </div>
                  <button 
                    onClick={() => handleToggleCourier(courier.id, courier.status)}
                    className={`px-3 py-1 rounded-full text-[9px]  uppercase tracking-[0.2em] transition-all ${
                      courier.status === 'available' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-700 dark:hover:text-red-400' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:bg-green-100 dark:hover:bg-green-900/30 hover:text-green-700 dark:hover:text-green-400'
                    }`}
                  >
                    {courier.status}
                  </button>
                </div>
                <h3 className="text-lg  tracking-tighter uppercase text-gray-900 dark:text-gray-100">{courier.name}</h3>
                <div className="text-[10px]  text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-1">Code: {courier.code}</div>
              </div>
              
              <div className="p-6 space-y-4 bg-gray-50/30 dark:bg-gray-800/30">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-[8px]  text-gray-400 dark:text-gray-500 uppercase mb-1">Base Allowance</div>
                    <div className="text-sm ">{courier.config.baseDistanceKm} KM</div>
                  </div>
                  <div>
                    <div className="text-[8px]  text-gray-400 dark:text-gray-500 uppercase mb-1">Base Fare</div>
                    <div className="text-sm  text-black dark:text-white">₱{(courier.config.baseFareMinor / 100).toFixed(2)}</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                   <div className="p-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded"><Globe size={12} /></div>
                   <div className="text-[10px]  text-gray-600 dark:text-gray-400 uppercase tracking-widest">{courier.routingMode.replace('_', ' ')} Route</div>
                </div>
              </div>

              <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => { setEditingCourier(courier); setIsCourierModalOpen(true); }}
                  className="flex items-center gap-2 text-[10px]  uppercase tracking-widest text-gray-400 dark:text-gray-500 hover:text-black dark:hover:text-white transition-colors"
                >
                  <Edit2 size={12} /> Configure Fleet
                </button>
                <div className="text-[8px]  text-gray-300 dark:text-gray-600 uppercase tracking-widest">v{courier.config.version}</div>
              </div>
            </div>
          ))}
          {couriers.length === 0 && (
             <div className="col-span-full py-20 text-center bg-white dark:bg-gray-900 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl flex flex-col items-center gap-4">
                <Truck className="text-gray-200 dark:text-gray-600" size={48} />
                <p className="text-sm  uppercase text-gray-300 dark:text-gray-500">No fleets mobilized in the registry</p>
             </div>
          )}
        </div>
      ) : (
        <OriginManager origins={origins} onUpdate={fetchData} />
      )}

      {/* Modals */}
      {isCourierModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <CourierForm 
            initialData={editingCourier || {}} 
            onClose={() => { setIsCourierModalOpen(false); setEditingCourier(null); }}
            onSubmit={fetchData}
          />
        </div>
      )}
    </div>
  );
}
