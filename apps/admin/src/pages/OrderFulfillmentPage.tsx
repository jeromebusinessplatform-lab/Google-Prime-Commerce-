import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, PackageCheck, Truck, CheckCircle2, Receipt, AlertCircle, Printer, X } from 'lucide-react';

interface PackingSlipModalProps {
  order: any;
  onClose: () => void;
}

function PackingSlipModal({ order, onClose }: PackingSlipModalProps) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div className="flex items-center gap-2">
            <Printer size={18} className="text-gray-400" />
            <h3 className="font-black text-[10px] uppercase tracking-widest text-gray-500">Packing Slip Preview</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 print:p-0" id="printable-slip">
          <div className="border-4 border-black p-6 space-y-8">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <div className="text-2xl font-black tracking-tighter">PACKING SLIP</div>
                <div className="text-xs font-bold text-gray-500">ORDER #{order.id}</div>
              </div>
              <div className="text-right space-y-1">
                <div className="text-xs font-black uppercase tracking-widest">DATE</div>
                <div className="text-sm font-bold">{new Date(order.date).toLocaleDateString()}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8 border-y-2 border-black py-6">
              <div className="space-y-2">
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Ship To</div>
                <div className="text-sm font-black uppercase leading-tight">{order.customer.name}</div>
                <div className="text-xs font-medium text-gray-600 uppercase leading-relaxed">{order.customer.address}</div>
                <div className="text-xs font-bold">{order.customer.phone}</div>
              </div>
              <div className="space-y-2">
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Order Status</div>
                <div className="inline-block px-3 py-1 bg-black text-white text-[10px] font-black uppercase tracking-widest">
                  {order.status}
                </div>
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 pt-2">Payment</div>
                <div className="text-xs font-bold uppercase">{order.payment.method} — {order.payment.status}</div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Manifest</div>
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-black text-left text-[10px] font-black uppercase tracking-widest">
                    <th className="pb-2">Description</th>
                    <th className="pb-2 text-center w-20">Qty</th>
                    <th className="pb-2 text-right w-32">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {order.items.map((item: any) => (
                    <tr key={item.id}>
                      <td className="py-4">
                        <div className="text-xs font-black uppercase">{item.name}</div>
                        <div className="text-[10px] text-gray-400 font-bold uppercase italic">Unit Price: ₱{item.price.toLocaleString()}</div>
                      </td>
                      <td className="py-4 text-center text-sm font-black">{item.qty}</td>
                      <td className="py-4 text-right text-sm font-black">₱{(item.price * item.qty).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-black">
                    <td colSpan={2} className="py-4 text-right text-[10px] font-black uppercase tracking-widest">Total Value</td>
                    <td className="py-4 text-right text-lg font-black tracking-tighter">₱{order.total.toLocaleString()}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="pt-8 border-t border-dashed border-gray-300">
              <div className="text-[10px] font-black uppercase tracking-widest text-center text-gray-400 italic">
                Thank you for your business. For support, contact logistics@example.com
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
          <button onClick={onClose} className="px-6 py-2.5 bg-white border-2 border-gray-200 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-50 transition-all">
            Cancel
          </button>
          <button onClick={handlePrint} className="px-8 py-2.5 bg-black text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-800 transition-all shadow-xl shadow-black/20 flex items-center gap-2">
            <Printer size={14} /> Send to Printer
          </button>
        </div>
      </div>
      
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-slip, #printable-slip * {
            visibility: visible;
          }
          #printable-slip {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}

export function OrderFulfillmentPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<any>(null);
  const [showPrintModal, setShowPrintModal] = useState(false);

  useEffect(() => {
    fetch('/v1/orders')
      .then(r => r.json())
      .then(d => {
        const found = d.data?.find((o: any) => o.id === id);
        if (found) {
          // Normalize to UI structure
          setOrder({
            id: found.id,
            status: found.status || 'PENDING',
            date: found.date,
            customer: {
              name: found.customerName || 'Walk-in',
              phone: found.customerPhone || 'N/A',
              address: found.address || 'In-store'
            },
            items: (found.items || []).map((i: any) => ({ ...i, qty: i.quantity || 1 })),
            payment: { method: 'Cash', status: 'VERIFIED', proofUrl: null },
            total: found.total || 0
          });
        }
      });
  }, [id]);

  const updateStatus = async (newStatus: string) => {
    try {
      await fetch(`/v1/orders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      setOrder((prev: any) => ({ ...prev, status: newStatus }));
    } catch (e) {
      console.error("Failed to update status", e);
    }
  };

  const approvePayment = async () => {
    try {
      await fetch(`/v1/orders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'PROCESSING', payment: { ...order.payment, status: 'VERIFIED' } })
      });
      setOrder((prev: any) => ({ 
        ...prev, 
        status: 'PROCESSING',
        payment: { ...prev.payment, status: 'VERIFIED' } 
      }));
    } catch (e) {
      console.error("Failed to approve payment", e);
    }
  };

  if (!order) return <div className="p-4 text-center mt-10">Loading...</div>;

  return (
    <div className="bg-gray-50 flex-1 flex flex-col">
      <div className="bg-white border-b border-gray-200 p-4 sticky top-0 z-20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/orders')} className="text-gray-500 hover:text-black">
            <ChevronLeft size={24} />
          </button>
          <div>
            <h2 className="text-lg font-bold">Order {order.id}</h2>
            <div className="text-xs text-gray-500">{new Date(order.date).toLocaleString()}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowPrintModal(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded text-xs font-bold hover:bg-gray-50 transition-colors"
          >
            <Printer size={16} /> PRINT SLIP
          </button>
          <span className={`inline-flex items-center px-3 py-1 rounded text-xs font-bold uppercase ${
            order.status === 'QUEUED' ? 'bg-yellow-100 text-yellow-800' :
            order.status === 'PROCESSING' ? 'bg-blue-100 text-blue-800' :
            order.status === 'DISPATCHED' ? 'bg-purple-100 text-purple-800' :
            'bg-green-100 text-green-800'
          }`}>
            {order.status}
          </span>
        </div>
      </div>

      {showPrintModal && <PackingSlipModal order={order} onClose={() => setShowPrintModal(false)} />}

      <div className="p-4 max-w-6xl mx-auto w-full grid grid-cols-1 md:grid-cols-3 gap-4 pb-[100px]">
        <div className="md:col-span-2 space-y-4">
          
          {/* Action Bar */}
          <div className="bg-white p-4 rounded-md border border-gray-200 shadow-sm flex gap-2">
            <button 
              disabled={order.status !== 'QUEUED'}
              onClick={() => updateStatus('PROCESSING')}
              className="flex-1 py-2 px-3 bg-blue-50 text-blue-700 font-bold text-sm rounded border border-blue-200 hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <PackageCheck size={18} /> PREPARE ORDER
            </button>
            <button 
              disabled={order.status !== 'PROCESSING'}
              onClick={() => updateStatus('DISPATCHED')}
              className="flex-1 py-2 px-3 bg-purple-50 text-purple-700 font-bold text-sm rounded border border-purple-200 hover:bg-purple-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Truck size={18} /> DISPATCH
            </button>
            <button 
              disabled={order.status !== 'DISPATCHED'}
              onClick={() => updateStatus('DELIVERED')}
              className="flex-1 py-2 px-3 bg-green-50 text-green-700 font-bold text-sm rounded border border-green-200 hover:bg-green-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <CheckCircle2 size={18} /> DELIVERED
            </button>
          </div>

          <div className="bg-white p-4 rounded-md border border-gray-200 shadow-sm">
            <h3 className="font-bold text-sm mb-3">ORDER ITEMS</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-200 text-xs text-gray-500 uppercase">
                    <th className="pb-2">Item</th>
                    <th className="pb-2">Qty</th>
                    <th className="pb-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map(item => (
                    <tr key={item.id} className="border-b border-gray-100 last:border-0">
                      <td className="py-2 text-sm font-semibold">{item.name}</td>
                      <td className="py-2 text-sm">{item.qty}</td>
                      <td className="py-2 text-sm text-right font-bold">₱{(item.price * item.qty).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white p-4 rounded-md border border-gray-200 shadow-sm">
            <h3 className="font-bold text-sm mb-3 flex items-center gap-2"><Receipt size={16} /> PAYMENT PROOF</h3>
            {order.payment.status === 'VERIFICATION_PENDING' ? (
              <div className="bg-yellow-50 p-3 rounded mb-3 border border-yellow-200">
                <div className="flex gap-2 text-yellow-800 text-sm font-bold mb-2">
                  <AlertCircle size={18} /> NEEDS VERIFICATION
                </div>
                <img src={order.payment.proofUrl} alt="Proof" className="w-full h-auto rounded border border-gray-200 mb-2 cursor-pointer hover:opacity-90" />
                <button 
                  onClick={approvePayment}
                  className="w-full bg-green-600 text-white font-bold py-2 rounded hover:bg-green-700"
                >
                  APPROVE PAYMENT
                </button>
              </div>
            ) : (
              <div className="bg-green-50 p-3 rounded mb-3 border border-green-200 text-green-800 text-sm font-bold flex items-center gap-2">
                <CheckCircle2 size={18} /> PAYMENT VERIFIED
              </div>
            )}
            <div className="text-sm">
              <span className="text-gray-500">Method:</span> <span className="font-semibold">{order.payment.method}</span>
            </div>
            <div className="text-sm mt-1">
              <span className="text-gray-500">Amount:</span> <span className="font-bold text-lg">₱{order.total.toLocaleString()}</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-md border border-gray-200 shadow-sm">
            <h3 className="font-bold text-sm mb-3 text-gray-500">CUSTOMER DETAILS</h3>
            <div className="text-sm font-bold">{order.customer.name}</div>
            <div className="text-sm text-gray-600 mt-1">{order.customer.phone}</div>
            <div className="text-sm text-gray-600 mt-2 p-2 bg-gray-50 rounded border border-gray-100">
              {order.customer.address}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
