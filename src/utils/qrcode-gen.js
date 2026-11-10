/**
 * QR code payload and ticket ID generation utilities
 */

// Generate a sequential ticket ID like WB26-0001
let ticketCounter = 0;

function generateTicketId() {
  ticketCounter++;
  const padded = String(ticketCounter).padStart(4, '0');
  return `WB26-${padded}`;
}

// Generate QR code payload URL for accreditation scanning
function generateQRPayload(ticketId) {
  const baseUrl = process.env.REGISTRATION_URL || 'https://yourdomain.accredit.vip';
  // Strip trailing slash
  const cleanBase = baseUrl.replace(/\/$/, '');
  return `${cleanBase}/accredit?ticket=${ticketId}`;
}

// Reset counter (useful for testing / seed data)
function resetCounter(n = 0) {
  ticketCounter = n;
}

module.exports = { generateTicketId, generateQRPayload, resetCounter };
