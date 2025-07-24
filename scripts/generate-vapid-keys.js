// VAPID 키 생성 스크립트
// 실행: node scripts/generate-vapid-keys.js

const webpush = require('web-push');

// VAPID 키 생성
const vapidKeys = webpush.generateVAPIDKeys();

console.log('=== VAPID Keys Generated ===');
console.log('\n.env.local에 추가할 내용:\n');
console.log(`NEXT_PUBLIC_VAPID_PUBLIC_KEY="${vapidKeys.publicKey}"`);
console.log(`VAPID_PRIVATE_KEY="${vapidKeys.privateKey}"`);
console.log('\n주의: VAPID_PRIVATE_KEY는 절대 클라이언트에 노출되면 안됩니다!');
console.log('=========================');