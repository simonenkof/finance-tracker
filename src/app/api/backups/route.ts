import { NextResponse } from "next/server";
import { listBackups, toErrorPayload } from "@/lib/github";

export async function GET() {
  try {
    const backups = await listBackups();
    return NextResponse.json({ backups });
  } catch (err) {
    const payload = toErrorPayload(err);
    return NextResponse.json(payload, { status: payload.status ?? 500 });
  }
}
