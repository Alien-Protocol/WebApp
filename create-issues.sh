#!/bin/bash

# Ensure gh CLI is installed
if ! command -v gh &> /dev/null; then
    echo "GitHub CLI (gh) is not installed. Please install it from https://cli.github.com/ to proceed."
    exit 1
fi

echo "Creating Alien Protocol GitHub Issues..."

# 1. Refactor & Styling
echo "Creating Issue 1..."
gh issue create \
  --title "[Refactor & Styling] Migrate Inline Styles to Tailwind CSS v4 & Componentize Landing Page" \
  --label "frontend,medium" \
  --body-file - << 'EOF'
## Background/Context
The `app/page.tsx` file is currently a monolithic file containing inline `<style>` tags, complex animations, and all React logic. The project already has Tailwind CSS v4 installed, but it is not being utilized.

## Problem Statement
A monolithic file is hard to maintain, scale, and test. Inline styles make it difficult to build a consistent design system.

## Detailed Tasks Checklist
- [ ] Break `app/page.tsx` into reusable components:
  - [ ] Starfield
  - [ ] Hero
  - [ ] EmailForm
  - [ ] Footer
- [ ] Move these components into a new `components/` directory.
- [ ] Migrate all inline styles and custom CSS to Tailwind CSS v4 classes.
- [ ] Ensure the visual fidelity and animations remain exactly the same as the original.

## Acceptance Criteria
- No inline styles remain in the core components.
- The UI looks identical to the pre-refactored version.
- Code is cleanly separated into modular files.

## Technical Notes
- Pay close attention to the custom CSS animations defined in the `<style>` block and convert them to `tailwind.config` or CSS variables appropriately if needed by Tailwind v4.

## Suggested Tech Stack
- React, Next.js, Tailwind CSS v4
EOF

# 2. Accessibility
echo "Creating Issue 2..."
gh issue create \
  --title "[Accessibility] Complete Accessibility (a11y) Overhaul of the Landing Page" \
  --label "frontend,accessibility,medium" \
  --body-file - << 'EOF'
## Background/Context
Web accessibility is crucial to ensure all users, including those using assistive technologies, can use the Alien Protocol landing page.

## Problem Statement
The current landing page lacks proper accessibility semantics, `aria-labels`, and does not handle `prefers-reduced-motion`.

## Detailed Tasks Checklist
- [ ] Add semantic HTML tags (e.g., `<main>`, `<section>`, `<nav>`, `<form>`).
- [ ] Add appropriate `aria-labels` to the form inputs and buttons.
- [ ] Ensure the entire waitlist flow is navigable via keyboard (`Tab`, `Enter`).
- [ ] Improve the screen reader experience (especially around the typewriter effect).
- [ ] Detect and respect the `prefers-reduced-motion` media query by disabling or slowing down the `Starfield` canvas animation.

## Acceptance Criteria
- 100% Accessibility score on Google Lighthouse.
- The waitlist form can be successfully submitted using only a keyboard.
- Users with `prefers-reduced-motion` enabled do not see excessive animation.

## Suggested Tech Stack
- HTML5, React, ARIA
EOF

# 3. Global State
echo "Creating Issue 3..."
gh issue create \
  --title "[Frontend/State] Implement Global State Management for Notifications using Zustand" \
  --label "frontend,medium" \
  --body-file - << 'EOF'
## Background/Context
Currently, success and error messages for the waitlist form are managed via local React state (`useState`) within the page component.

## Problem Statement
As the application grows, passing notification state down as props or managing it locally becomes cumbersome. We need a scalable global notification system.

## Detailed Tasks Checklist
- [ ] Integrate the `zustand` library.
- [ ] Create a global UI store for notifications (e.g., `useToastStore`).
- [ ] Implement a centralized, globally positioned `Toast` or `Notification` component in `app/layout.tsx`.
- [ ] Replace the local `setError` and `setSubmitted` logic in the form with global toast triggers.

## Acceptance Criteria
- `zustand` is installed and a store is configured.
- Notifications can be triggered from any component without prop-drilling.
- UI successfully displays toast notifications for both success and error states.

