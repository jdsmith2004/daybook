/* Turned lessons, batch B (the format and the pilot are in lesson-turns.ts). */
import type { Turn } from './lesson-turns';

type Src = [string, string];
const S = {
  shiffman04: [
    'Shiffman & Waters (2004): negative affect and smoking lapses, a prospective analysis, Journal of Consulting and Clinical Psychology',
    'https://doi.org/10.1037/0022-006X.72.2.192',
  ],
  larimer: [
    'Larimer, Palmer & Marlatt (1999): relapse prevention, an overview of Marlatt’s cognitive-behavioral model, Alcohol Research & Health',
    'https://pmc.ncbi.nlm.nih.gov/articles/PMC6760427',
  ],
  johansson: [
    'Johansson, Hall, Sikström & Olsson (2005): failure to detect mismatches between intention and outcome in a simple decision task, Science',
    'https://doi.org/10.1126/science.1111709',
  ],
  harkin: [
    'Harkin et al. (2016): does monitoring goal progress promote goal attainment? A meta-analysis of 138 experiments, Psychological Bulletin',
    'https://doi.org/10.1037/bul0000025',
  ],
  wood02: [
    'Wood, Quinn & Kashy (2002): habits in everyday life, thought, emotion, and action, Journal of Personality and Social Psychology',
    'https://pubmed.ncbi.nlm.nih.gov/12500811/',
  ],
  quinn10: [
    'Quinn, Pascoe, Wood & Neal (2010): watching for unwanted habits and telling yourself not to, Personality and Social Psychology Bulletin',
    'https://doi.org/10.1177/0146167209360665',
  ],
  tricomi: [
    'Tricomi, Balleine & O’Doherty (2009): a specific role for posterior dorsolateral striatum in human habit learning, European Journal of Neuroscience',
    'https://pubmed.ncbi.nlm.nih.gov/19490086/',
  ],
  brewer: [
    'Brewer et al. (2011): mindfulness training for smoking cessation, results from a randomized controlled trial, Drug and Alcohol Dependence',
    'https://doi.org/10.1016/j.drugalcdep.2010.11.007',
  ],
  taylor: [
    'Taylor et al. (2021): awareness drives changes in reward value which predict eating behavior change, Journal of Behavioral Addictions',
    'https://pmc.ncbi.nlm.nih.gov/articles/PMC8997232',
  ],
  slepian17: ['Slepian, Chun & Mason (2017): the experience of secrecy, Journal of Personality and Social Psychology', 'https://doi.org/10.1037/pspa0000085'],
  slepian19: [
    'Slepian & Moulton-Tetlock (2019): confiding secrets and well-being, Social Psychological and Personality Science',
    'https://doi.org/10.1177/1948550618765069',
  ],
  luke: ['Luke 15:11-24, the parable of the lost son', 'https://www.biblegateway.com/passage/?search=Luke+15%3A11-24&version=NIV'],
  genesis: ['Genesis 3:8-9, the man and the woman hide in the garden', 'https://www.biblegateway.com/passage/?search=Genesis+3%3A8-9&version=NIV'],
  malachi: ['Malachi 3:7, “Return to me, and I will return to you”', 'https://www.biblegateway.com/passage/?search=Malachi+3%3A7&version=NIV'],
  ano: [
    'Ano & Vasconcelles (2005): religious coping and psychological adjustment to stress, a meta-analysis, Journal of Clinical Psychology',
    'https://pubmed.ncbi.nlm.nih.gov/15503316/',
  ],
  aron: [
    'Aron, Melinat, Aron, Vallone & Bator (1997): the experimental generation of interpersonal closeness, Personality and Social Psychology Bulletin',
    'https://doi.org/10.1177/0146167297234003',
  ],
  christakis: [
    'Christakis & Fowler (2008): the collective dynamics of smoking in a large social network, New England Journal of Medicine',
    'https://pubmed.ncbi.nlm.nih.gov/18499567/',
  ],
  kelly: [
    'Kelly (2017): “Is Alcoholics Anonymous religious, spiritual, neither?” Addiction (a summary from the Recovery Research Institute)',
    'https://www.recoveryanswers.org/research-post/alcoholics-anonymous-religious-spiritual-neither-review-finds-aa-effective-not-way-think/',
  ],
  grubbs: [
    'Grubbs, Stauner, Exline, Pargament & Lindberg (2015): perceived addiction to internet pornography and psychological distress, Psychology of Addictive Behaviors',
    'https://pubmed.ncbi.nlm.nih.gov/26372200/',
  ],
  who: ['WHO ICD-11, 6C72 compulsive sexual behaviour disorder (a text copy of the entry)', 'https://findacode.com/icd-11/code-1630268048.html'],
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
} satisfies Record<string, Src>;

