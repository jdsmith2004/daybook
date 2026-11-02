/* The God lessons, g7 to g12, in the Latter-day Saint voice with the other two voices in vo (the format is in lesson-turns.ts). */
import type { Turn } from './lesson-turns';

type Src = [string, string];
const S = {
  moroni6: ['Moroni 6:6, 8 (Book of Mormon)', 'https://www.churchofjesuschrist.org/study/scriptures/bofm/moro/6?lang=eng'],
  dc58: ['Doctrine and Covenants 58:42', 'https://www.churchofjesuschrist.org/study/scriptures/dc-testament/dc/58?lang=eng'],
  help5: [
    'The Church of Jesus Christ of Latter-day Saints: Help for Me, what should I focus on, principle 5',
    'https://www.churchofjesuschrist.org/study/manual/help-for-me/what-should-i-focus-on/principle-5',
  ],
  lam3: ['Lamentations 3:22-23 (King James Version)', 'https://www.churchofjesuschrist.org/study/scriptures/ot/lam/3?lang=eng'],
  matt18: ['Matthew 18:21-22 (King James Version)', 'https://www.churchofjesuschrist.org/study/scriptures/nt/matt/18?lang=eng'],
  heb4: ['Hebrews 4:15 (King James Version)', 'https://www.churchofjesuschrist.org/study/scriptures/nt/heb/4?lang=eng'],
  heb2: ['Hebrews 2:18 (King James Version)', 'https://www.churchofjesuschrist.org/study/scriptures/nt/heb/2?lang=eng'],
  alma7: ['Alma 7:11-12 (Book of Mormon)', 'https://www.churchofjesuschrist.org/study/scriptures/bofm/alma/7?lang=eng'],
  shafran: [
    'Shafran, Thordarson & Rachman (1996): thought-action fusion in obsessive compulsive disorder, Journal of Anxiety Disorders',
    'https://doi.org/10.1016/0887-6185(96)00018-7',
  ],
  matt5: ['Matthew 5:6 (King James Version)', 'https://www.churchofjesuschrist.org/study/scriptures/nt/matt/5?lang=eng'],
  ne32: ['2 Nephi 32:3 (Book of Mormon)', 'https://www.churchofjesuschrist.org/study/scriptures/bofm/2-ne/32?lang=eng'],
  john6: ['John 6:35 (King James Version)', 'https://www.churchofjesuschrist.org/study/scriptures/nt/john/6?lang=eng'],
  elliot: [
    'Elliot, Sheldon & Church (1997): avoidance personal goals and subjective well-being, Personality and Social Psychology Bulletin',
    'https://doi.org/10.1177/0146167297239001',
  ],
  matt5b: ['Matthew 5:23-24 (King James Version)', 'https://www.churchofjesuschrist.org/study/scriptures/nt/matt/5?lang=eng'],
  mosiah27: ['Mosiah 27:35 (Book of Mormon)', 'https://www.churchofjesuschrist.org/study/scriptures/bofm/mosiah/27?lang=eng'],
  luke19: ['Luke 19:8-9 (King James Version)', 'https://www.churchofjesuschrist.org/study/scriptures/nt/luke/19?lang=eng'],
  fehr: [
    'Fehr, Gelfand & Nag (2010): the road to forgiveness, a meta-analytic synthesis of its situational and dispositional correlates, Psychological Bulletin',
    'https://doi.org/10.1037/a0019993',
  ],
  alma37: ['Alma 37:6-7 (Book of Mormon)', 'https://www.churchofjesuschrist.org/study/scriptures/bofm/alma/37?lang=eng'],
  dc10: ['Doctrine and Covenants 10:5', 'https://www.churchofjesuschrist.org/study/scriptures/dc-testament/dc/10?lang=eng'],
  dan6: ['Daniel 6:10 (King James Version)', 'https://www.churchofjesuschrist.org/study/scriptures/ot/dan/6?lang=eng'],
  zech4: ['Zechariah 4:10 (King James Version)', 'https://www.churchofjesuschrist.org/study/scriptures/ot/zech/4?lang=eng'],
  distefano: [
    'Di Stefano, Gino, Pisano & Staats (2016): making experience count, the role of reflection in individual learning, Harvard Business School working paper (summary by HBS Working Knowledge)',
    'https://www.library.hbs.edu/working-knowledge/reflecting-on-work-improves-job-performance',
  ],
  cor1: ['2 Corinthians 1:3-4 (King James Version)', 'https://www.churchofjesuschrist.org/study/scriptures/nt/2-cor/1?lang=eng'],
  mosiah18: ['Mosiah 18:8-9 (Book of Mormon)', 'https://www.churchofjesuschrist.org/study/scriptures/bofm/mosiah/18?lang=eng'],
  luke22: ['Luke 22:31-32 (King James Version)', 'https://www.churchofjesuschrist.org/study/scriptures/nt/luke/22?lang=eng'],
  hodges: [
    'Hodges, Kiel, Kramer, Veach & Villanueva (2010): giving birth to empathy, the effects of similar experience on empathic accuracy, empathic concern, and perceived empathy, Personality and Social Psychology Bulletin',
    'https://pubmed.ncbi.nlm.nih.gov/19875825/',
  ],
} satisfies Record<string, Src>;

