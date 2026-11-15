/**
 * Renders a shareable ticket card (PNG) for WhatsApp.
 *
 * The card mirrors the event invite style: the official Sixth Season artwork at
 * the top, the guest's name and event details under it, and the accreditation
 * QR as a picture (not a link). Everything is drawn in the browser on a canvas
 * so no server-side image libraries (or native builds on shared hosting) are
 * needed.
 */

export interface TicketCardGuest {
  full_name: string;
  ticket_id: string;
  email?: string | null;
  phone?: string | null;
}

const WIDTH = 1080;
const HEIGHT = 1350;
const ACCENT = "#F17A1E";
const ARTWORK = "/images/sixth-season-hero.jpeg";

const SERIF = "Georgia, 'Times New Roman', serif";
const SANS = "'Segoe UI', system-ui, -apple-system, Arial, sans-serif";
const MONO = "'Consolas', 'Courier New', monospace";

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Could not load ${src}`));
    img.src = src;
  });
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (ctx.measureText(candidate).width <= maxWidth) {
      current = candidate;
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function drawLabel(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
): void {
  ctx.font = `600 22px ${SANS}`;
  ctx.fillStyle = ACCENT;
  ctx.textAlign = "left";
  // Manual letter spacing keeps the labels looking like the print artwork.
  const spaced = text.toUpperCase().split("").join(" ");
  ctx.fillText(spaced, x, y);
}

export async function renderTicketCard(guest: TicketCardGuest): Promise<Blob> {
  const qrUrl = `${window.location.origin}/api/tickets/qr/${encodeURIComponent(guest.ticket_id)}`;
  const [artwork, qr] = await Promise.all([
    loadImage(ARTWORK).catch(() => null),
    loadImage(qrUrl),
  ]);

  const canvas = document.createElement("canvas");
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not create the ticket image on this device.");

  // Background + border
  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  ctx.strokeStyle = ACCENT;
  ctx.lineWidth = 5;
  ctx.strokeRect(26, 26, WIDTH - 52, HEIGHT - 52);

  // Event artwork (flyer) at the top
  const artW = 880;
  const artH = artwork ? Math.round((artwork.height / artwork.width) * artW) : 0;
  if (artwork && artH > 0) {
    ctx.drawImage(artwork, (WIDTH - artW) / 2, 70, artW, artH);
  }

  let y = 70 + artH + 40;

  // Divider
  ctx.strokeStyle = "rgba(241,122,30,0.55)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(150, y);
  ctx.lineTo(WIDTH - 150, y);
  ctx.stroke();
  y += 62;

  const firstName = guest.full_name.trim().split(/\s+/)[0] || "Guest";
  ctx.textAlign = "center";
  ctx.fillStyle = "#FFFFFF";
  ctx.font = `italic 46px ${SERIF}`;
  ctx.fillText(`Dear ${firstName},`, WIDTH / 2, y);
  y += 44;

  ctx.fillStyle = "#A1A1AA";
  ctx.font = `26px ${SANS}`;
  ctx.fillText("You are confirmed for", WIDTH / 2, y);
  y += 56;

  ctx.fillStyle = "#FFFFFF";
  ctx.font = `bold 58px ${SERIF}`;
  ctx.fillText("SIXTH SEASON", WIDTH / 2, y);
  y += 34;

  ctx.fillStyle = ACCENT;
  ctx.font = `600 20px ${SANS}`;
  ctx.fillText("B E Y O N D   L I M I T S .   B E Y O N D   S E A S O N S .", WIDTH / 2, y);

  // Details column (left) + QR (right)
  const detailX = 120;
  const qrSize = 230;
  const qrX = WIDTH - 120 - qrSize;
  const qrY = y + 62;

  ctx.textAlign = "left";
  drawLabel(ctx, "Date", detailX, qrY + 4);
  ctx.fillStyle = "#FFFFFF";
  ctx.font = `30px ${SANS}`;
  ctx.fillText("Sunday, 22nd November 2026", detailX, qrY + 44);

  drawLabel(ctx, "Time", detailX, qrY + 104);
  ctx.fillStyle = "#FFFFFF";
  ctx.font = `30px ${SANS}`;
  ctx.fillText("6:00 PM", detailX, qrY + 144);

  drawLabel(ctx, "Venue", detailX, qrY + 204);
  ctx.fillStyle = "#FFFFFF";
  ctx.font = `26px ${SANS}`;
  const venueLines = wrapText(ctx, "BYD, Victoria Island, Lagos", qrX - detailX - 40);
  venueLines.slice(0, 2).forEach((line, index) => {
    ctx.fillText(line, detailX, qrY + 242 + index * 34);
  });

  // QR picture
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(qrX - 10, qrY - 10, qrSize + 20, qrSize + 20);
  ctx.drawImage(qr, qrX, qrY, qrSize, qrSize);

  ctx.textAlign = "center";
  ctx.fillStyle = "#A1A1AA";
  ctx.font = `18px ${SANS}`;
  ctx.fillText("SCAN AT THE ENTRANCE", qrX + qrSize / 2, qrY + qrSize + 38);

  ctx.fillStyle = ACCENT;
  ctx.font = `600 26px ${MONO}`;
  ctx.fillText(guest.ticket_id, qrX + qrSize / 2, qrY + qrSize + 76);

  // Footer
  ctx.fillStyle = "#71717A";
  ctx.font = `23px ${SANS}`;
  ctx.fillText("Present this ticket on your phone at the entrance.", WIDTH / 2, HEIGHT - 92);

  ctx.fillStyle = ACCENT;
  ctx.font = `600 20px ${SANS}`;
  ctx.fillText("SIXTH SEASON  ·  22.11.2026  ·  LAGOS", WIDTH / 2, HEIGHT - 56);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Could not create the ticket image."))),
      "image/png",
    );
  });
}

export async function renderTicketCardFile(guest: TicketCardGuest): Promise<File> {
  const blob = await renderTicketCard(guest);
  const safeName = guest.full_name.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
  return new File([blob], `sixth-season-ticket-${safeName || guest.ticket_id}.png`, {
    type: "image/png",
  });
}
