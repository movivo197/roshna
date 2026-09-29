import "server-only";
import { createHmac, randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { isIP } from "node:net";
import type { NextRequest } from "next/server";

export const sessionCookieName = "roshan_admin";
export const sessionDuration = 60 * 60 * 8;
const attempts = new Map<string, { count: number; resetAt: number }>();
const windowMs = 15 * 60 * 1000;
const maxAttempts = 8;

function secret(): string | null {
  const value = process.env.ROSHAN_SESSION_SECRET;
  return value && value.length >= 48 ? value : null;
}

function safeEqual(left: string, right: string): boolean {
  const first = Buffer.from(left, "utf8");
  const second = Buffer.from(right, "utf8");
  return first.length === second.length && timingSafeEqual(first, second);
}

export function isAdminConfigured(): boolean {
  return Boolean(secret() && /^scrypt\$[a-f0-9]{32}\$[a-f0-9]{128}$/.test(process.env.ROSHAN_ADMIN_PASSWORD_HASH || ""));
}

export async function verifyPassword(password: string): Promise<boolean> {
  if (!isAdminConfigured() || password.length > 512) return false;
  const [, salt, hash] = process.env.ROSHAN_ADMIN_PASSWORD_HASH!.split("$");
  const derived = await new Promise<Buffer>((resolve, reject) => {
    scrypt(password, salt, 64, { N: 16384, r: 8, p: 1 }, (error, result) => error ? reject(error) : resolve(result));
  });
  const expected = Buffer.from(hash, "hex");
  return expected.length === derived.length && timingSafeEqual(expected, derived);
}

export function createSession(): string {
  const key = secret();
  if (!key) throw new Error("ADMIN_NOT_CONFIGURED");
  const payload = Buffer.from(JSON.stringify({ expires: Date.now() + sessionDuration * 1000, nonce: randomBytes(16).toString("hex"), version: process.env.ROSHAN_ADMIN_SESSION_VERSION || "1" })).toString("base64url");
  return `${payload}.${createHmac("sha256", key).update(payload).digest("base64url")}`;
}

export function hasAdminSession(request: NextRequest): boolean {
  const key = secret();
  const token = request.cookies.get(sessionCookieName)?.value;
  if (!key || !token || token.length > 1024 || !isAdminConfigured()) return false;
  const parts = token.split(".");
  if (parts.length !== 2) return false;
  const signature = createHmac("sha256", key).update(parts[0]).digest("base64url");
  if (!safeEqual(signature, parts[1])) return false;
  try {
    const payload = JSON.parse(Buffer.from(parts[0], "base64url").toString("utf8"));
    return typeof payload.expires === "number" && payload.expires > Date.now() && payload.expires <= Date.now() + sessionDuration * 1000 && payload.version === (process.env.ROSHAN_ADMIN_SESSION_VERSION || "1");
  } catch { return false; }
}

export function sessionCookieOptions() {
  return { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict" as const, path: "/", maxAge: sessionDuration };
}

export function sameOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try {
    const actual = new URL(origin);
    const configured = process.env.ROSHAN_APP_ORIGIN;
    if (configured) return actual.origin === new URL(configured).origin;
    // Nginx must pass Host unchanged; do not trust forwarded host headers.
    return actual.host === request.headers.get("host") && (actual.protocol === "https:" || (process.env.NODE_ENV !== "production" && actual.protocol === "http:"));
  } catch { return false; }
}

export function loginRateLimit(request: NextRequest): { allowed: boolean; retryAfter: number } {
  const now = Date.now();
  for (const [entryKey, entry] of attempts) if (entry.resetAt <= now) attempts.delete(entryKey);
  // Only trust this header behind a proxy that overwrites it and blocks direct access.
  const candidate = process.env.ROSHAN_TRUST_PROXY === "1" ? request.headers.get("x-real-ip") || "" : "";
  const key = isIP(candidate) ? candidate : "shared";
  let entry = attempts.get(key);
  if (!entry) {
    // Bounded memory; fail closed when too many active clients are tracked.
    if (attempts.size >= 4096) return { allowed: false, retryAfter: 60 };
    entry = { count: 0, resetAt: now + windowMs };
    attempts.set(key, entry);
  }
  entry.count += 1;
  return { allowed: entry.count <= maxAttempts, retryAfter: Math.max(1, Math.ceil((entry.resetAt - now) / 1000)) };
}
