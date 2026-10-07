import { NextResponse } from "next/server";
import { restoreBackup, toErrorPayload } from "@/lib/github";
import { applyRecurring } from "@/lib/recurring";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      path: string;
      sha: string | null;
    };
    if (!body.path) {
      return NextResponse.json(
        { error: "path is required", kind: "api" },
        { status: 400 },
      );
    }
    const { data, sha } = await restoreBackup(body.path, body.sha ?? null);
    const withRecurring = applyRecurring(data);
    return NextResponse.json({ data: withRecurring, sha });
  } catch (err) {
    const payload = toErrorPayload(err);
    return NextResponse.json(payload, { status: payload.status ?? 500 });
  }
}
