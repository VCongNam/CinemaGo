import express from "express";
import dotenv from "dotenv";
import { connectDB } from "./config/db.js";
import User from "./models/user.js";
import bcrypt from "bcryptjs";

dotenv.config();

const app = express();

app.use(express.json());

app.post("/register-staff", async (req, res) => {
  const { username, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  await User.create({ username, password: hashedPassword, role: "staff" });
  res.status(201).json({ message: "User created successfully" });
});

app.post("/login-staff", async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  if (!user) {
    return res.status(401).json({ message: "Invalid username or password" });
  }
  const isPasswordCorrect = await bcrypt.compare(password, user.password);
  if (!isPasswordCorrect) {
    return res.status(401).json({ message: "Invalid username or password" });
  }
  res.status(200).json({ message: "Login successful" });
});

app.listen(5000, () => {
  connectDB();

  console.log("Server is running on port 5000");
});
