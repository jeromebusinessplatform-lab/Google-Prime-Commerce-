import { describe, it, expect, vi } from 'vitest';
import { deleteCategoryHandler } from './catalog';
import { db } from '../../packages/db/index.js';

describe('delete category handler', () => {
  it('deletes a category', async () => {
    const catId = 'cat-123';
    const mockDelete = vi.fn().mockResolvedValue({});
    
    vi.spyOn(db, 'collection').mockReturnValue({
      doc: vi.fn().mockReturnValue({
        delete: mockDelete
      })
    } as any);

    const req = { params: { id: catId } } as any;
    const res = { json: vi.fn() } as any;

    await deleteCategoryHandler(req, res);

    expect(mockDelete).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({ success: true });
  });
});
