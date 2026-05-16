import express from "express";

import {
  addGroupMember,
  createGroup,
  getMyGroups,
} from "../controllers/groupController.js";

import { requireAuth } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(requireAuth);

router.post("/", createGroup);

router.get("/", getMyGroups);

router.post("/:groupId/members", addGroupMember);

export default router;
