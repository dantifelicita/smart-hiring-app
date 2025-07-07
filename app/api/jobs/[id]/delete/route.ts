import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set")
}

const sql = neon(process.env.DATABASE_URL)

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const jobId = Number.parseInt(params.id)

    if (isNaN(jobId)) {
      return NextResponse.json({ error: "Invalid job ID" }, { status: 400 })
    }

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

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting job description:", error)
    return NextResponse.json(
      {
        error: "Failed to delete job description",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
