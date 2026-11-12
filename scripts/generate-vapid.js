/**
 * VAPID Key Generator for Web Push Notifications
 * Run: node scripts/generate-vapid.js
 */

const webpush = require('web-push');

const vapidKeys = webpush.generateVAPIDKeys();

console.log('\\n🔑 VAPID Keys Generated Successfully!\\n');
console.log('Add these to your .env file:\\n');
console.log('PUSH_ENABLED=true');
console.log(`VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`);
console.log(`VAPID_PRIVATE_KEY=${vapidKeys.privateKey}`);
console.log('\\n✅ Done!\\n');
