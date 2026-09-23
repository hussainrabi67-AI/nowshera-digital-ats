import { z } from "zod";

export const jobStatusEnum = z.enum(["draft", "open", "closed"]);
export const applicationStageEnum = z.enum([
  "applied",
  "shortlisted",
  "interview",
  "offer",
  "hired",
  "rejected",
  "withdrawn",
]);
export const appRoleEnum = z.enum(["candidate", "recruiter", "admin"]);

export const createJobSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  requirements: z.string().min(5, "Requirements must be at least 5 characters"),
  location: z.string().optional().nullable(),
  employment_type: z.string().optional().nullable(),
  openings: z
  .number()
  .int("Openings must be a whole number")
  .min(1, "Openings must be at least 1"),
  deadline: z.string().refine((val) => {
    const d = new Date(val);
    return !isNaN(d.getTime()) && d.getTime() > Date.now();
  }, "Deadline must be a valid future date"),
  status: jobStatusEnum.default("draft"),
  recruiter_ids: z.array(z.string().uuid()).optional(),
});

export const updateJobSchema = z.object({
  title: z.string().min(3).optional(),
  description: z.string().min(10).optional(),
  requirements: z.string().min(5).optional(),
  location: z.string().optional().nullable(),
  employment_type: z.string().optional().nullable(),
  openings: z.number().int().min(1).optional(),
  deadline: z.string().optional(),
  status: jobStatusEnum.optional(),
  recruiter_ids: z.array(z.string().uuid()).optional(),
});

export const stageTransitionSchema = z.object({
  new_stage: applicationStageEnum,
});

export const scheduleInterviewSchema = z.object({
  starts_at: z.string().refine((val) => {
    const d = new Date(val);
    return !isNaN(d.getTime()) && d.getTime() > Date.now();
  }, "Interview time must be in the future"),
});

export const createNoteSchema = z.object({
  note: z.string().trim().min(1, "Note cannot be empty").max(5000, "Note is too long"),
});

export const createRecruiterSchema = z.object({
  email: z.string().email("Invalid email address"),
  full_name: z.string().min(2, "Full name must be at least 2 characters"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export type CreateJobInput = z.infer<typeof createJobSchema>;
export type UpdateJobInput = z.infer<typeof updateJobSchema>;
export type StageTransitionInput = z.infer<typeof stageTransitionSchema>;
export type ScheduleInterviewInput = z.infer<typeof scheduleInterviewSchema>;
export type CreateNoteInput = z.infer<typeof createNoteSchema>;
export type CreateRecruiterInput = z.infer<typeof createRecruiterSchema>;
