-- Update the role of the 'test@example.com' user to 'admin'
UPDATE users
SET role = 'admin', updated_at = NOW()
WHERE email = 'test@example.com';
