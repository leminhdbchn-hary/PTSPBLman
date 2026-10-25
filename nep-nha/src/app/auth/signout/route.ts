import { requestOrigin } from "@/lib/utils";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isConfigured } from "@/lib/env";

/** Đăng xuất: chỉ nhận POST (chống bị ép đăng xuất bằng liên kết). */
export async function POST(request: NextRequest) {
  if (isConfigured()) await (await createClient()).auth.signOut();
  return NextResponse.redirect(new URL("/", requestOrigin(request)), { status: 303 });
}
