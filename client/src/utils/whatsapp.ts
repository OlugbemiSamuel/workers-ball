/**
 * Helpers for delivering a ticket over WhatsApp.
 *
 * WhatsApp "click to chat" links (wa.me) need a number in full international
 * format without a leading "+" or zeros. Guests are usually entered as local
 * Nigerian numbers ("0803 123 4567"), so those get normalised here. Anything
 * that already looks international is passed through untouched.
 */

const DEFAULT_COUNTRY_CODE = "234";

export function normalizePhone(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, "");
  if (!digits) return null;

  // Already international (2348..., 447..., 1202...).
  if (digits.startsWith(DEFAULT_COUNTRY_CODE) && digits.length >= 12) return digits;

  // Local Nigerian format: 0803 123 4567 -> 2348031234567
  if (digits.startsWith("0") && digits.length === 11) {
    return `${DEFAULT_COUNTRY_CODE}${digits.slice(1)}`;
  }

  // Bare subscriber number: 803 123 4567 -> 2348031234567
  if (digits.length === 10) {
    return `${DEFAULT_COUNTRY_CODE}${digits}`;
  }

  return digits;
}

/** Opens the chat with the caption pre-typed; the ticket image is attached by the sender. */
export function buildWhatsAppLink(phone: string | null | undefined, message: string): string | null {
  const normalized = normalizePhone(phone);
  if (!normalized) return null;
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
}

export function ticketCaption(guest: { full_name: string; ticket_id: string }): string {
  const firstName = guest.full_name.trim().split(/\s+/)[0] || "there";
  return [
    `Hi ${firstName}, here is your SIXTH SEASON ticket.`,
    "",
    "Sunday, 22nd November 2026",
    "6:00 PM",
    "BYD, Victoria Island, Lagos",
    "",
    `Ticket: ${guest.ticket_id}`,
    "",
    "Show this at the entrance. See you there!",
  ].join("\n");
}

export function ticketQrUrl(ticketId: string): string {
  return `${window.location.origin}/api/tickets/qr/${encodeURIComponent(ticketId)}`;
}
