import dotenv from "dotenv";
import app from "./app.js";
import { initDb } from "./db/connection.js";

dotenv.config();

// Learn: PORT comes from environment, not hardcoded.
// This lets cPanel/Namecheap use a different port in production.
const PORT = process.env.PORT || 3000;

// Initialize tables before accepting requests, so a fresh setup works
// with zero manual steps: start server -> tables exist.
initDb();

app.listen(PORT, () => {
  console.log(`Workers Ball Accreditation server running on port ${PORT}`);
  console.log(`Event: ${process.env.EVENT_NAME}`);
});
