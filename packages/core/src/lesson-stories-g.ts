/* Lessons told as a story, batch G: the twelve God lessons, g1 to g12, one for each step, for people who said faith plays a part (the shape
   is in lesson-stories.ts, the standard in docs/lessons.md, the remap brief in the side-session notes, lesson-remap-brief.md). Written
   November 15, 2026. Each speaks in the Latter-day Saint voice, with the other two voices in vo (faith.ts): 'christian' reads the Bible
   only and names no Latter-day Saint scripture or church, and 'plain' names no scripture at all. A card that every voice shares is a
   const here, so a fix lands in every voice at once. Faith lessons may name the speakers and the scripture (docs/lessons.md). g1, g2 and
   g5 are read by every habit as written, and g3 and g8 to g12 through habitSay (lesson-habit.ts HABIT_OPEN), so their words hold for
   any habit. */
import type { Story, StoryPart } from './lesson-stories';

type Src = [string, string];
const S = {
  gen3: ['Genesis 3:7-21, the garden (King James Version)', 'https://www.churchofjesuschrist.org/study/scriptures/ot/gen/3?lang=eng'],
  integer: ['Online Etymology Dictionary: integrity, from the Latin integer, whole', 'https://www.etymonline.com/word/integrity'],
  ps32: ['Psalm 32:3-5 (King James Version)', 'https://www.churchofjesuschrist.org/study/scriptures/ot/ps/32?lang=eng'],
  jsh: ['Joseph Smith—History 1:11-17 (Pearl of Great Price)', 'https://www.churchofjesuschrist.org/study/scriptures/pgp/js-h/1?lang=eng'],
  pennebaker: [
    'Pennebaker & Beall (1986): confronting a traumatic event, toward an understanding of inhibition and disease, Journal of Abnormal Psychology',
    'https://doi.org/10.1037/0021-843X.95.3.274',
  ],
  wilcox: ['Brad Wilcox (July 12, 2011): His grace is sufficient, BYU devotional', 'https://speeches.byu.edu/talks/brad-wilcox/his-grace-is-sufficient/'],
  judges7: ['Judges 6:11-16 and 7:1-8, Gideon (King James Version)', 'https://www.churchofjesuschrist.org/study/scriptures/ot/judg/7?lang=eng'],
  ether: ['Ether 12:23-27 (Book of Mormon)', 'https://www.churchofjesuschrist.org/study/scriptures/bofm/ether/12?lang=eng'],
  gen39: ['Genesis 39:1-12, Joseph in Potiphar’s house (King James Version)', 'https://www.churchofjesuschrist.org/study/scriptures/ot/gen/39?lang=eng'],
  cor10: ['1 Corinthians 10:13 (King James Version)', 'https://www.churchofjesuschrist.org/study/scriptures/nt/1-cor/10?lang=eng'],
  prov7: ['Proverbs 7:6-9 (King James Version)', 'https://www.churchofjesuschrist.org/study/scriptures/ot/prov/7?lang=eng'],
  holland10: [
    'Jeffrey R. Holland (April 2010): place no more for the enemy of my soul, general conference',
    'https://www.churchofjesuschrist.org/study/general-conference/2010/04/place-no-more-for-the-enemy-of-my-soul',
  ],
  mischel70: [
    'Mischel & Ebbesen (1970): attention in delay of gratification, Journal of Personality and Social Psychology',
    'https://doi.org/10.1037/h0029815',
  ],
  mischel72: [
    'Mischel, Ebbesen & Zeiss (1972): cognitive and attentional mechanisms in delay of gratification, Journal of Personality and Social Psychology',
    'https://doi.org/10.1037/h0032198',
  ],
  mischel75: [
    'Mischel & Baker (1975): cognitive appraisals and transformations in delay behavior, Journal of Personality and Social Psychology',
    'https://doi.org/10.1037/h0076860',
  ],
  luke17: ['Luke 17:11-19, the ten lepers (King James Version)', 'https://www.churchofjesuschrist.org/study/scriptures/nt/luke/17?lang=eng'],
  ezek36: ['Ezekiel 36:26 (King James Version)', 'https://www.churchofjesuschrist.org/study/scriptures/ot/ezek/36?lang=eng'],
  bednar07: [
    'David A. Bednar (October 2007): clean hands and a pure heart, general conference',
    'https://www.churchofjesuschrist.org/study/general-conference/2007/10/clean-hands-and-a-pure-heart',
  ],
  cor4: ['2 Corinthians 4:16 (King James Version)', 'https://www.churchofjesuschrist.org/study/scriptures/nt/2-cor/4?lang=eng'],
  franklin: ['Benjamin Franklin: Autobiography, the thirteen virtues (public domain)', 'https://www.gutenberg.org/ebooks/148'],
  gen19: ['Genesis 19:15-26 (King James Version)', 'https://www.churchofjesuschrist.org/study/scriptures/ot/gen/19?lang=eng'],
  luke1732: ['Luke 17:32 (King James Version)', 'https://www.churchofjesuschrist.org/study/scriptures/nt/luke/17?lang=eng'],
  holland09: [
    'Jeffrey R. Holland (January 13, 2009): remember Lot’s wife, BYU devotional',
    'https://speeches.byu.edu/talks/jeffrey-r-holland/remember-lots-wife/',
  ],
  ps139: ['Psalm 139:23-24 (King James Version)', 'https://www.churchofjesuschrist.org/study/scriptures/ot/ps/139?lang=eng'],
  asrs: ['NASA Aviation Safety Reporting System: program briefing and immunity policy', 'https://asrs.arc.nasa.gov/overview/immunity.html'],
  mark2: ['Mark 2:1-12, the man let down through the roof (King James Version)', 'https://www.churchofjesuschrist.org/study/scriptures/nt/mark/2?lang=eng'],
  cowley: ['Matthew Cowley (February 18, 1953): miracles, BYU devotional', 'https://speeches.byu.edu/talks/matthew-cowley/miracles/'],
  james5: ['James 5:16 (King James Version)', 'https://www.churchofjesuschrist.org/study/scriptures/nt/james/5?lang=eng'],
  handbook: [
    'The Church of Jesus Christ of Latter-day Saints: General Handbook, 32, “Repentance and Membership Councils”',
    'https://www.churchofjesuschrist.org/study/manual/general-handbook/32-repentance-and-membership-councils?lang=eng',
  ],
  schnall: [
    'Schnall, Harber, Stefanucci & Proffitt (2008): social support and the perception of geographical slant, Journal of Experimental Social Psychology',
    'https://pmc.ncbi.nlm.nih.gov/articles/PMC3291107',
  ],
  luke22: ['Luke 22:54-62 and John 18:18, Peter’s denial (King James Version)', 'https://www.churchofjesuschrist.org/study/scriptures/nt/luke/22?lang=eng'],
  john21: ['John 21:1-17, breakfast by the sea (King James Version)', 'https://www.churchofjesuschrist.org/study/scriptures/nt/john/21?lang=eng'],
  prov24: ['Proverbs 24:16 and Micah 7:8 (King James Version)', 'https://www.churchofjesuschrist.org/study/scriptures/ot/prov/24?lang=eng'],
  moroni6: ['Moroni 6:5-8 (Book of Mormon)', 'https://www.churchofjesuschrist.org/study/scriptures/bofm/moro/6?lang=eng'],
  uchtdorf13: [
    'Dieter F. Uchtdorf (October 2013): you can do it now!, general conference',
    'https://www.churchofjesuschrist.org/study/general-conference/2013/10/you-can-do-it-now',
  ],
  matt4: ['Matthew 4:1-11, in the wilderness (King James Version)', 'https://www.churchofjesuschrist.org/study/scriptures/nt/matt/4?lang=eng'],
  heb4: ['Hebrews 4:15 (King James Version)', 'https://www.churchofjesuschrist.org/study/scriptures/nt/heb/4?lang=eng'],
  luther: ['Martin Luther (1530): letter to Jerome Weller, passing on a wise man’s saying about birds', 'https://wist.info/luther-martin/30882/'],
  shafran: [
    'Shafran, Thordarson & Rachman (1996): thought-action fusion in obsessive compulsive disorder, Journal of Anxiety Disorders',
    'https://doi.org/10.1016/0887-6185(96)00018-7',
  ],
  john4: ['John 4:5-29, the woman at the well (King James Version)', 'https://www.churchofjesuschrist.org/study/scriptures/nt/john/4?lang=eng'],
  matt5: ['Matthew 5:6 (King James Version)', 'https://www.churchofjesuschrist.org/study/scriptures/nt/matt/5?lang=eng'],
  bednar14: [
    'David A. Bednar (April 2014): bear up their burdens with ease, general conference',
    'https://www.churchofjesuschrist.org/study/general-conference/2014/04/bear-up-their-burdens-with-ease',
  ],
  elliot: [
    'Elliot, Sheldon & Church (1997): avoidance personal goals and subjective well-being, Personality and Social Psychology Bulletin',
    'https://doi.org/10.1177/0146167297239001',
  ],
} satisfies Record<string, Src>;

/* ---------- g1, Where are you? (step 1, Tell the truth) ---------- */

const G1_FIG: StoryPart = {
  h: 'The oldest story of hiding begins in a garden.',
  p: 'The man and the woman ate the fruit they had been told to leave. Their eyes were opened, they knew they were naked, and **they sewed fig leaves together** to cover themselves.',
  art: ['scene', { k: 'g1-fig' }],
  fact: { s: 'Scripture · Genesis 3:7-10', i: [0] },
  dx: 'Genesis tells it in a few lines. The man and the woman ate the fruit of the one tree they had been asked to leave alone. Their eyes were opened, the story says, and the first thing they saw was themselves. They knew they were naked. So **they sewed fig leaves together** and made coverings. It is the first thing anyone in the Bible makes with their hands, and it is a cover-up. Nobody had come to look yet. They hid before anyone asked.',
};
const G1_TREES: StoryPart = {
  h: 'Then they heard God walking in the garden in the cool of the day.',
  p: 'And they hid themselves **among the trees of the garden**. The leaves were not enough. Now they hid the whole of themselves.',
  art: ['scene', { k: 'g1-trees' }],
  dx: 'Then came a sound they knew: the voice of the Lord God walking in the garden in the cool of the day. Before, that sound had meant company. Now it meant being seen. So they went further. They hid themselves **among the trees of the garden**, from the very One who had planted them. The fig leaves covered part of them. The trees were meant to cover all of them. That is how hiding grows. It starts with one thing covered and ends with a whole person out of sight.',
};
const G1_CALL: StoryPart = {
  h: 'God came looking, and the first thing He said was a question.',
  p: '**Where art thou?** He did not ask because He had lost them. He knew exactly which tree. He asked so that Adam could answer.',
  art: ['scene', { k: 'g1-call' }],
  dx: 'And the Lord God called to Adam: **Where art thou?** Think about who is asking. He made the garden and every tree in it. He knew exactly where they were standing. So the question was not for Him. It was for Adam. It did not begin with a charge or a list of what they had done. It opened a door and waited, so that Adam could say, in his own words, where he was. A question from someone who already knows the answer is not a trap. It is an invitation to come out.',
};
const G1_ASK: StoryPart = {
  k: 'ask',
  h: 'When you pray, what do you leave out?',
  o: [
    ['This, every time', 'Many people of faith pray about everything but this. Watch what happens next in the garden.'],
    ['Anything that would sound bad', 'That is the fig leaf. It covers the part you most need help with.'],
    ['I stop praying when it is bad', 'Then you know the trees. Look at who comes looking.'],
    ['Nothing. I already tell Him', 'Then you know what comes next. Keep going.'],
  ],
};
const G1_ANSWER: StoryPart = {
  h: 'Adam’s first words were true.',
  p: 'I heard thy voice, he said, and **I was afraid, and I hid myself**. Not a speech. Not yet an excuse. Only where he was.',
  art: ['scene', { k: 'g1-answer' }],
  dx: 'Adam answered: I heard thy voice in the garden, and **I was afraid, and I hid myself**. Look at how plain it is. He does not explain or dress it up. He says what he heard, what he felt, and what he did. The excuses come a few lines later, as they do for most of us. But the first thing out of his mouth was the truth, and it was the sentence that brought him out from the trees. Fear and hiding, said out loud, are already less of both.',
};
const G1_COATS: StoryPart = {
  h: 'Before they left the garden, God made them coats.',
  p: 'The fig leaves were their own cover. Then **God made coats of skins, and clothed them**. The covering they needed came after the truth, and it came from Him.',
  art: ['scene', { k: 'g1-coats' }],
  fact: { s: 'Scripture · Genesis 3:21', i: [0] },
  dx: 'The story does not end with the question. There are hard words, and the man and woman must leave the garden. But before they go, one small line: unto Adam also and to his wife did the Lord God **make coats of skins, and clothed them**. The leaves they had stitched together in fear were thin and would not last. The covering God made was stronger, and He made it with His own hands, after they had told the truth. Their cover-up hid them from God. His covering went with them.',
};
const G1_WORD: StoryPart = {
  long: 1,
  h: 'A habit like this needs two of you.',
  p: 'One person people see, and one who hides among the trees. The word **integrity** comes from the Latin integer: whole, one. Each true sentence brings the two closer.',
  art: ['scene', { k: 'g1-whole' }],
  fact: { s: 'Word · Latin integer, whole', i: [1] },
  dx: 'A secret habit lives in the space between two people who share your name: the one at work, at worship, at the dinner table, and the one alone among the trees. Keeping it hidden keeps that space open, and keeping the space open is tiring. The word **integrity** comes from the Latin integer, the same word that gives us whole numbers. It means whole, one, not divided. Integrity is not being perfect. It is being one person. Every true sentence you say, to God or to someone you trust, closes the space a little.',
};
const G1_PSALM: StoryPart = {
  long: 1,
  h: 'King David wrote down what keeping quiet did to him.',
  p: '**When I kept silence, my bones waxed old**, he wrote. Then: I acknowledged my sin unto thee, and thou forgavest. The silence wore him down. The truth ended it.',
  art: ['scene', { k: 'g1-psalm' }],
  fact: { s: 'Scripture · Psalm 32:3-5', i: [2] },
  dx: 'David was a king, used to being seen as strong, and he kept something hidden. In Psalm 32 he writes what that cost: **when I kept silence, my bones waxed old** through my roaring all the day long. Day and night, he says, thy hand was heavy upon me, and his strength dried up like ground in a summer drought. Hiding feels like it saves strength. David found that it spent all of it. Then the turn: I acknowledged my sin unto thee, I said I will confess, and thou forgavest. However long the silence, the way out was one honest sentence.',
};
const G1_GROVE: StoryPart = {
  long: 1,
  h: 'A boy in New York went into the woods to pray out loud for the first time.',
  p: 'Joseph Smith wrote that for all his worries, he had **never as yet made the attempt to pray vocally**. When he began, it was hard. He kept calling out, and light came.',
  art: ['scene', { k: 'g1-grove' }],
  fact: { s: 'Scripture · Joseph Smith—History 1:14-16', i: [3] },
  dx: 'In the spring of 1820, Joseph Smith was fourteen and full of questions. He had read in James that anyone who lacks wisdom may ask of God, so he walked into the woods near his home to ask. He wrote later that it was the first time in his life he had tried it, for amid all his anxieties he had **never as yet made the attempt to pray vocally**. Out loud was different from inside his head. When he began, he wrote, a heavy darkness pressed in, as if to stop him. He kept calling on God, with all the strength he had, and then light came. For most people the light comes quieter than that, but the hard part is the same: starting out loud.',
};
const G1_END: StoryPart = {
  h: 'So when you pray about this, you are not giving God news.',
  p: 'He asked a question He already knew the answer to. **The answer is for you.** It is how you come out from among the trees, one plain sentence at a time.',
  art: ['scene', { k: 'g1-clearing' }],
  dx: 'Go back to the garden one more time. God did not need Adam’s answer to find him. Adam needed to give it to be found. Prayer about this habit works the same way. You are not telling God anything He does not know. You are doing the one thing hiding cannot survive: saying where you are, out loud. **The answer is for you.** It does not need to be polished or complete. I was afraid, and I hid myself, is a whole prayer, and it is the sentence that walks you out into the open, where the covering He makes can reach you.',
};

const G1_YOU: Story['you'] = {
  h: 'If God asked you “Where art thou?” today, what would your first true sentence be?',
  o: [
    ['I am hiding, and I am tired of it', 'That is close to Adam’s answer, and it is where he came out.'],
    ['I am doing better than I was', 'Then say that too. Honest good news is still honest.'],
    ['I am not sure where I am', 'Then say exactly that. It is true, and true is where this starts.'],
    ['I would rather not answer yet', 'Then keep the question with you. It was asked kindly.'],
  ],
};

