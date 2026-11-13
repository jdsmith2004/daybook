/* Turned lessons, batch D (the format and the pilot are in lesson-turns.ts). */
import type { Turn } from './lesson-turns';

type Src = [string, string];
const S = {
  kober10: [
    'Kober, Mende-Siedlecki, Kross, Weber, Mischel, Hart & Ochsner (2010): prefrontal-striatal pathway underlies cognitive regulation of craving, Proceedings of the National Academy of Sciences',
    'https://pmc.ncbi.nlm.nih.gov/articles/PMC2930456/',
  ],
  lopez22: [
    'Lopez, Ochsner & Kober (2022): brief training in regulation of craving reduces cigarette smoking, Journal of Substance Abuse Treatment',
    'https://doi.org/10.1016/j.jsat.2022.108749',
  ],
  sayette: [
    'Sayette, Loewenstein, Griffin & Black (2008): exploring the cold-to-hot empathy gap in smokers, Psychological Science',
    'https://doi.org/10.1111/j.1467-9280.2008.02178.x',
  ],
  ariely06: [
    'Ariely & Loewenstein (2006): the heat of the moment, the effect of sexual arousal on sexual decision making, Journal of Behavioral Decision Making',
    'https://doi.org/10.1002/bdm.501',
  ],
  wilson14: ['Wilson et al. (2014): just think, the challenges of the disengaged mind, Science', 'https://doi.org/10.1126/science.1250830'],
  eastwood12: [
    'Eastwood, Frischen, Fenske & Smilek (2012): the unengaged mind, defining boredom in terms of attention, Perspectives on Psychological Science',
    'https://doi.org/10.1177/1745691612456044',
  ],
  cobra: [
    'Richards et al. (2016): behavioural activation vs cognitive behavioural therapy for depression, the COBRA trial, The Lancet',
    'https://eprints.whiterose.ac.uk/id/eprint/105790/',
  ],
  bothe21m: [
    'Bőthe et al. (2021): why do people watch pornography? The motivational basis of pornography use, Psychology of Addictive Behaviors',
    'https://pubmed.ncbi.nlm.nih.gov/32730047/',
  ],
  fluckiger18: [
    'Flückiger, Del Re, Wampold & Horvath (2018): the alliance in adult psychotherapy, a meta-analytic synthesis, Psychotherapy',
    'https://doi.org/10.1037/pst0000172',
  ],
  antons: [
    'Antons et al. (2022): treatments for compulsive sexual behavior disorder and problematic pornography use, a systematic review, Journal of Behavioral Addictions',
    'https://real.mtak.hu/172651',
  ],
  nhs: [
    'NHS: cognitive behavioural therapy (CBT), overview',
    'https://www.nhs.uk/mental-health/talking-therapies-medicine-treatments/talking-therapies-and-counselling/cognitive-behavioural-therapy-cbt/overview/',
  ],
  resch14: [
    'Resch & Alderson (2014): female partners of men who use pornography, are honesty and mutual use associated with relationship satisfaction? Journal of Sex & Marital Therapy',
    'https://pubmed.ncbi.nlm.nih.gov/23898992/',
  ],
  zitzman09: [
    'Zitzman & Butler (2009): wives’ experience of husbands’ pornography use and concomitant deception as an attachment threat, Sexual Addiction & Compulsivity',
    'https://doi.org/10.1080/10720160903202679',
  ],
  schneider98: [
    'Schneider, Corley & Irons (1998): surviving disclosure of infidelity, results of an international survey of 164 recovering sex addicts and partners, Sexual Addiction & Compulsivity',
    'https://jenniferschneider.com/articles/Surviving_Disclosure_of_Infidelity.html',
  ],
  barlow86: [
    'Barlow (1986): causes of sexual dysfunction, the role of anxiety and cognitive interference, Journal of Consulting and Clinical Psychology',
    'https://pubmed.ncbi.nlm.nih.gov/3700800/',
  ],
  nelson11: [
    'Nelson & Purdon (2011): non-erotic thoughts, attentional focus, and sexual problems in a community sample, Archives of Sexual Behavior',
    'https://doi.org/10.1007/s10508-010-9693-1',
  ],
  aa12: ['Alcoholics Anonymous: the Twelve Steps (the wording of the steps)', 'https://www.aa.org/the-twelve-steps'],
  cochrane: [
    'Kelly, Humphreys & Ferri (2020): Alcoholics Anonymous and other 12-step programs for alcohol use disorder, Cochrane review',
    'https://cochranelibrary.com/cdsr/doi/10.1002/14651858.CD012880.pub2/information',
  ],
  pagano04: [
    'Pagano, Friend, Tonigan & Stout (2004): helping other alcoholics in Alcoholics Anonymous and drinking outcomes, findings from Project MATCH, Journal of Studies on Alcohol',
    'https://pmc.ncbi.nlm.nih.gov/articles/PMC3008319/',
  ],
  nordgren09: [
    'Nordgren, van Harreveld & van der Pligt (2009): the restraint bias, how the illusion of self-restraint promotes impulsive behavior, Psychological Science',
    'https://doi.org/10.1111/j.1467-9280.2009.02468.x',
  ],
  match97: [
    'Project MATCH Research Group (1997): matching alcoholism treatments to client heterogeneity, Project MATCH posttreatment drinking outcomes, Journal of Studies on Alcohol',
    'https://pubmed.ncbi.nlm.nih.gov/8979210/',
  ],
  beck: ['Beck et al. (2017): systematic review of SMART Recovery, Psychology of Addictive Behaviors (abstract)', 'https://www.drugsandalcohol.ie/33876/'],
  smarthome: ['SMART Recovery: home page (free meetings led by trained facilitators, and how it describes itself)', 'https://www.smartrecovery.org/'],
  witkiewitz10: [
    'Witkiewitz & Bowen (2010): depression, craving, and substance use following a randomized trial of mindfulness-based relapse prevention, Journal of Consulting and Clinical Psychology',
    'https://pmc.ncbi.nlm.nih.gov/articles/PMC3280693/',
  ],
  bowen14: [
    'Bowen et al. (2014): mindfulness-based relapse prevention compared with relapse prevention and usual care, JAMA Psychiatry',
    'https://www.psychiatry.wisc.edu/wp-content/uploads/2025/05/Article-1_Bowen-et-al-JAMA-2014.pdf',
  ],
  mbrpslides: [
    'Penn State (prevention.psu.edu): slides on relapse prevention and mindfulness-based relapse prevention, including the SOBER breathing space',
    'https://prevention.psu.edu/wp-content/uploads/2009/11/marlatt_RP_MBRP_full.pdf',
  ],
} satisfies Record<string, Src>;

