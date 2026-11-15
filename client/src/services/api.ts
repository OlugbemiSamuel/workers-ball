import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

export const api = axios.create({
  baseURL: API_BASE,
  timeout: 20000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Auth token interceptor
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("sixthseason.token");
  if (token) {
    config.headers.Authorization = token.startsWith("Basic ") ? token : `Bearer ${token}`;
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

export interface PublicRegistrationInput {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  attendance_status: "yes" | "no";
}

export interface RegisteredGuest {
  id: number | string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  ticket_number: string | null;
}

export interface RegistrationResponse {
  guest: RegisteredGuest;
  created: boolean;
  email_sent: boolean;
  email_error?: string;
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

type GuestApiRecord = Partial<Guest> & {
  id: string | number;
  first_name?: string;
  last_name?: string;
  ticket_number?: string | null;
  qr_token?: string | null;
  is_sent?: number;
};

const normalizeGuest = (record: GuestApiRecord): Guest => ({
  id: String(record.id),
  full_name: record.full_name ?? [record.first_name, record.last_name].filter(Boolean).join(" "),
  email: record.email ?? null,
  phone: record.phone ?? null,
  ticket_id: record.ticket_id ?? record.ticket_number ?? "",
  qr_code_data: record.qr_code_data ?? record.qr_token ?? "",
  accredited: record.accredited ?? Number(Boolean(record.accredited_at)),
  accredited_at: record.accredited_at ?? null,
  ticket_sent_count: record.ticket_sent_count ?? 0,
  ticket_last_sent_at: record.ticket_last_sent_at ?? null,
  created_at: record.created_at ?? "",
  updated_at: record.updated_at ?? "",
});

export interface AccreditationStats {
  total: number;
  accredited: number;
  pending: number;
  percentage: number;
  surgeHours: Array<{ hour: number; count: number }>;
}

export interface ReportStats extends AccreditationStats {
  event: string;
  eventDate: string;
  recent: Guest[];
}

interface TypeScriptReportStats extends AccreditationStats {
  event: string;
  eventDate: string;
  recent: Array<{
    first_name: string;
    last_name: string;
    email: string | null;
    ticket_number: string | null;
    accredited_at: string | null;
  }>;
}

// Guest API
export const guestApi = {
  list: async (params?: { page?: number; limit?: number; search?: string; accredited?: string }) => {
    const response = await api.get<PaginatedGuests | GuestApiRecord[]>("/guests", { params });
    const page = params?.page ?? 1;
    const limit = params?.limit ?? 20;
    const guests = Array.isArray(response.data)
      ? response.data.map(normalizeGuest)
      : response.data.guests.map(normalizeGuest);
    const pagination = Array.isArray(response.data)
      ? { page, limit, total: guests.length, totalPages: Math.ceil(guests.length / limit) }
      : response.data.pagination;

    return { ...response, data: { guests, pagination } };
  },
  get: (id: string) => api.get<{ guest: Guest }>(`/guests/${id}`),
  create: (data: { full_name: string; email?: string; phone?: string }) =>
    api.post<{ guest: Guest }>("/guests", data),
  update: (id: string, data: { full_name?: string; email?: string; phone?: string }) =>
    api.patch<{ guest: Guest }>(`/guests/${id}`, data),
  confirm: (ticketId: string) =>
    api.post<{ message: string; guest: Guest }>(`/accredit/confirm/${ticketId}`),
};

// Accreditation API
export const accreditApi = {
  search: async (query: string) => {
    const { data } = await api.get<{ results: GuestApiRecord[] }>("/accredit/search", { params: { name: query } });
    return { data: { results: data.results.map(normalizeGuest) } };
  },
  getByTicket: async (ticketId: string) => {
    const { data } = await api.get<{ guest: GuestApiRecord }>(`/accredit/guest/${encodeURIComponent(ticketId)}`);
    return { data: { guest: normalizeGuest(data.guest) } };
  },
  confirm: async (ticketId: string) => {
    const { data } = await api.post<{ message: string; guest: GuestApiRecord }>(`/accredit/confirm/${encodeURIComponent(ticketId)}`);
    return { data: { ...data, guest: normalizeGuest(data.guest) } };
  },
  stats: () => api.get<AccreditationStats>("/guests/stats/accreditation"),
};

// Ticket API
export const ticketApi = {
  send: (guestId: string, ticketId: string) => {
    if (/^\d+$/.test(guestId)) {
      return api.post<Guest>(`/guests/${encodeURIComponent(guestId)}/ticket-email`);
    }
    return api.post(`/tickets/send/${encodeURIComponent(ticketId)}`);
  },
  qrUrl: (ticketId: string) => `/api/tickets/qr/${ticketId}`,
};

export const registrationApi = {
  submit: async (input: PublicRegistrationInput): Promise<RegistrationResponse> => {
    try {
      const { data } = await api.post<RegistrationResponse>("/registration", input);
      return data;
    } catch (err) {
      if (!axios.isAxiosError(err) || err.response?.status !== 404) throw err;

      const { data } = await guestApi.create({
        full_name: `${input.first_name} ${input.last_name}`,
        email: input.email,
        phone: input.phone,
      });
      let email_sent = false;
      let email_error: string | undefined;
      try {
        await ticketApi.send(String(data.guest.id), data.guest.ticket_id);
        email_sent = true;
      } catch (sendError) {
        email_error = axios.isAxiosError(sendError)
          ? sendError.response?.data?.message || sendError.response?.data?.error || sendError.message
          : sendError instanceof Error
            ? sendError.message
            : "Ticket email could not be sent.";
      }
      return {
        guest: {
          id: data.guest.id,
          first_name: input.first_name,
          last_name: input.last_name,
          email: data.guest.email,
          phone: data.guest.phone,
          ticket_number: data.guest.ticket_id,
        },
        created: true,
        email_sent,
        email_error,
      };
    }
  },
  resend: async (
    input: PublicRegistrationInput,
    guestId: string,
    ticketId: string,
  ): Promise<RegistrationResponse> => {
    await ticketApi.send(guestId, ticketId);
    return {
      guest: {
        id: guestId,
        first_name: input.first_name,
        last_name: input.last_name,
        email: input.email,
        phone: input.phone ?? null,
        ticket_number: ticketId,
      },
      created: false,
      email_sent: true,
    };
  },
};

// Import / Export
export const importExportApi = {
  import: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return api.post("/import-export/import", formData, {
      headers: { "Content-Type": undefined },
    });
  },
  export: (format: "xlsx" | "csv" = "xlsx", accredited?: string) =>
    api.get("/import-export/export", { params: { format, accredited }, responseType: "blob" }),
};

// Reports
export const reportsApi = {
  accreditation: async () => {
    try {
      return await api.get<ReportStats>("/reports/accreditation");
    } catch (err) {
      if (!axios.isAxiosError(err) || err.response?.status !== 404) throw err;
      const response = await api.get<TypeScriptReportStats>("/guests/stats/accreditation");
      return {
        ...response,
        data: {
          ...response.data,
          recent: (response.data.recent ?? []).map((record, index) => normalizeGuest({
            ...record,
            id: record.ticket_number ?? index,
            ticket_number: record.ticket_number,
          })),
        } satisfies ReportStats,
      };
    }
  },
  pdf: async () => {
    try {
      return await api.get<Blob>("/reports/pdf", { responseType: "blob" });
    } catch (err) {
      if (!axios.isAxiosError(err) || err.response?.status !== 404) throw err;
      return api.get<Blob>("/guests/stats/report/pdf", { responseType: "blob" });
    }
  },
};

export const accreditActivityApi = {
  recent: async () => {
    const { data } = await api.get<{ recent: GuestApiRecord[] }>("/accredit/recent");
    return { data: { recent: data.recent.map(normalizeGuest) } };
  },
};
