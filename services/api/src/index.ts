/* The Lambda entry point. TABLE comes from Terraform (infra/app). */
import { DynamoStore } from './store';
import { makeHandler } from './sync';

const table = process.env.TABLE;
if (!table) throw new Error('TABLE is not set');

export const handler = makeHandler(new DynamoStore(table));
