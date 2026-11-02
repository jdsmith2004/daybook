/* The lessons' questions, rewritten to ask what makes a person think about their own life (the owner, November 2, 2026: "not
   phishing for answers, its asking questions that provoke thought"). Six rules (docs/plan.md): ask only what they cannot
   already answer or only they can; every answer is a real 11 PM pick; the comment names what a choice costs and gives; a guess
   only with a real reveal; their own life, with "I do not know yet" always fair; on values, no right answer.

   Keyed by lesson id, then by the card's index in the lesson. `a` is the best answer when there is one; without it every answer
   is taken seriously and none is marked right. A question here replaces the card's own words and its beat (lesson-beats.ts).
   test/lesson-questions.test.ts holds them to the limits and the words rules. */
import type { Card, Lesson } from './lessons';
import type { Beat } from './lesson-beats';

export interface LessonQ {
  h: string;
  o: string[];
  c: string[];
  a?: number;
}

/* in the order of the path */
export const QUESTIONS: Record<string, Record<number, LessonQ>> = {
  l1: {
    1: {
      h: 'Part of you wants to quit, and part of you does not. What does that mixed feeling tell you?',
      o: ['That I do not really want to quit', 'That I should wait until I feel sure', 'That I am more hooked than most', 'I do not know yet'],
      c: [
        'A common fear. Wanting it and doubting it can both be true at once.',
        'It feels careful. It also costs the days that would build the sureness.',
        'Anyone changing a habit has mixed feelings. They do not measure how hooked you are.',
        'That is fair. The next card shows what most people find.',
      ],
    },
    6: {
      h: 'It is day three, and part of you still is not sure. What do you do tonight?',
      o: ['Wait until I feel completely sure', 'One small thing, still unsure', 'Promise myself: never again'],
      c: [
        'It feels safer, and it costs the days that build the sureness.',
        'This is how most people start. Five minutes tonight, and it counts.',
        'Strong tonight, hard to keep while unsure. A small step is easier to repeat.',
      ],
      a: 1,
    },
  },
  l2: {
    1: {
      h: 'Think of the last strong urge you did not act on right away. What did it do?',
      o: ['It kept building, and I gave in', 'It faded once I got busy', 'It rose, peaked, and faded', 'I do not remember one yet'],
      c: [
        'Giving in ended it before you saw the peak pass. The next card shows the other way.',
        'So you have already seen one pass. It can fade even without the busy part.',
        'You have already ridden one out. That is the whole skill, done once.',
        'That is fair. The next one you wait out will show you.',
      ],
    },
    5: {
      h: 'An urge hits hard while you are home alone. Which part of the ten minutes will be hardest for you?',
      o: ['Naming it, instead of arguing', 'Breathing slowly while it pulls', 'Staying away from the screen', 'Waiting the full ten minutes'],
      c: [
        'Naming takes one second. Say it out loud if it helps: this is a wave.',
        'Slow is hard when it is loud. Make each breath out longer than the breath in.',
        'That is the honest one. Put the phone in another room first, then start the clock.',
        'Then set a timer and watch the wave. Each minute you wait is one it did not win.',
      ],
    },
  },
  l3: {
    1: {
      h: 'After a slip, what do you usually tell yourself?',
      o: ['I blew it, so tonight is gone', 'I will start fresh on Monday', 'Something harsh about myself', 'Nothing much. I just move on'],
      c: [
        'That one turns one slip into a whole night. The next card is about this exact thought.',
        'It feels hopeful, and it turns the days before Monday into throwaways.',
        'It feels like taking it seriously. It also drains the confidence you need tomorrow.',
        'That is a strength. Notice whether the night really stays one event.',
      ],
    },
    5: {
      h: 'You slipped last night. It is morning now. What do you do first?',
      o: ['Log it, then check in as usual', 'Plan a fresh start for next Monday', 'Skip the check-in today', 'Be hard on myself so it sticks'],
      c: [
        'Thirty seconds, honest, not harsh. Your day keeps going, and so does your confidence.',
        'A clean start feels good, and it hands the days before Monday to the snowball.',
        'It spares you a hard minute. Hiding is how one slip turns into many.',
        'It feels serious. A drop in confidence is what brought the next slip sooner.',
      ],
      a: 0,
    },
  },
  l22: {
    1: {
      h: 'After you watch, what weighs on you most?',
      o: ['That I could not stop', 'That it goes against what I believe', 'Both, about the same', 'I do not know yet'],
      c: [
        'That is about control. The tools in this app are built for it.',
        'That is a values clash, and it is real. A calm talk with someone you trust helps.',
        'Many people feel both. Each needs its own help.',
        'That is fair. Notice it next time, and write one line.',
      ],
    },
    5: {
      h: 'Where will you aim your help this week?',
      o: ['Skills and a plan, for control', 'A calm talk about my values', 'One step on each', 'I do not know which yet'],
      c: [
        'That fits if stopping is the hard part. Use one tool at the next urge.',
        'That fits if the clash hurts most. Pick someone who will not push you to a conclusion.',
        'Common, and wise. One small step on each is enough for this week.',
        'That is fair. After the next hard night, write one line on what weighed most.',
      ],
    },
  },
  l33: {
    1: {
      h: 'Think of the last time. How did ten minutes after compare with how much you wanted it before?',
      o: ['Much smaller than the wanting', 'About the same', 'Flat, or worse than before', 'I have never noticed'],
      c: [
        'Many people notice this gap. The next card explains why it happens.',
        'Then check again next time. The gap often grows as a habit gets older.',
        'That is common, and it is a clue: the pull and the pleasure are not the same thing.',
        'That is fair. Next time, check ten minutes after. It is worth knowing.',
      ],
    },
    6: {
      h: 'An urge hits, and a thought says, “You really need this.” What do you say back?',
      o: [
        'Nothing. If I want it this much, I need it',
        'This is wanting. Last time felt flat',
        'Argue until the thought goes quiet',
        'Once will prove I am in control',
      ],
      c: [
        'That trusts the loudness. How strong a pull feels is not a measure of need.',
        'You name the signal and remember honestly. Then you outlast it.',
        'Arguing keeps your eyes on it. A name is quicker, and it ends the debate.',
        'It feels like control. Each time the pull is followed, the wanting gets more practice.',
      ],
      a: 1,
    },
  },
  l34: {
    1: {
      h: 'Think of your last slip. When did the pull really start?',
      o: ['When something explicit showed up', 'When I picked up the phone', 'Earlier: a mood, an hour, a place', 'I do not know yet'],
      c: [
        'That is when it got loud. Look one step back: what came just before the screen?',
        'That is a signal, and an early one. Acting there is far easier than later.',
        'You already see it. The pull starts at the signal, before anything is shown.',
        'That is fair. Next time, look back one step from the urge. Your log helps.',
      ],
    },
    5: {
      h: 'Which of your signals could you act on tonight, before any urge shows up?',
      o: ['The phone in bed', 'One certain app', 'A mood: bored, low, stressed', 'A certain hour of the night'],
      c: [
        'Put it on the charger outside the room. Then the signal never gets started.',
        'Log out or move it off the home screen. The first tap is the signal.',
        'Pick one move for the moment you notice it, like standing up and leaving the room.',
        'Plan what you do in that hour before it arrives. Then the signal meets a plan.',
      ],
    },
  },
  l20: {
    1: {
      h: 'Adults reported their temptations for a week. What did those with strong self-control do?',
      o: ['Resisted temptation more often', 'Ran into fewer clashes at all', 'Felt fewer desires to begin with'],
      c: [
        'That is what most people expect. They resisted less, because they had fewer clashes.',
        'They met the fight less often, so there was less to resist. The next card shows how.',
        'They still had desires. What differed was how often a desire clashed with a goal.',
      ],
      a: 1,
    },
    5: {
      h: 'Which fight could you stop having this week?',
      o: ['The phone in bed', 'The idle hour after dinner', 'Certain apps or sites', 'Being home alone late'],
      c: [
        'Move the charger out of the bedroom. That fight is gone every night after.',
        'Plan that first hour today. A planned evening leaves the pull less room.',
        'Log out, delete, or add a filter. Next time, there is nothing to resist.',
        'Move the late hours somewhere else when you can. Fewer nights alone, fewer fights.',
      ],
    },
  },
  l46: {
    7: {
      h: 'Day 12. You have felt gray all week. A thought says, “This is who I am without it.” What do you tell yourself?',
      o: [
        'This is how I will feel from now on',
        'Stopping must have broken something',
        'A flat stretch. Do the small things',
        'One time back would make me feel normal',
      ],
      c: [
        'From inside, a flat stretch feels permanent. It is a stretch, and it eases over weeks.',
        'A trial of a week off porn found no withdrawal effects. A low week is not damage.',
        'That reads it right. Sleep, food, a walk, one text. Flat days are part of getting better.',
        'It feels like a cure. Flat days ask for sleep, people and time; going back feeds wanting.',
      ],
      a: 2,
    },
  },
  l10: {
    1: {
      h: 'Think of a time you were away from home: a trip, a new place. What happened to the urge?',
      o: ['It was quieter there', 'It came back the day I got home', 'It followed me just the same', 'I have not noticed yet'],
      c: [
        'That is the setting at work. The habit leans on your usual room, hour and device.',
        'That fits. The old setting held the cue, and it was waiting for you.',
        'Then the cue traveled with you, often the phone. That is the part of the setting to change.',
        'That is fair. The next card shows what happened when students moved.',
      ],
    },
    6: {
      h: 'Most of your slips happen in bed, late, on your phone. Which change will do the most?',
      o: ['Delete the app I use most', 'Charge the phone outside the bedroom', 'Add a filter to the phone', 'Read on the phone instead of scrolling'],
      c: [
        'Some friction helps. The phone in bed is still the main cue, and other apps fill the gap.',
        'That changes the exact setting the habit leans on. A cheap alarm clock covers the alarm.',
        'Good friction, worth adding. The phone in bed is still the cue that starts the night.',
        'It feels safer, and it keeps the phone in your hand where it all starts.',
      ],
      a: 1,
    },
  },
  l9: {
    1: {
      h: 'The last time you meant to say no late at night and did not, what had you planned to do instead?',
      o: ['Nothing exact. Just to resist', 'To stay off my phone', 'A specific thing, and I still slipped', 'I do not remember planning anything'],
      c: [
        'That leaves the choice for 1 AM, the hardest hour to decide anything.',
        'That is a goal. It says what not to do, not what to do when the moment comes.',
        'Planning is the right move. The next cards show how to make it small enough for 1 AM.',
        'That is common, and it is the gap this lesson fills.',
      ],
    },
    5: {
      h: 'Your hard moment is in bed with your phone. Which “then” would you really do at 1 AM?',
      o: ['Get up and get a glass of water', 'Put the phone on the charger outside', 'Be strong and put it down', 'Turn the phone face down and wait'],
      c: [
        'Small and physical. Standing up breaks the scene, and you can do it half asleep.',
        'Strong, because it ends the setting. Make sure the charger is already out there.',
        'Being strong is a wish, not an action. Name one thing your body does instead.',
        'It keeps the phone in reach. A “then” that moves you or the phone works better tired.',
      ],
    },
  },
  l4: {
    1: {
      h: 'When an urge hits late at night, which is it more often for you?',
      o: ['Mostly tired', 'Mostly lonely', 'Both, about the same', 'I do not know yet'],
      c: [
        'A tired brain makes anything that feels good look bigger. The next card shows why.',
        'A lonely mind wants comfort fast, and porn promises it. That need is real.',
        'Many people feel both late. Each one makes the urge look bigger than it is.',
        'That is fair. Next time an urge hits late, ask: tired, lonely, or both?',
      ],
    },
    6: {
      h: 'It is 12:40 AM. You are in bed, scrolling, and an urge is building. What helps most?',
      o: ['Phone in another room, then sleep', 'Scroll something safe until it passes', 'Hold out as long as I can', 'One look, then I stop'],
      c: [
        'That meets the need under the urge. Sleep turns down how big it looks.',
        'It feels harmless, and it keeps you awake with the phone in hand. The need is sleep.',
        'You could make it, fighting your most tired brain. Ending the night ends the fight.',
        'That is the tired brain overrating the reward. The need under it is sleep.',
      ],
      a: 0,
    },
  },
  l37: {
    1: {
      h: 'Right now, how do you see yourself, in a few words?',
      o: ['Someone with a problem', 'Someone trying to stop', 'Someone who is changing', 'I do not know yet'],
      c: [
        'That is honest. It is where you are, not all you are.',
        'Trying counts. The next card shows why the words you use matter.',
        'That is the shift that goes with doing better. Keep saying it.',
        'That is fair. By the end of this lesson, you may have a word.',
      ],
    },
    6: {
      h: 'Finish the sentence the way you would today: “I am someone who…”',
      o: ['…is fighting an addiction', '…is in recovery', '…is free, and getting freer', 'I do not know yet'],
      c: [
        'That is honest, and it keeps the fight in the middle. Add what you fight for.',
        'That is the shift the study saw. Act like it once today, and it grows truer.',
        'That is a new sentence. Do one small thing that person would do today.',
        'That is fair. Write one rough sentence tonight. It will change as you do.',
      ],
    },
  },
  l38: {
    1: {
      h: 'When the urge argues with you, what do you usually say back?',
      o: ['“I cannot.”', '“Not tonight.”', 'Nothing. I try not to listen', 'I argue until I am worn out'],
      c: [
        'That is a rule from outside. It holds, and it can feel like losing something.',
        'It works tonight, and it leaves the door open for tomorrow’s argument.',
        'Silence is hard to keep up for long. A short answer of your own is easier.',
        'Long debates late at night are hard to win. A short sentence ends it sooner.',
      ],
    },
    5: {
      h: 'An urge says, “Come on, just once.” Which reply would you say out loud?',
      o: ['“I do not do that anymore.”', '“I do not watch porn. I keep my word.”', '“I do not need that. I need sleep.”', 'I do not know which fits me yet'],
      c: [
        'Short and sure. It says who you are, and it is easy to reach for.',
        'Strong. The second part makes the no yours, not a rule someone set.',
        'Good. It says no, and it names the real need under the urge.',
        'That is fair. Try one out loud tonight, and keep the one that sounds like you.',
      ],
    },
  },
  l39: {
    1: {
      h: 'In studies, what helped people choose a later reward over a quick one?',
      o: ['Thinking harder about the rules', 'Remembering their past regrets', 'Their own face, made older', 'Nothing. People always pick now'],
      c: [
        'Rules help some. Here, something more personal worked: seeing a future self.',
        'Regret looks back. What worked here looked forward, at a future self.',
        'That was it. People who met an older version of themselves waited more often.',
        'People do lean toward now. Seeing their future selves moved them anyway.',
      ],
      a: 2,
    },
    5: {
      h: 'Picture you, a year from now. What would they most want from tonight?',
      o: ['That I went to bed early', 'That I reached out to someone', 'That I got through one more night', 'I cannot picture them yet'],
      c: [
        'Simple and real. Future you gets a rested morning out of it.',
        'That builds the people future you will have around them.',
        'One night at a time is how they get there. This one counts.',
        'That is fair. Start with one line: what is different about your mornings?',
      ],
    },
  },
  l17: {
    1: {
      h: 'Think of your last slip. When did it really start?',
      o: ['Right before, out of nowhere', 'That evening, with a small yes', 'Earlier that day, when things went wrong', 'I do not know yet'],
      c: [
        'It can feel that way. Looking back often shows a trail of small choices first.',
        'That is an early link. It looked harmless then, which is why it worked.',
        'A hard day can be the first link. That is where a swap is easiest.',
        'That is fair. Next time, look back a few hours. The trail is usually there.',
      ],
    },
    5: {
      h: 'Which early link shows up in your chain most often?',
      o: ['Phone by the bed “in case someone texts”', '“Just checking one thing” online', 'Staying up “a bit longer”', 'An evening alone with nothing planned'],
      c: [
        'Easy to swap: charge it in another room tonight.',
        'Ask what you are looking for. If it is vague, close it.',
        'A fixed lights-out time swaps it out before the night gets late.',
        'An empty evening is a link too. Put one thing in it before it starts.',
      ],
    },
  },
  l18: {
    1: {
      h: 'Which of these thoughts has talked you into it before?',
      o: ['“I have earned it.”', '“It is not that bad.”', '“I am not really at risk tonight.”', '“Just once will not matter.”'],
      c: [
        'It often points to a real need for rest or fun. Meet the need, and it loosens.',
        'It sounds fair, which is why it works. Naming it takes the power out.',
        'It sounds calm and sure. That is the tell: it is clearing the way.',
        'It sounds small on purpose. Every “just once” is the same thought, back again.',
      ],
    },
    5: {
      h: 'After a stressful week you think, “I have earned a little release.” What do you do?',
      o: ['Argue with it until it goes quiet', 'Name it, then take a long shower', 'Agree, since the week was hard', 'Tell myself I deserve nothing'],
      c: [
        'Debates late at night are hard to win, and you do not need one.',
        'You spotted it and met the real need, rest, in a way that does not cost tomorrow.',
        'The hard week is real. This is the permission thought; meet the need another way.',
        'Harsh does not help. You do deserve rest. Pick a kind that does not cost tomorrow.',
      ],
      a: 1,
    },
  },
  l19: {
    1: {
      h: 'In 138 experiments, tracking progress helped people reach goals. When did it help most?',
      o: ['When they kept count in their head', 'When it was written down or told', 'When they tracked only good days'],
      c: [
        'Easy and private, and it helped less. Writing it down made the effect bigger.',
        'That is when it helped most: a record you can see, or a person who hears it.',
        'It feels better, and it hides the useful part. The hard days are the map.',
      ],
      a: 1,
    },
    5: {
      h: 'Look at your own log. What is it telling you so far?',
      o: ['My hard hours come at the same time', 'Something sets it off, like stress', 'It is too early to see a pattern', 'I have not looked back yet'],
      c: [
        'That is the map. Put your plan right before that hour.',
        'Now you know what to plan for. Meet that need earlier in the day.',
        'That is fair. A few more honest entries, and the map starts to show.',
        'Five minutes this week will do it. Ask when, what set it off, and what helped.',
      ],
    },
  },
  l35: {
    1: {
      h: 'In diary studies of people fighting strong habits, what worked best?',
      o: ['Keep the temptation out of sight', 'Keep busy with something else', 'Catch it starting, and say no', 'Nothing works on a strong habit'],
      c: [
        'Good for passing pulls. For strong habits it did little in these studies.',
        'It helps for a while. For strong habits, distraction did little here.',
        'This worked best. Catching the start brings your own choice back in.',
        'That belief costs a lot, and the diaries say otherwise. Watching for it worked.',
      ],
      a: 2,
    },
    6: {
      h: 'When your autopilot starts, when do you usually notice it?',
      o: ['Right at the start', 'Halfway in', 'Only after it is over', 'I do not know yet'],
      c: [
        'That is the best place to catch it. Have your “not this time” ready.',
        'That is a real catch. Say “not this time” there, and the catches move earlier.',
        'Many people begin there. Notice it after, and next time you notice sooner.',
        'That is fair. This week, notice what your hands do at your usual time.',
      ],
    },
  },
  l41: {
    1: {
      h: 'Which kind of thinking makes the pull weaker over time?',
      o: ['Not thinking about it at all', 'Going over the plan, to feel in control', 'Noticing what it really gives me', 'Thinking hard about how bad I am'],
      c: [
        'A common hope. Looking away leaves the picture in charge and the real thing unseen.',
        'That is replaying, and replaying turns the pull up. Each run makes it louder.',
        'Honest noticing shows it gives less than it promised. That wears the pull down.',
        'Shame is not seeing clearly. It makes the night heavier, and the pull stays.',
      ],
      a: 2,
    },
    6: {
      h: 'It is 4 PM, and you keep picturing tonight: the time, the room, what you would watch. What now?',
      o: ['Push the thought away and stay busy', 'Name it the picture, and decide now', 'Go over the plan so it feels handled', 'Wait, and decide tonight'],
      c: [
        'It helps for an hour. The picture comes back at night, and nothing is decided.',
        'You caught the replay while calm, which is when you see most clearly.',
        'That is the replay. Each run through the details makes tonight louder.',
        'Tonight is the hardest time to decide. At 4 PM you can still see clearly.',
      ],
      a: 1,
    },
  },
  l7: {
    1: {
      h: 'When does a secret like this weigh on people the most?',
      o: ['When someone could find out', 'When I have to hide it from people', 'When it comes to mind, even alone', 'Right after it happens'],
      c: [
        'That is what most people expect. The bigger cost showed up in quiet moments.',
        'Hiding takes effort, but people hid secrets far less often than they thought of them.',
        'That is it. Minds went back to secrets far more often than they had to hide them.',
        'Secrets do not fade that neatly. They keep coming back to mind.',
      ],
      a: 2,
    },
    5: {
      h: 'You want to tell someone, and you fear how they will react. Which first step would you try?',
      o: [
        'Text one calm person a single sentence',
        'Ask one safe person for a quiet moment',
        'Write it out, then share one line',
        'Talk to a counselor or a support group',
      ],
      c: [
        'Low pressure, your own words. Try: “Can I tell you something? No advice needed.”',
        'A walk or a drive can feel easier than face to face. Your pace, your words.',
        'Paper first makes the words easier to say. Send only the first line.',
        'A strong start if nobody close feels safe yet. They are there to listen, not judge.',
      ],
    },
  },
  l8: {
    1: {
      h: 'Under the habit, what do you fear most about love?',
      o: ['That something in me is broken', 'That nobody would want me if they knew', 'That I will hurt someone I love', 'I do not know yet'],
      c: [
        'That is what shame says. A habit is something you do, not a verdict on you.',
        'That fear keeps people quiet and alone. Honesty, shared slowly, is a skill.',
        'That fear shows you care. Honesty and patience protect them, and both grow.',
        'That is fair. Notice what the fear says the next time it shows up.',
      ],
    },
    6: {
      h: 'This week, which small step toward people could you really take?',
      o: [
        'Text someone I trust, about anything',
        'Listen at one free group meeting',
        'Say one honest sentence to a safe person',
        'None feels possible this week',
      ],
      c: [
        'Small and real. It goes after the loneliness that can feed the habit.',
        'A first meeting asks nothing of you. Listening is enough.',
        'The hardest and the strongest. Honesty grows by using it.',
        'That is honest. Start smaller: reply to one message today. It still counts.',
      ],
    },
  },
  l28: {
    1: {
      h: 'A review of 25 years of research asked how AA helps people. What stood out?',
      o: ['The rules and steps they follow', 'Willpower, built week by week', 'Who they spent their time with', 'Nothing beyond their own effort'],
      c: [
        'Many people expect that. What stood out was who people spent time with.',
        'It matters, and it was not the standout. Who people spent time with was.',
        'That stood out. People swapped old company for people who backed their change.',
        'The review found real routes, most of all a change in the people around them.',
      ],
      a: 2,
    },
    5: {
      h: 'What would make a first group hardest for you?',
      o: ['Being seen or recognized', 'Having to talk about it', 'Feeling like I do not belong there', 'Not knowing where to start'],
      c: [
        'Online meetings often let you keep your camera off. Listening is enough.',
        'You do not have to share anything the first time. Listening counts.',
        'Many people feel that walking in. Go once, listen, and leave any time.',
        'Start with one person: ask someone you trust to check in with you.',
      ],
    },
  },
  l11: {
    1: {
      h: 'In your own head, what do you call it?',
      o: ['An addiction', 'A bad habit', 'Something I do too much', 'I do not have a word for it'],
      c: [
        'That word can make it feel serious enough for help. It can also feel like a life sentence.',
        'That keeps it small enough to face. It can also make help easy to put off.',
        'Plain and honest. It points at what it does to you, and that is the part that counts.',
        'That is fair. You do not need one to start. Watch what it costs you this week.',
      ],
    },
    6: {
      h: 'Which kind of help could you look into this month?',
      o: ['A therapist', 'A group, just to listen', 'One person I trust', 'I do not know yet'],
      c: [
        'The most effort to set up, and the most care. An EAP or Open Path keeps the cost low.',
        'Free, and you can stay quiet the first time. Hearing others loosens the shame.',
        'One honest sentence is quick and free. It is also the one that feels most exposed.',
        'That is fair. Pick the one that scares you least, and look it up tonight.',
      ],
    },
  },
  l5: {
    1: {
      h: 'After your last slip, what did you say to yourself first?',
      o: ['Something like “I am disgusting”', '“I messed up last night”', 'Nothing. I tried not to think about it', 'I do not remember'],
      c: [
        'That is a verdict on who you are. It hurts, and it tends to push you to hide.',
        'That names the act. It stings, and it leaves you something to fix.',
        'That spares you the sting for now, and skips what the night could teach you.',
        'That is fair. Next time, listen for the first sentence. This lesson is about it.',
      ],
    },
    5: {
      h: 'You slipped last night. This morning the thought is, “I am disgusting.” What do you do first?',
      o: ['Let it sit. I deserve to feel bad', 'Promise a perfect week from today', 'Say “I slipped,” and log it', 'Stay busy so I do not think about it'],
      c: [
        'It feels like taking it seriously. It is shame, and shame pushes people to hide.',
        'It feels strong this morning. It is often shame in disguise, and hard to keep.',
        'It names the act, not you, and the log is a next good move. One slip stays one.',
        'It gets you through the morning, and it skips the part you can learn from.',
      ],
      a: 2,
    },
  },
  l6: {
    1: {
      h: 'If you went easy on yourself after a slip, what do you fear would happen?',
      o: ['I would do it again sooner', 'I would stop caring about quitting', 'Nothing. I am already kind to myself', 'I do not know yet'],
      c: [
        'Many people hold that fear, so they stay harsh. When it was tested, it went the other way.',
        'That fear keeps the whip in your hand. Kindness looks at what happened; it does not shrug.',
        'That is a strength. Kind and practical is what gets you to the next good move.',
        'That is fair. Notice what you say to yourself after the next hard night.',
      ],
    },
    5: {
      h: 'You slipped tonight and feel awful. Which sentence do you say to yourself?',
      o: ['“You know better. Try harder tomorrow.”', '“It is fine. Just forget about it.”', '“Rough night. I need some sleep.”', '“Why do I even bother?”'],
      c: [
        'It sounds tough and feels safe. It also makes the next good move harder to reach.',
        'Kind, and it skips the look at what happened. Kindness looks at it, without attacking.',
        'Kind and practical. Sleep is often the next good move, and tomorrow you can look at it.',
        'That is the snowball thought. You would not say it to a friend in your place.',
      ],
      a: 2,
    },
  },
  l21: {
    5: {
      h: 'You missed yesterday’s check-in. It is 10 PM now. What do you do?',
      o: ['Leave it. I will start fresh on Monday', 'A full check-in, to make up for it', 'One tap, then bed', 'Skip it. This week is off anyway'],
      c: [
        'A clean start feels tidy. It is also how one miss becomes a week, and misses add up.',
        'It feels responsible, and it makes coming back heavy. Small is easier to repeat.',
        'The smallest way back. One miss barely dents a habit, and this stops it becoming two.',
        'That is how one miss becomes many. The skipped day took nothing from you. Today counts.',
      ],
      a: 2,
    },
  },
  l40: {
    1: {
      h: 'What would make “I am free of this” feel true to you?',
      o: ['A long run with no slips', 'Saying it every day until it sticks', 'Seeing what I have actually done', 'I do not know yet'],
      c: [
        'That puts the proof far off. Every urge you ride out counts now, even after a slip.',
        'Words help most with something behind them. Belief grows from what you do.',
        'That is evidence, and it is already building. Your log keeps the count.',
        'That is fair. Most people start there. Belief can follow the actions, not lead.',
      ],
    },
    5: {
      h: 'After a slip, a voice says, “This is who you really are.” What in your log answers it best?',
      o: ['The urges I rode out', 'My longest run', 'The times I came back after a slip', 'I have not logged much yet'],
      c: [
        'Each one is a vote. On a hard day, that count is the truest answer to “who am I?”',
        'It shows what you can do, and it stays yours. Add the urges, and the picture is fuller.',
        'Those are strong votes: proof you kept going when it was hardest.',
        'Then add one today. A single honest line is a vote, and the count starts there.',
      ],
    },
  },
  l12: {
    1: {
      h: 'When you picture yourself better, what do you see first?',
      o: ['A streak that keeps growing', 'Better sleep and more energy', 'People I am close to again', 'I cannot picture it yet'],
      c: [
        'A streak is one part, and on its own it can feel fragile. The rest of your life counts too.',
        'That is real progress you can feel, and it holds even through a hard night.',
        'That is the community part, and it carries a lot. One text to a real person counts.',
        'That is fair. Start small: one good night, one honest log. The picture grows.',
      ],
    },
    6: {
      h: 'You went three weeks with no slip, then slipped. What do you tell yourself the next morning?',
      o: [
        'Back to day zero. None of it counted',
        'Three good weeks, and one hard night',
        'So I was never really serious about this',
        'I have to be perfect from now on',
      ],
      c: [
        'Your longest run and your no-slip days stay. The three weeks happened, and they count.',
        'That is the honest read. Growth with a setback in it is what getting better looks like.',
        'That is the snowball thought. Three weeks is proof you were serious.',
        'Perfect is a bar that breaks easily. Growth with setbacks is the real path.',
      ],
      a: 1,
    },
  },
  l13: {
    1: {
      h: 'When you put a hard feeling into words, what do you expect it to do?',
      o: ['Make it stronger, since I dwell on it', 'Take a little of the charge out', 'Nothing. A word does not change a feeling', 'I do not know yet'],
      c: [
        'Many people fear that, so they skip it. In a brain scan, naming went with a calmer alarm.',
        'That is what the scan showed: a quieter alarm center, and a little space to choose.',
        'It feels too small to matter. In the scan, one word made the alarm center quieter.',
        'That is fair. The next card shows what one word did in a brain scan.',
      ],
      a: 1,
    },
    6: {
      h: 'Which feeling most often comes right before your urges?',
      o: ['Wound up: stressed or tense', 'Alone or left out', 'Bored or numb', 'I do not know yet'],
      c: [
        'Then the urge is after relief. A walk or a shower gives relief without the cost.',
        'Then the urge is standing in for people. A call or a text meets the real need.',
        'Then it wants something to happen. Move, or give your hands a small task.',
        'That is fair. Next urge, try “I notice I feel ___.” A rough guess is fine.',
      ],
    },
  },
  l14: {
    1: {
      h: 'When an urge hits, what does your breathing usually do?',
      o: ['It gets fast and shallow', 'I hold it without noticing', 'My chest goes tight', 'I do not know yet'],
      c: [
        'That is your body gearing up. A long breath out is the lever that slows it down.',
        'Holding keeps the tension in. A long breath out is what lets it go.',
        'That is the urge in your body. A long breath out loosens it on purpose.',
        'That is fair. Next urge, notice your chest first. It tells you when to breathe.',
      ],
    },
    5: {
      h: 'When could you practice the long breath out this week, while it is quiet?',
      o: ['In bed, before sleep', 'In the car or on the bus', 'Right after brushing my teeth', 'I do not know yet'],
      c: [
        'Practice where urges tend to find you, and the breath is there when one does.',
        'A quiet minute you already have. Practiced there, it is easy to find when it is loud.',
        'Tied to something you already do, it gets practiced without having to remember.',
        'That is fair. Try one minute right now, and you have practiced once.',
      ],
    },
  },
  l15: {
    1: {
      h: 'When an urge hits, where is your body usually?',
      o: ['Lying in bed', 'Sitting on the couch', 'At a desk, on a screen', 'I do not know yet'],
      c: [
        'Bed and a phone are the setup for an urge. Standing up changes it fast.',
        'Sitting still makes waiting harder. Getting up is the smallest move, and it counts.',
        'Your body is still and the screen is close. A walk to another room changes both.',
        'That is fair. Next urge, notice where you are. It tells you which move to have ready.',
      ],
    },
    5: {
      h: 'It is 11 PM, you are tired, and an urge starts. Which move would you really do?',
      o: ['Ten squats', 'Walk to another room', 'A lap outside', 'Shake out my shoulders and hands'],
      c: [
        'Short and strong. Your body does the work, the craving eases, and then you decide.',
        'The smallest version, and it still counts. A new room breaks the setting too.',
        'The biggest change of scene. It takes shoes and a door, and puts the screen far away.',
        'Thirty seconds, anywhere. Do it standing, and you are already off the couch.',
      ],
    },
  },
  l16: {
    1: {
      h: 'Which thought shows up first for you when an urge starts?',
      o: ['“I deserve it.”', '“Just once will not matter.”', '“No one will know.”', '“I will stop tomorrow.”'],
      c: [
        'That one borrows a real need, like rest or comfort. Name the thought and meet the need.',
        'That one shrinks the cost. It sounds reasonable, and it is still a thought, not an order.',
        'That one leans on secrecy. You would know, and you are the one who counts here.',
        'That one moves the choice to a day that never comes. Tonight is the choice you have.',
      ],
    },
    5: {
      h: 'At midnight the thought comes: “Just this once will not matter.” What do you say back?',
      o: [
        '“Yes it will. I am stronger than this.”',
        '“There is the ‘just once’ story again.”',
        'Nothing. I try to think of something else',
        '“Fine, but only this one time.”',
      ],
      c: [
        'It feels strong, and it keeps you in the argument. You do not have to win. Just choose.',
        'You saw it as a thought, not an order. Now do the next small thing from your plan.',
        'Pushed-away thoughts tend to come back. Let it stay there, and choose anyway.',
        'It sounds reasonable, which is why it works. A thought is not an order.',
      ],
      a: 1,
    },
  },
  l42: {
    1: {
      h: 'When an urge starts painting pictures, which of these lowers the pull most?',
      o: ['Counting backward from 100', 'Telling myself not to think about it', 'A few minutes of a block puzzle', 'Sitting still until it passes'],
      c: [
        'It keeps the mind busy, but numbers leave the picture screen free. Eyes on a task do more.',
        'Fighting a picture keeps your eyes on it, so it stays bright.',
        'Fitting shapes takes the room the picture needs, so the picture fades.',
        'Urges do pass. Waiting with nothing to see leaves the picture room to grow.',
      ],
      a: 2,
    },
    6: {
      h: 'Late at night the picture starts. What will you give your eyes and hands?',
      o: ['Fit the shapes, in SOS', 'Scroll until it passes', 'Something for my hands, like clay', 'I do not know yet'],
      c: [
        'Built for this, with nothing in it to start new pictures. One minute, eyes on the board.',
        'It keeps the eyes busy, and it is full of cues that start new pictures.',
        'Clay worked in the studies. Pick something that needs your eyes and hands both.',
        'That is fair. Open Fit the shapes in SOS once tonight, so you know where it is.',
      ],
    },
  },
  l43: {
    1: {
      h: 'In studies, which of these turned a craving down the most?',
      o: ['Counting backward from 100 by sevens', 'Telling myself firmly: stop', 'Looking at real things around me', 'Nothing. Just wait it out'],
      c: [
        'Word tasks helped a little. A craving is made of pictures, so tasks for the eyes did more.',
        'A firm stop keeps your eyes on the urge. Something real to look at pulls them away.',
        'This beat the rest. A craving is built from pictures, and real sights crowd them out.',
        'Urges do pass on their own. A task for your senses turned it down while it did.',
      ],
      a: 2,
    },
    6: {
      h: 'Where does an urge most often pull you into your head? Picture that room now.',
      o: ['In bed, with the lights off', 'On the couch, with my phone', 'At my desk, late at night', 'I do not know yet'],
      c: [
        'The dark leaves little to see, so start with touch: the sheet, the pillow, your feet.',
        'Put the phone face down first. Then 5 things you can see, starting across the room.',
        'Look away from the screen. The window, the wall, your own hands: that is three already.',
        'That is fair. Next urge, notice the room you are in. That is the first step back.',
      ],
    },
  },
  l44: {
    1: {
      h: 'Smokers looked at pictures of cigarettes in a brain scanner. What lowered their craving by about a third?',
      o: ['Pushing the want away, hard', 'Telling themselves to be strong', 'Thinking of what comes later', 'Nothing. Cravings stay put'],
      c: [
        'It is the usual first try, and it is tiring. What worked was a change in what they thought.',
        'A pep talk feels good for a moment. Thinking past the moment did more.',
        'This cut craving by about a third, with the pictures still on the screen.',
        'The pictures stayed up, and craving still dropped once they thought about later.',
      ],
      a: 2,
    },
    6: {
      h: 'Play it forward now. An hour after giving in, what do you usually feel most?',
      o: ['Empty and tired', 'Ashamed, and wanting to hide it', 'Annoyed that I lost the evening', 'I do not know yet'],
      c: [
        'Keep that word. At 11 PM, “empty” is the hour the urge will not show you.',
        'That weight is real, and it is not who you are. Riding it out spares you that hour.',
        'That is a real cost: time you wanted. Riding it out gives you the evening back.',
        'That is fair. After the next urge, notice the hour after, either way, and name it.',
      ],
    },
  },
  l45: {
    1: {
      h: 'In the middle of an urge, which words are most likely to help?',
      o: [
        'A strong speech from someone I admire',
        'Repeating big positive lines about me',
        'One line I wrote on a calm day',
        'Nothing. Words cannot touch an urge',
      ],
      c: [
        'Good words from outside help some. Reasons people find for themselves land harder.',
        'It sounds helpful, and in studies big lines made some people feel worse.',
        'Your own reasons, chosen while you see clearly, are the ones that reach you when it is hard.',
        'An urge is loud, and it still listens. A few true words in your own voice can tip it.',
      ],
      a: 2,
    },
    6: {
      h: 'Calm you is here right now. What would your one line be about?',
      o: ['The people I want to be there for', 'Waking up clear and rested', 'Who I want to become', 'I do not know yet'],
      c: [
        'Strong ground. Name one person in it, and the urge has a face to answer to.',
        'Simple and true. A morning you can picture is hard for the urge to argue with.',
        'Strong, if you believe it. Keep it small enough that it still sounds true at 11 PM.',
        'That is fair. Write the first true thing you think of. You can change it later.',
      ],
    },
  },
  l23: {
    1: {
      h: 'On an empty evening, what usually has to happen before you get up and do something?',
      o: ['I have to feel like it first', 'Someone has to ask me', 'A plan I made earlier', 'Honestly, nothing gets me up'],
      c: [
        'Most people wait for that. The feeling tends to come after you start, not before.',
        'That works on nights they ask. A plan of your own works on nights nobody does.',
        'That is what this lesson builds on. A plan does not wait for a mood.',
        'That is honest, and it is where this lesson helps most. Ten minutes counts.',
      ],
    },
    5: {
      h: 'Pick your hardest empty hour this week. What small thing could go in it?',
      o: ['A walk, with a podcast', 'A call or a text to a friend', 'Something with my hands', 'I do not know yet'],
      c: [
        'Easy to start, and out of the room. Give it a day and a time, and it is a plan.',
        'People fill an hour best. Set the time now, so it does not wait on a mood.',
        'Cooking, fixing, drawing: hands busy, mind busy. Ten minutes counts.',
        'That is fair. Find the hour in your log first. What goes in it comes easier after.',
      ],
    },
  },
  l36: {
    1: {
      h: 'Think of your last strong urge. Was it more like reaching for something, or getting away from something?',
      o: ['Reaching for something that feels good', 'Getting away from a feeling', 'Plain habit, at the usual time', 'I do not know yet'],
      c: [
        'Early on, that is common. Watch the next one: is there a feeling it pulls you from?',
        'Many people find this. Name the feeling, and you know what to plan for.',
        'Time cues are real. Look at the feeling that sits in that hour, too.',
        'That is fair. Your log can show it. Notice the feeling just before the next one.',
      ],
    },
    5: {
      h: 'Look at your log. Which feeling sits under most of your urges?',
      o: ['Stress after a long day', 'Loneliness on a quiet evening', 'Feeling low about myself', 'I do not know yet'],
      c: [
        'Then plan for the stress itself. A walk or a shower right after work meets it early.',
        'Porn offers company that is not there. A text or a call to a real person meets it better.',
        'That one is heavy. Something kind for yourself, and a person to talk to, meet it.',
        'That is fair. Look at what sets it off most, and the feeling there, next time.',
      ],
    },
  },
  l24: {
    1: {
      h: 'A review looked at treatments for problem porn use. What did it find?',
      o: ['Nothing helped. It comes down to willpower', 'Medication did the most', 'Treatment helped, one kind most', 'Talking did not change much'],
      c: [
        'Many people believe this, and carry it alone. Treatment appeared to help.',
        'Medication was not the standout. A skills-based talk therapy had the most support.',
        'Treatment appeared to help, and one skills-based kind, CBT, had the strongest support.',
        'It is more than talk. CBT builds skills you practice, and it had the most support.',
      ],
      a: 2,
    },
    6: {
      h: 'Picture a first session with a therapist. What would be hardest for you?',
      o: ['Saying it out loud to someone', 'The time it would take', 'Finding one who gets this', 'I do not know yet'],
      c: [
        'Most people fear that part most. It is also the part that ends the hiding.',
        'A course of CBT is often 5 to 15 sessions: a set amount, aimed at skills you keep.',
        'Ask how they work, and if they have seen this before. If it does not fit, switch.',
        'That is fair. Write one question you would ask them. That is a real first step.',
      ],
    },
  },
  l47: {
    1: {
      h: 'Couples were surveyed some time after one of them disclosed compulsive sexual behavior. How did they feel about the telling?',
      o: [
        'Most wished it had stayed secret',
        'Most of the couples had split up',
        'Nearly all said telling was right',
        'Partners were glad, tellers regretted it',
      ],
      c: [
        'That is the fear that keeps people quiet. Looking back, very few felt that way.',
        'Most had not, even many partners who had threatened to leave.',
        'It was very hard, and later nearly everyone, on both sides, said it was right.',
        'At the time, tellers were less sure. Later, they were even surer than partners.',
      ],
      a: 2,
    },
    6: {
      h: 'Two honest months with your partner. Last night you slipped, and they have no way of knowing. What do you do?',
      o: ['Say nothing. One night should not wreck it', 'Tell them soon, plainly', 'Promise it will not happen again', 'Ask them to check my phone'],
      c: [
        'It feels like protecting them. Hiding is what trust breaks on, and found slips go worse.',
        'Hard tonight, and it is the very thing those two months built: they can believe you.',
        'Easy to say, easy to break. What you do next says more than a promise.',
        'That makes them your police, and it wears on you both. That work is yours, with help.',
      ],
      a: 1,
    },
  },
  l48: {
    1: {
      h: 'A survey of over 14,000 people looked at sexual problems and porn. What went with having more of those problems?',
      o: ['Watching more often than most', 'Feeling out of control', 'Being a man'],
      c: [
        'The common belief. How often people watched did not go with more problems.',
        'Problem use went with sexual problems, about the same for women and men.',
        'The link was about the same for women and men. Feeling out of control mattered more.',
      ],
      a: 1,
    },
    8: {
      h: 'If desire goes quiet for a few weeks after you stop, what would worry you most?',
      o: ['That my body is broken', 'That I will want to check with porn', 'That my partner will notice', 'I do not know yet'],
      c: [
        'Nobody has shown quitting harms your sex life. A quiet stretch is not a verdict.',
        'That pull is common, and the test tells you little. Ask a doctor if it worries you.',
        'Say what you are going through, and go slowly. Closeness counts, and talk helps.',
        'That is fair. A quiet stretch, if it comes, says nothing final about you.',
      ],
    },
  },
  l25: {
    1: {
      h: 'A big review compared AA-based programs with other treatments for drinking. What did it find?',
      o: ['They did worse than professional care', 'They only helped religious people', 'More people stayed fully sober', 'No real difference either way'],
      c: [
        'Many expect that. On staying fully sober, AA-based programs did a bit better.',
        'The review did not sort people by faith. Overall, more people stayed sober.',
        'About 42 in 100 were sober a year later, against about 35 in 100 with other care.',
        'On some measures it was close. On staying fully sober, they did better.',
      ],
      a: 2,
    },
    6: {
      h: 'Honesty, another person, action. Which one is hardest for you right now?',
      o: ['Honesty, even in my own log', 'Telling another person', 'Making things right', 'I do not know yet'],
      c: [
        'Start small: log tonight as it was, slips included. Honest is all it asks.',
        'Common, and heavy. One safe person is enough. At a first meeting, you can just listen.',
        'That one takes care, and it can wait. Start with honesty and one person.',
        'That is fair. Borrow one idea this week, and see which one pulls at you.',
      ],
    },
  },
  l49: {
    1: {
      h: 'Weeks of going well. Which thought sounds most like one you would let in?',
      o: ['“The phone by the bed is fine now”', '“I have earned a late night online”', '“I could look once, to see I am past it”', 'None of these, yet'],
      c: [
        'Each one looks like nothing. That is exactly why it is worth catching early.',
        'You have earned rest. A late night online is a small yes that leads somewhere else.',
        'That one feels like confidence. It is a test, and you have nothing to prove.',
        'Then keep watching: the small yes rarely looks like a risk when it shows up.',
      ],
    },
    7: {
      h: 'Look at this week. What small thing have you started allowing again?',
      o: ['My phone back in the bedroom', 'Late nights, scrolling alone', 'Skipping my check-in', 'Nothing I can see'],
      c: [
        'Catch it here, where it costs almost nothing. Move it back tonight.',
        'Easy to miss, easy to fix. Pick a time the phone goes down, and tell your safe person.',
        'It looks small, and it is part of why this works. Do one now. It takes a minute.',
        'Then keep the plain things going, and fill the week with one thing you enjoy.',
      ],
    },
  },
  l26: {
    1: {
      h: 'If you tried a group for this, what would you want from it most?',
      o: ['Practical tools I can use tonight', 'People who get it', 'No religion in it', 'I do not know yet'],
      c: [
        'That is what SMART is built on: four points, each with tools you can use today.',
        'Any good group gives you that. SMART meetings are free, online and in person.',
        'SMART meetings use inclusive language, with no religious content.',
        'That is fair. Hear what SMART offers, and see if any of it fits.',
      ],
    },
    5: {
      h: 'Think of where your urges hit hardest. Which DENTS move fits that place best?',
      o: ['Delay: ride it out a few minutes', 'Escape: leave the room or the setting', 'Swap: a task for my hands', 'I do not know yet'],
      c: [
        'Delay buys time, and urges pass. Pair it with something to do while you wait.',
        'Change the setting, and the urge has less to grab. Know now where you would go.',
        'A task fills the space the urge wanted. Pick one now, so it is ready.',
        'That is fair. Start an urge log. In a week it shows where, and the move follows.',
      ],
    },
  },
  l27: {
    1: {
      h: 'After treatment for drugs or alcohol, people learned relapse prevention. Over the next year, what happened?',
      o: ['No real difference from usual care', 'Much less risky use', 'It helped a week, then wore off', 'Overconfidence made them slip sooner'],
      c: [
        'That is the usual doubt. Over 12 months there was a clear difference.',
        'Risk of drug use fell about 54%, and of heavy drinking about 59%, over 12 months.',
        'It was measured over 12 months, and it held.',
        'It went the other way. Learning to pause and choose lowered risky use.',
      ],
      a: 1,
    },
    5: {
      h: 'When does autopilot most often carry you toward the habit?',
      o: ['Opening my phone in bed', 'Clicking from one video to the next', 'Right after something stressful', 'I do not know yet'],
      c: [
        'Make that your pause point: phone in hand, stop, breathe, then choose.',
        'Each click is a choice point. When you notice one, stop and take one breath.',
        'Pause right after the stress, before the pull. One minute puts you back in charge.',
        'That is fair. Practice the pause once a day, and you will start to notice where.',
      ],
    },
  },
};

/** the question a choose card asks: the rewrite when there is one, else the beat's words over the card's own */
export function questionOf(L: Lesson, ci: number, card: Card, b: Beat): LessonQ & { rewritten: boolean } {
  const q = QUESTIONS[L.id] && QUESTIONS[L.id][ci];
  if (q) return { ...q, rewritten: true };
  return {
    h: b.h || card.h,
    o: b.o || (card.c || []).map((x) => x[0]),
    c: b.c || (card.c || []).map((x) => x[1]),
    a: Number.isInteger(card.a) ? card.a : undefined,
    rewritten: false,
  };
}
