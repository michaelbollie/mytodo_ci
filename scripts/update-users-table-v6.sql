-- Add a 'status' column to the 'users' table for user management (e.g., 'active', 'inactive', 'suspended')
ALTER TABLE users
ADD COLUMN IF NOT EXISTS status VARCHAR(50) NOT NULL DEFAULT 'active';

-- Add an index for the new status column
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
