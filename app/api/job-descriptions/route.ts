import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET() {
  try {
    const jobDescriptions = await sql`
      SELECT * FROM job_descriptions
      ORDER BY job_id DESC
    `

    return NextResponse.json(jobDescriptions)
  } catch (error) {
    console.error("Error fetching job descriptions:", error)
    return NextResponse.json({ error: "Failed to fetch job descriptions" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { job_title, description, criteria } = await request.json()

    if (!job_title || !description) {
      return NextResponse.json({ error: "Job title and description are required" }, { status: 400 })
    }

    const result = await sql`
      INSERT INTO job_descriptions (job_title, description, criteria)
      VALUES (${job_title}, ${description}, ${criteria || ""})
      RETURNING *
    `

    return NextResponse.json(result[0])
  } catch (error) {
    console.error("Error creating job description:", error)
    return NextResponse.json({ error: "Failed to create job description" }, { status: 500 })
  }
}
