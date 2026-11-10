import { Router } from "express";
import {
  accreditGuestHandler,
  generateTicketHandler,
  getGuestByIdHandler,
  getGuestByQrTokenHandler,
  importGuestsHandler,
  listGuestsHandler,
  listRecentAccreditationsHandler,
  registerGuestHandler,
  sendRsvpHandler,
  sendTicketBatchHandler,
  sendTicketEmailHandler,
  searchGuestsHandler,
  updateGuestByIdHandler,
} from "../controllers/guest.controller.js";
import { requireAuth } from "../middleware/requireAuth.js";

// Learn: route = the signpost. It maps paths on THIS router to controllers.
// app.ts mounts this router at "/api/guests", so:
// POST / -> POST /api/guests, GET /:id -> GET /api/guests/:id, etc.

export const guestRouter = Router();

// Guest management (staff only - protected)
guestRouter.post("/", requireAuth, registerGuestHandler);
guestRouter.get("/", listGuestsHandler);
// /search MUST sit above /:id: Express matches top-down and "search"
// would otherwise be mistaken for a guest id.
guestRouter.get("/search", requireAuth, searchGuestsHandler);
guestRouter.get("/qr/:token", requireAuth, getGuestByQrTokenHandler);
guestRouter.get("/recent-accreditations", requireAuth, listRecentAccreditationsHandler);
guestRouter.get("/ticket-email/batch", requireAuth, sendTicketBatchHandler);
guestRouter.get("/:id", getGuestByIdHandler);
guestRouter.patch("/:id", requireAuth, updateGuestByIdHandler);
// Accreditation + tickets + RSVP + CSV import are staff-only.
guestRouter.post("/:id/accredit", requireAuth, accreditGuestHandler);
guestRouter.post("/:id/ticket", requireAuth, generateTicketHandler);
guestRouter.post("/:id/rsvp", requireAuth, sendRsvpHandler);
guestRouter.post("/ticket-email/batch", requireAuth, sendTicketBatchHandler);
guestRouter.post("/:id/ticket-email", requireAuth, sendTicketEmailHandler);
guestRouter.post("/import", requireAuth, importGuestsHandler);
