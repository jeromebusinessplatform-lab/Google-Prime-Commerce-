import { Request, Response, NextFunction } from "express";

import { telegramExchangeHandler, adminLoginHandler } from "./auth.js";
import { telegramWebhookHandler } from "./telegram-webhook.js";
import {
  getCatalogHandler,
  getProductHandler,
  createProductHandler,
  updateProductHandler,
  deleteProductHandler,
  duplicateProductHandler,
  getCategoriesHandler,
  upsertCategoryHandler,
} from "./catalog.js";
import { bulkUpdateHandler, importCSVHandler, exportCSVHandler } from "./bulk-operations.js";
import { getTenantHandler, updateTenantHandler } from "./tenant.js";
import { getCustomerHandler, updateCustomerHandler } from "./identity.js";
import {
  getDeliveryOriginsHandler,
  upsertDeliveryOriginHandler,
  setDefaultDeliveryOriginHandler,
  getCouriersHandler,
  upsertCourierHandler,
  toggleCourierAvailabilityHandler,
  getDeliveryQuoteHandler,
} from "./courier.js";
import { autocompleteHandler, geocodeHandler, reverseGeocodeHandler, routingHandler } from "./geoapify.js";
import { getOrderQueueSummaryHandler } from "./order-queue.js";
import { getCartHandler, updateCartItemHandler, clearCartHandler } from "./cart.js";
import * as orders from "./orders.js";
import { getPromotionsHandler, createPromotionHandler, validatePromotionHandler } from "./promotions.js";
import { autocompleteHandler as locationAutocomplete, geocodeHandler as locationGeocode, reverseGeocodeHandler as locationReverse, routeHandler } from "./location.js";
import { createCheckoutSessionHandler, updateCheckoutSessionHandler, listCheckoutDraftsHandler } from "./checkout.js";
import { getOperationalReportHandler, createSupportTicketHandler, createFraudCaseHandler, listSupportTicketsHandler, updateSupportTicketHandler, listFraudCasesHandler, updateFraudCaseHandler } from "./reports.js";
import { finalizePaymentReviewHandler } from "./orders.js";

export type HttpMethod = "get" | "post" | "patch" | "put" | "delete";

export interface ApiRoute {
  method: HttpMethod;
  path: string;
  handler: (req: Request, res: Response) => Promise<any> | any;
}

