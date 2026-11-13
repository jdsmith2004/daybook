/* The God lessons, g1 to g6, in the Latter-day Saint voice with the other two voices in vo (the format is in lesson-turns.ts). */
import type { Turn } from './lesson-turns';

type Src = [string, string];
const S = {
  gen3: ['Genesis 3:8-10 (King James Version)', 'https://www.churchofjesuschrist.org/study/scriptures/ot/gen/3?lang=eng'],
  integer: ['Online Etymology Dictionary: integrity, from the Latin integer, whole', 'https://www.etymonline.com/word/integrity'],
  bem: [
    'Bem (1972): self-perception theory, how people come to know their own attitudes by watching what they do (overview)',
    'https://en.wikipedia.org/wiki/Self-perception_theory',
  ],
  ether: ['Ether 12:27 (Book of Mormon)', 'https://www.churchofjesuschrist.org/study/scriptures/bofm/ether/12?lang=eng'],
  cor2: ['2 Corinthians 12:7-10 (King James Version)', 'https://www.churchofjesuschrist.org/study/scriptures/nt/2-cor/12?lang=eng'],
  hofmann: [
    'Hofmann, Baumeister, Förster & Vohs (2012): everyday temptations, an experience sampling study of desire, conflict, and self-control, Journal of Personality and Social Psychology',
    'https://experts.umn.edu/en/publications/everyday-temptations-an-experience-sampling-study-of-desire-confl/',
  ],
  cor1: ['1 Corinthians 10:13 (King James Version)', 'https://www.churchofjesuschrist.org/study/scriptures/nt/1-cor/10?lang=eng'],
  gen39: ['Genesis 39:10-12 (King James Version)', 'https://www.churchofjesuschrist.org/study/scriptures/ot/gen/39?lang=eng'],
  gola: [
    'Gola, Wordecha, Sescousse and colleagues (2017): can pornography be addictive? An fMRI study of men seeking treatment for problematic pornography use, Neuropsychopharmacology',
    'https://pmc.ncbi.nlm.nih.gov/articles/PMC5561346',
  ],
  mosiah: ['Mosiah 5:2-8 (Book of Mormon)', 'https://www.churchofjesuschrist.org/study/scriptures/bofm/mosiah/5?lang=eng'],
  ezekiel: ['Ezekiel 36:26 (King James Version)', 'https://www.churchofjesuschrist.org/study/scriptures/ot/ezek/36?lang=eng'],
  help2: [
    'The Church of Jesus Christ of Latter-day Saints: Help for Me, Principle 2, “Be Humble, Be Honest, and Seek Truth”',
    'https://www.churchofjesuschrist.org/study/manual/help-for-me/what-should-i-focus-on/principle-2?lang=eng',
  ],
  ps139: ['Psalm 139:11-12, 23-24 (King James Version)', 'https://www.churchofjesuschrist.org/study/scriptures/ot/ps/139?lang=eng'],
  gollwitzer: [
    'Gollwitzer & Sheeran (2006): implementation intentions and goal achievement, a meta-analysis of effects and processes, Advances in Experimental Social Psychology',
    'https://doi.org/10.1016/S0065-2601(06)38002-1',
  ],
  james: ['James 5:16 (King James Version)', 'https://www.churchofjesuschrist.org/study/scriptures/nt/james/5?lang=eng'],
  handbook: [
    'The Church of Jesus Christ of Latter-day Saints: General Handbook, 32, “Repentance and Membership Councils”',
    'https://www.churchofjesuschrist.org/study/manual/general-handbook/32-repentance-and-membership-councils?lang=eng',
  ],
  grubbs: [
    'Grubbs, Perry, Wilt & Reid (2019): pornography problems due to moral incongruence, an integrative model with a systematic review and meta-analysis, Archives of Sexual Behavior',
    'https://pubmed.ncbi.nlm.nih.gov/30076491/',
  ],
} satisfies Record<string, Src>;

