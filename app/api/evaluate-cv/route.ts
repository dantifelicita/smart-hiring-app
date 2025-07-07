import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { createOpenAI } from "@ai-sdk/openai"

const OPENAI_API_KEY =
  "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"

export async function POST(request: NextRequest) {
  try {
    const { cvContent, jobDescription, criteria } = await request.json()

    if (!cvContent || !jobDescription) {
      return NextResponse.json({ error: "CV content and job description are required" }, { status: 400 })
    }

    // Create OpenAI client with API key
    const openai = createOpenAI({
      apiKey: OPENAI_API_KEY,
    })

    const evaluationCriteria =
      criteria && criteria.trim()
        ? `Custom Evaluation Criteria: ${criteria}

Please pay special attention to these custom criteria when evaluating the candidate. Assess how well the CV demonstrates these specific requirements and mention them explicitly in your evaluation.`
        : "Standard job requirements and qualifications"

    const { text } = await generateText({
      model: openai("gpt-4o"),
      prompt: `
        Analyze the following CV against the job description and criteria:

        Job Description: ${jobDescription}
        
        ${evaluationCriteria}
        
        CV Content: ${cvContent}

        Please provide a comprehensive evaluation summary in plain text format (no markdown, asterisks, or special formatting). Do not include a "CV EVALUATION SUMMARY" title at the beginning since it will be added as a header:

        RELEVANT EXPERIENCE
        [Detailed assessment of relevant work experience and skills${criteria ? ", specifically addressing the custom criteria provided" : ""}]

        TECHNICAL QUALIFICATIONS
        [Evaluation of technical skills and certifications${criteria ? ", with focus on the custom evaluation criteria" : ""}]

        EDUCATION AND BACKGROUND
        [Assessment of educational qualifications and background]

        ${
          criteria
            ? `CUSTOM CRITERIA ASSESSMENT
        [Specific evaluation of how well the candidate meets each of the custom criteria provided: ${criteria}]

        `
            : ""
        }STRENGTHS
        [Key positive points that make this candidate suitable${criteria ? ", highlighting alignment with custom criteria" : ""}]

        AREAS OF CONCERN
        [Any gaps, weaknesses, or missing qualifications${criteria ? ", particularly regarding the custom criteria" : ""}]

        JOB MATCH ASSESSMENT
        [How well the candidate matches the specific job requirements${criteria ? " and custom criteria" : ""}]

        OVERALL RECOMMENDATION
        [Strong Match, Good Match, Weak Match, or Poor Match with detailed reasoning${criteria ? " based on both job requirements and custom criteria" : ""}]

        Important guidelines:
        - Use gender-neutral pronouns (they/them) when referring to the candidate
        - Do not use any markdown formatting, asterisks, bold, or italic text
        - Use plain text with clear section headers
        - Provide specific examples from the CV
        - Be objective and professional in your assessment
        - Focus on job-relevant qualifications and experience
        ${criteria ? "- Give significant weight to the custom evaluation criteria provided" : ""}
        - Do not include a main title since it will be added as a header
      `,
    })

    return NextResponse.json({ summary: text })
  } catch (error) {
    console.error("Error evaluating CV:", error)

    // Provide detailed error information
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    console.error("Detailed error:", errorMessage)

    return NextResponse.json(
      {
        error: "Failed to evaluate CV",
        details: errorMessage,
      },
      { status: 500 },
    )
  }
}