export const TURNS_D: Record<string, Turn> = {
  l44: {
    id: 'l44',
    title: 'Play it forward',
    ic: 'compass',
    ask: 'What can I think about during an urge that makes it weaker?',
    key: 'You know the hour after. In an urge, bring it into view on purpose, both ways, and pick the one you want.',
    np: 'How I feel an hour after, both ways',
    hook: {
      h: 'The urge says the next ten minutes will feel great.',
      say: 'What does it leave out?',
      more: 'An urge is very good at showing you the next few minutes, in bright color. This lesson is about what it keeps in the dark.',
    },
    ask1: {
      h: 'When an urge is loud, what do you picture?',
      o: [
        ['Only the next few minutes', 'Most people do. That narrow view is what the urge counts on.'],
        ['How I will feel after, and I still go', 'Then knowing is not what is missing. The next card is about what is.'],
        ['Nothing. I am on autopilot', 'That is common late at night. A picture you practice can still show up.'],
        ['I do not know yet', 'Fair. Watch where your mind goes at the next urge.'],
      ],
    },
    flip: {
      think: 'I know how I will feel after, and I still do it.',
      see: 'Knowing is not what fails. The urge keeps the hour after out of view, and you can bring it back.',
      more: 'Everyone knows the hour after is coming. In an urge, knowing it and seeing it are two different things. The urge fills the screen with the next few minutes and leaves the hour after in the dark. Bringing it into view on purpose is a skill, and skills grow with practice.',
    },
    deep: [
      {
        h: 'Smokers who thought about later wanted the cigarette less.',
        p: 'The pictures stayed on the screen. Only where they looked changed, and craving fell by about a third.',
        art: ['chain', { n: ['The first minutes', 'The hour after', 'Tomorrow morning'] }],
        fact: { s: 'Study · 21 smokers · Kober et al., 2010', i: [0] },
        more: 'In a brain-scan study, 21 smokers looked at pictures of cigarettes and rich food. Sometimes they thought about how it would feel right now, and sometimes about what comes later. Thinking of later cut craving by about a third. The planning parts at the front of the brain grew busier, and the reward center grew quieter.',
      },
      {
        h: 'smokers practiced looking past the moment, and smoked less.',
        n: '93',
        p: 'A short session of practice was enough to cut how much they smoked in the weeks after.',
        fact: { s: 'Trials · 93 smokers · Lopez, Ochsner & Kober, 2022', i: [1] },
        more: 'In two trials, smokers practiced thinking of what comes later while looking at pictures of cigarettes, in one short session. In the weeks after, they smoked 22% to 49% fewer cigarettes a day. Smokers who did not practice stayed about the same. The view past the moment is something you can train.',
      },
      {
        h: 'You know the wave ends. Now look at where it leaves you.',
        p: 'Riding it out and giving in both end. They leave you in two very different hours.',
        art: ['wave', {}],
        back: 'l2',
      },
    ],
    mine: { h: 'Every urge you ride out gives you an hour after to see.', k: 'rode' },
    move: {
      h: 'At the next urge, play the hour forward, both ways.',
      l: ['The hour after giving in: name it', 'The hour after riding it out: name it', 'Look at both, and pick one'],
      more: 'Use your own words: tired, empty, ashamed, or calm, proud, clear. In SOS, The hour after does this for you, and keeps your words for next time.',
    },
    check: {
      h: 'It is 11 p.m., you are alone, and the urge says it will feel great. What do you look at?',
      o: [
        ['How great the next ten minutes will feel', 'That is the part the urge already shows you. Look past it.'],
        ['How I will feel at midnight, both ways', 'Yes. You brought the hour after into view. Now pick the one you want.'],
        ['How weak I am for even wanting it', 'Shame narrows the view even more. The hour after widens it.'],
        ['My to-do list, to change the subject', 'A list can help a little. The hour after speaks to this exact pull.'],
      ],
      a: 1,
    },
    scope:
      'The brain-scan study was small, with smokers looking at pictures of cigarettes and food, and the practice trials were with smokers too, not people quitting porn. What carries over is the skill: looking past the moment turned craving down, and it grew stronger with practice.',
    src: [S.kober10, S.lopez22],
  },

  l45: {
    id: 'l45',
    title: 'Words from a calm day',
    ic: 'pencil',
    ask: 'Why read my own reasons in the middle of an urge?',
    key: 'In an urge your reasons stay true but go flat. Write one line while calm, and let it speak to that hour.',
    np: 'One line from me, on a calm day',
    hook: {
      h: 'In the morning, you know exactly why you are quitting.',
      say: 'Where does that go at 11 at night?',
      more: 'On a calm day your reasons feel obvious. In an urge they can feel far away, as if someone else wrote them. This lesson is about why, and how to carry them across.',
    },
    ask1: {
      h: 'In an urge, what happens to your reasons for quitting?',
      o: [
        ['I forget them completely', 'That is common, and it is not a lack of caring. The next card says why.'],
        ['I remember them, and they feel flat', 'That is the gap this lesson is about. The words are there, the weight is not.'],
        ['I argue with them, and the urge wins', 'An urge argues well at night. A line from a clearer hour gives you firmer ground.'],
        ['I do not know yet', 'Fair. Notice it at the next urge, and come back to this.'],
      ],
    },
    flip: {
      think: 'When it gets hard, I will remember why I am doing this.',
      see: 'Calm you and urge you cannot feel what the other feels. A line written now is a note from one to the other.',
      more: 'Forgetting your reasons in an urge is not a lack of caring. Calm and craving are two different states, and each one has trouble picturing the other. The reasons stay true, but in the urge they go flat. A line written while calm carries them across in your own voice.',
    },
    deep: [
      {
        h: 'Calm smokers could not picture what a craving would want.',
        p: 'Those already craving guessed right. The calm ones guessed low, and found out later.',
        art: ['research', { k: 'gap' }],
        fact: { s: 'Study · 98 smokers · Sayette et al., 2008', i: [0] },
        more: 'In a study, 98 smokers said how much money it would take for them to put off a cigarette. Some answered while calm, and some while already craving. Once the craving came, many in the calm group asked for more than they had guessed. The craving group had guessed right. A calm mind has trouble feeling a hot one.',
      },
      {
        h: 'The gap runs both ways.',
        p: 'Young men answered the same questions calm and aroused. Their answers changed more than they expected.',
        fact: { s: 'Study · Ariely & Loewenstein, 2006', i: [1] },
        more: 'In a study with male college students, researchers asked the same questions about choices once while calm and once while aroused. Aroused, they answered very differently, and calm, they had not seen that coming. Each state had trouble seeing the other. That is why a message from one to the other helps.',
      },
      {
        h: 'Late and low is when the calm view is farthest away.',
        p: 'So write for that hour. A line is how the daytime view gets into it.',
        back: 'l4',
      },
    ],
    mine: { h: 'Write your line for the hour it will be read.', k: 'hour' },
    move: {
      h: 'Write one line now, while it is calm.',
      l: ['Write to the you of 11 p.m.', 'One true sentence, in your own words', 'Read it slowly when the urge comes'],
      more: 'Keep it small enough to believe. In SOS, Your words shows your line or one of your reasons, with your voice note if you recorded one.',
    },
    check: {
      h: 'It is 10:40 p.m., an hour that has gone badly before. You feel calm. Do you need a note?',
      o: [
        ['No. I feel fine, so I will be fine', 'That is calm you guessing for urge you, and that guess tends to run low.'],
        ['Yes. Calm is when to write it', 'Yes. You can see clearly right now. Send that view ahead.'],
        ['I will write one if an urge comes', 'By then the clear view is gone. The note has to come from here.'],
        ['I will say my reasons ten times now', 'Saying them now does not carry them to later. A line you can read does.'],
      ],
      a: 1,
    },
    scope:
      'The empathy gap studies were with smokers and with young men in a lab, not people quitting porn. What they show is a gap between two states of mind, calm and craving, that neither side sees across well. A line written while calm is a plain way to cross it.',
    src: [S.sayette, S.ariely06],
  },

  l23: {
    id: 'l23',
    title: 'Plan the empty hour',
    ic: 'sunrise',
    ask: 'What do I do with the empty hours when urges are worst?',
    key: 'An empty hour fills itself with whatever is nearest. Put one small, real thing in your hardest hour first.',
    np: 'The hour I will fill, and with what',
    hook: {
      h: 'It is Sunday afternoon, and nothing is planned.',
      say: 'An empty hour never stays empty for long.',
      more: 'For many people the hardest hours are not the stressful ones. They are the empty ones: after dinner, late at night, Sunday afternoon.',
    },
    ask1: {
      h: 'When you have an hour with nothing planned, what fills it?',
      o: [
        ['My phone, almost always', 'The nearest thing wins an empty hour, and the phone is usually nearest.'],
        ['I rest, and then I get restless', 'Rest is good. Rest with no shape tends to drift toward a screen.'],
        ['Something I chose ahead of time', 'That is the skill this lesson is about. Notice how those hours go.'],
        ['I do not know yet', 'Look back at last Sunday. What did the empty part turn into?'],
      ],
    },
    flip: {
      think: 'Evenings are hard because I run out of willpower.',
      see: 'An empty hour does not stay empty. The mind fills it with whatever is nearest, so choose what goes in first.',
      more: 'It feels like a shortage of willpower. Often it is a vacancy. An hour with nothing in it makes the mind look for something to hold, and it grabs what is closest. Put something there first, and the urge finds the seat taken.',
    },
    deep: [
      {
        h: 'In one study, people left alone to think shocked themselves.',
        p: 'They had said they would pay to avoid that shock. Fifteen minutes of nothing was harder than they thought.',
        art: ['chain', { n: ['Nothing planned', 'Restless', 'Phone in hand', 'Scrolling'] }],
        fact: { s: 'Study · Wilson et al., 2014', i: [0] },
        more: 'In one study, people sat alone in a plain room for 15 minutes with nothing to do but think. A button could give them a mild electric shock, which they had felt earlier and said they would pay to avoid. Two in three men and one in four women pressed it at least once. For most minds, an empty stretch is not restful. It goes looking for something to do.',
      },
      {
        h: 'Boredom is wanting to do something and finding nothing to hold.',
        p: 'It is not laziness. It is attention looking for a place to land, and it lands on what is closest.',
        fact: { s: 'Review · Eastwood et al., 2012', i: [1] },
        more: 'Researchers who study attention describe boredom as wanting to be engaged and not finding anything that holds you. It is uncomfortable, so the mind reaches for relief. That is why the empty hour is a setup, and why a plan in it helps so much.',
      },
      {
        h: 'You changed the room. Now put something in the hour.',
        p: 'A room with no phone in reach and an hour with a plan leave the urge little to land on.',
        back: 'l10',
      },
    ],
    mine: { h: 'Here are the hours most worth filling.', k: 'hour' },
    move: {
      h: 'Put one real thing in your hardest hour, first.',
      l: ['Find your hardest hour in your log', 'Put one small thing in it, with a time', 'Start it before you feel like it'],
      more: 'Ten minutes counts: a walk, a call, cooking, a project with your hands. You do not have to feel like it first. In a large trial for depression, getting active on a plan did about as well as talk therapy a year later.',
    },
    check: {
      h: 'Sunday, 3 p.m., your hard hour. Nothing is planned, and you are on the couch with your phone.',
      o: [
        ['Wait and see if an urge shows up', 'Waiting leaves the hour empty, and the phone is right there to fill it.'],
        ['Phone away, and out for a walk', 'Yes. You put something in the hour before the nearest thing did.'],
        ['Hold out on willpower until evening', 'That is the hardest way to spend an empty hour. Fill it instead.'],
        ['Plan a busier Sunday for next week', 'Next week helps next week. This hour still has room in it.'],
      ],
      a: 1,
    },
    scope:
      'The shock study was with students in a lab, and what it means is still argued over, so take it as one striking scene, not a law. Boredom research is about attention in general, and the activity trial was for depression. They point one way: an hour with a plan in it goes better than an empty one.',
    src: [S.wilson14, S.eastwood12, S.cobra],
  },

  l36: {
    id: 'l36',
    title: 'What the habit does for you',
    ic: 'compass',
    ask: 'What is porn doing for me in a hard moment?',
    key: 'Often the urge is a way out of a feeling. Name the feeling, and give it something better than a way out.',
    np: 'The feeling I most often reach for porn to get away from',
    hook: {
      h: 'It is 9 p.m., after an argument, and the urge shows up fast.',
      say: 'Is it desire, or a way out of something?',
      more: 'After a long day, an argument, or a quiet evening, the urge can show up like an exit sign. This lesson is about what it is offering a way out of.',
    },
    ask1: {
      h: 'Just before an urge, what are you usually feeling?',
      o: [
        ['Stressed or tense', 'Then the urge is offering relief. Relief is a need you can meet other ways.'],
        ['Bored or empty', 'Then it fills a gap, and a gap can be filled with other things.'],
        ['Lonely or low', 'Then it stands in for closeness. That is worth knowing, not hiding.'],
        ['Desire, plain and simple', 'Sometimes it is. Watch the next few. A feeling often comes first.'],
      ],
    },
    flip: {
      think: 'It is about sex. I just cannot control my desire.',
      see: 'Often it is not about sex. It is a way out of a feeling, and the feeling is still there when it ends.',
      more: 'If it were only desire, more willpower would settle it. When it is a way out of stress, loneliness or a low mood, the urge keeps coming back because the feeling does. That is not a flaw in you. It is a need looking for a door, and you can give it a better one.',
    },
    deep: [
      {
        h: 'Escaping a feeling went with problems. How often did not.',
        p: 'In three large surveys, using porn to push a feeling away went with use that felt out of control.',
        art: ['loop', { n: ['A hard feeling', 'The urge', 'Short relief', 'Feeling still there'], c: 'A way out that leads back in' }],
        fact: { s: 'Surveys · 2,646 adults · Bőthe et al., 2021', i: [0] },
        more: 'Researchers asked more than 2,600 adults, women and men, in three samples why they watch porn. Pleasure was one reason, and stress, boredom and curiosity were others. Watching to push away a bad feeling stood out: it went with use that felt out of control, and not with how often people watched. The reason behind it mattered more than the amount.',
      },
      {
        h: 'When liking fades, what is left to chase is relief.',
        p: 'You saw the wanting grow while the enjoying stayed flat. Often the wanting is after a way out.',
        back: 'l33',
      },
    ],
    mine: { h: 'Your log can show which feeling comes first.', k: 'trigger' },
    move: {
      h: 'Meet the feeling, and the urge has less to do.',
      l: ['Name the feeling under the urge', 'Give that feeling what it needs', 'Do it early, as the feeling starts'],
      more: 'A walk or a shower for stress. A person for loneliness. Sleep for tired. Something with your hands for empty.',
    },
    check: {
      h: 'After a hard call, your chest is tight and the urge comes fast. What do you reach for first?',
      o: [
        ['A walk, or a call to someone', 'Yes. You met the feeling the urge was offering to fix.'],
        ['Willpower, to push the desire down', 'The desire is not the main thing here. The tight chest is.'],
        ['Porn, since it was a hard day', 'It would ease the tightness for a few minutes, and the hard call would still be there.'],
        ['Nothing. Wait for the tightness to go', 'Sitting with it is hard. One small thing for it helps more.'],
      ],
      a: 0,
    },
    scope:
      'The surveys asked adults why they watch, and they show what goes together, not what causes what. Pleasure mattered too, so it is not only about feelings. What they show is that the reason behind use matters, and a reason is something you can plan for.',
    src: [S.bothe21m],
  },

  l24: {
    id: 'l24',
    title: 'What therapy is like',
    ic: 'heart',
    ask: 'Would therapy help with this, and what is it like?',
    key: 'Therapy is a partnership you choose. Fit matters, so say how it feels, and switch if it does not get better.',
    np: 'One question I would ask a therapist',
    hook: {
      h: 'You have thought about therapy, and pictured being judged.',
      say: 'Most people picture a judge with a notepad.',
      more: 'Many people picture a stranger with a notepad deciding what is wrong with them. This lesson is about what it is like, and what makes it work.',
    },
    ask1: {
      h: 'What worries you most about seeing a therapist?',
      o: [
        ['Saying it out loud to someone', 'That first sentence is the hardest. Therapists hear it often, and calmly.'],
        ['Being judged', 'That fear keeps many people away. It is also something you can test, and leave.'],
        ['Paying for the wrong person', 'Fair. Fit is the thing to watch, and you are allowed to switch.'],
        ['I do not know yet', 'That is fine. Read on, and notice what eases.'],
      ],
    },
    flip: {
      think: 'A therapist would sit there and judge me.',
      see: 'Therapy is a partnership you choose, and the fit between you is one of the best signs of how it will go.',
      more: 'The picture of a judge behind a desk keeps people away. What helps is closer to working with a coach you trust: you agree on what you are working on, and you can say when it is not working. You are not on trial. You are choosing a partner, and you can choose again.',
    },
    deep: [
      {
        h: 'In hundreds of studies, fit was a top sign of how it would go.',
        p: 'A good bond with the therapist, and agreeing on goals, went with better results in every kind of therapy.',
        fact: { s: 'Review · 295 studies · Flückiger et al., 2018', i: [0] },
        more: 'Researchers pulled together 295 studies of adult therapy, with more than 30,000 people. Across methods, countries and ways of measuring, people who felt a good working bond with their therapist, and agreed on what they were working on, tended to do better. It held up again and again.',
      },
      {
        h: 'For problem porn use, treatment appeared to help.',
        p: 'A review of 24 studies found symptoms improved, and skills-based therapy (CBT) had the most support.',
        fact: { s: 'Review · 24 studies · Antons et al., 2022', i: [1] },
        more: 'A 2022 review of treatments for compulsive sexual behavior and problem porn use found that treatment appeared to improve symptoms, and that cognitive behavioral therapy had the strongest support. Getting help is a real option for this exact problem, not a last resort.',
      },
      {
        h: 'You know who can help. This is how to choose the person.',
        p: 'Try one, say plainly how it feels, and switch if it does not get better.',
        back: 'l11',
      },
    ],
    mine: { h: 'You have already started the work, before any session.', k: 'acted' },
    move: {
      h: 'Ask how they work, and say how it fits.',
      l: ['Ask what approach they use, and why', 'After two sessions, say how it feels', 'Switch if it does not get better'],
      more: 'A typical course of CBT is about 5 to 15 sessions, with practice in between. Trying someone and deciding they are not the right fit is part of doing it well.',
    },
    check: {
      h: 'Two sessions in, your therapist is kind, but you leave feeling unheard. What do you do?',
      o: [
        ['Quit therapy. It is not for me', 'One poor fit is not a verdict on therapy. Fit is something you can change.'],
        ['Say so at the next session', 'Yes. Saying it often fixes the fit. If it does not, you try someone else.'],
        ['Keep going and say nothing', 'Silence leaves the fit as it is. Telling them is part of the work.'],
        ['Wait until things get really bad', 'You do not need a crisis to deserve help. It counts now.'],
      ],
      a: 1,
    },
    scope:
      'The studies on fit were about therapy for many problems, not porn in particular, and they show what goes with good results. The review of treatments for problem porn use is newer and smaller, and it points the same hopeful way: help works, and you get a say in it.',
    src: [S.fluckiger18, S.antons, S.nhs],
  },

  l47: {
    id: 'l47',
    title: 'Your partner and the truth',
    ic: 'heart',
    ask: 'Should I tell my partner? And if they found out, can trust come back?',
    key: 'Hiding does not shield your partner. Honesty lets them feel safe, and it is yours whatever they decide.',
    np: 'What I want my partner to be able to count on from me',
    hook: {
      h: 'There is something your partner does not know, and it is heavy.',
      say: 'Telling can feel like it would break something.',
      more: 'Maybe they do not know. Maybe they found out, and nothing feels the same. Either way you want to make it right, and you are afraid of making it worse. This lesson is honest about what helps, and about what nobody can promise.',
    },
    ask1: {
      h: 'When you think about telling your partner, what stops you?',
      o: [
        ['I do not want to hurt them', 'That care is real. The next card asks whether hiding spares them.'],
        ['I am afraid they will leave', 'That fear is common. In one survey, most couples were still together later.'],
        ['I am ashamed of it', 'Shame wants it hidden. It often gets lighter once it is said.'],
        ['They already know, and it is still hard', 'Then this lesson is about what rebuilds trust from here.'],
      ],
    },
    flip: {
      think: 'Telling them would only hurt them. Keeping quiet is kinder.',
      see: 'Hiding does not shield them. Partners say the hiding is much of the hurt, and honesty helps them feel safe.',
      more: 'Keeping quiet feels like protecting them. Partners who find out often say the porn hurt, and the hiding hurt in a different way: it made them wonder what else they did not know. Honesty does not take the hurt away on the day. It gives them solid ground to stand on.',
    },
    deep: [
      {
        h: 'Partners who saw honesty were more content and less upset.',
        p: 'In a survey of 340 women, those who saw their partner as honest about porn were happier together.',
        fact: { s: 'Survey · 340 women · Resch & Alderson, 2014 · Interviews · 14 wives · Zitzman & Butler, 2009', i: [0, 1] },
        more: 'In a survey of 340 women whose partners used porn, those who saw their partner as honest about it were more satisfied in the relationship and less distressed about the porn. In a separate set of interviews, wives in couple therapy described the deception, along with the porn, as what shook their sense of safety at home.',
      },
      {
        h: 'of partners later said telling was the right thing.',
        n: '93%',
        p: 'So did 96% of those who told. On the day itself, far fewer felt sure.',
        fact: { s: 'Survey · 164 people · Schneider, Corley & Irons, 1998', i: [2] },
        more: 'A survey asked 82 people in recovery from compulsive sexual behavior and 82 partners. At the time, 81% of partners and 58% of those telling thought it was right. Later, it was 93% and 96%. Telling did not stop slips: about half had a hard slip later. What it did was end the hiding, and trust had somewhere to grow from.',
      },
      {
        h: 'A secret is heavy for one. Between two people, it is a wall.',
        p: 'Telling takes the wall down. What you do after is what trust is built on.',
        back: 'l7',
      },
    ],
    mine: { h: 'Honesty starts small, and you have started.', k: 'acted' },
    move: {
      h: 'Be the one who tells, and let what you do carry it.',
      l: ['Tell it plainly, with no excuses', 'Let them ask, and answer honestly', 'Tell a slip soon, and say what is next'],
      more: 'Give them room: their hurt and their timeline are theirs. They are not your police, and keeping you free is not their job. If telling would not be safe, talk to a counselor first. Nobody can promise how it ends, and being honest is yours either way.',
    },
    check: {
      h: 'Two months of honesty. Last night you slipped, and they have no way to know. What protects the trust?',
      o: [
        ['Say nothing, so one night does not undo it', 'It feels kind. The hiding is what trust breaks on, and a found slip goes worse.'],
        ['Tell them soon, and say what is next', 'Yes. It is hard, and it is what you have been building: they can believe you.'],
        ['Promise it will never happen again', 'A big promise is easy to break. Honest words now are the promise you can keep.'],
        ['Ask them to check my phone every night', 'That makes them your police, and it wears on you both. The honesty is yours.'],
      ],
      a: 1,
    },
    scope:
      'These studies asked partners, mostly women with male partners, and people in recovery who chose to answer, so they show what goes together and how people felt looking back. Telling did not keep anyone from slipping. It ended the hiding, and most on both sides said it was right.',
    src: [S.resch14, S.zitzman09, S.schneider98],
  },

  l48: {
    id: 'l48',
    title: 'Sex after porn',
    ic: 'leaf',
    ask: 'What do I do when desire goes quiet after quitting?',
    key: 'A quiet stretch needs no test. Desire does better with your attention on the person, not on checking yourself.',
    np: 'What I want my sex life to be, by my own values',
    hook: {
      h: 'Three weeks in, your desire has gone quiet.',
      say: 'Is something wrong, or is something resting?',
      more: 'Many people quit and then have questions they feel they cannot ask anyone. This lesson is about one of them: what to do when desire goes quiet.',
    },
    ask1: {
      h: 'When desire goes quiet, what goes through your mind?',
      o: [
        ['That something is broken', 'That fear is common, and it pulls attention inward. The next card is about that.'],
        ['That I should test it', 'Many people feel that pull. The test is worth a second look.'],
        ['Relief, if I am honest', 'That is fair. A quiet stretch can be a rest.'],
        ['I do not know yet', 'That is fine. Notice it without grading it.'],
      ],
    },
    flip: {
      think: 'I should check that everything still works.',
      see: 'Checking is what spooks it. Desire needs your attention on the person, and checking turns it onto a gauge.',
      more: 'Testing feels like getting an answer. But watching yourself to see how you are doing pulls attention off the moment and onto a dial, and that is the very thing that dims desire. A quiet stretch is not a broken body. Leave the gauge alone.',
    },
    deep: [
      {
        h: 'Worry about how you are doing pulls attention off the moment.',
        p: 'In people with sexual problems, watching yourself instead of being with the person dimmed arousal.',
        fact: { s: 'Model · Barlow, 1986', i: [0] },
        more: 'The psychologist David Barlow described a pattern seen in people with sexual problems in general. Worry about performance turns attention inward, to how you are doing, and away from the person and the moment. That shift is what weakens arousal. Researchers call it spectating: watching yourself from the outside.',
      },
      {
        h: 'Getting back to the moment mattered more than stray thoughts.',
        p: 'In 153 adults in long relationships, those who found it hard to refocus had more sexual problems.',
        fact: { s: 'Study · 153 adults · Nelson & Purdon, 2011', i: [1] },
        more: 'Researchers asked 72 men and 81 women in long relationships about the thoughts that come up during sex. For the men, the most common were about performance. Having stray thoughts was ordinary. What went with more problems was having a hard time bringing attention back.',
      },
      {
        h: 'Coming back to the room works here too.',
        p: 'The skill you practiced for urges is the same one: attention back on what is in front of you.',
        back: 'l43',
      },
    ],
    move: {
      h: 'Skip the test, and give your body time.',
      l: ['A quiet stretch needs no checking', 'With a partner, put attention on them', 'Ask a doctor if it worries you'],
      more: 'Nobody can say how long a quiet stretch lasts, and it says nothing final about you. On masturbation, science has no rule for you, so your values decide. With a partner, say what you are going through, and go slowly. A doctor has heard every question before.',
    },
    check: {
      h: 'Three weeks in, desire is quiet. It is 11 p.m., you are alone, and a thought says to check with porn.',
      o: [
        ['Check once, just to know', 'A test turns attention onto a gauge, and it is a common way back in.'],
        ['Call it a quiet stretch, and rest', 'Yes. Nothing needs checking tonight. A rest is not a verdict.'],
        ['Decide that my body is broken', 'A quiet stretch is not a broken body. Nobody has shown that quitting harms it.'],
        ['Push myself to feel desire right now', 'Pressure turns attention back onto the gauge. Let it rest tonight.'],
      ],
      a: 1,
    },
    scope:
      'The research on attention and arousal comes from people with sexual problems in general and from couples in the community, not from people quitting porn, and it shows what goes together. Nobody can say how long a quiet stretch lasts. What it does show is that checking pulls attention the wrong way, and attention can move.',
    src: [S.barlow86, S.nelson11],
  },

  l25: {
    id: 'l25',
    title: 'The 12 steps in plain words',
    ic: 'book',
    ask: 'What are the 12 steps, and could they help me?',
    key: 'Helping someone else is not a prize at the end. It is one of the ways people get free, and it can start small.',
    np: 'The step that feels closest to where I am',
    hook: {
      h: 'You have heard of the 12 steps. The last one is helping others.',
      say: 'Is that only for people who have it figured out?',
      more: 'The steps began with Alcoholics Anonymous. In plain words they come down to honesty, other people, and action. This lesson is about the part most people save for later.',
    },
    ask1: {
      h: 'Who could you help right now, with what you have learned?',
      o: [
        ['No one. I am still struggling', 'Many feel that. Struggling and helping often happen at the same time.'],
        ['A friend who is having a hard time', 'Then you already have something to give. The next cards are about that.'],
        ['Someone newer than me, someday', 'Someday is fine. The study ahead found that sooner went with doing better.'],
        ['I do not know yet', 'That is fine. Hold the question for the next card.'],
      ],
    },
    flip: {
      think: 'I have to be fixed before I can help anyone.',
      see: 'Helping is not a prize for the end. It is one of the ways people get free, and it starts early.',
      more: 'It feels like helping should wait until you are sure of yourself. In the steps, it is part of the work from the start. Saying one honest thing to someone who is struggling changes how you see yourself: from someone with a problem to someone with something to give.',
    },
    deep: [
      {
        h: 'of people who helped others stayed sober, against 22% who did not.',
        n: '40%',
        p: 'In a large study of drinking, helping went with fewer relapses, however many meetings people went to.',
        fact: { s: 'Study · 1,501 adults · Pagano et al., 2004', i: [2] },
        more: 'In Project MATCH, a large US study of treatment for drinking, people were asked three months in whether they were helping others in AA. A year after treatment, 40% of the helpers had stayed sober, against 22% of the rest, and the gap held after counting meetings. They were helping early, not at the finish line.',
      },
      {
        h: 'The steps come down to honesty, other people, and action.',
        p: 'Admit willpower alone has not worked, tell someone the truth, make things right, and help others.',
        fact: { s: 'Program · Alcoholics Anonymous, the Twelve Steps · Cochrane review · 27 studies · Kelly et al., 2020', i: [0, 1] },
        more: 'In plain words, not AA’s own: admit that willpower alone has not been enough, and reach out. Look honestly at yourself and tell another person. Make things right where it would not hurt anyone. Keep checking yourself, and help someone else. For drinking, a review of 27 studies found about 42 in 100 people fully sober a year later with programs built on the steps, against about 35 in 100 with other treatments.',
      },
      {
        h: 'Groups change who you spend time with. Helping changes you.',
        p: 'You become one of the people someone else is glad to have around.',
        back: 'l28',
      },
    ],
    mine: { h: 'You already know things someone newer does not.', k: 'acted' },
    move: {
      h: 'Borrow one step, and help in a small way.',
      l: ['Tell one safe person the truth', 'Answer a friend who is struggling', 'Share what helped, not your whole story'],
      more: 'You do not have to join anything or guide anyone. Groups like Sex Addicts Anonymous adapt the steps, and at a first meeting you can just listen.',
    },
    check: {
      h: 'You are three weeks in and feel shaky. A friend writes that they are struggling too. It is 10 p.m.',
      o: [
        ['Say nothing. I am in no place to help', 'You do not need to be finished to help. A few honest words count.'],
        ['Write back one thing that helped', 'Yes. Small and honest. It helps them, and it steadies you.'],
        ['Send a long list of everything I know', 'Too much at once is hard to take in. One thing that helped is plenty.'],
        ['Tell them to go find an expert', 'Help can come from both. A word from you tonight still counts.'],
      ],
      a: 1,
    },
    scope:
      'The helping study was about drinking, not porn, and it followed people rather than testing helping as a treatment, so helpers may have differed in other ways. The review of 12-step programs was about alcohol too. What carries over is the shape: honesty, other people, and action, with helping part of it from early on.',
    src: [S.aa12, S.cochrane, S.pagano04],
  },

  l49: {
    id: 'l49',
    title: 'Day 30, 60, 90, and after',
    ic: 'flag',
    ask: 'It is going well. What do I watch for now, and what does keeping it look like?',
    key: 'You have nothing to test. People who keep it stay clear on purpose, and that is what strong looks like.',
    np: 'The small yes I am most likely to allow again, and what I will do when I notice it',
    hook: {
      h: 'Day 60. A thought: “I could look once, to see I am past it.”',
      say: 'Does that feel like an urge, or like confidence?',
      more: 'It does not feel like an urge. It feels like proof of how far you have come. This lesson is about the quiet part of getting free, when things are good.',
    },
    ask1: {
      h: 'When it is going well, what does strong look like to you?',
      o: [
        ['Being able to look and not care', 'Many people picture strength that way. The next card turns it over.'],
        ['Not having to think about it', 'That comes, slowly. It comes from habits, not from tests.'],
        ['Staying clear of what pulls me', 'That is the kind of strength the research points to.'],
        ['I do not know yet', 'Fair. Hold it for the next card.'],
      ],
    },
    flip: {
      think: 'After this long, I could test myself and be fine.',
      see: 'The people surest of their control walk closest to temptation. Staying clear is what strength looks like.',
      more: 'A test feels like the natural next step after a good stretch. But feeling sure of your control makes temptation look safer than it is. The steady ones are not the ones who prove they can stand near it. They are the ones who do not need to.',
    },
    deep: [
      {
        h: 'Among people who had quit smoking, the surest walked closer.',
        p: 'Those surest of their self control planned to avoid temptation less, and more of them smoked again.',
        art: ['gate', {}],
        fact: { s: 'Study · people who had quit smoking · Nordgren et al., 2009', i: [0] },
        more: 'In a study of people who had quit smoking for at least three weeks, researchers asked how strong their self control was, and how hard they would try to stay away from places where they would want to smoke. Those who rated their control highest planned to try least, and four months later more of them were smoking again. In other experiments, with hunger and tiredness, the same thing happened.',
      },
      {
        h: 'The test is a first link, dressed up as confidence.',
        p: 'It looks like proof you are free. It is the small yes you already know how to catch.',
        back: 'l17',
      },
    ],
    mine: { h: 'Look at the days that held.', k: 'clean30' },
    move: {
      h: 'Stay clear on purpose, and keep what got you here.',
      l: ['Name it: “That is the test.”', 'Tell your safe person you noticed', 'Keep the plain things, like the phone out'],
      more: 'Fill your life too: one thing you enjoy and one person, every week. A life with joy in it is easier to keep than a life of only rules.',
    },
    check: {
      h: 'Day 75. A friend sends a link: “It is nothing, you are past this.” You feel strong and curious.',
      o: [
        ['Open it, to prove I am past it', 'That is the test. Strong people do not need to take it.'],
        ['Leave it, and say I am not interested', 'Yes. That is what strong looks like now: you stayed clear, with no drama.'],
        ['Open it, but only for a second', 'A second is still the test. Staying clear costs you nothing.'],
        ['Worry that wanting to look means I failed', 'Curiosity is a thought, not a failure. You stayed clear, and that is what counts.'],
      ],
      a: 1,
    },
    scope:
      'The confidence study was small, with people who had quit smoking, and the other experiments were about hunger and tiredness, not porn. What carries over is a quirk of human judgment: feeling sure of your control makes temptation look safer than it is. Staying clear is a choice you can make every time.',
    src: [S.nordgren09],
  },

  l26: {
    id: 'l26',
    title: 'SMART Recovery: four points and a toolbox',
    ic: 'sliders',
    ask: 'Is there a skills-based alternative to the 12 steps?',
    key: 'Very different programs help about as much. Pick the one you will keep going back to, and borrow its tools.',
    np: 'The SMART tool I would try first',
    hook: {
      h: 'You went to one meeting, and it did not feel right.',
      say: 'Does that mean groups are not for you?',
      more: 'SMART Recovery offers free meetings, online and in person, led by trained facilitators. It is not a 12-step program. This lesson is about what it teaches, and how to pick a program at all.',
    },
    ask1: {
      h: 'What would make a program one you keep going back to?',
      o: [
        ['People like me in the room', 'That matters a lot. It is worth looking for on purpose.'],
        ['Tools I can use the same night', 'Then a skills program like SMART is worth a try.'],
        ['No talk of being powerless', 'SMART speaks of self-empowered recovery. Many people find that fits.'],
        ['I do not know yet', 'That is fine. Trying two or three is how people find out.'],
      ],
    },
    flip: {
      think: 'If one program does not fit me, none will.',
      see: 'Very different programs got similar results. The best one for you is the one you keep going back to.',
      more: 'It is easy to treat one bad meeting as a verdict on all of them. A large trial found that quite different treatments helped about as much. So the question is not which program is right. It is which one you will keep showing up to.',
    },
    deep: [
      {
        h: 'adults with drinking problems got one of three different treatments.',
        n: '1,726',
        p: 'A year later, all three groups had improved, and by about the same amount.',
        fact: { s: 'Trial · 1,726 adults · Project MATCH, 1997', i: [0] },
        more: 'Project MATCH, a large US trial, gave people with drinking problems one of three quite different 12-week treatments: skills therapy, motivational counseling, or help getting into the 12 steps. A year later, all three groups were drinking far less, and by about the same amount. What people brought with them, like readiness and support at home, mattered a lot.',
      },
      {
        h: 'SMART teaches four points, each with tools.',
        p: 'Motivation, urges, thoughts and feelings, and a balanced life. Its meetings have no religious content.',
        fact: { s: 'Program · SMART Recovery · Review · 12 studies · Beck et al., 2017', i: [2, 1] },
        more: 'Its toolbox includes a cost-benefit list, an urge log, and DENTS for urges: deny or delay, escape, neutralize, tasks, swap. A 2017 review found 12 studies of SMART, mostly about alcohol. They showed positive effects, and the authors called for more research.',
      },
    ],
    move: {
      h: 'Try two or three, and keep the one you go back to.',
      l: ['Try a SMART meeting, online or near you', 'Borrow one tool: DENTS for urges', 'Notice which one you look forward to'],
      more: 'DENTS: delay the urge, escape the setting, neutralize the thought, do a task, or swap in something else. None of it needs a meeting.',
    },
    check: {
      h: 'You went to a 12-step meeting once, and it did not feel right. It is 9 p.m. What now?',
      o: [
        ['Give up on groups', 'One room is not every room. Very different programs helped about as much.'],
        ['Try a different kind, like SMART', 'Yes. You are looking for the one you will keep going back to.'],
        ['Force myself back until I like it', 'You can give it another try. A program you dread is hard to keep up.'],
        ['Wait for the perfect program', 'No program is best for everyone. The one you keep going to is best for you.'],
      ],
      a: 1,
    },
    scope:
      'The big trial compared three treatments for drinking, not group meetings and not porn. SMART’s own research is early and mostly about alcohol, and its authors call for more. Together they say the same hopeful thing: there is more than one good road, and showing up is what makes one work.',
    src: [S.match97, S.beck, S.smarthome],
  },

  l27: {
    id: 'l27',
    title: 'Mindfulness and relapse prevention',
    ic: 'wind',
    ask: 'Can I learn to pause before I act on an urge?',
    key: 'The mood does not have to leave first. A short pause loosens the link from mood to craving to action.',
    np: 'One place in my day for a one-minute pause',
    hook: {
      h: 'A bad day at work. By 8 p.m. you feel low and short.',
      say: 'Does the mood have to lift before you are safe?',
      more: 'Many people wait for a better mood before they feel safe from an urge. This lesson is about what to do while the mood is still here.',
    },
    ask1: {
      h: 'When you feel low, what usually comes next?',
      o: [
        ['An urge, almost right away', 'Many people have that link. The next cards are about loosening it.'],
        ['I try to cheer myself up first', 'That can help. When it does not work, there is another way.'],
        ['I wait it out, and it is hard', 'Waiting is a skill. This lesson adds a pause to it.'],
        ['I do not know yet', 'Watch the next low evening. Notice what follows the mood.'],
      ],
    },
    flip: {
      think: 'To stay free, I need my bad moods to go away first.',
      see: 'The mood can stay. Practice loosens the link from mood to craving to action, and that link is what breaks.',
      more: 'Low moods come to everyone, and no plan makes them stop. What changes with practice is what the mood leads to. A short pause puts space between feeling low and wanting relief, and between wanting relief and acting.',
    },
    deep: [
      {
        h: 'After the training, low moods pulled craving along less.',
        p: 'The low moods still came. In the trained group, craving no longer carried them through to use.',
        art: ['chain', { n: ['Low mood', 'Craving', 'Acting on it'] }],
        fact: { s: 'Trial · 168 adults · Witkiewitz & Bowen, 2010', i: [0] },
        more: 'In a US trial, 168 adults leaving treatment for drugs or alcohol got eight weeks of mindfulness-based relapse prevention or usual care. In usual care, low mood led to craving, and craving led to use. In the mindfulness group, craving no longer carried low mood through to use, and two months later the link from low mood to craving was weaker. The authors call the results early.',
      },
      {
        h: 'adults leaving treatment learned to pause, and it held for a year.',
        n: '286',
        p: 'Their risk of using drugs was about half that of usual care, and heavy drinking fell even more.',
        fact: { s: 'Trial · 286 adults · Bowen et al., 2014', i: [1] },
        more: 'In a US trial, 286 adults who had finished treatment for drugs or alcohol got mindfulness-based relapse prevention, standard relapse prevention, or usual aftercare. Together, the two relapse-prevention groups had about a 54% lower risk of using drugs and a 59% lower risk of heavy drinking over 12 months.',
      },
      {
        h: 'The pause has five steps, and takes a minute.',
        p: 'Stop. Observe. Breathe. Expand your attention to the room. Respond, by choice.',
        fact: { s: 'Training slides · Marlatt, Penn State', i: [2] },
        more: 'It is called the SOBER breathing space. Stop what you are doing. Observe your body and mind. Breathe. Expand your attention to your whole body and the space around you. Respond: choose what to do, instead of reacting on autopilot.',
      },
    ],
    mine: { h: 'Urges come with moods, and they still end.', k: 'rode' },
    move: {
      h: 'When the mood is low, run the one-minute pause.',
      l: ['Stop, and observe the mood', 'Breathe, and widen to the room', 'Then choose what comes next'],
      more: 'The full program is eight weeks of sessions and daily practice. One minute a day is a start.',
    },
    check: {
      h: 'A bad day. At 8 p.m. you feel low, and the urge comes. Nothing will lift the mood tonight.',
      o: [
        ['Wait until the mood lifts, then decide', 'Tonight the mood is staying. You can still choose with it here.'],
        ['Pause, then choose with the mood here', 'Yes. The mood can stay. The pause is what changes what it leads to.'],
        ['Force myself to feel better first', 'Forcing a mood rarely moves it. The pause works with the mood as it is.'],
        ['Give in, since the day is already bad', 'A bad mood does not decide for you. The link between them can loosen.'],
      ],
      a: 1,
    },
    scope:
      'These trials were with adults leaving treatment for drugs or alcohol, not people quitting porn, and the mood study is early work by its own authors. What carries over is the skill: a pause, practiced, changed what low moods led to, and the benefit held over a year.',
    src: [S.witkiewitz10, S.bowen14, S.mbrpslides],
  },
};
