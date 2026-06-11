"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { isAuthed, signIn, signOut } from "@/lib/auth";
import { setDeleted, setStatus } from "@/lib/orders";

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

export async function markStatusAction(
  id: string,
  status: "new" | "done",
): Promise<void> {
  await requireAuth();
  await setStatus(id, status);
  revalidatePath("/admin");
}

export async function archiveAction(id: string): Promise<void> {
  await requireAuth();
  await setDeleted(id, true);
  revalidatePath("/admin");
}

export async function restoreAction(id: string): Promise<void> {
  await requireAuth();
  await setDeleted(id, false);
  revalidatePath("/admin");
}
