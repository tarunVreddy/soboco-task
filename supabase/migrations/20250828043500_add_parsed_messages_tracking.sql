-- Migration: Add parsed messages tracking
-- Date: 2025-08-28
-- Description: Track which Gmail messages have already been parsed for tasks

-- Create table to track parsed messages
CREATE TABLE IF NOT EXISTS parsed_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    integration_id UUID NOT NULL REFERENCES integrations(id) ON DELETE CASCADE,
    gmail_message_id VARCHAR(255) NOT NULL,
    parsed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    tasks_extracted INTEGER DEFAULT 0,
    
    -- Ensure we don't parse the same message twice for the same user/integration
    UNIQUE(user_id, integration_id, gmail_message_id)
);

-- Create indexes for better performance
CREATE INDEX idx_parsed_messages_user_id ON parsed_messages(user_id);
CREATE INDEX idx_parsed_messages_integration_id ON parsed_messages(integration_id);
CREATE INDEX idx_parsed_messages_gmail_id ON parsed_messages(gmail_message_id);
CREATE INDEX idx_parsed_messages_parsed_at ON parsed_messages(parsed_at);

-- Enable Row Level Security
ALTER TABLE parsed_messages ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can manage own parsed messages" ON parsed_messages
    FOR ALL USING (auth.uid()::text = user_id::text);

-- Add comments
COMMENT ON TABLE parsed_messages IS 'Track which Gmail messages have been parsed for task extraction';
COMMENT ON COLUMN parsed_messages.gmail_message_id IS 'Gmail message ID that was parsed';
COMMENT ON COLUMN parsed_messages.tasks_extracted IS 'Number of tasks extracted from this message';
