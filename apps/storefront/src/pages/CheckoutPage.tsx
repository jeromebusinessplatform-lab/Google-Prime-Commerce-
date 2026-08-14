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
    const ocrKey = process.env.RECEIPT_OCR_API || '';
    setIsAnalyzing(true);
    setAnalysisError(null);
    try {
      if (!ocrKey) {
        throw new Error('OCR token is not configured');
      }

      const formData = new FormData();
      formData.append('apikey', ocrKey);
      formData.append('language', 'eng');
      formData.append('isOverlayRequired', 'false');
      formData.append('base64Image', imageBase64);

      const response = await fetch('https://api.ocr.space/parse/image', {
        method: 'POST',
        body: formData,
      });
      const payload = await response.json();
      const parsedText = payload?.ParsedResults?.[0]?.ParsedText || '';
      const responseError = payload?.ErrorMessage || payload?.ErrorDetails || null;
      const analysis = {
        provider: 'ocr.space',
        parsedText,
        confidence: payload?.ParsedResults?.[0]?.TextOverlay?.Lines?.length ? 'processed' : 'unknown',
        verified: Boolean(parsedText.trim()),
        raw: payload,
        analyzedAt: new Date().toISOString(),
      };
      setAnalysisResult(analysis);
      setAnalysisError(responseError || null);
      return analysis;
    } catch (error: any) {
      const message = error?.message || 'Receipt analysis failed';
      setAnalysisError(message);
      const fallback = {
        provider: 'ocr.space',
        verified: false,
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
        if (!proofAnalysis && !analysisError) return;
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
    <div className="bg-white dark:bg-gray-950 min-h-screen pb-40 transition-colors">
      {/* Checkout Header */}
      <div className="fixed top-0 left-0 right-0 h-[64px] bg-white dark:bg-gray-950 border-b border-gray-100 dark:border-gray-800 z-[100] flex items-center px-4 pt-[env(safe-area-inset-top,0px)] transition-colors">
        <button onClick={() => navigate('/cart')} className="p-2 -ml-2 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-full transition-all">
          <ChevronLeft size={24} />
        </button>
        <div className=" text-xs flex-1 text-center mr-6 flex items-center justify-center gap-2 uppercase tracking-tighter">
          <ShieldCheck size={18} className="text-black dark:text-white transition-colors" />
          Secure Checkout
        </div>
      </div>

      <div className="pt-[calc(64px+env(safe-area-inset-top,0px))] max-w-lg mx-auto p-4 md:p-6 space-y-8 animate-in fade-in duration-500">
        
        {/* Destination Section */}
        <section className="space-y-4">
          <h2 className="text-[10px]  uppercase tracking-widest text-gray-400 dark:text-gray-500 flex items-center gap-2 transition-colors">
            <MapPin size={12} /> 01. Destination
          </h2>
          
          <div className="relative group">
            <input 
              type="text" 
              placeholder="Search street, building, or village..." 
              value={addressSearch}
              onChange={e => setAddressSearch(e.target.value)}
              className="w-full border-2 border-gray-100 dark:border-gray-800 rounded-xl p-4 pr-12 text-sm  bg-gray-50 dark:bg-gray-800 focus:bg-white dark:focus:bg-gray-900 focus:border-black dark:focus:border-white outline-none transition-all shadow-inner"
            />
            {addressSearch && (
              <button
                onClick={() => { setAddressSearch(""); setSelectedAddress(null); setIsDroppingPin(false); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 dark:text-gray-600 hover:text-black dark:hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            )}
            {addressSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 bg-white dark:bg-gray-900 border-2 border-gray-100 dark:border-gray-800 mt-2 rounded-xl shadow-2xl z-[110] max-h-60 overflow-y-auto divide-y divide-gray-50 dark:divide-gray-900 transition-colors">
                {addressSuggestions.map((s, i) => (
                  <div 
                    key={i} 
                    className="p-4 text-xs  hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer flex items-center gap-3 transition-colors"
                    onClick={() => selectAddress(s)}
                  >
                    <MapPin size={14} className="text-gray-300 dark:text-gray-600" />
                    {s.properties?.formatted || s.formatted}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="w-full h-56 rounded-2xl overflow-hidden relative border-2 border-gray-100 bg-gray-100 shadow-inner group">
              <MapContainer 
                center={[selectedCoordinates.lat, selectedCoordinates.lng]}
                zoom={16} 
                style={{ height: '100%', width: '100%', zIndex: 0 }}
              >
                <TileLayer
                  attribution='&copy; OpenStreetMap contributors | Geoapify'
                  url="https://maps.geoapify.com/v1/tile/osm-carto/{z}/{x}/{y}.png?apiKey=6d0e711d72d74daeb2b0bfd2a5cdfd3a"
                />
                <Marker position={[selectedCoordinates.lat, selectedCoordinates.lng]} />
                <MapUpdater center={selectedCoordinates} />
                <LocationPicker 
                  isDroppingPin={isDroppingPin} 
                  onLocationSelect={(lat, lng) => { handleReverseGeocode(lat, lng); setIsDroppingPin(false); }} 
                />
              </MapContainer>
              
              {isDroppingPin && (
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center pointer-events-none z-10">
                   <div className="bg-black text-white px-4 py-2 rounded-full text-[10px]  uppercase tracking-widest shadow-2xl animate-bounce">
                      Tap map to drop pin
                   </div>
                </div>
              )}

              <div className="absolute bottom-4 left-4 right-4 flex gap-2 z-10">
                <button 
                  onClick={() => {
                    if (navigator.geolocation) {
                      navigator.geolocation.getCurrentPosition(async (pos) => {
                        handleReverseGeocode(pos.coords.latitude, pos.coords.longitude);
                      });
                    }
                  }}
                  className="flex-1 bg-white/90 backdrop-blur text-black border border-white/20 rounded-full py-2.5 text-[9px]  uppercase tracking-widest shadow-xl hover:bg-white transition-all flex items-center justify-center gap-2"
                >
                  <Navigation size={12} /> Use Current Location
                </button>
                <button 
                  onClick={() => setIsDroppingPin(!isDroppingPin)}
                  className={`flex-1 backdrop-blur rounded-full py-2.5 text-[9px]  uppercase tracking-widest shadow-xl transition-all flex items-center justify-center gap-2 border ${isDroppingPin ? 'bg-black text-white border-black' : 'bg-white/90 text-black border-white/20'}`}
                >
                  <MapPin size={12} /> Drop a Pin
                </button>
              </div>
          </div>

          {selectedAddress && !addressConfirmed && (
            <button 
              onClick={handleConfirmAddress}
              className="w-full py-4 bg-black text-white rounded-xl text-[10px]  uppercase tracking-[0.2em] shadow-xl shadow-black/10 animate-in zoom-in-95 duration-200"
            >
              Confirm Delivery Address
            </button>
          )}

          {addressConfirmed && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-500 space-y-4">
              <textarea 
                ref={unitRef}
                rows={2} 
                placeholder="Floor / Unit No. / Gate Instructions..." 
                value={unitInstructions}
                onChange={e => setUnitInstructions(e.target.value)}
                className="w-full border-2 border-gray-100 dark:border-gray-800 rounded-xl p-4 text-sm  bg-gray-50 dark:bg-gray-800 focus:bg-white dark:focus:bg-gray-900 focus:border-black dark:focus:border-white outline-none transition-all shadow-inner resize-none"
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
          <h2 className="text-[10px]  uppercase tracking-widest text-gray-400 dark:text-gray-500 flex items-center gap-2 transition-colors">
            <User size={12} /> 03. Receiver
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <input 
              type="text" 
              placeholder="Legal Name" 
              value={receiverName}
              onChange={e => setReceiverName(e.target.value)}
              className="w-full border-2 border-gray-100 dark:border-gray-800 rounded-xl p-4 text-sm  bg-gray-50 dark:bg-gray-800 focus:bg-white dark:focus:bg-gray-900 focus:border-black dark:focus:border-white outline-none transition-all shadow-inner"
            />
            <input 
              type="tel" 
              placeholder="Phone (09xx)" 
              value={receiverPhone}
              onChange={e => setReceiverPhone(e.target.value)}
              className="w-full border-2 border-gray-100 dark:border-gray-800 rounded-xl p-4 text-sm  bg-gray-50 dark:bg-gray-800 focus:bg-white dark:focus:bg-gray-900 focus:border-black dark:focus:border-white outline-none transition-all shadow-inner"
            />
          </div>
        </section>

        {/* Financial Summary */}
        <section className="space-y-4">
          {recoveredDraft && (
            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 p-4">
              <div className="text-[10px] uppercase tracking-widest text-gray-400 dark:text-gray-500">Recovered Draft</div>
              <div className="text-xs mt-1">{recoveredDraft.id}</div>
              <div className="text-[10px] uppercase tracking-widest text-gray-400 dark:text-gray-500 mt-1">
                Status: {recoveredDraft.status}
              </div>
            </div>
          )}
          <h2 className="text-[10px]  uppercase tracking-widest text-gray-400 dark:text-gray-500 flex items-center gap-2 transition-colors">
            <CreditCard size={12} /> 04. Financial Settlement
          </h2>

          <div className="bg-gray-50 dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-800 rounded-2xl p-6 space-y-4 transition-colors">
             <div className="space-y-2 pb-4 border-b border-gray-200 dark:border-gray-800 transition-colors">
               <div className="flex justify-between items-center text-xs  text-gray-500 dark:text-gray-400 transition-colors">
                  <span>Merchandise Subtotal</span>
                  <span>₱{subtotal.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
               </div>
               <div className="flex justify-between items-center text-xs  text-gray-500 dark:text-gray-400 transition-colors">
                  <span>VAT (12% Included)</span>
                  <span>₱{tax.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
               </div>
               <div className="flex justify-between items-center text-xs  text-gray-500 dark:text-gray-400 transition-colors">
                  <span>Road Delivery Fee</span>
                  <span>₱{deliveryFee.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
               </div>
               {discount > 0 && (
                 <div className="flex justify-between items-center text-xs  text-green-600 uppercase tracking-tighter">
                    <span>Promotion ({appliedPromo?.code})</span>
                    <span>-₱{discount.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                 </div>
               )}
             </div>

             <div className="space-y-3">
               <div className="flex justify-between items-center">
                  <div>
                    <div className="text-[8px]  uppercase tracking-widest text-gray-400 dark:text-gray-500 transition-colors">Due at Checkout</div>
                    <div className="text-lg  uppercase tracking-tighter text-black dark:text-white transition-colors">₱{amountDueNow.toLocaleString(undefined, {minimumFractionDigits: 2})}</div>
                  </div>
                  {amountDueOnDelivery > 0 && (
                    <div className="text-right">
                      <div className="text-[8px]  uppercase tracking-widest text-gray-400 dark:text-gray-500 transition-colors">Due at Doorstep</div>
                      <div className="text-lg  uppercase tracking-tighter text-gray-400 dark:text-gray-500 transition-colors">₱{amountDueOnDelivery.toLocaleString(undefined, {minimumFractionDigits: 2})}</div>
                    </div>
                  )}
               </div>
             </div>
          </div>

          {paymentTiming === 'checkout' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
               <h3 className="text-[10px]  uppercase tracking-widest text-gray-400 dark:text-gray-500 flex items-center gap-2 transition-colors">
                 <ShieldCheck size={12} /> 05. Receipt Analysis
               </h3>
               <div className="relative">
                 <input 
                   type="file" 
                   accept="image/*" 
                   onChange={handleReceiptUpload}
                   className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                 />
                 <div className={`border-2 border-dashed rounded-2xl p-8 transition-all flex flex-col items-center justify-center gap-3 ${receiptImage ? 'border-black bg-black/5' : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
                   {receiptImage ? (
                     <>
                        <img src={receiptImage} className="w-20 h-20 object-cover rounded-xl shadow-lg border-2 border-white dark:border-gray-900 transition-colors" />
                        <div className="text-center">
                          <div className="text-[10px]  uppercase tracking-widest text-black dark:text-white transition-colors">Receipt Captured</div>
                          <div className="text-[8px]  text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-1 transition-colors">Ready for AI Validation</div>
                        </div>
                     </>
                   ) : (
                     <>
                        <div className="p-3 bg-white dark:bg-gray-900 rounded-full shadow-lg border border-gray-100 dark:border-gray-800 transition-colors">
                          <Wallet className="text-gray-400 dark:text-gray-500" size={24} />
                        </div>
                        <div className="text-center">
                           <div className="text-[10px]  uppercase tracking-widest text-black dark:text-white transition-colors">Upload Proof of Payment</div>
                           <div className="text-[8px]  text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-1 transition-colors">Screenshots of GCash/Bank Transfer</div>
                        </div>
                     </>
                   )}
                 </div>
               </div>
               {receiptImage && (
                 <div className="space-y-2">
                   <button
                     type="button"
                     onClick={() => runReceiptAnalysis(receiptImage)}
                     disabled={isAnalyzing}
                     className="w-full rounded-xl border border-black bg-black text-white py-3 text-[10px] uppercase tracking-widest disabled:opacity-50"
                   >
                     {isAnalyzing ? 'ANALYZING RECEIPT...' : 'Analyze Receipt'}
                   </button>
                   <div className="text-[8px] uppercase tracking-widest text-gray-400 dark:text-gray-500">
                     {analysisResult?.verified === true
                       ? 'OCR completed. Submission can proceed.'
                       : analysisError
                         ? `OCR attempted. ${analysisError}`
                         : 'Run receipt analysis before submitting.'}
                   </div>
                 </div>
               )}
            </div>
          )}
        </section>

      </div>

      {/* Floating Action Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl border-t border-gray-100 dark:border-gray-800 z-[100] pb-[calc(16px+env(safe-area-inset-bottom,0px))] transition-colors">
        <div className="max-w-lg mx-auto flex gap-3">
           <div className="flex-1">
             <div className="text-[8px]  text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-0.5 transition-colors">Grand Total</div>
             <div className="text-xl  tracking-tighter">₱{totalOrderValue.toLocaleString(undefined, {minimumFractionDigits: 2})}</div>
           </div>
           <button 
           disabled={!selectedQuote || !paymentTiming || !receiverName || !receiverPhone || (paymentTiming === 'checkout' && !receiptImage) || isPlacing || (paymentTiming === 'checkout' && receiptImage && !analysisResult && !analysisError)}
            onClick={handlePlaceOrder}
            className="px-10 bg-black text-white rounded-xl text-[10px]  uppercase tracking-widest hover:bg-gray-800 disabled:bg-gray-200 disabled:text-gray-400 transition-all shadow-2xl shadow-black/20"
          >
            {isPlacing ? 'PLACING ORDER...' : (isAnalyzing ? 'ANALYZING RECEIPT...' : 'Authorize Payment')}
          </button>
        </div>
      </div>
    </div>
  );
}
