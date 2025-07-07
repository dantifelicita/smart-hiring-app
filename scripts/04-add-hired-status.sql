-- Add hired status to the candidates table
ALTER TABLE candidates DROP CONSTRAINT IF EXISTS candidates_status_check;
ALTER TABLE candidates ADD CONSTRAINT candidates_status_check 
CHECK (status IN ('CV Screening', 'Interview', 'Offer', 'Hired', 'Rejected'));
