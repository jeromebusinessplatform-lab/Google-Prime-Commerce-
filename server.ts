import express from "express";
import path from "path";
import fs from "fs/promises";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Add JSON parsing middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ limit: '10mb', extended: true }));

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.post("/v1/auth/telegram/exchange", async (req, res, next) => {
    try {
      const { telegramExchangeHandler } = await import("./apps/core-service/auth.js");
      await telegramExchangeHandler(req, res);
    } catch (e) {
      next(e);
    }
  });

  app.post("/v1/webhooks/telegram/:botKey", async (req, res, next) => {
    try {
      const { telegramWebhookHandler } = await import("./apps/core-service/telegram-webhook.js");
      await telegramWebhookHandler(req, res);
    } catch (e) {
      next(e);
    }
  });

  app.post("/v1/admin/auth/login", async (req, res, next) => {
    try {
      const { adminLoginHandler } = await import("./apps/core-service/auth.js");
      await adminLoginHandler(req, res);
    } catch (e) {
      next(e);
    }
  });

  app.get("/v1/catalog", async (req, res, next) => {
    try {
      const { getCatalogHandler } = await import("./apps/core-service/catalog.js");
      await getCatalogHandler(req, res);
    } catch (e) {
      next(e);
    }
  });

  app.get("/v1/catalog/products/:id", async (req, res, next) => {
    try {
      const { getProductHandler } = await import("./apps/core-service/catalog.js");
      await getProductHandler(req, res);
    } catch (e) {
      next(e);
    }
  });

  app.post("/v1/catalog/products", async (req, res, next) => {
    try {
      const { createProductHandler } = await import("./apps/core-service/catalog.js");
      await createProductHandler(req, res);
    } catch (e) {
      next(e);
    }
  });

  app.patch("/v1/catalog/products/:id", async (req, res, next) => {
    try {
      const { updateProductHandler } = await import("./apps/core-service/catalog.js");
      await updateProductHandler(req, res);
    } catch (e) {
      next(e);
    }
  });

  app.delete("/v1/catalog/products/:id", async (req, res, next) => {
    try {
      const { deleteProductHandler } = await import("./apps/core-service/catalog.js");
      await deleteProductHandler(req, res);
    } catch (e) {
      next(e);
    }
  });

  app.post("/v1/catalog/products/:id/duplicate", async (req, res, next) => {
    try {
      const { duplicateProductHandler } = await import("./apps/core-service/catalog.js");
      await duplicateProductHandler(req, res);
    } catch (e) {
      next(e);
    }
  });

  app.get("/v1/catalog/categories", async (req, res, next) => {
    try {
      const { getCategoriesHandler } = await import("./apps/core-service/catalog.js");
      await getCategoriesHandler(req, res);
    } catch (e) {
      next(e);
    }
  });

  app.post("/v1/catalog/categories", async (req, res, next) => {
    try {
      const { upsertCategoryHandler } = await import("./apps/core-service/catalog.js");
      await upsertCategoryHandler(req, res);
    } catch (e) {
      next(e);
    }
  });

  app.patch("/v1/catalog/categories/:id", async (req, res, next) => {
    try {
      const { upsertCategoryHandler } = await import("./apps/core-service/catalog.js");
      await upsertCategoryHandler(req, res);
    } catch (e) {
      next(e);
    }
  });

  app.post("/v1/catalog/bulk-update", async (req, res, next) => {
    try {
      const { bulkUpdateHandler } = await import("./apps/core-service/bulk-operations.js");
      await bulkUpdateHandler(req, res);
    } catch (e) {
      next(e);
    }
  });

  app.post("/v1/catalog/import", async (req, res, next) => {
    try {
      const { importCSVHandler } = await import("./apps/core-service/bulk-operations.js");
      await importCSVHandler(req, res);
    } catch (e) {
      next(e);
    }
  });

  app.get("/v1/catalog/export", async (req, res, next) => {
    try {
      const { exportCSVHandler } = await import("./apps/core-service/bulk-operations.js");
      await exportCSVHandler(req, res);
    } catch (e) {
      next(e);
    }
  });

  // Identity & Customer
  app.get("/v1/customer", async (req, res, next) => {
    try {
      const { getCustomerHandler } = await import("./apps/core-service/identity.js");
      await getCustomerHandler(req, res);
    } catch (e) {
      next(e);
    }
  });

  app.patch("/v1/customer/:id", async (req, res, next) => {
    try {
      const { updateCustomerHandler } = await import("./apps/core-service/identity.js");
      await updateCustomerHandler(req, res);
    } catch (e) {
      next(e);
    }
  });

  // Delivery Origins
  app.get("/v1/delivery-origins", async (req, res, next) => {
    try {
      const { getDeliveryOriginsHandler } = await import("./apps/core-service/courier.js");
      await getDeliveryOriginsHandler(req, res);
    } catch (e) {
      next(e);
    }
  });

  app.post("/v1/delivery-origins", async (req, res, next) => {
    try {
      const { upsertDeliveryOriginHandler } = await import("./apps/core-service/courier.js");
      await upsertDeliveryOriginHandler(req, res);
    } catch (e) {
      next(e);
    }
  });

  app.patch("/v1/delivery-origins/:id", async (req, res, next) => {
    try {
      const { upsertDeliveryOriginHandler } = await import("./apps/core-service/courier.js");
      await upsertDeliveryOriginHandler(req, res);
    } catch (e) {
      next(e);
    }
  });

  app.post("/v1/delivery-origins/set-default", async (req, res, next) => {
    try {
      const { setDefaultDeliveryOriginHandler } = await import("./apps/core-service/courier.js");
      await setDefaultDeliveryOriginHandler(req, res);
    } catch (e) {
      next(e);
    }
  });

  // Couriers
  app.get("/v1/couriers", async (req, res, next) => {
    try {
      const { getCouriersHandler } = await import("./apps/core-service/courier.js");
      await getCouriersHandler(req, res);
    } catch (e) {
      next(e);
    }
  });

  app.post("/v1/couriers", async (req, res, next) => {
    try {
      const { upsertCourierHandler } = await import("./apps/core-service/courier.js");
      await upsertCourierHandler(req, res);
    } catch (e) {
      next(e);
    }
  });

  app.patch("/v1/couriers/:id", async (req, res, next) => {
    try {
      const { upsertCourierHandler } = await import("./apps/core-service/courier.js");
      await upsertCourierHandler(req, res);
    } catch (e) {
      next(e);
    }
  });

  app.post("/v1/couriers/:id/toggle", async (req, res, next) => {
    try {
      const { toggleCourierAvailabilityHandler } = await import("./apps/core-service/courier.js");
      await toggleCourierAvailabilityHandler(req, res);
    } catch (e) {
      next(e);
    }
  });

  app.post("/v1/delivery-quote", async (req, res, next) => {
    try {
      const { getDeliveryQuoteHandler } = await import("./apps/core-service/courier.js");
      await getDeliveryQuoteHandler(req, res);
    } catch (e) {
      next(e);
    }
  });

  // Geoapify Proxy
  app.post("/v1/geo/autocomplete", async (req, res, next) => {
    try {
      const { autocompleteHandler } = await import("./apps/core-service/geoapify.js");
      await autocompleteHandler(req, res);
    } catch (e) {
      next(e);
    }
  });

  app.post("/v1/geo/geocode", async (req, res, next) => {
    try {
      const { geocodeHandler } = await import("./apps/core-service/geoapify.js");
      await geocodeHandler(req, res);
    } catch (e) {
      next(e);
    }
  });

  app.post("/v1/geo/reverse-geocode", async (req, res, next) => {
    try {
      const { reverseGeocodeHandler } = await import("./apps/core-service/geoapify.js");
      await reverseGeocodeHandler(req, res);
    } catch (e) {
      next(e);
    }
  });

  app.post("/v1/geo/routing", async (req, res, next) => {
    try {
      const { routingHandler } = await import("./apps/core-service/geoapify.js");
      await routingHandler(req, res);
    } catch (e) {
      next(e);
    }
  });

  app.get("/v1/order-queue/summary", async (req, res, next) => {
    try {
      const { getOrderQueueSummaryHandler } = await import("./apps/core-service/order-queue.js");
      await getOrderQueueSummaryHandler(req, res);
    } catch (e) {
      next(e);
    }
  });

  app.get("/v1/cart", async (req, res, next) => {
    try {
      const { getCartHandler } = await import("./apps/core-service/cart.js");
      await getCartHandler(req, res);
    } catch (e) {
      next(e);
    }
  });

  app.patch("/v1/cart/items/:id", async (req, res, next) => {
    try {
      const { updateCartItemHandler } = await import("./apps/core-service/cart.js");
      await updateCartItemHandler(req, res);
    } catch (e) {
      next(e);
    }
  });

  app.post("/v1/cart/clear", async (req, res, next) => {
    try {
      const { clearCartHandler } = await import("./apps/core-service/cart.js");
      await clearCartHandler(req, res);
    } catch (e) {
      next(e);
    }
  });

  app.get("/v1/orders", async (req, res, next) => {
    try {
      const { getOrdersHandler } = await import("./apps/core-service/orders.js");
      await getOrdersHandler(req, res);
    } catch (e) {
      next(e);
    }
  });

  app.get("/v1/orders/:id", async (req, res, next) => {
    try {
      const { getOrderHandler } = await import("./apps/core-service/orders.js");
      await getOrderHandler(req, res);
    } catch (e) {
      next(e);
    }
  });

  app.patch("/v1/orders/:id", async (req, res, next) => {
    try {
      const { updateOrderHandler } = await import("./apps/core-service/orders.js");
      await updateOrderHandler(req, res);
    } catch (e) {
      next(e);
    }
  });

  app.post("/v1/orders", async (req, res, next) => {
    try {
      const { createOrderHandler } = await import("./apps/core-service/orders.js");
      await createOrderHandler(req, res);
    } catch (e) {
      next(e);
    }
  });

  app.get("/v1/promotions", async (req, res, next) => {
    try {
      const { getPromotionsHandler } = await import("./apps/core-service/promotions.js");
      await getPromotionsHandler(req, res);
    } catch (e) {
      next(e);
    }
  });

  app.post("/v1/promotions", async (req, res, next) => {
    try {
      const { createPromotionHandler } = await import("./apps/core-service/promotions.js");
      await createPromotionHandler(req, res);
    } catch (e) {
      next(e);
    }
  });

  app.post("/v1/promotions/validate", async (req, res, next) => {
    try {
      const { validatePromotionHandler } = await import("./apps/core-service/promotions.js");
      await validatePromotionHandler(req, res);
    } catch (e) {
      next(e);
    }
  });

  app.get("/v1/location/autocomplete", async (req, res, next) => {
    try {
      const { autocompleteHandler } = await import("./apps/core-service/location.js");
      await autocompleteHandler(req, res);
    } catch (e) {
      next(e);
    }
  });

  app.get("/v1/location/geocode", async (req, res, next) => {
    try {
      const { geocodeHandler } = await import("./apps/core-service/location.js");
      await geocodeHandler(req, res);
    } catch (e) {
      next(e);
    }
  });

  app.get("/v1/location/reverse-geocode", async (req, res, next) => {
    try {
      const { reverseGeocodeHandler } = await import("./apps/core-service/location.js");
      await reverseGeocodeHandler(req, res);
    } catch (e) {
      next(e);
    }
  });

  app.post("/v1/location/route", async (req, res, next) => {
    try {
      const { routeHandler } = await import("./apps/core-service/location.js");
      await routeHandler(req, res);
    } catch (e) {
      next(e);
    }
  });

  app.post("/v1/checkout/sessions", async (req, res, next) => {
    try {
      const { createCheckoutSessionHandler } = await import("./apps/core-service/checkout.js");
      await createCheckoutSessionHandler(req, res);
    } catch (e) {
      next(e);
    }
  });

  app.patch("/v1/checkout/sessions/:id", async (req, res, next) => {
    try {
      const { updateCheckoutSessionHandler } = await import("./apps/core-service/checkout.js");
      await updateCheckoutSessionHandler(req, res);
    } catch (e) {
      next(e);
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "custom",
    });
    app.use(vite.middlewares);
    
    app.use('/admin', async (req, res, next) => {
      try {
        const url = req.originalUrl;
        let template = await fs.readFile(path.resolve(process.cwd(), 'apps/admin/src/index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });

    app.use('*', async (req, res, next) => {
      if (req.originalUrl.startsWith('/api') || req.originalUrl.startsWith('/v1')) return next();
      try {
        const url = req.originalUrl;
        let template = await fs.readFile(path.resolve(process.cwd(), 'apps/storefront/src/index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });

  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('/admin*', (req, res) => {
      res.sendFile(path.join(distPath, 'apps/admin/src/index.html'));
    });
    app.get('*', (req, res) => {
      if (req.originalUrl.startsWith('/api') || req.originalUrl.startsWith('/v1')) return res.status(404).end();
      res.sendFile(path.join(distPath, 'apps/storefront/src/index.html'));
    });
  }

  app.use(async (err: any, req: any, res: any, next: any) => {
    const { errorHandler } = await import("./apps/core-service/error-handler.js");
    errorHandler(err, req, res, next);
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
