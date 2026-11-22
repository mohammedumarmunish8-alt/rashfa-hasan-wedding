# Deploy and test Super Admin management

## Prerequisites
- Your Super Admin account must already have Firebase custom claims `admin: true` and `role: "super_admin"`.
- All other admin accounts should have `admin: true` and `role: "admin"`.
- Firebase CLI and a compatible Node.js version (Node 22 recommended).
- **Firebase Cloud Functions deployment generally requires the Blaze billing plan.** Check Firebase pricing before upgrading. GitHub Pages alone cannot run these backend functions.

## Deploy backend (run locally in the extracted project directory)
1. `npm install -g firebase-tools`
2. `firebase login`
3. `firebase use rashfa-hasan-wedding`
4. `cd functions` then `npm install` then `cd ..`
5. `firebase deploy --only functions`
6. If you have not already published the current Firestore rules, review them carefully before deploying: `firebase deploy --only firestore:rules`. Do not overwrite production rules without checking.

## Update GitHub Pages
Upload the public files and assets to the repository root. **Do not upload `functions/node_modules`, service-account credentials, or Firebase CLI login files.** The `functions/` source may be committed, but it does not run on GitHub Pages.

## Test
1. Sign out and back into `admin.html` to refresh the ID token.
2. Super Admin should see Manage Admins. Regular admins should not.
3. Click Refresh administrators and confirm the 4 accounts appear.
4. Test a role change on a test account. The account must sign out and back in to get its new claims.
5. Test that regular admins cannot call privileged functions (server denies requests).
6. Check RSVP and wishes as a guest and admin.

## Security notes
- Role changes are checked on the server using Firebase Auth custom claims, not trusted browser input.
- Firebase Console project owners and anyone holding service-account credentials remain privileged independently of this dashboard.
- For stronger protection, enable App Check, MFA, and rate limiting, and consider additional verification for admin role changes.
- Existing authentication tokens may retain old claims until expiry after revocation; for immediate lockout, implement token-revocation verification.
- Uploaded couple photo is visible to anyone with the public invitation link; confirm permission before sharing.
