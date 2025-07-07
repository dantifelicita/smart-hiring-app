"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, User, AlertCircle, Database } from "lucide-react"
import type { Candidate } from "@/lib/db"
import { AddCandidateDialog } from "./add-candidate-dialog"
import Image from "next/image"

interface CandidateSidebarProps {
  selectedCandidateId?: number
  onSelectCandidate: (candidate: Candidate) => void
}

export function CandidateSidebar({ selectedCandidateId, onSelectCandidate }: CandidateSidebarProps) {
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [needsSetup, setNeedsSetup] = useState(false)

  const fetchCandidates = async () => {
    setLoading(true)
    setError(null)
    setNeedsSetup(false)

    try {
      const response = await fetch("/api/candidates")

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }

      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text()
        throw new Error(`Expected JSON, got: ${text.substring(0, 100)}...`)
      }

      const data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      const candidateArray = Array.isArray(data) ? data : []
      setCandidates(candidateArray)

      // If we get an empty array, it might mean tables don't exist yet
      if (candidateArray.length === 0) {
        // Try to fetch jobs to see if database is set up
        try {
          const jobsResponse = await fetch("/api/jobs")
          const jobsData = await jobsResponse.json()
          if (Array.isArray(jobsData) && jobsData.length === 0) {
            setNeedsSetup(true)
          }
        } catch {
          setNeedsSetup(true)
        }
      }
    } catch (error) {
      console.error("Error fetching candidates:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to fetch candidates"

      // Check if it's a database connection or table issue
      if (errorMessage.includes("relation") && errorMessage.includes("does not exist")) {
        setNeedsSetup(true)
        setError("Database tables need to be initialized. Please run the setup script first.")
      } else if (errorMessage.includes("Failed to fetch") || errorMessage.includes("TypeError")) {
        setError("Database connection failed. Please check your DATABASE_URL environment variable.")
      } else {
        setError(errorMessage)
      }
      setCandidates([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCandidates()
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "CV Screening":
        return "bg-yellow-100 text-yellow-800"
      case "Interview":
        return "bg-blue-100 text-blue-800"
      case "Offer":
        return "bg-green-100 text-green-800"
      case "Hired":
        return "bg-purple-100 text-purple-800"
      case "Rejected":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const handleCandidateAdded = () => {
    fetchCandidates()
    setShowAddDialog(false)
  }

  if (loading) {
    return (
      <div className="w-80 border-r bg-muted/30 p-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Image src="/spicy-marker-logo.png" alt="Spicy Marker" width={24} height={24} />
            <h2 className="text-lg font-semibold">Candidates</h2>
          </div>
          <Button size="sm" disabled className="gap-2">
            <Plus className="h-4 w-4" />
            Add
          </Button>
        </div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 bg-muted rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (needsSetup) {
    return (
      <div className="w-80 border-r bg-muted/30 p-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Image src="/spicy-marker-logo.png" alt="Spicy Marker" width={24} height={24} />
            <h2 className="text-lg font-semibold">Candidates</h2>
          </div>
          <Button size="sm" disabled className="gap-2">
            <Plus className="h-4 w-4" />
            Add
          </Button>
        </div>
        <div className="text-center py-8">
          <Database className="h-12 w-12 mx-auto mb-4 text-blue-500" />
          <p className="text-blue-600 font-medium mb-2">Database Setup Required</p>
          <p className="text-sm text-muted-foreground mb-4">
            The database tables need to be initialized before you can use Spicy Marker.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-left">
            <p className="text-xs font-medium text-blue-800 mb-2">Setup Instructions:</p>
            <ol className="text-xs text-blue-700 space-y-1">
              <li>1. Go to your Neon database console</li>
              <li>
                2. Run the SQL script: <code className="bg-blue-100 px-1 rounded">05-initialize-database.sql</code>
              </li>
              <li>3. Refresh this page</li>
            </ol>
          </div>
          <Button variant="outline" size="sm" onClick={fetchCandidates} className="mt-4 bg-transparent">
            Check Again
          </Button>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="w-80 border-r bg-muted/30 p-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Image src="/spicy-marker-logo.png" alt="Spicy Marker" width={24} height={24} />
            <h2 className="text-lg font-semibold">Candidates</h2>
          </div>
          <Button size="sm" onClick={() => setShowAddDialog(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Add
          </Button>
        </div>
        <div className="text-center py-8">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
          <p className="text-red-600 font-medium">Error loading candidates</p>
          <p className="text-sm text-muted-foreground mt-1 mb-4">{error}</p>
          <Button variant="outline" size="sm" onClick={fetchCandidates} className="bg-transparent">
            Try Again
          </Button>
        </div>
        <AddCandidateDialog
          open={showAddDialog}
          onOpenChange={setShowAddDialog}
          onCandidateAdded={handleCandidateAdded}
        />
      </div>
    )
  }

  return (
    <div className="w-80 border-r bg-muted/30 p-4 overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Image src="/spicy-marker-logo.png" alt="Spicy Marker" width={24} height={24} />
          <h2 className="text-lg font-semibold">Candidates</h2>
        </div>
        <Button size="sm" onClick={() => setShowAddDialog(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add
        </Button>
      </div>

      <div className="space-y-3">
        {candidates.map((candidate) => (
          <Card
            key={candidate.candidate_id}
            className={`cursor-pointer transition-colors hover:bg-accent ${
              selectedCandidateId === candidate.candidate_id ? "ring-2 ring-primary" : ""
            }`}
            onClick={() => onSelectCandidate(candidate)}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-primary/10 rounded-full">
                  <User className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium truncate">{candidate.name}</h3>
                  <p className="text-sm text-muted-foreground truncate">{candidate.job_title || "No job assigned"}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <Badge variant="secondary" className={`text-xs ${getStatusColor(candidate.status)}`}>
                      {candidate.status}
                    </Badge>
                    {candidate.confidence_score > 0 && (
                      <span className="text-xs text-muted-foreground">{candidate.confidence_score}/100</span>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {candidates.length === 0 && !loading && !error && !needsSetup && (
        <div className="text-center py-8 text-muted-foreground">
          <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No candidates yet</p>
          <p className="text-sm">Add your first candidate to get started</p>
        </div>
      )}

      <AddCandidateDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onCandidateAdded={handleCandidateAdded}
      />
    </div>
  )
}
