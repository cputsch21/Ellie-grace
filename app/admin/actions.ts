"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { isAuthed, signIn, signOut } from "@/lib/auth";
import type { BraceletStatus, PaymentStatus } from "@/lib/orders";
import { setBracelet, setPaid } from "@/lib/orders";

export async function loginAction(
  _prev: { error: string } | null,
  formData: FormData,
): Promise<{ error: string } | null> {
  const ok = await signIn(String(formData.get("password") || ""));
  if (!ok) return { error: "That password isn't right. Try again!" };
  redirect("/admin");
}

export async function logoutAction(): Promise<void> {
  await signOut();
  redirect("/admin");
}

async function requireAuth() {
  if (!(await isAuthed())) {
    throw new Error("Not authorized");
  }
}

export async function setBraceletAction(
  id: string,
  bracelet: BraceletStatus,
): Promise<void> {
  await requireAuth();
  await setBracelet(id, bracelet);
  revalidatePath("/admin");
}

export async function setPaidAction(
  id: string,
  paid: PaymentStatus,
): Promise<void> {
  await requireAuth();
  await setPaid(id, paid);
  revalidatePath("/admin");
}
