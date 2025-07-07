-- Add rejected status to the candidates table
ALTER TABLE candidates DROP CONSTRAINT IF EXISTS candidates_status_check;
ALTER TABLE candidates ADD CONSTRAINT candidates_status_check 
CHECK (status IN ('CV Screening', 'Interview', 'Offer', 'Rejected'));

-- Update existing rejected candidates if any
UPDATE candidates SET status = 'Rejected' WHERE status NOT IN ('CV Screening', 'Interview', 'Offer');
