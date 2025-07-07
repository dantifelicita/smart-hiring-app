import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set")
}

const sql = neon(process.env.DATABASE_URL)

export async function GET() {
  try {
    const candidates = await sql`
      SELECT 
        c.candidate_id,
        c.name,
        c.applied_job_id,
        c.status,
        c.cv_file,
        c.interview_transcript,
        c.evaluation_summaries,
        c.confidence_score,
        c.created_at,
        c.updated_at,
        j.job_title
      FROM candidates c
      LEFT JOIN job_descriptions j ON c.applied_job_id = j.job_id
      ORDER BY c.created_at DESC
    `

    return NextResponse.json(candidates)
  } catch (error) {
    console.error("Error fetching candidates:", error)

    // If tables don't exist, return empty array instead of error
    if (error instanceof Error && error.message.includes('relation "candidates" does not exist')) {
      console.log("Tables don't exist yet, returning empty array")
      return NextResponse.json([])
    }

    return NextResponse.json(
      {
        error: "Failed to fetch candidates",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, jobId } = await request.json()

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }

    const result = await sql`
      INSERT INTO candidates (name, applied_job_id, status)
      VALUES (${name}, ${jobId || null}, 'CV Screening')
      RETURNING *
    `

    return NextResponse.json(result[0])
  } catch (error) {
    console.error("Error creating candidate:", error)
    return NextResponse.json(
      {
        error: "Failed to create candidate",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
