/* Lessons told as a story, batch B (the shape is in lesson-stories.ts, the standard in docs/lessons.md). Written November 14, 2026,
   after the owner saw lessons 1 to 3 with their pictures and said to roll it out ("Yes, roll it out"). No lesson here asks a person
   to guess a fact they cannot know, and none puts a clock time on everyone: a hard hour is the person's own. */
import type { Story } from './lesson-stories';

type Src = [string, string];
const S = {
  gujar: [
    'Gujar, Yoo, Hu & Walker (2011): sleep deprivation amplifies reactivity of brain reward networks, Journal of Neuroscience',
    'https://pmc.ncbi.nlm.nih.gov/articles/PMC3086142',
  ],
  yoo: [
    'Yoo, Gujar, Hu, Jolesz & Walker (2007): the human emotional brain without sleep, a prefrontal amygdala disconnect, Current Biology',
    'https://doi.org/10.1016/j.cub.2007.08.007',
  ],
  butler: [
    'Butler, Pereyra, Draper, Leonhardt & Skinner (2018): pornography use and loneliness, a bidirectional recursive model and pilot investigation, Journal of Sex & Marital Therapy',
    'https://doi.org/10.1080/0092623X.2017.1321601',
  ],
  tangney: [
    'Tangney, Stuewig & Martinez (2014): two faces of shame, the roles of shame and guilt in predicting recidivism, Psychological Science',
    'https://pubmed.ncbi.nlm.nih.gov/24395738/',
  ],
  dearing: [
    'Dearing, Stuewig & Tangney (2005): on the importance of distinguishing shame from guilt, Addictive Behaviors',
    'https://pmc.ncbi.nlm.nih.gov/articles/PMC3106346',
  ],
  breines: [
    'Breines & Chen (2012): self-compassion increases self-improvement motivation, Personality and Social Psychology Bulletin',
    'https://pubmed.ncbi.nlm.nih.gov/22645164/',
  ],
  adams: [
    'Adams & Leary (2007): promoting self-compassionate attitudes toward eating among restrictive and guilty eaters, Journal of Social and Clinical Psychology',
    'https://doi.org/10.1521/jscp.2007.26.10.1120',
  ],
  slepian: ['Slepian, Chun & Mason (2017): the experience of secrecy, Journal of Personality and Social Psychology', 'https://doi.org/10.1037/pspa0000085'],
  slepian19: [
    'Slepian & Moulton-Tetlock (2019): confiding secrets and well-being, Social Psychological and Personality Science',
    'https://doi.org/10.1177/1948550618765069',
  ],
  aron: [
    'Aron, Melinat, Aron, Vallone & Bator (1997): the experimental generation of interpersonal closeness, Personality and Social Psychology Bulletin',
    'https://doi.org/10.1177/0146167297234003',
  ],
  gollwitzer: [
    'Gollwitzer & Sheeran (2006): implementation intentions and goal achievement, a meta-analysis of effects and processes, Advances in Experimental Social Psychology',
    'https://doi.org/10.1016/S0065-2601(06)38002-1',
  ],
  webb: [
    'Webb & Sheeran (2007): how do implementation intentions promote goal attainment? Journal of Experimental Social Psychology',
    'https://doi.org/10.1016/j.jesp.2006.02.001',
  ],
} satisfies Record<string, Src>;

