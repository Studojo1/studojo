# Security Audit Report - Studojo Application

**Date:** 2024  
**Scope:** Full codebase security review

## 🔴 CRITICAL VULNERABILITIES

### 1. JWT Token Verification Bypass (CRITICAL)
**Location:** `apps/maverick/app/routes/api.auth.check-role.tsx` and `apps/maverick/app/lib/auth-helper.server.ts`

**Issue:** JWT tokens are decoded without cryptographic verification. The code extracts the payload and trusts the user ID without verifying the signature.

```typescript
// Line 14-26 in api.auth.check-role.tsx
// Decode JWT to get user ID (without verification for now - in production, verify via JWKS)
const payload = JSON.parse(
  Buffer.from(parts[1].replace(/-/g, "+").replace(/_/g, "/"), "base64").toString()
);
```

**Impact:** An attacker can forge JWT tokens by creating a valid-looking token with any user ID, gaining unauthorized access to admin/ops endpoints.

**Fix:** Implement proper JWT verification using JWKS (like the control-plane does) or use the same Better Auth verification mechanism.

---

### 2. Hardcoded Credentials in Version Control (CRITICAL)
**Location:** `docker-compose.yml` (lines 62-63), `k8s/secrets/secrets-template.yaml`

**Issue:** Production API keys and secrets are hardcoded in configuration files:
- Razorpay test keys: `rzp_test_yLageEyPxSrRxG` / `pWKxbij31gPScaRELEhrHdvY`
- Database passwords: `studojo` (weak password)
- RabbitMQ default credentials: `guest:guest`

**Impact:** 
- Credentials exposed in git history
- Weak default passwords
- Test credentials may be used in production

**Fix:**
- Remove all hardcoded credentials
- Use environment variables with `.env` files (gitignored)
- Use secret management (Azure Key Vault, Kubernetes secrets)
- Rotate all exposed credentials immediately

---

### 3. SQL Injection Risk in Dynamic Query Building (HIGH)
**Location:** `services/control-plane/internal/api/admin.go` (lines 283-320)

**Issue:** While using parameterized queries, the code builds SQL dynamically by string concatenation:

```go
query := `UPDATE "user" SET ` + updates[0]
for i := 1; i < len(updates); i++ {
    query += ", " + updates[i]
}
query += " WHERE id = $" + strconv.Itoa(argIdx)
```

**Impact:** While currently safe (field names are controlled), this pattern is error-prone and could lead to SQL injection if field names are ever derived from user input.

**Fix:** Use a whitelist for allowed field names or use a proper ORM/query builder.

---

### 4. Missing Rate Limiting (HIGH)
**Location:** All API endpoints

**Issue:** No rate limiting implemented on any endpoints. This includes:
- Authentication endpoints
- Payment endpoints
- Job submission endpoints
- Admin endpoints

**Impact:**
- Brute force attacks on authentication
- DoS attacks
- API abuse
- Cost escalation (if using paid APIs)

**Fix:** Implement rate limiting middleware (e.g., using Redis) with appropriate limits per endpoint type.

---

### 5. Weak CORS Configuration (MEDIUM)
**Location:** `apps/frontend/app/routes/api.auth.$.tsx` (lines 8-13)

**Issue:** CORS origin check uses string matching that could be bypassed:

```typescript
if (origin && (
  origin.includes(":3001") || 
  origin.includes("admin") ||
  origin === "http://localhost:3001" ||
  origin === "http://127.0.0.1:3001"
)) {
```

**Impact:** An attacker could register a domain like `evil.com:3001` or `admin.evil.com` to bypass CORS.

**Fix:** Use exact origin matching with a whitelist, not substring matching.

---

## 🟡 MEDIUM RISK ISSUES

### 6. Information Disclosure in Error Messages
**Location:** Multiple files using `console.error` and `slog.Error`

**Issue:** Error messages may leak sensitive information:
- Database errors
- Stack traces
- Internal file paths
- API keys in logs

**Impact:** Attackers can gain information about system internals.

**Fix:** 
- Sanitize error messages before logging
- Use structured logging with appropriate log levels
- Never log sensitive data (passwords, tokens, PII)

---

### 7. Missing Input Validation on Some Endpoints
**Location:** Various API endpoints

**Issue:** Some endpoints lack comprehensive input validation:
- Email validation only checks for `@` symbol
- Phone number validation is minimal
- File upload validation relies on client-side checks

**Impact:** Invalid data in database, potential for injection attacks.

**Fix:** Implement server-side validation for all inputs using a validation library.

---

### 8. File Upload Security Concerns
**Location:** `apps/maverick/app/routes/api/blog/upload-image.tsx`

