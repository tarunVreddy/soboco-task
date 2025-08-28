-- Migration: Remove password column from users table
-- Date: 2025-08-28
-- Description: Since we're only using Google OAuth, we don't need the password column anymore

-- Remove password column from users table
ALTER TABLE users DROP COLUMN IF EXISTS password;

-- Add a comment to document this change
COMMENT ON TABLE users IS 'Users table - authentication via Google OAuth only';
