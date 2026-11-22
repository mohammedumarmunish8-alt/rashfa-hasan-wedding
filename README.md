# Rashfa & Hasan — Wedding Invitation

Pastel floral invitation for Fathima Rashfa and Hasan Zubair, Sunday **23 May 2027**, Indiana Convention Center, Mangaluru. Nikah 11:30 AM; reception 11:45 AM. Family should confirm all details before sharing.

## GitHub Pages demo (mobile friendly)
1. Create a public GitHub repository named `rashfa-hasan-wedding`.
2. Extract this ZIP and upload **the files inside**, with `index.html` at repository root. Never upload Firebase Admin SDK private keys.
3. Repository **Settings → Pages → Deploy from a branch → main → /(root) → Save**.
4. After Pages reports deployment complete, visit `https://YOUR-USERNAME.github.io/rashfa-hasan-wedding/` from your phone.
5. Admin page: append `admin.html` to the base URL. Sign in with the account assigned the Firebase `admin: true` custom claim.

## Features
Animated invitation, personalized guest links, countdown, maps, RSVP, moderated wishes, admin dashboard, included user-supplied Nasheed audio, one photo placeholder, WhatsApp sharing and social credits.

## Photo
The website currently has **one placeholder**. Add a permitted image at `assets/couple-photo.jpg` and update the `.photo-frame` markup in `index.html` to use an `<img>` element.

## Firebase and security
`firebase-config.js` contains **public Firebase web identifiers**, not private service-account credentials. The Firestore database is already configured for `rsvps` and `wishes` in the project; `firestore.rules` is a copy of the intended rules, **not automatically deployed by GitHub Pages**. Confirm the deployed Firestore rules match. Public forms currently allow unauthenticated submissions and require anti-spam/rate limiting and security testing before broad distribution. Only approved wishes should be visible to visitors. Do not include the `firebase-admin-setup` folder or private JSON keys in this repository.

## Hosting
GitHub Pages is a temporary demo host; the same static files can later be deployed to Netlify. Browser audio playback may require a tap. Test links, Firebase writes and mobile layouts after publishing.
