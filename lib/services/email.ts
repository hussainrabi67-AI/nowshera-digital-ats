import { createAdminClient } from "@/lib/supabase/admin";
import { EmailEvent, EmailEventType } from "@/lib/types";

export interface EmailTemplateData {
  subject: string;
  bodyText: string;
}

export function formatEmailContent(
  eventType: EmailEventType,
  candidateName: string,
  jobTitle: string,
  extraPayload?: Record<string, any>
): EmailTemplateData {
  switch (eventType) {
    case "application_received":
      return {
        subject: `Application received — ${jobTitle}`,
        bodyText: `Hi ${candidateName},\n\nWe received your application for ${jobTitle}.\n\nYour application is now under review.\n\nThank you,\nNowshera Digital`,
      };
    case "interview_invite":
      const startsAt = extraPayload?.starts_at
        ? new Date(extraPayload.starts_at).toLocaleString()
        : "As scheduled";
      const endsAt = extraPayload?.ends_at
        ? new Date(extraPayload.ends_at).toLocaleTimeString()
        : "1 hour later";
      return {
        subject: `Interview invitation — ${jobTitle}`,
        bodyText: `Hi ${candidateName},\n\nYour interview has been scheduled.\n\nDate & Time: ${startsAt} - ${endsAt}\nDuration: 60 minutes\n\nPlease be available at the scheduled time.\n\nBest regards,\nNowshera Digital Hiring Team`,
      };
    case "hired":
      return {
        subject: `Application update — ${jobTitle}`,
        bodyText: `Hi ${candidateName},\n\nWe are pleased to inform you that your application for ${jobTitle} has been successful!\n\nWelcome to Nowshera Digital!\n\nBest regards,\nNowshera Digital Hiring Team`,
      };
    case "rejected":
      return {
        subject: `Application update — ${jobTitle}`,
        bodyText: `Hi ${candidateName},\n\nThank you for your interest in the ${jobTitle} position. After reviewing your application, we will not be moving forward with it.\n\nWe wish you all the best in your job search.\n\nThank you,\nNowshera Digital`,
      };
    default:
      return {
        subject: `Application update — ${jobTitle}`,
        bodyText: `Hi ${candidateName},\n\nYour application status has been updated.\n\nNowshera Digital`,
      };
  }
}

export async function getUnsentEmailEvents(): Promise<EmailEvent[]> {
  const adminClient = createAdminClient();

  const { data, error } = await adminClient
    .from("email_events")
    .select("*")
    .is("sent_at", null)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching unsent email events:", error);
    return [];
  }

  return (data || []) as EmailEvent[];
}

export async function markEmailEventSent(eventId: string): Promise<boolean> {
  const adminClient = createAdminClient();

  const { error } = await adminClient
    .from("email_events")
    .update({
      sent_at: new Date().toISOString(),
      failed_at: null,
      error_message: null,
    })
    .eq("id", eventId);

  if (error) {
    console.error("Error marking email event as sent:", error);
    return false;
  }

  return true;
}

export async function getAllEmailEventsAdmin(): Promise<EmailEvent[]> {
  const adminClient = createAdminClient();

  const { data, error } = await adminClient
    .from("email_events")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching email events:", error);
    return [];
  }

  return (data || []) as EmailEvent[];
}
