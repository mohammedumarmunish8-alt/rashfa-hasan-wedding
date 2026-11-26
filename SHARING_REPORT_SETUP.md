# Invitation sharing report setup

1. Review and publish the included firestore.rules in Firebase Console > Firestore > Rules. Preserve any unrelated production rules.
2. Upload the updated public files including share-message.js, admin.js, admin.html, app.js and index.html to GitHub Pages. Wait for deployment.
3. Sign in as a regular admin, generate a test invitation and click Share on WhatsApp. The attempt is recorded before WhatsApp opens.
4. Sign in as Super Admin and refresh Invitation Sharing Report. Verify the guest, admin email and timestamp. Test search, dates and CSV export.
5. Confirm a regular admin cannot read invitationShares and guests cannot write it.

The report uses Firestore, not Cloud Functions, and can work on Spark within quotas. Existing Manage Admins functions still require deployment and generally Blaze. No past sharing attempts are available. Copying links or sharing outside the admin dashboard is not tracked. Logs are append-only for clients and represent attempts, not delivery or proof of sending. Admins can initiate multiple attempts. Keep guest information private.
