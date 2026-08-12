
export type Visibility = 'draft' | 'active' | 'scheduled' | 'archived';
export type Availability = 'in_stock' | 'low_stock' | 'out_of_stock' | 'discontinued';
export type StockPolicy = 'tracked' | 'untracked' | 'allow_backorder' | 'stop_at_zero';

export interface Media {
  id: string;
  url: string;
  altText: string;
  order: number;
  focalPoint?: { x: number; y: number };
}

export interface VariantOption {
  type: 'size' | 'color' | 'weight' | 'package' | 'custom';
  name: string;
  value: string;
}

export interface ProductVariant {
  id: string;
  sku: string;
  barcode?: string;
  options: VariantOption[];
  price: number;
  compareAtPrice?: number;
  cost?: number; // Authorized only
  stockQuantity: number;
  stockPolicy: StockPolicy;
  weight?: number;
  dimensions?: { l: number; w: number; h: number };
}

export interface BundleItem {
  productId: string;
  variantId?: string;
  quantity: number;
  specialPrice?: number;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  parentId?: string;
  order: number;
  description?: string;
  image?: string;
}

export interface Product {
  id: string;
  tenantId: string;
  sku: string; // Base SKU
  name: string;
  subname?: string;
  slug: string;
  status: Visibility;
  availability: Availability;
  title: string; // SEO Title
  shortDescription: string;
  fullDescription: string;
  tags: string[];
  attributes: Record<string, string>;
  searchKeywords: string[];
  categories: string[]; // Array of Category IDs
  media: Media[];
  
  // Pricing
  price: number;
  compareAtPrice?: number;
  cost?: number;
  currency: string;
  effectiveDateStart?: string;
  effectiveDateEnd?: string;
  
  // Inventory
  minOrderQuantity: number;
  maxOrderQuantity: number;
  orderIncrement: number;
  stockPolicy: StockPolicy;
  
  // Variants
  hasVariants: boolean;
  variants: ProductVariant[];
  
  // Bundle
  isBundle: boolean;
  bundleItems: BundleItem[];
  
  // UI & Marketing
  isFeatured: boolean;
  featuredOrder: number;
  badges: ('NEW ARRIVAL' | 'SALE' | 'LIMITED STOCKS' | 'BEST-SELLER' | 'OUT OF STOCK')[];
  
  // Channels
  channels: ('telegram' | 'web' | 'mobile')[];
  
  // SEO
  seo: {
    title?: string;
    description?: string;
    keywords?: string[];
  };
  
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface PriceAudit {
  id: string;
  productId: string;
  variantId?: string;
  oldPrice: number;
  newPrice: number;
  changedBy: string;
  timestamp: string;
  reason?: string;
}
