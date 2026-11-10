import type { Guest, PaginatedGuests, AccreditationStats } from "../types/guest.types.js";
import { apiFetch } from "./client.js";

// Learn: guests.api owns the guest endpoints used by the dashboard.
// All calls go through apiFetch, so the Bearer token rides along.

export const createGuest = async (payload: {
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
}): Promise<{ guest: Guest }> => {
  return apiFetch<{ guest: Guest }>("/api/guests", { method: "POST", body: payload });
};

export const listGuests = async (): Promise<PaginatedGuests> => {
  return apiFetch<PaginatedGuests>("/api/guests");
};

export const getGuestById = async (id: string): Promise<{ guest: Guest }> => {
  return apiFetch<{ guest: Guest }>(`/api/guests/${id}`);
};

export const accreditGuest = async (id: string): Promise<{ message: string; guest: Guest }> => {
  return apiFetch<{ message: string; guest: Guest }>(`/api/guests/${id}/accredit`, { method: "POST" });
};

export const searchGuests = async (query: string): Promise<{ results: Guest[] }> => {
  return apiFetch<{ results: Guest[] }>(`/api/guests/search?q=${encodeURIComponent(query)}`);
};

export const getGuestByQrToken = async (token: string): Promise<{ guest: Guest }> => {
  return apiFetch<{ guest: Guest }>(`/api/guests/qr/${encodeURIComponent(token)}`);
};

export const listRecentAccreditations = async (): Promise<AccreditationStats> => {
  return apiFetch<AccreditationStats>("/api/guests/recent-accreditations");
};

export const generateGuestTicket = async (id: string): Promise<{ guest: Guest }> => {
  return apiFetch<{ guest: Guest }>(`/api/guests/${id}/ticket`, { method: "POST" });
};

export const sendRsvp = async (id: string): Promise<{ guest: Guest }> => {
  return apiFetch<{ guest: Guest }>(`/api/guests/${id}/rsvp`, { method: "POST" });
};

export const sendTicketEmail = async (id: string): Promise<{ message: string; guest: { ticket_id: string; ticket_sent_count: number; ticket_last_sent_at: string | null } }> => {
  return apiFetch(`/api/guests/${id}/ticket-email`, { method: "POST" }) as any;
};

export interface TicketBatchResult {
  sent: Guest[];
  failed: Array<{ id: string; email: string | null; message: string }>;
}

export const sendTicketBatch = async (limit = 5): Promise<TicketBatchResult> => {
  return apiFetch<TicketBatchResult>("/api/guests/ticket-email/batch", {
    method: "POST",
    body: { limit },
  });
};

export const updateGuest = async (id: string, patch: {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
}): Promise<{ guest: Guest }> => {
  return apiFetch<{ guest: Guest }>(`/api/guests/${id}`, {
    method: "PATCH",
    body: patch,
  });
};

export const importGuestsCsv = async (csv: string): Promise<any> => {
  return apiFetch("/api/guests/import", {
    method: "POST",
    body: { csv },
  });
};
