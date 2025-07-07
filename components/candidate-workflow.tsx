"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  FileText,
  Upload,
  CheckCircle,
  Clock,
  User,
  Briefcase,
  Plus,
  AlertCircle,
  Trash2,
  XCircle,
  Loader2,
  Award,
  Calendar,
} from "lucide-react"
import type { Candidate, JobDescription } from "@/lib/db"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface CandidateWorkflowProps {
  candidate: Candidate
  onCandidateUpdate: () => void
  onCandidateDeleted?: () => void
}

export function CandidateWorkflow({ candidate, onCandidateUpdate, onCandidateDeleted }: CandidateWorkflowProps) {
  const [jobs, setJobs] = useState<JobDescription[]>([])
  const [selectedJobId, setSelectedJobId] = useState<string>("")
  const [customCriteria, setCustomCriteria] = useState("")
  const [cvFile, setCvFile] = useState<File | null>(null)
  const [interviewFile, setInterviewFile] = useState<File | null>(null)
  const [jobDescriptionFile, setJobDescriptionFile] = useState<File | null>(null)
  const [interviewQuestionsFile, setInterviewQuestionsFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [evaluatingCV, setEvaluatingCV] = useState(false)
  const [evaluatingInterview, setEvaluatingInterview] = useState(false)
  const [uploadingJob, setUploadingJob] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [processingStep, setProcessingStep] = useState<string>("")

  useEffect(() => {
    fetchJobs()
  }, [])

  const fetchJobs = async () => {
    try {
      const response = await fetch("/api/jobs")
      if (response.ok) {
        const data = await response.json()
        setJobs(Array.isArray(data) ? data : [])
        if (candidate.applied_job_id) {
          setSelectedJobId(candidate.applied_job_id.toString())
        }
      }
    } catch (error) {
      console.error("Error fetching jobs:", error)
      setJobs([])
    }
  }

  const handleJobDescriptionUpload = async () => {
    if (!jobDescriptionFile) return

    setUploadingJob(true)
    setError(null)
    setProcessingStep("Reading job description file...")

    try {
      // Use FileReader for more reliable file reading
      const text = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = (e) => {
          const result = e.target?.result
          if (typeof result === "string") {
            resolve(result)
          } else {
            reject(new Error("Failed to read file as text"))
          }
        }
        reader.onerror = () => reject(new Error("File reading failed"))
        reader.readAsText(jobDescriptionFile)
      })

      const jobTitle = jobDescriptionFile.name.replace(/\.(txt|pdf|doc|docx)$/i, "")

      setProcessingStep("Uploading to database...")
      const response = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: jobTitle,
          description: text,
          criteria: "",
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }

      const newJob = await response.json()
      if (newJob.error) {
        throw new Error(newJob.error)
      }

      setProcessingStep("Updating candidate job assignment...")
      // Automatically assign the new job to the current candidate
      const updateResponse = await fetch(`/api/candidates/${candidate.candidate_id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applied_job_id: newJob.job_id,
        }),
      })

      if (!updateResponse.ok) {
        console.warn("Failed to auto-assign job to candidate, but job was created successfully")
      }

      setProcessingStep("Refreshing job list...")
      // Refresh jobs list and select the newly uploaded job
      await fetchJobs()
      setSelectedJobId(newJob.job_id.toString())
      setJobDescriptionFile(null)

      // Reset file input
      const fileInput = document.getElementById("job-description-file") as HTMLInputElement
      if (fileInput) fileInput.value = ""

      // Trigger candidate update to refresh sidebar
      onCandidateUpdate()

      alert("Job description uploaded and assigned successfully!")
    } catch (error) {
      console.error("Error uploading job description:", error)
      setError(`Failed to upload job description: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setUploadingJob(false)
      setProcessingStep("")
    }
  }

  const handleCvUpload = async () => {
    if (!cvFile || !selectedJobId) return

    setEvaluatingCV(true)
    setError(null)
    setProcessingStep("Reading CV file...")

    try {
      const selectedJob = jobs.find((j) => j.job_id.toString() === selectedJobId)
      if (!selectedJob) {
        throw new Error("Selected job not found")
      }

      // Use FileReader for more reliable file reading
      const cvContent = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = (e) => {
          const result = e.target?.result
          if (typeof result === "string") {
            resolve(result)
          } else {
            reject(new Error("Failed to read file as text"))
          }
        }
        reader.onerror = () => reject(new Error("File reading failed"))
        reader.readAsText(cvFile)
      })

      const criteria = customCriteria || selectedJob.criteria

      setProcessingStep("Analyzing CV with AI...")
      console.log("Sending CV evaluation request...")
      const response = await fetch("/api/evaluate-cv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cvContent,
          jobDescription: selectedJob.description,
          criteria,
        }),
      })

      console.log("Response status:", response.status)
      const responseData = await response.json()
      console.log("Response data:", responseData)

      if (!response.ok) {
        throw new Error(responseData.details || responseData.error || `HTTP error! status: ${response.status}`)
      }

      const { summary } = responseData

      setProcessingStep("Updating candidate record...")
      // Update candidate with CV evaluation - preserve existing interview summary
      const updateResponse = await fetch(`/api/candidates/${candidate.candidate_id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          evaluationSummaries: {
            ...candidate.evaluation_summaries, // Preserve existing summaries
            cv_summary: summary,
          },
        }),
      })

      if (!updateResponse.ok) {
        const errorData = await updateResponse.json()
        throw new Error(errorData.error || "Failed to update candidate")
      }

      onCandidateUpdate()
      alert("CV evaluation completed successfully!")
    } catch (error) {
      console.error("Error evaluating CV:", error)
      setError(`Failed to evaluate CV: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setEvaluatingCV(false)
      setProcessingStep("")
    }
  }

  const handleInterviewUpload = async () => {
    if (!interviewFile || !selectedJobId) return

    setEvaluatingInterview(true)
    setError(null)
    setProcessingStep("Reading interview transcript...")

    try {
      const selectedJob = jobs.find((j) => j.job_id.toString() === selectedJobId)
      if (!selectedJob) {
        throw new Error("Selected job not found")
      }

      console.log("Reading interview transcript file...")
      // Use FileReader for more reliable file reading
      const transcript = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = (e) => {
          const result = e.target?.result
          if (typeof result === "string") {
            resolve(result)
          } else {
            reject(new Error("Failed to read transcript file as text"))
          }
        }
        reader.onerror = () => reject(new Error("Transcript file reading failed"))
        reader.readAsText(interviewFile)
      })

      console.log("Transcript read successfully, length:", transcript.length)

      // Read interview questions from file if provided
      let questions = ""
      if (interviewQuestionsFile) {
        setProcessingStep("Reading interview questions...")
        console.log("Reading interview questions file...")

        try {
          questions = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = (e) => {
              const result = e.target?.result
              if (typeof result === "string") {
                resolve(result)
              } else {
                reject(new Error("Failed to read questions file as text"))
              }
            }
            reader.onerror = () => reject(new Error("Questions file reading failed"))
            reader.readAsText(interviewQuestionsFile)
          })
          console.log("Questions read successfully, length:", questions.length)
        } catch (questionsError) {
          console.warn("Failed to read questions file:", questionsError)
          // Continue without questions if file reading fails
          questions = ""
        }
      }

      setProcessingStep("Analyzing interview with AI...")
      console.log("Sending interview evaluation request...")

      const requestBody = {
        transcript,
        questions,
        jobDescription: selectedJob.description,
        criteria: customCriteria || selectedJob.criteria,
      }

      console.log("Request body prepared:", {
        transcriptLength: transcript.length,
        questionsLength: questions.length,
        hasJobDescription: !!selectedJob.description,
        hasCriteria: !!(customCriteria || selectedJob.criteria),
      })

      const response = await fetch("/api/evaluate-interview", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      })

      console.log("Response status:", response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error("Response error text:", errorText)

        let errorData
        try {
          errorData = JSON.parse(errorText)
        } catch {
          errorData = { error: errorText }
        }

        throw new Error(errorData.details || errorData.error || `HTTP error! status: ${response.status}`)
      }

      const responseData = await response.json()
      console.log("Response data received:", {
        hasSummary: !!responseData.summary,
        confidenceScore: responseData.confidenceScore,
        interviewDate: responseData.interviewDate,
      })

      const { summary, confidenceScore, interviewDate } = responseData

      if (!summary) {
        throw new Error("No evaluation summary received from API")
      }

      setProcessingStep("Updating candidate record...")
      // Update candidate with interview evaluation - preserve existing CV summary
      const updateResponse = await fetch(`/api/candidates/${candidate.candidate_id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          evaluationSummaries: {
            ...candidate.evaluation_summaries, // Preserve existing summaries
            interview_summary: summary,
          },
          confidenceScore: confidenceScore || 75,
        }),
      })

      if (!updateResponse.ok) {
        const errorData = await updateResponse.json()
        throw new Error(errorData.error || "Failed to update candidate")
      }

      console.log("Interview evaluation completed successfully")
      onCandidateUpdate()
      alert("Interview evaluation completed successfully!")
    } catch (error) {
      console.error("Error evaluating interview:", error)
      setError(`Failed to evaluate interview: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setEvaluatingInterview(false)
      setProcessingStep("")
    }
  }

  const proceedToNextStage = async (nextStatus: string) => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/candidates/${candidate.candidate_id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: nextStatus,
          evaluationSummaries: candidate.evaluation_summaries, // Preserve existing summaries
          confidenceScore: candidate.confidence_score, // Preserve existing score
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to update candidate status")
      }

      onCandidateUpdate()
    } catch (error) {
      console.error("Error updating candidate status:", error)
      setError(`Failed to update status: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setLoading(false)
    }
  }

  const handleJobSelection = async (jobId: string) => {
    setSelectedJobId(jobId)

    // Update candidate's job assignment in the database
    if (jobId && candidate.candidate_id) {
      try {
        const response = await fetch(`/api/candidates/${candidate.candidate_id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            applied_job_id: Number.parseInt(jobId),
          }),
        })

        if (response.ok) {
          onCandidateUpdate() // This will refresh the sidebar
        } else {
          const errorData = await response.json()
          console.error("Error updating candidate job assignment:", errorData)
          setError(`Failed to update job assignment: ${errorData.error || "Unknown error"}`)
        }
      } catch (error) {
        console.error("Error updating candidate job assignment:", error)
        setError(`Failed to update job assignment: ${error instanceof Error ? error.message : "Unknown error"}`)
      }
    }
  }

  const handleDeleteCandidate = async () => {
    setDeleting(true)
    setError(null)
    try {
      const response = await fetch(`/api/candidates/${candidate.candidate_id}/delete`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to delete candidate")
      }

      onCandidateDeleted?.()
    } catch (error) {
      console.error("Error deleting candidate:", error)
      setError(`Failed to delete candidate: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setDeleting(false)
    }
  }

  const handleDeleteJob = async (jobId: number) => {
    try {
      const response = await fetch(`/api/jobs/${jobId}/delete`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to delete job description")
      }

      // Refresh jobs list
      await fetchJobs()
      // Clear selection if the deleted job was selected
      if (selectedJobId === jobId.toString()) {
        setSelectedJobId("")
      }

      alert("Job description deleted successfully!")
    } catch (error) {
      console.error("Error deleting job description:", error)
      setError(`Failed to delete job description: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "CV Screening":
        return <FileText className="h-5 w-5" />
      case "Interview":
        return <User className="h-5 w-5" />
      case "Offer":
        return <CheckCircle className="h-5 w-5" />
      case "Hired":
        return <Award className="h-5 w-5" />
      case "Rejected":
        return <XCircle className="h-5 w-5" />
      default:
        return <Clock className="h-5 w-5" />
    }
  }

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

  // Extract interview date from summary if available
  const getInterviewDateFromSummary = (summary: string) => {
    const dateMatch = summary.match(/INTERVIEW DATE\s*\n([^\n]+)/i)
    return dateMatch ? dateMatch[1].trim() : null
  }

  const interviewDateFromSummary = candidate.evaluation_summaries?.interview_summary
    ? getInterviewDateFromSummary(candidate.evaluation_summaries.interview_summary)
    : null

  return (
    <div className="flex-1 p-6 space-y-6">
      {/* Processing Status */}
      {(evaluatingCV || evaluatingInterview || uploadingJob) && processingStep && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-blue-800">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="font-medium">Processing...</span>
            </div>
            <p className="text-blue-700 text-sm mt-1">{processingStep}</p>
          </CardContent>
        </Card>
      )}

      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-red-800">
              <AlertCircle className="h-4 w-4" />
              <span className="font-medium">Error</span>
            </div>
            <p className="text-red-700 text-sm mt-1">{error}</p>
            <Button variant="outline" size="sm" onClick={() => setError(null)} className="mt-2">
              Dismiss
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Candidate Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-full">
                <User className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-2xl">{candidate.name}</CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{candidate.job_title || "No job assigned"}</span>
                </div>
                {(candidate.interview_date || interviewDateFromSummary) && (
                  <div className="flex items-center gap-2 mt-1">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground text-sm">
                      Interview: {candidate.interview_date || interviewDateFromSummary}
                    </span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={`gap-2 ${getStatusColor(candidate.status)}`}>
                {getStatusIcon(candidate.status)}
                {candidate.status}
              </Badge>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2 text-red-600 hover:text-red-700 bg-transparent">
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Candidate</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete {candidate.name}? This action cannot be undone and will
                      permanently remove all evaluation data.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteCandidate}
                      disabled={deleting}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      {deleting ? "Deleting..." : "Delete"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Stage 1: CV Screening */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Stage 1: CV Screening
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Job Description Section */}
          <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
            <h4 className="font-medium flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              Job Description
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Select Existing Job Description</Label>
                <div className="flex gap-2">
                  <Select value={selectedJobId} onValueChange={handleJobSelection} disabled={jobs.length === 0}>
                    <SelectTrigger className={jobs.length === 0 ? "opacity-50 flex-1" : "flex-1"}>
                      <SelectValue
                        placeholder={
                          jobs.length === 0 ? "No job descriptions available" : "Choose from saved job descriptions"
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
                  {selectedJobId && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 bg-transparent">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Job Description</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this job description? This will remove it from all
                            candidates and cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteJob(Number.parseInt(selectedJobId))}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
                {jobs.length === 0 && (
                  <p className="text-xs text-muted-foreground">Upload a job description file to enable this option</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Or Upload New Job Description</Label>
                <div className="flex gap-2">
                  <Input
                    id="job-description-file"
                    type="file"
                    accept=".txt,.pdf,.doc,.docx"
                    onChange={(e) => setJobDescriptionFile(e.target.files?.[0] || null)}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    onClick={handleJobDescriptionUpload}
                    disabled={!jobDescriptionFile || uploadingJob}
                    size="sm"
                    className="gap-1"
                  >
                    {uploadingJob ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
                    {uploadingJob ? "Uploading..." : "Upload"}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">Accepts: .txt, .pdf, .doc, .docx files</p>
              </div>
            </div>

            {selectedJobId && jobs.find((j) => j.job_id.toString() === selectedJobId) && (
              <div className="mt-4 p-3 bg-background rounded border">
                <h5 className="font-medium mb-2">Selected Job Description:</h5>
                <p className="text-sm font-medium text-primary">
                  {jobs.find((j) => j.job_id.toString() === selectedJobId)?.job_title}
                </p>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-3">
                  {jobs.find((j) => j.job_id.toString() === selectedJobId)?.description}
                </p>
              </div>
            )}
          </div>

          {/* CV Upload Section */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Upload CV</Label>
                <Input
                  type="file"
                  accept=".pdf,.txt,.doc,.docx"
                  onChange={(e) => setCvFile(e.target.files?.[0] || null)}
                />
                <p className="text-xs text-muted-foreground">Accepts: .pdf, .txt, .doc, .docx files</p>
              </div>
              <div className="space-y-2">
                <Label>Custom Evaluation Criteria (Optional)</Label>
                <Textarea
                  value={customCriteria}
                  onChange={(e) => setCustomCriteria(e.target.value)}
                  placeholder="Override default criteria or add specific requirements..."
                  rows={3}
                />
              </div>
            </div>

            <Button onClick={handleCvUpload} disabled={!cvFile || !selectedJobId || evaluatingCV} className="gap-2">
              {evaluatingCV ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {evaluatingCV ? "Evaluating CV..." : "Upload & Evaluate CV"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* CV Evaluation Summary - Always show if available */}
      {candidate.evaluation_summaries?.cv_summary && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">CV Evaluation Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm whitespace-pre-wrap prose prose-sm max-w-none">
              {candidate.evaluation_summaries.cv_summary}
            </div>
            {candidate.status === "CV Screening" && (
              <div className="mt-4 flex gap-2">
                <Button onClick={() => proceedToNextStage("Interview")} disabled={loading}>
                  Proceed to Interview
                </Button>
                <Button
                  variant="outline"
                  onClick={() => proceedToNextStage("Rejected")}
                  disabled={loading}
                  className="text-red-600 hover:text-red-700"
                >
                  Reject
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Stage 2: Interview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Stage 2: Interview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {(candidate.status === "Interview" || candidate.status === "Offer" || candidate.status === "Hired") && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Upload Interview Transcript</Label>
                  <Input
                    type="file"
                    accept=".txt,.pdf,.doc,.docx"
                    onChange={(e) => setInterviewFile(e.target.files?.[0] || null)}
                  />
                  <p className="text-xs text-muted-foreground">Accepts: .txt, .pdf, .doc, .docx files</p>
                </div>
                <div className="space-y-2">
                  <Label>Upload Interview Questions (Optional)</Label>
                  <Input
                    type="file"
                    accept=".txt,.pdf,.doc,.docx"
                    onChange={(e) => setInterviewQuestionsFile(e.target.files?.[0] || null)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Upload file with specific interview questions for detailed analysis
                  </p>
                </div>
              </div>

              <Button
                onClick={handleInterviewUpload}
                disabled={!interviewFile || evaluatingInterview}
                className="gap-2"
              >
                {evaluatingInterview ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                {evaluatingInterview ? "Analyzing Interview..." : "Upload & Analyze Interview"}
              </Button>
            </>
          )}

          {/* Show placeholder if no interview evaluation yet */}
          {!candidate.evaluation_summaries?.interview_summary && candidate.status === "CV Screening" && (
            <div className="mt-4 p-4 bg-muted/50 rounded-lg border-2 border-dashed">
              <p className="text-muted-foreground text-center">
                Interview evaluation will appear here after CV screening is completed and candidate proceeds to
                interview stage.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Interview Evaluation Summary - Always show if available */}
      {candidate.evaluation_summaries?.interview_summary && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Interview Evaluation</CardTitle>
              <Badge variant="outline" className="gap-1">
                <CheckCircle className="h-3 w-3" />
                Score: {candidate.confidence_score}/100
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-sm whitespace-pre-wrap prose prose-sm max-w-none">
              {candidate.evaluation_summaries.interview_summary}
            </div>
            {candidate.status === "Interview" && (
              <div className="flex gap-2 mt-4">
                <Button onClick={() => proceedToNextStage("Offer")} disabled={loading}>
                  Proceed to Offer
                </Button>
                <Button
                  variant="outline"
                  onClick={() => proceedToNextStage("Rejected")}
                  disabled={loading}
                  className="text-red-600 hover:text-red-700"
                >
                  Reject
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Stage 3: Offer & Hired */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Stage 3: Offer & Hiring
          </CardTitle>
        </CardHeader>
        <CardContent>
          {candidate.status === "Offer" ? (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <h4 className="font-medium text-green-800">Ready for Offer</h4>
              </div>
              <p className="text-green-700 mb-4">
                {candidate.name} has successfully completed the evaluation process and is ready to receive an offer.
              </p>
              <div className="flex gap-2">
                <Button
                  onClick={() => proceedToNextStage("Hired")}
                  disabled={loading}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Mark as Hired
                </Button>
                <Button variant="outline">Generate Offer Letter</Button>
                <Button
                  variant="outline"
                  onClick={() => proceedToNextStage("Rejected")}
                  disabled={loading}
                  className="text-red-600 hover:text-red-700"
                >
                  Reject Offer
                </Button>
              </div>
            </div>
          ) : candidate.status === "Hired" ? (
            <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Award className="h-5 w-5 text-purple-600" />
                <h4 className="font-medium text-purple-800">Successfully Hired!</h4>
              </div>
              <p className="text-purple-700 mb-4">
                🎉 Congratulations! {candidate.name} has accepted the offer and is now part of the team.
              </p>
              <div className="flex gap-2">
                <Button className="bg-purple-600 hover:bg-purple-700">Send Welcome Package</Button>
                <Button variant="outline">Schedule Onboarding</Button>
              </div>
            </div>
          ) : candidate.status === "Rejected" ? (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <XCircle className="h-5 w-5 text-red-600" />
                <h4 className="font-medium text-red-800">Candidate Rejected</h4>
              </div>
              <p className="text-red-700 mb-4">
                {candidate.name} was not selected to proceed further in the hiring process.
              </p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => proceedToNextStage("CV Screening")} disabled={loading}>
                  Reconsider for CV Screening
                </Button>
                <Button variant="outline" onClick={() => proceedToNextStage("Interview")} disabled={loading}>
                  Reconsider for Interview
                </Button>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-muted/50 rounded-lg border-2 border-dashed">
              <p className="text-muted-foreground text-center">
                Offer stage will be available after the candidate successfully completes the interview evaluation.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
