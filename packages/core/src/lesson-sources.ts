/* The sources the lesson bodies cite and the two newer sections, kept apart from the bodies so the rules can load without them
   (lesson-content.ts). SRC_NIGHT and SRC_MORE join SRC in legacy/core.js, and LUNITS_MORE joins LUNITS. They were moved here
   from lessons-night.ts and lessons-more.ts unchanged, and both files still export them. */
import type { Unit } from './lessons';
import { TALK_SRC } from './talk';
type Src = [string, string];
/** the sources, added to SRC (lessons-more.ts SRC_MORE) */
export const SRC_NIGHT = {
  nordgren09: [
    'Nordgren, van Harreveld & van der Pligt (2009): the restraint bias, how the illusion of self-restraint promotes impulsive behavior, Psychological Science',
    'https://doi.org/10.1111/j.1467-9280.2009.02468.x',
  ],
  pilcher15: [
    'Pilcher, Morris, Donnelly & Feigl (2015): interactions between sleep habits and self-control, Frontiers in Human Neuroscience',
    'https://doi.org/10.3389/fnhum.2015.00284',
  ],
  gollwitzer06: [
    'Gollwitzer & Sheeran (2006): implementation intentions and goal achievement, a meta-analysis of effects and processes, Advances in Experimental Social Psychology',
    'https://doi.org/10.1016/S0065-2601(06)38002-1',
  ],
  exelmans16: [
    'Exelmans & Van den Bulck (2016): bedtime mobile phone use and sleep in adults, Social Science & Medicine',
    'https://doi.org/10.1016/j.socscimed.2015.11.037',
  ],
  ward17: [
    'Ward, Duke, Gneezy & Bos (2017): brain drain, the mere presence of one’s own smartphone reduces available cognitive capacity, Journal of the Association for Consumer Research',
    'https://doi.org/10.1086/691462',
  ],
  hofmann12: [
    'Hofmann, Baumeister, Förster & Vohs (2012): everyday temptations, an experience sampling study of desire, conflict, and self-control, Journal of Personality and Social Psychology',
    'https://doi.org/10.1037/a0026545',
  ],
  duckworth16: [
    'Duckworth, Gendler & Gross (2016): situational strategies for self-control, Perspectives on Psychological Science',
    'https://doi.org/10.1177/1745691615623247',
  ],
  gainsbury14: [
    'Gainsbury (2014): review of self-exclusion from gambling venues as an intervention for problem gambling, Journal of Gambling Studies',
    'https://doi.org/10.1007/s10899-013-9362-0',
  ],
  screentime: ['Apple: use a Screen Time passcode on iPhone', 'https://support.apple.com/en-us/126533'],
  harkin16: [
    'Harkin et al. (2016): does monitoring goal progress promote goal attainment? A meta-analysis of the experimental evidence, Psychological Bulletin',
    'https://doi.org/10.1037/bul0000025',
  ],
  litt09: [
    'Litt, Kadden, Kabela-Cormier & Petry (2009): changing network support for drinking, network support project 2-year follow-up, Journal of Consulting and Clinical Psychology',
    'https://doi.org/10.1037/a0015252',
  ],
  freeman17: [
    'Freeman et al. (2017): the effects of improving sleep on mental health (OASIS), a randomised controlled trial with mediation analysis, The Lancet Psychiatry',
    'https://doi.org/10.1016/S2215-0366(17)30328-0',
  ],
  nice22: ['NICE (2022): depression in adults, treatment and management (guideline NG222)', 'https://www.nice.org.uk/guidance/ng222'],
  niaaa: [
    'NIAAA: treatment for alcohol problems, finding and getting help (the medicines approved for alcohol use disorder)',
    'https://www.niaaa.nih.gov/publications/brochures-and-fact-sheets/treatment-alcohol-problems-finding-and-getting-help',
  ],
} satisfies Record<string, Src>;

