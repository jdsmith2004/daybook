/* Lessons told as a story, batch D (the shape is in lesson-stories.ts, the standard in docs/lessons.md, the remap brief in the
   side-session notes, lesson-remap-brief.md). Lessons 22 to 32, written November 14, 2026. Lessons 29 to 32 are faith lessons: they
   keep their place, shown only to people who said faith plays a part (lessons.ts faithOut), and faith stays out of every other one.
   Lessons 23 and 26 to 32 reach other habits through habitSay, so their words name the habit only where the swap reads right. */
import type { Story } from './lesson-stories';

type Src = [string, string];
const S = {
  grubbs15: [
    'Grubbs, Exline, Pargament, Hook & Carlisle (2015): transgression as addiction, religiosity and moral disapproval as predictors of perceived addiction to pornography, Archives of Sexual Behavior',
    'https://doi.org/10.1007/s10508-013-0257-z',
  ],
  grubbs19: [
    'Grubbs, Perry, Wilt & Reid (2019): pornography problems due to moral incongruence, an integrative model with a systematic review and meta-analysis, Archives of Sexual Behavior',
    'https://pubmed.ncbi.nlm.nih.gov/30076491/',
  ],
  icd11: ['WHO ICD-11: 6C72 Compulsive sexual behaviour disorder', 'https://icd.who.int/browse/2024-01/mms/en#1630268048'],
  wilson14: ['Wilson et al. (2014): just think, the challenges of the disengaged mind, Science', 'https://doi.org/10.1126/science.1250830'],
  eastwood12: [
    'Eastwood, Frischen, Fenske & Smilek (2012): the unengaged mind, defining boredom in terms of attention, Perspectives on Psychological Science',
    'https://doi.org/10.1177/1745691612456044',
  ],
  cobra: [
    'Richards et al. (2016): behavioural activation vs cognitive behavioural therapy for depression, the COBRA trial, The Lancet',
    'https://eprints.whiterose.ac.uk/id/eprint/105790/',
  ],
  fluckiger18: [
    'Flückiger, Del Re, Wampold & Horvath (2018): the alliance in adult psychotherapy, a meta-analytic synthesis, Psychotherapy',
    'https://doi.org/10.1037/pst0000172',
  ],
  lambert11: ['Lambert & Shimokawa (2011): collecting client feedback, Psychotherapy', 'https://doi.org/10.1037/a0022238'],
  antons: [
    'Antons et al. (2022): treatments for compulsive sexual behavior disorder and problematic pornography use, a systematic review, Journal of Behavioral Addictions',
    'https://real.mtak.hu/172651',
  ],
  nhs: [
    'NHS: cognitive behavioural therapy (CBT), overview',
    'https://www.nhs.uk/mental-health/talking-therapies-medicine-treatments/talking-therapies-and-counselling/cognitive-behavioural-therapy-cbt/overview/',
  ],
  aa12: ['Alcoholics Anonymous: the Twelve Steps (the wording of the steps)', 'https://www.aa.org/the-twelve-steps'],
  pagano04: [
    'Pagano, Friend, Tonigan & Stout (2004): helping other alcoholics in Alcoholics Anonymous and drinking outcomes, findings from Project MATCH, Journal of Studies on Alcohol',
    'https://pmc.ncbi.nlm.nih.gov/articles/PMC3008319/',
  ],
  riessman: ['Riessman (1965): the “helper” therapy principle, Social Work', 'https://doi.org/10.1093/sw/10.2.27'],
  cochrane: [
    'Kelly, Humphreys & Ferri (2020): Alcoholics Anonymous and other 12-step programs for alcohol use disorder, Cochrane review',
    'https://cochranelibrary.com/cdsr/doi/10.1002/14651858.CD012880.pub2/information',
  ],
} satisfies Record<string, Src>;

