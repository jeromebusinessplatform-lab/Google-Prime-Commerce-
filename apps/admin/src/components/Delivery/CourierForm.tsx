import React, { useState } from 'react';
import { X, Save, Truck, DollarSign, Clock, Map, Image as ImageIcon, Barcode, Shield, AlertTriangle } from 'lucide-react';
import { Courier } from '../../../../../packages/domain/courier';

interface CourierFormProps {
  initialData?: Partial<Courier>;
  onClose: () => void;
  onSubmit: () => void;
}

export function CourierForm({ initialData, onClose, onSubmit }: CourierFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('general');
  const [formData, setFormData] = useState<any>({
    name: '',
    code: '',
    logoUrl: 'https://placehold.co/100x100',
    sortOrder: 0,
    routingMode: 'motor_scooter',
    trackingUrlTemplate: '',
    supportDetails: '',
    config: {
      version: 1,
      baseDistanceKm: 3.5,
      baseFareMinor: 4900,
      excessPerKmMinor: 1000,
      platformFeeMinor: 0,
      perKmSurchargeMinor: 0,
      nightFeeMinor: 0,
      nightFeeStartHour: 22,
      nightFeeEndHour: 5
    },
    ...initialData
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const url = initialData?.id ? `/v1/couriers/${initialData.id}` : '/v1/couriers';
      const method = initialData?.id ? 'PATCH' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to save courier provider');
      }

      onSubmit();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const tabs = [
    { id: 'general', label: 'Fleet Info', icon: Truck },
    { id: 'pricing', label: 'Calculator', icon: DollarSign },
    { id: 'routing', label: 'Logistics', icon: Map },
    { id: 'support', label: 'Ops Support', icon: Shield },
  ];

  return (
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
      <div className="flex justify-between items-center p-6 border-b border-gray-100">
        <div>
          <h3 className=" text-xl uppercase tracking-tighter">Fleet Configuration</h3>
          <p className="text-[10px]  text-gray-400 uppercase tracking-widest mt-0.5">Version Control: v{formData.config.version}</p>
        </div>
        <button onClick={onClose} className="p-2 text-gray-400 hover:text-black hover:bg-gray-50 rounded-full transition-all"><X size={20} /></button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-40 bg-gray-50/50 border-r border-gray-100 p-2 space-y-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-[10px]  uppercase tracking-widest transition-all ${
                activeTab === tab.id ? 'bg-black text-white shadow-lg shadow-black/20' : 'text-gray-400 hover:bg-white hover:text-black'
              }`}
            >
              <tab.icon size={14} />
              {tab.label}
            </button>
          ))}
          
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-xl flex gap-2 items-start text-red-600 animate-in fade-in slide-in-from-top-2">
               <AlertTriangle size={14} className="shrink-0 mt-0.5" />
               <p className="text-[8px]  uppercase leading-tight">{error}</p>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-8">
          <form id="courierForm" onSubmit={handleSubmit} className="space-y-8">
            {activeTab === 'general' && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                   <div className="col-span-2 flex items-center gap-6 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                      <div className="w-16 h-16 bg-white rounded-xl border border-gray-200 overflow-hidden p-2 relative group">
                         <img src={formData.logoUrl} className="w-full h-full object-contain" />
                         <input 
                           type="file" 
                           className="absolute inset-0 opacity-0 cursor-pointer" 
                           onChange={e => {
                             const file = e.target.files?.[0];
                             if (file) {
                               const reader = new FileReader();
                               reader.onload = ev => setFormData({...formData, logoUrl: ev.target?.result as string});
                               reader.readAsDataURL(file);
                             }
                           }}
                         />
                      </div>
                      <div className="flex-1">
                        <label className="block text-[8px]  text-gray-400 uppercase tracking-widest mb-1">Fleet Branding (Logo)</label>
                        <p className="text-[10px] text-gray-500 font-medium">PNG, SVG or WEBP. Aspect ratio preserved.</p>
                      </div>
                   </div>
                   
                   <div>
                     <label className="block text-[10px]  text-gray-400 uppercase tracking-[0.2em] mb-2">Fleet Name</label>
                     <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full border-2 border-gray-100 rounded-xl px-4 py-2.5 text-sm  focus:border-black outline-none transition-all" />
                   </div>
                   <div>
                     <label className="block text-[10px]  text-gray-400 uppercase tracking-[0.2em] mb-2">Fleet Code</label>
                     <input required type="text" value={formData.code} onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})} className="w-full border-2 border-gray-100 rounded-xl px-4 py-2.5 text-sm  focus:border-black outline-none transition-all font-mono" />
                   </div>
                   <div>
                     <label className="block text-[10px]  text-gray-400 uppercase tracking-[0.2em] mb-2">Sort Priority</label>
                     <input type="number" value={formData.sortOrder} onChange={e => setFormData({...formData, sortOrder: Number(e.target.value)})} className="w-full border-2 border-gray-100 rounded-xl px-4 py-2.5 text-sm  focus:border-black outline-none transition-all" />
                   </div>
                </div>
              </div>
            )}

            {activeTab === 'pricing' && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px]  text-gray-400 uppercase tracking-[0.2em] mb-2">Base Allowance (KM)</label>
                    <input type="number" step="0.1" value={formData.config.baseDistanceKm} onChange={e => setFormData({...formData, config: {...formData.config, baseDistanceKm: Number(e.target.value)}})} className="w-full border-2 border-gray-100 rounded-xl px-4 py-2.5 text-sm  focus:border-black outline-none transition-all" />
                  </div>
                  <div>
                    <label className="block text-[10px]  text-gray-400 uppercase tracking-[0.2em] mb-2">Base Fare (MINORS)</label>
                    <input type="number" value={formData.config.baseFareMinor} onChange={e => setFormData({...formData, config: {...formData.config, baseFareMinor: Number(e.target.value)}})} className="w-full border-2 border-gray-100 rounded-xl px-4 py-2.5 text-sm  focus:border-black outline-none transition-all" />
                  </div>
                  <div>
                    <label className="block text-[10px]  text-gray-400 uppercase tracking-[0.2em] mb-2">Excess / KM (MINORS)</label>
                    <input type="number" value={formData.config.excessPerKmMinor} onChange={e => setFormData({...formData, config: {...formData.config, excessPerKmMinor: Number(e.target.value)}})} className="w-full border-2 border-gray-100 rounded-xl px-4 py-2.5 text-sm  focus:border-black outline-none transition-all" />
                  </div>
                  <div>
                    <label className="block text-[10px]  text-gray-400 uppercase tracking-[0.2em] mb-2">Platform Fee (MINORS)</label>
                    <input type="number" value={formData.config.platformFeeMinor} onChange={e => setFormData({...formData, config: {...formData.config, platformFeeMinor: Number(e.target.value)}})} className="w-full border-2 border-gray-100 rounded-xl px-4 py-2.5 text-sm  focus:border-black outline-none transition-all" />
                  </div>
                  <div>
                    <label className="block text-[10px]  text-gray-400 uppercase tracking-[0.2em] mb-2">Night Surcharge (MINORS)</label>
                    <input type="number" value={formData.config.nightFeeMinor} onChange={e => setFormData({...formData, config: {...formData.config, nightFeeMinor: Number(e.target.value)}})} className="w-full border-2 border-gray-100 rounded-xl px-4 py-2.5 text-sm  focus:border-black outline-none transition-all" />
                  </div>
                </div>

                <div className="p-6 bg-gray-900 rounded-2xl text-white space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="text-[10px]  uppercase tracking-widest text-gray-400">Calculator Test Preview</h4>
                    <div className="flex gap-2">
                       {[3, 5, 10, 15].map(dist => (
                         <button 
                           key={dist}
                           type="button"
                           onClick={() => setFormData({...formData, _testDist: dist})}
                           className={`px-2 py-1 rounded text-[8px]  border ${formData._testDist === dist ? 'bg-white text-black border-white' : 'border-gray-700 text-gray-400 hover:text-white'}`}
                         >
                           {dist}KM
                         </button>
                       ))}
                    </div>
                  </div>
                  
                  <div className="space-y-2 border-t border-gray-800 pt-4">
                     <div className="flex justify-between text-[10px]  text-gray-500 uppercase tracking-widest">
                        <span>Road Distance</span>
                        <span>{formData._testDist || 5} KM</span>
                     </div>
                     <div className="flex justify-between text-[10px]  text-gray-500 uppercase tracking-widest">
                        <span>Base Fare</span>
                        <span>₱{(formData.config.baseFareMinor / 100).toFixed(2)}</span>
                     </div>
                     <div className="flex justify-between text-[10px]  text-gray-500 uppercase tracking-widest">
                        <span>Excess Distance Charge</span>
                        <span>₱{(Math.max(0, (formData._testDist || 5) - formData.config.baseDistanceKm) * formData.config.excessPerKmMinor / 100).toFixed(2)}</span>
                     </div>
                     <div className="flex justify-between text-[10px]  text-gray-500 uppercase tracking-widest">
                        <span>Platform Fee</span>
                        <span>₱{(formData.config.platformFeeMinor / 100).toFixed(2)}</span>
                     </div>
                  </div>

                  <div className="flex justify-between items-baseline pt-2 border-t border-gray-800">
                     <span className="text-xs  text-white uppercase tracking-[0.2em]">Total Delivery Fee</span>
                     <span className="text-2xl  tracking-tighter">
                       ₱{((formData.config.baseFareMinor + (Math.max(0, (formData._testDist || 5) - formData.config.baseDistanceKm) * formData.config.excessPerKmMinor) + formData.config.platformFeeMinor) / 100).toFixed(2)}
                     </span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'routing' && (
              <div className="space-y-6">
                <div>
                   <label className="block text-[10px]  text-gray-400 uppercase tracking-[0.2em] mb-2">Geoapify Routing Mode</label>
                   <select 
                     value={formData.routingMode} 
                     onChange={e => setFormData({...formData, routingMode: e.target.value})}
                     className="w-full border-2 border-gray-100 rounded-xl px-4 py-2.5 text-sm  focus:border-black outline-none transition-all"
                   >
                     <option value="motor_scooter">Motor Scooter</option>
                     <option value="drive">Drive (Car)</option>
                     <option value="bicycle">Bicycle</option>
                     <option value="walk">Walk</option>
                   </select>
                </div>
                <div>
                   <label className="block text-[10px]  text-gray-400 uppercase tracking-[0.2em] mb-2">Tracking URL Template</label>
                   <input type="text" placeholder="https://track.fleet.com/{id}" value={formData.trackingUrlTemplate} onChange={e => setFormData({...formData, trackingUrlTemplate: e.target.value})} className="w-full border-2 border-gray-100 rounded-xl px-4 py-2.5 text-sm  focus:border-black outline-none transition-all font-mono" />
                </div>
              </div>
            )}
          </form>
        </div>
      </div>

      <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3 rounded-b-2xl">
        <button onClick={onClose} className="px-6 py-2.5 border-2 border-gray-100 rounded-xl text-[10px]  uppercase tracking-widest hover:bg-white transition-all">Cancel</button>
        <button form="courierForm" type="submit" disabled={isSubmitting} className="px-8 py-2.5 bg-black text-white rounded-xl text-[10px]  uppercase tracking-widest hover:bg-gray-800 disabled:opacity-50 transition-all shadow-xl shadow-black/20 flex items-center gap-2">
          <Save size={14} /> {isSubmitting ? 'Saving...' : 'Commit Fleet Config'}
        </button>
      </div>
    </div>
  );
}
