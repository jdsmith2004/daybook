/* The crisis line for where the person is (November 12, 2026). 988 reaches someone only in the US and Canada, so a person
   in the UK, Ireland, Australia or New Zealand gets the free line that answers there. The region comes from the phone's own
   locale (the app passes its region code), never from the App Store or an account, because care works with neither.
   Anywhere else, or when the phone does not say, it is 988 as before. */

export type CrisisRegion = 'us' | 'ca' | 'uk' | 'au' | 'nz';

export interface CrisisLine {
  region: CrisisRegion;
  /** the full name, for the help pages */
  name: string;
  /** what to do, in a few words: "Call or text 988" */
  how: string;
  /** the number as it is shown: "116 123" */
  num: string;
  /** the number to dial or copy: "116123" */
  dial: string;
  /** true when the line also takes texts */
  text: boolean;
  /** one line on who it is for, for the short spots (Reach out, the More foot) */
  sub: string;
  /** the longer note for the help pages */
  note: string;
  site: { url: string; label: string };
  /** where the line works: "US" */
  where: string;
  /** what the line is, after its number in a sentence: "the Suicide & Crisis Lifeline" */
  called: string;
  /** the foot line under More and the help pages: the bold part (tapped to call), then the rest */
  foot: [string, string];
}

const LINES: Record<CrisisRegion, CrisisLine> = {
  us: {
    region: 'us',
    name: '988 Suicide & Crisis Lifeline',
    how: 'Call or text 988',
    num: '988',
    dial: '988',
    text: true,
    sub: 'Free, 24/7. Open to anyone who is struggling, not only in a crisis.',
    note: 'Call or text, or chat at 988lifeline.org. Free, 24/7. The name says suicide because it is there for that. It is also open to anyone who is struggling or needs to talk. A counselor starts by asking if you are safe. Answer honestly, then say what is going on.',
    site: { url: 'https://988lifeline.org/', label: '988lifeline.org' },
    where: 'US',
    called: 'the Suicide & Crisis Lifeline',
    foot: ['988', 'is the Suicide & Crisis Lifeline. It takes calls and texts from anyone who is struggling, any hour (US).'],
  },
  ca: {
    region: 'ca',
    name: '9-8-8 Suicide Crisis Helpline',
    how: 'Call or text 988',
    num: '988',
    dial: '988',
    text: true,
    sub: 'Free, 24/7. Open to anyone who is struggling, not only in a crisis.',
    note: 'Call or text, in English or French. Free, 24/7. The name says suicide because it is there for that. It is also open to anyone who is struggling or needs to talk. A responder starts by asking if you are safe. Answer honestly, then say what is going on.',
    site: { url: 'https://988.ca/', label: '988.ca' },
    where: 'Canada',
    called: 'the Suicide Crisis Helpline',
    foot: ['988', 'is the Suicide Crisis Helpline. It takes calls and texts from anyone who is struggling, any hour (Canada).'],
  },
  uk: {
    region: 'uk',
    name: 'Samaritans',
    how: 'Call 116 123',
    num: '116 123',
    dial: '116123',
    text: false,
    sub: 'Free, 24/7. Someone to talk to, whatever you are going through.',
    note: 'Call free from any phone, or email jo@samaritans.org. Free, 24/7. Open to anyone who is struggling or needs to talk, not only to people thinking about suicide. Say what is going on, in your own words.',
    site: { url: 'https://www.samaritans.org/', label: 'samaritans.org' },
    where: 'UK and Ireland',
    called: 'Samaritans',
    foot: ['116\u00a0123', 'is Samaritans. It is free from any phone and takes calls from anyone who is struggling, any hour (UK and Ireland).'],
  },
  au: {
    region: 'au',
    name: 'Lifeline',
    how: 'Call 13 11 14',
    num: '13 11 14',
    dial: '131114',
    text: false,
    sub: 'Free, 24/7. Someone to talk to, whatever you are going through.',
    note: 'Call, or chat at lifeline.org.au. Free, 24/7. Crisis support, and open to anyone who is struggling or needs to talk. A crisis supporter will listen first. Say what is going on, in your own words.',
    site: { url: 'https://www.lifeline.org.au/', label: 'lifeline.org.au' },
    where: 'Australia',
    called: 'Lifeline',
    foot: ['13\u00a011\u00a014', 'is Lifeline. It takes calls from anyone who is struggling, any hour (Australia).'],
  },
  nz: {
    region: 'nz',
    name: 'Need to talk? 1737',
    how: 'Call or text 1737',
    num: '1737',
    dial: '1737',
    text: true,
    sub: 'Free, 24/7. A trained counselor, whatever you are going through.',
    note: 'Call or text, free, 24/7. A trained counselor answers, for anyone who is struggling, stressed or needs to talk. Say what is going on, in your own words.',
    site: { url: 'https://1737.org.nz/', label: '1737.org.nz' },
    where: 'New Zealand',
    called: 'a free line with trained counselors',
    foot: ['1737', 'is a free line with trained counselors. It takes calls and texts from anyone who is struggling, any hour (New Zealand).'],
  },
};

