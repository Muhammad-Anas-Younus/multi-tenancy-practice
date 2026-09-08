import { NextFunction, Request, Response } from "express";
import {
  AdminTokenPayload,
  AuthTokenPayload,
  UserTokenPayload,
  verifyToken,
} from "../utils/jwt";

declare global {
  namespace Express {
    interface Request {
      auth?: AuthTokenPayload;
      adminAuth?: AdminTokenPayload;
      tenantAuth?: UserTokenPayload;
    }
  }
}

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : undefined;

  if (!token) {
    return res.status(401).json({ success: false, error: "Unauthorized" });
  }

  try {
    req.auth = verifyToken(token);
    return next();
  } catch (error) {
    return res.status(401).json({ success: false, error: "Unauthorized" });
  }
}
