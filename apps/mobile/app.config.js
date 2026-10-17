/* app.json holds the app's settings. This only lets the web build live under a path: the free preview on GitHub Pages is
   served from /daybook, so its build sets EXPO_BASE_URL=/daybook. Left unset, the app sits at the root (the AWS site). */
module.exports = ({ config }) => ({
  ...config,
  experiments: { ...config.experiments, baseUrl: process.env.EXPO_BASE_URL || '' },
});
