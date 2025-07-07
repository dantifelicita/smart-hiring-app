import { neon } from "@neondatabase/serverless"

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set")
}

const sql = neon(process.env.DATABASE_URL)

export interface JobDescription {
  job_id: number
  job_title: string
  description: string
  criteria: string
  created_at: string
}

export interface Candidate {
  candidate_id: number
  name: string
  applied_job_id: number
  status: "CV Screening" | "Interview" | "Offer" | "Hired" | "Rejected"
  cv_file?: string
  interview_transcript?: string
  interview_date?: string
  evaluation_summaries: {
    cv_summary?: string
    interview_summary?: string
  }
  confidence_score: number
  created_at: string
  updated_at: string
  job_title?: string
}

export async function getJobDescriptions(): Promise<JobDescription[]> {
  const result = await sql`
    SELECT * FROM job_descriptions 
    ORDER BY created_at DESC
  `
  return result as JobDescription[]
}

export async function getCandidates(): Promise<Candidate[]> {
  const result = await sql`
    SELECT c.*, jd.job_title 
    FROM candidates c
    LEFT JOIN job_descriptions jd ON c.applied_job_id = jd.job_id
    ORDER BY c.created_at DESC
  `
  return result as Candidate[]
}

export async function getCandidateById(id: number): Promise<Candidate | null> {
  const result = await sql`
    SELECT c.*, jd.job_title, jd.description, jd.criteria
    FROM candidates c
    LEFT JOIN job_descriptions jd ON c.applied_job_id = jd.job_id
    WHERE c.candidate_id = ${id}
  `
  return (result[0] as Candidate) || null
}

export async function createCandidate(name: string, jobId: number): Promise<Candidate> {
  const result = await sql`
    INSERT INTO candidates (name, applied_job_id)
    VALUES (${name}, ${jobId})
    RETURNING *
  `
  return result[0] as Candidate
}

export async function updateCandidateStatus(
  candidateId: number,
  status: string,
  evaluationSummaries?: any,
  confidenceScore?: number,
  interviewDate?: string,
): Promise<void> {
  if (interviewDate) {
    await sql`
      UPDATE candidates 
      SET status = ${status}, 
          evaluation_summaries = ${JSON.stringify(evaluationSummaries || {})},
          confidence_score = ${confidenceScore || 0},
          interview_date = ${interviewDate},
          updated_at = CURRENT_TIMESTAMP
      WHERE candidate_id = ${candidateId}
    `
  } else {
    await sql`
      UPDATE candidates 
      SET status = ${status}, 
          evaluation_summaries = ${JSON.stringify(evaluationSummaries || {})},
          confidence_score = ${confidenceScore || 0},
          updated_at = CURRENT_TIMESTAMP
      WHERE candidate_id = ${candidateId}
    `
  }
}

export async function createJobDescription(
  title: string,
  description: string,
  criteria: string,
): Promise<JobDescription> {
  const result = await sql`
    INSERT INTO job_descriptions (job_title, description, criteria)
    VALUES (${title}, ${description}, ${criteria})
    RETURNING *
  `
  return result[0] as JobDescription
}

export async function deleteCandidate(candidateId: number): Promise<void> {
  await sql`
    DELETE FROM candidates 
    WHERE candidate_id = ${candidateId}
  `
}

export async function deleteJobDescription(jobId: number): Promise<void> {
  // First, update any candidates that reference this job
  await sql`
    UPDATE candidates 
    SET applied_job_id = NULL 
    WHERE applied_job_id = ${jobId}
  `

  // Then delete the job description
  await sql`
    DELETE FROM job_descriptions 
    WHERE job_id = ${jobId}
  `
}
