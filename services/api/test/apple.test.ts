/* Checking an Apple tip with Apple's own verifier (src/apple.ts). Real App Store transactions cannot be made here, so the
   test makes its own three-certificate chain shaped like Apple's (the same marker extensions on the intermediate and the
   leaf), signs transactions with it, and checks them against that test root. Against Apple's real root, the same
   transactions are refused. The keys are made fresh in a temporary folder for each run and never kept. */
import { execFileSync } from 'node:child_process';
import { createHash, createPrivateKey, sign, X509Certificate } from 'node:crypto';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { appleVerifier, BUNDLE_ID, type AppleTip } from '../src/apple';
import { APPLE_ROOT_G3 } from '../src/apple-root';

let dir = '';
let root: Buffer;
let chain: string[] = [];
let leafKey: ReturnType<typeof createPrivateKey>;

function openssl(...args: string[]) {
  execFileSync('openssl', args, { cwd: dir, stdio: 'ignore' });
}
const der = (f: string) => new X509Certificate(readFileSync(join(dir, f))).raw;

beforeAll(() => {
  dir = mkdtempSync(join(tmpdir(), 'daybook-apple-'));
  writeFileSync(join(dir, 'int.ext'), 'basicConstraints=critical,CA:TRUE\nkeyUsage=critical,keyCertSign\n1.2.840.113635.100.6.2.1=ASN1:NULL\n');
  writeFileSync(join(dir, 'leaf.ext'), 'basicConstraints=critical,CA:FALSE\n1.2.840.113635.100.6.11.1=ASN1:NULL\n');
  for (const k of ['root', 'int', 'leaf']) openssl('ecparam', '-name', 'prime256v1', '-genkey', '-noout', '-out', k + '.key');
  openssl(
    'req',
    '-new',
    '-x509',
    '-key',
    'root.key',
    '-subj',
    '/CN=Test Root',
    '-days',
    '30',
    '-out',
    'root.pem',
    '-addext',
    'basicConstraints=critical,CA:TRUE',
  );
  openssl('req', '-new', '-key', 'int.key', '-subj', '/CN=Test Intermediate', '-out', 'int.csr');
  openssl(
    'x509',
    '-req',
    '-in',
    'int.csr',
    '-CA',
    'root.pem',
    '-CAkey',
    'root.key',
    '-set_serial',
    '2',
    '-days',
    '30',
    '-extfile',
    'int.ext',
    '-out',
    'int.pem',
  );
  openssl('req', '-new', '-key', 'leaf.key', '-subj', '/CN=Test Leaf', '-out', 'leaf.csr');
  openssl(
    'x509',
    '-req',
    '-in',
    'leaf.csr',
    '-CA',
    'int.pem',
    '-CAkey',
    'int.key',
    '-set_serial',
    '3',
    '-days',
    '30',
    '-extfile',
    'leaf.ext',
    '-out',
    'leaf.pem',
  );
  root = der('root.pem');
  chain = [der('leaf.pem'), der('int.pem'), root].map((b) => b.toString('base64'));
  leafKey = createPrivateKey(readFileSync(join(dir, 'leaf.key')));
});
afterAll(() => rmSync(dir, { recursive: true, force: true }));

const b64 = (o: unknown) => Buffer.from(JSON.stringify(o)).toString('base64url');
function jws(over: Record<string, unknown> = {}) {
  const now = Date.now();
  const payload = {
    transactionId: '2000000000000001',
    originalTransactionId: '2000000000000001',
    bundleId: BUNDLE_ID,
    productId: 'daybook.tip.generous',
    purchaseDate: now - 1000,
    originalPurchaseDate: now - 1000,
    quantity: 1,
    type: 'Non-Consumable',
    inAppOwnershipType: 'PURCHASED',
    signedDate: now,
    environment: 'Sandbox',
    transactionReason: 'PURCHASE',
    storefront: 'USA',
    storefrontId: '143441',
    price: 9990,
    currency: 'USD',
    ...over,
  };
  const head = b64({ alg: 'ES256', x5c: chain });
  const body = b64(payload);
  const sig = sign('sha256', Buffer.from(head + '.' + body), { key: leafKey, dsaEncoding: 'ieee-p1363' }).toString('base64url');
  return head + '.' + body + '.' + sig;
}

describe('an Apple tip', () => {
  it('the root in the code is Apple Root CA - G3', () => {
    const fp = createHash('sha256').update(APPLE_ROOT_G3).digest('hex').toUpperCase();
    expect(fp).toBe('63343ABFB89A6A03EBB57E9B3F5FA7BE7C4F5C756F3017B3A8C488C3653E9179');
    expect(new X509Certificate(APPLE_ROOT_G3).subject).toMatch(/Apple Root CA - G3/);
  });

  it('a signed tip checks, with its tier, amount and purchase id', async () => {
    const t = (await appleVerifier([root])(jws({ appAccountToken: 'AAAAAAAA-BBBB-4CCC-8DDD-EEEEEEEEEEEE' }))) as AppleTip;
    expect(t.tier).toBe('generous');
    expect(t.cents).toBe(999);
    expect(t.otid).toBe('2000000000000001');
    expect(t.env).toBe('Sandbox');
    expect(t.token).toBe('aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee');
  });

  it('the same transaction is refused against Apple’s real root (the chain must lead to Apple)', async () => {
    await expect(appleVerifier()(jws())).rejects.toThrow(/could not confirm/);
  });

  it('checks the monthly plan', async () => {
    const v = appleVerifier([root]);
    const end = Date.now() + 30 * 86400_000;
    const m = await v(jws({ productId: 'daybook.pattern.monthly', type: 'Auto-Renewable Subscription', expiresDate: end, price: 3000, currency: 'USD' }));
    expect(m).toMatchObject({ pat: 'monthly', until: end, cents: 300 });
    /* it needs its end, and its own type */
    await expect(v(jws({ productId: 'daybook.pattern.monthly', type: 'Auto-Renewable Subscription' }))).rejects.toThrow(/not Daybook Pattern/);
    await expect(v(jws({ productId: 'daybook.pattern.monthly', type: 'Non-Consumable', expiresDate: end }))).rejects.toThrow(/not Daybook Pattern/);
    await expect(
      v(jws({ productId: 'daybook.pattern.monthly', type: 'Auto-Renewable Subscription', expiresDate: end, revocationDate: Date.now() })),
    ).rejects.toThrow(/refunded/);
  });

  it('refuses another app, another product, a refund, a consumable, Xcode, and a changed payload', async () => {
    const v = appleVerifier([root]);
    await expect(v(jws({ bundleId: 'com.someone.else' }))).rejects.toThrow(/could not confirm/);
    await expect(v(jws({ productId: 'daybook.coins' }))).rejects.toThrow(/not a Daybook tip/);
    await expect(v(jws({ revocationDate: Date.now() }))).rejects.toThrow(/refunded/);
    await expect(v(jws({ type: 'Consumable' }))).rejects.toThrow(/not a Daybook tip/);
    await expect(v(jws({ environment: 'Xcode' }))).rejects.toThrow(/not from the App Store/);
    const [h, , s] = jws().split('.');
    await expect(v([h, b64({ productId: 'daybook.tip.amazing', environment: 'Sandbox' }), s].join('.'))).rejects.toThrow();
    await expect(v('not.a.jws')).rejects.toThrow();
  });

  it('a Production transaction checks the same way', async () => {
    const t = (await appleVerifier([root])(jws({ environment: 'Production', productId: 'daybook.tip.kind', price: 5000 }))) as AppleTip;
    expect(t.tier).toBe('kind');
    expect(t.cents).toBe(500);
  });
});
