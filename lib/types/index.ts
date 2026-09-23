export type AppRole = 'candidate' | 'recruiter' | 'admin';

export type JobStatus = 'draft' | 'open' | 'closed';

export type ApplicationStage =
  | 'applied'
  | 'shortlisted'
  | 'interview'
  | 'offer'
  | 'hired'
  | 'rejected'
  | 'withdrawn';

export type EmailEventType =
  | 'application_received'
  | 'interview_invite'
  | 'hired'
  | 'rejected';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: AppRole;
  created_at: string;
  updated_at: string;
}

export interface Job {
  id: string;
  title: string;
  description: string;
  requirements: string;
  location: string | null;
  employment_type: string | null;
  openings: number;
  deadline: string;
  status: JobStatus;
  created_by: string;
  created_at: string;
  updated_at: string;
  // Optional populated fields
  creator?: Profile;
  assigned_recruiters?: Profile[];
  application_count?: number;
  hired_count?: number;
}

export interface JobRecruiter {
  job_id: string;
  recruiter_id: string;
  assigned_at: string;
  recruiter?: Profile;
}

export interface Application {
  id: string;
  job_id: string;
  candidate_id: string;
  stage: ApplicationStage;
  cv_path: string;
  cv_original_name: string;
  cv_size_bytes: number;
  cv_mime_type: string;
  applied_at: string;
  updated_at: string;
  withdrawn_at: string | null;
  hired_at: string | null;
  rejected_at: string | null;
  // Populated fields
  job?: Job;
  candidate?: Profile;
  interview?: Interview | null;
  notes_count?: number;
}

export interface ApplicationStageHistory {
  id: string;
  application_id: string;
  from_stage: ApplicationStage | null;
  to_stage: ApplicationStage;
  changed_by: string;
  created_at: string;
  changer?: Profile;
}

export interface ApplicationNote {
  id: string;
  application_id: string;
  recruiter_id: string;
  note: string;
  created_at: string;
  updated_at: string;
  recruiter?: Profile;
}

export interface Interview {
  id: string;
  application_id: string;
  recruiter_id: string;
  starts_at: string;
  ends_at: string;
  created_at: string;
  recruiter?: Profile;
  application?: Application;
}

export interface EmailEvent {
  id: string;
  application_id: string;
  event_type: EmailEventType;
  recipient_email: string;
  payload: Record<string, unknown>;
  created_at: string;
  sent_at: string | null;
  failed_at: string | null;
  error_message: string | null;
}

export interface DashboardStats {
  totalJobs: number;
  openJobs: number;
  totalApplications: number;
  activeApplications: number;
  interviewsScheduled: number;
  offersMade: number;
  hiredCount: number;
  rejectedCount: number;
  withdrawnCount: number;
  funnel: {
    stage: string;
    count: number;
  }[];
  jobsBreakdown: {
    id: string;
    title: string;
    status: JobStatus;
    openings: number;
    total: number;
    applied: number;
    shortlisted: number;
    interview: number;
    offer: number;
    hired: number;
    rejected: number;
    withdrawn: number;
  }[];
}

export interface RecruiterStats {
  assignedJobsCount: number;
  activeCandidatesCount: number;
  interviewsTodayCount: number;
  offersCount: number;
  hiredCount: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}
