import { Request, Response } from "express";
import { db } from "../../packages/db/index.js";

const tenantId = "default";

export const getOperationalReportHandler = async (_req: Request, res: Response) => {
  const orders = (await db.collection(`tenants/${tenantId}/orders`).get()).docs.map((d: any) => d.data());
  const customers = (await db.collection(`tenants/${tenantId}/customers`).get()).docs.map((d: any) => d.data());
  const supportTickets = (await db.collection(`tenants/${tenantId}/support_tickets`).get()).docs.map((d: any) => d.data());
  const fraudCases = (await db.collection(`tenants/${tenantId}/fraud_cases`).get()).docs.map((d: any) => d.data());

  const revenue = orders.reduce((sum: number, order: any) => sum + Number(order.total || 0), 0);
  const paymentReviewCount = orders.filter((order: any) => order.status === "payment_review").length;
  const validatedCount = orders.filter((order: any) => order.reviewStatus === "VALIDATED").length;
  const unvalidatedCount = orders.filter((order: any) => order.reviewStatus === "UNVALIDATED").length;

  res.json({
    generatedAt: new Date().toISOString(),
    orders: orders.length,
    customers: customers.length,
    revenue,
    paymentReviewCount,
    validatedCount,
    unvalidatedCount,
    openSupportTickets: supportTickets.filter((ticket: any) => ticket.status !== "closed").length,
    openFraudCases: fraudCases.filter((c: any) => c.status !== "closed").length,
  });
};

export const createSupportTicketHandler = async (req: Request, res: Response) => {
  const ticket = {
    id: `TCK-${Date.now()}`,
    ...req.body,
    status: "open",
    createdAt: new Date().toISOString(),
  };
  await db.collection(`tenants/${tenantId}/support_tickets`).doc(ticket.id).set(ticket);
  res.json({ success: true, data: ticket });
};

export const listSupportTicketsHandler = async (_req: Request, res: Response) => {
  const snapshot = await db.collection(`tenants/${tenantId}/support_tickets`).get();
  res.json({ data: snapshot.docs.map((d: any) => ({ id: d.id, ...d.data() })) });
};

export const updateSupportTicketHandler = async (req: Request, res: Response) => {
  const id = req.params.id;
  const ref = db.collection(`tenants/${tenantId}/support_tickets`).doc(id);
  const existing = await ref.get();
  if (!existing.exists) return res.status(404).json({ error: "Ticket not found" });
  const next = { ...existing.data(), ...req.body, updatedAt: new Date().toISOString() };
  await ref.set(next);
  res.json({ success: true, data: next });
};

export const createFraudCaseHandler = async (req: Request, res: Response) => {
  const caseRecord = {
    id: `FRC-${Date.now()}`,
    ...req.body,
    status: "open",
    createdAt: new Date().toISOString(),
  };
  await db.collection(`tenants/${tenantId}/fraud_cases`).doc(caseRecord.id).set(caseRecord);
  res.json({ success: true, data: caseRecord });
};

export const listFraudCasesHandler = async (_req: Request, res: Response) => {
  const snapshot = await db.collection(`tenants/${tenantId}/fraud_cases`).get();
  res.json({ data: snapshot.docs.map((d: any) => ({ id: d.id, ...d.data() })) });
};

export const updateFraudCaseHandler = async (req: Request, res: Response) => {
  const id = req.params.id;
  const ref = db.collection(`tenants/${tenantId}/fraud_cases`).doc(id);
  const existing = await ref.get();
  if (!existing.exists) return res.status(404).json({ error: "Fraud case not found" });
  const next = { ...existing.data(), ...req.body, updatedAt: new Date().toISOString() };
  await ref.set(next);
  res.json({ success: true, data: next });
};