export const STORIES_B: Record<string, Story> = {
  l4: {
    id: 'l4',
    form: 'study',
    title: 'When you are worn down',
    tag: 'Why urges hit harder when you are tired or lonely.',
    ic: 'moon',
    ask: 'Why do urges hit harder when I am tired or lonely?',
    key: 'Worn down, the pull reads louder than it is. Plan for those hours, and meet the need under them.',
    np: 'What wears me down most, and what I will do on those days',
    tell: [
      {
        h: 'In 2011, a sleep lab in California kept a group of healthy young adults awake for a whole night.',
        p: 'Another group slept as usual. The next day, both groups lay in a brain scanner and looked at pictures, one at a time, saying how pleasant each one felt.',
        art: ['scene', { k: 'sleep-lab' }],
      },
      {
        k: 'ask',
        h: 'Think of a day you were worn right down. How did the pull feel?',
        o: [
          ['Stronger than usual', 'Many people say so. Look at what the scanner showed.'],
          ['About the same', 'Then watch for it. The change is easy to miss from the inside.'],
          ['Weaker, I was too tired to care', 'For some it comes later, as the tiredness lifts. Look at what the scanner found.'],
          ['I have never noticed', 'Few people do. That is part of what the study found.'],
        ],
      },
      {
        h: 'The tired brains lit up more for the same pictures.',
        p: 'After one lost night, the part of the brain that answers to reward fired harder, and the tired group rated plain, ordinary pictures as more pleasant. Nothing about the pictures had changed.',
        art: ['scene', { k: 'brain-glow' }],
        fact: { s: 'Study · Gujar, Yoo, Hu & Walker, 2011', i: [0] },
      },
      {
        long: 1,
        h: 'Earlier work from the same lab found the brake gets weaker too.',
        p: 'After lost sleep, the front of the brain, the part that says wait, had less hold over the alarm and the pull. So the push gets louder at the same moment the brake gets softer.',
        fact: { s: 'Study · Yoo and colleagues, 2007', i: [1] },
      },
      {
        h: 'Worn down is not only about sleep.',
        p: 'Lonely, hungry, stressed, angry: each one drains the same tank. A study of men who used porn found loneliness and use fed each other, each one making the other more likely.',
        art: ['scene', { k: 'tank' }],
        fact: { s: 'Study · Butler and colleagues, 2018', i: [2] },
      },
      {
        k: 'flip',
        think: 'When I am worn down, the urge shows me what I want.',
        see: 'It shows how drained the tank is. A tired brain plays every pull louder than it is.',
      },
      {
        long: 1,
        h: 'So the urge on a drained day is not news about you.',
        p: 'It feels like the truth finally coming out. It is the same pull, played through louder speakers. Rested, the same picture would have said far less.',
        art: ['scene', { k: 'speaker' }],
      },
      {
        h: 'Worn down is a time to plan for, not to fight through.',
        p: 'You know which days drain you, and which hours. Plan them while there is still something in the tank: what you will do, who you will message, and when you will rest.',
        art: ['scene', { k: 'plan-ahead' }],
      },
    ],
    mine: { h: 'Your hardest hours are the ones to plan for.', k: 'hour' },
    today: {
      h: 'Plan your next worn-down hour today.',
      l: ['Name what drains you most', 'Pick the hour it usually hits', 'Choose one thing: rest, a person or a walk'],
    },
    you: {
      h: 'When you are worn down, what is the need under the urge, most often?',
      o: [
        ['Rest', 'Then rest is the plan. Sleep turns the pull back down.'],
        ['A person', 'Then a message to someone meets it better than a screen.'],
        ['Relief from stress', 'Then plan something that lets the stress out: a walk, a shower, a call.'],
        ['I do not know yet', 'Fair. Next time, ask yourself that before anything else.'],
      ],
    },
    scope:
      'The sleep studies kept healthy adults awake for one night and showed them pictures, not porn. The loneliness study found that the two go together, not which one causes the other. Both point to the same move: a worn-down hour is a time to plan for, and rest and people meet the need under it.',
    src: [S.gujar, S.yoo, S.butler],
  },

  l5: {
    id: 'l5',
    form: 'breakdown',
    title: 'Name the act, not yourself',
    tag: 'After a slip, say what you did. Do not say who you are.',
    ic: 'sliders',
    ask: 'After a slip, how should I talk to myself?',
    key: 'Guilt says I did something wrong, and leads to repair. Shame says I am wrong. Keep the guilt.',
    np: 'A harsh sentence I say to myself, written as something I did',
    tell: [
      {
        h: 'People often ask a simple question: what is the difference between guilt and shame?',
        p: 'From the inside they feel the same: a sinking, heat in the face, wanting to look away. But they say two different sentences.',
        art: ['scene', { k: 'two-sentences' }],
      },
      {
        h: 'Guilt says: I did something wrong.',
        p: 'It points at an act. An act has edges. It happened at one time, in one place, for reasons you can look at, and you can do something about it.',
        art: ['scene', { k: 'act-edges' }],
      },
      {
        h: 'Shame says: I am something wrong.',
        p: 'It points at you. A verdict has no edges, nothing to fix and nowhere to start. So shame makes people hide, and hiding is where a habit grows.',
        art: ['scene', { k: 'shame-fog' }],
      },
      {
        k: 'ask',
        h: 'After a slip, which sentence does your mind usually say?',
        o: [
          ['I did something I do not want to do', 'That is guilt. It is the useful one, and the next cards show why.'],
          ['I am disgusting, or broken', 'That is shame. Many people hear it. Look at what it does over time.'],
          ['Both, one after the other', 'Most people hear both. The skill is keeping the first and dropping the second.'],
          ['Nothing, I try not to think about it', 'That is often shame too, the hiding kind. Look at what it costs.'],
        ],
      },
      {
        n: '476',
        h: 'people in jail were asked how they tend to feel after doing wrong.',
        p: 'Researchers then followed them for a year after they got out, to see who would be arrested again.',
      },
      {
        h: 'The ones prone to guilt were less likely to be arrested again.',
        p: 'The sting about the act pushed people to make things right. Shame protected no one. When it turned into blaming others, the chance of going back went up.',
        art: ['scene', { k: 'reoffend' }],
        fact: { s: 'Study · Tangney, Stuewig & Martinez, 2014', i: [0] },
      },
      {
        long: 1,
        h: 'The same split showed up with drinking and drugs.',
        p: 'Among students and adults, people prone to shame had more trouble with alcohol and drugs. People prone to guilt did not.',
        fact: { s: 'Study · Dearing, Stuewig & Tangney, 2005', i: [1] },
      },
      {
        long: 1,
        h: 'There is a sentence that holds both at once.',
        p: 'It was me, but it is not me. The first half takes the act seriously and owns it. The second half refuses to let one act decide who you are.',
        art: ['scene', { k: 'me-not-me' }],
      },
      {
        h: 'So say the act, with its edges.',
        p: 'Not “I am disgusting,” but “I slipped after a bad day, when I was alone.” A sentence with edges is something you can work on. A verdict is not.',
      },
    ],
    mine: { h: 'Your log records what you did, and what you did next.', k: 'back' },
    today: {
      h: 'Say your last slip with its edges.',
      l: ['Write what happened, and what came before', 'Leave out every word about who you are', 'Pick one thing in it you can change'],
    },
    you: {
      h: 'What is one harsh sentence you say to yourself that you could say as an act instead?',
      o: [
        ['“I am weak.”', 'Try: “I gave in when I was worn down.” That one has edges.'],
        ['“I am disgusting.”', 'Try: “I did something I do not want to do.” That you can work on.'],
        ['“I will never change.”', 'Try: “I slipped once this week.” A week is something you can change.'],
        ['I do not talk to myself that way', 'Then keep it that way. It is rarer than it sounds.'],
      ],
    },
    scope:
      'The guilt and shame studies followed people in jail and students, not people who use porn, and shame is not always harmful: it does the most harm when it turns into hiding and blaming. The pattern carries over clearly: the sting about an act helps people repair, and a verdict on the self does not.',
    src: [S.tangney, S.dearing],
  },

  l6: {
    id: 'l6',
    form: 'study',
    title: 'Kindness after a slip',
    tag: 'Being kind to yourself helped people do better, not worse.',
    ic: 'leaf',
    ask: 'Will being kind to myself after a slip make me slip more?',
    key: 'Kindness after a failure keeps people trying. Harshness says you cannot change. Kindness says you can.',
    np: 'What I would say to a friend after a slip, and to myself',
    tell: [
      {
        h: 'In 2012, two researchers gave students a vocabulary test that was made to be hard.',
        p: 'Almost everyone did badly. That was the point. The researchers wanted to see what people do in the minutes right after they fail.',
        art: ['scene', { k: 'hard-test' }],
      },
      {
        h: 'Then they split the students into three groups.',
        p: 'One group read a kind note: it is common to struggle with a test this hard, so try not to be too hard on yourself. A second read praise: you must be smart to get into this school. A third read nothing.',
        art: ['scene', { k: 'three-notes' }],
      },
      {
        k: 'ask',
        h: 'After you fail at something, what usually gets you trying again?',
        o: [
          ['Being hard on myself', 'Many people believe that. Look at what the students did.'],
          ['Someone being kind to me', 'Then you already know something this study found.'],
          ['Telling myself I am better than this', 'That one sounds strong. Watch how it did.'],
          ['Nothing, I usually let it go', 'Then the next cards are about what brings people back.'],
        ],
      },
      {
        h: 'Then everyone could study for a second test, for as long as they liked.',
        p: 'The students who read the kind note studied longer than both other groups. Being told they were smart did not make them work harder. Kindness did.',
        art: ['scene', { k: 'study-time' }],
        fact: { s: 'Study · Breines & Chen, 2012', i: [0] },
      },
      {
        long: 1,
        h: 'They tested it more than one way.',
        p: 'In another version, people wrote about a weakness they felt bad about. The ones who wrote to themselves with kindness were more set on fixing it, not less.',
      },
      {
        h: 'Being harsh feels like taking it seriously.',
        p: 'It says: if I go easy on myself, I will do it again. But underneath, harshness says you cannot change. Kindness says you can, and so you try again.',
        art: ['scene', { k: 'two-voices' }],
      },
      {
        long: 1,
        h: 'It helped strict dieters, too.',
        p: 'Dieters ate a doughnut, and then some heard that everyone eats this way sometimes. When the sweets came out, the ones who had heard the kind words ate less, not more.',
        art: ['scene', { k: 'doughnut' }],
        fact: { s: 'Study · Adams & Leary, 2007', i: [1] },
        back: 'l3',
      },
      {
        h: 'Kind is not soft.',
        p: 'Kind looks straight at the slip, the way a good coach looks at a lost game: what happened, what we change, and back to work. It does not pretend. It does not attack.',
        art: ['scene', { k: 'coach' }],
      },
    ],
    mine: { h: 'Kindness counts what held, too.', k: 'clean30' },
    today: {
      h: 'Speak to yourself like a good coach.',
      l: ['Say what happened, plainly', 'Say one thing you will change', 'Say: “Back to it.”'],
    },
    you: {
      h: 'After your last slip, what did the voice in your head sound like?',
      o: [
        ['A harsh boss', 'A boss like that drains the strength you need next time. Try the coach.'],
        ['A worried friend', 'Worry cares. Now give it a plan.'],
        ['A good coach', 'Then keep that voice. It is the one that keeps people trying.'],
        ['Quiet, I just moved on', 'Quiet can be fine. Add one thing you will change, and it becomes a plan.'],
      ],
    },
    scope:
      'The kindness experiments used students after a failed test and strict dieters after a snack, not people quitting porn. They point the same hopeful way: being kind to yourself after a failure did not make people careless. It made them try harder.',
    src: [S.breines, S.adams],
  },

  l7: {
    id: 'l7',
    form: 'study',
    title: 'Secrets are heavy',
    tag: 'Carrying it alone costs more than it seems.',
    ic: 'lock',
    ask: 'Why does keeping this to myself feel so heavy?',
    key: 'A secret weighs most when you carry it alone. One safe person makes it lighter.',
    np: 'Who could be my safe person, and the one sentence I would tell them',
    tell: [
      {
        h: 'A psychologist named Michael Slepian wanted to know what keeping a secret is like.',
        p: 'He expected the hard part to be the hiding: the careful conversations, the close calls. So he asked thousands of people about the secrets in their own lives.',
        art: ['scene', { k: 'secret-box' }],
      },
      {
        h: 'Almost everyone had one.',
        p: 'About 97 in every 100 were keeping one right then. Most kept several they had never told anyone.',
        art: ['people', { n: 97, s: 'keeping a secret' }],
        fact: { s: 'Study · Slepian, Chun & Mason, 2017', i: [0] },
      },
      {
        k: 'ask',
        h: 'When does your secret cross your mind most?',
        o: [
          ['When someone might find out', 'That is what the researchers expected too. Look at what they found.'],
          ['When I am alone with my thoughts', 'Many people say this. It is where secrets do most of their work.'],
          ['Right after a slip', 'That is a heavy moment. Notice if it comes back on good days too.'],
          ['I do not know yet', 'Fair. Watch for it this week.'],
        ],
      },
      {
        h: 'The hiding was not the heavy part.',
        p: 'People had to hide a secret in a conversation now and then. They thought about it far more often than that, on their own, when nobody was asking.',
        art: ['scene', { k: 'mind-returns' }],
      },
      {
        h: 'And the going back was what hurt.',
        p: 'The more often a secret came to mind on its own, the worse people felt, about the secret and about their lives. What wore them down was carrying it alone.',
        art: ['scene', { k: 'heavy-load' }],
      },
      {
        long: 1,
        h: 'Pushing it away does not stop it.',
        p: 'It is the white bear again. Trying hard not to think about a secret is one of the surest ways to keep it coming back.',
        back: 'l2',
      },
      {
        long: 1,
        h: 'Then he looked at people who had told someone.',
        p: 'People who had confided a secret in one person went back to it less, and felt better able to handle it. Not a crowd. One person.',
        art: ['scene', { k: 'two-carry' }],
        fact: { s: 'Study · Slepian & Moulton-Tetlock, 2019', i: [1] },
      },
      {
        long: 1,
        h: 'Telling one person is not telling everyone.',
        p: 'You choose who, and how much. One honest sentence to one safe person is enough to stop carrying it alone. The rest can come later, or not at all.',
      },
      {
        h: 'A secret is a load you carry in your head.',
        p: 'Trying harder will not stop it from coming back to mind. Letting one person help hold it makes it lighter.',
      },
    ],
    mine: { h: 'Honesty starts small, and you have already started.', k: 'acted' },
    today: {
      h: 'Choose one safe person, and one sentence.',
      l: ['Think of one person who would not shame you', 'Write the one sentence you would tell them', 'You decide when. Writing it is a start'],
    },
    you: {
      h: 'Who is one person who could help you carry this?',
      o: [
        ['A friend', 'Then the sentence can be short. A friend does not need every detail.'],
        ['Someone in my family', 'Family can carry a lot. Pick the one who listens best.'],
        ['A counselor or a faith leader', 'They hear this often, and they know how to carry it with you.'],
        ['Nobody yet', 'Then a counselor or a group can be your first. Many people start there.'],
      ],
    },
    scope:
      'The secrecy studies asked adults about the secrets in their own lives, and they show what went together, not proof of cause. They agree on something hopeful: the heavy part of a secret is carrying it alone, and telling one safe person goes with carrying it less.',
    src: [S.slepian, S.slepian19],
  },

  l8: {
    id: 'l8',
    form: 'study',
    title: 'Wanting to be loved',
    tag: 'A habit is not a verdict on whether you can love.',
    ic: 'heart',
    ask: 'Does this habit mean I cannot be close to anyone?',
    key: 'Closeness is not only for the unbroken. Two people build it in small turns, and you can take one today.',
    np: 'One small true thing I could share, and who with',
    tell: [
      {
        h: 'In 1997, a psychologist named Arthur Aron paired up strangers in his lab.',
        p: 'They were students who had never met. He gave each pair a list of questions and 45 minutes, and asked them to take turns answering.',
        art: ['scene', { k: 'two-chairs' }],
      },
      {
        h: 'The questions started small.',
        p: 'Who would you want as a dinner guest? What would a perfect day be for you? Then, slowly, they went deeper: what are you most grateful for? What is your most treasured memory?',
        art: ['scene', { k: 'question-cards' }],
      },
      {
        k: 'ask',
        h: 'What do you think makes two people close?',
        o: [
          ['Time, lots of it', 'Time helps. This study had 45 minutes.'],
          ['Having a lot in common', 'Many people think so. Look at what Aron found.'],
          ['Letting someone see who I am', 'That is close to it. The next card shows how.'],
          ['I do not know', 'That is honest. The study gives a place to start.'],
        ],
      },
      {
        h: 'By the end, many pairs felt as close as old friends.',
        p: 'Some said they felt closer to their partner than to most people in their lives. Nothing magic was in the questions. What mattered was the turns: one shares, the other shares back, a little deeper each time.',
        art: ['turns', {}],
        fact: { s: 'Study · Aron and colleagues, 1997', i: [0] },
      },
      {
        long: 1,
        h: 'Other pairs got easy questions instead.',
        p: 'They spent the same 45 minutes on small talk: favorite holidays, good TV shows. They got along fine, and they did not grow nearly as close. Closeness came from the risk of saying something true.',
        art: ['scene', { k: 'small-talk' }],
      },
      {
        h: 'Nobody in that room had to be unbroken.',
        p: 'Everyone came with a past and things they were not proud of. Closeness did not wait until they were fixed. It came from showing a little of who they were, and being met.',
        art: ['scene', { k: 'met' }],
      },
      {
        long: 1,
        h: 'A habit kept in secret teaches the opposite.',
        p: 'It teaches you to hide, to keep people at a distance, to handle everything alone. Each small turn toward someone teaches you back the other way.',
        back: 'l7',
      },
    ],
    today: {
      h: 'Take one small turn toward someone.',
      l: ['Pick someone you would like to know better', 'Share one small true thing about your day', 'Then ask them something back'],
    },
    you: {
      h: 'What is one small true thing you could share this week?',
      o: [
        ['Something I am grateful for', 'A warm place to start. It invites them to share back.'],
        ['Something I find hard right now', 'That is a real turn. Pick someone who has earned it.'],
        ['A memory that matters to me', 'Memories open people up. It is a good turn.'],
        ['I am not ready to share', 'Then start by asking. Listening well is a turn too.'],
      ],
    },
    scope:
      'The closeness study paired students who had never met, and it measured feeling close, not love, so nobody can promise how any one relationship will go. What it shows is hopeful and sure: closeness is something people build, a little at a time, and you can start building it now.',
    src: [S.aron],
  },

  l9: {
    id: 'l9',
    form: 'works',
    title: 'If this, then that',
    tag: 'Decide ahead, so the hard moment does not have to.',
    ic: 'plug',
    ask: 'How do I make a good choice when the urge hits?',
    key: 'Decide ahead with an if-then plan. When the moment comes, it sets the plan off, and you only follow.',
    np: 'My strongest if-then',
    tell: [
      {
        h: 'Most plans to quit sound like this: I will try harder.',
        p: 'It is a wish, not a plan. When the hard moment comes, the wish has to win an argument with the urge, and the urge is louder.',
        art: ['scene', { k: 'wish' }],
      },
      {
        h: 'A psychologist named Peter Gollwitzer studied a different kind of plan.',
        p: 'Not what you want, but exactly when, and exactly what. If this happens, then I will do that. If I feel the pull while I am alone at my desk, then I stand up and go to the kitchen.',
        art: ['scene', { k: 'if-then' }],
      },
      {
        k: 'ask',
        h: 'When the hard moment comes, how do you usually decide what to do?',
        o: [
          ['In the moment, by how I feel', 'Then the hardest moment makes the call. The next cards move it.'],
          ['I remind myself why I am quitting', 'Reasons help. In the moment they have to win an argument first.'],
          ['I already have a plan for it', 'Then you are ahead. This lesson sharpens it.'],
          ['I do not know yet', 'That is honest. Notice it the next time.'],
        ],
      },
      {
        n: '94',
        h: 'studies, with more than 8,000 people, tested plans written this way.',
        p: 'Across them, people who wrote if-then plans reached their goals far more often than people who only set the goal. It held for exercise, eating, studying and more.',
        fact: { s: 'Review · Gollwitzer & Sheeran, 2006', i: [0] },
      },
      {
        h: 'Here is why it works.',
        p: 'A plan made ahead moves the decision out of the hard moment. When the if shows up, the then is already waiting. You are not deciding. You are following.',
        art: ['scene', { k: 'decide-ahead' }],
      },
      {
        long: 1,
        h: 'The if is the half that matters most.',
        p: 'The plan works because the moment becomes easy to spot. A place, a feeling or a moment you know well is easy to catch. “If things get bad” is not.',
        fact: { s: 'Study · Webb & Sheeran, 2007', i: [1] },
      },
      {
        long: 1,
        h: 'The then should be small enough to do worn down.',
        p: 'Not “I will be strong.” Something your body can do with no thought at all: stand up, leave the room, open SOS, message someone.',
        art: ['scene', { k: 'small-then' }],
        back: 'l4',
      },
    ],
    today: {
      h: 'Write one if-then for your hardest moment.',
      l: ['If: the place or feeling where it starts', 'Then: one small thing your body can do', 'Say it once out loud so it sticks'],
    },
    you: {
      h: 'What is your strongest if-then?',
      o: [
        ['If I feel the pull alone, I stand up', 'Small and clear. Your body can do that worn down.'],
        ['If I reach for the phone, I leave it', 'A clear if. That one catches the habit early.'],
        ['If I am stressed, I message someone', 'A then that meets the need under it.'],
        ['I do not have one yet', 'Then write one today. It takes a minute.'],
      ],
    },
    scope:
      'The review covered many kinds of goals, not porn, and if-then plans are one of the best tested tools in the study of goals. They help most when the if is a clear moment and the then is small. Yours can be both.',
    src: [S.gollwitzer, S.webb],
  },
};
