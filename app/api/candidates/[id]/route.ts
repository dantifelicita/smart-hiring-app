import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set")
}

const sql = neon(process.env.DATABASE_URL)

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const candidateId = Number.parseInt(params.id)

    if (isNaN(candidateId)) {
      return NextResponse.json({ error: "Invalid candidate ID" }, { status: 400 })
    }

    const result = await sql`
      SELECT 
        c.*,
        j.job_title,
        j.description as job_description,
        j.criteria as job_criteria
      FROM candidates c
      LEFT JOIN job_descriptions j ON c.applied_job_id = j.job_id
      WHERE c.candidate_id = ${candidateId}
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Candidate not found" }, { status: 404 })
    }

    return NextResponse.json(result[0])
  } catch (error) {
    console.error("Error fetching candidate:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch candidate",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const candidateId = Number.parseInt(params.id)

    if (isNaN(candidateId)) {
      return NextResponse.json({ error: "Invalid candidate ID" }, { status: 400 })
    }

    const { status, evaluationSummaries, confidenceScore, applied_job_id, interviewDate } = await request.json()

    // Handle different update scenarios with separate queries
    if (applied_job_id !== undefined) {
      // Update job assignment
      await sql`
        UPDATE candidates 
        SET 
          applied_job_id = ${applied_job_id},
          updated_at = CURRENT_TIMESTAMP
        WHERE candidate_id = ${candidateId}
      `
    } else if (
      status !== undefined &&
      evaluationSummaries !== undefined &&
      confidenceScore !== undefined &&
      interviewDate !== undefined
    ) {
      // Update status, summaries, confidence score, and interview date
      await sql`
        UPDATE candidates 
        SET 
          status = ${status},
          evaluation_summaries = ${JSON.stringify(evaluationSummaries)},
          confidence_score = ${confidenceScore},
          interview_date = ${interviewDate},
          updated_at = CURRENT_TIMESTAMP
        WHERE candidate_id = ${candidateId}
      `
    } else if (status !== undefined && evaluationSummaries !== undefined && confidenceScore !== undefined) {
      // Update status, summaries, and confidence score
      await sql`
        UPDATE candidates 
        SET 
          status = ${status},
          evaluation_summaries = ${JSON.stringify(evaluationSummaries)},
          confidence_score = ${confidenceScore},
          updated_at = CURRENT_TIMESTAMP
        WHERE candidate_id = ${candidateId}
      `
    } else if (evaluationSummaries !== undefined && confidenceScore !== undefined && interviewDate !== undefined) {
      // Update summaries, confidence score, and interview date
      await sql`
        UPDATE candidates 
        SET 
          evaluation_summaries = ${JSON.stringify(evaluationSummaries)},
          confidence_score = ${confidenceScore},
          interview_date = ${interviewDate},
          updated_at = CURRENT_TIMESTAMP
        WHERE candidate_id = ${candidateId}
      `
    } else if (status !== undefined && evaluationSummaries !== undefined) {
      // Update status and summaries
      await sql`
        UPDATE candidates 
        SET 
          status = ${status},
          evaluation_summaries = ${JSON.stringify(evaluationSummaries)},
          updated_at = CURRENT_TIMESTAMP
        WHERE candidate_id = ${candidateId}
      `
    } else if (status !== undefined) {
      // Update only status
      await sql`
        UPDATE candidates 
        SET 
          status = ${status},
          updated_at = CURRENT_TIMESTAMP
        WHERE candidate_id = ${candidateId}
      `
    } else if (evaluationSummaries !== undefined && confidenceScore !== undefined) {
      // Update summaries and confidence score
      await sql`
        UPDATE candidates 
        SET 
          evaluation_summaries = ${JSON.stringify(evaluationSummaries)},
          confidence_score = ${confidenceScore},
          updated_at = CURRENT_TIMESTAMP
        WHERE candidate_id = ${candidateId}
      `
    } else if (evaluationSummaries !== undefined) {
      // Update only summaries
      await sql`
        UPDATE candidates 
        SET 
          evaluation_summaries = ${JSON.stringify(evaluationSummaries)},
          updated_at = CURRENT_TIMESTAMP
        WHERE candidate_id = ${candidateId}
      `
    } else {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating candidate:", error)
    return NextResponse.json(
      {
        error: "Failed to update candidate",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
