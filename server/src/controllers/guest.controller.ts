import type { NextFunction, Request, Response } from "express";
import type {
  RegisterGuestBody,
  UpdateGuestBody,
} from "../types/guest.types.js";
import {
  accreditGuest,
  generateGuestTicket,
  getGuestById,
  getGuestByQrToken,
  getGuests,
  getPublicTicket,
  getRecentAccreditations,
  registerGuest,
  searchGuests,
  sendGuestRsvp,
  sendGuestTicketEmail,
  sendTicketBatch,
  submitPublicRegistration,
  updateGuestById,
} from "../services/guest.service.js";
import { importGuestsFromCsv } from "../services/csv-import.service.js";

export const registerGuestHandler = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  try {
    const guest = registerGuest(req.body as RegisterGuestBody);
    res.status(201).json(guest);
  } catch (err) {
    next(err);
  }
};

export const listGuestsHandler = (
  _req: Request,
  res: Response,
  next: NextFunction,
): void => {
  try {
    res.json(getGuests());
  } catch (err) {
    next(err);
  }
};

export const searchGuestsHandler = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  try {
    res.json(searchGuests(req.query.q));
  } catch (err) {
    next(err);
  }
};

export const getGuestByQrTokenHandler = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  try {
    res.json(getGuestByQrToken(req.params.token));
  } catch (err) {
    next(err);
  }
};

export const listRecentAccreditationsHandler = (
  _req: Request,
  res: Response,
  next: NextFunction,
): void => {
  try {
    res.json(getRecentAccreditations());
  } catch (err) {
    next(err);
  }
};

// Public (no auth): printed-QR verification. Query ?token=... returns
// name + ticket only, safe for any camera.
export const publicTicketHandler = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  try {
    res.json(getPublicTicket(req.query.token));
  } catch (err) {
    next(err);
  }
};

export const getGuestByIdHandler = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  try {
    res.json(getGuestById(req.params.id));
  } catch (err) {
    next(err);
  }
};

export const updateGuestByIdHandler = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    res.json(updateGuestById(req.params.id, req.body as UpdateGuestBody));
  } catch (err) {
    next(err);
  }
};

export const accreditGuestHandler = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    res.json(accreditGuest(req.params.id));
  } catch (err) {
    next(err);
  }
};

export const generateTicketHandler = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    res.json(generateGuestTicket(req.params.id));
  } catch (err) {
    next(err);
  }
};

export const sendRsvpHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    res.json(await sendGuestRsvp(req.params.id));
  } catch (err) {
    next(err);
  }
};

export const sendTicketEmailHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    res.json(await sendGuestTicketEmail(req.params.id));
  } catch (err) {
    next(err);
  }
};

// Batch ticket email: next N never-emailed guests, oldest first.
// Body { limit } optional (default 5, max 20).
export const sendTicketBatchHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const limit = (req.body as { limit?: unknown } | undefined)?.limit;
    res.json(await sendTicketBatch(limit));
  } catch (err) {
    next(err);
  }
};

// Import guests from CSV. JSON body { csv: "..." }: no multipart parser dependency.
export const importGuestsHandler = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const csv = (req.body as { csv?: unknown } | undefined)?.csv;
    res.json(importGuestsFromCsv(csv));
  } catch (err) {
    next(err);
  }
};

// Public registration (no auth): POST /api/registration
export const submitRegistrationHandler = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const { guest, created } = submitPublicRegistration(req.body);
    res.status(created ? 201 : 200).json({ guest, created });
  } catch (err) {
    next(err);
  }
};