/* the card that calls back to "I already blew it" (l3), the same in every voice */
const SNOWBALL = {
  h: '“I already ruined it” is the snowball thought, aimed at God.',
  p: 'It turns one slip into a night away from Him. Score it as one, and turn back now.',
  back: 'l3',
};
/* the study behind g8, the same in every voice */
const TAF = {
  h: 'Some people feel that wanting it is as bad as doing it.',
  p: 'Psychologists call it thought-action fusion. It is a belief, and it adds guilt for things never done.',
  more: 'Researchers studying anxiety named a belief they kept finding: that having an unwanted thought is morally the same as acting on it. They built a scale to measure it, and found the belief in ordinary people, not only in patients. It is a way of scoring thoughts, not a fact about them, and a way of scoring can change.',
};
const ELLIOT = {
  h: 'Students whose goals were only about stopping grew less happy.',
  p: 'Over a term, goals to stay away from things wore them down. A hunger needs something to move toward.',
  more: 'Researchers asked students to set personal goals for a semester, then followed them. Students with more goals framed as avoiding something felt worse as the term went on, and felt they made less progress. A goal that is only about stopping leaves the hunger with nowhere to go.',
};
const FEHR = {
  n: '175',
  h: 'studies found an apology was one of the strongest roads to forgiveness.',
  p: 'Across 26,006 people, a sincere sorry went with being forgiven more than most things did.',
  more: 'Researchers pooled 175 studies of how people come to forgive someone who hurt them. Among the strongest things that went with forgiveness was an apology. The studies show what goes together, not a promise, and some harms take time. A sincere sorry is still one of the best things you can bring.',
};
const REFLECT = {
  n: '15',
  h: 'minutes of looking back each day, and trainees scored 23% higher.',
  p: 'They did not train more. They spent the last minutes of each day writing what they had learned.',
  more: 'At a call center in India, new workers in training were split into two groups. One group spent the last 15 minutes of each day writing about what they had learned. On the final test, they scored about 23% higher than those who kept working instead. A short, honest look back each night made the day count.',
};
const HODGES = {
  h: 'People feel understood by someone they know has been there.',
  p: 'New mothers felt more understood when they knew the other woman had been through it too.',
  more: 'Researchers had women watch new mothers talk about their first weeks with a baby. Women who had just given birth themselves felt more concern for the new mothers. And the mothers’ sense of being understood went with knowing that the other woman had lived it too. Some comfort can only come from someone who has been there.',
};

