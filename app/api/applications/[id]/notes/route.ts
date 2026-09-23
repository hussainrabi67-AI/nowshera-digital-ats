import { NextRequest, NextResponse } from "next/server";
import { assertApplicationAccess, requireAuth } from "@/lib/auth/server";
import { createApplicationNote, getApplicationNotes } from "@/lib/services/notes";
import { createNoteSchema } from "@/lib/validations";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { profile } = await requireAuth();
    const { id } = await context.params;

    // Strict privacy: Candidates can NEVER read recruiter notes (Test Case 9)
    if (profile.role === "candidate") {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "Candidates are not permitted to view recruiter notes",
          },
        },
        { status: 403 }
      );
    }

    // Must be assigned recruiter or admin
    await assertApplicationAccess(id, profile.id, profile.role);

    const notes = await getApplicationNotes(id);
    return NextResponse.json({ success: true, data: notes });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: error.code || "ERROR", message: error.message } },
      { status: error.statusCode || 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { profile } = await requireAuth();
    const { id } = await context.params;

    // Strict privacy: Candidates cannot write recruiter notes
    if (profile.role === "candidate") {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "Candidates are not permitted to create recruiter notes",
          },
        },
        { status: 403 }
      );
    }

    await assertApplicationAccess(id, profile.id, profile.role);

    const body = await request.json();
    const { note } = createNoteSchema.parse(body);

    const newNote = await createApplicationNote(id, profile.id, note);
    return NextResponse.json({ success: true, data: newNote }, { status: 201 });
  } catch (error: any) {
    const statusCode = error.statusCode || (error.name === "ZodError" ? 400 : 500);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: error.code || (error.name === "ZodError" ? "VALIDATION_ERROR" : "NOTE_FAILED"),
          message: error.message,
        },
      },
      { status: statusCode }
    );
  }
}
