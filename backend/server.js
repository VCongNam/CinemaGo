import express from "express";
import dotenv from "dotenv";
import { connectDB } from "./config/db.js";
import authRoutes from "./routes/auth.routes.js";
import protectedRoutes from "./routes/protected.routes.js";
import publicMovieRoutes from "./routes/publicMovie.routes.js";
import theaterRoutes from "./routes/theater.routes.js";
import roomRoutes from "./routes/room.routes.js";
import seatRoutes from "./routes/seat.routes.js";
import errorHandler from "./middlewares/errorHandler.js";
import cors from "cors";

dotenv.config();

const app = express();

app.use(express.json());
app.use(
  cors({
    origin: ["http://localhost:3000", "http://127.0.0.1:3000"],
    credentials: true,
  })
);

// Mount routes
app.use("/", authRoutes); // Public auth routes
app.use("/api", protectedRoutes); // Protected routes
app.use("/api/movies", publicMovieRoutes); // Public movie routes
app.use("/api/theaters", theaterRoutes); // Theater management routes (admin only)
app.use("/api/rooms", roomRoutes); // Room management routes (admin only)
app.use("/api/seats", seatRoutes); // Seat management routes (admin only)

// Error handler (last)
app.use(errorHandler);

app.listen(5000, () => {
  connectDB();

  console.log("Server is running on port 5000");
});
