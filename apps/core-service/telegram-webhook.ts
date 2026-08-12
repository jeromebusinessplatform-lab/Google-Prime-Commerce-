import { Request, Response } from "express";
import { env } from "../../packages/config/env.js";
import { db } from "../../packages/db/index.js";
import { enrollOrUpdateIdentity } from "./identity.js";

export const telegramWebhookHandler = async (req: Request, res: Response) => {
  const { botKey } = req.params;
  const secretToken = req.headers["x-telegram-bot-api-secret-token"];
  
  if (!env.IS_PREVIEW) {
    if (secretToken !== env.TELEGRAM_WEBHOOK_SECRET) {
      return res.status(401).send("Unauthorized");
    }
  }
  
  const tenantId = "default";
  const update = req.body;
  if (!update || !update.update_id) {
    return res.status(400).send("Invalid update");
  }
  
  // Deduplicate
  const receiptRef = db.collection(`tenants/${tenantId}/telegram_update_receipts`).doc(update.update_id.toString());
  const existingReceipt = await receiptRef.get();
  
  if (existingReceipt.exists) {
    return res.status(200).send("OK");
  }
  
  await receiptRef.set({
    receivedAt: new Date().toISOString()
  });

  if (update.message && update.message.chat && update.message.chat.type === "private") {
    const user = update.message.from;
    if (user && user.id) {
      await enrollOrUpdateIdentity(tenantId, "default_bot", user, "bot_webhook");
    }
  }

  res.status(200).send("OK");
};
