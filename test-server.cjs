var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// packages/telegram/auth.ts
function verifyTelegramInitData(initData, botToken, maxAgeSeconds) {
  try {
    const urlParams = new URLSearchParams(initData);
    const hash = urlParams.get("hash");
    if (!hash) return false;
    urlParams.delete("hash");
    const authDate = urlParams.get("auth_date");
    if (!authDate) return false;
    const timeAge = Math.floor(Date.now() / 1e3) - parseInt(authDate, 10);
    if (timeAge > maxAgeSeconds || timeAge < -60) return false;
    urlParams.sort();
    const dataCheckString = Array.from(urlParams.entries()).map(([key, value]) => `${key}=${value}`).join("\n");
    const secretKey = import_crypto.default.createHmac("sha256", "WebAppData").update(botToken).digest();
    const expectedHash = import_crypto.default.createHmac("sha256", secretKey).update(dataCheckString).digest("hex");
    return import_crypto.default.timingSafeEqual(Buffer.from(expectedHash, "hex"), Buffer.from(hash, "hex"));
  } catch (err) {
    return false;
  }
}
var import_crypto;
var init_auth = __esm({
  "packages/telegram/auth.ts"() {
    import_crypto = __toESM(require("crypto"), 1);
  }
});

// packages/config/env.ts
var import_zod, import_dotenv, import_crypto2, isDev, envSchema, parsed, env;
var init_env = __esm({
  "packages/config/env.ts"() {
    import_zod = require("zod");
    import_dotenv = __toESM(require("dotenv"), 1);
    import_crypto2 = __toESM(require("crypto"), 1);
    import_dotenv.default.config();
    isDev = process.env.NODE_ENV !== "production" && process.env.APP_ENV !== "production";
    envSchema = import_zod.z.object({
      APP_ENV: import_zod.z.string().default("development"),
      PORT: import_zod.z.string().default("3001"),
      TELEGRAM_BOT_TOKEN: import_zod.z.string().optional(),
      TELEGRAM_BOT_ID: import_zod.z.string().optional(),
      TELEGRAM_WEBHOOK_SECRET: import_zod.z.string().optional(),
      TELEGRAM_AUTH_MAX_AGE_SECONDS: import_zod.z.coerce.number().default(300),
      BOOTSTRAP_OWNER_TELEGRAM_ID: import_zod.z.string().optional(),
      ADMIN_BOOTSTRAP_CODE: import_zod.z.string().default("COREADMIN1991"),
      ADMIN_CODE_PEPPER: import_zod.z.string().optional(),
      SESSION_SIGNING_KEY_CURRENT: import_zod.z.string().optional(),
      SESSION_SIGNING_KEY_PREVIOUS: import_zod.z.string().optional(),
      FIELD_ENCRYPTION_KEY_CURRENT: import_zod.z.string().optional(),
      FIELD_ENCRYPTION_KEY_PREVIOUS: import_zod.z.string().optional(),
      RECEIPT_ANALYZER_PROVIDER: import_zod.z.string().optional(),
      RECEIPT_ANALYZER_API_KEY: import_zod.z.string().optional(),
      RECEIPT_SCREENING_MAX_WAIT_SECONDS: import_zod.z.coerce.number().default(30),
      GEOAPIFY_API_KEY: import_zod.z.string().optional(),
      PUBLIC_GEOAPIFY_MAP_KEY: import_zod.z.string().optional(),
      PAYMENT_GATEWAY_PROVIDER: import_zod.z.string().optional(),
      PAYMENT_GATEWAY_API_KEY: import_zod.z.string().optional(),
      PAYMENT_GATEWAY_WEBHOOK_SECRET: import_zod.z.string().optional(),
      ERROR_REPORTING_DSN: import_zod.z.string().optional()
    });
    parsed = envSchema.parse(process.env);
    if (isDev) {
      parsed.SESSION_SIGNING_KEY_CURRENT = parsed.SESSION_SIGNING_KEY_CURRENT || import_crypto2.default.randomBytes(32).toString("hex");
      parsed.FIELD_ENCRYPTION_KEY_CURRENT = parsed.FIELD_ENCRYPTION_KEY_CURRENT || import_crypto2.default.randomBytes(32).toString("hex");
      parsed.ADMIN_CODE_PEPPER = parsed.ADMIN_CODE_PEPPER || import_crypto2.default.randomBytes(32).toString("hex");
    } else {
      if (!parsed.SESSION_SIGNING_KEY_CURRENT) throw new Error("SESSION_SIGNING_KEY_CURRENT is required in production");
      if (!parsed.FIELD_ENCRYPTION_KEY_CURRENT) throw new Error("FIELD_ENCRYPTION_KEY_CURRENT is required in production");
      if (!parsed.ADMIN_CODE_PEPPER) throw new Error("ADMIN_CODE_PEPPER is required in production");
    }
    env = {
      ...parsed,
      IS_PREVIEW: isDev
    };
  }
});

