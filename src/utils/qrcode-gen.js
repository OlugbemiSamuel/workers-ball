/**
 * QR code payload and ticket ID generation utilities
 */

// Generate a unique ticket ID using UUID prefix
function generateTicketId() {
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `WB26-${random}`;
}

// Generate QR code payload URL for accreditation scanning
function generateQRPayload(ticketId) {
  const baseUrl = process.env.REGISTRATION_URL || 'https://yourdomain.accredit.vip';
  // Strip trailing slash
  const cleanBase = baseUrl.replace(/\/$/, '');
  return `${cleanBase}/accredit?ticket=${ticketId}`;
}

module.exports = { generateTicketId, generateQRPayload };
