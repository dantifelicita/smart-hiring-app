-- Create job_descriptions table
CREATE TABLE IF NOT EXISTS job_descriptions (
    job_id SERIAL PRIMARY KEY,
    job_title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    criteria TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create candidates table
CREATE TABLE IF NOT EXISTS candidates (
    candidate_id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    applied_job_id INTEGER REFERENCES job_descriptions(job_id),
    status VARCHAR(50) DEFAULT 'CV Screening' CHECK (status IN ('CV Screening', 'Interview', 'Offer')),
    cv_file TEXT,
    interview_transcript TEXT,
    evaluation_summaries JSONB DEFAULT '{}',
    confidence_score INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_candidates_job_id ON candidates(applied_job_id);
CREATE INDEX IF NOT EXISTS idx_candidates_status ON candidates(status);