/* the plain voice: the same turn, from a study of putting the truth into words */
const G1P_ROOM: StoryPart = {
  h: 'In the mid-1980s, a psychologist asked students to write about the hardest thing in their lives.',
  p: 'James Pennebaker gave them fifteen minutes a day, four days in a row, alone in a room. If they could, they were to pick **something they had not told many people**. No one would grade it or read it back to them.',
  art: ['scene', { k: 'g1-desk' }],
  fact: { s: 'Study · 46 students · Pennebaker & Beall, 1986', i: [0] },
  dx: 'James Pennebaker was a young psychologist in Texas who had noticed something in surveys: people who had been through something hard and kept it to themselves seemed to get sick more often than people who had talked about it. He wanted to test it. So he brought students into a room, one at a time, and asked them to write for fifteen minutes, four days running. Some wrote about ordinary things, like their room or their shoes. Others were asked to write about the most upsetting thing that had ever happened to them, ideally **something they had not told many people**. Nobody would grade it. Nobody would read it back to them. They could write the truth to no one at all.',
};
const G1P_HARD: StoryPart = {
  h: 'Many of them came out of the room upset.',
  p: 'Some cried. Writing the truth made them **feel worse at first**, not better. The study was not over.',
  art: ['scene', { k: 'g1-tears' }],
  dx: 'The writing was hard. Students wrote about losses, about things done to them, about things they had done and never said. Many came out of the room shaken, and some had cried. Right after writing, the ones who had written the truth **felt worse at first** than the ones who wrote about their shoes. If Pennebaker had measured only that afternoon, he would have concluded that telling the truth hurts and should be left alone. Many of us conclude the same thing, for the same reason: the first minutes of honesty are the worst ones.',
};
const G1P_GUESS: StoryPart = {
  k: 'guess',
  h: 'In the months after, which students went to the health center less?',
  o: [
    ['The ones who wrote about the hard thing', 'Partly. The next card shows which of them.'],
    ['The ones who wrote about their room and shoes', 'It makes sense to guess the easy days won. They did not.'],
    ['It made no difference', 'It is fair to doubt fifteen minutes. The next card shows what happened.'],
  ],
  a: 0,
};
const G1P_FOUND: StoryPart = {
  h: 'Only some of the ones who wrote the hard thing got the benefit.',
  p: 'Writing only the bare facts did not do it. The ones who wrote **both, the truth and what it did to them**, went to the doctor less in the months after.',
  art: ['scene', { k: 'g1-health' }],
  fact: { s: 'Study · 46 students · Pennebaker & Beall, 1986', i: [0] },
  dx: 'Pennebaker followed the students for months afterward, through the records of the campus health center. The ones who had written about ordinary things went as often as before. So did the ones who had written only the bare facts of the hard thing. But the ones who had written **both, the truth and what it did to them**, went to the health center less in the months that followed. Hundreds of studies since have tested the idea, with many kinds of people. Not every one finds the same, but the first lesson held: putting the truth into words, even to no one, changes the one who says it.',
};
const G1P_GOD: StoryPart = {
  h: 'Many people pray about everything except this.',
  p: 'God does not need the news. For many believers, His oldest question to a person is Where are you?, asked by One who already knows. **The answer is for your own sake**, the way those students wrote for no reader.',
  art: ['scene', { k: 'g1-clearing' }],
  dx: 'Many people of faith pray about their work, their family, their health, and leave this one thing out, as if God would rather not hear it. But think about what those students did. They wrote for no reader, and it still changed them. A prayer about this habit is not news to God, and it does not have to be. Many faiths teach that He already knows exactly where you are. So the prayer is not a report or a confession of facts He is missing. **The answer is for your own sake**: the truth, and what it is doing to you, said out loud, so you are not carrying it in silence anymore.',
};
const G1P_END: StoryPart = {
  h: 'So say where you are, in one plain sentence.',
  p: 'The first minutes of honesty are the hardest, and the students found that too. **What came after was lighter.** Hiding keeps you carrying it alone. One true sentence starts to set it down.',
  art: ['scene', { k: 'g1-whole' }],
  dx: 'The students came out of the room upset, and in the months after, they were better. That is the shape of honesty for most people: hard at first, lighter later. Prayer about this habit is the same. The first sentence is the one you have been avoiding, and it may feel worse for a moment to say it. **What came after was lighter.** You do not have to say everything. You only have to say where you are, the truth and what it is doing to you, in one plain sentence, and let that be the whole prayer for today.',
};
const G1P_YOU: Story['you'] = {
  h: 'If God asked you “Where are you?” today, what would your first true sentence be?',
  o: [
    ['I am hiding, and I am tired of it', 'That is a whole prayer, and it is where coming out starts.'],
    ['I am doing better than I was', 'Then say that too. Honest good news is still honest.'],
    ['I am not sure where I am', 'Then say exactly that. It is true, and true is where this starts.'],
    ['I would rather not answer yet', 'Then keep the question with you. It is asked kindly.'],
  ],
};

/* ---------- g2, Weakness is the way in (step 2, Stop counting on willpower) ---------- */

const G2_STUDENT: StoryPart = {
  h: 'A student came to a teacher, Brad Wilcox, and said she did not understand grace.',
  p: 'I know I need to do my best, she said, and then Jesus does the rest. **But I cannot even do my best.** So where does that leave me?',
  art: ['scene', { k: 'g2-student' }],
  fact: { s: 'Talk · Wilcox, 2011', i: [0] },
  dx: 'Brad Wilcox taught at Brigham Young University, and he told this story in a talk to its students. A young woman came to him and said, I just do not get grace. She had always pictured it as a bill: she pays what she can, and the Savior covers the rest. I know I need to do my best, she said, and then Jesus does the rest. **But I cannot even do my best.** I try, and I keep falling short. It is the question under most willpower plans. If I cannot manage my share, do I get any help at all?',
};
const G2_DOTS: StoryPart = {
  h: 'He took a piece of paper and drew two dots.',
  p: 'One at the top for God, one at the bottom for us. Then he handed her the pen. Go ahead, he said. **Draw the line.** How much is our part, and how much is His?',
  art: ['scene', { k: 'g2-dots' }],
  dx: 'Wilcox took a piece of paper and drew two dots on it, one at the top and one at the bottom. The top dot stood for God, he said, and the bottom dot for us. Then he gave her the pen. Go ahead, he said. **Draw the line.** Show me how much is our part and how much is His: how far we have to climb on our own before His help begins. It is a fair question. Most of us carry an answer to it without ever having drawn it.',
};
const G2_ASK: StoryPart = {
  k: 'ask',
  h: 'Where would you have drawn the line?',
  o: [
    ['Near the top. I have to do most of it', 'Many people draw it there. Look at what Wilcox said.'],
    ['About halfway', 'A fair split is how most of us picture it. Look at what came next.'],
    ['Near the bottom. He does most of it', 'Then the next card goes one step further.'],
    ['I do not know where it goes', 'That is honest. The next card may be a relief.'],
  ],
};
const G2_NOLINE: StoryPart = {
  h: 'She drew it just above the bottom dot. He told her there is no line.',
  p: 'Jesus **filled the whole space**, Wilcox said. His grace does not start where our effort runs out. It is there from the bottom dot to the top.',
  art: ['scene', { k: 'g2-noline' }],
  dx: 'She drew a line just above the bottom dot, leaving herself only a sliver. Wrong, Wilcox said. She guessed it must go higher. No, he said. There is no line. Jesus **filled the whole space**. He did not pay it all except for a few coins. He paid it all. Grace, Wilcox told the students, is not a booster engine that kicks in once our own fuel is gone. It is our constant energy source. That changes what willpower is for. A hard day is not a day without help. It is a day to lean on it.',
};
const G2_PIANO: StoryPart = {
  h: 'Then what is our part? He answered with piano lessons.',
  p: 'A mother pays for her child’s lessons and asks the child to practice. **The practice does not pay the teacher.** The lessons are already paid. Practice is how the child uses them.',
  art: ['scene', { k: 'g2-piano' }],
  dx: 'If there is no line, the student asked, what is the point of trying? Wilcox answered with a picture. A mother pays for her child’s piano lessons. Because she has paid, she asks the child to practice. **The practice does not pay the teacher.** The child could practice for a hundred years and never pay back what the lessons cost. The mother is not keeping a ledger. She asks for practice because she wants the child to learn to play. Our effort is like that. It is not a payment to earn His help. It is how we use the help He has already given.',
};
const G2_NOTE: StoryPart = {
  h: 'And a wrong note does not end the lessons.',
  p: 'When a young pianist hits a wrong note, Wilcox said, **we do not say he is not worthy to keep practicing**. We expect him to keep trying. There were never only two choices, perfect or quit.',
  art: ['scene', { k: 'g2-note' }],
  dx: 'Another student told Wilcox she was not very good at the piano: she hit a lot of wrong notes, and it took her forever to get it right. That is how it is with learning, he answered. When a young pianist hits a wrong note, **we do not say he is not worthy to keep practicing**. We do not expect him to be flawless. We just expect him to keep trying. And yet so many people, after one slip, decide they have lost the right to keep going. There should never be just two options, Wilcox said: perfection or giving up.',
};
const G2_WHY: StoryPart = {
  long: 1,
  h: 'Then he asked why this is easy to see at a piano and hard to see in ourselves.',
  p: 'Nobody calls a child a fraud for a wrong note. But after a slip, many of us say worse to ourselves. **The patience you would give that child is the patience He gives you.**',
  art: ['scene', { k: 'g2-mirror' }],
  dx: 'Why, Wilcox asked, is this so easy to see when someone is learning the piano, and so hard to see when we are learning to come to God? Picture the child after a bad lesson, sure they will never get it, thinking about quitting. You would sit beside them and say: keep going, everyone sounds like this at first. Now picture what you say to yourself after a slip: that you are a fake, that you never meant it, that you should stop pretending. **The patience you would give that child is the patience He gives you.** Learning sounds like wrong notes for a long time before it sounds like music.',
};
const G2_GIDEON: StoryPart = {
  long: 1,
  h: 'Gideon gathered thirty-two thousand men. God said it was too many.',
  p: 'Too many, He said, **lest they say their own hand saved them**. He sent most of them home until only three hundred were left, and then the battle was won.',
  art: ['scene', { k: 'g2-gideon' }],
  fact: { s: 'Scripture · Judges 6:11-16, 7:2-7', i: [1] },
  dx: 'When the angel first found Gideon, he was threshing wheat in a winepress, hidden from the enemy, and he called himself the least in his father’s house. Then he gathered an army of thirty-two thousand to face a camp of Midianites that filled the valley like grasshoppers. And the Lord said: the people that are with thee are too many, **lest they say their own hand saved them**. Twenty-two thousand were sent home, then all but three hundred of the rest. With three hundred men, trumpets, empty pitchers and torches, the camp was won. God did not want Gideon strong first. He made him weaker, on purpose, so that Gideon would know where the strength came from.',
};
const G2_ETHER: StoryPart = {
  long: 1,
  h: 'Moroni worried that his writing was too weak to be read.',
  p: 'The Lord answered him: **I give unto men weakness that they may be humble**. And for all who come to Him in it, He makes weak things become strong.',
  art: ['scene', { k: 'g2-moroni' }],
  fact: { s: 'Scripture · Ether 12:23-27', i: [2] },
  dx: 'Near the end of the Book of Mormon, Moroni is alone, writing on plates of metal, and he is afraid. He tells the Lord that his writing is weak, that he cannot put things down with the power he feels, and that people will mock it. The answer he receives is one of the best-loved verses in the book. If men come unto me, the Lord says, I will show unto them their weakness. **I give unto men weakness that they may be humble.** My grace is sufficient for all who humble themselves before me, and I will make weak things become strong unto them. The weakness here is being human, the place where we cannot do it alone, not the sin itself. It was not a wall between Moroni and the Lord. It was the way in.',
};
const G2_END: StoryPart = {
  h: 'So you do not have to get strong first and bring God the result.',
  p: 'Willpower says do your part, then He tops it up. Grace starts at the weak place. **Bring it now, as it is**, and keep practicing inside His help, wrong notes and all.',
  art: ['scene', { k: 'g2-hands' }],
  dx: 'Willpower alone has a plan that sounds humble: get strong, prove it with a good stretch, and then come to God with something to show. That plan puts the line high on the page, and every slip pushes it higher. The student’s question, the piano and Gideon’s three hundred all turn it over. Help is there the whole way. Your effort is practice, not payment. A wrong note does not end the lessons. **Bring it now, as it is**: the weak place, by name, today. It is not the thing that keeps you from Him. It is where His strength comes in.',
};
const G2_YOU: Story['you'] = {
  h: 'Where have you been waiting to be strong enough before asking God for help?',
  o: [
    ['After a slip, until I have a good week', 'That is the line drawn high. You can ask from the bottom dot.'],
    ['With the urge itself, while it is pulling', 'That is the weak place. It is also the way in.'],
    ['With telling anyone at all', 'Then that may be the practice that comes next.'],
    ['I am not sure yet', 'That is honest. Watch where you hold back this week.'],
  ],
};

/* the plain voice: the same teacher's picture, told of God's help without scripture */
const G2P_STUDENT: StoryPart = {
  ...G2_STUDENT,
  p: 'I know I need to do my best, she said, and then God does the rest. **But I cannot even do my best.** So where does that leave me?',
  dx: 'Brad Wilcox taught at a university, and he told this story in a talk to its students. A young woman came to him and said she did not understand grace, the help that comes from God. She had always pictured it as a bill: she pays what she can, and God covers the rest. I know I need to do my best, she said, and then God does the rest. **But I cannot even do my best.** I try, and I keep falling short. It is the question under most willpower plans. If I cannot manage my share, do I get any help at all?',
};
const G2P_NOLINE: StoryPart = {
  h: 'She drew it just above the bottom dot. He told her there is no line.',
  p: 'Help from above **filled the whole space**, Wilcox said. It does not start where our effort runs out. It is there from the bottom dot to the top.',
  art: ['scene', { k: 'g2-noline' }],
  dx: 'She drew a line just above the bottom dot, leaving herself only a sliver. Wrong, Wilcox said. She guessed it must go higher. No, he said. There is no line. He was speaking as a Christian, of grace, but the picture holds for anyone who believes God helps: that help **filled the whole space**. It is not a booster engine, he said, that kicks in once our own fuel is gone. It is a constant source. That changes what willpower is for. A hard day is not a day without help. It is a day to lean on it.',
};
const G2P_WHY: StoryPart = {
  long: 1,
  h: 'Then he asked why this is easy to see at a piano and hard to see in ourselves.',
  p: 'Nobody calls a child a fraud for a wrong note. But after a slip, many of us say worse to ourselves. **The patience you would give that child is the patience God gives you.**',
  art: ['scene', { k: 'g2-mirror' }],
  dx: 'Why, Wilcox asked, is this so easy to see when someone is learning the piano, and so hard to see when we are learning to come to God? Picture the child after a bad lesson, sure they will never get it, thinking about quitting. You would sit beside them and say: keep going, everyone sounds like this at first. Now picture what you say to yourself after a slip: that you are a fake, that you never meant it, that you should stop pretending. **The patience you would give that child is the patience God gives you.** Learning sounds like wrong notes for a long time before it sounds like music.',
};
const G2P_END: StoryPart = {
  ...G2_END,
  p: 'Willpower says do your part, then He tops it up. God’s help starts at the weak place. **Bring it now, as it is**, and keep practicing inside His help, wrong notes and all.',
  dx: 'Willpower alone has a plan that sounds humble: get strong, prove it with a good stretch, and then come to God with something to show. That plan puts the line high on the page, and every slip pushes it higher. The student’s question and the piano turn it over. Help is there the whole way. Your effort is practice, not payment. A wrong note does not end the lessons. **Bring it now, as it is**: the weak place, by name, today. It is not the thing that keeps you from God. Many faiths teach that it is the very place His strength comes in.',
};

/* ---------- g3, The way out comes early (step 3, Close the door) ---------- */

