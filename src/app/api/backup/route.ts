import { NextResponse } from "next/server";
import { createBackup, getLiveData, toErrorPayload } from "@/lib/github";
import { parseFinanceData } from "@/lib/schema";

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => null)) as
      | { data?: unknown }
      | null;
    let data;
    if (body?.data) {
      data = parseFinanceData(body.data);
    } else {
      const live = await getLiveData();
      data = live.data;
    }
    const result = await createBackup(data);
    return NextResponse.json(result);
  } catch (err) {
    const payload = toErrorPayload(err);
    return NextResponse.json(payload, { status: payload.status ?? 500 });
  }
}
