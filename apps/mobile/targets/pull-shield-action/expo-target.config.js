/* Screen Time (docs/plan.md, "Screen Time"). The pause's two buttons: Open Daybook (its wait screen) and Close.
   Built only when DAYBOOK_PULL=1 (app.config.js), since it needs Apple's Family Controls entitlement. */
/** @type {import('@bacons/apple-targets/app.plugin').ConfigFunction} */
module.exports = (config) => ({
  type: 'shield-action',
  bundleIdentifier: '.ShieldAction',
  deploymentTarget: '16.0',
  entitlements: {
    'com.apple.developer.family-controls': true,
    'com.apple.security.application-groups': config.ios.entitlements['com.apple.security.application-groups'],
  },
});
