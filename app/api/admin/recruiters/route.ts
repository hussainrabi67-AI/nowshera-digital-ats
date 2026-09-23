import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { createRecruiterSchema } from "@/lib/validations";

export async function GET(_request: NextRequest) {
  try {
    await requireAdmin();
    const supabase = await createClient();

    const { data: recruiters, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("role", "recruiter")
      .order("full_name", { ascending: true });

    if (error) {
      return NextResponse.json(
        { success: false, error: { code: "QUERY_FAILED", message: error.message } },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: recruiters || [] });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: error.code || "ERROR", message: error.message } },
      { status: error.statusCode || 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();
    const validated = createRecruiterSchema.parse(body);

    const adminClient = createAdminClient();

    // Create user in Supabase Auth
    const { data: userData, error: authError } = await adminClient.auth.admin.createUser({
      email: validated.email,
      password: validated.password,
      email_confirm: true,
      user_metadata: {
        full_name: validated.full_name,
      },
    });

    if (authError || !userData.user) {
      return NextResponse.json(
        { success: false, error: { code: "CREATE_USER_FAILED", message: authError?.message || "Failed to create user" } },
        { status: 400 }
      );
    }

    // Set role to recruiter in profiles
    const { data: profile, error: profileError } = await adminClient
      .from("profiles")
      .update({
        role: "recruiter",
        full_name: validated.full_name,
      })
      .eq("id", userData.user.id)
      .select()
      .single();

    if (profileError) {
      return NextResponse.json(
        { success: false, error: { code: "PROFILE_UPDATE_FAILED", message: profileError.message } },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: profile }, { status: 201 });
  } catch (error: any) {
    const statusCode = error.statusCode || (error.name === "ZodError" ? 400 : 500);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: error.code || (error.name === "ZodError" ? "VALIDATION_ERROR" : "ERROR"),
          message: error.message,
        },
      },
      { status: statusCode }
    );
  }
}
