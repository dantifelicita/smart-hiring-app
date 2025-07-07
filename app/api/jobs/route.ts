import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set")
}

const sql = neon(process.env.DATABASE_URL)

export async function GET() {
  try {
    const jobs = await sql`
      SELECT * FROM job_descriptions 
      ORDER BY created_at DESC
    `

    return NextResponse.json(jobs)
  } catch (error) {
    console.error("Error fetching job descriptions:", error)

    // If tables don't exist, return empty array instead of error
    if (error instanceof Error && error.message.includes('relation "job_descriptions" does not exist')) {
      console.log("Job descriptions table doesn't exist yet, returning empty array")
      return NextResponse.json([])
    }

    return NextResponse.json(
      {
        error: "Failed to fetch job descriptions",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { title, description, criteria } = await request.json()

    if (!title || !description) {
      return NextResponse.json({ error: "Title and description are required" }, { status: 400 })
    }

    const result = await sql`
      INSERT INTO job_descriptions (job_title, description, criteria)
      VALUES (${title}, ${description}, ${criteria || ""})
      RETURNING *
    `

    return NextResponse.json(result[0])
  } catch (error) {
    console.error("Error creating job description:", error)
    return NextResponse.json(
      {
        error: "Failed to create job description",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
