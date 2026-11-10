import {
  accreditGuestById,
  createGuest,
  findGuestByEmail,
  findGuestById,
  findGuestByQrToken,
  generateTicketCredentials,
  listGuests,
  listRecentlyAccredited,
  listUnsentTicketBatch,
  markRsvpSent,
  markTicketSent,
  searchGuests as findGuestsByQuery,
  updateGuestById as persistGuestUpdate,
} from "../repositories/guest.repository.js";
import type {
  AttendanceStatus,
  Guest,
  PublicRegistrationBody,
  RegisterGuestBody,
  UpdateGuestBody,
  UpdateGuestInput,
} from "../types/guest.types.js";
import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from "../errors/http.error.js";
import { sendRsvpEmail, sendTicketEmail } from "./email.service.js";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ATTENDANCE_VALUES: AttendanceStatus[] = ["pending", "yes", "no"];

const PROTECTED_FIELDS = [
  "id",
  "ticket_number",
  "qr_token",
  "is_sent",
  "created_at",
  "updated_at",
] as const;

const readField = (body: Record<string, unknown>, field: string): unknown => {
  return body[field];
};

export const normalizeFirstName = (raw: unknown): string => {
  if (typeof raw !== "string" || raw.trim() === "") {
    throw new ValidationError("first_name is required");
  }
  return raw.trim();
};

export const normalizeLastName = (raw: unknown): string => {
  if (typeof raw !== "string" || raw.trim() === "") {
    throw new ValidationError("last_name is required");
  }
  return raw.trim();
};

export const normalizeEmail = (raw: unknown): string => {
  if (typeof raw !== "string" || raw.trim() === "") {
    throw new ValidationError("email is required");
  }
  const email = raw.trim().toLowerCase();
  if (!EMAIL_PATTERN.test(email)) {
    throw new ValidationError("email must be a valid email address");
  }
  return email;
};

export const normalizeOptionalEmail = (raw: unknown): string | null => {
  if (raw === undefined || raw === null) return null;
  if (typeof raw !== "string" || raw.trim() === "") return null;
  return normalizeEmail(raw);
};

export const normalizePhone = (raw: unknown): string | null => {
  if (raw === undefined || raw === null) return null;
  if (typeof raw !== "string") {
    throw new ValidationError("phone must be a string");
  }
  return raw.trim() === "" ? null : raw.trim();
};

export const normalizeAttendance = (raw: unknown): AttendanceStatus => {
  if (
    typeof raw !== "string" ||
    !ATTENDANCE_VALUES.includes(raw as AttendanceStatus)
  ) {
    throw new ValidationError(
      "attendance_status must be one of: pending, yes, no",
    );
  }
  return raw as AttendanceStatus;
};

export const normalizeOptionalText = (
  raw: unknown,
  field: string,
): string | null => {
  if (raw === undefined || raw === null) return null;
  if (typeof raw !== "string") {
    throw new ValidationError(`${field} must be a string`);
  }
  const value = raw.trim();
  return value === "" ? null : value;
};

const parseGuestId = (rawId: unknown): number => {
  const id =
    typeof rawId === "string" && rawId.trim() !== "" ? Number(rawId) : rawId;
  if (typeof id !== "number" || !Number.isInteger(id) || id <= 0) {
    throw new ValidationError("guest id must be a positive integer");
  }
  return id;
};

export const registerGuest = (body: RegisterGuestBody): Guest => {
  const record = body as Record<string, unknown>;
  const input: CreateGuestInput = {
    first_name: normalizeFirstName(readField(record, "first_name")),
    last_name: normalizeLastName(readField(record, "last_name")),
    email: normalizeOptionalEmail(readField(record, "email")),
    phone: normalizePhone(readField(record, "phone")),
  };

  // Friendly duplicate check for a clear 409 message.
  // The UNIQUE constraint in SQLite stays the final guard (race safety).
  if (input.email && findGuestByEmail(input.email)) {
    throw new ConflictError();
  }

  try {
    const created = createGuest(input);
    return generateTicketCredentials(created.id) ?? created;
  } catch (err) {
    // Never leak raw SQLite text ("UNIQUE constraint failed...") to clients.
    if (err instanceof Error && err.message.includes("UNIQUE")) {
      throw new ConflictError();
    }
    throw err;
  }
};

export const getGuests = (): Guest[] => {
  return listGuests();
};

export const getRecentAccreditations = (): Guest[] => {
  return listRecentlyAccredited();
};

