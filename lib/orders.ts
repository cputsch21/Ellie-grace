import { neon } from "@neondatabase/serverless";
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

// When a database is connected (on Vercel) we use it. Locally, with no database,
// we fall back to a simple file so everything still works while developing.
const connectionString =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.DATABASE_URL_UNPOOLED ||
  "";
const usingDb = connectionString.length > 0;

let _sql: ReturnType<typeof neon> | null = null;
let _ready: Promise<void> | null = null;

function db() {
  if (!_sql) _sql = neon(connectionString);
  return _sql;
}

// Create the orders table the first time we need it — no manual setup required.
function ensureTable() {
  if (!_ready) {
    _ready = (async () => {
      await db()`
        CREATE TABLE IF NOT EXISTS orders (
          id text PRIMARY KEY,
          created_at timestamptz NOT NULL DEFAULT now(),
          customer_name text NOT NULL,
          phone text NOT NULL,
          note text NOT NULL DEFAULT '',
          items jsonb NOT NULL,
          total integer NOT NULL,
          status text NOT NULL DEFAULT 'new',
          deleted_at timestamptz
        )
      `;
    })();
  }
  return _ready;
}

function rowToOrder(r: Record<string, unknown>): Order {
  return {
    id: String(r.id),
    createdAt: new Date(r.created_at as string).toISOString(),
    customerName: String(r.customer_name),
    phone: String(r.phone),
    note: (r.note as string) ?? "",
    items:
      typeof r.items === "string"
        ? (JSON.parse(r.items) as OrderItem[])
        : ((r.items as OrderItem[]) ?? []),
    total: Number(r.total),
    status: (r.status as Order["status"]) ?? "new",
    deletedAt: r.deleted_at ? new Date(r.deleted_at as string).toISOString() : null,
  };
}

// ---- Local file fallback (development only) -------------------------------

const DATA_DIR = path.join(process.cwd(), ".data");
const DATA_FILE = path.join(DATA_DIR, "orders.json");

async function readFile(): Promise<Order[]> {
  try {
    const buf = await fs.readFile(DATA_FILE, "utf8");
    return JSON.parse(buf) as Order[];
  } catch {
    return [];
  }
}

async function writeFile(orders: Order[]): Promise<void> {
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

  if (usingDb) {
    await ensureTable();
    await db()`
      INSERT INTO orders (id, created_at, customer_name, phone, note, items, total, status)
      VALUES (
        ${order.id}, ${order.createdAt}, ${order.customerName}, ${order.phone},
        ${order.note}, ${JSON.stringify(order.items)}::jsonb, ${order.total}, ${order.status}
      )
    `;
  } else {
    const all = await readFile();
    all.push(order);
    await writeFile(all);
  }

  return order;
}

export async function listOrders(
  opts: { includeDeleted?: boolean } = {},
): Promise<Order[]> {
  if (usingDb) {
    await ensureTable();
    const rows = (
      opts.includeDeleted
        ? await db()`SELECT * FROM orders ORDER BY created_at DESC`
        : await db()`SELECT * FROM orders WHERE deleted_at IS NULL ORDER BY created_at DESC`
    ) as Record<string, unknown>[];
    return rows.map(rowToOrder);
  }

  const all = (await readFile()).sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );
  return opts.includeDeleted ? all : all.filter((o) => !o.deletedAt);
}

export async function setStatus(
  id: string,
  status: "new" | "done",
): Promise<void> {
  if (usingDb) {
    await ensureTable();
    await db()`UPDATE orders SET status = ${status} WHERE id = ${id}`;
    return;
  }
  const all = await readFile();
  const order = all.find((o) => o.id === id);
  if (order) order.status = status;
  await writeFile(all);
}

export async function setDeleted(id: string, deleted: boolean): Promise<void> {
  const ts = deleted ? new Date().toISOString() : null;
  if (usingDb) {
    await ensureTable();
    await db()`UPDATE orders SET deleted_at = ${ts} WHERE id = ${id}`;
    return;
  }
  const all = await readFile();
  const order = all.find((o) => o.id === id);
  if (order) order.deletedAt = ts;
  await writeFile(all);
}