const G3_HOUSE: StoryPart = {
  h: 'Joseph was sold by his brothers and became a servant in Egypt.',
  p: 'He rose in the house of Potiphar, an officer of Pharaoh, until **everything was in his hands**. Then Potiphar’s wife began to want him.',
  art: ['scene', { k: 'g3-house' }],
  fact: { s: 'Scripture · Genesis 39:1-12', i: [0] },
  dx: 'Joseph was seventeen when his brothers sold him to traders bound for Egypt. He was bought by Potiphar, captain of Pharaoh’s guard, and the story says the Lord was with him, so that whatever he did went well. Potiphar trusted him more and more, until **everything was in his hands**: the house, the fields, the money. Potiphar did not even know what he owned, except the bread he ate. And Joseph was, the story says, a goodly person and well favored. So Potiphar’s wife began to want him, and she said so.',
};
const G3_DAILY: StoryPart = {
  h: 'She asked him day after day.',
  p: 'Joseph said no, and then he did something more. He **would not even be with her**. Where he could keep his distance, he did.',
  art: ['scene', { k: 'g3-rooms' }],
  dx: 'Joseph said no, plainly, and said why: his master had trusted him with everything, and he would not sin against God. But she did not stop. She spoke to him day by day. And here is a line most people read past. It says he hearkened not unto her, to lie by her, **or to be with her**. Joseph did not only refuse. He kept his distance. He did not linger near her to prove how strong he was. Day after day, wherever he could, he took the way out before there was anything to escape.',
};
const G3_COAT: StoryPart = {
  h: 'One day no one else was in the house.',
  p: 'Joseph came in to do his work, and she caught him by his coat. **He left it in her hand, and ran.**',
  art: ['scene', { k: 'g3-coat' }],
  dx: 'Then came a day when none of the men of the house were inside. Joseph went in to do his work, and she caught him by his garment and pulled. There was no time to argue and nothing to think through. **He left it in her hand, and ran** out of the house. It cost him. She lied about him, and he went to prison for it. But the running was easier because of the quiet days before, when he had already been keeping his distance.',
};
const G3_ASK: StoryPart = {
  k: 'ask',
  h: 'Which of Joseph’s two ways out is harder for you?',
  o: [
    ['Keeping my distance, day after day', 'That is the early door. It is the one that does most of the work.'],
    ['Running at the last moment', 'Then the early door may make the last one rarer.'],
    ['Both feel hard right now', 'That is honest. You only need the next one, not both forever.'],
    ['I have not tried either yet', 'Then this lesson is about where to start.'],
  ],
};
const G3_HOLLAND: StoryPart = {
  long: 1,
  h: 'An apostle, Jeffrey R. Holland, spoke plainly about Joseph’s way out.',
  p: 'When you run from temptation, he said, run the way Joseph did, and **do not leave a forwarding address**. The strong move is distance, not a test of nerve.',
  art: ['scene', { k: 'g3-address' }],
  fact: { s: 'Talk · Holland, 2010', i: [3] },
  dx: 'Jeffrey R. Holland, an apostle of the Church of Jesus Christ of Latter-day Saints, spoke in general conference about this pull. He did not tell people to stand close and fight it. Like Joseph, he said, just run, as far as you can get from whatever pulls you. And when you flee, **do not leave a forwarding address**. Make the way back hard to find. Holland compared it to someone who has quit drinking: being near it is the danger, so the wise thing is distance. He also said that people caught in real habits often need more help than self-help, and that asking for it is part of running too.',
};
const G3_PAUL: StoryPart = {
  h: 'Paul promised that a way out comes with every pull.',
  p: 'God **will with the temptation also make a way to escape**, he wrote, that ye may be able to bear it. The door is made with the pull, from the start.',
  art: ['scene', { k: 'g3-gate' }],
  fact: { s: 'Scripture · 1 Corinthians 10:13', i: [1] },
  dx: 'Paul wrote to the believers in Corinth, a city known for every kind of pull, and he did not pretend it was easy. No temptation has taken you, he said, but such as is common to man. Then the promise: God is faithful, who will not suffer you to be tempted above that ye are able, but **will with the temptation also make a way to escape**, that ye may be able to bear it. Notice the word with. The way out is not sent later, as a rescue at the last moment. It is made alongside the pull, from the start. Most people look for it at the peak. It comes with the pull, so look for it as the pull begins.',
};
const G3_CORNER: StoryPart = {
  long: 1,
  h: 'Proverbs tells of a young man who walked toward a fall without deciding to.',
  p: 'He was **passing through the street near her corner**, the corner of a house he knew to stay away from, and went the way to it as it grew dark. The fall waited at the end of the street. The way out was at the corner.',
  art: ['scene', { k: 'g3-corner' }],
  fact: { s: 'Scripture · Proverbs 7:6-9', i: [2] },
  dx: 'In Proverbs, a father looks out of his window and sees a young man in the street below. Nothing has happened yet. The young man is just walking. But he is **passing through the street near her corner**, and he went the way to her house, as the day turned to evening and the evening to dark. He never seems to decide anything. He just keeps taking the next street. That is how most falls come, the father is saying: not in one choice at the end, but in a walk that started much earlier. The way out was never at her door. It was at the corner, where he could still turn down another street.',
};
const G3_END: StoryPart = {
  h: 'So the way out is usually not at the peak. It is a door you pass earlier.',
  p: 'The room, the first glance, the first small yes. **God makes the door. You walk through it**, most often before the pull is loud.',
  art: ['scene', { k: 'g3-early' }],
  dx: 'Many people of faith have prayed for a way out at the hardest moment and felt nothing open, and wondered if God had left them without one. Put Joseph, Paul and that young man together, and the answer turns over. The way out was there all along, but it was early and plain: the distance Joseph kept, the corner where the young man could have turned, whatever the pull is. At the peak it is hardest to see and hardest to take. **God makes the door. You walk through it**, and the best time is when things still feel fine, a step or two before the pull begins.',
};
const G3_YOU: Story['you'] = {
  h: 'Where is your early door: the first small step that leads toward it?',
  o: [
    ['Being alone with nothing planned', 'Then a plan for that time is your early door.'],
    ['A feeling: tired, lonely or wound up', 'Then noticing that feeling is the door. Turn there.'],
    ['A place, a route or a thing I reach for', 'Then that is where the door is. Keep your distance.'],
    ['I have not found it yet', 'Your log can show it. Look at what came before the hard days.'],
  ],
};

/* the plain voice: the same turn, from the children who waited */
const G3P_TREAT: StoryPart = {
  h: 'In the late 1960s, a psychologist left young children alone with a treat.',
  p: 'Walter Mischel told each child: you can ring the bell and have a small treat now, or wait until I come back and **have the one you want more**. Then he left the room and watched.',
  art: ['scene', { k: 'g3-treat' }],
  fact: { s: 'Study · Mischel & Ebbesen, 1970', i: [0] },
  dx: 'Walter Mischel was a psychologist at Stanford, and his own daughters went to the preschool on campus. He set up a small room there with a table, a chair and a bell. A child sat down, and on the table was a treat they loved, a cookie, a pretzel, a marshmallow. Mischel told them: you can ring the bell and have the smaller treat now, or you can wait until I come back on my own, and then **have the one you want more**. Then he left. The child was alone with the treat, and the wait could be long. He wanted to know what helped a child hold out.',
};
const G3P_GUESS: StoryPart = {
  k: 'guess',
  h: 'Which children waited the longest?',
  o: [
    ['The ones who kept their eyes on it and held on', 'That is what the researchers expected. It ran the other way.'],
    ['The ones who found a way not to look at it', 'Yes. And the next card shows how far that went.'],
  ],
  a: 1,
};
const G3P_LOOK: StoryPart = {
  h: 'The children who waited were not the ones who held on hardest.',
  p: 'They **covered their eyes, turned their chairs around**, sang to themselves, played with their feet. The ones who stared at the treat and fought it gave in first.',
  art: ['scene', { k: 'g3-chair' }],
  fact: { s: 'Study · Mischel, Ebbesen & Zeiss, 1972', i: [1] },
  dx: 'Watching through a window, Mischel and his team saw something they had not expected. The children who lasted were not the ones gritting their teeth with their eyes on the prize. Those children often gave in first. The ones who lasted **covered their eyes, turned their chairs around**, put their heads down on the table, sang little songs, talked to themselves, played games with their hands and feet. One tried to fall asleep. They were not stronger. They had found a way to be somewhere else while the treat sat there.',
};
const G3P_COVER: StoryPart = {
  h: 'When the treat was hidden under a cover, they waited about ten times as long.',
  p: 'Same kind of children, same treats, same promise. The only change was that **they could not see it**, and the wait that had felt impossible became possible.',
  art: ['scene', { k: 'g3-cover' }],
  fact: { s: 'Study · Mischel & Ebbesen, 1970', i: [0] },
  dx: 'So Mischel tried changing the room instead of the child. In one version, the treats sat in plain view on the table. In another, they were in the room but hidden from sight. Children with the treats in view waited, on average, about a minute. Children who **could not see it** waited about eleven. The children were no different. Not in age, in willpower or in wanting the better treat. The room had changed. A door had been closed early, and the wait that seemed beyond them became something they could do.',
};
const G3P_CLOUD: StoryPart = {
  long: 1,
  h: 'Later, children waited longer when they pictured the treat as something else.',
  p: 'Told to think of the marshmallows as **puffy white clouds**, children held out far longer than children told to think about how they would taste.',
  art: ['scene', { k: 'g3-cloud' }],
  fact: { s: 'Study · Mischel & Baker, 1975', i: [2] },
  dx: 'In later studies, Mischel found that even what a child did in their head was a kind of door. Children told to think about how sweet and chewy the marshmallows were gave in quickly. Children told to think of them as **puffy white clouds**, round and white and far away, waited much longer. The treat was the same and it was right there. What changed was the first thought the child turned toward. The way out was not at the end of the wait. It was in the first minute, in where the mind went.',
};
const G3P_GOD: StoryPart = {
  h: 'God does not leave a person without a way out.',
  p: 'The children show where it usually is: **early, and plain**. Not in holding on at the peak, but in the turn of a chair, a cover over the plate, a different first thought.',
  art: ['scene', { k: 'g3-gate' }],
  dx: 'Many people of faith have prayed for a way out at the hardest moment and felt nothing open, and wondered if God had left them without one. Many faiths teach that He never does, that a way out is always there to be taken. The children in that room show where it tends to be: **early, and plain**. The children who stared and fought gave in. The ones who turned their chairs, covered the plate or thought of clouds made it. The way out was not a rescue at the last second. It was a small turn they took near the start.',
};
const G3P_END: StoryPart = {
  ...G3_END,
  p: 'The turned chair, the covered plate, the first small yes. **God makes the door. You walk through it**, most often before the pull is loud.',
  dx: 'Ask God for a way out at the peak, and it is hard to see, because at the peak you are staring at the plate. The children found theirs early. They turned the chair before the wait got long. They covered the treat before it could fill the room. For you it may be a room you do not go into, a thing you put out of sight, a feeling you notice and turn from. **God makes the door. You walk through it**, and the best time is when things still feel fine, a step or two before the pull begins.',
};

/* ---------- g4, A new heart is given (step 4, Decide) ---------- */

const G4_TEN: StoryPart = {
  h: 'Ten men with leprosy stood far off and called out to Jesus.',
  p: 'By law they had to keep their distance from everyone. So they **lifted up their voices** from the edge of the village: Jesus, Master, have mercy on us.',
  art: ['scene', { k: 'g4-ten' }],
  fact: { s: 'Scripture · Luke 17:11-19', i: [0] },
  dx: 'Jesus was on the road to Jerusalem, passing between Samaria and Galilee, when He came to a village. Ten men with leprosy were there. In their world, leprosy meant you lived apart, outside the town, and you warned people off when they came near. So the ten stood afar off, as the law required, and **lifted up their voices**: Jesus, Master, have mercy on us. They did not come close. They could not. All they could do was call across the distance and ask.',
};
const G4_GO: StoryPart = {
  h: 'He did not touch them. He told them to go and show themselves to the priests.',
  p: 'The priest was the one who looked a leper over **after** the healing, to say it was real. Jesus sent them on their way while they were still sick.',
  art: ['scene', { k: 'g4-go' }],
  dx: 'Other times Jesus touched a leper, or spoke and the healing came at once. Not this time. He looked at them and said only: Go shew yourselves unto the priests. Every one of them knew what that meant. Under the law of Moses, the priest was the one who examined a leper and declared him clean, **after** the healing had come. Going to the priest was the last step, the proof. And Jesus asked them to take it first, with the sores still on their skin. He asked them to walk as healed men before they were.',
};
const G4_ASK: StoryPart = {
  k: 'ask',
  h: 'Would you have started walking before anything had changed?',
  o: [
    ['Yes, but I would feel like a fake', 'Most people would. Look at what happened on the road.'],
    ['No, I would wait to feel healed first', 'That is the most natural thing. Look at what waiting would have missed.'],
    ['I am walking like that right now', 'Then the next card is about you.'],
    ['I do not know', 'That is honest. Keep it in mind for the next card.'],
  ],
};
const G4_WENT: StoryPart = {
  h: 'And as they went, they were cleansed.',
  p: 'Not before they set out, and not after they arrived. **On the road, while they were walking**, the leprosy left them.',
  art: ['scene', { k: 'g4-road' }],
  dx: 'Luke tells it in one plain sentence: and it came to pass, that, as they went, they were cleansed. Not before they set out. Nobody waited at the edge of the village until the sores faded. And not after they reached the priest. **On the road, while they were walking**, somewhere between the village and the priest, the change came. One of them, seeing it, turned back and fell at Jesus’ feet to give thanks. Thy faith hath made thee whole, Jesus told him. He had set out on faith, while nothing had changed yet.',
};
const G4_EZEK: StoryPart = {
  h: 'Through the prophet Ezekiel, God promised a new heart as a gift.',
  p: '**A new heart also will I give you**, He said, and I will take away the stony heart. Here it is God who does the giving.',
  art: ['scene', { k: 'g4-heart' }],
  fact: { s: 'Scripture · Ezekiel 36:26', i: [1] },
  dx: 'Ezekiel spoke to people far from home, who had lost almost everything because of what they had done. The promise God sent through him was not a list of what they must fix first. It was this: **a new heart also will I give you**, and a new spirit will I put within you, and I will take away the stony heart out of your flesh, and I will give you an heart of flesh. A heart of stone does not soften by trying harder to feel soft. It is changed by the One who made it.',
};
const G4_HANDS: StoryPart = {
  long: 1,
  h: 'An apostle, David A. Bednar, said changing has two parts.',
  p: 'Clean hands, **stopping what you do**, and a pure heart, the wanting itself changing. Both come through the Savior, and the heart takes longer: line upon line.',
  art: ['scene', { k: 'g4-two' }],
  fact: { s: 'Talk · Bednar, 2007', i: [3] },
  dx: 'David A. Bednar, an apostle of the Church of Jesus Christ of Latter-day Saints, taught that the goal is to overcome both sin and the desire to sin. He spoke of clean hands and a pure heart. Hands are made clean through the Savior’s Atonement, as we keep **stopping what you do**: putting off the old ways. A heart is made pure by a change in desires, motives and nature, which comes as we receive the Savior’s power to do good. And he said the Lord’s pattern for that is line upon line, here a little and there a little: small, steady steps, the pursuit of a lifetime. So it is normal to have stopped and still want it. The hands come first. The heart follows.',
};
const G4_RENEWED: StoryPart = {
  long: 1,
  h: 'Paul said the inward person is renewed day by day.',
  p: 'Not in one moment. **The inward man is renewed day by day**, he wrote, even while everything outside feels worn. A heart changing slowly is still a heart changing.',
  art: ['scene', { k: 'g4-days' }],
  fact: { s: 'Scripture · 2 Corinthians 4:16', i: [2] },
  dx: 'Paul wrote this to the believers in Corinth from a hard place. He had been beaten, hunted, worn out, and he said so. Yet he did not lose heart, he wrote, for though our outward man perish, yet **the inward man is renewed day by day**. Not renewed once and finished. Renewed day by day, the way bread is given day by day. If you decided weeks ago and still feel the pull, you have not failed to change. You are being renewed the way Paul was, one day at a time.',
};
const G4_END: StoryPart = {
  h: 'So decide with the heart you have, and start walking.',
  p: 'The ten did not wait to feel healed. **You do not have to feel changed to decide.** The decision is your part. The new heart is given, and most of it comes on the road.',
  art: ['scene', { k: 'g4-start' }],
  dx: 'Many people wait to decide until the wanting is gone, so the decision will feel honest. The ten lepers show another way. They set out with the sores still on them, toward a priest who would only see them after a healing that had not yet come. That was not pretending. That was faith. **You do not have to feel changed to decide.** Decide with the heart you have today, and walk as someone who has decided. The new heart is not something you build before you set out. It is given, and most of it comes on the road.',
};

/* the plain voice: a man who decided to change before he had changed, from his own account */
const G4P_BOOK: StoryPart = {
  h: 'As a young printer, Benjamin Franklin decided to stop doing wrong for good.',
  p: 'He wrote down thirteen virtues, gave each a page in **a little book**, and marked every slip with a small black spot. One week at a time, he watched one virtue closely.',
  art: ['scene', { k: 'g4-book' }],
  fact: { s: 'Life · Franklin’s Autobiography', i: [0] },
  dx: 'Benjamin Franklin was a printer in his twenties in Philadelphia when he decided, as he put it, to live without committing any fault at any time. He knew what was right, he thought, so why not simply do it? He wrote down thirteen virtues he wanted, among them temperance, order, sincerity and calm. He made **a little book** with a page for each one, ruled into days, and each evening he put a small black spot beside any virtue he had failed that day. He gave each virtue a week of strict attention, one after another, so that in thirteen weeks he would go through them all.',
};
const G4P_SPOTS: StoryPart = {
  h: 'He found far more spots than he expected.',
  p: 'He wrote that he was surprised to find himself **so much fuller of faults than I had imagined**. Deciding had not made him changed. It had only shown him how far he had to go.',
  art: ['scene', { k: 'g4-spots' }],
  dx: 'The book filled with black spots. Franklin wrote that he was surprised to find himself **so much fuller of faults than I had imagined**. The decision had been sincere, and yet the first weeks proved that deciding is not the same as being changed. Many people stop here. They decide, they slip, and they conclude the decision was a lie, because a real decision would have made them different at once. Franklin did not stop.',
};
const G4P_ASK: StoryPart = {
  k: 'ask',
  h: 'When your decision and your days do not match, what do you usually conclude?',
  o: [
    ['That I never really meant it', 'That is the most common thought. Watch what Franklin concluded.'],
    ['That I need to try harder', 'Franklin tried harder and still found more spots. Watch what he did next.'],
    ['That change takes longer than I hoped', 'Keep that in mind on the next card.'],
    ['I am not sure', 'That is honest. The next card may help.'],
  ],
};
const G4P_DIMINISH: StoryPart = {
  h: 'But he kept marking, and the spots began to thin.',
  p: 'In the same sentence, he wrote: but I had **the satisfaction of seeing them diminish**. The change came after the decision, one marked week at a time.',
  art: ['scene', { k: 'g4-thin' }],
  fact: { s: 'Life · Franklin’s Autobiography', i: [0] },
  dx: 'Franklin went through his thirteen weeks, and then through them again. He wore holes in the paper erasing old spots, so he copied the pages onto ivory tablets that he could wipe clean. And he wrote, in the same breath as his surprise: but I had **the satisfaction of seeing them diminish**. Not vanish. Diminish. The decision had not made him a new man on the first day. It had given him something to keep walking with, and the change came slowly, after it.',
};
const G4P_AXE: StoryPart = {
  long: 1,
  h: 'He told a story about a man who wanted his whole axe bright.',
  p: 'The smith said he would polish it if the man turned the grindstone. The man soon tired and said **I think I like a speckled axe best**. Franklin admitted he was tempted to say the same.',
  art: ['scene', { k: 'g4-axe' }],
  fact: { s: 'Life · Franklin’s Autobiography', i: [0] },
  dx: 'Franklin was honest about the urge to quit. He told of a man who bought an axe and wanted its whole face as bright as its edge. The smith agreed to grind it if the man turned the wheel. The man turned and turned while the smith pressed the axe hard against the stone, and it was tiring work. Every so often he stopped to look. Turn on, said the smith, we shall have it bright by and by, as yet it is only speckled. Yes, said the man, but **I think I like a speckled axe best**. Franklin admitted part of him agreed with the man. Even so, the spots he did lose stayed lost.',
};
const G4P_GOD: StoryPart = {
  h: 'A changed heart is God’s gift, given over time.',
  p: 'Franklin found the same shape in his own life. **The decision came first, and the change followed.** Your part is to decide and keep turning. The new heart is given along the way.',
  art: ['scene', { k: 'g4-heart' }],
  dx: 'Many faiths teach that a changed heart is God’s gift, given over time to people who turn toward Him, not a test they must pass before they are allowed to start. Franklin’s little book shows the same shape from the human side. **The decision came first, and the change followed.** If you wait to decide until the wanting is gone, you will wait a long time. Decide with the heart you have, ask God to change it, and keep marking the days. The spots thin as you go.',
};
const G4P_END: StoryPart = {
  h: 'He never became perfect, and he said the trying was still worth it.',
  p: 'Late in life he wrote that he fell far short, yet by the attempt he was **a better and a happier man** than he would have been without it. Decide with the heart you have.',
  art: ['scene', { k: 'g4-start' }],
  fact: { s: 'Life · Franklin’s Autobiography', i: [0] },
  dx: 'Franklin wrote his account as an old man, and he did not pretend he had arrived. He never reached the perfection he had been so eager for, he said, but fell far short of it. Yet by the effort he was **a better and a happier man** than he otherwise would have been if he had not tried. That is what a decision is for. Not to make you changed on the first day, but to point you somewhere and keep you walking. Decide today, with the heart you have, and let the change come on the road.',
};

