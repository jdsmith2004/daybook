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
      },
      {
        k: 'guess',
        h: 'Out of every hundred homeowners asked, how many said yes to the big sign?',
        o: [
          ['About 5', 'Close. It was low, as you would expect.'],
          ['About 17', 'That is it. Most people said no. Now look at what changed the answer.'],
          ['About 50', 'Lower than that. It was an ugly sign.'],
          ['About 76', 'That number is coming. It belongs to another group.'],
        ],
        a: 1,
      },
      {
        h: 'Two weeks earlier, they had asked other homeowners for something tiny.',
        p: 'A sign three inches wide, for a window, that said Be a safe driver. Almost everyone said yes. It cost nothing.',
      },
      {
        k: 'guess',
        h: 'Then those people were asked about the big lawn sign. How many said yes?',
        o: [
          ['About the same, 17', 'That is what the researchers expected too. It was not.'],
          ['About 30', 'More than that.'],
          ['About 76', 'That is it. A tiny yes, weeks earlier, made the big yes four times as likely.'],
        ],
        a: 2,
      },
      {
        h: 'The small sign did not make the big one easier to put up.',
        p: 'The lawn was the same, and so was the ugly sign. What changed was the person standing in the doorway.',
      },
      {
        long: 1,
        h: 'Then came the strangest group.',
        p: 'Some homeowners had first signed a petition about something else: keeping California beautiful. Even they were far more willing to take the lawn sign later, close to half of them.',
      },
      {
        h: 'The small yes changed who they thought they were.',
        p: 'After it, they saw themselves as someone who does things for safe roads. The big yes was them acting like that person.',
        fact: { s: 'Study · Freedman & Fraser, 1966', i: [0] },
      },
      {
        long: 1,
        h: 'You learn who you are partly by watching what you do.',
        p: 'A psychologist named Daryl Bem put it this way: people read their own actions the way an outsider would, and decide who they are from what they see.',
        fact: { s: 'Theory · Bem, self-perception, 1972', i: [1] },
      },
      {
        h: 'So waiting to feel ready gets it backward.',
        p: 'Most people wait to feel like someone who can quit, and then plan to start. The feeling comes after the first small steps, not before them.',
      },
      {
        long: 1,
        h: 'Mixed feelings are not a sign you are not serious.',
        p: 'A guide written for addiction counselors calls them a normal part of any change. You do not have to finish being unsure. You need one small yes.',
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
      },
      {
        h: 'More than a hundred years later, a psychologist decided to test it.',
        p: 'Daniel Wegner did not ask people whether pushing a thought away works. He sat them alone in a room with a bell.',
      },
      {
        h: 'For five minutes, they said aloud whatever came to mind.',
        p: 'The one rule: do not think of a white bear. And if one comes, ring the bell.',
      },
      {
        k: 'guess',
        h: 'People were trying hard not to think of it. How often did the bell ring?',
        o: [
          ['Almost never', 'That is what most people expect. It is not what happened.'],
          ['Once or twice in five minutes', 'More than that.'],
          ['About once a minute', 'That is it. Trying hard did not keep the bear away.'],
        ],
        a: 2,
      },
      {
        h: 'Then came the part nobody expected.',
        p: 'Afterward, people were told they could think of the bear if they liked. The ones who had pushed it away now thought of it more than people who were free to think of it from the start.',
        fact: { s: 'Study · Wegner and colleagues, 1987', i: [0] },
      },
      {
        long: 1,
        h: 'Wegner spent years working out why.',
        p: 'To keep a thought out, part of your mind has to keep checking whether it is gone. Every check carries the thought back in. The harder you push, the harder that part works.',
        fact: { s: 'Theory · Wegner, ironic processes, 1994', i: [1] },
      },
      {
        h: 'An urge works the same way.',
        p: 'When you fight hard to keep a picture out, the fight keeps it close. The urge is not winning because you are weak. It is winning because you are pushing.',
      },
      {
        h: 'There is a third way, between pushing it out and giving in.',
        p: 'Let it be there. Name it. Watch it rise, peak and fall like a wave. An urge left alone does not climb forever.',
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
        p: 'Some of them were on strict diets, and some were not. Before the tasting, some were given a milkshake to drink, and some were given nothing.',
      },
      {
        h: 'Then everyone was left alone with tubs of ice cream, to taste as much as they liked.',
        p: 'The researchers were not measuring taste. They were weighing the tubs afterward.',
      },
      {
        k: 'guess',
        h: 'The people on diets who had already drunk a milkshake. Did they eat less ice cream, or more?',
        o: [
          ['Less, since they were already full', 'That is what happened with the people not on a diet.'],
          ['About the same', 'Not even close.'],
          ['More', 'That is it. They ate more than the dieters who had nothing first.'],
        ],
        a: 2,
      },
      {
        h: 'The people not on a diet did what anyone would.',
        p: 'After a milkshake they were fuller, so they ate less ice cream. The dieters did the opposite.',
        fact: { s: 'Study · Herman & Mack, 1975', i: [0] },
      },
      {
        h: 'The milkshake was not the problem. The thought after it was.',
        p: '“I already broke the diet today, so it does not matter now.” Once the day was scored as ruined, there was nothing left to protect.',
      },
      {
        long: 1,
        h: 'Researchers have a name for it.',
        p: 'Alan Marlatt, who built relapse prevention, called it the abstinence violation effect. He found it in every habit he studied: the slip is small, and the thought “I blew it” makes it big.',
        fact: { s: 'Model · Marlatt’s relapse prevention', i: [1] },
      },
      {
        long: 1,
        h: 'He also found who gets back up fastest.',
        p: 'People who saw a slip as one mistake, in one moment, with a cause they could change, got back on track sooner. People who blamed something fixed in themselves kept going.',
      },
      {
        h: 'That is how one slip becomes a lost week.',
        p: 'Not because the slip did the damage, but because the rule said the day, or the week, was already gone.',
      },
      {
        h: 'So score it as one.',
        p: 'One slip is one milkshake. The rest of the day still counts, and so does the next urge. You can ride it like any other.',
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
      },
      {
        h: 'A researcher named Lee Robins was asked to follow them home.',
        p: 'She did something unusual. She followed every man in her sample, not only the ones who turned up at clinics for help.',
      },
      {
        k: 'guess',
        h: 'Back home, most people treated for heroin went back to it. Of these soldiers, how many went back in their first year?',
        o: [
          ['About nine in ten', 'That is what everyone feared. It is not what she found.'],
          ['About half', 'Far fewer than that.'],
          ['About one in twenty', 'That is it. Most of them stopped, and stayed stopped.'],
        ],
        a: 2,
      },
      {
        h: 'They were the same men, with the same bodies and the same memories.',
        p: 'What had changed was everything around them: the place, the people, the boredom, the fear, the drug in reach on every corner.',
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
      },
      {
        long: 1,
        h: 'Students who moved to a new university showed the same thing.',
        p: 'Their old habits, like exercise or watching TV, held when the new place looked like the old one. When the setting changed, the habit often broke.',
        fact: { s: 'Study · Wood, Tam & Guerrero Witt, 2005', i: [1] },
      },
      {
        h: 'So you do not have to rebuild yourself first.',
        p: 'Change the room, the device or the route, and much of the pull stays behind, the way the soldiers left theirs behind.',
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
      },
      {
        h: 'It was never a name for what someone was.',
        p: 'It was a state someone was in, for a time. And it had an end. When the debt was paid, the person walked out free.',
      },
      {
        long: 1,
        h: 'So “I am an addict” sounds like it is about who you are.',
        p: 'The old word says something else: someone bound, for now, to something that collects from them. That is a hard place to be, and it is a place, not a person.',
      },
      {
        h: 'Now a second word. Decide comes from the Latin for “to cut off.”',
        p: 'The same root is in scissors and incision. A decision is not a feeling. It is a cut.',
      },
      {
        h: 'The habit is a rope that binds you for a time.',
        p: 'A decision is a cut in that rope. One cut does not free you. But every cut is real, and the rope does not grow back by itself.',
      },
      {
        long: 1,
        h: 'And a third word. Habit first meant something you wear.',
        p: 'It came from the Latin for condition, and it also meant dress, like a monk’s habit. Something put on, again and again, until it feels like skin. Something worn can be taken off.',
      },
      {
        h: 'So the name matters less than the debt.',
        p: 'You do not have to decide what to call this before you get help. Ask what it has been collecting from you, and whether you want to keep paying.',
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
      },
      {
        h: 'Nobody is dragged there.',
        p: 'The coachman has a sweet voice and asks nothing. Every boy climbs into the coach because he wants to.',
      },
      {
        long: 1,
        h: 'For five months, it is everything they hoped for.',
        p: 'They play from morning to night. Nobody asks them to do anything, and nobody asks them to become anything.',
      },
      {
        h: 'Then one morning, Pinocchio wakes up with long ears.',
        p: 'Look at what he does first. He does not run for help. He pulls a cap down over his ears and goes to find his friend.',
      },
      {
        h: 'His friend is wearing a cap too.',
        p: 'Each pretends nothing is wrong, until they take the caps off together. They laugh at each other’s ears, and the laughing turns to braying.',
      },
      {
        long: 1,
        h: 'The change did not happen in one night.',
        p: 'It was five months of days that each cost nothing. And the first thing both boys did when they noticed was to hide it.',
      },
      {
        h: 'The trip was free. The cost was the boys themselves.',
        p: 'A pleasure that asks nothing of you slowly makes you less of a person, and more of something that carries other people’s loads.',
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
      },
      {
        h: 'Even then, he does not become real that night.',
        p: 'He becomes real months later, after working every day to care for his sick father, turning a heavy wheel for a glass of milk.',
      },
      {
        h: 'Becoming real is not one brave night.',
        p: 'It is a run of ordinary days spent carrying something that matters. The ears grow slowly, and so does a real person.',
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
