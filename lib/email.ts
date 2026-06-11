import { Resend } from "resend";
import type { Order } from "./orders";

const SITE_URL = "https://ellie-grace.vercel.app";

function escapeHtml(s: string): string {
  return s.replace(
    /[&<>"']/g,
    (c) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[c] as string,
  );
}

// Sends a heads-up email when a new order comes in. If no email key is set up
// yet, this quietly does nothing — so orders always go through either way.
export async function sendOrderEmail(order: Order): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;

  const to = process.env.ORDER_NOTIFY_EMAIL || "cputsch21@gmail.com";
  const from =
    process.env.ORDER_FROM_EMAIL ||
    "Ellie & Grace Orders <onboarding@resend.dev>";

  const resend = new Resend(apiKey);

  const rows = order.items
    .map(
      (i) =>
        `<tr><td style="padding:4px 0;">${escapeHtml(i.name)} <span style="color:#94a3b8;">× ${i.qty}</span></td><td align="right" style="padding:4px 0;font-weight:700;">$${i.price * i.qty}</td></tr>`,
    )
    .join("");

  const noteBlock = order.note
    ? `<p style="margin:16px 0 0;padding:12px 14px;background:#FFF4C2;border-radius:12px;color:#92600a;"><strong>✏️ Special request:</strong> ${escapeHtml(order.note)}</p>`
    : "";

  const html = `
  <div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;max-width:480px;margin:0 auto;color:#1f2937;">
    <h1 style="font-size:22px;margin:0 0 2px;">🌈 New order!</h1>
    <p style="margin:0 0 16px;color:#64748b;">Ellie &amp; Grace&rsquo;s Rainbow Loom Shop</p>
    <div style="padding:16px 18px;background:#faf7ff;border-radius:16px;">
      <p style="margin:0 0 2px;font-size:18px;font-weight:800;">${escapeHtml(order.customerName)}</p>
      <p style="margin:0 0 12px;"><a href="tel:${order.phone.replace(/[^\d+]/g, "")}" style="color:#1f86f5;text-decoration:none;">📞 ${escapeHtml(order.phone)}</a></p>
      <table style="width:100%;border-collapse:collapse;font-size:15px;">${rows}
        <tr><td style="padding-top:10px;border-top:1px solid #e9dbff;font-weight:800;">Total</td><td align="right" style="padding-top:10px;border-top:1px solid #e9dbff;font-weight:800;color:#7232e6;">$${order.total}</td></tr>
      </table>
      ${noteBlock}
    </div>
    <p style="margin:18px 0 0;">💵 Cash only — text them to set up pickup.</p>
    <p style="margin:10px 0 0;"><a href="${SITE_URL}/admin" style="color:#7232e6;font-weight:700;text-decoration:none;">Open your orders page →</a></p>
  </div>`;

  const { error } = await resend.emails.send({
    from,
    to,
    subject: `🌈 New order from ${order.customerName} — $${order.total}`,
    html,
  });

  if (error) {
    throw new Error(
      typeof error === "string" ? error : JSON.stringify(error),
    );
  }
}
