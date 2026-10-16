/* Closing the setup part way keeps the place, so opening it again picks up there (legacy ui.obKeep). New people see the setup
   first, once per launch; closing it shows the welcome page, which can open it again (legacy obAuto and ui.obShut). */
import type { SetupAnswers } from '@daybook/core';

export interface SetupFlow {
  redo: boolean;
  i: number;
  a: SetupAnswers;
  hg: number | 'skip' | null;
  keep: string[] | null;
  saved: boolean;
  changed: number;
}
export const setupKeep: { flow: SetupFlow | null; shut: boolean } = { flow: null, shut: false };
