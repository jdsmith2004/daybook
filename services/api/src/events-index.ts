/* The events Lambda's entry point. STREAM and CAPS come from Terraform (infra/app/events.tf); the stream, the bucket and
   this function's role are made by infra/bootstrap. */
import { FirehoseClient, PutRecordCommand } from '@aws-sdk/client-firehose';

import { makeEventsHandler } from './events';
import { DynamoPulseStore } from './pulse-store';

const stream = process.env.STREAM;
const caps = process.env.CAPS;
if (!stream || !caps) throw new Error('STREAM and CAPS must be set');

const fh = new FirehoseClient({});
const store = new DynamoPulseStore(caps);

export const handler = makeEventsHandler(
  async (lines) => void (await fh.send(new PutRecordCommand({ DeliveryStreamName: stream, Record: { Data: Buffer.from(lines, 'utf8') } }))),
  (day, max) => store.allow('events', day, max),
);
