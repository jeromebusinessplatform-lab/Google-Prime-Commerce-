import { describe, it, expect, vi } from 'vitest';
import { deletePromotionHandler } from './promotions';
import { db } from '../../packages/db/index.js';

describe('delete promotion handler', () => {
  it('deletes a promotion', async () => {
    const promoId = 'promo-123';
    const mockDelete = vi.fn().mockResolvedValue({});
    
    // Mocking DB collection and doc chain
    vi.spyOn(db, 'collection').mockReturnValue({
      doc: vi.fn().mockReturnValue({
        delete: mockDelete
      })
    } as any);

    const req = { params: { id: promoId } } as any;
    const res = { json: vi.fn() } as any;

    await deletePromotionHandler(req, res);

    expect(mockDelete).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({ success: true });
  });
});
