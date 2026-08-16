import React, { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, CheckCircle2, X, ShieldAlert, AlertCircle, Printer } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';

const FULFILLMENT = ['CONFIRMED', 'PACKING', 'READY', 'AWAITING_RIDER', 'DISPATCHED', 'DELIVERED'] as const;
type Mode = 'REVIEW' | 'MODIFY';
const label = (value: string) => value.replace(/_/g, ' ');

export function OrderFulfillmentPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<any>(null);
  const [mode, setMode] = useState<Mode>('REVIEW');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [reason, setReason] = useState('');

  const loadOrder = async () => {
    const response = await fetch(`/v1/orders/${id}`);
    if (!response.ok) throw new Error('Order not found');
    const payload = await response.json();
    setOrder(payload.data);
  };
  useEffect(() => { loadOrder().catch(error => setNotice(error.message)); }, [id]);

  const status = String(order?.status || 'PENDING');
  const paymentStatus = String(order?.payment?.status || 'PENDING');
  const paymentFailed = status === 'PAYMENT_FAILED' || status.startsWith('HOLD_') || (paymentStatus === 'PENDING_REVIEW' && order?.reviewStatus === 'UNVALIDATED');
  const isReview = ['payment_review', 'PENDING', 'UPDATED', 'PAYMENT_FAILED', 'HOLD_ORDER', 'REQUEST_RESUBMIT', 'FINAL_FOLLOWUP'].includes(status);
  const currentIndex = FULFILLMENT.indexOf(status as any);
  const nextFulfillment = currentIndex >= 0 ? FULFILLMENT[currentIndex + 1] : null;

  const run = async (url: string, body: any) => {
    setBusy(true); setNotice('');
    try {
      const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || 'Operation failed');
      await loadOrder(); setNotice('UPDATED');
    } catch (error) { setNotice(error instanceof Error ? error.message : 'Operation failed'); }
    finally { setBusy(false); }
  };
  const statusAction = (next: string) => run(`/v1/orders/${id}/status`, { status: next });
  const reviewAction = (action: string) => run(`/v1/orders/${id}/review-actions`, { action, reason: reason || undefined });
  const amendment = () => run(`/v1/orders/${id}/amendments`, { note: reason || 'Order modified by admin' });

  const reviewActions = useMemo(() => {
    if (['payment_review', 'PENDING', 'UPDATED'].includes(status)) return [
      { text: 'PAYMENT CONFIRMED', action: () => reviewAction('approve'), primary: true },
      { text: 'PAYMENT FAILED', action: () => reviewAction('reject'), danger: true },
    ];
    if (status === 'PAYMENT_FAILED') return [
      { text: 'HOLD ORDER', action: () => statusAction('HOLD_ORDER'), danger: true },
      { text: 'REQUEST RESUBMIT', action: () => statusAction('REQUEST_RESUBMIT'), primary: true },
    ];
    if (status === 'HOLD_ORDER') return [
      { text: 'REQUEST RESUBMIT', action: () => statusAction('REQUEST_RESUBMIT'), primary: true },
      { text: 'REJECT ORDER', action: () => statusAction('CANCELLED'), danger: true },
    ];
    if (status === 'REQUEST_RESUBMIT') return [
      { text: 'PAYMENT CLEARED', action: () => reviewAction('approve'), primary: true },
      { text: 'FINAL FOLLOW-UP', action: () => statusAction('FINAL_FOLLOWUP'), danger: true },
    ];
    if (status === 'FINAL_FOLLOWUP') return [
      { text: 'PAYMENT CLEARED', action: () => reviewAction('approve'), primary: true },
      { text: 'REJECT ORDER', action: () => statusAction('CANCELLED'), danger: true },
    ];
    return [];
  }, [status, reason]);

  if (!order) return <div className="p-6 text-sm text-gray-500">{notice || 'Loading...'}</div>;

  return (
    <div className="bg-gray-50 dark:bg-gray-950 flex-1 text-gray-900 dark:text-gray-100">
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 p-4 sticky top-0 z-20 flex items-center justify-between">
        <div className="flex items-center gap-3"><button onClick={() => navigate('/orders')} className="p-2"><ChevronLeft size={22} /></button><div><h2 className="text-lg font-bold uppercase tracking-tight">Order {order.id}</h2><div className="text-[10px] uppercase tracking-widest text-gray-400">Order Management</div></div></div>
        <span className="px-3 py-1 rounded text-[10px] font-bold uppercase tracking-widest bg-gray-100 dark:bg-gray-800">{label(status)}</span>
      </div>
      <div className="max-w-6xl mx-auto p-4 grid grid-cols-1 lg:grid-cols-3 gap-4 pb-12">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-5"><div><h3 className="text-[11px] font-black uppercase tracking-widest">Order Management</h3><p className="text-[10px] text-gray-400 uppercase tracking-widest mt-1">Dynamic workflow controls</p></div><div className="flex gap-2"><button onClick={() => setMode('REVIEW')} className={`px-4 py-2 rounded-lg text-[10px] font-black tracking-widest ${mode === 'REVIEW' ? 'bg-black text-white' : 'border border-gray-200 dark:border-gray-700'}`}>REVIEW</button><button onClick={() => setMode('MODIFY')} className={`px-4 py-2 rounded-lg text-[10px] font-black tracking-widest ${mode === 'MODIFY' ? 'bg-black text-white' : 'border border-gray-200 dark:border-gray-700'}`}>MODIFY</button></div></div>
            {mode === 'REVIEW' && isReview && <div className="space-y-3">
              {paymentFailed && <div className="rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/50 p-3 text-[10px] uppercase tracking-widest text-red-700 dark:text-red-400 flex items-center gap-2"><ShieldAlert size={16} /> PAYMENT FAILED</div>}
              {!paymentFailed && status === 'payment_review' && <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/50 p-3 text-[10px] uppercase tracking-widest text-amber-700 dark:text-amber-400 flex items-center gap-2"><AlertCircle size={16} /> PAYMENT AWAITING REVIEW</div>}
              {reviewActions.map(item => <button key={item.text} disabled={busy} onClick={item.action} className={`w-full py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.16em] ${item.danger ? 'border-2 border-red-200 text-red-600 dark:border-red-900/50' : 'bg-black text-white'}`}>{item.text}</button>)}
            </div>}
            {mode === 'REVIEW' && !isReview && nextFulfillment && <button disabled={busy} onClick={() => statusAction(nextFulfillment)} className="w-full py-4 bg-black text-white rounded-xl text-[11px] font-black uppercase tracking-[0.18em]">{nextFulfillment === 'PACKING' ? 'START PACKING' : label(nextFulfillment)}</button>}
            {mode === 'REVIEW' && status === 'DELIVERED' && <div className="p-4 rounded-xl bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-widest flex justify-center gap-2"><CheckCircle2 size={16} /> DELIVERED</div>}
            {mode === 'MODIFY' && <div className="space-y-3"><div className="rounded-lg bg-gray-50 dark:bg-gray-800 p-3 text-[10px] uppercase tracking-widest">UPDATED → PAYMENT CONFIRMED → START PACKING → READY → AWAITING RIDER → DISPATCHED → DELIVERED</div><textarea value={reason} onChange={e => setReason(e.target.value)} placeholder="Modification note" className="w-full min-h-24 rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent p-3 text-sm" /><button disabled={busy} onClick={amendment} className="w-full py-3 bg-black text-white rounded-xl text-[10px] font-black uppercase tracking-widest">UPDATED</button></div>}
            <div className="mt-5 pt-5 border-t border-gray-100 dark:border-gray-800"><div className="text-[9px] uppercase tracking-widest text-gray-400 mb-3">Fulfillment Progress</div><div className="flex items-center gap-1 overflow-x-auto">{FULFILLMENT.map((stage, index) => <React.Fragment key={stage}><div className={`shrink-0 px-2 py-1 rounded text-[8px] font-bold uppercase tracking-widest ${currentIndex >= index ? 'bg-black text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-400'}`}>{stage === 'PACKING' ? 'START PACKING' : label(stage)}</div>{index < FULFILLMENT.length - 1 && <div className={`h-px w-5 shrink-0 ${currentIndex > index ? 'bg-black' : 'bg-gray-200'}`} />}</React.Fragment>)}</div></div>
          </div>
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5"><h3 className="text-[10px] font-black uppercase tracking-widest mb-4">Order Items</h3><div className="divide-y divide-gray-100 dark:divide-gray-800">{(order.items || []).map((item: any) => <div key={item.id} className="py-3 flex justify-between text-xs"><span>{item.name} × {item.quantity || item.qty || 1}</span><span>₱{Number(item.price || 0).toLocaleString()}</span></div>)}</div><div className="pt-4 mt-2 border-t border-gray-200 dark:border-gray-800 flex justify-between font-bold">TOTAL <span>₱{Number(order.total || 0).toLocaleString()}</span></div></div>
        </div>
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5"><h3 className="text-[10px] font-black uppercase tracking-widest mb-4">Payment</h3><div className="text-xs space-y-2"><div className="flex justify-between"><span className="text-gray-400">METHOD</span><span>{order.payment?.method || '—'}</span></div><div className="flex justify-between"><span className="text-gray-400">STATUS</span><span>{paymentStatus}</span></div><div className="flex justify-between"><span className="text-gray-400">REVIEW</span><span>{order.reviewStatus || '—'}</span></div></div>{order.receipt?.imageUrl && <img src={order.receipt.imageUrl} alt="Payment proof" className="mt-4 w-full rounded-lg border border-gray-200 dark:border-gray-700" />}</div>
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5"><h3 className="text-[10px] font-black uppercase tracking-widest mb-4">Customer</h3><div className="text-sm">{order.customerName || 'Walk-in'}</div><div className="text-xs text-gray-500 mt-1">{order.customerPhone || '—'}</div><div className="text-xs text-gray-500 mt-3">{order.address || '—'}</div></div>
          <button disabled={busy || status === 'DELIVERED' || status === 'CANCELLED'} onClick={() => statusAction('CANCELLED')} className="w-full py-3 border-2 border-red-200 dark:border-red-900/50 text-red-600 rounded-xl text-[10px] font-black uppercase tracking-widest"><X size={14} className="inline mr-2" />CANCEL ORDER</button>
          <button onClick={() => window.print()} className="w-full py-3 border border-gray-200 dark:border-gray-700 rounded-xl text-[10px] font-black uppercase tracking-widest"><Printer size={14} className="inline mr-2" />PRINT</button>
          {notice && <div className="text-center text-[9px] uppercase tracking-widest text-gray-400">{notice}</div>}
        </div>
      </div>
    </div>
  );
}
