Write-Host "Setting up required GitHub Labels..."

# Create missing security label
gh label create "security" -c "e11d21" -d "Security related issues" -f | Out-Null

Write-Host "Creating remaining Alien Protocol GitHub Issues..."

$tempFile = [System.IO.Path]::GetTempFileName()

# 6. Backend Rate Limiting
Write-Host "Creating Issue 6..."
$body6 = @"
## Background/Context
The `/api/notify` endpoint allows users to join the waitlist. 

## Problem Statement
The endpoint is currently exposed and vulnerable to automated spam bots and DDoS attacks.

## Detailed Tasks Checklist
- [ ] Implement a rate-limiting mechanism (e.g., using Upstash Redis or a generic local memory cache) to restrict requests per IP address.
- [ ] Integrate Cloudflare Turnstile (or an equivalent CAPTCHA) into the frontend `EmailForm`.
- [ ] Send the CAPTCHA token to the backend.
- [ ] Verify CAPTCHA tokens securely on the server-side before executing the email logic.

## Acceptance Criteria
- An IP making too many requests receives a `429 Too Many Requests` error.
- Waitlist submissions without a valid Turnstile token are rejected by the backend.

## Suggested Tech Stack
- Next.js API Routes, Upstash Redis (optional), Cloudflare Turnstile
"@
Set-Content -Path $tempFile -Value $body6 -Encoding UTF8
gh issue create --title "[Backend & Security] Implement Rate Limiting and Turnstile for Waitlist API" --label "backend,security,medium" --body-file $tempFile

# 7. Zod Validation
Write-Host "Creating Issue 7..."
$body7 = @"
## Background/Context
Next.js API routes need to trust that the data they receive is properly structured and malicious inputs are rejected.

## Problem Statement
Manual validation checks are prone to error. We need strict type-safe schemas.

## Detailed Tasks Checklist
- [ ] Integrate the `zod` library.
- [ ] Create strict Zod schemas for incoming requests (e.g., the email payload).
- [ ] Validate incoming request bodies against the schema.
- [ ] Create a reusable validation middleware/wrapper for Next.js App Router API routes.
- [ ] Standardize error responses (e.g., return `400 Bad Request` with field-specific Zod errors).

## Acceptance Criteria
- Invalid payloads (e.g., missing email, bad format) are automatically rejected with a clear JSON error.
- All backend types are inferred directly from the Zod schemas.

## Suggested Tech Stack
- TypeScript, Zod, Next.js API Routes
"@
Set-Content -Path $tempFile -Value $body7 -Encoding UTF8
gh issue create --title "[Backend/Validation] Implement Strict API Input Validation with Zod" --label "backend,security,medium" --body-file $tempFile


Remove-Item -Path $tempFile -ErrorAction SilentlyContinue

Write-Host "All 15 GitHub Issues have been created successfully!"
