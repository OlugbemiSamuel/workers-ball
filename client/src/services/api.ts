import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

export const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Auth token interceptor
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token');
  if (token) {
    config.headers.Authorization = token;
  }
  return config;
});

export const adminApi = {
  login: (data: { username: string; password: string }) =>
    api.post<{ success: boolean; token: string }>('/admin/login', data),
};

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
  recent?: Array<{
    full_name: string;
    email: string | null;
    ticket_id: string;
    accredited_at: string;
  }>;
}

// Guest API
export const guestApi = {
  list: (params?: { page?: number; limit?: number; search?: string; accredited?: string }) =>
    api.get<PaginatedGuests>('/guests', { params }),
  get: (id: string) => api.get<{ guest: Guest }>(`/guests/${id}`),
  create: (data: { full_name: string; email?: string; phone?: string }) =>
    api.post<{ guest: Guest }>('/guests', data),
  update: (id: string, data: { full_name?: string; email?: string; phone?: string }) =>
    api.put<{ guest: Guest }>(`/guests/${id}`, data),
  remove: (id: string) => api.delete(`/guests/${id}`),
};

// Accreditation API
export const accreditApi = {
  search: (name: string) => api.get<{ results: Guest[] }>('/accredit/search', { params: { name } }),
  getByTicket: (ticketId: string) => api.get<{ guest: Guest }>(`/accredit/guest/${ticketId}`),
  confirm: (ticketId: string) => api.post<{ message: string; guest: Guest }>(`/accredit/confirm/${ticketId}`),
  stats: () => api.get<AccreditationStats>('/accredit/stats'),
};

// Ticket API
export const ticketApi = {
  send: (ticketId: string) => api.post<{ message: string; messageId: string; guest: { ticket_id: string; ticket_sent_count: number; ticket_last_sent_at: string | null } }>(`/tickets/send/${ticketId}`),
  qrUrl: (ticketId: string) => `/api/tickets/qr/${ticketId}`,
};

// Import / Export
export const importExportApi = {
  import: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/import-export/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  export: (format: 'xlsx' | 'csv' = 'xlsx', accredited?: string) =>
    api.get('/import-export/export', { params: { format, accredited }, responseType: 'blob' }),
};

// Reports
export const reportsApi = {
  accreditation: () => api.get<AccreditationStats>('/reports/accreditation'),
  pdf: () => api.get('/reports/pdf', { responseType: 'blob' }),
};
