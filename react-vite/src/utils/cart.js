// Shop cart — kept on-device so it's instant and survives refreshes. Changes
// fire an event so the cart badge + modal stay in sync everywhere.
import { useEffect, useState } from "react";

const KEY = "aura_cart";
const MAX_QTY = 20;
const EVENT = "aura-cart-changed";

const read = () => {
  try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; }
};
const write = (items) => {
  localStorage.setItem(KEY, JSON.stringify(items));
  window.dispatchEvent(new Event(EVENT));
};

export const getCart = () => read();
export const cartCount = () => read().reduce((n, i) => n + (i.qty || 0), 0);
export const cartSubtotalCents = () => read().reduce((n, i) => n + (i.price_cents || 0) * (i.qty || 0), 0);

export const addToCart = (product, qty = 1) => {
  const items = read();
  const existing = items.find((i) => i.product_id === product.id);
  if (existing) {
    existing.qty = Math.min(MAX_QTY, existing.qty + qty);
  } else {
    items.push({
      product_id: product.id,
      title: product.title,
      price_cents: product.price_cents || 0,
      image_url: product.image_url || null,
      qty: Math.min(MAX_QTY, Math.max(1, qty)),
    });
  }
  write(items);
};

export const setQty = (productId, qty) => {
  let items = read();
  if (qty <= 0) items = items.filter((i) => i.product_id !== productId);
  else items = items.map((i) => (i.product_id === productId ? { ...i, qty: Math.min(MAX_QTY, qty) } : i));
  write(items);
};

export const removeFromCart = (productId) => write(read().filter((i) => i.product_id !== productId));
export const clearCart = () => write([]);

// reactive view of the cart for components
export const useCart = () => {
  const [items, setItems] = useState(read);
  useEffect(() => {
    const sync = () => setItems(read());
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  return items;
};