## Suggested Tech Stack
- Zustand, React
EOF

# 4. Performance OffscreenCanvas
echo "Creating Issue 4..."
gh issue create \
  --title "[Performance] Optimize Starfield Canvas Animation with Web Workers (OffscreenCanvas)" \
  --label "frontend,performance,hard" \
  --body-file - << 'EOF'
## Background/Context
The `Starfield` component currently runs its animation loop on the main browser thread.

## Problem Statement
Heavy canvas animations on the main thread can block UI updates, causing jank on lower-end devices or when React is rendering heavily.

## Detailed Tasks Checklist
- [ ] Migrate the canvas rendering and math logic out of the main component and into a dedicated Web Worker file.
- [ ] Utilize the `OffscreenCanvas` API to allow the worker to draw directly to the canvas.
- [ ] Implement message passing between the main thread and the worker for initialization and resizing.
- [ ] Eliminate main-thread rendering bottlenecks while maintaining the exact visual quality of the animation.

## Acceptance Criteria
- The Starfield animation runs entirely in a Web Worker.
- Main thread blocking time is significantly reduced (verifiable via Chrome DevTools Performance tab).

## Suggested Tech Stack
- Web Workers API, OffscreenCanvas, React
EOF

# 5. Performance/SEO
echo "Creating Issue 5..."
gh issue create \
  --title "[Performance/SEO] Implement Next.js Dynamic Imports and Advanced Metadata" \
  --label "frontend,performance,medium" \
  --body-file - << 'EOF'
## Background/Context
Initial load time and Search Engine Optimization (SEO) are vital for the protocol's discoverability.

## Problem Statement
All components are currently bundled together, and the application lacks comprehensive metadata.

## Detailed Tasks Checklist
- [ ] Use `next/dynamic` to lazy-load non-critical components (e.g., the `Starfield` canvas).
- [ ] Add comprehensive Open Graph (OG) metadata to `app/layout.tsx`.
- [ ] Add Twitter Card metadata.
- [ ] Implement JSON-LD structured data representing the project.
- [ ] Configure automatic generation of `sitemap.xml`.
- [ ] Configure automatic generation of `robots.txt`.

## Acceptance Criteria
- Lighthouse SEO score is 100%.
- `sitemap.xml` and `robots.txt` are accessible and correctly formatted.
- Social sharing previews (OG/Twitter) are successfully populated with data.

## Suggested Tech Stack
- Next.js Metadata API, React
EOF

# 6. Backend Rate Limiting
echo "Creating Issue 6..."
gh issue create \
  --title "[Backend & Security] Implement Rate Limiting and Turnstile for Waitlist API" \
  --label "backend,security,medium" \
  --body-file - << 'EOF'
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
EOF

# 7. Zod Validation
echo "Creating Issue 7..."
gh issue create \
  --title "[Backend/Validation] Implement Strict API Input Validation with Zod" \
  --label "backend,security,medium" \
  --body-file - << 'EOF'
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
EOF

# 8. Webhooks
echo "Creating Issue 8..."
gh issue create \
  --title "[Backend/Webhooks] Implement Resend Webhook Handler for Email Bounce Tracking" \
  --label "backend,medium" \
  --body-file - << 'EOF'
## Background/Context
We use Resend to send confirmation emails. It's critical to track email deliverability to protect domain reputation.

## Problem Statement
We currently do not track if emails bounce or if users complain.

## Detailed Tasks Checklist
- [ ] Create a new Next.js webhook endpoint (e.g., `/api/webhooks/resend`).
- [ ] Verify incoming webhook signatures using the `svix` library to ensure they originate from Resend.
- [ ] Parse and process `email.bounced` events.
- [ ] Parse and process `email.complained` events.
- [ ] Log or update internal records when these events occur.

## Acceptance Criteria
- Webhook endpoint successfully accepts and verifies valid Resend webhooks.
- Invalid or spoofed webhooks are rejected with a `401 Unauthorized`.
- Bounce and complaint events are correctly parsed.