// packages/db/index.ts
var import_crypto3, MockQuery, MockCollection, MockFirestore, firestoreDb, cloudStorage, db;
var init_db = __esm({
  "packages/db/index.ts"() {
    init_env();
    import_crypto3 = __toESM(require("crypto"), 1);
    MockQuery = class _MockQuery {
      constructor(docs) {
        this.docs = docs;
      }
      where(field, op, val) {
        return new _MockQuery(
          this.docs.filter((d) => {
            if (op === "==") return d.data[field] === val;
            return true;
          })
        );
      }
      limit(n) {
        return new _MockQuery(this.docs.slice(0, n));
      }
      async get() {
        return {
          empty: this.docs.length === 0,
          docs: this.docs.map((d) => ({
            id: d.id,
            exists: true,
            data: () => d.data
          }))
        };
      }
    };
    MockCollection = class {
      constructor(path2) {
        this.path = path2;
        this.records = /* @__PURE__ */ new Map();
      }
      doc(id) {
        const docId = id || import_crypto3.default.randomBytes(10).toString("hex");
        return {
          id: docId,
          set: async (data, options) => {
            if (options?.merge && this.records.has(docId)) {
              this.records.set(docId, { ...this.records.get(docId), ...data });
            } else {
              this.records.set(docId, data);
            }
          },
          get: async () => {
            const exists = this.records.has(docId);
            return {
              id: docId,
              exists,
              data: () => this.records.get(docId)
            };
          },
          update: async (data) => {
            if (!this.records.has(docId)) throw new Error("Document not found");
            this.records.set(docId, { ...this.records.get(docId), ...data });
          }
        };
      }
      async add(data) {
        const ref = this.doc();
        await ref.set(data);
        return ref;
      }
      where(field, op, val) {
        const allDocs = Array.from(this.records.entries()).map(([id, data]) => ({ id, data }));
        return new MockQuery(allDocs).where(field, op, val);
      }
      limit(n) {
        const allDocs = Array.from(this.records.entries()).map(([id, data]) => ({ id, data }));
        return new MockQuery(allDocs).limit(n);
      }
      async get() {
        const allDocs = Array.from(this.records.entries()).map(([id, data]) => ({ id, data }));
        return new MockQuery(allDocs).get();
      }
    };
    MockFirestore = class {
      constructor() {
        this.collections = /* @__PURE__ */ new Map();
      }
      collection(path2) {
        if (!this.collections.has(path2)) {
          this.collections.set(path2, new MockCollection(path2));
        }
        return this.collections.get(path2);
      }
      batch() {
        return {
          set: (ref, data, options) => ref.set(data, options),
          update: (ref, data) => ref.update(data),
          commit: async () => {
          }
        };
      }
    };
    if (env.IS_PREVIEW) {
      firestoreDb = new MockFirestore();
      cloudStorage = {
        bucket: () => ({
          file: () => ({
            getSignedUrl: async () => ["https://mock-storage.url/file"],
            save: async () => {
            }
          })
        })
      };
    } else {
      const { initializeApp, getApps, applicationDefault } = require("firebase-admin/app");
      const { getFirestore } = require("firebase-admin/firestore");
      const { getStorage } = require("firebase-admin/storage");
      if (!getApps().length) {
        initializeApp({
          credential: applicationDefault()
        });
      }
      firestoreDb = getFirestore();
      cloudStorage = getStorage();
    }
    db = firestoreDb;
  }
});

