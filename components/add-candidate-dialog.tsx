"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { JobDescription } from "@/lib/db"

interface AddCandidateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCandidateAdded: () => void
}

export function AddCandidateDialog({ open, onOpenChange, onCandidateAdded }: AddCandidateDialogProps) {
  const [name, setName] = useState("")
  const [selectedJobId, setSelectedJobId] = useState("")
  const [jobs, setJobs] = useState<JobDescription[]>([])
  const [loading, setLoading] = useState(false)
  const [jobsLoading, setJobsLoading] = useState(false)

  useEffect(() => {
    if (open) {
      fetchJobs()
    }
  }, [open])

  const fetchJobs = async () => {
    setJobsLoading(true)
    try {
      const response = await fetch("/api/jobs")
      if (response.ok) {
        const data = await response.json()
        setJobs(Array.isArray(data) ? data : [])
      } else {
        console.error("Failed to fetch jobs")
        setJobs([])
      }
    } catch (error) {
      console.error("Error fetching jobs:", error)
      setJobs([])
    } finally {
      setJobsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setLoading(true)
    try {
      const response = await fetch("/api/candidates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          jobId: selectedJobId ? Number.parseInt(selectedJobId) : null,
        }),
      })

      if (response.ok) {
        setName("")
        setSelectedJobId("")
        onCandidateAdded()
      } else {
        const errorData = await response.json()
        console.error("Error creating candidate:", errorData)
        alert("Failed to create candidate. Please try again.")
      }
    } catch (error) {
      console.error("Error creating candidate:", error)
      alert("Failed to create candidate. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Candidate</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Candidate Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter candidate name"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="job">Job Position (Optional)</Label>
            <Select value={selectedJobId} onValueChange={setSelectedJobId} disabled={jobs.length === 0 || jobsLoading}>
              <SelectTrigger className={jobs.length === 0 ? "opacity-50" : ""}>
                <SelectValue
                  placeholder={
                    jobsLoading
                      ? "Loading jobs..."
                      : jobs.length === 0
                        ? "No job positions available"
                        : "Select a job position"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {jobs.map((job) => (
                  <SelectItem key={job.job_id} value={job.job_id.toString()}>
                    {job.job_title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {jobs.length === 0 && !jobsLoading && (
              <p className="text-xs text-muted-foreground">
                Upload job descriptions first to assign candidates to positions
              </p>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Adding..." : "Add Candidate"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
