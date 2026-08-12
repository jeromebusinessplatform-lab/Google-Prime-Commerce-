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

  useEffect(() => {
    fetch('/v1/cart')
      .then(r => r.json())
      .then(d => setCart(d.data || { items: [] }));
  }, []);

  useEffect(() => {
    if (cart) {
      fetch('/v1/checkout/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: cart.items || [] })
      })
        .then(r => r.json())
        .then(d => setSession(d.data));
    }
  }, [cart]);

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

  // Delivery Quoting
  useEffect(() => {
    if (addressConfirmed && selectedCoordinates) {
      setIsQuoting(true);
      fetch('/v1/delivery-quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          destinationLat: selectedCoordinates.lat, 
          destinationLng: selectedCoordinates.lng,
          paymentTiming 
        })
      })
        .then(r => r.json())
        .then(d => {
          setDeliveryQuotes(d.data || []);
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

  if (!session) return <div className="p-8 text-center mt-10 font-black italic uppercase tracking-tighter animate-pulse">Initializing Prime Checkout...</div>;

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

  const handlePlaceOrder = async () => {
    if (!items.length || !selectedQuote || !paymentTiming) return;
    try {
      const res = await fetch('/v1/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items,
          receiverName,
          receiverPhone,
          paymentMethod,
          paymentTiming,
          selectedQuoteId: selectedQuote.id,
          address: selectedAddress ? (selectedAddress.properties?.formatted || selectedAddress.formatted) : addressSearch,
          lat: selectedCoordinates.lat,
          lng: selectedCoordinates.lng,
          floorUnit: unitInstructions,
          totals: { subtotal, tax, deliveryFee, total: totalOrderValue, amountDueNow, amountDueOnDelivery }
        })
      });
      const data = await res.json();
      navigate(`/orders/${data.data.id}`);
      window.dispatchEvent(new CustomEvent('cart-updated'));
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="bg-white min-h-screen pb-40">
      {/* Checkout Header */}
      <div className="fixed top-0 left-0 right-0 h-[64px] bg-white border-b border-gray-100 z-[100] flex items-center px-4 pt-[env(safe-area-inset-top,0px)]">
        <button onClick={() => navigate('/cart')} className="p-2 -ml-2 text-gray-900 hover:bg-gray-50 rounded-full transition-all">
          <ChevronLeft size={24} />
        </button>
        <div className="font-black text-xs flex-1 text-center mr-6 flex items-center justify-center gap-2 italic uppercase tracking-tighter">
          <ShieldCheck size={18} className="text-black" />
          Secure Checkout
        </div>
      </div>

      <div className="pt-[calc(64px+env(safe-area-inset-top,0px))] max-w-lg mx-auto p-4 md:p-6 space-y-8 animate-in fade-in duration-500">
        
        {/* Destination Section */}
        <section className="space-y-4">
          <h2 className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
            <MapPin size={12} /> 01. Destination
          </h2>
          
          <div className="relative group">
            <input 
              type="text" 
              placeholder="Search street, building, or village..." 
              value={addressSearch}
              onChange={e => setAddressSearch(e.target.value)}
              className="w-full border-2 border-gray-100 rounded-xl p-4 pr-12 text-sm font-bold bg-gray-50 focus:bg-white focus:border-black outline-none transition-all shadow-inner"
            />
            {addressSearch && (
              <button
                onClick={() => { setAddressSearch(""); setSelectedAddress(null); setIsDroppingPin(false); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 hover:text-black"
              >
                <X size={18} />
              </button>
            )}
            {addressSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 bg-white border-2 border-gray-100 mt-2 rounded-xl shadow-2xl z-[110] max-h-60 overflow-y-auto divide-y divide-gray-50">
                {addressSuggestions.map((s, i) => (
                  <div 
                    key={i} 
                    className="p-4 text-xs font-bold hover:bg-gray-50 cursor-pointer flex items-center gap-3"
                    onClick={() => selectAddress(s)}
                  >
                    <MapPin size={14} className="text-gray-300" />
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
                   <div className="bg-black text-white px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest shadow-2xl animate-bounce">
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
                  className="flex-1 bg-white/90 backdrop-blur text-black border border-white/20 rounded-full py-2.5 text-[9px] font-black uppercase tracking-widest shadow-xl hover:bg-white transition-all flex items-center justify-center gap-2"
                >
                  <Navigation size={12} /> Use Current Location
                </button>
                <button 
                  onClick={() => setIsDroppingPin(!isDroppingPin)}
                  className={`flex-1 backdrop-blur rounded-full py-2.5 text-[9px] font-black uppercase tracking-widest shadow-xl transition-all flex items-center justify-center gap-2 border ${isDroppingPin ? 'bg-black text-white border-black' : 'bg-white/90 text-black border-white/20'}`}
                >
                  <MapPin size={12} /> Drop a Pin
                </button>
              </div>
          </div>

          {selectedAddress && !addressConfirmed && (
            <button 
              onClick={handleConfirmAddress}
              className="w-full py-4 bg-black text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-black/10 animate-in zoom-in-95 duration-200"
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
                className="w-full border-2 border-gray-100 rounded-xl p-4 text-sm font-bold bg-gray-50 focus:bg-white focus:border-black outline-none transition-all shadow-inner resize-none"
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
        />

        {/* Contact Section */}
        <section className="space-y-4">
          <h2 className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
            <User size={12} /> 03. Receiver
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <input 
              type="text" 
              placeholder="Legal Name" 
              value={receiverName}
              onChange={e => setReceiverName(e.target.value)}
              className="w-full border-2 border-gray-100 rounded-xl p-4 text-sm font-bold bg-gray-50 focus:bg-white focus:border-black outline-none transition-all shadow-inner"
            />
            <input 
              type="tel" 
              placeholder="Phone (09xx)" 
              value={receiverPhone}
              onChange={e => setReceiverPhone(e.target.value)}
              className="w-full border-2 border-gray-100 rounded-xl p-4 text-sm font-bold bg-gray-50 focus:bg-white focus:border-black outline-none transition-all shadow-inner"
            />
          </div>
        </section>

        {/* Financial Summary */}
        <section className="space-y-4">
          <h2 className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
            <CreditCard size={12} /> 04. Financial Settlement
          </h2>

          <div className="bg-gray-50 border-2 border-gray-100 rounded-2xl p-6 space-y-4">
             <div className="space-y-2 pb-4 border-b border-gray-200">
               <div className="flex justify-between items-center text-xs font-bold text-gray-500">
                  <span>Merchandise Subtotal</span>
                  <span>₱{subtotal.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
               </div>
               <div className="flex justify-between items-center text-xs font-bold text-gray-500">
                  <span>VAT (12% Included)</span>
                  <span>₱{tax.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
               </div>
               <div className="flex justify-between items-center text-xs font-bold text-gray-500">
                  <span>Road Delivery Fee</span>
                  <span>₱{deliveryFee.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
               </div>
               {discount > 0 && (
                 <div className="flex justify-between items-center text-xs font-black italic text-green-600 uppercase tracking-tighter">
                    <span>Promotion ({appliedPromo?.code})</span>
                    <span>-₱{discount.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                 </div>
               )}
             </div>

             <div className="space-y-3">
               <div className="flex justify-between items-center">
                  <div>
                    <div className="text-[8px] font-black uppercase tracking-widest text-gray-400">Due at Checkout</div>
                    <div className="text-lg font-black italic uppercase tracking-tighter text-black">₱{amountDueNow.toLocaleString(undefined, {minimumFractionDigits: 2})}</div>
                  </div>
                  {amountDueOnDelivery > 0 && (
                    <div className="text-right">
                      <div className="text-[8px] font-black uppercase tracking-widest text-gray-400">Due at Doorstep</div>
                      <div className="text-lg font-black italic uppercase tracking-tighter text-gray-400">₱{amountDueOnDelivery.toLocaleString(undefined, {minimumFractionDigits: 2})}</div>
                    </div>
                  )}
               </div>
             </div>
          </div>
        </section>

      </div>

      {/* Floating Action Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-xl border-t border-gray-100 z-[100] pb-[calc(16px+env(safe-area-inset-bottom,0px))]">
        <div className="max-w-lg mx-auto flex gap-3">
           <div className="flex-1">
             <div className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Grand Total</div>
             <div className="text-xl font-black italic tracking-tighter">₱{totalOrderValue.toLocaleString(undefined, {minimumFractionDigits: 2})}</div>
           </div>
           <button 
            disabled={!selectedQuote || !paymentTiming || !receiverName || !receiverPhone}
            onClick={handlePlaceOrder}
            className="px-10 bg-black text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-800 disabled:bg-gray-200 disabled:text-gray-400 transition-all shadow-2xl shadow-black/20"
          >
            Authorize Payment
          </button>
        </div>
      </div>
    </div>
  );
}
