import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

export const api = axios.create({
  baseURL: API_BASE,
  headers: {
    "Content-Type": "application/json",
  },
});

// Auth token interceptor
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("workersball.token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Guest types
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

// Guest API
export const guestApi = {
  list: (params?: { page?: number; limit?: number; search?: string; accredited?: string }) =>
    api.get<PaginatedGuests>("/guests", { params }),
  get: (id: string) => api.get<{ guest: Guest }>(`/guests/${id}`),
  create: (data: { full_name: string; email?: string; phone?: string }) =>
    api.post<{ guest: Guest }>("/guests", data),
  update: (id: string, data: { full_name?: string; email?: string; phone?: string }) =>
    api.patch<{ guest: Guest }>(`/guests/${id}`, data),
  // No delete endpoint - guests cannot be deleted
};

// Accreditation API
export const accreditApi = {
  search: (name: string) => api.get<{ results: Guest[] }>("/guests/search", { params: { name } }),
  getByTicket: (ticketId: string) => api.get<{ guest: Guest }>(`/guests/qr/${ticketId}`),
  confirm: (ticketId: string) => api.post<{ message: string; guest: Guest }>(`/guests/${ticketId}/accredit`),
  stats: () => api.get<AccreditationStats>("/guests/stats/accreditation"),
};

// Ticket API
export const ticketApi = {
  send: (ticketId: string) => api.post<{ message: string; messageId: string; guest: { ticket_id: string; ticket_sent_count: number; ticket_last_sent_at: string | null } }>(`/guests/${ticketId}/ticket-email`),
  qrUrl: (ticketId: string) => `/api/guests/qr/${ticketId}`,
};

// Import / Export
export const importExportApi = {
  import: (csvText: string) => api.post("/guests/import", { csv: csvText }),
  export: (format: "xlsx" | "csv" = "xlsx", accredited?: string) =>
    api.get("/guests/export", { params: { format, accredited }, responseType: "blob" }),
};

// Reports
export const reportsApi = {
  accreditation: () => api.get<AccreditationStats>("/guests/recent-accreditations"),
  pdf: () => api.get("/guests/report/pdf", { responseType: "blob" }),
};
