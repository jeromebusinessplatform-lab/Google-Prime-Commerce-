export interface DeliveryOrigin {
  id: string;
  name: string;
  pickupLabel: string;
  address: string;
  lat: number;
  lng: number;
  instructions?: string;
  status: 'active' | 'archived';
  isDefault: boolean;
  version: number;
  updatedAt: string;
}

export interface Courier {
  id: string;
  code: string;
  name: string;
  logoUrl: string;
  status: 'available' | 'unavailable';
  supportDetails?: string;
  sortOrder: number;
  
  routingMode: 'motor_scooter' | 'drive' | 'bicycle' | 'walk';
  trackingUrlTemplate?: string;
  
  serviceZones?: string[];
  maxDistanceKm?: number;
  
  config: {
    version: number;
    baseDistanceKm: number;
    baseFareMinor: number;
    excessPerKmMinor: number;
    platformFeeMinor: number;
    perKmSurchargeMinor: number;
    nightFeeMinor: number;
    nightFeeStartHour: number;
    nightFeeEndHour: number;
  };
  
  availabilityHistory: AvailabilityHistoryEvent[];
}

export interface AvailabilityHistoryEvent {
  status: 'available' | 'unavailable';
  operator: string;
  reason: string;
  timestamp: string;
}

export interface DeliveryQuote {
  id: string;
  courierId: string;
  configVersion: number;
  origin: {
    id: string;
    name: string;
    lat: number;
    lng: number;
    version: number;
  };
  destination: {
    lat: number;
    lng: number;
    formattedAddress: string;
  };
  route: {
    mode: string;
    distanceMeters: number;
    durationSeconds?: number;
  };
  components: {
    baseFareMinor: number;
    excessChargeMinor: number;
    platformFeeMinor: number;
    distanceSurchargeMinor: number;
    nightFeeMinor: number;
  };
  totalMinor: number;
  currency: string;
  paymentTiming: 'checkout' | 'delivery';
  expiresAt: string;
  createdAt: string;
}
