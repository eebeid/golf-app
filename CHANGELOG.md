# Changelog

All notable changes to PinPlaced will be documented in this file.
Format: [Semantic Versioning](https://semver.org/) — `MAJOR.MINOR.PATCH`

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