const QR_TOKEN_PATTERN = /^[0-9a-f]{64}$/;

export const getGuestByQrToken = (rawToken: unknown): Guest => {
  if (typeof rawToken !== "string" || rawToken.trim() === "") {
    throw new ValidationError("QR token is required");
  }
  const token = rawToken.trim().toLowerCase();
  if (!QR_TOKEN_PATTERN.test(token)) {
    throw new ValidationError("QR token is invalid");
  }
  const guest = findGuestByQrToken(token);
  if (!guest) {
    throw new NotFoundError("Guest not found for this QR code.");
  }
  return guest;
};

export interface PublicTicket {
  first_name: string;
  last_name: string;
  ticket_number: string | null;
}

export const getPublicTicket = (rawToken: unknown): PublicTicket => {
  if (typeof rawToken !== "string" || rawToken.trim() === "") {
    throw new ValidationError("QR token is required");
  }
  const token = rawToken.trim().toLowerCase();
  if (!QR_TOKEN_PATTERN.test(token)) {
    throw new ValidationError("QR token is invalid");
  }
  const guest = findGuestByQrToken(token);
  if (!guest) {
    throw new NotFoundError("Guest not found for this QR code.");
  }
  return {
    first_name: guest.first_name,
    last_name: guest.last_name,
    ticket_number: guest.ticket_number,
  };
};

export const searchGuests = (rawQuery: unknown): Guest[] => {
  if (typeof rawQuery !== "string") return [];
  const query = rawQuery.trim().toLowerCase();
  if (query.length < 2) return [];
  return findGuestsByQuery(query);
};

export const submitPublicRegistration = async (
  body: PublicRegistrationBody,
): Promise<{ guest: Guest; created: boolean }> => {
  const record = body as Record<string, unknown>;
  const first_name = normalizeFirstName(readField(record, "first_name"));
  const last_name = normalizeLastName(readField(record, "last_name"));
  const email = normalizeEmail(readField(record, "email"));
  const phone = normalizePhone(readField(record, "phone"));
  const rawAttendance = readField(record, "attendance_status");
  if (rawAttendance === undefined || rawAttendance === null) {
    throw new ValidationError("attendance_status is required");
  }
  const attendance_status = normalizeAttendance(rawAttendance);
  if (attendance_status === "pending") {
    throw new ValidationError('attendance_status must be "yes" or "no"');
  }

  const existing = findGuestByEmail(email);
  const mailTicket = async (guest: Guest): Promise<Guest> => {
    const ticketed = generateTicketCredentials(guest.id) ?? guest;
    try {
      await sendTicketEmail(ticketed);
    } catch (err) {
      console.error(`Registration email failed for guest ${guest.id}:`, (err as Error).message);
    }
    return ticketed;
  };
  if (existing) {
    const updated = persistGuestUpdate(existing.id, {
      first_name,
      last_name,
      email,
      phone,
      attendance_status,
    });
    if (!updated) throw new NotFoundError();
    return { guest: await mailTicket(updated), created: false };
  }

  try {
    const created = createGuest({
      first_name,
      last_name,
      email,
      phone,
      attendance_status,
    });
    return { guest: await mailTicket(created), created: true };
  } catch (err) {
    if (!(err instanceof Error && err.message.includes("UNIQUE"))) throw err;
    // Race: someone registered this email a split second ago.
    const raced = findGuestByEmail(email);
    if (!raced) throw err;
    const updated = persistGuestUpdate(raced.id, {
      first_name,
      last_name,
      email,
      phone,
      attendance_status,
    });
    if (!updated) throw new NotFoundError();
    return { guest: await mailTicket(updated), created: false };
  }
};

export const getGuestById = (rawId: unknown): Guest => {
  const id = parseGuestId(rawId);
  const guest = findGuestById(id);
  if (!guest) {
    throw new NotFoundError();
  }
  return guest;
};

export const accreditGuest = (rawId: unknown): Guest => {
  const id = parseGuestId(rawId);
  const result = accreditGuestById(id);
  // The atomic UPDATE already decided the outcome; here we translate it
  // into HTTP meaning. Already-accredited keeps its ORIGINAL timestamp.
  if (result.status === "not_found") {
    throw new NotFoundError();
  }
  if (result.status === "already_accredited") {
    throw new ConflictError("This guest has already been accredited.");
  }
  return result.guest;
};

export const generateGuestTicket = (rawId: unknown): Guest => {
  const id = parseGuestId(rawId);
  const guest = generateTicketCredentials(id);
  if (!guest) {
    throw new NotFoundError();
  }
  return guest;
};