// apps/core-service/identity.ts
async function enrollOrUpdateIdentity(tenantId, botId, user, source) {
  const customersRef = db.collection(`tenants/${tenantId}/customers`);
  const customerQuery = await customersRef.where("telegramUserId", "==", user.id.toString()).limit(1).get();
  let primeMemberId;
  let customerDocId;
  if (customerQuery.empty) {
    let unique = false;
    while (!unique) {
      primeMemberId = import_crypto4.default.randomBytes(5).toString("hex").toUpperCase();
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
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
      enrollmentSource: source
    };
    const ref = await customersRef.add(newCustomer);
    customerDocId = ref.id;
  } else {
    const existing = customerQuery.docs[0];
    customerDocId = existing.id;
    const data = existing.data();
    primeMemberId = data.primeMemberId;
    if (data.firstName !== user.first_name || data.lastName !== user.last_name || data.username !== user.username) {
      await customersRef.doc(customerDocId).update({
        firstName: user.first_name,
        lastName: user.last_name || null,
        username: user.username || null,
        updatedAt: (/* @__PURE__ */ new Date()).toISOString()
      });
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
        observedAt: (/* @__PURE__ */ new Date()).toISOString()
      });
    }
  }
  return { customerDocId, primeMemberId };
}
var import_crypto4;
var init_identity = __esm({
  "apps/core-service/identity.ts"() {
    import_crypto4 = __toESM(require("crypto"), 1);
    init_db();
  }
});

// apps/core-service/auth.ts
var auth_exports = {};
__export(auth_exports, {
  adminLoginHandler: () => adminLoginHandler,
  telegramExchangeHandler: () => telegramExchangeHandler
});
var import_crypto5, telegramExchangeHandler, adminLoginHandler;
var init_auth2 = __esm({
  "apps/core-service/auth.ts"() {
    init_auth();
    init_env();
    init_db();
    import_crypto5 = __toESM(require("crypto"), 1);
    init_identity();
    telegramExchangeHandler = async (req, res) => {
      try {
        let initData = req.body.initData;
        const { tenantId } = req.body;
        if (!tenantId) {
          return res.status(400).json({ error: "Missing tenantId" });
        }
        let user = null;
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
        const sessionToken = import_crypto5.default.randomBytes(32).toString("hex");
        const sessionDigest = import_crypto5.default.createHash("sha256").update(sessionToken).digest("hex");
        await db.collection(`tenants/${tenantId}/sessions`).add({
          digest: sessionDigest,
          customerId: customerDocId,
          primeMemberId,
          telegramUserId: user.id.toString(),
          createdAt: (/* @__PURE__ */ new Date()).toISOString(),
          expiresAt: new Date(Date.now() + 1e3 * 60 * 60 * 24).toISOString()
          // 24 hours
        });
        res.cookie("session", sessionToken, {
          httpOnly: true,
          secure: true,
          sameSite: "strict",
          maxAge: 1e3 * 60 * 60 * 24
        });
        return res.json({ success: true, primeMemberId });
      } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal Server Error" });
      }
    };
    adminLoginHandler = async (req, res) => {
      try {
        const { initData, tenantId, accessCode } = req.body;
        if (!tenantId || !accessCode) {
          return res.status(400).json({ error: "Missing parameters" });
        }
        let user = null;
        if (env.IS_PREVIEW && (!initData || initData === "PREVIEW_MOCK")) {
          user = {
            id: 123456789,
            first_name: "Preview Admin"
          };
        } else {
          if (!initData) return res.status(400).json({ error: "Missing initData" });
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
        const normalizedCode = accessCode.trim().toUpperCase().normalize("NFKC");
        const expectedCode = env.ADMIN_BOOTSTRAP_CODE.trim().toUpperCase().normalize("NFKC");
        if (normalizedCode !== expectedCode) {
          return res.status(401).json({ error: "Invalid credentials" });
        }
        if (env.BOOTSTRAP_OWNER_TELEGRAM_ID && user.id.toString() !== env.BOOTSTRAP_OWNER_TELEGRAM_ID && !env.IS_PREVIEW) {
          return res.status(401).json({ error: "Invalid credentials" });
        }
        const opsRef = db.collection(`tenants/${tenantId}/operators`);
        const opsQuery = await opsRef.where("telegramUserId", "==", user.id.toString()).limit(1).get();
        let opDocId;
        if (opsQuery.empty) {
          const ref = await opsRef.add({
            telegramUserId: user.id.toString(),
            name: user.first_name,
            role: "Owner",
            createdAt: (/* @__PURE__ */ new Date()).toISOString()
          });
          opDocId = ref.id;
        } else {
          opDocId = opsQuery.docs[0].id;
        }
        const sessionToken = import_crypto5.default.randomBytes(32).toString("hex");
        const sessionDigest = import_crypto5.default.createHash("sha256").update(sessionToken).digest("hex");
        await db.collection(`tenants/${tenantId}/sessions`).add({
          digest: sessionDigest,
          operatorId: opDocId,
          telegramUserId: user.id.toString(),
          isAdmin: true,
          createdAt: (/* @__PURE__ */ new Date()).toISOString(),
          expiresAt: new Date(Date.now() + 1e3 * 60 * 60 * 8).toISOString()
          // 8 hours absolute
        });
        res.cookie("admin_session", sessionToken, {
          httpOnly: true,
          secure: true,
          sameSite: "strict",
          maxAge: 1e3 * 60 * 60 * 8
        });
        return res.json({ success: true });
      } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal Server Error" });
      }
    };
  }
});

