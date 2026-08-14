import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft, PackageCheck, Truck, CheckCircle2, Receipt, AlertCircle, Printer, X, ShieldAlert, ShieldCheck, ShieldQuestion } from 'lucide-react';

interface PackingSlipModalProps {
  order: any;
  onClose: () => void;
  onUpdateStatus?: (id: string, data: any) => void;
}

function PackingSlipModal({ order, onClose, onUpdateStatus }: PackingSlipModalProps) {
  const [tenant, setTenant] = useState<any>(null);

  useEffect(() => {
    fetch('/v1/tenant')
      .then(r => r.json())
      .then(d => setTenant(d.data));
  }, []);

  const handlePrint = () => {
    window.print();
  };

  if (!tenant) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white dark:bg-gray-900 w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50">
          <div className="flex items-center gap-2">
            <Printer size={18} className="text-gray-400 dark:text-gray-500" />
            <h3 className=" text-[10px] uppercase tracking-widest text-gray-500 dark:text-gray-400">Packing Slip Preview</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 print:p-0" id="printable-slip">
          <div className="border-4 border-black p-6 space-y-8">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <div className="text-2xl tracking-tighter uppercase">{tenant.name}</div>
                <div className="text-[10px] text-gray-400 uppercase tracking-widest">PACKING SLIP — ORDER #{order.id}</div>
              </div>
              <div className="text-right space-y-1">
                <div className="text-[8px] uppercase tracking-widest text-gray-400">Order Date</div>
                <div className="text-sm">{new Date(order.date).toLocaleDateString()}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8 border-y-2 border-black py-6">
              <div className="space-y-4">
                 <div>
                    <div className="text-[9px] uppercase tracking-[0.2em] text-gray-400 mb-1">From</div>
                    <div className="text-[11px] uppercase">{tenant.name}</div>
                    <div className="text-[10px] font-medium text-gray-600 uppercase leading-relaxed max-w-[200px]">{tenant.address}</div>
                    <div className="text-[10px] mt-1">{tenant.contactPhone}</div>
                 </div>
                 <div>
                    <div className="text-[9px] uppercase tracking-[0.2em] text-gray-400 mb-1">Ship To</div>
                    <div className="text-[11px] uppercase leading-tight">{order.customer.name}</div>
                    <div className="text-[10px] font-medium text-gray-600 uppercase leading-relaxed">{order.customer.address}</div>
                    <div className="text-[10px]">{order.customer.phone}</div>
                 </div>
              </div>
              <div className="space-y-4">
                <div>
                   <div className="text-[9px] uppercase tracking-[0.2em] text-gray-400 mb-1">Logistics Orchestration</div>
                   <div className="flex items-center gap-2">
                     <div className="px-3 py-1 bg-black text-white text-[9px] uppercase tracking-widest">
                       {order.delivery?.courierName || 'SELF-PICKUP'}
                     </div>
                     {order.delivery?.mode && (
                       <span className="text-[9px] text-gray-400 uppercase tracking-widest">({order.delivery.mode})</span>
                     )}
                   </div>
                </div>
                <div>
                   <div className="text-[9px] uppercase tracking-[0.2em] text-gray-400 mb-1">Financial State</div>
                   <div className="text-[10px] uppercase">{order.payment.method} — {order.payment.status}</div>
                </div>
              </div>
            </div>

            {order.receipt && (
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 grid grid-cols-2 gap-4">
                 <div>
                    <div className="text-[8px] uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-2">Customer Proof</div>
                    <img src={order.receipt.imageUrl} className="w-full h-40 object-contain rounded-lg border border-white shadow-sm" />
                 </div>
                 <div className="space-y-3">
                    <div className="text-[8px] uppercase tracking-widest text-gray-400 dark:text-gray-500">AI Verification Analysis</div>
                    <div className="space-y-2">
                       <div className="flex justify-between border-b border-gray-200 dark:border-gray-700 pb-1">
                          <span className="text-[9px] text-gray-400 dark:text-gray-500 uppercase">Ref Number</span>
                          <span className="text-[10px]">{order.receipt.analysis?.referenceNumber || 'N/A'}</span>
                       </div>
                       <div className="flex justify-between border-b border-gray-200 dark:border-gray-700 pb-1">
                          <span className="text-[9px] text-gray-400 dark:text-gray-500 uppercase">Amount</span>
                          <span className="text-[10px]">₱{order.receipt.analysis?.amount || 'N/A'}</span>
                       </div>
                       <div className="flex justify-between border-b border-gray-200 dark:border-gray-700 pb-1">
                          <span className="text-[9px] text-gray-400 dark:text-gray-500 uppercase">Sender</span>
                          <span className="text-[10px]">{order.receipt.analysis?.senderName || 'N/A'}</span>
                       </div>
                    </div>
                    {order.payment.status === 'PENDING' && (
                       <button 
                         onClick={() => onUpdateStatus?.(order.id, { payment: { ...order.payment, status: 'PAID' } })}
                         className="w-full py-2 bg-green-600 text-white rounded-lg text-[9px] uppercase tracking-widest hover:bg-green-700 shadow-lg shadow-green-600/20"
                       >
                         Confirm Ledger Match
                       </button>
                    )}
                 </div>
              </div>
            )}

            <div className="space-y-4">
              <div className="text-[10px] uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500">Manifest</div>
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-black text-left text-[10px] uppercase tracking-widest">
                    <th className="pb-2">Description</th>
                    <th className="pb-2 text-center w-20">Qty</th>
                    <th className="pb-2 text-right w-32">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {order.items.map((item: any) => (
                    <tr key={item.id}>
                      <td className="py-4">
                        <div className="text-xs uppercase">{item.name}</div>
                        <div className="text-[10px] text-gray-400 dark:text-gray-500 uppercase">Unit Price: ₱{item.price.toLocaleString()}</div>
                      </td>
                      <td className="py-4 text-center text-sm">{item.qty}</td>
                      <td className="py-4 text-right text-sm">₱{(item.price * item.qty).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-black">
                    <td colSpan={2} className="py-4 text-right text-[10px] uppercase tracking-widest">Total Value</td>
                    <td className="py-4 text-right text-lg tracking-tighter">₱{order.total.toLocaleString()}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="pt-8 border-t border-dashed border-gray-300">
              <div className="text-[10px]  uppercase tracking-widest text-center text-gray-400">
                Thank you for your business. For support, contact logistics@example.com
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 flex justify-end gap-3">
          <button onClick={onClose} className="px-6 py-2.5 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl text-[10px]  uppercase tracking-widest hover:bg-gray-50 dark:hover:bg-gray-700 transition-all">
            Cancel
          </button>
          <button onClick={handlePrint} className="px-8 py-2.5 bg-black text-white rounded-xl text-[10px]  uppercase tracking-widest hover:bg-gray-800 transition-all shadow-xl shadow-black/20 flex items-center gap-2">
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
  const location = useLocation();
  const [order, setOrder] = useState<any>(null);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [reviewReason, setReviewReason] = useState('');

  useEffect(() => {
    if (location.search.includes('print=true')) {
      setShowPrintModal(true);
    }
  }, [location.search]);

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
            items: (found.items || []).map((i: any) => ({ ...i, qty: i.quantity || i.qty || 1 })),
            payment: found.payment || { method: 'COD', status: 'PENDING' },
            delivery: found.delivery || { courierName: 'SELF-PICKUP', fee: 0 },
            receipt: found.receipt,
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

  const getNextStatus = (current: string) => {
    const sequence = ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'FOR_PICKUP', 'DISPATCHED', 'DELIVERED'];
    const idx = sequence.indexOf(current);
    if (idx !== -1 && idx < sequence.length - 1) return sequence[idx + 1];
    return null;
  };

  const nextStatus = order ? getNextStatus(order.status) : null;

  const approvePayment = async () => {
    try {
      await fetch(`/v1/orders/${id}/review-actions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve', reason: reviewReason || 'Admin approved payment review' })
      });
      setOrder((prev: any) => ({ 
        ...prev, 
        status: 'PROCESSING',
        payment: { ...prev.payment, status: 'VERIFIED' },
        reviewStatus: 'VALIDATED'
      }));
    } catch (e) {
      console.error("Failed to approve payment", e);
    }
  };

  const rejectPayment = async () => {
    try {
      await fetch(`/v1/orders/${id}/review-actions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject', reason: reviewReason || 'Admin rejected payment review' })
      });
      setOrder((prev: any) => ({
        ...prev,
        reviewStatus: 'UNVALIDATED',
        payment: { ...prev.payment, status: 'PENDING_REVIEW' }
      }));
    } catch (e) {
      console.error("Failed to reject payment", e);
    }
  };

  const markNeedsReview = async () => {
    try {
      await fetch(`/v1/orders/${id}/review-actions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'needs-review', reason: reviewReason || 'Needs more evidence' })
      });
      setOrder((prev: any) => ({
        ...prev,
        reviewStatus: 'NEEDS_REVIEW'
      }));
    } catch (e) {
      console.error("Failed to mark needs review", e);
    }
  };

  if (!order) return <div className="p-4 text-center mt-10">Loading...</div>;

  return (
    <div className="bg-gray-50 dark:bg-gray-950 flex-1 flex flex-col transition-colors">
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 p-4 sticky top-0 z-20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/orders')} className="p-2 -ml-2 text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white">
            <ChevronLeft size={24} />
          </button>
          <div>
            <h2 className="text-lg tracking-tighter uppercase font-bold">Order {order.id}</h2>
            <div className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-widest">{new Date(order.date).toLocaleString()}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowPrintModal(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-[10px] uppercase tracking-widest hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <Printer size={14} /> Print Slip
          </button>
          <span className={`inline-flex items-center px-3 py-1 rounded-[4px] text-[10px] font-bold uppercase tracking-widest ${
            order.status === 'PENDING' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' :
            order.status === 'CONFIRMED' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' :
            order.status === 'PREPARING' ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400' :
            order.status === 'READY' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400' :
            order.status === 'DISPATCHED' ? 'bg-black text-white' :
            order.status === 'DELIVERED' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' :
            order.status.startsWith('HOLD') ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' :
            'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
          }`}>
            {order.status.replace('_', ' ')}
          </span>
        </div>
      </div>

      {/* Visual Progress Tracker */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-4 py-6 overflow-x-auto">
        <div className="max-w-4xl mx-auto flex items-center justify-between min-w-[600px]">
          {['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'FOR_PICKUP', 'DISPATCHED', 'DELIVERED'].map((s, idx, arr) => {
            const isCurrent = order.status === s;
            const isPast = arr.indexOf(order.status) > idx;
            return (
              <React.Fragment key={s}>
                <div className="flex flex-col items-center gap-2 relative">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-500 border-2 ${
                    isCurrent ? 'bg-black border-black text-white' :
                    isPast ? 'bg-black border-black text-white' :
                    'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-300 dark:text-gray-500'
                  }`}>
                    {isPast ? <CheckCircle2 size={16} /> : <span className="text-[10px] font-bold">{idx + 1}</span>}
                  </div>
                  <span className={`text-[9px] uppercase tracking-widest font-black ${isCurrent ? 'text-black dark:text-white' : 'text-gray-400 dark:text-gray-500'}`}>
                    {s.replace('_', ' ')}
                  </span>
                </div>
                {idx < arr.length - 1 && (
                  <div className={`flex-1 h-[2px] mx-2 -mt-6 transition-all duration-500 ${isPast ? 'bg-black' : 'bg-gray-100 dark:bg-gray-800'}`} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {showPrintModal && (
        <PackingSlipModal 
          order={order} 
          onClose={() => setShowPrintModal(false)} 
          onUpdateStatus={() => approvePayment()} 
        />
      )}

      <div className="p-4 max-w-6xl mx-auto w-full grid grid-cols-1 md:grid-cols-3 gap-4 pb-[100px]">
        <div className="md:col-span-2 space-y-4">
          
          {/* Dynamic Order Management Actions */}
          <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-6 transition-colors">
            <div className="space-y-4">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">Logistics Execution</h3>
              <div className="flex flex-col sm:flex-row gap-3">
                {nextStatus ? (
                  <button 
                    onClick={() => updateStatus(nextStatus)}
                    className="flex-1 py-4 px-6 bg-black text-white text-[11px] font-black uppercase tracking-[0.2em] rounded-xl hover:bg-gray-800 transition-all shadow-xl shadow-black/20 flex items-center justify-center gap-3 active:scale-95"
                  >
                    Validate: Next Stage → {nextStatus.replace('_', ' ')}
                  </button>
                ) : order.status === 'DELIVERED' ? (
                  <div className="flex-1 py-4 px-6 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 text-[11px] font-black uppercase tracking-[0.2em] rounded-xl border border-emerald-100 dark:border-emerald-900/30 flex items-center justify-center gap-2">
                    <CheckCircle2 size={18} /> Cycle Completed
                  </div>
                ) : null}
                
                <button 
                  onClick={() => updateStatus('CANCELLED')}
                  className="px-6 py-4 bg-white dark:bg-gray-900 border-2 border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400 text-[11px] font-black uppercase tracking-[0.2em] rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-all flex items-center justify-center gap-2"
                >
                  <X size={18} /> Cancel
                </button>
              </div>
            </div>

            <div className="pt-6 border-t border-gray-50 dark:border-gray-800/50 space-y-4">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">Exception Handling (HOLD)</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {[
                  { label: 'Resubmit', val: 'HOLD_RESUBMIT' },
                  { label: 'Follow-up', val: 'HOLD_FOLLOWUP' },
                  { label: 'Final Call', val: 'HOLD_FINAL_CALL' }
                ].map(h => (
                  <button 
                    key={h.val}
                    onClick={() => updateStatus(h.val)}
                    className={`py-3 px-2 border-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                      order.status === h.val ? 'bg-red-600 border-red-600 text-white shadow-lg shadow-red-600/20' : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 text-gray-400 dark:text-gray-500 hover:border-red-200 dark:hover:border-red-800/50 hover:text-red-500 dark:hover:text-red-400'
                    }`}
                  >
                    {h.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 p-4 rounded-md border border-gray-200 dark:border-gray-800 shadow-sm transition-colors">
            <h3 className=" text-sm mb-3">ORDER ITEMS</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400 uppercase">
                    <th className="pb-2">Item</th>
                    <th className="pb-2">Qty</th>
                    <th className="pb-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map(item => (
                    <tr key={item.id} className="border-b border-gray-100 dark:border-gray-800 last:border-0">
                      <td className="py-2 text-sm ">{item.name}</td>
                      <td className="py-2 text-sm">{item.qty}</td>
                      <td className="py-2 text-sm text-right ">₱{(item.price * item.qty).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-900 p-4 rounded-md border border-gray-200 dark:border-gray-800 shadow-sm transition-colors space-y-3">
            <h3 className=" text-sm mb-3 flex items-center gap-2"><Receipt size={16} /> PAYMENT PROOF</h3>
            {order.payment.status === 'VERIFICATION_PENDING' ? (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded mb-3 border border-yellow-200 dark:border-yellow-800/30">
                <div className="flex gap-2 text-yellow-800 dark:text-yellow-400 text-sm  mb-2">
                  <AlertCircle size={18} /> NEEDS VERIFICATION
                </div>
                <img src={order.payment.proofUrl} alt="Proof" className="w-full h-auto rounded border border-gray-200 dark:border-gray-700 mb-2 cursor-pointer hover:opacity-90" />
                <button 
                  onClick={approvePayment}
                  className="w-full bg-green-600 text-white  py-2 rounded hover:bg-green-700"
                >
                  APPROVE PAYMENT
                </button>
              </div>
            ) : (
              <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded mb-3 border border-green-200 dark:border-green-800/30 text-green-800 dark:text-green-400 text-sm  flex items-center gap-2">
                <CheckCircle2 size={18} /> PAYMENT VERIFIED
              </div>
            )}
            <div className="text-sm">
              <span className="text-gray-500 dark:text-gray-400">Method:</span> <span className="">{order.payment.method}</span>
            </div>
            <div className="text-sm mt-1">
              <span className="text-gray-500 dark:text-gray-400">Amount:</span> <span className=" text-lg">₱{order.total.toLocaleString()}</span>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 p-4 rounded-md border border-gray-200 dark:border-gray-800 shadow-sm transition-colors space-y-3">
            <h3 className="text-sm flex items-center gap-2"><ShieldCheck size={16} /> REVIEW QUEUE</h3>
            <input
              value={reviewReason}
              onChange={(e) => setReviewReason(e.target.value)}
              placeholder="Reason or note"
              className="w-full border border-gray-200 dark:border-gray-700 rounded px-3 py-2 text-sm bg-transparent"
            />
            <div className="grid grid-cols-3 gap-2">
              <button onClick={approvePayment} className="flex items-center justify-center gap-2 py-2 rounded bg-green-600 text-white text-[10px] uppercase tracking-widest">
                <ShieldCheck size={14} /> Approve
              </button>
              <button onClick={rejectPayment} className="flex items-center justify-center gap-2 py-2 rounded bg-red-600 text-white text-[10px] uppercase tracking-widest">
                <ShieldAlert size={14} /> Reject
              </button>
              <button onClick={markNeedsReview} className="flex items-center justify-center gap-2 py-2 rounded bg-amber-500 text-white text-[10px] uppercase tracking-widest">
                <ShieldQuestion size={14} /> Needs Review
              </button>
            </div>
            {order.reviewHistory?.length > 0 && (
              <div className="text-[10px] uppercase tracking-widest text-gray-400 dark:text-gray-500 space-y-1">
                <div>History</div>
                {order.reviewHistory.slice(-3).map((entry: any, index: number) => (
                  <div key={index} className="rounded bg-gray-50 dark:bg-gray-800 p-2">
                    {entry.action} by {entry.reviewerId} at {new Date(entry.reviewedAt).toLocaleString()}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-gray-900 p-4 rounded-md border border-gray-200 dark:border-gray-800 shadow-sm transition-colors">
            <h3 className=" text-sm mb-3 text-gray-500 dark:text-gray-400">CUSTOMER DETAILS</h3>
            <div className="text-sm ">{order.customer.name}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">{order.customer.phone}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-2 p-2 bg-gray-50 dark:bg-gray-800 rounded border border-gray-100 dark:border-gray-700">
              {order.customer.address}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 p-4 rounded-md border border-gray-200 dark:border-gray-800 shadow-sm transition-colors space-y-2">
            <h3 className="text-sm text-gray-500 dark:text-gray-400">DELIVERY TIMELINE</h3>
            {[
              ['Queue entered', order.queueEnteredAt],
              ['Ready', order.readyAt],
              ['Dispatched', order.dispatchedAt],
              ['Delivered', order.deliveredAt],
            ].map(([label, value]) => (
              <div key={label as string} className="flex justify-between gap-3 text-xs">
                <span className="uppercase tracking-widest text-gray-400 dark:text-gray-500">{label}</span>
                <span className="text-right text-gray-700 dark:text-gray-300">{value ? new Date(String(value)).toLocaleString() : '—'}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
