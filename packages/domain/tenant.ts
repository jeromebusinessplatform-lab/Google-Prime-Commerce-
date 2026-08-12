export interface TenantSettings {
  id: string;
  name: string;
  logoUrl?: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
  currency: string;
  socials?: {
    facebook?: string;
    instagram?: string;
    tiktok?: string;
  };
  theme?: {
    primaryColor?: string;
    fontFamily?: string;
  };
  updatedAt: string;
}