export const GOD_B: Record<string, Turn> = {
  /* step 7, Get up faster: Humility */
  g7: {
    id: 'g7',
    title: 'Built for coming back',
    ic: 'sunrise',
    ask: 'Have I used up my chances with God?',
    key: 'Coming back again and again is not failing. The way back was built to be used, as often as you need it.',
    np: 'The first sentence I will say to God after a slip',
    hook: {
      h: 'You slipped again, the same week you prayed for help.',
      say: 'Does it feel like you have used up your chances?',
      more: 'Many people of faith feel that each slip spends something they cannot get back, and that they should stay away until they feel worthy again. This lesson looks at how the way back was built.',
    },
    ask1: {
      h: 'After a slip, which thought usually wins?',
      o: [
        ['I already ruined it', 'That thought turns one slip into a whole night away from Him.'],
        ['I need to feel worthy before I pray', 'It sounds humble, and it keeps you away right when you need Him most.'],
        ['Get up now, before the night gets worse', 'That is a strength. The next card shows why it fits how He works.'],
        ['I do not know yet', 'That is honest. Notice which one speaks first after the next hard day.'],
      ],
    },
    flip: {
      think: 'I should wait until I feel worthy before I come back to Him.',
      see: 'He put a fresh start in every week. Coming back again and again is the gospel working the way it was built.',
      more: 'The sacrament is not once in a lifetime. It comes every Sunday, at the center of worship. The Lord built a weekly fresh start into His Church because He expected His people to need one that often. You are not wearing out a door that was made to be walked through every week.',
    },
    deep: [
      {
        h: 'The sacrament comes every week, not once in a lifetime.',
        p: 'He set a fresh start at the center of worship, because He knew His people would need it that often.',
        art: ['path', {}],
        fact: { s: 'Scripture · Moroni 6:6, 8', i: [0] },
        more: 'Moroni wrote that the early Church met together often to take the bread and wine in remembrance of Jesus. In the same chapter he wrote that as often as they repented and sought forgiveness with real intent, they were forgiven. Often, and as often. Nothing in it counts down.',
      },
      {
        h: 'He does not keep a tally of the chances you have used.',
        p: 'The Lord said that when a person repents, He forgives, and He remembers the sin no more.',
        fact: { s: 'Scripture · Doctrine and Covenants 58:42 · Church guidance, Help for Me', i: [1, 2] },
        more: 'In the Doctrine and Covenants, the Lord says that the one who has repented is forgiven, and that He remembers those sins no more. The Church’s own guidance on pornography says it in a practical way: measure your progress by how steadily you turn to Christ, not by how many days in a row you have gone.',
      },
      SNOWBALL,
    ],
    mine: { h: 'Your own log keeps count of the comebacks.', k: 'back' },
    move: {
      h: 'Write your first words to Him now, before you need them.',
      l: ['Write one sentence to pray after a slip', 'Keep it where you will find it fast', 'Say it within the first hour, as you are'],
      more: 'The first hour after a slip is when “I already ruined it” is loudest. A sentence written on a calm day gets there first. It does not need to be polished. “Father, I slipped. I am turning back now” is enough.',
    },
    check: {
      h: 'Saturday night, you slipped. Tomorrow is Sunday. What do you do?',
      o: [
        ['Stay home. I should not be there like this', 'That keeps you from the very place He built for coming back.'],
        ['Wait a few weeks, until I feel worthy again', 'Waiting to feel worthy is the thought this lesson turned over.'],
        ['Go, and turn back to Him on the way', 'Yes. The weekly fresh start was made for a week like this one.'],
        ['Go, act fine, and tell no one ever', 'Going is good. A secret grows heavy. One person, maybe your bishop, can help.'],
      ],
      a: 2,
    },
    close: 'Father, I am turning back again. Thank you that the way was built for this.',
    scope:
      'Moroni 6 and Doctrine and Covenants 58:42 are scripture of The Church of Jesus Christ of Latter-day Saints, put here in plain words, and the weekly sacrament is at the center of its worship. The Church’s guidance on pornography measures progress by turning to Christ, not by days in a row. All of it points one sure way: there is no limit on coming back.',
    src: [S.moroni6, S.dc58, S.help5],
    vo: {
      christian: {
        flip: {
          think: 'I should wait until I feel worthy before I come back to Him.',
          see: 'His mercies are “new every morning.” He made the fresh start daily because He knew you would need it.',
          more: 'Mercy is not a store you are draining a little with each slip. Scripture says it is made new every morning, for people who need it every morning. Coming back again and again is not failing at faith. It is faith working the way He set it up.',
        },
        deep: [
          {
            h: 'His compassions “fail not. They are new every morning.”',
            p: 'Not once in a lifetime. Every morning, because He expected His people to need it that often.',
            art: ['path', {}],
            fact: { s: 'Scripture · Lamentations 3:22-23', i: [0] },
            more: 'The book of Lamentations was written after the worst loss its people had known. In the middle of it comes this: “his compassions fail not. They are new every morning: great is thy faithfulness.” A fresh start each morning is not a loophole. It is how He set things up.',
          },
          {
            h: 'Jesus told Peter to forgive “until seventy times seven.”',
            p: 'Peter offered seven times. Jesus answered with a number no one keeps count of.',
            fact: { s: 'Scripture · Matthew 18:21-22', i: [1] },
            more: 'Peter asked how often he should forgive someone who keeps wronging him, and offered seven times as generous. Jesus said, “Until seventy times seven.” He was not setting a higher limit. He was teaching a mercy that stops counting, and He does not ask more of us than He gives.',
          },
          SNOWBALL,
        ],
        check: {
          h: 'Saturday night, you slipped. Tomorrow is Sunday. What do you do?',
          o: [
            ['Stay home. I should not be there like this', 'That keeps you from the very place you are welcomed back.'],
            ['Wait a few weeks, until I feel worthy again', 'Waiting to feel worthy is the thought this lesson turned over.'],
            ['Go, and turn back to Him on the way', 'Yes. His mercy was new this morning, and it is new for Sunday too.'],
            ['Go, act fine, and tell no one ever', 'Going is good. A secret grows heavy. One person you trust can help.'],
          ],
          a: 2,
        },
        scope:
          'Lamentations and Matthew are quoted from the King James Bible. Both point one sure way: His mercy is made new each morning, and there is no limit on coming back.',
        src: [S.lam3, S.matt18],
      },
      plain: {
        flip: {
          think: 'I should wait until I feel worthy before I come back to Him.',
          see: 'Mercy is not a supply you use up. The way back opens every time you turn, as often as you need it.',
          more: 'Shame pictures God keeping a running count, with the door closing a little each time. Many faiths teach the opposite: mercy is there each time a person turns. Coming back again and again is not failing at faith. It is what turning back looks like.',
        },
        deep: [
          {
            h: 'Slips do not drain a store of chances.',
            p: 'Turning back is not a door that wears out. It opens each time you turn.',
            art: ['path', {}],
          },
          SNOWBALL,
        ],
        move: {
          h: 'Write your first words to Him now, before you need them.',
          l: ['Write one sentence to pray after a slip', 'Keep it where you will find it fast', 'Say it within the first hour, as you are'],
          more: 'The first hour after a slip is when “I already ruined it” is loudest. A sentence written on a calm day gets there first. It does not need to be polished. “God, I slipped. I am turning back now” is enough.',
        },
        check: {
          h: 'You slipped tonight. You feel too far from God to pray. What do you do?',
          o: [
            ['Wait a few weeks, until I feel worthy again', 'Waiting to feel worthy is the thought this lesson turned over.'],
            ['Turn back to Him now, in one sentence', 'Yes. The way back was open tonight, as it is every time.'],
            ['Stay away. I keep failing at the same thing', 'Coming back for the same thing is still coming back. There is no limit on it.'],
            ['Act fine, and tell no one ever', 'A secret grows heavy. One person you trust can help you carry it.'],
          ],
          a: 1,
        },
        close: 'God, I am turning back again. Thank you that the way is always open.',
        scope:
          'Many faiths teach that God’s mercy meets a person each time they turn back, and Daybook does not speak for any one of them. This lesson stands on that hope: there is no limit on coming back.',
        src: [],
      },
    },
  },

  /* step 8, Ride it better */
  g8: {
    id: 'g8',
    title: 'Tempted is not fallen',
    ic: 'shield',
    ask: 'Does feeling the pull mean I am far from God?',
    key: 'Being tempted is not falling. The pull is not a sign God stepped back. It is where He helps.',
    np: 'What I will tell God the next time the pull is strong',
    hook: {
      h: 'You are about to pray, and the pull hits hardest right then.',
      say: 'Does that mean you are far from God?',
      more: 'Many people feel dirty the moment an urge comes, as if wanting it were already a fall. This lesson is about where God stands in that moment.',
    },
    ask1: {
      h: 'When a strong pull comes, what do you feel about yourself?',
      o: [
        ['Dirty, like I already did it', 'That feeling counts the pull as a fall. The next card asks if it is one.'],
        ['Far from God, like He stepped back', 'That one hurts the most. Hold on to it for the next card.'],
        ['Weak, like others do not feel this', 'Almost everyone feels pulls they would not choose. You are not alone in it.'],
        ['I do not know yet', 'That is honest. Notice it the next time one comes.'],
      ],
    },
    flip: {
      think: 'When I feel the pull this strongly, God feels far away.',
      see: 'He was tempted in every way you are. In the pull you stand where He once stood, and He knows how to help.',
      more: 'The Savior did not watch temptation from a safe distance. He felt it, and did not give in. So the moment of the pull is not the moment He looks away. It is the one moment of your night He knows from the inside.',
    },
    deep: [
      {
        h: '“In all points tempted like as we are, yet without sin.”',
        p: 'Being tempted did not make Jesus less. Feeling the pull does not make you unclean.',
        art: ['wave', {}],
        fact: { s: 'Scripture · Hebrews 4:15 · Hebrews 2:18', i: [0, 1] },
        more: 'The letter to the Hebrews says we do not have a high priest who cannot feel our weakness. He was tempted in every way, yet without sin. Two chapters earlier it says that because He suffered being tempted, “he is able to succour them that are tempted.” Temptation and sin are two different things, and He has known the first.',
      },
      {
        h: 'Alma taught He took on our temptations, to know how to help.',
        p: 'He did not learn your struggle from far off. He knows it from the inside, and so He knows how to help.',
        fact: { s: 'Scripture · Alma 7:11-12', i: [2] },
        more: 'Alma taught that the Savior would suffer pains, afflictions and temptations of every kind, and take on the weaknesses of His people. He did it so that He would know, from His own experience, how to help them in their weakness. Your hardest hour is not foreign to Him.',
      },
      { ...TAF, fact: { s: 'Study · Shafran, Thordarson & Rachman, 1996', i: [3] } },
    ],
    mine: { h: 'Each urge you ride is a pull that did not become a fall.', k: 'rode' },
    move: {
      h: 'When the pull comes, call it temptation, not a fall.',
      l: ['Say: “Tempted is not fallen.”', 'Tell Him plainly: “You know this one.”', 'Ride it like a wave, then log it'],
    },
    check: {
      h: 'Late at night, a strong pull hits while you pray. A voice says, “Look at you. You are filthy.” What do you tell it?',
      o: [
        ['It is right. I should stop praying until it passes', 'That turns the pull into a wall between you and Him. It is not one.'],
        ['Being tempted is not falling. I keep praying', 'Yes. You stand where He once stood, and He knows how to help.'],
        ['If I feel this way, why not give in', 'That counts the pull as a fall before it is one. It is still only a pull.'],
        ['Argue with it until it goes quiet', 'You do not have to win that argument. Name it, and keep going.'],
      ],
      a: 1,
    },
    close: 'Father, your Son knows this pull. Help me through this hour with Him.',
    scope:
      'Hebrews is quoted from the King James Bible, and Alma 7 from the Book of Mormon is put in plain words. Together they say one sure thing: being tempted is not sin, and the Savior knows temptation from His own life. The study measured a belief about thoughts in ordinary people and in patients, not in people quitting porn, and it names the feeling this lesson turns over.',
    src: [S.heb4, S.heb2, S.alma7, S.shafran],
    vo: {
      christian: {
        deep: [
          {
            h: '“In all points tempted like as we are, yet without sin.”',
            p: 'Being tempted did not make Jesus less. Feeling the pull does not make you unclean.',
            art: ['wave', {}],
            fact: { s: 'Scripture · Hebrews 4:15', i: [0] },
            more: 'The letter to the Hebrews says we do not have a high priest who cannot feel our weakness. He was tempted in every way, yet without sin. Temptation and sin are two different things, and He has known the first.',
          },
          {
            h: 'He “is able to succour them that are tempted.”',
            p: 'Because He suffered being tempted, He knows how to help you in it, not only after it.',
            fact: { s: 'Scripture · Hebrews 2:18', i: [1] },
            more: 'The same letter says that because Jesus himself suffered being tempted, He is able to help those who are tempted. The help is not only for after a fall. It is for the pull itself, from someone who has felt it.',
          },
          { ...TAF, fact: { s: 'Study · Shafran, Thordarson & Rachman, 1996', i: [2] } },
        ],
        scope:
          'Hebrews is quoted from the King James Bible. It says one sure thing: being tempted is not sin, and Jesus knows temptation from His own life. The study measured a belief about thoughts in ordinary people and in patients, not in people quitting porn, and it names the feeling this lesson turns over.',
        src: [S.heb4, S.heb2, S.shafran],
      },
      plain: {
        flip: {
          think: 'When I feel the pull this strongly, God feels far away.',
          see: 'Feeling the pull is not falling. It is not where God steps back. It is the very place He is there to help.',
          more: 'Shame counts the pull as if it were the act, and then tells you God has gone. Being tempted and giving in are two different things. In the moment of the pull you have not fallen, and you are not alone in it.',
        },
        deep: [
          {
            h: 'Being tempted and giving in are two different things.',
            p: 'One is a feeling that comes to you. The other is a choice. The pull alone is not a fall.',
            art: ['wave', {}],
          },
          { ...TAF, fact: { s: 'Study · Shafran, Thordarson & Rachman, 1996', i: [0] } },
        ],
        check: {
          h: 'Late at night, a strong pull hits while you pray. A voice says, “Look at you. You are filthy.” What do you tell it?',
          o: [
            ['It is right. I should stop praying until it passes', 'That turns the pull into a wall between you and God. It is not one.'],
            ['Being tempted is not falling. I keep praying', 'Yes. A pull is not a fall, and you do not face it alone.'],
            ['If I feel this way, why not give in', 'That counts the pull as a fall before it is one. It is still only a pull.'],
            ['Argue with it until it goes quiet', 'You do not have to win that argument. Name it, and keep going.'],
          ],
          a: 1,
        },
        close: 'God, this pull is strong. Stay with me through this hour.',
        scope:
          'Many faiths teach that being tempted is not the same as doing wrong, and Daybook does not speak for any one of them. The study measured a belief about thoughts in ordinary people and in patients, not in people quitting porn, and it names the feeling this lesson turns over.',
        src: [S.shafran],
      },
    },
  },

  /* step 9, Fill the empty hour: Personal revelation */
  g9: {
    id: 'g9',
    title: 'Hungry for more',
    ic: 'book',
    ask: 'What do I do with the emptiness that pulls me toward it?',
    key: 'The hunger is not the problem. It is a hunger for more, so feed it with what is good, not with porn.',
    np: 'What I am hungry for, under the urge',
    hook: {
      h: 'The house is quiet, the day is done, and you feel empty.',
      say: 'Is that empty feeling the problem?',
      more: 'Many people try to stop wanting, as if the emptiness itself were the enemy. This lesson looks at that hunger from another side.',
    },
    ask1: {
      h: 'When that empty feeling comes at night, what do you think it wants?',
      o: [
        ['Something to numb it until I sleep', 'Numbing quiets it for an hour. It comes back hungry tomorrow.'],
        ['Someone to be close to', 'That is a true need. Porn imitates it and leaves it unmet.'],
        ['Something that matters, more than this', 'Hold on to that one. The next card is about it.'],
        ['I do not know yet', 'That is honest. Ask it the next time it comes.'],
      ],
    },
    flip: {
      think: 'If I were stronger, I would not feel this hungry.',
      see: 'Jesus called that hunger blessed. It is not the problem. It is a hunger for more, and it can be filled.',
      more: 'Trying to stop wanting treats the hunger as the enemy. Jesus did the opposite: He blessed the people who hunger, and promised they would be filled. The hunger was never the mistake. Porn was the wrong food for it.',
    },
    deep: [
      {
        h: '“Blessed are they which do hunger and thirst.”',
        p: 'He did not tell them to stop being hungry. He promised they would be filled.',
        fact: { s: 'Scripture · Matthew 5:6', i: [0] },
        more: 'In the Sermon on the Mount, Jesus said: “Blessed are they which do hunger and thirst after righteousness: for they shall be filled.” He named hunger as the start of being filled, not as a flaw to grind out.',
      },
      {
        h: 'Nephi said to feast on the words of Christ, not to nibble.',
        p: 'And he said they will tell you all things you should do, even in the empty hour.',
        fact: { s: 'Scripture · 2 Nephi 32:3', i: [1] },
        more: 'Nephi taught that angels speak by the power of the Holy Ghost, and that they speak the words of Christ. So, he said, feast on those words, for they will tell you all things you should do. A feast is unhurried and full. Read until one line speaks to you, and you have your answer for tonight.',
      },
      { ...ELLIOT, fact: { s: 'Study · Elliot, Sheldon & Church, 1997', i: [2] } },
    ],
    mine: { h: 'Here is when your hunger tends to come.', k: 'hour' },
    move: {
      h: 'Put a feast in your hardest hour, not a bite.',
      l: ['Read slowly until one line speaks to you', 'Write what it tells you to do', 'Do that one thing tonight'],
      more: 'Name the hunger first, the way you named feelings: lonely, worn out, restless. Then read with that hunger in mind, and listen for what speaks to it.',
    },
    check: {
      h: 'It is 10 p.m. You feel empty and restless. What feeds that hunger best?',
      o: [
        ['Scroll until I am tired enough to sleep', 'That numbs it for tonight. The hunger wakes up still empty.'],
        ['Read one verse fast, to check the box', 'One quick verse is better than none. A feast fills more.'],
        ['Read slowly until a line speaks, then do it', 'Yes. You fed the hunger instead of fighting it.'],
        ['Grit my teeth and wait for the wanting to die', 'The hunger does not die. It waits, and comes back stronger.'],
      ],
      a: 2,
    },
    close: 'Father, I am hungry for more than this. Fill me with what is good.',
    scope:
      'Matthew is quoted from the King James Bible, and 2 Nephi 32:3 from the Book of Mormon is put in plain words. They say the hunger is blessed and the words of Christ can fill it. The study followed students and their goals, not people quitting porn, and it shows that goals only about stopping wear people down. A hunger needs something to move toward.',
    src: [S.matt5, S.ne32, S.elliot],
    vo: {
      christian: {
        deep: [
          {
            h: '“Blessed are they which do hunger and thirst.”',
            p: 'He did not tell them to stop being hungry. He promised they would be filled.',
            fact: { s: 'Scripture · Matthew 5:6', i: [0] },
            more: 'In the Sermon on the Mount, Jesus said: “Blessed are they which do hunger and thirst after righteousness: for they shall be filled.” He named hunger as the start of being filled, not as a flaw to grind out.',
          },
          {
            h: 'Jesus said, “I am the bread of life.”',
            p: '“He that cometh to me shall never hunger.” He does not shame the hunger. He offers to fill it.',
            fact: { s: 'Scripture · John 6:35', i: [1] },
            more: 'Jesus spoke of Himself as bread: “I am the bread of life: he that cometh to me shall never hunger.” He did not shame anyone for being hungry. He offered Himself as the food. In the empty hour, sit with Him and His words, slowly, until one line speaks.',
          },
          { ...ELLIOT, fact: { s: 'Study · Elliot, Sheldon & Church, 1997', i: [2] } },
        ],
        scope:
          'Matthew and John are quoted from the King James Bible. They say the hunger is blessed and Jesus offers to fill it. The study followed students and their goals, not people quitting porn, and it shows that goals only about stopping wear people down. A hunger needs something to move toward.',
        src: [S.matt5, S.john6, S.elliot],
      },
      plain: {
        flip: {
          think: 'If I were stronger, I would not feel this hungry.',
          see: 'The hunger is not the problem. It is a hunger for more than this, and porn was never the food for it.',
          more: 'Trying to stop wanting treats the hunger as the enemy. Many faiths see it the other way: a hunger for more is part of being made for God. The hunger was never the mistake. Porn was the wrong food for it.',
        },
        deep: [
          {
            h: 'Under the urge is a hunger with a name.',
            p: 'Lonely, worn out, restless. Name it, and you know what it is asking for.',
            back: 'l13',
          },
          { ...ELLIOT, fact: { s: 'Study · Elliot, Sheldon & Church, 1997', i: [0] } },
        ],
        move: {
          h: 'Feed your hardest hour with something good.',
          l: ['Name the hunger: lonely, tired, or restless', 'Ask God what would feed it tonight', 'Do the first good thing that comes'],
        },
        check: {
          h: 'It is 10 p.m. You feel empty and restless. What feeds that hunger best?',
          o: [
            ['Scroll until I am tired enough to sleep', 'That numbs it for tonight. The hunger wakes up still empty.'],
            ['Say one quick prayer, to check the box', 'A quick prayer is better than none. Taking time fills more.'],
            ['Pray, ask what would feed it, then do it', 'Yes. You fed the hunger instead of fighting it.'],
            ['Grit my teeth and wait for the wanting to die', 'The hunger does not die. It waits, and comes back stronger.'],
          ],
          a: 2,
        },
        close: 'God, I am hungry for more than this. Fill me with what is good.',
        scope:
          'Many faiths teach that a hunger for more points toward God, and Daybook does not speak for any one of them. The study followed students and their goals, not people quitting porn, and it shows that goals only about stopping wear people down. A hunger needs something to move toward.',
        src: [S.elliot],
      },
    },
  },

  /* step 10, Make it right: Amends */
  g10: {
    id: 'g10',
    title: 'First, make peace',
    ic: 'chat',
    ask: 'If God has forgiven me, do I still need to make it right with people?',
    key: 'Making peace with someone you hurt is part of coming to God. Repair one thing, with care.',
    np: 'One person I could make one thing right with',
    hook: {
      h: 'You have prayed about it. Someone you hurt still does not know.',
      say: 'Is telling God enough?',
      more: 'The habit often comes with small harms to others: a lie to cover it, time taken, a promise broken. This lesson is about where those fit in coming back.',
    },
    ask1: {
      h: 'When you think of the people the habit has touched, what do you feel?',
      o: [
        ['That it is between me and God now', 'Part of it is. The next card shows where the rest goes.'],
        ['Afraid they would see me differently', 'That fear makes sense. Repair can be small, and it can be careful.'],
        ['That I can never make it right', 'Most harms can be eased, even when they cannot be undone. One small repair counts.'],
        ['I do not know yet', 'That is honest. Watch whether a name comes to you by the end.'],
      ],
    },
    flip: {
      think: 'I told God I am sorry. That should be the end of it.',
      see: 'Jesus told a man at the altar to go make peace first, then come back. Repair is part of coming to God.',
      more: 'In the Sermon on the Mount, a man brings his gift to the altar and remembers that someone has something against him. Jesus tells him to leave the gift, go make peace, and then come back and offer it. The gift is still wanted. It is just not the first step.',
    },
    deep: [
      {
        h: '“Leave there thy gift before the altar, and go thy way.”',
        p: 'First be reconciled, then come and offer the gift. The gift is still wanted, after the peace.',
        fact: { s: 'Scripture · Matthew 5:23-24', i: [0] },
        more: 'Jesus said that if you bring your gift to the altar and remember that someone has something against you, “Leave there thy gift before the altar, and go thy way.” First be reconciled, He said, “and then come and offer thy gift.” He sends the man back to worship, at peace.',
      },
      {
        h: 'Once changed, Alma and his friends set out to repair the harm.',
        p: 'They had worked against the Church. They went through the land trying to repair every injury.',
        fact: { s: 'Scripture · Mosiah 27:35', i: [1] },
        more: 'Alma the younger and the sons of Mosiah had worked to tear the Church down. After an angel stopped them and their hearts changed, they did not only pray. They traveled through the land, working hard to repair the injuries they had done, and telling what they had seen. Repair was how their change showed.',
      },
      { ...FEHR, fact: { s: 'Meta-analysis · 175 studies · Fehr, Gelfand & Nag, 2010', i: [2] } },
    ],
    mine: { h: 'Each day that holds is part of the repair.', k: 'clean30' },
    move: {
      h: 'Make one repair this week, with care.',
      l: ['Pick one person and one true thing', 'Say sorry plainly, and ask for nothing', 'Skip any repair that would hurt them'],
      more: 'Some repairs are a talk, some a note, some a debt paid. A few would only hurt the other person, and those are left out. With a spouse, go slowly. A counselor or your bishop can help you choose the time and the words.',
    },
    check: {
      h: 'You lied to a friend to cover the habit. You have prayed about it. What now?',
      o: [
        ['Leave it. It is between me and God now', 'Prayer was the first half. Jesus sent the man at the altar to finish it.'],
        ['Tell them every detail of the habit', 'You do not owe them all of it. Make right what touched them.'],
        ['Own the lie, say sorry, ask nothing', 'Yes. That is the gift left at the altar, and then brought back.'],
        ['Wait until I feel I deserve to face them', 'Waiting can turn into never. A plain sorry does not need you to be finished.'],
      ],
      a: 2,
    },
    close: 'Father, show me one person I can make peace with, and give me courage.',
    scope:
      'Matthew is quoted from the King James Bible, and Mosiah 27:35 from the Book of Mormon is put in plain words. Both show repair as part of coming to God. The review pooled 175 studies of forgiveness between people in many settings, not porn, and it found a sincere apology among the strongest things that go with being forgiven.',
    src: [S.matt5b, S.mosiah27, S.fehr],
    vo: {
      christian: {
        deep: [
          {
            h: '“Leave there thy gift before the altar, and go thy way.”',
            p: 'First be reconciled, then come and offer the gift. The gift is still wanted, after the peace.',
            fact: { s: 'Scripture · Matthew 5:23-24', i: [0] },
            more: 'Jesus said that if you bring your gift to the altar and remember that someone has something against you, “Leave there thy gift before the altar, and go thy way.” First be reconciled, He said, “and then come and offer thy gift.” He sends the man back to worship, at peace.',
          },
          {
            h: 'Zacchaeus met Jesus, then set out to pay back what he took.',
            p: 'Jesus answered, “This day is salvation come to this house.”',
            fact: { s: 'Scripture · Luke 19:8-9', i: [1] },
            more: 'Zacchaeus was a tax collector who had cheated people. After Jesus came to his house, he stood and said he would give half his goods to the poor, and pay back four times over anyone he had wronged. Jesus did not call the repair a punishment. He said, “This day is salvation come to this house.”',
          },
          { ...FEHR, fact: { s: 'Meta-analysis · 175 studies · Fehr, Gelfand & Nag, 2010', i: [2] } },
        ],
        move: {
          h: 'Make one repair this week, with care.',
          l: ['Pick one person and one true thing', 'Say sorry plainly, and ask for nothing', 'Skip any repair that would hurt them'],
          more: 'Some repairs are a talk, some a note, some a debt paid. A few would only hurt the other person, and those are left out. With a spouse, go slowly. A counselor or your pastor can help you choose the time and the words.',
        },
        scope:
          'Matthew and Luke are quoted from the King James Bible. Both show repair as part of coming to God. The review pooled 175 studies of forgiveness between people in many settings, not porn, and it found a sincere apology among the strongest things that go with being forgiven.',
        src: [S.matt5b, S.luke19, S.fehr],
      },
      plain: {
        flip: {
          think: 'I told God I am sorry. That should be the end of it.',
          see: 'Telling God is one half. Making peace with the person you hurt is the other half of coming back.',
          more: 'Many faiths hold that what stands between you and a person you hurt is part of what stands between you and God. Making peace is not a punishment. It is how coming back gets finished.',
        },
        deep: [
          {
            h: 'Repair is not a punishment. It finishes the coming back.',
            p: 'The person you hurt carries part of it too. A plain sorry lets you both set it down.',
          },
          { ...FEHR, fact: { s: 'Meta-analysis · 175 studies · Fehr, Gelfand & Nag, 2010', i: [0] } },
        ],
        move: {
          h: 'Make one repair this week, with care.',
          l: ['Pick one person and one true thing', 'Say sorry plainly, and ask for nothing', 'Skip any repair that would hurt them'],
          more: 'Some repairs are a talk, some a note, some a debt paid. A few would only hurt the other person, and those are left out. With a spouse, go slowly. A counselor or a faith leader can help you choose the time and the words.',
        },
        check: {
          h: 'You lied to a friend to cover the habit. You have prayed about it. What now?',
          o: [
            ['Leave it. It is between me and God now', 'Prayer was the first half. Making peace with them is the other.'],
            ['Tell them every detail of the habit', 'You do not owe them all of it. Make right what touched them.'],
            ['Own the lie, say sorry, ask nothing', 'Yes. Plain, honest, and asking nothing back.'],
            ['Wait until I feel I deserve to face them', 'Waiting can turn into never. A plain sorry does not need you to be finished.'],
          ],
          a: 2,
        },
        close: 'God, show me one person I can make peace with, and give me courage.',
        scope:
          'Many faiths teach that making peace with people is part of coming to God, and Daybook does not speak for any one of them. The review pooled 175 studies of forgiveness between people in many settings, not porn, and it found a sincere apology among the strongest things that go with being forgiven.',
        src: [S.fehr],
      },
    },
  },

  /* step 11, Keep a daily practice: Daily accountability */
  g11: {
    id: 'g11',
    title: 'Small and simple',
    ic: 'sun',
    ask: 'Do I need a big spiritual moment to change?',
    key: 'Change comes by small things done daily. A few honest minutes each morning and night carry you far.',
    np: 'The few minutes I will keep each morning and night',
    hook: {
      h: 'You keep waiting for the one night that changes everything.',
      say: 'What if it is not one big night?',
      more: 'Many people hope for one great spiritual moment that ends the habit for good: a long fast, a night of prayer, a moment that settles it. This lesson looks at how change usually comes.',
    },
    ask1: {
      h: 'What do you hope will finally change you?',
      o: [
        ['One big moment that settles it for good', 'Those moments happen. They rarely carry the next ordinary Tuesday.'],
        ['Trying harder than I ever have', 'Effort matters. Big pushes tend to burn out within a week.'],
        ['Small things, done every day', 'Hold on to that. The next card is about it.'],
        ['I do not know yet', 'That is honest. Watch what carries you this week.'],
      ],
    },
    flip: {
      think: 'I need a big spiritual moment to finally change.',
      see: 'By small and simple things, great things come. A few honest minutes a day go further than one big night.',
      more: 'Alma told his son that great things come about through small and simple ones, and that the Lord often works by very small means. The Lord also said to pray always, so that you can come off conqueror. Always is not one big night. It is a little, every day.',
    },
    deep: [
      {
        h: 'Alma taught that small and simple things bring great things.',
        p: 'And the Lord works by very small means. A few minutes a day is not too small for Him.',
        art: ['ready', {}],
        fact: { s: 'Scripture · Alma 37:6-7 · Doctrine and Covenants 10:5', i: [0, 1] },
        more: 'Alma, handing the sacred records to his son, said some would think it foolish to care so much for such small things. But by small and simple things, he said, great things come to pass. In the Doctrine and Covenants the Lord says to pray always, so that you can come off conqueror. The victory is built in the small, daily things.',
      },
      {
        h: 'Daniel prayed three times a day, “as he did aforetime.”',
        p: 'When the lions’ den came, he did not need a new plan. The habit was already there.',
        fact: { s: 'Scripture · Daniel 6:10', i: [2] },
        more: 'When the king signed a law against prayer, Daniel went home, opened his windows, knelt three times a day, prayed and gave thanks, “as he did aforetime.” He did not rise to the crisis with something new. He kept doing the small thing he had always done.',
      },
      { ...REFLECT, fact: { s: 'Field experiment · call center trainees · Di Stefano, Gino, Pisano & Staats', i: [3] } },
    ],
    mine: { h: 'The small things you have done already add up.', k: 'acted' },
    move: {
      h: 'Keep it small, every day, with no count to protect.',
      l: ['Morning: one honest prayer for today', 'Night: a few lines on what held and slipped', 'Miss one? Pick it up the next day'],
    },
    check: {
      h: 'You missed your evening look back three nights in a row. What now?',
      o: [
        ['Start a longer, stricter routine to make up', 'Bigger is harder to keep. The small thing is what carries you.'],
        ['Wait for a fresh week to start clean', 'Waiting for a clean start loses the days between. Tonight counts.'],
        ['Write a few lines tonight. Nothing broke', 'Yes. Nothing broke. Small and daily picks up right where it is.'],
        ['Drop it. Daily is not for me', 'Three missed nights do not decide it. Tonight’s few lines do.'],
      ],
      a: 2,
    },
    close: 'Father, I will come to you again tomorrow, in small and simple ways.',
    scope:
      'Alma 37 and Doctrine and Covenants 10:5 are scripture of The Church of Jesus Christ of Latter-day Saints, put here in plain words, and Daniel is quoted from the King James Bible. They point one sure way: great things are built from small, daily ones. The study followed call center trainees, not people quitting porn, and it shows that a short look back each day helped people learn more from the day.',
    src: [S.alma37, S.dc10, S.dan6, S.distefano],
    vo: {
      christian: {
        flip: {
          think: 'I need a big spiritual moment to finally change.',
          see: 'Do not despise the day of small things. A few honest minutes each day carry you further than one big night.',
          more: 'Big moments with God are real, and they fade by the next ordinary week. What carries a person is a small thing done again and again: a short prayer in the morning, an honest look back at night. Scripture keeps pointing at the small and the daily.',
        },
        deep: [
          {
            h: '“For who hath despised the day of small things?”',
            p: 'God builds great things from small beginnings. A few minutes a day is not too small for Him.',
            art: ['ready', {}],
            fact: { s: 'Scripture · Zechariah 4:10', i: [0] },
            more: 'Zechariah spoke to people rebuilding the temple, who felt their work was too small to matter. The answer came as a question: “who hath despised the day of small things?” Small beginnings were where God was at work.',
          },
          {
            h: 'Daniel prayed three times a day, “as he did aforetime.”',
            p: 'When the lions’ den came, he did not need a new plan. The habit was already there.',
            fact: { s: 'Scripture · Daniel 6:10', i: [1] },
            more: 'When the king signed a law against prayer, Daniel went home, opened his windows, knelt three times a day, prayed and gave thanks, “as he did aforetime.” He did not rise to the crisis with something new. He kept doing the small thing he had always done.',
          },
          { ...REFLECT, fact: { s: 'Field experiment · call center trainees · Di Stefano, Gino, Pisano & Staats', i: [2] } },
        ],
        scope:
          'Zechariah and Daniel are quoted from the King James Bible. They point one sure way: great things are built from small, daily ones. The study followed call center trainees, not people quitting porn, and it shows that a short look back each day helped people learn more from the day.',
        src: [S.zech4, S.dan6, S.distefano],
      },
      plain: {
        flip: {
          think: 'I need a big spiritual moment to finally change.',
          see: 'Change is built from small things. A few honest minutes each day carry you further than one big night.',
          more: 'Big moments are real, and they fade. What lasts is a small thing done again and again: a short prayer in the morning, an honest look back at night. Many faiths are built on daily practice for this reason.',
        },
        deep: [
          {
            h: 'Big moments fade. Small daily things build.',
            p: 'A short prayer each morning does more over a year than one long night.',
            art: ['ready', {}],
          },
          {
            h: 'Miss a day, and the path is still there.',
            p: 'One missed day barely fades a habit. Walk it again tomorrow.',
            back: 'l21',
          },
          { ...REFLECT, fact: { s: 'Field experiment · call center trainees · Di Stefano, Gino, Pisano & Staats', i: [0] } },
        ],
        close: 'God, I will come to you again tomorrow, in a small way.',
        scope:
          'Many faiths are built on small daily practice, and Daybook does not speak for any one of them. The study followed call center trainees, not people quitting porn, and it shows that a short look back each day helped people learn more from the day.',
        src: [S.distefano],
      },
    },
  },

  /* step 12, Give it away: Service */
  g12: {
    id: 'g12',
    title: 'Comfort you can give',
    ic: 'life',
    ask: 'Can anything good come out of what I have been through?',
    key: 'The comfort God gave you is the comfort someone else needs. What you went through becomes what you give.',
    np: 'One person I could comfort, and one true thing I could tell them',
    hook: {
      h: 'A friend looks worn out, and you know that look from inside.',
      say: 'What if what you went through is what helps them?',
      more: 'Most people want to bury this part of their life for good. This lesson looks at what it can become.',
    },
    ask1: {
      h: 'If this part of your story could be used for good, what would you do with it?',
      o: [
        ['Bury it. No one should ever know', 'That keeps you safe, and alone with it. The next card offers another way.'],
        ['Help someone, if I could do it safely', 'Hold on to that. You can help without telling everything.'],
        ['I do not think it could help anyone', 'That is how shame sees it. The next card sees it differently.'],
        ['I do not know yet', 'That is honest. See how it looks by the end.'],
      ],
    },
    flip: {
      think: 'This part of my life is something to hide for good.',
      see: 'God comforts us so we can comfort others with that same comfort. What you went through becomes what you give.',
      more: 'Paul wrote that God comforts us in all our trouble so that we can comfort others in theirs, with the very comfort we were given. The part of your life you most want to bury is the part that lets you sit with someone in theirs.',
    },
    deep: [
      {
        h: '“That we may be able to comfort them which are in any trouble.”',
        p: 'Paul said God comforts us so we can pass on the same comfort we were given.',
        fact: { s: 'Scripture · 2 Corinthians 1:3-4', i: [0] },
        more: 'Paul called God “the God of all comfort,” who “comforteth us in all our tribulation, that we may be able to comfort them which are in any trouble, by the comfort wherewith we ourselves are comforted of God.” The comfort is not meant to stop with you.',
      },
      {
        h: 'At baptism, people promise to comfort those who need comfort.',
        p: 'Alma’s people promised to mourn with those who mourn. Your own hard years teach you how.',
        fact: { s: 'Scripture · Mosiah 18:8-9', i: [1] },
        more: 'At the waters of Mormon, Alma taught that those who wanted to be baptized were willing to bear one another’s burdens, to mourn with those who mourn, and to comfort those who stand in need of comfort. It is part of the covenant. What you have carried makes you able to keep it.',
      },
      { ...HODGES, fact: { s: 'Study · 80 women · Hodges and colleagues, 2010', i: [2] } },
    ],
    mine: { h: 'Every comeback is comfort you can pass on.', k: 'back' },
    move: {
      h: 'Give one person the comfort you were given.',
      l: ['Think of one person carrying something heavy', 'Tell them one true thing that helped you', 'You do not have to tell your whole story'],
    },
    check: {
      h: 'A friend admits they are struggling with the same habit. You want to hide yours. What do you do?',
      o: [
        ['Change the subject, and keep my secret safe', 'It keeps you hidden, and leaves them alone with it too.'],
        ['Tell them every detail of my history', 'You do not owe anyone your whole story. One true thing is enough.'],
        ['Say I know how hard it is, and what helped', 'Yes. That is the comfort you were given, passed on.'],
        ['Wait until I am fully free to say anything', 'Comfort does not wait for the finish. You can give what you have now.'],
      ],
      a: 2,
    },
    close: 'Father, thank you for the comfort you gave me. Help me pass it on.',
    scope:
      'Second Corinthians is quoted from the King James Bible, and Mosiah 18 from the Book of Mormon is put in plain words. They teach that comfort received is meant to be passed on. The study was small and about new mothers, not porn, and it shows how much it means to someone to know you have been there too.',
    src: [S.cor1, S.mosiah18, S.hodges],
    vo: {
      christian: {
        deep: [
          {
            h: '“That we may be able to comfort them which are in any trouble.”',
            p: 'Paul said God comforts us so we can pass on the same comfort we were given.',
            fact: { s: 'Scripture · 2 Corinthians 1:3-4', i: [0] },
            more: 'Paul called God “the God of all comfort,” who “comforteth us in all our tribulation, that we may be able to comfort them which are in any trouble, by the comfort wherewith we ourselves are comforted of God.” The comfort is not meant to stop with you.',
          },
          {
            h: 'Jesus told Peter what to do after his fall, before it came.',
            p: '“When thou art converted, strengthen thy brethren.” The fall was not the end of what Peter could give.',
            fact: { s: 'Scripture · Luke 22:31-32', i: [1] },
            more: 'On the night before the cross, Jesus told Peter that He had prayed for him, that his faith would not fail. Then He added: “when thou art converted, strengthen thy brethren.” Jesus knew Peter would deny Him that night. He was already planning for Peter to help others afterward.',
          },
          { ...HODGES, fact: { s: 'Study · 80 women · Hodges and colleagues, 2010', i: [2] } },
        ],
        scope:
          'Second Corinthians and Luke are quoted from the King James Bible. They teach that comfort received is meant to be passed on, even after a fall. The study was small and about new mothers, not porn, and it shows how much it means to someone to know you have been there too.',
        src: [S.cor1, S.luke22, S.hodges],
      },
      plain: {
        flip: {
          think: 'This part of my life is something to hide for good.',
          see: 'The comfort you found in this is the comfort someone else needs. What you went through becomes what you give.',
          more: 'Shame says to bury this part of your life. But the person who has walked through something is the one who can sit with someone else in it. Many faiths teach that comfort received is meant to be passed on.',
        },
        deep: [
          {
            h: 'What you would hide is also what lets you understand.',
            p: 'You know the pull, the shame, and the way back. Someone near you needs exactly that.',
          },
          { ...HODGES, fact: { s: 'Study · 80 women · Hodges and colleagues, 2010', i: [0] } },
        ],
        close: 'God, thank you for the comfort you gave me. Help me pass it on.',
        scope:
          'Many faiths teach that comfort received is meant to be passed on, and Daybook does not speak for any one of them. The study was small and about new mothers, not porn, and it shows how much it means to someone to know you have been there too.',
        src: [S.hodges],
      },
    },
  },
};
