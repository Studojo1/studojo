-- Script to set a user as admin
-- Usage: Update the email below to match your user's email, then run this script
-- Example: UPDATE "user" SET role = 'admin' WHERE email = 'your-email@example.com';

-- Set user as admin by email
UPDATE "user" SET role = 'admin' WHERE email = 'hi@rithul.dev';

-- Verify the update
SELECT id, name, email, role FROM "user" WHERE role = 'admin';

