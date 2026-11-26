# PSMS — Private Sector Management System

A system for private healthcare institutions, including doctor clinics, laboratories, pharmacies and nurse clinics.

## Current application structure

- `index.html`: Firebase authentication and role-based routing. Active cardiologists use the recovered original clinical dashboard; other doctor specialties use the unified workspace, and non-doctor roles retain their individual dashboards.
- `doctor-workspace.html`: shared doctor interface, patient directory and consultation workflow.
- `assets/doctor-workspace.css`: responsive workspace styling.
- `assets/doctor-workspace.js`: doctor account verification, patient records, consultation handling and UI state.
- `assets/firebase-config.js`: shared Firebase configuration used by login and the new workspace.
- `psms-logo.svg`: shared brand mark.
- `data-analytics.html`: clinical analytics for an authenticated doctor, with compatibility for both older visit date fields.
- The original cardiology dashboard and the History → Cardiology Physical Examination → Investigation → Cardiology Treatment workflow have been recovered from the July 16, 2025 Netlify deployment. The original printable summary card is also restored.
- Original structured clinical record fields are retained, with read compatibility for the temporary flat records.
- Other existing specialty dashboards remain available as a fallback.

## Data compatibility

No Firestore data migration is required. Patient records remain at
`artifacts/{appId}/doctors/{doctorUid}/patients/{patientId}`.
Received consultations remain at
`artifacts/{appId}/doctors/{recipientUid}/received_consults`.
Doctor profiles remain at `artifacts/{appId}/public/data/doctors/{doctorUid}`.

The workspace supports both `lastVisit` and `lastVisitDate`. It chooses the latest valid date for display and only synchronizes the two fields when that date is explicitly changed. The `history` and `medicalHistory` fields are kept separate, and edits update only changed fields. Unknown fields are not removed.

## Deployment and access

This remains a static application hosted by Netlify with Firebase Authentication and Firestore. No new build step or database dependency was introduced.

The new dashboard checks the authenticated doctor's profile, renders dynamic user content as text, and retains the old dashboard link for comparison. Client-side checks do not replace Firestore Security Rules. Verify deployed rules enforce active accounts, patient ownership, and authorized consultation delivery; do not use real patient information until that review and live acceptance testing are complete.

To test the rollout, sign in with a test doctor account, verify records, create/edit a synthetic patient, test the referral recipient selection, and confirm that non-doctor accounts still use their existing dashboards.
