import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, MapPin, User, Tag, ShieldCheck, X, Navigation, CreditCard, Wallet } from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

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
  const [unitInstructions, setUnitInstructions] = useState("");
  
  const [selectedCoordinates, setSelectedCoordinates] = useState<{lat: number, lng: number}>({ lat: 14.5995, lng: 120.9842 });
  const [isDroppingPin, setIsDroppingPin] = useState(false);
  const unitRef = useRef<HTMLTextAreaElement>(null);

  const [receiverName, setReceiverName] = useState("");
  const [receiverPhone, setReceiverPhone] = useState("");
  
  const [promoCode, setPromoCode] = useState("");
  const [referralCode, setReferralCode] = useState("");

  const [paymentMethod, setPaymentMethod] = useState<'card' | 'wallet'>('card');

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

  useEffect(() => {
    if (addressSearch.length > 2) {
      if (selectedAddress) {
        const selectedStr = selectedAddress.formatted || selectedAddress.properties?.formatted || '';
        if (addressSearch === selectedStr) {
          setAddressSuggestions([]);
          return;
        }
      }
      
      const delay = setTimeout(() => {
        fetch(`/v1/location/autocomplete?q=${encodeURIComponent(addressSearch)}`)
          .then(r => r.json())
          .then(d => setAddressSuggestions(d.results || []));
      }, 300);
      return () => clearTimeout(delay);
    } else {
      setAddressSuggestions([]);
    }
  }, [addressSearch, selectedAddress]);

  const selectAddress = (suggestion: any) => {
    setSelectedAddress(suggestion);
    setAddressSearch(suggestion.formatted || suggestion.properties?.formatted || '');
    setAddressSuggestions([]);

    const lat = suggestion.properties?.lat || suggestion.lat;
    const lng = suggestion.properties?.lon || suggestion.lon;
    if (lat && lng) {
      setSelectedCoordinates({ lat: Number(lat), lng: Number(lng) });
    }
    
    setTimeout(() => {
      unitRef.current?.focus();
    }, 100);
  };

  if (!session) return <div className="p-3 text-center mt-10">Initializing secure checkout...</div>;

  const items = cart?.items || [];
  const subtotal = items.reduce((acc: number, i: any) => acc + (i.price * i.quantity), 0);
  const tax = subtotal * 0.12; // 12% VAT
  const deliveryFee = 50; // Mock delivery fee
  
  const [appliedPromo, setAppliedPromo] = useState<any>(null);
  const [promoError, setPromoError] = useState('');
  
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

  const total = Math.max(0, subtotal + tax + deliveryFee - discount);

  const handlePlaceOrder = async () => {
    if (!items.length) return;
    try {
      const res = await fetch('/v1/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items,
          receiverName,
          receiverPhone,
          paymentMethod,
          address: selectedAddress ? (selectedAddress.formatted || selectedAddress.properties?.formatted || addressSearch) : addressSearch,
          totals: { subtotal, tax, deliveryFee, total }
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
    <div className="bg-gray-50 min-h-screen">
      {/* Checkout Header - overrides global header */}
      <div className="fixed top-0 left-0 right-0 h-[64px] bg-white border-b border-gray-200 z-50 flex items-center px-4 pt-[env(safe-area-inset-top,0px)]">
        <button onClick={() => navigate('/cart')} className="p-2 -ml-2 text-gray-900 hover:bg-gray-100 rounded-full transition-colors">
          <ChevronLeft size={28} />
        </button>
        <div className="font-bold text-sm flex-1 text-center mr-6 flex items-center justify-center gap-2">
          <ShieldCheck size={20} className="text-green-700" />
          SECURE CHECKOUT
        </div>
      </div>

      <div className="pt-[calc(64px+env(safe-area-inset-top,0px))] pb-[140px] max-w-2xl mx-auto px-4 md:px-6">
        
        {/* Identity & Delivery Box - Flat Layout */}
        <div className="py-2">
          <h2 className="text-sm font-bold mb-3 flex items-center gap-2"><MapPin size={24} /> Delivery Address</h2>
          
          <div className="space-y-6">
            <div className="relative">
              <input 
                type="text" 
                placeholder="Search street, building, or village" 
                value={addressSearch}
                onChange={e => setAddressSearch(e.target.value)}
                className="w-full border border-gray-300 rounded-md p-3 pr-12 text-sm bg-white focus:border-black focus:ring-1 focus:ring-black outline-none transition-shadow"
              />
              {addressSearch && (
                <button
                  onClick={() => {
                    setAddressSearch("");
                    setSelectedAddress(null);
                    setIsDroppingPin(false);
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black transition-colors"
                >
                  <X size={20} />
                </button>
              )}
              {addressSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 mt-2 rounded-md shadow-xl z-50 max-h-60 overflow-y-auto divide-y divide-gray-100">
                  {addressSuggestions.map((s, i) => (
                    <div 
                      key={i} 
                      className="p-3 text-sm hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => selectAddress(s)}
                    >
                      {s.formatted || s.properties?.formatted || ''}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="w-full h-48 rounded-md overflow-hidden relative border border-gray-300">
                <MapContainer 
                  center={[selectedCoordinates.lat, selectedCoordinates.lng]}
                  zoom={16} 
                  style={{ height: '100%', width: '100%', zIndex: 0 }}
                  dragging={true}
                  touchZoom={true}
                  scrollWheelZoom={true}
                  doubleClickZoom={true}
                >
                  <TileLayer
                    attribution='Powered by Geoapify | &copy; OpenStreetMap contributors'
                    url={`https://maps.geoapify.com/v1/tile/osm-carto/{z}/{x}/{y}.png?apiKey=${(process.env as any).GEOAPIFY_API_KEY || '6d0e711d72d74daeb2b0bfd2a5cdfd3a'}`}
                  />
                  <Marker position={[selectedCoordinates.lat, selectedCoordinates.lng]} />
                  <MapUpdater center={selectedCoordinates} />
                  <LocationPicker 
                    isDroppingPin={isDroppingPin} 
                    onLocationSelect={async (lat, lng) => {
                      try {
                        const res = await fetch(`/v1/location/reverse-geocode?lat=${lat}&lon=${lng}`);
                        const data = await res.json();
                        if (data.results?.[0]) {
                          const suggestion = data.results[0];
                          setSelectedAddress(suggestion);
                          setAddressSearch(suggestion.formatted || suggestion.properties?.formatted || '');
                          setSelectedCoordinates({ lat, lng });
                          setIsDroppingPin(false);
                          setTimeout(() => unitRef.current?.focus(), 100);
                        }
                      } catch (err) {
                        console.error(err);
                      }
                    }} 
                  />
                </MapContainer>
                {isDroppingPin && (
                  <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-black text-white px-3 py-1 rounded-full text-xs font-bold shadow-md z-10 pointer-events-none">
                    TAP ON MAP TO DROP PIN
                  </div>
                )}
              </div>

            <div className="flex gap-2 w-full">
              <button 
                onClick={() => {
                  if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(async (pos) => {
                      const lat = pos.coords.latitude;
                      const lng = pos.coords.longitude;
                      try {
                        const res = await fetch(`/v1/location/reverse-geocode?lat=${lat}&lon=${lng}`);
                        const data = await res.json();
                        if (data.results?.[0]) {
                          const suggestion = data.results[0];
                          setSelectedAddress(suggestion);
                          setAddressSearch(suggestion.formatted || suggestion.properties?.formatted || '');
                          setSelectedCoordinates({ lat, lng });
                          setTimeout(() => unitRef.current?.focus(), 100);
                        }
                      } catch (err) {
                        console.error(err);
                      }
                    });
                  }
                }}
                className="flex-1 flex items-center justify-center gap-2 rounded-full py-3 text-xs md:text-sm font-semibold text-white bg-gradient-to-b from-gray-700 to-black shadow-[0_4px_10px_rgba(0,0,0,0.3),inset_0_1px_1px_rgba(255,255,255,0.3)] hover:from-gray-600 hover:to-gray-900 transition-all border border-gray-900"
              >
                <Navigation size={16} /> USE CURRENT LOCATION
              </button>
              <button 
                onClick={() => {
                  setIsDroppingPin(true);
                }}
                className={`flex-1 flex items-center justify-center gap-2 rounded-full py-3 text-xs md:text-sm font-semibold text-white shadow-[0_4px_10px_rgba(0,0,0,0.3),inset_0_1px_1px_rgba(255,255,255,0.3)] hover:from-gray-600 hover:to-gray-900 transition-all border border-gray-900 ${isDroppingPin ? 'bg-gradient-to-b from-blue-700 to-blue-900 border-blue-900' : 'bg-gradient-to-b from-gray-700 to-black'}`}
              >
                <MapPin size={16} /> {isDroppingPin ? 'TAP MAP' : 'DROP A PIN'}
              </button>
            </div>

            <textarea 
              ref={unitRef}
              rows={3} 
              placeholder="Floor / Unit No. / Instructions" 
              value={unitInstructions}
              onChange={e => setUnitInstructions(e.target.value)}
              className="w-full border border-gray-300 rounded-md p-3 text-sm resize-none bg-white focus:border-black focus:ring-1 focus:ring-black outline-none transition-shadow"
            />
          </div>
        </div>

        <hr className="border-gray-200" />

        <div className="py-2">
          <h2 className="text-sm font-bold mb-3 flex items-center gap-2"><User size={24} /> Receiver Details</h2>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <input 
              type="text" 
              placeholder="Full Name" 
              value={receiverName}
              onChange={e => setReceiverName(e.target.value)}
              className="w-full sm:w-1/2 border border-gray-300 rounded-md p-3 text-sm bg-white focus:border-black focus:ring-1 focus:ring-black outline-none transition-shadow"
            />
            <input 
              type="tel" 
              placeholder="Phone Number" 
              value={receiverPhone}
              onChange={e => setReceiverPhone(e.target.value)}
              className="w-full sm:w-1/2 border border-gray-300 rounded-md p-3 text-sm bg-white focus:border-black focus:ring-1 focus:ring-black outline-none transition-shadow"
            />
          </div>
        </div>

        <hr className="border-gray-200" />

        {/* Promos */}
        <div className="py-2">
          <h2 className="text-sm font-bold mb-3">Promotions</h2>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <div className="relative flex">
                <Tag size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Promo Code" 
                  value={promoCode}
                  onChange={e => setPromoCode(e.target.value)}
                  disabled={!!appliedPromo}
                  className="w-full border border-gray-300 rounded-l-md py-2 pl-12 pr-4 text-sm uppercase outline-none focus:border-black focus:ring-1 focus:ring-black transition-shadow disabled:bg-gray-100"
                />
                {!appliedPromo ? (
                  <button 
                    onClick={handleApplyPromo}
                    disabled={!promoCode}
                    className="bg-black text-white px-4 text-sm font-bold rounded-r-md hover:bg-gray-800 disabled:opacity-50"
                  >
                    APPLY
                  </button>
                ) : (
                  <button 
                    onClick={() => { setAppliedPromo(null); setPromoCode(''); }}
                    className="bg-red-50 text-red-600 border border-red-200 px-4 text-sm font-bold rounded-r-md hover:bg-red-100"
                  >
                    REMOVE
                  </button>
                )}
              </div>
              {promoError && <div className="text-red-500 text-xs mt-1 font-semibold">{promoError}</div>}
              {appliedPromo && <div className="text-green-600 text-xs mt-1 font-semibold">Promo applied successfully!</div>}
            </div>
            <div className="flex-1 relative">
              <Tag size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                type="text" 
                placeholder="Referral Code" 
                value={referralCode}
                onChange={e => setReferralCode(e.target.value)}
                className="w-full border border-gray-300 rounded-md py-2 pl-12 pr-4 text-sm uppercase outline-none focus:border-black focus:ring-1 focus:ring-black transition-shadow"
              />
            </div>
          </div>
        </div>
        <hr className="border-gray-200" />

        {/* Payment Method */}
        <div className="py-2">
          <h2 className="text-sm font-bold mb-3 flex items-center gap-2"><CreditCard size={24} /> Payment Method</h2>
          <div className="flex gap-3">
            <button
              onClick={() => setPaymentMethod('card')}
              className={`flex-1 flex flex-col items-center justify-center p-3 border rounded-md transition-colors ${paymentMethod === 'card' ? 'border-black bg-gray-50' : 'border-gray-300 hover:bg-gray-50'}`}
            >
              <CreditCard size={32} className="mb-2" />
              <span className="font-semibold">Credit/Debit Card</span>
            </button>
            <button
              onClick={() => setPaymentMethod('wallet')}
              className={`flex-1 flex flex-col items-center justify-center p-3 border rounded-md transition-colors ${paymentMethod === 'wallet' ? 'border-black bg-gray-50' : 'border-gray-300 hover:bg-gray-50'}`}
            >
              <Wallet size={32} className="mb-2" />
              <span className="font-semibold">Digital Wallet</span>
            </button>
          </div>
        </div>
        <hr className="border-gray-200" />

        {/* Order Summary */}
        <div className="py-2">
          <h2 className="text-sm font-bold mb-3">Order Summary</h2>
          <div className="space-y-4 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Subtotal</span>
              <span className="font-semibold">₱{subtotal.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Tax (12% VAT)</span>
              <span className="font-semibold">₱{tax.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Delivery Fee</span>
              <span className="font-semibold text-gray-500">₱{deliveryFee.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between items-center text-green-700 font-bold">
                <span>Discount ({appliedPromo?.code})</span>
                <span>-₱{discount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
              </div>
            )}
            <div className="pt-4 mt-2 border-t border-gray-900 flex justify-between items-center font-bold text-sm">
              <span>Total to Pay</span>
              <span>₱{total.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-3 pb-[calc(16px+env(safe-area-inset-bottom,0px))] z-50">
        <div className="max-w-2xl mx-auto">
          <button 
            disabled={!selectedAddress || !receiverName || !receiverPhone}
            onClick={handlePlaceOrder}
            className="w-full bg-black text-white font-bold py-2 px-8 rounded-md hover:bg-gray-800 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed text-sm tracking-wide transition-colors"
          >
            PLACE ORDER (₱{total.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})})
          </button>
        </div>
      </div>
    </div>
  );
}
