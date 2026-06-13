"use server";

import { isAuthed } from "@/lib/auth";
import { listMessages, postMessage, type ChatMessage } from "@/lib/chat";

async function requireAuth() {
  if (!(await isAuthed())) {
    throw new Error("Not authorized");
  }
}

const MAX_TEXT = 500;
const MAX_NAME = 24;

export async function sendMessageAction(
  from: string,
  text: string,
): Promise<ChatMessage> {
  await requireAuth();
  const cleanFrom = from.trim().slice(0, MAX_NAME);
  const cleanText = text.trim().slice(0, MAX_TEXT);
  if (!cleanFrom || !cleanText) {
    throw new Error("Name and message are required");
  }
  return postMessage({ from: cleanFrom, text: cleanText });
}

export async function listMessagesAction(): Promise<ChatMessage[]> {
  await requireAuth();
  return listMessages();
}
