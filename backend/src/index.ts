import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth";
import userRoutes from "./routes/user";
import streamRoutes from "./routes/stream";
import authMiddleware from "./utils/authMiddleware";
import adminRoutes from "./routes/admin";
import adminAuthMiddleware from "./utils/adminAuthMiddleware";

dotenv.config();

const jwtPass = process.env.JWT_PASS;
const PORT = process.env.PORT;
if (!jwtPass || !PORT) {
  throw console.error("env not found");
}

const app = express();
app.use(express.json());
app.use(cors());

app.get("/", (req, res) => {
  res.json({ msg: "Server Running" });
});

app.use("/auth", authRoutes);
app.use("/user", authMiddleware, userRoutes);
app.use("/stream", authMiddleware, streamRoutes);
app.use("/admin", authMiddleware, adminAuthMiddleware, adminRoutes);

app.listen(PORT, () => {
  console.log("http://localhost:" + PORT);
});
