# Daybook: the big ideas (November 12, 2026)

The owner read `docs/review-plan.md` and said the review had misread "extremely simple": "I meant like simple as in anybody could use it,
not as in we don't use any actually good features. Those ideas all sound great." So this is the list the review held back. Simple here
means one thing: the next step is obvious and anyone can do it. It does not mean small.

Fourteen features, ranked by how much each could change whether a person gets free for good. Plan only: no code. The evidence is in the
shared notes folder under `review-nov-12/` (`research-evidence.md`, `research-wisdom.md`, `research-platform.md`, and the walks).

**What the walks and the research agree on, in one paragraph.** The person loses at night, in bed, with the app closed, as someone who
at that moment does not want to stop. The strongest evidence for lasting recovery is about other people and about the hours and places
a habit lives in, not about anything on a screen. And the products people credit across this whole field share one mechanism Daybook does
not have yet: **something outside the phone's own screen decides** (a place, a person, a time set earlier). Every idea in the top five
is a way of giving the morning self that.

**The hard lines hold for every idea here.** Care is never locked: SOS, the wait, Good night, the phone's bed, the one person and the
circle's care are free. The journal, notes, voice and typed words never leave the phone. Nothing shames, and no stakes are said in the
hours after a slip. The store listing never names the habit. Anything that would be sold as a physical product is marked **ask first**,
by the owner's rule of October 23.

## The ranking

| #   | Feature                                         | The moment it answers                            | Evidence | Build | Earns or grows                 |
| --- | ----------------------------------------------- | ------------------------------------------------ | -------- | ----- | ------------------------------ |
| 1   | The flame's bed                                 | The owner's nights; Sam at 11:40 PM              | Moderate | Large | A thing in the home; a product |
| 2   | Someone tends your fire                         | The owner's "one family member"; all three walks | Strong   | Large | Every ally is a new person     |
| 3   | The circle, and Daybook for groups              | The owner's program that worked                  | Strong   | Large | The real business              |
| 4   | The morning finds you                           | Sam opening it less and less                     | Moderate | Mid   | Daily use without a chore      |
| 5   | The whole phone goes quiet at night             | Sam on a store build with nothing set            | Moderate | Mid   | Works in today's store build   |
| 6   | A word from this morning                        | Sam's "Quiet. I slept."                          | Moderate | Mid   | The thing people will show     |
| 7   | Last night, in a picture                        | Sam's empty Pattern; Maya's hidden nights        | Moderate | Large | Daybook Pattern, made real     |
| 8   | SOS from anywhere, in the dark                  | Sam's one SOS at 11:51 PM                        | Moderate | Mid   | Store pictures; trust          |
| 9   | Daybook on the Mac                              | The laptop nobody covered                        | Thin     | Large | A second store; sync           |
| 10  | Tonight's shape                                 | "Alone at home, bored"                           | Moderate | Small | A reason to open at 5 PM       |
| 11  | The road, and the day you finish                | Dan on day 30 with no finish line                | Moderate | Mid   | The keepsake; word of mouth    |
| 12  | The check-up, and a real helper                 | Mornings "Low" for two weeks, unnoticed          | Moderate | Small | Trust; fewer silent leavers    |
| 13  | Faith in the rhythm, and the program beside you | Faith on changes nothing in the day              | Moderate | Mid   | Bishops and groups recommend   |
| 14  | Say it once (on-device only)                    | Setup's typing; reasons nobody rereads           | Thin     | Mid   | Small                          |

Evidence is rated for the mechanism, not for Daybook: none of these has been tested for porn. "Strong" means good trials or large cohorts
in addiction generally; "moderate" means trials in a neighbouring behaviour or solid observational work; "thin" means testimony or one
weak study.

---

## 1. The flame's bed

**What it is.** The phone gets a place to sleep that is not the bedroom, and the flame sleeps there with it.

- A small stand or a sticker by a charger in the kitchen or hallway. A tap of the phone on it opens Good night, already armed: feeds and
  adult sites wait until morning, and the flame curls up and goes to sleep.
- On its charger the phone shows the sleeping flame (StandBy, and a Lock Screen Live Activity with the flame asleep and nothing else).
- **You do not wake the flame.** Picking the phone up before morning wakes it, groggy, and the long wait runs with the flame sitting up
  beside the timer: "It is 12:40. Back to bed?" One button puts it back to sleep. That is the stake, said before the choice, in a
  picture, with no words about the habit.
