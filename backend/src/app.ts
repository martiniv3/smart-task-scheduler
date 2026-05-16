import express from "express";
import cors from "cors";
import taskRoutes from "./routes/taskRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import groupRoutes from "./routes/groupRoutes.js";

const app = express();

app.use(cors());

app.use(express.json());

app.get("/", (_, res) => {
  res.send("API running");
});
app.use("/auth", authRoutes);
app.use("/tasks", taskRoutes);
app.use("/groups", groupRoutes);

app.listen(5000, () => {
  console.log("Server running on port 5000");
});
