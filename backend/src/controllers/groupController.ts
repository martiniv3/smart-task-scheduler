import type { Response } from "express";

import prisma from "../prisma/client.js";
import type { AuthRequest } from "../middleware/authMiddleware.js";
import {
  addGroupMemberSchema,
  createGroupSchema,
} from "../validators/groupValidators.js";

function getCurrentUserId(req: AuthRequest): string {
  if (!req.user) {
    throw new Error("Authenticated user is missing");
  }

  return req.user.userId;
}

function getGroupId(req: AuthRequest): string {
  const groupId = req.params.groupId;

  if (!groupId || Array.isArray(groupId)) {
    throw new Error("Invalid group id");
  }

  return groupId;
}

export const createGroup = async (req: AuthRequest, res: Response) => {
  try {
    const userId = getCurrentUserId(req);

    const validation = createGroupSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        error: "Invalid group data",
        details: validation.error.flatten().fieldErrors,
      });
    }

    const group = await prisma.group.create({
      data: {
        name: validation.data.name,
        ownerId: userId,
        members: {
          create: {
            userId,
          },
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
              },
            },
          },
        },
      },
    });

    return res.status(201).json(group);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create group";

    return res.status(500).json({
      error: message,
    });
  }
};

export const getMyGroups = async (req: AuthRequest, res: Response) => {
  try {
    const userId = getCurrentUserId(req);

    const groups = await prisma.group.findMany({
      where: {
        members: {
          some: {
            userId,
          },
        },
      },
      include: {
        owner: {
          select: {
            id: true,
            email: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.json(groups);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch groups";

    return res.status(500).json({
      error: message,
    });
  }
};

export const addGroupMember = async (req: AuthRequest, res: Response) => {
  try {
    const userId = getCurrentUserId(req);
    const groupId = getGroupId(req);

    const validation = addGroupMemberSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        error: "Invalid member data",
        details: validation.error.flatten().fieldErrors,
      });
    }

    const group = await prisma.group.findFirst({
      where: {
        id: groupId,
        ownerId: userId,
      },
    });

    if (!group) {
      return res.status(403).json({
        error: "Only the group owner can add members",
      });
    }

    const userToAdd = await prisma.user.findUnique({
      where: {
        email: validation.data.email,
      },
    });

    if (!userToAdd) {
      return res.status(404).json({
        error: "User with this email was not found",
      });
    }

    const membership = await prisma.groupMember.create({
      data: {
        groupId,
        userId: userToAdd.id,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    return res.status(201).json(membership);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to add group member";

    return res.status(400).json({
      error: message,
    });
  }
};
