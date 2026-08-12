import crypto from "crypto";
import { db } from "../../packages/db/index.js";

export async function enrollOrUpdateIdentity(tenantId: string, botId: string, user: any, source: string) {
  const customersRef = db.collection(`tenants/${tenantId}/customers`);
  const customerQuery = await customersRef.where("telegramUserId", "==", user.id.toString()).limit(1).get();
  
  let primeMemberId;
  let customerDocId;
  
  if (customerQuery.empty) {
    let unique = false;
    // CSPRNG uppercase 10-char
    while (!unique) {
      primeMemberId = crypto.randomBytes(5).toString("hex").toUpperCase();
      // Enforce deployment-wide uniqueness by checking against a global collection or tenant-scoped depending on requirements.
      // We will check tenant scoped for now.
      const checkPrimeQuery = await customersRef.where("primeMemberId", "==", primeMemberId).limit(1).get();
      if (checkPrimeQuery.empty) {
        unique = true;
      }
    }

    const newCustomer = {
      telegramUserId: user.id.toString(),
      primeMemberId,
      firstName: user.first_name,
      lastName: user.last_name || null,
      username: user.username || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      enrollmentSource: source,
    };
    const ref = await customersRef.add(newCustomer);
    customerDocId = ref.id;
  } else {
    const existing = customerQuery.docs[0];
    customerDocId = existing.id;
    const data = existing.data();
    primeMemberId = data.primeMemberId;
    
    // Check if name/handle changed
    if (data.firstName !== user.first_name || data.lastName !== user.last_name || data.username !== user.username) {
      await customersRef.doc(customerDocId).update({
        firstName: user.first_name,
        lastName: user.last_name || null,
        username: user.username || null,
        updatedAt: new Date().toISOString()
      });
      // Append to history
      await db.collection(`tenants/${tenantId}/customer_telegram_identity_history`).add({
        customerId: customerDocId,
        telegramUserId: user.id.toString(),
        oldFirstName: data.firstName,
        oldLastName: data.lastName,
        oldUsername: data.username,
        newFirstName: user.first_name,
        newLastName: user.last_name || null,
        newUsername: user.username || null,
        source,
        observedAt: new Date().toISOString()
      });
    }
  }
  return { customerDocId, primeMemberId };
}
