/* the name of a simulator picture of one app path in one look (made by shots-ios.ts, used by shots.ts) */
export const screenFile = (screen: string, theme?: string) =>
  `${theme === 'dark' ? 'dark' : 'light'}-${
    screen
      .replace(/^\//, '')
      .replace(/[^a-z0-9]+/gi, '-')
      .replace(/-$/, '') || 'today'
  }.png`;
