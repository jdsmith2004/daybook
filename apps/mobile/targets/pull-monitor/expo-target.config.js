/* Screen Time (docs/plan.md, "Screen Time"). The monitor: Apple wakes it at a threshold of use of the picked apps; it posts the flame's note or starts the pause.
   Built only when DAYBOOK_PULL=1 (app.config.js), since it needs Apple's Family Controls entitlement. */
/** @type {import('@bacons/apple-targets/app.plugin').ConfigFunction} */
module.exports = (config) => ({
  type: 'device-activity-monitor',
  bundleIdentifier: '.ActivityMonitor',
  deploymentTarget: '16.0',
  entitlements: {
    'com.apple.developer.family-controls': true,
    'com.apple.security.application-groups': config.ios.entitlements['com.apple.security.application-groups'],
  },
});
