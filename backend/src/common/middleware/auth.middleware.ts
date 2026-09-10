import type { Request, RequestHandler } from "express";
import jwt from "jsonwebtoken";
import { env } from "../../config/env.js";

export type AuthUser = { id?: string; email: string; role: "customer" | "admin" };

export function readBearerToken(authorization?: string) {
  if (!authorization) return "";
  return authorization.startsWith("Bearer ") ? authorization.slice(7).trim() : "";
}

export function readCookieToken(request: Request) {
  const cookies = (request as Request & { cookies?: Record<string, string> }).cookies;
  return typeof cookies?.access_token === "string" ? cookies.access_token : "";
}

/** Customer/browser auth prefers the httpOnly cookie. This prevents a stale
 * admin Bearer token from overriding a valid customer session. */
export function readRequestToken(request: Request) {
  return readCookieToken(request) || readBearerToken(request.headers.authorization);
}

export function verifyAccessToken(token: string): AuthUser {
  if (!token) throw new Error("Missing token");
  const payload = jwt.verify(token, env.jwtAccessSecret) as { sub?: string; email?: string; role?: string };
  if (!payload.email || (payload.role !== "customer" && payload.role !== "admin")) throw new Error("Invalid token payload");
  return { id: payload.sub, email: payload.email, role: payload.role };
}

export const requireAuth: RequestHandler = (request, response, next) => {
  try {
    const user = verifyAccessToken(readRequestToken(request));
    (request as typeof request & { user: AuthUser }).user = user;
    next();
  } catch {
    response.status(401).json({ success: false, message: "Authentication required" });
  }
};
