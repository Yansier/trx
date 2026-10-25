const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');

const source = fs.readFileSync('dist/assets/js/safari-guide.js', 'utf8');
const context = { window: {}, document: { addEventListener() {} }, URL };
vm.createContext(context);
vm.runInContext(source, context);
const { detectEnvironment, toSafariScheme } = context.window.SafariGuide;

const UAS = {
  safari: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1',
  facebook: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 [FBAN/FBIOS;FBAV/480.0.0.0]',
  chrome: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 CriOS/130.0 Mobile/15E148 Safari/604.1',
  instagram: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Instagram 355.0',
  telegram: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Telegram/11.2 Mobile/15E148',
  ambiguous: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148',
  android: 'Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 Chrome/130.0 Mobile Safari/537.36',
  desktop: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/130.0 Safari/537.36'
};

function detect(ua, href = 'https://campaign.test/') { return detectEnvironment({ ua, href, protocol: 'https:', maxTouchPoints: 0 }); }

assert.equal(detect(UAS.safari).businessGuardRequired, false, 'iPhone Safari is allowed');
assert.equal(detect(UAS.safari, 'https://campaign.test/?fb_ad=1').facebookAcquisitionEligible, false, 'Safari + fb_ad never handoffs');
assert.equal(detect(UAS.safari, 'https://campaign.test/?fb_ad=1').businessGuardRequired, false, 'Safari + fb_ad stays allowed');
assert.equal(detect(UAS.facebook, 'https://campaign.test/?fb_ad=1&utm_source=x#offer').facebookAcquisitionEligible, true, 'Facebook iPhone ad is eligible');
assert.equal(detect(UAS.facebook).facebookAcquisitionEligible, false, 'Facebook without fb_ad does not handoff');
assert.equal(detect(UAS.facebook).businessGuardRequired, true, 'Facebook is guarded');
assert.equal(detect(UAS.chrome).businessGuardRequired, true, 'iOS Chrome is guarded');
assert.equal(detect(UAS.instagram, 'https://campaign.test/?fb_ad=1').facebookAcquisitionEligible, false, 'Instagram is not Facebook acquisition');
assert.equal(detect(UAS.instagram).businessGuardRequired, true, 'Instagram is guarded');
assert.equal(detect(UAS.telegram).businessGuardRequired, true, 'Explicit Telegram is guarded');
assert.equal(detect(UAS.ambiguous).businessGuardRequired, false, 'Ambiguous Safari-like iOS webview is allowed');
assert.equal(detect(UAS.android).businessGuardRequired, true, 'Android is guarded');
assert.equal(detect(UAS.desktop).businessGuardRequired, true, 'Desktop is guarded');
assert.equal(toSafariScheme('https://campaign.test/?fb_ad=1&utm_source=x#offer'), 'x-safari-https://campaign.test/?fb_ad=1&utm_source=x#offer', 'scheme preserves query and hash');

console.log('Safari guide: 14 assertions passed.');
