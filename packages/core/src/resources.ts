/* Real love, in videos: a short list, tucked away in Settings, of videos that remind a person what real love looks like next to
   porn (people falling in love, a message that lifts). A test feature (the owner, November 14, 2026: "i'm gonna add some resources
   to daybook slowly that make me remember what actual love is vs porn ... just bury it in settings"). Each plays inside the app
   from YouTube's privacy-enhanced player (apps/mobile/src/app/love.tsx, love-play.tsx).

   To add a video: one line in LOVE_VIDEOS, with the id from its address (youtube.com/watch?v=THIS_PART). The newest goes first.
   `kind` puts it under a heading; with only one kind in the list, no headings show. */

export type LoveVideo = {
  /** the YouTube video id: 11 letters, digits, - or _ */
  id: string;
  /** a short name for the row */
  title: string;
  /** one quiet line under the name, if it helps: who sings or speaks */
  note?: string;
  /** people in love (the default), or words that lift */
  kind?: LoveKind;
};

export type LoveKind = 'love' | 'lift';
export const LOVE_KINDS: { kind: LoveKind; head: string }[] = [
  { kind: 'love', head: 'People in love' },
  { kind: 'lift', head: 'Words that lift' },
];

export const LOVE_VIDEOS: LoveVideo[] = [
  { id: 'iqGAW57EudQ', title: 'About You', note: 'The 1975' },
  { id: 'kFp-2UxBiYE', title: 'Cry', note: 'Sally Kim' },
];

/** a YouTube video id, as it appears in the address */
export const isVideoId = (id: string) => /^[A-Za-z0-9_-]{11}$/.test(id);

/** the privacy-enhanced player for one video: no cookies until it plays, related videos only from the same channel, and the
    video starts at once, since the person just tapped it */
export function loveEmbed(id: string) {
  return 'https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1&playsinline=1&rel=0&modestbranding=1';
}

/** the list in its groups, in LOVE_KINDS order, leaving out a group with nothing in it */
export function loveGroups(list: LoveVideo[] = LOVE_VIDEOS) {
  return LOVE_KINDS.map((k) => ({ ...k, videos: list.filter((v) => (v.kind || 'love') === k.kind) })).filter((g) => g.videos.length);
}

/** the video's still picture, from YouTube; it loads when the page with the list opens */
export const loveThumb = (id: string) => 'https://i.ytimg.com/vi/' + id + '/hqdefault.jpg';
