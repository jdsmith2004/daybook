import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    /* the golden fixtures were made in Chicago time; days and hours must line up with them */
    env: { TZ: 'America/Chicago' },
    include: ['test/**/*.test.ts'],
  },
});