/* ---------- g5, Asking to be shown (step 5, Know your pattern) ---------- */

const G5_FLEE: StoryPart = {
  h: 'Two angels pulled Lot’s family out of a city about to burn.',
  p: 'They took them by the hand and led them out. Then came one instruction: **look not behind thee**. Escape to the mountain.',
  art: ['scene', { k: 'g5-flee' }],
  fact: { s: 'Scripture · Genesis 19:15-26', i: [0] },
  dx: 'Genesis tells of Lot, living with his family in a city so lost that it could not be saved. Two angels came to warn him. At dawn they urged him to go, and when he lingered, they took him, his wife and his two daughters by the hand and brought them out of the city themselves, the Lord being merciful unto him, the story says. Outside the gate, the instruction was short: escape for thy life, **look not behind thee**, neither stay thou in all the plain. Run to the mountain. Do not stop.',
};
const G5_SALT: StoryPart = {
  h: 'But his wife looked back from behind him.',
  p: 'She was following him out, a few steps behind. She turned, looked back toward the city, and **became a pillar of salt**, as if still facing the way she had come.',
  art: ['scene', { k: 'g5-salt' }],
  dx: 'Lot reached the little town of Zoar as the sun rose, and fire fell on the cities of the plain. His wife had been behind him, still on the road out. And then, the story says, she looked back from behind him, and she **became a pillar of salt**. That is all Genesis tells us: one line, one look. She never reached safety. She stood there, turned toward everything she had left, as if she had never really left it.',
};
const G5_LUKE: StoryPart = {
  h: 'Centuries later, Jesus said three words about her.',
  p: 'Teaching about the last days, He said only: **Remember Lot’s wife.** It is one of the shortest verses in the Bible. He expected people to know what it meant.',
  art: ['scene', { k: 'g5-three' }],
  fact: { s: 'Scripture · Luke 17:32', i: [1] },
  dx: 'Many hundreds of years after Genesis was written, Jesus was teaching about the day when people would have to leave everything quickly. On that day, He said, let the one on the housetop not go down for his things, and let the one in the field not turn back. Then three words: **Remember Lot’s wife.** It is one of the shortest verses in the whole Bible. He did not explain it. He trusted His hearers to know the story and to ask themselves what she had done wrong.',
};
const G5_ASK: StoryPart = {
  k: 'ask',
  h: 'When you look back at a hard day, which kind of look is it?',
  o: [
    ['Replaying it and feeling worse', 'Many people look back that way. The next card names another way.'],
    ['Missing it, a little', 'That is honest, and it is the look this story is about.'],
    ['Looking for what led there', 'Hold on to that look. It is the one that helps.'],
    ['I do not look back at all', 'That is common. It often feels safer. Read on.'],
  ],
};
const G5_WANT: StoryPart = {
  h: 'An apostle, Jeffrey R. Holland, asked what her mistake was.',
  p: 'Not only that she looked, he said. **In her heart she wanted to go back.** She was not studying the past. She was longing for it, and that kept her there.',
  art: ['scene', { k: 'g5-longing' }],
  fact: { s: 'Talk · Holland, 2009', i: [2] },
  dx: 'Jeffrey R. Holland, an apostle of the Church of Jesus Christ of Latter-day Saints, gave a whole talk to students on those three words. What was wrong with Lot’s wife? It was not just that she looked back, he said. **In her heart she wanted to go back.** She was already missing the life she was being saved from. That is a different look from the one that learns. One look asks what happened, so it will not happen again. The other looks with longing, and it keeps a person standing on the road, facing the wrong way.',
};
const G5_WANT_C: StoryPart = {
  ...G5_WANT,
  h: 'A church leader, Jeffrey R. Holland, asked what her mistake was.',
  dx: 'Jeffrey R. Holland, a church leader and teacher, gave a whole talk to students on those three words. What was wrong with Lot’s wife? It was not just that she looked back, he said. **In her heart she wanted to go back.** She was already missing the life she was being saved from. That is a different look from the one that learns. One look asks what happened, so it will not happen again. The other looks with longing, and it keeps a person standing on the road, facing the wrong way.',
};
const G5_EMBERS: StoryPart = {
  h: 'The past is to be learned from, Holland said, not lived in.',
  p: 'Look back to claim **the embers, not the ashes**. Take what still gives light, what you learned, and leave the rest where it fell.',
  art: ['scene', { k: 'g5-embers' }],
  fact: { s: 'Talk · Holland, 2009', i: [2] },
  dx: 'Holland did not say never look back. Memory is how we learn. The past is to be learned from, he said, but not lived in. When we look back, we look to claim **the embers, not the ashes**: the warm, glowing things worth carrying forward, and the lessons that still give light. The ashes are what is left of the burned things, and there is no warmth in them. Sifting through them for hours, again and again, does not make anyone wiser. It only keeps them by the fire that already went out.',
};
const G5_FORGET: StoryPart = {
  long: 1,
  h: 'Then he asked for something harder than forgiving.',
  p: 'Forgive, he said, and then forget. **When it comes to mind again, forget it again.** Remember just enough to keep from repeating it.',
  art: ['scene', { k: 'g5-shovel' }],
  fact: { s: 'Talk · Holland, 2009', i: [2] },
  dx: 'Holland said many people are harder on themselves than on anyone else. They dig up old mistakes, with a pail and a shovel, and go over them again. So he asked for something harder than forgiving: forget. **When it comes to mind again, forget it again.** Not forget in the sense of pretending it never happened. Remember just enough to avoid repeating the mistake, he said, and let the rest go. Replaying a slip for an hour feels like taking it seriously. It is not the same as learning from it.',
};
const G5_PSALM: StoryPart = {
  long: 1,
  h: 'David prayed to be searched, and said what the searching was for.',
  p: 'Search me, O God, and know my heart, he prayed. Then he finished: **and lead me in the way everlasting**. He was not asking for a verdict. He was asking to be led.',
  art: ['scene', { k: 'g5-lamp' }],
  fact: { s: 'Scripture · Psalm 139:23-24', i: [3] },
  dx: 'Psalm 139 is a prayer to a God who sees everything, even the dark, for the night shineth as the day to Him. At the end of it, David does a brave thing. He invites the looking. Search me, O God, and know my heart: try me, and know my thoughts, and see if there be any wicked way in me. And then the reason, in the same breath: **and lead me in the way everlasting**. The searching was for the leading. That is the look to bring to your own hard days: with God beside you, asking to be shown, so that you can be led somewhere better.',
};
const G5_END: StoryPart = {
  h: 'So open your log the way you would ask to be shown.',
  p: 'Not to replay it, and not to miss it. Look for **the embers**: what came just before, what you were feeling, what helped. One thing seen, and one step next.',
  art: ['scene', { k: 'g5-log' }],
  dx: 'Many people never look back at their hard days, because every look feels like reading charges against themselves. Others look and get stuck, replaying, or quietly missing it. Lot’s wife and Holland’s talk point to a third look. Open your log the way you would pray to be searched and led. Read one hard day. Look for **the embers**: what came just before it, what you were feeling, where you were, what helped even a little. Write down one thing you see and one step it points to. Then close the log and face the mountain.',
};

/* the plain voice: how pilots learned to look back at their mistakes */
const G5P_BEFORE: StoryPart = {
  h: 'For a long time, a pilot who made a mistake kept quiet about it.',
  p: 'A near miss, a wrong turn on a runway, a step skipped on a checklist. Saying it out loud could cost a career. So **the same mistakes kept happening** in other cockpits.',
  art: ['scene', { k: 'g5-cockpit' }],
  dx: 'Every pilot makes small mistakes: misreading an instruction, turning onto the wrong taxiway, skipping a step when tired. Most come to nothing. But for many years, a pilot who made one had every reason to keep quiet. Telling meant an investigation, maybe a penalty, maybe the end of flying. So the mistake stayed with the one pilot who made it, and nobody else learned from it. And because the same runways confused everyone, and the same tired hours wore on every crew, **the same mistakes kept happening** in cockpit after cockpit.',
};
const G5P_1976: StoryPart = {
  h: 'In 1976, a new kind of looking back began.',
  p: 'NASA set up a place where pilots could report their own mistakes. Report an honest mistake within ten days, and you were generally **protected from penalty**. The report asked what happened, not who was to blame.',
  art: ['scene', { k: 'g5-report' }],
  fact: { s: 'Program · NASA Aviation Safety Reporting System', i: [0] },
  dx: 'In 1976, NASA began running a reporting system for the whole of American flying, paid for by the government agency that makes the rules. Any pilot, controller or mechanic could send in a report of a mistake or a close call. If it was an honest mistake, not a crime or an accident, and the report came in within ten days, the person was generally **protected from penalty**. The form did not ask how bad you were. It asked what happened, where, what came just before, and what might have helped. Names were taken off. The point was not to judge one pilot. It was to see the pattern.',
};
const G5P_ASK: StoryPart = {
  k: 'ask',
  h: 'When you look back at a hard day, what do you usually find?',
  o: [
    ['Proof of how bad I am', 'That is the old way of looking. Watch what the new way found.'],
    ['What went wrong, but nothing to do about it', 'Then you are halfway there. The pattern is the next step.'],
    ['Something that came just before it', 'Many pilots found that too.'],
    ['I do not look back', 'That is how flying worked for years. Read on.'],
  ],
};
const G5P_REPORTS: StoryPart = {
  h: 'Today more than a hundred thousand reports come in a year.',
  p: 'Read together, they show **patterns no single pilot could see**: the runway where crews keep turning wrong, the step people skip when they are tired. Then the runway gets a new sign.',
  art: ['scene', { k: 'g5-map' }],
  fact: { s: 'Program · NASA Aviation Safety Reporting System', i: [0] },
  dx: 'Pilots used it. By now more than two million reports have come in, and more than a hundred thousand arrive every year. One report about one wrong turn tells you little. A hundred reports about the same corner of the same airport, at the same busy time, tell you that the corner is the problem, not the pilots. Read together, the reports show **patterns no single pilot could see**. Then something changes: a new sign on the runway, a clearer word on the radio, a step moved on the checklist. The look back was never a trial. It was a map.',
};
const G5P_SAFE: StoryPart = {
  long: 1,
  h: 'Flying became one of the safest ways to travel.',
  p: 'Many reasons went into that. People who study safety often name this one: **mistakes looked at without blame** turn into fixes, and mistakes hidden out of shame turn into repeats.',
  art: ['scene', { k: 'g5-plane' }],
  dx: 'Many things made flying as safe as it is now: better planes, better training, better radar. But people who study safety keep coming back to the reports. When **mistakes looked at without blame** are gathered and read, they turn into fixes before anyone is hurt. When mistakes are hidden out of shame or fear, they turn into repeats. Hospitals and other fields have copied the idea. It is the same with a habit. The hard day you will not look at is the one most likely to happen again.',
};
const G5P_GOD: StoryPart = {
  h: 'God looks at a person with mercy, and His looking is for leading.',
  p: 'So a look back with Him is the pilot’s report, not a trial. **What happened, where, and what came just before?** You can ask Him to show you, and trust that the looking is for leading.',
  art: ['scene', { k: 'g5-lamp' }],
  dx: 'Many people look back at their hard days as if before a harsh judge, and so they stop looking. But God sees a person with mercy, and when He shows people their faults, it is to lead them on. So you can look back with Him, the way a pilot fills in a report. **What happened, where, and what came just before?** What was I feeling? What would have helped? Asked that way, the look back becomes a prayer to be shown, and what you are shown becomes the next step.',
};
const G5P_END: StoryPart = {
  h: 'So open your log, read one hard day, and write one fix.',
  p: 'Not to replay it. To find the corner where things turn: the feeling, the place, what came just before. **One thing seen, and one change next.**',
  art: ['scene', { k: 'g5-log' }],
  dx: 'Your log is your own reporting system. Open it the way a pilot would, with no penalty waiting. Pray first, if you like: show me what I need to see. Read one hard day. Look for the corner where things turned: what you were feeling, where you were, what came just before, what helped even a little. Then write it down. **One thing seen, and one change next**, like a new sign on the runway. Then close the log. You were not there to be judged. You were there to be shown the way.',
};

/* ---------- g6, Confession is for healing (step 6, Tell one person) ---------- */

const G6_CROWD: StoryPart = {
  h: 'In Capernaum, a house was so full that no one else could get in.',
  p: 'Word had spread that Jesus was there. People packed the room and the doorway, until there was **no room to receive them, no, not so much as about the door**.',
  art: ['scene', { k: 'g6-crowd' }],
  fact: { s: 'Scripture · Mark 2:1-12', i: [0] },
  dx: 'Jesus had come back to Capernaum, the fishing town by the lake, and it was noised that he was in the house. So many people gathered that there was **no room to receive them, no, not so much as about the door**, Mark says. The room was full, the doorway was full, and people stood outside straining to hear Him preach. If you could walk, you might have pushed your way in. If you could not walk, you had no chance.',
};
const G6_FOUR: StoryPart = {
  h: 'Four friends came, carrying a man who could not walk.',
  p: 'He lay on a mat, sick of the palsy, **borne of four**: a friend at each corner. They could not get anywhere near the door.',
  art: ['scene', { k: 'g6-four' }],
  dx: 'Then four men came up the street carrying a fifth. He was sick of the palsy, Mark says, unable to move, lying on a mat. He was **borne of four**: one friend at each corner, taking the weight he could not carry. Whatever he wanted, he could not get it by himself. He could not walk to the house, and now that they had brought him, he could not get through the crowd. The door was shut by people. Most would have turned around.',
};
const G6_ROOF: StoryPart = {
  h: 'So they climbed up and opened the roof.',
  p: 'They **uncovered the roof where he was**, broke it up, and let the mat down by ropes into the middle of the room, right in front of Jesus.',
  art: ['scene', { k: 'g6-roof' }],
  dx: 'They did not turn around. They carried him up onto the flat roof, the way you could in houses there, and **uncovered the roof where he was**. They dug through it, broke it up, and lowered the mat with their friend on it down through the hole, right into the middle of the crowd, in front of Jesus. It must have been noisy and dusty and embarrassing. Everyone in the room watched a man come down from the ceiling. He could not have done any of it alone.',
};
const G6_ASK: StoryPart = {
  k: 'ask',
  h: 'If you could not get there alone, who would you let carry a corner?',
  o: [
    ['A friend I trust', 'Then that may be the person this lesson points to.'],
    ['A faith leader', 'That is often a safe first corner.'],
    ['A counselor or a group', 'People who know this road are good at carrying.'],
    ['No one yet', 'That is honest. Look at whose faith counted in the story.'],
  ],
};
const G6_FAITH: StoryPart = {
  h: 'When Jesus saw their faith, He spoke to the man on the mat.',
  p: 'Not his faith alone. **Their faith**, the four on the roof. Son, He said, thy sins be forgiven thee. Then: arise, and take up thy bed.',
  art: ['scene', { k: 'g6-faith' }],
  dx: 'Mark says: when Jesus saw **their faith**, he said unto the sick of the palsy, Son, thy sins be forgiven thee. Look at whose faith He saw. Not only the man on the mat, who could do nothing but lie there and be carried. The four friends who carried him and tore open a roof. Their faith counted for him. And the first thing Jesus spoke to him was not about his legs at all. It was forgiveness. Then He told him to rise and carry his own bed home, and the man walked out through the crowd that had blocked him.',
};
const G6_COWLEY: StoryPart = {
  long: 1,
  h: 'An apostle, Matthew Cowley, spoke of having faith in someone else’s faith.',
  p: 'A mother called him to a hospital where her son lay unconscious, very sick with polio. Cowley blessed him **having faith in his faith**. He leaned on a faith that was not his own.',
  art: ['scene', { k: 'g6-lean' }],
  fact: { s: 'Talk · Cowley, 1953', i: [1] },
  dx: 'Matthew Cowley, an apostle of the Church of Jesus Christ of Latter-day Saints, told students about a mother who called him to a hospital where her young son lay unconscious, very sick with polio. Cowley brought along a young bishop whose faith, he said, was greater than his own, and gave the boy a blessing **having faith in his faith**. A week or so later the boy was awake, thanking him and asking for another. Cowley did not promise that every story ends that way, and neither does this lesson. What he showed is how faith works between people. When your own feels thin, you can lean on the faith of someone who believes for you, until yours grows strong enough to stand.',
};
const G6_JAMES: StoryPart = {
  long: 1,
  h: 'James wrote that confession goes both ways, and so does the praying.',
  p: '**Confess your faults one to another**, and pray one for another, that ye may be healed. Not one person on trial before another. Two people, honest, both being helped.',
  art: ['scene', { k: 'g6-two' }],
  fact: { s: 'Scripture · James 5:16', i: [2] },
  dx: 'James wrote to believers who were sick and struggling, and his counsel was plain: **confess your faults one to another**, and pray one for another, that ye may be healed. Look at the shape of it. One to another. One for another. Nobody in James’s picture sits as judge. Each person is honest with the other, and each prays for the other, and the point of it all is in the last words: that ye may be healed. Telling is not a trial. It is how the mat gets carried.',
};
const G6_BISHOP: StoryPart = {
  long: 1,
  h: 'A bishop is there to help carry, not to punish.',
  p: 'The Church’s handbook says that for pornography, **private counsel with the bishop is usually enough**, sometimes with informal limits for a time, and a council is not usually held. He is there to help you come to the Savior.',
  art: ['scene', { k: 'g6-bishop' }],
  fact: { s: 'Guidance · General Handbook, chapter 32', i: [3] },
  dx: 'Many people dread telling their bishop because they picture a court. The Church’s own General Handbook pictures something else. It says that for pornography, **private counsel with the bishop is usually enough**, sometimes with informal limits for a while, such as not taking the sacrament for a time, and that a membership council is not usually held. His role is to help a person come to the Savior and heal. Limits like these are part of healing, not a sentence. Talking with him is encouraged, and when you go is your choice. The Church’s recovery meetings are another place to say the truth among people who know this road, open to anyone, in person and online. Both are four friends at the corners of a mat.',
};
const G6_END: StoryPart = {
  h: 'So telling one person is handing them a corner of the mat.',
  p: 'You do not have to carry this through the crowd alone, and you do not have to tell everything. **One true sentence to one safe person** lets them lift.',
  art: ['scene', { k: 'g6-corner' }],
  dx: 'Most people carry this alone for years because they picture telling as standing before a judge. The story in Capernaum is a different picture. A man who could not get there by himself, four people who would not let a crowd stop them, a roof torn open, and a Savior who saw their faith and forgave. Telling one person is not putting yourself on trial. It is handing someone a corner of the mat. You do not have to say everything. **One true sentence to one safe person** is enough for them to lift, and for the healing to start.',
};

