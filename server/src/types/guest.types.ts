// Central TypeScript types for Guest.
// A type is a promise about shape. Declared ONCE here, imported everywhere.

export type AttendanceStatus = "pending" | "yes" | "no";

export interface Guest {
  id: number;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  attendance_status: AttendanceStatus;
  ticket_number: string | null;
  qr_token: string | null;
  is_sent: number;
  accredited_at: string | null;
  ticket_sent_count: number;
  created_at: string;
  updated_at: string;
}

// Shape of the POST /api/guests request body (admin-created guest).
export interface RegisterGuestBody {
  first_name?: unknown;
  last_name?: unknown;
  email?: unknown;
  phone?: unknown;
}

// Shape of the PATCH /api/guests/:id request body.
export interface UpdateGuestBody {
  first_name?: unknown;
  last_name?: unknown;
  email?: unknown;
  phone?: unknown;
  attendance_status?: unknown;
}

// Validated patch: only updatable fields.
export interface UpdateGuestInput {
  first_name?: string;
  last_name?: string;
  email?: string | null;
  phone?: string | null;
  attendance_status?: AttendanceStatus;
}

// Input allowed when creating a guest.
export interface CreateGuestInput {
  first_name: string;
  last_name: string;
  email: string | null;
  phone?: string | null;
  attendance_status?: AttendanceStatus;
}

// Result of an accreditation attempt.
export type AccreditResult =
  | { status: "accredited"; guest: Guest }
  | { status: "not_found" }
  | { status: "already_accredited"; guest: Guest };
