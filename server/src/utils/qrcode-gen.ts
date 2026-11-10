// QR code payload and ticket ID generation utilities.

let ticketCounter = 0;

export function generateTicketId(): string {
  ticketCounter++;
  const padded = String(ticketCounter).padStart(4, "0");
  return `WB26-${padded}`;
}

export function generateQRPayload(ticketId: string): string {
  const baseUrl = process.env.REGISTRATION_URL || "https://yourdomain.accredit.vip";
  const cleanBase = baseUrl.replace(/\/$/, "");
  return `${cleanBase}/accredit?ticket=${ticketId}`;
}

export function resetCounter(n = 0): void {
  ticketCounter = n;
}
