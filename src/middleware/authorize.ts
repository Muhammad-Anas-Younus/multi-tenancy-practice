import { NextFunction, Request, Response } from "express";
import { AuthTokenPayload } from "../utils/jwt";

export function authorize(...roles: AuthTokenPayload["role"][]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.auth || !roles.includes(req.auth.role)) {
      return res.status(403).json({ success: false, error: "Forbidden" });
    }
    return next();
  };
}
