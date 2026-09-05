import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1d";

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is not set");
}

export type AdminTokenPayload = {
  sub: number;
  role: "platform-admin";
};

export type UserTokenPayload = {
  sub: number;
  tenant_id: number;
  role: "org-admin" | "org-user";
};

export type AuthTokenPayload = AdminTokenPayload | UserTokenPayload;

export function signToken(payload: AuthTokenPayload): string {
  return jwt.sign(
    payload,
    JWT_SECRET as string,
    {
      expiresIn: JWT_EXPIRES_IN,
    } as jwt.SignOptions,
  );
}

export function verifyToken(token: string): AuthTokenPayload {
  return jwt.verify(token, JWT_SECRET as string) as unknown as AuthTokenPayload;
}
