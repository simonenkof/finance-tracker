import { NextResponse } from "next/server";
import {
  getLiveData,
  putLiveData,
  toErrorPayload,
} from "@/lib/github";
import { applyRecurring } from "@/lib/recurring";
import { parseFinanceData } from "@/lib/schema";

export async function GET() {
  try {
    const { data, sha } = await getLiveData();
    const withRecurring = applyRecurring(data);
    const changed =
      withRecurring.operations.length !== data.operations.length ||
      JSON.stringify(withRecurring.recurring) !== JSON.stringify(data.recurring);

    if (changed) {
      const newSha = await putLiveData(
        withRecurring,
        sha,
        "Auto-generate recurring expenses",
      );
      return NextResponse.json({ data: withRecurring, sha: newSha, generated: true });
    }

    return NextResponse.json({ data: withRecurring, sha, generated: false });
  } catch (err) {
    const payload = toErrorPayload(err);
    return NextResponse.json(payload, { status: payload.status ?? 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as { data: unknown; sha: string | null };
    const data = parseFinanceData(body.data);
    const withRecurring = applyRecurring(data);
    const newSha = await putLiveData(withRecurring, body.sha ?? null);
    return NextResponse.json({ data: withRecurring, sha: newSha });
  } catch (err) {
    const payload = toErrorPayload(err);
    return NextResponse.json(payload, { status: payload.status ?? 500 });
  }
}
