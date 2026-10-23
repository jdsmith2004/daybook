/* The Stripe key, read from AWS Systems Manager Parameter Store (a SecureString the owner puts there by hand, see
   docs/plan.md, "Payments"). Read once and kept while the function stays warm. Until the owner has put it there (or applied
   the bootstrap stack that lets the function read it), this gives null, and web tips answer "not set up yet"; it looks again
   after a few minutes. A standard parameter costs nothing. */
import { GetParameterCommand, SSMClient } from '@aws-sdk/client-ssm';

const AGAIN = 5 * 60_000;

export function ssmSecret(name: string, client = new SSMClient({})): () => Promise<string | null> {
  let value: string | null = null;
  let missedAt = 0;
  return async () => {
    if (value) return value;
    if (missedAt && Date.now() - missedAt < AGAIN) return null;
    try {
      const r = await client.send(new GetParameterCommand({ Name: name, WithDecryption: true }));
      value = r.Parameter?.Value?.trim() || null;
    } catch {
      value = null;
    }
    if (!value) missedAt = Date.now();
    return value;
  };
}
