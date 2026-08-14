import { Request, Response } from "express";
import { verifyTelegramInitData } from "../../packages/telegram/auth.js";
import { env } from "../../packages/config/env.js";
import { db } from "../../packages/db/index.js";
import crypto from "crypto";
import { enrollOrUpdateIdentity } from "./identity.js";

export const telegramExchangeHandler = async (req: Request, res: Response) => {
  try {
    let initData = req.body.initData;
    const { tenantId } = req.body;
    
    if (!tenantId) {
      return res.status(400).json({ error: "Missing tenantId" });
    }

    let user: any = null;
    
    if (env.IS_PREVIEW && (!initData || initData === "PREVIEW_MOCK")) {
      user = {
        id: 123456789,
        first_name: "Preview",
        last_name: "User",
        username: "preview_user"
      };
    } else {
      if (!initData) {
        return res.status(400).json({ error: "Missing initData" });
      }

      const isValid = verifyTelegramInitData(
        initData,
        env.TELEGRAM_BOT_TOKEN || "",
        env.TELEGRAM_AUTH_MAX_AGE_SECONDS
      );

      if (!isValid) {
        return res.status(401).json({ error: "Invalid initData" });
      }

      const urlParams = new URLSearchParams(initData);
      const userStr = urlParams.get("user");
      if (!userStr) {
        return res.status(400).json({ error: "Missing user in initData" });
      }
      user = JSON.parse(userStr);
    }
    
    const { customerDocId, primeMemberId } = await enrollOrUpdateIdentity(tenantId, "default_bot", user, "mini_app_exchange");

    // Generate Session
    const sessionToken = crypto.randomBytes(32).toString("hex");
    const sessionDigest = crypto.createHash("sha256").update(sessionToken).digest("hex");
    
    await db.collection(`tenants/${tenantId}/sessions`).add({
      digest: sessionDigest,
      customerId: customerDocId,
      primeMemberId,
      telegramUserId: user.id.toString(),
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString() // 24 hours
    });

    res.cookie("session", sessionToken, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      maxAge: 1000 * 60 * 60 * 24
    });

    return res.json({ success: true, primeMemberId });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

export const adminLoginHandler = async (req: Request, res: Response) => {
  try {
    const { initData, tenantId, accessCode } = req.body;
    
    if (!tenantId || !accessCode) {
      return res.status(400).json({ error: "Missing parameters" });
    }

    let user: any = {
      id: "browser-admin",
      first_name: "Browser Admin",
      username: "browser_admin"
    };

    if (initData && initData !== "PREVIEW_MOCK") {
      const isValid = verifyTelegramInitData(
        initData,
        env.TELEGRAM_BOT_TOKEN || "",
        env.TELEGRAM_AUTH_MAX_AGE_SECONDS
      );

      if (!isValid) return res.status(401).json({ error: "Invalid initData" });

      const urlParams = new URLSearchParams(initData);
      const userStr = urlParams.get("user");
      if (!userStr) return res.status(400).json({ error: "Missing user" });
      user = JSON.parse(userStr);
    }
    
    const normalizedCode = accessCode.trim().toUpperCase().normalize('NFKC');
    const expectedCode = (env.ADMIN_ACCESS_CODE || env.ADMIN_BOOTSTRAP_CODE).trim().toUpperCase().normalize('NFKC');

    if (normalizedCode !== expectedCode) {
      return res.status(401).json({ error: "Invalid credentials" }); // Generic message
    }
    
    // In a real system, verify if user.id is in the operator allowlist for this tenant
    // For this greenfield setup, we might implicitly add them or check BOOTSTRAP_OWNER_TELEGRAM_ID
    if (env.BOOTSTRAP_OWNER_TELEGRAM_ID && user.id.toString() !== env.BOOTSTRAP_OWNER_TELEGRAM_ID && !env.IS_PREVIEW && user.id !== "browser-admin") {
      return res.status(401).json({ error: "Invalid credentials" }); // Not an owner
    }

    // Upsert operator
    const opsRef = db.collection(`tenants/${tenantId}/operators`);
    const opsQuery = await opsRef.where("telegramUserId", "==", user.id.toString()).limit(1).get();
    
    let opDocId;
    if (opsQuery.empty) {
      const ref = await opsRef.add({
        telegramUserId: user.id.toString(),
        name: user.first_name,
        role: "Owner",
        createdAt: new Date().toISOString()
      });
      opDocId = ref.id;
    } else {
      opDocId = opsQuery.docs[0].id;
    }

    // Generate admin session
    const sessionToken = crypto.randomBytes(32).toString("hex");
    const sessionDigest = crypto.createHash("sha256").update(sessionToken).digest("hex");
    
    await db.collection(`tenants/${tenantId}/sessions`).add({
      digest: sessionDigest,
      operatorId: opDocId,
      telegramUserId: user.id.toString(),
      isAdmin: true,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 8).toISOString() // 8 hours absolute
    });

    res.cookie("admin_session", sessionToken, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      maxAge: 1000 * 60 * 60 * 8
    });

    return res.json({ success: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};
