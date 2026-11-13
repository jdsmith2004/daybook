/* app.json holds the app's settings. This only lets the web build live under a path: the free preview on GitHub Pages is
   served from /daybook, so its build sets EXPO_BASE_URL=/daybook. Left unset, the app sits at the root (the AWS site).

   Screen Time (docs/plan.md, "Screen Time"): a build made with DAYBOOK_PULL=1 gets Apple's Family Controls entitlement, the App
   Group the extensions share, the three extensions in targets/ (@bacons/apple-targets), and DaybookPull in Info.plist, which turns
   the native module on (modules/daybook-pull). Without it nothing changes, so a store build cannot ask for an entitlement Apple has
   not granted yet: until Apple approves the distribution request, only a development build on the owner's own iPhone has it.
   APPLE_TEAM_ID is the team the extensions are signed with (Xcode shows it under Signing). */
const PULL = process.env.DAYBOOK_PULL === '1';
/* The scripture library (docs/review-plan.md, D9) is the owner's own: only a build made with DAYBOOK_SCRIPTURE=1 sets
   DaybookScripture in Info.plist, which turns modules/scripture-vault on. A store build never has it, so nobody else sees it. */
const SCRIPTURE = process.env.DAYBOOK_SCRIPTURE === '1';
const GROUP = 'group.com.jdsmith2004.daybook';

module.exports = ({ config }) => {
  const base = {
    ...config,
    experiments: { ...config.experiments, baseUrl: process.env.EXPO_BASE_URL || '' },
  };
  const out = SCRIPTURE ? { ...base, ios: { ...base.ios, infoPlist: { ...base.ios?.infoPlist, DaybookScripture: true } } } : base;
  if (!PULL) return out;
  return {
    ...out,
    ios: {
      ...out.ios,
      ...(process.env.APPLE_TEAM_ID ? { appleTeamId: process.env.APPLE_TEAM_ID } : {}),
      entitlements: {
        ...out.ios?.entitlements,
        'com.apple.developer.family-controls': true,
        'com.apple.security.application-groups': [GROUP],
      },
      infoPlist: { ...out.ios?.infoPlist, DaybookPull: true },
    },
    plugins: [...(out.plugins || []), '@bacons/apple-targets'],
  };
};