export const SRC_MORE: Record<string, [string, string]> = {
  berridge: [
    'Berridge & Robinson (2016): liking, wanting, and the incentive-sensitization theory of addiction, American Psychologist',
    'https://pmc.ncbi.nlm.nih.gov/articles/PMC5171207/',
  ],
  ipace: [
    'Brand et al. (2019): the I-PACE model for addictive behaviors, an update, Neuroscience & Biobehavioral Reviews',
    'https://duepublico2.uni-due.de/servlets/MCRFileNodeServlet/duepublico_derivate_00070551/Brand_et_al_Interaction_I-PACE_model.pdf',
  ],
  gola: [
    'Gola et al. (2017): “Can pornography be addictive?” A brain-scan study of men seeking treatment for problematic pornography use, Neuropsychopharmacology (the preprint)',
    'https://www.biorxiv.org/content/10.1101/057083v2.full',
  ],
  quinn: [
    'Quinn, Pascoe, Wood & Neal (2010): “Can’t control yourself? Monitor those bad habits,” Personality and Social Psychology Bulletin',
    'https://dornsife.usc.edu/wendy-wood/wp-content/uploads/sites/183/2023/10/quinn.pascoe.wood_.neal_.2010_Cant_control_yourself.pdf',
  ],
  woodrunger: [
    'Wood & Rünger (2016): psychology of habit, Annual Review of Psychology',
    'https://dornsife.usc.edu/wendy-wood/wp-content/uploads/sites/183/2023/10/wood.runger.2016.pdf',
  ],
  dingle: [
    'Dingle, Stark, Cruwys & Best (2015): “Breaking good,” identity change in a drug and alcohol treatment community, British Journal of Social Psychology',
    'https://researchportalplus.anu.edu.au/en/publications/breaking-good-breaking-ties-with-social-groups-may-be-good-for-re/',
  ],
  best: [
    'Best et al. (2016): recovery as a change of social identity, the social identity model of recovery (SIMOR), Addiction Research & Theory',
    'https://shura.shu.ac.uk/10842/',
  ],
  patrick: [
    'Patrick & Hagtvedt (2012): “I don’t” versus “I can’t,” when empowered refusal motivates goal-directed behavior, Journal of Consumer Research',
    'https://www.bauer.uh.edu/vpatrick/docs/dontversuscant.pdf',
  ],
  hershfield: [
    'Hershfield et al. (2011): increasing saving behavior through age-progressed renderings of the future self, Journal of Marketing Research',
    'https://pmc.ncbi.nlm.nih.gov/articles/PMC3949005/',
  ],
  /* lesson 41, shared with Talk it through */
  caselli: TALK_SRC.caselli,
  brewer11: TALK_SRC.brewer,
  taylor21: TALK_SRC.taylor,
  sayette: TALK_SRC.sayette,
  tracy13: TALK_SRC.tracy,
  allen17: [
    'Allen, Kannis-Dymand & Katsikitis (2017): problematic internet pornography use, the role of craving, desire thinking, and metacognition, Addictive Behaviors',
    'https://doi.org/10.1016/j.addbeh.2017.02.001',
  ],
  kavanagh05: [
    'Kavanagh, Andrade & May (2005): imaginary relish and exquisite torture, the elaborated intrusion theory of desire, Psychological Review',
    'https://doi.org/10.1037/0033-295X.112.2.446',
  ],
  skorka15: [
    'Skorka-Brown, Andrade, Whalley & May (2015): playing Tetris decreases drug and other cravings in real world settings, Addictive Behaviors',
    'https://doi.org/10.1016/j.addbeh.2015.07.020',
  ],
  skorka14: [
    'Skorka-Brown, Andrade & May (2014): playing Tetris reduces the strength, frequency and vividness of naturally occurring cravings, Appetite',
    'https://doi.org/10.1016/j.appet.2014.01.073',
  ],
  may10: [
    'May, Andrade, Panabokke & Kavanagh (2010): visuospatial tasks suppress craving for cigarettes, Behaviour Research and Therapy',
    'https://doi.org/10.1016/j.brat.2010.02.001',
  ],
  andrade12: [
    'Andrade, Pears, May & Kavanagh (2012): use of a clay modeling task to reduce chocolate craving, Appetite',
    'https://doi.org/10.1016/j.appet.2012.02.044',
  ],
  marino23: [
    'Marino et al. (2023): desire thinking and craving as predictors of problematic Internet pornography use in women and men, Addictive Behaviors',
    'https://doi.org/10.1016/j.addbeh.2022.107469',
  ],
  kemps07: [
    'Kemps & Tiggemann (2007): modality-specific imagery reduces cravings for food, an application of the elaborated intrusion theory of desire, Journal of Experimental Psychology: Applied',
    'https://doi.org/10.1037/1076-898X.13.2.95',
  ],
  kemps12: ['Kemps, Tiggemann & Bettany (2012): non-food odorants reduce chocolate cravings, Appetite', 'https://doi.org/10.1016/j.appet.2012.03.002'],
  scott26: [
    'Scott, Duncan & McCoy (2026): “Ground yourself,” using the five senses technique to cope with test anxiety among nursing students, Teaching and Learning in Nursing',
    'https://www.sciencedirect.com/science/article/abs/pii/S1557308725002999',
  ],
  field09: [
    'Field, Munafò & Franken (2009): the relationship between attentional bias and subjective craving, a meta-analysis of 68 data sets, Psychological Bulletin',
    'https://doi.org/10.1037/a0015843',
  ],
  kemps15: [
    'Kemps & Tiggemann (2015): a role for mental imagery in the experience and reduction of food cravings, Frontiers in Psychiatry',
    'https://pmc.ncbi.nlm.nih.gov/articles/PMC4284995/',
  ],
  kober10: [
    'Kober, Mende-Siedlecki, Kross, Weber, Mischel, Hart & Ochsner (2010): prefrontal-striatal pathway underlies cognitive regulation of craving, Proceedings of the National Academy of Sciences',
    'https://pmc.ncbi.nlm.nih.gov/articles/PMC2930456/',
  ],
  lopez22: [
    'Lopez, Ochsner & Kober (2022): brief training in regulation of craving reduces cigarette smoking, Journal of Substance Abuse Treatment',
    'https://doi.org/10.1016/j.jsat.2022.108749',
  ],
  boswell18: [
    'Boswell, Sun, Suzuki & Kober (2018): training in cognitive strategies reduces eating and improves food choice, Proceedings of the National Academy of Sciences',
    'https://pmc.ncbi.nlm.nih.gov/articles/PMC6275472/',
  ],
  stein16: [
    'Stein et al. (2016): “Unstuck in time,” episodic future thinking reduces delay discounting and cigarette smoking, Psychopharmacology',
    'https://pmc.ncbi.nlm.nih.gov/articles/PMC9812225/',
  ],
  loewenstein05: ['Loewenstein (2005): hot-cold empathy gaps and medical decision making, Health Psychology', 'https://doi.org/10.1037/0278-6133.24.4.S49'],
  loman18: [
    'Loman, Müller, Oude Groote Beverborg, van Baaren & Buijzen (2018): self-persuasion in media messages, reducing alcohol consumption among students with open-ended questions, Journal of Experimental Psychology: Applied',
    'https://doi.org/10.1037/xap0000162',
  ],
  magill18: [
    'Magill et al. (2018): a meta-analysis of motivational interviewing process, technical, relational, and conditional process models of change, Journal of Consulting and Clinical Psychology',
    'https://pmc.ncbi.nlm.nih.gov/articles/PMC5958907/',
  ],
  wood09: [
    'Wood, Perunovic & Lee (2009): positive self-statements, power for some, peril for others, Psychological Science',
    'https://pubmed.ncbi.nlm.nih.gov/19493324/',
  ],
  dijkstra15: [
    'Dijkstra & Menninga (2015): experimentally induced states of mind determine abstinent smokers’ level of craving in reaction to smoking cues, Addictive Behaviors Reports',
    'https://pmc.ncbi.nlm.nih.gov/articles/PMC5845922/',
  ],
  /* lessons 46 to 49 */
  fernandez23: [
    'Fernandez, Kuss, Justice, Fernandez & Griffiths (2023): effects of a 7-day pornography abstinence period on withdrawal-related symptoms, a randomized controlled study, Archives of Sexual Behavior',
    'https://pmc.ncbi.nlm.nih.gov/articles/PMC9847461/',
  ],
  fernandez21: [
    'Fernandez, Kuss & Griffiths (2021): lived experiences of recovery from problematic pornography use, a qualitative study of abstinence journals, Archives of Sexual Behavior',
    'https://pmc.ncbi.nlm.nih.gov/articles/PMC7889567/',
  ],
  lally10: [
    'Lally, van Jaarsveld, Potts & Wardle (2010): how are habits formed, modelling habit formation in the real world, European Journal of Social Psychology',
    'https://doi.org/10.1002/ejsp.674',
  ],
  schneider98: [
    'Schneider, Corley & Irons (1998): surviving disclosure of infidelity, results of an international survey of 164 recovering sex addicts and partners, Sexual Addiction & Compulsivity',
    'https://jenniferschneider.com/articles/Surviving_Disclosure_of_Infidelity.html',
  ],
  corley13: [
    'Corley, Pollard, Hook & Schneider (2013): the impact of disclosure of relapse by self-identified sexual addicts, Sexual Addiction & Compulsivity',
    'https://www.ojp.gov/ncjrs/virtual-library/abstracts/impact-disclosure-relapse-self-identified-sexual-addicts',
  ],
  zitzman09: [
    'Zitzman & Butler (2009): wives’ experience of husbands’ pornography use and concomitant deception as an attachment threat, Sexual Addiction & Compulsivity',
    'https://doi.org/10.1080/10720160903202679',
  ],
  bothe21: [
    'Bőthe et al. (2021): are sexual functioning problems associated with frequent pornography use and/or problematic pornography use? Addictive Behaviors',
    'https://pubmed.ncbi.nlm.nih.gov/32810799/',
  ],
  grubbs19: [
    'Grubbs & Gola (2019): is pornography use related to erectile functioning? Journal of Sexual Medicine',
    'https://pubmed.ncbi.nlm.nih.gov/30621919/',
  ],
  zimmer20: [
    'Zimmer & Imhoff (2020): abstinence from masturbation and hypersexuality, Archives of Sexual Behavior',
    'https://pubmed.ncbi.nlm.nih.gov/32130561/',
  ],
  mallory19: [
    'Mallory, Stanton & Handy (2019): couples’ sexual communication and dimensions of sexual function, a meta-analysis, Journal of Sex Research',
    'https://pubmed.ncbi.nlm.nih.gov/30777780/',
  ],
  /* lessons 54 to 58, the lessons that meet the night */
  ...SRC_NIGHT,
};

export const LUNITS_MORE: Unit[] = [
  {
    name: 'Why it is hard to stop',
    sub: 'Wanting and liking, the cue that comes first, autopilot, and what the habit does for you.',
    tone: 'violet',
    cls: 'lu8',
  },
  { name: 'Becoming someone new', sub: 'Who you are becoming, saying “I do not,” your future self, and the evidence in your log.', tone: 'mint', cls: 'lu9' },
];
