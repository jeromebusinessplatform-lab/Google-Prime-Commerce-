import crypto from "crypto";
import { Request, Response } from "express";
import { db } from "../../packages/db/index.js";

const DEFAULT_TENANT = "default";

export async function enrollOrUpdateIdentity(tenantId: string, botId: string, user: any, source: string) {
  const customersRef = db.collection(`tenants/${tenantId}/customers`);
  const customerQuery = await customersRef.where("telegramUserId", "==", user.id.toString()).limit(1).get();
  
  let primeMemberId;
  let customerDocId;
  
  if (customerQuery.empty) {
    let unique = false;
    while (!unique) {
      primeMemberId = crypto.randomBytes(5).toString("hex").toUpperCase();
      const checkPrimeQuery = await customersRef.where("primeMemberId", "==", primeMemberId).limit(1).get();
      if (checkPrimeQuery.empty) {
        unique = true;
      }
    }

    const newCustomer = {
      telegramUserId: user.id.toString(),
      primeMemberId,
      telegramProfile: {
        firstName: user.first_name,
        lastName: user.last_name || null,
        username: user.username || null,
      },
      tier: 'BASIC',
      tierHistory: [{ tier: 'BASIC', reason: 'Initial Enrollment', timestamp: new Date().toISOString() }],
      savedAddresses: [],
      referralCode: `REF-${primeMemberId}`,
      referralSummary: { qualifiedCount: 0, pendingCount: 0 },
      consent: {
        timestamp: new Date().toISOString(),
        policyVersion: '1.0'
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      enrollmentSource: source,
    };
    const ref = await customersRef.add(newCustomer);
    customerDocId = ref.id;
  } else {
    const existing = customerQuery.docs[0];
    customerDocId = existing.id;
    const data = existing.data() as any;
    primeMemberId = data.primeMemberId;
    
    // Check if Telegram name/handle changed
    const currentProfile = data.telegramProfile || {};
    if (currentProfile.firstName !== user.first_name || currentProfile.lastName !== user.last_name || currentProfile.username !== user.username) {
      await customersRef.doc(customerDocId).update({
        "telegramProfile.firstName": user.first_name,
        "telegramProfile.lastName": user.last_name || null,
        "telegramProfile.username": user.username || null,
        updatedAt: new Date().toISOString()
      });
      
      // Append to history for fraud investigation
      await db.collection(`tenants/${tenantId}/customer_telegram_identity_history`).add({
        customerId: customerDocId,
        telegramUserId: user.id.toString(),
        oldProfile: currentProfile,
        newProfile: {
          firstName: user.first_name,
          lastName: user.last_name || null,
          username: user.username || null,
        },
        source,
        observedAt: new Date().toISOString()
      });
    }
  }
  return { customerDocId, primeMemberId };
}

export const getCustomerHandler = async (req: Request, res: Response) => {
  const tenantId = DEFAULT_TENANT;
  const { telegramUserId } = req.query;
  
  if (!telegramUserId) return res.status(400).json({ error: "Missing ID" });

  const customersRef = db.collection(`tenants/${tenantId}/customers`);
  const query = await customersRef.where("telegramUserId", "==", telegramUserId.toString()).limit(1).get();
  
  if (query.empty) return res.status(404).json({ error: "Customer not found" });
  
  const customer = { id: query.docs[0].id, ...query.docs[0].data() as any };
  res.json({ data: customer });
};

export const updateCustomerHandler = async (req: Request, res: Response) => {
  const tenantId = DEFAULT_TENANT;
  const { id } = req.params;
  const updates = req.body;

  // Protect read-only fields
  delete updates.primeMemberId;
  delete updates.telegramUserId;
  delete updates.telegramProfile;
  delete updates.tier;
  delete updates.referralCode;

  const ref = db.collection(`tenants/${tenantId}/customers`).doc(id);
  await ref.update({
    ...updates,
    updatedAt: new Date().toISOString()
  });

  res.json({ success: true });
};
