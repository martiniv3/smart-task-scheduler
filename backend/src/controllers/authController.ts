import type { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import prisma from "../prisma/client.js";
import { loginSchema, registerSchema } from "../validators/authValidators.js";

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET is not configured");
  }

  return secret;
}

export const register = async (req: Request, res: Response) => {
  try {
    const validation = registerSchema.safeParse(req.body);

    if (!validation.success) {
      const validationErrorResponse = {
        error: "Invalid register data",
        details: validation.error.flatten().fieldErrors,
      };

      return res.status(400).json(validationErrorResponse);
    }

    const { email, password } = validation.data;

    const userFilter = {
      email,
    };

    const existingUser = await prisma.user.findUnique({
      where: userFilter,
    });

    if (existingUser) {
      const conflictResponse = {
        error: "User with this email already exists",
      };

      return res.status(409).json(conflictResponse);
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const userData = {
      email,
      passwordHash,
    };

    const userSelection = {
      id: true,
      email: true,
      createdAt: true,
    };

    const user = await prisma.user.create({
      data: userData,
      select: userSelection,
    });

    const successResponse = {
      message: "User registered successfully",
      user,
    };

    return res.status(201).json(successResponse);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to register";

    const errorResponse = {
      error: message,
    };

    return res.status(500).json(errorResponse);
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const validation = loginSchema.safeParse(req.body);

    if (!validation.success) {
      const validationErrorResponse = {
        error: "Invalid login data",
        details: validation.error.flatten().fieldErrors,
      };

      return res.status(400).json(validationErrorResponse);
    }

    const { email, password } = validation.data;

    const userFilter = {
      email,
    };

    const user = await prisma.user.findUnique({
      where: userFilter,
    });

    if (!user) {
      const unauthorizedResponse = {
        error: "Invalid email or password",
      };

      return res.status(401).json(unauthorizedResponse);
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);

    if (!passwordMatches) {
      const unauthorizedResponse = {
        error: "Invalid email or password",
      };

      return res.status(401).json(unauthorizedResponse);
    }

    const tokenPayload = {
      userId: user.id,
      email: user.email,
    };

    const tokenOptions = {
      expiresIn: "1d" as const,
    };

    const token = jwt.sign(tokenPayload, getJwtSecret(), tokenOptions);

    const successResponse = {
      message: "Login successful",
      token,
      user: {
        id: user.id,
        email: user.email,
      },
    };

    return res.json(successResponse);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to login";

    const errorResponse = {
      error: message,
    };

    return res.status(500).json(errorResponse);
  }
};
