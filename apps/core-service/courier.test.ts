import { describe, it, expect, vi } from 'vitest';
import { deleteCourierHandler } from './courier';
import { db } from '../../packages/db/index.js';

describe('delete courier handler', () => {
  it('deletes a courier', async () => {
    const courierId = 'courier-123';
    const mockDelete = vi.fn().mockResolvedValue({});
    
    vi.spyOn(db, 'collection').mockReturnValue({
      doc: vi.fn().mockReturnValue({
        delete: mockDelete
      })
    } as any);

    const req = { params: { id: courierId } } as any;
    const res = { json: vi.fn() } as any;

    await deleteCourierHandler(req, res);

    expect(mockDelete).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({ success: true });
  });
});
