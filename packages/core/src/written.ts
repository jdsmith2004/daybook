/* It is written: the faith move in the SOS ride (the owner, November 8, 2026, from his bishop's note on Matthew 4:1-11).
   Jesus was tempted three times in the wilderness and answered each time with Scripture. The three temptations are the
   three things an urge still says: you need this, you have earned it (the bread); just a look, nothing bad will happen
   (the temple top, testing it); this will make it all better (the kingdoms, the promise of everything). Seeing the pull as
   one of three old moves, and answering it out loud, is the calm noticing the ride teaches: the attack has a pattern, you
   are not evil, notice it and answer it. Then Matthew 4:11: then it left, and help came. Then three pages from Matthew 5,
   which He taught soon after (the owner, November 8, 2026: more of Matthew 5): it starts in the heart (5:8), cast away what
   feeds it, one real thing, now (5:29), and you are the light of the world (5:14, 16), with the person's own flame.

   Only for people who said faith plays a part (lessons godOn); No to faith, or no answer, never sees it. The voice
   (faith.ts faithVoice): 'lds' and 'christian' quote the King James Bible (public domain, and the Church's English Bible),
   and 'plain' keeps the same shape with plain answers that speak of God and quote no Scripture. It is a ride move only,
   not one of the legacy TOOLS, so the tool lists, the counts and the golden records do not change. */
import type { FaithVoice } from './faith';

export interface WrittenPull {
  /** what the pull says, on the front of the card */
  pull: string;
  /** the old move it is, under the pull: seeing the pattern is half of the answer (the bishop's note: the attack has a pattern) */
  trick: string;
  /** what the tempter said, quoted exactly from the King James Bible, and its verse; null in the plain voice (the owner, November 15,
      2026: "Jesus is the example, and he has this scripture which I have told you multiple times to quote directly") */
  said: { text: string; ref: string } | null;
  /** what leads into the answer */
  faced: string;
  /** the answer's first words, in the sun color ("It is written,") */
  lead: string;
  /** the rest of the answer */
  rest: string;
  /** the verse, or null in the plain voice */
  ref: string | null;
}
export interface WrittenWords {
  /** the move's name in the ride */
  name: string;
  ask: { head: string; sub: string; yes: string; yesSub: string };
  stand: { head: string; sub: string; line: string; verse: string | null; ref: string | null };
  pulls: [WrittenPull, WrittenPull, WrittenPull];
  end: { head: string; sub: string; lead: string; rest: string; ref: string | null };
  /** Matthew 5, taught soon after on the mountain: where it starts (the heart), cutting off what feeds it, and who you are */
  heart: { head: string; sub: string; lead: string; rest: string; ref: string | null };
  cast: { head: string; sub: string; lead: string; rest: string; ref: string | null; ask: string; did: string };
  light: { head: string; sub: string; lead: string; rest: string; ref: string | null };
  /** Matthew 5 in the person's own scripture app, or null */
  link5: { label: string; url: string } | null;
  /** the whole chapter in the person's own scripture app (it opens the app when it is there, else the page), or null */
  link: { label: string; url: string } | null;
}

/** Gospel Library's universal link for Matthew 4:1-11 (the Church's deep linking page: `id` marks the verses, `#` scrolls) */
export const WRITTEN_GL = 'https://www.churchofjesuschrist.org/study/scriptures/nt/matt/4?lang=eng&id=p1-p11#p1';
/** bible.com, King James Version (1): it opens YouVersion when it is there */
export const WRITTEN_BIBLE = 'https://www.bible.com/bible/1/MAT.4.1-11.KJV';
/** Matthew 5:1-16, the start of the Sermon on the Mount, the same two ways */
export const WRITTEN_GL5 = 'https://www.churchofjesuschrist.org/study/scriptures/nt/matt/5?lang=eng&id=p1-p16#p1';
export const WRITTEN_BIBLE5 = 'https://www.bible.com/bible/1/MAT.5.1-16.KJV';
/** Cast it from you: first what is feeding the urge right now (one tap, and "I do not know" is a fine answer), then the one
    thing to do about it. The owner, November 15, 2026, on the old "What will you cast away right now?": "I don't know. It
    might be a good question, actually. It's just hard." So the page asks what a person can see, and gives the step. */
export const WRITTEN_CAST: [string, string][] = [
  ['screen', 'The screen in my hand'],
  ['room', 'This room'],
  ['alone', 'Being alone'],
  ['unsure', 'I do not know'],
];
/** the one thing to do for each answer */
export const WRITTEN_CAST_DO: Record<string, string> = {
  screen: 'Put it face down and walk away from it.',
  room: 'Get up and go to another room.',
  alone: 'Go where people are, or text someone.',
  unsure: 'Set the phone down and stand up, now.',
};
const CAST_DO = { ask: 'What is feeding it right now?', did: 'I did it' };

