import { NextResponse } from "next/server";
import { readAppConfig, publicAppConfig } from "../../../lib/config-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try { return NextResponse.json(publicAppConfig(await readAppConfig()), { headers: { "Cache-Control": "no-store" } }); }
  catch { return NextResponse.json({ error: "دریافت محتوای تازه ممکن نشد؛ کمی بعد دوباره تلاش کنید." }, { status: 503, headers: { "Cache-Control": "no-store" } }); }
}
