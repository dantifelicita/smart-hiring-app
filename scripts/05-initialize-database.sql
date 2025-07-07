-- Initialize the Smart Hiring App Database
-- Run this script first to set up all required tables

-- Drop existing tables if they exist (for clean setup)
DROP TABLE IF EXISTS candidates CASCADE;
DROP TABLE IF EXISTS job_descriptions CASCADE;

-- Create job_descriptions table
CREATE TABLE job_descriptions (
    job_id SERIAL PRIMARY KEY,
    job_title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    criteria TEXT DEFAULT '',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create candidates table with all required statuses
CREATE TABLE candidates (
    candidate_id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    applied_job_id INTEGER REFERENCES job_descriptions(job_id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'CV Screening' CHECK (status IN ('CV Screening', 'Interview', 'Offer', 'Hired', 'Rejected')),
    cv_file TEXT,
    interview_transcript TEXT,
    evaluation_summaries JSONB DEFAULT '{}',
    confidence_score INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_candidates_job_id ON candidates(applied_job_id);
CREATE INDEX idx_candidates_status ON candidates(status);

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
INSERT INTO candidates (name, applied_job_id, status, evaluation_summaries, confidence_score) VALUES
('Alice Johnson', 1, 'CV Screening', '{"cv_summary": "Strong candidate with 6 years of React experience. Excellent technical skills in TypeScript and modern frontend frameworks. Previous experience at tech startups shows adaptability and growth mindset."}', 85),
('Bob Smith', 2, 'Interview', '{"cv_summary": "Experienced product manager with strong analytical background. Led successful product launches at previous companies. Good stakeholder management experience.", "interview_summary": "Excellent communication skills demonstrated during interview. Strong strategic thinking and data-driven approach to product decisions. Cultural fit appears very good."}', 78),
('Carol Davis', 1, 'Offer', '{"cv_summary": "Senior developer with extensive React and TypeScript experience. Strong portfolio of complex web applications. Leadership experience mentoring junior developers.", "interview_summary": "Outstanding technical interview performance. Demonstrated deep understanding of frontend architecture and best practices. Excellent problem-solving skills and communication."}', 92),
('David Wilson', 3, 'CV Screening', '{"cv_summary": "PhD in Computer Science with focus on machine learning. Strong Python and R skills. Published research in data science journals. Some industry experience but mostly academic background."}', 70);

-- Verify the setup
SELECT 'Database initialized successfully!' as status;
SELECT COUNT(*) as job_count FROM job_descriptions;
SELECT COUNT(*) as candidate_count FROM candidates;