// Explicit admin action only: nothing sends mail automatically.
// is_sent flips to 1 strictly AFTER SMTP accepts the message;
// any failure leaves it untouched, so 1 always means "delivered".
export const sendGuestRsvp = async (
  rawId: unknown,
): Promise<Guest> => {
  const id = parseGuestId(rawId);
  const guest = findGuestById(id);
  if (!guest) {
    throw new NotFoundError();
  }
  if (!guest.email || guest.email.trim() === "") {
    throw new ValidationError("Guest has no usable email address.");
  }
  await sendRsvpEmail(guest);
  const updated = markRsvpSent(id);
  if (!updated) {
    throw new NotFoundError();
  }
  return updated;
};

// Ticket email: ensures credentials exist first (idempotent), then mails
// the QR. Counts +1 strictly AFTER SMTP accepts, so the per-guest badge
// always means "delivered that many times".
export const sendGuestTicketEmail = async (
  rawId: unknown,
): Promise<Guest> => {
  const id = parseGuestId(rawId);
  let guest = findGuestById(id);
  if (!guest) {
    throw new NotFoundError();
  }
  if (!guest.ticket_number || !guest.qr_token) {
    guest = generateTicketCredentials(id);
    if (!guest) {
      throw new NotFoundError();
    }
  }
  await sendTicketEmail(guest);
  const counted = markTicketSent(id);
  if (!counted) {
    throw new NotFoundError();
  }
  return counted;
};

export interface TicketBatchResult {
  sent: Guest[];
  failed: { id: number; email: string | null; message: string }[];
};

// Batch ticket email: the next `limit` never-emailed guests, oldest first
// (list order). Sequential sends (shared-host SMTP throttles parallel
// blasts); one guest's failure never stops the rest. Each click naturally
// takes the NEXT batch because sent guests leave the unsent query.
export const sendTicketBatch = async (
  rawLimit: unknown,
): Promise<TicketBatchResult> => {
  const limit =
    typeof rawLimit === "number" && Number.isInteger(rawLimit)
      ? Math.min(Math.max(rawLimit, 1), 20)
      : 5;
  const batch = listUnsentTicketBatch(limit);
  const sent: Guest[] = [];
  const failed: { id: number; email: string | null; message: string }[] = [];
  for (const guest of batch) {
    try {
      sent.push(await sendGuestTicketEmail(guest.id));
    } catch (err) {
      failed.push({
        id: guest.id,
        email: guest.email,
        message: err instanceof Error ? err.message : "Could not send ticket",
      });
    }
  }
  return { sent, failed };
};

export const updateGuestById = (
  rawId: unknown,
  body: UpdateGuestBody,
): Guest => {
  const id = parseGuestId(rawId);
  const record = body as Record<string, unknown>;

  // Reject system fields loudly instead of ignoring them.
  for (const field of PROTECTED_FIELDS) {
    if (record[field] !== undefined) {
      throw new ValidationError(`${field} cannot be updated`);
    }
  }

  const existing = findGuestById(id);
  if (!existing) {
    throw new NotFoundError();
  }

  // PATCH = partial: only validate + include fields the client sent.
  // Sending nothing updatable is a 400, not a silent no-op.
  const patch: UpdateGuestInput = {};
  if (record["first_name"] !== undefined) {
    patch.first_name = normalizeFirstName(record["first_name"]);
  }
  if (record["last_name"] !== undefined) {
    patch.last_name = normalizeLastName(record["last_name"]);
  }
  if (record["email"] !== undefined) {
    const email = normalizeOptionalEmail(record["email"]);
    if (email) {
      const owner = findGuestByEmail(email);
      if (owner && owner.id !== id) {
        throw new ConflictError();
      }
    }
    patch.email = email;
  }
  if (record["phone"] !== undefined) {
    patch.phone = normalizePhone(record["phone"]);
  }
  if (record["attendance_status"] !== undefined) {
    patch.attendance_status = normalizeAttendance(record["attendance_status"]);
  }
  if (Object.keys(patch).length === 0) {
    throw new ValidationError("no updatable fields provided");
  }

  try {
    const updated = persistGuestUpdate(id, patch);
    if (!updated) {
      throw new NotFoundError();
    }
    return updated;
  } catch (err) {
    if (err instanceof NotFoundError) throw err;
    if (err instanceof Error && err.message.includes("UNIQUE")) {
      throw new ConflictError();
    }
    throw err;
  }
};