export const STORIES_D: Record<string, Story> = {
  l22: {
    id: 'l22',
    form: 'breakdown',
    title: 'When values and habits clash',
    ic: 'flag',
    ask: 'If it hurts this much, does that mean I am out of control?',
    key: 'The hurt tells you how much you care. Your log tells you how much control you have.',
    np: 'What the hurt is pointing at, in one sentence',
    tell: [
      {
        h: 'People who are quitting often ask one question, quietly, after a slip.',
        p: '**Does it hurt this much because I am out of control?** The guilt can feel far bigger than the slip, and the size of it seems to be saying something.',
        art: ['scene', { k: 'l22-gauge' }],
        dx: 'It usually comes after a slip that was rare, a day or two after a long good stretch. The slip itself took minutes. The guilt has lasted for days, and it will not let up. So the mind does the obvious math: if it hurts this much, it must be this bad. **Does it hurt this much because I am out of control?** It is a fair question, and it deserves a real answer, not a pat on the back.',
      },
      {
        k: 'ask',
        h: 'Think of the last time it hurt the most. What was the hurt mostly about?',
        o: [
          ['That I could not stop when I wanted to', 'That is one kind of hurt. Look at what the researchers found about the other.'],
          ['That it goes against what I believe', 'That is the kind this lesson is about. Look at what it does to the size of the hurt.'],
          ['Both, tangled together', 'Most people feel both. Pulling them apart is what this lesson does.'],
          ['I am not sure', 'That is fair. The next cards may help you tell.'],
        ],
      },
      {
        h: 'Researchers asked people about their use and their beliefs, and found something odd.',
        p: 'People who believed porn was morally wrong tended to watch less of it. And yet they were the ones **more likely to feel hooked** by it.',
        art: ['scene', { k: 'l22-two-people' }],
        fact: { s: 'Studies · Grubbs and colleagues, 2015', i: [0] },
        dx: 'A team led by the psychologist Joshua Grubbs asked students and adults how often they watched porn, how strongly they held it to be wrong, and whether they felt addicted to it. The people who held it to be wrong tended to watch less, which nobody found surprising. What surprised them came next: those same people were **more likely to feel hooked**, often at amounts that others watched without much distress. The feeling of being out of control was not tracking the amount alone.',
      },
      {
        h: 'So the size of the hurt was not only measuring the habit.',
        p: 'It was measuring **the gap between what people did and what they held**. Researchers call it moral incongruence: the act on one side, your values on the other, and the ache stretched between them.',
        art: ['scene', { k: 'l22-gap' }],
        fact: { s: 'Review · Grubbs, Perry, Wilt & Reid, 2019', i: [1] },
        dx: 'A few years later the same researchers gathered every study they could find on why people come to feel their use is a problem. How much people used mattered, and it showed up again and again. So did a second thing, study after study: **the gap between what people did and what they held**. They called it moral incongruence. The wider the gap, the louder the hurt, sometimes at very little use. The ache is real. It is stretched between two things, and only one of them is the habit.',
      },
      {
        long: 1,
        h: 'The World Health Organization drew the same line.',
        p: 'In its guide for doctors, distress that comes only from believing an act is wrong is not enough, by itself, to call it a compulsive disorder. That does not make the pain small. **It makes it a different pain.**',
        art: ['scene', { k: 'l22-guide' }],
        fact: { s: 'Guidance · WHO ICD-11, 6C72', i: [2] },
        dx: 'The World Health Organization keeps the book doctors around the world use to name illnesses. Its entry for compulsive sexual behavior says plainly that distress coming only from moral disapproval is not enough, by itself, for the diagnosis. The doctors who wrote it were not saying the distress is imaginary or unimportant. They were saying it comes from somewhere else, and so it needs something else. **It makes it a different pain**, with its own kind of help.',
      },
      {
        h: 'Think of a smoke alarm.',
        p: 'A loud alarm tells you something matters, and it tells you to go and look. It does not tell you **how big the fire is**. For that, you walk into the kitchen and check.',
        art: ['scene', { k: 'l22-alarm' }],
        dx: 'A smoke alarm is built to be loud. That is its whole job: to make you stop and look. A burnt piece of toast can set it screaming as loud as a fire in the walls. Nobody reads the volume of the alarm as the size of the fire. It tells you something matters. It does not tell you **how big the fire is**. For that, you walk into the kitchen, look at what is burning, and deal with what you find.',
      },
      {
        h: 'So the question splits in two, and each half has its own answer.',
        p: 'Can I stop when I choose? Your log answers that, from what you did. Does it go against what I hold? **The hurt answers that**, and it is worth listening to.',
        art: ['scene', { k: 'l22-split' }],
        dx: 'Out of control is a question about what you do: how often, how hard it is to stop, what it costs. Feelings are a poor gauge for that, and your log is a good one, because it holds what happened instead of how it felt. The other question, whether it goes against what you hold, is one that only you can answer. **The hurt answers that.** It is not there to punish you. It is there to tell you what you care about.',
      },
      {
        long: 1,
        h: 'Each answer has its own kind of help.',
        p: 'Losing control needs skills and a plan, the tools in this app. A clash with what you hold needs **a calm, honest look**, often with someone who shares your values. Many people have some of each.',
        art: ['scene', { k: 'l22-two-helps' }],
        dx: 'If the log shows a habit that runs over your choices, the help is practical: a plan for hard hours, changes to the setting, tools for an urge, people who know. If the hurt is mostly about the clash with what you hold, more willpower will not quiet it. What helps is **a calm, honest look** at what you believe and why, often with someone who shares your values and will not push you toward an answer. Most people find some of each, and both are real.',
      },
      {
        long: 1,
        h: 'The part of you that hurts is on your side.',
        p: 'Pain after a slip is easy to read as a verdict. It is closer to a compass needle, pointing at **what you want your life to be about**. Someone who did not care would not feel it.',
        art: ['scene', { k: 'l22-compass' }],
        dx: 'It is easy to treat the guilt as the enemy, and to try either to crush it or to argue it away. Both miss what it is doing. A compass needle does not scold you for walking the wrong way. It points, steadily, at north. The ache after a slip points at **what you want your life to be about**: a person, a promise, a kind of life. Someone who did not care would feel nothing. The part of you that hurts is the part that wants out, and it is on your side.',
      },
    ],
    mine: { h: 'Your log answers the first question honestly.', k: 'clean30' },
    today: {
      h: 'Answer the two questions apart today.',
      l: ['Look at your log: how often, this month?', 'Name the one thing it goes against', 'Pick one kind of help for each'],
    },
    you: {
      h: 'When it hurts the most, what is the thing you hold that the habit goes against?',
      o: [
        ['Being faithful to someone I love', 'Then the hurt is guarding a person. That is worth more than any count.'],
        ['Being honest about who I am', 'Then the hurt is asking you to close the gap, one honest day at a time.'],
        ['The respect I want to have for myself', 'That comes back too, one kept choice at a time.'],
        ['I do not know yet', 'Fair. Next time it hurts, ask it plainly what it is pointing at.'],
      ],
    },
    scope:
      'These studies asked adults about porn and their beliefs, and they show what goes together across many people, not the reason for any one person’s pain. Losing control is real too, and many people feel both. Each one has help that works, and telling them apart is where that help starts.',
    src: [S.grubbs15, S.grubbs19, S.icd11],
  },

  l23: {
    id: 'l23',
    form: 'meaning',
    title: 'Plan the empty hour',
    tag: 'An hour nobody claims does not stay empty.',
    ic: 'sunrise',
    ask: 'What do I do with the empty hours when urges are worst?',
    key: 'An empty hour does not stay empty. Claim it first, and the habit finds the stage taken.',
    np: 'The hour I will claim, and what goes in it first',
    tell: [
      {
        h: 'Picture your mind as a small theater.',
        p: 'The curtain is always up. Something is always playing on the stage, **from the moment you wake** to the moment you fall asleep.',
        art: ['scene', { k: 'l22-stage' }],
        dx: 'Picture your mind as a small theater with one stage. The odd thing about this theater is that the curtain never comes down. Something is always playing on the stage, **from the moment you wake** to the moment you fall asleep: a plan, a worry, a song, a conversation you are having in your head with someone who is not there. You are the audience, and most of the time you did not choose the show.',
      },
      {
        h: 'When nothing is planned, the stage does not stay empty.',
        p: 'Thoughts wait in the wings. Onto **an empty stage**, whatever is nearest walks on: a worry, a memory, a picture. It plays whatever it is allowed to.',
        art: ['scene', { k: 'l22-wings' }],
        dx: 'Some thoughts wait just off the stage, in the wings, for a gap. While something you chose is playing, they stay there. But when the stage goes quiet, when the plan runs out and nothing is next, the nearest one walks on. It might be a worry, an old memory or a picture you do not want. Nobody sent for it. It came because **an empty stage** is an invitation, and it will play for as long as it is allowed to stay.',
      },
      {
        h: 'In 2014, researchers left people alone in a plain room for fifteen minutes.',
        p: 'No phone, no book, nothing to do but think. On the table was a button that gave **a mild electric shock**, one they had already felt and said they would pay money to avoid.',
        art: ['scene', { k: 'l22-button-room' }],
        fact: { s: 'Study · Wilson and colleagues, 2014', i: [0] },
        dx: 'A team at the University of Virginia, led by the psychologist Timothy Wilson, wanted to know how people get on with nothing but their own thoughts. Earlier in the session, each person had felt **a mild electric shock**, and most said they would pay money not to feel it again. Then each was left alone in a bare room for fifteen minutes, with their phone and their things taken away. They could sit and think about anything they liked. Or they could press a button and give themselves the shock.',
      },
      {
        k: 'ask',
        h: 'Say it is you in that room. What would you do with the fifteen minutes?',
        o: [
          ['Sit and think. It is only fifteen minutes', 'That is what most people expect of themselves. Look at what they did.'],
          ['Press the button once, to see', 'Then you know something about empty time already. Look at how many did.'],
          ['Get restless fast', 'That is honest, and it is the feeling this study caught.'],
          ['I do not know', 'Fair. Almost nobody guesses this one right about themselves.'],
        ],
      },
      {
        h: 'Two in three of the men, and one in four of the women, pressed it.',
        p: 'Some pressed it again and again. They chose **a shock over nothing at all**. Fifteen empty minutes were harder to sit through than anyone had expected.',
        art: ['people', { n: 67, s: 'of the men pressed it' }],
        dx: 'Twelve of the eighteen men pressed the button at least once, and six of the twenty-four women. One man pressed it 190 times. These were people who had said they would pay to avoid that very shock. Left with nothing to do, they chose **a shock over nothing at all**, because doing something unpleasant was easier to bear than doing nothing. The researchers were careful about what it means, and it is still argued over. What it shows plainly is how hard an empty stretch is.',
      },
      {
        long: 1,
        h: 'It was not one strange room. They ran eleven studies.',
        p: 'Most people did not enjoy a few minutes alone with their thoughts, young or old. Sent home to try it, many **reached for a phone** before the time was up.',
        art: ['scene', { k: 'l22-cheat' }],
        dx: 'The shock was only one part of the work. Across eleven studies, with students and with adults of every age from a farmers’ market and a church, the finding kept coming back: most people did not enjoy six to fifteen minutes alone with their thoughts, and found it hard to keep their minds on anything. When people were asked to try it at home, about a third admitted they had cheated, and many **reached for a phone** or got up before the time was done.',
      },
      {
        long: 1,
        h: 'Boredom is not having nothing to do. It is having nothing to hold.',
        p: 'Researchers who study attention describe it as wanting to be engaged and finding **nothing that holds you**. It is uncomfortable, so the mind grabs whatever is closest.',
        art: ['scene', { k: 'l22-reach' }],
        fact: { s: 'Review · Eastwood and colleagues, 2012', i: [1] },
        dx: 'It is easy to think of boredom as laziness, or as a lack of things to do. The researchers who study attention describe it differently. Boredom is the feeling of wanting to be engaged and finding **nothing that holds you**. Your attention is out looking for somewhere to land. That search is uncomfortable, and the mind will end it with the closest thing in reach, whether or not it is good for you. That is why the empty hour is a setup.',
      },
      {
        h: 'So the hard hours are often not the busy ones.',
        p: 'They are **the hours nobody has claimed**: the hour after work, a free afternoon, a long wait. The habit does not need a reason to show up. It needs room.',
        art: ['scene', { k: 'l22-unclaimed' }],
        dx: 'Ask people when their hardest moments come, and many expect the answer to be the stressful hours, the arguments, the bad days. Often it is not. It is the gap after the stress: the hour after work, a free afternoon, a long wait, the stretch of a day off with nothing planned. These are **the hours nobody has claimed**. The habit does not need a crisis to show up. It needs room, and an unclaimed hour is room.',
      },
      {
        h: 'Here is the hard part. Whatever you do not take charge of, something else will.',
        p: 'An hour left open is not neutral ground. It goes to whatever is nearest, and the habit is good at being nearest. But it works the other way too: **an hour you claim is yours**.',
        art: ['scene', { k: 'l22-flag' }],
        dx: 'This is the truth under all of it, and it is not comfortable. Wherever nobody takes charge, something else does. A field nobody tends grows weeds. A team nobody leads gets led by the loudest voice. An hour you leave open is not neutral ground, and the habit is very good at being the nearest thing in it. But that same truth carries the hope. Wherever you step in and take charge, the ground is yours. **An hour you claim is yours**, and the habit has to find somewhere else to stand.',
      },
      {
        long: 1,
        h: 'Getting active on a plan did as well as talk therapy, a year on.',
        p: 'In a large trial for depression, people who planned small, real things into their days, and did them before they felt like it, did **about as well** as people in therapy.',
        art: ['scene', { k: 'l22-planner' }],
        fact: { s: 'Trial · 440 adults · Richards and colleagues, 2016', i: [2] },
        dx: 'In England, a trial of 440 adults with depression compared two treatments. One was cognitive behavioral therapy, the talking therapy with the most support. The other was simpler: workers with far less training helped people plan small, real activities into their days, and do them whether or not they felt like it. A year later, the simpler one had done **about as well**. Filling the hours on purpose, ahead of the mood, did not wait for the person to feel better first. It helped them get there.',
      },
      {
        h: 'So put something on the stage before the play starts.',
        p: 'You cannot push a thought off the stage by staring at it. You can put something there first: a walk, a call, a meal to cook, work for your hands. Then the one waiting in the wings finds **the part already taken**.',
        art: ['scene', { k: 'l22-filled' }],
        dx: 'Staring down a thought that has walked onto the stage rarely moves it. The fight keeps it in the light. What works is earlier and simpler: decide what plays in your hardest hour before the hour comes. A walk, a call, a meal to cook, something with your hands, a place to be. It does not need to be big or impressive. It needs to be real, and there first. Then the one waiting in the wings finds **the part already taken**.',
        back: 'l10',
      },
    ],
    mine: { h: 'Here are the hours most worth claiming.', k: 'hour' },
    today: {
      h: 'Claim your hardest hour today.',
      l: ['Find the hour most often left empty', 'Put one small, real thing in it', 'Start it before you feel like it'],
    },
    you: {
      h: 'In your emptiest hour, what could go on the stage first?',
      o: [
        ['A walk, out of the house', 'Out of the house changes the stage and the hour at once.'],
        ['A call or a message to someone', 'A person on the stage leaves little room for anything else.'],
        ['Something with my hands', 'Hands that are busy make a picture hard to hold.'],
        ['I do not know yet', 'Fair. Watch which hour goes empty this week, and start there.'],
      ],
    },
    scope:
      'The shock study was a striking scene with a small group, and what it means is still argued over. The boredom research is about attention in general, and the activity trial was for depression. They point one way: an hour with something real in it goes better than an empty one, and you can choose what goes in.',
    src: [S.wilson14, S.eastwood12, S.cobra],
  },

  l24: {
    id: 'l24',
    form: 'works',
    title: 'What therapy is like',
    ic: 'heart',
    ask: 'Would therapy help with this, and what is it like?',
    key: 'Therapy is a partnership you choose. Say how it feels, and switch if it does not get better.',
    np: 'One question I would ask a therapist',
    tell: [
      {
        h: 'Most people picture therapy the same way.',
        p: 'A stranger behind a desk, a notepad, a long silence, and **a verdict at the end** about what is wrong with you.',
        art: ['scene', { k: 'l22-judge' }],
        dx: 'Ask people what they picture when they think of seeing a therapist, and the answers are much the same. A stranger behind a desk. A notepad, and a pen that writes while you talk. A long silence that you are meant to fill. And when it is over, **a verdict at the end** about what is wrong with you, in words you do not understand. It is no wonder people put it off for years. Nobody wants to walk into a courtroom.',
      },
      {
        k: 'ask',
        h: 'If you sat down with a therapist, what would worry you most?',
        o: [
          ['Saying it out loud', 'That first sentence is the hardest. They hear it often, and calmly.'],
          ['Being judged', 'That fear keeps many people away. Look at what researchers found matters.'],
          ['Paying for the wrong person', 'Fair. Fit is the thing to watch, and you are allowed to switch.'],
          ['Not knowing where to start', 'Many people feel that. The next cards make the start plain.'],
        ],
      },
      {
        h: 'Researchers have spent decades asking what makes therapy work.',
        p: 'Which method is best, how long it should last, what kind of training helps. And one answer kept coming back, in **almost every kind of therapy** they looked at.',
        art: ['scene', { k: 'l22-stacks' }],
        dx: 'For more than fifty years, researchers have argued about what makes therapy work. Some said it was the method: this school against that one. Some said it was the number of sessions, or the training, or the kind of problem. Hundreds of studies piled up, each measuring how people did and what they had received. When the studies were gathered and compared, one answer kept coming back, in **almost every kind of therapy**, whatever its name.',
      },
      {
        h: 'It was how well the two people worked together.',
        p: 'In 295 studies with more than 30,000 people, how well the person and the therapist **agreed on goals and trusted each other** was one of the steadiest signs of how it would go.',
        art: ['scene', { k: 'l22-two-chairs' }],
        fact: { s: 'Review · 295 studies · Flückiger and colleagues, 2018', i: [0] },
        dx: 'In 2018, a team of researchers pulled together 295 studies of therapy for adults, with more than 30,000 people in them, from many countries and many kinds of treatment. They looked at what researchers call the alliance: how well the person and the therapist **agreed on goals and trusted each other**, and agreed on how to get there. People with a stronger alliance tended to do better. It held across methods, across countries and across ways of measuring. It was one of the steadiest findings in all of the research.',
      },
      {
        h: 'So therapy is not a verdict. It is closer to a partnership.',
        p: 'You are not the one on trial. You are **choosing a partner** to work with, and the fit is something you get to judge, from the first session.',
        art: ['scene', { k: 'l22-partners' }],
        dx: 'That changes the picture of the courtroom completely. If the bond between the two of you is one of the best signs of how it will go, then you are not walking in to be judged. You are walking in to find out whether this is someone you can work with. You are **choosing a partner**, the way you would choose a coach or a doctor you trust. And the fit is yours to judge, from the very first hour.',
      },
      {
        long: 1,
        h: 'Your voice in the room changes how it goes.',
        p: 'When therapists asked people every session how it was going, the ones who were quietly drifting toward worse **did better**. Saying so out loud gave the therapist something to change.',
        art: ['scene', { k: 'l22-speak-up' }],
        fact: { s: 'Review · Lambert & Shimokawa, 2011', i: [1] },
        dx: 'One line of research tested something very plain. Therapists asked each person, every session, a few short questions about how they were doing and how the sessions felt. Most people were fine either way. But the people who were quietly drifting toward getting worse, the ones who might have stopped coming, **did better** when their therapist saw it early. Saying out loud that something was not working was not rude or ungrateful. It gave the therapist something to change.',
      },
      {
        long: 1,
        h: 'For this habit, help has been tested.',
        p: 'A review of 24 studies found that treatment for problem porn use helped, and **skills-based therapy** (CBT) had the most support. A typical course is about five to fifteen sessions.',
        art: ['scene', { k: 'l22-toolkit' }],
        fact: { s: 'Review · 24 studies · Antons and colleagues, 2022 · Guide · NHS', i: [2, 3] },
        dx: 'In 2022, a review gathered the studies of treatment for compulsive sexual behavior and problem porn use. There were not as many as for drinking or depression, and many were small. But across 24 of them, treatment appeared to help, and **skills-based therapy**, called cognitive behavioral therapy or CBT, had the strongest support. In CBT you learn to notice the thoughts and moments that lead to the habit, and practice other moves between sessions. A course often runs about five to fifteen sessions.',
      },
      {
        long: 1,
        h: 'The first hour is mostly talking about what you want.',
        p: 'They ask what brings you in and what you hope will change. You can say it in one sentence. They have heard it many times, and **what you say stays in the room**, with a few limits they will explain.',
        art: ['scene', { k: 'l22-first-hour' }],
        dx: 'A first session is less dramatic than people fear. The therapist asks what brings you in, what has been hard, and what you hope will be different. You can say it in one sentence: I want help with porn, and I have not been able to stop on my own. They have heard it many times, and it does not shock them. **What you say stays in the room.** There are a few legal limits, such as a risk to someone’s safety, and a good therapist explains them at the start.',
      },
      {
        h: 'So pick the person the way you would pick a partner.',
        p: 'Ask how they work. After two sessions, say how it feels. If it does not get better, try someone else. **Switching is not failing therapy.** It is doing it well.',
        art: ['scene', { k: 'l22-doors' }],
        dx: 'Ask how they work and why, and whether they have helped people with this before. Give it two or three sessions, then say plainly how it feels, the good and the bad. A good therapist will want to hear it. If it still does not get better, try someone else. **Switching is not failing therapy.** People switch doctors and coaches all the time. Finding the right partner is part of doing the work well, not a sign that the work is not for you.',
      },
    ],
    mine: { h: 'You have already started the work, before any session.', k: 'acted' },
    today: {
      h: 'Take one step toward the right partner.',
      l: ['Look up two therapists, near or online', 'Write one question to ask them', 'Ask it on the first call'],
    },
    you: {
      h: 'What would make a therapist the right fit for you?',
      o: [
        ['Someone who has helped with this before', 'Then ask that first. It is a fair question, and a good one.'],
        ['Someone who will not judge me', 'You will know within a session or two. Trust what you feel.'],
        ['Someone who gives me tools to use', 'Then look for skills-based therapy, and say so at the start.'],
        ['I do not know yet', 'That is fine. Many people find out by meeting one or two.'],
      ],
    },
    scope:
      'The research on fit covers therapy for many problems, not porn in particular, and it shows what goes with good results. The review of treatment for problem porn use is newer and smaller. Both point the same hopeful way: help works, and you get a real say in it.',
    src: [S.fluckiger18, S.lambert11, S.antons, S.nhs],
  },

  l25: {
    id: 'l25',
    form: 'study',
    title: 'The 12 steps in plain words',
    ic: 'book',
    ask: 'What are the 12 steps, and could they help me?',
    key: 'Helping someone is not the prize at the end. It is one of the ways people get free.',
    np: 'One person I could help, and the one thing I would tell them',
    tell: [
      {
        h: 'Most people picture the twelve steps as a ladder.',
        p: 'You start at the bottom, admitting you have a problem, and climb toward the top, helping others. You only reach that last rung **once you have it all figured out**.',
        art: ['scene', { k: 'l22-ladder' }],
        dx: 'The twelve steps began with Alcoholics Anonymous in the 1930s, and since then they have been borrowed by groups for almost every habit there is. Most people who have heard of them picture a ladder. At the bottom is step one, admitting that you have a problem. At the top is step twelve, carrying the message to others. You climb one rung at a time, and you only reach the top **once you have it all figured out**. This study turns that picture over.',
      },
      {
        h: 'In plain words, the steps come down to three things.',
        p: 'Be honest about where you are. Let other people in. Act. Admit willpower alone has not been enough, tell someone the truth, **make things right where you can**, and help others.',
        art: ['scene', { k: 'l22-three' }],
        fact: { s: 'Program · Alcoholics Anonymous, the Twelve Steps', i: [0] },
        dx: 'In plain words, not their own, the steps run like this. Admit that willpower alone has not been enough, and reach for help bigger than yourself. Take an honest look at your life and tell another person what you find. **Make things right where you can**, where doing so would not hurt anyone. Keep checking yourself, and keep going. And help someone else who is where you were. Under all twelve are three things: honesty, other people, and action.',
      },
      {
        h: 'Researchers wanted to know which part of it did the most good.',
        p: 'They went back to Project MATCH, one of the largest studies of treatment for drinking ever run, and asked a plain question of the people in it: **were you helping anyone else?**',
        art: ['scene', { k: 'l22-clipboard' }],
        fact: { s: 'Study · Pagano and colleagues, 2004', i: [1] },
        dx: 'In the 1990s, Project MATCH followed more than seventeen hundred people in treatment for drinking, across the United States, for years. A decade later, a team led by Maria Pagano went back to its records with one question. Going to meetings was known to help. But what were people doing there? So they looked at a plain thing the study had asked: in AA, **were you helping anyone else?** Sponsoring someone, sharing what worked, being there for a newer member.',
      },
      {
        k: 'ask',
        h: 'Think of a time you helped someone with something you were still learning. How did it leave you?',
        o: [
          ['Steadier than before', 'Many people find that. Look at what the researchers found.'],
          ['Like a fraud', 'That feeling is common. Look at when these helpers started.'],
          ['Tired, if I am honest', 'Fair. Helping costs something. Look at what it gave back.'],
          ['I cannot think of a time', 'Then the next cards are about a door you have not tried yet.'],
        ],
      },
      {
        h: 'A year after treatment, 40 in 100 of the helpers had not had a drink.',
        p: 'Among the people who were not helping, it was 22 in 100. And the gap held **however many meetings people went to**. Sitting in the room was not the whole of it. Giving was.',
        art: ['people', { n: 40, was: 22, s: 'stayed sober' }],
        dx: 'In the year after treatment, 40 in every 100 of the people who were helping others had not had a single drink. Among the people who were not helping, it was 22 in 100. The researchers checked whether the helpers had only gone to more meetings, and the gap held **however many meetings people went to**. Being in the room was good. But the people who gave something away while they were there did better again, by a wide margin.',
      },
      {
        h: 'And the helpers were not near the top of any ladder.',
        p: 'They were only months into their own recovery, still shaky, still learning. Helping was not a reward for being well. **It was part of how they got well.**',
        art: ['scene', { k: 'l22-early-help' }],
        dx: 'Look at who these helpers were. They were not people with ten years behind them. They were only months out of treatment, many of them still shaky, still learning the same things they were passing on. If the steps were a ladder, they were near the bottom. They did not wait until they were sure of themselves to help. Helping was not the reward at the end for being well. **It was part of how they got well.**',
      },
      {
        long: 1,
        h: 'A sociologist named Frank Riessman saw this in 1965.',
        p: 'He called it the helper therapy principle: in a group of people with the same problem, **the one who helps** often gains as much as the one who is helped.',
        art: ['scene', { k: 'l22-helper' }],
        fact: { s: 'Article · Riessman, 1965', i: [2] },
        dx: 'Frank Riessman watched groups where people with the same problem helped one another, and noticed something the groups had not set out to do. **The one who helps** often gains as much as the one who is helped, and sometimes more. He gave reasons. Explaining what works to someone else makes you hear it yourself. Being needed makes you feel able. And taking a helper’s role changes how you see yourself. He called it the helper therapy principle.',
      },
      {
        long: 1,
        h: 'Look at what helping does to who you think you are.',
        p: 'Someone with a problem is a person things happen to. Someone who helps is a person with **something to give**. The same day, the same struggle, and a different person in the mirror.',
        art: ['scene', { k: 'l22-lamp' }],
        dx: 'Think back to the first lesson, about the small sign in the window: people learn who they are partly by watching what they do. A person with a problem watches themselves struggle, again and again, and that is the story they tell about themselves. A person who helps watches themselves hand something over to someone who needs it. That is a person with **something to give**. It can be the same day and the same struggle, and a different person in the mirror.',
        back: 'l1',
      },
      {
        h: 'So the last step can come first.',
        p: 'You can take it this week, in a small way: answer a friend who is struggling, or tell someone newer one thing that helped you. **You do not have to be finished** to hand someone a rope.',
        art: ['scene', { k: 'l22-rope' }],
        dx: 'The step most people save for the end is one you can take this week. It does not have to be big. Answer a friend who has been having a hard time. Tell someone newer to this one thing that helped you, without your whole story. Write one honest reply in a group. **You do not have to be finished** to hand someone a rope. You only have to be standing a little further up the bank than they are, and you already are.',
      },
      {
        long: 1,
        h: 'You can borrow the steps without joining anything.',
        p: 'There are twelve-step groups for almost every habit, in person and online, and at a first meeting you can just listen. For drinking, programs built on the steps kept **more people fully sober** than other treatments.',
        art: ['scene', { k: 'l22-circle' }],
        fact: { s: 'Review · 27 studies · Kelly, Humphreys & Ferri, 2020', i: [3] },
        dx: 'There are twelve-step groups for almost every habit there is, with meetings in person and online, and at a first meeting nobody expects you to speak. You can just listen. For drinking, where the research is deepest, a review of 27 studies found that programs built on the steps kept **more people fully sober** than other established treatments, at about the same cost or less. You do not have to take all twelve to borrow one. Honesty, other people and action fit any plan.',
      },
    ],
    mine: { h: 'You already know things someone newer does not.', k: 'acted' },
    today: {
      h: 'Take the last step first, in a small way.',
      l: ['Think of one person who is struggling', 'Tell them one thing that helped you', 'Keep it short and honest'],
    },
    you: {
      h: 'Who could you help right now, with what you already know?',
      o: [
        ['A friend who is having a hard time', 'Then you have something to give already. One honest line is enough.'],
        ['Someone newer to this than me', 'You know things they do not yet. That is worth handing over.'],
        ['No one yet. I am still struggling', 'So were the helpers in the study. Struggling and helping can go together.'],
        ['I do not know yet', 'Fair. Watch this week for someone a step behind you.'],
      ],
    },
    scope:
      'The helping study was about drinking, not porn, and it followed people rather than testing helping as a treatment, so the helpers may have differed in other ways. The review of 12-step programs was about alcohol too. What carries over is the shape: honesty, other people and action, with helping part of it from early on.',
    src: [S.aa12, S.pagano04, S.riessman, S.cochrane],
  },
};
