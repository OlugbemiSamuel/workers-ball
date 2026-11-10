import { Router } from "express";
import {
  accreditGuest,
  getGuestByTicket,
  getRecentAccreditations,
  searchGuests,
} from "../services/guest.service.js";

export const accreditRouter = Router();

accreditRouter.get("/search", (req, res, next) => {
  try {
    res.json({ results: searchGuests(req.query.name ?? req.query.q) });
  } catch (err) {
    next(err);
  }
});

accreditRouter.get("/guest/:ticketId", (req, res, next) => {
  try {
    res.json({ guest: getGuestByTicket(req.params.ticketId) });
  } catch (err) {
    next(err);
  }
});

accreditRouter.post("/confirm/:ticketId", (req, res, next) => {
  try {
    const guest = getGuestByTicket(req.params.ticketId);
    res.json({
      message: "Guest accredited successfully",
      guest: accreditGuest(guest.id),
    });
  } catch (err) {
    next(err);
  }
});

accreditRouter.get("/recent", (_req, res, next) => {
  try {
    res.json({ recent: getRecentAccreditations() });
  } catch (err) {
    next(err);
  }
});
