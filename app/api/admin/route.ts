import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { appConfigSchema } from "../../../lib/app-config";
import { readAppConfig, saveAppConfig } from "../../../lib/config-store";
import { createSession, hasAdminSession, isAdminConfigured, loginRateLimit, sameOrigin, sessionCookieName, sessionCookieOptions, verifyPassword } from "../../../lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const requestSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("login"), password: z.string().min(1).max(512) }).strict(),
  z.object({ action: z.literal("logout") }).strict(),
  z.object({ action: z.literal("save"), config: appConfigSchema }).strict(),
]);

function response(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } });
}

export async function GET(request: NextRequest) {
  if (!hasAdminSession(request)) return response({ error: "برای دسترسی به پنل، وارد شوید.", configured: isAdminConfigured() }, 401);
  try { return response({ config: await readAppConfig() }); }
  catch { return response({ error: "خواندن تنظیمات ممکن نشد. وضعیت فضای ذخیره‌سازی سرور را بررسی کنید." }, 503); }
}

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return response({ error: "مبدأ درخواست معتبر نیست." }, 403);
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) return response({ error: "قالب درخواست معتبر نیست." }, 415);
  if (Number(request.headers.get("content-length") || 0) > 3_000_000) return response({ error: "حجم درخواست بیش از حد مجاز است." }, 413);
  let input: z.infer<typeof requestSchema>;
  try {
    // Read incrementally to enforce the same bound for chunked requests.
    const reader = request.body?.getReader();
    if (!reader) return response({ error: "درخواست خالی است." }, 400);
    const chunks: Uint8Array[] = [];
    let length = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.length;
      if (length > 3_000_000) { await reader.cancel(); return response({ error: "حجم درخواست بیش از حد مجاز است." }, 413); }
      chunks.push(value);
    }
    input = requestSchema.parse(JSON.parse(Buffer.concat(chunks).toString("utf8")));
  } catch { return response({ error: "اطلاعات کامل و معتبر نیست. طول متن‌ها و پیوندهای https را بررسی کنید." }, 400); }
  if (input.action === "login") {
    const limit = loginRateLimit(request);
    if (!limit.allowed) { const result = response({ error: "تلاش‌های ورود زیاد است. پس از ۱۵ دقیقه دوباره تلاش کنید." }, 429); result.headers.set("Retry-After", String(limit.retryAfter)); return result; }
    if (!isAdminConfigured()) return response({ error: "پنل هنوز راه‌اندازی نشده است. راهنمای نصب مدیر را اجرا کنید." }, 503);
    try {
      if (!(await verifyPassword(input.password))) return response({ error: "رمز ورود درست نیست." }, 401);
      const result = response({ config: await readAppConfig() });
      result.cookies.set(sessionCookieName, createSession(), sessionCookieOptions());
      return result;
    } catch { return response({ error: "ورود ممکن نشد. کمی بعد دوباره تلاش کنید." }, 503); }
  }
  if (!hasAdminSession(request)) return response({ error: "نشست شما پایان یافته است. دوباره وارد شوید." }, 401);
  if (input.action === "logout") {
    const result = response({ ok: true });
    result.cookies.set(sessionCookieName, "", { ...sessionCookieOptions(), maxAge: 0 });
    return result;
  }
  try { return response({ config: await saveAppConfig(input.config) }); }
  catch { return response({ error: "ذخیره انجام نشد. فضای ذخیره‌سازی و دسترسی پوشهٔ data را بررسی کنید." }, 503); }
}
