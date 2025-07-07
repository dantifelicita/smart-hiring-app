-- Add interview_date column to candidates table
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS interview_date DATE;

-- Update sample data with interview dates
UPDATE candidates SET interview_date = '2024-01-15' WHERE candidate_id = 2;
UPDATE candidates SET interview_date = '2024-01-20' WHERE candidate_id = 3;

-- Update sample interview summaries to include interview dates
UPDATE candidates 
SET evaluation_summaries = jsonb_set(
  evaluation_summaries,
  '{interview_summary}',
  '"INTERVIEW DATE
January 15, 2024

INTERVIEW SUMMARY
The candidate demonstrated strong communication skills and strategic thinking throughout the interview. They articulated their product philosophy clearly and showed good understanding of user-centered design principles.

QUESTION-BY-QUESTION ANALYSIS
When asked about handling conflicting stakeholder requirements, they provided a structured approach involving data analysis and user research to make informed decisions. Their response showed maturity in handling complex situations.

For the product prioritization question, they outlined a clear framework using impact vs effort analysis and demonstrated understanding of business objectives alignment.

TECHNICAL COMPETENCY
They showed good understanding of product development lifecycle and demonstrated familiarity with various product management tools and methodologies. Their technical background helps them communicate effectively with engineering teams.

COMMUNICATION & SOFT SKILLS
Excellent verbal communication skills. They listened carefully to questions and provided thoughtful, structured responses. Demonstrated good emotional intelligence when discussing challenging situations.

CULTURAL FIT
Their collaborative approach and emphasis on data-driven decision making aligns well with our company culture. They expressed genuine interest in our mission and showed enthusiasm for the role.

STRENGTHS
- Clear communication and structured thinking
- Strong analytical approach to problem-solving
- Good understanding of user experience principles
- Collaborative mindset
- Genuine enthusiasm for the role

AREAS OF CONCERN
Some responses could have been more specific with concrete examples. They seemed less confident when discussing technical implementation details.

OVERALL ASSESSMENT SCORE
Based on the comprehensive evaluation above, I assign this candidate a score of 78/100.

Score Breakdown (out of 100 total):
- Technical Competency: 25/35
- Communication Skills: 30/35
- Cultural Fit: 23/30

Score Explanation:
The candidate scored well on communication skills due to their clear articulation and structured responses. Technical competency was good but had some gaps in technical implementation knowledge. Cultural fit scored well based on their collaborative approach and alignment with our values.

RECOMMENDATION
Hire - This candidate demonstrates the core competencies needed for the Product Manager role and would be a good addition to our team."'
)
WHERE candidate_id = 2;

UPDATE candidates 
SET evaluation_summaries = jsonb_set(
  evaluation_summaries,
  '{interview_summary}',
  '"INTERVIEW DATE
January 20, 2024

INTERVIEW SUMMARY
Outstanding technical interview performance with comprehensive answers to all technical questions. The candidate demonstrated deep understanding of frontend architecture, best practices, and problem-solving approaches.

GENERAL INTERVIEW ANALYSIS
The candidate provided detailed technical explanations and showed strong problem-solving skills. They discussed complex architectural decisions with clarity and demonstrated leadership experience through mentoring examples.

TECHNICAL COMPETENCY
Exceptional technical knowledge demonstrated through detailed discussions of React architecture, state management, performance optimization, and testing strategies. They provided specific examples of technical challenges they have solved.

COMMUNICATION & SOFT SKILLS
Excellent communication skills with ability to explain complex technical concepts clearly. Demonstrated leadership qualities and collaborative approach to problem-solving.

CULTURAL FIT
Strong alignment with our engineering culture. They emphasized code quality, continuous learning, and team collaboration. Showed genuine enthusiasm for technical challenges.

STRENGTHS
- Deep technical expertise in React and TypeScript
- Strong architectural thinking and problem-solving skills
- Excellent communication and mentoring abilities
- Proven leadership experience
- Commitment to code quality and best practices

AREAS OF CONCERN
No significant concerns identified. The candidate exceeded expectations in all areas evaluated.

OVERALL ASSESSMENT SCORE
Based on the comprehensive evaluation above, I assign this candidate a score of 92/100.

Score Breakdown (out of 100 total):
- Technical Competency: 33/35
- Communication Skills: 32/35
- Cultural Fit: 27/30

Score Explanation:
The candidate scored exceptionally high across all categories. Technical competency was nearly perfect with deep knowledge and practical experience. Communication skills were excellent with clear explanations and leadership qualities. Cultural fit was strong with good alignment to our values and practices.

RECOMMENDATION
Hire - This is an exceptional candidate who would be a valuable addition to our senior development team."'
)
WHERE candidate_id = 3;

SELECT 'Interview dates added successfully!' as status;
