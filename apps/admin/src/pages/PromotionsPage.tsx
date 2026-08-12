import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Tag } from 'lucide-react';

export function PromotionsPage() {
  const [promotions, setPromotions] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    type: 'percentage',
    value: '',
    usageLimit: ''
  });

  const fetchPromotions = () => {
    fetch('/v1/promotions')
      .then(r => r.json())
      .then(d => setPromotions(d.data || []));
  };

  useEffect(() => {
    fetchPromotions();
  }, []);

  const handleSave = async () => {
    try {
      await fetch('/v1/promotions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          value: Number(formData.value),
          usageLimit: formData.usageLimit ? Number(formData.usageLimit) : null
        })
      });
      setIsModalOpen(false);
      setFormData({ code: '', type: 'percentage', value: '', usageLimit: '' });
      fetchPromotions();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="p-4 max-w-6xl mx-auto w-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl ">Promotions & Vouchers</h2>
        <button onClick={() => setIsModalOpen(true)} className="bg-black text-white px-4 py-2 rounded-md  text-sm flex items-center gap-2 hover:bg-gray-800">
          <Plus size={16} /> ADD PROMO CODE
        </button>
      </div>
      <div className="bg-white border border-gray-200 rounded-md shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-[11px] uppercase text-gray-500 ">
                <th className="p-3">Code</th>
                <th className="p-3">Type</th>
                <th className="p-3">Value</th>
                <th className="p-3">Usage</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {promotions.map(p => (
                <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="p-3">
                    <div className="flex items-center gap-2  text-sm text-gray-900">
                      <Tag size={16} className="text-gray-400" />
                      {p.code}
                    </div>
                  </td>
                  <td className="p-3 text-sm text-gray-600 capitalize">{p.type}</td>
                  <td className="p-3  text-sm text-gray-900">
                    {p.type === 'percentage' ? `${p.value}%` : `₱${p.value}`}
                  </td>
                  <td className="p-3 text-sm text-gray-600">
                    {p.used || 0} {p.usageLimit ? `/ ${p.usageLimit}` : 'uses'}
                  </td>
                  <td className="p-3">
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px]  uppercase ${
                      p.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <button className="p-1.5 text-gray-400 hover:text-black rounded"><Edit2 size={16} /></button>
                    <button className="p-1.5 text-gray-400 hover:text-red-600 rounded ml-1"><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))}
              {promotions.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500 text-sm">No promotions found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-gray-200">
              <h3 className=" text-lg">Add New Promo Code</h3>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-xs  text-gray-700 mb-1">PROMO CODE</label>
                <input type="text" value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} className="w-full border border-gray-300 rounded px-3 py-2 text-sm uppercase focus:border-black outline-none" placeholder="e.g. SUMMER20" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs  text-gray-700 mb-1">DISCOUNT TYPE</label>
                  <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:border-black outline-none">
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (₱)</option>
                    <option value="freeship">Free Shipping</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs  text-gray-700 mb-1">DISCOUNT VALUE</label>
                  <input type="number" value={formData.value} onChange={e => setFormData({...formData, value: e.target.value})} className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:border-black outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs  text-gray-700 mb-1">USAGE LIMIT (Optional)</label>
                <input type="number" value={formData.usageLimit} onChange={e => setFormData({...formData, usageLimit: e.target.value})} className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:border-black outline-none" placeholder="Leave empty for unlimited" />
              </div>
            </div>
            <div className="p-4 border-t border-gray-200 flex justify-end gap-2">
              <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 border border-gray-300 rounded  text-sm hover:bg-gray-50">CANCEL</button>
              <button onClick={handleSave} className="px-4 py-2 bg-black text-white rounded  text-sm hover:bg-gray-800">SAVE PROMO</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
