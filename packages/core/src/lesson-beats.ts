/* A lesson's short beats: what each card says on its first read, one thought at a time, and which picture a card is drawn as. The original
   words stay in the lesson (legacy/core.js, lessons-more.ts), one tap away as More, and nothing here changes what a lesson teaches. A new
   lesson needs its beats here; test/lesson-beats.test.ts fails without them, and holds them to the limits and the words rules. A card is one
   of: a question, the sun card (the answer), the number card (the science, when it has a number), or the sky. */
import type { Card, Lesson } from './lessons';

export interface Beat {
  /** the big line. On a number card it finishes the sentence the number starts ("7" + "days off porn, and ...") */
  h?: string;
  /** what the flame says in its bubble */
  say?: string;
  /** one short sentence under the big line */
  p?: string;
  /** what to do: up to three short lines */
  l?: string[];
  /** the giant number, when a card without a number picture should be a number card. It comes from the card's own words. */
  n?: string;
  /** on a question: the flame's comment on each answer, in the answers' order */
  c?: string[];
  /** on a question: shorter answers, in the same order, only where an answer is too long for a thumb to read */
  o?: string[];
  /** on a guess: the number card after it is locked in */
  rv?: { n: string; h: string; p?: string };
}
export interface LessonBeats {
  /** one for each card in the lesson, in the lesson's order */
  cards: Beat[];
  /** the recall question this lesson asks the day after */
  rc?: { q?: string; o?: string[]; c: string[] };
  /** the one thing to keep, as the flame says it at the end */
  key: string;
}
export type BeatBook = Record<string, LessonBeats>;

export const lessonBeats = (L: Lesson): LessonBeats | null => BOOK[L.id] || null;
/** a card's beat, when it has one */
export const cardBeat = (L: Lesson, ci: number): Beat => BOOK[L.id]?.cards[ci] || {};

export type CardLook = 'question' | 'guess' | 'number' | 'sun' | 'sky';
/** which picture a card is drawn as */
export function cardLook(card: Card, beat: Beat): CardLook {
  if (card.k === 'choose') return 'question';
  if (card.k === 'guess') return 'guess';
  if (beat.n || (card.art && card.art[0] === 'big')) return 'number';
  return card.e === 'answer' ? 'sun' : 'sky';
}
/** the giant number on a number card */
export const cardNumber = (card: Card, beat: Beat): string => beat.n || (card.art && card.art[0] === 'big' ? card.art[1].n : '');
/** a real picture on a card (a chain, a wave, a loop): an icon says nothing the words do not, and a number is the card itself */
export const cardArt = (card: Card) => (card.art && card.art[0] !== 'icon' && card.art[0] !== 'big' ? card.art : null);

