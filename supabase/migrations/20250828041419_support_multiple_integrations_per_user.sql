-- Migration: Support multiple integrations per user
-- Date: 2025-08-28
-- Description: Allow users to connect multiple Google, Microsoft, and Slack accounts

-- First, let's backup existing integrations data (if any)
CREATE TABLE IF NOT EXISTS integrations_backup AS 
SELECT * FROM integrations;

-- Drop the existing integrations table
DROP TABLE IF EXISTS integrations CASCADE;

-- Create new integrations table with better structure for multiple accounts
CREATE TABLE integrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL CHECK (provider IN ('google', 'microsoft', 'slack')),
    account_name VARCHAR(255) NOT NULL, -- User-friendly name for the account
    account_email VARCHAR(255) NOT NULL, -- Email associated with the integration
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    is_active BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}', -- Store provider-specific data
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique combination of user, provider, and account email
    UNIQUE(user_id, provider, account_email)
);

-- Create indexes for better performance
CREATE INDEX idx_integrations_user_id ON integrations(user_id);
CREATE INDEX idx_integrations_provider ON integrations(provider);
CREATE INDEX idx_integrations_account_email ON integrations(account_email);
CREATE INDEX idx_integrations_active ON integrations(is_active);

-- Enable Row Level Security
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for integrations
CREATE POLICY "Users can manage own integrations" ON integrations
    FOR ALL USING (auth.uid()::text = user_id::text);

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_integrations_updated_at BEFORE UPDATE ON integrations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE integrations IS 'User integrations with external services (Google, Microsoft, Slack)';
COMMENT ON COLUMN integrations.account_name IS 'User-friendly name for the integration (e.g., "Work Gmail", "Personal Outlook")';
COMMENT ON COLUMN integrations.account_email IS 'Email address associated with the integration';
COMMENT ON COLUMN integrations.metadata IS 'Provider-specific data (e.g., Gmail labels, Slack channels)';