/* two-letter country codes (ISO 3166) to the line that answers there; the US territories reach 988, and Samaritans takes
   calls from the Isle of Man and the Channel Islands too */
const BY_CODE: Record<string, CrisisRegion> = {
  US: 'us',
  PR: 'us',
  GU: 'us',
  VI: 'us',
  AS: 'us',
  MP: 'us',
  CA: 'ca',
  GB: 'uk',
  UK: 'uk',
  IE: 'uk',
  IM: 'uk',
  JE: 'uk',
  GG: 'uk',
  AU: 'au',
  NZ: 'nz',
};

/** The two-letter country in a country code or a locale tag like "en-GB" (its last two-letter part), or ''. */
function countryOf(code?: string | null): string {
  if (!code) return '';
  const parts = String(code).trim().replace(/_/g, '-').split('-');
  const cc = parts.length === 1 ? parts[0] : parts.slice(1).find((p) => /^[A-Za-z]{2}$/.test(p));
  return (cc || '').toUpperCase();
}

/** The crisis region for a country code or locale tag. Unknown or missing is the US, so 988 stays the default. */
export function crisisRegion(code?: string | null): CrisisRegion {
  return BY_CODE[countryOf(code)] || 'us';
}

/** The free crisis line for a country code or locale tag. */
export function crisisLine(code?: string | null): CrisisLine {
  return LINES[crisisRegion(code)];
}

/* The free text lines beside it. Crisis Text Line (741741) answers in the US; Shout (85258) is the UK's. Elsewhere the
   crisis line itself is the one to use, so there is none. */
export interface TextLine {
  name: string;
  how: string;
  num: string;
  sub: string;
  note: string;
  site: { url: string; label: string };
}

const TEXT_LINES: Partial<Record<CrisisRegion, TextLine>> = {
  us: {
    name: 'Crisis Text Line',
    how: 'Text HOME to 741741',
    num: '741741',
    sub: 'Free, 24/7. A trained volunteer, for whatever you are going through.',
    note: 'Free, 24/7. For anyone facing a hard time, whatever you are going through. A live volunteer counselor, usually within about 5 minutes. (Text HOLA for Spanish.) Message and data rates may apply. Volunteers are not medical professionals.',
    site: { url: 'https://www.crisistextline.org/text-us/', label: 'Crisis Text Line' },
  },
  uk: {
    name: 'Shout',
    how: 'Text SHOUT to 85258',
    num: '85258',
    sub: 'Free, 24/7. A trained volunteer, for whatever you are going through.',
    note: 'Free, 24/7. A trained volunteer texts back, for anyone facing a hard time, whatever you are going through.',
    site: { url: 'https://giveusashout.org/', label: 'Shout' },
  },
};

/** The free text line for where the person is, or null where the crisis line is the one to use. */
export function textLine(code?: string | null): TextLine | null {
  const r = crisisRegion(code);
  // Shout answers in the UK only, not in Ireland
  if (r === 'uk' && countryOf(code) === 'IE') return null;
  return TEXT_LINES[r] ?? null;
}

/** The gambling helpline where there is a national one: 1-800-MY-RESET in the US, the National Gambling Helpline in
    Great Britain, Gambling Help in Australia and the Gambling Helpline in New Zealand. */
export interface HelpLine {
  name: string;
  num: string;
  dial: string;
  note: string;
  site: { url: string; label: string };
}

export function gamblingLine(code?: string | null): HelpLine | null {
  const r = crisisRegion(code);
  if (r === 'us')
    return {
      name: 'National Problem Gambling Helpline',
      num: '1-800-MY-RESET (1-800-697-3738)',
      dial: '1-800-697-3738',
      note: 'Call, text or chat at 1800myreset.org. Free, confidential, 24/7. For anyone hurt by gambling, and for the people close to them.',
      site: { url: 'https://www.1800myreset.org/', label: '1-800-MY-RESET' },
    };
  if (r === 'uk' && countryOf(code) !== 'IE')
    return {
      name: 'National Gambling Helpline',
      num: '0808 8020 133',
      dial: '08088020133',
      note: 'Call free, or chat at gamcare.org.uk. Free, confidential, 24/7. For anyone hurt by gambling, and for the people close to them.',
      site: { url: 'https://www.gamcare.org.uk/', label: 'GamCare' },
    };
  if (r === 'au')
    return {
      name: 'Gambling Help',
      num: '1800 858 858',
      dial: '1800858858',
      note: 'Call, or chat at gamblinghelponline.org.au. Free, confidential, 24/7. For anyone hurt by gambling, and for the people close to them.',
      site: { url: 'https://www.gamblinghelponline.org.au/', label: 'Gambling Help Online' },
    };
  if (r === 'nz')
    return {
      name: 'Gambling Helpline',
      num: '0800 654 655',
      dial: '0800654655',
      note: 'Call free, or text 8006. Free, confidential, 24/7. For anyone hurt by gambling, and for the people close to them.',
      site: { url: 'https://www.gamblinghelpline.co.nz/', label: 'Gambling Helpline' },
    };
  return null;
}
