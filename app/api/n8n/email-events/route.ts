import { NextRequest, NextResponse } from "next/server";
import { getUnsentEmailEvents, markEmailEventSent } from "@/lib/services/email";

function verifySecret(request: NextRequest): boolean {
  const expectedSecret = process.env.N8N_WEBHOOK_SECRET || "default_nowshera_n8n_secret_2026";

  const authHeader = request.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.replace("Bearer ", "").trim();
    if (token === expectedSecret) return true;
  }

  const customHeader = request.headers.get("x-webhook-secret");
  if (customHeader && customHeader === expectedSecret) return true;

  const url = new URL(request.url);
  const querySecret = url.searchParams.get("secret");
  if (querySecret && querySecret === expectedSecret) return true;

  return false;
}

export async function GET(request: NextRequest) {
  if (!verifySecret(request)) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "Invalid or missing N8N_WEBHOOK_SECRET" } },
      { status: 401 }
    );
  }

  try {
    const events = await getUnsentEmailEvents();
    return NextResponse.json({ success: true, data: events });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: error.message } },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  if (!verifySecret(request)) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "Invalid or missing N8N_WEBHOOK_SECRET" } },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const eventId = body.event_id || body.id;
    const eventIds: string[] = body.event_ids || (eventId ? [eventId] : []);

    if (eventIds.length === 0) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "event_id or event_ids required" } },
        { status: 400 }
      );
    }

    const results = await Promise.all(eventIds.map((id) => markEmailEventSent(id)));
    const allSuccessful = results.every(Boolean);

    return NextResponse.json({
      success: allSuccessful,
      message: `Marked ${eventIds.length} event(s) as sent`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: error.message } },
      { status: 500 }
    );
  }
}