// Single source of truth for the API surface. Registered on the Express app
// by `registerApiRoutes` (server.ts) and consumed by the Cloudflare Worker
// fetch router (worker/router.ts).
//
// Note: `orders.js` currently only exports `createOrderHandler`; the other
// order routes are registered for parity with the original server but their
// handlers are unresolved (returns 500, same as before the migration).
export const apiRoutes: ApiRoute[] = [
  { method: "post", path: "/v1/auth/telegram/exchange", handler: telegramExchangeHandler },
  { method: "post", path: "/v1/admin/auth/login", handler: adminLoginHandler },
  { method: "post", path: "/v1/webhooks/telegram/:botKey", handler: telegramWebhookHandler },

  { method: "get", path: "/v1/catalog", handler: getCatalogHandler },
  { method: "get", path: "/v1/catalog/products/:id", handler: getProductHandler },
  { method: "post", path: "/v1/catalog/products", handler: createProductHandler },
  { method: "patch", path: "/v1/catalog/products/:id", handler: updateProductHandler },
  { method: "delete", path: "/v1/catalog/products/:id", handler: deleteProductHandler },
  { method: "post", path: "/v1/catalog/products/:id/duplicate", handler: duplicateProductHandler },
  { method: "get", path: "/v1/catalog/categories", handler: getCategoriesHandler },
  { method: "post", path: "/v1/catalog/categories", handler: upsertCategoryHandler },
  { method: "patch", path: "/v1/catalog/categories/:id", handler: upsertCategoryHandler },
  { method: "post", path: "/v1/catalog/bulk-update", handler: bulkUpdateHandler },
  { method: "post", path: "/v1/catalog/import", handler: importCSVHandler },
  { method: "get", path: "/v1/catalog/export", handler: exportCSVHandler },

  { method: "get", path: "/v1/tenant", handler: getTenantHandler },
  { method: "patch", path: "/v1/tenant", handler: updateTenantHandler },
  { method: "get", path: "/v1/customer", handler: getCustomerHandler },
  { method: "patch", path: "/v1/customer/:id", handler: updateCustomerHandler },

  { method: "get", path: "/v1/delivery-origins", handler: getDeliveryOriginsHandler },
  { method: "post", path: "/v1/delivery-origins", handler: upsertDeliveryOriginHandler },
  { method: "patch", path: "/v1/delivery-origins/:id", handler: upsertDeliveryOriginHandler },
  { method: "post", path: "/v1/delivery-origins/set-default", handler: setDefaultDeliveryOriginHandler },
  { method: "get", path: "/v1/couriers", handler: getCouriersHandler },
  { method: "post", path: "/v1/couriers", handler: upsertCourierHandler },
  { method: "patch", path: "/v1/couriers/:id", handler: upsertCourierHandler },
  { method: "post", path: "/v1/couriers/:id/toggle", handler: toggleCourierAvailabilityHandler },
  { method: "post", path: "/v1/delivery-quote", handler: getDeliveryQuoteHandler },

  { method: "post", path: "/v1/geo/autocomplete", handler: autocompleteHandler },
  { method: "post", path: "/v1/geo/geocode", handler: geocodeHandler },
  { method: "post", path: "/v1/geo/reverse-geocode", handler: reverseGeocodeHandler },
  { method: "post", path: "/v1/geo/routing", handler: routingHandler },

  { method: "get", path: "/v1/order-queue/summary", handler: getOrderQueueSummaryHandler },
  { method: "get", path: "/v1/cart", handler: getCartHandler },
  { method: "patch", path: "/v1/cart/items/:id", handler: updateCartItemHandler },
  { method: "post", path: "/v1/cart/clear", handler: clearCartHandler },

  { method: "get", path: "/v1/orders", handler: (orders as any).getOrdersHandler },
  { method: "get", path: "/v1/orders/:id", handler: (orders as any).getOrderHandler },
  { method: "patch", path: "/v1/orders/:id", handler: (orders as any).updateOrderHandler },
  { method: "post", path: "/v1/orders/:id/analyze-receipt", handler: (orders as any).analyzeReceiptHandler },
  { method: "post", path: "/v1/orders/:id/finalize-review", handler: finalizePaymentReviewHandler },
  { method: "post", path: "/v1/orders/:id/review-receipt", handler: (orders as any).reviewReceiptHandler },
  { method: "post", path: "/v1/orders/:id/status", handler: (orders as any).setOrderFulfillmentStatusHandler },
  { method: "post", path: "/v1/orders/:id/amendments", handler: (orders as any).createOrderAmendmentHandler },
  { method: "post", path: "/v1/orders", handler: orders.createOrderHandler },

  { method: "get", path: "/v1/promotions", handler: getPromotionsHandler },
  { method: "post", path: "/v1/promotions", handler: createPromotionHandler },
  { method: "post", path: "/v1/promotions/validate", handler: validatePromotionHandler },

  { method: "get", path: "/v1/location/autocomplete", handler: locationAutocomplete },
  { method: "get", path: "/v1/location/geocode", handler: locationGeocode },
  { method: "get", path: "/v1/location/reverse-geocode", handler: locationReverse },
  { method: "get", path: "/v1/location/route", handler: routeHandler },

  { method: "post", path: "/v1/checkout/sessions", handler: createCheckoutSessionHandler },
  { method: "patch", path: "/v1/checkout/sessions/:id", handler: updateCheckoutSessionHandler },
  { method: "get", path: "/v1/checkout/drafts", handler: listCheckoutDraftsHandler },
  { method: "post", path: "/v1/payments/drafts", handler: (orders as any).createPaymentDraftHandler },

  { method: "get", path: "/v1/reports/operational", handler: getOperationalReportHandler },
  { method: "post", path: "/v1/support/tickets", handler: createSupportTicketHandler },
  { method: "get", path: "/v1/support/tickets", handler: listSupportTicketsHandler },
  { method: "patch", path: "/v1/support/tickets/:id", handler: updateSupportTicketHandler },
  { method: "post", path: "/v1/fraud/cases", handler: createFraudCaseHandler },
  { method: "get", path: "/v1/fraud/cases", handler: listFraudCasesHandler },
  { method: "patch", path: "/v1/fraud/cases/:id", handler: updateFraudCaseHandler },
];

export function registerApiRoutes(app: any) {
  for (const route of apiRoutes) {
    if (typeof route.handler !== "function") continue;
    app[route.method](route.path, async (req: Request, res: Response, next: NextFunction) => {
      try {
        await route.handler(req, res);
      } catch (e) {
        next(e);
      }
    });
  }
}
