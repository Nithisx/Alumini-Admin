/**
 * This file is intentionally empty.
 *
 * Firebase Cloud Messaging background handling has been merged into the
 * VitePWA-managed service worker (src/sw.js). Having a separate SW at the
 * same scope (/) caused a push-subscription conflict and an infinite page-
 * refresh loop with VitePWA's autoUpdate mode.
 *
 * Any browser that still has the old firebase-messaging-sw.js registered will
 * receive this no-op version on its next update cycle and stop conflicting.
 */
