# CineScope — The Living Archive

<div align="center">

[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vite.dev/)
[![Firebase](https://img.shields.io/badge/Firebase-v12-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Vitest](https://img.shields.io/badge/Tested%20with-Vitest%20%26%20Playwright-6E9F18?style=for-the-badge&logo=vitest&logoColor=white)](https://vitest.dev/)

**A cinematic React archive for exploring cinema, television, and creators through TMDB with deterministic natural-language discovery, local-first library tracking, and private cloud synchronization.**

[Key Features](#key-features) • [System Architecture](#system-architecture) • [Getting Started](#getting-started) • [Firebase Setup](#firebase-setup) • [Validation & Quality](#validation--quality-gates) • [Documentation](#documentation-index)

</div>

---

## Overview

**CineScope** is an editorial, high-performance web archive for film and television enthusiasts. Built as a local-first single-page application with React 19, TypeScript, and Vite, CineScope blends cinematic aesthetics with rigorous privacy and accessibility boundaries.

Visitors can explore detailed catalogues, run multi-type searches or natural-language viewing queries, and manage a rich local collection without an account. Authenticated members can synchronize watchlists, watched history, ratings, episode checkpoints, and discovery preferences seamlessly across devices using Firebase Authentication and Cloud Firestore.

---

## Key Features

### 🎬 Cinematic Discovery & Registers
- **Living Archive Homepage**: Features an editorial projection hero, curated spotlight reels, genre-specific discovery shelves, and temporal cinema maps.
- **Detailed Media Records**: Full film and television dossiers with cast/crew registries, trailers and video showcases, streaming availability via JustWatch/TMDB, and chronological release data.
- **Television Seasons & Episodes**: Deep season breakdowns and individual episode records with comprehensive runtimes, air dates, and overview summaries.
- **Creator Profiles**: Dedicated contributor archives highlighting biographies, known departments, and chronological credit timelines across both film and television.

### 🧠 Intent-Based Catalogue Search
- **Natural-Language Understanding**: Translates conversational queries (e.g., *"moody 90s sci-fi thriller"*, *"acclaimed 2010s french drama"*, *"lighthearted animated adventure"*) into explicit, editable TMDB Discover filters.
- **Deterministic & Explainable**: Operates entirely client-side through deterministic vocabulary parsing—**no user prompts or search queries are transmitted to third-party generative AI services**.
- **Inspectable Signal Badges**: Highlights matching signals (genres, decades, moods, certifications) directly in the UI with instant one-click adjustments.

### 💾 Local-First & Cloud-Synced Library
- **Comprehensive Tracking**: Track titles across **Saved (Watchlist)**, **Watched History**, and **Favorites**, complemented by customizable 1–10 star ratings.
- **Granular TV Episode Checkpoints**: Mark individual episodes as watched with automatic season completion percentages and continue-watching rollups.
- **Zero-Friction Offline Access**: All library interactions, preferences, and episode states write immediately to browser storage (`localStorage`), ensuring instant responsiveness and full offline capability.
- **Seamless Cloud Sync**: Signing in reconciles guest records with Cloud Firestore using update timestamps and gracefully handles network dropouts with manual retry options.

### 🎯 Tailored Archive Recommendations
- **Dynamic Multi-Signal Ranking**: Blends user discovery preferences (favorite genres, preferred medium, original language), TV viewing progress, and current session mood into a personalized yet diverse catalogue.
- **Feedback & Privacy**: Bounded "Not Interested" dismissal signals keep recommendations fresh. Feedback persists locally first before syncing to Firestore.

### 🔒 Account Lifecycle & Member Privacy
- **Secure Authentication**: Firebase Email/Password authentication with email verification workflows and in-session password updates with mandatory reauthentication.
- **Data Portability**: Download a versioned JSON export of your complete archive history, preferences, and progress at any time.
- **GDPR-Compliant Deletion**: Permanent account removal triggers an authenticated Cloud Function (`deleteAccount`) that recursively scrubs the member's Firestore document tree, deletes the Firebase Auth identity, and purges local storage.

### ⚡ Performance & Accessibility by Design
- **Strict WCAG Compliance**: Full keyboard navigation, skip-to-content links, live screen-reader route announcements, accessible contrast ratios, and reduced-motion considerations.
- **Enforced Build Budgets**: Automated checks ensure initial bundles, deferred Firebase vendor chunks, and lazy-loaded routes stay strictly within defined raw and gzip thresholds.

---

## System Architecture

CineScope enforces a strict security boundary: the browser never receives TMDB API keys, Firebase Admin credentials, or sensitive server secrets.

```mermaid
flowchart TD
    subgraph Client["Browser (React 19 SPA)"]
        UI["CineScope App Shell"]
        LocalStore[("Local Archive\n(localStorage)")]
        UI <--> LocalStore
    end

    subgraph Hosting["Firebase Hosting (CDN)"]
        H_Rewrites["Rewrite Rules\n& Security Headers"]
    end

    subgraph Functions["Cloud Functions (Node.js)"]
        TMDB_Proxy["tmdbApi Proxy\n(/api/tmdb/**)"]
        Acc_Delete["deleteAccount Callable"]
    end

    subgraph External["External Services"]
        TMDB["TMDB API\n(api.themoviedb.org)"]
        SecretMgr[("Google Secret Manager\nTMDB_READ_ACCESS_TOKEN")]
    end

    subgraph FirebaseServices["Managed Firebase"]
        FirebaseAuth["Firebase Authentication"]
        Firestore[("Cloud Firestore\n(users/{uid}/...)")]
    end

    %% Client communication
    UI -->|Page Load & Static Assets| H_Rewrites
    UI -->|Catalogue Requests /api/tmdb/**| H_Rewrites
    H_Rewrites -->|Forward API Traffic| TMDB_Proxy

    %% Functions & Secrets
    TMDB_Proxy --- SecretMgr
    TMDB_Proxy -->|Authorized Request| TMDB

    %% User Data
    UI -->|Direct SDK (Auth)| FirebaseAuth
    UI -->|Direct SDK (Owner Rules)| Firestore
    UI -->|Account Purge| Acc_Delete
    Acc_Delete -->|Recursive Delete| Firestore
    Acc_Delete -->|Revoke Identity| FirebaseAuth
```

### Key Architectural Boundaries

1. **TMDB Gateway**: All TMDB requests pass through `/api/tmdb/**`, proxied by the `tmdbApi` Cloud Function. The function enforces strict route allowlists, parameter constraints, caching headers, upstream timeouts, and normalized error responses.
2. **Database Isolation**: Firestore records reside under `users/{uid}/library`, `users/{uid}/preferences/discovery`, and `users/{uid}/preferences/recommendations`. Strict Firestore Security Rules permit users to access only their own records and reject unexpected or malformed schema keys.
3. **No Parallel Identity**: CineScope avoids custom JWT schemes, delegating session management and cryptographic token verification entirely to Firebase Authentication.

---

## Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend Framework** | [React 19](https://react.dev/), [TypeScript 5.8](https://www.typescriptlang.org/), [Vite 6](https://vite.dev/) |
| **Routing & Data Fetching** | [React Router v8](https://reactrouter.com/), [TanStack Query v5](https://tanstack.com/query) |
| **Styling & Design System** | [Tailwind CSS v4](https://tailwindcss.com/), Custom Design Tokens, Manrope & Instrument Serif typography |
| **Icons & Media** | [Lucide React](https://lucide.dev/), TMDB Images API, JustWatch Provider Badges |
| **Cloud & Backend** | [Cloud Functions for Firebase](https://firebase.google.com/docs/functions), [Cloud Firestore](https://firebase.google.com/docs/firestore), [Firebase Authentication](https://firebase.google.com/docs/auth), [Firebase Hosting](https://firebase.google.com/docs/hosting) |
| **Testing & Quality** | [Vitest](https://vitest.dev/), [React Testing Library](https://testing-library.com/), [Playwright](https://playwright.dev/) (Chromium E2E), [Firebase Emulator Suite](https://firebase.google.com/docs/emulator-suite) |
| **Linting & Audits** | [Oxlint](https://oxc.rs/) (with JSX A11y plugin), Custom Bundle Budget Analyzer, Security Boundary Scanner |

---

## Project Structure

```text
cinescope/
├── .github/workflows/       # Quality gates & Firebase deployment CI/CD
├── cloudflare/              # Edge rules & DNS configurations
├── docs/                    # Architecture, security, QA, and release specifications
├── functions/               # Firebase Cloud Functions (TypeScript)
│   ├── src/
│   │   ├── deleteAccount.ts # Authenticated recursive account purging
│   │   ├── index.ts         # Cloud Functions export manifest
│   │   └── tmdbApi.ts       # Secure TMDB proxy & allowlist engine
│   └── package.json
├── public/                  # Static assets, web manifest, favicon, brand badges
├── scripts/                 # Release verification, security checks, and build budget checkers
├── src/
│   ├── app/                 # Router configuration and React Query client provider
│   ├── components/          # Shared layout, feedback, metadata, and UI primitives
│   ├── config/              # Environment contracts and runtime validation
│   ├── features/            # Feature-sliced domain modules:
│   │   ├── auth/            # Sign-in, registration, password reset, guards
│   │   ├── discovery/       # Living Archive, cinema maps, recommendations
│   │   ├── library/         # Local/cloud library, TV episode progress
│   │   ├── movie-details/   # Film details, videos, credits, streaming providers
│   │   ├── person-details/  # Contributor bios and filmography registers
│   │   ├── preferences/     # User genre, medium, and language settings
│   │   ├── profile/         # Account management, JSON export, account deletion
│   │   ├── recommendations/ # Mood filters, recommendation engine, feedback
│   │   ├── search/          # Multi-type search & natural-language intent parser
│   │   ├── tv-details/      # Television show records and season navigation
│   │   ├── tv-episodes/     # Episode dossiers and watch tracking
│   │   └── tv-seasons/      # Season overviews and rollups
│   ├── lib/                 # TMDB API clients, image resolvers, metadata helpers
│   ├── pages/               # Legal, credits, accessibility, and 404 views
│   ├── styles/              # Design tokens and global CSS
│   ├── types/               # TMDB, domain, and application TypeScript types
│   └── main.tsx             # Application bootstrap entry point
├── firestore.rules          # Granular security rules for Cloud Firestore
├── firebase.json            # Emulators, functions, and hosting configuration
├── package.json             # Root dependencies and scripts
└── vite.config.ts           # Vite build pipeline and local dev proxies
```

---

## Getting Started

### Prerequisites

- **Node.js**: v22.0.0 or higher
- **Package Manager**: `npm` (included with Node.js)
- **TMDB API Key**: A read access token from [The Movie Database (TMDB)](https://www.themoviedb.org/documentation/api)
- **Firebase Account**: A Firebase project with Email/Password Authentication, Firestore, and Functions enabled
- **Java Runtime**: Java 21 or newer (required only when running the local Firebase Emulator Suite)

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/AshenRandira/cinescope.git
cd cinescope

# Install root dependencies
npm install

# Install Functions dependencies
npm ci --prefix functions
```

*(On Windows PowerShell, use `npm.cmd`)*

### 2. Configure Environment Variables

Create `.env.local` in the project root:

```bash
# macOS / Linux
cp .env.example .env.local

# Windows PowerShell
Copy-Item .env.example .env.local
```

Fill in your Firebase web app configuration in `.env.local`:

```ini
VITE_FIREBASE_API_KEY="your-api-key"
VITE_FIREBASE_AUTH_DOMAIN="your-project-id.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="your-project-id"
VITE_FIREBASE_STORAGE_BUCKET="your-project-id.firebasestorage.app"
VITE_FIREBASE_MESSAGING_SENDER_ID="your-sender-id"
VITE_FIREBASE_APP_ID="your-app-id"
```

Next, configure the local Cloud Functions secret for TMDB access:

```bash
# macOS / Linux
cp functions/.secret.local.example functions/.secret.local

# Windows PowerShell
Copy-Item functions/.secret.local.example functions/.secret.local
```

Add your TMDB bearer token inside `functions/.secret.local`:

```ini
TMDB_READ_ACCESS_TOKEN="your_tmdb_bearer_token_here"
```

> [!IMPORTANT]
> The TMDB read access token must **never** be placed in `.env.local` or client-exposed variables. The Vite dev server proxies `/api/tmdb/**` to the local Functions emulator, keeping the token server-side at all times.

### 3. Run the Development Environment

Start the local Cloud Functions proxy in your first terminal:

```bash
npm run dev:api
```

In a second terminal, launch the Vite development server:

```bash
npm run dev
```

Visit `http://localhost:5173` in your browser.

---

## Firebase Setup

### Deploying Firestore Rules & Functions

1. Log in and associate your Firebase project:
   ```bash
   npx firebase-tools login
   npx firebase-tools use --add
   ```
2. Deploy the security rules to Firestore:
   ```bash
   npx firebase-tools deploy --only firestore:rules
   ```
3. Set the production TMDB secret in Google Cloud Secret Manager:
   ```bash
   firebase functions:secrets:set TMDB_READ_ACCESS_TOKEN
   ```
4. Deploy the Cloud Functions:
   ```bash
   npx firebase-tools deploy --only functions
   ```

### Data Storage Architecture

- **Library Items**: `users/{uid}/library/{movie:id|tv:id}`
- **Episode Checkpoints**: Embedded bounded maps within corresponding TV library documents (eliminates N+1 collection reads).
- **Discovery Preferences**: `users/{uid}/preferences/discovery`
- **Recommendation Feedback**: `users/{uid}/preferences/recommendations`

---

## Validation & Quality Gates

CineScope enforces end-to-end type safety, high test coverage, strict bundle budgets, and accessibility compliance.

### Install Playwright Browsers (First Time Only)

```bash
npx playwright install chromium
```

### Script Reference

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts Vite local development server with HMR |
| `npm run dev:api` | Starts local Firebase Functions emulator for `/api/tmdb/**` proxy |
| `npm test` | Runs the Vitest test suite across unit & integration tests |
| `npm run test:watch` | Starts Vitest in interactive watch mode |
| `npm run test:coverage` | Generates detailed unit and component test coverage reports |
| `npm run test:functions` | Runs dedicated tests for Firebase Cloud Functions |
| `npm run test:e2e` | Builds in `e2e` mode and runs deterministic public Playwright tests |
| `npm run test:emulators` | Runs integration and authenticated tests against the Firebase Emulator Suite |
| `npm run test:api` | Runs fake TMDB proxy boundary tests against the Functions emulator |
| `npm run test:hosting` | Validates Firebase Hosting headers, rewrites, and CSP policies |
| `npm run lint` | Runs [Oxlint](https://oxc.rs/) with JSX A11y rules enabled (warnings treated as errors) |
| `npm run build` | Compiles TypeScript and builds production distribution (`dist/`) |
| `npm run build:functions`| Compiles TypeScript source files for Cloud Functions |
| `npm run check:bundle` | Validates asset chunks against raw and gzip size budgets |
| `npm run check:release` | Verifies metadata, web app manifest, legal routes, and required documents |
| `npm run check:client-security` | Scans client source tree to prevent credential leaks or direct TMDB calls |
| `npm run check:hosting` | Validates `firebase.json` headers, rewrites, and security policies |

---

## Continuous Integration & Deployment

The GitHub Actions workflow (`Quality gates`) triggers on pull requests targeting `develop` or `main` and on branch pushes:
- Executes on **Node.js 24** and **Java 21**.
- Validates linting, accessibility, type checking, and test coverage.
- Boots local Firebase emulators to test authenticated journeys, preference syncing, and account deletion.
- Audits production bundle budgets and security boundaries.

### Hosting & Production Releases

Production deployments to Firebase Hosting are protected and executed via manual dispatch workflows using GitHub OIDC with Google Workload Identity Federation:
- Every build generates immutable, hashed assets with long-term cache headers.
- Application shell (`index.html`) is served with `no-cache` to ensure instant updates.
- Pull requests can generate isolated, 7-day preview channels for verification.

---

## Documentation Index

For in-depth architectural and operational guides, consult the `docs/` repository:

| Guide | Description |
| :--- | :--- |
| 📐 [Architecture](docs/architecture.md) | High-level system structure, data flow, and frontend composition |
| 🔑 [Environment Variables & Secrets](docs/environment-variables.md) | Detailed breakdown of client and server configuration keys |
| 🔍 [Intent Search Specification](docs/intent-search.md) | Deterministic natural-language parsing rules and vocabulary taxonomy |
| 📚 [Library Data Model](docs/library-data-model.md) | Schema design for watchlists, watched history, ratings, and TV progress |
| ⚙️ [User Preferences](docs/user-preferences.md) | Discovery preference storage and synchronization rules |
| 💡 [Recommendation Engine](docs/recommendations.md) | Multi-signal re-ranking logic, mood weights, and feedback handling |
| 🛡️ [Account Security Boundary](docs/security/account-security.md) | Authentication guards, reauthentication rules, and account deletion flows |
| 🌐 [TMDB API Boundary](docs/security/tmdb-api-boundary.md) | Proxy architecture, parameter allowlists, caching, and rate limiting |
| ♿ [Performance & Accessibility](docs/performance-accessibility.md) | WCAG compliance checklists, audit results, and bundle size targets |
| 🧪 [Quality Assurance Matrix](docs/quality-assurance.md) | Testing strategy across unit, emulator, E2E, and manual QA |
| 🚀 [Firebase Hosting Operations](docs/deployment/firebase-hosting.md) | Preview channels, production deployment, CDN caching, and rollbacks |
| 🚨 [Incident Response Runbook](docs/operations/monitoring-and-incident-response.md) | Health checks, monitoring dashboards, error budgets, and alerting |
| 📋 [V1 Readiness Checklist](docs/release/v1-readiness.md) | Comprehensive checklist of remaining operator and release milestones |
| 📝 [Changelog](CHANGELOG.md) | Chronological log of notable additions, fixes, and security updates |

---

## TMDB Attribution

This product uses the TMDB API but is not endorsed or certified by TMDB.

<p align="left">
  <img src="public/branding/tmdb-logo.svg" alt="TMDB Logo" width="120" />
</p>

All film and television metadata, imagery, and contributor information are provided courtesy of [The Movie Database](https://www.themoviedb.org/).

---

## License

This project is licensed under the [MIT License](LICENSE).
