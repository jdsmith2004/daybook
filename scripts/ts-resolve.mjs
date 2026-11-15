/* Lets a script run packages/core straight from its TypeScript: core imports its files without an extension ('./lessons'), as the
   app's bundler and vitest allow, so this adds the .ts that Node needs. Used as: node --import ./scripts/ts-resolve.mjs <script> */
import { register } from 'node:module';

register(
  'data:text/javascript,' +
    encodeURIComponent(`
export async function resolve(spec, ctx, next) {
  try {
    return await next(spec, ctx);
  } catch (e) {
    if ((spec.startsWith('.') || spec.startsWith('/')) && !/\\.[cm]?[jt]s$/.test(spec)) return next(spec + '.ts', ctx);
    throw e;
  }
}`),
);
