import { describe, it, expect, vi } from 'vitest';
import { getHeartbeatHandler } from './reports';
import { db } from '../../packages/db/index.js';

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
