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
        dx: 'Jonathan Freedman and Scott Fraser were at Stanford, and they wanted to know why people say yes to things they would normally refuse. So they made up a group, Citizens for Safe Driving, and sent volunteers to knock on doors in a quiet California suburb. The ask was deliberately too much: a huge billboard on the front lawn, so badly lettered that it would block the view of the house. The volunteers even showed a photo of a house half hidden behind it. **It was meant to be the kind of request almost anyone turns down.**',
        art: ['scene', { k: 'lawn-sign' }],
      },
      {
        k: 'ask',
        h: 'Say it is your house. Would you let them put it up?',
        o: [
          ['Yes, it is for safe roads', 'Then you would be one of the few. Look at what most people said.'],
          ['No, that is too much to ask', 'Most people said the same. Look at what changed their answer.'],
          ['I would want to think about it', 'Fair. Look at what most people said.'],
        ],
      },
      {
        h: 'Most people said no.',
        p: 'About 17 in every 100 homeowners agreed. It was an ugly sign, on their own lawn.',
        dx: 'Fewer than one in five said yes. The rest were polite, and firm. It was their lawn, their house, their street, and the sign was ugly. Nobody thought less of them for saying no. **This was the baseline**: what ordinary people do when a stranger asks for something big, out of nowhere.',
        art: ['people', { n: 17, s: 'said yes' }],
        fact: { s: 'Study · Freedman & Fraser, 1966', i: [0] },
      },
      {
        h: 'Two weeks earlier, they had asked other homeowners for something tiny.',
        p: 'A card three inches wide, for a window, that said Be a safe driver. Almost everyone said yes. It cost nothing.',
        dx: 'Other homeowners had been visited two weeks earlier by a different volunteer with a tiny request: put a small card in a window, three inches square, that said Be a safe driver. It was so small it would hardly be noticed from the street. Almost everyone agreed, because there was no reason not to. **Nobody felt they had decided anything about themselves.** They had only said yes to a card.',
        art: ['scene', { k: 'window-sign' }],
      },
      {
        h: 'Then those people were asked about the big lawn sign.',
        p: 'About 76 in every 100 said yes. One tiny yes, weeks before, made the big yes **more than four times as likely**.',
        dx: 'Two weeks later, a new volunteer came to these same homes with the same giant, ugly sign, and asked the same question. This time about three out of four said yes. Same lawn, same sign, same kind of homeowner. The only difference was a small card in a window, put up two weeks before and long forgotten. **One tiny yes made the big yes more than four times as likely.**',
        art: ['people', { n: 76, was: 17, s: 'said yes' }],
      },
      {
        h: 'The small yes changed who they thought they were.',
        p: 'The lawn and the ugly sign were the same. What changed was the person in the doorway, who now saw someone who does things for safe roads.',
        dx: 'Freedman and Fraser came to believe the card had changed something inside the homeowner. Before it, they were someone who had never done anything for safe driving. After it, they were someone who had. When the big sign came, they were not weighing a stranger’s favor. They were answering a quieter question: what does a person like me do? **The small yes had changed who they thought they were**, and the big yes followed from that.',
        art: ['scene', { k: 'doorway' }],
      },
      {
        long: 1,
        h: 'Then came the strangest group.',
        p: 'Some homeowners had first signed a petition about something else: keeping California beautiful. Even they were far more willing to take the lawn sign later, close to half of them.',
        dx: 'This group surprised the researchers most. Their first request had nothing to do with driving. They had been asked to sign a petition to keep California beautiful, an easy yes for almost anyone. Weeks later, close to half of them took the driving sign, far more than the people never asked anything. The small step had not taught them about safe roads. **It had taught them that they were the kind of person who helps** when asked, and that carried into something new.',
        art: ['scene', { k: 'petition' }],
      },
      {
        long: 1,
        h: 'You learn who you are partly by watching what you do.',
        p: 'A psychologist named Daryl Bem put it this way: people read their own actions the way an outsider would, and decide who they are from what they see.',
        dx: 'We usually assume we know ourselves from the inside, and then act on it. Daryl Bem argued that much of the time it runs the other way. When we are not sure how we feel, we watch what we do, the way a friend would watch us, and draw the obvious conclusion. I keep going for walks, so I must be someone who likes walking. **You learn who you are partly by watching your own steps**, which means every step you take is also a message to yourself.',
        art: ['scene', { k: 'mirror' }],
        fact: { s: 'Theory · Bem, self-perception, 1972', i: [1] },
      },
      {
        h: 'So waiting to feel ready gets it backward.',
        p: 'Most people wait to feel like someone who can quit, and then plan to start. The feeling comes after the first small steps, not before them.',
        dx: 'Most people trying to quit wait for a feeling first: ready, sure, strong enough. They plan to start once they feel like someone who can do it. But that feeling is built from evidence, and the only evidence that counts is what you have done. Waiting for it means waiting for something that cannot arrive on its own. **The feeling comes after the first small steps, not before them.** Take one step small enough to be easy, and let it tell you who you are becoming.',
        art: ['ready', {}],
      },
      {
        long: 1,
        h: 'Mixed feelings are not a sign you are not serious.',
        p: 'A guide written for addiction counselors calls them a normal part of any change. You do not have to finish being unsure. You need one small yes.',
        dx: 'Counselors who work with addiction every day expect people to arrive with two minds about it: wanting to stop and wanting to keep going, sometimes in the same hour. Their guide calls this a normal part of change, not a sign that someone is not serious. They do not wait for the doubt to clear before helping someone take a first step. **You do not have to finish being unsure.** You can be unsure and still put a small card in the window today.',
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
        dx: 'He was writing about a trip to Europe, not about the mind, and it was a passing line. Try to set yourself this task, he wrote: not to think of a polar bear, and you will see that the cursed thing will come to mind every minute. For more than a hundred years people quoted it as a curiosity. **Nobody tested it**, because it sounded too obvious to test, and too strange to explain.',
        art: ['scene', { k: 'bear-book' }],
      },
      {
        h: 'More than a hundred years later, a psychologist named Daniel Wegner tested it.',
        p: 'He sat people alone in a room for five minutes, saying aloud whatever came to mind. One rule: do not think of a white bear. If one comes, ring the bell.',
        dx: 'Wegner was a psychologist in Texas who could not let the line go. He brought students into a small room, one at a time, with a microphone and a bell on the table. For five minutes they were to say out loud everything that went through their mind, the way you would narrate a daydream. Then came one rule: do not think of a white bear. **If one shows up, ring the bell.** Nobody had told them anything about bears before. Nothing in the room was white or furry. The only bear in that room was the one the rule put there.',
        art: ['scene', { k: 'bell-room' }],
      },
      {
        h: 'Try it yourself.',
        art: ['try', { k: 'bell' }],
      },
      {
        h: 'The people in the room rang the bell about once a minute.',
        p: 'Then came the part nobody expected. Told afterward that they could think of the bear, the ones who had pushed it away thought of it more than people who had been free to all along.',
        dx: 'Trying their hardest, they still could not keep it out. That part Dostoevsky could have guessed. The surprise came in the second five minutes. Now the students were told the opposite: go ahead, think of a white bear. A second group had been free to think of it from the start. **The ones who had pushed it away thought of it more.** Wegner called it a rebound. Pushing a thought down did not empty it. It wound it up like a spring.',
        art: ['scene', { k: 'rebound' }],
        fact: { s: 'Study · Wegner and colleagues, 1987', i: [0] },
      },
      {
        long: 1,
        h: 'Wegner spent years working out why.',
        p: 'To keep a thought out, part of your mind has to keep checking whether it is gone. Every check carries the thought back in. The harder you push, the harder that part works.',
        dx: 'He came to think the mind runs two jobs at once when you try not to think of something. One job looks for anything else to think about: a song, the wall, your plans. The other job quietly checks whether the bear is gone, and to check, it has to hold the bear in mind. Most of the time the first job wins and you forget for a while. But Wegner found that **when people were tired, stressed or busy**, the searching job slowed down and the checking job kept going. Under strain, trying not to think of something made people think of it more than if they had never tried. That is why an urge pushed away on a worn-out day can feel louder than ever.',
        art: ['scene', { k: 'checker' }],
        fact: { s: 'Theory · Wegner, ironic processes, 1994', i: [1] },
      },
      {
        h: 'An urge works the same way.',
        p: 'When you fight hard to keep a thought out, the fight keeps it close. The urge is not winning because you are weak. **Part of what keeps it loud is the push.**',
        dx: 'Think of how this goes with an urge. The thought arrives. You tell yourself no, do not think about it, stop. Every no is a check, and every check brings it back for one more look. Minutes later you are worn out from a fight you did not seem to be winning, and the fight itself feels like proof that the urge is strong. It is not proof of that. **The urge is not winning because you are weak.** Part of what keeps it loud is the push, carrying it back in, the same way it carried the bear back to the students in that room.',
        art: ['scene', { k: 'push-door' }],
      },
      {
        h: 'There is a third way, between pushing it out and giving in.',
        p: 'Let it be there. Name it. Watch it rise, peak and fall like a wave. An urge left alone does not climb forever.',
        dx: 'Between fighting the thought and obeying it there is a third way, and it is learnable. Let the urge be there without arguing with it. Name it plainly: this is an urge. Then watch it the way you would watch a wave come in from the shore. It rises, it peaks, and it falls, usually in minutes, because the body cannot hold a craving at full strength for long. **An urge left alone does not climb forever.** You are not trying to make it go away. You are letting it finish, while you stay where you are.',
        art: ['wave', {}],
      },
      {
        long: 1,
        n: '123',
        h: 'college smokers were taught to watch their urges this way.',
        p: 'Their urges were as strong as everyone else’s. Over the next week, they smoked fewer cigarettes. The urge did not change. What they did with it did.',
        dx: 'Researchers in Seattle asked the smokers to bring their cigarettes, and had them hold a pack, open it, smell the tobacco and handle a lighter, without lighting up. Some were first taught to surf the urge: to notice it in the body, breathe, and watch it rise and fall. The others got no instruction. In the room, both groups felt the same strong urge. The difference came after. Over the next seven days, **the ones who had learned to watch smoked fewer cigarettes.** Watching did not make the urge weaker. It changed what the urge could make them do.',
        fact: { s: 'Study · 123 college smokers · Bowen & Marlatt, 2009', i: [2] },
      },
      {
        long: 1,
        h: 'Each urge you watch to the end teaches you something.',
        p: 'Not that the urge is weak, but that it ends. The next one has less to promise you, because you have seen how this goes.',
        dx: 'The first time you watch an urge all the way to its end, it is hard, because some part of you does not believe it will end. The second time, you have one memory of it ending. The tenth time, you know. That knowledge changes the next urge before it even starts: **it has less to promise you**, because you have watched how the story goes. This is how a brain that learned one habit by repetition learns another the same way, one watched wave at a time.',
        art: ['scene', { k: 'waves' }],
      },
    ],
    mine: { h: 'Every urge you watched to the end came down.', k: 'rode' },
    today: {
      h: 'Watch the next urge instead of fighting it.',
      l: ['Name it: “This is an urge, and it passes.”', 'Let it be there, and breathe out slowly', 'Watch it for ten minutes, and see what it does'],
    },
    you: {
      h: 'When an urge comes, what do you usually do first?',
      o: [
        ['Push it out of my head', 'Now you know why it comes back. Try letting it be there next time, and watch.'],
        ['Argue with it', 'An argument keeps it close too. Naming it is enough.'],
        ['Look for something to distract me', 'That can help. Notice whether you are running from it or letting it pass.'],
        ['Give in before it gets bad', 'Then the next one is your chance to see one fall on its own.'],
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
        dx: 'Peter Herman and Deborah Mack ran the study at Northwestern University with students who believed they were rating flavors. Each sat alone with three big tubs of ice cream and a set of rating forms, and was told to taste as much as they needed to judge them. Before that, a short survey had sorted them quietly into two groups: people who were strictly watching what they ate, and people who were not. **The forms were a cover.** What the researchers wanted was the weight of the tubs when each student left.',
        art: ['scene', { k: 'tasting' }],
      },
      {
        h: 'Before the tasting, some of them drank a milkshake.',
        p: 'The others had nothing. You would expect a full stomach to mean less ice cream.',
        dx: 'Before the tasting, some students were asked to drink a milkshake for a separate taste test, and some drank two. Others had nothing at all. Common sense says the milkshake should fill people up, so they would eat less ice cream afterward. **For one group it did. For the other, it did the opposite.**',
        art: ['scene', { k: 'milkshake' }],
      },
      {
        k: 'ask',
        h: 'Think of a day that started with one slip. What happened to the rest of it?',
        o: [
          ['It turned into more', 'Many people know that day. This study is about why.'],
          ['I stopped there and moved on', 'Then you already do what this lesson teaches. Look at why it works.'],
          ['I gave up on the day', 'Many people know that day. The next card shows where it comes from.'],
          ['That has not happened to me yet', 'Then this is worth knowing before it does.'],
        ],
      },
      {
        h: 'People not on a diet ate less after a milkshake. People on a diet ate more.',
        p: 'The dieters who had already broken the diet ate more ice cream than the dieters who had nothing first.',
        dx: 'The students who were not on a diet behaved as anyone would guess: after a milkshake, they ate less ice cream. The dieters turned it upside down. Those who had nothing first held back carefully. Those who had already had a milkshake ate far more ice cream than the dieters who had nothing first. **The full stomach did not stop them. It seemed to set them loose.** Herman called it counter-regulation, and other labs found it again and again.',
        art: ['scene', { k: 'ice-results' }],
        fact: { s: 'Study · Herman & Mack, 1975', i: [0] },
      },
      {
        h: 'The milkshake was not the problem. The thought after it was.',
        p: '“I already broke the diet today, so it does not matter now.” Once the day was scored as ruined, there was nothing left to protect.',
        dx: 'Herman’s explanation was one thought: the milkshake had already broken the diet for the day. Once it was broken, careful eating seemed pointless, so they stopped trying. The day had become a pass or a fail, and it had already failed. **The milkshake was a small thing. The rule that scored the day as ruined turned it into a big one.**',
        art: ['scene', { k: 'ruined-day' }],
      },
      {
        long: 1,
        h: 'Researchers have a name for it.',
        p: 'Alan Marlatt, who built relapse prevention, called it the abstinence violation effect. He found it in drinking, smoking and eating alike.',
        dx: 'Alan Marlatt spent his career on why people who quit drinking, smoking or overeating so often go back. He noticed the same pattern again and again. The first slip was rarely the disaster. The disaster was the story people told about it: I have no willpower, I have failed, it is over. That story brought shame and the feeling that trying was pointless, and the second slip followed easily. **He called it the abstinence violation effect**, and found it in drinking, smoking and eating alike.',
        art: ['chain', { n: ['One slip', '“I blew it”', 'Many more'], i: ['dots', 'bolt', 'x'] }],
        fact: { s: 'Model · Marlatt’s relapse prevention', i: [1] },
      },
      {
        long: 1,
        h: 'He also found who gets back up fastest.',
        p: 'People who saw a slip as one mistake, in one moment, with a cause they could change, got back on track sooner. People who blamed something fixed in themselves kept going.',
        dx: 'Marlatt found that how a person explained a slip predicted what came next. Some said: I was tired, I was alone, I did not have a plan for that moment. One event, one time, with a cause they could do something about. They tended to get back on track quickly. Others said: this is who I am, I am weak, I always fail. **A cause that is fixed in you leaves nothing to fix**, and those people tended to keep going.',
        art: ['scene', { k: 'get-up' }],
      },
      {
        h: 'So score it as one.',
        p: 'One slip is one milkshake, and the rest of the day still counts. Twelve days with one slip read eleven of twelve, not zero. The next urge is a wave like any other.',
        dx: 'The way out is not to pretend the slip did not happen. It is to score it honestly: one event, at one time, with a cause. The rest of the day is still yours, and so is everything you did before it. Twelve days with one slip read eleven of twelve, not zero. **One slip is one milkshake.** The next urge is a wave like any other, and you already know how to watch a wave.',
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
        dx: 'In the spring of 1971, two members of Congress came back from Vietnam with a frightening report. Heroin there was cheap, strong and sold almost openly, and about one soldier in five said he had become addicted. At home, heroin addiction was known as close to a life sentence: most people treated for it went back to it. **The country braced for a wave of addicted men coming home.**',
        art: ['scene', { k: 'far-away' }],
      },
      {
        h: 'A researcher named Lee Robins was asked to follow them home.',
        p: 'She did something unusual. She followed every man in her sample, not only the ones who turned up at clinics for help.',
        dx: 'The government asked Lee Robins, a researcher in St. Louis, to find out what happened to the soldiers once they were home. Studies of addiction usually followed people who came to clinics, the ones in the most trouble. Robins did something rarer. She drew a random sample of men leaving Vietnam and tracked them down, every one she could, whether they had sought help or not. **That choice is why her answer could be trusted.**',
        art: ['scene', { k: 'files' }],
      },
      {
        k: 'ask',
        h: 'Think of a time you were somewhere new: a trip, a new job, a move. What happened to the pull?',
        o: [
          ['It was weaker', 'Many people notice that. Look at what Robins found.'],
          ['It came with me', 'That happens too. Look at what made the difference for the soldiers.'],
          ['I have not noticed', 'Watch for it next time. Look at what Robins found.'],
        ],
      },
      {
        h: 'Only about 5 in 100 became addicted again.',
        p: 'That was in their first year home. Most people treated for heroin at home went back to it. These men mostly stopped.',
        dx: 'Robins found that among the men who had been addicted in Vietnam, only about one in twenty became addicted again in the first year home. Even after three years, most were still free. Treatment at home rarely came close. Many of the men had not been treated at all. **They came home, and most of them stopped.** Robins spent years making sure it was not a mistake.',
        art: ['people', { n: 5, s: 'addicted again' }],
      },
      {
        h: 'They were the same men, with the same bodies and the same memories.',
        p: 'What had changed was everything around them: the place, the people, the boredom, the fear, the drug in reach on every corner.',
        dx: 'The men had not changed. Their bodies had been through the same thing, and they carried the same memories. What had changed was everything around them. In Vietnam there was heat, fear, boredom, distance from everyone they loved, and heroin within reach every day. At home there was family, work, old friends, and no one selling it on the corner. **The habit had been tied to a place, and the place was gone.**',
        art: ['scene', { k: 'same-man' }],
        fact: { s: 'Study · Robins, Vietnam veterans, reviewed by Hall & Weier, 2017', i: [0] },
      },
      {
        long: 1,
        h: 'People did not believe her at first.',
        p: 'It went against everything known about heroin. Some said the men must be lying. Robins checked, with interviews and tests, and the result held.',
        dx: 'Her findings went against everything experts believed about heroin. Some said the soldiers must be lying about their use. Robins checked the men’s answers against urine tests and records, interviewed them again later, and found the same thing. The result held up so well that it changed how scientists think about addiction. **Setting turned out to be a large part of the story**, not a detail.',
      },
      {
        h: 'A habit is not only inside you.',
        p: 'Much of it lives in the setting: the room, the hour, the device, the chair. The setting does part of the deciding before you do.',
        dx: 'A habit is not only a feeling inside you. It is stitched into the places and moments where it happens: a certain room, a certain chair, a certain device, the same stretch of the day. The setting gives the first nudge before you have thought at all. **Change the setting, and the habit loses its first move.**',
        art: ['rooms', {}],
      },
      {
        long: 1,
        h: 'Students who moved to a new university showed the same thing.',
        p: 'Their old habits, like exercise or watching TV, held when the new place looked like the old one. When the setting changed, the habit often broke.',
        dx: 'Wendy Wood and her colleagues followed students who moved to a new university. Their everyday habits, like exercising, reading the news or watching TV, mostly carried on when the new place looked like the old one. But when the setting changed in the ways that mattered, the old habits often broke, and what students meant to do started to guide them instead. **A new setting gave their intentions room to work.**',
        art: ['scene', { k: 'campus' }],
        fact: { s: 'Study · Wood, Tam & Guerrero Witt, 2005', i: [1] },
      },
      {
        h: 'So you do not have to rebuild yourself first.',
        p: 'Change the room, the device or the route, and much of the pull stays behind, the way the soldiers left theirs behind.',
        dx: 'You do not have to wait until you feel different inside. Move the phone out of the room where it happens. Use a different route home. Change the chair, the hour, the device, who is around. Each change takes away one of the habit’s cues. **The soldiers did not win a thousand fights.** They left the room the fights happened in.',
        art: ['scene', { k: 'move-phone' }],
      },
      {
        long: 1,
        h: 'This is not cheating, and it is not weakness.',
        p: 'It is what the people we admire for their self-control do all the time. They do not win more fights in the same room. They change the room.',
        dx: 'People admired for their self-control are not usually fighting harder than everyone else. Studies keep finding the opposite: they meet fewer temptations, because they arrange their lives so the hard moments come less often. They keep the cookies out of the house. They leave the phone in the hall. **Changing the room is not cheating. It is the skill.**',
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
        dx: 'In early Roman law, a person who could not pay a debt could be brought before a judge. The judge would declare him handed over to the person he owed. The word for this was addicere, to speak someone over to another, and the person handed over was addictus. He went to work for his creditor, under his control, until the debt was worked off. **The first addicts were people bound by a sentence spoken over them.**',
        art: ['scene', { k: 'court' }],
      },
      {
        h: 'It was never a name for what someone was.',
        p: 'It was a state someone was in, for a time. And it had an end. When the debt was paid, the person walked out free.',
        dx: 'Addictus was never a description of a person’s nature. It was a condition: someone bound, because of a debt, for as long as the debt lasted. When it was paid, the bond ended, and the person walked out as free as anyone. **The word itself carries an ending.**',
        art: ['scene', { k: 'debt-paid' }],
      },
      {
        long: 1,
        h: 'So “I am an addict” sounds like it is about who you are.',
        p: 'The old word says something else: someone bound, for now, to something that collects from them. That is a hard place to be, and it is a place, not a person.',
        dx: 'Today people say I am an addict as if it were their name, a fact about what they are made of. The old word says something different: you are bound, for now, to something that keeps collecting from you. That is a hard place to be, and it should be taken seriously. **But it is a place, not a person**, and people leave it.',
      },
      {
        h: 'Now a second word. Decide comes from the Latin for “to cut off.”',
        p: 'The same root is in scissors and incision. A decision is not a feeling. It is a cut.',
        dx: 'Decide comes from the Latin decidere, to cut off. The same root shows up in incision, a cut, and in concise, cut short. To decide was to cut away every other path and keep one. A decision was never a mood or a feeling of being sure. **It was an act: a cut.**',
        art: ['scene', { k: 'scissors' }],
      },
      {
        h: 'The habit is a rope that binds you for a time.',
        p: 'A decision is a cut in that rope. One cut does not free you. But every cut is real, and the rope does not grow back by itself.',
        dx: 'Picture the habit as a rope that has been holding you for a while. A decision is a cut in that rope. One cut rarely frees anyone, and you may make many. But each cut is real, and the rope does not grow back on its own. **Every kept decision weakens the bond**, even on days that do not feel like progress.',
        art: ['scene', { k: 'rope-cuts' }],
      },
      {
        long: 1,
        h: 'And a third word. Habit first meant something you wear.',
        p: 'It came from the Latin for condition, and it also meant dress, like a monk’s habit. Something put on, again and again, until it feels like skin. Something worn can be taken off.',
        dx: 'Habit comes from the Latin habitus, a condition or a way of holding yourself, and it also meant clothing, which is why a monk’s robe is still called a habit. A habit is something put on, again and again, until it feels like part of your skin. **But anything that was put on can be taken off**, one wearing at a time.',
        art: ['scene', { k: 'robe' }],
      },
      {
        h: 'So the name matters less than the debt.',
        p: 'You do not have to decide what to call this before you get help. Ask what it has been collecting from you, and whether you want to keep paying.',
        dx: 'Many people get stuck on the label: am I an addict, or is this just a bad habit? They wait to settle that before they ask for help. The old word points to a better question. Not what to call it, but what it has been collecting: time, sleep, money, closeness, respect for yourself. **Ask what you are paying, and whether you want to keep paying it.**',
        art: ['scene', { k: 'ledger' }],
      },
      {
        long: 1,
        h: 'Help does not wait for a label.',
        p: 'A counselor, a group, a doctor or a faith leader can help whether you call it an addiction, a habit or a problem. What brings people in is the cost, not the name.',
        dx: 'Counselors, doctors, groups and faith leaders help people every day who would never call themselves addicts. What brings people through the door is the cost, not the name. You do not need a diagnosis to deserve help, or to start cutting the rope. **Help does not wait for a label.**',
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
        dx: 'Carlo Collodi wrote Pinocchio in 1883, and it is much darker and stranger than most people remember. In the book, Pinocchio’s friend Lampwick tells him about the Land of Toys: no school, no teachers, no books, and weeks made of six Thursdays and a Sunday, because Thursday was the day Italian children had off. **Every day would be a day off, forever.**',
        art: ['scene', { k: 'toy-land' }],
      },
      {
        h: 'Nobody is dragged there.',
        p: 'The coachman has a sweet voice and asks nothing. Every boy climbs into the coach **because he wants to**.',
        dx: 'Late at night a coach arrives, pulled by twelve pairs of donkeys wearing white boots, and driven by a little round man with a smile and a voice as soft as butter. He takes no money and asks for nothing. The coach is already packed with boys. **Nobody is forced in.** Pinocchio hesitates, then climbs up, because he wants to.',
        art: ['scene', { k: 'coach-ride' }],
      },
      {
        long: 1,
        h: 'For five months, it is everything they hoped for.',
        p: 'They play from morning to night. Nobody asks them to do anything, and nobody asks them to become anything.',
        dx: 'For five months, the Land of Toys is everything it promised. The boys play from morning until night, shouting, racing and laughing, and nobody asks them to do anything or become anything. Collodi writes that the days pass like lightning. **It is the happiest Pinocchio has ever been.**',
      },
      {
        h: 'Then one morning, Pinocchio wakes up with long ears.',
        p: 'Look at what he does first. He does not run for help. He pulls a cap down over his ears and goes to find his friend.',
        dx: 'He reaches up and feels them, long and hairy, the ears of a donkey. What he does next is the most human thing in the story. He does not run for help or tell anyone. He pulls a big cotton cap down over his head, almost to his nose, and goes out as if nothing were wrong. **The first thing he does with the change is hide it.**',
        art: ['scene', { k: 'cap-ears' }],
      },
      {
        h: 'His friend is wearing a cap too.',
        p: 'Each pretends nothing is wrong, until they take the caps off together. They laugh at each other’s ears, and the laughing turns to braying.',
        dx: 'He finds Lampwick, who is also wearing a cap pulled down low. They stand there, each pretending, until they agree to take the caps off together. They see each other’s ears and burst out laughing, and laugh until the laughing turns into braying, and they drop onto all fours. **Hiding it did not slow the change. It only meant nobody could help.**',
        art: ['scene', { k: 'two-caps' }],
      },
      {
        long: 1,
        h: 'The change did not happen in one night.',
        p: 'It was five months of days that each cost nothing. And the first thing both boys did when they noticed was to hide it.',
        dx: 'None of it happened in a single night. It came on through five months of days, each one easy and free, each one asking nothing. No single day turned them into donkeys. All of them together did. **The change was slow enough that it never felt like a choice**, and when they finally noticed, the first thing both boys did was hide it.',
        art: ['scene', { k: 'free-days' }],
      },
      {
        h: 'The trip was free. The cost was the boys themselves.',
        p: 'A pleasure that asks nothing of you can slowly take your days, until you are **carrying someone else’s load**.',
        dx: 'The trip cost the boys nothing, and the coachman had never wanted their money. He wanted them. Every boy he brought to the Land of Toys became a donkey he could sell. **A pleasure that asks nothing of you can still take you**, slowly, until you become something that carries other people’s loads.',
        art: ['scene', { k: 'donkey-load' }],
        fact: { s: 'Story · Collodi, The Adventures of Pinocchio, 1883', i: [0] },
      },
      {
        long: 1,
        h: 'The donkeys are sold to work.',
        p: 'Pinocchio is bought by a circus, lamed, and thrown into the sea so his skin can be sold. The pleasure that asked nothing ended with him being used up for someone else’s profit.',
        dx: 'Pinocchio the donkey is sold to a circus, whipped and trained to jump through hoops, until he falls and is lamed. Lame, he is sold again, to a man who wants his skin to make a drum, and is thrown into the sea to drown. **The pleasure that asked nothing ended with him used up for someone else’s profit.**',
      },
      {
        long: 1,
        h: 'In the sea, he becomes a puppet again, and a giant fish swallows him.',
        p: 'Inside it, he finds his father, who has been searching for him for two years. Pinocchio swims out with his father on his back.',
        dx: 'In the sea, the fish eat away the donkey, and Pinocchio is a puppet again. Then a giant fish swallows him whole. Deep inside it he sees a small light, and finds his father at a table with a candle. Geppetto had gone to sea searching for him and had been trapped there for two years. **Pinocchio carries his father out on his back**, and swims for the shore.',
        art: ['scene', { k: 'big-fish' }],
      },
      {
        h: 'Pinocchio does get free. But he does not become real that night.',
        p: 'He becomes real months later, after working every day to care for his sick father, turning a heavy wheel for a glass of milk.',
        dx: 'Even then, the story does not end with a miracle. Pinocchio becomes real months later. Every day, he turns a heavy water wheel for a farmer, a hundred buckets, to earn one glass of milk for his weak father. He learns to weave baskets and stays up to study. **He becomes real through ordinary work done for someone he loves.**',
        art: ['scene', { k: 'wheel' }],
      },
      {
        h: 'Becoming real is not one brave night.',
        p: 'It is a run of ordinary days spent carrying something that matters. The ears grow slowly, and so does a real person.',
        dx: 'That is the quiet point of the whole book. The ears grew one easy day at a time, and the boy who became real grew the same way, one hard, ordinary day at a time. Nobody becomes real in one brave night. **You become real by carrying something that matters**, day after day, until it is who you are.',
        art: ['scene', { k: 'real-boy' }],
      },
    ],
    today: {
      h: 'Take off the cap.',
      l: ['Pick one person you trust', 'Tell them one true thing about where you are', 'Show the ears: the boys never did'],
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
