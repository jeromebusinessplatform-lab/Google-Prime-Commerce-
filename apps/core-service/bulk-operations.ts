import { Request, Response } from "express";
import { db } from "../../packages/db/index.js";

const DEFAULT_TENANT = "default";

export const bulkUpdateHandler = async (req: Request, res: Response) => {
  const tenantId = DEFAULT_TENANT;
  const { ids, updates } = req.body;
  const productsRef = db.collection(`tenants/${tenantId}/products`);
  
  const batch = db.batch();
  for (const id of ids) {
    const ref = productsRef.doc(id);
    batch.update(ref, { ...updates, updatedAt: new Date().toISOString() });
  }
  
  await batch.commit();
  res.json({ success: true });
};

export const importCSVHandler = async (req: Request, res: Response) => {
  const { csvData, dryRun } = req.body;
  const errors: string[] = [];
  let importedCount = 0;

  // Mock validation logic
  if (!csvData || csvData.length === 0) {
    errors.push("CSV file is empty or missing headers.");
  } else {
    // Simulate checking for duplicate SKUs or missing required fields
    if (csvData.some((row: any) => !row.name)) errors.push("Row 2: Missing required field 'name'");
    if (csvData.some((row: any) => !row.sku)) errors.push("Row 5: SKU must be unique and non-empty");
    
    if (errors.length === 0) {
      importedCount = csvData.length;
    }
  }

  res.json({ 
    success: errors.length === 0, 
    imported: dryRun ? 0 : importedCount, 
    errors, 
    isDryRun: dryRun,
    message: dryRun ? "Dry run completed successfully." : "Import finished."
  });
};

export const exportCSVHandler = async (req: Request, res: Response) => {
  const tenantId = DEFAULT_TENANT;
  const productsRef = db.collection(`tenants/${tenantId}/products`);
  const snapshot = await productsRef.where('deletedAt', '==', null).get();
  const products = snapshot.docs.map((d: any) => d.data());
  
  // In a real app, generate CSV string
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=products.csv');
  res.send('id,name,sku,price\n' + products.map((p: any) => `${p.id},${p.name},${p.sku},${p.price}`).join('\n'));
};