/* the plain voice: the hill that looked less steep with a friend */
const G6P_HILL: StoryPart = {
  h: 'Researchers stood students at the bottom of a steep hill with a heavy backpack.',
  p: 'Then they asked one question: **how steep is this hill?** Some students were there alone. Others happened to be standing with a friend.',
  art: ['scene', { k: 'g6-hill' }],
  fact: { s: 'Study · 34 students · Schnall and colleagues, 2008', i: [0] },
  dx: 'At the University of Virginia, a team of psychologists stopped students walking past a steep hill on campus. Each one put on a heavy backpack, stood at the bottom and looked up. Then the researchers asked: **how steep is this hill?** The students gave an estimate in degrees, and set a tilting board to match it. Some of them had come along alone. Others were walking with a friend, who stood a few steps away, silent, facing the other way. The friend did not carry the pack, look at the hill or say a word.',
};
const G6P_GUESS: StoryPart = {
  k: 'guess',
  h: 'Which students judged the same hill to be less steep?',
  o: [
    ['The ones standing alone', 'It seems fair: nobody to impress. It went the other way.'],
    ['The ones with a friend beside them', 'Yes. And the next card shows how far it went.'],
  ],
  a: 1,
};
const G6P_FOUND: StoryPart = {
  h: 'With a friend beside them, the hill looked less steep.',
  p: 'Same hill, same backpack. And **the longer they had known the friend**, the gentler the hill looked to them.',
  art: ['scene', { k: 'g6-friend' }],
  fact: { s: 'Study · 34 students · Schnall and colleagues, 2008', i: [0] },
  dx: 'The students with a friend beside them judged the hill to be noticeably less steep than the students who stood alone. The hill had not changed, and neither had the weight on their backs. Only the company had. And there was more: **the longer they had known the friend**, the less steep the hill looked to them. A hard climb, it seems, is partly measured by whether you face it alone. With someone beside you, the same climb looks like something you can do.',
};
const G6P_PICTURE: StoryPart = {
  long: 1,
  h: 'In a second study, only picturing a supportive person did it too.',
  p: 'Students who first thought of someone who supported them saw the hill as less steep than those who pictured someone neutral, or **someone who had let them down**.',
  art: ['scene', { k: 'g6-picture' }],
  fact: { s: 'Study · 36 students · Schnall and colleagues, 2008', i: [0] },
  dx: 'The team ran a second study in England, with students who stood alone at the bottom of a hill. Before they looked up, each was asked to spend a few minutes picturing one person: someone who supported them, someone neutral, or **someone who had let them down**. The ones who pictured a supportive person judged the hill to be less steep than the others. The feeling of being close to someone was what made the difference. Even the memory of a person who is on your side changes how hard a hard thing looks.',
};
const G6P_TELL: StoryPart = {
  h: 'Telling another person is for healing, not punishment.',
  p: 'The friend on the hill said nothing and was told nothing. Telling one person gives them the chance to stand there. **It asks someone to stand at the bottom of the hill with you.**',
  art: ['scene', { k: 'g6-two' }],
  dx: 'Many people carry this alone for years because they picture telling as a trial, with one person judging and the other condemned. Many faiths teach something very different: that confessing to another person is for healing, and that two people being honest with each other and praying for each other is how healing comes. The hill study shows part of why. Telling one person is **asking someone to stand at the bottom of the hill with you**. The friend in the study did not even know what the climb was. Someone who knows can do more. They do not carry your pack. But the climb stops looking impossible.',
};
const G6P_END: StoryPart = {
  h: 'So pick one safe person, and tell them one true sentence.',
  p: 'You do not have to tell everything. **One sentence lets someone stand beside you**, and it often goes both ways: the person you tell may have a hill of their own.',
  art: ['scene', { k: 'g6-corner' }],
  dx: 'You do not need to tell your whole story, and you do not need to tell everyone. Pick one person who is safe: a friend, a faith leader, a counselor. Say one true sentence, not the whole history. Ask them to pray for you, or just to stand beside you, and offer the same back. Often it goes both ways: the person you tell may have a hill of their own, and your honesty helps them climb too. **One sentence lets someone stand beside you**, and a hill with company is a different hill.',
};

/* ---------- g7, Built for coming back (step 7, Get up faster) ---------- */

const G7_DENY: StoryPart = {
  h: 'On the night Jesus was arrested, Peter warmed himself at a fire.',
  p: 'He had followed at a distance into the high priest’s courtyard. Three times someone said he had been with Jesus. Three times he denied it. The first time: **I know him not**.',
  art: ['scene', { k: 'g7-fire' }],
  fact: { s: 'Scripture · Luke 22:54-62 · John 18:18', i: [0] },
  dx: 'Only hours before, Peter had promised he would go with Jesus to prison and to death. Then the soldiers came, and Peter followed at a distance, into the courtyard of the high priest. It was cold, and the servants had made a fire of coals, and Peter stood with them and warmed himself. A servant girl looked at him in the firelight and said, this man was with Him. **I know him not**, Peter said. A little later, another. Then, an hour after, a third, sure of it because Peter was a Galilean. And three times Peter said he did not know the One he had followed for three years.',
};
const G7_LOOK: StoryPart = {
  h: 'The rooster crowed, and the Lord turned and looked at him.',
  p: 'Jesus had told him this would happen. Now, across the courtyard, **the Lord turned, and looked upon Peter**. Peter went out, and wept bitterly.',
  art: ['scene', { k: 'g7-look' }],
  dx: 'While Peter was still speaking the third time, the rooster crowed. Luke adds one line no other telling has: **the Lord turned, and looked upon Peter**. Jesus, a prisoner in that house, turned to look at the friend who had just denied Him. Then Peter remembered the words: before the rooster crows, thou shalt deny me thrice. He went out into the dark, and wept bitterly. Anyone who has slipped right after promising they never would knows that walk out of the courtyard.',
};
const G7_FISH: StoryPart = {
  h: 'After the cross, Peter went back to his old life.',
  p: 'I go a fishing, he told the others, and they went with him. They worked all night on the lake where he had first been called, and **they caught nothing**.',
  art: ['scene', { k: 'g7-boat' }],
  fact: { s: 'Scripture · John 21:1-17', i: [1] },
  dx: 'Jesus was crucified, and rose, and still Peter did not know where he stood. So he did what people do after a fall. He went back to what he knew before. I go a fishing, he said, and six of the others went with him, back to the Sea of Galilee, back to the boats and the nets of the life Jesus had once called him out of. They fished all night, and **they caught nothing**. The old life did not even give him back what it used to.',
};
const G7_ASK: StoryPart = {
  k: 'ask',
  h: 'After a hard fall, what do you tend to go back to?',
  o: [
    ['The habit itself, since it is already ruined', 'That is the old boat. Watch what happened next on the lake.'],
    ['Hiding, until I feel better', 'Many people do. Peter was about to do something else.'],
    ['Working twice as hard to make up for it', 'That is common too. Look at what Peter was given instead.'],
    ['I do not know yet', 'That is honest. Keep it in mind for the next card.'],
  ],
};
const G7_SEA: StoryPart = {
  h: 'At dawn a man on the shore called to them. Peter jumped into the sea.',
  p: 'When John said **It is the Lord**, Peter did not wait for the boat to row in. He pulled on his coat and threw himself into the water to get there first.',
  art: ['scene', { k: 'g7-swim' }],
  dx: 'As the sun came up, a man stood on the shore and called out: cast the net on the right side of the ship. They did, and the net was so full they could not haul it in. The disciple whom Jesus loved said to Peter, **It is the Lord**. And Peter, the one who had denied Him three times, did not hang back. He did not wait for the boat to row the hundred yards in, or rehearse what he would say. He wrapped his fisher’s coat around him and threw himself into the sea, to get to Jesus faster. The other disciples came after, dragging the net.',
};
const G7_SHORE: StoryPart = {
  h: 'On the shore was a fire of coals, with fish and bread on it.',
  p: 'The last time Peter stood at a fire of coals, he denied Him. Now **Jesus had made breakfast**. Come and dine, He said.',
  art: ['scene', { k: 'g7-shore' }],
  dx: 'When they came to land, they saw **a fire of coals there, and fish laid thereon, and bread**. Jesus had made breakfast. John is careful with his words, and he uses that same phrase, a fire of coals, only twice in his whole gospel: once in the courtyard where Peter denied Him, and once here. Come and dine, Jesus said, and He took the bread and gave it to them, and the fish. No speech first. No list of what Peter had done. A meal by the same kind of fire, made by the One he had failed.',
};
const G7_THREE: StoryPart = {
  h: 'Three times Jesus asked him, Lovest thou me?',
  p: 'One question for each denial. Three times Peter said yes, and three times Jesus gave him work: **Feed my sheep**. Not a probation. A place.',
  art: ['scene', { k: 'g7-three' }],
  dx: 'After they had eaten, Jesus turned to Peter. Simon, son of Jonas, lovest thou me more than these? Yea, Lord, Peter said, thou knowest that I love thee. Feed my lambs. A second time, the same question, the same answer. Feed my sheep. And a third time, and Peter was grieved that He asked a third time, and said, Lord, thou knowest all things, thou knowest that I love thee. One question for each denial, each one undoing one. And each time Jesus answered with work to do: **Feed my sheep**. He did not put Peter on probation until he had earned his place back. He handed him his place.',
};
const G7_SKI: StoryPart = {
  long: 1,
  h: 'An apostle, Dieter F. Uchtdorf, once fell on a ski slope and could not get up.',
  p: 'He tried every trick and could not stand. His 12-year-old grandson took his hand and said firmly, **Opa, you can do it now!** And he stood.',
  art: ['scene', { k: 'g7-ski' }],
  fact: { s: 'Talk · Uchtdorf, 2013', i: [4] },
  dx: 'Dieter F. Uchtdorf, an apostle of the Church of Jesus Christ of Latter-day Saints, told of skiing with his 12-year-old grandson. He hit an icy spot and made, as he put it, a glorious crash landing on a steep slope. He was not hurt. But he tried every trick he knew and could not stand, and he began to wonder what it would take to rescue him. His grandson skied over. He did not listen to his grandfather’s explanations of why it could not be done. He looked him in the eyes, took his hand and said, **Opa, you can do it now!** And instantly, Uchtdorf said, he stood. Our destiny, he told the Church, is not set by the number of times we stumble, but by the number of times we rise up, dust ourselves off and move forward.',
};
const G7_OFT: StoryPart = {
  long: 1,
  h: 'Moroni wrote that in the church of his day, people were forgiven as often as they turned back.',
  p: '**As oft as they repented** and sought forgiveness, with real intent, they were forgiven. Not once. As often as they came.',
  art: ['scene', { k: 'g7-path' }],
  fact: { s: 'Scripture · Moroni 6:8', i: [3] },
  dx: 'Near the end of the Book of Mormon, Moroni describes how the church of his day worked. They met together often, he wrote, to pray and to take the bread and wine in remembrance of the Lord. And the way back was always open. **As oft as they repented** and sought forgiveness, with real intent, they were forgiven. As often as. Church each week carries the same promise: a fresh start built into every week.',
};
const G7_SEVEN: StoryPart = {
  long: 1,
  h: 'Proverbs says a just man falls seven times.',
  p: '**A just man falleth seven times, and riseth up again.** The good man in that verse is not the one who never falls. He is the one who gets up.',
  art: ['scene', { k: 'g7-rise' }],
  fact: { s: 'Scripture · Proverbs 24:16', i: [2] },
  dx: 'It is easy to read past it. **A just man falleth seven times, and riseth up again.** The verse does not describe a wicked man who falls seven times. It describes a just one, a good man, and it takes for granted that he will fall, and fall again. What makes him just is the second half of the line: he rises. The prophet Micah said the same in his own words: when I fall, I shall arise. Falling is not what decides who you are. Rising is.',
};
const G7_END: StoryPart = {
  h: 'So after a slip, do not wait in the boat until you feel worthy.',
  p: 'Peter had failed Him three times, and he was the first one into the water. **Swim to Him now, as you are.** The way back was built to be used.',
  art: ['scene', { k: 'g7-swim' }],
  dx: 'After a slip, the voice that sounds humble says: wait. Stay in the boat. Go back to the old nets for a while. Come back when you have earned it. Peter had more reason than anyone to wait. He had denied Jesus to His face, three times, on the worst night. And when he saw Him on the shore, he was the first one into the water. Jesus met him with breakfast and three chances to say yes, and then work to do. **Swim to Him now, as you are.** The way back was not built for people who never fall. It was built for this.',
};

/* the plain voice: a grandfather on a ski slope, and a hand held out */
const G7P_SKI: StoryPart = {
  h: 'A grandfather went skiing with his grandson and fell hard on a steep slope.',
  p: 'Dieter Uchtdorf, once an airline captain and later a church leader, hit an icy spot and made, as he put it, **a glorious crash landing**. He was not hurt.',
  art: ['scene', { k: 'g7-ski' }],
  fact: { s: 'Talk · Uchtdorf, 2013', i: [0] },
  dx: 'Dieter Uchtdorf had flown airliners for a living before he became a church leader, and he told this story on himself. He was skiing with his 12-year-old grandson, enjoying the day, when he hit an icy spot and made, as he put it, **a glorious crash landing** on a steep slope. He was not hurt. Only his pride was bruised, and he hoped the other skiers would not recognize him under his helmet and goggles.',
};
const G7P_STUCK: StoryPart = {
  h: 'He tried every trick he knew to stand up, and could not.',
  p: 'On a steep slope, tangled in his skis, every push slid him back. He began to wonder **what it would take to rescue him**.',
  art: ['scene', { k: 'g7-stuck' }],
  dx: 'He tried to get up. He tried every trick an experienced skier knows. On a slope that steep, tangled the way he was, nothing worked. Every effort slid him back. He was not injured, and that made it stranger. He had the strength, and still he could not stand. He lay there and began to wonder **what it would take to rescue him**. Anyone who has slipped and then stayed down knows that feeling: not hurt beyond help, and yet unable to get up.',
};
const G7P_ASK: StoryPart = {
  k: 'ask',
  h: 'After a slip, what keeps you down the longest?',
  o: [
    ['Feeling I have ruined everything', 'That one keeps many people down. Watch what got him up.'],
    ['Being ashamed to face anyone', 'He felt that too. He hoped no one would know him. Watch what happened.'],
    ['Thinking I will only fall again', 'That is a heavy thought. Watch what changed on the slope.'],
    ['I get up fairly fast', 'Then keep that. It is a strength.'],
  ],
};
const G7P_HAND: StoryPart = {
  h: 'His grandson skied over, took his hand and said: you can do it now.',
  p: 'The boy did not listen to the reasons he could not stand. He looked him in the eyes, took his hand, and said firmly, **Opa, you can do it now!** And instantly, he stood.',
  art: ['scene', { k: 'g7-hand' }],
  dx: 'His grandson came over. Uchtdorf started explaining why he could not get up. The boy did not listen to any of it. He looked his grandfather in the eyes, reached out, took his hand, and said in a firm voice, **Opa, you can do it now!** And instantly, Uchtdorf said, he stood. Nothing about the slope had changed. What changed was a hand held out, and someone who did not accept that he had to stay down.',
};
const G7P_RISE: StoryPart = {
  long: 1,
  h: 'What decides where you end up, he said, is how often you rise.',
  p: 'Not **the number of times we stumble**, but the number of times we rise up, dust ourselves off and move forward. Guilt that keeps you down is not helping you change.',
  art: ['scene', { k: 'g7-rise' }],
  fact: { s: 'Talk · Uchtdorf, 2013', i: [0] },
  dx: 'He drew two lessons from the slope. The first: where we end up is not decided by **the number of times we stumble**, but by the number of times we rise up, dust ourselves off and move forward. The second was about the feeling after a fall. There is a sorrow, he said, that leads to change and hope, and a sorrow that leads to despair. Real turning back is about being changed, not tortured. When guilt turns into hating yourself, or keeps you from rising again, it is getting in the way of your change, not helping it.',
};
const G7P_GOD: StoryPart = {
  h: 'God does not keep count of how many times you have fallen.',
  p: 'For many believers, mercy is not a supply that runs out. **The way back opens every time you turn**, as often as you need it, the way a hand reaches down every time.',
  art: ['scene', { k: 'g7-path' }],
  dx: 'The grandson did not count how many times his grandfather had fallen that day. He held out his hand. Shame pictures God keeping a running count, with the door closing a little each time. The faiths that speak of mercy picture something else: a way back that opens every time a person turns, without a limit. **The way back opens every time you turn.** Coming back again and again, for the same thing, is not failing at faith. It is what turning back looks like, and the hand that reaches down to you does not get tired of reaching.',
};
const G7P_END: StoryPart = {
  h: 'So after a slip, take the hand and stand up now.',
  p: 'Do not lie on the slope until you feel you have earned the right to stand. **You can do it now.** Pray one sentence, take the next step, and let someone help you up.',
  art: ['scene', { k: 'g7-hand' }],
  dx: 'After a slip, the voice that sounds humble says: stay down a while. Wait until you feel worthy. Come back when you have earned it. That voice is the slope talking. The grandson did not wait for his grandfather to feel ready. He held out his hand and said the words. God does the same. **You can do it now.** Pray one sentence as you are, take the next good step, and if you can, let one person take your hand. The way back was built for this.',
};

