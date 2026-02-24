# VisionAstra Hackathon Management System

React + Tailwind frontend with Firebase-ready backend services.

## Tech Stack
- Frontend: React.js + Tailwind CSS + React Router
- Backend: Firebase (Auth + Firestore + Storage)
- Current local mode: localStorage mock data for full workflow testing until Firebase credentials are added

## Run
```bash
npm install
npm run dev
```

## Default Admin (Mock Mode)
- Email: `admin@visionastra.edu`
- Password: `Admin@123`

## Environment Setup
1. Copy `.env.example` to `.env`.
2. Fill all `VITE_FIREBASE_*` fields.
3. Restart `npm run dev`.

## Implemented Modules
- Student registration with OTP flow (dev OTP preview) + captcha
- Student login + admin login + role-based route protection
- Team creation and join request flow
- Team rules: min 2, max 4, lock/unlock
- Problem statement upload/assignment + open innovation selection
- Round management (R1/R2 activation and deadlines)
- R1 submission (PDF metadata), R2 submission (GitHub link)
- Admin evaluation and editable marks
- Profile marks visibility for students
- Certificate generation and print/download view
- Admin metrics and marks verification table export (CSV)
- Admin notification queue UI (for email integration)

## Firebase Migration Notes
The app is currently wired with Firebase wrappers in `src/firebase/*`.

To fully switch to Firebase:
1. Replace `mockDb` operations with Firestore/Storage calls in dashboards/context.
2. Implement OTP/email workflow using Firebase Auth + Cloud Functions (for strict OTP mail verification).
3. Enforce security in Firestore rules.
4. Use Firebase Storage for R1 PDF uploads.
5. Use Cloud Functions for certificate PDF generation + email dispatch.

## Suggested Firestore Collections
- `users/{userId}`
- `teams/{teamId}`
- `joinRequests/{requestId}`
- `problemStatements/{problemId}`
- `roundSettings/{roundId}`
- `submissions/{submissionId}`
- `marks/{teamId}`
- `certificates/{certificateId}`
- `notifications/{notificationId}`
