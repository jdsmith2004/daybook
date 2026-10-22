/* The pulse Lambda's entry point. TABLE and OWNER come from Terraform (infra/app/pulse.tf). */
import { makePulseHandler } from './pulse';
import { DynamoPulseStore } from './pulse-store';

const table = process.env.TABLE;
if (!table) throw new Error('TABLE must be set');

export const handler = makePulseHandler(new DynamoPulseStore(table), process.env.OWNER || '');
