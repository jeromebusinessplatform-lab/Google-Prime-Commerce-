import React, { useState } from 'react';
import { Save, Truck, CreditCard, Receipt } from 'lucide-react';

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState('couriers');

  return (
    <div className="p-4 max-w-6xl mx-auto w-full flex flex-col md:flex-row gap-6">
      <div className="w-full md:w-64 flex-shrink-0">
        <h2 className="text-xl font-bold mb-4">Settings</h2>
        <div className="flex flex-col space-y-1">
          <button 
            onClick={() => setActiveTab('couriers')} 
            className={`flex items-center gap-2 p-3 text-sm font-bold rounded-md transition-colors ${activeTab === 'couriers' ? 'bg-black text-white' : 'hover:bg-gray-100 text-gray-600'}`}
          >
            <Truck size={16} /> Couriers & Shipping
          </button>
          <button 
            onClick={() => setActiveTab('payments')} 
            className={`flex items-center gap-2 p-3 text-sm font-bold rounded-md transition-colors ${activeTab === 'payments' ? 'bg-black text-white' : 'hover:bg-gray-100 text-gray-600'}`}
          >
            <CreditCard size={16} /> Payment Methods
          </button>
          <button 
            onClick={() => setActiveTab('charges')} 
            className={`flex items-center gap-2 p-3 text-sm font-bold rounded-md transition-colors ${activeTab === 'charges' ? 'bg-black text-white' : 'hover:bg-gray-100 text-gray-600'}`}
          >
            <Receipt size={16} /> Taxes & Extra Charges
          </button>
        </div>
      </div>

      <div className="flex-1 bg-white border border-gray-200 rounded-lg shadow-sm p-6">
        {activeTab === 'couriers' && (
          <div>
            <h3 className="text-lg font-bold mb-4 border-b border-gray-100 pb-2">Couriers & Shipping Rates</h3>
            <div className="space-y-4">
              <div className="border border-gray-200 p-4 rounded-md flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm">Lalamove Integration</h4>
                  <p className="text-xs text-gray-500">Same-day delivery API integration</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" defaultChecked className="sr-only peer" />
                  <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-500"></div>
                </label>
              </div>
              <div className="border border-gray-200 p-4 rounded-md flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm">Standard Shipping (Provincial)</h4>
                  <p className="text-xs text-gray-500">Fixed rate shipping for provinces</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold">₱150.00</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked className="sr-only peer" />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-500"></div>
                  </label>
                </div>
              </div>
              <button className="bg-black text-white px-4 py-2 rounded-md font-bold text-sm flex items-center gap-2 mt-4 hover:bg-gray-800">
                <Save size={16} /> SAVE SETTINGS
              </button>
            </div>
          </div>
        )}

        {activeTab === 'payments' && (
          <div>
            <h3 className="text-lg font-bold mb-4 border-b border-gray-100 pb-2">Payment Methods</h3>
            <div className="space-y-4">
              <div className="border border-gray-200 p-4 rounded-md flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm">GCash</h4>
                  <p className="text-xs text-gray-500">Accept e-wallet payments via GCash</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" defaultChecked className="sr-only peer" />
                  <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-500"></div>
                </label>
              </div>
              <div className="border border-gray-200 p-4 rounded-md flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm">Credit / Debit Card</h4>
                  <p className="text-xs text-gray-500">Accept card payments via PayMongo</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" defaultChecked className="sr-only peer" />
                  <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-500"></div>
                </label>
              </div>
              <div className="border border-gray-200 p-4 rounded-md flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm">Cash on Delivery (COD)</h4>
                  <p className="text-xs text-gray-500">Allow customers to pay upon receiving</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" />
                  <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-500"></div>
                </label>
              </div>
              <button className="bg-black text-white px-4 py-2 rounded-md font-bold text-sm flex items-center gap-2 mt-4 hover:bg-gray-800">
                <Save size={16} /> SAVE SETTINGS
              </button>
            </div>
          </div>
        )}

        {activeTab === 'charges' && (
          <div>
            <h3 className="text-lg font-bold mb-4 border-b border-gray-100 pb-2">Taxes & Extra Charges</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold mb-1">Value Added Tax (VAT) %</label>
                <input type="number" defaultValue={12} className="w-full max-w-xs border border-gray-300 rounded-md p-2 text-sm focus:border-black outline-none" />
                <p className="text-xs text-gray-500 mt-1">Leave at 0 if prices are already tax inclusive.</p>
              </div>
              <div className="pt-2">
                <label className="block text-sm font-bold mb-1">Service Charge (₱)</label>
                <input type="number" defaultValue={0} className="w-full max-w-xs border border-gray-300 rounded-md p-2 text-sm focus:border-black outline-none" />
                <p className="text-xs text-gray-500 mt-1">Fixed amount applied to all orders.</p>
              </div>
              <button className="bg-black text-white px-4 py-2 rounded-md font-bold text-sm flex items-center gap-2 mt-4 hover:bg-gray-800">
                <Save size={16} /> SAVE SETTINGS
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