## Suggested Tech Stack
- Next.js API Routes, Svix, Resend
EOF

# 9. Database ORM
echo "Creating Issue 9..."
gh issue create \
  --title "[Database & ORM] Migrate Waitlist Storage to PostgreSQL using Prisma/Drizzle" \
  --label "backend,database,medium" \
  --body-file - << 'EOF'
## Background/Context
Currently, waitlist information is either only sent via email or mocked. 

## Problem Statement
We need a persistent, relational database to securely store user data for the long term.

## Detailed Tasks Checklist
- [ ] Add a `docker-compose.yml` file to spin up a local PostgreSQL instance for development.
- [ ] Install and configure Prisma ORM (or Drizzle ORM).
- [ ] Create a `WaitlistUser` model with fields like `email`, `createdAt`, `status`, etc.
- [ ] Generate the database client.
- [ ] Update the `/api/notify` backend route to save the email into the database.
- [ ] Gracefully handle duplicate email constraints (e.g., if a user signs up twice, do not crash; return a polite success or specific message).

## Acceptance Criteria
- Developers can spin up the DB using `docker compose up`.
- Waitlist signups successfully write a record to PostgreSQL.
- Duplicate email signups are handled without throwing unhandled server errors.

## Suggested Tech Stack
- PostgreSQL, Docker, Prisma / Drizzle ORM
EOF

# 10. Monorepo
echo "Creating Issue 10..."
gh issue create \
  --title "[Architecture] Implement a Monorepo Structure using Turborepo" \
  --label "devops,hard" \
  --body-file - << 'EOF'
## Background/Context
Alien Protocol will eventually involve smart contracts, an SDK, and multiple frontend apps.

## Problem Statement
A single Next.js directory will not scale. We need a workspace setup to share code and tooling.

## Detailed Tasks Checklist
- [ ] Convert the existing project root into a Turborepo workspace.
- [ ] Move the Next.js application into a new `apps/web` directory.
- [ ] Create a `packages/ui` directory for shared React components (if applicable).
- [ ] Configure `turbo.json` with appropriate build, lint, and dev pipelines.
- [ ] Ensure that TypeScript typing, ESLint, and Prettier run correctly across the entire workspace.

## Acceptance Criteria
- Running `npm run dev` at the root uses Turbo to spin up the web app.
- Code can be successfully built using the new workspace structure.
- CI pipelines can successfully cache builds using Turbo.

## Suggested Tech Stack
- Turborepo, npm/pnpm workspaces, Next.js
EOF

# 11. Testing Playwright
echo "Creating Issue 11..."
gh issue create \
  --title "[Testing] Set up Playwright for E2E Testing and CI Integration" \
  --label "testing,devops,medium" \
  --body-file - << 'EOF'
## Background/Context
We need automated assurances that critical user paths (like joining the waitlist) function correctly.

## Problem Statement
The project currently lacks End-to-End (E2E) testing.

## Detailed Tasks Checklist
- [ ] Install and configure Playwright.
- [ ] Write a test for a successful waitlist signup flow.
- [ ] Write a test asserting that invalid emails display correct validation messages.
- [ ] Write a test that simulates an API failure and verifies the error UI.
- [ ] Enable headless execution and create a GitHub Actions workflow to run Playwright tests on PRs.

## Acceptance Criteria
- Playwright tests run successfully locally.
- GitHub Actions workflow automatically runs and passes the E2E suite on pull requests.

## Suggested Tech Stack
- Playwright, GitHub Actions
EOF

# 12. DevOps Release
echo "Creating Issue 12..."
gh issue create \
  --title "[DevOps] Implement Automated Semantic Versioning and Release Generation" \
  --label "devops,medium" \
  --body-file - << 'EOF'
## Background/Context
Manually versioning software and writing changelogs is error-prone and time-consuming.

## Problem Statement
We need an automated release pipeline based on commit messages.

