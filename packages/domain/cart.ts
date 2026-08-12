export interface CartItem {
  id: string;
  productId: string;
  quantity: number;
  selected: boolean;
}

export interface Cart {
  items: CartItem[];
  version: number;
}

export function removePurchasedItems(cart: Cart): Cart {
  return {
    ...cart,
    items: cart.items.filter(item => !item.selected),
    version: cart.version + 1
  };
}

export function selectSubset(cart: Cart, itemIds: string[]): Cart {
  return {
    ...cart,
    items: cart.items.map(item => ({
      ...item,
      selected: itemIds.includes(item.id)
    })),
    version: cart.version + 1
  };
}

export function validateCartVersion(clientVersion: number, serverVersion: number): boolean {
  return clientVersion === serverVersion;
}
