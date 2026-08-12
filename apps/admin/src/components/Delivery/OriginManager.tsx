import React, { useState } from 'react';
import { MapPin, CheckCircle, AlertCircle, History, Star, Shield, Search, Plus, X, Navigation } from 'lucide-react';
import { DeliveryOrigin } from '../../../../../packages/domain/courier';

interface OriginManagerProps {
  origins: DeliveryOrigin[];
  onUpdate: () => void;
}

export function OriginManager({ origins, onUpdate }: OriginManagerProps) {
  const [isSwitching, setIsSwitching] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newOrigin, setNewOrigin] = useState({
    name: '',
    pickupLabel: '',
    address: '',
    lat: 14.5995,
    lng: 120.9842,
    pickupInstructions: '',
    status: 'active' as const
  });

  const handleSetDefault = async (id: string) => {
    setIsSwitching(true);
    try {
      await fetch('/v1/delivery-origins/set-default', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      onUpdate();
    } finally {
      setIsSwitching(false);
    }
  };

  const handleAddOrigin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await fetch('/v1/delivery-origins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newOrigin)
      });
      setShowAddForm(false);
      setNewOrigin({
        name: '',
        pickupLabel: '',
        address: '',
        lat: 14.5995,
        lng: 120.9842,
        pickupInstructions: '',
        status: 'active'
      });
      onUpdate();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-4 items-start max-w-2xl">
          <div className="p-2 bg-amber-100 text-amber-700 rounded-lg shrink-0">
             <AlertCircle size={20} />
          </div>
          <div>
             <h4 className="text-sm font-black italic uppercase tracking-tight text-amber-900">Atomic Origin Switch</h4>
             <p className="text-xs text-amber-700 font-medium leading-relaxed mt-1">
               Switching the default delivery origin will instantly invalidate all uncommitted checkout quotes. Already submitted orders remain unaffected. Exactly one default origin must be active per store scope.
             </p>
          </div>
        </div>
        <button 
          onClick={() => setShowAddForm(true)}
          className="px-6 py-3 bg-black text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-800 transition-all shadow-xl shadow-black/20 flex items-center gap-2"
        >
          <Plus size={14} /> New Origin
        </button>
      </div>

      {showAddForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
           <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                 <h3 className="font-black text-lg italic uppercase tracking-tighter">Add Delivery Origin</h3>
                 <button onClick={() => setShowAddForm(false)} className="p-2 text-gray-400 hover:text-black rounded-full transition-all"><X size={20} /></button>
              </div>
              <form onSubmit={handleAddOrigin} className="p-8 space-y-6">
                 <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                       <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 italic">Origin Name (Internal)</label>
                       <input required type="text" value={newOrigin.name} onChange={e => setNewOrigin({...newOrigin, name: e.target.value})} className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 text-sm font-bold focus:border-black outline-none transition-all" placeholder="e.g. Makati Main Kitchen" />
                    </div>
                    <div className="col-span-2">
                       <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 italic">Pickup Label (For Courier)</label>
                       <input required type="text" value={newOrigin.pickupLabel} onChange={e => setNewOrigin({...newOrigin, pickupLabel: e.target.value})} className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 text-sm font-bold focus:border-black outline-none transition-all" placeholder="e.g. Dispatch Counter B" />
                    </div>
                    <div className="col-span-2">
                       <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 italic">Street Address</label>
                       <textarea required value={newOrigin.address} onChange={e => setNewOrigin({...newOrigin, address: e.target.value})} className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 text-sm font-bold focus:border-black outline-none transition-all resize-none" rows={2} placeholder="Complete physical address..." />
                    </div>
                    <div>
                       <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 italic">Latitude</label>
                       <input required type="number" step="any" value={newOrigin.lat} onChange={e => setNewOrigin({...newOrigin, lat: Number(e.target.value)})} className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 text-sm font-bold focus:border-black outline-none transition-all" />
                    </div>
                    <div>
                       <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 italic">Longitude</label>
                       <input required type="number" step="any" value={newOrigin.lng} onChange={e => setNewOrigin({...newOrigin, lng: Number(e.target.value)})} className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 text-sm font-bold focus:border-black outline-none transition-all" />
                    </div>
                    <div className="col-span-2">
                       <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 italic">Pickup Instructions</label>
                       <textarea value={newOrigin.pickupInstructions} onChange={e => setNewOrigin({...newOrigin, pickupInstructions: e.target.value})} className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 text-sm font-bold focus:border-black outline-none transition-all resize-none" rows={2} placeholder="Gate codes, counter location, etc." />
                    </div>
                 </div>
                 <div className="flex justify-end gap-3 pt-4">
                    <button type="button" onClick={() => setShowAddForm(false)} className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-black transition-all">Discard</button>
                    <button type="submit" disabled={isSubmitting} className="px-8 py-3 bg-black text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-800 disabled:opacity-50 transition-all shadow-xl shadow-black/20">
                       {isSubmitting ? 'Registering...' : 'Add to Registry'}
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/50 border-b border-gray-200 text-[10px] uppercase text-gray-400 font-black tracking-[0.2em]">
              <th className="p-4">Operational Status</th>
              <th className="p-4">Origin Identity</th>
              <th className="p-4">Pickup Label</th>
              <th className="p-4">Coordinates</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {origins.map(origin => (
              <tr key={origin.id} className={`border-b border-gray-50 hover:bg-gray-50/50 transition-colors ${origin.isDefault ? 'bg-blue-50/30' : ''}`}>
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    {origin.isDefault ? (
                      <div className="flex items-center gap-1.5 text-blue-600">
                        <Star size={14} fill="currentColor" />
                        <span className="text-[10px] font-black uppercase tracking-widest italic">DEFAULT</span>
                      </div>
                    ) : (
                      <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest ${origin.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {origin.status}
                      </span>
                    )}
                  </div>
                </td>
                <td className="p-4">
                  <div className="font-black text-sm text-gray-900 leading-none mb-1 uppercase tracking-tighter">{origin.name}</div>
                  <div className="text-[10px] font-bold text-gray-400 truncate max-w-xs">{origin.address}</div>
                </td>
                <td className="p-4 text-xs font-bold text-gray-600">{origin.pickupLabel}</td>
                <td className="p-4 font-mono text-[10px] text-gray-500">{origin.lat.toFixed(6)}, {origin.lng.toFixed(6)}</td>
                <td className="p-4 text-right">
                  <div className="flex justify-end gap-2">
                    {!origin.isDefault && origin.status === 'active' && (
                      <button 
                        disabled={isSwitching}
                        onClick={() => handleSetDefault(origin.id)}
                        className="px-3 py-1 bg-black text-white rounded text-[10px] font-black uppercase tracking-widest hover:bg-gray-800 disabled:opacity-50 transition-all shadow-md shadow-black/20"
                      >
                        Set Default
                      </button>
                    )}
                    <button className="p-2 text-gray-300 hover:text-black rounded transition-colors" title="Edit Origin Details">
                      <MapPin size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {origins.length === 0 && (
          <div className="p-20 text-center flex flex-col items-center justify-center space-y-4">
            <MapPin className="text-gray-200" size={48} />
            <p className="text-sm font-black uppercase italic text-gray-300">Origin Registry is currently empty</p>
          </div>
        )}
      </div>
    </div>
  );
}
