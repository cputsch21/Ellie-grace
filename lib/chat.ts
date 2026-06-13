import { get, list, put } from "@vercel/blob";
import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";

export type ChatMessage = {
  id: string;
  createdAt: string; // ISO timestamp
  from: string;
  text: string;
};

export type NewMessage = {
  from: string;
  text: string;
};

// Same storage strategy as orders: a private Blob store in production (one file
// per message so two people sending at once never clash), with a local file
// fallback for development when no store is connected.
const useBlob = Boolean(
  process.env.BLOB_STORE_ID || process.env.BLOB_READ_WRITE_TOKEN,
);

const PREFIX = "messages/";
const keyFor = (id: string) => `${PREFIX}${id}.json`;

// Keep payloads small — the chat only ever shows the recent backlog.
const MAX_MESSAGES = 200;

// ---- Blob helpers ---------------------------------------------------------

async function blobWrite(message: ChatMessage): Promise<void> {
  await put(keyFor(message.id), JSON.stringify(message), {
    access: "private",
    contentType: "application/json",
    addRandomSuffix: false,
    allowOverwrite: true,
  });
}

async function blobReadAll(): Promise<ChatMessage[]> {
  const { blobs } = await list({ prefix: PREFIX });
  const messages = await Promise.all(
    blobs.map(async (b) => {
      try {
        const result = await get(b.pathname, {
          access: "private",
          useCache: false,
        });
        if (!result || result.statusCode !== 200) return null;
        const text = await new Response(result.stream).text();
        return JSON.parse(text) as ChatMessage;
      } catch {
        return null;
      }
    }),
  );
  return messages.filter((m): m is ChatMessage => m !== null);
}

// ---- Local file fallback (development only) -------------------------------

const DATA_DIR = path.join(process.cwd(), ".data");
const DATA_FILE = path.join(DATA_DIR, "messages.json");

async function fileReadAll(): Promise<ChatMessage[]> {
  try {
    const buf = await fs.readFile(DATA_FILE, "utf8");
    return JSON.parse(buf) as ChatMessage[];
  } catch {
    return [];
  }
}

async function fileWriteAll(messages: ChatMessage[]): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(messages, null, 2), "utf8");
}

// ---- Public API -----------------------------------------------------------

export async function postMessage(input: NewMessage): Promise<ChatMessage> {
  const message: ChatMessage = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    from: input.from,
    text: input.text,
  };

  if (useBlob) {
    await blobWrite(message);
  } else {
    const all = await fileReadAll();
    all.push(message);
    await fileWriteAll(all);
  }

  return message;
}

export async function listMessages(): Promise<ChatMessage[]> {
  const all = (useBlob ? await blobReadAll() : await fileReadAll()).sort((a, b) =>
    a.createdAt.localeCompare(b.createdAt),
  );
  // Oldest-first, trimmed to the most recent backlog.
  return all.slice(-MAX_MESSAGES);
}