export const TURNS_B: Record<string, Turn> = {
  l17: {
    id: 'l17',
    title: 'The first link in the chain',
    ic: 'compass',
    ask: 'Where does a slip start?',
    key: 'A slip starts hours before the urge peaks. Look early, while you are clear, and turning the night is easy.',
    np: 'The earliest link in my last hard night',
    hook: {
      h: 'It is 11 p.m., and the pull already feels too strong to stop.',
      say: 'When did tonight start going this way?',
      more: 'Most people judge a slip by its last minute. This lesson is about the hours before it, where turning the night asks very little of you.',
    },
    ask1: {
      h: 'Think of your last hard night. When could you have turned it most easily?',
      o: [
        ['At the peak, with more willpower', 'That is the hardest place to stand. It asks the most of you, at your most tired.'],
        ['An hour or two before, while it was quiet', 'That one asks little. You were clear, and the pull was small.'],
        ['That morning, in how the day was set up', 'Far back, and often the easiest turn of all.'],
        ['I do not know yet', 'That is honest. The next card gives you a way to look.'],
      ],
    },
    flip: {
      think: 'A slip happens in one moment, at the peak of the urge.',
      see: 'The night tilts hours before the peak. That gives you many easy chances to turn it, not one hard one.',
      more: 'Picture a slip as one test at the worst moment, and it feels like a test nobody could pass. Look at the hours before it, and you find small turns: the phone carried to bed, the late scroll, the skipped dinner. Each one is easy to change while you are clear.',
    },
    deep: [
      {
        h: 'Smokers felt their mood sinking hours before a lapse.',
        p: 'The slide had started long before the moment they lit up.',
        art: ['research', { k: 'chain' }],
        fact: { s: 'Study · 215 smokers · Shiffman & Waters, 2004', i: [0] },
        more: 'Researchers gave 215 people who were quitting smoking a handheld computer, and they reported their mood through the day until their first lapse. Mood on one day did not predict a lapse the next day. On the day of a lapse that came from stress or a bad mood, though, the low mood was already climbing in the hours before it.',
      },
      {
        h: 'The early links look harmless, which is why they work.',
        p: 'Researchers call them apparently irrelevant decisions, like the phone by the bed “in case someone texts.”',
        fact: { s: 'Relapse model · Larimer, Palmer & Marlatt, 1999', i: [1] },
        more: 'A classic example from alcohol is keeping liquor at home “just in case guests stop by.” Each choice looks innocent on its own. Together they walk a person to the place where the last choice is the hardest one. The same research found that coping well with a risky moment built confidence for the next one.',
      },
      {
        h: 'Late and low is the hardest place to stand. So stand earlier.',
        p: 'At 11 you are tired and low. At 8 you still have your strength, so make your stand there.',
        back: 'l4',
      },
    ],
    mine: { h: 'Find your hard hours, then look a few hours before them.', k: 'hour' },
    move: {
      h: 'Find one early link, and turn it while it is small.',
      l: ['Trace your last hard night back hours', 'Find the first small yes in it', 'Swap that link before it comes again'],
    },
    check: {
      h: 'It is 8:30 p.m. You take the laptop to bed “to finish something.” Nothing is wrong yet. What now?',
      o: [
        ['Nothing is wrong yet, so keep going', '“Nothing is wrong yet” is what an early link looks like. This is the easy moment.'],
        ['Put it back on the desk', 'Yes. One small move at 8:30 saves you a hard fight at 11.'],
        ['Keep it, and be extra strong later', 'Later is when you are most tired. Your strength goes further now.'],
        ['Feel bad that I even thought of it', 'No need. Seeing the link is the skill. Turn it, and move on.'],
      ],
      a: 1,
    },
    scope:
      'The mood study followed people quitting smoking, and the climb in mood came before lapses that grew out of stress or a bad mood. The early links come from Marlatt’s relapse model, built mostly on alcohol. The pattern carries over well: a hard night has a beginning, and the beginning is the easy place to turn it.',
    src: [S.shiffman04, S.larimer],
  },

  l18: {
    id: 'l18',
    title: 'Thoughts that give permission',
    ic: 'lock',
    ask: 'Why do some thoughts make giving in feel fine?',
    key: 'A mind can write a good reason for any choice. Do not argue with it. See it, and meet the need under it.',
    np: 'The permission thought I hear most, and the need under it',
    hook: {
      h: '11:40 p.m. A calm voice: “You earned this. It hurts no one.”',
      say: 'Does a good reason mean it is a good choice?',
      more: 'Permission thoughts do not feel like temptation. They feel like sense. This lesson is about why a reason that sounds right tells you so little.',
    },
    ask1: {
      h: 'When a thought like “I have earned this” shows up, how does it usually feel?',
      o: [
        ['Fair. I did have a hard week', 'The week was hard. Hold that, and watch what the thought asks for next.'],
        ['Like it came after I had already leaned in', 'Many people notice this. The next card is about exactly that.'],
        ['Like an argument I have to win', 'Arguing at midnight is tiring. The next card shows why you can skip it.'],
        ['I do not know yet', 'Fair. Listen for it this week, and notice when it arrives.'],
      ],
    },
    flip: {
      think: 'I weigh the reasons, and then I decide.',
      see: 'Often the pull decides first, and the reasons come after. A mind can write a good reason for any choice.',
      more: 'This is why a permission thought sounds so sensible. It was written to fit a choice already leaning one way. So the question is never “is this a good reason?” It is “what is this reason for?”',
    },
    deep: [
      {
        h: 'People defended a face they never chose, in fluent detail.',
        p: 'Researchers swapped the photo. Most people did not notice, and explained why they liked it.',
        art: ['research', { k: 'permit' }],
        fact: { s: 'Study · Johansson et al., 2005', i: [0] },
        more: 'In a study on choice, people picked the more attractive of two faces, then were handed the photo to explain their pick. On some turns the researchers had quietly swapped it for the face they turned down. Most people did not notice, and gave confident, detailed reasons for a choice they never made. The study was about faces, not habits. It shows how easily a mind writes reasons after the fact.',
      },
      {
        h: 'Under “I have earned it” is often a need that is fair.',
        p: 'A week of all shoulds and no wants leaves you hungry for a reward. Feed that hunger another way.',
        fact: { s: 'Relapse model · Larimer, Palmer & Marlatt, 1999', i: [1] },
        more: 'Marlatt’s relapse model describes a life tipped toward shoulds (work, duties, other people’s needs) with few wants (rest, play, things just for you). When the balance tips, the pull toward a quick reward grows, and the permission thought is how it speaks. The need is fair. The reward it names is the problem.',
      },
      {
        h: '“I already blew it” was a permission thought too.',
        p: 'It came after the slip and made the next one feel allowed. Same trick, new words.',
        back: 'l3',
      },
    ],
    mine: { h: 'An urge ends whether or not you win the argument.', k: 'rode' },
    move: {
      h: 'Name the thought, then feed the need under it.',
      l: ['Say: “That is a reason, not a decision.”', 'Ask: “What do I need right now?”', 'Give it rest, food, a call, or a shower'],
    },
    check: {
      h: 'It is 11:40 p.m. after a long week. You think, “I have earned this, and it hurts no one.” What now?',
      o: [
        ['Argue with it until I prove it wrong', 'Midnight debates are hard to win, and you do not need to win one.'],
        ['Name it, then rest another way', 'Yes. You saw the reason for what it was, and fed the need under it.'],
        ['Agree. The week was hard enough', 'The week was hard. This reason was written to fit the pull, not your week.'],
        ['Tell myself I deserve nothing', 'Harsh does not help either. You do deserve rest, a kind that costs nothing tomorrow.'],
      ],
      a: 1,
    },
    scope:
      'The face study was about choosing faces, not habits, and it shows how easily a mind explains a choice after the fact, not that your reasons are false. The shoulds and wants idea comes from Marlatt’s relapse model, built mostly on alcohol. Together they give you sure footing: a reason that sounds good does not have to be obeyed.',
    src: [S.johansson, S.larimer],
  },

  l19: {
    id: 'l19',
    title: 'Learn from your own log',
    ic: 'calendar',
    ask: 'How can my log help me quit?',
    key: 'Your log is not a scoreboard of how you are doing. It is a map of where to stand next, so read it once a week.',
    np: 'One thing my log has shown me about where to stand',
    hook: {
      h: 'You open your log, and the hard days jump out first.',
      say: 'Is your log grading you?',
      more: 'Many people avoid their log after a bad week, the way you avoid a bad report card. This lesson is about reading it a different way.',
    },
    ask1: {
      h: 'When you look back at your log, what do you mostly feel?',
      o: [
        ['Judged, like it keeps score', 'That feeling keeps many people from looking. The next card turns it over.'],
        ['Curious about what it shows', 'That is the feeling that turns a log into answers.'],
        ['I mostly do not look back', 'Most people do not. Writing is half of it. Looking back is the other half.'],
        ['I do not know yet', 'Fair. Notice how you feel the next time you open it.'],
      ],
    },
    flip: {
      think: 'My log is a scoreboard of how I am doing.',
      see: 'A scoreboard judges the past. A map tells you where to stand tomorrow. Your log is a map.',
      more: 'A score looks backward and says good or bad. A map looks forward and shows where the hard ground is: the hours, the reasons, what helped. The same entries can be read either way. Read them as a map, and the hard days become the most useful ones.',
    },
    deep: [
      {
        n: '138',
        h: 'experiments, pooled: watching progress helped people reach goals.',
        p: 'It helped more when people wrote the progress down or told someone.',
        fact: { s: 'Meta-analysis · 138 experiments · Harkin et al., 2016', i: [0] },
        more: 'A large review pooled 138 experiments in which people were prompted to watch their progress toward a goal. Watching progress raised how often they reached it. The effect was bigger when the progress was written down or reported to someone. Tracking does its work as information, not as a verdict.',
      },
      {
        h: 'The hard days are where the map is.',
        p: 'A map that leaves out the cliffs is no help. Honest entries on bad days show where to stand.',
        more: 'If a log is a scoreboard, you want to hide the bad days. If it is a map, those are the days that matter most: they show the hour, the place and the reason. That is why an honest entry after a slip is never a loss.',
      },
      {
        h: 'Early links leave tracks, and your log can find them.',
        p: 'A few weeks of honest entries show when your nights start to tilt.',
        back: 'l17',
      },
    ],
    mine: { h: 'A map shows what sets it off. Here is yours so far.', k: 'trigger' },
    move: {
      h: 'Once a week, read your log as a map.',
      l: ['When was it hardest?', 'What came right before?', 'What helped, even a little?'],
    },
    check: {
      h: 'It is Sunday evening, and you think, “I always fall apart on Sundays.” You have a month of entries. What first?',
      o: [
        ['Brace for a bad night, since it always happens', 'That is the scoreboard talking. The map might say something else.'],
        ['Look at the last four Sundays in my log', 'Yes. Check the map: what hour, what came before, and what helped.'],
        ['Skip logging tonight so it does not count', 'Hiding a day hides the map. Honest entries are what make it useful.'],
        ['Promise to be stronger this Sunday', 'A promise does not change the ground. The map shows you where to stand.'],
      ],
      a: 1,
    },
    scope:
      'The review pooled many kinds of goals, not porn, and it found that watching progress helped, most of all when it was written down. Reading a log as a map is how Daybook puts that to work. Your entries are information about your own pattern, and the more honest they are, the better they guide you.',
    src: [S.harkin],
  },

  l35: {
    id: 'l35',
    title: 'Catch the autopilot',
    ic: 'shield',
    ask: 'How do I stop something that starts before I decide?',
    key: 'Habits start on their own, and waking up halfway is normal. The moment you notice, your choice comes back.',
    np: 'The moment my autopilot usually starts, and what I will say when I catch it',
    hook: {
      h: 'It is 11 p.m. Your thumb is already opening the browser.',
      say: 'Did you decide that?',
      more: 'Many people feel alarmed when they find themselves halfway into the habit with no memory of choosing it. This lesson is about why that happens, and what the moment of noticing is worth.',
    },
    ask1: {
      h: 'When you catch yourself already halfway there, what do you tell yourself?',
      o: [
        ['Too late now, it already started', 'That thought hands the rest of the night to autopilot. The next card disagrees.'],
        ['Something is wrong with me', 'It feels like proof of something. It is how habits work in everyone.'],
        ['Wait, I can stop here', 'That is the skill this lesson is about. Hold on to it.'],
        ['I do not know yet', 'Fair. Notice what you say the next time you catch it.'],
      ],
    },
    flip: {
      think: 'If it started without me, something is wrong with me.',
      see: 'Much of every day runs on autopilot. Waking up halfway is normal, and the waking is your choice coming back.',
      more: 'Habits are built to start without a decision. That is what makes them useful for tying shoes and driving home, and stubborn at 11 p.m. The start is not your failure. The noticing is yours, and it is where you come back in.',
    },
    deep: [
      {
        h: 'In hourly diaries, minds were elsewhere during habits.',
        p: 'During new actions, thoughts matched what people did. During habits, thoughts wandered off.',
        art: ['loop', { n: ['Cue', 'Autopilot', 'You notice', 'You choose'], c: 'Noticing is where you come back in' }],
        fact: { s: 'Diary studies · Wood, Quinn & Kashy, 2002', i: [0] },
        more: 'Researchers had college students write down, every hour, what they were doing and what they were thinking. During new or unusual actions, their thoughts were on what they were doing. During habits, the things they did nearly every day in the same place, their minds were usually somewhere else. Autopilot is an ordinary part of every day.',
      },
      {
        h: 'For strong habits, watching for the start worked best.',
        p: 'People who watched for slips and told themselves “do not” did better than those who hid the temptation.',
        fact: { s: 'Diary studies · Quinn, Pascoe, Wood & Neal, 2010', i: [1] },
        more: 'In diary studies of people trying to control unwanted habits, one way stood out for strong habits: watching for the habit and telling themselves not to do it. Keeping the temptation out of sight and distracting themselves did little for strong habits. An experiment suggested that watching works by boosting control in the moment, not by erasing the habit.',
      },
      {
        h: 'A cue can start the habit. It cannot notice for you.',
        p: 'The cue comes first and switches autopilot on. Noticing is the one part it cannot do. That part is yours.',
        back: 'l34',
      },
    ],
    mine: { h: 'Your autopilot keeps hours. Here is where to watch.', k: 'hour' },
    move: {
      h: 'Set a watch for the moment autopilot starts.',
      l: ['Pick the hour or place it usually starts', 'When you get there, look at your hands', 'Say “not this time,” and put it down'],
    },
    check: {
      h: 'It is 11 p.m. You notice your thumb already opening the browser. You did not decide that. What now?',
      o: [
        ['It started, so I might as well finish', 'Started is not finished. This moment of noticing is the one that counts.'],
        ['Say “not this time,” and set it down', 'Yes. Autopilot started it. You noticed, and you took the next step back.'],
        ['Ask myself what is wrong with me', 'Nothing is wrong with you. Habits start on their own. Noticing is the skill.'],
        ['Speed up, to get it over with', 'That gives the habit more practice. Catching it, even late, gives it less.'],
      ],
      a: 1,
    },
    scope:
      'The diary studies followed college students through ordinary days, and the habit studies were about everyday unwanted habits, not porn. Both point the same hopeful way: starting on autopilot is how habits work in everyone, and noticing the start is a skill that grows with practice.',
    src: [S.wood02, S.quinn10],
  },

  l41: {
    id: 'l41',
    title: 'The picture and what it gives',
    ic: 'sun',
    ask: 'Do I know what the habit gives me?',
    key: 'The pull runs on an old guess about what the habit gives. One honest look updates it, and the pull loosens.',
    np: 'What the pull felt like when I looked at it closely',
    hook: {
      h: 'The pull starts. You know this one by heart, or think you do.',
      say: 'When did you last look at it closely?',
      more: 'The picture is bright and loud, and it has run so many times that nobody checks it anymore. This lesson is about what happens when you do.',
    },
    ask1: {
      h: 'When the pull comes, what does it feel like in your body, right then?',
      o: [
        ['Tight or restless, somewhere in me', 'That is close noticing. Most people never get that far.'],
        ['Like the picture, and nothing else', 'The picture fills the screen. The body is there under it.'],
        ['I only notice once I am in it', 'That is autopilot. Looking can start sooner.'],
        ['I do not know. I never look', 'Most people never do. That is what this lesson is about.'],
      ],
    },
    flip: {
      think: 'I know what it gives me. I have done it a thousand times.',
      see: 'A thousand times on autopilot is not one honest look. The pull runs on an old guess, and looking updates it.',
      more: 'A habit does not check its results. It keeps going on the value it learned long ago, while the picture keeps the old promise bright. When you look closely at what it gives, in your body and in the hour after, the guess gets updated, and the pull follows the new guess.',
    },
    deep: [
      {
        h: 'Habits keep going after the reward stops being worth it.',
        p: 'In a lab, people trained long enough kept working for a snack they no longer wanted.',
        fact: { s: 'Study · Tricomi, Balleine & O’Doherty, 2009', i: [0] },
        more: 'Researchers trained volunteers to press keys for snack rewards. Then the volunteers ate that snack until they had had enough of it. People trained briefly pressed less. People trained for a long time kept pressing as before. A strong habit runs on what the reward used to be worth, not on what it is worth now.',
      },
      {
        n: '31%',
        h: 'of smokers who studied their cravings were not smoking at four months.',
        p: 'In a standard quit program, it was 6%. They looked closely, with curiosity, not shame.',
        fact: { s: 'Trial · 88 smokers · Brewer et al., 2011 · Study · Taylor et al., 2021', i: [1, 2] },
        more: 'In a trial with 88 adults who smoked, one group learned to notice their cravings closely and with curiosity: what the urge felt like, and what a cigarette gave them. Seventeen weeks later, 31% of them were not smoking, against 6% in a standard quit program. In a later study of eating, the more people paid attention to what a craved food gave them, the less rewarding they expected it to be, and that drop predicted eating less.',
      },
      {
        h: 'Noticing the start is half. Looking closely is the rest.',
        p: 'Autopilot hides what starts it and what it gives. Look at either one with curiosity, and it loosens.',
        back: 'l35',
      },
    ],
    mine: { h: 'Watching an urge to its end is an honest look, too.', k: 'rode' },
    move: {
      h: 'Take one honest look at what it gives.',
      l: ['When the pull starts, look at it closely', 'Where is it in your body? Name it', 'Look with curiosity, not shame'],
    },
    check: {
      h: 'You slipped last night, and the memory keeps playing this morning. What do you do with it?',
      o: [
        ['Replay it until I understand every detail', 'Replaying keeps the picture loud. One look at the after does more.'],
        ['Push it away and never think of it', 'Looking away leaves the old guess in charge. A short look updates it.'],
        ['Look once at what it gave me', 'Yes. That is the information the habit never checks. Now your mind has it.'],
        ['Decide I will never change', 'A slip is information, not a verdict. Seeing it clearly is how change happens.'],
      ],
      a: 2,
    },
    scope:
      'The habit study was a lab task with snacks, and the trial followed adults who smoked, not people who use porn. They agree on something hopeful: a habit keeps an old guess about its reward, and paying close, curious attention to what it gives is one of the ways people update it.',
    src: [S.tricomi, S.brewer, S.taylor],
  },

  l7: {
    id: 'l7',
    title: 'Secrets are heavy',
    ic: 'lock',
    ask: 'Why does keeping this to myself feel so heavy?',
    key: 'A secret weighs most when the mind keeps going back to it, not when you hide it. One safe person lightens it.',
    np: 'Who could be my safe person, and the one sentence I would tell them',
    hook: {
      h: 'Nobody asked about it today. It still followed you all day.',
      say: 'If nobody knows, what is it costing you?',
      more: 'Keeping something private is normal. This lesson is about where the weight of carrying it alone comes from, and it is not where most people expect.',
    },
    ask1: {
      h: 'When does this weigh on you most?',
      o: [
        ['When someone might find out', 'That is what most people expect. The next card points somewhere else.'],
        ['In quiet moments, when I am alone', 'Many people say this. It is where secrets do most of their work.'],
        ['Right after a slip', 'That is a heavy moment. Notice whether it comes back on days with no slip, too.'],
        ['I do not know yet', 'Fair. Watch for when it crosses your mind this week.'],
      ],
    },
    flip: {
      think: 'If nobody knows, it is not costing me anything.',
      see: 'The cost is not the hiding. It is your mind going back to it, again and again, when nobody is even asking.',
      more: 'Most people picture the cost of a secret as the tense moment of hiding it. That moment is rare. The mind returns to a secret far more often: in the car, at night, in the shower. That returning is the weight, and it explains why a secret can feel heavy on a day when nothing happened.',
    },
    deep: [
      {
        h: 'People thought about their secrets far more than they hid them.',
        p: 'And the more often a mind went back to a secret, the lower that person’s well-being.',
        fact: { s: 'Ten studies · 13,000+ secrets · Slepian et al., 2017', i: [0] },
        more: 'Across ten studies, researchers asked people about more than 13,000 secrets they were keeping. People had to hide a secret in a conversation far less often than they found themselves thinking about it alone. It was the thinking, the mind wandering back, that went with lower well-being.',
      },
      {
        h: 'People who confided a secret went back to it less.',
        p: 'They felt more able to cope. Telling did not change the facts. It changed the carrying.',
        fact: { s: 'Studies · 800+ adults · Slepian & Moulton-Tetlock, 2019', i: [1] },
        more: 'In studies of more than 800 adults and over 10,000 secrets, people who had confided a secret in someone felt more able to cope with it, and their minds went back to it less often. These studies show what went together in people’s own lives, not proof of cause. What went together was hopeful: telling one person lightened the load.',
      },
    ],
    mine: { h: 'Honesty starts small, and you have already started.', k: 'acted' },
    move: {
      h: 'Choose one safe person, and one sentence.',
      l: ['Pick someone likely to stay calm', 'One sentence is enough. A text is fine.', 'Tell them what you need back'],
    },
    check: {
      h: 'A friend you trust asks how you are doing, and means it. It is late and no one else is around. What do you do?',
      o: [
        ['Say “fine” and change the subject', 'Then you carry it home again, and it comes back to mind tonight.'],
        ['Tell them one honest sentence', 'Yes. One sentence, on your terms. That is how the weight gets shared.'],
        ['Tell them every detail right away', 'You choose how much. One honest sentence is enough to start.'],
        ['Wait until I have it all fixed', 'Waiting means carrying it alone the whole way. You can tell while you work on it.'],
      ],
      a: 1,
    },
    scope:
      'The secrecy studies asked adults about the secrets in their own lives, and they show what went together, not proof of cause. They agree on something hopeful: the heavy part of a secret is carrying it alone, and telling one safe person goes with carrying it less.',
    src: [S.slepian17, S.slepian19],
  },

  l31: {
    id: 'l31',
    title: 'Come back as you are',
    ic: 'heart',
    ask: 'Do I have to be clean before I come back to God?',
    key: 'You do not have to be clean to come back. In the story Jesus told, the father runs to the one still far off.',
    np: 'One honest line I can bring to God as I am',
    hook: {
      h: 'After a slip, you cannot bring yourself to pray.',
      say: 'Are you waiting to be clean first?',
      more: 'For many people of faith, the heaviest part is not the habit. It is feeling they let God down again, and staying away until they have fixed it. This lesson is about that waiting.',
    },
    ask1: {
      h: 'After a slip, what keeps you from prayer, or from your faith community?',
      o: [
        ['I feel I have to earn my way back', 'That feeling is common. The next card asks which way the road runs.'],
        ['I am ashamed to face God', 'Shame says hide. Hold on to that for the next card.'],
        ['I am tired of saying sorry for the same thing', 'That is honest, and heavy. You are far from the first to feel it.'],
        ['Nothing. I go right back', 'That is a strength. Notice how it helps the next day.'],
      ],
    },
    flip: {
      think: 'I let God down again. I should stay away until I am clean.',
      see: 'Shame says clean up first. In the story Jesus told, the father runs to his son while he is still far off.',
      more: 'In the parable of the lost son, the son has wasted everything and rehearses a speech on the way home. He never gets to finish it. While he is still a long way off, his father sees him, is filled with compassion, runs to him and holds him. The son does not clean himself up first. He turns toward home, and the father closes the distance.',
    },
    deep: [
      {
        h: 'The son turned toward home, and his father ran the rest.',
        p: 'He had a speech ready about being unworthy. His father cut it short with a robe, a ring and a feast.',
        art: ['home', {}],
        fact: { s: 'Scripture · Luke 15:11-24', i: [0] },
        more: 'Jesus tells of a young man who takes his inheritance, spends it all, and ends up feeding pigs, hungry enough to envy them. He decides to go home and ask to be a hired hand. His father sees him from far off and runs to him. Before the son can finish his speech, the father calls for the best robe, a ring and a feast, because his son was lost and is found.',
      },
      {
        h: 'They hid. God came looking for them, asking, “Where are you?”',
        p: 'Shame told them to hide in the trees. God came looking for them anyway.',
        fact: { s: 'Scripture · Genesis 3:8-9 · Malachi 3:7', i: [1, 2] },
        more: 'In Genesis, after the man and woman eat from the tree, they hear God walking in the garden and hide among the trees. The first thing shame does is hide. The first thing God does is call out, “Where are you?” It is a question that comes looking. The prophet Malachi carries the same promise: “Return to me, and I will return to you.”',
      },
      {
        h: 'Seeing God as punishing went with a harder time under stress.',
        p: 'Turning to God for strength and comfort went with doing better.',
        fact: { s: 'Meta-analysis · 49 studies · Ano & Vasconcelles, 2005', i: [3] },
        more: 'A review of 49 studies looked at how people lean on faith in hard times. Those who saw a hardship as God punishing them or leaving them tended to struggle more. Those who turned to God for strength, comfort and help tended to do better. How you picture God in a hard moment goes with how you come through it.',
      },
    ],
    mine: { h: 'Coming back after a slip is the walk home.', k: 'back' },
    move: {
      h: 'Turn toward home tonight, as you are.',
      l: ['Pray one honest line, slip and all', 'Tell one safe person, or a faith leader', 'Do the next good thing without waiting'],
    },
    check: {
      h: 'It is 2 a.m. after a slip. You think, “I cannot pray, not after this.” What do you do?',
      o: [
        ['Wait until I have a clean week behind me', 'That is shame setting the terms. The father in the story did not wait for that.'],
        ['Pray one honest sentence, as I am', 'Yes. You turn toward home, and you do not have to arrive clean.'],
        ['Punish myself first, so I deserve to pray', 'Punishment is not the way home in the story. Turning around is.'],
        ['Push it down and act like nothing happened', 'Hiding is what shame did first in the garden, and a question came looking.'],
      ],
      a: 1,
    },
    scope:
      'The parable and the garden story are read in many traditions, and Daybook does not speak for any church. The review of religious coping covered adults facing many kinds of stress, not porn. Together they point the same hopeful way: you can turn toward God as you are, and you do not walk the whole road alone.',
    src: [S.luke, S.genesis, S.malachi, S.ano],
  },

  l8: {
    id: 'l8',
    title: 'Wanting to be loved',
    ic: 'heart',
    ask: 'Does this habit mean I cannot be close to anyone?',
    key: 'Closeness is not found by the unbroken. Two people build it in small turns, and you can take a turn today.',
    np: 'One small true thing I could share, and who with',
    hook: {
      h: 'You like someone. A voice says, “You are too broken for this.”',
      say: 'Is that voice right?',
      more: 'Many people carry this fear: that the habit means they cannot love, or be loved. It hurts because it points at something good. You want to be close to someone.',
    },
    ask1: {
      h: 'What do you think closeness needs from you first?',
      o: [
        ['To be fixed, with this behind me', 'That would mean waiting a long time. The next card asks if it is true.'],
        ['To find the right person', 'The right person matters. The next card is about what the two of you do.'],
        ['Courage to let someone see me', 'That one costs something and gives a lot. Hold on to it.'],
        ['I do not know yet', 'That is honest. The next card gives you a place to start.'],
      ],
    },
    flip: {
      think: 'I am too damaged to be close to anyone.',
      see: 'Closeness is not found by the unbroken. It is built in turns: you share a little, they share a little.',
      more: 'Worth is a verdict, and you cannot do anything about a verdict. Closeness is something two people do: one shares a little, the other answers with a little, and they go one step deeper. Nobody waits until they are whole to start.',
    },
    deep: [
      {
        h: 'Strangers grew closer in 45 minutes, by taking turns.',
        p: 'Each question went a little deeper. They felt closer than pairs who only made small talk.',
        art: ['turns', {}],
        fact: { s: 'Study · Aron et al., 1997', i: [0] },
        more: 'In a lab, researchers paired up students who had never met. Some pairs took turns with questions that grew a little more personal, from what would make a perfect day toward what they valued most. Other pairs made small talk. After about 45 minutes, the pairs who took turns sharing felt closer. The closeness came from what they did, a little at a time.',
      },
      {
        h: 'Your safe person is a good place to take your first turn.',
        p: 'One honest sentence, then listen to theirs. That is how closeness starts.',
        back: 'l7',
      },
    ],
    move: {
      h: 'Take one small turn toward someone this week.',
      l: ['Share one small true thing with a friend', 'Ask them one question, and listen', 'Next time, go one step deeper'],
    },
    check: {
      h: 'You like someone. They ask you something a little personal, and you think, “I am too broken for this.” What now?',
      o: [
        ['Change the subject, and pull back', 'Pulling back feels safe. It also skips the turn that builds closeness.'],
        ['Tell them everything about the habit now', 'You do not owe it all at once. Closeness grows a little at a time.'],
        ['Answer a little, then ask them back', 'Yes. You took your turn. That is how closeness is built.'],
        ['Wait until I have fully quit to answer', 'You do not have to be finished to take a turn. Turns are how it grows.'],
      ],
      a: 2,
    },
    scope:
      'The closeness study paired students who had never met, and it measured feeling close, not love, so nobody can promise how any one relationship will go. What it shows is hopeful and sure: closeness is something people build, a little at a time, and you can start building it now.',
    src: [S.aron],
  },

  l28: {
    id: 'l28',
    title: 'Why groups help',
    ic: 'dots',
    ask: 'Why would a group help me quit?',
    key: 'A group does not change you directly. It changes who you spend time with, and those people do the rest.',
    np: 'One group or one person I could spend an hour with',
    hook: {
      h: 'A room of strangers, or a screen of them. How could that help?',
      say: 'What could people you do not know change?',
      more: 'Groups can feel awkward or pointless before you try one. This lesson is about what they change, and it is not what most people expect.',
    },
    ask1: {
      h: 'Think of the people you spend the most time with. How do they shape your habits?',
      o: [
        ['A lot, more than I like to admit', 'Most people find that. It works in both directions.'],
        ['Not much. I decide for myself', 'You do decide. The next card shows how quietly the people around you tip the scale.'],
        ['They do not know about this habit', 'Then they cannot help with it yet. That is worth noticing.'],
        ['I do not know yet', 'Fair. Watch how you feel after time with different people this week.'],
      ],
    },
    flip: {
      think: 'A room of strangers cannot change who I am.',
      see: 'They do not have to. A group changes who you spend time with, and the people around you change you.',
      more: 'Willpower is something you carry alone. Company is something you live inside. When the people around you are working on the same thing, quitting stops being strange and starts being what people like you do.',
    },
    deep: [
      {
        n: '36%',
        h: 'lower odds of still smoking, once a friend had quit.',
        p: 'In one town followed for 32 years, smokers quit in clusters. Whole circles of friends stopped together.',
        fact: { s: 'Study · 12,067 people · Christakis & Fowler, 2008', i: [0] },
        more: 'Researchers followed 12,067 people in one Massachusetts town from 1971 to 2003, with records of who was friends, married or related to whom. As smoking fell, it fell in clusters: whole groups of connected people stopped together. When a friend quit, a person’s odds of still smoking dropped by 36%, and when a spouse quit, by 67%. The study shows what went together over time, not proof of cause.',
      },
      {
        h: 'AA helped most by changing who people spent time with.',
        p: 'Across 25 years of studies, members traded some old company for people who backed the change.',
        fact: { s: 'Review · 25 years of studies · Kelly, 2017', i: [1] },
        more: 'A review of about 25 years of research on how AA helps found that the biggest route was social: members dropped heavy drinkers from their circle and spent more time with people who did not drink or were in recovery. Other routes were more confidence, less craving and better coping, and for many, more spiritual practice.',
      },
      {
        h: 'One safe person lightens a secret. A group is a room of them.',
        p: 'The first time, you only have to listen. Being there is already the change.',
        back: 'l7',
      },
    ],
    move: {
      h: 'Change who you spend one hour with this week.',
      l: ['Listen at one meeting, camera off is fine', 'Or ask one person to check in weekly', 'Say one true thing when you are ready'],
    },
    check: {
      h: 'You are nervous about your first group. What gives you the best start?',
      o: [
        ['Wait until I can share my whole story', 'You do not have to share anything at first. Being there is the change.'],
        ['Go once and only listen', 'Yes. Listening counts, and you are already around people doing the same work.'],
        ['Skip it. Groups are not for people like me', 'Groups differ a lot. Try two or three before you decide.'],
        ['Commit to a meeting every day right away', 'That is a big jump. Start with one and see how it feels.'],
      ],
      a: 1,
    },
    scope:
      'The town study followed smokers and the AA review followed people with drinking problems, not porn, and both show what went together rather than proof of cause. They agree on something hopeful: the people around you shape a habit, and choosing to be around people who are changing is a step you can take this week.',
    src: [S.christakis, S.kelly],
  },

  l11: {
    id: 'l11',
    title: 'What to call it, and who can help',
    ic: 'compass',
    ask: 'Do I need a label like “addiction” to get help?',
    key: 'You do not need the right name to get help. Ask what it costs you and what you want. Help fits that answer.',
    np: 'One thing it costs me, and the first kind of help I will look at',
    hook: {
      h: 'It is late, and you have read definitions for an hour.',
      say: 'Are you trying to decide if you count?',
      more: 'You will hear porn addiction, compulsive use and problematic use. Many people feel they must settle the name before they are allowed to ask for help.',
    },
    ask1: {
      h: 'If you knew for sure what to call it, what would change for you?',
      o: [
        ['I would feel allowed to get help', 'Then the name is acting as a gate. The next card asks whether it has to.'],
        ['Nothing much. I would still want to change', 'Then the name was never the question. Keep that.'],
        ['I would feel worse about myself', 'That happens to many people. The next cards show why.'],
        ['I do not know yet', 'Fair. Hold the question loosely as you read.'],
      ],
    },
    flip: {
      think: 'I have to know what to call this before I get help.',
      see: 'The name is the wrong question. Ask what it costs you, and whether you want something different.',
      more: 'A name sorts people into boxes, and experts still argue about this one. Cost is something you can see for yourself: sleep, focus, time, closeness, how you feel about yourself. If it costs you something you care about, help fits, whatever anyone calls it.',
    },
    deep: [
      {
        h: 'At the same amount of use, the label went with more distress.',
        p: 'People who saw themselves as hooked felt worse, whatever the hours they watched.',
        fact: { s: 'Studies · 713 adults and 1,215 students · Grubbs et al., 2015', i: [0] },
        more: 'Researchers asked adults and college students how much porn they watched and whether they saw themselves as addicted to it. Seeing themselves that way went with more anxiety, depression and stress, beyond what the amount of use explained, and the link held a year later. Later work found that feeling morally at odds with porn plays a part, too. A label can weigh on you without telling you what to do.',
      },
      {
        h: 'The experts still argue about the name. Help does not wait.',
        p: 'The WHO lists compulsive sexual behaviour disorder. The main US manual has no porn diagnosis.',
        fact: { s: 'Classification · WHO ICD-11, 6C72', i: [1] },
        more: 'The World Health Organization describes compulsive sexual behaviour disorder: a long pattern of failing to control intense, repeated sexual urges, with marked distress or serious problems in life. A related idea was considered for the main US psychiatric manual and left out. Therapists and groups help people whatever the name.',
      },
      {
        h: 'Hold it up to your values, the way you did before.',
        p: 'The gap between what you value and what you do is a better measure than any name.',
        back: 'l22',
      },
    ],
    move: {
      h: 'Ask what it costs, then look at one kind of help.',
      l: ['Name one thing it costs you', 'Name one thing you want instead', 'Look at one therapist, group, or person'],
    },
    check: {
      h: 'It is 11 p.m. You have spent an hour reading definitions to decide if you count. What is a better question?',
      o: [
        ['Which label fits me best?', 'Experts still argue about that. It will not tell you what to do next.'],
        ['Am I as bad as other people?', 'Comparing does not help. Your own life is the measure.'],
        ['What does it cost me?', 'Yes. You can answer that tonight, and the answer points to the help that fits.'],
        ['Should I wait until it gets worse?', 'You do not need a crisis. If it costs you something now, help fits now.'],
      ],
      a: 2,
    },
    scope:
      'The perceived addiction studies show what went together, not proof that a label causes distress, and later work found that moral feelings about porn play a part. The WHO and the US manual still differ on the name. What holds across all of it: help fits when something costs you, whatever it is called.',
    src: [S.grubbs, S.who],
  },

  l5: {
    id: 'l5',
    title: 'Name the act, not yourself',
    ic: 'sliders',
    ask: 'After a slip, how should I talk to myself?',
    key: 'Keep the guilt, which is about what you did and leads to repair. Drop the shame, a verdict on who you are.',
    np: 'A harsh sentence I say to myself, written as something I did',
    hook: {
      h: 'After a slip, your first thought is “I am disgusting.”',
      say: 'Is being hard on yourself the only honest choice?',
      more: 'Most people feel there are two choices after a slip: be hard on yourself, or let yourself off the hook. This lesson is about a third.',
    },
    ask1: {
      h: 'If you stopped being hard on yourself after a slip, what are you afraid would happen?',
      o: [
        ['I would stop caring', 'That fear keeps many people harsh. The next card shows what caring looks like.'],
        ['I would slip more', 'Many people fear that. Watch what the research found.'],
        ['I would be lying to myself', 'You care about honesty. That will matter on the next card.'],
        ['I do not know yet', 'Fair. Notice what the harsh voice says it is protecting.'],
      ],
    },
    flip: {
      think: 'Either I am hard on myself, or I let myself off the hook.',
      see: 'There is a third way. Keep the guilt, which is about the act, and drop the shame, which is a verdict on you.',
      more: 'Guilt says “I did something wrong.” It stings, and it points at something you can repair. Shame says “I am something wrong.” It points at nothing you can fix, so it pushes people to hide. Dropping shame is not dropping the sting. It is keeping the part that helps.',
    },
    deep: [
      {
        h: 'Inmates prone to guilt were less likely to reoffend.',
        p: 'Shame did not protect them. It mostly went with blaming other people.',
        art: ['research', { k: 'shame' }],
        fact: { s: 'Study · 476 jail inmates · Tangney, Stuewig & Martinez, 2014', i: [0] },
        more: 'Researchers measured how prone 476 people in jail were to guilt and to shame, then followed them for a year after release. Those more prone to guilt, the sting about an act, were less likely to be arrested again. Shame, the feeling that the whole self is bad, did not protect them, and it mostly went with blaming other people.',
      },
      {
        h: 'People prone to shame had more alcohol and drug problems.',
        p: 'People prone to guilt mostly did not. The two feelings pulled apart.',
        fact: { s: 'Comparison · students and jail inmates · Dearing et al., 2005', i: [1] },
        more: 'Researchers measured how prone people were to shame and to guilt, then asked about alcohol and drug problems. People more prone to shame had more problems. People more prone to guilt mostly did not.',
      },
      {
        h: '“I already blew it” is shame talking. Name the act instead.',
        p: '“I slipped last night” leaves room for the next good move. “I am a failure” does not.',
        back: 'l3',
      },
    ],
    mine: { h: 'Your log records what you did, and what you did next.', k: 'back' },
    move: {
      h: 'Say what you did, then do one thing about it.',
      l: ['Swap “I am a failure” for “I slipped”', 'Ask: what would I do differently?', 'Do one small thing within the hour'],
    },
    check: {
      h: 'It is the morning after a slip, and your first thought is “I am disgusting.” What do you say instead?',
      o: [
        ['“I deserve to feel awful about this.”', 'That is shame dressed as honesty. It points at nothing you can fix.'],
        ['“It does not matter anyway.”', 'That drops the guilt too, and the guilt was the useful part.'],
        ['“I slipped. I can fix one thing.”', 'Yes. You kept the sting about the act, and dropped the verdict on you.'],
        ['“Next time I will be perfect.”', 'Perfect is a promise nobody keeps. One change is a promise you can keep.'],
      ],
      a: 2,
    },
    scope:
      'The guilt and shame studies followed jail inmates and students, not people who use porn, and shame is not always harmful: it does the most harm when it turns into hiding and blaming. The pattern carries over clearly: the sting about an act helps people repair, and a verdict on the self does not.',
    src: [S.tangney, S.dearing],
  },

  l6: {
    id: 'l6',
    title: 'Kindness after a slip',
    ic: 'leaf',
    ask: 'Will being kind to myself after a slip make me slip more?',
    key: 'Kindness after a failure keeps people trying. Harshness says you cannot change, and kindness says you can.',
    np: 'What I would say to a friend after a slip, and to myself',
    hook: {
      h: 'You slipped. Going easy on yourself feels like letting it win.',
      say: 'Does being harsh keep you on track?',
      more: 'Many people are hard on themselves after a slip because they fear kindness would let them off the hook. This lesson tests that fear.',
    },
    ask1: {
      h: 'After a slip, what does the harsh voice in your head promise it will do for you?',
      o: [
        ['Keep me from doing it again', 'That is its main promise. Watch whether it keeps it.'],
        ['Make sure I take it seriously', 'Taking it seriously matters. The question is which voice helps you do that.'],
        ['Punish me, because I deserve it', 'That one is heavy to carry. The next card offers another way to see it.'],
        ['I do not know yet', 'Fair. Listen for what it says next time.'],
      ],
    },
    flip: {
      think: 'If I go easy on myself, I will just do it again.',
      see: 'Kindness keeps people trying. After failing, people who were kind to themselves worked harder to improve.',
      more: 'Harshness sounds like it keeps you honest, but under it is a message: you are the kind of person who fails. If that is who you are, why try? Kindness says this was a hard moment, and you can change. People try when they believe they can change.',
    },
    deep: [
      {
        h: 'After failing a test, students told to be kind studied longer.',
        p: 'Others got a boost to their self-esteem, or nothing. The kind group put in the most time.',
        art: ['research', { k: 'kind' }],
        fact: { s: 'Experiments · university students · Breines & Chen, 2012', i: [0] },
        more: 'Researchers gave students a hard test that most did poorly on. Some were then asked to think about the failure with kindness and understanding. Others got a boost to their self-esteem, or no message. Given a chance to study for a second test, the kind group studied longest. In other experiments, kindness made people more sure a weakness could change, and more eager to make amends.',
      },
      {
        h: 'Strict dieters treated kindly after a slip ate less, not more.',
        p: 'Among the strictest eaters, kindness meant less distress and less eating after.',
        fact: { s: 'Experiment · college women · Adams & Leary, 2007', i: [1] },
        more: 'College women who were strict about food ate an unhealthy snack. Some were then given a short, kind way to think about it. Among the strictest eaters, those who got the kind message felt less distress and ate less afterward.',
      },
      {
        h: 'You found the words for the act. Kindness is the tone.',
        p: '“I slipped” can be said with contempt or with care. Care is what keeps you trying.',
        back: 'l5',
      },
    ],
    mine: { h: 'Kindness counts what held, too.', k: 'clean30' },
    move: {
      h: 'Talk to yourself the way you would to a friend.',
      l: ['Say: “That was hard. It happened.”', 'Ask: “What do I need now?”', 'Then do the next small thing'],
    },
    check: {
      h: 'It is 7 a.m. after a slip. You think, “If I let myself off now, I will do it again tonight.” What do you do?',
      o: [
        ['Stay hard on myself all day, as a guard', 'Harsh all day drains the strength you need tonight.'],
        ['Speak to myself like a friend would', 'Yes. Kind and practical, and it keeps you trying tonight.'],
        ['Pretend it did not happen', 'Kind does not mean ignoring it. Look at it without attacking yourself.'],
        ['Give up on quitting for a while', 'That is the harsh voice winning another way. You can change, and today counts.'],
      ],
      a: 1,
    },
    scope:
      'The kindness experiments used students facing a failed test and strict dieters after a snack, not people quitting porn. They point the same hopeful way: being kind to yourself after a failure did not make people careless. It made them try harder.',
    src: [S.breines, S.adams],
  },
};