const BIBLE_PULLS: WrittenWords['pulls'] = [
  {
    pull: '“You need this.\nYou have earned it.”',
    trick: 'It calls a want a need.',
    said: { text: 'If thou be the Son of God, command that these stones be made bread.', ref: 'Matthew 4:3' },
    faced: 'He answered,',
    lead: 'It is written,',
    rest: 'Man shall not live by bread alone, but by every word that proceedeth out of the mouth of God.',
    ref: 'Matthew 4:4',
  },
  {
    pull: '“Just a look.\nYou can stop after.”',
    trick: 'It calls the first step small.',
    said: { text: 'If thou be the Son of God, cast thyself down.', ref: 'Matthew 4:6' },
    faced: 'He answered,',
    lead: 'It is written again,',
    rest: 'Thou shalt not tempt the Lord thy God.',
    ref: 'Matthew 4:7',
  },
  {
    pull: '“This will make\nit all better.”',
    trick: 'It promises what it has never given.',
    said: { text: 'All these things will I give thee, if thou wilt fall down and worship me.', ref: 'Matthew 4:9' },
    faced: 'He answered,',
    lead: 'Get thee hence, Satan:',
    rest: 'for it is written, Thou shalt worship the Lord thy God, and him only shalt thou serve.',
    ref: 'Matthew 4:10',
  },
];

const bible = (link: WrittenWords['link'], link5: WrittenWords['link5']): WrittenWords => ({
  name: 'It is written',
  ask: {
    head: 'Are you facing a temptation?',
    sub: 'Jesus was tempted too, three times. Being tempted is not sin.',
    yes: 'Yes, I am',
    yesSub: 'Stand like He did.',
  },
  stand: {
    head: 'Say no to it',
    sub: 'Press and hold. Mean it.',
    line: 'No. You cannot have me.\nI am a child of God.',
    verse: 'Resist the devil, and he will flee from you.',
    ref: 'James 4:7',
  },
  pulls: BIBLE_PULLS,
  end: {
    head: 'Then it left.',
    sub: 'It will for you too.',
    lead: 'Then the devil leaveth him,',
    rest: 'and, behold, angels came and ministered unto him.',
    ref: 'Matthew 4:11',
  },
  heart: {
    head: 'It starts in the heart.',
    sub: 'It begins with a look, before anything is done. You are there now, the easiest place to win.',
    lead: 'Blessed are the pure in heart:',
    rest: 'for they shall see God.',
    ref: 'Matthew 5:8',
  },
  cast: {
    head: 'Cast it from you.',
    sub: 'Take away what feeds it, now.',
    lead: 'If thy right eye offend thee,',
    rest: 'pluck it out, and cast it from thee.',
    ref: 'Matthew 5:29',
    ...CAST_DO,
  },
  light: {
    head: 'You stood.',
    sub: 'This is who He says you are.',
    lead: 'Ye are the light of the world.',
    rest: 'Let your light so shine before men, that they may see your good works, and glorify your Father which is in heaven.',
    ref: 'Matthew 5:14, 16',
  },
  link,
  link5,
});

const PLAIN: WrittenWords = {
  name: 'Stand firm',
  ask: {
    head: 'Are you facing a temptation?',
    sub: 'Being tempted is not wrong. It is a pull, and it passes.',
    yes: 'Yes, I am',
    yesSub: 'Stand firm.',
  },
  stand: { head: 'Say no to it', sub: 'Press and hold. Mean it.', line: 'No. You cannot have me.\nI belong to God.', verse: null, ref: null },
  pulls: [
    {
      pull: '“You need this.\nYou have earned it.”',
      trick: 'It calls a want a need.',
      said: null,
      faced: 'Answer it:',
      lead: 'I am fed by more than this.',
      rest: 'What I am hungry for, this has never filled.',
      ref: null,
    },
    {
      pull: '“Just a look.\nYou can stop after.”',
      trick: 'It calls the first step small.',
      said: null,
      faced: 'Answer it:',
      lead: 'I do not need to test it.',
      rest: 'I already know where it goes, and God is with me here.',
      ref: null,
    },
    {
      pull: '“This will make\nit all better.”',
      trick: 'It promises what it has never given.',
      said: null,
      faced: 'Answer it:',
      lead: 'God is enough for me.',
      rest: 'What this promises, it has never given.',
      ref: null,
    },
  ],
  end: { head: 'Then it left.', sub: 'Help comes after.', lead: 'It passes.', rest: 'It always has, and God stays when it goes.', ref: null },
  heart: {
    head: 'It starts in the heart.',
    sub: 'It begins with a look, before anything is done. You are there now, the easiest place to win.',
    lead: 'A clean heart',
    rest: 'sees God more clearly.',
    ref: null,
  },
  cast: {
    head: 'Cut off what feeds it.',
    sub: 'Do not argue with it. Take away what it needs, now.',
    lead: 'What feeds it,',
    rest: 'I can put out of reach.',
    ref: null,
    ...CAST_DO,
  },
  light: {
    head: 'You stood.',
    sub: 'This is who you are becoming.',
    lead: 'What is good in you shines.',
    rest: 'Let it. Someone near you is helped by it.',
    ref: null,
  },
  link: null,
  link5: null,
};

/** the words of the move in this voice */
export function writtenWords(v: FaithVoice): WrittenWords {
  if (v === 'lds')
    return bible({ label: 'Read Matthew 4 in Gospel Library', url: WRITTEN_GL }, { label: 'Read Matthew 5 in Gospel Library', url: WRITTEN_GL5 });
  if (v === 'christian')
    return bible({ label: 'Read Matthew 4 in your Bible app', url: WRITTEN_BIBLE }, { label: 'Read Matthew 5 in your Bible app', url: WRITTEN_BIBLE5 });
  return PLAIN;
}
