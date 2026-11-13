/* The night pack's actions (core night-pack.ts, WP21): App Intents have to be compiled into the app itself, not into a module's
   pod, or Shortcuts never sees them. This copies NightPackIntents.swift into the app's folder at prebuild and adds it to the app
   target. It is in every iOS build: it needs no entitlement, and the actions do nothing until the person puts them in an
   automation. */
const fs = require('fs');
const path = require('path');
const { withDangerousMod, withXcodeProject, IOSConfig } = require('expo/config-plugins');

const FILE = 'NightPackIntents.swift';

module.exports = function withNightPack(config) {
  config = withDangerousMod(config, [
    'ios',
    (c) => {
      const name = IOSConfig.XcodeUtils.getProjectName(c.modRequest.projectRoot);
      fs.copyFileSync(path.join(__dirname, FILE), path.join(c.modRequest.platformProjectRoot, name, FILE));
      return c;
    },
  ]);
  return withXcodeProject(config, (c) => {
    const project = c.modResults;
    const name = IOSConfig.XcodeUtils.getProjectName(c.modRequest.projectRoot);
    if (!project.hasFile(name + '/' + FILE)) IOSConfig.XcodeUtils.addBuildSourceFileToGroup({ filepath: name + '/' + FILE, groupName: name, project });
    return c;
  });
};
