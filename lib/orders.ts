import { get, list, put } from "@vercel/blob";
import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";

export type OrderItem = {
  id: string;
  name: string;
  price: number;
  qty: number;
};

export type BraceletStatus = "not_made" | "made" | "delivered";
export type PaymentStatus = "not_paid" | "paid";

export type Order = {
  id: string;
  createdAt: string; // ISO timestamp
  customerName: string;
  phone: string;
  note: string;
  items: OrderItem[];
  total: number; // whole dollars
  bracelet: BraceletStatus;
  paid: PaymentStatus;
};

export type NewOrder = {
  customerName: string;
  phone: string;
  note: string;
  items: OrderItem[];
  total: number;
};

// In production on Vercel, orders live in a private Blob store (one file per
// order, so two people ordering at once can never clash). Locally, with no
// store connected, we fall back to a simple file so development still works.
const useBlob = Boolean(
  process.env.BLOB_STORE_ID || process.env.BLOB_READ_WRITE_TOKEN,
);

const PREFIX = "orders/";
const keyFor = (id: string) => `${PREFIX}${id}.json`;

// Stored orders may predate the bracelet/paid fields (they had a single
// `status` of "new" | "done"). Map any older record onto the current shape so
// the rest of the app only ever sees the new fields.
function normalize(raw: unknown): Order {
  const o = raw as Order & { status?: "new" | "done" };
  return {
    id: o.id,
    createdAt: o.createdAt,
    customerName: o.customerName,
    phone: o.phone,
    note: o.note,
    items: o.items,
    total: o.total,
    bracelet: o.bracelet ?? (o.status === "done" ? "delivered" : "not_made"),
    paid: o.paid ?? (o.status === "done" ? "paid" : "not_paid"),
  };
}

// ---- Blob helpers ---------------------------------------------------------

async function blobWrite(order: Order): Promise<void> {
  await put(keyFor(order.id), JSON.stringify(order), {
    access: "private",
    contentType: "application/json",
    addRandomSuffix: false,
    allowOverwrite: true,
  });
}

// Reads must bypass the CDN cache (useCache: false): after an overwrite, the
// cache keeps serving the old version of the order for up to a month, which
// makes status changes appear to revert in the admin dashboard.
async function blobReadOne(id: string): Promise<Order | null> {
  try {
    const result = await get(keyFor(id), { access: "private", useCache: false });
    if (!result || result.statusCode !== 200) return null;
    const text = await new Response(result.stream).text();
    return normalize(JSON.parse(text));
  } catch {
    return null;
  }
}

async function blobReadAll(): Promise<Order[]> {
  const { blobs } = await list({ prefix: PREFIX });
  const orders = await Promise.all(
    blobs.map(async (b) => {
      try {
        const result = await get(b.pathname, {
          access: "private",
          useCache: false,
        });
        if (!result || result.statusCode !== 200) return null;
        const text = await new Response(result.stream).text();
        return normalize(JSON.parse(text));
      } catch {
        return null;
      }
    }),
  );
  return orders.filter((o): o is Order => o !== null);
}

// ---- Local file fallback (development only) -------------------------------

const DATA_DIR = path.join(process.cwd(), ".data");
const DATA_FILE = path.join(DATA_DIR, "orders.json");

async function fileReadAll(): Promise<Order[]> {
  try {
    const buf = await fs.readFile(DATA_FILE, "utf8");
    return (JSON.parse(buf) as unknown[]).map(normalize);
  } catch {
    return [];
  }
}

async function fileWriteAll(orders: Order[]): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(orders, null, 2), "utf8");
}

// ---- Public API -----------------------------------------------------------

export async function createOrder(input: NewOrder): Promise<Order> {
  const order: Order = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    customerName: input.customerName,
    phone: input.phone,
    note: input.note,
    items: input.items,
    total: input.total,
    bracelet: "not_made",
    paid: "not_paid",
  };

  if (useBlob) {
    await blobWrite(order);
  } else {
    const all = await fileReadAll();
    all.push(order);
    await fileWriteAll(all);
  }

  return order;
}

export async function listOrders(): Promise<Order[]> {
  return (useBlob ? await blobReadAll() : await fileReadAll()).sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );
}

async function updateOrder(
  id: string,
  change: (order: Order) => Order,
): Promise<void> {
  if (useBlob) {
    const order = await blobReadOne(id);
    if (order) await blobWrite(change(order));
    return;
  }
  const all = await fileReadAll();
  const index = all.findIndex((o) => o.id === id);
  if (index !== -1) all[index] = change(all[index]);
  await fileWriteAll(all);
}

export async function setBracelet(
  id: string,
  bracelet: BraceletStatus,
): Promise<void> {
  await updateOrder(id, (o) => ({ ...o, bracelet }));
}

export async function setPaid(id: string, paid: PaymentStatus): Promise<void> {
  await updateOrder(id, (o) => ({ ...o, paid }));
}
