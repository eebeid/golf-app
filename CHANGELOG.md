# Changelog

All notable changes to PinPlaced will be documented in this file.
Format: [Semantic Versioning](https://semver.org/) — `MAJOR.MINOR.PATCH`

---

## [1.18.0] — 2026-04-27
### ⚙️ Admin Settings Refactor
- **Autonomous Components**: Systematically modularized the massive `admin/settings/page.js` orchestrator into autonomous, self-contained components (`BrandingSettingsTab`, `HistorySettings`, `ScheduleSettingsTab`, etc.).
- **Dead Code Removal**: Cleaned up hundreds of lines of legacy state management and deprecated helper functions, reducing the orchestrator purely to a navigation shell.
- **Score Clearing Fix**: Fixed the backend API route for erasing specific round scores by replacing legacy raw SQL with secure native Prisma queries, and corrected a frontend routing mismatch.
- **Shareable Leaderboards**: Added a convenient "Share Public Link" button to the top of the Leaderboard page utilizing the native Web Share API for easy texting and sharing.

## [1.17.0] — 2026-04-22
### ⛳ Handicap Management & Recaps
- **Batch GHIN Sync**: Added an admin endpoint and UI button to automatically pull and update USGA Handicap Indexes for all players on a tournament roster with a single click.
- **Individual GHIN Edits**: Enabled individual players to input their GHIN number and preview their auto-filled USGA Name and Index, even when global manual roster edits are disabled by the admin.
- **Smart Recap Dashboard**: Overhauled the Recap page to only process, calculate, and display analytical summaries for rounds that are officially completed (when all started players have finished 18 holes).


## [1.16.0] — 2026-04-22
### 🚀 Infrastructure & Deployment
- **AWS Lightsail Migration**: Automated Docker builds, schema pushes, and AWS container deployments via custom scripts.
- **Image Optimization**: Bypassed Next.js `<Image>` constraints in AWS containers to eliminate 400 errors across all UI icons and logos.
- **CSP Headers**: Relaxed Content Security Policies to ensure external assets (Google Maps, Analytics) load correctly in production.

### 🔒 Authentication & Security
- **Apple & Google Auth**: Hardened NextAuth flow to support multiple OAuth providers.
- **Account Linking**: Allowed users to sign in interchangeably between Apple and Google without OAuth linking errors.
- **Super Admin Controls**: Hardcoded fallback super-admin emails to ensure persistent administrative access.

### 💰 Monetization & Features
- **Beta Access**: Created a secret promo code system for early adopters to bypass Stripe paywalls.
- **Restaurant Management**: Fixed database constraints preventing the deletion of restaurants linked to dinner signups.

## [1.15.0] — 2026-04-08
- **GHIN Golfer Lookup**: Integrated GHIN API automation to automatically fetch and verify player handicap indexes via GHIN number.
- **Player Profile Photos**: Added support for uploading and displaying profile pictures for each golfer.
- **Player Profile Gallery**: New visual gallery at the bottom of the Players page showcasing all registered golfers with their photos.
- **Admin Settings**: Organized tournament settings into clearer categories (Visuals, Scoring, Features, Admin).

---

## [1.14.0] — 2026-03-31
- **Scramble Format**: Added support for Scramble tournaments, enabling team-based scoring instead of individual scores.
- **Rebranding**: Completed transition to "PinPlaced" branding across the entire application (logos, theme, icons).
- **App Store Preparation**: Integrated "Sign in with Apple" for iOS compliance and configured Capacitor for native mobile deployment.
- **Privacy & Terms**: Added formal Privacy Policy and Terms of Service pages.

---

## [1.13.0] — 2026-03-16
- **Player Details**: Added optional "Room Number" and "House Number" fields to player profiles
- **Scoring UX**: Automatically reset to Hole 1 when selecting/changing a player for score entry
- **Admin Improvements**: Enhanced player management with visibility of housing details
- **Stableford Fix**: Leaderboard now correctly toggles Stableford display based on tournament settings

---

## [1.12.0] — 2026-03-15
- **Printable Scorecards**: Added ability to generate and print physical scorecards for each round
- **Handicap Indicators**: Calculated strokes are automatically marked with dots (•) on printed cards
- **Group Printing**: Automatically groups players by tee time for efficient printing
- **Admin Integration**: Link added to the Scorecards section for easy access

---

## [1.11.0] — 2026-03-15
- **Overall Ryder Cup Mode**: Moved to top of settings and enhanced visibility
- **Game Format Refactor**: Renamed round-level "Ryder Cup" to "Match Play" for clarity
- **Sentry Update**: Migrated to `instrumentation-client.js` to resolve SDK deprecation warnings
- **Score Bug Fix**: Ensured scores are filtered by round to prevent "ghost" scores from previous rounds
- **UI Enhancements**: Added custom toggle switch styles for a more premium Feel
- **Deployment**: Optimized Docker build speed by excluding large local cache folders

---

## [1.9.0] — 2026-03-06
- **Page Visibility Toggles**: Admin controls over page access
- **Versions & Release Notes**: A new history page detailing updates
- **Deployment logic**: Docker & AWS Lightsail configuration updates

---

## [1.8.0] — 2026-03-05
- **Empty State Phrasing**: App-wide UI updates instructing players to contact the admin
- **Bug Fix**: Addressed NextAuth domain redirect loops under AWS instances

---

## [1.7.0] — 2026-03-04
- UI and functional updates to the Admin Settings Page

---

## [1.6.0] — 2026-03-03
- **Bug Fixes**: Resolved application build errors and JSX syntax bracket issues

---

## [1.5.0] — 2026-03-02
- **Tournament Stats**: Introduced statistics page (Most Eagles, Birdies, Pars, Bogies, etc.)
- **Pie Chart**: Overall tournament scoring distribution visualization
- **Format Options**: "Ryder Cup" game format added to settings

---

## [1.4.0] — 2026-02-28
- **Player Details**: Added Player Phone Number field tracking capability

---

## [1.3.0] — 2026-02-22
- **Bug Fixes**: Assorted local application build error resolutions

---

## [1.2.0] — 2026-02-21
- **Architecture**: Established base admin settings infrastructure

---

## [1.1.0] — 2026-02-18
- **Restaurant Enhancements**: Display Restaurant Payer Name
- **Payment Link**: Clickable link for restaurant bill payers
- **Split Cost**: Automated calculation and display for per-diner dining cost

---

## [1.0.0] — 2026-03-01 🎉 Initial Production Release

### 🚀 Deployed
- Live at [pinplaced.com](https://pinplaced.com) via AWS Lightsail Containers
- SSL certificate + custom domain (pinplaced.com, www.pinplaced.com)
- Google OAuth authentication
- Auto DB migrations on container startup (`prisma migrate deploy`)
- Prisma binary target fixed for Alpine Linux (`linux-musl-openssl-3.0.x`)

### ✨ Features
- **Tournaments** — Create and manage multiple golf tournaments
- **Players** — Register players with handicap index, phone number, and course handicaps
- **Courses** — Add and manage golf courses with hole-by-hole par/yardage data
- **Scoring** — Enter scores per hole with live leaderboard (Stableford & stroke play)
- **Schedule** — Round schedule with tee times
- **Accommodations** — Lodging management with:
  - Google Places search to auto-fill property details
  - Embedded Google Maps per location
  - Player-to-lodging assignment
  - Unit/room number support
- **Restaurants / Food** — Dining info with payer, payment link, split cost
- **Prizes** — Prize configuration and display
- **Photos** — Upload and view tournament gallery
- **Chat** — Tournament message board
- **Scorecards** — Scorecard image uploads
- **Highlights Feed** — Live birdie/eagle/streak feed on tournament home
- **Payment Info** — Venmo, PayPal, Zelle info displayed on home page
- **Spotify Jam** — QR code link to shared playlist
- **PinPlaced branding** — Custom favicon, logo, version badge

### 🐛 Bug Fixes
- Fixed tournament creation crash (duplicate Settings ID — was hardcoded `"tournament-settings"`)
- Fixed Highlights API 500 (was importing missing `courses.json` static file)
- Fixed Prisma engine mismatch on Alpine Linux in Docker

---

## Upcoming
- **Cloud Photo Uploads**: Direct integration with S3/R2 for more robust player photo storage.
- **Push Notifications**: Real-time alerts for score updates and announcements.

---

> To bump the version: update `package.json`, add an entry here, commit, and tag `vX.Y.Z`.

