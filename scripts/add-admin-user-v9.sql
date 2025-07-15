-- Insert a new admin user
-- The password 'Aseda247!@ke' will be hashed by the application's signup process.
-- For direct database insertion, you would typically hash it beforehand or use a function.
-- For this script, we'll assume the password will be hashed by the application logic
-- when a user signs up. If you are running this directly, you might need to hash it manually.

-- This script is for demonstration purposes to show how to add a user.
-- In a real application, user creation (especially with passwords) should go through
-- your application's signup/user management API to ensure proper hashing and validation.

INSERT INTO users (email, password_hash, role, status)
VALUES (
    'michaelbollie@gmail.com',
    '$2a$10$e.g.hashed.password.here.replace.this.with.actual.hash', -- Replace with the actual hashed password for 'Aseda247!@ke'
    'admin',
    'active'
)
ON CONFLICT (email) DO UPDATE SET
    role = EXCLUDED.role,
    status = EXCLUDED.status,
    updated_at = NOW();
