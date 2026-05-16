import express from "express";

import {
  createTask,
  getTasks,
  getAvailableSlot,
  autoScheduleTaskController,
  updateTask,
  deleteTask,
} from "../controllers/taskController.js";

import { requireAuth } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(requireAuth);

router.post("/available-slot", getAvailableSlot);

router.post("/auto-schedule", autoScheduleTaskController);

router.post("/", createTask);

router.get("/", getTasks);

router.put("/:id", updateTask);

router.delete("/:id", deleteTask);

export default router;
