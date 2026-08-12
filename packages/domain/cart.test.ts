import { describe, it, expect } from "vitest";
import { removePurchasedItems, selectSubset, validateCartVersion, Cart } from "./cart.js";

describe("Cart Domain", () => {
  const initialCart: Cart = {
    items: [
      { id: "1", productId: "p1", quantity: 2, selected: true },
      { id: "2", productId: "p2", quantity: 1, selected: false },
      { id: "3", productId: "p3", quantity: 5, selected: true },
    ],
    version: 1
  };

  it("should remove only selected items on checkout", () => {
    const nextCart = removePurchasedItems(initialCart);
    expect(nextCart.items.length).toBe(1);
    expect(nextCart.items[0].id).toBe("2");
    expect(nextCart.version).toBe(2);
  });

  it("should allow selecting a subset of items", () => {
    const nextCart = selectSubset(initialCart, ["2"]);
    expect(nextCart.items.find(i => i.id === "1")?.selected).toBe(false);
    expect(nextCart.items.find(i => i.id === "2")?.selected).toBe(true);
    expect(nextCart.items.find(i => i.id === "3")?.selected).toBe(false);
    expect(nextCart.version).toBe(2);
  });

  it("should validate cart version correctly", () => {
    expect(validateCartVersion(1, 1)).toBe(true);
    expect(validateCartVersion(1, 2)).toBe(false);
  });
});
