export const DELIVERY_FEE = 40;
export const GST_RATE = 0.05;

export const cartSubtotal = (cart) => cart.reduce((sum, item) => sum + item.food.price * item.quantity, 0);

export const cartGst = (subtotal) => Math.round(subtotal * GST_RATE);

export const cartGrandTotal = (cart) => {
  const subtotal = cartSubtotal(cart);
  return subtotal + cartGst(subtotal) + DELIVERY_FEE;
};

export const cartCount = (cart) => cart.reduce((sum, item) => sum + item.quantity, 0);