/* ---------- g8, Tempted is not fallen (step 8, Ride it better) ---------- */

const G8_WILD: StoryPart = {
  h: 'After His baptism, Jesus went alone into the wilderness.',
  p: 'He fasted forty days and forty nights, and **he was afterward an hungred**. That is when the tempter came: when He was hungry, tired and alone.',
  art: ['scene', { k: 'g8-desert' }],
  fact: { s: 'Scripture · Matthew 4:1-11', i: [0] },
  dx: 'Matthew says the Spirit led Jesus into the wilderness after His baptism, into the dry hills, alone. He fasted forty days and forty nights, and then the plainest line in the story: **he was afterward an hungred**. Not at the start, when He was strong. Afterward, worn down, with no one beside Him. That is when the tempter came. The pull did not wait for a good moment. It came at the weakest one, the way it often comes to us.',
};
const G8_THREE: StoryPart = {
  h: 'Three pulls came, each aimed where He was weakest.',
  p: 'Turn these stones to bread. Throw yourself down and prove who you are. Bow, and have the world. **Each one sounded reasonable** to someone hungry and alone.',
  art: ['scene', { k: 'g8-stones' }],
  dx: 'The first pull was aimed at the hunger: if thou be the Son of God, command that these stones be made bread. The second was aimed at doubt, on the pinnacle of the temple: throw thyself down, and prove it. The third offered everything at once: all the kingdoms of the world, if thou wilt fall down and worship me. **Each one sounded reasonable**, in its moment, to someone hungry and alone. That is how pulls work. They do not arrive sounding evil. They arrive sounding reasonable.',
};
const G8_WRITTEN: StoryPart = {
  h: 'Each time, He answered in a few words: It is written.',
  p: 'He did not argue for an hour or try to win the debate. **A few true words, and He let it go.** Then the tempter left Him, and angels came and ministered unto Him.',
  art: ['scene', { k: 'g8-angels' }],
  dx: 'Each time, Jesus answered the same way: It is written. Man shall not live by bread alone. Thou shalt not tempt the Lord thy God. Thou shalt worship the Lord thy God, and him only. **A few true words, and He let it go.** He did not argue at length, or try to prove the pull wrong, or wait for it to stop being loud before He spoke. And then the line that ends the story: the devil leaveth him, and, behold, angels came and ministered unto him. The pull was real, and it passed, and help came.',
};
const G8_ASK: StoryPart = {
  k: 'ask',
  h: 'When a strong pull comes, what do you feel about yourself?',
  o: [
    ['Guilty, as if I already did it', 'That feeling counts the pull as a fall. Look at where He stood.'],
    ['Far from God, as if He stepped back', 'That one hurts the most. Look at where He stood.'],
    ['Weak, as if others never feel this', 'Almost everyone feels pulls they would not choose.'],
    ['I do not know yet', 'That is honest. Notice it the next time one comes.'],
  ],
};
const G8_HEB: StoryPart = {
  h: 'Hebrews says He was tempted in every way we are, yet without sin.',
  p: '**In all points tempted like as we are, yet without sin.** He felt the pull, fully. Being tempted did not make Him less. It does not make you guilty.',
  art: ['scene', { k: 'g8-wave' }],
  fact: { s: 'Scripture · Hebrews 4:15', i: [1] },
  dx: 'The letter to the Hebrews says it plainly. We do not have a high priest who cannot be touched with the feeling of our weakness. He was **in all points tempted like as we are, yet without sin**. Read that slowly. He was tempted, and He was without sin, in the same sentence. So the two are not the same thing. The pull is not the fall. Feeling it, even feeling it hard, hungry and alone, does not make you guilty, and it does not mean God has stepped back. It is the very place He has stood Himself.',
};
const G8_THIEVES: StoryPart = {
  long: 1,
  h: 'An apostle, Jeffrey R. Holland, compared unwanted thoughts to thieves at the door.',
  p: 'They **seek entrance**, he said, but we do not have to open the door, serve them tea and crumpets, and then show them where the silverware is kept.',
  art: ['scene', { k: 'g8-door' }],
  fact: { s: 'Talk · Holland, 2010', i: [2] },
  dx: 'Jeffrey R. Holland, an apostle of the Church of Jesus Christ of Latter-day Saints, put it with a smile in general conference. Like thieves in the night, he said, unwelcome thoughts can and do **seek entrance** to our minds. That part is not up to us. But we do not have to throw open the door, serve them tea and crumpets, and then tell them where the silverware is kept. Throw the rascals out, he said, and put something better in their place: hopeful pictures, good memories, the faces of the people who love you. Let thoughts in by invitation only.',
};
const G8_BIRDS: StoryPart = {
  long: 1,
  h: 'Martin Luther once passed on an old saying to a friend weighed down by dark thoughts.',
  p: 'A wise man had said it, Luther wrote: **you cannot stop the birds from flying over your head**, but you can keep them from building a nest in your hair.',
  art: ['scene', { k: 'g8-birds' }],
  fact: { s: 'Letter · Luther to Weller, 1530', i: [3] },
  dx: 'In 1530, Martin Luther wrote to a young friend, Jerome Weller, who was sinking under heavy, unwanted thoughts and blaming himself for every one. Luther told him not to argue with them, and not to take them as proof of anything about himself. Then he passed on a saying from a wise man: **you cannot stop the birds from flying over your head**, but you can keep them from building a nest in your hair. A thought that passes over is not yours to answer for. What you do next is.',
};
const G8_TAF: StoryPart = {
  long: 1,
  h: 'Psychologists found many people feel that wanting it is as bad as doing it.',
  p: 'They called it **thought-action fusion**. It is a way of scoring thoughts, not a fact about them, and it adds guilt for things never done.',
  art: ['scene', { k: 'g8-scale' }],
  fact: { s: 'Study · Shafran, Thordarson & Rachman, 1996', i: [4] },
  dx: 'Researchers who studied anxiety kept meeting the same belief: that having an unwanted thought is morally the same as acting on it, or makes it more likely to happen. In 1996 Roz Shafran and her colleagues built a scale to measure it, and called it **thought-action fusion**. They found it strongest in people with obsessive worries, and found it in ordinary people too. It is a way of scoring thoughts, not a fact about them, and a way of scoring can change. Many people quitting a habit carry it without knowing: they feel the pull, decide they have already failed, and then wonder why not give in.',
};
const G8_END: StoryPart = {
  h: 'So when the pull comes, call it what it is: a pull, not a fall.',
  p: 'Answer it in a few true words, the way He did, and **let it pass over**. You are standing where He once stood, and He knows how to help.',
  art: ['scene', { k: 'g8-wave' }],
  dx: 'The next time the pull comes, and it comes hardest when you are hungry, tired and alone, remember the wilderness. Being tempted is not falling. It is not proof that you have failed, or that God has gone. Say a few true words, the way He did: this is a pull, and I do not have to follow it. You know this one, Lord. Then **let it pass over**, like a wave, or a bird. You are standing where He once stood, and because He stood there, He knows how to help you through it.',
};

/* the plain voice: the belief that a thought is as bad as a deed */
const G8P_TAF: StoryPart = {
  h: 'Psychologists studying anxiety kept meeting the same belief.',
  p: 'Many people felt that having an unwanted thought was **as bad as doing it**. In 1996, researchers built a scale to measure that belief, and gave it a name.',
  art: ['scene', { k: 'g8-scale' }],
  fact: { s: 'Study · Shafran, Thordarson & Rachman, 1996', i: [0] },
  dx: 'Therapists who treated anxious people kept hearing the same thing: I had a terrible thought, so I must be a terrible person. Or: if I think it, it is as good as done. In 1996, Roz Shafran, Dana Thordarson and Stanley Rachman built a set of questions to measure this belief, that a thought is **as bad as doing it**, and gave it a name: thought-action fusion. Thinking and doing, fused into one.',
};
const G8P_FOUND: StoryPart = {
  long: 1,
  h: 'They found it in ordinary people, not only in patients.',
  p: 'It was strongest in people with obsessive worries, and common in everyone else. **It is a way of scoring thoughts**, not a fact about them, and a way of scoring can change.',
  art: ['scene', { k: 'g8-door' }],
  fact: { s: 'Study · Shafran, Thordarson & Rachman, 1996', i: [0] },
  dx: 'The belief was strongest in people with obsessive worries, who could be tormented by a single unwanted image. But it showed up in ordinary people too. Many people quietly score their thoughts as if they were deeds. **It is a way of scoring thoughts**, not a fact about them. A thought arrives uninvited. Feeling a pull is not choosing it. Treating the two as one adds guilt for things never done, and for someone quitting a habit, that guilt is dangerous: if I have already failed by wanting it, why not give in?',
};
const G8P_ASK: StoryPart = {
  k: 'ask',
  h: 'When a strong pull comes, what do you feel about yourself?',
  o: [
    ['Guilty, as if I already did it', 'That is the belief the researchers named. It is a way of scoring thoughts, not a fact.'],
    ['Far from God, as if He stepped back', 'That one hurts the most. The next cards are about it.'],
    ['Weak, as if others never feel this', 'Almost everyone feels pulls they would not choose.'],
    ['I do not know yet', 'That is honest. Notice it the next time one comes.'],
  ],
};
const G8P_BIRDS: StoryPart = {
  h: 'An old saying, written down nearly five hundred years ago, puts it in one picture.',
  p: '**You cannot stop the birds from flying over your head**, but you can keep them from building a nest in your hair. A thought that passes over is not a deed.',
  art: ['scene', { k: 'g8-birds' }],
  dx: 'Long before psychologists had a name for it, people knew this belief and its weight. An old saying, written down in a letter nearly five hundred years ago to a young man sinking under unwanted thoughts, puts the answer in one picture. **You cannot stop the birds from flying over your head**, but you can keep them from building a nest in your hair. What flies over is not up to you. Whether you invite it to stay is.',
};
const G8P_GOD: StoryPart = {
  h: 'Being tempted is not falling, and it is not where God steps back.',
  p: 'For many believers, the moment of the pull is **the very place God is there to help**. You have not fallen. You are being pulled, and you are not alone in it.',
  art: ['scene', { k: 'g8-wave' }],
  dx: 'Think of the bird again. It flew over, and it was not invited to stay. Shame counts the pull as if it were the act, and then says God has gone. But being tempted and giving in are two different things. One is a feeling that comes to you. The other is a choice. For many believers, the moment of the pull is not the moment God looks away. It is **the very place God is there to help**: you are standing at the edge, and you have not fallen, and you can call on Him right there.',
};
const G8P_END: StoryPart = {
  ...G8_END,
  p: 'Name it in a few plain words, ask God for help in the moment, and **let it pass over**. A bird flying over is not a nest.',
  dx: 'The next time the pull comes, and it often comes hardest when you are hungry, tired and alone, call it what it is. This is a pull, not a fall. It does not make me guilty, and it does not mean God has gone. Say that in a few plain words, ask Him for help right then, and **let it pass over**, like a wave, or a bird crossing the sky. You do not have to win an argument with it. You only have to not invite it to stay.',
};

/* ---------- g9, Hungry for more (step 9, Fill the empty hour) ---------- */

const G9_WELL: StoryPart = {
  h: 'Tired from the road, Jesus sat down by a well in Samaria.',
  p: 'It was Jacob’s well, old and deep. A woman came to draw water, **alone, at the hottest part of the day**. Many readers think she came then to be left alone.',
  art: ['scene', { k: 'g9-well' }],
  fact: { s: 'Scripture · John 4:5-29', i: [0] },
  dx: 'Jesus was walking from Judea back to Galilee, through Samaria, and He was tired from the road, John says. So He sat on the edge of Jacob’s well, an old, deep well dug by the patriarch centuries before. His disciples had gone into the town to buy food. Then a woman came with her water pot, **alone, at the hottest part of the day**. Most women drew water together, in the cooler hours. Many readers think she came alone in the heat to be left alone, though John does not say.',
};
const G9_DRINK: StoryPart = {
  h: 'He asked her for a drink, and then offered her a different water.',
  p: 'Whosoever drinketh of this water, He said, **shall thirst again**. But the water I give will be a well springing up inside you.',
  art: ['scene', { k: 'g9-water' }],
  dx: 'Give me to drink, He said. She was startled. Jews and Samaritans did not share cups. But He kept talking, and turned it around: if you knew who was asking, you would have asked Him, and He would have given you living water. She pointed at the deep well and said He had nothing to draw with. Jesus answered: whosoever drinketh of this water **shall thirst again**. But the water that I shall give him shall be in him a well of water springing up into everlasting life. Not a bucket to come back to every day. A spring inside.',
};
const G9_ASK: StoryPart = {
  k: 'ask',
  h: 'When an empty feeling comes, what do you reach for to fill it?',
  o: [
    ['Something to numb it for a while', 'Many people reach for that. Watch what she found.'],
    ['Someone to feel close to', 'That is a true thirst. Keep it in mind.'],
    ['Anything to pass the time', 'That is common. The time passes, and the thirst comes back.'],
    ['I do not know yet', 'That is honest. Ask it the next time it comes.'],
  ],
};
const G9_KNEW: StoryPart = {
  h: 'He knew her whole story, and He did not send her away.',
  p: 'He spoke plainly about her life: the marriages behind her, the man she lived with now. **She was fully known, and still welcomed.** That is when she began to listen.',
  art: ['scene', { k: 'g9-known' }],
  dx: 'Then Jesus told her to go and call her husband. I have no husband, she said. That is true, He answered: you have had five, and the man you have now is not your husband. John never calls her a sinner, and neither does Jesus. He does not tell her what to fix. He tells her that He knows, and He does not leave. He went on talking with her about God, about worship, about what was coming, longer than with almost anyone else in John’s gospel. **She was fully known, and still welcomed.** The thing she had come at midday to avoid, being seen, turned out to be the thing she was most thirsty for.',
};
const G9_POT: StoryPart = {
  h: 'She left her water pot and ran into the town.',
  p: 'The thing she had come for, she **left her waterpot** behind, and went back into the town. Come, she told them, see a man who told me all things that ever I did.',
  art: ['scene', { k: 'g9-pot' }],
  dx: 'Then the woman **left her waterpot**, John says, and went her way into the city. The thing she had come for, the reason she had walked out alone in the heat, she left sitting by the well. She went back to the very town she had come out alone to escape, and said: come, see a man, which told me all things that ever I did. Is not this the Christ? Her deepest thirst had never been for water. When it was met, the old way of filling it did not matter anymore.',
};
const G9_BLESSED: StoryPart = {
  long: 1,
  h: 'Jesus called that kind of hunger blessed.',
  p: '**Blessed are they which do hunger and thirst** after righteousness, He said, for they shall be filled. He did not tell them to stop being hungry.',
  art: ['scene', { k: 'g9-bread' }],
  fact: { s: 'Scripture · Matthew 5:6', i: [1] },
  dx: 'In the Sermon on the Mount, Jesus said: **blessed are they which do hunger and thirst** after righteousness, for they shall be filled. He named the hunger as the start of being filled, not a flaw to grind out. The empty feeling under an urge is often that same hunger, looking in the wrong place. Many people try to stop wanting, as if the empty feeling itself were the enemy, and it wears them out. The hunger was never the mistake. It was looking for the wrong water, at the wrong well.',
};
const G9_TRUCK: StoryPart = {
  long: 1,
  h: 'An apostle, David A. Bednar, told of a friend whose new truck got stuck in the snow.',
  p: 'The friend had driven into the mountains for firewood. When all four wheels spun, he filled the truck bed with heavy wood, and **the load gave it traction** to drive out.',
  art: ['scene', { k: 'g9-truck' }],
  fact: { s: 'Talk · Bednar, 2014', i: [3] },
  dx: 'David A. Bednar, an apostle of the Church of Jesus Christ of Latter-day Saints, told of a friend who wanted a four-wheel-drive pickup. His wife thought he wanted it more than he needed it. He bought it anyway, and drove up into the snowy mountains to cut firewood and prove its worth. He went too far, and got stuck. All four wheels spun. So he climbed out, started cutting wood, and filled the back of the truck with the heavy load. Then the truck inched forward and drove out. It was the load, Bednar said. **The load gave it traction.** We sometimes think happiness is the absence of a load, Bednar said. A life with nothing in it spins.',
};
const G9_ELLIOT: StoryPart = {
  long: 1,
  h: 'Students with more goals about avoiding things grew less happy over a term.',
  p: 'Over a term, goals to avoid things wore them down, and they felt they made less progress. **A hunger needs something to move toward**, not only something to stop.',
  art: ['scene', { k: 'g9-goals' }],
  fact: { s: 'Study · Elliot, Sheldon & Church, 1997', i: [2] },
  dx: 'Psychologists asked students to write down their personal goals for a semester, and followed them. Some goals were framed as moving toward something: make a friend, learn this, finish that. Others were about avoiding: do not be lonely, do not fail, stop doing this. Students with more avoiding goals felt worse as the term went on, and felt they were making less progress. A goal that is only about stopping leaves the hunger with nowhere to go. **A hunger needs something to move toward.**',
};
const G9_END: StoryPart = {
  h: 'So the hunger is not the problem. It was the wrong water.',
  p: 'When the empty feeling comes, do not only fight it. Ask what it is thirsty for, and **bring it to the well that fills**: God, a person, something good to do.',
  art: ['scene', { k: 'g9-spring' }],
  dx: 'The empty hour is not proof you are weak. It is a thirst, and the habit has been the water you go back to again and again, and thirst again. The woman at the well did not stop being thirsty. She found what she was thirsty for, and left the water pot behind. When the empty feeling comes, name it: lonely, tired, restless, unseen. Ask what it wants. Then **bring it to the well that fills**: a prayer, a page of scripture read slowly until a line speaks, a call to someone, a good thing to do with your hands.',
};

