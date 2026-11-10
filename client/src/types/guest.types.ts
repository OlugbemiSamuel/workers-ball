export type AttendanceStatus = "pending" | "yes" | "no";

export interface Guest {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  ticket_id: string;
  qr_code_data: string;
  accredited: number;
  accredited_at: string | null;
  ticket_sent_count: number;
  ticket_last_sent_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface RegisterGuestBody {
  first_name?: unknown;
  last_name?: unknown;
  email?: unknown;
  phone?: unknown;
}

export interface UpdateGuestBody {
  first_name?: unknown;
  last_name?: unknown;
  email?: unknown;
  phone?: unknown;
  attendance_status?: unknown;
}

export interface UpdateGuestInput {
  first_name?: string;
  last_name?: string;
  email?: string | null;
  phone?: string | null;
  attendance_status?: AttendanceStatus;
}

export interface CreateGuestInput {
  first_name: string;
  last_name: string;
  email: string | null;
  phone?: string | null;
  attendance_status?: AttendanceStatus;
}

export interface PaginatedGuests {
  guests: Guest[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface AccreditationStats {
  total: number;
  accredited: number;
  pending: number;
  percentage: number;
  surgeHours: Array<{ hour: number; count: number }>;
}
