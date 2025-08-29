-- Add email metadata columns to tasks table
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS email_received_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS email_sender VARCHAR(255),
ADD COLUMN IF NOT EXISTS email_recipients TEXT;

-- Create index on email_sender for efficient filtering
CREATE INDEX IF NOT EXISTS idx_tasks_email_sender ON tasks(email_sender);

-- Create index on email_received_at for efficient sorting
CREATE INDEX IF NOT EXISTS idx_tasks_email_received_at ON tasks(email_received_at);

