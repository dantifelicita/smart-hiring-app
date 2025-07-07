-- Insert sample job descriptions
INSERT INTO job_descriptions (job_title, description, criteria) VALUES
('Senior Frontend Developer', 
 'We are looking for an experienced Frontend Developer to join our team. You will be responsible for developing user-facing web applications using modern JavaScript frameworks, ensuring responsive design, and collaborating with backend developers to integrate APIs.',
 'React/Vue.js expertise, TypeScript knowledge, responsive design skills, API integration experience, 5+ years frontend development'),

('Product Manager', 
 'Seeking a Product Manager to drive product strategy and roadmap. You will work closely with engineering, design, and business teams to deliver innovative products that meet customer needs and business objectives.',
 'Product strategy experience, stakeholder management, data analysis skills, agile methodology knowledge, 3+ years product management'),

('Data Scientist', 
 'Join our data team as a Data Scientist to analyze complex datasets, build predictive models, and provide actionable insights to drive business decisions.',
 'Python/R proficiency, machine learning expertise, statistical analysis, data visualization, SQL knowledge, 4+ years data science experience');

-- Insert sample candidates
INSERT INTO candidates (name, applied_job_id, status) VALUES
('Alice Johnson', 1, 'CV Screening'),
('Bob Smith', 2, 'Interview'),
('Carol Davis', 1, 'Offer'),
('David Wilson', 3, 'CV Screening');