## Detailed Tasks Checklist
- [ ] Configure `semantic-release` (or standard-version) in the repository.
- [ ] Add documentation/enforcement for using Conventional Commits.
- [ ] Create a GitHub Actions workflow that runs on push to the `main` branch.
- [ ] Ensure the workflow automatically generates a `CHANGELOG.md` and creates a GitHub Release with the correct SemVer tag (major/minor/patch).

## Acceptance Criteria
- Pushing a commit formatted as `feat: new thing` automatically triggers a minor release.
- Pushing a commit formatted as `fix: bug` automatically triggers a patch release.
- `CHANGELOG.md` is populated automatically.

## Suggested Tech Stack
- Semantic Release, GitHub Actions, Conventional Commits
EOF

# 13. Web3 Wallet
echo "Creating Issue 13..."
gh issue create \
  --title "[Web3] Integrate Stellar Wallet Connection (Freighter) and Auth Flow" \
  --label "frontend,web3,hard" \
  --body-file - << 'EOF'
## Background/Context
Alien Protocol is natively built on Stellar. Users must authenticate via their crypto wallets.

## Problem Statement
We currently only collect emails. We need to actually integrate with the Stellar network.

## Detailed Tasks Checklist
- [ ] Integrate the `@stellar/freighter-api` or a generic Stellar wallet connector.
- [ ] Implement robust wallet connection state management (connected, disconnected, loading).
- [ ] Add a "Connect Wallet" UI button to the landing page.
- [ ] Implement a cryptographic nonce signing verification flow (the user signs a message to prove ownership of the public key).

## Acceptance Criteria
- A user can click "Connect", authorize via the Freighter extension, and see their public key displayed in the UI.
- A user can successfully sign a message returning a valid signature payload.

## Suggested Tech Stack
- Stellar SDK, Freighter API, React
EOF

# 14. Smart Contracts
echo "Creating Issue 14..."
gh issue create \
  --title "[Smart Contracts] Scaffold Soroban Smart Contract for Username Registry" \
  --label "web3,hard" \
  --body-file - << 'EOF'
## Background/Context
The core functionality of Alien Protocol relies on on-chain username registries on Stellar's smart contract platform, Soroban.

## Problem Statement
We need the initial Rust smart contract foundation.

## Detailed Tasks Checklist
- [ ] Initialize a standard Soroban contract project using Rust.
- [ ] Implement the core `UsernameRegistry` contract.
- [ ] Write logic to bind a hashed username to a Stellar address.
- [ ] Implement strict checks to prevent duplicate username registrations.
- [ ] Add comprehensive Rust unit tests demonstrating the registration flow and error cases.

## Acceptance Criteria
- The contract compiles successfully (`soroban contract build`).
- `cargo test` passes all unit tests, specifically proving duplicates are rejected.

## Suggested Tech Stack
- Rust, Soroban SDK, Stellar
EOF

# 15. ZK PoC
echo "Creating Issue 15..."
gh issue create \
  --title "[Cryptography/ZK] PoC: Zero-Knowledge Circuit for Username Commitment" \
  --label "cryptography,hard" \
  --body-file - << 'EOF'
## Background/Context
To ensure privacy, users will register a "commitment" (hash) on-chain rather than plaintext usernames. They will use Zero-Knowledge proofs to prove ownership.

## Problem Statement
We need the fundamental cryptographic circuit to prove knowledge of a preimage.

## Detailed Tasks Checklist
- [ ] Create a basic Zero-Knowledge circuit using Circom (or Noir).
- [ ] The circuit must mathematically prove knowledge of a username preimage that hashes to a public commitment.
- [ ] Ensure the username remains a completely private input.
- [ ] Create compilation scripts to generate the proving and verification keys.
- [ ] Add a TypeScript test suite using `snarkjs` to generate a proof and verify it against the circuit.

## Acceptance Criteria
- The circuit compiles successfully.
- The TS test suite can generate a valid proof and successfully verify it.
- Invalid preimages cause the verification to explicitly fail.

## Suggested Tech Stack
- Circom / Noir, SnarkJS, TypeScript
EOF

echo "All 15 GitHub Issues have been created successfully!"
