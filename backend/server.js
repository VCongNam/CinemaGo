import express from "express";
import dotenv from "dotenv";
import { connectDB } from "./config/db.js";
import authRoutes from "./routes/auth.routes.js";
import protectedRoutes from "./routes/protected.routes.js";
import publicMovieRoutes from "./routes/publicMovie.routes.js";
import errorHandler from "./middlewares/errorHandler.js";

dotenv.config();

const app = express();

app.use(express.json());

// Mount routes
app.use("/", authRoutes); // Public auth routes
app.use("/api", protectedRoutes); // Protected routes
app.use("/api/movies", publicMovieRoutes); // Public movie routes

// Error handler (last)
app.use(errorHandler);

app.listen(5000, () => {
  connectDB();

  console.log("Server is running on port 5000");
});
