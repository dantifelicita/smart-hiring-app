-- Create job_descriptions table
CREATE TABLE IF NOT EXISTS job_descriptions (
    job_id SERIAL PRIMARY KEY,
    job_title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    criteria TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create candidates table
CREATE TABLE IF NOT EXISTS candidates (
    candidate_id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    applied_job_id INTEGER REFERENCES job_descriptions(job_id),
    status VARCHAR(50) DEFAULT 'CV Screening',
    cv_file TEXT,
    interview_transcript TEXT,
    evaluation_summaries TEXT,
    confidence_score DECIMAL(3,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample job description
INSERT INTO job_descriptions (job_title, description, criteria) 
VALUES (
    'Senior Frontend Developer',
    'We are looking for a Senior Frontend Developer to join our team. You will be responsible for developing user interfaces using React, TypeScript, and modern web technologies.',
    'React, TypeScript, JavaScript, HTML, CSS, Git, Problem-solving skills'
) ON CONFLICT DO NOTHING;

-- Insert sample candidate
INSERT INTO candidates (name, applied_job_id, status) 
VALUES (
    'John Doe',
    1,
    'CV Screening'
) ON CONFLICT DO NOTHING;
