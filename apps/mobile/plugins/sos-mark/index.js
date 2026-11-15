/* The SOS word in the iPhone tab bar's glass circle (components/app-tabs.ios.tsx). It goes into the app's own asset catalog, so iOS
   draws it from the app itself when the bar is made. Loaded from JavaScript instead (a `src` icon), it arrived after the bar was
   built, and on iOS 27 the circle was never redrawn: it stayed empty on the owner's phone (November 14, 2026). The pictures are
   assets/images/sos-mark*.png, drawn as they are (never tinted). */
const fs = require('fs');
const path = require('path');
const { withDangerousMod, IOSConfig } = require('expo/config-plugins');

const NAME = 'SosMark';
const SIZES = [
  ['sos-mark.png', '1x'],
  ['sos-mark@2x.png', '2x'],
  ['sos-mark@3x.png', '3x'],
];

module.exports = function withSosMark(config) {
  return withDangerousMod(config, [
    'ios',
    (c) => {
      const app = IOSConfig.XcodeUtils.getProjectName(c.modRequest.projectRoot);
      const dir = path.join(c.modRequest.platformProjectRoot, app, 'Images.xcassets', NAME + '.imageset');
      fs.mkdirSync(dir, { recursive: true });
      for (const [file] of SIZES) fs.copyFileSync(path.join(c.modRequest.projectRoot, 'assets/images', file), path.join(dir, file));
      const contents = {
        images: SIZES.map(([filename, scale]) => ({ filename, idiom: 'universal', scale })),
        info: { author: 'xcode', version: 1 },
        properties: { 'template-rendering-intent': 'original' },
      };
      fs.writeFileSync(path.join(dir, 'Contents.json'), JSON.stringify(contents, null, 2) + '\n');
      return c;
    },
  ]);
};
