import { Request, Response } from "express";
import { db } from "../../packages/db/index.js";
import { Product, Category, Visibility } from "../../packages/domain/catalog.js";

const DEFAULT_TENANT = "default";

export const getCatalogHandler = async (req: Request, res: Response) => {
  const tenantId = DEFAULT_TENANT;
  const productsRef = db.collection(`tenants/${tenantId}/products`);

  // Only show active/scheduled if not admin?
  // For now, this is a general fetch.
  const snapshot = await productsRef.where('deletedAt', '==', null).get();

  let docs = snapshot.docs.map((d: any) => ({ id: d.id, ...d.data() }));

  // Sort by featuredOrder then name
  docs.sort((a: any, b: any) => {
    if (a.isFeatured && !b.isFeatured) return -1;
    if (!a.isFeatured && b.isFeatured) return 1;
    if (a.featuredOrder !== b.featuredOrder) return (a.featuredOrder || 0) - (b.featuredOrder || 0);
    return a.name.localeCompare(b.name);
  });

  res.json({ data: docs });
};

export const getProductHandler = async (req: Request, res: Response) => {
  const tenantId = DEFAULT_TENANT;
  const { id } = req.params;
  const productRef = db.collection(`tenants/${tenantId}/products`).doc(id);
  const doc = await productRef.get();
  if (!doc.exists) return res.status(404).json({ error: "Not found" });
  res.json({ data: { id: doc.id, ...doc.data() } });
};

export const createProductHandler = async (req: Request, res: Response) => {
  const tenantId = DEFAULT_TENANT;
  const productsRef = db.collection(`tenants/${tenantId}/products`);

  const now = new Date().toISOString();
  const slug = req.body.name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
  const sku = req.body.sku || `SKU-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

  const newProduct: Partial<Product> = {
    ...req.body,
    tenantId,
    sku,
    slug,
    status: req.body.status || 'draft',
    availability: req.body.availability || 'in_stock',
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    isFeatured: req.body.isFeatured || false,
    featuredOrder: req.body.featuredOrder || 0,
    badges: req.body.badges || [],
    hasVariants: req.body.hasVariants || false,
    variants: req.body.variants || [],
    isBundle: req.body.isBundle || false,
    bundleItems: req.body.bundleItems || [],
    channels: req.body.channels || ['telegram'],
  };

  const ref = await productsRef.add(newProduct);
  res.json({ data: { id: ref.id, ...newProduct } });
};

export const updateProductHandler = async (req: Request, res: Response) => {
  const tenantId = DEFAULT_TENANT;
  const { id } = req.params;
  const productRef = db.collection(`tenants/${tenantId}/products`).doc(id);

  const oldDoc = await productRef.get();
  const oldData = oldDoc.data();

  const updateData = {
    ...req.body,
    updatedAt: new Date().toISOString()
  };

  // Price history audit
  if (req.body.price !== undefined && req.body.price !== oldData.price) {
    const auditRef = db.collection(`tenants/${tenantId}/audit_events`);
    await auditRef.add({
      type: 'price_change',
      productId: id,
      oldPrice: oldData.price,
      newPrice: req.body.price,
      changedBy: 'admin', // In a real app, get from auth context
      timestamp: new Date().toISOString()
    });
  }

  await productRef.update(updateData);
  const doc = await productRef.get();
  res.json({ data: { id: doc.id, ...doc.data() } });
};

export const deleteProductHandler = async (req: Request, res: Response) => {
  const tenantId = DEFAULT_TENANT;
  const { id } = req.params;
  const productRef = db.collection(`tenants/${tenantId}/products`).doc(id);

  const doc = await productRef.get();
  if (!doc.exists) return res.status(404).json({ error: "Product not found" });

  const product = doc.data();

  // Check if referenced by orders
  const ordersRef = db.collection(`tenants/${tenantId}/orders`);
  const orderSnapshot = await ordersRef.where('items', 'array-contains', { productId: id }).limit(1).get();

  // Safety check: if referenced, only archive
  if (!orderSnapshot.empty) {
    await productRef.update({
      status: 'archived',
      deletedAt: new Date().toISOString()
    });
    return res.json({ success: true, message: "Product archived due to existing references." });
  }

  // Deletion defaults to archive anyway as per requirement
  await productRef.update({
    status: 'archived',
    deletedAt: new Date().toISOString()
  });

  res.json({ success: true, message: "Product archived." });
};

export const updateProductStatusHandler = async (req: Request, res: Response) => {
  const tenantId = DEFAULT_TENANT;
  const { id } = req.params;
  const { status } = req.body;

  if (!['active', 'draft', 'archived'].includes(status)) {
    return res.status(400).json({ error: "Invalid status" });
  }

  const productRef = db.collection(`tenants/${tenantId}/products`).doc(id);
  const doc = await productRef.get();
  if (!doc.exists) return res.status(404).json({ error: "Product not found" });

  await productRef.update({
    status,
    updatedAt: new Date().toISOString()
  });

  res.json({ success: true });
};

export const duplicateProductHandler = async (req: Request, res: Response) => {
  const tenantId = DEFAULT_TENANT;
  const { id } = req.params;
  const productsRef = db.collection(`tenants/${tenantId}/products`);

  const doc = await productsRef.doc(id).get();
  if (!doc.exists) return res.status(404).json({ error: "Product not found" });

  const data = doc.data();
  delete data.id;
  data.name = `${data.name} (Copy)`;
  data.sku = `${data.sku}-COPY`;
  data.slug = `${data.slug}-copy`;
  data.status = 'draft';
  data.createdAt = new Date().toISOString();
  data.updatedAt = new Date().toISOString();
  data.deletedAt = null;

  const ref = await productsRef.add(data);
  res.json({ data: { id: ref.id, ...data } });
};

// Category Handlers
export const getCategoriesHandler = async (req: Request, res: Response) => {
  const tenantId = DEFAULT_TENANT;
  const categoriesRef = db.collection(`tenants/${tenantId}/categories`);
  const snapshot = await categoriesRef.orderBy('order', 'asc').get();
  const docs = snapshot.docs.map((d: any) => ({ id: d.id, ...d.data() }));
  res.json({ data: docs });
};

export const upsertCategoryHandler = async (req: Request, res: Response) => {
  const tenantId = DEFAULT_TENANT;
  const { id } = req.params;
  const categoriesRef = db.collection(`tenants/${tenantId}/categories`);

  if (id) {
    await categoriesRef.doc(id).update(req.body);
    const doc = await categoriesRef.doc(id).get();
    return res.json({ data: { id: doc.id, ...doc.data() } });
  } else {
    const ref = await categoriesRef.add(req.body);
    return res.json({ data: { id: ref.id, ...req.body } });
  }
};

export const deleteCategoryHandler = async (req: Request, res: Response) => {
  const tenantId = DEFAULT_TENANT;
  const { id } = req.params;
  await db.collection(`tenants/${tenantId}/categories`).doc(id).delete();
  res.json({ success: true });
};
