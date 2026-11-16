/* On the web the lessons' text (@daybook/core/lesson-content, about a megabyte) is not in the first load, so Today and SOS open
   sooner. A screen that shows a lesson imports it itself; this fetches it once the first screen is up and the page is idle, so
   opening a lesson is quick too. While an urge tool is open it waits, so reading the text in never stutters a breath or a ride.
   lesson-text.ts is the phone's. */
const AFTER_MS = 3000;
const CARE = /^\/(sos|tool|pause|trail|talk|wind|breathe)/;

type Idle = (f: () => void, o?: { timeout: number }) => number;

function load() {
  if (CARE.test(window.location.pathname)) {
    setTimeout(load, AFTER_MS * 3);
    return;
  }
  void import('@daybook/core/lesson-content').catch(() => {
    /* offline: a lesson screen fetches it when it opens */
  });
}

if (typeof window !== 'undefined') {
  const idle = () => {
    const ric = (window as unknown as { requestIdleCallback?: Idle }).requestIdleCallback;
    setTimeout(() => (ric ? ric(load, { timeout: 5000 }) : load()), AFTER_MS);
  };
  if (document.readyState === 'complete') idle();
  else window.addEventListener('load', idle, { once: true });
}