/* the plain voice: the truck that needed a load */
const G9P_TRUCK: StoryPart = {
  h: 'A man bought a new four-wheel-drive truck and drove it into the snowy mountains.',
  p: 'His wife thought he wanted it more than he needed it. He set out to **prove what it could do**, cutting firewood high on a snowy road.',
  art: ['scene', { k: 'g9-truck' }],
  fact: { s: 'Talk · Bednar, 2014', i: [0] },
  dx: 'A church leader named Bednar told this story about a friend. The friend had always wanted a four-wheel-drive pickup. His wife thought he wanted it more than he needed it. He bought it anyway, and one autumn day he drove it up a snowy mountain road to cut firewood and **prove what it could do**. The truck was new, powerful, empty. He went further up the road than he should have.',
};
const G9P_STUCK: StoryPart = {
  h: 'He drove too far, and the truck got stuck.',
  p: 'Four-wheel drive and all, **every wheel spun in the snow**. The more he pressed the gas, the more it dug itself in.',
  art: ['scene', { k: 'g9-stuck' }],
  dx: 'Then it happened. The truck sank into the snow and stopped. He pressed the gas, and **every wheel spun in the snow**, all four of them, the very thing he had bought it to avoid. The harder he pushed, the more the wheels dug in. A truck with nothing in the back has power and no grip. It is light where it needs to be heavy.',
};
const G9P_ASK: StoryPart = {
  k: 'ask',
  h: 'When your hardest hour comes, what is usually in it?',
  o: [
    ['Nothing planned', 'That is the light truck. Watch what got it out.'],
    ['Too much, and I am worn out', 'Then the hour needs a different load, not more.'],
    ['People, but I still feel alone', 'That is a real emptiness too.'],
    ['I do not know yet', 'That is honest. Look the next time it comes.'],
  ],
};
const G9P_LOAD: StoryPart = {
  h: 'So he cut wood and filled the back of the truck with it.',
  p: 'With a heavy load in the bed, the truck inched forward and drove out. It was the load, Bednar said. **The load gave it traction.**',
  art: ['scene', { k: 'g9-load' }],
  dx: 'With nothing else to do, he got out and started cutting the firewood he had come for. He loaded the back of the truck until it was full and heavy. Then he climbed in and tried again, and the truck inched forward, gripped, and drove out of the snow. It was the load, Bednar said. **The load gave it traction.** We sometimes think happiness is having nothing pulling on us. But an empty truck spins, and an empty hour does too.',
};
const G9P_GOD: StoryPart = {
  h: 'The empty feeling is a hunger for more, and it can be filled.',
  p: 'For many believers, that hunger is part of being made for God. The habit was the wrong food for it. **Fill the hour with something worth carrying.**',
  art: ['scene', { k: 'g9-spring' }],
  dx: 'The truck did not need less in it. It needed the right weight. Many people try to stop wanting, as if the empty feeling itself were the enemy. For many believers, a hunger for more is part of being made for God: the soul reaching for something it was made to have. The habit was never the right food for it. An empty hour, with nothing in it, spins in place, and the pull is waiting there. **Fill the hour with something worth carrying**: a prayer, a person, a task, something good to do with your hands.',
};
const G9P_END: StoryPart = {
  h: 'So put a load in your hardest hour, not an empty space.',
  p: 'Name the hunger: lonely, tired, restless. Ask God what would feed it. Then **pick up one thing worth carrying**, and let it give you grip.',
  art: ['scene', { k: 'g9-load' }],
  dx: 'Look at the hour when the pull is strongest for you. Most likely, it is an empty one: nothing planned, nobody near, nothing in its place. That is the light truck on the snowy road. Name what you are hungry for: company, rest, meaning, a break. Ask God what would feed it today. Then **pick up one thing worth carrying** in that hour, a call, a task, a walk, a prayer, a page, and let its weight give you grip.',
};

