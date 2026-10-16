/* The flame spirit for native screens. The legacy emblem is an SVG string made for the web, with CSS classes that animate it.
   react-native-svg draws the same shapes from the string; it ignores classes, so the native flame is still, and the size
   comes from the component instead of an inline style. */
import { Em } from './legacy/core.js';

/** locked: a form not reached yet, drawn faded (legacy Em.emblem with locked) */
export function emblemXml(level: number, locked = false): string {
  return Em.emblem(level, { still: true, locked })
    .replace(/ style="width:\d+px;height:\d+px"/, '')
    .replace(/ style="[^"]*"/g, '')
    .replace(/ class="[^"]*"/g, '')
    .replace(/ aria-hidden="true"/g, '')
    .replace(/ focusable="false"/g, '');
}

/** the ids in an emblem change on every call (em1, em2, ...). Tests compare emblems with the ids made the same. */
export const sameIds = (svg: string) => svg.replace(/\bem\d+/g, 'emX');
