-- Add columns for last login IP and device info to the 'users' table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS last_login_ip INET,
ADD COLUMN IF NOT EXISTS last_login_device TEXT;
