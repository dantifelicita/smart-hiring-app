import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { createOpenAI } from "@ai-sdk/openai"

const OPENAI_API_KEY =
  "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"

export async function POST(request: NextRequest) {
  try {
    console.log("Starting interview evaluation...")

    const body = await request.json()
    console.log("Request body received:", {
      hasTranscript: !!body.transcript,
      hasQuestions: !!body.questions,
      hasJobDescription: !!body.jobDescription,
      hasCriteria: !!body.criteria,
    })

    const { transcript, questions, jobDescription, criteria } = body

    if (!transcript || !jobDescription) {
      console.log("Missing required fields")
      return NextResponse.json({ error: "Interview transcript and job description are required" }, { status: 400 })
    }

    // Create OpenAI client with API key
    const openai = createOpenAI({
      apiKey: OPENAI_API_KEY,
    })

    console.log("Extracting interview date...")

    // First, extract interview date from transcript
    const dateExtractionResult = await generateText({
      model: openai("gpt-4o"),
      prompt: `
        Analyze the following interview transcript and extract the interview date if mentioned:

        Interview Transcript: ${transcript.substring(0, 1000)}...

        Look for any mentions of dates, times, or scheduling information that indicates when this interview took place.
        Common formats include:
        - "Today is March 15, 2024"
        - "This interview is being conducted on..."
        - Date stamps or headers
        - "Good morning, it's Tuesday, January 10th"
        - Any other date references

        If you find a date, respond with just the date in a clear format (e.g., "March 15, 2024" or "January 10, 2024").
        If no date is found, respond with "NO_DATE_FOUND".
        
        Do not include any other text or explanation, just the date or "NO_DATE_FOUND".
      `,
    })

    const interviewDate = dateExtractionResult.text.trim()
    const hasInterviewDate = interviewDate !== "NO_DATE_FOUND" && interviewDate.length > 0

    console.log("Interview date extracted:", interviewDate)

    const interviewQuestionsSection =
      questions && questions.trim()
        ? `
Interview Questions from Uploaded File:
${questions}

QUESTION-BY-QUESTION ANALYSIS
You must analyze the candidate's responses to the EXACT questions provided in the uploaded interview questions file above. Do not generate or assume questions. Only analyze responses to the questions that were actually provided in the uploaded file.

For each question found in the uploaded questions file, provide:
1. The exact question as stated in the uploaded file
2. How the candidate responded to that specific question (based on the transcript)
3. Assessment of their response quality and relevance
4. Specific strengths demonstrated in their answer
5. Areas where their response could be improved

If a question from the uploaded file was not addressed in the transcript, note that it was not covered.
`
        : `
Interview Questions/Focus Areas: No specific questions file was uploaded

GENERAL INTERVIEW ANALYSIS
Since no specific questions file was uploaded, analyze the overall interview performance based on the themes and topics discussed in the transcript.
`

    console.log("Generating interview evaluation...")

    const evaluationPrompt = `
Analyze the following interview transcript against the job requirements:

Job Description: ${jobDescription}

Evaluation Criteria: ${criteria || "General job requirements"}

${interviewQuestionsSection}

Interview Transcript: ${transcript}

Please provide a comprehensive interview evaluation in the following format (use plain text formatting, no markdown or special characters):

${hasInterviewDate ? `INTERVIEW DATE\n${interviewDate}\n\n` : ""}INTERVIEW SUMMARY
[Brief overview of the interview performance]

${questions && questions.trim() ? "QUESTION-BY-QUESTION ANALYSIS" : "GENERAL INTERVIEW ANALYSIS"}
${
  questions && questions.trim()
    ? `[CRITICAL: You must analyze responses to the EXACT questions provided in the uploaded interview questions file. Do not make up or assume questions. For each question in the uploaded file, provide:

Question: [Copy the exact question from the uploaded file]
Candidate Response Summary: [Summarize how the candidate actually responded to this specific question based on the transcript]
Assessment: [Evaluate the quality, completeness, and relevance of their actual response]
Strengths: [Specific positive aspects of their actual answer to this question]
Areas for Improvement: [Any gaps or concerns in their actual response to this question]

If a question from the uploaded file was not clearly addressed in the transcript, state: "This question was not clearly addressed in the interview transcript."

Repeat this format for each question found in the uploaded interview questions file.]`
    : "[Analyze the overall interview performance based on the available transcript, focusing on key themes and responses that emerged during the conversation.]"
}

TECHNICAL COMPETENCY
[Assessment of technical skills and knowledge demonstrated during the interview]

COMMUNICATION & SOFT SKILLS
[Evaluation of communication abilities, interpersonal skills, and how they articulated their thoughts]

CULTURAL FIT
[Assessment of how well the candidate fits the company culture based on their responses and demeanor]

STRENGTHS
[Key positive points from the interview, with specific examples from the transcript]

AREAS OF CONCERN
[Any red flags, concerns, or weak responses identified during the interview]

OVERALL ASSESSMENT SCORE
Based on the comprehensive evaluation above, I assign this candidate a score of [X]/100.

Score Breakdown (out of 100 total):
- Technical Competency: [X]/35
- Communication Skills: [X]/35  
- Cultural Fit: [X]/30

Score Explanation:
[Detailed explanation of how the score was calculated, referencing specific examples from the interview that contributed to each component of the score. ${questions && questions.trim() ? "Include how their responses to the specific uploaded questions influenced the scoring." : ""} Make sure the individual scores add up to the total score given.]

RECOMMENDATION
[Final recommendation: Hire, Maybe, or No Hire with detailed reasoning based on the interview performance${questions && questions.trim() ? " and responses to the specific uploaded questions" : ""}]

Important guidelines:
- Use gender-neutral pronouns (they/them) when referring to the candidate
- Do not use any markdown formatting, asterisks, bold, or italic text
- Use plain text with clear section headers
- Provide specific examples from the interview transcript
- ${questions && questions.trim() ? "CRITICAL: Only analyze responses to questions that were actually provided in the uploaded interview questions file. Do not generate, assume, or make up questions." : "Focus on overall interview themes and responses"}
- Be objective and professional in your assessment
- Reference specific quotes or responses from the transcript when possible
- CRITICAL: Make sure the three component scores (Technical Competency + Communication Skills + Cultural Fit) add up exactly to the total score given
- Use the scoring breakdown: Technical (35 points), Communication (35 points), Cultural Fit (30 points) = 100 total
`

    const { text } = await generateText({
      model: openai("gpt-4o"),
      prompt: evaluationPrompt,
    })

    console.log("Interview evaluation generated successfully")

    // Extract confidence score more reliably with multiple patterns
    const scorePatterns = [
      /(?:OVERALL ASSESSMENT SCORE|Overall Assessment Score).*?(\d+)\/100/i,
      /(?:assign.*?score.*?of|score.*?of).*?(\d+)\/100/i,
      /(?:confidence|score).*?(\d+)\/100/i,
      /(?:confidence|score).*?(\d+)%/i,
      /(\d+)\/100/i,
    ]

    let confidenceScore = 75 // default
    for (const pattern of scorePatterns) {
      const match = text.match(pattern)
      if (match) {
        confidenceScore = Number.parseInt(match[1])
        break
      }
    }

    // Ensure score is within valid range
    confidenceScore = Math.max(0, Math.min(100, confidenceScore))

    console.log("Confidence score extracted:", confidenceScore)

    const response = {
      summary: text,
      confidenceScore,
      interviewDate: hasInterviewDate ? interviewDate : null,
    }

    console.log("Returning successful response")
    return NextResponse.json(response)
  } catch (error) {
    console.error("Error evaluating interview:", error)

    // Provide detailed error information
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    const errorStack = error instanceof Error ? error.stack : "No stack trace"

    console.error("Detailed error:", errorMessage)
    console.error("Error stack:", errorStack)

    return NextResponse.json(
      {
        error: "Failed to evaluate interview",
        details: errorMessage,
        confidenceScore: 0,
        interviewDate: null,
      },
      { status: 500 },
    )
  }
}