const BOOK: BeatBook = {
  l46: {
    key: 'A flat stretch is common, and you are not broken. It eases, and every urge you ride out helps.',
    cards: [
      { h: 'You stopped, and now everything feels flat.', say: 'Did you break something?' },
      {
        h: 'Men finished a therapy for porn use. Three months on, how many in 100 had cut their viewing by 70% or more?',
        rv: { n: '74', h: 'in 100 had cut their viewing by 70% or more.', p: 'Getting free is a road, and most of them were well along it.' },
      },
      {
        h: 'The flat stretch is a stretch. It eases.',
        p: 'When a habit goes, what it covered comes back up. You have not yet found your new ways to meet it.',
      },
      { h: 'days off porn, and researchers found no withdrawal effects.', p: 'A low week is a low week. It is not damage from stopping.' },
      { h: 'Journals of quitting hold the hard days and what came after.' },
      { h: 'days for a new habit to feel automatic. Uneven is normal.', p: 'Every urge you ride out is making it happen.' },
      {
        h: 'On a flat day, do the small things anyway.',
        l: ['Say it: “This is a flat day. It passes.”', 'Sleep, real food, a walk outside', 'A text to one person counts'],
        p: 'If the low stays for weeks or turns dark, tell a doctor.',
      },
      {
        h: 'Day 12. You have felt gray and irritable all week. A thought says, “This is who I am without it.” What is most accurate?',
        c: [
          'A flat stretch feels permanent from the inside. It eases.',
          'A week off porn showed no withdrawal effects. Low days are not damage.',
          'Yes. You read it for what it is, and you keep going.',
          'The flat feeling is asking for sleep, people and time. Porn would only feed the wanting.',
        ],
      },
    ],
    rc: {
      o: [
        'You might have. See how you feel in a year',
        'Many people hit a flat stretch. It eases',
        'Go back once and you will feel normal',
        'It will all be over by day 30',
      ],
      c: [
        'Nothing says they ruined anything. Low days ease.',
        'Right. It is common, it eases, and they are not broken.',
        'Going back gives the wanting more practice.',
        'Nobody can promise a date. It eases over weeks.',
      ],
    },
  },
  l1: {
    key: 'You can start with the doubt still there. Take one small step and let your own reasons carry it.',
    cards: [
      { h: 'Part of you wants to quit, and part of you does not.', say: 'Do you have to sort that out first?' },
      {
        h: 'What do mixed feelings about quitting usually mean?',
        c: [
          'A very common fear. You can want this and doubt it at the same time.',
          'Waiting to feel sure can take a long time. People change while still unsure.',
          'Treatment guides call them a normal part of any change. This is where it usually begins.',
          'Anyone changing a habit has them, so they do not measure how hooked you are.',
        ],
      },
      { h: 'You can want this, doubt it, and start anyway.', p: 'You do not have to win the argument with yourself before you take a small step.' },
      {
        h: 'A US guide calls this “a normal part of any change process.”',
        p: 'Feeling unsure is one of the stages. Small steps are how people move through it.',
      },
      { h: 'The reasons that last are your own.', say: 'When doubt shows up, read your reasons instead of arguing.' },
      {
        h: 'Pick one small step for today.',
        l: ['Write one true reason, in your own words', 'Read one short lesson a day', 'Wait ten minutes at the next urge'],
      },
      {
        h: 'You want to quit, but part of you is not sure you can. What is the best next move?',
        c: [
          'You could wait a long time for that day. You can start with the doubt still there.',
          'Yes. A small step now counts for more than being sure later.',
          'A vow is hard to keep while part of you is unsure. A small step is easier to repeat.',
          'You do not have to win that argument first. Let the doubt sit there and take the step.',
        ],
      },
    ],
    rc: {
      c: [
        'Doubt comes with changing any habit. It does not predict that you will fail.',
        'Right. Wanting it and doubting it can both be true. Keep taking small steps.',
        'Feeling sure can take a long time to come. People change while they are still unsure.',
        'The doubt can stay. Let it be there and take the next small step.',
      ],
    },
  },
  l2: {
    key: 'An urge rises, peaks and passes. You only have to outlast this one.',
    cards: [
      { h: 'Does an urge feel like it keeps building until you give in?' },
      {
        h: 'If you do not act on an urge, what does it do?',
        c: [
          'It feels that way from the inside. Urges fall too, like a wave.',
          'Distraction can help, but an urge left alone still rises and falls on its own.',
          'An urge behaves like a wave. Outlast the peak and it passes.',
          'Fighting hard keeps your attention on it. You only have to wait it out.',
        ],
      },
      {
        h: 'Ride it out. You do not have to fight it or obey it.',
        p: 'It is called urge surfing. The urge may stay strong, and you build a gap between it and what you do.',
      },
      {
        h: 'college smokers learned to ride out urges, and smoked fewer cigarettes.',
        p: 'Their urges stayed as strong as everyone else’s. You do not need weaker urges to quit.',
      },
      {
        h: 'When an urge hits, give it ten minutes.',
        l: ['Say it: “This is an urge. It is a wave.”', 'Breathe slowly, with a long breath out', 'Wait, and then notice what it did'],
        p: 'Ten minutes is short enough to try.',
      },
      {
        h: 'An urge hits hard while you are home alone. What gives you the best chance?',
        c: [
          'Yes. You are outlasting it, and that gap changes what you do.',
          'Vows put all your attention on the urge. You only need to get through this one.',
          'That ends this one and keeps the habit strong. Each urge you outlast is practice.',
          'Staying online keeps the trigger in your hand. Step away and let the wave pass.',
        ],
      },
    ],
    rc: {
      c: [
        'Fighting keeps your attention on it. You can let it rise and fall instead.',
        'Right. You only have to outlast this one wave.',
        'Giving in ends this one and keeps the habit strong. Outlasting it builds the gap.',
        'Promises are about later. The skill is getting through this one wave.',
      ],
    },
  },
  l3: {
    key: 'Watch for “I blew it, so why bother.” Protect your confidence and do the next small thing.',
    cards: [
      { h: 'You slip once. Why does the rest of the night so often go too?' },
      {
        h: 'What does the most damage after a slip?',
        c: [
          'Most people think so. What you tell yourself right after usually does more.',
          'Willpower did not change in the minute after the slip. A thought did, and you can catch it.',
          'Telling a safe person usually helps you get back on track. Hiding it is riskier.',
          'That thought makes giving up feel logical, and you can see it coming.',
        ],
      },
      {
        h: 'The biggest risk is the thought right after the slip.',
        p: '“I blew it” makes giving up feel logical. A slip is one event, and you can step out right there.',
      },
      { h: 'Smokers who lost confidence after a lapse lapsed again sooner.', p: 'Protecting your confidence matters more than punishing yourself.' },
      {
        h: 'After a slip, do the next small thing.',
        l: ['Log it in 30 seconds, honest and not harsh', 'Within the hour: water, a walk or a text', 'No big decisions tonight. Check in tomorrow'],
      },
      {
        h: 'You slipped last night. This morning, what best keeps it from snowballing?',
        c: [
          'A clean start turns the days until Monday into throwaways. That feeds the snowball.',
          'Hiding is how one slip turns into many. Showing up today stops the snowball.',
          'Yes. You name it without a verdict and keep your normal day. That protects your confidence.',
          'Harsh words feel serious. A drop in confidence is what brought the next slip sooner.',
        ],
      },
    ],
    rc: {
      c: [
        'It feels honest, and it turns one slip into a verdict on the whole week.',
        'Right. That thought is the risk. Spot it and do the next small thing today.',
        'One slip says nothing about your willpower. Watch the thought that comes after it.',
        'Waiting for Monday makes throwaways of the days between. Today still counts.',
      ],
    },
  },
  l4: {
    key: 'Tired or lonely, porn looks bigger than it is. Meet the need under it: sleep, or a real person.',
    cards: [
      { h: 'Saying no is easy at 3 PM, and so hard at 1 AM.', say: 'Same you, same phone. What changed?' },
      {
        h: 'What makes a late-night urge feel so strong?',
        c: [
          'A common guess. The bigger change is how good porn looks to a tired brain.',
          'A tired brain reacts more strongly to what feels good, so the urge looks bigger.',
          'Plenty of free evenings go fine. What sets 1 AM apart is how tired you are.',
          'That is how it feels at 1 AM. It is usually the tiredness talking.',
        ],
      },
      { h: 'Tired and lonely both make porn look like a bigger reward.', p: 'That is a state you are in, not who you are.' },
      { h: 'A night without sleep made the brain’s reward areas overreact.', say: 'At 1 AM, porn looks better than it is. Sleep turns that back down.' },
      { h: 'The lonelier people were, the more porn they tended to use.', p: 'Porn cannot fix loneliness. A person, even by text, works on the need itself.' },
      {
        h: 'Meet the need under the urge.',
        l: ['Ask: am I tired, lonely, or both?', 'Tired: phone outside the bedroom, then sleep', 'Lonely: text one person, about anything'],
      },
      {
        h: 'It is 12:40 AM. You are in bed, scrolling, and an urge is building. What helps most?',
        c: [
          'Yes. Sleep turns the urge down, and moving the phone is what makes sleep happen.',
          'That keeps you awake with the phone in your hand. The need under this is sleep.',
          'You might make it, on your most tired brain. Ending the night ends the fight.',
          'That is the tired brain overrating the reward. The need is sleep.',
        ],
      },
    ],
    rc: {
      c: [
        'Scrolling alone keeps you near the trigger and does nothing for the loneliness.',
        'Lonely is a need, not a weakness. Being hard on yourself does not meet it.',
        'Right. Loneliness makes porn look like comfort, and a person meets the need itself.',
        'Pulling away feeds the loop of lonely, porn, more cut off. A person breaks it.',
      ],
    },
  },
  l33: {
    key: 'A strong pull is a learned signal, not a measure of need. Call it wanting, and give it ten minutes.',
    cards: [
      { h: 'You wanted it badly, and right after you felt empty.', say: 'Why do those two not match?' },
      {
        h: 'Why can the pull be strong when the pleasure is small?',
        c: [
          'A common fear. In the brain, wanting can grow while enjoying stays the same.',
          'They do. Repetition can turn up the wanting on its own.',
          'Willpower is not the missing piece. The pull is a learned signal, and you can outlast it.',
          'The pull was learned through repetition. It is a signal, not who you are.',
        ],
      },
      { h: 'Wanting and liking are two different systems.', p: 'Repeat a habit enough and the wanting can get louder while the liking stays put.' },
      {
        h: 'separate systems in the brain, and in addiction only the wanting grows.',
        p: 'A strong pull does not mean you love it. It means the wanting signal was trained.',
      },
      { h: 'Over time, the reason for a habit can change.', p: 'Less fun and harder to stop is this pattern. It is no sign that something is wrong with you.' },
      {
        h: 'When the pull is strong, call it wanting.',
        l: ['Say it: “This is wanting, not liking.”', 'Ask how it felt ten minutes after, last time', 'Wait ten minutes. Wanting rises and falls'],
      },
      {
        h: 'An urge hits, and a thought says, “You really need this.” What is the most accurate reply?',
        c: [
          'How strong a pull feels does not measure need. Wanting can grow far past the pleasure.',
          'Arguing keeps your attention on it. Calling it wanting is quicker.',
          'Yes. You see the signal for what it is, and you outlast it.',
          'Each time you follow the pull, the wanting gets more practice. Outlasting it gives it less.',
        ],
      },
    ],
    rc: {
      c: [
        'Wanting and enjoying are different. The pull can grow while the pleasure stays small.',
        'Right. The wanting can be much louder than the pleasure. Name it and outlast it.',
        'A loud pull is a learned signal, not a flaw in you.',
        'Tired can turn the pull up. The bigger point is that wanting is not liking.',
      ],
    },
  },
  l34: {
    key: 'The pull starts at a signal: a time, a place, a mood, an app. Learn yours and act at the first one.',
    cards: [
      { h: 'Nothing is on the screen yet. Why is the pull already there?' },
      {
        h: 'In a brain-scan study, when did men with problem porn use react more than other men?',
        c: [
          'The common guess. The difference came earlier, at the signal that a picture was coming.',
          'Their reward areas reacted more to the signal, and about the same to the pictures.',
          'The difference came before anything was shown, at the signal.',
          'There was a difference, and it came at the signal, before any picture.',
        ],
      },
      { h: 'The pull starts at the signal.', p: 'Alone in bed, your brain already knows what usually comes next. Nothing is wrong with you.' },
      {
        h: 'men were scanned. The difference came at the signal, not the picture.',
        p: 'The hard moment usually starts at the signal, so that is the best place to step in.',
      },
      {
        h: 'Find your signals, and act at the first one.',
        l: ['Name them: a time, a place, a mood, an app', 'Pick a move: phone outside the room, or leave', 'Do it while the pull is still small'],
      },
      {
        h: 'You just opened the app you usually scroll before a slip. No urge yet. What is the best move?',
        c: [
          'By the time the urge is big, it is harder. The signal is your early warning.',
          'The app is the signal. Staying in it lets the pull build.',
          'Opening it is a habit, not a verdict on you. Use it as information.',
          'Yes. You acted at the signal, when the pull is smallest.',
        ],
      },
    ],
    rc: {
      c: [
        'By then the signal has already started the pull. Change the signal instead.',
        'Right. The phone in bed is the signal. Move it and the pull never gets started.',
        'The phone in bed is still the signal, whatever app is open.',
        'Waiting means acting when the pull is already big. Act at the signal.',
      ],
    },
  },
  l35: {
    key: 'Habits start on their own in familiar places. Watch for the start and say “not this time.”',
    cards: [
      { h: 'You find yourself halfway there, with no memory of deciding.', say: 'How do you stop something you never decided to start?' },
      {
        h: 'In diary studies, what worked best against strong bad habits?',
        c: [
          'That helped with passing temptations and did little for strong habits.',
          'Distraction did little for strong habits in these studies.',
          'Watching for slips and telling themselves not to worked best for strong habits.',
          'Something did work. They watched for it and told themselves not to.',
        ],
      },
      {
        h: 'Watch for the start, and tell yourself “not this time.”',
        p: 'A habit can start on its own. Catching it early brings your own choice back into the moment.',
      },
      {
        h: 'diary studies, and for strong habits, watching for slips worked best.',
        p: 'The habit does not have to disappear first. You only need to notice it starting.',
      },
      {
        h: 'An hour of the night or a spot on the couch can start a routine.',
        p: 'Your autopilot has a starting place. Learn it and you know where to watch.',
      },
      {
        h: 'Set a watch for your autopilot moment.',
        l: ['Pick the time or place it usually starts', 'When you get there, notice your hands', 'Say “Not this time,” then do your plan'],
        p: 'Catching it late still counts. Every catch is practice.',
      },
      {
        h: 'Your thumb is already opening the browser at 11 PM. What gives you the best chance?',
        c: [
          'Started is not finished. Catching it now is the skill.',
          'Yes. You caught the autopilot and took back the next step.',
          'Blame pulls your attention onto yourself. Watching and stopping is enough.',
          'That gives the habit more practice. Catching it, even late, gives it less.',
        ],
      },
    ],
    rc: {
      c: [
        'Hoping leaves the autopilot in charge. Watching puts you back in it.',
        'Right. You caught the start, which is where watching works best.',
        'A big reaction is hard to repeat. You can say a calm “not this time” every night.',
        'Shame pulls attention onto you. Notice the habit and take the next step yourself.',
      ],
    },
  },
  l36: {
    key: 'Often the habit is an exit from a feeling. Your log can show which one, so plan for that.',
    cards: [
      { h: 'After a long day, the urge can show up like an exit sign.', say: 'Is it pleasure you want, or a way out?' },
      {
        h: 'In a well-known model of addictive habits, what tends to drive the habit later on?',
        c: [
          'The model describes a shift, from pleasure early on toward relief later.',
          'Pleasure plays a big part early on. Later, relief from bad feelings matters more.',
          'Boredom can be part of it. The wider pattern is getting away from any bad feeling.',
          'The model describes a change over time, from pleasure toward relief.',
        ],
      },
      { h: 'Often the habit is an exit from a feeling.', p: 'The relief is real and short, and the feeling is usually still there after.' },
      { h: 'Over time, habits tend to shift from pleasure to relief.', p: 'Your hard moments can point at what you need: rest, calm or company.' },
      {
        h: 'Use your log to find the feeling under the urge.',
        l: ['See what sets it off, and what you feel then', 'Pick one thing for it: a walk, a person, sleep', 'Do it early, when the feeling starts'],
      },
      {
        h: 'Your log shows most urges come after hard workdays. What is the best plan?',
        c: [
          'Being strict does not touch the stress, and the stress is what needs a plan.',
          'Hiding the pattern hides the answer. The log is what found it.',
          'Yes. You are meeting the stress itself, before it turns into an urge.',
          'The pattern is there, and it is not fixed. A plan for the stress can change it.',
        ],
      },
    ],
    rc: {
      c: [
        'The upset is why the urge showed up. Meeting it makes the urge smaller.',
        'Right. The urge offers relief from the upset. Give yourself a better kind.',
        'If urges follow arguments, that is a pattern worth a plan.',
        'A hard day is a reason to take care of yourself. Porn only gives short relief.',
      ],
    },
  },
  l37: {
    key: 'Recovery is often a change in who you are. You can start that change now.',
    cards: [
      { h: '“Someone with a porn problem.” That label can stick.', say: 'So how do people come to see themselves differently?' },
      {
        h: 'In a study of addiction treatment, what went with doing better later?',
        o: [
          'Remembering every mistake so as not to repeat it',
          'Keeping their old identity, with fewer slips',
          'Not thinking about who they are at all',
          'Seeing themselves less as users, more as people in recovery',
        ],
        c: [
          'Learning from mistakes helps. Doing better went with a shift in how people saw themselves.',
          'The people who did better tended to let the old identity fade.',
          'How people saw themselves turned out to matter.',
          'Good guess. The bigger that shift, the better people did later.',
        ],
      },
      { h: 'Recovery is often a change in who you are.', p: 'People who recover often talk about being a parent again, or a friend again.' },
      {
        h: 'adults in alcohol and drug treatment. Most shifted in the first month.',
        p: 'They saw themselves less as users, and the bigger that shift, the better they did later.',
      },
      { h: 'A new identity often grows through the people around you.' },
      {
        h: 'Start using the new sentence now.',
        l: ['Write who you are becoming, in one sentence', 'Do one small thing that person would do today', 'Tell one person, or find a group, when ready'],
      },
      {
        h: 'Two weeks without a slip, and you still think, “I am an addict.” What fits this lesson best?',
        c: [
          'Being careful is good. Holding on to the old identity did not go with doing better.',
          'Yes. The new identity is built by saying it and living it, a little at a time.',
          'You do not have to wait. In the study, the shift started in the first month.',
          'Days help. How people saw themselves also mattered for how they did later.',
        ],
      },
    ],
    rc: {
      c: [
        'Most people in the study shifted how they saw themselves within a month.',
        'Right. The new identity is built in small steps, and it is already starting.',
        'Nobody in recovery has a perfect record. The shift is in who you see yourself as.',
        'How people saw themselves went along with how they did later.',
      ],
    },
  },
  l38: {
    key: '“I cannot” sounds like a rule. “I do not” sounds like who you are.',
    cards: [
      { h: 'The urge argues back, and you say “I cannot.”', say: 'Two small words change how a no feels. Which ones?' },
      {
        h: 'Which way of saying no helped people stick with a goal in studies?',
        c: [
          '“I cannot” sounds like a rule from outside. In the studies, it helped less.',
          'Good guess. “I do not” sounds like a choice about who you are, and it helped.',
          'A plain no helped less than “I do not” did.',
          'It did make a difference. The words shape how the no feels.',
        ],
      },
      { h: 'Swap “I cannot” for “I do not.”', p: '“I cannot” feels like being denied. “I do not” is yours, and a no that is yours is easier to keep.' },
      {
        h: 'days of practice, and the “I do not” group kept going more often.',
        p: 'They were working on a health goal, and “I do not” made people feel more in charge.',
      },
      {
        h: 'Write your own “I do not” sentence.',
        l: ['Start short: “I do not watch porn.”', 'Add who you are: “I keep my word to myself.”', 'Say it at the signal, out loud if you can'],
      },
      {
        h: 'An urge says, “Come on, just once.” Which reply fits this lesson best?',
        c: [
          'It can work, but “cannot” sounds like a rule from outside, and that can feel like a loss.',
          'That leaves the door open, and the urge will ask again.',
          'That is not true, and it gives the urge the last word. Say what you choose.',
          'Yes. That says who you are, and it is your own choice.',
        ],
      },
    ],
    rc: {
      c: [
        '“Not allowed” is a rule from outside. “I do not” is your own choice.',
        'Right. “I do not” says who you are, and that kind of no is easier to keep.',
        '“Not right now” invites the question again later.',
        '“Just once” is the urge talking. “I do not” answers it.',
      ],
    },
  },
  l39: {
    key: 'Future you can feel like a stranger. Picture them, and tonight they get a say.',
    cards: [
      { h: 'It is late, and the urge says tonight is all that matters.', p: 'The person who lives with tonight is missing from the room.' },
      {
        h: 'In studies, what helped people choose a later reward over a quick one?',
        c: [
          'Rules can help, but something more personal worked here: seeing their future selves.',
          'Guilt looks back. What helped here looked forward, at a future self.',
          'Good guess. Seeing their older selves, people chose the later reward more often.',
          'People do lean toward now, but seeing their future selves shifted that.',
        ],
      },
      {
        h: 'Make future you real, and give them a say.',
        p: 'When future you feels like a stranger, tonight wins. When you can picture them, their needs count.',
      },
      { h: 'People saw their own faces aged, and saved more for later.', say: 'The future felt closer to them. Picturing yours makes tonight easier.' },
      {
        h: 'Write three lines from you, a year from now.',
        l: ['What is different about your mornings?', 'What did you do on the hard nights?', 'What would you tell yourself tonight?'],
        p: 'Keep it short. Read it when an urge comes.',
      },
      {
        h: 'An urge hits, and a thought says, “Nothing changes if I give in once.” What would future you say?',
        c: [
          'Yes. Future you is real, and tonight is part of who they become.',
          'Future you would not say that. Tonight is part of how they get there.',
          'That is the urge talking. People change one night at a time.',
          'Waiting to feel ready keeps tonight in charge. Future you is asking for this night.',
        ],
      },
    ],
    rc: {
      c: [
        'Right. When future you feels real, their needs count tonight.',
        'Going over the past brings guilt. Look forward instead.',
        'Next month puts the change off. Future you is asking for tonight.',
        'That is the gap this lesson closes. Make the future feel near.',
      ],
    },
  },
  l40: {
    key: 'You do not have to believe it first. Your log keeps the count, so look at it on a hard day.',
    cards: [
      { h: '“I am someone who is free of this.” It does not feel true yet.', say: 'So where does that belief come from?' },
      {
        h: 'What helps a new way of seeing yourself feel true?',
        c: [
          'Words help most when something stands behind them. Belief grows from what you do.',
          'Good guess. Each action is evidence, and a record lets you see it add up.',
          'Big moments happen, but most change is built from many small ones.',
          'You do not need a perfect record. Every urge you ride out counts, even after a slip.',
        ],
      },
      { h: 'Each urge you ride out is a vote for who you are becoming.', p: 'Many votes decide it, so a slip is one vote, not the whole count.' },
      {
        h: 'experiments found that tracking progress helps people reach goals.',
        p: 'It helps more when written down, so your log is the record of the votes you have cast.',
      },
      {
        h: 'Count your votes.',
        l: ['Each urge you rode out is a vote', 'Say it: “I am someone who rides out urges.”', 'Add one more vote today, however small'],
      },
      {
        h: 'After a slip, a thought says, “See? This is who you really are.” What does your log say?',
        c: [
          'One slip is one vote. Your log holds many more.',
          'Your log is the evidence. It shows what you have done.',
          'Yes. You are reading the whole count, and the last entry is one vote in it.',
          'An honest log is what makes the evidence believable. Keep the slip. It is one vote.',
        ],
      },
    ],
    rc: {
      c: [
        'Ten urges ridden out are ten votes. One slip does not erase them.',
        'Right. That is the honest count, and it is evidence of who you are becoming.',
        'Nothing resets. Your votes are still there.',
        'Ten times is practice, and it is yours.',
      ],
    },
  },
  l13: {
    key: 'Urges often ride in on a feeling. Name it in a word or two, then meet it another way.',
    cards: [
      { h: 'Urges often ride in on a feeling.', say: 'What were you feeling right before your last one?' },
      {
        h: 'People looked at upsetting faces, and some put the emotion into a word. What did that do?',
        c: [
          'Good guess. When people named the emotion, the brain’s alarm center was less active.',
          'That is a common fear, that naming feeds it. Here, naming went with a quieter alarm.',
          'There was a difference. Naming the emotion went with a quieter alarm center.',
          'These were ordinary adults, not therapists. A word or two was enough.',
        ],
      },
      { h: 'Give the feeling a word or two. It loses some of its grip.', p: 'Saying “I notice I feel wound up” makes a little space before what you do next.' },
      { h: 'In brain scans, a word quieted the alarm center.' },
      { h: 'Alcohol and drug research ties bad moods to the most relapses.', say: 'Know the feeling that comes first, and you know where to aim.' },
      {
        h: 'When an urge starts, say “I notice I feel ___.”',
        l: ['Wound up, low, stung, alone or stuck', 'A rough guess is fine', 'Then a walk for stress, a call for lonely'],
      },
      {
        h: 'You get home from a rough day and an urge starts. What is the best first move?',
        c: [
          'Pushing past the feeling leaves it running the show. Naming it takes some of its grip.',
          'That is the bad day talking. The urge is often the feeling looking for relief.',
          'Yes. Naming it makes a little space. Then meet it another way: a walk, a shower, a call.',
          'Scrolling keeps the trigger in your hand. Name it first, then go away from the screen.',
        ],
      },
    ],
    rc: {
      c: [
        'That is a verdict. Name the feeling instead.',
        'Right. Naming the feeling loosens its grip. Then meet it another way, like a walk.',
        'Phone time keeps the trigger close. Name the feeling first.',
        'Blame piles on. Naming what you feel is the first move.',
      ],
    },
  },
  l14: {
    key: 'A long breath out takes a minute and costs nothing. Use it at the first pull of an urge.',
    cards: [
      { h: 'An urge hits. Your heart speeds up and your chest gets tight.', say: 'Can you change that?' },
      {
        h: 'Adults practiced breathing or meditation for 5 minutes a day. What lifted their mood most?',
        c: [
          'It helped, but the breathing patterns did better on good mood, and one did best.',
          'It helped too. The pattern with the extra-long breath out did best on good mood.',
          'That lifted mood as well, but the pattern with a long breath out did best.',
          'Good guess. That pattern, called cyclic sighing, gave the biggest lift in good mood.',
        ],
      },
      { h: 'Yes. With a long, slow breath out, anywhere, in a minute.', p: 'It settles your body while the urge rises and falls.' },
      {
        h: 'adults, 5 minutes a day, and the long breath out lifted mood most.',
        p: 'A minute of long breaths out is a cheap, quick tool for getting through the wave.',
      },
      {
        h: 'Practice when it is quiet, so you can find it when it is loud.',
        l: ['Breathe in through your nose', 'Without breathing out, sip in a little more', 'Out slowly through your mouth, longer than in'],
        p: 'Repeat for about a minute. If you feel dizzy, stop and breathe normally.',
      },
      {
        h: 'An urge starts while you are lying in bed. How should you use the long breath out?',
        c: [
          'It works best early, while the wave is still small. Use it at the first pull.',
          'Yes. Settle your body first, then change the setting. The breath buys you the gap.',
          'The part that settles you is the slow, long breath out.',
          'It does not have to stop the urge. It helps you ride it out, and that is the goal.',
        ],
      },
    ],
    rc: {
      c: [
        'Right. The long breath out helps you settle while the wave passes.',
        'What settles you is the slow breath out. Holding it in does not.',
        'That is hard to follow on command. The breath gives your body a way to do it.',
        'The phone keeps the trigger in your hand. Breathe first.',
      ],
    },
  },
  l15: {
    key: 'When an urge starts, move first, then decide. A short burst eases a craving for a while.',
    cards: [
      { h: 'Waiting out an urge is hard, especially sitting still.', say: 'Could a few minutes of moving make it weaker?' },
      {
        h: 'People craving a cigarette did a short bout of exercise. What do you think happened?',
        c: [
          'Cravings live in the body too. A short bout of exercise eased them.',
          'Good guess. A review of studies found short bouts of exercise eased cravings for a while.',
          'A fair guess, but it went the other way. Cravings got weaker after exercise.',
          'Short, simple bouts of exercise eased cravings. You do not need a workout plan.',
        ],
      },
      {
        h: 'Yes. A short burst of movement eases a craving for a while.',
        p: 'Waiting is easier when your body is doing something, so move first, then decide.',
      },
      { h: 'Short bouts of exercise eased cigarette cravings.', p: 'Your body can help you ride out an urge.' },
      {
        h: 'Pick one move you would do even when you are tired.',
        l: ['Walk, even one lap of the block', 'Ten of something: push-ups, squats, stairs', 'Or just stand up and walk to a different room'],
      },
      {
        h: 'An urge starts late at night while you are on the couch. What is the best move?',
        c: [
          'Waiting can work, and it is easier when your body is doing something. Move first.',
          'Tomorrow does not help right now. A short burst now is what eases the craving.',
          'Screen time keeps you close to the trigger. Moving works on the craving itself.',
          'Yes. A short burst eases the craving and gets you off the couch. Then decide.',
        ],
      },
    ],
    rc: {
      c: [
        'You do not have to feel like it first. Start small and let the moving do its work.',
        'Right. A short burst of movement eases the craving for a while. Then decide.',
        'Bed and phone are the setup for the urge. Get up and move instead.',
        'Short bursts of exercise eased cravings. It is worth two minutes.',
      ],
    },
  },
  l16: {
    key: '“Just once” and “I deserve it” are thoughts. You can notice them and still choose.',
    cards: [
      { h: '“Just once” shows up, and it feels like an order.', say: 'You argue with it or you give in. Is there a third way?' },
      {
        h: 'Men tried a therapy built on noticing urges and thoughts, not fighting them. What happened?',
        c: [
          'That is the common worry. It went the other way, and viewing dropped a lot.',
          'There was a big change. Viewing fell by about 93% on average.',
          'Good guess. In a small trial, viewing fell about 93%, against 21% on the waitlist.',
          'The therapy taught noticing thoughts and choosing anyway, with no arguing.',
        ],
      },
      {
        h: 'Notice the thought, name it, and still choose.',
        p: 'Say, “I am having the thought that I deserve this.” The thought can stay, and the choice is yours.',
      },
      {
        h: 'less porn viewing on average, in a small trial of 12 sessions.',
        p: 'Noticing a thought and choosing anyway is a skill you can learn, tested here on porn use itself.',
      },
      {
        h: 'Put “I am having the thought that” in front of it.',
        l: ['“I am having the thought that I deserve this.”', '“There is the ‘just once’ story again.”', 'Then do the next small thing from your plan'],
      },
      {
        h: 'At midnight you think, “Just this once will not matter.” What is the best response?',
        c: [
          'Yes. You noticed it and named it without obeying it. The choice stayed yours.',
          'Arguing keeps you stuck with the thought. You do not have to win. Notice it and choose.',
          'Pushing thoughts away tends to bring them back. Let it be there, and choose anyway.',
          'The thought sounds reasonable, which is why it works. It is a thought, not an order.',
        ],
      },
    ],
    rc: {
      c: [
        'The hard week is real, and the thought is still not an order. Meet the need another way.',
        'Right. It is a thought, not an order. Notice it, name it, and choose.',
        'Having the thought is normal. You only have to notice it.',
        'You do not have to win the argument. Notice it and choose.',
      ],
    },
  },
  l42: {
    key: 'An urge paints pictures, and pictures need room. A minute of shapes for your eyes and hands takes that room.',
    cards: [
      { h: 'One small thought, and then a picture you cannot stop seeing.', p: 'The mind paints it in, and the brighter it gets, the harder it pulls.' },
      {
        h: 'In studies, which of these lowered cravings most?',
        c: [
          'It keeps the mind busy, but number tasks did less. The pull runs on pictures.',
          'Fighting a picture keeps your eyes on it.',
          'Yes. Fitting shapes takes the room the urge uses for its pictures.',
          'Urges do pass. In one study, waiting at a loading screen left more pull than a block game.',
        ],
      },
      {
        h: 'Give your eyes and hands a job, and the picture has no room.',
        p: 'An urge needs the small screen in your mind, and fitting shapes takes that screen.',
      },
      {
        n: '14',
        h: 'points or so off cravings, out of 100, after a three-minute block game.',
        p: 'The drop held all week, and sexual urges were among the cravings it touched.',
      },
      { h: 'Ten minutes of shaping clay lowered chocolate cravings.', say: 'The pictures got fainter. That is what an urge runs on.' },
      {
        h: 'When the picture starts, reach for a puzzle.',
        l: ['Catch it the moment the mind starts painting', 'Play about a minute, eyes on the board', 'Then stand up, move, or go to bed'],
        p: 'In SOS, Fit the shapes does this for you.',
      },
      {
        h: 'It is late. An urge starts, and the picture keeps getting clearer. What first?',
        c: [
          'Every detail you add paints it further, and the pull grows.',
          'Yes. The board takes the room the picture needs, so the pull fades.',
          'That helps a little, but numbers leave the picture screen free.',
          'Your eyes stay busy, but the feed is full of cues for new pictures.',
        ],
      },
    ],
    rc: {
      c: [
        'Fighting a picture keeps your eyes on it. Give them something else to see.',
        'Replaying paints it in further, and the pull grows with it.',
        'Urges do pass, but with nothing to do, the picture has room to grow.',
        'Right. The puzzle takes the space the picture needs.',
      ],
    },
  },
  l43: {
    key: 'An urge pulls you into a picture. Name five things you can see, and the room takes back the space.',
    cards: [
      { h: 'Your body is in a room. Your mind is somewhere else.', p: 'The quickest way back is already all around you.' },
      {
        h: 'In studies, what turned a craving down the most?',
        c: [
          'Word tasks helped a little. Eyes and nose helped more, since a craving is made of those.',
          'Yes. A craving is built from pictures and senses, so a job for the senses turns it down.',
          'A firm “stop” keeps you looking at the urge. Something in the room draws your eyes away.',
          'Urges do pass. And a short task for the senses turned the craving down while it did.',
        ],
      },
      {
        h: 'Give your senses what is in the room, and the picture fades.',
        p: 'The picture uses the same space in your mind as real seeing, feeling and smelling.',
      },
      { h: 'Just smelling jasmine cut a craving more than smelling water.', say: 'Across these studies, cravings fell about a fifth to a quarter.' },
      { h: 'Smokers who learned to notice an urge smoked less that week.', say: 'Their urges were just as strong. What changed was what they did.' },
      {
        h: 'Count your way back: 5, 4, 3, 2, 1.',
        l: ['See 5 things: a lamp, a door, your own hand', 'Feel 4: the chair, your clothes, the floor', 'Hear 3, smell 2, taste 1: a sip of water'],
        p: 'If the picture comes back, return to the room. Coming back is the skill.',
      },
      {
        h: 'An urge hits while you are on the couch, and your mind is already running the picture. What first?',
        c: [
          'With your eyes closed, the picture has nothing to compete with. Open them.',
          'Watching the picture feeds it. Coming back to the room lets the urge pass you by.',
          'Yes. Things in the room take the space the picture was using.',
          'That keeps you in a screen, one tap from the habit. The room is the better place to look.',
        ],
      },
    ],
    rc: {
      o: [
        'Stop, since it did not work',
        'Notice the picture, and go back: 3 things I can hear',
        'Look at the picture again, to see what it wants',
        'Decide I am bad at this',
      ],
      c: [
        'A picture coming back is normal. Going back to the room again is the practice.',
        'Right. Noticing it and coming back is the move itself, and it works each time.',
        'Going back to the picture turns the pull up. The room is where it loosens.',
        'Every mind drifts. Each return is a small win.',
      ],
    },
  },
  l44: {
    key: 'The urge talks only about right now. Picture the hour after, both ways, and pick the hour you want.',
    cards: [
      { h: 'The urge tells you how the next ten minutes will feel.', p: 'It never mentions the hour after, and that hour is close enough to picture.' },
      {
        h: 'Smokers looked at pictures of cigarettes in a brain scanner. What lowered their craving by about a third?',
        c: [
          'A common first try, and tiring. What worked here was a change in what they thought about.',
          'Yes. When they thought past the moment, to what smoking does over time, craving dropped.',
          'Pep talks can feel good. This study tested looking past the moment, to what comes later.',
          'It can. The pictures stayed on the screen, and the craving still dropped.',
        ],
      },
      {
        h: 'Look past the next ten minutes, to the hour after.',
        p: 'Put the hour after giving in beside the hour after riding it out, and the pull loses its grip.',
      },
      { h: 'Your brain already has the brakes.', say: 'Think of the hour after, and you press them.' },
      {
        n: '22% to 49%',
        h: 'fewer cigarettes a day, after 25 practice runs in one short session.',
        p: 'It held for up to a month, and every urge is a chance to practice.',
      },
      {
        h: 'When an urge comes, play the hour forward, both ways.',
        l: ['The hour after giving in: name how it feels', 'The hour after riding it out: name that too', 'See them side by side. Pick the one you want'],
        p: 'In SOS, The hour after does this, and keeps your words for next time.',
      },
      {
        h: 'It is 11 PM, and the urge says, “Just this once. It will feel great.” Which thought plays it forward?',
        o: [
          '“It will feel great for ten minutes”',
          '“I am weak for even wanting it”',
          '“In an hour: empty if I give in, proud if I ride it out”',
          '“I will think about it tomorrow”',
        ],
        c: [
          'That is the urge talking about right now. Play it past the ten minutes, to the hour after.',
          'Shame does not loosen the pull. Seeing the whole picture does.',
          'Yes. You looked at both hours, side by side. Now pick the one you want.',
          'The hour after is closer than tomorrow, and close enough to picture now.',
        ],
      },
    ],
    rc: {
      c: [
        'Fighting head on is tiring. Looking past the moment, to the hour after, works better.',
        'Right. Thinking of what comes later turns craving down, and the skill grows.',
        'The moment of the urge is exactly when playing it forward helps most.',
        'This is a skill, and everyone can practice it.',
      ],
    },
  },
  l45: {
    key: 'Write one true line on a calm day. In the urge, read it slowly, and let calm you speak.',
    cards: [
      { h: 'In the morning it is clear why you want this.', p: 'At night, in an urge, your reasons feel far away, as if someone else wrote them.' },
      {
        h: 'In the middle of an urge, which words are most likely to help?',
        c: [
          'People tend to push back when told what to do. Reasons you came up with land harder.',
          'A big pep talk can backfire. Repeating large positive lines made some people feel worse.',
          'Yes. Reasons you chose while you could see clearly reach you best when it is hard.',
          'An urge is loud, and it still listens. A few true words of your own can tip the choice.',
        ],
      },
      { h: 'Let calm you speak to the hard moment, in your own words.', p: 'Because the words are yours, the urge has less to argue with.' },
      { h: 'When calm, people guess the pull will be weaker than it is.', say: 'Calm you sees clearly, but cannot feel it. So calm you does the writing.' },
      {
        h: 'people, and the more they spoke for change, the more they cut back.',
        p: 'That is why Daybook asks for your words. The urge has a hard time arguing with your own reason.',
      },
      {
        h: 'Write one true line while calm. Read it when it is hard.',
        l: ['Now, while calm: what you want, in your words', 'Keep it small enough to believe', 'When the urge comes, read it slowly, out loud'],
        p: 'In SOS, Your words shows it to you, with your voice note if you recorded one.',
      },
      {
        h: 'An urge hits late at night. You open SOS, and your own line comes up. What is the best way to use it?',
        o: ['Skim it fast and move on', 'Read it slowly, out loud if I can', 'Argue with it: is it even true right now?', 'Swap it for ten big promises'],
        c: [
          'A quick glance gives calm you no time to speak. Read it slowly, out loud if you can.',
          'Yes. Slow and out loud gives your calm self a voice in the hard moment.',
          'In an urge, almost nothing good feels true. You wrote it when you could see clearly.',
          'A pile of big promises is hard to believe in a hard moment. One true line is enough.',
        ],
      },
    ],
    rc: {
      o: [
        '“I am perfect, and nothing can ever stop me.”',
        '“I want to wake up clear, and be there for the people I love.”',
        '“Never again, or I am a failure.”',
        '“Quitting is good for people.”',
      ],
      c: [
        'A line too big to believe can backfire in a hard moment. Make it smaller and truer.',
        'Right. It is your own, and it names what you want. That reaches you in an urge.',
        'A threat brings shame. Write what you want, instead of what you fear.',
        'It is true, and it could be anyone’s. A reason about your own life moves you more.',
      ],
    },
  },
  l29: {
    key: 'Faith is a strength, and it works best with people and a plan. Pray, then do the next small thing.',
    cards: [
      { h: 'You prayed and meant it, and the pull came back anyway.', say: 'Did your faith fail?' },
      {
        h: 'What do the 12 steps pair with faith in God?',
        c: [
          'Many people expect that. Nearly every step after the faith step asks you to do something.',
          'The steps do not ask you to wait. They pair faith with action.',
          'Yes. After step 3, nearly every step asks you to act, and several involve a person.',
          'Step 5 includes admitting it “to another human being.” Faith here comes with people.',
        ],
      },
      {
        h: 'Faith helps, and it works best with people and a plan.',
        p: 'The pull coming back is not your faith failing. It is a sign to pair prayer with a move.',
      },
      {
        h: 'adults, and more AA involvement went with more spiritual practice.',
        p: 'Faith practice and recovery can grow together, alongside people working on the same thing.',
      },
      { h: 'A review of AA research singled out who people spend time with.', say: 'Prayer and people are not rivals. Recovery tends to use both.' },
      {
        h: 'Pair the prayer with a move.',
        l: ['Pick the moment: in bed late with your phone', 'Say one sentence to God', 'Get up and put the phone in the kitchen'],
        p: 'The prayer is yours. The move changes the next ten minutes.',
      },
      {
        h: 'You prayed for help tonight, and the urge is still there. What is the best next step?',
        c: [
          'The pull coming back does not mean your faith failed. Faith works best paired with a move.',
          'Yes. Pray, then move. Getting up changes the next ten minutes.',
          'Prayer matters, and the steps pair it with action. Say your words, then move.',
          'Faith in the steps comes with people. Telling one safe person can help carry it.',
        ],
      },
    ],
    rc: {
      c: [
        'The steps pair faith with action. Pray, then move.',
        'Right. The phone in another room changes the next ten minutes.',
        'Your words matter, and they work best with a move.',
        'Scrolling keeps you in the setup for the urge. Move the phone.',
      ],
    },
  },
  l30: {
    key: 'Stop, breathe out slowly, say your words. Then stand up and do the next small thing.',
    cards: [
      { h: 'You want to pray in the hard moment, and you freeze.', say: 'What do you do in the next minute?' },
      {
        h: 'What makes a short pause most useful in a hard moment?',
        c: [
          'Long is hard in a hard moment. A minute or two can be enough.',
          'Any words that steady you are fine. The shape matters more than perfect words.',
          'You do not need to feel calm first. The pause helps you get there.',
          'Yes. A slow breath out, steadying words and a planned move each have support of their own.',
        ],
      },
      {
        h: 'Stop, breathe out, say your words, do the next small thing.',
        p: 'Phone down, three long breaths out, a short prayer, then stand up and drink some water.',
      },
      { h: 'Slow breathing, noticing urges and planning were each studied.', say: 'A prayer can hold all three.' },
      {
        h: 'Have your words ready before you need them.',
        l: ['One short sentence of your own', 'A line you know by heart from your faith', 'The Serenity Prayer, or one long breath out'],
      },
      {
        h: 'You said your prayer, but the pull is still strong. What is the best next step?',
        c: [
          'Yes. Do not wait to feel better. If the urge wins anyway, the practice still counts.',
          'Peace often comes after the move. Pray, then move.',
          'One hard moment is not a verdict. The pause is practice, and it gets easier.',
          'Your words matter, and they work best followed by a move.',
        ],
      },
    ],
    rc: {
      c: [
        'Right. Stop, breathe out slowly, say your words, then do the next small thing.',
        'The pause ends with a move. Staying put leaves you in the pull.',
        'Scrolling first keeps you in the setup. Pause first.',
        'Waiting alone is hard. The pause gives the moment a shape.',
      ],
    },
  },
  l31: {
    key: 'Guilt can point you toward change, and shame says to hide. Write it, then tell God and one safe person.',
    cards: [
      { h: 'The hardest part can be feeling you let God down, again.', say: 'What do you do with that?' },
      {
        h: 'What do the 12 steps ask you to do with guilt?',
        c: [
          'God is in it, and so is a person: “to another human being,” step 5 says.',
          'Punishment is not one of the steps. An honest inventory is.',
          'Yes. Step 4 is an honest inventory. Step 5 is saying it to God, yourself and another person.',
          'The steps bring it into the open. Buried guilt tends to stay heavy.',
        ],
      },
      {
        h: 'Write it honestly, then tell God and one safe person.',
        p: 'Guilt says “I did something I regret,” and that can point you toward change. Shame says to hide.',
      },
      {
        h: 'People more prone to shame had more alcohol and drug problems.',
        p: 'Guilt-proneness was largely unrelated. Feeling you let God down can stay as guilt that moves you.',
      },
      { h: 'The mind keeps going back to a secret, and that weighs on you.', say: 'Tell one safe person, and you stop carrying it alone.' },
      {
        h: 'Take a small, kind inventory, then tell one person.',
        l: ['Plain facts: “I looked at porn on Tuesday.”', 'What you felt, and what came right before', 'One thing to change, and one person to tell'],
        p: 'A faith leader can offer support, and a licensed therapist can offer treatment. You can have both.',
      },
      {
        h: 'After a slip you think, “God must be so disappointed in me.” What helps most?',
        c: [
          'That is shame talking, and it pushes you to hide. You can come as you are.',
          'The steps never ask for that. They ask for an honest, kind inventory.',
          'Carrying it alone weighs on you every time it comes to mind. One safe person can help.',
          'Yes. That is guilt doing its job, out in the open and pointed toward change.',
        ],
      },
    ],
    rc: {
      c: [
        'Shame says to hide. Guilt about what they did can point them toward change.',
        'Right. Naming what happened, to God and a person, is the road the steps take.',
        'Secrets weigh on people every time they come to mind.',
        'Pushing it away keeps it heavy. Bringing it into the open helps.',
      ],
    },
  },
  l32: {
    key: 'Forgiving yourself is not excusing it. It is how you get back to the next right step.',
    cards: [
      { h: 'Forgiving yourself can feel like letting yourself off the hook.', say: 'Does it make the next slip easier?' },
      {
        h: 'Students who forgave themselves for putting off studying faced the next exam. What happened?',
        c: [
          'Yes. They felt less negative, and they put off studying less before the next exams.',
          'That is the common fear. In this study, it went the other way.',
          'There was a difference, and it went the hopeful way.',
          'Forgiving themselves went with doing better.',
        ],
      },
      {
        h: 'Forgiving yourself gets you to the next right step.',
        p: 'You can say “That was wrong for me” and “I am not throwing myself away” at the same time.',
      },
      { h: 'Forgiving went with doing better next time.', p: 'Researchers followed first-year students from one mid-term exam period to the next.' },
      {
        h: 'After a slip, ask forgiveness, then take the next right step.',
        l: ['Ask the way your faith teaches', 'Log it, and do one small thing within the hour', 'Plan amends with a counselor or faith leader'],
        p: 'Step 9 makes amends “except when to do so would injure them or others.”',
      },
      {
        h: 'You slipped and asked for forgiveness, but feel you should still suffer. What next?',
        c: [
          'Punishment uses up the energy you need for the next step.',
          'Forgiving is not forgetting. Look at what happened, then move forward.',
          'Yes. Forgiveness frees your energy for the next right step.',
          'Honesty matters, and amends need care. Plan it with a counselor, sponsor or faith leader.',
        ],
      },
    ],
    rc: {
      c: [
        'In the study, forgiving went with doing better next time.',
        'Right. You stop spending energy on punishment and spend it on the next step.',
        'Forgiving is not forgetting. You still learn from it.',
        'Nobody gets perfect first. Forgiveness is how people get back up.',
      ],
    },
  },
  l5: {
    key: 'Say “I slipped last night.” Leave out “I am a failure.” Then do your next good thing.',
    cards: [
      { h: '“I am disgusting.” “I always ruin everything.”', say: 'Does a line like that help?' },
      {
        h: 'Which kind of self-talk goes with more problems?',
        c: [
          'That is guilt, and it was mostly unrelated to problems. You can learn from an action.',
          'Yes. That is shame. People more prone to it had more alcohol and drug problems.',
          'The two pulled apart. Shame went with more problems, and guilt mostly did not.',
          'It feels private, but it showed up in the results. More shame went with more problems.',
        ],
      },
      { h: 'Describe what you did, not who you are.', p: '“I did something” leaves you something to repair. “I am something” tends to push you to hide.' },
      { h: 'People prone to shame had more alcohol and drug problems.', p: 'Being harsh with yourself does not keep you on track.' },
      {
        h: 'Swap “I am” for “I did.”',
        l: ['Catch it: “I am a failure.”', 'Swap it: “I slipped last night.”', 'Log it or check in within the hour'],
        p: 'James Clear calls every action a vote for who you are becoming. One slip is one vote.',
      },
      {
        h: 'You slipped last night. This morning you think, “I am disgusting.” What helps most?',
        c: [
          'It feels serious, but that is shame, and shame tends to push people to hide.',
          'Ignoring it skips the useful part. Look at what happened, and leave out who you are.',
          'A big promise after a slip is often shame in disguise. One good next move counts for more.',
          'Yes. You name the act and you make the next good move. That keeps one slip one slip.',
        ],
      },
    ],
    rc: {
      c: [
        'That is still a verdict on you, and shame tends to push people to hide.',
        'Right. It names the act, and it leaves you room to do something.',
        'That is the snowball talking. It does matter, and you can do something about it.',
        'Perfect is a promise nobody keeps. Name the act and take the next small step.',
      ],
    },
  },
  l6: {
    key: 'Kindness did not make people give in more. Talk to yourself like a friend, then do one small thing.',
    cards: [
      { h: 'After a slip, you come down hard on yourself.', say: 'If you go easy, will you just do it again?' },
      {
        h: 'Strict dieters broke their diet, and some then got a kind message. What happened?',
        c: [
          'That is the common fear. In this test, the kind message did not lead to more eating.',
          'There was a difference, and it went the hopeful way.',
          'Yes. Among the strictest eaters, the kind message meant less distress and less eating.',
          'The caring stayed. Kindness only made it easier to get back on track.',
        ],
      },
      {
        h: 'Being kind to yourself does not make you slip more.',
        p: 'You look at what happened without attacking yourself, and that is when you can learn from it.',
      },
      { h: 'Strict dieters who got a kind message ate less, not more.', p: 'Going easy did not let them off the hook. It helped them get back on track.' },
      {
        h: 'Talk to yourself the way you would to a friend.',
        l: ['Say it: “That was hard. What do I need now?”', 'Then do one small thing: water, air, a text'],
        p: 'Kind and practical beats harsh and stuck.',
      },
      {
        h: 'A friend tells you they slipped again and feel awful. What would help them most?',
        c: [
          'Many people grew up with that voice. The experiment points the other way.',
          'Yes. Kind and practical. Now say the same thing to yourself after a slip.',
          'Kind, but it skips looking at what happened. You can look without attacking.',
          'That is the snowball thought. If a friend should not hear it, you should not either.',
        ],
      },
    ],
    rc: {
      c: [
        'Punishing yourself feels like learning. Kindness is what helped people get back on track.',
        'Right. Kind and practical. Then do the next small thing.',
        'Kind does not mean ignoring it. Look at what happened, without attacking yourself.',
        'Harsher is no safer. Kindness after a slip did not make people slip more.',
      ],
    },
  },
  l7: {
    key: 'A secret weighs on you each time it comes to mind. One safe person can share the weight.',
    cards: [
      { h: 'Nobody has asked about it today, and it still feels heavy.', say: 'Where does that weight come from?' },
      {
        h: 'When does a secret weigh on people the most?',
        c: [
          'That is what most people expect. The bigger cost showed up in the quiet moments.',
          'Secrets do not fade that neatly. They come back to mind again and again.',
          'Yes. Minds went back to secrets far more often than people had to hide them.',
          'Hiding takes effort, but people thought about secrets far more often than they hid them.',
        ],
      },
      { h: 'The weight is in the carrying, not only in the hiding.', p: 'It comes to mind far more often than you ever have to hide it.' },
      {
        h: 'secrets studied. The more one came to mind, the lower the well-being.',
        p: 'If this feels heavy, that weight is real, and one safe person can take some of it.',
      },
      {
        h: 'Choose one safe person, and decide how much to tell.',
        l: ['Someone likely to respond calmly', 'One sentence is enough. A text is fine.', 'Say what you need back: “Just say thanks.”'],
        p: 'If nobody feels safe yet, a counselor or a group is a place to start.',
      },
      {
        h: 'You want to tell someone, and you fear how they will react. Which first step would you try?',
        c: [
          'Low pressure, and you choose the words: “Can I tell you something? No advice needed.”',
          'A walk or a drive can feel easier than face to face. Ask: “Can we talk tonight?”',
          'Getting it on paper makes it easier to say. Write three sentences, send only the first.',
          'Good if nobody in your life feels safe yet. They are trained to listen without judging.',
        ],
      },
    ],
    rc: {
      c: [
        'That keeps you carrying it alone, and it comes back every time it crosses your mind.',
        'Right. One safe person, one sentence, and you say how much.',
        'You choose how much to share. One honest sentence is enough to start.',
        'You can share this while you are still working on it. Waiting means carrying it alone.',
      ],
    },
  },
  l8: {
    key: 'A habit is something you do. Honesty and closeness are skills, and you can practice them now.',
    cards: [
      { h: 'You worry this habit means you cannot love, or be loved.', say: 'That is heavy. Is it true?' },
      {
        h: 'What does a habit like this say about your ability to love?',
        c: [
          'That is what shame says. A habit is something you do, and it does not measure who you are.',
          'A habit does not decide that. Honesty and closeness are skills you can build.',
          'Loneliness and porn use tend to go together, so people are part of the way out.',
          'Yes. Habits change. What love needs, like honesty and patience, can be practiced now.',
        ],
      },
      { h: 'A habit is not a verdict on whether you can love.', p: 'Honesty, patience and asking for what you need are skills. You can start on them now.' },
      { h: 'A US definition of recovery has love in it.', say: 'Wanting love is part of what quitting is for.' },
      { h: 'Lonelier people tended to use more porn.', p: 'It may run both ways, so a call or a walk with someone works on the habit from the other side.' },
      {
        h: 'Take one small step toward people this week.',
        l: ['Text someone you trust, about anything', 'Look at a free group, and just listen at first', 'Say one honest sentence to one safe person'],
      },
      {
        h: 'You like someone, but you think, “I am too broken for this.” What is the best move?',
        c: [
          'Pulling away feels protective, but it feeds the loneliness that can feed the habit.',
          'You do not have to be finished to practice honesty. Those skills grow by using them.',
          'Yes. A habit is something you do, and honesty and patience grow when you practice them.',
          'A partner cannot carry this for you. The relationship can grow alongside your own work.',
        ],
      },
    ],
    rc: {
      c: [
        'Right. Wanting love is not the problem, and closeness is a skill you can practice now.',
        'You do not have to finish first. What love needs can be practiced along the way.',
        'That is shame talking. A habit does not decide whether you can be close to someone.',
        'Nobody gets a perfect life first. People build closeness while still working on things.',
      ],
    },
  },
  l47: {
    key: 'Trust comes back through what you do, week after week. A slip you tell goes better than a slip they find.',
    cards: [
      { h: 'Your partner does not know. Or they found out.', say: 'How do you make it right without making it worse?' },
      {
        h: 'Some time after one partner told about compulsive sexual behavior, how did couples feel about the telling?',
        c: [
          'That is the fear. Looking back, very few in this survey felt that way.',
          'At the time, those who told were less sure. Later, they were even surer than their partners.',
          'Yes. It was very hard, and later nearly everyone in the survey said it was right.',
          'In this survey most had not, even many who had threatened to leave.',
        ],
      },
      {
        h: 'Telling ends the hiding, and trust cannot grow around hiding.',
        p: 'Your partner has every right to be hurt, and what you do over weeks and months is what rebuilds trust.',
      },
      {
        h: 'of partners later said telling was right, and 96% of those who told.',
        p: 'It can feel like the end on the day, yet about three in four partners who threatened to leave never left.',
      },
      { h: 'A slip you tell goes better than a slip they find.', p: 'The hiding is the part you can change tonight.' },
      {
        h: 'Be the one who tells.',
        l: ['Tell it plainly, with no excuses', 'Do what you said, small and on time', 'Give them room. Their timeline is theirs.'],
        p: 'If telling would not be safe, talk to a counselor first. Being honest is yours, whatever happens.',
      },
      {
        h: 'Two honest months with your partner. Last night you slipped, and they cannot know. What gives trust the best chance?',
        c: [
          'It feels protective, but trust breaks on the hiding, and a slip that is found goes worse.',
          'Yes. It is hard, and it is what you have been building for two months. They can believe you.',
          'A big promise is easy to say and easy to break. What you do next says more.',
          'That makes them your police. A blocker or a counselor can carry that weight instead.',
        ],
      },
    ],
    rc: {
      q: 'Your partner found out months ago and still goes quiet some nights. You think, “I said sorry.” What is the truest read?',
      o: [
        'They are punishing me',
        'Trust comes back through what I do, on their timeline',
        'One big apology should have settled it',
        'If we stop talking about it, it will fade',
      ],
      c: [
        'Hurt takes time, and it is a different thing from punishment. Keep doing what you said.',
        'Right. An apology starts it, and what you do keeps it going.',
        'An apology is a start. Trust is rebuilt by what you do after it.',
        'Silence can feel like hiding. Staying open is part of what rebuilds trust.',
      ],
    },
  },
  l48: {
    key: 'Desire can go quiet for a while, and your body is not broken. On masturbation, your values decide.',
    cards: [
      { h: 'You quit, and now you have questions you cannot ask anyone.', say: 'Is low desire normal? Is masturbation okay?' },
      {
        h: 'In a survey of more than 14,000 people on porn and sex, what went with more sexual problems?',
        c: [
          'That is the common guess. Watching more often was not linked to more problems.',
          'Yes. Problem use went with sexual problems, about the same for women and men.',
          'The link was about the same for women and men.',
          'Something did. People who felt their use was out of control had more of them.',
        ],
      },
      {
        h: 'Desire can go quiet for a while. That is not a broken body.',
        p: 'You do not need to “check” with porn, and nobody has shown that quitting harms your sex life.',
      },
      {
        h: 'wrote about a sharp drop in desire while quitting porn.',
        p: 'Nobody can tell you when yours will settle, and many in those journals wrote of more desire for a partner.',
      },
      {
        h: 'Nobody has shown that porn breaks erections.',
        p: 'Quitting is no sure cure either. If your body worries you, ask a doctor. It is an ordinary question.',
      },
      { h: 'On masturbation, science has no rule for you.', say: 'Your values decide this, and your faith is a good reason.' },
      {
        h: 'studies found that couples who talk about sex tend to have better sex.',
        p: 'A healthy sex life is built with a person, in words, awkward talk included.',
      },
      {
        h: 'Decide what you want, and give your body time.',
        l: ['Skip the test. A quiet stretch needs no check.', 'Choose your line while you are calm', 'Tell a partner what is going on, and go slowly'],
        p: 'A doctor can help with your body, a counselor or sex therapist with the rest.',
      },
      {
        h: 'Three weeks in, desire has gone quiet. A thought says, “Better check with porn that it still works.” What is the best move?',
        o: ['Check once, just to know', 'Decide that my body is broken', 'Push myself to feel desire every day', 'Call it a quiet stretch and skip the test'],
        c: [
          'That test tells you little about real life, and it is a common way back in.',
          'Nobody has shown that quitting harms your sex life. A quiet stretch is not a verdict.',
          'Pressure does not bring desire. Rest and time are kinder, and you have both.',
          'Yes. You read it for what it is, and a doctor is there if it worries you.',
        ],
      },
    ],
    rc: {
      o: ['Never. Science says it causes relapse', 'Always. Science says it helps', 'Science has no rule. Your values decide', 'Do not think about it'],
      c: [
        'No study shows that. Some people leave it aside for reasons of their own.',
        'No study shows that either. Some people keep it, and some do not.',
        'Right. It is honest about what is not known, and it leaves the choice with them.',
        'Pushing a thought away tends to make it louder. A clear choice is easier to live with.',
      ],
    },
  },
  l9: {
    key: 'Write “If this happens, then I will do that” while you are calm. At 1 AM you only have to follow it.',
    cards: [
      { h: 'At 8 PM you know what you want. At 1 AM you are tired.', say: 'Why is a good choice so hard at that hour?' },
      {
        h: 'What helps people follow through on a goal the most?',
        c: [
          'Plenty of people want a goal and still do not follow through. Planning the moment helped.',
          'A clear goal helps, but people who also planned the moment followed through more.',
          'Yes. People who made if-then plans followed through more than those who only set the goal.',
          'Guilt reminders feel motivating, but they do not tell you what to do in the moment.',
        ],
      },
      { h: 'Decide ahead of time, with an if-then plan.', p: 'When the moment comes, you follow the plan you made while you were calm.' },
      { h: 'People who made if-then plans followed through more.', say: 'That came from many studies, on many kinds of goals.' },
      {
        h: 'Write one if-then for your hardest moment.',
        l: ['“If I am in bed and reach for my phone…”', '“…then I stand up and get a glass of water.”', 'Make it something you can do half asleep'],
      },
      {
        h: 'Which if-then plan is most likely to work at 1 AM?',
        c: [
          'Being strong is a wish. A good “then” is a thing you can do half asleep.',
          'Yes. It is small and exact. At 1 AM you only have to follow it.',
          'That plans for after the slip. Aim the plan at the hard moment itself.',
          'That is a goal. It does not say what to do when the urge hits.',
        ],
      },
    ],
    rc: {
      c: [
        'A promise is a wish. A plan says exactly what you will do in the moment.',
        'Right. It is small, and you decided it ahead of time. On Sunday you only have to follow it.',
        'Deciding in the moment is the hard way. Decide now, while you are calm.',
        'That is big and hard to keep. One small if-then for the hard hour works better.',
      ],
    },
  },
  l10: {
    key: 'Habits lean on the room, the device, the hour. Change one, and the cue gets weaker.',
    cards: [
      { h: 'The bed, late, phone in hand.', say: 'Why does the urge wait for that same scene?' },
      {
        h: 'Students moved to a new university. What happened to their old habits?',
        c: [
          'Where the new place was similar, habits carried on. Where it changed a lot, they broke.',
          'The study looked at the setting. Where it changed a lot, the old habits were disrupted.',
          'A fair worry, but habits tied to the old setting were disrupted when it changed a lot.',
          'Yes. When the setting changed a lot, what students did followed their intentions more.',
        ],
      },
      { h: 'Habits lean on their setting. When it changes, they loosen.', p: 'The cue gets weaker, and your own intentions get more say.' },
      { h: 'Very different surroundings broke students’ old habits.', p: 'You do not have to move cities. Change the small setting around your hardest hour.' },
      {
        n: '30',
        h: 'minutes or more before bed, the CDC says, turn your devices off.',
        p: 'A fixed screens-off time changes the setting of your hardest hour before it arrives.',
      },
      {
        h: 'Tonight, change one small thing about that setting.',
        l: ['Charge the phone outside the bedroom', 'Add a filter, log out, clear saved links', 'Take the hard hour to another room, or walk'],
        p: 'A cheap alarm clock solves the alarm problem.',
      },
      {
        h: 'Most of your slips happen in bed, late, on your phone. Which change does the most?',
        c: [
          'Yes. That changes the exact setting the habit leans on. No phone in bed, no cue.',
          'Promises leave the setting the same, and the setting is what keeps the habit running.',
          'Some friction helps, but the phone in bed is the main cue. Move the phone.',
          'Being more tired makes urges look bigger. Change where the phone sleeps instead.',
        ],
      },
    ],
    rc: {
      c: [
        'Resisting in the same setting is the hard way. Change it so the cue weakens.',
        'Right. The habit leans on that desk and that hour. Leave them, and the cue gets weaker.',
        'Feelings change by the hour. A fixed change to the setting does not depend on them.',
        'Tracking helps you see it, and changing the setting is what weakens the cue.',
      ],
    },
  },
  l11: {
    key: 'Use your own words for it. What counts is what it does to your life, and help is there either way.',
    cards: [
      { h: 'You keep hearing different names for this.', say: 'Do you have to pick the right one before you get help?' },
      {
        h: 'What matters most when you decide whether to get help?',
        c: [
          'Experts still debate the name. You can get help without one.',
          'Comparing does not help. Look at your own life, and what you want.',
          'Yes. Sleep, focus, time, relationships, how you feel about yourself. Those count.',
          'A week settles nothing either way. Look at what it does to your life.',
        ],
      },
      {
        h: 'Use your own words. What counts is what it does to your life.',
        p: '“Problematic” or “compulsive” are fair, neutral words. Help does not wait for you to choose.',
      },
      { h: 'The WHO lists lost control over sexual urges, and what it costs.', say: 'That is worth getting help for, whatever you call it.' },
      { h: 'The main US psychiatric manual does not list porn addiction.', say: 'People still argue about the name. What helps does not wait.' },
      {
        h: 'Pick one kind of help to look into.',
        l: ['A therapist, free or low-cost', 'A group. It is free, and you can just listen', 'One honest sentence to someone you trust'],
        p: 'For a therapist, try an EAP at work, Open Path or a community health center.',
      },
      {
        h: 'You are not sure if what you have is “addiction.” What is the best next step?',
        c: [
          'You do not need a label first. If it costs you sleep, focus or peace, help fits now.',
          'Experts still debate the names. Help does not depend on picking one.',
          'Going without a label does not make it small. Look at what it does to your life.',
          'Yes. Your words are fine, and help is there whatever you call it.',
        ],
      },
    ],
    rc: {
      c: [
        'Help does not depend on a label. Look at what it does to their life.',
        'Their own words are fine. If it costs them sleep or time, help fits.',
        'No diagnosis needed. Groups are open to anyone who wants to change.',
        'Nobody needs a crisis first. If it costs them now, that is enough.',
      ],
    },
  },
  l12: {
    key: 'Getting better is growth with setbacks, across your whole life. A streak is one part of it.',
    cards: [
      { h: 'You had a good stretch, and then you slipped.', say: 'Does that put you back at zero?' },
      {
        h: 'What do you think getting better usually looks like?',
        c: [
          'Most people start with that picture. Recovery is usually less tidy.',
          'Yes. It grows over time, and a setback can sit inside that.',
          'A setback does not erase what you built. The growth keeps adding up.',
          'A streak can be one part. The change is a whole life getting better.',
        ],
      },
      {
        h: 'Growth over time, with setbacks, across your whole life.',
        p: 'It looks like better sleep, a steadier home, and people around you. Setbacks do not undo it.',
      },
      { h: 'A US health agency says recovery “may involve setbacks.”', say: 'A setback does not mean you failed. What you built is still there.' },
      { h: 'The same definition names four parts of a life that holds.', p: 'Building these four is building the life you are quitting for.' },
      { h: 'Count these as progress too.', l: ['An honest log, even after a slip', 'An urge ridden out', 'A night with the phone outside the bedroom'] },
      {
        h: 'You went three weeks with no slip, then slipped. What is the most accurate way to see it?',
        c: [
          'The three weeks still happened, and so did what you learned.',
          'That is the snowball thought talking. A setback is part of the process.',
          'Yes. The growth you built still counts, and you go on from here.',
          'Perfect is not the bar. Growth with setbacks is what recovery looks like.',
        ],
      },
    ],
    rc: {
      c: [
        'The month happened, and so did what you learned. Setbacks do not erase growth.',
        'Getting better is not a straight line. Keep going.',
        'That is the snowball thought. Two slips are two events, nothing more.',
        'Nothing needs resetting. You keep what the month built and go on.',
      ],
    },
  },
  l17: {
    key: 'A slip usually starts hours earlier. Catch one early link, while it is quiet, and the last may never form.',
    cards: [
      { h: 'A slip can feel like one sudden moment.', p: 'Looking back, there is often a trail of small choices.' },
      {
        h: 'When is the easiest moment to stop a slip?',
        c: [
          'Early on, the urge is quiet and you think more clearly.',
          'The peak is the hardest moment of all. Catching it earlier asks much less of you.',
          'That is too late for this one. The easier moment came hours before.',
          'A bad day still has several early links you can change.',
        ],
      },
      {
        h: 'A slip is usually the last link in a chain of small choices.',
        p: 'For porn, it might be the phone by the bed “in case someone texts.” Each one looks harmless.',
      },
      { h: 'Coping with a risky moment mattered more than meeting one.', say: 'Every early link you catch is practice for the next one.' },
      {
        h: 'Learn your early links, and swap one.',
        l: ['Charge the phone in another room', 'Name what you are looking for, or close it', 'Set a fixed lights-out time'],
      },
      {
        h: 'Which of these is an early link you could catch hours before a slip?',
        c: [
          'That is the last link, the hardest place to stop. Look earlier in the chain.',
          'That comes after. The early links come hours before.',
          'Yes. It looks harmless, and that is the sign. Swap it, and the last link may never form.',
          'By the peak, the chain is almost complete. The easier move is hours earlier.',
        ],
      },
    ],
    rc: {
      c: [
        'Late at night is the hardest place to stop. Change the early link instead.',
        'Staying up is the early link. Catch it, and the last link may never form.',
        'That is the last link. Look earlier in the chain.',
        'Feeling bad does not change the chain. A swap for the early link does.',
      ],
    },
  },
  l18: {
    key: 'Permission thoughts sound reasonable. Spot one, name it, and answer it in one short line.',
    cards: [
      { h: '“I have earned it.” “It is not that bad.”', say: 'Has a thought that sounded fair ever talked you into it?' },
      {
        h: 'What is the best way to handle a thought like “I have earned it”?',
        c: [
          'Debates at 1 AM are hard to win, and you do not need one.',
          'Ignored, it keeps working quietly. Spotting it takes away its power.',
          'That is the thought doing its job. It is a permission thought.',
          'Name it as a permission thought and answer in one line. That is enough.',
        ],
      },
      {
        h: 'Spot a permission thought, and answer it in one line.',
        p: 'They sound reasonable on purpose, and you do not need a debate. A short, calm reply will do.',
      },
      { h: 'A life of all shoulds makes the quick reward look better.', say: '“I have earned it” often means you need rest or fun. Plan some in.' },
      {
        h: 'Have a one-line reply ready.',
        l: ['“That is a permission thought.”', '“I decided this earlier, when I was clearer.”', '“What do I need right now?”'],
        p: 'Then meet the need: rest, food you like, a show, a long shower, a call.',
      },
      {
        h: 'After a stressful week you think, “I have earned a little release.” What is the best response?',
        c: [
          'The hard week is true, and this is still a permission thought. Rest can come another way.',
          'Yes. You spotted the thought and met the need another way.',
          'Harsh does not help either. You do deserve rest and fun, in a kind that does not cost you.',
          'Waiting lets it keep working. Name it now, while it is still quiet.',
        ],
      },
    ],
    rc: {
      c: [
        'It sounds fair, which is why it works. It is a permission thought.',
        'Spot it, name it, and answer it in one short line.',
        'Having the thought is normal. Spotting it is a skill.',
        'The thought is not evidence. Hold it up next to your reasons.',
      ],
    },
  },
  l19: {
    key: 'Write it down, then look back. Once a week, ask when it was hard, what set it off and what helped.',
    cards: [
      { h: 'A log can feel like homework, or like a scoreboard.', say: 'Are you learning anything from yours?' },
      {
        h: 'In many experiments, when did tracking progress help people the most?',
        c: [
          'Keeping track in your head helped less. Writing it down made the effect bigger.',
          'That hides the useful part. The hard days are where the map is.',
          'Yes. The effect was bigger when people wrote it down or told someone.',
          'It did change things. Prompting people to track raised how often they reached their goals.',
        ],
      },
      { h: 'Write it down, then look back.', p: 'Your log is a map of your hard hours. Once a week, looking back turns entries into answers.' },
      {
        h: 'experiments, and tracking helped people reach their goals more often.',
        p: 'Honest entries and a weekly look back are the kind of tracking that helps most.',
      },
      { h: 'Once a week, ask your log three questions.', l: ['When was the hardest moment?', 'What set it off?', 'What helped, even a little?'] },
      {
        h: 'Your log shows most hard nights are Sundays after 11 PM. What is the best next step?',
        c: [
          'A pattern that repeats is worth acting on. That is what the log is for.',
          'Hiding the hard days hides the map. Honest entries make it useful.',
          'A promise does not change the setup. Use the pattern to plan for that hour.',
          'Yes. The log showed you where to aim, and now your plan goes there.',
        ],
      },
    ],
    rc: {
      c: [
        'Writing it down helps, and looking back is where it turns into answers.',
        'Five minutes a week turns entries into a plan.',
        'The old entries are the most useful part. Look back at them.',
        'The hard days are the map. Honest entries are what make it useful.',
      ],
    },
  },
  l20: {
    key: 'Strong self-control looks like fewer fights. Arrange your day for it, and count the ones you skip.',
    cards: [
      { h: '“I just need more willpower.”', p: 'Many people say it, then measure themselves by how often they lose.' },
      {
        h: 'Adults reported their temptations all week. What did those with strong self-control do?',
        c: [
          'Most people expect that. They did less resisting, because they ran into fewer clashes.',
          'Yes. Higher self-control went with less clash and less resisting.',
          'They still had desires. They ran into fewer clashes with their goals.',
          'The difference was fewer clashes in the first place.',
        ],
      },
      { h: 'Strong self-control looks like fewer fights.', p: 'Phone out of the bedroom, a plan for the late hours. Each fight you skip needs no willpower.' },
      {
        h: 'adults for a week. Those with more self-control resisted less.',
        p: 'If you have been calling yourself weak, start counting the fights you removed.',
      },
      {
        h: 'Remove one fight before it starts.',
        l: ['Move the charger out of the bedroom', 'Plan the first hour after dinner', 'Log out, delete the app, or add a filter'],
      },
      {
        h: 'You keep losing the late-night fight with your phone. What is the best move?',
        c: [
          'Resisting harder keeps the fight going every night. The aim is fewer fights.',
          'Losing the fight says the setup needs to change. It says nothing about your will.',
          'Yes. Put the phone out of the bedroom, and there is no fight to lose.',
          'That keeps the fight in your nights. Remove the fight instead.',
        ],
      },
    ],
    rc: {
      c: [
        'Strong self-control looked like fewer fights, not more resisting.',
        'Remove the fight before it starts. That needs no willpower.',
        'That keeps the fight going every night.',
        'Counting wins keeps the fight in place. Remove it instead.',
      ],
    },
  },
  l41: {
    key: 'Replaying the picture turns the pull up. Noticing what it really gives, with curiosity, turns it down.',
    cards: [
      { h: 'You pictured it all afternoon. Ten minutes after, you felt flat.', p: 'The picture is bright and loud. What happens is smaller than it promised.' },
      {
        h: 'Which kind of thinking makes the pull weaker over time?',
        c: [
          'Looking away leaves the picture in charge. A short, honest look does more.',
          'That is replaying. Each run through the details makes it louder.',
          'Yes. Honest noticing shows the habit gives less than it promised, and the pull wears down.',
          'Shame is not seeing clearly. In one study, more shame went with more relapse.',
        ],
      },
      {
        h: 'Picturing feeds the pull. Noticing what happens wears it down.',
        p: 'The reel always looks better. Notice your body and the hour after, and over time the habit loses its shine.',
      },
      { h: 'Replaying the details turns the pull up.', p: 'In a study of 191 adults, going over it again and again turned up the craving for porn.' },
      {
        n: '31%',
        h: 'of smokers taught curiosity about cravings were not smoking, against 6%.',
        p: 'That is four months on, against a standard program. Each honest look teaches your brain what a habit gives.',
      },
      {
        h: 'Look at what it gives, before and after.',
        l: ['Catch the picture. Say “that is the replay.”', 'If you slip, see how you feel ten minutes on', 'Then ask what it promised, and what it gave'],
        p: 'Talk it through and Rekindle walk you through it, and keep your numbers.',
      },
      {
        h: 'It is 4 PM. You keep picturing tonight: the time, the room, what you would watch. What is the best move?',
        c: [
          'That is the replay. Each run through the details makes tonight louder.',
          'Yes. You caught the replay, and you are deciding while you can see clearly.',
          'Shame does not loosen the plan. An honest, curious look does.',
          'Tonight is the hardest time to decide, and the pull will be stronger than you guess.',
        ],
      },
    ],
    rc: {
      c: [
        'Replaying the details keeps the picture loud. One honest look helps more.',
        'Looking away leaves the picture in charge. A short, honest look teaches your brain.',
        'What it gave, and how you felt after, is what wears the habit down.',
        'A slip is information. Seeing it clearly is how change happens.',
      ],
    },
  },
  l25: {
    key: 'The steps are honesty, help from other people, and action. Borrow the parts that fit you.',
    cards: [
      { h: 'You have heard of the 12 steps.', say: 'What do they ask of you?' },
      {
        h: 'A big review compared AA-based programs with other treatments for drinking. What did it find?',
        c: [
          'Many people expect that. On staying fully sober, the AA-based programs did a bit better.',
          'The review did not sort people by faith. Overall, more people stayed sober with them.',
          'On some measures there was little difference. On staying fully sober, they did better.',
          'About 42 in 100 were fully sober a year later, against about 35 with other treatments.',
        ],
      },
      { h: 'The steps come down to honesty, other people, and action.', p: 'These are plain words, not AA’s own.' },
      {
        h: 'studies on alcohol, and step programs helped more people stay sober.',
        p: 'They held up well in careful research. The same three ingredients are worth borrowing for porn.',
      },
      { h: 'Men further along the steps had less compulsive sexual behavior.', say: 'People with problems like yours use the steps too.' },
      {
        h: 'Borrow the parts that fit. You do not have to join anything.',
        l: ['Keep an honest log, slips included', 'Tell one safe person the truth', 'A daily check-in keeps it going'],
        p: 'Groups like Sex Addicts Anonymous adapt the steps. At a first meeting you can just listen.',
      },
      {
        h: 'You are curious about the steps but unsure about joining a group. What is the best first move?',
        c: [
          'You can borrow the parts that fit. It is not all or nothing.',
          'Yes. Honesty, people and action are the core, and you can start with one today.',
          'Rushing does not help, and some steps, like making amends, need care. Start with one idea.',
          'You do not need to agree with all of it first. Many people start by listening.',
        ],
      },
    ],
    rc: {
      c: [
        'Groups like Sex Addicts Anonymous adapt the steps for other problems.',
        'The core ideas travel, and you can borrow the parts that fit.',
        'Several steps mention God “as we understood Him,” and people use them in different ways.',
        'You can start with one idea, like telling one safe person.',
      ],
    },
  },
  l26: {
    key: 'There is a skills-based group, SMART, and you can borrow its tools with or without a meeting.',
    cards: [
      { h: 'The 12 steps do not feel like your thing.', say: 'Is there another kind of group?' },
      {
        h: 'What do you think SMART Recovery mainly teaches?',
        c: [
          'Good guess. Motivation, urges, thoughts and feelings, a balanced life, each with tools.',
          'That is closer to AA’s step 1. SMART talks about “self-empowered” recovery.',
          'SMART meetings use inclusive language, with no religious content.',
          'The opposite. One of its points is managing thoughts and feelings.',
        ],
      },
      { h: 'Four skills, and each comes with tools you can use today.', p: 'The toolbox holds a cost-benefit list, an urge log, and DENTS for urges.' },
      {
        h: 'studies of SMART Recovery in one review, with positive effects found.',
        p: 'Most were about alcohol. It is a fair thing to try if a skills-based, non-religious group fits you.',
      },
      {
        h: 'Borrow one SMART tool, no meeting needed.',
        l: ['Write what porn gives you and what it costs', 'Note when and why urges come', 'DENTS: delay it, step away, swap in a task'],
      },
      {
        h: 'You want a group, but saying you are “powerless” does not sit right. What fits best?',
        c: [
          'There is more than one kind. SMART talks about self-empowered recovery.',
          'You can try one, but the feel of a group matters. SMART may fit you better.',
          'Yes. Skills, no religious content, and the tools work without a meeting.',
          'No program is best for everyone. Try two or three and see what fits.',
        ],
      },
    ],
    rc: {
      c: [
        'Escape is a DENTS move. Change the setting, and the urge has less to grab.',
        'Delay in DENTS means riding it out now, not putting the decision off until tonight.',
        'Scrolling keeps the trigger close. Escape, or swap in a task.',
        'SMART is about self-empowered recovery. Pick a DENTS move.',
      ],
    },
  },
  l27: {
    key: 'You can learn to pause. Stop, observe, breathe, expand, respond, and the next move is yours.',
    cards: [
      { h: 'An urge hits, and you have acted before you decided.', say: 'Can you learn to pause first?' },
      {
        h: 'People leaving treatment for drugs or alcohol learned relapse prevention. What happened?',
        c: [
          'There was a clear difference over 12 months.',
          'Good guess. Next to usual aftercare, risk of drug use and heavy drinking was much lower.',
          'It went the other way. Relapse prevention lowered risky use.',
          'The effect was measured over 12 months, well past a week.',
        ],
      },
      {
        h: 'A one-minute pause lets you notice the urge and choose.',
        p: 'You stop, notice your body and mind, breathe, take in the room, and choose what to do.',
      },
      {
        h: 'adults after treatment, and relapse prevention cut risky use for a year.',
        p: 'Pausing and choosing is a skill you can learn, and these people were quitting other habits.',
      },
      {
        h: 'Practice the one-minute pause once a day.',
        l: ['Stop what you are doing', 'Notice what you feel, and breathe slowly', 'Take in the room, then choose your next move'],
      },
      {
        h: 'Late at night, you notice you have opened your browser without thinking. What is the best move?',
        c: [
          'Starting on autopilot does not mean finishing. This is the moment to pause.',
          'Harsh does not help you choose. A calm pause does.',
          'Now is the moment. One minute is enough.',
          'Yes. You caught autopilot and gave yourself the choice back.',
        ],
      },
    ],
    rc: {
      c: [
        'A one-minute pause takes you off autopilot and back to choosing.',
        'You do not need an hour. One minute is enough to choose.',
        'Fighting keeps your attention on it. Pause, notice, and choose.',
        'Acting fast is autopilot. Pause first.',
      ],
    },
  },
  l28: {
    key: 'A group changes who you spend time with. Start small: listen at one meeting, or ask one person to check in.',
    cards: [
      { h: 'A room of strangers sounds awkward, even scary.', say: 'Could it help you quit?' },
      {
        h: 'A review of 25 years of research asked how AA helps people. What stood out?',
        c: [
          'Rules were not the standout. Who people spent time with was.',
          'Fear was not what helped. Changes in who people spent time with stood out.',
          'Good guess. People swapped some old company for people who supported their change.',
          'The review found several routes, most of all a change in who people spent time with.',
        ],
      },
      {
        h: 'A group changes who you spend time with, and that helps.',
        p: 'It puts people around you working on the same thing, and the first time, listening is enough.',
      },
      {
        h: 'In AA, heavy drinkers left the circle and sober people came in.',
        p: 'Who you spend time with shapes a habit. A group, or one check-in partner, changes that for you.',
      },
      {
        h: 'Start with one meeting, or one check-in partner.',
        l: ['Listen at one meeting, camera off if you like', 'Ask one person to check in on a schedule', 'A sponsor is a peer, not a counselor'],
      },
      {
        h: 'You are nervous about your first group. What is the best way to start?',
        c: [
          'Yes. Listening is enough the first time, and you can leave any time.',
          'You do not have to share anything at first. Listening counts.',
          'Groups differ a lot. Try two or three before deciding.',
          'That is a big jump. Start with one meeting and see how it feels.',
        ],
      },
    ],
    rc: {
      c: [
        'Who you spend time with is one of the main ways people change. Let someone in.',
        'A check-in partner changes who you spend time with, and honesty makes it work.',
        'A check-in only helps if it is honest.',
        'Support helps most while you are still working on it.',
      ],
    },
  },
  l21: {
    key: 'One missed day barely dents a habit. The day after, come back in the smallest way.',
    cards: [
      { h: 'You skipped your check-in yesterday.', say: 'Is the habit broken now?' },
      {
        h: 'How many days do you think it takes a new habit to feel automatic?',
        rv: { n: '66', h: 'days for the typical person, not 21.', p: 'People ranged from 18 to 254 days. Slow and uneven is no sign you are failing.' },
      },
      { h: 'One missed day barely dents a habit.', p: 'What adds up is a string of misses, so the day after a miss is the one that counts.' },
      { h: 'Over 12 weeks, one missed day made little difference.', say: 'Many did. So keep one miss at one.' },
      {
        h: 'Make coming back easy.',
        l: ['Keep the smallest version: one tap, one line', 'Decide your first step now, for the day after', 'Tie it to brushing your teeth'],
        p: 'In Daybook, a day without a check-in still counts as a no-slip day.',
      },
      {
        h: 'You missed your check-in yesterday. What is the best move today?',
        c: [
          'That is how one miss becomes many, and many are what add up. Today counts.',
          'Yes. Short is fine, and one miss barely dents a habit.',
          'A big plan after a miss is often guilt in disguise. Go small and ordinary.',
          'Waiting for a clean start is how one miss becomes a week. Today works fine.',
        ],
      },
    ],
    rc: {
      c: [
        'A few misses do not mean it is not for you. Come back in the smallest way.',
        'Yes. Come back today, small. One tap is enough.',
        'Waiting is how misses pile up. Today works fine.',
        'No catching up needed. Come back today.',
      ],
    },
  },
  l22: {
    key: 'Ask what bothers you most: losing control, a clash with your values, or both. Each points to different help.',
    cards: [
      { h: 'You feel you cannot stop, or it clashes with what you believe.', say: 'Which one bothers you most?' },
      {
        h: 'Some researchers think much of the feeling of being “addicted” comes from what?',
        c: [
          'That is not what they proposed. They looked at the gap between beliefs and behavior.',
          'Amount matters, but they pointed to something else, the clash with your values.',
          'Good guess. They call it moral incongruence, and they propose it may explain much of it.',
          'Effort is not what they named. They named the gap between belief and behavior.',
        ],
      },
      {
        h: 'Losing control and a values clash are two different problems.',
        p: 'Many people have some of each. Both are real, and neither means something is wrong with you.',
      },
      { h: 'One team proposed that feeling “addicted” may be a values gap.', say: 'If that clash hurts most, it deserves its own kind of care.' },
      {
        h: 'Name what bothers you most, then aim the help at it.',
        l: ['Control: skills, a plan, sometimes a therapist', 'Values: talk with someone who will not push', 'Both: work on both. That is common'],
      },
      {
        h: 'You rarely watch, but each time brings crushing guilt about your faith. What help fits best?',
        c: [
          'Skills help with control, but your main pain is the values clash. That needs its own care.',
          'Strong guilt does not by itself mean addiction. It often points to a values clash.',
          'The guilt is pointing at something you care about. Look at it instead of burying it.',
          'Yes. The heaviest part deserves care, like a calm talk with a faith leader or a therapist.',
        ],
      },
    ],
    rc: {
      c: [
        'The values clash is real too, and it can hurt a lot.',
        'Losing control is real too, and skills help with it.',
        'Yes. Many people have both. Skills for control, care for the values clash.',
        'Both deserve attention. Stopping is easier with the right help for each.',
      ],
    },
  },
  l23: {
    key: 'Do not wait to feel like it. Put one small activity in your hardest hour, and do it anyway.',
    cards: [
      { h: 'Your hardest hours are the empty ones, like Sunday afternoon.', say: 'What do you do with them?' },
      {
        h: 'For depression, getting active first was compared with talk therapy. How did it do?',
        c: [
          'Good guess. In a large trial, it did about as well as a standard talk therapy after a year.',
          'That is the usual belief. But acting first did about as well as talk therapy a year later.',
          'It was tested on adults with major depression, and it held up a year later.',
          'The trial did not find that. Getting active first did about as well as talk therapy.',
        ],
      },
      { h: 'Act first, then feel better.', p: 'You plan something for your hardest hour, do it, and notice how you feel afterward.' },
      {
        h: 'adults with major depression, and getting active matched talk therapy.',
        p: 'Filling a low hour is a well-tested way to lift mood, and low moods are a common relapse trigger.',
      },
      {
        h: 'Put one small thing in your hardest hour.',
        l: ['Find your hardest hour in your log', '“Tuesday 8 PM: walk with a podcast.”', 'Do it even if you do not feel like it'],
        p: 'Ten minutes counts. Check how you feel after, not before.',
      },
      {
        h: 'Sunday afternoons are empty and hard for you. What is the best plan?',
        c: [
          'That feeling often comes after you start, not before. Plan it and do it anyway.',
          'An empty afternoon at home is the hard setup. Put something in it.',
          'Yes. A set time, small enough to start. You act first and feel better after.',
          'More willpower in the same empty room is not the fix. Fill the hour.',
        ],
      },
    ],
    rc: {
      c: [
        'Waiting to feel better leaves the hour empty. Act first.',
        'Yes. A small plan fills the hard hour, and you feel better after.',
        'Waiting leaves the hour empty, and empty hours are the hard ones.',
        'The weekend does not help tonight. Fill this evening.',
      ],
    },
  },
  l24: {
    key: 'Therapy appears to help, and CBT has the most support. Ask how a therapist works, and switch if needed.',
    cards: [
      { h: 'You picture a couch, and talking about your childhood.', say: 'Does therapy help with porn at all?' },
      {
        h: 'A review looked at treatments for problem porn use. What do you think it found?',
        c: [
          'It went the other way. Treatment appeared to improve symptoms.',
          'Good guess. It appeared to help, and CBT, a skills-based therapy, had the strongest support.',
          'Medication was not the standout. CBT, a skills-based therapy, had the most support.',
          'That was not the finding. Treatment appeared to improve symptoms.',
        ],
      },
      {
        h: 'Therapy is skill-building with a person on your side.',
        p: 'CBT has the strongest support for this, with practical skills practiced between sessions.',
      },
      {
        h: 'studies of treatment for this problem, and treatment appeared to help.',
        p: 'Getting help is a supported option for this exact problem. It is not a last resort.',
      },
      { h: 'A usual course of CBT is about 5 to 15 sessions.', say: 'With practice in between. The skills are yours to keep.' },
      {
        h: 'Ask a therapist how they work, and switch if it does not fit.',
        l: ['What approach, and what evidence is behind it?', 'Have you worked with my kind of problem?', 'How will we know I am making progress?'],
      },
      {
        h: 'You tried one therapist and it did not click. What is the best next step?',
        c: [
          'Yes. Fit matters. Say so, and look at other options if you are not getting better.',
          'One poor fit is no verdict on therapy. Treatment appeared to help, and fit matters.',
          'Saying something is part of it. Asking how you will know you are improving is fair.',
          'You do not need a crisis. If it costs you time, sleep, or peace of mind, it counts now.',
        ],
      },
    ],
    rc: {
      c: [
        'Treatment appeared to help, and skills-based therapy had the strongest support.',
        'Yes. CBT, a skills-based therapy, had the strongest support in a review of treatments.',
        'You do not need a label to get help. What counts is what it does to your life.',
        'A typical course of CBT is about 5 to 15 sessions.',
      ],
    },
  },
  l49: {
    key: 'You have nothing to test. You are someone who handles urges, and you keep what makes that true.',
    cards: [
      { h: '“I could look once, to see that I am past it.”', say: 'Weeks of good days, and now this. Is it confidence?' },
      {
        h: 'After a long good stretch, what do you think is the main thing to watch for?',
        c: [
          'Big urges can still come, and you know how to ride them. The quiet risk is easier to miss.',
          'What you have built stays yours. Nothing takes it away, not even a slip.',
          'Good guess. Each one looks like nothing, so they are worth watching for.',
          'Day 90 is a win, and it deserves to feel like one. You keep paying attention after it.',
        ],
      },
      {
        h: 'The risk now is a small yes that looks harmless.',
        p: 'The phone back by the bed, because it has been fine. You can catch it here, where it takes almost no effort.',
      },
      { h: 'Testing yourself is on the list of risky moments.', say: 'You do not owe anyone a test, and that includes you.' },
      { h: 'A life of only “shoulds” makes it harder.', p: 'So rest, people, work you care about and things you do for fun are part of the plan.' },
      { h: 'A bad week does not erase what each hard moment built.', say: 'You are someone who handles urges. You got that by doing it.' },
      {
        h: 'Keep what got you here, and live your life.',
        l: ['Phone outside the room, your plan, a check-in', 'Tell your safe person when the test shows up', 'One thing you enjoy, one person, every week'],
        p: 'If you slip, it is one day in a long good stretch. What you built stays yours.',
      },
      {
        h: 'Day 75. You move your phone back next to the bed, since it has been fine for weeks. What is that?',
        o: [
          'A reward I have earned',
          'A small yes that looks harmless. I move it back',
          'Proof that I am slipping back',
          'A good time to test whether I am past it',
        ],
        c: [
          'You have earned plenty, and a phone by the bed is not the prize. Pick a better reward.',
          'Yes. You caught it early, with no drama. That is what keeping it looks like.',
          'Nothing has happened. It is an early link, easy to catch, and it says nothing against you.',
          'You have nothing to test. Testing yourself is a risky moment, and you know who you are.',
        ],
      },
    ],
    rc: {
      c: [
        'Your confidence is real, and it does not need proving this way.',
        'Yes. You named it. You have nothing to prove, and you know what to do.',
        'A thought is only a thought. Having it says nothing against you.',
        'Nothing has happened, and what you built stays yours.',
      ],
    },
  },
};
