import { cookies } from "next/headers";
import crypto from "crypto";

const COOKIE_NAME = "eg_admin";

function adminPassword(): string {
  return process.env.ADMIN_PASSWORD || "ellieandgrace";
}

function secret(): string {
  return process.env.ADMIN_SECRET || process.env.ADMIN_PASSWORD || "dev-secret";
}

// The value we store in the cookie — derived from the secret, so the raw
// password is never kept in the browser.
function sessionToken(): string {
  return crypto.createHmac("sha256", secret()).update("admin-ok").digest("hex");
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

export async function isAuthed(): Promise<boolean> {
  const store = await cookies();
  const value = store.get(COOKIE_NAME)?.value;
  return value ? safeEqual(value, sessionToken()) : false;
}

export async function signIn(password: string): Promise<boolean> {
  if (!safeEqual(password, adminPassword())) return false;
  const store = await cookies();
  store.set(COOKIE_NAME, sessionToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
  return true;
}

export async function signOut(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}
