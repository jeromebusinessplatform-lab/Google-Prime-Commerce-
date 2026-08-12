import React, { useState, useEffect } from 'react';
import { User, Shield, MapPin, Phone, Mail, Award, History, ChevronRight, Save, Clock, Info } from 'lucide-react';
import { Customer } from '../../../../packages/domain/customer';

export function AccountPage() {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    phoneNumber: '',
    email: '',
    deliveryNotes: ''
  });

  // Mock Telegram User ID for now - in real app, get from window.Telegram.WebApp.initDataUnsafe.user.id
  const tgUserId = "123456789";

  useEffect(() => {
    fetch(`/v1/customer?telegramUserId=${tgUserId}`)
      .then(r => r.json())
      .then(d => {
        if (d.data) {
          setCustomer(d.data);
          setFormData({
            fullName: d.data.fullName || '',
            phoneNumber: d.data.phoneNumber || '',
            email: d.data.email || '',
            deliveryNotes: d.data.deliveryNotes || ''
          });
        }
      });
  }, [tgUserId]);

  const handleSave = async () => {
    if (!customer) return;
    try {
      await fetch(`/v1/customer/${customer.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      setCustomer({ ...customer, ...formData });
      setIsEditing(false);
    } catch (e) {
      console.error(e);
    }
  };

  if (!customer) return <div className="p-8 text-center animate-pulse text-gray-400 font-bold uppercase tracking-widest">Identifying Prime Member...</div>;

  return (
    <div className="max-w-md mx-auto p-4 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Prime Header */}
      <div className="relative overflow-hidden bg-black text-white rounded-2xl p-6 shadow-2xl shadow-black/20">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Shield size={120} />
        </div>
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-gray-800 to-gray-600 flex items-center justify-center border-2 border-white/20 shadow-inner">
            <User size={32} />
          </div>
          <div>
            <h2 className="text-xl font-black italic tracking-tighter uppercase leading-none">
              {customer.telegramProfile.firstName} {customer.telegramProfile.lastName}
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] font-black bg-white text-black px-2 py-0.5 rounded italic">PRIME MEMBER</span>
              <span className="text-[10px] font-bold text-gray-400 tracking-widest uppercase">ID: {customer.primeMemberId}</span>
            </div>
          </div>
        </div>
        
        <div className="mt-6 pt-6 border-t border-white/10 flex justify-between items-center">
          <div className="text-center">
            <div className="text-[10px] font-bold text-gray-400 uppercase mb-1">Status</div>
            <div className="text-xs font-black italic">{customer.tier}</div>
          </div>
          <div className="w-px h-8 bg-white/10" />
          <div className="text-center">
            <div className="text-[10px] font-bold text-gray-400 uppercase mb-1">Joined</div>
            <div className="text-xs font-black italic">{new Date(customer.createdAt).toLocaleDateString()}</div>
          </div>
          <div className="w-px h-8 bg-white/10" />
          <div className="text-center">
            <div className="text-[10px] font-bold text-gray-400 uppercase mb-1">Orders</div>
            <div className="text-xs font-black italic">12</div>
          </div>
        </div>
      </div>

      {/* Telegram Identity (Read-only) */}
      <section className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 border border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-2 mb-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">
           <Shield size={12} /> Telegram Authentication
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="text-[9px] font-bold text-gray-500 uppercase">Profile Handle</div>
            <div className="text-sm font-bold text-gray-900 dark:text-gray-100 italic">
              {customer.telegramProfile.username ? `@${customer.telegramProfile.username}` : <span className="text-gray-400">No handle</span>}
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-[9px] font-bold text-gray-500 uppercase">User ID</div>
            <div className="text-sm font-bold text-gray-900 dark:text-gray-100 font-mono tracking-tighter">{customer.telegramUserId}</div>
          </div>
        </div>
      </section>

      {/* Delivery & Contact Info */}
      <div className="space-y-4">
        <div className="flex justify-between items-center px-1">
           <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Personal Information</h3>
           <button 
             onClick={() => isEditing ? handleSave() : setIsEditing(true)}
             className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 transition-all ${isEditing ? 'text-green-600' : 'text-black dark:text-white'}`}
           >
             {isEditing ? <><Save size={12} /> Commit Changes</> : <><Save size={12} /> Update Info</>}
           </button>
        </div>

        <div className="bg-white dark:bg-black rounded-xl border border-gray-200 dark:border-gray-800 divide-y divide-gray-100 dark:divide-gray-900">
          <div className="p-4 flex items-center gap-4">
            <div className="w-8 h-8 rounded bg-gray-50 dark:bg-gray-900 flex items-center justify-center text-gray-400"><User size={16} /></div>
            <div className="flex-1">
              <label className="block text-[8px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Legal Full Name</label>
              {isEditing ? (
                <input 
                  type="text" 
                  value={formData.fullName} 
                  onChange={e => setFormData({...formData, fullName: e.target.value})}
                  className="w-full text-sm font-bold bg-transparent outline-none border-b border-gray-200 focus:border-black transition-colors"
                />
              ) : (
                <div className="text-sm font-bold">{formData.fullName || <span className="text-gray-300 italic font-normal">Not provided</span>}</div>
              )}
            </div>
          </div>

          <div className="p-4 flex items-center gap-4">
            <div className="w-8 h-8 rounded bg-gray-50 dark:bg-gray-900 flex items-center justify-center text-gray-400"><Phone size={16} /></div>
            <div className="flex-1">
              <label className="block text-[8px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Phone Number</label>
              {isEditing ? (
                <input 
                  type="tel" 
                  value={formData.phoneNumber} 
                  onChange={e => setFormData({...formData, phoneNumber: e.target.value})}
                  className="w-full text-sm font-bold bg-transparent outline-none border-b border-gray-200 focus:border-black transition-colors"
                />
              ) : (
                <div className="text-sm font-bold">{formData.phoneNumber || <span className="text-gray-300 italic font-normal">Not provided</span>}</div>
              )}
            </div>
          </div>

          <div className="p-4 flex items-center gap-4">
            <div className="w-8 h-8 rounded bg-gray-50 dark:bg-gray-900 flex items-center justify-center text-gray-400"><Mail size={16} /></div>
            <div className="flex-1">
              <label className="block text-[8px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Email Address</label>
              {isEditing ? (
                <input 
                  type="email" 
                  value={formData.email} 
                  onChange={e => setFormData({...formData, email: e.target.value})}
                  className="w-full text-sm font-bold bg-transparent outline-none border-b border-gray-200 focus:border-black transition-colors"
                />
              ) : (
                <div className="text-sm font-bold">{formData.email || <span className="text-gray-300 italic font-normal">Not provided</span>}</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Referrals & Rewards */}
      <section className="bg-yellow-50 dark:bg-yellow-950/20 rounded-2xl p-5 border border-yellow-200/50 dark:border-yellow-900/50">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-sm font-black italic uppercase tracking-tighter text-yellow-900 dark:text-yellow-500">Referral Program</h3>
            <p className="text-[10px] font-bold text-yellow-700 dark:text-yellow-700 uppercase tracking-widest">Share the prime experience</p>
          </div>
          <div className="bg-yellow-900 text-white text-[10px] font-black px-3 py-1 rounded-full italic shadow-lg shadow-yellow-900/20">
            {customer.referralCode}
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-white dark:bg-black/40 p-3 rounded-xl border border-yellow-100 dark:border-yellow-900/30">
            <div className="text-[8px] font-bold text-yellow-800/50 dark:text-yellow-700 uppercase mb-1">Qualified</div>
            <div className="text-xl font-black italic text-yellow-900 dark:text-yellow-500">{customer.referralSummary.qualifiedCount}</div>
          </div>
          <div className="bg-white dark:bg-black/40 p-3 rounded-xl border border-yellow-100 dark:border-yellow-900/30">
            <div className="text-[8px] font-bold text-yellow-800/50 dark:text-yellow-700 uppercase mb-1">Pending</div>
            <div className="text-xl font-black italic text-yellow-900 dark:text-yellow-500">{customer.referralSummary.pendingCount}</div>
          </div>
        </div>

        <button className="w-full py-3 bg-yellow-900 hover:bg-yellow-800 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 shadow-xl shadow-yellow-900/20">
          <Award size={14} /> View Reward Vouchers
        </button>
      </section>

      {/* Footer Info */}
      <div className="pt-4 border-t border-gray-100 dark:border-gray-900 space-y-3">
        <div className="flex items-center gap-2 text-[8px] font-bold text-gray-400 uppercase tracking-widest">
           <Clock size={10} /> Consent: {new Date(customer.consent.timestamp).toLocaleString()} (v{customer.consent.policyVersion})
        </div>
        <div className="flex items-center gap-2 text-[8px] font-bold text-gray-400 uppercase tracking-widest">
           <Info size={10} /> All profile data is securely stored and versioned for your protection.
        </div>
      </div>
    </div>
  );
}
