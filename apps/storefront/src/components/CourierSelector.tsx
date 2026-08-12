import React from 'react';
import { Truck, CheckCircle2 } from 'lucide-react';

interface DeliveryQuote {
  id: string;
  courierId: string;
  courierName: string;
  logoUrl: string;
  totalMinor: number;
  status: 'active' | 'unavailable';
  route: {
    distanceMeters: number;
    durationSeconds: number;
  };
}

interface CourierSelectorProps {
  quotes: DeliveryQuote[];
  selectedQuote: DeliveryQuote | null;
  onSelect: (quote: DeliveryQuote) => void;
  isQuoting: boolean;
  paymentTiming: 'checkout' | 'delivery' | null;
  onPaymentTimingSelect: (timing: 'checkout' | 'delivery') => void;
  error?: string;
  addressSelected?: boolean;
  addressConfirmed?: boolean;
}

export function CourierSelector({ 
  quotes, 
  selectedQuote, 
  onSelect, 
  isQuoting,
  paymentTiming,
  onPaymentTimingSelect,
  error,
  addressSelected,
  addressConfirmed
}: CourierSelectorProps) {
  return (
    <section className="space-y-4">
      <h2 className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
        <Truck size={12} /> 02. Delivery Fleet
      </h2>

      <div className="grid grid-cols-4 gap-2">
        {quotes.map((quote) => {
          const isUnavailable = quote.status === 'unavailable';
          return (
            <button
              key={quote.courierId}
              disabled={isUnavailable}
              onClick={() => onSelect(quote)}
              className={`relative py-4 rounded-xl border-2 flex flex-col items-center justify-center overflow-hidden transition-all ${
                isUnavailable ? 'opacity-40 grayscale cursor-not-allowed border-gray-100 bg-gray-50' :
                selectedQuote?.courierId === quote.courierId ? 'border-black bg-gray-50 shadow-lg scale-[1.02]' : 'border-gray-100 bg-white hover:border-gray-300'
              }`}
            >
              <div className="absolute inset-0 opacity-10 p-3">
                <img src={quote.logoUrl} className="w-full h-full object-contain" />
              </div>
              <div className="relative z-10 flex flex-col items-center">
                <div className="font-black text-[14px] tracking-tighter leading-none mb-0.5">
                  {isUnavailable ? 'OFFLINE' : `₱${(quote.totalMinor / 100).toFixed(0)}`}
                </div>
                {!isUnavailable && (
                   <div className="text-[7px] font-black uppercase tracking-tighter text-gray-400">
                      {quote.courierName.split(' ')[0]}
                   </div>
                )}
              </div>
              {selectedQuote?.courierId === quote.courierId && (
                 <div className="absolute top-1 right-1 text-black">
                    <CheckCircle2 size={10} fill="currentColor" className="text-white bg-black rounded-full" />
                 </div>
              )}
            </button>
          );
        })}
        {isQuoting && (
          <div className="col-span-4 py-8 text-center text-[10px] font-black uppercase tracking-[0.2em] text-gray-300 animate-pulse">Calculating Road Route...</div>
        )}
        {error && (
          <div className="col-span-4 p-4 bg-red-50 border-2 border-red-100 rounded-xl text-red-600 text-center">
             <div className="text-[10px] font-black uppercase tracking-widest">{error}</div>
          </div>
        )}
        {!isQuoting && !error && quotes.length === 0 && (
          <div className="col-span-4 p-8 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 text-center">
             <Truck className="mx-auto text-gray-300 mb-2" size={24} />
             <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">
               {addressSelected && !addressConfirmed ? 'Confirm address above to view rates' : 'Select address to view rates'}
             </p>
          </div>
        )}
      </div>

      {selectedQuote && (
        <div className="animate-in fade-in slide-in-from-top-2 duration-300 space-y-4">
           <div className="p-4 bg-gray-900 rounded-xl text-white flex justify-between items-center shadow-xl shadow-black/10">
              <div>
                <div className="text-[8px] font-black uppercase tracking-widest text-gray-400">Selected Fleet</div>
                <div className="text-sm font-black uppercase tracking-tighter">{selectedQuote.courierName}</div>
              </div>
              <div className="text-right">
                <div className="text-[8px] font-black uppercase tracking-widest text-gray-400">Road Distance</div>
                <div className="text-sm font-black uppercase tracking-tighter">{(selectedQuote.route.distanceMeters / 1000).toFixed(1)} KM</div>
              </div>
           </div>

           {/* Payment Timing Prompt */}
           <div className="bg-gray-50 border-2 border-gray-100 rounded-xl p-4 relative overflow-hidden">
              {!paymentTiming && (
                <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px] z-10 flex items-center justify-center">
                   <div className="bg-black text-white px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest animate-pulse">Action Required</div>
                </div>
              )}
              <div className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3 text-center">Delivery Fee Settlement</div>
              <div className="flex gap-2 relative z-20">
                <button 
                  onClick={() => onPaymentTimingSelect('checkout')}
                  className={`flex-1 py-3 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all border-2 ${paymentTiming === 'checkout' ? 'bg-black text-white border-black' : 'bg-white text-gray-400 border-gray-100 hover:border-gray-200'}`}
                >
                  Pay at Checkout
                </button>
                <button 
                  onClick={() => onPaymentTimingSelect('delivery')}
                  className={`flex-1 py-3 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all border-2 ${paymentTiming === 'delivery' ? 'bg-black text-white border-black' : 'bg-white text-gray-400 border-gray-100 hover:border-gray-200'}`}
                >
                  Pay on Delivery
                </button>
              </div>
           </div>
        </div>
      )}
    </section>
  );
}
