import type { Metadata } from "next";
import { isAuthed } from "@/lib/auth";
import { listOrders } from "@/lib/orders";
import { listMessages } from "@/lib/chat";
import AdminLogin from "./AdminLogin";
import AdminDashboard from "./AdminDashboard";
import ChatWidget from "@/components/ChatWidget";

export const metadata: Metadata = {
  title: "Orders — Ellie & Grace",
  robots: { index: false, follow: false },
};

// Always read fresh — never cache the orders list.
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (!(await isAuthed())) {
    return <AdminLogin />;
  }

  const [orders, messages] = await Promise.all([
    listOrders(),
    listMessages(),
  ]);
  return (
    <>
      <AdminDashboard initialOrders={orders} />
      <ChatWidget initialMessages={messages} />
    </>
  );
}
