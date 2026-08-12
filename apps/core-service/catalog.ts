import { Request, Response } from "express";
import { db } from "../../packages/db/index.js";

export const getCatalogHandler = async (req: Request, res: Response) => {
  const tenantId = "default";
  const productsRef = db.collection(`tenants/${tenantId}/products`);
  
  // For Preview mode, let's seed some dummy products if empty
  const snapshot = await productsRef.limit(10).get();
  
  let docs = snapshot.docs.map((d: any) => ({ id: d.id, ...d.data() }));
  
  if (docs.length === 0) {
    const dummyProducts = [
      { name: "Coffee Beans", price: 1500, compareAtPrice: null, availability: "in_stock", category: "Coffee", image: "https://placehold.co/400x500" },
      { name: "Espresso Maker", price: 12000, compareAtPrice: 15000, availability: "in_stock", category: "Equipment", image: "https://placehold.co/400x500" },
      { name: "Paper Filters", price: 300, compareAtPrice: null, availability: "low_stock", category: "Accessories", image: "https://placehold.co/400x500" },
      { name: "Ceramic Mug", price: 800, compareAtPrice: null, availability: "out_of_stock", category: "Accessories", image: "https://placehold.co/400x500" }
    ];
    for (const p of dummyProducts) {
      const ref = await productsRef.add(p);
      docs.push({ id: ref.id, ...p });
    }
  }

  res.json({ data: docs });
};

export const getProductHandler = async (req: Request, res: Response) => {
  const tenantId = "default";
  const { id } = req.params;
  const productRef = db.collection(`tenants/${tenantId}/products`).doc(id);
  const doc = await productRef.get();
  if (!doc.exists) return res.status(404).json({ error: "Not found" });
  res.json({ data: { id: doc.id, ...doc.data() } });
};

export const createProductHandler = async (req: Request, res: Response) => {
  const tenantId = "default";
  const productsRef = db.collection(`tenants/${tenantId}/products`);
  
  const newProduct = {
    ...req.body,
    availability: req.body.availability || "in_stock",
    image: req.body.image || "https://placehold.co/400x500"
  };
  
  const ref = await productsRef.add(newProduct);
  res.json({ data: { id: ref.id, ...newProduct } });
};

export const updateProductHandler = async (req: Request, res: Response) => {
  const tenantId = "default";
  const { id } = req.params;
  const productRef = db.collection(`tenants/${tenantId}/products`).doc(id);
  
  await productRef.update(req.body);
  const doc = await productRef.get();
  res.json({ data: { id: doc.id, ...doc.data() } });
};

export const deleteProductHandler = async (req: Request, res: Response) => {
  const tenantId = "default";
  const { id } = req.params;
  const productRef = db.collection(`tenants/${tenantId}/products`).doc(id);
  
  await productRef.delete();
  res.json({ success: true });
};
