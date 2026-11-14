/* Real love, in videos: a short list, tucked away in Settings, of videos that remind a person what real love looks like next to
   porn (people falling in love, a message that lifts). A test feature (the owner, November 14, 2026: "i'm gonna add some resources
   to daybook slowly that make me remember what actual love is vs porn ... just bury it in settings"). Each plays inside the app
   from YouTube's privacy-enhanced player, and only when the person taps it (apps/mobile/src/app/love.tsx).

   To add a video: one line in LOVE_VIDEOS, with the id from its address (youtube.com/watch?v=THIS_PART). */

export type LoveVideo = {
  /** the YouTube video id: 11 letters, digits, - or _ */
  id: string;
  /** a short name for the row */
  title: string;
  /** one quiet line under the name, if it helps */
  note?: string;
};

export const LOVE_VIDEOS: LoveVideo[] = [{ id: 'iqGAW57EudQ', title: 'About You', note: 'The 1975' }];

/** a YouTube video id, as it appears in the address */
export const isVideoId = (id: string) => /^[A-Za-z0-9_-]{11}$/.test(id);

/** the privacy-enhanced player for one video: no cookies until it plays, related videos only from the same channel, and the
    video starts at once, since the person just tapped it */
export function loveEmbed(id: string) {
  return 'https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1&playsinline=1&rel=0&modestbranding=1';
}
