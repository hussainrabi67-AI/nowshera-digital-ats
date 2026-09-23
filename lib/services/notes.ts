import { createClient } from "@/lib/supabase/server";
import { ApplicationNote } from "@/lib/types";

export async function getApplicationNotes(applicationId: string): Promise<ApplicationNote[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("application_notes")
    .select(`
      *,
      recruiter:recruiter_id (
        id,
        full_name,
        email,
        role
      )
    `)
    .eq("application_id", applicationId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching notes:", error);
    return [];
  }

  return (data || []) as ApplicationNote[];
}

export async function createApplicationNote(
  applicationId: string,
  recruiterId: string,
  noteText: string
): Promise<ApplicationNote> {
  const cleanNote = noteText.trim();
  if (!cleanNote) {
    throw new Error("Note content cannot be empty");
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("application_notes")
    .insert({
      application_id: applicationId,
      recruiter_id: recruiterId,
      note: cleanNote,
    })
    .select(`
      *,
      recruiter:recruiter_id (
        id,
        full_name,
        email,
        role
      )
    `)
    .single();

  if (error || !data) {
    throw new Error(error?.message || "Failed to create note");
  }

  return data as ApplicationNote;
}
