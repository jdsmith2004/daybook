/* Setup answers. The questions, scores and goals are in the legacy core; the parts of the legacy setup that read the
   global Store are ported here as pure functions. */
export interface SetupAnswers {
  aim?: string;
  freq?: string;
  mins?: string;
  years?: string;
  tried?: string;
  when?: string[];
  [k: string]: unknown;
}

/** the goal the setup suggests (legacy obSuggest). About once a day or more, for years or after many tries:
    a clean run is a hard first goal, so step down first. */
export function obSuggest(a: SetupAnswers): string {
  if (a.aim === 'learn') return 'week';
  if ((a.freq === 'f3' || a.freq === 'f4') && (a.years === 'y2' || a.years === 'y3' || a.tried === 't2')) return 'step';
  if (a.aim === 'nights') return 'nights';
  if (a.aim === 'less') return 'less';
  if (a.aim === 'quit') return a.tried === 't0' ? 'week' : 'now';
  return (a.when || []).indexOf('late') >= 0 ? 'nights' : 'week';
}
