import cors from "cors";
import express, {
  type NextFunction,
  type Request,
  type Response,
} from "express";
import { HttpError } from "./errors/http.error.js";
import { publicTicketHandler } from "./controllers/guest.controller.js";
import { authRouter } from "./routes/auth.routes.js";
import { guestRouter } from "./routes/guest.routes.js";
import { statsRouter } from "./routes/stats.routes.js";

const app = express();

// Allow the React dev server to call this API during development.
// Learn: CORS = browser rule that says "which websites may call me?"
app.use(cors());
// Admin CSV imports arrive as JSON { csv: "..." }: a large list is
// past the 100KB default, so the cap is raised. Import and
// external-ingest routes still validate every row; size isn't trust.
app.use(express.json({ limit: "5mb" }));

// Health check - proves frontend/backend communication works.
app.get("/api/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", service: "workers-ball-server" });
});

// Guest management (Chunks 3-4). Router handles the paths,
// mounted here so the full paths are /api/guests and /api/guests/:id.
app.use("/api/guests", guestRouter);

// Admin authentication (Chunk 5): POST /api/auth/login, GET /api/auth/me.
app.use("/api/auth", authRouter);
app.use("/api/guests/stats", statsRouter);

// Public registration (Chunk 3): POST /api/registration.
// No requireAuth: guests register themselves.
import { registrationRouter } from "./routes/registration.routes.js";
app.use("/api/registration", registrationRouter);

// Simple root message.
app.get("/", (_req: Request, res: Response) => {
  res.json({ message: "Workers Ball 2026 API - ready" });
});

// Public ticket verification for printed QRs (no login): resolves a token
// to name + ticket only. Guests scan with any camera; staff scanning the
// same QR still lands via extractQrToken (any URL with token= works).
app.get("/api/ticket", publicTicketHandler);

// Central error handler. Must have 4 parameters or Express ignores it.
// Known HttpError (400/409) -> clean JSON. Anything else -> generic 500,
// never stack traces or raw SQLite text.
app.use(
  (err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof HttpError) {
      res.status(err.statusCode).json({ error: err.title, message: err.message });
      return;
    }
    // express.json() throws a SyntaxError with status 400 on malformed JSON.
    const status = (err as unknown as { status?: unknown }).status;
    if (err instanceof SyntaxError && status === 400) {
      res.status(400).json({ error: "Invalid JSON", message: "Request body is not valid JSON." });
      return;
    }
    // Oversize bodies (entity.too.large, status 413): tell the admin to
    // split the file instead of a mystery 500.
    if (status === 413) {
      res.status(413).json({
        error: "File too large",
        message: "This file is too large to import at once. Split it into smaller files and import each.",
      });
      return;
    }
    console.error(err);
    res
      .status(500)
      .json({ error: "Internal server error", message: "Something went wrong." });
  }
);

export default app;
