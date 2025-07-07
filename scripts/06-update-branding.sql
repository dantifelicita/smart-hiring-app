-- Update database initialization script with Spicy Marker branding
-- This is just for reference, the main initialization is in 05-initialize-database.sql

-- Update sample data to reflect Spicy Marker branding
UPDATE candidates 
SET evaluation_summaries = jsonb_set(
  evaluation_summaries,
  '{cv_summary}',
  '"Strong candidate with 6 years of React experience. They demonstrate excellent technical skills in TypeScript and modern frontend frameworks. Previous experience at tech startups shows adaptability and growth mindset."'
)
WHERE candidate_id = 1;

UPDATE candidates 
SET evaluation_summaries = jsonb_set(
  jsonb_set(
    evaluation_summaries,
    '{cv_summary}',
    '"Experienced product manager with strong analytical background. They led successful product launches at previous companies. Good stakeholder management experience."'
  ),
  '{interview_summary}',
  '"Excellent communication skills demonstrated during interview. They show strong strategic thinking and data-driven approach to product decisions. Cultural fit appears very good."'
)
WHERE candidate_id = 2;

UPDATE candidates 
SET evaluation_summaries = jsonb_set(
  jsonb_set(
    evaluation_summaries,
    '{cv_summary}',
    '"Senior developer with extensive React and TypeScript experience. They have a strong portfolio of complex web applications. Leadership experience mentoring junior developers."'
  ),
  '{interview_summary}',
  '"Outstanding technical interview performance. They demonstrated deep understanding of frontend architecture and best practices. Excellent problem-solving skills and communication."'
)
WHERE candidate_id = 3;

UPDATE candidates 
SET evaluation_summaries = jsonb_set(
  evaluation_summaries,
  '{cv_summary}',
  '"PhD in Computer Science with focus on machine learning. They have strong Python and R skills. Published research in data science journals. Some industry experience but mostly academic background."'
)
WHERE candidate_id = 4;

SELECT 'Spicy Marker branding updated successfully!' as status;
