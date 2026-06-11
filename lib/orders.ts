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

export type Order = {
  id: string;
  createdAt: string; // ISO timestamp
  customerName: string;
  phone: string;
  note: string;
  items: OrderItem[];
  total: number; // whole dollars
  status: "new" | "done";
  deletedAt: string | null;
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

// ---- Blob helpers ---------------------------------------------------------

async function blobWrite(order: Order): Promise<void> {
  await put(keyFor(order.id), JSON.stringify(order), {
    access: "private",
    contentType: "application/json",
    addRandomSuffix: false,
    allowOverwrite: true,
  });
}

async function blobReadOne(id: string): Promise<Order | null> {
  try {
    const result = await get(keyFor(id), { access: "private" });
    if (!result || result.statusCode !== 200) return null;
    const text = await new Response(result.stream).text();
    return JSON.parse(text) as Order;
  } catch {
    return null;
  }
}

async function blobReadAll(): Promise<Order[]> {
  const { blobs } = await list({ prefix: PREFIX });
  const orders = await Promise.all(
    blobs.map(async (b) => {
      try {
        const result = await get(b.pathname, { access: "private" });
        if (!result || result.statusCode !== 200) return null;
        const text = await new Response(result.stream).text();
        return JSON.parse(text) as Order;
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
    return JSON.parse(buf) as Order[];
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
    status: "new",
    deletedAt: null,
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

export async function listOrders(
  opts: { includeDeleted?: boolean } = {},
): Promise<Order[]> {
  const all = (useBlob ? await blobReadAll() : await fileReadAll()).sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );
  return opts.includeDeleted ? all : all.filter((o) => !o.deletedAt);
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

export async function setStatus(
  id: string,
  status: "new" | "done",
): Promise<void> {
  await updateOrder(id, (o) => ({ ...o, status }));
}

export async function setDeleted(id: string, deleted: boolean): Promise<void> {
  const deletedAt = deleted ? new Date().toISOString() : null;
  await updateOrder(id, (o) => ({ ...o, deletedAt }));
}
