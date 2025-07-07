import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set")
}

const sql = neon(process.env.DATABASE_URL)

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const candidateId = Number.parseInt(params.id)

    if (isNaN(candidateId)) {
      return NextResponse.json({ error: "Invalid candidate ID" }, { status: 400 })
    }

    await sql`
      DELETE FROM candidates 
      WHERE candidate_id = ${candidateId}
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting candidate:", error)
    return NextResponse.json(
      {
        error: "Failed to delete candidate",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
