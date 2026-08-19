import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, MapPin, User, Tag, ShieldCheck, X, Navigation, CreditCard, Wallet, Truck, Clock, Info, CheckCircle2 } from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { CourierSelector } from '../components/CourierSelector';

// Fix for default Leaflet icon issue in React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function LocationPicker({ isDroppingPin, onLocationSelect }: { isDroppingPin: boolean, onLocationSelect: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      if (isDroppingPin) {
        onLocationSelect(e.latlng.lat, e.latlng.lng);
      }
    }
  });
  return null;
}

function MapUpdater({ center }: { center: {lat: number, lng: number} }) {
  const map = useMap();
  useEffect(() => {
    map.setView([center.lat, center.lng]);
  }, [center, map]);
  return null;
}

export function CheckoutPage() {
  const navigate = useNavigate();
  const [cart, setCart] = useState<any>(null);
  const [session, setSession] = useState<any>(null);
  const [paymentDraftId, setPaymentDraftId] = useState<string | null>(null);
  const [recoveredDraft, setRecoveredDraft] = useState<any | null>(null);
  
  // Form fields
  const [addressSearch, setAddressSearch] = useState("");
  const [addressSuggestions, setAddressSuggestions] = useState<any[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<any>(null);
  const [addressConfirmed, setAddressConfirmed] = useState(false);
  const [unitInstructions, setUnitInstructions] = useState("");
  
  const [selectedCoordinates, setSelectedCoordinates] = useState<{lat: number, lng: number}>({ lat: 14.5995, lng: 120.9842 });
  const [isDroppingPin, setIsDroppingPin] = useState(false);
  const unitRef = useRef<HTMLTextAreaElement>(null);

  const [receiverName, setReceiverName] = useState("");
  const [receiverPhone, setReceiverPhone] = useState("");
  
  const [promoCode, setPromoCode] = useState("");
  const [referralCode, setReferralCode] = useState("");

  const [paymentMethod, setPaymentMethod] = useState<'card' | 'wallet'>('card');
  const [deliveryQuotes, setDeliveryQuotes] = useState<any[]>([]);
  const [selectedQuote, setSelectedQuote] = useState<any>(null);
  const [isQuoting, setIsQuoting] = useState(false);
  const [paymentTiming, setPaymentTiming] = useState<'checkout' | 'delivery' | null>(null);

  // Define payment options UI before proof upload
  const PaymentOptions = () => (
    <div className="space-y-2">
      <h3 className="text-[10px] uppercase tracking-widest text-gray-400 dark:text-gray-500 transition-colors">Payment Method</h3>
      <div className="grid grid-cols-2 gap-2">
        <button 
          onClick={() => setPaymentMethod('card')}
          className={`p-3 border rounded-lg text-center transition-all ${paymentMethod === 'card' ? 'border-black bg-gray-50 dark:bg-gray-800' : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700'}`}
        >
          <CreditCard className="mx-auto mb-1" size={16} />
          <span className="text-[9px] uppercase tracking-widest block">Card</span>
        </button>
        <button 
          onClick={() => setPaymentMethod('wallet')}
          className={`p-3 border rounded-lg text-center transition-all ${paymentMethod === 'wallet' ? 'border-black bg-gray-50 dark:bg-gray-800' : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700'}`}
        >
          <Wallet className="mx-auto mb-1" size={16} />
          <span className="text-[9px] uppercase tracking-widest block">Wallet</span>
        </button>
      </div>
    </div>
  );

  useEffect(() => {
    fetch('/v1/cart')
      .then(r => r.json())
      .then(d => setCart(d.data || { items: [] }));
  }, []);

  useEffect(() => {
    fetch('/v1/checkout/drafts')
      .then(r => r.json())
      .then(d => {
        const drafts = d.data || [];
        if (drafts.length > 0) {
          const latest = drafts[0];
          setRecoveredDraft(latest);
          setPaymentDraftId(latest.id);
          if (latest.provider === 'wallet') {
            setPaymentMethod('wallet');
          }
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (cart) {
      fetch('/v1/checkout/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart.items || [],
          paymentDraftId,
          paymentMethod,
          selectedQuote,
          selectedItemIds: (cart.items || []).map((item: any) => item.id),
          amountDueNow: 0,
          totals: { subtotal: 0, deliveryFee: 0, discount: 0, total: 0 }
        })
      })
        .then(r => r.json())
        .then(d => {
          setSession(d.data);
          if (d.data?.paymentDraftId) setPaymentDraftId(d.data.paymentDraftId);
        });
    }
  }, [cart, paymentDraftId, paymentMethod, selectedQuote]);

  // Geoapify Autocomplete via Proxy
  useEffect(() => {
    if (addressSearch.length > 2) {
      if (selectedAddress) {
        const selectedStr = selectedAddress.properties?.formatted || selectedAddress.formatted || '';
        if (addressSearch === selectedStr) {
          setAddressSuggestions([]);
          return;
        }
      }
      
      const delay = setTimeout(() => {
        fetch('/v1/geo/autocomplete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: addressSearch, proximity: selectedCoordinates })
        })
          .then(r => r.json())
          .then(d => setAddressSuggestions(d.data || []));
      }, 300);
      return () => clearTimeout(delay);
    } else {
      setAddressSuggestions([]);
    }
  }, [addressSearch, selectedAddress]);

  const [quoteError, setQuoteError] = useState('');

  // Delivery Quoting
  useEffect(() => {
    if (addressConfirmed && selectedCoordinates) {
      setIsQuoting(true);
      setQuoteError('');
      fetch('/v1/delivery-quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          destinationLat: selectedCoordinates.lat, 
          destinationLng: selectedCoordinates.lng,
          paymentTiming 
        })
      })
        .then(r => {
          if (!r.ok) return r.json().then(d => { throw new Error(d.error || 'Failed to fetch quotes'); });
          return r.json();
        })
        .then(d => {
          setDeliveryQuotes(d.data || []);
          setIsQuoting(false);
        })
        .catch(err => {
          console.error(err);
          setQuoteError(err.message);
          setIsQuoting(false);
        });
    }
  }, [selectedCoordinates, addressConfirmed, paymentTiming]);

  const selectAddress = (suggestion: any) => {
    const props = suggestion.properties || suggestion;
    setSelectedAddress(suggestion);
    setAddressSearch(props.formatted);
    setAddressSuggestions([]);
    setAddressConfirmed(false); // Reset confirmation on change

    const lat = props.lat;
    const lng = props.lon || props.lng;
    if (lat && lng) {
      setSelectedCoordinates({ lat: Number(lat), lng: Number(lng) });
    }
  };

  const handleConfirmAddress = () => {
    setAddressConfirmed(true);
    setTimeout(() => {
      unitRef.current?.focus();
    }, 100);
  };

  const handleReverseGeocode = async (lat: number, lng: number) => {
    try {
      const res = await fetch('/v1/geo/reverse-geocode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat, lng })
      });
      const data = await res.json();
      if (data.data) {
        selectAddress(data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const [appliedPromo, setAppliedPromo] = useState<any>(null);
  const [promoError, setPromoError] = useState('');
  const [isPlacing, setIsPlacing] = useState(false);
  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  if (!session || !session.id) return <div className="p-8 text-center mt-10  uppercase tracking-tighter animate-pulse">Initializing Prime Checkout...</div>;

  const items = cart?.items || [];
  const subtotal = items.reduce((acc: number, i: any) => acc + (i.price * i.quantity), 0);
  const tax = subtotal * 0.12; 
  const deliveryFee = selectedQuote ? selectedQuote.totalMinor / 100 : 0;
  
  const handleApplyPromo = async () => {
    if (!promoCode) return;
    setPromoError('');
    try {
      const res = await fetch('/v1/promotions/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: promoCode })
      });
      const data = await res.json();
      if (res.ok) {
        setAppliedPromo(data.data);
      } else {
        setPromoError(data.error || 'Invalid promo code');
        setAppliedPromo(null);
      }
    } catch (e) {
      setPromoError('Failed to validate promo code');
    }
  };

  let discount = 0;
  if (appliedPromo) {
    if (appliedPromo.type === 'percentage') {
      discount = subtotal * (appliedPromo.value / 100);
    } else if (appliedPromo.type === 'fixed') {
      discount = appliedPromo.value;
    } else if (appliedPromo.type === 'freeship') {
      discount = deliveryFee;
    }
  }

  const amountDueNow = Math.max(0, subtotal + tax + (paymentTiming === 'checkout' ? deliveryFee : 0) - discount);
  const amountDueOnDelivery = paymentTiming === 'delivery' ? deliveryFee : 0;
  const totalOrderValue = subtotal + tax + deliveryFee - discount;

  const handleReceiptUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setReceiptImage(reader.result as string);
        setAnalysisResult(null);
        setAnalysisError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const runReceiptAnalysis = async (imageBase64: string) => {
    setIsAnalyzing(true);
    setAnalysisError(null);
    try {
      const response = await fetch('/v1/checkout/drafts/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64 }),
      });
      const payload = await response.json();
      if (!response.ok || !payload?.data) {
        throw new Error(payload?.error || 'Receipt analysis failed');
      }
      setAnalysisResult(payload.data);
      setAnalysisError(payload.data?.error || null);
      return payload.data;
    } catch (error: any) {
      const message = error?.message || 'Receipt analysis failed';
      setAnalysisError(message);
      const fallback = {
        provider: 'server-proxy',
        verified: false,
        verdict: 'UNVALIDATED',
        error: message,
        analyzedAt: new Date().toISOString(),
      };
      setAnalysisResult(fallback);
      return fallback;
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!items.length || !selectedQuote || !paymentTiming) return;
    setIsPlacing(true);
    try {
      let proofAnalysis = analysisResult;
      let proofRecord: any = null;
      if (receiptImage && paymentTiming === 'checkout') {
        if (!proofAnalysis) proofAnalysis = await runReceiptAnalysis(receiptImage);
        const proofRes = await fetch(`/v1/checkout/drafts/${paymentDraftId}/proofs`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64: receiptImage, source: 'customer', analysis: proofAnalysis })
        });
        proofRecord = await proofRes.json();
      }

      const res = await fetch('/v1/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items,
          receiverName,
          receiverPhone,
          paymentMethod: paymentMethod === 'wallet' ? 'GCASH/MAYA' : 'CARD',
          paymentTiming,
          paymentDraftId,
          checkoutSessionId: session.id,
          proofId: proofRecord?.data?.id || null,
          receipt: receiptImage ? { imageUrl: receiptImage, analysis: proofAnalysis || analysisResult } : null,
          selectedQuoteId: selectedQuote.id,
          address: selectedAddress ? (selectedAddress.properties?.formatted || selectedAddress.formatted) : addressSearch,
          lat: selectedCoordinates.lat,
          lng: selectedCoordinates.lng,
          floorUnit: unitInstructions,
          totals: { subtotal, tax, deliveryFee, total: totalOrderValue, amountDueNow, amountDueOnDelivery }
        })
      });
      const data = await res.json();
      const orderId = data.data.id;

      navigate(`/orders/${orderId}`);
      window.dispatchEvent(new CustomEvent('cart-updated'));
    } catch (e) {
      console.error(e);
    } finally {
      setIsPlacing(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-950 min-h-screen pb-40 transition-colors text-prime-text dark:text-gray-100">
      {/* Checkout Header */}
      <div className="fixed top-0 left-0 right-0 h-[64px] bg-white dark:bg-gray-950 border-b border-prime-gray-200 z-[100] flex items-center px-4 pt-[env(safe-area-inset-top,0px)]">
        <button onClick={() => navigate('/cart')} className="p-2 -ml-2 text-prime-text hover:bg-prime-gray-100 rounded-full transition-all">
          <ChevronLeft size={24} />
        </button>
        <div className="text-xs font-bold uppercase tracking-widest flex-1 text-center mr-6 flex items-center justify-center gap-2">
          <ShieldCheck size={18} />
          Secure Checkout
        </div>
      </div>

      <div className="pt-[calc(64px+env(safe-area-inset-top,0px))] max-w-lg mx-auto p-4 md:p-6 space-y-8">
        
        {/* Destination Section */}
        <section className="space-y-4">
          <h2 className="text-[11px] font-bold uppercase tracking-widest text-prime-gray-500 flex items-center gap-2">
            <MapPin size={14} /> 01. Destination
          </h2>
          
          <div className="relative group">
            <input 
              type="text" 
              placeholder="Search street, building, or village..." 
              value={addressSearch}
              onChange={e => setAddressSearch(e.target.value)}
              className="w-full border-2 border-prime-gray-200 rounded-lg p-4 text-sm bg-prime-gray-50 focus:bg-white focus:border-prime-text outline-none transition-all"
            />
            {addressSearch && (
              <button
                onClick={() => { setAddressSearch(""); setSelectedAddress(null); setIsDroppingPin(false); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-prime-gray-500 hover:text-prime-text"
              >
                <X size={18} />
              </button>
            )}
            {addressSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 bg-white border-2 border-prime-gray-200 mt-1 rounded-lg shadow-xl z-[110] max-h-60 overflow-y-auto divide-y divide-prime-gray-100">
                {addressSuggestions.map((s, i) => (
                  <div 
                    key={i} 
                    className="p-4 text-xs font-bold hover:bg-prime-gray-100 cursor-pointer flex items-center gap-3"
                    onClick={() => selectAddress(s)}
                  >
                    <MapPin size={14} className="text-prime-gray-500" />
                    {s.properties?.formatted || s.formatted}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="w-full h-56 rounded-lg overflow-hidden relative border border-prime-gray-200">
              <MapContainer 
                center={[selectedCoordinates.lat, selectedCoordinates.lng]}
                zoom={16} 
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  url="https://maps.geoapify.com/v1/tile/osm-carto/{z}/{x}/{y}.png?apiKey=6d0e711d72d74daeb2b0bfd2a5cdfd3a"
                />
                <Marker position={[selectedCoordinates.lat, selectedCoordinates.lng]} />
                <MapUpdater center={selectedCoordinates} />
                <LocationPicker 
                  isDroppingPin={isDroppingPin} 
                  onLocationSelect={(lat, lng) => { handleReverseGeocode(lat, lng); setIsDroppingPin(false); }} 
                />
              </MapContainer>
              
              <div className="absolute bottom-4 left-4 right-4 flex gap-2 z-10">
                <button 
                  onClick={() => {
                    if (navigator.geolocation) {
                      navigator.geolocation.getCurrentPosition(async (pos) => {
                        handleReverseGeocode(pos.coords.latitude, pos.coords.longitude);
                      });
                    }
                  }}
                  className="flex-1 bg-white text-prime-text border border-prime-gray-200 rounded-lg py-3 text-[10px] font-bold uppercase tracking-widest shadow-md hover:bg-prime-gray-100 flex items-center justify-center gap-2"
                >
                  <Navigation size={14} /> Current Location
                </button>
                <button 
                  onClick={() => setIsDroppingPin(!isDroppingPin)}
                  className={`flex-1 rounded-lg py-3 text-[10px] font-bold uppercase tracking-widest shadow-md flex items-center justify-center gap-2 border ${isDroppingPin ? 'bg-prime-text text-white border-prime-text' : 'bg-white text-prime-text border-prime-gray-200'}`}
                >
                  <MapPin size={14} /> Drop Pin
                </button>
              </div>
          </div>

          {selectedAddress && !addressConfirmed && (
            <button 
              onClick={handleConfirmAddress}
              className="w-full py-4 bg-prime-text text-white rounded-lg text-xs font-bold uppercase tracking-widest shadow-lg"
            >
              Confirm Delivery Address
            </button>
          )}

          {addressConfirmed && (
            <div className="space-y-4">
              <textarea 
                ref={unitRef}
                rows={2} 
                placeholder="Floor / Unit No. / Gate Instructions..." 
                value={unitInstructions}
                onChange={e => setUnitInstructions(e.target.value)}
                className="w-full border border-prime-gray-200 rounded-lg p-4 text-sm bg-prime-gray-50 focus:border-prime-text outline-none transition-all resize-none"
              />
            </div>
          )}
        </section>

        {/* Courier Section */}
        <CourierSelector 
          quotes={deliveryQuotes}
          selectedQuote={selectedQuote}
          onSelect={setSelectedQuote}
          isQuoting={isQuoting}
          paymentTiming={paymentTiming}
          onPaymentTimingSelect={setPaymentTiming}
          error={quoteError}
          addressSelected={!!selectedAddress}
          addressConfirmed={addressConfirmed}
        />

        {/* Contact Section */}
        <section className="space-y-4">
          <h2 className="text-[11px] font-bold uppercase tracking-widest text-prime-gray-500 flex items-center gap-2">
            <User size={14} /> 03. Receiver
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <input 
              type="text" 
              placeholder="Name" 
              value={receiverName}
              onChange={e => setReceiverName(e.target.value)}
              className="w-full border border-prime-gray-200 rounded-lg p-4 text-sm bg-prime-gray-50 focus:border-prime-text outline-none"
            />
            <input 
              type="tel" 
              placeholder="Phone (09xx)" 
              value={receiverPhone}
              onChange={e => setReceiverPhone(e.target.value)}
              className="w-full border border-prime-gray-200 rounded-lg p-4 text-sm bg-prime-gray-50 focus:border-prime-text outline-none"
            />
          </div>
        </section>

        {/* Financial Summary */}
        <section className="space-y-4">
          <h2 className="text-[11px] font-bold uppercase tracking-widest text-prime-gray-500 flex items-center gap-2">
            <CreditCard size={14} /> 04. Financial Settlement
          </h2>

          <div className="bg-prime-gray-50 border border-prime-gray-200 rounded-lg p-6 space-y-4">
             <div className="space-y-3 pb-4 border-b border-prime-gray-200">
               <div className="flex justify-between items-center text-xs text-prime-gray-500">
                  <span>Subtotal</span>
                  <span className="font-bold text-prime-text">₱{subtotal.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
               </div>
               <div className="flex justify-between items-center text-xs text-prime-gray-500">
                  <span>VAT (12%)</span>
                  <span className="font-bold text-prime-text">₱{tax.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
               </div>
               <div className="flex justify-between items-center text-xs text-prime-gray-500">
                  <span>Delivery Fee</span>
                  <span className="font-bold text-prime-text">₱{deliveryFee.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
               </div>
               {discount > 0 && (
                 <div className="flex justify-between items-center text-xs font-bold text-prime-red">
                    <span>Promo ({appliedPromo?.code})</span>
                    <span>-₱{discount.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                 </div>
               )}
             </div>

             <div className="flex justify-between items-center">
                <div>
                  <div className="text-[9px] font-bold uppercase tracking-widest text-prime-gray-500">Due Now</div>
                  <div className="text-lg font-bold">₱{amountDueNow.toLocaleString(undefined, {minimumFractionDigits: 2})}</div>
                </div>
                {amountDueOnDelivery > 0 && (
                  <div className="text-right">
                    <div className="text-[9px] font-bold uppercase tracking-widest text-prime-gray-500">Due Later</div>
                    <div className="text-lg font-bold text-prime-gray-500">₱{amountDueOnDelivery.toLocaleString(undefined, {minimumFractionDigits: 2})}</div>
                  </div>
                )}
             </div>
          </div>

          {paymentTiming === 'checkout' && (
            <div className="space-y-4">
               <h3 className="text-[11px] font-bold uppercase tracking-widest text-prime-gray-500 flex items-center gap-2">
                 <ShieldCheck size={14} /> 05. Proof of Payment
               </h3>
               <div className="relative">
                 <input 
                   type="file" 
                   accept="image/*" 
                   onChange={handleReceiptUpload}
                   className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                 />
                 <div className={`border-2 border-dashed rounded-lg p-6 transition-all flex flex-col items-center justify-center gap-2 ${receiptImage ? 'border-prime-text bg-prime-gray-50' : 'border-prime-gray-200 bg-white hover:bg-prime-gray-50'}`}>
                   {receiptImage ? (
                     <>
                        <img src={receiptImage} className="w-16 h-16 object-cover rounded-lg shadow" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-prime-text">Receipt Attached</span>
                     </>
                   ) : (
                     <>
                        <Wallet className="text-prime-gray-400" size={24} />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-prime-gray-500">Attach Proof</span>
                     </>
                   )}
                 </div>
               </div>
               {receiptImage && (
                 <button
                   type="button"
                   onClick={() => runReceiptAnalysis(receiptImage)}
                   disabled={isAnalyzing}
                   className="w-full rounded-lg bg-prime-gray-200 text-prime-text py-3 text-[10px] font-bold uppercase tracking-widest disabled:opacity-50"
                 >
                   {isAnalyzing ? 'ANALYZING...' : 'Verify Receipt'}
                 </button>
               )}
            </div>
          )}
        </section>

      </div>

      {/* Floating Action Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-prime-gray-200 z-[100] pb-[env(safe-area-inset-bottom,0px)]">
        <div className="max-w-lg mx-auto flex gap-3 items-center">
           <div className="flex-1">
             <div className="text-[9px] font-bold uppercase tracking-widest text-prime-gray-500">Total</div>
             <div className="text-xl font-bold">₱{totalOrderValue.toLocaleString(undefined, {minimumFractionDigits: 2})}</div>
           </div>
           <button 
           disabled={!selectedQuote || !paymentTiming || !receiverName || !receiverPhone || (paymentTiming === 'checkout' && !receiptImage) || isPlacing}
            onClick={handlePlaceOrder}
            className="flex-1 bg-prime-text text-white font-bold py-4 rounded-lg text-xs uppercase tracking-widest hover:bg-gray-800 disabled:bg-prime-gray-200 transition-all"
          >
            {isPlacing ? 'PLACING ORDER...' : 'Pay & Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
}
