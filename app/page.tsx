"use client"

import { useState } from "react"
import { CandidateSidebar } from "@/components/candidate-sidebar"
import { CandidateWorkflow } from "@/components/candidate-workflow"
import { Card, CardContent } from "@/components/ui/card"
import { Briefcase } from "lucide-react"
import type { Candidate } from "@/lib/db"
import Image from "next/image"

export default function HomePage() {
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const handleSelectCandidate = (candidate: Candidate) => {
    setSelectedCandidate(candidate)
  }

  const handleCandidateUpdate = () => {
    setRefreshKey((prev) => prev + 1)
    // Refresh the selected candidate data
    if (selectedCandidate) {
      fetch(`/api/candidates/${selectedCandidate.candidate_id}`)
        .then((res) => res.json())
        .then((data) => setSelectedCandidate(data))
        .catch(console.error)
    }
  }

  const handleCandidateDeleted = () => {
    setSelectedCandidate(null)
    setRefreshKey((prev) => prev + 1)
  }

  return (
    <div className="flex h-screen bg-background">
      <CandidateSidebar
        key={refreshKey}
        selectedCandidateId={selectedCandidate?.candidate_id}
        onSelectCandidate={handleSelectCandidate}
      />

      <div className="flex-1 overflow-auto">
        {selectedCandidate ? (
          <CandidateWorkflow
            candidate={selectedCandidate}
            onCandidateUpdate={handleCandidateUpdate}
            onCandidateDeleted={handleCandidateDeleted}
          />
        ) : (
          <div className="flex items-center justify-center h-full p-8">
            <Card className="w-full max-w-md">
              <CardContent className="flex flex-col items-center text-center p-8">
                <div className="mb-6">
                  <Image src="/spicy-marker-logo.png" alt="Spicy Marker" width={120} height={120} className="mx-auto" />
                </div>
                <h2 className="text-xl font-semibold mb-2">Spicy Marker</h2>
                <p className="text-muted-foreground mb-4">
                  Select a candidate from the sidebar to begin the evaluation workflow, or add a new candidate to get
                  started.
                </p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Briefcase className="h-4 w-4" />
                  <span>CV Screening → Interview → Offer</span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
