import { describe, it, expect, vi } from 'vitest';
import { getHeartbeatHandler, createFraudCaseHandler, listFraudCasesHandler, updateFraudCaseHandler } from './reports';
import { db } from '../../packages/db/index.js';

describe('fraud cases handler', () => {
  it('creates and lists fraud cases', async () => {
    const caseData = { title: 'Test Fraud', notes: 'Suspicious activity' };
    const reqCreate = { body: caseData } as any;
    const resCreate = { json: vi.fn() } as any;

    await createFraudCaseHandler(reqCreate, resCreate);
    expect(resCreate.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      data: expect.objectContaining(caseData)
    }));

    const reqList = {} as any;
    const resList = { json: vi.fn() } as any;
    await listFraudCasesHandler(reqList, resList);
    expect(resList.json).toHaveBeenCalled();
  });

  it('updates fraud case status', async () => {
    const caseRef = await db.collection('tenants/default/fraud_cases').add({ title: 'Test', status: 'open' });
    const reqUpdate = { params: { id: caseRef.id }, body: { status: 'closed' } } as any;
    const resUpdate = { json: vi.fn() } as any;

    await updateFraudCaseHandler(reqUpdate, resUpdate);
    expect(resUpdate.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });
});

describe('heartbeat handler', () => {
  it('returns healthy status when orders are up to date', async () => {
    // Seed order
    await db.collection('tenants/default/orders').add({
      updatedAt: new Date().toISOString(),
    });

    const req = {} as any;
    const res = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis(),
    } as any;

    await getHeartbeatHandler(req, res);

    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      status: 'healthy',
    }));
  });
});