- The morning alarm rings where the phone is (AlarmKit, iOS 26 and later). Stopping it means getting up. Its "Open" button lands on the
  morning page, and the flame wakes with the person.
- The record: "Phone slept in its bed 9 nights." It feeds the fire.

**The moment it answers.** The owner: "late at night in bed, alone, scrolling comes first". Sam's plan line from setup, "Charge my phone
in another room and go to sleep", which nothing in the app ever helped him do. The Good night page already says "Phone on its charger,
away from your bed" and has a tick for it. This makes the tick an act.

**Evidence.** Phone out of the bedroom is the most repeated concrete advice from counsellors, coaches and people who quit (seven
independent sources). Trials are moderate: a one-week study of 95 adults, and bedtime-use studies that are mostly observational. The
"mind after midnight" review argues judgement is worse in the biological night, which supports deciding earlier. Brick and Foqos show
the tag mechanism works technically and that users credit the walk to a place; no controlled study of it exists.

**Easy to use, with the flame at the centre.** One tap on a thing. No menu, no settings, nothing to read. A person with no sticker gets
the same thing from the Good night button. The flame asleep is the whole interface, and "do not wake it" needs no explanation. This is
also not the StandBy night light dropped earlier (#44): that kept the phone by the bed, and this takes it out of the room.

**Earns or grows.** The stand is a physical thing in the home that people see and ask about. **Ask first:** Daybook could sell it (a
small flame-shaped stand with the tag inside, or a sheet of flame stickers), or tell people any plain NFC sticker works and sell nothing.
A stand is also something a parent, a spouse or a bishop can give.

**Risks.** Whether a tag can open the app from the lock screen through a universal link needs a real phone (WP12's first step). A
sticker cannot prove the phone stayed there, so the record says "put to bed", and "stayed down" only when the waits held. AlarmKit is
iOS 26 and later, and a forum report says its stop action can be skipped by swiping. The Live Activity must end itself (WP2). App Review
on the alarm use is unknown. Selling a physical product means shipping, returns and an address, which is new for a private app.

## 2. Someone tends your fire

**What it is.** One chosen person, and they can do something back.

- The three rungs already in the plan: the weekly effort note, a good-night text, and that person holding the Screen Time code.
- **New: a spark.** The person's messages carry a link that is theirs alone. The helper taps it and sees one page: a flame, the words
  "Sam is working at it this week", and one button, **Send a spark**. Sam's phone gets "Dana is with you", and his flame visibly takes
  it: a second small flame beside his for the day. No words to write, nothing about the habit, nothing about slips.
- **New: a spark at the hard hour.** If Sam chooses, the good-night text goes out by itself when he puts the phone to bed, and Dana can
  answer with a spark. That is bookending: in touch before the hard hour, not confessing after it.
- **New: asking is one tap.** In SOS and on the wait page, "Ask Dana for a spark" sends a plain "thinking of you tonight?" text. It does
  not say why.
- The helper never installs anything, never sees a log, a count or a slip, and can stop at any time.

**The moment it answers.** The owner let one family member in, and it "broke down into hiding and silence" because the only thing to
share was slips. Every one of the three walks was done entirely alone: nobody ever knew Sam opened SOS at 11:51 PM. This gives the
helper something to do that is not policing, and the person something to receive that is not judgement.

**Evidence.** The strongest in the field, for alcohol: in a 16-year cohort, people with sustained mutual-help involvement in their
first year were abstinent about twice as often (they chose it themselves, so read that with care), and a Cochrane review of 27 studies
found a smaller, reliable gain that held to three years. Supportive accountability works when the supporter is kind, expected and focused on effort; pressing for information
raises hiding. No trial exists for porn or for a "spark", so the form is a design bet on a strong mechanism.

**Easy to use, with the flame at the centre.** The helper's whole experience is one page and one button. The person's is a second flame
appearing beside theirs. A fire tended by two is the picture.

**Earns or grows.** Every helper is a person who learns Daybook exists, on a page that never names the habit. The helper's page can
carry one quiet line: "Daybook: for changing a habit." Sparks need an account (to deliver the push), which is a concrete reason to make
one that is not a paywall on care: the weekly note and the text work with no account.

**Risks.** This is the first thing a second person can do to someone's phone, so the server holds a random token and a counter and
nothing else, the privacy page says so, and the helper's page is rate-limited. A helper who goes silent must not read as rejection: no
"waiting for Dana" state is ever shown. The link must not reveal the habit if forwarded. The Screen Time code rung can lock a person
out; the guide says so first.

## 3. The circle, and Daybook for groups

**What it is.** The owner's own history, in the smallest form that cannot turn into a scoreboard.

- A circle is three to eight people who chose each other: a ward group, an ARP or SA group, a counsellor's clients, three friends.
- Each person sees a ring of flames with first names. A flame is lit when that person told the truth this morning, whatever the truth
  was. Nothing else is shown: no slips, no counts, no days, no ranking, no chat.
- One tap on someone's flame sends a spark (as in idea 2). A flame that has been dark for three mornings glows softly for the others:
  "Alex has been quiet." That is the whole feature.
- **A leader** (a bishop, a sponsor, a counsellor) can start the circle. The leader sees exactly what members see. Once a week the
  leader can set one line for the group ("This week: phone to bed by 10:30"), which shows as a pick in each person's good week.
- **Daybook for groups.** The leader buys a pack of codes. A code makes a member a supporter and joins them to the circle. The leader
  never sees anything about anyone beyond the lit flames.

**The moment it answers.** The owner: "A structured program, for a long time: reporting every day, a group, a leader, steps... I need
something that is consistent in pushing me in my life." It ended in burnout from fighting too hard. This is daily reporting where the
report is "I told the truth today", which a person can keep up for years.

**Evidence.** Strong for the mechanism: twelve-step involvement and a recovery network are the best-supported predictors of lasting
remission (alcohol), partly through identity ("people like me get free"). Relay's users credit a small matched group. The earlier
plan dropped "group challenges" and "any open group or chat" for good reasons (contests, shame, dead groups). This is neither: no
contest is possible when the only fact shown is honesty, and there is no chat to go bad.

**Easy to use, with the flame at the centre.** It is a ring of flames. Nobody has to write, post or report anything beyond the morning
tap they already do.

**Earns or grows.** This is where Daybook can be a business without charging the person in trouble. A bishop, a counsellor or a group
leader pays for ten codes; ten people arrive already supported and already known to each other, which is the best predictor of staying.
It is also the channel the listing rule cannot close: leaders recommend by word of mouth.

**Risks.** It reverses an earlier "stays out", so it is the owner's decision (below). Being in a circle tells the others you use
Daybook, so joining is always by invitation and a person can leave silently. App Review's rules on user content apply lightly (first
names only, no free text except the leader's weekly line, which needs a report button). A dark flame must never be shown in the hours
after a slip was told; since telling lights it, it will not be. Server cost is small; the events and privacy lists change.

## 4. The morning finds you

**What it is.** The morning question arrives wherever the person already is, and answering never needs the app.

- The alarm (idea 1) opens it.
- The morning note has two buttons, **Free of it** and **It happened**.
- A Home Screen widget shows the flame and the same two buttons; a Lock Screen widget shows the flame lit or waiting.
- On Apple Watch: a wrist tap in the morning with the two answers, and the flame as a complication.
- Whichever is used, the flame takes the answer at once: it burns up on "Free of it", and it steadies on "It happened" with "Told. That
  is your part."

**The moment it answers.** Sam opened the app three mornings a week, then once a week. The morning question is the one part that
worked for him every time he saw it, and nothing ever brought it to him: no note opens it today. Maya closed it with the X twice on
mornings she did not want to answer; a button on a note is easier to answer than a page is to face.

**Evidence.** Moderate. Self-monitoring has a medium effect (138 trials), larger when it is recorded; automated daily texts doubled
quit rates in a large smoking trial (txt2stop); in the app's own usage numbers, the first week is where people are lost.

**Easy to use, with the flame at the centre.** One tap, on whatever is in front of them. The flame is the widget.

**Earns or grows.** The record fills for people who never open the app, which is what keeps them long enough to meet anything else.
The widget is the store picture that says what Daybook is without a word.

**Risks.** Interactive widgets do not work on a locked phone, so the Lock Screen widget only shows. A write from a note or a widget must
go through the same path as the app's and be safe when both answer. A watch app is a new target to build and test.

## 5. The whole phone goes quiet at night

**What it is.** At the hour the morning self chose, the phone itself changes, on any build of the app.

- **A night pack of Shortcuts automations**, handed over from Daybook in one page: the screen goes grey at the set hour and colour
  returns in the morning; opening a chosen feed after that hour opens Daybook's wait page first; plugging into the charger after 10 PM
  offers Good night; stopping the alarm opens the morning.
- The person turns each one on with one switch. Daybook shows them as four lights, lit or not.
- Together with the Screen Time night wait (WP2) this is two layers: Apple's filter and shield where the build has them, and the pack
  everywhere.

**The moment it answers.** On the build in the App Store today, Sam finished setup and nothing whatsoever was set to act at midnight.
The Screen Time work needs a special build and Apple's entitlement. The pack needs neither, so it can reach people this month. A grey
phone also answers the owner's "scrolling comes first, and is often used to work up to it": it makes the on-ramp dull.

**Evidence.** Moderate. Grayscale cut measured screen time in a randomized field experiment (112 people). A short wait at the app with
an easy way out cut openings by 57% over six weeks (one sec). Neither was tested on porn.

**Easy to use, with the flame at the centre.** Four switches, set once. On the wait page the flame is the only colour left on a grey
phone, which is a picture worth having.

**Earns or grows.** It works in the plain store build, so the next update can carry a real night defence. It is free.

**Risks.** Apple says automations are the person's own, so Daybook can only hand them over; iOS 27 delivers shared automations switched
off. Whether "open an app" fires cleanly from an app trigger on a locked phone is untested and known to be fickle. The exact grayscale
action name is unverified. The person can switch any of it off in seconds; the phone's bed and the one person are the answers to that.

## 6. A word from this morning

**What it is.** The morning self speaks, and the night self hears it.

- On the morning page, under "Set tonight", one optional button: **Say one thing to tonight's you.** Five seconds of voice.
- It is transcribed on the phone and both are kept on the phone.
- At night the words are on the shield, in the person's own words with the time they said them ("You, 7:12 this morning: I want to wake
  up clear."). On the wait page and after the first breath in SOS, the voice plays.
- A day with nothing said uses the last one, or the day-0 recording made in setup ("Why I am starting"), which also plays at graduation.

**The moment it answers.** The one personal moment in Sam's 30 days was his own day-4 note, "Quiet. I slept.", read back to him in SOS
on day 9. It was the only time the app said something only he could have said. Today that needs him to type into a box after the
morning set; this makes it five seconds of talking.

**Evidence.** Moderate. Self-endorsed reasons in a person's own words are the strongest kind of motivation in the trials the plan
already cites; arguing with the evening self backfires, so the voice must be theirs and never Daybook's. One sec found the message
shown during a wait did nothing; that message was the app's, not the person's own voice, and this bet is that the difference matters.

**Easy to use, with the flame at the centre.** Hold, speak, let go. At night the flame "says" it in its speech bubble, as it already
does with the person's reasons.

**Earns or grows.** This is the feature a person shows someone else. It is care, so it is free.

**Risks.** A shield can show text only, and whether it can show text written that morning needs a real phone. On-device transcription
is iOS 26 and later; older phones keep the voice and show the typed reason. A voice note in a shared bedroom must never autoplay aloud:
it plays on a tap, and the words show first.

## 7. Last night, in a picture

**What it is.** The morning shows the person their own night, without anyone logging anything.

- A strip of night sky from 9 PM to 7 AM: when the phone went to bed, when it was picked up, how long in which kinds of apps, when sleep
  started and ended.
- Under it, after a few weeks, the line from their own life: "After nights the phone slept in its bed: 7 h 20 of sleep, and you woke up
  Good 5 of 6. After the others: 5 h 40, Good once in 4."
- The hard hours are found from this, so the heads-up, the Pattern "when" card and tonight's hour work for people who never log a time.

**The moment it answers.** After 30 days Sam's Pattern was four empty cards, because everything that learns needs a logged time and he
never gave one. Maya hid three nights. The research on people who got free says the costs that felt real were next-day ones from their
own life (lost sleep, fog), never a lecture. This shows that cost in their own numbers.

**Evidence.** Moderate. Short sleep weakens self-control in randomized crossover studies; self-monitoring works and works better when
it does not rely on memory; 28% of people who said they had quit smoking in a large trial had not, which is the case for a record that
does not depend on self-report alone.

**Easy to use, with the flame at the centre.** Nothing to do. The flame sits at the hour it went to sleep and at the hour it woke.

**Earns or grows.** This is what Daybook Pattern should be: "your nights, and what they do to your days". It is worth paying for, it is
not care, and the Hard hours card and heads-ups stay free as the rules require.

**Risks.** Apple's usage report draws inside the app but does not give the app the numbers, so "hard hours from this" may only be
possible from sleep data (which the app can read) and from the phone's-bed times it records itself. Whether the usage report works for
an adult's own phone is unverified. Sleep data never leaves the phone. A picture of a bad night must not be shown in the hours after
"It happened"; it waits for Sunday.

## 8. SOS from anywhere, in the dark

**What it is.** One press starts the breath, with the screen dark.

- The Action Button, a Control Centre control and a Lock Screen control each start SOS without finding the app.
- **Breathe in the dark.** The breath runs by touch alone (the haptic breath exists), phone face down on the chest, no light. It ends
  with one long pulse and the person's own word from this morning.
- A Lock Screen Live Activity holds the ride with words that say nothing (WP17), and ends itself.
- On Apple Watch the same breath runs on the wrist.

**The moment it answers.** Sam opened SOS once in 30 days, at 11:51 PM in bed, did three breaths looking at a bright screen, and
closed it. A screen is the thing he is trying to put down. The owner: "Daybook is not opened. When it comes to mind, the answer is
'not now'." A button under the thumb asks less than finding an app.

**Evidence.** Moderate, by analogy: acceptance of urges (riding them out) is the skill in the best-evidenced app trial in addiction
(iCanQuit, smoking). Nothing on haptic breathing specifically.

**Easy to use, with the flame at the centre.** One press, nothing to look at. Afterwards the flame shows it: "You rode it out in the
dark. 6 times now."

**Earns or grows.** Free: it is care. It makes the best store pictures the app could have.

**Risks.** The Action Button exists only on recent phones. Haptics very likely run only while the app is in front (to check on a
phone), so the screen would be dimmed to black, not locked. Lock-screen words must pass the test that nothing hints at a struggle. A Siri phrase is left out: others can hear it.

## 9. Daybook on the Mac

**What it is.** The night follows the person to the laptop.

- A Safari and Chrome extension. In the night hours it shows the same wait page, with the flame and the person's own word from this
  morning, before adult sites and the feeds they chose.
- It takes the night hour and the word from the person's account. Going through the wait on the Mac counts in the week like any other.
- Beside it, the one-page "other doors" guide already planned: the Mac's own Screen Time and a family filter for the home Wi-Fi.

**The moment it answers.** Nothing in Daybook touches a laptop, and the review could not find a single line about one outside a lesson.
A wall on the phone with an open laptop on the desk is not a wall.

**Evidence.** Thin. No good study of blockers for this exists; layered protection is what the gambling tools' users and makers credit,
and those surveys also show people getting round software alone (62% in one). So it is a layer, not a cure.

**Easy to use, with the flame at the centre.** Install once, sign in once. The wait page is the flame on a dark page.

**Earns or grows.** It needs sync, which is a supporter extra, so it is a concrete reason to support. The extension stores are a second
place to be found, under the same listing rule.

**Risks.** It needs a list of adult sites or a way to recognise them, which means choosing and keeping a list; the feeds are the
person's own picks. Extension review rules apply. A second codebase is real upkeep. The word from this morning would have to sync, and
the rule is that voice and typed words never leave the phone: the Mac shows only a reason chosen from the person's saved list, never
the transcript.

## 10. Tonight's shape

**What it is.** One question in the late afternoon, and a plan that fits the answer.

- At about 5 PM: **"What does tonight look like?"** With people. Out. Home, alone.
- "Home, alone" is the one that matters. The flame offers the alone-night plan in one page: the phone goes to bed half an hour earlier
  tonight, one thing from the person's own "instead" list (a walk, a game, a call, a show on the television with the phone docked), and
  a good-night text to their person.
- The "instead" list is five things, made once in the first week from "what does a good evening look like for you?"

**The moment it answers.** The owner: "Late at night in bed, alone at home, bored." What the people who got free say most is that the
habit was doing a job (boredom, loneliness, stress) and they got free when that need was met another way. Daybook today says what not
to do at night and offers nothing to do instead.

**Evidence.** Moderate. If-then plans help addictive behaviours (a small to medium effect that fades after about a month, so the plan is
re-made each time, not set once); planning for high-risk situations is the core of relapse prevention; exercise has trial support.

**Easy to use, with the flame at the centre.** One tap on a note, and on most nights nothing more.

**Earns or grows.** A reason to open Daybook in daylight, when the person can still act. Free.

**Risks.** A third note in a day. It is sent only to people who said evenings or nights are hardest, never on the day of a slip, and it
learns to stop when it is not answered.

## 11. The road, and the day you finish

**What it is.** A program with a beginning, a middle and an end, and a real finish.

- The twelve steps the lessons already follow become a road the person can see: this week's step, its one deed, and how far along the
  road they are. Only the current week is drawn in full until the person has had a week with no slip (the owner's rule on long goals).
- The finish line shows on Today once it is in reach.
- **Graduation is a day.** The person can invite their one person to it: a page they both see, the flame at its full form, the day-0
  recording played back, three lines from the record. Then Daybook offers to get smaller (WP19).
- **A keepsake.** A coin with the flame and the date, as twelve-step groups give chips. **Ask first** (a physical product).

**The moment it answers.** Dan did everything for 30 days and nothing on Today ever told him he was getting anywhere: "22 of 90 toward
graduation" is two taps deep. What worked for the owner was a program with steps and a leader. A program that never ends treats a
person as a patient for life.

**Evidence.** Moderate. Identity follows what a person watches themselves do, and finishing something is strong evidence to oneself.
Chips and anniversaries are central to the best-evidenced mutual-help programs, though nobody has isolated the token.

**Easy to use, with the flame at the centre.** The road is the flame's growth path, drawn as a road. Nothing new to do.

**Earns or grows.** Graduation is the story a person tells others. The coin is something to hold and to give. The ask at graduation is
the one moment a tip is plainly earned.

**Risks.** A road can read as a streak. It never moves backwards and a slip does not send anyone back a step. A mailed coin needs an
address, discreet packaging and a fulfilment service; a coin that names nothing but a date and a flame is safe to own.

## 12. The check-up, and a real helper

**What it is.** Once a month, two questions about what may sit underneath, and a calm route to a person who can treat it.

- With the monthly "how free do you see yourself", two more taps: mood over the last two weeks, and sleep.
- When the answers, the mornings ("Low" most days) or the record (four weeks no better than the first) say the app is not enough,
  Daybook says so once, kindly: "This looks heavier than a habit. A counsellor is the right next step, and here is how to find one."
  It opens the Get help page that already exists, at the right entry.
- For alcohol, at setup: one question on how much, and the doctor-first line when the answer is heavy, with a sentence that medicines
  for this exist.
- A page to hand a counsellor or bishop: the person's own summary of the month, made on the phone and shared by them.

**The moment it answers.** Maya tapped "Low" on mornings after slips and nothing ever noticed. In narrative reviews, anxiety sits under
a third or more of people seeking help for this, and ADHD under about a quarter. The Get help page is good and nobody is led to it.

**Evidence.** Moderate: treating depression alongside addiction improves outcomes in pooled trials. Medication evidence for alcohol is
strong and almost unused.

**Easy to use, with the flame at the centre.** Two taps a month. The flame says the line.

**Earns or grows.** Trust, and fewer people who leave quietly because the app could not carry what they brought. No referral fees:
taking money for sending people to treatment would cost that trust.

**Risks.** This must never read as a diagnosis or as medical advice; the words are "worth talking to someone about". App Review looks
harder at health claims. The summary page is made and shared by the person, so nothing leaves the phone by itself.

## 13. Faith in the rhythm, and the program beside you

**What it is.** For a person who turned faith on, faith is in the two moments of the day, and Daybook can sit beside the program they
already attend.

- Morning: a verse chosen for the day's lesson, one line, under the question. Good night: a prayer prompt of the person's own choosing,
  and "Scripture today" as a tick.
- Sunday: "Did you worship today?" as one of the week's picks.
- **Program mode**: for someone in the Church's Addiction Recovery Program, Celebrate Recovery or a twelve-step group, the road (idea 11) shows their program's step for the week, a meeting reminder, and "I went to my meeting" feeds the fire.
- The scripture library, for those who turned it on, opens from the tick.

**The moment it answers.** With faith on, Today, the morning, Good night and the Sunday review are word for word the same as with it
off. The owner's reasons start with faith and values, and the Screen Time idea came from a bishop.

**Evidence.** Moderate: spiritual practice partly explains why twelve-step involvement works (a study of 1,726 people), and helping
others doubles the odds of staying sober in one observational study. For a religious person, distress about this habit tracks the
conflict with their values, which is a reason for grace to be said early and plainly.

**Easy to use, with the flame at the centre.** One line in the morning, one tick at night. Off means nothing appears, anywhere.

**Earns or grows.** This is how leaders come to recommend Daybook, and it is the natural partner of the circle and the group codes.

**Risks.** Verses are quoted with their own words and a licence check for each translation. Naming a program must not imply its
endorsement. People of other faiths, or none, must never meet any of it.

## 14. Say it once (on-device only)

**What it is.** The phone's own language model, on the phone, does two small jobs and never talks.

- The person speaks for a minute once ("why I want this"), and Daybook cuts it into three short reasons in their own words, checked
  against what they said. Those are the reasons the morning page, the shield and SOS use.
- The Sunday page's three lines are phrased from the week's real numbers.
- There is no chat, nothing at night, and nothing generated about the habit. When the model is missing, refuses or is unsure, the plain
  version shows.

**The moment it answers.** Setup asks for reasons by tapping tiles and typing in boxes, and the walks show the same three tiles for
everyone. A person's own sentence is worth more than a tile.

**Evidence.** Thin for this use. A conversational coach was looked at and is still not recommended: the on-device model refuses
ordinary words about this subject, Apple's terms bar adult content, the cloud version breaks the rule that words never leave the phone,
and the night is the wrong time to hand someone a chat.

**Easy to use, with the flame at the centre.** Talk once. The flame repeats it back in three lines: "Did I hear you right?"

**Earns or grows.** Little, directly.

**Risks.** It only runs on recent phones with Apple Intelligence on. It must use the on-device model only, and the privacy page must
say so. Refusals on ordinary words are reported.

---

## What moves earlier in the work packages

The owner has now answered most decisions (part 4b of the review plan), and WP2, WP3 and WP14 are being built. With the bold ideas
wanted, not "later":

| Package                             | Was               | Now                                                                                                                                            |
| ----------------------------------- | ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| WP12 The phone's bed                | After WP2 and WP5 | **Straight after WP5**, as lane B's main work. Its first step (the tag and alarm check on a real phone) can start today beside WP2.            |
| WP7 One person                      | Sixth in lane A   | **Split.** The good-night text and the person in My plan ship with WP5. The weekly note ships with WP9. The spark (idea 2) is new, after both. |
| WP6 Notes for the two moments       | After WP9         | **Straight after WP5.** The two answer buttons on the morning note are idea 4's first piece.                                                   |
| WP20 Morning from the Home Screen   | "Later"           | **After WP6**, no longer later.                                                                                                                |
| WP17 SOS on the Lock Screen         | After WP12        | **Straight after WP2**, widened to idea 8 (the controls and the breath in the dark).                                                           |
| WP13 The other doors, and more help | Ninth in lane A   | **After WP7's first part.** The check-up (idea 12) joins it.                                                                                   |
| WP19 Daybook steps back             | "Later"           | **The finish line on Today moves into WP5** (one line in the hero). The rest stays later, with idea 11.                                        |
| WP8 Quiet the game                  | Before lessons    | Unchanged, but it now waits for D7 in the owner's plainer words.                                                                               |

Unchanged: WP1 first in lane A (everything here reads the true record), WP9, WP10, WP11, WP15, WP16, WP18.

### New packages (short form; full briefs when the owner picks)

| New  | Title                                     | Model, effort | Needs                                                                                                                                                                                                                                                             |
| ---- | ----------------------------------------- | ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| WP21 | Daybook: The night pack (idea 5)          | Opus, medium  | Nothing built first, so it can start now. It needs the wait page to open from a link in the ordinary build, and it adds a row to Settings' Screen Time part, which WP2 is editing: agree that row with WP2's session first. A real phone to test each automation. |
| WP22 | Daybook: A word from this morning (6)     | Opus, high    | WP5 (the morning page), WP2 (the shield's words).                                                                                                                                                                                                                 |
| WP23 | Daybook: The spark (2)                    | Opus, high    | WP7's first part; a small server piece and the privacy page; `[deploy]`.                                                                                                                                                                                          |
| WP24 | Daybook: The circle and group codes (3)   | Opus, high    | WP23; decision B1 below.                                                                                                                                                                                                                                          |
| WP25 | Daybook: Last night, in a picture (7)     | Opus, high    | WP1, WP12; a check on a real phone of what Apple's usage report allows.                                                                                                                                                                                           |
| WP26 | Daybook: Tonight's shape (10)             | Opus, medium  | WP6 (the planner), WP9 (the week's picks).                                                                                                                                                                                                                        |
| WP27 | Daybook: The road and graduation day (11) | Opus, medium  | WP11 (lessons), WP7.                                                                                                                                                                                                                                              |
| WP28 | Daybook: Faith in the rhythm (13)         | Opus, medium  | WP5, WP9; D10 is already yes.                                                                                                                                                                                                                                     |
| WP29 | Daybook: On the Mac (9)                   | Opus, high    | Accounts and sync; decision B3.                                                                                                                                                                                                                                   |
| WP30 | Daybook: Apple Watch (4 and 8)            | Opus, high    | WP6, WP17. A new native target, so a new store build.                                                                                                                                                                                                             |
| WP31 | Daybook: Say it once (14)                 | Opus, medium  | WP22.                                                                                                                                                                                                                                                             |

**If I had to pick the order for the owner's own nights:** WP2 (running), WP21 the night pack (it can ship in the next ordinary store
build), WP1, WP5 with the good-night text, WP12 the flame's bed, WP22 a word from this morning, WP23 the spark. That is a wait that
works, a phone that goes quiet, a true record, two moments, a place for the phone to sleep, the owner's own voice at night, and one
person who can answer.

## Decisions these ideas need from the owner

- **B1. The circle.** The earlier plan kept out "group challenges and any open group or chat". The circle is neither a contest nor a
  chat, but it is a group. (a) Build it as described: honesty only, no chat, by invitation, with a leader (recommended). (b) The spark
  only, no circle. (c) Neither.
- **B2. Group codes.** A leader buys codes for their group. (a) Yes, with the circle (recommended: it charges the person who is not in
  trouble). (b) Later.
- **B3. Physical things.** The stand or stickers (idea 1) and the coin (idea 11). (a) Tell people a plain sticker works and sell
  nothing yet (recommended to start). (b) Sell a Daybook stand. (c) Also the coin at graduation.
- **B4. The spark needs a small server piece** and an account to receive one. (a) Yes: the server holds a random token and a count,
  never anything about the person (recommended). (b) No server: the helper's reply is an ordinary text and Daybook cannot show it.
- **B5. The afternoon note** (idea 10) is a third note on some days. (a) Yes, only for people who said nights are hardest, and it stops
  itself when not answered (recommended). (b) No third note: show it on Today in the afternoon instead.
- **B6. What is paid.** Recommended: free for everyone are the flame's bed, the night pack, the morning everywhere, a word from this
  morning, SOS in the dark, the one person and the spark, the circle's flames, the check-up and faith. Supporter extras are last night
  in a picture (Daybook Pattern), Daybook on the Mac (it needs sync) and group codes for leaders.

## What has not been checked

Nothing here has run on a real phone. The claims that most need one: a tag opening the app from the lock screen; an alarm's "Open"
button; Shortcuts opening an app from an app trigger at night; whether a shield can show words written that morning; whether Apple's
usage report works on an adult's own phone; whether the iOS 26.4 lock on Screen Time settings is as its one source says. Each new
package's first step is that check, before anything is built or promised.
