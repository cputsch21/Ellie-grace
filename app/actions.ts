"use server";

import { createOrder, type OrderItem } from "@/lib/orders";
import { PRODUCTS_BY_ID } from "@/lib/products";

export type PlaceOrderInput = {
  customerName: string;
  phone: string;
  note: string;
  quantities: Record<string, number>;
};

export type PlaceOrderResult =
  | { ok: true; order: { id: string; total: number; items: OrderItem[] } }
  | { ok: false; error: string };

export async function placeOrderAction(
  input: PlaceOrderInput,
): Promise<PlaceOrderResult> {
  const name = (input.customerName || "").trim();
  const phone = (input.phone || "").trim();
  const note = (input.note || "").trim();

  if (!name) {
    return { ok: false, error: "Please add your name so we know who it's for." };
  }
  if (phone.replace(/\D/g, "").length < 7) {
    return {
      ok: false,
      error: "Please add a phone number we can reach you at.",
    };
  }

  // Rebuild the order from our own price list — never trust prices from the browser.
  const items: OrderItem[] = [];
  let total = 0;
  for (const [id, rawQty] of Object.entries(input.quantities || {})) {
    const product = PRODUCTS_BY_ID[id];
    const qty = Math.floor(Number(rawQty));
    if (!product || !Number.isFinite(qty) || qty <= 0) continue;
    const safeQty = Math.min(qty, 99);
    items.push({
      id: product.id,
      name: product.name,
      price: product.price,
      qty: safeQty,
    });
    total += product.price * safeQty;
  }

  if (items.length === 0) {
    return { ok: false, error: "Pick at least one thing to order!" };
  }

  const hasCustom = items.some((i) => i.id === "custom");
  if (hasCustom && !note) {
    return {
      ok: false,
      error:
        "For a custom order, tell us what to make in the special requests box!",
    };
  }

  const order = await createOrder({
    customerName: name,
    phone,
    note,
    items,
    total,
  });

  return {
    ok: true,
    order: { id: order.id, total: order.total, items: order.items },
  };
}
