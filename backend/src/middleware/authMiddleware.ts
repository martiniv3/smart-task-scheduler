import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

type TokenPayload = {
  userId: string;
  email: string;
};

export type AuthRequest = Request & {
  user?: TokenPayload;
};

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET is not configured");
  }

  return secret;
}

export function requireAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        error: "Authorization token is missing",
      });
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        error: "Authorization token is missing",
      });
    }

    const decoded = jwt.verify(token, getJwtSecret());

    if (
      typeof decoded !== "object" ||
      decoded === null ||
      !("userId" in decoded) ||
      !("email" in decoded)
    ) {
      return res.status(401).json({
        error: "Invalid token payload",
      });
    }

    req.user = {
      userId: String(decoded.userId),
      email: String(decoded.email),
    };

    next();
  } catch {
    return res.status(401).json({
      error: "Invalid or expired token",
    });
  }
}
