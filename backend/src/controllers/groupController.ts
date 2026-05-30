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

    const memberData = {
      userId,
    };

    const groupData = {
      name: validation.data.name,
      ownerId: userId,
      members: {
        create: memberData,
      },
    };

    const userSelection = {
      id: true,
      email: true,
    };

    const groupRelations = {
      members: {
        include: {
          user: {
            select: userSelection,
          },
        },
      },
    };

    const group = await prisma.group.create({
      data: groupData,
      include: groupRelations,
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

    const groupFilter = {
      members: {
        some: {
          userId,
        },
      },
    };

    const userSelection = {
      id: true,
      email: true,
    };

    const groupRelations = {
      owner: {
        select: userSelection,
      },
      members: {
        include: {
          user: {
            select: userSelection,
          },
        },
      },
    };

    const groupOrder = {
      createdAt: "desc" as const,
    };

    const groups = await prisma.group.findMany({
      where: groupFilter,
      include: groupRelations,
      orderBy: groupOrder,
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
      const validationErrorResponse = {
        error: "Invalid member data",
        details: validation.error.flatten().fieldErrors,
      };

      return res.status(400).json(validationErrorResponse);
    }

    const ownerFilter = {
      id: groupId,
      ownerId: userId,
    };

    const group = await prisma.group.findFirst({
      where: ownerFilter,
    });

    if (!group) {
      const forbiddenResponse = {
        error: "Only the group owner can add members",
      };

      return res.status(403).json(forbiddenResponse);
    }

    const userFilter = {
      email: validation.data.email,
    };

    const userToAdd = await prisma.user.findUnique({
      where: userFilter,
    });

    if (!userToAdd) {
      const notFoundResponse = {
        error: "User with this email was not found",
      };

      return res.status(404).json(notFoundResponse);
    }

    const existingMembershipFilter = {
      groupId,
      userId: userToAdd.id,
    };

    const existingMembership = await prisma.groupMember.findFirst({
      where: existingMembershipFilter,
    });

    if (existingMembership) {
      const conflictResponse = {
        error: "User is already a member of this group",
      };

      return res.status(409).json(conflictResponse);
    }

    const membershipData = {
      groupId,
      userId: userToAdd.id,
    };

    const userSelection = {
      id: true,
      email: true,
    };

    const membershipRelations = {
      user: {
        select: userSelection,
      },
    };

    const membership = await prisma.groupMember.create({
      data: membershipData,
      include: membershipRelations,
    });

    return res.status(201).json(membership);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to add group member";

    const errorResponse = {
      error: message,
    };

    return res.status(400).json(errorResponse);
  }
};
