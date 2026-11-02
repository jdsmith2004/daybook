/* The pulse Lambda's entry point. TABLE, OWNER and FEEDBACK_TOPIC come from Terraform (infra/app/pulse.tf); the topic and
   the owner's email on it are made by infra/bootstrap. With no topic, feedback is only kept, and read on Stats. */
import { PublishCommand, SNSClient } from '@aws-sdk/client-sns';

import { makePulseHandler, type Mailer } from './pulse';
import { DynamoPulseStore } from './pulse-store';

const table = process.env.TABLE;
if (!table) throw new Error('TABLE must be set');

const topic = process.env.FEEDBACK_TOPIC;
const sns = topic ? new SNSClient({}) : null;
const mail: Mailer | null = sns ? async (Subject, Message) => void (await sns.send(new PublishCommand({ TopicArn: topic, Subject, Message }))) : null;

export const handler = makePulseHandler(new DynamoPulseStore(table), process.env.OWNER || '', Date.now, mail);
