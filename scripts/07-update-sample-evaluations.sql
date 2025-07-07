-- Update sample evaluations to use plain text formatting without asterisks

UPDATE candidates 
SET evaluation_summaries = jsonb_set(
  evaluation_summaries,
  '{cv_summary}',
  '"CV EVALUATION SUMMARY

RELEVANT EXPERIENCE
The candidate has 6 years of solid React development experience with a strong focus on modern frontend frameworks. They have worked at multiple tech startups, demonstrating adaptability and the ability to work in fast-paced environments. Their experience includes building complex user interfaces and working with cross-functional teams.

TECHNICAL QUALIFICATIONS
Strong proficiency in React, TypeScript, and JavaScript. They have experience with modern development tools and practices including Git, CI/CD pipelines, and agile methodologies. Their technical stack aligns well with our requirements.

EDUCATION AND BACKGROUND
Computer Science degree from a reputable university. Continuous learning demonstrated through various online certifications and staying current with frontend technologies.

STRENGTHS
- Extensive hands-on React experience
- Strong TypeScript skills
- Proven ability to work in startup environments
- Good understanding of modern frontend architecture
- Experience with responsive design and cross-browser compatibility

AREAS OF CONCERN
Limited experience with backend technologies, though this may not be critical for the frontend role. Could benefit from more experience with large-scale applications.

JOB MATCH ASSESSMENT
This candidate aligns very well with our Senior Frontend Developer requirements. They have the technical skills, experience level, and startup background that would fit well with our team and culture.

OVERALL RECOMMENDATION
Strong Match - This candidate demonstrates the technical expertise and experience we are looking for in a Senior Frontend Developer role."'
)
WHERE candidate_id = 1;

UPDATE candidates 
SET evaluation_summaries = jsonb_set(
  jsonb_set(
    evaluation_summaries,
    '{cv_summary}',
    '"CV EVALUATION SUMMARY

RELEVANT EXPERIENCE
The candidate has 5 years of product management experience with a track record of successful product launches. They have worked at both established companies and startups, giving them a well-rounded perspective on product development across different organizational contexts.

TECHNICAL QUALIFICATIONS
Strong analytical background with experience in data analysis tools and methodologies. They have demonstrated ability to work with engineering teams and understand technical constraints while making product decisions.

EDUCATION AND BACKGROUND
MBA with focus on technology management. Undergraduate degree in Engineering provides good technical foundation for working with development teams.

STRENGTHS
- Proven track record of successful product launches
- Strong analytical and data-driven approach
- Experience with agile methodologies
- Good stakeholder management skills
- Understanding of both business and technical aspects

AREAS OF CONCERN
Limited experience in our specific industry vertical, though their transferable skills are strong. Could benefit from more experience with B2B products.

JOB MATCH ASSESSMENT
This candidate has the core competencies we need for our Product Manager role. Their combination of technical understanding and business acumen makes them a good fit for our cross-functional environment.

OVERALL RECOMMENDATION
Good Match - The candidate has relevant experience and skills that align with our Product Manager requirements."'
  ),
  '{interview_summary}',
  '"INTERVIEW SUMMARY
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

Score Breakdown:
- Technical Competency: 19/25
- Communication Skills: 22/25
- Cultural Fit: 20/25

Score Explanation:
The candidate scored well on communication skills due to their clear articulation and structured responses. Technical competency was slightly lower due to some gaps in technical implementation knowledge. Cultural fit scored well based on their collaborative approach and alignment with our values.

RECOMMENDATION
Hire - This candidate demonstrates the core competencies needed for the Product Manager role and would be a good addition to our team."'
  )
WHERE candidate_id = 2;

SELECT 'Sample evaluations updated with plain text formatting!' as status;
