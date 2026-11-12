/* The morning set's link to Screen Time (app/morning.tsx, core morning-set.ts tonightLine). Until Screen Time's night waits are
   built (docs/plan.md, "The morning, not the moment", step 3), tonight's time is the person's own plan: "Phone down tonight at".
   The Screen Time work makes this say whether the night waits are on, and the morning page then names what waits. */
export function nightWaitsOn(): boolean {
  return false;
}