export const STORIES_G: Record<string, Story> = {
  g1: {
    id: 'g1',
    form: 'tale',
    title: 'Where are you?',
    tag: 'God came looking with a question, not a charge.',
    ic: 'compass',
    ask: 'Why tell God something He already knows?',
    key: 'God already knows where you are. Saying it out loud is how you come out of hiding.',
    np: 'Where I am today, in one honest sentence',
    tell: [G1_FIG, G1_TREES, G1_CALL, G1_ASK, G1_ANSWER, G1_COATS, G1_WORD, G1_PSALM, G1_GROVE, G1_END],
    mine: { h: 'You have started answering already.', k: 'acted' },
    today: {
      h: 'Answer the question out loud when you pray today.',
      l: ['Ask it: “Where am I?”', 'Answer in one plain sentence', 'Leave it as it is, with no cleaning up'],
    },
    you: G1_YOU,
    close: 'Father, here is where I am. Help me take one step toward you.',
    scope:
      'The garden story in Genesis is read here for one moment in it: a person who hides, and a God who comes looking. David’s psalm and Joseph Smith’s first prayer show the same turn: the silence is heavy, and saying it out loud is where the light comes. The word integrity does come from the Latin for whole. Together they point one hopeful way: telling God where you are is how you become one person again.',
    src: [S.gen3, S.integer, S.ps32, S.jsh],
    vo: {
      christian: {
        tell: [G1_FIG, G1_TREES, G1_CALL, G1_ASK, G1_ANSWER, G1_COATS, G1_WORD, G1_PSALM, G1_END],
        scope:
          'Christians read the garden story in Genesis as the story of every person who hides, and of a God who comes looking. David’s psalm shows the same turn: the silence is heavy, and the honest sentence ends it. The word integrity does come from the Latin for whole. Together they point one hopeful way: telling God where you are is how you become one person again.',
        src: [S.gen3, S.integer, S.ps32],
      },
      plain: {
        form: 'study',
        tag: 'The students who wrote the truth felt worse first, then better.',
        tell: [
          G1P_ROOM,
          G1P_HARD,
          G1P_GUESS,
          G1P_FOUND,
          {
            ...G1_WORD,
            p: 'One person people see, and one who hides. The word **integrity** comes from the Latin integer: whole, one. Each true sentence brings the two closer.',
            dx: 'A secret habit lives in the space between two people who share your name: the one at work, at worship, at the dinner table, and the one alone with it. Keeping it hidden keeps that space open, and keeping the space open is tiring. The word **integrity** comes from the Latin integer, the same word that gives us whole numbers. It means whole, one, not divided. Integrity is not being perfect. It is being one person. Every true sentence you say, to God or to someone you trust, closes the space a little.',
            fact: { s: 'Word · Latin integer, whole', i: [1] },
          },
          G1P_GOD,
          G1P_END,
        ],
        you: G1P_YOU,
        close: 'God, here is where I am. Help me take one step toward you.',
        scope:
          'The writing study followed college students, not people quitting a habit, and the studies since have not all found the same. What carries over is clear: putting a hard truth into words, even to no reader, changed the people who did it. Many faiths teach that God already knows a person’s heart, and the word integrity does come from the Latin for whole. Together they point one hopeful way: telling God where you are is how you become one person again.',
        src: [S.pennebaker, S.integer],
      },
    },
  },

  g2: {
    id: 'g2',
    form: 'life',
    title: 'Weakness is the way in',
    tag: 'A teacher drew two dots, and asked where the line goes.',
    ic: 'sunrise',
    ask: 'Does my weakness keep God away?',
    key: 'There is no line where your part ends and His begins. Bring the weak place now.',
    np: 'The weakness I will bring to God by name',
    tell: [G2_STUDENT, G2_DOTS, G2_ASK, G2_NOLINE, G2_PIANO, G2_NOTE, G2_WHY, G2_GIDEON, G2_ETHER, G2_END],
    today: {
      h: 'Bring the weakness to Him by name today.',
      l: ['Say it plainly: “This is my weakness.”', 'Ask for help with the next hour', 'Do one small practice inside that help'],
    },
    you: G2_YOU,
    close: 'Father, here is my weakness. Make it strong, in your way and your time.',
    scope:
      'Brad Wilcox, a Latter-day Saint teacher, gave the two dots and the piano lessons to students as pictures of the Savior’s grace. Gideon’s three hundred and the Lord’s answer to Moroni in Ether 12 teach the same sure thing: weakness brought to the Lord is not a wall. It is where His strength comes in.',
    src: [S.wilcox, S.judges7, S.ether],
    vo: {
      christian: {
        tell: [G2_STUDENT, G2_DOTS, G2_ASK, G2_NOLINE, G2_PIANO, G2_NOTE, G2_WHY, G2_GIDEON, G2_END],
        scope:
          'Brad Wilcox, a teacher, gave the two dots and the piano lessons to students as pictures of the grace of Christ. Gideon’s three hundred, in the book of Judges, teach the same sure thing: weakness brought to the Lord is not a wall. It is where His strength comes in.',
        src: [S.wilcox, S.judges7],
      },
      plain: {
        tell: [G2P_STUDENT, G2_DOTS, G2_ASK, G2P_NOLINE, G2_PIANO, G2_NOTE, G2P_WHY, G2P_END],
        close: 'God, here is my weakness. Help me lean on you today.',
        scope:
          'Brad Wilcox, a Christian teacher, drew the two dots and the piano lessons to describe grace. The picture carries into many faiths, which teach the same sure thing: a person does not have to get strong before God helps, and weakness brought to Him is where His strength comes in.',
        src: [S.wilcox],
      },
    },
  },

  g3: {
    id: 'g3',
    form: 'tale',
    title: 'The way out comes early',
    tag: 'Joseph kept his distance long before he ran.',
    ic: 'shield',
    ask: 'Where is the way out God promised?',
    key: 'The way out is real, and it usually comes early: a door you take before the pull is loud.',
    np: 'The early door I will walk through this week',
    tell: [G3_HOUSE, G3_DAILY, G3_COAT, G3_ASK, G3_HOLLAND, G3_PAUL, G3_CORNER, G3_END],
    mine: { h: 'Your hardest hours show where to look for the door.', k: 'hour' },
    today: {
      h: 'Find your early door, and walk through it.',
      l: ['Look at what comes before your hardest time', 'Pick one door: a room, a light, a call', 'Pray to see it, then take it'],
    },
    you: G3_YOU,
    close: 'Father, show me the way out today, and help me walk through it early.',
    scope:
      'Joseph’s story, Paul’s promise and the young man in Proverbs all come from the Bible, and Jeffrey R. Holland spoke as an apostle of the Church of Jesus Christ of Latter-day Saints. Together they point one hopeful way: God does make a way to escape, and it is most often found early, in plain choices, by people who look for it.',
    src: [S.gen39, S.cor10, S.prov7, S.holland10],
    vo: {
      christian: {
        tell: [G3_HOUSE, G3_DAILY, G3_COAT, G3_ASK, G3_PAUL, G3_CORNER, G3_END],
        scope:
          'Joseph’s story, Paul’s promise and the young man in Proverbs all come from the Bible. Together they point one hopeful way: God does make a way to escape, and it is most often found early, in plain choices, by people who look for it.',
        src: [S.gen39, S.cor10, S.prov7],
      },
      plain: {
        form: 'study',
        tag: 'A psychologist left children alone with a treat, and watched.',
        tell: [G3P_TREAT, G3P_GUESS, G3P_LOOK, G3P_COVER, G3P_CLOUD, G3P_GOD, G3P_END],
        close: 'God, show me the way out today, and help me walk through it early.',
        scope:
          'The waiting studies were done with young children and a treat, not with adults and a habit, and later work has argued about what the waiting predicts. What they showed in the room is plain and has held: a way out found early, by looking away, covering it or thinking of it differently, worked far better than holding on at the peak. Many faiths teach that God never leaves a person without a way out. This lesson points to where it is usually found.',
        src: [S.mischel70, S.mischel72, S.mischel75],
      },
    },
  },
  g4: {
    id: 'g4',
    form: 'tale',
    title: 'A new heart is given',
    tag: 'Ten men were healed on the road, not before it.',
    ic: 'heart',
    ask: 'Do I have to change my own heart before I can decide?',
    key: 'Decide with the heart you have, and start walking. The new heart is given on the road.',
    np: 'The decision I am making, in one sentence',
    tell: [G4_TEN, G4_GO, G4_ASK, G4_WENT, G4_EZEK, G4_RENEWED, G4_HANDS, G4_END],
    mine: { h: 'The change shows up slowly, in days that held.', k: 'clean30' },
    today: {
      h: 'Decide today, with the heart you have.',
      l: ['Say it: “I have decided. Help my heart.”', 'Write it in one sentence, in your words', 'Decide again tomorrow, if you need to'],
    },
    you: {
      h: 'What part of you still wants it, even though you have decided?',
      o: [
        ['The part that wants comfort after a hard day', 'Then that is the part to bring to Him, as you walk.'],
        ['The part that is used to it', 'Used to is not the same as wanting for good. That part can change.'],
        ['The part that does not believe I can stop', 'Then you are like the ten on the road. Walk anyway.'],
        ['I am not sure yet', 'That is honest. Watch for it this week, and keep walking.'],
      ],
    },
    close: 'Father, I have decided. Change my heart, a little more each day.',
    scope:
      'The ten lepers are in Luke, Ezekiel’s promise is read by Jews and Christians alike, and Paul wrote of the inward man renewed day by day. David A. Bednar spoke as an apostle of the Church of Jesus Christ of Latter-day Saints. Together they hold out a sure hope: your decision is real today, made with the heart you have, and the new heart is given on the way.',
    src: [S.luke17, S.ezek36, S.cor4, S.bednar07],
    vo: {
      christian: {
        tell: [G4_TEN, G4_GO, G4_ASK, G4_WENT, G4_EZEK, G4_RENEWED, G4_END],
        scope:
          'The ten lepers are in Luke, Ezekiel’s promise is read by Jews and Christians alike, and Paul wrote of the inward man renewed day by day. Together they hold out a sure hope: your decision is real today, made with the heart you have, and the new heart is given on the way.',
        src: [S.luke17, S.ezek36, S.cor4],
      },
      plain: {
        form: 'life',
        tag: 'Franklin decided first, and the change came after.',
        tell: [G4P_BOOK, G4P_SPOTS, G4P_ASK, G4P_DIMINISH, G4P_AXE, G4P_GOD, G4P_END],
        you: {
          h: 'What part of you still wants it, even though you have decided?',
          o: [
            ['The part that wants comfort after a hard day', 'Then that is the part to bring to God, as you go.'],
            ['The part that is used to it', 'Used to is not the same as wanting for good. That part can change.'],
            ['The part that does not believe I can stop', 'Franklin did not believe it either, at first. Keep marking the days.'],
            ['I am not sure yet', 'That is honest. Watch for it this week, and keep going.'],
          ],
        },
        close: 'God, I have decided. Change my heart, a little more each day.',
        scope:
          'Franklin’s little book is in his own Autobiography, written late in his life, and he tells it as an honest man who fell short. Many faiths teach that God changes a person’s heart over time. Together they hold out a sure hope: your decision is real today, made with the heart you have, and the change comes after it.',
        src: [S.franklin],
      },
    },
  },

  g5: {
    id: 'g5',
    form: 'tale',
    title: 'Asking to be shown',
    tag: 'Look back for the embers, not the ashes.',
    ic: 'sun',
    ask: 'Will looking closely at my slips only show me how bad I am?',
    key: 'Look back for the embers, not the ashes: one thing to learn, then face forward.',
    np: 'One thing I will ask God to show me about my pattern',
    tell: [G5_FLEE, G5_SALT, G5_LUKE, G5_ASK, G5_WANT, G5_EMBERS, G5_FORGET, G5_PSALM, G5_END],
    mine: { h: 'This is a place to start asking.', k: 'trigger' },
    today: {
      h: 'Look at one hard day, and ask to be shown.',
      l: ['Pray first: “Search me, and lead me.”', 'Read one hard day from your log', 'Write one thing you see, and one next step'],
    },
    you: {
      h: 'What is one ember from your hard days: something they taught you?',
      o: [
        ['What I was feeling just before', 'That is an ember. It can warn you next time.'],
        ['Where I was, or what I was doing', 'That is an ember too. It shows you where the door is.'],
        ['What helped, even a little', 'Keep that one close. It is worth carrying.'],
        ['I have not found one yet', 'Then that is what today is for. Ask to be shown.'],
      ],
    },
    close: 'Father, search me and show me. Then lead me one step on.',
    scope:
      'Lot’s wife is in Genesis, Jesus’ three words are in Luke, and Psalm 139 is David’s prayer to be searched and led. Jeffrey R. Holland spoke on them as an apostle of the Church of Jesus Christ of Latter-day Saints. Together they point one hopeful way: an honest look back, taken with God, is for learning and leading, not for longing or for punishment.',
    src: [S.gen19, S.luke1732, S.holland09, S.ps139],
    vo: {
      christian: {
        tell: [G5_FLEE, G5_SALT, G5_LUKE, G5_ASK, G5_WANT_C, G5_EMBERS, G5_FORGET, G5_PSALM, G5_END],
        scope:
          'Lot’s wife is in Genesis, Jesus’ three words are in Luke, and Psalm 139 is David’s prayer to be searched and led. Jeffrey R. Holland is a church leader who taught on them. Together they point one hopeful way: an honest look back, taken with God, is for learning and leading, not for longing or for punishment.',
      },
      plain: {
        form: 'works',
        tag: 'Pilots learned to look back without blame.',
        tell: [G5P_BEFORE, G5P_1976, G5P_ASK, G5P_REPORTS, G5P_SAFE, G5P_GOD, G5P_END],
        key: 'Look back the way a pilot reports: what happened, what came before, one fix next.',
        you: {
          h: 'What is one thing your hard days have shown you?',
          o: [
            ['What I was feeling just before', 'That is worth knowing. It can warn you next time.'],
            ['Where I was, or what I was doing', 'That is the corner where things turn. Put a sign there.'],
            ['What helped, even a little', 'Keep that one close. It is worth carrying.'],
            ['I have not found one yet', 'Then that is what today is for. Ask to be shown.'],
          ],
        },
        close: 'God, show me what I need to see. Then lead me one step on.',
        scope:
          'The reporting system is NASA’s, and it is about flying, not a habit. What carries over is clear: mistakes looked at without blame turn into fixes, and hidden ones turn into repeats. Many faiths teach that God sees a person with mercy. Together they point one hopeful way: an honest look back, taken with God, is for being led, not for punishment.',
        src: [S.asrs],
      },
    },
  },

  g6: {
    id: 'g6',
    form: 'tale',
    title: 'Confession is for healing',
    tag: 'Four friends carried him, and their faith counted.',
    ic: 'chat',
    ask: 'Is telling someone about this a way of being punished?',
    key: 'Telling one person is not a trial. It is handing them a corner of the mat.',
    np: 'The one person I could tell, and my first sentence',
    tell: [G6_CROWD, G6_FOUR, G6_ROOF, G6_ASK, G6_FAITH, G6_COWLEY, G6_JAMES, G6_BISHOP, G6_END],
    today: {
      h: 'Tell one person one true sentence this week.',
      l: ['Pick someone safe: a friend or your bishop', 'Say one sentence, not the whole story', 'Ask them to pray for you, and pray for them'],
    },
    you: {
      h: 'What do you picture happening when you tell someone?',
      o: [
        ['Being judged, or seen differently', 'Most people picture that. The story in Capernaum pictures something else.'],
        ['Being punished in some way', 'That fear keeps many people quiet for years. Telling is for healing.'],
        ['Relief, if I am honest', 'Hold on to that. Many people find it.'],
        ['I cannot picture it yet', 'That is honest. Start by picturing who you would trust with a corner.'],
      ],
    },
    close: 'Father, give me the courage to tell one person, and heal us both.',
    scope:
      'The man let down through the roof is in Mark, and James 5:16 joins confession to healing. Matthew Cowley spoke as an apostle of the Church of Jesus Christ of Latter-day Saints, and its General Handbook says that for pornography private counsel with the bishop, sometimes with informal limits for a time, is usually enough. Together they point one hopeful way: telling the truth to someone safe is a step toward healing, not toward punishment.',
    src: [S.mark2, S.cowley, S.james5, S.handbook],
    vo: {
      christian: {
        tell: [G6_CROWD, G6_FOUR, G6_ROOF, G6_ASK, G6_FAITH, { ...G6_JAMES, fact: { s: 'Scripture · James 5:16', i: [1] } }, G6_END],
        today: {
          h: 'Tell one person one true sentence this week.',
          l: ['Pick someone safe: a friend or a pastor', 'Say one sentence, not the whole story', 'Ask them to pray for you, and pray for them'],
        },
        scope:
          'The man let down through the roof is in Mark, and James 5:16 joins confession to healing. Together they point one hopeful way: telling the truth to someone safe is a step toward healing, not toward punishment.',
        src: [S.mark2, S.james5],
      },
      plain: {
        form: 'study',
        tag: 'Researchers put a heavy pack on students and asked how steep a hill was.',
        tell: [G6P_HILL, G6P_GUESS, G6P_FOUND, G6P_PICTURE, G6P_TELL, G6P_END],
        today: {
          h: 'Tell one person one true sentence this week.',
          l: ['Pick someone safe: a friend or faith leader', 'Say one sentence, not the whole story', 'Ask what they need, and listen back'],
        },
        you: {
          h: 'What do you picture happening when you tell someone?',
          o: [
            ['Being judged, or seen differently', 'Most people picture that. Telling is closer to standing on the hill together.'],
            ['Being punished in some way', 'That fear keeps many people quiet for years. Telling is for healing.'],
            ['Relief, if I am honest', 'Hold on to that. Many people find it.'],
            ['I cannot picture it yet', 'That is honest. Start by picturing who you would want beside you.'],
          ],
        },
        close: 'God, give me the courage to tell one person, and heal us both.',
        scope:
          'The hill studies were small, with college students and a hill, not people quitting a habit, and they measured how steep a climb looked, not how it went. What carries over is the shape: a hard thing looks more possible with someone beside you. Many faiths teach that telling the truth to another person is for healing. Together they point one hopeful way: telling one safe person is a step toward healing, not toward punishment.',
        src: [S.schnall],
      },
    },
  },
  g7: {
    id: 'g7',
    form: 'tale',
    title: 'Built for coming back',
    tag: 'Peter failed Him three times, and was first into the water.',
    ic: 'sunrise',
    ask: 'Have I used up my chances with God?',
    key: 'Peter failed Him three times and was first into the water. Come back now, as you are.',
    np: 'The first sentence I will say to God after a slip',
    tell: [G7_DENY, G7_LOOK, G7_FISH, G7_ASK, G7_SEA, G7_SHORE, G7_THREE, G7_SKI, G7_OFT, G7_SEVEN, G7_END],
    mine: { h: 'Your own log keeps count of the comebacks.', k: 'back' },
    today: {
      h: 'Write your first words to Him now, before you need them.',
      l: ['Write one sentence to pray after a slip', 'Keep it where you will find it fast', 'Say it right away, as you are'],
    },
    you: {
      h: 'After a slip, what is your boat: the thing you go back to instead of swimming?',
      o: [
        ['Staying away from prayer for a while', 'That is the boat most people sit in. You can jump.'],
        ['Staying away from church', 'Go anyway. Church each week is for weeks like this, whatever your bishop asks of you.'],
        ['Going quiet with everyone', 'Then one person, maybe your bishop, could be the shore.'],
        ['I come back fairly fast', 'Then keep that. Peter did the same.'],
      ],
    },
    close: 'Father, I am turning back again. Thank you that the way was built for this.',
    scope:
      'Peter’s fall and his breakfast by the sea are in Luke and John, and Proverbs and Micah say a good person falls and rises. Moroni 6 is in the Book of Mormon, and Dieter F. Uchtdorf spoke as an apostle of the Church of Jesus Christ of Latter-day Saints. All of it points one sure way: there is no limit on coming back, and the quicker the better.',
    src: [S.luke22, S.john21, S.prov24, S.moroni6, S.uchtdorf13],
    vo: {
      christian: {
        tell: [G7_DENY, G7_LOOK, G7_FISH, G7_ASK, G7_SEA, G7_SHORE, G7_THREE, G7_SEVEN, G7_END],
        you: {
          h: 'After a slip, what is your boat: the thing you go back to instead of swimming?',
          o: [
            ['Staying away from prayer for a while', 'That is the boat most people sit in. You can jump.'],
            ['Staying away from church', 'Sunday was made for a week like this one too.'],
            ['Going quiet with everyone', 'Then one person you trust could be the shore.'],
            ['I come back fairly fast', 'Then keep that. Peter did the same.'],
          ],
        },
        scope:
          'Peter’s fall and his breakfast by the sea are in Luke and John, and Proverbs and Micah say a good person falls and rises. All of it points one sure way: there is no limit on coming back, and the quicker the better.',
        src: [S.luke22, S.john21, S.prov24],
      },
      plain: {
        form: 'life',
        tag: 'A grandfather fell on a ski slope and could not get up.',
        key: 'You can do it now. Take the hand held out, and come back as you are.',
        tell: [G7P_SKI, G7P_STUCK, G7P_ASK, G7P_HAND, G7P_RISE, G7P_GOD, G7P_END],
        you: {
          h: 'After a slip, whose hand could you take to get up faster?',
          o: [
            ['God’s, in one honest prayer', 'Then pray it right away, as you are.'],
            ['A friend’s or a family member’s', 'Then tell them now what to say to you: you can do it now.'],
            ['A faith leader’s or a counselor’s', 'People who know this slope are good at reaching down.'],
            ['No one’s yet', 'Then start with God’s. The hand is there.'],
          ],
        },
        close: 'God, I am turning back again. Thank you that the way is always open.',
        scope:
          'Dieter Uchtdorf told the ski story about himself in a talk in 2013. The faiths that speak of mercy teach that God meets a person each time they turn back, and Daybook does not speak for any one of them. This lesson stands on that hope: there is no limit on coming back, and the quicker the better.',
        src: [S.uchtdorf13],
      },
    },
  },

  g8: {
    id: 'g8',
    form: 'tale',
    title: 'Tempted is not fallen',
    tag: 'In the wilderness, He was hungry, tired and alone.',
    ic: 'shield',
    ask: 'Does feeling the pull mean I am far from God?',
    key: 'Being tempted is not falling. Answer the pull in a few true words, and let it pass.',
    np: 'What I will tell God the next time the pull is strong',
    tell: [G8_WILD, G8_THREE, G8_WRITTEN, G8_ASK, G8_HEB, G8_THIEVES, G8_BIRDS, G8_TAF, G8_END],
    mine: { h: 'Each urge you ride is a pull that did not become a fall.', k: 'rode' },
    today: {
      h: 'When the pull comes, call it a pull, not a fall.',
      l: ['Say: “Tempted is not fallen.”', 'Tell Him plainly: “You know this one.”', 'Ride it like a wave, then log it'],
    },
    you: {
      h: 'What few true words could you say to the pull, the way He did?',
      o: [
        ['“This is a pull. I do not have to follow it.”', 'Short enough to say when it is loud. Keep it.'],
        ['“Lord, you know this one.”', 'He does. That sentence puts you beside Him.'],
        ['A line of scripture I love', 'Then learn it by heart, so it is there when you are hungry.'],
        ['I do not have words yet', 'Then borrow His for now: It is written.'],
      ],
    },
    close: 'Father, your Son knows this pull. Help me through this hour with Him.',
    scope:
      'The wilderness is in Matthew and Hebrews 4:15 says He was tempted without sin. Jeffrey R. Holland spoke as an apostle of the Church of Jesus Christ of Latter-day Saints, and Luther passed on an old saying in a letter. The study measured a belief about thoughts in ordinary people and in patients, not people quitting a habit, and it names the feeling this lesson turns over. Together they say one sure thing: being tempted is not falling.',
    src: [S.matt4, S.heb4, S.holland10, S.luther, S.shafran],
    vo: {
      christian: {
        tell: [
          G8_WILD,
          G8_THREE,
          G8_WRITTEN,
          G8_ASK,
          G8_HEB,
          { ...G8_BIRDS, fact: { s: 'Letter · Luther to Weller, 1530', i: [2] } },
          { ...G8_TAF, fact: { s: 'Study · Shafran, Thordarson & Rachman, 1996', i: [3] } },
          G8_END,
        ],
        scope:
          'The wilderness is in Matthew and Hebrews 4:15 says He was tempted without sin, and Luther passed on an old saying in a letter. The study measured a belief about thoughts in ordinary people and in patients, not people quitting a habit, and it names the feeling this lesson turns over. Together they say one sure thing: being tempted is not falling.',
        src: [S.matt4, S.heb4, S.luther, S.shafran],
      },
      plain: {
        form: 'study',
        tag: 'Researchers named the belief that a thought is as bad as a deed.',
        tell: [G8P_TAF, G8P_FOUND, G8P_ASK, G8P_BIRDS, G8P_GOD, G8P_END],
        key: 'Being tempted is not falling. Let the bird fly over, and do not let it nest.',
        you: {
          h: 'What few plain words could you say to the pull when it comes?',
          o: [
            ['“This is a pull. I do not have to follow it.”', 'Short enough to say when it is loud. Keep it.'],
            ['“God, help me through this one.”', 'That puts you beside Him, right at the edge.'],
            ['A line I know by heart', 'Then keep it ready, for when the pull is loud.'],
            ['I do not have words yet', 'Then start with this one: tempted is not fallen.'],
          ],
        },
        close: 'God, this pull is strong. Stay with me through this hour.',
        scope:
          'The study measured a belief about thoughts in ordinary people and in patients, not people quitting a habit, and it names the feeling this lesson turns over. The saying about birds is old and was passed on in a letter. Many faiths teach that being tempted is not the same as doing wrong, and Daybook does not speak for any one of them.',
        src: [S.shafran],
      },
    },
  },

  g9: {
    id: 'g9',
    form: 'tale',
    title: 'Hungry for more',
    tag: 'She came to the well alone, and left her water pot behind.',
    ic: 'book',
    ask: 'What do I do with the emptiness that pulls me toward it?',
    key: 'The hunger is not the problem. Bring it to the well that fills.',
    np: 'What I am hungry for, under the urge',
    tell: [G9_WELL, G9_DRINK, G9_ASK, G9_KNEW, G9_POT, G9_BLESSED, G9_TRUCK, G9_ELLIOT, G9_END],
    mine: { h: 'Here is when your hunger tends to come.', k: 'hour' },
    today: {
      h: 'Bring your hardest hour to the well today.',
      l: ['Name the hunger: lonely, tired or restless', 'Read slowly until one line speaks to you', 'Do one small good thing that line points to'],
    },
    you: {
      h: 'Under the urge, what are you most thirsty for?',
      o: [
        ['To be seen and still welcomed', 'That is what she found at the well. It is a true thirst.'],
        ['Rest', 'Then rest is the water. Bring that hour to Him.'],
        ['Something that matters', 'Then the empty hour is a place to do something that does.'],
        ['I do not know yet', 'That is honest. Ask it the next time it comes.'],
      ],
    },
    close: 'Father, I am hungry for more than this. Fill me with what is good.',
    scope:
      'The woman at the well is in John, and Matthew 5:6 calls the hunger blessed. David A. Bednar spoke as an apostle of the Church of Jesus Christ of Latter-day Saints. The goals study followed students, not people quitting a habit, and it shows that goals only about stopping wear people down. Together they say the hunger is not the enemy: it needs the right water.',
    src: [S.john4, S.matt5, S.elliot, S.bednar14],
    vo: {
      christian: {
        tell: [G9_WELL, G9_DRINK, G9_ASK, G9_KNEW, G9_POT, G9_BLESSED, G9_ELLIOT, G9_END],
        scope:
          'The woman at the well is in John, and Matthew 5:6 calls the hunger blessed. The goals study followed students, not people quitting a habit, and it shows that goals only about stopping wear people down. Together they say the hunger is not the enemy: it needs the right water.',
        src: [S.john4, S.matt5, S.elliot],
      },
      plain: {
        form: 'life',
        tag: 'A new truck got stuck in the snow, and a load got it out.',
        key: 'An empty hour spins. Fill it with something worth carrying.',
        tell: [G9P_TRUCK, G9P_STUCK, G9P_ASK, G9P_LOAD, { ...G9_ELLIOT, fact: { s: 'Study · Elliot, Sheldon & Church, 1997', i: [1] } }, G9P_GOD, G9P_END],
        today: {
          h: 'Put a load in your hardest hour, not an empty space.',
          l: ['Name the hunger: lonely, tired or restless', 'Ask God what would feed it today', 'Do the first good thing that comes'],
        },
        you: {
          h: 'Under the urge, what are you most hungry for?',
          o: [
            ['To be close to someone', 'That is a true hunger. A call can be the load.'],
            ['Rest', 'Then rest is the load worth carrying. Plan it.'],
            ['Something that matters', 'Then the empty hour is a place to do something that does.'],
            ['I do not know yet', 'That is honest. Ask it the next time it comes.'],
          ],
        },
        close: 'God, I am hungry for more than this. Fill me with what is good.',
        scope:
          'Bednar, a church leader, told the truck story about a friend in a talk in 2014. The goals study followed students, not people quitting a habit, and it shows that goals only about stopping wear people down. Many faiths teach that a hunger for more points toward God, and Daybook does not speak for any one of them.',
        src: [S.bednar14, S.elliot],
      },
    },
  },
};
