import { describe, it, expect, vi } from 'vitest';
import { updateProductStatusHandler } from './catalog';
import { db } from '../../packages/db/index.js';

describe('update product status handler', () => {
  it('updates product status', async () => {
    const prodId = 'prod-123';
    const mockUpdate = vi.fn().mockResolvedValue({});
    
    vi.spyOn(db, 'collection').mockReturnValue({
      doc: vi.fn().mockReturnValue({
        get: vi.fn().mockResolvedValue({ exists: true, data: () => ({ status: 'draft' }) }),
        update: mockUpdate
      })
    } as any);

    const req = { 
        params: { id: prodId },
        body: { status: 'active' }
    } as any;
    const res = { json: vi.fn() } as any;

    await updateProductStatusHandler(req, res);

    expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({
      status: 'active'
    }));
    expect(res.json).toHaveBeenCalledWith({ success: true });
  });

  it('rejects invalid status', async () => {
    const req = { 
        params: { id: 'prod-123' },
        body: { status: 'invalid' }
    } as any;
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() } as any;

    await updateProductStatusHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });
});
