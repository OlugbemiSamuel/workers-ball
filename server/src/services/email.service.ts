import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import nodemailer from "nodemailer";
import QRCode from "qrcode";
import type { Guest } from "../types/guest.types.js";

// Learn: email service = the mailroom. It builds the HTML ticket,
// generates the QR image, and hands it to SMTP. Nothing else in the
// codebase touches SMTP - one door, one place to fix when mail breaks.

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || "server396.web-hosting.com",
  port: parseInt(process.env.EMAIL_PORT || "465", 10),
  secure: process.env.EMAIL_USE_SSL !== "false",
  auth: {
    user: process.env.EMAIL_HOST_USER || "noreply@accredit.vip",
    pass: process.env.EMAIL_HOST_PASSWORD || "",
  },
});

const flyerPath = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../../client/public/images/sixth-season-flyer.jpeg",
);

const createInlineImages = async (qrPayload: string) => {
  const [qr, flyer] = await Promise.all([
    QRCode.toBuffer(qrPayload, {
      type: "png",
      width: 400,
      margin: 2,
      color: { dark: "#000000", light: "#FFFFFF" },
    }),
    readFile(flyerPath),
  ]);
  return [
    { filename: "workers-ball-ticket-qr.png", content: qr, contentType: "image/png", cid: "workers-ball-qr", contentDisposition: "inline" as const },
    { filename: "sixth-season-flyer.jpeg", content: flyer, contentType: "image/jpeg", cid: "sixth-season-flyer", contentDisposition: "inline" as const },
  ];
};

export const sendTicketEmail = async (guest: Guest): Promise<void> => {
  if (!guest.email || guest.email.trim() === "") {
    throw new Error("Guest has no email address.");
  }

  const attachments = await createInlineImages(guest.qr_token ?? "");
  const html = generateEmailHtml(guest, "Ticket");

  await transporter.sendMail({
    from: `"${process.env.EVENT_NAME || "Sixth Season"}" <${process.env.DEFAULT_FROM_EMAIL || "noreply@accredit.vip"}>`,
    to: guest.email,
    subject: `Your Ticket for ${process.env.EVENT_NAME || "Sixth Season"} â€” ${guest.ticket_number}`,
    html,
    attachments,
  });
};

export const sendRsvpEmail = async (guest: Guest): Promise<void> => {
  if (!guest.email || guest.email.trim() === "") {
    throw new Error("Guest has no email address.");
  }

  const attachments = await createInlineImages(guest.qr_token ?? "");
  const html = generateEmailHtml(guest, "RSVP Confirmation");

  await transporter.sendMail({
    from: `"${process.env.EVENT_NAME || "Sixth Season"}" <${process.env.DEFAULT_FROM_EMAIL || "noreply@accredit.vip"}>`,
    to: guest.email,
    subject: `RSVP Confirmation â€” ${process.env.EVENT_NAME || "Sixth Season"}`,
    html,
    attachments,
  });
};

function generateEmailHtml(guest: Guest, heading: "Ticket" | "RSVP Confirmation"): string {
  const eventName = process.env.EVENT_NAME || "Sixth Season";
  const eventDate = process.env.EVENT_DATE || "Sunday, 22nd November 2026";
  const eventTime = process.env.EVENT_TIME || "4PM";
  const venue = process.env.VENUE || "BYD, Victoria Island, Lagos";
  const statusLine = heading === "Ticket"
    ? `<p style="margin:8px 0;color:#6b4c23;font-size:15px;"><strong>Ticket ID:</strong> ${guest.ticket_number}</p>`
    : `<p style="margin:8px 0;color:#6b4c23;font-size:15px;"><strong>RSVP Status:</strong> Confirmed</p>`;

  return `
<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${heading} â€” ${eventName}</title></head>
<body style="margin:0;padding:24px 12px;font-family:'Segoe UI',Arial,sans-serif;background:#21170d;color:#fff8e9;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:#fff8e9;border:1px solid #d89a27;">
    <tr><td style="padding:0;background:#21170d;">
      <img src="cid:sixth-season-flyer" alt="Sixth Season event flyer" width="600" style="display:block;width:100%;max-width:600px;height:auto;border:0;" />
    </td></tr>
    <tr><td align="center" style="padding:24px 20px 10px;background:#3a2612;">
      <h1 style="margin:0;font-size:24px;color:#f4bd4f;letter-spacing:1px;">${eventName}</h1>
      <p style="margin:8px 0 0;font-size:14px;color:#fff1ce;letter-spacing:1px;">${heading} Â· Beyond Limits. Beyond Seasons.</p>
    </td></tr>
    <tr><td style="padding:24px 20px;text-align:center;background:#fff8e9;color:#3a2612;">
      <p style="margin:6px 0;font-size:17px;"><strong>Guest:</strong> ${guest.first_name} ${guest.last_name}</p>
      ${statusLine}
      <p style="margin:8px 0;color:#6b4c23;font-size:15px;"><strong>Date:</strong> ${eventDate}</p>
      <p style="margin:8px 0;color:#6b4c23;font-size:15px;"><strong>Time:</strong> ${eventTime}</p>
      <p style="margin:8px 0;color:#6b4c23;font-size:15px;"><strong>Venue:</strong> ${venue}</p>
    </td></tr>
    <tr><td align="center" style="padding:24px 20px;background:#f3e5c4;border-top:1px solid #dfbf7a;">
      <img src="cid:workers-ball-qr" alt="Accreditation QR code for ${guest.ticket_number ?? eventName}" width="220" height="220" style="display:block;width:220px;height:220px;max-width:100%;border:5px solid #d89a27;border-radius:8px;background:#ffffff;" />
      <p style="margin:16px 0 0;font-size:14px;color:#4a3218;">Present this QR code at the entrance for accreditation.</p>
    </td></tr>
    <tr><td style="padding:18px;text-align:center;font-size:12px;color:#fff1ce;background:#3a2612;">
      <p style="margin:0;">Please present this ticket on your phone or as a printout.</p>
      <p style="margin:8px 0 0;">${venue} Â· ${eventDate} Â· ${eventTime}</p>
    </td></tr>
  </table>
</body></html>`;
}
