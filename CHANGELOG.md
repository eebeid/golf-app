# Changelog

All notable changes to PinPlaced will be documented in this file.
Format: [Semantic Versioning](https://semver.org/) — `MAJOR.MINOR.PATCH`

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

### [1.1.0] — Planned
- TBD based on user feedback

---

> To bump the version: update `src/lib/version.js` and `package.json`, add an entry here, commit, and tag `vX.Y.Z`.
