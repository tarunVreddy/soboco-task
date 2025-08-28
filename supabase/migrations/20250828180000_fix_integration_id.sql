-- Migration: Fix integration_id column in tasks table
-- Date: 2025-08-28
-- Description: Ensure integration_id column exists in tasks table

-- Add integration_id column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'tasks' 
        AND column_name = 'integration_id'
    ) THEN
        ALTER TABLE tasks ADD COLUMN integration_id UUID REFERENCES integrations(id) ON DELETE CASCADE;
        RAISE NOTICE 'Added integration_id column to tasks table';
    ELSE
        RAISE NOTICE 'integration_id column already exists in tasks table';
    END IF;
END $$;

-- Create index if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_tasks_integration_id ON tasks(integration_id);
