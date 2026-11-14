/* Lessons told as a story, batch A (the shape is in lesson-stories.ts, the standard in docs/lessons.md). Written November 14, 2026,
   from the samples the owner approved that day: the white bear, the milkshake, the soldiers who came home, a word taken apart, and
   Pleasure Island. */
import type { Story } from './lesson-stories';

type Src = [string, string];
const S = {
  freedman: [
    'Freedman & Fraser (1966): compliance without pressure, the foot-in-the-door technique, Journal of Personality and Social Psychology',
    'https://doi.org/10.1037/h0023552',
  ],
  bem: [
    'Bem (1972): self-perception theory, how people come to know their own attitudes by watching what they do (overview)',
    'https://en.wikipedia.org/wiki/Self-perception_theory',
  ],
  tip35: ['SAMHSA: TIP 35, chapter 5, “From Contemplation to Preparation”', 'https://www.ncbi.nlm.nih.gov/books/NBK571064/'],
  wegner: [
    'Wegner, Schneider, Carter & White (1987): paradoxical effects of thought suppression, Journal of Personality and Social Psychology',
    'https://doi.org/10.1037/0022-3514.53.1.5',
  ],
  wegner94: ['Wegner (1994): ironic processes of mental control, Psychological Review', 'https://doi.org/10.1037/0033-295X.101.1.34'],
  bowen: ['Bowen & Marlatt (2009): “Surfing the urge,” a study with college smokers', 'https://pubmed.ncbi.nlm.nih.gov/20025372/'],
  herman: ['Herman & Mack (1975): restrained and unrestrained eating, Journal of Personality', 'https://doi.org/10.1111/j.1467-6494.1975.tb00727.x'],
  larimer: [
    'Larimer, Palmer & Marlatt (1999): relapse prevention, an overview of Marlatt’s cognitive-behavioral model, Alcohol Research & Health',
    'https://pmc.ncbi.nlm.nih.gov/articles/PMC6760427',
  ],
  robins: ['Hall & Weier (2017): Lee Robins’ studies of heroin use among US Vietnam veterans, Addiction', 'https://pubmed.ncbi.nlm.nih.gov/27650054/'],
  wood: [
    'Wood, Tam & Guerrero Witt (2005): changing circumstances, disrupting habits, Journal of Personality and Social Psychology',
    'https://dornsife.usc.edu/wendy-wood/wp-content/uploads/sites/183/2023/10/Wood.Tam_.GuerreroWitt.2005_Changing_circumstances_disrupting_habits.pdf',
  ],
  addictus: ['Etymology: addict, from Latin addictus, one bound over by a judge to a creditor', 'https://www.etymonline.com/word/addict'],
  decide: ['Etymology: decide, from Latin decidere, to cut off', 'https://www.etymonline.com/word/decide'],
  habit: ['Etymology: habit, from Latin habitus, condition, and also dress', 'https://www.etymonline.com/word/habit'],
  collodi: ['Collodi (1883): The Adventures of Pinocchio, chapters 30 to 36 (public domain)', 'https://www.gutenberg.org/ebooks/500'],
} satisfies Record<string, Src>;

