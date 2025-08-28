-- Migration: Add source_metadata column to tasks table
-- Date: 2025-08-28
-- Description: Add source_metadata column to existing tasks table

-- Add source_metadata column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tasks' AND column_name = 'source_metadata'
    ) THEN
        ALTER TABLE tasks ADD COLUMN source_metadata JSONB DEFAULT '{}';
    END IF;
END $$;

-- Add source_type column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tasks' AND column_name = 'source_type'
    ) THEN
        ALTER TABLE tasks ADD COLUMN source_type VARCHAR(20) DEFAULT 'MANUAL';
        ALTER TABLE tasks ADD CONSTRAINT tasks_source_type_check 
            CHECK (source_type IN ('GMAIL', 'MANUAL', 'SLACK', 'MICROSOFT'));
    END IF;
END $$;

-- Update existing tasks to have source_type if they don't have it
UPDATE tasks SET source_type = 'MANUAL' WHERE source_type IS NULL;

-- Add comments
COMMENT ON COLUMN tasks.source_metadata IS 'Additional metadata about the source (e.g., Gmail message ID, AI confidence)';
COMMENT ON COLUMN tasks.source_type IS 'Type of source where task was extracted from';
