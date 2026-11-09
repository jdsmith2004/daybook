/* Screen Time (docs/plan.md, "Screen Time"). The pause's look over a resting app: the flame, the words from core pullShield, the night sky.
   The flame is Assets.xcassets/flame.imageset, kept by hand at 60 points (1x, 2x, 3x): the extension has little memory, so never
   the full 1024 image. Built only when DAYBOOK_PULL=1 (app.config.js), since it needs Apple's Family Controls entitlement. */
/** @type {import('@bacons/apple-targets/app.plugin').ConfigFunction} */
module.exports = (config) => ({
  type: 'shield-config',
  bundleIdentifier: '.ShieldConfiguration',
  deploymentTarget: '16.0',
  entitlements: {
    'com.apple.developer.family-controls': true,
    'com.apple.security.application-groups': config.ios.entitlements['com.apple.security.application-groups'],
  },
});
