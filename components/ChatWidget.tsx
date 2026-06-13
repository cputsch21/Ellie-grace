"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import type { ChatMessage } from "@/lib/chat";
import { listMessagesAction, sendMessageAction } from "@/app/admin/chat-actions";

const NAME_KEY = "eg_chat_name";

function shortTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

// Merge incoming messages with what we already have, deduped by id and kept in
// chronological order. Used both for polling and for our own just-sent message.
function mergeMessages(
  current: ChatMessage[],
  incoming: ChatMessage[],
): ChatMessage[] {
  const byId = new Map<string, ChatMessage>();
  for (const m of current) byId.set(m.id, m);
  for (const m of incoming) byId.set(m.id, m);
  return [...byId.values()].sort((a, b) =>
    a.createdAt.localeCompare(b.createdAt),
  );
}

export default function ChatWidget({
  initialMessages,
}: {
  initialMessages: ChatMessage[];
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState<string | null>(null);
  const [nameDraft, setNameDraft] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const lastSeenId = useRef<string | null>(
    initialMessages.at(-1)?.id ?? null,
  );

  // Load the cached name once on mount.
  useEffect(() => {
    const saved = window.localStorage.getItem(NAME_KEY);
    if (saved) setName(saved);
  }, []);

  const refresh = useCallback(async () => {
    try {
      const latest = await listMessagesAction();
      setMessages((prev) => mergeMessages(prev, latest));
    } catch {
      // Ignore transient failures; the next tick will try again.
    }
  }, []);

  // Poll for new messages — quickly while open, slowly while closed so the
  // unread dot still lights up.
  useEffect(() => {
    const interval = setInterval(refresh, open ? 3000 : 8000);
    return () => clearInterval(interval);
  }, [open, refresh]);

  // Track unread + autoscroll whenever the message list changes.
  useEffect(() => {
    const newest = messages.at(-1);
    if (!newest) return;
    if (open) {
      lastSeenId.current = newest.id;
      setHasUnread(false);
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
    } else if (newest.id !== lastSeenId.current && newest.from !== name) {
      setHasUnread(true);
    }
  }, [messages, open, name]);

  function saveName(e: FormEvent) {
    e.preventDefault();
    const clean = nameDraft.trim().slice(0, 24);
    if (!clean) return;
    window.localStorage.setItem(NAME_KEY, clean);
    setName(clean);
  }

  function switchName() {
    window.localStorage.removeItem(NAME_KEY);
    setName(null);
    setNameDraft("");
  }

  async function send(e: FormEvent) {
    e.preventDefault();
    const text = draft.trim();
    if (!text || !name || sending) return;
    setSending(true);
    setDraft("");
    try {
      const saved = await sendMessageAction(name, text);
      setMessages((prev) => mergeMessages(prev, [saved]));
    } catch {
      setDraft(text); // restore so the message isn't lost
    } finally {
      setSending(false);
    }
  }

  function openPanel() {
    setOpen(true);
    setHasUnread(false);
  }

  if (!open) {
    return (
      <button
        onClick={openPanel}
        aria-label="Open chat"
        className="fixed bottom-5 right-5 z-50 flex h-16 w-16 animate-floaty items-center justify-center rounded-full bg-gradient-to-br from-bubblegum-400 to-grape-500 text-3xl shadow-lift transition-transform duration-150 ease-out hover:scale-105 hover:animate-pop"
      >
        😊
        {hasUnread && (
          <span className="absolute -right-0.5 -top-0.5 h-4 w-4 rounded-full border-2 border-white bg-sunshine-400" />
        )}
      </button>
    );
  }

  return (
    <div className="fixed bottom-5 right-5 z-50 flex h-[26rem] max-h-[70vh] w-[20rem] flex-col overflow-hidden rounded-4xl bg-white shadow-lift ring-1 ring-slate-100 sm:w-[22rem]">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 bg-gradient-to-r from-bubblegum-400 to-grape-500 px-4 py-3 text-white">
        <div className="min-w-0">
          <p className="truncate text-base font-extrabold">Ellie &amp; Grace 💬</p>
          {name && (
            <button
              onClick={switchName}
              className="text-xs font-semibold text-white/80 underline-offset-2 hover:underline"
            >
              {name} · not you?
            </button>
          )}
        </div>
        <button
          onClick={() => setOpen(false)}
          aria-label="Minimize chat"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/20 text-xl font-bold leading-none transition-colors hover:bg-white/30"
        >
          –
        </button>
      </div>

      {!name ? (
        // Name entry
        <form
          onSubmit={saveName}
          className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center"
        >
          <div className="text-4xl">😊</div>
          <p className="text-sm font-bold text-slate-700">
            What&rsquo;s your name?
          </p>
          <input
            autoFocus
            value={nameDraft}
            onChange={(e) => setNameDraft(e.target.value)}
            placeholder="Type your name"
            maxLength={24}
            className="w-full rounded-full border-0 bg-slate-100 px-4 py-2 text-center text-sm font-semibold text-slate-800 outline-none ring-1 ring-slate-200 focus:ring-2 focus:ring-grape-300"
          />
          <button
            type="submit"
            className="rounded-full bg-grape-500 px-6 py-2 text-sm font-extrabold text-white transition-colors hover:bg-grape-600"
          >
            Start chatting →
          </button>
        </form>
      ) : (
        <>
          {/* Messages */}
          <div
            ref={scrollRef}
            className="flex-1 space-y-2 overflow-y-auto bg-slate-50 px-3 py-3"
          >
            {messages.length === 0 ? (
              <p className="mt-8 text-center text-sm text-slate-400">
                Say hi to your business partner! 🌈
              </p>
            ) : (
              messages.map((m) => {
                const mine = m.from === name;
                return (
                  <div
                    key={m.id}
                    className={`flex flex-col ${mine ? "items-end" : "items-start"}`}
                  >
                    {!mine && (
                      <span className="px-2 text-xs font-bold text-grape-500">
                        {m.from}
                      </span>
                    )}
                    <div
                      className={`max-w-[80%] rounded-3xl px-3.5 py-2 text-sm font-medium shadow-sm ${
                        mine
                          ? "rounded-br-md bg-sky-500 text-white"
                          : "rounded-bl-md bg-white text-slate-800 ring-1 ring-slate-200"
                      }`}
                    >
                      {m.text}
                    </div>
                    <span className="px-2 pt-0.5 text-[10px] text-slate-400">
                      {shortTime(m.createdAt)}
                    </span>
                  </div>
                );
              })
            )}
          </div>

          {/* Composer */}
          <form
            onSubmit={send}
            className="flex items-center gap-2 border-t border-slate-100 bg-white px-3 py-3"
          >
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Type a message…"
              maxLength={500}
              className="min-w-0 flex-1 rounded-full border-0 bg-slate-100 px-4 py-2 text-sm font-medium text-slate-800 outline-none ring-1 ring-slate-200 focus:ring-2 focus:ring-grape-300"
            />
            <button
              type="submit"
              disabled={!draft.trim() || sending}
              aria-label="Send message"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-grape-500 text-lg text-white transition-colors hover:bg-grape-600 disabled:opacity-50"
            >
              ↑
            </button>
          </form>
        </>
      )}
    </div>
  );
}