**Issue:** 
- File type validation relies on `file.type` which can be spoofed
- No virus scanning
- No content-based validation (magic bytes check)
- Filenames not sanitized

**Impact:** Malicious file uploads, path traversal attacks.

**Fix:**
- Validate file content (magic bytes), not just MIME type
- Sanitize filenames
- Scan uploaded files
- Store files outside web root with generated names

---

### 9. Weak Password Policy
**Location:** Database initialization scripts

**Issue:** Default database password is `studojo` - a weak, guessable password.

**Impact:** Unauthorized database access if exposed.

**Fix:** Enforce strong password requirements, use generated passwords.

---

### 10. Missing Security Headers
**Location:** All HTTP responses

**Issue:** Missing security headers:
- `Content-Security-Policy`
- `X-Frame-Options`
- `X-Content-Type-Options`
- `Strict-Transport-Security` (HSTS)
- `X-XSS-Protection`

**Impact:** XSS attacks, clickjacking, MIME type sniffing.

**Fix:** Add security headers middleware to all services.

---

## 🟢 LOW RISK / CODE QUALITY ISSUES

### 11. Inconsistent Error Handling
**Location:** Multiple files

**Issue:** Some functions return `null` on error, others throw exceptions, others return error objects.

**Fix:** Standardize error handling patterns across the codebase.

---

### 12. Missing Input Sanitization for XSS
**Location:** Frontend components rendering user content

**Issue:** User-generated content (blog posts, comments) may not be properly sanitized before rendering.

**Fix:** Use a proper HTML sanitization library (e.g., DOMPurify) for all user-generated content.

---

### 13. Admin Panel Authentication
**Location:** `apps/admin-panel/`

**Issue:** Need to verify admin panel uses proper authentication and authorization checks.

**Fix:** Audit all admin panel routes for proper auth checks.

---

### 14. Secrets in Environment Variables
**Location:** Various `.env` files

**Issue:** `.env` files may be committed to version control (need to verify `.gitignore`).

**Fix:** Ensure all `.env*` files are in `.gitignore`, use `.env.example` for templates.

---

### 15. Database Connection String Exposure
**Location:** `docker-compose.yml`, deployment configs

**Issue:** Database connection strings with credentials visible in config files.

**Fix:** Use secret management systems, never commit connection strings.

---

## 📋 RECOMMENDATIONS

### Immediate Actions (Critical)
1. **Fix JWT verification** in Maverick app - implement proper JWKS verification
2. **Remove all hardcoded credentials** from codebase
3. **Rotate all exposed credentials** (Razorpay keys, database passwords, etc.)
4. **Implement rate limiting** on all public endpoints
5. **Add security headers** to all HTTP responses

### Short-term (High Priority)
1. Refactor SQL query building to use whitelisted field names
2. Implement comprehensive input validation
3. Add file upload security (magic bytes, sanitization)
4. Fix CORS configuration to use exact matching
5. Add structured logging with sensitive data filtering

### Long-term (Best Practices)
1. Implement security monitoring and alerting
2. Regular security audits and penetration testing
3. Dependency vulnerability scanning (Dependabot, Snyk)
4. Implement Content Security Policy (CSP)
5. Add API versioning and deprecation policies
6. Implement request signing for sensitive operations
7. Add audit logging for admin operations

---

## 🔍 ADDITIONAL CHECKS NEEDED

1. **Dependency Audit:** Run `npm audit` and `go mod audit` to check for vulnerable dependencies
2. **SSL/TLS Configuration:** Verify proper TLS configuration in production
3. **Session Management:** Review session timeout and invalidation logic
4. **Password Storage:** Verify passwords are hashed (not plaintext) - appears to use Better Auth which should handle this
5. **CSRF Protection:** Verify CSRF tokens are used where appropriate
6. **API Key Rotation:** Implement key rotation policies
7. **Backup Security:** Verify database backups are encrypted

---

## 📝 NOTES

- The control-plane service appears to have better security practices (proper JWT verification, parameterized queries)
- The Maverick app has the most critical issues (JWT bypass)
- Frontend validation exists but needs server-side validation as well
- File upload handling has basic validation but needs improvement

---

**Priority Order:**
1. Fix JWT verification bypass (CRITICAL)
2. Remove hardcoded credentials (CRITICAL)
3. Implement rate limiting (HIGH)
4. Fix SQL query building pattern (HIGH)
5. Add security headers (MEDIUM)
6. Improve file upload security (MEDIUM)
7. Fix CORS configuration (MEDIUM)
8. All other items (LOW/MEDIUM)

