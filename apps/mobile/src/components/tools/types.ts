import type { Rode } from '@/components/rode-out';

export interface ToolProps {
  /** finish the tool: a calm move on today's log, then back to SOS or closed (see useFinishTool) */
  finish: (id: string, o?: { msg?: string; reach?: boolean; noCalm?: boolean }) => void;
  /** leave without finishing: back to SOS, or closed */
  exit: () => void;
  /** started from SOS */
  sos: boolean;
  /** the second half of a "then bed" pair */
  combo: boolean;
  /** the flame's level, for the art */
  level: number;
  /** an urge ridden out in this tool (the pause's It passed): the tool's screen becomes the one celebration (rode-out.tsx) */
  won?: (w: Rode) => void;
}
