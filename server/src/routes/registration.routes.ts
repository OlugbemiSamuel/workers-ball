import { Router } from "express";
import { submitRegistrationHandler } from "../controllers/guest.controller.js";

// Public registration: POST /api/registration
// No auth required - guests register themselves.

export const registrationRouter = Router();

registrationRouter.post("/", submitRegistrationHandler);
