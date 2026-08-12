export interface TelegramProfile {
  userId: string;
  firstName: string;
  lastName?: string;
  username?: string;
  observedAt: string;
}

export interface Customer {
  id: string; // Internal Doc ID
  primeMemberId: string; // 10-char immutable ID
  telegramUserId: string;
  
  // Telegram Profile (Read-only from Bot)
  telegramProfile: {
    firstName: string;
    lastName?: string;
    username?: string;
  };

  // Customer-entered (Checkout Info)
  fullName?: string;
  phoneNumber?: string;
  email?: string;
  
  tier: string;
  tierHistory: TierHistoryEvent[];
  
  savedAddresses: SavedAddress[];
  deliveryNotes?: string;
  
  referralCode: string;
  referralSummary: {
    qualifiedCount: number;
    pendingCount: number;
  };
  
  consent: {
    timestamp: string;
    policyVersion: string;
  };
  
  createdAt: string;
  updatedAt: string;
}

export interface TierHistoryEvent {
  tier: string;
  reason: string;
  timestamp: string;
}

export interface SavedAddress {
  id: string;
  label: string;
  formattedAddress: string;
  structuredAddress: any; // Geoapify result
  lat: number;
  lng: number;
  placeId?: string;
  floorUnit?: string;
  instructions?: string;
  isDefault?: boolean;
}
