# Admin User Setup Guide

## Setting Users as Admin

There are several ways to set a user as admin in Studojo:

### Method 1: Using the Script (Recommended)

```bash
# Make sure you have DATABASE_URL set or use the default
export DATABASE_URL="postgresql://studojo:studojo@localhost:5432/postgres"

# Set a user as admin by email
./scripts/set-admin-user.sh your-email@example.com
```

### Method 2: Using Docker Compose

If you're using docker-compose, you can run the SQL directly:

```bash
# Connect to the postgres container
docker-compose exec postgres psql -U studojo -d postgres

# Then run:
UPDATE "user" SET role = 'admin' WHERE email = 'your-email@example.com';
```

### Method 3: Using Adminer (Web UI)

1. Open Adminer at http://localhost:8081
2. Login with:
   - System: PostgreSQL
   - Server: postgres
   - Username: studojo
   - Password: studojo
   - Database: postgres
3. Navigate to the `user` table
4. Find your user by email
5. Edit the `role` field and set it to `admin`
6. Save

### Method 4: Direct SQL Query

```sql
-- Set a specific user as admin by email
UPDATE "user" SET role = 'admin' WHERE email = 'your-email@example.com';

-- Set a user as admin by user ID
UPDATE "user" SET role = 'admin' WHERE id = 'user-id-here';

-- Verify admin users
SELECT id, name, email, role FROM "user" WHERE role = 'admin';
```

## Verifying Admin Access

After setting a user as admin:

1. Make sure you're logged in with that user account
2. Access the admin panel at http://localhost:3001 (or /admin route in production)
3. The admin panel will verify your role via JWT token and database check

## Important Notes

- The `role` field must be set to exactly `'admin'` (case-sensitive)
- Users without the admin role will receive a 403 Forbidden error when accessing admin endpoints
- The admin panel uses JWT tokens from the main frontend, so you need to be logged in there first
- In production, make sure to set admin users securely and limit access

## Troubleshooting

If you can't access the admin panel:

1. **Check your role in the database:**
   ```sql
   SELECT id, email, role FROM "user" WHERE email = 'your-email@example.com';
   ```

2. **Verify JWT token contains your user ID:**
   - The token should have your user ID in the `sub` claim
   - The admin middleware checks the database for your role

3. **Check admin panel logs:**
   ```bash
   docker-compose logs admin-panel
   ```

4. **Check control-plane logs for admin API calls:**
   ```bash
   docker-compose logs control-plane | grep admin
   ```