export const GOD_A: Record<string, Turn> = {
  g1: {
    id: 'g1',
    title: 'Where are you?',
    ic: 'compass',
    ask: 'Why tell God something He already knows?',
    key: 'Praying about this is not news to God. Saying where you are out loud is how you find yourself again.',
    np: 'Where I am tonight, in one honest sentence',
    hook: {
      h: 'You pray most nights. This is the one thing you leave out.',
      say: 'Do you think He would rather not hear it?',
      more: 'Many people of faith pray about everything except this. This lesson is about why the hardest prayer to say is the one that does the most for you.',
    },
    ask1: {
      h: 'When you leave this out of a prayer, what are you protecting?',
      o: [
        ['God, from hearing something ugly', 'Many people feel this. The next card asks who the hiding is for.'],
        ['Me, from saying it out loud', 'That is honest. Saying it is the hard part, and the part that helps.'],
        ['The person other people see', 'That picture costs a lot to keep up. Hold on to that.'],
        ['I do not know yet', 'Fair. Notice what you skip the next time you pray.'],
      ],
    },
    flip: {
      think: 'God would rather not hear about this from me.',
      see: 'He asked Adam “Where art thou?” and knew the answer. The question was for Adam, so he could find himself.',
      more: 'After Adam and Eve ate the fruit, they hid among the trees. God’s first words to them were a question. He knew exactly where they were, so the question was not for Him. It was for Adam, so Adam could say where he was, out loud. Praying about this works the same way. You are not telling Heavenly Father anything new. You are finding yourself.',
    },
    deep: [
      {
        h: 'They hid among the trees. God came to them with a question.',
        p: 'He did not start with a charge. He asked, and Adam’s answer was the first honest thing he said.',
        fact: { s: 'Scripture · Genesis 3:8-10', i: [0] },
        more: 'In Genesis, the man and woman hear God walking in the garden in the cool of the day, and they hide. God calls out, “Where art thou?” Adam answers that he heard God’s voice, was afraid, and hid himself. It is the first true thing he says after the fruit, and saying it brings him out from the trees.',
      },
      {
        h: 'The habit needs two of you: one people see, and one who hides.',
        p: 'Integrity comes from the Latin integer: whole, one. Each true sentence closes the gap a little.',
        fact: { s: 'Word · Latin integer, whole', i: [1] },
        more: 'The habit lives in the space between the person at church or at work and the person alone at night. Hiding keeps that space open. The word integrity comes from the Latin integer, which means whole, or one. Each time you tell the truth, to God or to a person, the two move closer, until you are one person again.',
      },
      {
        h: 'You do not have to feel ready to say it.',
        p: 'The sentence comes first. Feeling like an honest person follows what you do.',
        back: 'l1',
      },
    ],
    mine: { h: 'You have started answering already.', k: 'acted' },
    move: {
      h: 'Tonight, answer the question out loud in prayer.',
      l: ['Ask it: “Where am I?”', 'Answer in one plain sentence', 'Leave it as it is, with no cleaning up'],
    },
    check: {
      h: 'You kneel to pray, and this comes to mind. A voice says, “Skip it. He does not want to hear this.” What do you do?',
      o: [
        ['Pray about everything else instead', 'Then it waits outside the prayer again, and the gap stays open.'],
        ['Say where I am, in one plain sentence', 'Yes. It is not news to Him. You found yourself, out loud.'],
        ['Wait until I have a good week to report', 'Then prayer becomes a report card. He asked where you are, not how you did.'],
        ['List every time, in full detail', 'You do not need a list. One true sentence answers the question.'],
      ],
      a: 1,
    },
    close: 'Father, here is where I am. Help me take one step toward you.',
    scope:
      'Latter-day Saints read the garden story in Genesis as the story of every person who hides, and of a God who comes looking. The word integrity does come from the Latin for whole. Together they point one hopeful way: telling God where you are is how you become one person again.',
    src: [S.gen3, S.integer],
    vo: {
      christian: {
        scope:
          'Christians read the garden story in Genesis as the story of every person who hides, and of a God who comes looking. The word integrity does come from the Latin for whole. Together they point one hopeful way: telling God where you are is how you become one person again.',
      },
      plain: {
        flip: {
          think: 'God would rather not hear about this from me.',
          see: 'God does not need the news. Saying where you are out loud is for you. It is how you find yourself.',
          more: 'God already knows where you are, so the prayer is not a report. It is a question you answer for your own sake. Saying where you are, out loud, is how you stop hiding from yourself, and the first step back starts from there.',
        },
        deep: [
          {
            h: 'The habit needs two of you: one people see, and one who hides.',
            p: 'Integrity comes from the Latin integer: whole, one. Each true sentence closes the gap a little.',
            fact: { s: 'Word · Latin integer, whole', i: [0] },
            more: 'The habit lives in the space between the person at work and the person alone at night. Hiding keeps that space open. The word integrity comes from the Latin integer, which means whole, or one. Each time you tell the truth, to God or to a person, the two move closer, until you are one person again.',
          },
          {
            h: 'You do not have to feel ready to say it.',
            p: 'The sentence comes first. Feeling like an honest person follows what you do.',
            back: 'l1',
          },
        ],
        scope:
          'The word integrity does come from the Latin for whole, and the idea that people come to know themselves by what they do is a well-known one in psychology. Both point one hopeful way: telling God where you are is how you become one person again.',
        src: [S.integer, S.bem],
        close: 'God, here is where I am. Help me take one step toward you.',
      },
    },
  },

  g2: {
    id: 'g2',
    title: 'Weakness is the way in',
    ic: 'sunrise',
    ask: 'Does my weakness keep God away?',
    key: 'Your weakness is not proof you are failing God. It is where His strength comes in, so bring it to Him by name.',
    np: 'The weakness I will bring to God by name',
    hook: {
      h: 'You promised God it was the last time. It was not.',
      say: 'Are you waiting to be strong before He helps?',
      more: 'Many people of faith try to get strong first, so they can come to God with something to show. This lesson is about why that order runs backward.',
    },
    ask1: {
      h: 'When you feel weak against this, what do you think God sees?',
      o: [
        ['Someone who keeps letting Him down', 'That is how it looks from inside. The next card looks from His side.'],
        ['Someone not trying hard enough', 'Most people here have tried hard. Trying harder alone is what wears out.'],
        ['His child, having a hard time', 'Hold on to that. It is closer than the fear is.'],
        ['I do not know yet', 'Fair. The next card offers another way to see it.'],
      ],
    },
    flip: {
      think: 'This weakness proves I am not strong enough for God.',
      see: 'Paul begged to lose his weakness. God said, “my strength is made perfect in weakness.” It is the way in.',
      more: 'Paul had what he called a thorn in the flesh, and he asked the Lord three times to take it away. The answer was not to remove it. It was “My grace is sufficient for thee: for my strength is made perfect in weakness.” Paul stopped hiding the weakness and started bringing it: “for when I am weak, then am I strong.” Willpower says get strong first. Grace starts at the weak place.',
    },
    deep: [
      {
        h: 'Moroni learned that the Lord gives people weakness on purpose.',
        p: 'So they will come to Him humbly. Then He makes weak things become strong (Ether 12:27).',
        fact: { s: 'Scripture · Ether 12:27', i: [0] },
        more: 'In the Book of Mormon, Moroni worries that his writing is weak and that people will mock it. The Lord answers that He shows people their weakness, and gives them weakness, so they will be humble and come to Him. His grace is enough for all who do, and for them He makes weak things become strong. The weakness is not a wall between you and Him. It is the way in.',
      },
      {
        h: 'Strong people fight less. Leaning on God is how you fight less.',
        p: 'Willpower alone means every fight is yours. Leaning means you are not the only one in it.',
        back: 'l20',
      },
    ],
    move: {
      h: 'Bring the weakness to Him by name tonight.',
      l: ['Say it plainly: “This is my weakness.”', 'Ask for help with the next hour', 'Name one person or plan to lean on too'],
    },
    check: {
      h: 'Day 4. A strong urge comes with a thought: “If I were faithful, I would not still want this.” What do you tell yourself?',
      o: [
        ['Grit my teeth and find more willpower', 'Willpower alone runs low by night. Leaning holds longer.'],
        ['My faith is broken, so why try', 'Wanting it is a weakness, not a broken faith. It is where help comes in.'],
        ['This is my weakness. I bring it to Him', 'Yes. The weak place is the way in, not proof you are out.'],
        ['Wait to pray until the wanting is gone', 'Then you wait outside the door. His strength works in the weak place.'],
      ],
      a: 2,
    },
    close: 'Father, here is my weakness. Make it strong, in your way and your time.',
    scope:
      'Ether 12:27 and Paul’s second letter to the Corinthians teach the same promise from two books of scripture: weakness brought to the Lord is where His grace does its work. It was given to people who were still weak, and it holds for you.',
    src: [S.ether, S.cor2],
    vo: {
      christian: {
        deep: [
          {
            h: 'Paul stopped hiding the weak place and started bringing it.',
            p: '“For when I am weak, then am I strong.” The weakness became where the help came in.',
            fact: { s: 'Scripture · 2 Corinthians 12:7-10', i: [0] },
            more: 'Paul did not get the answer he asked for. The thorn stayed. What changed was what he did with it. He wrote that he would rather glory in his infirmities, “that the power of Christ may rest upon me.” The weakness he begged to lose became the place he met Christ’s strength.',
          },
          {
            h: 'Strong people fight less. Leaning on God is how you fight less.',
            p: 'Willpower alone means every fight is yours. Leaning means you are not the only one in it.',
            back: 'l20',
          },
        ],
        scope:
          'Paul’s second letter to the Corinthians teaches a sure promise: weakness brought to the Lord is where His grace does its work. It was given to a man who was still weak, and it holds for you.',
        src: [S.cor2],
      },
      plain: {
        flip: {
          think: 'This weakness proves I am not strong enough for God.',
          see: 'Many people find God right where their own strength runs out. The weak place is not a wall. It is a door.',
          more: 'Willpower says get strong first, then come to God with something to show. Many people of faith find it runs the other way: they meet God at the place where their own strength ran out. The weakness you would hide is the one to bring.',
        },
        deep: [
          {
            h: 'Leaning is not giving up. It is no longer fighting alone.',
            p: 'Willpower says get strong first. Leaning starts from the weak place, as it is.',
          },
          {
            h: 'Strong people fight less. Leaning on God is how you fight less.',
            p: 'Willpower alone means every fight is yours. Leaning means you are not the only one in it.',
            back: 'l20',
            fact: { s: 'Study · 205 adults · Hofmann and colleagues, 2012', i: [0] },
          },
        ],
        scope:
          'Many faiths teach that God meets people where their own strength runs out. The study behind the earlier lesson on self-control found that people with strong self-control mostly fight less, which is what leaning gives you.',
        src: [S.hofmann],
        close: 'God, here is my weakness. Help me lean on you tonight.',
      },
    },
  },

  g3: {
    id: 'g3',
    title: 'The way out comes early',
    ic: 'shield',
    ask: 'Where is the way out God promised?',
    key: 'The way to escape is real, and it usually comes early: a door you walk through before the urge peaks.',
    np: 'The early door I will walk through this week',
    hook: {
      h: 'It is 1 a.m. and the urge peaks. You pray for a way out.',
      say: 'Did God leave you without one?',
      more: 'Many people of faith have prayed for a way out in the hardest moment and felt nothing open. This lesson is about where that way usually is.',
    },
    ask1: {
      h: 'When you have prayed for a way out, where did you look for it?',
      o: [
        ['In the moment, when it was strongest', 'That is where most people look. The next card looks earlier.'],
        ['In the urge going away by itself', 'Sometimes it does. Often the way out is a thing you do, not a thing that stops.'],
        ['I did not expect one', 'That is honest, and heavy. The next card is a promise worth testing.'],
        ['I do not know yet', 'Fair. Notice where you look the next time.'],
      ],
    },
    flip: {
      think: 'God promised a way out, but at 1 a.m. I never find it.',
      see: 'The way to escape is rarely at the peak. It is a door you pass hours earlier, and you walk through it.',
      more: 'Paul wrote that God will, with the temptation, also make a way to escape. People tend to look for it at the worst moment, as a rescue. Most often it is earlier and plainer: the phone left in the kitchen, the early night, the walk out of the room. God makes the door. You walk through it.',
    },
    deep: [
      {
        h: 'Paul promised a way to escape, made with the temptation itself.',
        p: '“God is faithful.” The way out is made alongside the pull, and it is there to be taken.',
        art: ['gate', {}],
        fact: { s: 'Scripture · 1 Corinthians 10:13', i: [0] },
        more: 'Paul tells the Corinthians that no temptation has taken them but such as is common to man, and that God is faithful. He will not let them be tempted above what they are able, and with the temptation He will also make a way to escape. The promise is not that the pull never comes. It is that a way out is always there to be taken.',
      },
      {
        h: 'Joseph did not argue with temptation. He kept out of the room.',
        p: 'Day after day, he would not even be with her. When she caught him, he ran and left his coat.',
        fact: { s: 'Scripture · Genesis 39:10-12', i: [1] },
        more: 'In Genesis, Potiphar’s wife pressed Joseph day by day, and he would not lie with her, “or to be with her.” When she caught him by his garment, he left it in her hand and fled. His way out came twice: the early one, staying away day after day, and the last one, running. The early one did most of the work.',
      },
      {
        h: 'The cue is where the door is.',
        p: 'The pull starts at the signal, before anything is on the screen. That is the moment to walk out.',
        back: 'l34',
      },
    ],
    mine: { h: 'Your hardest hours show where to look for the door.', k: 'hour' },
    move: {
      h: 'Find the early door, and walk through it.',
      l: ['Look at the hour before your hardest one', 'Pick one door: a room, a light, a call', 'Pray to see it, then take it'],
    },
    check: {
      h: 'It is 10 p.m., an hour before your hardest time. Things feel fine. What is the way to escape tonight?',
      o: [
        ['Phone in the kitchen, and go to bed', 'Yes. That is the door, and it is easiest to walk through now.'],
        ['Stay up, and pray if the urge comes', 'Prayer helps. The door is easier to walk through before the pull than at its peak.'],
        ['Nothing. Nothing is wrong yet', 'Feeling fine is when the door is wide open. Later it is harder to see.'],
        ['Wait and see if the urge comes', 'Waiting moves you toward the peak, where the door is hardest to find.'],
      ],
      a: 0,
    },
    close: 'Father, show me the way out tonight, and help me walk through it early.',
    scope:
      'Paul’s promise and Joseph’s story both come from the Bible, and both point one hopeful way: God does make a way to escape, and it is most often found early, in plain choices, by people who look for it.',
    src: [S.cor1, S.gen39],
    vo: {
      plain: {
        flip: {
          think: 'God promised a way out, but at 1 a.m. I never find it.',
          see: 'The way out is rarely at the peak. It is a door you pass hours earlier, and you walk through it.',
          more: 'Many people look for a way out at the worst moment, as a rescue. Most often it is earlier and plainer: the phone left in the kitchen, the early night, the walk out of the room. God makes the door. You walk through it.',
        },
        deep: [
          {
            h: 'A way out is there. It is usually early, and plain.',
            p: 'Not a rescue at the peak. A room you leave, a phone you put down, before the pull is loud.',
            art: ['gate', {}],
          },
          {
            h: 'The cue is where the door is.',
            p: 'The pull starts at the signal, before anything is on the screen. That is the moment to walk out.',
            back: 'l34',
            fact: { s: 'Brain-scan study · 52 men · Gola and colleagues, 2017', i: [0] },
          },
        ],
        scope:
          'Many faiths teach that God does not leave a person without a way out. The brain-scan study behind the earlier lesson found the pull starts at the signal, before the picture, which is why the way out is most often found early.',
        src: [S.gola],
        close: 'God, show me the way out tonight, and help me walk through it early.',
      },
    },
  },

  g4: {
    id: 'g4',
    title: 'A new heart is given',
    ic: 'heart',
    ask: 'Do I have to change my own heart before I can decide?',
    key: 'You do not have to make yourself a new heart. Your part is to decide and keep turning. The new heart is given.',
    np: 'The decision I am making, in one sentence',
    hook: {
      h: 'You want to decide for good, but part of you still wants it.',
      say: 'Does that make the decision a lie?',
      more: 'Many people wait to decide until the wanting is gone, so the decision feels honest. This lesson is about which comes first.',
    },
    ask1: {
      h: 'What would a changed heart feel like to you?',
      o: [
        ['Never wanting it again', 'That is the hope most people carry. The next card shows how it comes.'],
        ['Wanting it less, a little at a time', 'That is how most people describe it, looking back.'],
        ['Not caring as much when it pulls', 'That is a change too, and often an early one.'],
        ['I do not know yet', 'Fair. Hold the question for the next card.'],
      ],
    },
    flip: {
      think: 'I cannot decide for good while I still want it.',
      see: 'God said, “A new heart also will I give you.” You do not have to make the new heart. Your part is to decide.',
      more: 'Many people wait for the wanting to stop before they decide, as if the heart must change first and the decision follow. Scripture runs it the other way. Through Ezekiel, the Lord promises a new heart and a new spirit as His gift, taking away the heart of stone. A person decides with the heart they have, and keeps turning. The new heart comes.',
    },
    deep: [
      {
        h: 'King Benjamin’s people felt a mighty change of heart.',
        p: 'They said the Spirit worked it in them, until they no longer wished to do evil (Mosiah 5:2).',
        fact: { s: 'Scripture · Mosiah 5:2-8', i: [0] },
        more: 'At the end of King Benjamin’s sermon in the Book of Mormon, his people said the Spirit of the Lord had worked a mighty change in their hearts, so that they had no more wish to do evil, but to do good. Then they made a covenant and took on the name of Christ. They did not force the change. They received it, and answered it with a decision.',
      },
      {
        h: 'The Church’s own guidance calls change a process, not a moment.',
        p: 'It says most people slip along the way. A heart changing over time is still a heart changing.',
        fact: { s: 'Guidance · Help for Me, Principle 2', i: [2] },
        more: 'The Church’s own guidance on pornography says that change happens over time, that setbacks are common, and that being honest about them is how a person keeps going. A mighty change can come quietly, one decided day at a time.',
      },
      {
        h: 'Decide before the heart feels changed.',
        p: 'Feeling ready followed the steps. A changed heart follows the decision the same way.',
        back: 'l1',
      },
    ],
    mine: { h: 'The change shows up slowly, in days that held.', k: 'clean30' },
    move: {
      h: 'Decide tonight, with the heart you have.',
      l: ['Say it: “I have decided. Help my heart.”', 'Write it in one sentence, in your words', 'Decide again tomorrow, if you need to'],
    },
    check: {
      h: 'Two weeks after you decided, an urge pulls hard. A voice says, “See? Your heart never changed.” What do you tell it?',
      o: [
        ['It is right. I should stop pretending', 'A heart changes over time. One strong pull does not undo a decision.'],
        ['I need to feel changed before I go on', 'Feelings follow. Waiting for them first keeps you waiting.'],
        ['Push the wanting down until it dies', 'Forcing the heart rarely works. Deciding and turning lets it change.'],
        ['I decided. The heart is still coming', 'Yes. You keep your part, and the new heart keeps coming.'],
      ],
      a: 3,
    },
    close: 'Father, I have decided. Change my heart, a little more each day.',
    scope:
      'Mosiah 5 and Ezekiel 36 teach that a new heart is the Lord’s gift, and the Church’s own guidance on pornography says change is a process in which most people slip. Together they hold out a sure hope: your decision is real today, and the heart follows.',
    src: [S.mosiah, S.ezekiel, S.help2],
    vo: {
      christian: {
        deep: [
          {
            h: 'Through Ezekiel, God promised a heart of flesh for one of stone.',
            p: '“A new heart also will I give you.” It is a gift, received over time, not a test to pass first.',
            fact: { s: 'Scripture · Ezekiel 36:26', i: [0] },
            more: 'Through the prophet Ezekiel, the Lord promised His people a new heart and a new spirit, taking away the heart of stone and giving a heart of flesh. The people did not make it themselves. They turned back, and He gave it.',
          },
          {
            h: 'Decide before the heart feels changed.',
            p: 'Feeling ready followed the steps. A changed heart follows the decision the same way.',
            back: 'l1',
          },
        ],
        scope:
          'Ezekiel 36 teaches that a new heart is the Lord’s gift, given to people who turn to Him. It holds out a sure hope: your decision is real today, and the heart follows.',
        src: [S.ezekiel],
      },
      plain: {
        flip: {
          think: 'I cannot decide for good while I still want it.',
          see: 'A changed heart is something God gives over time. You do not have to make it first. Your part is to decide.',
          more: 'Many people wait for the wanting to stop before they decide, as if the heart must change first and the decision follow. Many faiths teach it the other way: a person decides with the heart they have, keeps turning, and God changes the heart over time.',
        },
        deep: [
          {
            h: 'Decide with the heart you have.',
            p: 'A decision made while part of you still wants it is not a lie. It is where the change starts.',
          },
          {
            h: 'Decide before the heart feels changed.',
            p: 'Feeling ready followed the steps. A changed heart follows the decision the same way.',
            back: 'l1',
            fact: { s: 'Theory · Bem, self-perception, 1972', i: [0] },
          },
        ],
        scope:
          'Many faiths teach that God changes a heart over time. Self-perception theory, behind the first lesson, is a well-known idea that people come to know themselves by what they do. Both say the decision can come first.',
        src: [S.bem],
        close: 'God, I have decided. Change my heart, a little more each day.',
      },
    },
  },

  g5: {
    id: 'g5',
    title: 'Asking to be shown',
    ic: 'sun',
    ask: 'Will looking closely at my slips only show me how bad I am?',
    key: 'You can ask to be shown, not judged. A look you invite God into ends in a way forward, not a verdict.',
    np: 'One thing I will ask God to show me about my pattern',
    hook: {
      h: 'You open your log to look back, and close it again fast.',
      say: 'What are you afraid it will show?',
      more: 'Looking at a hard week can feel like reading charges against yourself. This lesson is about a different way to look.',
    },
    ask1: {
      h: 'When you look back at a hard night, whose voice do you hear?',
      o: [
        ['A judge, listing what I did wrong', 'That voice makes looking hard. The next card offers another one.'],
        ['My own, tired and let down', 'Many people hear that. It is hard to see clearly through it.'],
        ['A calm voice, curious what happened', 'That is the voice that finds things. Keep it.'],
        ['I do not look back at all', 'That is common, and honest. The next card is about why it feels safer.'],
      ],
    },
    flip: {
      think: 'If I look closely at my slips, I will only see how bad I am.',
      see: 'David asked God to search him, then said why: “lead me in the way everlasting.” The look was for leading.',
      more: 'At the end of Psalm 139, David prays, “Search me, O God, and know my heart: try me, and know my thoughts.” He is not asking for a sentence. He finishes the prayer: “And see if there be any wicked way in me, and lead me in the way everlasting.” The searching is for the leading. You can look at your pattern the same way, with God beside you, asking to be shown so you can be led.',
    },
    deep: [
      {
        h: 'To Him, “the night shineth as the day.”',
        p: 'Your hardest hours are not dark to God. He can show you what they hold.',
        art: ['research', { k: 'lens' }],
        fact: { s: 'Scripture · Psalm 139:11-12', i: [0] },
        more: 'Earlier in the same psalm, David says that if he hopes the darkness will cover him, even the night is light around him: “the darkness and the light are both alike to thee.” The late hours where your pattern hides are not hidden from God. That is why you can ask Him to show you what is there.',
      },
      {
        h: 'Asking to be shown is a different look from judging yourself.',
        p: 'A judge asks what is wrong with you. A guide asks what happened, and where to go next.',
        more: 'When you judge a hard night, you look for what it says about you. When you ask to be shown, you look for what happened: the hour, the feeling, the first small choice. The first kind of look ends in a verdict. The second ends in a next step.',
      },
      {
        h: 'What you are shown becomes your next if-then.',
        p: 'A pattern seen is a plan waiting: “If it is 11 and I am alone, then I...”',
        back: 'l9',
      },
    ],
    mine: { h: 'This is a place to start asking.', k: 'trigger' },
    move: {
      h: 'Look at one hard night, and ask to be shown.',
      l: ['Pray first: “Search me, and lead me.”', 'Read one hard night from your log', 'Write one thing you see, and one next step'],
    },
    check: {
      h: 'You read back over a hard week, and a voice says, “Look at you. Nothing has changed.” What do you do?',
      o: [
        ['Close the log and stop looking', 'Then the pattern stays hidden, and that voice stays in charge.'],
        ['Read it again to feel it fully', 'Feeling worse is not seeing more. Looking for the next step does more.'],
        ['Ask God to show me one thing', 'Yes. You asked to be led, not judged. One thing seen is a way forward.'],
        ['Promise to be perfect next week', 'A big promise skips the look. One thing seen helps more than a vow.'],
      ],
      a: 2,
    },
    close: 'Father, search me and show me. Then lead me one step on.',
    scope:
      'Psalm 139 is a prayer that invites God to look, and it ends asking to be led, not judged. Read that way, an honest look at your pattern is something you do with God, and it points forward.',
    src: [S.ps139],
    vo: {
      plain: {
        flip: {
          think: 'If I look closely at my slips, I will only see how bad I am.',
          see: 'An honest look can be a prayer: ask God to show you, not to judge you. The look is for finding the way on.',
          more: 'Looking back alone, many people hear a judge. Looking back with God, asking to be shown, the same night reads differently: not as a charge, but as a map of where to go next.',
        },
        deep: [
          {
            h: 'Asking to be shown is a different look from judging yourself.',
            p: 'A judge asks what is wrong with you. A guide asks what happened, and where to go next.',
            art: ['research', { k: 'lens' }],
            more: 'When you judge a hard night, you look for what it says about you. When you ask to be shown, you look for what happened: the hour, the feeling, the first small choice. The first kind of look ends in a verdict. The second ends in a next step.',
          },
          {
            h: 'What you are shown becomes your next if-then.',
            p: 'A pattern seen is a plan waiting: “If it is 11 and I am alone, then I...”',
            back: 'l9',
            fact: { s: 'Meta-analysis · 94 tests · Gollwitzer & Sheeran, 2006', i: [0] },
          },
        ],
        scope:
          'Many faiths teach that God sees a person with mercy. The if-then plans behind the earlier lesson had a medium to large effect across many studies, and an honest look at your pattern is what gives them their “if”.',
        src: [S.gollwitzer],
        close: 'God, show me what I need to see. Then lead me one step on.',
      },
    },
  },

  g6: {
    id: 'g6',
    title: 'Confession is for healing',
    ic: 'chat',
    ask: 'Is telling someone about this a way of being punished?',
    key: 'Confession was given for healing, not punishment: two people, honest and praying for each other.',
    np: 'The one person I could tell, and my first sentence',
    hook: {
      h: 'You think of telling your bishop, and your stomach drops.',
      say: 'Most people expect a verdict. That room is for something else.',
      more: 'Many people carry this alone for years because they picture telling as a trial. This lesson is about what confession is for.',
    },
    ask1: {
      h: 'When you picture telling someone, what do you expect from them?',
      o: [
        ['To be judged, or seen differently', 'Most people expect this. The next card is about what confession is for.'],
        ['To be punished in some way', 'That fear keeps many people quiet for years. Hold on to it a moment.'],
        ['Relief, if I am honest', 'Hold on to that. It is closer to what most people find.'],
        ['I do not know yet', 'Fair. The next card may change the picture.'],
      ],
    },
    flip: {
      think: 'Telling someone means standing before them to be judged.',
      see: '“Confess your faults one to another, and pray one for another, that ye may be healed.” Healing, not a verdict.',
      more: 'James puts confession and healing in one sentence. It is not one person on trial before another. It is two people, each honest, each praying for the other, so that they may be healed. The purpose of telling is the healing.',
    },
    deep: [
      {
        h: 'In James, confessing goes both ways, and so does the praying.',
        p: 'Not one person on trial before another. Two people, honest, praying for each other.',
        fact: { s: 'Scripture · James 5:16', i: [0] },
        more: 'James wrote to believers who were sick and struggling. His counsel was to tell the truth to one another and pray for one another, so they could be healed. Nobody in his picture is the judge. Everyone in it is being helped.',
      },
      {
        h: 'A bishop is there to help you heal, not to punish you.',
        p: 'The Church’s handbook says that for pornography, counsel from the bishop is usually enough.',
        fact: { s: 'Guidance · General Handbook, chapter 32', i: [1] },
        more: 'Talking with your bishop is encouraged, and when you go is your choice. The Church’s General Handbook says that for pornography, personal counsel from the bishop is usually enough. He is there to help you come to the Savior. The Church’s free recovery meetings are another place to tell the truth, open to anyone, in person and online.',
      },
    ],
    move: {
      h: 'Tell one person one true sentence this week.',
      l: ['Pick someone safe: a friend or your bishop', 'Say one sentence, not the whole story', 'Ask them to pray for you, and pray for them'],
    },
    check: {
      h: 'You told a friend, and they said, “Me too, in my own way.” What now?',
      o: [
        ['Change the subject. This is about me', 'Their honesty is part of the healing too. It goes both ways.'],
        ['Pray for them, as they pray for you', 'Yes. That is what James described: two people, both being healed.'],
        ['Feel worse, since now they carry it', 'Telling shared the weight. It did not hand it to them.'],
        ['Decide they cannot help with this', 'People who know the struggle are often the ones who help most.'],
      ],
      a: 1,
    },
    close: 'Father, give me the courage to tell one person, and heal us both.',
    scope:
      'James 5:16 joins confession to healing, and the Church’s General Handbook says that for pornography a bishop’s counsel is usually enough. Both point one hopeful way: telling the truth to someone safe is a step toward healing, not toward punishment.',
    src: [S.james, S.handbook],
    vo: {
      christian: {
        hook: {
          h: 'You think of telling someone at church, and your stomach drops.',
          say: 'What do you picture happening when you tell?',
          more: 'Many people carry this alone for years because they picture telling as a trial. This lesson is about what confession is for.',
        },
        deep: [
          {
            h: 'In James, confessing goes both ways, and so does the praying.',
            p: 'Not one person on trial before another. Two people, honest, praying for each other.',
            fact: { s: 'Scripture · James 5:16', i: [0] },
            more: 'James wrote to believers who were sick and struggling. His counsel was to tell the truth to one another and pray for one another, so they could be healed. Nobody in his picture is the judge. Everyone in it is being helped.',
          },
        ],
        move: {
          h: 'Tell one person one true sentence this week.',
          l: ['Pick someone safe: a friend or a pastor', 'Say one sentence, not the whole story', 'Ask them to pray for you, and pray for them'],
        },
        scope:
          'James 5:16 joins confession to healing. It points one hopeful way: telling the truth to someone safe is a step toward healing, not toward punishment.',
        src: [S.james],
      },
      plain: {
        hook: {
          h: 'You think of telling someone you trust, and your stomach drops.',
          say: 'What do you picture happening when you tell?',
          more: 'Many people carry this alone for years because they picture telling as a trial. This lesson is about what telling is for.',
        },
        flip: {
          think: 'Telling someone means standing before them to be judged.',
          see: 'Telling one trusted person is not a trial. It is two people being honest, and that is where healing starts.',
          more: 'Many faiths teach that confessing to another person is for healing, not for punishment. In the picture that helps most, nobody is the judge: two people tell the truth, and each holds the other up.',
        },
        deep: [
          {
            h: 'The confessing can go both ways, and so can the help.',
            p: 'Not one person on trial before another. Two people, honest, holding each other up.',
          },
          {
            h: 'The ache you named is the part of you that wants out.',
            p: 'Telling one person gives that part a voice outside your own head.',
            back: 'l22',
            fact: { s: 'Review · Grubbs, Perry, Wilt & Reid, 2019', i: [0] },
          },
        ],
        move: {
          h: 'Tell one person one true sentence this week.',
          l: ['Pick someone safe: a friend or faith leader', 'Say one sentence, not the whole story', 'Ask what they need, and listen back'],
        },
        check: {
          h: 'You told a friend, and they said, “Me too, in my own way.” What now?',
          o: [
            ['Change the subject. This is about me', 'Their honesty is part of the healing too. It goes both ways.'],
            ['Hold them up, as they hold you up', 'Yes. Two people, both honest, both being helped.'],
            ['Feel worse, since now they carry it', 'Telling shared the weight. It did not hand it to them.'],
            ['Decide they cannot help with this', 'People who know the struggle are often the ones who help most.'],
          ],
          a: 1,
        },
        scope:
          'Many faiths teach that telling the truth to another person is for healing. The review behind the earlier lesson on values found that the hurt people feel can come from caring about what they hold, and telling gives that caring a voice.',
        src: [S.grubbs],
        close: 'God, give me the courage to tell one person, and heal us both.',
      },
    },
  },
};