export const STORIES_A: Record<string, Story> = {
  l1: {
    id: 'l1',
    form: 'study',
    title: 'You do not need to feel ready',
    ic: 'flag',
    ask: 'Do I need to feel ready before I start quitting?',
    key: 'Ready is not where people start. It is what a few small steps leave behind.',
    np: 'My small sign: one step so small I would hardly notice saying yes',
    tell: [
      {
        h: 'In 1966, two researchers knocked on doors in California with an odd request.',
        p: 'Could they put a big, badly painted sign on your front lawn? It said Drive Carefully, and it would hide most of the house.',
        art: ['scene', { k: 'lawn-sign' }],
      },
      {
        k: 'ask',
        h: 'Say it is your house. Would you let them put it up?',
        o: [
          ['Yes, it is for safe roads', 'Then you would be one of the few. Look at what most people said.'],
          ['No, that is too much to ask', 'Most people said the same. Look at what changed their answer.'],
          ['I would want to think about it', 'Fair. Most people did not think long. Look at what they said.'],
        ],
      },
      {
        h: 'Most people said no.',
        p: 'About 17 in every 100 homeowners agreed. It was an ugly sign, on their own lawn.',
        art: ['people', { n: 17, s: 'said yes' }],
        fact: { s: 'Study · Freedman & Fraser, 1966', i: [0] },
      },
      {
        h: 'Two weeks earlier, they had asked other homeowners for something tiny.',
        p: 'A card three inches wide, for a window, that said Be a safe driver. Almost everyone said yes. It cost nothing.',
        art: ['scene', { k: 'window-sign' }],
      },
      {
        h: 'Then those people were asked about the big lawn sign.',
        p: 'About 76 in every 100 said yes. One tiny yes, weeks before, made the big yes more than four times as likely.',
        art: ['people', { n: 76, was: 17, s: 'said yes' }],
      },
      {
        h: 'The small yes changed who they thought they were.',
        p: 'The lawn and the ugly sign were the same. What changed was the person in the doorway, who now saw someone who does things for safe roads.',
        art: ['scene', { k: 'doorway' }],
      },
      {
        long: 1,
        h: 'Then came the strangest group.',
        p: 'Some homeowners had first signed a petition about something else: keeping California beautiful. Even they were far more willing to take the lawn sign later, close to half of them.',
        art: ['scene', { k: 'petition' }],
      },
      {
        long: 1,
        h: 'You learn who you are partly by watching what you do.',
        p: 'A psychologist named Daryl Bem put it this way: people read their own actions the way an outsider would, and decide who they are from what they see.',
        art: ['scene', { k: 'mirror' }],
        fact: { s: 'Theory · Bem, self-perception, 1972', i: [1] },
      },
      {
        h: 'So waiting to feel ready gets it backward.',
        p: 'Most people wait to feel like someone who can quit, and then plan to start. The feeling comes after the first small steps, not before them.',
        art: ['ready', {}],
      },
      {
        long: 1,
        h: 'Mixed feelings are not a sign you are not serious.',
        p: 'A guide written for addiction counselors calls them a normal part of any change. You do not have to finish being unsure. You need one small yes.',
        art: ['scene', { k: 'mixed-feelings' }],
        fact: { s: 'Treatment guide · US SAMHSA, TIP 35', i: [2] },
      },
    ],
    mine: { h: 'Every step you take is a sign in your own window.', k: 'acted' },
    today: {
      h: 'Put up your small sign today.',
      l: ['Pick a step so small it is easy to say yes', 'Do it today, before you feel sure', 'Notice what it says about you'],
    },
    you: {
      h: 'What would be your three-inch sign, a step so small you would hardly notice saying yes?',
      o: [
        ['Write down one reason I want this', 'A reason in your own words is a sign you put up for yourself.'],
        ['Leave the phone in another room for an hour', 'Small, and it says something about who you are becoming.'],
        ['Tell myself plainly: I am quitting', 'Said out loud, it becomes something you have done, not only thought.'],
        ['I do not know yet', 'That is fair. Look for the smallest yes you can find today.'],
      ],
    },
    scope:
      'The sign study was about safe driving, not about a habit, and the idea that people learn who they are from what they do is a well-known one in psychology. Together they point one hopeful way: a small step taken now changes how you see yourself, and that is what feeling ready is made of.',
    src: [S.freedman, S.bem, S.tip35],
  },

  l2: {
    id: 'l2',
    form: 'study',
    title: 'Urges are waves',
    ic: 'wave',
    ask: 'What do I do when an urge hits?',
    key: 'Fighting a thought keeps it near. Name it, let it be there, and watch it pass.',
    np: 'What I will say to myself the next time an urge comes, and how long I will watch it',
    tell: [
      {
        h: 'In 1863, the writer Dostoevsky made a small challenge.',
        p: 'Try not to think of a polar bear, he wrote, and you will see that the cursed thing comes to mind every minute.',
        art: ['scene', { k: 'bear-book' }],
      },
      {
        h: 'More than a hundred years later, a psychologist named Daniel Wegner tested it.',
        p: 'He sat people alone in a room for five minutes, saying aloud whatever came to mind. One rule: do not think of a white bear. If one comes, ring the bell.',
        art: ['scene', { k: 'bell-room' }],
      },
      {
        h: 'Try it yourself.',
        art: ['try', { k: 'bell' }],
      },
      {
        h: 'The people in the room rang the bell about once a minute.',
        p: 'Then came the part nobody expected. Told afterward that they could think of the bear, the ones who had pushed it away thought of it more than people who had been free to all along.',
        art: ['scene', { k: 'rebound' }],
        fact: { s: 'Study · Wegner and colleagues, 1987', i: [0] },
      },
      {
        long: 1,
        h: 'Wegner spent years working out why.',
        p: 'To keep a thought out, part of your mind has to keep checking whether it is gone. Every check carries the thought back in. The harder you push, the harder that part works.',
        art: ['scene', { k: 'checker' }],
        fact: { s: 'Theory · Wegner, ironic processes, 1994', i: [1] },
      },
      {
        h: 'An urge works the same way.',
        p: 'When you fight hard to keep a picture out, the fight keeps it close. The urge is not winning because you are weak. It is winning because you are pushing.',
        art: ['scene', { k: 'push-door' }],
      },
      {
        h: 'There is a third way, between pushing it out and giving in.',
        p: 'Let it be there. Name it. Watch it rise, peak and fall like a wave. An urge left alone does not climb forever.',
        art: ['wave', {}],
      },
      {
        long: 1,
        n: '123',
        h: 'college smokers were taught to watch their urges this way.',
        p: 'Their urges were as strong as everyone else’s. Over the next week, they smoked fewer cigarettes. The urge did not change. What they did with it did.',
        fact: { s: 'Study · 123 college smokers · Bowen & Marlatt, 2009', i: [2] },
      },
      {
        long: 1,
        h: 'Each urge you watch to the end teaches you something.',
        p: 'Not that the urge is weak, but that it ends. The next one has less to promise you, because you have seen how this goes.',
        art: ['scene', { k: 'waves' }],
      },
    ],
    mine: { h: 'Every urge you watched to the end came down.', k: 'rode' },
    today: {
      h: 'Watch the next urge instead of fighting it.',
      l: ['Name it: “This is an urge, and it passes.”', 'Let it be there, and breathe out slowly', 'Watch it for ten minutes, and see it fall'],
    },
    you: {
      h: 'When an urge comes, what do you usually do first?',
      o: [
        ['Push it out of my head', 'Now you know why it comes back. Try letting it be there next time, and watch.'],
        ['Argue with it', 'An argument keeps it close too. Naming it is enough.'],
        ['Look for something to distract me', 'That can help. Notice whether you are running from it or letting it pass.'],
        ['Give in before it gets bad', 'Then you have never seen one fall on its own. The next one is your chance.'],
      ],
    },
    scope:
      'The white bear study was about an ordinary thought, not an urge, and the urge study followed college students who smoked. What carries over is the pattern: pushing a thought away tends to keep it near, and watching an urge without obeying it changed what people did. That is a skill anyone can learn.',
    src: [S.wegner, S.wegner94, S.bowen],
  },

  l3: {
    id: 'l3',
    form: 'study',
    title: 'Why one slip snowballs',
    ic: 'bolt',
    ask: 'After a slip, why is it so easy to keep going?',
    key: 'One slip is one milkshake. The pile-up comes from the rule that says the day is ruined.',
    np: 'The sentence my mind says after a slip, and what I will say instead',
    tell: [
      {
        h: 'In 1975, two researchers invited people to an ice cream taste test.',
        p: 'Some were on strict diets, and some were not. They could eat as much as they liked. The researchers were not measuring taste. They weighed the tubs afterward.',
        art: ['scene', { k: 'tasting' }],
      },
      {
        h: 'Before the tasting, some of them drank a milkshake.',
        p: 'The others had nothing. You would expect a full stomach to mean less ice cream.',
        art: ['scene', { k: 'milkshake' }],
      },
      {
        k: 'ask',
        h: 'Think of a day that started with one slip. What happened to the rest of it?',
        o: [
          ['It turned into more', 'Many people know that day. This study is about why.'],
          ['I stopped there and moved on', 'Then you already do what this lesson teaches. Look at why it works.'],
          ['I gave up on the day', 'That is the most common answer. The next card shows where it comes from.'],
          ['That has not happened to me yet', 'Then this is worth knowing before it does.'],
        ],
      },
      {
        h: 'People not on a diet ate less after a milkshake. People on a diet ate more.',
        p: 'The dieters who had already broken the diet ate more ice cream than the dieters who had nothing first.',
        art: ['scene', { k: 'ice-results' }],
        fact: { s: 'Study · Herman & Mack, 1975', i: [0] },
      },
      {
        h: 'The milkshake was not the problem. The thought after it was.',
        p: '“I already broke the diet today, so it does not matter now.” Once the day was scored as ruined, there was nothing left to protect.',
        art: ['scene', { k: 'ruined-day' }],
      },
      {
        long: 1,
        h: 'Researchers have a name for it.',
        p: 'Alan Marlatt, who built relapse prevention, called it the abstinence violation effect. He found it in every habit he studied: the slip is small, and the thought “I blew it” makes it big.',
        art: ['chain', { n: ['One slip', '“I blew it”', 'Many more'], i: ['dots', 'bolt', 'x'] }],
        fact: { s: 'Model · Marlatt’s relapse prevention', i: [1] },
      },
      {
        long: 1,
        h: 'He also found who gets back up fastest.',
        p: 'People who saw a slip as one mistake, in one moment, with a cause they could change, got back on track sooner. People who blamed something fixed in themselves kept going.',
        art: ['scene', { k: 'get-up' }],
      },
      {
        h: 'So score it as one.',
        p: 'One slip is one milkshake, and the rest of the day still counts. Twelve days with one slip read eleven of twelve, not zero. The next urge is a wave like any other.',
        art: ['dots', {}],
        back: 'l2',
      },
    ],
    mine: { h: 'What you have come back from already counts.', k: 'back' },
    today: {
      h: 'Get your sentence ready before you need it.',
      l: ['Write the words you will say after a slip', 'Make them about one moment, not about you', 'Keep them where you will see them'],
    },
    you: {
      h: 'After a slip, what is the first sentence your mind says?',
      o: [
        ['“I already blew it, so it does not matter.”', 'That is the milkshake sentence. Catch it, and the day is still yours.'],
        ['“I will start fresh on Monday.”', 'It sounds hopeful, and it gives away every day until Monday.'],
        ['Something harsh about who I am', 'That one makes it about you, not about one moment. The moment is what you can change.'],
        ['“That was one. Back to it.”', 'Then you already score it as one. Keep that sentence close.'],
      ],
    },
    scope:
      'The ice cream study was about strict dieting, not about porn, and the “I blew it” pattern comes from Marlatt’s model of addictive behaviors in general. The pattern carries over to any habit, and so does the way out: score a slip as one event, and keep going.',
    src: [S.herman, S.larimer],
  },

  l10: {
    id: 'l10',
    form: 'study',
    title: 'Change the setting',
    ic: 'compass',
    ask: 'Do I have to change myself before the habit will change?',
    key: 'Much of a habit lives in the setting. Change the room, and much of the pull stays behind.',
    np: 'One thing I will move or change in the place it happens most',
    tell: [
      {
        h: 'In 1971, the United States got news it did not expect from Vietnam.',
        p: 'About one in five American soldiers there said they were addicted to heroin. The fear was that a wave of addicts was about to come home.',
        art: ['scene', { k: 'far-away' }],
      },
      {
        h: 'A researcher named Lee Robins was asked to follow them home.',
        p: 'She did something unusual. She followed every man in her sample, not only the ones who turned up at clinics for help.',
        art: ['scene', { k: 'files' }],
      },
      {
        k: 'ask',
        h: 'Say you came home after a year like that. What would you expect to happen?',
        o: [
          ['I would keep using', 'That is what the doctors expected too. Look at what happened.'],
          ['It would depend on the person', 'That is what most people would say. Look at what mattered more.'],
          ['I would stop once I was home', 'Then you saw what almost nobody did. Look at the number.'],
        ],
      },
      {
        h: 'Of the men who had been addicted in Vietnam, about 5 in 100 went back to it in their first year home.',
        p: 'Back home, most people treated for heroin went back to it. These men mostly stopped, and stayed stopped.',
        art: ['people', { n: 5, s: 'went back to it' }],
      },
      {
        h: 'They were the same men, with the same bodies and the same memories.',
        p: 'What had changed was everything around them: the place, the people, the boredom, the fear, the drug in reach on every corner.',
        art: ['scene', { k: 'same-man' }],
        fact: { s: 'Study · Robins, Vietnam veterans, reviewed by Hall & Weier, 2017', i: [0] },
      },
      {
        long: 1,
        h: 'People did not believe her at first.',
        p: 'It went against everything known about heroin. Some said the men must be lying. Robins checked, with interviews and tests, and the result held.',
      },
      {
        h: 'A habit is not only inside you.',
        p: 'Much of it lives in the setting: the room, the hour, the device, the chair. The setting does part of the deciding before you do.',
        art: ['rooms', {}],
      },
      {
        long: 1,
        h: 'Students who moved to a new university showed the same thing.',
        p: 'Their old habits, like exercise or watching TV, held when the new place looked like the old one. When the setting changed, the habit often broke.',
        art: ['scene', { k: 'campus' }],
        fact: { s: 'Study · Wood, Tam & Guerrero Witt, 2005', i: [1] },
      },
      {
        h: 'So you do not have to rebuild yourself first.',
        p: 'Change the room, the device or the route, and much of the pull stays behind, the way the soldiers left theirs behind.',
        art: ['scene', { k: 'move-phone' }],
      },
      {
        long: 1,
        h: 'This is not cheating, and it is not weakness.',
        p: 'It is what the people we admire for their self-control do all the time. They do not win more fights in the same room. They change the room.',
      },
    ],
    today: {
      h: 'Change one thing in the place it happens most.',
      l: ['Pick the place where it happens most', 'Move one thing: the phone, the chair, the hour', 'Notice how the pull feels there tomorrow'],
    },
    you: {
      h: 'In the place it happens most, what is one thing you could move?',
      o: [
        ['Where the phone stays', 'Often the biggest one. The phone is half the setting.'],
        ['Which room I am in when I am alone', 'A different room can carry a different habit.'],
        ['What I do when I first get home', 'The first ten minutes in a place often set the rest.'],
        ['I do not know yet', 'Fair. Watch where it happens this week, and the answer will show.'],
      ],
    },
    scope:
      'Robins studied heroin use among soldiers, and the student study was about everyday habits. Neither was about porn. What carries over is the pattern: a habit is tied to its setting, and changing the setting is one of the strongest moves a person can make.',
    src: [S.robins, S.wood],
  },

  l11: {
    id: 'l11',
    form: 'word',
    title: 'What to call it, and who can help',
    ic: 'pencil',
    ask: 'Am I an addict? Do I have to know what to call this?',
    key: 'Bound for a time, not born bound. Every decision is a cut in the rope.',
    np: 'What this habit has been collecting from me',
    tell: [
      {
        h: 'The word addict comes from Roman law.',
        p: 'An addictus was a person a judge handed over to the one he owed money to. He worked for that person until the debt was paid.',
        art: ['scene', { k: 'court' }],
      },
      {
        h: 'It was never a name for what someone was.',
        p: 'It was a state someone was in, for a time. And it had an end. When the debt was paid, the person walked out free.',
        art: ['scene', { k: 'debt-paid' }],
      },
      {
        long: 1,
        h: 'So “I am an addict” sounds like it is about who you are.',
        p: 'The old word says something else: someone bound, for now, to something that collects from them. That is a hard place to be, and it is a place, not a person.',
      },
      {
        h: 'Now a second word. Decide comes from the Latin for “to cut off.”',
        p: 'The same root is in scissors and incision. A decision is not a feeling. It is a cut.',
        art: ['scene', { k: 'scissors' }],
      },
      {
        h: 'The habit is a rope that binds you for a time.',
        p: 'A decision is a cut in that rope. One cut does not free you. But every cut is real, and the rope does not grow back by itself.',
        art: ['scene', { k: 'rope-cuts' }],
      },
      {
        long: 1,
        h: 'And a third word. Habit first meant something you wear.',
        p: 'It came from the Latin for condition, and it also meant dress, like a monk’s habit. Something put on, again and again, until it feels like skin. Something worn can be taken off.',
        art: ['scene', { k: 'robe' }],
      },
      {
        h: 'So the name matters less than the debt.',
        p: 'You do not have to decide what to call this before you get help. Ask what it has been collecting from you, and whether you want to keep paying.',
        art: ['scene', { k: 'ledger' }],
      },
      {
        long: 1,
        h: 'Help does not wait for a label.',
        p: 'A counselor, a group, a doctor or a faith leader can help whether you call it an addiction, a habit or a problem. What brings people in is the cost, not the name.',
      },
    ],
    today: {
      h: 'Make one cut today.',
      l: ['Pick one easy way in the habit uses', 'Cut it: an app, a route, a place', 'Count it as a real cut, even if it is small'],
    },
    you: {
      h: 'If this habit is a debt you have been paying, what has it been collecting from you?',
      o: [
        ['Time', 'Hours you will not get back. Every cut gives some of them back.'],
        ['Sleep, and how I feel the next day', 'That is a heavy collection, and it shows up everywhere.'],
        ['Closeness with someone', 'Then the cut gives more than time. It gives you back to someone.'],
        ['Respect for myself', 'That one comes back too, one kept decision at a time.'],
      ],
    },
    scope:
      'Where a word comes from does not decide what it means today. Here the old meanings of addict, decide and habit are a way to see the habit more clearly: as something that binds for a time and can be cut, not as who a person is.',
    src: [S.addictus, S.decide, S.habit],
  },

  l41: {
    id: 'l41',
    form: 'tale',
    title: 'Pleasure Island',
    tag: 'What a pleasure that asks nothing of you can take.',
    ic: 'sparkle',
    ask: 'I know what the habit gives me. What is it taking?',
    key: 'What costs you nothing can still take you.',
    np: 'My cap: what I do to hide the ears',
    tell: [
      {
        h: 'In Pinocchio, a coachman offers boys a free ride to a place with no school and no rules.',
        p: 'In the old book it is called the Land of Toys. Every week there has six Thursdays and one Sunday. Thursday was the day children had off.',
        art: ['scene', { k: 'toy-land' }],
      },
      {
        h: 'Nobody is dragged there.',
        p: 'The coachman has a sweet voice and asks nothing. Every boy climbs into the coach because he wants to.',
        art: ['scene', { k: 'coach-ride' }],
      },
      {
        long: 1,
        h: 'For five months, it is everything they hoped for.',
        p: 'They play from morning to night. Nobody asks them to do anything, and nobody asks them to become anything.',
      },
      {
        h: 'Then one morning, Pinocchio wakes up with long ears.',
        p: 'Look at what he does first. He does not run for help. He pulls a cap down over his ears and goes to find his friend.',
        art: ['scene', { k: 'cap-ears' }],
      },
      {
        h: 'His friend is wearing a cap too.',
        p: 'Each pretends nothing is wrong, until they take the caps off together. They laugh at each other’s ears, and the laughing turns to braying.',
        art: ['scene', { k: 'two-caps' }],
      },
      {
        long: 1,
        h: 'The change did not happen in one night.',
        p: 'It was five months of days that each cost nothing. And the first thing both boys did when they noticed was to hide it.',
        art: ['scene', { k: 'free-days' }],
      },
      {
        h: 'The trip was free. The cost was the boys themselves.',
        p: 'A pleasure that asks nothing of you slowly makes you less of a person, and more of something that carries other people’s loads.',
        art: ['scene', { k: 'donkey-load' }],
        fact: { s: 'Story · Collodi, The Adventures of Pinocchio, 1883', i: [0] },
      },
      {
        long: 1,
        h: 'The donkeys are sold to work.',
        p: 'Pinocchio is bought by a circus, lamed, and thrown into the sea so his skin can be sold. The pleasure that asked nothing ended with him being used up for someone else’s profit.',
      },
      {
        long: 1,
        h: 'In the sea, he becomes a puppet again, and a giant fish swallows him.',
        p: 'Inside it, he finds his father, who has been searching for him for two years. Pinocchio swims out with his father on his back.',
        art: ['scene', { k: 'big-fish' }],
      },
      {
        h: 'Even then, he does not become real that night.',
        p: 'He becomes real months later, after working every day to care for his sick father, turning a heavy wheel for a glass of milk.',
        art: ['scene', { k: 'wheel' }],
      },
      {
        h: 'Becoming real is not one brave night.',
        p: 'It is a run of ordinary days spent carrying something that matters. The ears grow slowly, and so does a real person.',
        art: ['scene', { k: 'real-boy' }],
      },
    ],
    today: {
      h: 'Take off the cap.',
      l: ['Pick one person you trust', 'Tell them one true thing about where you are', 'Let them see the ears, and see what happens'],
    },
    you: {
      h: 'What is your cap, the thing you do to hide the ears?',
      o: [
        ['Saying it is not that bad', 'That is the cap the boys wore first. Taking it off is the start.'],
        ['Keeping it secret', 'A secret is a cap. One person who knows can help you take it off.'],
        ['Staying busy so I do not think about it', 'Busy can hide the ears from you too. Look at them once, plainly.'],
        ['I do not know yet', 'Fair. Watch for the moment you reach for a cap this week.'],
      ],
    },
    scope:
      'Pinocchio is a story, not a study. Read this way, it holds something people who change a habit often find: a pleasure that costs nothing can cost the most, and becoming who you want to be is built from ordinary days of carrying something.',
    src: [S.collodi],
  },
};
