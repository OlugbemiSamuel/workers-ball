/**
 * QR code payload and ticket ID generation utilities
 */

// Generate a unique ticket ID using UUID prefix
function generateTicketId() {
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `SS26-${random}`;
}

// Generate QR code payload URL for accreditation scanning
function generateQRPayload(ticketId) {
  const accreditationUrl = process.env.ACCREDITATION_URL;
  const baseUrl = new URL(
    accreditationUrl || process.env.REGISTRATION_URL || 'https://yourdomain.accredit.vip'
  );

  if (!accreditationUrl) {
    baseUrl.pathname = '/accredit';
  } else if (!baseUrl.pathname.replace(/\/+$/, '').endsWith('/accredit')) {
    baseUrl.pathname = `${baseUrl.pathname.replace(/\/+$/, '')}/accredit`;
  }

  baseUrl.search = '';
  baseUrl.hash = '';
  baseUrl.searchParams.set('ticket', ticketId);
  return baseUrl.toString();
}

module.exports = { generateTicketId, generateQRPayload };