// apps/core-service/telegram-webhook.ts
var telegram_webhook_exports = {};
__export(telegram_webhook_exports, {
  telegramWebhookHandler: () => telegramWebhookHandler
});
var telegramWebhookHandler;
var init_telegram_webhook = __esm({
  "apps/core-service/telegram-webhook.ts"() {
    init_env();
    init_db();
    init_identity();
    telegramWebhookHandler = async (req, res) => {
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
      const receiptRef = db.collection(`tenants/${tenantId}/telegram_update_receipts`).doc(update.update_id.toString());
      const existingReceipt = await receiptRef.get();
      if (existingReceipt.exists) {
        return res.status(200).send("OK");
      }
      await receiptRef.set({
        receivedAt: (/* @__PURE__ */ new Date()).toISOString()
      });
      if (update.message && update.message.chat && update.message.chat.type === "private") {
        const user = update.message.from;
        if (user && user.id) {
          await enrollOrUpdateIdentity(tenantId, "default_bot", user, "bot_webhook");
        }
      }
      res.status(200).send("OK");
    };
  }
});

// apps/core-service/catalog.ts
var catalog_exports = {};
__export(catalog_exports, {
  getCatalogHandler: () => getCatalogHandler,
  getProductHandler: () => getProductHandler
});
var getCatalogHandler, getProductHandler;
var init_catalog = __esm({
  "apps/core-service/catalog.ts"() {
    init_db();
    getCatalogHandler = async (req, res) => {
      const tenantId = "default";
      const productsRef = db.collection(`tenants/${tenantId}/products`);
      const snapshot = await productsRef.limit(10).get();
      let docs = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      if (docs.length === 0) {
        const dummyProducts = [
          { name: "Coffee Beans", price: 1500, compareAtPrice: null, availability: "in_stock", category: "Coffee", image: "https://placehold.co/400x500" },
          { name: "Espresso Maker", price: 12e3, compareAtPrice: 15e3, availability: "in_stock", category: "Equipment", image: "https://placehold.co/400x500" },
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
    getProductHandler = async (req, res) => {
      const tenantId = "default";
      const { id } = req.params;
      const productRef = db.collection(`tenants/${tenantId}/products`).doc(id);
      const doc = await productRef.get();
      if (!doc.exists) return res.status(404).json({ error: "Not found" });
      res.json({ data: { id: doc.id, ...doc.data() } });
    };
  }
});

// apps/core-service/order-queue.ts
var order_queue_exports = {};
__export(order_queue_exports, {
  getOrderQueueSummaryHandler: () => getOrderQueueSummaryHandler
});
var getOrderQueueSummaryHandler;
var init_order_queue = __esm({
  "apps/core-service/order-queue.ts"() {
    getOrderQueueSummaryHandler = async (req, res) => {
      const tenantId = "default";
      res.json({
        generated_at: (/* @__PURE__ */ new Date()).toISOString(),
        metric_version: "1.0",
        scope_key: "default-store",
        on_queue_count: 3,
        processing_count: 2,
        estimated_wait_minutes: 15,
        estimated_dispatch_minutes: 5,
        wait_sample_size: 10,
        dispatch_sample_size: 8,
        active_load: 5,
        traffic: "LIGHT",
        stale_after_seconds: 45
      });
    };
  }
});

// apps/core-service/cart.ts
var cart_exports = {};
__export(cart_exports, {
  getCartHandler: () => getCartHandler,
  updateCartItemHandler: () => updateCartItemHandler
});
var getCartHandler, updateCartItemHandler;
var init_cart = __esm({
  "apps/core-service/cart.ts"() {
    init_db();
    getCartHandler = async (req, res) => {
      const tenantId = "default";
      const customerId = req.headers["x-customer-id"] || "preview-user-id";
      const cartRef = db.collection(`tenants/${tenantId}/carts`).doc(customerId);
      const cartDoc = await cartRef.get();
      if (!cartDoc.exists) {
        return res.json({ data: { items: [] } });
      }
      res.json({ data: cartDoc.data() });
    };
    updateCartItemHandler = async (req, res) => {
      res.json({ success: true });
    };
  }
});

// apps/core-service/location.ts
var location_exports = {};
__export(location_exports, {
  autocompleteHandler: () => autocompleteHandler,
  geocodeHandler: () => geocodeHandler,
  reverseGeocodeHandler: () => reverseGeocodeHandler,
  routeHandler: () => routeHandler
});
var autocompleteHandler, geocodeHandler, reverseGeocodeHandler, routeHandler;
var init_location = __esm({
  "apps/core-service/location.ts"() {
    autocompleteHandler = async (req, res) => {
      const { q } = req.query;
      const apiKey = process.env.GEOAPIFY_API_KEY;
      if (!apiKey || apiKey === "") {
        const fakeData = [
          { properties: { formatted: `${q} St, Makati, Metro Manila, Philippines`, lat: 14.5547, lon: 121.0244, city: "Makati" } },
          { properties: { formatted: `${q} Ave, Quezon City, NCR, Philippines`, lat: 14.676, lon: 121.0437, city: "Quezon City" } }
        ];
        return res.json({ results: fakeData });
      }
      try {
        const url = `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(q)}&filter=countrycode:ph&bias=proximity:121.0509,14.5823&format=json&apiKey=${apiKey}`;
        const response = await fetch(url);
        const data = await response.json();
        res.json(data);
      } catch (err) {
        res.status(500).json({ error: "Location search failed" });
      }
    };
    geocodeHandler = async (req, res) => {
      const { text } = req.query;
      const apiKey = process.env.GEOAPIFY_API_KEY;
      if (!apiKey || apiKey === "") {
        return res.json({ results: [{ properties: { formatted: text, lat: 14.5, lon: 121 } }] });
      }
      try {
        const url = `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(text)}&format=json&apiKey=${apiKey}`;
        const response = await fetch(url);
        const data = await response.json();
        res.json(data);
      } catch (err) {
        res.status(500).json({ error: "Geocoding failed" });
      }
    };
    reverseGeocodeHandler = async (req, res) => {
      const { lat, lon } = req.query;
      const apiKey = process.env.GEOAPIFY_API_KEY;
      if (!apiKey || apiKey === "") {
        return res.json({ results: [{ properties: { formatted: `Fake Pin at ${lat}, ${lon}`, lat: Number(lat), lon: Number(lon) } }] });
      }
      try {
        const url = `https://api.geoapify.com/v1/geocode/reverse?lat=${lat}&lon=${lon}&format=json&apiKey=${apiKey}`;
        const response = await fetch(url);
        const data = await response.json();
        res.json(data);
      } catch (err) {
        res.status(500).json({ error: "Reverse geocoding failed" });
      }
    };
    routeHandler = async (req, res) => {
      const { waypoints } = req.body;
      const apiKey = process.env.GEOAPIFY_API_KEY;
      if (!apiKey || apiKey === "") {
        return res.json({ features: [{ properties: { distance: 5500, time: 1200 } }] });
      }
      try {
        const url = `https://api.geoapify.com/v1/routing?waypoints=${waypoints}&mode=motorcycle&apiKey=${apiKey}`;
        const response = await fetch(url);
        const data = await response.json();
        res.json(data);
      } catch (err) {
        res.status(500).json({ error: "Routing failed" });
      }
    };
  }
});

// apps/core-service/checkout.ts
var checkout_exports = {};
__export(checkout_exports, {
  createCheckoutSessionHandler: () => createCheckoutSessionHandler,
  updateCheckoutSessionHandler: () => updateCheckoutSessionHandler
});
var import_crypto6, createCheckoutSessionHandler, updateCheckoutSessionHandler;
var init_checkout = __esm({
  "apps/core-service/checkout.ts"() {
    init_db();
    import_crypto6 = __toESM(require("crypto"), 1);
    createCheckoutSessionHandler = async (req, res) => {
      const tenantId = "default";
      const customerId = req.headers["x-customer-id"] || "preview-user-id";
      const sessionId = import_crypto6.default.randomUUID();
      const sessionData = {
        id: sessionId,
        customerId,
        status: "active",
        items: req.body.items || [],
        deliveryInfo: null,
        promoCode: null,
        referralCode: null,
        totals: { subtotal: 0, deliveryFee: 0, discount: 0, total: 0 }
      };
      await db.collection(`tenants/${tenantId}/checkout_sessions`).doc(sessionId).set(sessionData);
      res.json({ data: sessionData });
    };
    updateCheckoutSessionHandler = async (req, res) => {
      res.json({ success: true });
    };
  }
});

// apps/core-service/error-handler.ts
var error_handler_exports = {};
__export(error_handler_exports, {
  errorHandler: () => errorHandler
});
var errorHandler;
var init_error_handler = __esm({
  "apps/core-service/error-handler.ts"() {
    errorHandler = (err, req, res, next) => {
      console.error("Error Details:", err);
      const status = err.status || 500;
      const message = status === 500 ? "Internal Server Error" : err.message;
      res.status(status).json({
        error: {
          message,
          code: err.code || "UNKNOWN_ERROR",
          requestId: req.headers["x-request-id"] || "req-" + Date.now()
        }
      });
    };
  }
});

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_promises = __toESM(require("fs/promises"), 1);
var import_vite = require("vite");
async function startServer() {
  const app = (0, import_express.default)();
  const PORT = 3e3;
  app.use(import_express.default.json());
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });
  app.post("/v1/auth/telegram/exchange", async (req, res, next) => {
    try {
      const { telegramExchangeHandler: telegramExchangeHandler2 } = await Promise.resolve().then(() => (init_auth2(), auth_exports));
      await telegramExchangeHandler2(req, res);
    } catch (e) {
      next(e);
    }
  });
  app.post("/v1/webhooks/telegram/:botKey", async (req, res, next) => {
    try {
      const { telegramWebhookHandler: telegramWebhookHandler2 } = await Promise.resolve().then(() => (init_telegram_webhook(), telegram_webhook_exports));
      await telegramWebhookHandler2(req, res);
    } catch (e) {
      next(e);
    }
  });
  app.post("/v1/admin/auth/login", async (req, res, next) => {
    try {
      const { adminLoginHandler: adminLoginHandler2 } = await Promise.resolve().then(() => (init_auth2(), auth_exports));
      await adminLoginHandler2(req, res);
    } catch (e) {
      next(e);
    }
  });
  app.get("/v1/catalog", async (req, res, next) => {
    try {
      const { getCatalogHandler: getCatalogHandler2 } = await Promise.resolve().then(() => (init_catalog(), catalog_exports));
      await getCatalogHandler2(req, res);
    } catch (e) {
      next(e);
    }
  });
  app.get("/v1/catalog/products/:id", async (req, res, next) => {
    try {
      const { getProductHandler: getProductHandler2 } = await Promise.resolve().then(() => (init_catalog(), catalog_exports));
      await getProductHandler2(req, res);
    } catch (e) {
      next(e);
    }
  });
  app.get("/v1/order-queue/summary", async (req, res, next) => {
    try {
      const { getOrderQueueSummaryHandler: getOrderQueueSummaryHandler2 } = await Promise.resolve().then(() => (init_order_queue(), order_queue_exports));
      await getOrderQueueSummaryHandler2(req, res);
    } catch (e) {
      next(e);
    }
  });
  app.get("/v1/cart", async (req, res, next) => {
    try {
      const { getCartHandler: getCartHandler2 } = await Promise.resolve().then(() => (init_cart(), cart_exports));
      await getCartHandler2(req, res);
    } catch (e) {
      next(e);
    }
  });
  app.patch("/v1/cart/items/:id", async (req, res, next) => {
    try {
      const { updateCartItemHandler: updateCartItemHandler2 } = await Promise.resolve().then(() => (init_cart(), cart_exports));
      await updateCartItemHandler2(req, res);
    } catch (e) {
      next(e);
    }
  });
  app.get("/v1/location/autocomplete", async (req, res, next) => {
    try {
      const { autocompleteHandler: autocompleteHandler2 } = await Promise.resolve().then(() => (init_location(), location_exports));
      await autocompleteHandler2(req, res);
    } catch (e) {
      next(e);
    }
  });
  app.get("/v1/location/geocode", async (req, res, next) => {
    try {
      const { geocodeHandler: geocodeHandler2 } = await Promise.resolve().then(() => (init_location(), location_exports));
      await geocodeHandler2(req, res);
    } catch (e) {
      next(e);
    }
  });
  app.get("/v1/location/reverse-geocode", async (req, res, next) => {
    try {
      const { reverseGeocodeHandler: reverseGeocodeHandler2 } = await Promise.resolve().then(() => (init_location(), location_exports));
      await reverseGeocodeHandler2(req, res);
    } catch (e) {
      next(e);
    }
  });
  app.post("/v1/location/route", async (req, res, next) => {
    try {
      const { routeHandler: routeHandler2 } = await Promise.resolve().then(() => (init_location(), location_exports));
      await routeHandler2(req, res);
    } catch (e) {
      next(e);
    }
  });
  app.post("/v1/checkout/sessions", async (req, res, next) => {
    try {
      const { createCheckoutSessionHandler: createCheckoutSessionHandler2 } = await Promise.resolve().then(() => (init_checkout(), checkout_exports));
      await createCheckoutSessionHandler2(req, res);
    } catch (e) {
      next(e);
    }
  });
  app.patch("/v1/checkout/sessions/:id", async (req, res, next) => {
    try {
      const { updateCheckoutSessionHandler: updateCheckoutSessionHandler2 } = await Promise.resolve().then(() => (init_checkout(), checkout_exports));
      await updateCheckoutSessionHandler2(req, res);
    } catch (e) {
      next(e);
    }
  });
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "custom"
    });
    app.use(vite.middlewares);
    app.use("/admin", async (req, res, next) => {
      try {
        const url = req.originalUrl;
        let template = await import_promises.default.readFile(import_path.default.resolve(process.cwd(), "apps/admin/src/index.html"), "utf-8");
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ "Content-Type": "text/html" }).end(template);
      } catch (e) {
        vite.ssrFixStacktrace(e);
        next(e);
      }
    });
    app.use("*", async (req, res, next) => {
      if (req.originalUrl.startsWith("/api") || req.originalUrl.startsWith("/v1")) return next();
      try {
        const url = req.originalUrl;
        let template = await import_promises.default.readFile(import_path.default.resolve(process.cwd(), "apps/storefront/src/index.html"), "utf-8");
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ "Content-Type": "text/html" }).end(template);
      } catch (e) {
        vite.ssrFixStacktrace(e);
        next(e);
      }
    });
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("/admin*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "apps/admin/src/index.html"));
    });
    app.get("*", (req, res) => {
      if (req.originalUrl.startsWith("/api") || req.originalUrl.startsWith("/v1")) return res.status(404).end();
      res.sendFile(import_path.default.join(distPath, "apps/storefront/src/index.html"));
    });
  }
  app.use(async (err, req, res, next) => {
    const { errorHandler: errorHandler2 } = await Promise.resolve().then(() => (init_error_handler(), error_handler_exports));
    errorHandler2(err, req, res, next);
  });
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
