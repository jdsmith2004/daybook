/* The rules first copied from legacy/index.html (once generated; now kept by hand). New rules go in TypeScript in
   packages/core/src. Change this file only when one of its rules or words has to change, and keep the golden tests passing. */
/* eslint-disable */
// @ts-nocheck
import { LUNITS_MORE, SRC_MORE } from '../lesson-sources';
import { CATALOG, HABIT_IDS, NIGHT_IDS } from '../lesson-catalog';
import { DEED_PTS, deedCount, normDeeds } from '../steps';
import { normHave } from '../lesson-have';
import { normCreed } from '../faith';
import { normMorning } from '../morning-norm';
import { normHabit } from '../habit';
import { LADDER_V, LEVELS, levelOf, moveSeenLevel } from '../levels';
import { normTalks } from '../talk';
import { awayGapAt, awaySlipDay, awayStretchFrom, dayKnown, dayUntold, stretchBreaks } from '../away';

/* ------------------------------------------------------------------------------------------------
   logic: data model, counting, run saves, step down, points, badges, quests, rhythm
   ------------------------------------------------------------------------------------------------ */
/* ===== LOGIC: pure functions, no DOM, no storage ===== */
const TRIGGERS=[['late','Late night / in bed'],['lonely','Lonely or low'],['bored','Bored or idle'],['stress','Stressed or anxious'],['tired','Tired'],['scroll','After scrolling or gaming'],
 ['social','Around people drinking'],['unwind','Winding down after work'],['money','Money on hand or payday'],['game','A game on, or a betting ad'],['other','Other']];
/* answers for one habit only (habit.ts, November 9, 2026): shown first for that habit and left out for the others; scroll is left out for alcohol */
const TRIG_HABIT={social:'alcohol',unwind:'alcohol',money:'gambling',game:'gambling'},TRIG_SKIP={alcohol:['scroll']};
/* what I did: Daybook's own tools first (the pause, breathing, and the rest), then everyday things. More than one can be picked. */
const DIDS=[['pause','10-minute pause'],['breathe','Breathed'],['move','Walked or moved'],['reach','Texted or called someone'],['hobby','Hobby or project'],['left','Left the room'],
 ['curious','Got curious about it'],['ground','Did 5-4-3-2-1'],['halt','Asked what I needed'],['reasons','Read my reasons'],['surprise','A random calm move'],['thought','Named the thought'],['forward','Played it forward'],['bed','Went to bed'],['else','Something else'],['none','Nothing']];
const BUCKETS=[['morning','Morning','4 AM to noon'],['afternoon','Afternoon','noon to 5 PM'],['evening','Evening','5 to 10 PM'],['late','Late night','10 PM to 4 AM']];
const TRIG_T=Object.fromEntries(TRIGGERS), DID_T=Object.fromEntries(DIDS), BUCKET_T=Object.fromEntries(BUCKETS.map(b=>[b[0],b[1]]));
/* Answers you add yourself to "What set it off?" and "What did you do?" live in settings (opts), so they stay for good.
   Their ids start with u_. Removing one only hides it (off), so entries that used it keep their words. */
const OPT_ID=/^u_[a-z0-9]{3,16}$/,OPT_MAX=12,OPT_KEEP=40,OPT_LEN=40;
const isOptId=v=>typeof v==='string'&&OPT_ID.test(v);
const cleanOptLabel=v=>String(v==null?'':v).replace(/\s+/g,' ').trim().slice(0,OPT_LEN);
/* "What did you do?" can be more than one thing, so an entry holds a list of answer ids. An older entry holds one word, which reads as a list of one.
   The less common tools wait behind "Show all options" unless one of them is already picked. */
const DID_MORE=['curious','ground','halt','reasons','surprise','thought','forward','bed'];
function didIds(v){
 const a=Array.isArray(v)?v:(v==null?[]:[v]),out=[];
 a.forEach(x=>{if(typeof x==='string'&&(Object.prototype.hasOwnProperty.call(DID_T,x)||isOptId(x))&&out.indexOf(x)<0)out.push(x)});
 return out.slice(0,8);
}
/* one tap switches one answer on or off. "Nothing" stands alone: picking it clears the rest, and picking anything else clears it. */
function didToggle(cur,id){
 const a=didIds(cur);
 if(id==='none')return a.length===1&&a[0]==='none'?[]:['none'];
 const b=a.filter(x=>x!=='none'),i=b.indexOf(id);
 if(i>=0)b.splice(i,1);else b.push(id);
 return b;
}
/* switch one on without ever switching it off (a new answer of your own is picked straight away) */
function didAdd(cur,id){
 const b=didIds(cur).filter(x=>x!=='none');
 if(b.indexOf(id)<0)b.push(id);
 return b;
}
function normOptList(a){
 const out=[],seen={};
 (Array.isArray(a)?a:[]).forEach(o=>{
  if(!o||typeof o!=='object'||!isOptId(o.id)||seen[o.id])return;
  const t=cleanOptLabel(o.t);if(!t)return;
  seen[o.id]=1;out.push(o.off===true?{id:o.id,t,off:true}:{id:o.id,t});
 });
 return out.slice(0,OPT_KEEP);
}
function normOpts(o){return {trig:normOptList(o&&o.trig),did:normOptList(o&&o.did)}}
/* two sets of own answers combined, matched by id (the first one's wording wins) */
function mergeOpts(a,b){
 const out={trig:[],did:[]};
 ['trig','did'].forEach(k=>{
  const seen={};
  (((a&&a[k])||[]).concat((b&&b[k])||[])).forEach(x=>{if(x&&!seen[x.id]){seen[x.id]=1;out[k].push(x)}});
 });
 return normOpts(out);
}
/* the words for an answer: the built-in ones first, then the ones you added */
function optText(kind,id,opts){
 if(!id)return '';
 const base=kind==='did'?DID_T:TRIG_T;
 if(Object.prototype.hasOwnProperty.call(base,id))return base[id];
 const x=((opts&&opts[kind])||[]).find(y=>y.id===id);
 return x?x.t:'';
}
const trigText=(id,opts)=>optText('trig',id,opts),didText=(id,opts)=>optText('did',id,opts);
/* A few answers only make sense at some hours: "Late night / in bed" at 10:30 AM does not.
   The window is [from, to) in hours and may wrap past midnight. With no time on the entry, nothing is hidden. */
const TRIG_HOURS={late:[21,6]};
function trigFits(id,time){
 const w=TRIG_HOURS[id];
 if(!w||!isTime(time))return true;
 const h=+time.slice(0,2);
 return w[0]>w[1]?(h>=w[0]||h<w[1]):(h>=w[0]&&h<w[1]);
}
/* what one question shows, in order: the built-in answers that fit the hour, then your own, then the catch-alls.
   In "What did you do?" the less common tools wait behind "Show all options".
   Answers already picked (sel is one id or a list) always stay. hidden counts the built-in answers left out. */
function optList(kind,opts,o){
 o=o||{};
 const base=kind==='did'?DIDS:TRIGGERS,tail=kind==='did'?['else','none']:['other'];
 const sel=Array.isArray(o.sel)?o.sel:(o.sel?[o.sel]:[]),hb=o.habit||'porn';
 /* the habit's own answers first; another habit's, and the ones that do not fit this habit, only when already picked */
 const forHabit=x=>kind==='did'||sel.indexOf(x[0])>=0||(TRIG_HABIT[x[0]]?TRIG_HABIT[x[0]]===hb:((TRIG_SKIP[hb]||[]).indexOf(x[0])<0));
 const all0=base.filter(x=>tail.indexOf(x[0])<0).filter(forHabit),end=base.filter(x=>tail.indexOf(x[0])>=0);
 const head=all0.filter(x=>TRIG_HABIT[x[0]]===hb).concat(all0.filter(x=>TRIG_HABIT[x[0]]!==hb));
 const fits=x=>o.all||sel.indexOf(x[0])>=0||(kind==='did'?DID_MORE.indexOf(x[0])<0:trigFits(x[0],o.time));
 const shown=head.filter(fits);
 const mine=((opts&&opts[kind])||[]).filter(x=>!x.off||sel.indexOf(x.id)>=0).map(x=>[x.id,x.t]);
 return {list:shown.concat(mine,end,kind==='trig'&&o.notSure?[['none','Not sure']]:[]),hidden:head.length-shown.length};
}
const TOOL_IDS=['pause','breathe','curious','ground','halt','surprise','message','reasons','move','bed','thought','forward','stack'];
/* the lessons keep their ids forever: a finished lesson is saved by id, on the day it was finished */
/* l1 to l32 are here; l33 on are in lessons-more.ts */
/* l1 to l49, then the twelve God lessons, g1 to g12 (lesson-turns.ts GOD) */
/* then l50 to l53, the lessons of one habit only (lesson-habit.ts HABIT_TURNS) */
const LESSON_IDS=[...Array.from({length:49},(_,i)=>'l'+(i+1)),...Array.from({length:12},(_,i)=>'g'+(i+1)),...HABIT_IDS,...NIGHT_IDS],LNOTE_LEN=400;
/* The last unit is the faith lessons (l29 to l32). They come last in the daily order unless the person picks another order in Learn > Lessons
   (settings.learn.faith, kept once the person has chosen it: faithSet). They speak plainly of God without belonging to any one church or denomination, and each rests on a well-known
   program (the 12 steps, mindfulness-based relapse prevention) or on published research. */
const FAITH_IDS=['l29','l30','l31','l32'],FAITH_MODES=['mix','first','after'];
const WORDS_MAX=10,WORDS_LEN=200;
/* The daily routine: which parts of a day show up on Today. Settings keep the usual choice (settings.routine) and a single day can
   differ (p.ov). Anything switched off and not done simply drops out of that day's count. Doing a switched-off item still counts. */
/* "Last night" (the morning questions) left the routine on October 23, 2026: Good night counts as the phone going away, and
   sleep is asked in the check-in. A saved choice for it is still read and kept (the weeks with quests read it), but nothing shows it. */
const ROUTINE_GONE=[{k:'morning',on:true}];
const ROUTINE=[
 {k:'lesson',name:'Lesson',sub:'One short lesson a day, with one thing to try.',on:true},
 {k:'calm',name:'Calm move',sub:'Finish a tool or a 10-minute pause.',on:true},
 {k:'reach',name:'Reached out',sub:'Text, call, or talk to a person.',on:false},
 {k:'checkin',name:'Check-in',sub:'The short evening check-in.',on:true},
 {k:'wind',name:'Wind-down',sub:'The checklist for the hour before screens go off.',on:true},
 /* a stop on Your day only (core day.ts): never a daily win, so switching it changes no ring or points */
 {k:'journal',name:'Journal',sub:'A few words about the day, in your journal.',on:false}
];
const ROUTINE_KEYS=ROUTINE.map(r=>r.k);
const ROUTINE_KEPT=ROUTINE_GONE.concat(ROUTINE);
/* the lesson counts as a daily win from the day it was added; earlier days keep their old five-win rings */
const LESSON_WIN_FROM='2026-10-12';
function normRoutine(r){
 const o={};
 ROUTINE_KEPT.forEach(x=>{o[x.k]=r&&typeof r[x.k]==='boolean'?r[x.k]:x.on});
 return o;
}
function normOv(v){
 const o={};
 if(v&&typeof v==='object')ROUTINE_KEPT.forEach(({k})=>{if(typeof v[k]==='boolean')o[k]=v[k]});
 return o;
}

/* the 8 safety-net steps keep their order forever: saved ticks are stored by position */
const SAFETY=[
 ['Phone charges outside the bedroom at night','Late night in bed is one of my hardest times.'],
 ['Adult-content filter on my phone (phone-wide)','Makes the urge take more than two taps. Steps are in Get help.'],
 ['Same filter on my computer','A block on one device just moves the urge.'],
 ['Log out of accounts, delete bookmarks','Less to resist late at night.'],
 ['Set my screens-off time (in Settings)','Late-night scrolling and gaming are my on-ramps.'],
 ['Pick my safe person and tell them my one sentence','Honesty gets cheap, so lying gets less likely.'],
 ['Read my slip plan','Decide now, not in the middle of a snowball.'],
 ['Fill in my urge plan','A pre-decided move beats willpower.']
];
const PLAN_WAS={"I'm in bed late at night":'I am in bed late at night',"I'm lonely or low":'I am lonely or low',"I'm bored or idle":'I am bored or idle',
 "I'm stressed or anxious":'I am stressed or anxious',"I'm tired but still up":'I am tired but still up',
 "Move my body (walk, pushups), then write one sentence about what's stressing me.":'Move my body (walk, pushups), then write one sentence about what is stressing me.'};
const URGE_PLAN=[
 ["I am in bed late at night","Get up and leave the room for 10 minutes. Water, stretch, tidy something. Then back to bed without my phone."],
 ["I am lonely or low","Text or call one person. A message counts. Or go somewhere with people around."],
 ["I am bored or idle","10-minute walk outside, or 10 minutes on a hobby or project."],
 ["I am stressed or anxious","Move my body (walk, pushups), then write one sentence about what is stressing me."],
 ["Something else: ______",""]
];
const SLIP_STEPS=[
 'Log it in 30 seconds. No hiding.',
 'One small thing within the hour: SOS if it still pulls, or a few lines in my journal.',
 'No big decisions tonight, and no "I blew it" verdicts.',
 'Tomorrow: check in as usual. Nothing resets. Ask what the trigger was and what to change.',
 'If I want to, tell my safe person: "I slipped."'
];
/* the starting slip plan once named things outside Daybook. A plan saved with those words gets the new ones (normSettings). */
const SLIP_WAS={'One small action within the hour: water, step outside, or text someone.':'One small thing within the hour: SOS if it still pulls, or a few lines in my journal.'};
const SLIP_MAX=8,SLIP_LEN=200;
const HELP_STEPS=[
 "Find my employer's EAP number (benefits portal or HR) and save it in my phone",
 'Look at Open Path Collective or another sliding-scale therapist near me',
 'Book one free intro call with a therapist (about 15 minutes)',
 'Try one free group meeting, just to listen',
 'Tell my safe person my one sentence (script is in Get help)'
];
const THERAPIST_CRIT=[
 "Licensed in my state (I checked the state board's website)",
 'Offers a free 15-minute intro call',
 'Can explain how they treat this habit (compulsive porn use)',
 'Practical and nonjudgmental (CBT or ACT-style is a good sign)',
 'No shaming, moralizing, or promise of a cure',
 'Rates fit my budget (sliding scale or student intern?)'
];
const WIND_DEFAULT=[
 'Phone goes on its charger outside the bedroom',
 'Brush teeth, wash face',
 "Set tomorrow's alarm (a real alarm clock if I have one)",
 'Lay out tomorrow: clothes, water, keys',
 'Read, stretch, or write a few lines instead of scrolling'
];
const MENU_DEFAULT=[
 'Walk around the block','Ten squats or push-ups','Make a hot drink','Text a friend: "thinking of you"','Tidy one surface','Take a shower',
 'Step outside for two minutes','Stretch for three minutes','Listen to one whole song','Write three lines in a notebook','Wash a few dishes',
 'Call someone for five minutes','Read five pages of a book','Work on a hobby for ten minutes'
];
/* ready-to-send wording, used by Help > What to say and by the lessons. The order is fixed: copy buttons point at positions. */
const SCRIPTS=[
 ['Calling the EAP or a clinic',"Hi, I would like to set up counseling. I have struggled with a compulsive habit for several years, and my mood has been up and down. I would like help with both. What are my next steps?"],
 ['Asking about price',"Do you currently offer any sliding scale or reduced-fee spots?"],
 ["Questions for a therapist's intro call",'1) How do you work with compulsive porn use?  2) What would the first few sessions look like?  3) Do you offer a sliding scale or intern rates?  4) How do you feel about working with my values and faith?'],
 ['Asking my doctor for a referral',"I have had a habit I cannot control for years, and it is hurting my sleep, focus, and relationships. Can you refer me to counseling?"],
 ['For my safe person','I am working on something, and I might tell you when I slip. All I need is for you to say "thanks for telling me." No advice, no fixing.'],
 ['After a slip, to my safe person','I slipped. I am telling you because hiding makes it worse. I do not need advice. Just thanks for listening.'],
 ['A text when I am lonely','Hey, thinking of you. Got a few minutes to talk tonight?'],
 ['Asking a faith leader or mentor to meet','I would like to talk with you about something personal that I have been struggling with. Do you have some time this week?'],
 ['The first sentence, with a faith leader','I have been struggling with compulsive porn use. I want to stop, and I want your support. I am also looking at counseling and a recovery group. Could we talk about how my faith fits in?'],
 ['Asking someone to be my sponsor or check-in partner','I respect how you have handled your own recovery. Would you check in with me once a week? I am not asking you to fix anything. I want someone who knows, so I stay honest.']
];
const REASON_DEFAULT=['Being fully present with the people I love','Clear mornings and steady energy','Becoming someone I am proud of'];
const REASON_MAX=10,REASON_LEN=160,RCAT_IDS=['rel','foc','val','oth'];

/* ---------- dates (all keys are 'YYYY-MM-DD' strings in the device's local calendar) ---------- */
const p2=n=>String(n).padStart(2,'0');
function keyOfDate(d){return d.getFullYear()+'-'+p2(d.getMonth()+1)+'-'+p2(d.getDate())}
function utcOf(key){const a=key.split('-').map(Number);return Date.UTC(a[0],a[1]-1,a[2])}
function addDays(key,n){const t=new Date(utcOf(key)+n*864e5);return t.getUTCFullYear()+'-'+p2(t.getUTCMonth()+1)+'-'+p2(t.getUTCDate())}
function diffDays(a,b){return Math.round((utcOf(a)-utcOf(b))/864e5)}
/* the "day" rolls over at `roll` o'clock, so a 1 AM entry still belongs to the night before */
function logicalKey(ms,roll){const d=new Date(ms),k=keyOfDate(d);return d.getHours()<roll?addDays(k,-1):k}
function clockOf(ms){const d=new Date(ms);return p2(d.getHours())+':'+p2(d.getMinutes())}
function fmtClock(t){if(!t)return '';const a=t.split(':').map(Number);const h=a[0],m=a[1];return (h%12||12)+':'+p2(m)+' '+(h<12?'AM':'PM')}
function fmtHour(h){return (h%12||12)+' '+(h<12?'AM':'PM')}
function fmtDate(key,o){return new Date(utcOf(key)).toLocaleDateString('en-US',Object.assign({timeZone:'UTC'},o||{weekday:'short',month:'short',day:'numeric'}))}
function bucketOf(t){const h=+t.slice(0,2);if(h>=4&&h<12)return 'morning';if(h>=12&&h<17)return 'afternoon';if(h>=17&&h<22)return 'evening';return 'late'}
function sortMin(t,roll){if(!t)return 9999;const a=t.split(':').map(Number);return (a[0]*60+a[1]-roll*60+1440)%1440}
function maxKey(a,b){return a>b?a:b}
function minKey(a,b){return a<b?a:b}
function clone(o){return JSON.parse(JSON.stringify(o))}
function newId(){return Date.now().toString(36)+Math.random().toString(36).slice(2,6)}
function isKey(k){return typeof k==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(k)}
function isTime(t){return typeof t==='string'&&/^([01]\d|2[0-3]):[0-5]\d$/.test(t)}
function minOf(t){const a=t.split(':').map(Number);return a[0]*60+a[1]}
function fmtLeft(mins){const h=Math.floor(mins/60),m=mins%60;return h?(m?h+' h '+m+' min':h+' h'):m+' min'}

/* ---------- settings ---------- */
function cleanList(v,fallback,max,len){
 if(!Array.isArray(v))return fallback.slice();
 return v.map(x=>String(x==null?'':x).trim().slice(0,len)).filter(Boolean).slice(0,max);
}
function reasonsFromWhy(why){
 const parts=String(why||'').split(/[.\n]+/).map(x=>x.trim()).filter(Boolean).slice(0,6);
 return parts.length?parts:REASON_DEFAULT.slice();
}
function defaultSettings(startKey){
 return {v:1,start:startKey,day1:addDays(startKey,7),rollover:4,screensOff:'23:00',
  goal:'Get control back. Start with a no-pressure tracking week.',
  why:'Being fully present with the people I love. Clear mornings and steady energy. Becoming someone I am proud of.',
  loop:'Fail → shame → hide → give up.',
  rule:'I log slips instead of hiding them. A slip is data, not a reset.',
  safePerson:'',becoming:'',ask:'If I tell you I slipped, just say "thanks for telling me." No advice, no fixing.',
  safety:SAFETY.map(()=>false),help:HELP_STEPS.map(()=>false),
  plan:URGE_PLAN.map(r=>({when:r[0],then:r[1]})),
  slipPlan:SLIP_STEPS.slice(),
  therapist:{names:['','',''],checks:THERAPIST_CRIT.map(()=>[false,false,false])},
  reasons:REASON_DEFAULT.slice(),rmeta:[],learn:{notes:{},faith:'after',faithSet:false,len:'',prac:{},picks:{},wr:{}},words:[],menu:MENU_DEFAULT.slice(),wind:WIND_DEFAULT.slice(),celebrate:true,seen:null,opts:{trig:[],did:[]},cleanMode:'strict',cleanAuto:true,cleanNote:null,cleanHold:null,
  routine:normRoutine(null),
  u:Date.now()};
}
function normSeen(s){
 if(!s||typeof s!=='object')return null;
 const arr=a=>Array.isArray(a)?a.filter(x=>typeof x==='string').slice(0,200):[];
 /* lad = which ladder the saved level counts on (3 = the 30-level ladder, 4 = the 60-level one in levels.ts). A level saved on
    an older ladder is moved over here, to the level that keeps at least its points, so nothing shown ever goes down. */
 const lad=Math.max(0,Math.min(99,parseInt(s.lad,10)||0));
 const o={badges:arr(s.badges),quests:arr(s.quests),level:moveSeenLevel(parseInt(s.level,10)||1,lad),full:isKey(s.full)?s.full:null,lad:Math.max(lad,LADDER_V)};
 /* the most points ever shown, kept when a change would lower them (miles.ts keepPoints): points are never taken away */
 const pts=parseInt(s.pts,10);
 if(pts>0)o.pts=pts;
 /* the longest run ever shown (miles.ts keepCounts): switching how days count never lowers it */
 const lg=parseInt(s.longest,10);
 if(lg>0)o.longest=lg;
 return o;
}
function normLearn(l){
 const src=(l&&typeof l==='object'&&l.notes&&typeof l.notes==='object')?l.notes:{},notes={};
 LESSON_IDS.forEach(id=>{const v=src[id];if(typeof v==='string'&&v.trim())notes[id]=v.slice(0,LNOTE_LEN)});
 /* faith: where the faith lessons sit in the daily order. They come last by default. "Mixed in" counts only when the person
    chose it (faithSet); an older save that says "mixed in" without that was just the old default and is read as "last". First and last are always kept. */
 const fm=(l&&FAITH_MODES.indexOf(l.faith)>=0)?l.faith:'after',fs=!!(l&&l.faithSet);
 /* len: the length last chosen (q = Quick, f = Full). prac: lessons whose practice was done (a marker, no points). picks: the answer chosen on a
    "your turn" card that is kept for the playbook. wr: the checkpoint writing, three answers per checkpoint. */
 const o=(l&&typeof l==='object')?l:{},prac={},picks={},wr={},back={};
 LESSON_IDS.forEach(id=>{
  if(o.prac&&o.prac[id])prac[id]=1;
  if(o.back&&o.back[id])back[id]=1;
  const v=o.picks&&o.picks[id];if(typeof v==='string'&&v.trim())picks[id]=v.slice(0,200);
 });
 for(let n=1;n<=16;n++){
  const w=o.wr&&o.wr['c'+n];
  if(w&&Array.isArray(w.a)){const a=[0,1,2].map(i=>String(w.a[i]==null?'':w.a[i]).slice(0,1500));if(a.some(x=>x.trim()))wr['c'+n]={a,u:Number(w.u)||0}}
 }
 /* back: welcome backs passed on the path (lessons.ts lessonReach), kept only when there is one */
 const out={notes,faith:(fm==='mix'&&!fs)?'after':fm,faithSet:fs,len:(o.len==='q'||o.len==='f'||o.len==='d')?o.len:'',prac,picks,wr};
 if(Object.keys(back).length)out.back=back;
 /* did, later, asked: the steps' deeds (steps.ts), each kept only when there is one */
 Object.assign(out,normDeeds(o));
 /* have: what the person said they already do (lesson-have.ts), kept only when there is one */
 Object.assign(out,normHave(o));
 /* deep: Deep lessons turned on in Settings; lens: how often each length was picked (setup.ts lessonLen), each kept only when there is one */
 if(o.deep===true)out.deep=true;
 const lens={};['q','f','d'].forEach(k=>{const n=Math.floor(Number(o.lens&&o.lens[k]));if(n>0)lens[k]=Math.min(n,99999)});
 if(Object.keys(lens).length)out.lens=lens;
 return out;
}
/* a journal tag, as Obsidian takes one: lower case, no spaces, letters, numbers, - _ and /, and never only numbers (journal-notes.ts) */
function cleanTag(v){
 if(typeof v!=='string')return '';
 const t=v.trim().toLowerCase().replace(/^#+/,'').replace(/\s+/g,'-').replace(/[^\p{L}\p{N}_\/-]/gu,'').replace(/\/+/g,'/').replace(/^[\/-]+|[\/-]+$/g,'').slice(0,40);
 return /[^\d\/]/.test(t)?t:'';
}
function cleanTags(v){
 return Array.isArray(v)?[...new Set(v.map(cleanTag).filter(Boolean))].slice(0,20):[];
}
function normSettings(s){
 const d=defaultSettings(isKey(s&&s.start)?s.start:keyOfDate(new Date()));
 const o=Object.assign({},d,s||{});
 if(!isKey(o.start))o.start=d.start;
 if(o.day1===undefined)o.day1=d.day1;
 else if(o.day1!==null&&(!isKey(o.day1)||o.day1<o.start))o.day1=addDays(o.start,7);
 if(!(o.rollover>=0&&o.rollover<=6))o.rollover=4;
 if(!isTime(o.screensOff))o.screensOff='23:00';
 if(!Array.isArray(o.safety)||o.safety.length!==SAFETY.length)o.safety=SAFETY.map((_,i)=>!!(o.safety&&o.safety[i]));
 if(!Array.isArray(o.help)||o.help.length!==HELP_STEPS.length)o.help=HELP_STEPS.map((_,i)=>!!(o.help&&o.help[i]));
 /* the starting lines stay in their places (setup and Rekindle write to them by place); lines a person adds come after them, up to 12 */
 if(!Array.isArray(o.plan)||o.plan.length<URGE_PLAN.length||o.plan.length>12)o.plan=d.plan;
 /* the starting plan once said "I'm" and "what's". A plan saved with those words gets the new ones, so it still reads as the starting plan. */
 else o.plan=o.plan.map(r=>r&&typeof r==='object'?Object.assign({},r,{when:PLAN_WAS[r.when]||r.when,then:PLAN_WAS[r.then]||r.then}):r);
 /* the slip plan: the person's own steps. Empty is allowed on purpose; a save with no list at all gets the starter plan. */
 o.slipPlan=Array.isArray(o.slipPlan)?cleanList(o.slipPlan,[],SLIP_MAX,SLIP_LEN).map(x=>SLIP_WAS[x]||x):SLIP_STEPS.slice();
 const t=o.therapist||{};
 o.therapist={names:[0,1,2].map(i=>String((t.names&&t.names[i])||'')),checks:THERAPIST_CRIT.map((_,r)=>[0,1,2].map(c=>!!(t.checks&&t.checks[r]&&t.checks[r][c])))};
 ['goal','why','loop','rule','safePerson','becoming','ask'].forEach(k=>{if(typeof o[k]!=='string')o[k]=d[k]});
 /* lists: reasons may be empty on purpose; the other two fall back to the starter lists */
 o.reasons=(s&&Array.isArray(s.reasons))?cleanList(s.reasons,REASON_DEFAULT,REASON_MAX,REASON_LEN):reasonsFromWhy(o.why);
 /* rmeta: the category a reason was filed under, matched by its exact text (so an older copy that reorders or edits the list cannot scramble it) */
 o.rmeta=(Array.isArray(o.rmeta)?o.rmeta:[]).filter(m=>m&&typeof m.t==='string'&&RCAT_IDS.indexOf(m.c)>=0&&o.reasons.indexOf(m.t)>=0).slice(0,REASON_MAX).map(m=>({t:m.t,c:m.c}));
 /* lesson notes: one short note per lesson, only for lessons that exist */
 o.learn=normLearn(o.learn);
 /* words that steady me: lines the person writes from their own faith or values. Empty is fine; nothing is filled in for them. */
 o.words=cleanList(o.words,[],WORDS_MAX,WORDS_LEN);
 o.menu=cleanList(o.menu,MENU_DEFAULT,24,100);if(!o.menu.length)o.menu=MENU_DEFAULT.slice();
 o.wind=cleanList(o.wind,WIND_DEFAULT,10,100);if(!o.wind.length)o.wind=WIND_DEFAULT.slice();
 o.celebrate=o.celebrate!==false;
 /* jnTags: the tags on every journal note. No list yet means the starting ones (journal-notes.ts); empty is allowed on purpose. */
 if(o.jnTags!==undefined)o.jnTags=cleanTags(o.jnTags);
 o.seen=normSeen(o.seen);
 o.opts=normOpts(o.opts);
 /* how days are counted: strict (no slip), gentle (one slip or fewer), or step (the step-down plan: longer stretches between slips, fewer each week).
    stepAt: the day the step-down plan started. stepNo: the day its offer was turned down (it waits two weeks). stepGrad: the day it was finished. */
 o.cleanMode=o.cleanMode==='gentle'||o.cleanMode==='step'?o.cleanMode:'strict';
 o.cleanAuto=o.cleanAuto!==false;
 o.cleanNote=(o.cleanNote&&isKey(o.cleanNote.on))?{on:o.cleanNote.on,m:o.cleanNote.m==='step'||o.cleanNote.m==='count'?o.cleanNote.m:'gentle'}:null;
 o.cleanHold=isKey(o.cleanHold)?o.cleanHold:null;
 /* cleanWas: how days were counted before step down (actions.ts). Kept only when it is one of the two. */
 if(o.cleanWas!=='strict'&&o.cleanWas!=='gentle')delete o.cleanWas;
 /* countFrom: the day this person first opened the one-count rule (runLedger). Kept only when it is a day, so a log without it reads as before. */
 if(!isKey(o.countFrom))delete o.countFrom;
 o.stepAt=isKey(o.stepAt)?o.stepAt:null;
 o.stepNo=isKey(o.stepNo)?o.stepNo:null;
 o.stepGrad=isKey(o.stepGrad)?o.stepGrad:null;
 o.routine=normRoutine(o.routine);
 /* SOS: a note from a calm day, shown first in SOS and My reasons, and the tool SOS should always offer first (null: the best fit) */
 o.note=typeof o.note==='string'?o.note.slice(0,600):'';
 o.urPin=TOOL_IDS.indexOf(o.urPin)>=0?o.urPin:null;
 o.onb=normOnb(o.onb);
 /* widget: the day the flame was first seen on the Home Screen or Lock Screen (flame-widget.ts). Set once and never cleared. */
 if(!isKey(o.widget))delete o.widget;
 /* mith: the Mithras import (mithras.ts): when, the day it first ran, and the welcome points, never more than Campfire's first step */
 if(o.mith&&typeof o.mith==='object'&&isKey(o.mith.d)&&Number.isFinite(o.mith.at))o.mith={at:o.mith.at,d:o.mith.d,pts:Math.max(0,Math.min(270,parseInt(o.mith.pts,10)||0))};else delete o.mith;
 return o;
}
function normEvent(e){
 if(!e||(e.outcome!=='rode'&&e.outcome!=='slipped'))return null;
 const o={id:String(e.id||newId()),time:isTime(e.time)?e.time:null,outcome:e.outcome,
  trigger:(TRIG_T[e.trigger]||isOptId(e.trigger))?e.trigger:null,paused:e.paused===true?true:e.paused===false?false:null,
  did:didIds(e.did).length?didIds(e.did):null,recovered:e.recovered===true,note:typeof e.note==='string'?e.note.slice(0,500):''};
 /* from SOS: how strong it was at the start (st), minutes from the first tap to the end (m), each tool tried with what happened next (tr: p passed, s still strong, x slipped),
    and whether it was stopped partway (sp). Older entries simply do not have these. */
 if(e.st==='low'||e.st==='mid'||e.st==='high')o.st=e.st;
 if(Number.isInteger(e.m)&&e.m>=0&&e.m<=240)o.m=e.m;
 const tr=Array.isArray(e.tr)?e.tr.filter(r=>Array.isArray(r)&&TOOL_IDS.indexOf(r[0])>=0&&(r[1]==='p'||r[1]==='s'||r[1]==='x')).slice(0,8).map(r=>[r[0],r[1]]):[];
 if(tr.length)o.tr=tr;
 if(e.sp===true)o.sp=true;
 /* Rekindle: the day the sunrise check was done the morning after this slip (at), the if-then plan made there (pl),
    and the deeper mission a long run needs to be saved (dp: trace = traced the slip back, with the answers in tr; tell = told a person) */
 if(e.rk&&typeof e.rk==='object'){
  const rk={};
  if(isKey(e.rk.at)){rk.at=e.rk.at;rk.pl=typeof e.rk.pl==='string'?e.rk.pl.slice(0,200):''}
  if(e.rk.dp==='trace'||e.rk.dp==='tell')rk.dp=e.rk.dp;
  if(Array.isArray(e.rk.tr))rk.tr=[0,1,2].map(i=>String(e.rk.tr[i]==null?'':e.rk.tr[i]).slice(0,200));
  if(rk.at||rk.dp)o.rk=rk;
 }
 /* how long the person waited before a slip, in minutes (0, 5, 10 or 20 and up). Waiting is a skill, so it is counted even when the urge won. */
 if([0,5,10,20].indexOf(e.wt)>=0)o.wt=e.wt;
 /* on a slip: the exact minutes waited first, as the slip's "Did you wait first?" slider set them (wt keeps the step the older rules count) */
 if(e.outcome==='slipped'&&Number.isInteger(e.wm)&&e.wm>=0&&e.wm<=240)o.wm=e.wm;
 /* keep or start fresh, kept from older builds (the old rule in runLedger reads it): true keep the run going, false start fresh, absent not answered */
 if(e.outcome==='slipped'&&(e.keep===true||e.keep===false))o.keep=e.keep;
 /* mn: a slip told the next morning in the morning set (morning-set.ts): it happened in the night, at a time not given */
 if(e.outcome==='slipped'&&e.mn===true)o.mn=true;
 /* on a slip (slip.ts): the feeling named for before it (fb, a word from the field of feelings) and how it felt afterwards (fa) */
 if(e.outcome==='slipped'&&typeof e.fb==='string'&&/^[A-Za-z][A-Za-z ]{0,23}$/.test(e.fb))o.fb=e.fb;
 if(e.outcome==='slipped'&&['shame','giveup','angry','flat','pull','okay'].indexOf(e.fa)>=0)o.fa=e.fa;
 return o;
}
function normCheckin(c){
 if(!c||typeof c!=='object')return null;
 const num=(v,lo,hi)=>typeof v==='number'&&isFinite(v)&&v>=lo&&v<=hi?v:null;
 const yn=v=>v==='Y'||v==='N'?v:null;
 return {m:num(c.m,0,10),c:num(c.c,0,10),e:num(c.e,0,10),s:num(c.s,0,10),h:num(c.h,0,24),so:yn(c.so),ro:yn(c.ro),
  n:typeof c.n==='string'?c.n.slice(0,300):'',done:c.done===true,at:typeof c.at==='number'?c.at:0,...moodUrges(c)};
}
/* mood and urges (the three-number check-in, October 24, 2026), kept only when answered, so older days read as before */
function moodUrges(c){const o={};['md','u'].forEach(k=>{if(typeof c[k]==='number'&&isFinite(c[k])&&c[k]>=0&&c[k]<=10)o[k]=c[k]});return o}
/* p = the small "play" record for a day: wind-down ticks, a reached-out tap, calm-move count, morning check, tools used, lessons finished,
   lessons read again (lv), and which parts of the routine this day switched on or off (ov, only the ones that differ from Settings).
   pEmpty looks at what was DONE. A day that only has routine choices is kept, but it is not an active day. */
function pEmpty(q){return !q||(!q.w.length&&!q.wd&&!q.r&&!q.c&&!q.m&&!q.tl.length&&!q.po&&!(q.ls&&q.ls.length)&&!(q.lv&&q.lv.length))}
function normP(p){
 if(!p||typeof p!=='object')return null;
 const w=Array.isArray(p.w)?[...new Set(p.w.map(Number).filter(n=>Number.isInteger(n)&&n>=0&&n<20))].sort((a,b)=>a-b):[];
 const tl=Array.isArray(p.tl)?[...new Set(p.tl.filter(t=>TOOL_IDS.includes(t)))]:[];
 const ls=Array.isArray(p.ls)?[...new Set(p.ls.filter(t=>LESSON_IDS.includes(t)))]:[];
 const lv=Array.isArray(p.lv)?[...new Set(p.lv.filter(t=>LESSON_IDS.includes(t)))].slice(0,8):[];
 const ov=normOv(p.ov);
 const q={w,wd:p.wd===true,r:p.r===true,c:Math.max(0,Math.min(50,parseInt(p.c,10)||0)),m:p.m===true,tl,po:isTime(p.po)?p.po:null,ls,lv,ov};
 const tt=normTalks(p.tt);if(tt.length)q.tt=tt;
 const fe=Array.isArray(p.fe)?p.fe.filter(x=>Array.isArray(x)&&typeof x[0]==='string'&&typeof x[1]==='number').map(x=>[x[0].slice(0,24),x[1]]).slice(0,50):[];if(fe.length)q.fe=fe;
 if(Number.isInteger(p.hw)&&p.hw>=0&&p.hw<24)q.hw=p.hw;
 /* lt: when the day's last lesson was finished or read again (ms), for the lesson reminder (nudges.ts) */
 if(typeof p.lt==='number'&&isFinite(p.lt)&&p.lt>0)q.lt=p.lt;
 /* o: the app was opened that day (away.ts). It keeps the day as present, and is not something done. */
 if(p.o===true)q.o=true;
 /* mw: a win logged in Mithras that day (mithras.ts). It keeps the day as told, and is not something done. */
 if(p.mw===true)q.mw=true;
 /* df: the answer to "How are you feeling today?" (day-feel.ts): a step from 1 to 5, and when (ms) */
 if(Array.isArray(p.df)&&[1,2,3,4,5].includes(p.df[0])&&typeof p.df[1]==='number'&&isFinite(p.df[1])&&p.df[1]>=0)q.df=[p.df[0],p.df[1]];
 /* ms: the morning set (morning-set.ts): last night's answer, this morning's feel, tonight's reason and wait time */
 const ms=normMorning(p.ms);if(ms)q.ms=ms;
 return pEmpty(q)&&!Object.keys(ov).length&&!q.o&&!q.mw&&!q.fe&&!q.df&&!q.ms?null:q;
}
function blankP(){return {w:[],wd:false,r:false,c:0,m:false,tl:[],po:null,ls:[],lv:[],ov:{}}}
/* a day counts as active when something was done, not when only the routine was edited */
const pActive=p=>!!p&&!pEmpty(p);
/* is this part of the routine on for that day? A day's own choice wins over the usual one in Settings. */
function routineOn(st,p,k){
 const o=p&&p.ov&&p.ov[k];
 if(typeof o==='boolean')return o;
 return !!(st&&st.routine&&st.routine[k]);
}
function normDay(d,key){
 const evs=((d&&d.events)||[]).map(normEvent).filter(Boolean);
 const out={d:key,events:evs,checkin:normCheckin(d&&d.checkin),p:normP(d&&d.p),u:(d&&typeof d.u==='number')?d.u:0};
 /* the ids of deleted entries, for sync (types.ts Day.gone): kept only when there are some, the newest 100 */
 const gone=d&&Array.isArray(d.gone)?d.gone.filter(x=>typeof x==='string'&&x).slice(-100):[];
 if(gone.length)out.gone=gone;
 return out;
}

/* ---------- one day ---------- */
function sumDay(day){
 const ev=(day&&day.events)||[];let rode=0,slipped=0;
 ev.forEach(e=>{if(e.outcome==='rode')rode++;else if(e.outcome==='slipped')slipped++});
 return {n:ev.length,rode,slipped,checked:!!(day&&day.checkin&&day.checkin.done)};
}
function sortedEvents(day,roll){return ((day&&day.events)||[]).slice().sort((a,b)=>sortMin(a.time,roll)-sortMin(b.time,roll))}
/* D14 (the owner, November 12, 2026): once there is a Day 1, the free days of the tracking week before it count in the record (the
   run, the longest run, the no-slip days, graduation), from the first day, so a run is never shorter on screen than it was in life.
   It holds for every record this version has opened: keepCounts writes truthFrom on the first open (truth.ts), and the tracking
   week counts from then on, back to the start. A log with no truthFrom (the frozen golden fixtures) counts from Day 1 as it did. */
function recordFrom(st){return st.day1&&isKey(st.truthFrom)&&st.start<st.day1?st.start:st.day1}
function phaseOf(key,st){
 if(key<st.start)return {p:'before',n:0};
 if(!st.day1||key<st.day1)return {p:'tracking',n:diffDays(key,st.start)+1};
 return {p:'quitting',n:diffDays(key,st.day1)+1};
}
function statusOf(key,day,st,today,days){
 if(key>today)return 'future';
 const s=sumDay(day);
 if(s.slipped)return 'slip';
 /* from Day 1 on, a day with no slip logged counts, whether or not a check-in was saved, unless the person was away long
    enough that Daybook does not know (away.ts) */
 /* a day inside a gap away (away.ts) is not shown as a day of its own: the gap has one look, and one line with its slips */
 /* from truthFrom on, a night nobody told Daybook about is not a free night (truth.ts): it is drawn hollow */
 /* the tracking week's days count too once there is a Day 1 (D14, recordFrom), up to yesterday */
 if(phaseOf(key,st).p==='quitting'||(st.day1&&key>=recordFrom(st)&&key<today))return days&&dayUntold(days,st,key,today)?'untold':days&&awayGapAt(days,st,key,today)?'unknown':'clean';
 if(s.checked)return 'tracked';
 if(s.n)return 'events';
 return 'empty';
}
function allKeys(days){return Object.keys(days).filter(isKey).sort()}
function eventsOf(days,fromKey){
 const out=[];
 allKeys(days).forEach(k=>{if(fromKey&&k<fromKey)return;(days[k].events||[]).forEach(e=>out.push(Object.assign({key:k},e)))});
 return out;
}

/* ---------- streaks and totals ---------- */
/* ===== COUNTING DAYS =====
   A day counts when no slip is logged on it. A day with nothing logged counts too: not logging a slip is not a slip.
   "Strict" is the default. "Gentle" lets a day with one slip still count, for a rough stretch. Switching never changes what is logged. */
const cleanLimit=(st,mode)=>(mode||(st&&st.cleanMode))==='gentle'?1:0;
/* what kind of day it was: ok (no slip), one (one slip, which still counts in gentle), slip (does not count), before (tracking week), ahead,
   or unknown: nothing logged while the person was away long enough that Daybook does not know (away.ts; only when the log is given) */
function dayKind(key,day,st,today,mode,days){
 if(key>today)return 'ahead';
 if(!st.day1||key<recordFrom(st))return 'before';
 let n=sumDay(day).slipped;
 if(n===0&&days){
  if(!dayKnown(days,st,key,today))return 'unknown';
  /* one of the slips the person said they had while away (away.ts): it takes this day */
  if(awaySlipDay(days,st,key,today))n=1;
 }
 return n===0?'ok':n<=cleanLimit(st,mode)?'one':'slip';
}
/* ===== THE ONE COUNT (the owner, October 30, 2026) =====
   A slip ends the run on the day it happens, and the next day starts a new one. There is no rescue and no question: the mode
   decides what Today shows (hero.ts), and the days earned stay on the record (longest, computeMetrics; the no-slip days in all).
   ===== WHAT CAME BEFORE =====
   Until then, the first slip in any 7 days could save a run: finish the Rekindle missions, or come back (the sunrise check, and the
   third flame by itself) within BACK_DAYS, unless the person chose to start fresh on the slip (keep: false). Those rules stay for slips
   up to st.countFrom, the day this person first opened the new rule (the store sets it, miles.ts keepCounts), because the update
   reaches each phone on its own day: a run saved stays saved, and a person mid-rescue keeps what the old rule gives them. No countFrom
   yet means nothing has moved to the new rule. Worked out from the log, like everything else. */
const RUN_DEEP=14,BACK_DAYS=3,RUN_ASK=7,RUN_ASK_FROM='2026-10-22';
/* From RK_BACK_FROM on, the old rule also saved a run by coming back: within BACK_DAYS, the sunrise check and the third flame (rkThirdOf). */
const RK_BACK_FROM='2026-10-19';
/* the third comeback flame for the slip on day k, as of today (it counts a comeback, and rescues nothing now): the first urge ridden out after the slip (that day, later, or the days
   after, up to the window), or the first full day after it with no slip. {k:the day it lit, rode:true for an urge} or null. */
function rkThirdOf(days,k,st,today){
 const roll=st&&st.rollover!=null?st.rollover:4,dl=addDays(k,BACK_DAYS),ev=sortedEvents(days[k],roll);
 let last=-1;ev.forEach((e,i)=>{if(e.outcome==='slipped')last=i});
 if(ev.slice(last+1).some(e=>e.outcome==='rode'))return {k,rode:true};
 for(let d=addDays(k,1);d<=dl&&d<=today;d=addDays(d,1)){
  const x=days[d];
  if(x&&x.events&&x.events.some(e=>e.outcome==='rode')){
   const sl=sortedEvents(x,roll),fi=sl.findIndex(e=>e.outcome==='slipped'),ri=sl.findIndex(e=>e.outcome==='rode');
   if(fi<0||ri<fi)return {k:d,rode:true};
  }
  if(d<today&&!sumDay(x).slipped)return {k:d,rode:false};
  if(sumDay(x).slipped)return null;
 }
 return null;
}
/* the answer an older build kept on a slip day: true keep, false start fresh, null not answered */
function rkKeepOf(day){const e=((day&&day.events)||[]).find(x=>x.outcome==='slipped'&&typeof x.keep==='boolean');return e?e.keep:null}
function rkFullDays(days){
 const out={};let last=null;
 allKeys(days).forEach(k=>{if(sumDay(days[k]).slipped>0&&(!last||diffDays(k,last)>=7)){out[k]=1;last=k}});
 return out;
}
/* the run, day by day. A slip ends it. Under the old rule (slips up to countFrom), kind[k] is 'saved' or 'open' for a slip day that was saved
   or can still be, and open is the save still in play, if any. */
function runLedger(days,st,today,mode,noSave){
 mode=mode||st.cleanMode;
 const L={cur:0,longest:0,clean:0,counted:0,saves:0,kind:{},open:null};
 if(!st.day1)return L;
 const canSave=!noSave&&(mode==='strict'||mode==='gentle'),full=canSave?rkFullDays(days):{};
 for(let k=recordFrom(st);k<=today;k=addDays(k,1)){
  let dk=dayKind(k,days[k],st,today,mode,days);
  /* one slip kept a gentle run going until countFrom; since then a slip ends the run in every mode, so the longest run means the same everywhere */
  if(dk==='one'&&st.countFrom&&k>st.countFrom)dk='slip';
  /* a day Daybook does not know about pauses the run: it neither counts nor ends it (away.ts) */
  if(dk==='unknown')continue;
  L.counted++;
  if(dk!=='slip'){L.cur++;L.clean++}
  else{
   let s=null;const run=L.cur;
   if(full[k]&&k>=st.day1&&(!st.countFrom||k<=st.countFrom)&&run>=(k<RUN_ASK_FROM?1:RUN_ASK)&&rkKeepOf(days[k])!==false){
    const r=rkOf(days,k,st),deep=run>=RUN_DEEP,dl=addDays(k,BACK_DAYS);
    const done=!!(r&&r.m3&&r.ev.rk.at<=dl&&((r.m1&&r.m2&&(!deep||r.m4))||(k>=RK_BACK_FROM&&rkThirdOf(days,k,st,today))));
    s=done?'saved':today<=dl?'open':null;
    if(s)L.kind[k]=s;
    if(s==='open')L.open={k,run,deep};
   }
   if(s==='saved'){L.cur++;L.saves++}
   else if(s!=='open'){L.cur=0;L.saves=0;L.open=null}
  }
  if(L.cur>L.longest)L.longest=L.cur;
 }
 return L;
}
/* noSave: count only days with no slip, the way the badges for clear days do */
function streaks(days,st,today,mode,noSave){return runLedger(days,st,today,mode,noSave)}
/* a rough stretch: slips on most days of the last week (the tracking week counts too). This is what switches on the step-down plan, with a kind note. */
function roughPatch(days,st,today){
 if(!st.day1||today<st.day1)return false;
 const from=maxKey(st.start,addDays(today,-6)),n=diffDays(today,from)+1;
 if(n<4)return false;
 let slipDays=0;
 for(let k=from;k<=today;k=addDays(k,1))if(sumDay(days[k]).slipped>0)slipDays++;
 return slipDays>=Math.max(4,Math.ceil(n*.7));
}
function reachedOn(d){return !!(d&&((d.p&&d.p.r)||(d.checkin&&d.checkin.ro==='Y')))}
function computeMetrics(days,st,today){
 const evs=eventsOf(days);
 const rode=evs.filter(e=>e.outcome==='rode').length;
 const slips=evs.filter(e=>e.outcome==='slipped').length;
 const recovered=evs.filter(e=>e.outcome==='slipped'&&e.recovered).length;
 const pauses=evs.filter(e=>e.paused===true).length;
 const urges=rode+slips;
 let checkins=0,reached=0,slipDays=0;
 allKeys(days).forEach(k=>{
  const s=sumDay(days[k]);if(s.checked)checkins++;if(s.slipped)slipDays++;
  if(reachedOn(days[k]))reached++;
 });
 const sk=streaks(days,st,today);
 return {days:Math.max(0,diffDays(today,st.start)+1),checkins,urges,rode,slips,recovered,pauses,pauseRate:urges?pauses/urges:null,
  cleanDays:sk.clean,counted:sk.counted,slipDays,cur:sk.cur,longest:Math.max(sk.longest,(st.seen&&st.seen.longest)||0),reached,
  safety:st.safety.filter(Boolean).length,help:st.help.filter(Boolean).length};
}

/* ---------- weeks ---------- */
function weekOf(key,st){return Math.floor(diffDays(key,st.start)/7)}
function weekRange(k,st){const lo=addDays(st.start,7*k);return [lo,addDays(lo,6)]}
function weekStats(days,st,k){
 const r=weekRange(k,st),lo=r[0],hi=r[1];
 let checkins=0,events=0,rode=0,slipped=0,slipDays=0;
 const sums={m:[0,0],c:[0,0],e:[0,0],s:[0,0]};
 const evs=[];
 for(let key=lo;key<=hi;key=addDays(key,1)){
  const d=days[key];if(!d)continue;
  const s=sumDay(d);if(s.checked)checkins++;events+=s.n;rode+=s.rode;slipped+=s.slipped;if(s.slipped)slipDays++;
  (d.events||[]).forEach(e=>evs.push(Object.assign({key},e)));
  const c=d.checkin;
  if(c)['m','c','e','s'].forEach(f=>{if(typeof c[f]==='number'){sums[f][0]+=c[f];sums[f][1]++}});
 }
 const avg=f=>sums[f][1]?sums[f][0]/sums[f][1]:null;
 return {k,lo,hi,checkins,events,rode,slipped,slipDays,m:avg('m'),c:avg('c'),e:avg('e'),s:avg('s'),evs};
}

/* ===== STEP DOWN: the plan for when slips happen most days. Instead of a run of clean days that breaks every day or two, the person aims for
   longer stretches between slips (counted in hours while they are short, in days once they are long) and fewer slips each week.
   Everything here is worked out from the log. ===== */
const STEP_RUNGS=[24,36,48,72,120,168];
/* when an entry happened. The day key is the logical day, so a 1 AM entry (before the new-day hour) is on the next calendar day.
   An entry with no time is placed at noon of its day. */
function evMs(key,time,roll){
 const a=key.split('-').map(Number);
 if(!isTime(time))return new Date(a[0],a[1]-1,a[2],12,0).getTime();
 const h=+time.slice(0,2),m=+time.slice(3,5);
 return new Date(a[0],a[1]-1,a[2]+(h<roll?1:0),h,m).getTime();
}
function slipMoments(days,st,upTo){
 const roll=st.rollover,out=[];
 allKeys(days).forEach(k=>(days[k].events||[]).forEach(e=>{if(e.outcome==='slipped')out.push(Math.min(evMs(k,e.time,roll),upTo||Infinity))}));
 return out.sort((a,b)=>a-b);
}
/* a stretch in the words that make it feel biggest: hours while it is short, days once it passes three days */
function fmtStretch(h){
 if(h<1)return 'under an hour';
 if(h<72){const n=Math.floor(h);return n+(n===1?' hour':' hours')}
 const d=Math.floor(h/24);return d+(d===1?' day':' days');
}
const fmtStretchShort=h=>h<1?'0 h':h<72?Math.floor(h)+' h':Math.floor(h/24)+' d';
/* the true record (truth.ts): a night nobody told Daybook about is not known, so the hours of a stretch never run through one.
   From its evening (6 PM) to the new day it neither counts nor ends the stretch: the stretch waits. Empty before truthFrom. */
function untoldWins(days,st,tk){const roll=st.rollover;return stretchBreaks(days,st,tk).map(b=>[evMs(b.k,b.whole?p2(roll)+':00':'18:00',roll),evMs(addDays(b.k,1),p2(roll)+':00',roll)])}
function toldMs(a,b,w){let t=b-a;w.forEach(x=>{const lo=Math.max(a,x[0]),hi=Math.min(b,x[1]);if(hi>lo)t-=hi-lo});return Math.max(0,t)}
/* the longest part of a stretch with no night not told inside it: what a best or a badge can be earned on */
function toldSpan(a,b,w){let best=0,from=a;w.filter(x=>x[1]>a&&x[0]<b).sort((x,y)=>x[0]-y[0]).forEach(x=>{best=Math.max(best,Math.min(x[0],b)-from);from=Math.max(from,x[1])});return Math.max(0,best,b-from)}
/* a week's slips with the ones an answer about nights not told or days away carries (they have no entry) */
function slipsInWeekAll(days,st,w,tk){const r=weekRange(w,st);let n=slipsInWeek(days,st,w);for(let k=r[0];k<=r[1];k=addDays(k,1))if(!sumDay(days[k]).slipped&&awaySlipDay(days,st,k,tk))n++;return n}
function weekUntold(days,st,w,tk){const r=weekRange(w,st);for(let k=r[0];k<=r[1];k=addDays(k,1))if(dayUntold(days,st,k,tk))return true;return false}
function slipsInWeek(days,st,w){const r=weekRange(w,st);let n=0;for(let k=r[0];k<=r[1];k=addDays(k,1))n+=sumDay(days[k]).slipped;return n}
function stepView(days,st,nowMs){
 const roll=st.rollover,tk=logicalKey(nowMs,roll),sl=slipMoments(days,st,nowMs);
 const stepAt=st.stepAt||st.day1||st.start,stepMs=evMs(stepAt,p2(roll)+':00',roll),startMs=evMs(st.start,p2(roll)+':00',roll);
 const last=sl.length?sl[sl.length-1]:null;
 /* after days Daybook does not know about (away.ts), the stretch it can vouch for starts when the person came back; the best
    stretch already shown stays as it is */
 const af=awayStretchFrom(days,st,tk),ukEnd=af?evMs(af,p2(roll)+':00',roll):-Infinity,uw=untoldWins(days,st,tk);
 const curH=toldMs(Math.max(last!=null?last:startMs,ukEnd),nowMs,uw)/36e5;
 let bestPast=0,bestSince=0;const recent=[];
 for(let i=1;i<sl.length;i++){
  const g=toldSpan(sl[i-1],sl[i],uw)/36e5;
  if(g>bestPast)bestPast=g;
  if(sl[i]>stepMs)bestSince=Math.max(bestSince,toldSpan(Math.max(sl[i-1],stepMs),sl[i],uw)/36e5);
  if(sl[i]>=nowMs-30*864e5)recent.push(g);
 }
 bestSince=Math.max(bestSince,toldSpan(Math.max(last!=null?last:stepMs,stepMs),nowMs,uw)/36e5);
 const best=Math.max(bestPast,curH);
 recent.sort((a,b)=>a-b);
 const usual=recent.length>=3?recent[Math.floor(recent.length/2)]:null;
 /* the goal for the bar: beat your best, and once you have, the next step on the ladder */
 const goal=bestPast>curH?bestPast:(STEP_RUNGS.find(r=>r>curH)||Math.ceil((curH+24)/24)*24);
 const cw=weekOf(tk,st),thisW=slipsInWeek(days,st,cw),lastW=cw>0?slipsInWeek(days,st,cw-1):null;
 const target=lastW==null?null:Math.max(0,lastW-1);
 const wr=weekRange(cw,st);let wSl=0,wWait=0;
 for(let k=wr[0];k<=wr[1];k=addDays(k,1))((days[k]||{}).events||[]).forEach(e=>{if(e.outcome==='slipped'){wSl++;if(e.wt>=5)wWait++}});
 /* the hard hours: the two hours with the most slips in the last 30 days, once there are three slips with a time */
 const tsl=eventsOf(days,addDays(tk,-29)).filter(e=>e.outcome==='slipped'&&e.time);
 const win=tsl.length>=3?busiestWindow(tsl,roll):null;
 let hh=null;
 if(win){
  const winOf=k=>{const a=evMs(k,p2(win.start)+':00',roll);return [a,a+2*36e5]};
  const hit=(a,b)=>sl.some(t=>t>=a&&t<b);
  const w=winOf(tk),state=nowMs<w[0]?'before':nowMs<w[1]?'during':hit(w[0],w[1])?'lost':'won';
  let won=0;
  for(let k=maxKey(stepAt,addDays(tk,-29));k<=tk;k=addDays(k,1)){const x=winOf(k);if(x[1]<=nowMs&&!hit(x[0],x[1]))won++}
  hh={label:win.label,state,won};
 }
 /* ready to count days: a stretch of a week since the plan started, or a whole week since then with one slip or none */
 let weekOk=false;
 for(let w=0;w<cw;w++){if(weekRange(w,st)[0]>=stepAt&&slipsInWeekAll(days,st,w,tk)<=1&&!weekUntold(days,st,w,tk)){weekOk=true;break}}
 const ready=bestSince>=168||weekOk;
 /* more help: the setup self-check pointed that way, or three weeks in, this week is no better than the first one */
 const hist=st.onb&&st.onb.hist,score=hist&&hist.length?hist[hist.length-1].s:null;
 const stuck=diffDays(tk,stepAt)>=21&&thisW>=slipsInWeek(days,st,weekOf(stepAt,st));
 return {tk,curH,best,bestPast,bestSince,usual,goal,slips:sl.length,cw,thisW,lastW,target,wSl,wWait,hh,ready,help:(score!=null&&score>=6)||stuck};
}

/* ---------- patterns and distributions ---------- */
const PATTERN_ROWS=[['Motivation (0-10)','m','avg'],['Connection (0-10)','c','avg'],['Energy (0-10)','e','avg'],['Stress (0-10)','s','avg'],['Sleep the night before (hours)','h','avg'],['Screens off on time that night','so','pct'],['Reached out to someone','ro','pct']];
function patterns(days){
 const clean=[],slip=[];
 allKeys(days).forEach(k=>{const d=days[k],s=sumDay(d);if(s.slipped)slip.push(d);else if(s.checked)clean.push(d)});
 const avg=(arr,f)=>{const v=arr.map(d=>d.checkin&&d.checkin[f]).filter(x=>typeof x==='number');return v.length?v.reduce((a,b)=>a+b,0)/v.length:null};
 const pct=(arr,f)=>{let y=0,n=0;arr.forEach(d=>{const v=f==='ro'?(reachedOn(d)?'Y':(d.checkin&&d.checkin.ro)):(d.checkin&&d.checkin[f]);if(v==='Y')y++;else if(v==='N')n++});return y+n?y/(y+n):null};
 const rows=PATTERN_ROWS.map(r=>{
  const a=r[2]==='avg'?avg(clean,r[1]):pct(clean,r[1]);
  const b=r[2]==='avg'?avg(slip,r[1]):pct(slip,r[1]);
  return {label:r[0],kind:r[2],clean:a,slip:b,gap:(a!=null&&b!=null)?b-a:null};
 });
 return {cleanN:clean.length,slipN:slip.length,rows};
}
function hourBins(evs,roll){
 const bins=Array.from({length:24},(_,i)=>({h:(roll+i)%24,rode:0,slipped:0}));
 evs.forEach(e=>{if(!e.time)return;const h=+e.time.slice(0,2);bins[(h-roll+24)%24][e.outcome==='rode'?'rode':'slipped']++});
 return bins;
}
function triggerCounts(evs,opts){
 const rows=TRIGGERS.map(t=>({k:t[0],t:t[1],rode:0,slipped:0}));
 ((opts&&opts.trig)||[]).forEach(o=>rows.push({k:o.id,t:o.t,rode:0,slipped:0}));
 let none={k:'none',t:'No reason picked',rode:0,slipped:0};
 evs.forEach(e=>{const r=rows.find(x=>x.k===e.trigger)||none;r[e.outcome==='rode'?'rode':'slipped']++});
 const out=rows.concat(none).filter(r=>r.rode+r.slipped>0);
 out.sort((a,b)=>(b.rode+b.slipped)-(a.rode+a.slipped));
 return out;
}
function perDayCounts(days,keys){return keys.map(k=>{const s=sumDay(days[k]);return {key:k,rode:s.rode,slipped:s.slipped}})}
function timesPerDay(days,keys){
 const out=[0,0,0,0];let logged=0;
 keys.forEach(k=>{const s=sumDay(days[k]);if(!s.n&&!s.checked)return;logged++;out[Math.min(3,s.n)]++});
 return {counts:out,logged};
}
function topTrigger(evs,opts){
 const c={};evs.forEach(e=>{if(e.trigger&&trigText(e.trigger,opts))c[e.trigger]=(c[e.trigger]||0)+1});
 let best=null;Object.keys(c).forEach(k=>{if(!best||c[k]>c[best])best=k});
 return best?{k:best,t:trigText(best,opts),n:c[best]}:null;
}
function busiestWindow(evs,roll){
 const timed=evs.filter(e=>e.time);
 if(timed.length<3)return null;
 const counts=Array(24).fill(0);timed.forEach(e=>counts[+e.time.slice(0,2)]++);
 let best=-1,start=0;
 for(let i=0;i<23;i++){const h=(roll+i)%24,h2=(h+1)%24,s=counts[h]+counts[h2];if(s>best){best=s;start=h}}
 return {start,end:(start+2)%24,n:best,total:timed.length,label:fmtHour(start)+' to '+fmtHour((start+2)%24)};
}
function rangeKeys(range,st,today,days){
 let first=st.start;const ks=allKeys(days);if(ks.length&&ks[0]<first)first=ks[0];
 let lo=first;
 if(range==='7')lo=maxKey(first,addDays(today,-6));
 else if(range==='30')lo=maxKey(first,addDays(today,-29));
 else lo=maxKey(first,addDays(today,-89));
 const out=[];for(let k=lo;k<=today;k=addDays(k,1))out.push(k);
 return out.length?out:[today];
}
function rangeStart(range,st,today,days){
 let first=st.start;const ks=allKeys(days);if(ks.length&&ks[0]<first)first=ks[0];
 if(range==='7')return maxKey(first,addDays(today,-6));
 if(range==='30')return maxKey(first,addDays(today,-29));
 return first;
}

/* ---------- export ---------- */
function csvCell(v){
 if(v==null)return '""';
 let s=String(v);
 if(/^[=+\-@\t\r]/.test(s))s="'"+s;
 return '"'+s.replace(/"/g,'""')+'"';
}
function csvRow(a){return a.map(csvCell).join(',')}
function eventsCsv(days,st){
 const rows=[['Date','Phase','Day','Time','Time of day','Outcome','Trigger','Paused 10 min','What I did','Recovered in an hour','SOS: how strong at the start','SOS: minutes','SOS: tools tried, and how it was after each','Stopped partway','Note']];
 allKeys(days).forEach(k=>{
  const ph=phaseOf(k,st);
  sortedEvents(days[k],st.rollover).forEach(e=>{
   rows.push([k,ph.p==='quitting'?'Quitting':ph.p==='tracking'?'Tracking':'Before start',ph.n||'',e.time||'',e.time?BUCKET_T[bucketOf(e.time)]:'',
    e.outcome==='rode'?'Rode it out':'Slipped',trigText(e.trigger,st.opts),e.paused===true?'Y':e.paused===false?'N':'',didIds(e.did).map(x=>didText(x,st.opts)).join('; '),
    e.outcome==='slipped'?(e.recovered?'Y':''):''].concat(urCsv(e),[e.note||'']));
  });
 });
 return rows.map(csvRow).join('\r\n')+'\r\n';
}
function daysCsv(days,st,today){
 const rows=[['Date','Phase','Day','Entries','Rode it out','Slipped','Entry times','Mood','Urges','Motivation','Connection','Energy','Stress','Sleep the night before (hours)','Screens off on time that night','Reached out','Calm moves','Wind-down done','Check-in saved','Note']];
 const ks=allKeys(days);let lo=st.start;if(ks.length&&ks[0]<lo)lo=ks[0];
 for(let k=lo;k<=today;k=addDays(k,1)){
  const d=days[k],ph=phaseOf(k,st),s=sumDay(d),c=(d&&d.checkin)||{},p=(d&&d.p)||null;
  rows.push([k,ph.p==='quitting'?'Quitting':ph.p==='tracking'?'Tracking':'Before start',ph.n||'',s.n,s.rode,s.slipped,
   sortedEvents(d,st.rollover).map(e=>e.time||'?').join('; '),
   c.md==null?'':c.md,c.u==null?'':c.u,c.m==null?'':c.m,c.c==null?'':c.c,c.e==null?'':c.e,c.s==null?'':c.s,c.h==null?'':c.h,c.so||'',reachedOn(d)?'Y':(c.ro||''),p&&p.c?p.c:'',p&&p.wd?'Y':'',s.checked?'Y':'',c.n||'']);
 }
 return rows.map(csvRow).join('\r\n')+'\r\n';
}
/* ===== GAME: points, levels, wins, badges, quests, the day's rhythm. Everything is worked out from the log, nothing extra is stored. =====
   Rules I keep: honesty and coping moves earn points, a slip never subtracts anything, and no level or badge is ever taken away. */
/* The ladder (60 levels in 12 forms of the flame spirit), levelOf and nextLine are in levels.ts. */
const SETUP_PTS=20; /* finishing the setup, once: a head start, so the first level is already close */
const WIDGET_PTS=30; /* the flame put on the Home Screen or the Lock Screen, once (flame-widget.ts); kept for good once earned */

/* the daily wins, in the order of a typical day. Each one can be switched off in Settings or for a single day (see ROUTINE). */
const WINS=[
 {k:'morning',name:'Last night',tip:'Answer the morning questions',ic:'sunrise'},
 {k:'lesson',name:'Lesson',tip:'Read one short lesson',ic:'book'},
 {k:'calm',name:'Calm move',tip:'Finish a tool or a pause',ic:'leaf'},
 {k:'reach',name:'Reached out',tip:'Text, call, or talk to someone',ic:'chat'},
 {k:'checkin',name:'Check-in',tip:'Save the evening check-in',ic:'check'},
 {k:'wind',name:'Wind-down',tip:"Finish tonight's wind-down",ic:'moon'}
];
function morningInfo(days,st,key){
 const prev=addDays(key,-1);
 if(prev<st.start)return {applies:false,prev,so:null,h:null,done:false,m:false,po:null};
 const pd=days[prev],td=days[key];
 const so=pd&&pd.checkin?pd.checkin.so:null,h=td&&td.checkin?td.checkin.h:null;
 const m=!!(td&&td.p&&td.p.m),done=m||(so!=null&&h!=null);
 return {applies:true,prev,so,h,done,m,po:pd&&pd.p?pd.p.po:null};
}
/* the morning questions were retired on October 23, 2026 (MORNING_END): a day from then on has the win only when its morning
   was answered on a copy of the app that still asks (p.m). Every morning answered before stays won, with its points. */
const MORNING_END='2026-10-24';
function winsOf(days,key,st){
 const d=days[key],c=d&&d.checkin,p=d&&d.p,mi=morningInfo(days,st,key);
 const w={
  checkin:!!(c&&c.done),
  calm:!!((p&&p.c>0)||((d&&d.events)||[]).some(e=>e.outcome==='rode'&&e.paused===true)),
  reach:reachedOn(d),
  wind:!!(p&&p.wd),
  morning:mi.applies&&mi.done&&(key<MORNING_END||!!(p&&p.m)),
  lesson:!!(p&&((p.ls&&p.ls.length)||(p.lv&&p.lv.length)))
 };
 /* na = "not part of this day": switched off and not done. Something done still counts even when it is switched off,
    so turning a part off never takes a win away. */
 const on=k=>routineOn(st,p,k);
 w.na={
  morning:!mi.applies||((key>=MORNING_END||!on('morning'))&&!w.morning),
  lesson:key<LESSON_WIN_FROM||!on('lesson'),
  calm:!on('calm'),reach:!on('reach'),checkin:!on('checkin'),wind:!on('wind')
 };
 Object.keys(w.na).forEach(k=>{if(k!=='morning'&&w[k])w.na[k]=false});
 return w;
}
function winTally(w){let n=0,t=0;WINS.forEach(x=>{if(w.na&&w.na[x.k])return;t++;if(w[x.k])n++});return {n,t}}

/* points for one day */
function dayPoints(days,key,st){
 const d=days[key],parts=[];
 const add=(k,label,pts)=>{if(pts>0)parts.push({k,label,pts})};
 const ev=(d&&d.events)||[],c=d&&d.checkin,p=d&&d.p,w=winsOf(days,key,st);
 add('log','Honest log',Math.min(ev.length,5)*5);
 add('ride','Rode it out',Math.min(ev.filter(e=>e.outcome==='rode').length,6)*10);
 add('pause','Paused first',Math.min(ev.filter(e=>e.outcome==='rode'&&e.paused===true).length,3)*10);
 add('bounce','Quick recovery',Math.min(ev.filter(e=>e.outcome==='slipped'&&e.recovered).length,3)*10);
 add('wait','Waited first',Math.min(ev.filter(e=>e.outcome==='slipped'&&e.wt>=5).length,2)*5);
 add('checkin','Check-in',w.checkin?10:0);
 add('reach','Reached out',w.reach?10:0);
 add('lights','Screens off on time',c&&c.so==='Y'?5:0);
 add('wind','Wind-down',w.wind?10:0);
 add('morning','Morning questions',w.morning?5:0);
 add('calm','Calm moves',Math.min(p?p.c:0,3)*5);
 add('lesson','Lessons',(p&&p.ls?p.ls.length:0)*10);
 add('phone','Phone put away',p&&p.po?5:0);
 add('reread','Read again',Math.min(p&&p.lv?p.lv.length:0,2)*5);
 /* Rekindle, on the day of the slip: the sunrise check the next morning, and a bonus when all three missions are done */
 const rk=rkOf(days,key,st);
 if(rk&&rk.m3){add('sunrise','Sunrise check',15);if(rk.n===3)add('rekindle','Rekindled',20)}
 return {total:parts.reduce((a,b)=>a+b.pts,0),parts};
}
/* ===== REKINDLE: what comes after a slip, worked out from the log like everything else.
   It hangs on the last slip of a day (or the one that already has a sunrise check). Three missions:
   m1 one small thing (the slip's "recovered"), m2 phone away or screens off on time, that night or any night in the BACK_DAYS after it,
   m3 the sunrise check, one morning. They earn points and the Rekindled badge; they no longer keep a run going. ===== */
function rkOf(days,k,st){
 const d=days[k];if(!d||!d.events||!d.events.length)return null;
 const sl=sortedEvents(d,st&&st.rollover!=null?st.rollover:4).filter(e=>e.outcome==='slipped');
 if(!sl.length)return null;
 const ev=sl.find(e=>e.rk)||sl[sl.length-1];
 let m2=false;for(let i=0;i<=BACK_DAYS&&!m2;i++){const x=days[addDays(k,i)];m2=!!(x&&((x.p&&x.p.po)||(x.checkin&&x.checkin.so==='Y')))}
 const m1=sl.some(e=>e.recovered),m3=!!(ev.rk&&ev.rk.at),m4=!!(ev.rk&&ev.rk.dp);
 return {k,ev,m1,m2,m3,m4,n:(m1?1:0)+(m2?1:0)+(m3?1:0)};
}

/* weekly quests: three a week, picked from a pool of six by the week number */
const QUEST_POOL=[
 {key:'reach',name:'Reach out to someone',goal:3,unit:'days',hint:'Text, call, or talk to a person on 3 different days.',calc:g=>g.reach},
 {key:'lights',name:'Screens off on time',goal:4,unit:'nights',hint:'Answer yes to "screens off on time" on 4 nights.',calc:g=>g.lights},
 {key:'calm',name:'Calm moves',goal:5,unit:'moves',hint:'Finish 5 calm moves with the tools in Learn.',calc:g=>g.calm},
 {key:'checkin',name:'Check in',goal:5,unit:'days',hint:'Save the evening check-in on 5 days.',calc:g=>g.checkin},
 {key:'wind',name:'Wind-down',goal:3,unit:'nights',hint:'Finish the wind-down checklist on 3 nights.',calc:g=>g.wind},
 {key:'tools',name:'Try different tools',goal:3,unit:'tools',hint:'Use 3 different tools this week.',calc:g=>g.tools}
];
function weekGame(days,st,k){
 const r=weekRange(k,st),g={reach:0,lights:0,calm:0,checkin:0,wind:0,tools:0},set=new Set();
 for(let key=r[0];key<=r[1];key=addDays(key,1)){
  const d=days[key];if(!d)continue;
  const w=winsOf(days,key,st);
  if(w.reach)g.reach++;
  if(d.checkin&&d.checkin.so==='Y')g.lights++;
  g.calm+=Math.min(d.p?d.p.c:0,3);
  if(w.checkin)g.checkin++;
  if(w.wind)g.wind++;
  if(d.p)d.p.tl.forEach(t=>set.add(t));
 }
 g.tools=set.size;
 return g;
}
/* a quest about something you switched off in the routine is swapped for the next quest that is still on.
   A quest that is already done stays, so nothing earned ever disappears. */
const QUEST_ROUTINE={reach:'reach',calm:'calm',checkin:'checkin',wind:'wind',lights:'morning'};
/* weekly quests were retired on October 19, 2026: a week that starts then or later has none. Every quest finished before
   stays finished, and keeps its points. */
const QUEST_END='2026-10-19';
function questsFor(days,st,k){
 if(weekRange(k,st)[0]>=QUEST_END)return [];
 const g=weekGame(days,st,k),n=QUEST_POOL.length;
 const off=q=>{const r=QUEST_ROUTINE[q.key];return !!r&&!(st.routine&&st.routine[r])};
 const base=[0,2,4].map(i=>(k+i)%n),used=new Set(base);
 return base.map(ix=>{
  let q=QUEST_POOL[ix],now=q.calc(g);
  if(now<q.goal&&off(q)){
   for(let s=1;s<n;s++){
    const j=(ix+s)%n,c=QUEST_POOL[j];
    if(!used.has(j)&&!off(c)){used.add(j);q=c;now=c.calc(g);break}
   }
  }
  return {id:'w'+k+':'+q.key,key:q.key,name:q.name,hint:q.hint,goal:q.goal,unit:q.unit,now:Math.min(now,q.goal),raw:now,done:now>=q.goal,pts:15};
 });
}

/* badges */
const BADGES=[
 {id:'day-zero',name:'Day Zero',desc:'Finish setup and make your plan.',icon:'sun',tone:'sun',goal:1,now:S=>S.setup},
 {id:'first-step',name:'First step',desc:'Log, check in, or try a tool or a lesson.',icon:'flag',tone:'sun',goal:1,now:S=>S.activeDays},
 {id:'honest',name:'Honest log',desc:'Log a slip instead of hiding it. That is the hard part.',icon:'heart',tone:'coral',goal:1,now:S=>S.slips},
 {id:'first-ride',name:'First wave',desc:'Ride out an urge and log it.',icon:'wave',tone:'mint',goal:1,now:S=>S.rode},
 {id:'wave-rider',name:'Ten-minute wave',desc:'Finish a full 10-minute pause.',icon:'timer',tone:'accent',goal:1,now:S=>S.pauses},
 {id:'rides-5',name:'Five waves',desc:'Ride out 5 urges.',icon:'wave',tone:'mint',goal:5,now:S=>S.rode},
 {id:'rides-15',name:'Wave collector',desc:'Ride out 15 urges.',icon:'wave',tone:'mint',goal:15,now:S=>S.rode},
 {id:'rides-40',name:"Surf's up",desc:'Ride out 40 urges.',icon:'crown',tone:'mint',goal:40,now:S=>S.rode},
 {id:'bounce',name:'Bounce back',desc:'Do one small thing within the hour after a slip.',icon:'bolt',tone:'sun',goal:1,now:S=>S.recovered},
 {id:'bounce-5',name:'Bounce-back pro',desc:'Do that 5 times.',icon:'bolt',tone:'sun',goal:5,now:S=>S.recovered},
 {id:'rekindled',name:'Rekindled',desc:'Finish all three Rekindle missions after a slip.',icon:'flame',tone:'sun',goal:1,now:S=>S.rekindled},
 {id:'run-saved',name:'Kept going',desc:'You came back after a slip and your run kept going.',icon:'flame',tone:'coral',goal:1,now:S=>S.saves},
 {id:'stretch-48',name:'48 hours',desc:'Go 48 hours between slips.',icon:'timer',tone:'sky',goal:1,now:S=>S.stretch48},
 {id:'lower-week',name:'A lower week',desc:'Finish a week with fewer slips than the week before.',icon:'chart',tone:'mint',goal:1,now:S=>S.lowerWeeks},
 {id:'stepped-up',name:'Stepped up',desc:'Finish the step-down plan and start counting days.',icon:'crown',tone:'sun',goal:1,now:S=>S.grad},
 {id:'night-owl',name:'Night owl, tamed',desc:'Ride out a late-night urge (10 PM to 4 AM).',icon:'moon',tone:'violet',goal:1,now:S=>S.lateRide},
 {id:'hello',name:'Hello, friend',desc:'Reach out to someone.',icon:'chat',tone:'accent',goal:1,now:S=>S.reachDays},
 {id:'connector',name:'Connector',desc:'Reach out on 5 different days.',icon:'chat',tone:'accent',goal:5,now:S=>S.reachDays},
 {id:'lights-3',name:'Lights out',desc:'Screens off on time, 3 nights.',icon:'plug',tone:'violet',goal:3,now:S=>S.lightsYes},
 {id:'lights-10',name:'Sleep first',desc:'Screens off on time, 10 nights.',icon:'moon',tone:'violet',goal:10,now:S=>S.lightsYes},
 {id:'wind-3',name:'Wind-down pro',desc:'Finish the wind-down on 3 nights.',icon:'leaf',tone:'mint',goal:3,now:S=>S.windDays},
 {id:'wind-10',name:'Calm nights',desc:'Finish the wind-down on 10 nights.',icon:'leaf',tone:'mint',goal:10,now:S=>S.windDays},
 {id:'check-1',name:'Checked in',desc:'Save your first daily check-in.',icon:'check',tone:'accent',goal:1,now:S=>S.checkins},
 {id:'check-7',name:'Full week',desc:'Save 7 check-ins.',icon:'check',tone:'accent',goal:7,now:S=>S.checkins},
 {id:'check-14',name:'Two weeks in',desc:'Save 14 check-ins.',icon:'check',tone:'accent',goal:14,now:S=>S.checkins},
 {id:'check-30',name:'A month of showing up',desc:'Save 30 check-ins.',icon:'crown',tone:'accent',goal:30,now:S=>S.checkins},
 {id:'morning-5',name:'Morning person',desc:'Answer the morning questions 5 times.',icon:'sunrise',tone:'sun',goal:5,now:S=>S.morning},
 {id:'toolbox',name:'Toolbox',desc:'Try 4 different tools.',icon:'sparkle',tone:'violet',goal:4,now:S=>S.tools},
 {id:'reviewer',name:'Looked back',desc:'Write your first weekly review.',icon:'book',tone:'accent',goal:1,now:S=>S.reviews},
 {id:'safety',name:'Safety net',desc:'Finish all 8 safety-net steps.',icon:'shield',tone:'mint',goal:8,now:S=>S.safety},
 {id:'help',name:'Help seeker',desc:'Take one small step toward real help.',icon:'compass',tone:'coral',goal:1,now:S=>S.help},
 {id:'learn-1',name:'First lesson',desc:'Finish a lesson in Learn.',icon:'book',tone:'sky',goal:1,now:S=>S.lessons},
 {id:'learn-6',name:'Six lessons',desc:'Finish 6 lessons.',icon:'compass',tone:'sky',goal:6,now:S=>S.lessons},
 {id:'learn-12',name:'Twelve lessons',desc:'Finish 12 lessons.',icon:'compass',tone:'sky',goal:12,now:S=>S.lessons},
 {id:'learn-18',name:'Eighteen lessons',desc:'Finish 18 lessons.',icon:'book',tone:'sky',goal:18,now:S=>S.lessons},
 {id:'learn-24',name:'Two dozen lessons',desc:'Finish 24 lessons.',icon:'crown',tone:'sky',goal:24,now:S=>S.lessons},
 /* this one was "Every lesson" while there were 32; it stays at 32 so nobody loses it when lessons are added */
 {id:'learn-32',name:'Thirty-two lessons',desc:'Finish 32 lessons.',icon:'crown',tone:'sky',goal:32,now:S=>S.lessons},
 {id:'learn-faith',name:'Faith and work',desc:'Finish the '+FAITH_IDS.length+' faith lessons.',icon:'star',tone:'sun',goal:FAITH_IDS.length,now:S=>S.faithLessons},
 {id:'learn-days-3',name:'Three lesson days',desc:'Read a lesson on 3 different days. They do not have to be in a row.',icon:'book',tone:'sky',goal:3,now:S=>S.lessonDays},
 {id:'learn-days-10',name:'Learning habit',desc:'Read a lesson on 10 different days.',icon:'sparkle',tone:'sky',goal:10,now:S=>S.lessonDays},
 {id:'back',name:'Back again',desc:'Come back after a few days away. Returning is the real skill.',icon:'sun',tone:'sun',goal:1,now:S=>S.comeback?1:0},
 {id:'quest-1',name:'Quest done',desc:'Finish a weekly quest.',icon:'star',tone:'sun',goal:1,now:S=>S.questsDone},
 {id:'quest-3',name:'Quest crusher',desc:'Finish all three quests in one week.',icon:'crown',tone:'sun',goal:1,now:S=>S.fullQuestWeeks},
 {id:'clean-3',name:'Three clear days',desc:'3 days in a row with no slip.',icon:'sun',tone:'sun',goal:3,now:S=>S.longest},
 {id:'clean-7',name:'Seven clear days',desc:'7 days in a row with no slip.',icon:'sun',tone:'sun',goal:7,now:S=>S.longest},
 {id:'clean-14',name:'Fortnight',desc:'14 days in a row with no slip.',icon:'crown',tone:'sun',goal:14,now:S=>S.longest},
 {id:'clean-30',name:'Full month',desc:'30 days in a row with no slip.',icon:'crown',tone:'sun',goal:30,now:S=>S.longest}
];

function totalPoints(days,st,reviews,today){
 let pts=0;const perDay={};
 allKeys(days).forEach(k=>{const v=dayPoints(days,k,st).total;perDay[k]=v;pts+=v});
 const cw=weekOf(today,st);let qd=0;
 for(let k=0;k<=cw;k++)questsFor(days,st,k).forEach(q=>{if(q.done)qd++});
 let rv=0;Object.keys(reviews||{}).forEach(id=>{const r=reviews[id];if(r&&r.a&&Object.keys(r.a).some(f=>r.a[f]&&String(r.a[f]).trim()))rv++});
 /* the steps' deeds, done in real life (steps.ts), counted like the quests and reviews */
 return {pts:pts+qd*15+rv*20+deedCount(st&&st.learn)*DEED_PTS+(st&&st.onb&&st.onb.n>0?SETUP_PTS:0)+(st&&st.widget?WIDGET_PTS:0)+(st&&st.mith?st.mith.pts:0),perDay,quests:qd,reviews:rv};
}
function gameStats(days,st,reviews,today){
 const S={entries:0,rode:0,slips:0,pauses:0,recovered:0,lateRide:0,checkins:0,reachDays:0,lightsYes:0,windDays:0,calm:0,morning:0,tools:0,
  activeDays:0,run:0,comeback:false,rekindled:0,saves:0,stretch48:0,lowerWeeks:0,grad:0,questsDone:0,fullQuestWeeks:0,reviews:0,lessons:0,faithLessons:0,lessonDays:0,
  safety:st.safety.filter(Boolean).length,help:st.help.filter(Boolean).length,longest:0,level:1,setup:(st.onb&&st.onb.n>0)?1:0};
 const set=new Set(),lset=new Set(),act={};let last=null;
 allKeys(days).forEach(k=>{
  const d=days[k],c=d.checkin,p=d.p;
  (d.events||[]).forEach(e=>{
   S.entries++;
   if(e.outcome==='rode'){S.rode++;if(e.paused===true)S.pauses++;if(e.time&&bucketOf(e.time)==='late')S.lateRide++}
   else{S.slips++;if(e.recovered)S.recovered++}
  });
  if(c&&c.done)S.checkins++;
  {const rk=rkOf(days,k,st);if(rk&&rk.n===3)S.rekindled++}
  if(reachedOn(d))S.reachDays++;
  if(c&&c.so==='Y')S.lightsYes++;
  if(winsOf(days,k,st).morning)S.morning++;
  if(p){
   if(p.wd)S.windDays++;
   S.calm+=Math.min(p.c,3);
   p.tl.forEach(t=>set.add(t));
   if(p.tl.includes('pause'))S.pauses++;
   (p.ls||[]).forEach(id=>lset.add(id));
   if((p.ls&&p.ls.length)||(p.lv&&p.lv.length))S.lessonDays++;
  }
  const active=(d.events&&d.events.length)||(c&&c.done)||pActive(p);
  if(active){S.activeDays++;act[k]=1;if(last&&diffDays(k,last)-1>=3)S.comeback=true;last=k}
 });
 S.tools=set.size;S.lessons=lset.size;S.faithLessons=FAITH_IDS.filter(id=>lset.has(id)).length;
 let k=act[today]?today:addDays(today,-1);
 while(act[k]){S.run++;k=addDays(k,-1)}
 const cw=weekOf(today,st);
 for(let w=0;w<=cw;w++){
  const qs=questsFor(days,st,w),n=qs.filter(q=>q.done).length;
  S.questsDone+=n;if(n===qs.length&&n>0)S.fullQuestWeeks++;
 }
 Object.keys(reviews||{}).forEach(id=>{const r=reviews[id];if(r&&r.a&&Object.keys(r.a).some(f=>r.a[f]&&String(r.a[f]).trim()))S.reviews++});
 S.longest=streaks(days,st,today,'strict',true).longest; /* badges for clear days always use strict counting, with no saves */
 /* the comeback badges: runs saved, a 48-hour stretch between slips (once a slip is logged), a week lower than the one before, the step-down plan finished */
 {const L=runLedger(days,st,today);S.saves=Object.keys(L.kind).filter(k=>L.kind[k]==='saved').length}
 {
  /* never earned across nights not told (truth.ts): the hours through one do not count, and a lower week has every night told */
  const now=Date.now(),sl=slipMoments(days,st,now),uw=untoldWins(days,st,today);
  for(let i=1;i<sl.length&&!S.stretch48;i++)if(toldSpan(sl[i-1],sl[i],uw)>=48*36e5)S.stretch48=1;
  if(sl.length&&toldSpan(sl[sl.length-1],now,uw)>=48*36e5)S.stretch48=1;
  for(let w=1;w<cw;w++){const a=slipsInWeekAll(days,st,w-1,today);if(a>=1&&slipsInWeekAll(days,st,w,today)<a&&!weekUntold(days,st,w,today))S.lowerWeeks++}
  S.grad=st.stepGrad?1:0;
 }
 return S;
}
function gameCompute(days,st,reviews,today){
 const tot=totalPoints(days,st,reviews,today),S=gameStats(days,st,reviews,today);
 /* a level you reached is yours to keep: fixing an old answer or deleting a mistaken entry can lower the raw points,
    but never below the floor of the highest level already seen */
 const floor=st.seen?Math.max(LEVELS[Math.max(1,Math.min(LEVELS.length,st.seen.level))-1][0],st.seen.pts||0):0;
 const pts=Math.max(tot.pts,floor),lvl=levelOf(pts);
 S.level=lvl.n;
 const badges=BADGES.map(b=>{const raw=b.now(S);return {id:b.id,name:b.name,desc:b.desc,icon:b.icon,tone:b.tone,goal:b.goal,now:Math.min(raw,b.goal),done:raw>=b.goal}});
 const cw=weekOf(today,st),quests=cw>=0?questsFor(days,st,cw):[];
 const wins=winsOf(days,today,st);
 return {pts,rawPts:tot.pts,perDay:tot.perDay,level:lvl,badges,quests,wins,tally:winTally(wins),todayPts:dayPoints(days,today,st),S,week:cw};
}

/* the day's rhythm: when each part of the daily routine belongs */
function rhythm(days,st,tk,nowMs){
 const d=new Date(nowMs),nowMin=d.getHours()*60+d.getMinutes(),roll=st.rollover*60;
 const rel=m=>(((m-roll)%1440)+1440)%1440;
 const offMin=minOf(st.screensOff),windMin=(offMin-60+1440)%1440;
 const mi=morningInfo(days,st,tk),day=days[tk],dp=day&&day.p;
 const stops=[];
 /* a part of the routine that is switched off for today has no stop, unless it was already done */
 const show=(k,done)=>done||routineOn(st,dp,k);
 const lessonDone=!!(dp&&((dp.ls&&dp.ls.length)||(dp.lv&&dp.lv.length)));
 if(tk>=LESSON_WIN_FROM&&show('lesson',lessonDone))stops.push({k:'lesson',start:9*60,done:lessonDone,title:'Lesson',when:'Daytime'});
 const ciDone=!!(day&&day.checkin&&day.checkin.done),windDone=!!(dp&&(dp.wd||dp.po));
 if(show('checkin',ciDone))stops.push({k:'evening',start:18*60,done:ciDone,title:'Check-in',when:'Evening'});
 if(show('wind',windDone))stops.push({k:'night',start:windMin,done:windDone,title:'Wind-down',when:'Night'});
 const nr=rel(nowMin);
 stops.forEach(s=>{s.startRel=rel(s.start);s.started=nr>=s.startRel});
 let cur=null;
 stops.forEach(s=>{if(s.started&&!s.done)cur=s.k});
 if(!cur){const n=stops.find(s=>!s.started&&!s.done);if(n)cur=n.k}
 stops.forEach(s=>{s.state=s.done?'done':s.k===cur?(s.started?'now':'next'):(s.started?'due':'later')});
 const leftToOff=rel(offMin)-nr;
 return {stops,cur,windMin,offMin,leftToOff,mi};
}
function minToClock(m){return fmtClock(p2(Math.floor(m/60)%24)+':'+p2(m%60))}

/* one short, kind line per day, the same all day */
const NOTES=[
 'A slip is data, not a verdict.','You do not need to feel motivated. Take one small step.','Urges are waves. They rise, peak, and fall.',
 'Honesty beats perfection. Every time.',"Today's job: notice. That is it.",'Small and boring wins. That is how this works.',
 'Be kind to the version of you at 11 PM.','Coming back is the skill. You can do it as many times as it takes.','Rest counts. Sleep is part of the plan.',
 'Reaching out is strength, not weakness.','You already did the hard part: you showed up.','Progress is a bunch of small returns, not a straight line.',
 'One calm minute is a real win.','The goal is not to never feel the urge. It is to know what to do with it.','Shame loves secrets. Honesty takes its power away.',
 'Your future self is rooting for you.','Make the next hour a good one. That is all.','Tired and lonely are not emergencies. They are signals.',
 'Be curious, not harsh: what was I really needing?','You are more than a habit.','Honest hard days build trust with yourself, too.',
 'A short pause is bigger than it looks.','Move your body, change your state.','Phone in another room: tonight is half solved already.',
 'You can do hard things for ten minutes.','It is okay to want to be loved. It is okay to learn how.','Tell one person today. It lightens the load.','Another day to practice.'
];
function dailyNote(key){let h=0;for(let i=0;i<key.length;i++)h=(h*31+key.charCodeAt(i))>>>0;return NOTES[h%NOTES.length]}

/* ------------------------------------------------------------------------------------------------
   emblem: the flame spirit, drawn as an SVG string
   ------------------------------------------------------------------------------------------------ */
/* ===== EMBLEM: the flame spirit. 30 levels = 10 forms x 3 steps of growth.
   It starts as one tiny spark in a night sky, becomes a flame, a campfire, a torch, a beacon, a lighthouse, then the sun comes up
   and it ends as a full sun. The same friendly face is there the whole way. It never wilts and it never goes backwards. ===== */
const Em=(()=>{
 let seq=0;
 const f=v=>String(Math.round(v*10)/10);
 const INK='#2A2350';
 /* a level on the 60-level ladder (levels.ts): 12 forms of 5 steps. Each scene was drawn for 3 steps (t = 0, 1, 2); the 5 steps
    sit at t = 0, 0.5, 1, 1.5, 2, so sizes grow a little at every step, and steps 2 and 4 (st 1 and 3) add a small touch of
    their own. Steps 1, 3 and 5 are exactly the drawings the 30-level ladder had. */
 const clampL=n=>Math.max(1,Math.min(60,Math.round(n)||1));
 const stage=n=>Math.floor((clampL(n)-1)/5);
 const step=n=>(clampL(n)-1)%5;
 const tier=n=>step(n)/2;
 /* a value from a list of three (one per old step) or five, at a step that may fall between two */
 const P=(a,t)=>{if(a.length===5)return a[Math.round(t*2)];const i=Math.floor(t),k=t-i;return k?a[i]+(a[Math.min(i+1,a.length-1)]-a[i])*k:a[i]};
 const STARS=[[20,24,1.3,0],[38,14,1,1.1],[80,18,1.4,.5],[96,32,1,1.7],[28,42,.9,2.2],[106,56,1.1,.8],[14,60,1,1.4],[64,10,.9,2.6],[50,30,.8,.3],[90,46,.8,1.9],[22,76,.9,.6],[102,78,.9,2.4]];
 const stars=(n,op)=>STARS.slice(0,n).map(s=>`<circle class="em-tw" cx="${s[0]}" cy="${s[1]}" r="${s[2]}" fill="#fff" opacity="${op||1}" style="animation-delay:${s[3]}s"/>`).join('');

 /* the face is the through-line: the same two eyes and smile from the first spark to the full sun */
 function face(cx,cy,s,o){
  o=o||{};
  const ink=o.ink||INK,sw=Math.max(1.1,3.2*s),ex=8.5*s,ey=cy-4*s,rx=Math.max(.9,2.7*s),ry=Math.max(1.2,3.5*s);
  let h=`<g class="sn-eyes" fill="${ink}"><ellipse cx="${f(cx-ex)}" cy="${f(ey)}" rx="${f(rx)}" ry="${f(ry)}"/><ellipse cx="${f(cx+ex)}" cy="${f(ey)}" rx="${f(rx)}" ry="${f(ry)}"/></g>`;
  h+=`<path d="M${f(cx-10*s)} ${f(cy+5*s)}Q${f(cx)} ${f(cy+15.5*s)} ${f(cx+10*s)} ${f(cy+5*s)}" fill="none" stroke="${ink}" stroke-width="${f(sw)}" stroke-linecap="round"/>`;
  if(s>=.42&&!o.nocheek)h+=`<circle cx="${f(cx-15.5*s)}" cy="${f(cy+5.5*s)}" r="${f(4.4*s)}" fill="#FF7A66" opacity=".5"/><circle cx="${f(cx+15.5*s)}" cy="${f(cy+5.5*s)}" r="${f(4.4*s)}" fill="#FF7A66" opacity=".5"/>`;
  return h;
 }
 /* a rounded drop: base-centre (cx,by), width w, height h */
 function dropD(cx,by,w,h,lean){
  const hw=w/2,tx=cx+lean*w,ty=by-h,k=lean*w*.4;
  return `M${f(tx)} ${f(ty)}C${f(cx+hw*.1+k)} ${f(by-h*.7)} ${f(cx+hw)} ${f(by-h*.5)} ${f(cx+hw)} ${f(by-h*.3)}C${f(cx+hw)} ${f(by-h*.1)} ${f(cx+hw*.55)} ${f(by)} ${f(cx)} ${f(by)}C${f(cx-hw*.55)} ${f(by)} ${f(cx-hw)} ${f(by-h*.1)} ${f(cx-hw)} ${f(by-h*.3)}C${f(cx-hw)} ${f(by-h*.5)} ${f(cx-hw*.1+k)} ${f(by-h*.7)} ${f(tx)} ${f(ty)}Z`;
 }
 function flame(id,cx,by,w,h,o){
  o=o||{};const lean=o.lean==null?.06:o.lean;
  let g=`<g class="em-flame" style="animation-delay:${o.delay||0}s"><path d="${dropD(cx,by,w,h,lean)}" fill="url(#${id}fo)"/>`;
  if(h>=34&&o.inner!==false)g+=`<path class="em-inner" d="${dropD(cx,by-h*.03,w*.6,h*.58,lean*.5)}" fill="url(#${id}fi)"/>`;
  return g+'</g>';
 }
 const glow=(id,cx,cy,r,ry)=>ry?`<ellipse class="sn-glow" cx="${cx}" cy="${cy}" rx="${r}" ry="${ry}" fill="url(#${id}go)"/>`:`<circle class="sn-glow" cx="${cx}" cy="${cy}" r="${r}" fill="url(#${id}go)"/>`;
 const sparks=list=>list.map(s=>`<circle class="em-up" cx="${s[0]}" cy="${s[1]}" r="${s[2]}" fill="#FFE27A" style="animation-delay:${s[3]}s;animation-duration:${s[4]||3}s"/>`).join('');
 const hill=(y,col,a,sh)=>`<path d="M-2 ${y}C${24+(sh||0)} ${y-a} ${46+(sh||0)} ${y+a*.3} ${70+(sh||0)} ${y-a*.6}S${104+(sh||0)} ${y-a*.9} 122 ${y}V122H-2Z" fill="${col}"/>`;
 const line=(x1,y1,x2,y2,w,col)=>`<path d="M${x1} ${y1}L${x2} ${y2}" stroke="${col}" stroke-width="${w}" stroke-linecap="round" fill="none"/>`;
 const twig=(x1,y1,x2,y2)=>line(x1,y1,x2,y2,3.6,'#8A5A3C')+line(x1,y1-.9,x2,y2-.9,1.1,'#C08A5C');
 const log=(x1,y1,x2,y2)=>line(x1,y1,x2,y2,9,'#7A4A32')+line(x1+1,y1-2.6,x2-1,y2-2.6,2.4,'#A9704A')+`<circle cx="${x2}" cy="${y2}" r="4.5" fill="#C48A5C"/><circle cx="${x2}" cy="${y2}" r="2.1" fill="none" stroke="#7A4A32" stroke-width="1.1"/>`;
 const stone=(x,y,rx,ry,c)=>`<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${c||'#8C84BC'}"/><ellipse cx="${x-rx*.25}" cy="${y-ry*.3}" rx="${rx*.5}" ry="${ry*.35}" fill="#B6AFDA" opacity=".6"/>`;
 const cloud=(x,y,s,col,op,d)=>`<g class="em-cloud" style="animation-delay:${d||0}s"><g transform="translate(${x} ${y}) scale(${s})" fill="${col}" opacity="${op==null?1:op}"><ellipse cx="0" cy="0" rx="13" ry="5.2"/><circle cx="-5.5" cy="-3.6" r="5.2"/><circle cx="3" cy="-5.8" r="6.8"/></g></g>`;
 const bird=(x,y,s)=>`<path class="em-bird" d="M${x} ${y}q${2.6*s} ${-3.2*s} ${5.2*s} 0q${2.6*s} ${-3.2*s} ${5.2*s} 0" stroke="${INK}" stroke-width="1.3" stroke-linecap="round" fill="none"/>`;
 function rays(cx,cy,r0,len,n,w,col,o){
  o=o||{};let h='';
  for(let i=0;i<n;i++){
   const a=o.arc?(o.a0+(o.a1-o.a0)*(n===1?.5:i/(n-1))):(i/n*Math.PI*2-Math.PI/2);
   const l=o.alt&&i%2?len*.6:len;
   h+=`<line x1="${f(cx+Math.cos(a)*r0)}" y1="${f(cy+Math.sin(a)*r0)}" x2="${f(cx+Math.cos(a)*(r0+l))}" y2="${f(cy+Math.sin(a)*(r0+l))}"/>`;
  }
  const sty=o.arc?'':` style="transform-box:view-box;transform-origin:${cx}px ${cy}px"`;
  return `<g class="${o.cls||'sn-rays'}"${sty} stroke="${col}" stroke-width="${w}" stroke-linecap="round" fill="none">${h}</g>`;
 }
 const sparkle=(x,y,r,c,d)=>`<path class="em-twk" d="M${x} ${y-r}Q${x} ${y} ${x+r} ${y}Q${x} ${y} ${x} ${y+r}Q${x} ${y} ${x-r} ${y}Q${x} ${y} ${x} ${y-r}Z" fill="${c||'#FFF6C8'}" style="animation-delay:${d||0}s"/>`;
 /* the sun itself (stages 7 to 10) */
 function sunCore(id,cx,cy,r,s){
  return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#${id}c)" stroke="#F2A02A" stroke-width="1" stroke-opacity=".55"/>`+face(cx,cy-r*.04,s);
 }

 /* ---------- the twelve forms (the last two came with the 60-level ladder) ---------- */
 const SCENES=[
  /* 1 Spark: one small light in a night sky */
  (id,t,st)=>{
   const cy=P([58,56,54],t),r=P([7,9.5,12],t),s=P([.3,.38,.46],t);
   let h=stars(12)+hill(106,'#0C0828',8);
   h+=glow(id,60,cy,P([24,32,40],t));
   if(t>=1){const L=P([0,17,24],t);h+=`<path class="em-twk" d="M60 ${cy-L}V${cy-r-3}M60 ${cy+r+3}V${cy+L}M${60-L} ${cy}H${60-r-3}M${60+r+3} ${cy}H${60+L}" stroke="#FFF3B0" stroke-width="1.5" stroke-linecap="round" fill="none"/>`}
   if(t>=2)h+=sparks([[49,cy+9,1.4,0,2.8],[72,cy+5,1.2,.9,3.2],[58,cy+15,1.1,1.6,2.6]]);
   h+=`<g class="em-fig em-bob"><circle cx="60" cy="${cy}" r="${r}" fill="url(#${id}c)"/>${face(60,cy-.4,s)}</g>`;
   if(st===1)h+=`<circle cx="60" cy="${f(cy)}" r="${f(r+7)}" fill="none" stroke="#FFE27A" stroke-opacity=".55" stroke-width="1.6"/>`;
   if(st===3)h+=`<g class="em-bob"><circle cx="80" cy="${f(cy-13)}" r="4.2" fill="url(#${id}c)"/></g>`;
   return {sky:['#15103C','#281F66','#3A2C86'],layers:h};
  },
  /* 2 Kindling: a few twigs and the first small flame */
  (id,t,st)=>{
   const by=92,fw=P([18,24,30],t),fh=P([26,35,45],t),s=P([.34,.44,.56],t);
   let h=stars(11)+hill(101,'#0C0828',6);
   h+=glow(id,60,by-4,P([28,36,44],t),P([18,24,30],t));
   h+=twig(44,98,75,89)+twig(47,89,79,98);
   if(t>=2)h+=twig(51,96,58,75)+twig(69,96,62,75);
   h+=`<g class="em-fig">${flame(id,60,by,fw,fh,{delay:.2})}${face(60,by-fh*.4,s)}</g>`;
   if(t>=1)h+=twig(41,95,81,95);
   if(t>=1)h+=sparks([[55,by-fh,1.2,0,2.8]]);
   if(t>=2)h+=sparks([[66,by-fh-4,1.3,1,3.2],[60,by-fh-10,1,1.8,3.6]]);
   if(st===1)h+=`<circle cx="47" cy="96" r="1.6" fill="#FF8A3A"/><circle cx="74" cy="91.5" r="1.5" fill="#FF8A3A"/><circle cx="52" cy="90.6" r="1.3" fill="#FFB347"/>`;
   if(st===3)h+=`<ellipse cx="60" cy="100" rx="36" ry="6" fill="#FF8A3A" opacity=".28"/>`;
   return {sky:['#17113F','#2B2169','#3E2D88'],layers:h};
  },
  /* 3 Campfire: logs, stones, a steady flame, sparks */
  (id,t,st)=>{
   const by=94,fw=P([32,38,44],t),fh=P([44,52,60],t),s=P([.58,.7,.82],t);
   let h=stars(10)+hill(103,'#0F0A30',6);
   h+=glow(id,60,by-6,P([38,46,54],t),P([24,30,36],t));
   if(t>=2)h+=`<g class="em-flame" style="animation-delay:.5s"><path d="${dropD(44,96,13,22,-.1)}" fill="url(#${id}fo)"/><path d="${dropD(76,96,13,22,.1)}" fill="url(#${id}fo)"/></g>`;
   h+=log(35,101,82,92)+log(85,101,38,92);
   if(st===1)h+=`<g class="em-flame" style="animation-delay:.7s"><path d="${dropD(78,95,10,15,.25)}" fill="url(#${id}fo)"/></g>`;
   if(st===3)h+=`<ellipse cx="60" cy="105" rx="48" ry="7" fill="#FFB347" opacity=".24"/>`;
   h+=`<g class="em-fig">${flame(id,60,by,fw,fh,{delay:.1})}${face(60,by-fh*.38,s)}</g>`;
   if(t>=1)h+=stone(30,103,6,4)+stone(41,106,5,3.4,'#7C74AE')+stone(79,106,5,3.4,'#7C74AE')+stone(90,103,6,4);
   h+=sparks(t<1?[[52,by-fh,1.2,0,2.8],[68,by-fh+4,1.1,1.2,3.2]]:t<2?[[50,by-fh+2,1.3,0,2.8],[69,by-fh,1.2,.8,3.2],[58,by-fh-6,1.1,1.5,3.6],[74,by-fh+10,1,2.2,3]]:[[48,by-fh+4,1.4,0,2.8],[70,by-fh,1.3,.6,3.2],[58,by-fh-8,1.2,1.3,3.6],[76,by-fh+10,1.1,1.9,3],[42,by-fh+14,1,2.4,3.4],[62,by-fh-14,1,.9,3.8]]);
   return {sky:['#1A1348','#34267A','#53358C'],layers:h};
  },
  /* 4 Torch: a flame you can carry */
  (id,t,st)=>{
   const by=64,fw=P([26,31,36],t),fh=P([36,45,52],t),s=P([.48,.58,.68],t);
   let h=stars(9)+glow(id,60,by-fh*.4,P([44,54,64],t));
   h+=`<rect x="56.5" y="73" width="7" height="42" rx="3" fill="#8A5A3C"/><rect x="58.3" y="73" width="2" height="42" rx="1" fill="#B8814F"/>`;
   h+=`<path d="M51 63L69 63L65.5 78.5L54.5 78.5Z" fill="#5B3A2A"/><path d="M52.4 69.6H67.6M53.6 74.6H66.4" stroke="#C48A5C" stroke-width="1.8" stroke-linecap="round"/><ellipse cx="60" cy="63.4" rx="9" ry="2.6" fill="#3A2418"/>`;
   h+=`<g class="em-fig">${flame(id,60,by,fw,fh,{delay:.2})}${face(60,by-fh*.42,s)}</g>`;
   h+=hill(106,'#1B1252',5,6);
   h+=`<ellipse cx="60" cy="108" rx="${P([22,30,38],t)}" ry="${P([5,7,9],t)}" fill="#FFB347" opacity=".22"/>`;
   if(t>=2)h+=sparks([[48,by-fh*.5,1.3,0,3],[72,by-fh*.6,1.2,.8,3.4],[56,by-fh,1.2,1.5,3.8],[68,by-fh-4,1,2.1,3.2]]);
   else if(t>=1)h+=sparks([[50,by-fh*.5,1.2,0,3],[71,by-fh*.6,1.1,1.1,3.4]]);
   if(st===1)h+=`<path d="M56.5 88H63.5M56.5 94H63.5M56.5 100H63.5" stroke="#C48A5C" stroke-width="2"/>`;
   if(st===3)h+=`<path d="M36 122L55 106H65L84 122Z" fill="#FFD27A" opacity=".2"/>`;
   return {sky:['#211860','#4A3190','#7A4399'],layers:h};
  },
  /* 5 Beacon: a fire on a tower, so others can see it too */
  (id,t,st)=>{
   const H=P([84,80,76],t),by=H-11,fw=P([28,33,37],t),fh=P([34,40,44],t),s=P([.52,.6,.66],t);
   let h=stars(7)+hill(100,'#241A62',7,-6);
   if(t>=2){ /* faraway beacons answer back */
    [[17,92],[103,90]].forEach((p,i)=>{h+=`<circle class="sn-glow" cx="${p[0]}" cy="${p[1]-5}" r="11" fill="url(#${id}go)" style="animation-delay:${i*.7}s"/><g class="em-flame" style="animation-delay:${i*.5}s"><path d="${dropD(p[0],p[1],6,10,.05)}" fill="url(#${id}fo)"/></g>`});
    h+=hill(104,'#1A1250',6,10);
   }
   h+=glow(id,60,by-fh*.45,P([42,52,60],t));
   if(t>=1)h+=rays(60,by-fh*.45,fh*.5+4,P([0,8,10],t),P([0,9,13],t),2.2,'#FFE27A',{arc:1,a0:-Math.PI*0.96,a1:-Math.PI*0.04,cls:'em-beam'});
   h+=`<path d="M${60-13} 108L${60+13} 108L${60+9} ${H}L${60-9} ${H}Z" fill="#7A72AE"/><path d="M${60-11.6} 99H${60+11.6}M${60-10.3} 91H${60+10.3}M${60-9.6} ${H+5}H${60+9.6}" stroke="#5B5490" stroke-width="1.2" fill="none"/><path d="M55 108V101a5 5 0 0110 0V108Z" fill="#2B2466"/>`;
   h+=`<rect x="${60-12.5}" y="${H-4}" width="25" height="4.4" rx="1.6" fill="#5B5490"/><path d="M${60-12} ${H-4}L${60+12} ${H-4}L${60+7} ${H-12}L${60-7} ${H-12}Z" fill="#3A3470"/><path d="M${60-7} ${H-12}H${60+7}" stroke="#8A82C4" stroke-width="1.6" stroke-linecap="round"/>`;
   h+=`<g class="em-fig">${flame(id,60,by,fw,fh,{delay:.3})}${face(60,by-fh*.4,s)}</g>`;
   h+=hill(112,'#150E43',5,-4);
   if(st===1)h+=`<path d="M${60-11} ${f(H+12)}H${60+11}" stroke="#9A93C8" stroke-width="1.4"/>`;
   if(st===3)h+=cloud(30,30,.8,'#FFD9A0',.7,0)+cloud(92,24,.7,'#FFD9A0',.6,2);
   return {sky:['#241A66','#5A3792','#A5509A'],layers:h};
  },
  /* 6 Lighthouse: a steady light for the dark water */
  (id,t,st)=>{
   const T=P([64,56,48],t),bw=P([10.5,11.5,12.5],t),tw=P([7.2,7.8,8.4],t);
   const wAt=y=>tw+(bw-tw)*(y-T)/(96-T);
   let h=stars(P([6,4,2],t),.9);
   const ly=T-8.8;
   h+=glow(id,60,ly,P([26,32,38],t));
   /* beams */
   const bl=P([44,56,70],t),spread=P([7,9,11],t);
   h+=`<g class="em-beam"><path d="M60 ${ly}L${60-bl} ${ly-spread}L${60-bl} ${ly+spread*.5}Z" fill="url(#${id}bl)"/></g>`;
   h+=`<g class="em-beam" style="animation-delay:2.1s"><path d="M60 ${ly}L${60+bl} ${ly-spread*.5}L${60+bl} ${ly+spread}Z" fill="url(#${id}br)"/></g>`;
   /* sea and rock */
   h+=`<rect x="-2" y="94" width="124" height="30" fill="url(#${id}sea)"/>`;
   h+=`<g class="em-wave" stroke="#8FB0F5" stroke-width="1.4" stroke-linecap="round" fill="none" opacity=".55"><path d="M8 102q6 -3 12 0t12 0"/><path d="M82 100q6 -3 12 0t12 0"/><path d="M14 112q7 -3 14 0t14 0"/><path d="M78 111q7 -3 14 0t14 0"/></g>`;
   h+=`<path d="M32 108Q42 92 60 92.5Q78 92 88 108Z" fill="#4A4378"/><path d="M40 100Q50 93.5 60 94" stroke="#6E66A6" stroke-width="1.6" stroke-linecap="round" fill="none"/>`;
   /* tower: cream with coral stripes */
   const poly=(y0,y1,c)=>`<path d="M${f(60-wAt(y0))} ${y0}L${f(60+wAt(y0))} ${y0}L${f(60+wAt(y1))} ${y1}L${f(60-wAt(y1))} ${y1}Z" fill="${c}"/>`;
   h+=poly(T,96,'#FFF3DC');
   const span=96-T;
   h+=poly(T+span*.2,T+span*.4,'#FF7A66')+poly(T+span*.6,T+span*.8,'#FF7A66');
   h+=`<path d="M${60-wAt(T)} ${T}L${60-wAt(96)} 96" stroke="#fff" stroke-opacity=".5" stroke-width="1" fill="none"/>`;
   h+=`<rect x="${60-9.5}" y="${T-2.4}" width="19" height="3" rx="1.2" fill="#2A2350"/>`;
   /* lamp room with the face in it */
   h+=`<g class="em-fig"><rect x="${60-7.2}" y="${T-14.5}" width="14.4" height="12.4" rx="3.4" fill="url(#${id}lamp)"/>${face(60,ly-.5,.3,{nocheek:1})}</g>`;
   h+=`<path d="M${60-8.6} ${T-14}L60 ${T-23.5}L${60+8.6} ${T-14}Z" fill="#E5503F"/><circle cx="60" cy="${T-24}" r="1.6" fill="#E5503F"/>`;
   if(t>=2)h+=`<g stroke="#FFF6C8" stroke-width="1.2" stroke-linecap="round" class="em-twk"><path d="M20 104h6M92 108h7M48 112h5"/></g>`;
   if(st===1)h+=`<circle cx="60" cy="${f(ly)}" r="12" fill="#FFF3B0" opacity=".35"/>`;
   if(st===3)h+=`<g stroke="#FFFFFF" stroke-width="1.6" stroke-linecap="round" opacity=".75" fill="none"><path d="M30 106q3 -3 6 0"/><path d="M84 106q3 -3 6 0"/><path d="M38 110q3 -3 6 0"/></g>`;
   return {sky:['#2C2175','#6A3C94','#E0808C'],layers:h,sea:true};
  },
  /* 7 Sunrise: the sun comes up over the hills, and its face comes up with it */
  (id,t,st)=>{
   const cy=P([88,80,72],t),r=22,s=.62;
   let h=stars(P([3,1,0],t),.7);
   h+=glow(id,60,cy,P([40,48,56],t));
   if(t>=1)h+=rays(60,cy,r+4,P([0,9,11],t),P([0,9,13],t),3.6,'#FFD25A',{arc:1,a0:-Math.PI*0.97,a1:-Math.PI*0.03,cls:'em-beam'});
   if(t>=2)h+=cloud(26,44,.9,'#FFC4B0',.85,0)+cloud(94,34,.75,'#FFD6C2',.8,3);
   if(st===1)h+=`<rect x="-2" y="30" width="124" height="70" fill="#FF8FA8" opacity=".2"/>`;
   h+=`<g class="em-fig">${sunCore(id,60,cy,r,s)}</g>`;
   h+=hill(92,'#8A4A94',7,-10)+hill(98,'#4A2A7C',6,8)+`<rect x="-2" y="104" width="124" height="20" fill="#2F1C62"/>`;
   if(st===3)h+=sparkle(28,93,3.4,'#FFE7A0',0)+sparkle(94,95,3,'#FFE7A0',1)+sparkle(48,99,2.6,'#FFE7A0',2);
   return {sky:['#3F2F8E','#B4559A','#FFAE6B'],layers:h};
  },
  /* 8 Daybreak: morning, and getting brighter */
  (id,t,st)=>{
   const cy=P([64,58,52],t),r=23,s=.66;
   let h=glow(id,60,cy,P([48,54,60],t));
   h+=rays(60,cy,r+5,11,12,3.8,'#FFC832',{alt:1});
   if(t>=1)h+=cloud(24,70,.9,'#FFFFFF',.9,0)+cloud(98,56,.8,'#FFF1E6',.9,4);
   else h+=cloud(98,64,.8,'#FFF1E6',.85,2);
   if(t>=2)h+=bird(30,34,1)+bird(40,28,.8)+bird(88,36,.9);
   if(st===1)h+=stars(5,.45);
   h+=`<g class="em-fig">${sunCore(id,60,cy,r,s)}</g>`;
   h+=hill(96,'#77D2B0',7,-8)+hill(103,'#3DAA84',6,6)+`<rect x="-2" y="108" width="124" height="16" fill="#2E8E6E"/>`;
   if(st===3)h+=`<rect x="-2" y="106" width="124" height="4" fill="#FFD25A" opacity=".55"/><rect x="-2" y="113" width="124" height="3" fill="#FFD25A" opacity=".35"/>`;
   return {sky:['#6B9BF0','#B6D0FF','#FFD6A4'],layers:h};
  },
  /* 9 Bright day: a clear sky, green hills, flowers, a rainbow */
  (id,t,st)=>{
   const cy=47,r=24,s=.68;
   let h=glow(id,60,cy,60);
   if(t>=2){[[54,'#FF7A66'],[49.2,'#FFC832'],[44.4,'#5FD6A0'],[39.6,'#5AA8FF']].forEach(a=>{h+=`<path d="M${96-a[0]} 112A${a[0]} ${a[0]} 0 0 1 ${96+a[0]} 112" stroke="${a[1]}" stroke-width="4.8" fill="none" opacity=".8"/>`})}
   h+=rays(60,cy,r+5,13,14,4,'#FFC832',{alt:1});
   h+=cloud(24,66,.95,'#FFFFFF',.95,0);
   if(t>=1)h+=cloud(96,60,.85,'#FFFFFF',.95,3);
   if(st===3)h+=`<g stroke="#9ED0FF" stroke-width="1.3" stroke-linecap="round" opacity=".75"><path d="M20 76l-3 8M28 80l-3 8M96 72l-3 8M104 76l-3 8M88 78l-3 8"/></g>`;
   h+=`<g class="em-fig">${sunCore(id,60,cy,r,s)}</g>`;
   h+=hill(94,'#69DDB0',7,-8)+hill(102,'#2DB380',6,6)+`<rect x="-2" y="108" width="124" height="16" fill="#23996C"/>`;
   if(t>=1)h+=`<g><circle cx="24" cy="106" r="2.3" fill="#FF7A66"/><circle cx="36" cy="111" r="2.1" fill="#FFD25A"/><circle cx="84" cy="106" r="2.3" fill="#fff"/><circle cx="97" cy="111" r="2.1" fill="#FF7A66"/></g>`;
   if(t>=2)h+=`<g><circle cx="52" cy="112" r="2" fill="#FFD25A"/><circle cx="68" cy="108" r="2.2" fill="#fff"/><circle cx="12" cy="111" r="2" fill="#FFD25A"/><circle cx="110" cy="107" r="2" fill="#FFD25A"/></g>`;
   if(st===1)h+=`<g stroke="#1E8A5E" stroke-width="1.6" stroke-linecap="round"><path d="M18 109l-2 -5M20 109l1 -6M44 112l-2 -5M46 112l1 -6M90 107l-2 -5M92 107l1 -6"/></g>`;
   return {sky:['#3FA2FF','#86CCFF','#CFEBFF'],layers:h};
  },
  /* 10 Full sun: it steps out of the frame */
  (id,t,st)=>{
   const n=P([12,16,20],t),r=28,s=1.02;
   let h=glow(id,60,60,P([50,55,60],t));
   h+=rays(60,60,r+6,15,n,4.8,'#FFC832',{alt:1});
   if(t>=1){let d='';for(let i=0;i<12;i++){const a=i/12*Math.PI*2;d+=`<circle cx="${f(60+Math.cos(a)*53)}" cy="${f(60+Math.sin(a)*53)}" r="1.7"/>`}h+=`<g fill="#FFD25A" opacity=".85" class="em-orbit">${d}</g>`}
   if(t>=2){h+=`<circle cx="60" cy="60" r="47" fill="none" stroke="#FFD25A" stroke-width="1.4" stroke-dasharray="1.5 5" stroke-linecap="round" opacity=".8" class="em-orbit"/>`;
    h+=sparkle(12,26,7,'#FFC832',0)+sparkle(108,32,6,'#FFC832',1)+sparkle(102,98,7,'#FFC832',2)+sparkle(16,92,6,'#FFC832',3)}
   if(st===1)h+=`<g opacity=".5">${rays(60,60,r+6,24,12,2,'#FFE7A0',{cls:'em-rays2'})}</g>`;
   h+=`<g class="em-fig">${sunCore(id,60,60,r,s)}<ellipse cx="51" cy="46" rx="9" ry="4.4" fill="#fff" opacity=".28" transform="rotate(-24 51 46)"/></g>`;
   if(st===3){let d='';for(let i=0;i<7;i++){const a=-Math.PI*(0.82-0.64*i/6);d+=`<circle cx="${f(60+Math.cos(a)*40)}" cy="${f(60+Math.sin(a)*40)}" r="2.6"/>`}h+=`<g fill="#FFE27A" class="em-orbit">${d}</g>`}
   return {free:true,layers:h};
  },
  /* 11 Constellation: the first stars, then lines between them, then a shape that fills the sky */
  (id,t,st)=>{
   const C=[[30,40],[46,30],[60,46],[78,34],[92,48],[70,70],[44,72]];
   let h=stars(12,.8);
   if(st>=4)h+=glow(id,60,52,58);
   const link=(a,b,op)=>`<path d="M${C[a][0]} ${C[a][1]}L${C[b][0]} ${C[b][1]}" stroke="#BFD0FF" stroke-width="1.3" stroke-linecap="round" opacity="${op}"/>`;
   if(st>=1)h+=link(1,2,.75)+link(2,3,.75)+link(2,5,.75);
   if(st>=2)h+=link(0,1,.85)+link(3,4,.85)+link(5,6,.85)+link(6,2,.85);
   if(st>=3)h+=link(4,5,.9)+link(0,6,.9);
   const pts=st>=3?C:st>=2?C.slice(0,5):[C[1],C[3],C[5]];
   pts.forEach((p,i)=>{if(p!==C[2])h+=sparkle(p[0],p[1],st>=3?4.2:3.4,'#FFF6C8',i*.4)});
   if(st>=3)h+=sparkle(18,86,3,'#FFF6C8',1.2)+sparkle(102,86,3,'#FFF6C8',2.1)+sparkle(60,16,3,'#FFF6C8',.6);
   if(st>=4)h+=sparkle(14,24,3.6,'#FFE27A',0)+sparkle(106,22,3.6,'#FFE27A',1)+sparkle(100,104,3.4,'#FFE27A',2)+sparkle(20,104,3.4,'#FFE27A',3);
   h+=glow(id,60,46,22);
   h+=`<g class="em-fig em-bob">${sunCore(id,60,46,11,.4)}</g>`;
   h+=hill(110,'#0C0828',6);
   return {sky:['#0B0A2E','#1A1550','#2C2072'],layers:h};
  },
  /* 12 North Star: one star that stays put, the sky turning around it, and its light pointing the way */
  (id,t,st)=>{
   let h=stars(12,.55);
   if(st>=2){for(let i=0;i<3;i++){const r=26+i*12;h+=`<path class="em-orbit" d="M${f(60-r)} 44A${r} ${r} 0 0 1 ${f(60+r)} 44" stroke="#AFC2FF" stroke-width="1" stroke-dasharray="2 4" stroke-linecap="round" fill="none" opacity="${.5-i*.12}"/>`}}
   if(st>=1)h+=`<path d="M60 56L52 112H68Z" fill="#FFF3B0" opacity=".18"/>`;
   if(st>=3)h+=`<circle cx="60" cy="44" r="30" fill="url(#${id}go)"/>`;
   h+=glow(id,60,44,P([30,34,38,42,48],t));
   h+=`<g class="em-fig em-bob">${sparkle(60,44,P([22,24,26,27,28],t),`url(#${id}c)`,0)}${face(60,45,.34,{nocheek:1})}</g>`;
   if(st>=4){h+=`<circle cx="60" cy="44" r="40" fill="none" stroke="#FFD25A" stroke-width="1.4" stroke-dasharray="1.5 5" stroke-linecap="round" opacity=".85" class="em-orbit"/>`;
    h+=sparkle(16,24,4,'#FFE27A',0)+sparkle(104,26,4,'#FFE27A',1)+sparkle(100,78,3.4,'#FFE27A',2)+sparkle(20,80,3.4,'#FFE27A',3)}
   h+=hill(104,'#0E0B34',7,-6)+hill(110,'#08061F',5,8);
   return {sky:['#0A0A28','#191A52','#33307E'],layers:h};
  }
 ];

 function emblem(n,o){
  o=o||{};
  const L=clampL(n),si=stage(L),t=tier(L),id='em'+(++seq),sc=SCENES[si](id,t,step(L)),size=o.size||120;
  const cls='sun emb s'+si+' t'+t+(o.still?' still':'')+(o.locked?' locked':'');
  let defs=`<defs>
  <linearGradient id="${id}fo" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#FFE27A"/><stop offset=".45" stop-color="#FFB43A"/><stop offset="1" stop-color="#FF6F4A"/></linearGradient>
  <linearGradient id="${id}fi" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#FFFBE0"/><stop offset="1" stop-color="#FFE27A"/></linearGradient>
  <radialGradient id="${id}go"><stop offset="0" stop-color="#FFC25A" stop-opacity=".62"/><stop offset="1" stop-color="#FFC25A" stop-opacity="0"/></radialGradient>
  <radialGradient id="${id}c" cx="40%" cy="34%" r="75%"><stop offset="0" stop-color="#FFF3B8"/><stop offset=".55" stop-color="#FFC832"/><stop offset="1" stop-color="#FFA23A"/></radialGradient>`;
  if(sc.sky)defs+=`<linearGradient id="${id}sk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${sc.sky[0]}"/><stop offset=".6" stop-color="${sc.sky[1]}"/><stop offset="1" stop-color="${sc.sky[2]}"/></linearGradient><clipPath id="${id}cp"><circle cx="60" cy="60" r="58"/></clipPath>`;
  if(sc.sea)defs+=`<linearGradient id="${id}sea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3A5AB0"/><stop offset="1" stop-color="#1B2A6B"/></linearGradient>
  <linearGradient id="${id}bl" gradientUnits="userSpaceOnUse" x1="60" y1="0" x2="0" y2="0"><stop offset="0" stop-color="#FFF3B0" stop-opacity=".85"/><stop offset="1" stop-color="#FFF3B0" stop-opacity="0"/></linearGradient>
  <linearGradient id="${id}br" gradientUnits="userSpaceOnUse" x1="60" y1="0" x2="120" y2="0"><stop offset="0" stop-color="#FFF3B0" stop-opacity=".85"/><stop offset="1" stop-color="#FFF3B0" stop-opacity="0"/></linearGradient>
  <linearGradient id="${id}lamp" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFF3B8"/><stop offset="1" stop-color="#FFC832"/></linearGradient>`;
  defs+='</defs>';
  const body=sc.free?sc.layers
   :`<g clip-path="url(#${id}cp)"><rect x="0" y="0" width="120" height="120" fill="url(#${id}sk)"/>${sc.layers}</g><circle cx="60" cy="60" r="57.2" fill="none" stroke="#fff" stroke-opacity=".34" stroke-width="1.8"/><circle cx="60" cy="60" r="58.6" fill="none" stroke="#2A2350" stroke-opacity=".28" stroke-width="1"/>`;
  return `<svg class="${cls}" viewBox="0 0 120 120" style="width:${size}px;height:${size}px" aria-hidden="true" focusable="false">${defs}${body}</svg>`;
 }
 return {emblem,stage,tier,step};
})();
function sunSvg(level,o){return Em.emblem(level,o)}

/* ------------------------------------------------------------------------------------------------
   lessons: the 32 lessons and their sources
   ------------------------------------------------------------------------------------------------ */
/* ===== LESSONS: thirty-two short lessons in eight units. Each one is a handful of cards: read a little, tap a small question, try one thing.
   Every claim comes from a source listed at the end of its lesson (checked October 12, 2026), and the wording stays inside what that source says:
   who was studied, what was measured, and what it cannot show. Finishing a lesson earns 10 points once, saved by lesson id in that day's record (p.ls). ===== */
/* each section has a color; next to each other on the path (lessons.ts UNIT_ORDER), no two look alike (accent and violet do) */
const LUNITS=[
 {name:'How it works',sub:'Mixed feelings, urges, the snowball, why nights are hard, and what getting free feels like.',tone:'sky',cls:'lu0'},
 {name:'Shame and kindness',sub:'Why shame backfires, what kindness does, being known, partners, and sex after porn.',tone:'coral',cls:'lu1'},
 {name:'Making a plan',sub:'If-then plans, changing the setting, getting help, and what progress is.',tone:'mint',cls:'lu2'},
 {name:'Skills for the moment',sub:'Naming a feeling, a longer breath out, moving, and not obeying every thought.',tone:'violet',cls:'lu3'},
 {name:'Seeing your pattern',sub:'The early links in the chain, permission thoughts, your own log, and fewer fights.',tone:'sky',cls:'lu4'},
 {name:'A life that holds',sub:'Missed days, values, filling the empty hour, what therapy is like, and day 30, 60, 90 and after.',tone:'coral',cls:'lu5'},
 {name:'Well-known programs',sub:'The 12 steps, SMART Recovery, mindfulness-based relapse prevention, and why groups help.',tone:'violet',cls:'lu6'},
 {name:'Faith and recovery',sub:'God in recovery: what the 12-step tradition and research say, a practice for hard moments, guilt, and forgiveness.',tone:'sun',cls:'lu7',faith:true}
];
LUNITS.push(...LUNITS_MORE);
/* small builders so the lessons below read like the lessons */
const ltext=(h,...b)=>({k:'text',h,b});
const lchoose=(h,q,...c)=>({k:'choose',h,q,c});
const ltry=(h,b,go)=>({k:'try',h,b,go:go||[]});
const bP=s=>['p',s],bQ=s=>['q',s],bL=a=>['l',a];

const SRC={
 tip35:['SAMHSA: TIP 35, chapter 5, “From Contemplation to Preparation”','https://www.ncbi.nlm.nih.gov/books/NBK571064/'],
 bowen:['Bowen & Marlatt (2009): “Surfing the urge,” a study with college smokers','https://pubmed.ncbi.nlm.nih.gov/20025372/'],
 kirchner:['Kirchner, Shiffman & Wileyto (2012): relapse dynamics in people quitting smoking','https://pmc.ncbi.nlm.nih.gov/articles/PMC3296289'],
 gujar:['Gujar, Yoo, Hu & Walker (2011): sleep loss and the brain’s reward response, Journal of Neuroscience','https://pmc.ncbi.nlm.nih.gov/articles/PMC3086142'],
 butler:['Butler et al. (2018): pornography use and loneliness, survey of 1,247 people','https://scholarsarchive.byu.edu/facpub/4470'],
 dearing:['Dearing, Stuewig & Tangney (2005): shame, guilt, and alcohol and drug problems (University at Buffalo news release)','https://www.buffalo.edu/news/releases/2005/08/7453.html'],
 clearvote:['James Clear: the “every action is a vote for the type of person you wish to become” idea, from Atomic Habits (quote page on jamesclear.com)','https://jamesclear.com/quotes/a-reminder-from-atomic-habits-as-we-start-the-new-yearevery-action-you-take-is-a-vote-for-the-type-of-person-you-wish-to-become-no-single-instance-will-transform-your-beliefs-but-as-the-votes-bui'],
 clearmiss:['James Clear: the “never miss twice” idea, on jamesclear.com','https://jamesclear.com/quotes/the-first-mistake-is-never-the-one-that-ruins-you-it-is-the-spiral-of-repeated-mistakes-that-follows-missing-once-is-an-accident-missing-twice-is-the-start-of-a-new-habit'],
 adams:['Adams & Leary (2007): self-compassion and restrictive eaters, Journal of Social and Clinical Psychology','https://scholars.duke.edu/publication/782823'],
 slepian:['Slepian, Chun & Mason (2017): “The experience of secrecy”','https://business.columbia.edu/faculty/research/experience-secrecy'],
 samhsa:['SAMHSA: working definition of recovery','https://library.samhsa.gov/sites/default/files/pep12-recdef.pdf'],
 gollwitzer:['Gollwitzer & Sheeran (2006): implementation intentions, a meta-analysis','https://doi.org/10.1016/S0065-2601(06)38002-1'],
 wood:['Wood, Tam & Witt (2005): “Changing circumstances, disrupting habits”','https://dornsife.usc.edu/wendy-wood/wp-content/uploads/sites/183/2023/10/Wood.Tam_.GuerreroWitt.2005_Changing_circumstances_disrupting_habits.pdf'],
 cdc:['CDC: about sleep','https://www.cdc.gov/sleep/about/'],
 ebsco:['EBSCO Research Starters: pornography addiction','https://www.ebsco.com/research-starters/health-and-medicine/pornography-addiction'],
 icd:['WHO ICD-11, 6C72 compulsive sexual behaviour disorder (a text copy of the entry)','https://findacode.com/icd-11/code-1630268048.html'],
 lieberman:['Lieberman et al. (2007): “Putting feelings into words,” Psychological Science (abstract)','https://pubmed.ncbi.nlm.nih.gov/17576282/'],
 ucla:['UCLA Health news release: “Putting feelings into words produces therapeutic effects in the brain”','https://www.uclahealth.org/news/release/putting-feelings-into-words-produces-therapeutic-effects-in-the-brain-ucla-neuroimaging-study-supports-ancient-buddhist-teachings'],
 larimer:['Larimer, Palmer & Marlatt (1999): relapse prevention, an overview of Marlatt’s cognitive-behavioral model, Alcohol Research & Health','https://pmc.ncbi.nlm.nih.gov/articles/PMC6760427'],
 balban:['Balban et al. (2023): brief structured respiration practices and mood, a randomized study, Cell Reports Medicine','https://pmc.ncbi.nlm.nih.gov/articles/PMC9873947'],
 haasova:['Haasova et al. (2013): the acute effects of physical activity on cigarette cravings, a systematic review, Addiction','https://researchportal.plymouth.ac.uk/en/publications/the-acute-effects-of-physical-activity-on-cigarette-cravings-syst-2/'],
 crosby:['Crosby & Twohig (2016): acceptance and commitment therapy for problematic internet pornography use, a randomized trial, Behavior Therapy','https://pubmed.ncbi.nlm.nih.gov/27157029/'],
 harkin:['Harkin et al. (2016): prompting people to monitor goal progress, a meta-analysis of 138 experiments, Psychological Bulletin','https://eprints.whiterose.ac.uk/91437/'],
 hofmann:['Hofmann, Baumeister, Förster & Vohs (2012): everyday temptations, an experience-sampling study of desire, conflict, and self-control','https://experts.umn.edu/en/publications/everyday-temptations-an-experience-sampling-study-of-desire-confl/'],
 lally:['British Psychological Society Research Digest: how long it takes to form a habit (on Lally et al., 2010)','https://bps.org.uk/research-digest/how-form-habit'],
 lallyucl:['UCL news: how long does it take to form a habit?','https://www.ucl.ac.uk/news/2009/aug/how-long-does-it-take-form-habit'],
 grubbs:['Grubbs, Perry, Wilt & Reid (2019): pornography problems due to moral incongruence, Archives of Sexual Behavior','https://link.springer.com/article/10.1007/s10508-018-1248-x'],
 ba:['Society of Clinical Psychology: behavioral activation for depression','https://societyofclinicalpsychology.org/psychological-treatments-archive/behavioral-activation-for-depression/'],
 cobra:['Richards et al. (2016): behavioural activation vs cognitive behavioural therapy for depression, the COBRA trial, The Lancet','https://eprints.whiterose.ac.uk/id/eprint/105790/'],
 antons:['Antons et al. (2022): treatments for compulsive sexual behavior disorder and problematic pornography use, a systematic review, Journal of Behavioral Addictions','https://real.mtak.hu/172651'],
 nimh:['NIMH: psychotherapies','https://www.nimh.nih.gov/health/topics/psychotherapies'],
 nhs:['NHS: cognitive behavioural therapy (CBT), overview','https://www.nhs.uk/mental-health/talking-therapies-medicine-treatments/talking-therapies-and-counselling/cognitive-behavioural-therapy-cbt/overview/'],
 /* lessons 25 to 32 (checked October 13, 2026) */
 aa12:['Alcoholics Anonymous: the Twelve Steps (the wording of the steps)','https://www.aa.org/the-twelve-steps'],
 aaspons:['Alcoholics Anonymous: “Questions & Answers on Sponsorship” (pamphlet)','https://www.aa.org/sites/default/files/literature/assets/p-15_Q&AonSpon.pdf'],
 cochrane:['Kelly, Humphreys & Ferri (2020): Alcoholics Anonymous and other 12-step programs for alcohol use disorder, Cochrane review','https://cochranelibrary.com/cdsr/doi/10.1002/14651858.CD012880.pub2/information'],
 cochranepr:['Wiley press release on the 2020 Cochrane review of AA and Twelve-Step Facilitation','https://investors.wiley.com/news/news-details/2020/New-Cochrane-Review-finds-Alcoholics-Anonymous-and-Twelve-Step-Facilitation-programs-help-people-to-recover-from-alcohol-problems-2020-3-11/default.aspx'],
 efrati:['Efrati & Gola (2018): compulsive sexual behavior, a twelve-step therapeutic approach, Journal of Behavioral Addictions (abstract)','https://real.mtak.hu/81157/'],
 kelly17:['Kelly (2017): “Is Alcoholics Anonymous religious, spiritual, neither?” Addiction (a summary from the Recovery Research Institute)','https://www.recoveryanswers.org/research-post/alcoholics-anonymous-religious-spiritual-neither-review-finds-aa-effective-not-way-think/'],
 krentzman:['Krentzman, Cranford & Robinson (2013): multiple dimensions of spirituality in recovery, Substance Abuse (abstract)','https://experts.umn.edu/en/publications/multiple-dimensions-of-spirituality-in-recovery-a-lagged-mediatio/'],
 smartpts:['SMART Recovery Australia: the four points of the SMART Recovery program','https://smartrecoveryaustralia.com.au/en/what-are-the-four-points-of-the-smart-recovery-program'],
 smarttools:['SMART Recovery: the toolbox','https://www.smartrecovery.org/smart-recovery-toolbox/'],
 beck:['Beck et al. (2017): systematic review of SMART Recovery, Psychology of Addictive Behaviors (abstract)','https://www.drugsandalcohol.ie/33876/'],
 bowen14:['Bowen et al. (2014): mindfulness-based relapse prevention compared with relapse prevention and usual care, JAMA Psychiatry','https://www.psychiatry.wisc.edu/wp-content/uploads/2025/05/Article-1_Bowen-et-al-JAMA-2014.pdf'],
 chawla:['University of Washington (adai.uw.edu): webinar slides on mindfulness-based relapse prevention and its 8-session program','https://adai.uw.edu/nwattc/pdfs/webinar_chawla_201811.pdf'],
 mbrpslides:['Penn State (prevention.psu.edu): slides on relapse prevention and mindfulness-based relapse prevention, including the SOBER breathing space','https://prevention.psu.edu/wp-content/uploads/2009/11/marlatt_RP_MBRP_full.pdf'],
 smarthome:['SMART Recovery: home page (free meetings led by trained facilitators, and how it describes itself)','https://www.smartrecovery.org/'],
 serenity:['Wikipedia: Serenity Prayer (its wording, history, and who wrote it)','https://en.wikipedia.org/wiki/Serenity_Prayer'],
 wohl:['British Psychological Society Research Digest: forgive yourself and procrastinate less (on Wohl, Pychyl & Bennett, 2010)','https://bps.org.uk/research-digest/cure-procrastination-forgive-yourself'],
 ...SRC_MORE
};

/* the lessons: LESSONS holds each lesson's title, section and key line (lesson-catalog.ts); lesson-content.ts fills in their
   cards from legacy/lessons-old.js, where the lesson bodies are, when a screen that shows one loads */
const LESSONS=CATALOG.map(h=>({...h,cards:[],src:[]}));


/* ------------------------------------------------------------------------------------------------
   onboarding: the setup answers and the self-check
   ------------------------------------------------------------------------------------------------ */
const OB_AIM=[['quit','Quit for good','flag'],['less','Use it a lot less','sliders'],['nights','Take back my nights','moon'],['learn','Understand my pattern','compass']];
const OB_FREQ=[['f0','Less than once a week',.5,'less than once a week'],['f1','1 to 2 times',1.5,'1 to 2 times a week'],['f2','3 to 5 times',4,'3 to 5 times a week'],['f3','About once a day',7,'about once a day'],['f4','More than once a day',14,'more than once a day']];
const OB_MINS=[['m0','Under 15 minutes',10,'under 15 minutes'],['m1','15 to 30 minutes',22,'15 to 30 minutes'],['m2','30 minutes to an hour',45,'30 minutes to an hour'],['m3','1 to 2 hours',90,'1 to 2 hours'],['m4','More than 2 hours',150,'more than 2 hours']];
const OB_YEARS=[['y0','Less than a year',.5],['y1','1 to 3 years',2],['y2','3 to 10 years',6],['y3','More than 10 years',12]];
const OB_TRIED=[['t0','No, this is my first real try','flag'],['t1','Yes, once or twice','sunrise'],['t2','Yes, many times','dots']];
const OB_FAITH=[['big','Yes, a big part','star'],['some','Somewhat','sparkle'],['no','No','wind']];
/* the Brief Pornography Screen (Kraus et al., 2020): five statements about the last 6 months, each scored 0, 1 or 2.
   4 or more is a positive screen (worth a closer look), and the authors say 6 or more may point to a need for professional help.
   The wording of the five statements and the three answers is the tested wording, so it stays exactly as it is. */
const OB_BPS=['You find yourself using pornography more than you want to.','You have attempted to “cut back” or stop using pornography, but were unsuccessful.','You find it difficult to resist strong urges to use pornography.','You find yourself using pornography to cope with strong emotions (for example sadness, anger, or loneliness).','You continue to use pornography even though you feel guilty about it.'];
const OB_BPS_C=[['0','Never'],['1','Occasionally'],['2','Very often']];
const OB_COST=[['sleep','Sleep','moon'],['focus','Focus and energy','bolt'],['rel','Relationships or dating','heart'],['time','Time','timer'],['self','Self-respect','star'],['mood','Mood','leaf'],['values','My values or faith','flag'],['money','Money','dots']];
const OB_WHEN=[['late','Late at night, in bed','moon'],['bored','Bored or alone at home','dots'],['stress','Stressed or wound up','bolt'],['lonely','Lonely or low','heart'],['tired','Tired','timer'],['scroll','Scrolling my phone','phone']];
/* the hardest moment the plan starts with: the first one picked, in this order */
const OB_TOP=['late','lonely','stress','bored','tired','scroll'];
/* each hard moment: the urge plan row it fills, its "if", how a question says it, and three "then" choices */
const OB_THEN={
 late:[0,'I am in bed late at night','you are in bed late at night',['Leave the room for 10 minutes. Then bed, no phone.','Charge my phone in another room and go to sleep.','One minute of slow breathing. Phone in another room.']],
 lonely:[1,'I am lonely or low','you feel lonely or low',['Text or call one person. A message counts.','Go somewhere with people around.','Open Reach a person in Daybook.']],
 bored:[2,'I am bored or idle','you are bored or idle',['A 10-minute walk outside.','10 minutes on a hobby or project.','Pick one thing from my calm moves.']],
 stress:[3,'I am stressed or anxious','you are stressed or wound up',['Move my body, then write one sentence about the stress.','One minute of slow breathing, long breath out.','Step outside for five minutes.']],
 tired:[4,'I am tired but still up','you are tired but still up',['Go to bed now. Phone charges outside the room.','Drink water and start my wind-down.','Phone down. One minute of slow breathing.']],
 scroll:[4,"I catch myself scrolling with no plan",'you catch yourself scrolling with no plan',['Put the phone down and stand up.','Close the app. One thing from my calm moves.','Phone in another room for 10 minutes.']]
};
/* the hour each hard moment tends to peak, for the sample chart on "See when it hits hardest" */
const OB_PEAK={late:23,tired:23,scroll:21,lonely:19,stress:17,bored:15};
const OB_SO=['21:30','22:00','22:30','23:00','23:30','00:00'];
/* the goal templates. d1: days from today to Day 1. mode: how a day counts (strict: no slip; gentle: one slip or fewer). */
const OB_GOALS=[
 {id:'week',t:'Quit, after a tracking week',s:'Track 7 days, then Day 1.',ic:'calendar',goal:'Quit porn. First a tracking week to learn my pattern, then Day 1.',d1:7,mode:'strict'},
 {id:'now',t:'Quit, starting tomorrow',s:'Day 1 is tomorrow.',ic:'flag',goal:'Quit porn, starting tomorrow. Log honestly, slips included.',d1:1,mode:'strict'},
 {id:'nights',t:'Nights first',s:'Screens off and phone out of the bedroom.',ic:'moon',goal:'Take back my nights first: screens off on time, phone out of the bedroom. Then quit.',d1:7,mode:'strict'},
 {id:'less',t:'Cut way back first',s:'Day 1 tomorrow. One slip is okay.',ic:'sliders',goal:'Cut way back first. A day counts with one slip or fewer.',d1:1,mode:'gentle'},
 {id:'step',t:'Step down first',s:'For a daily habit: longer stretches, fewer slips each week.',ic:'chart',goal:'Step down first: longer stretches between slips and fewer slips each week. Then count days.',d1:7,mode:'step'}
];
const OB_GWHY={
 week:{h:'Why a tracking week first?',p:'You cannot change a pattern you cannot see. For seven days you log what happens, with no rules and nothing to fail. Then you set Day 1 knowing your hard hours and what sets it off.',f:'In a review of 138 experiments, tracking progress helped people reach their goals, and it helped more when the progress was written down.',src:'harkin'},
 now:{h:'Why a clear line?',p:'A clear line works when you already know your pattern. If you slip, nothing resets: your points, level, and badges stay, and the next day counts again.',f:'Among people quitting smoking, those whose confidence dropped after a slip slipped again sooner. Protecting your confidence matters more than a perfect record.',src:'kirchner'},
 nights:{h:'Why nights first?',p:'Late at night you are tired, often alone, and holding a phone. Fix that hour first and the biggest fight gets smaller. You track for a week, then set Day 1.',f:'After a night without sleep, people’s reward systems overreacted to pleasant pictures. A tired brain makes any quick reward look bigger than it is.',src:'gujar'},
 step:{h:'Why step down?',p:'When it happens most days, a long run with no slip is out of reach at first, and losing it every day or two wears you down. So you aim for longer stretches between slips, counted in hours at first, and fewer slips each week. When your stretches get long, Daybook moves you to counting days by itself.',f:'For smoking, a review of 22 trials found that cutting down first and quitting all at once worked about equally well in the long run.',src:'lindson'},
 less:{h:'Why cut back first?',p:'A goal you can keep builds confidence, and confidence carries you through the next hard moment. A day counts with one slip or fewer. Switch to strict counting in Settings when you are ready.',f:'Among people quitting smoking, those whose confidence dropped after a slip slipped again sooner. A goal you can keep protects it.',src:'kirchner'}
};
/* reasons offered on "What do you want your life to look like instead?", by what the person said it costs them */
const OB_RS={sleep:['Sleeping well and waking up rested'],focus:['Doing my best work without a fog','Clear mornings and steady energy'],rel:['Being fully present with the people I love','Being ready for a real, honest relationship'],time:['Spending my time on what matters to me'],self:['Becoming someone I am proud of','Keeping my word to myself'],mood:['Feeling at peace with myself'],values:['Living by my values'],money:['Keeping my money for what matters']};
const OB_RS_BASE=['Becoming someone I am proud of','Being fully present with the people I love','Clear mornings and steady energy','Not carrying a secret'];
const OB_BIBLE_H=74.5,OB_LANG_H=750;
const OB_GUESS=[25,50,100,200,400,800];
const OB_SRC={
 bps:['Kraus et al. (2020): validation of a Brief Pornography Screen across multiple samples, Journal of Behavioral Addictions','https://pmc.ncbi.nlm.nih.gov/articles/PMC8939429/'],
 chaiton:['Chaiton et al. (2016): how many quit attempts it takes to quit smoking, BMJ Open (summary by the North American Quitline Consortium)','https://www.naquitline.org/news/298632/Estimating-the-Number-of-Quit-Attempts-it-Takes-to-Quit-Smoking-Successfully-in-a-Longitudinal-Coho.htm'],
 wright:['Wright et al. (2017): pornography consumption and satisfaction, a meta-analysis of 50 studies (PsyPost summary)','https://www.psypost.org/study-links-porn-use-lower-sexual-relationship-satisfaction-among-men/'],
 perry:['Perry & Schleifer: beginning pornography use and the probability of divorce, US General Social Survey (American Sociological Association news release)','https://www.asanet.org/beginning-pornography-use-associated-increase-probability-divorce/'],
 grubbs19:['Grubbs, Kraus & Perry (2019): self-reported addiction to pornography in a nationally representative sample, Journal of Behavioral Addictions','https://real.mtak.hu/93861/'],
 dickenson:['Dickenson et al. (2018): distress from difficulty controlling sexual urges and behavior in the US, JAMA Network Open','https://pmc.ncbi.nlm.nih.gov/articles/PMC6324590/'],
 fernandez:['Fernandez et al. (2023): a 7-day pornography abstinence period and withdrawal-related symptoms, a randomized study, Archives of Sexual Behavior','https://irep.ntu.ac.uk/id/eprint/48030'],
 fsi:['US Department of State: Foreign Service Institute training times (languages like Spanish: 600 to 750 class hours to professional level)','https://www.state.gov/foreign-language-training/'],
 bible:['Influence Magazine, citing Crossway: about 74 and a half hours to read the Bible from Genesis to Revelation','https://influencemagazine.com/practice/12-for-12-in-2019'],
 lindson:['Klemperer & Lindson (2019): gradual and abrupt quitting did about equally well for long-term abstinence, summarizing a Cochrane review of 22 trials, Tobacco Induced Diseases','https://pmc.ncbi.nlm.nih.gov/articles/PMC6861854']
};
/* ---- what is kept: the last answers, how many times it was done, and the self-check scores over time ---- */
function normOnb(o){
 if(!o||typeof o!=='object')return null;
 const a={},src=o.a&&typeof o.a==='object'?o.a:{},one=(k,list)=>{if(list.some(x=>x[0]===src[k]))a[k]=src[k]};
 one('aim',OB_AIM);one('freq',OB_FREQ);one('mins',OB_MINS);one('years',OB_YEARS);one('tried',OB_TRIED);one('faith',OB_FAITH);
 /* which faith, after a Yes or a Somewhat (faith.ts) */
 if(normCreed(src.creed))a.creed=src.creed;
 /* what the person is quitting (habit.ts); none kept means porn */
 if(normHabit(src.habit))a.habit=src.habit;
 [0,1,2,3,4].forEach(i=>{const v=src['b'+i];if(v==='0'||v==='1'||v==='2')a['b'+i]=v});
 const many=(k,list)=>{if(Array.isArray(src[k]))a[k]=src[k].filter(v=>list.some(x=>x[0]===v)).slice(0,list.length)};
 many('costs',OB_COST);many('when',OB_WHEN);
 if(typeof src.ownCost==='string'&&src.ownCost.trim())a.ownCost=src.ownCost.trim().slice(0,60);
 if(OB_GOALS.some(g=>g.id===src.goal))a.goal=src.goal;
 if(isTime(src.so))a.so=src.so;
 if(OB_THEN[src.thenT]&&typeof src.then==='string')a.thenT=src.thenT,a.then=src.then.slice(0,400);
 const hist=(Array.isArray(o.hist)?o.hist:[]).filter(h=>h&&isKey(h.d)&&Number.isInteger(h.s)&&h.s>=0&&h.s<=10).slice(-24).map(h=>({d:h.d,s:h.s}));
 return {n:Math.max(0,parseInt(o.n,10)||0),at:Number(o.at)||0,a,hist};
}
function obScore(a){
 let s=0,n=0;
 for(let i=0;i<5;i++){const v=a['b'+i];if(v==='0'||v==='1'||v==='2'){s+=+v;n++}}
 return {s,n};
}
function obHours(a){
 const f=OB_FREQ.find(x=>x[0]===a.freq),m=OB_MINS.find(x=>x[0]===a.mins);
 if(!f||!m)return null;
 const wk=f[2]*m[2]/60,yr=wk*52,y=OB_YEARS.find(x=>x[0]===a.years);
 return {f,m,wk,yr,ten:yr*10,past:y?yr*y[2]:null};
}
const obRnd=h=>h<100?Math.round(h):h<1000?Math.round(h/10)*10:Math.round(h/100)*100;
function obHrs(h){
 if(h<1)return 'less than an hour';
 const r=obRnd(h);
 return r.toLocaleString('en-US')+(r===1?' hour':' hours');
}
function obTop(a){return OB_TOP.find(k=>(a.when||[]).indexOf(k)>=0)||'late'}
/* the tool SOS would offer first for a hard moment: the best fit, and on a tie the shorter, simpler one */

/* ------------------------------------------------------------------------------------------------
   icons: the line icons, as the inside of a 24 by 24 SVG (stroke, no fill)
   ------------------------------------------------------------------------------------------------ */
const ICO={
 swap:'<path d="M4 8h14l-3.5-3.5M20 16H6l3.5 3.5"/>',
 chart:'<path d="M5 20V10M12 20V4M19 20v-7"/>',
 ask:'<path d="M9 9a3 3 0 1 1 4.2 2.7c-.8.4-1.2 1-1.2 1.8M12 18v.5"/>',
 sun:'<circle cx="12" cy="12" r="4"/><path d="M12 3v2.2M12 18.8V21M3 12h2.2M18.8 12H21M5.6 5.6l1.6 1.6M16.8 16.8l1.6 1.6M18.4 5.6l-1.6 1.6M7.2 16.8l-1.6 1.6"/>',
 calendar:'<rect x="4" y="5.5" width="16" height="14" rx="2.5"/><path d="M4 10h16M8.5 3.5v4M15.5 3.5v4"/>',
 sparkle:'<path d="M10.5 3.5l1.7 4.8L17 10l-4.8 1.7-1.7 4.8-1.7-4.8L4 10l4.8-1.7z"/><path d="M18.2 14.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8z"/>',
 trophy:'<path d="M8 4h8v5a4 4 0 01-8 0z"/><path d="M8 6H5.5v1.2A3 3 0 008 10.2M16 6h2.5v1.2a3 3 0 01-2.5 3M12 13.2V17M8.5 20.5h7M10 17h4"/>',
 life:'<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="3.4"/><path d="M6 6l3.6 3.6M18 6l-3.6 3.6M6 18l3.6-3.6M18 18l-3.6-3.6"/>',
 sliders:'<path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="17" r="2"/>',
 check:'<path d="M5.5 12.5l4.2 4.2L18.5 7.8"/>',
 leaf:'<path d="M5 19c-.5-8 4.5-13.5 14-14 .5 9-4.5 14.5-13 14z"/><path d="M5 19c2.6-3.8 5.6-6.8 9.5-9"/>',
 chat:'<path d="M4.5 5.5h15v10.5H10l-4.5 3.8V16H4.5z"/>',
 moon:'<path d="M19 14.8A7.6 7.6 0 019.2 5 7.6 7.6 0 1019 14.8z"/>',
 sunrise:'<path d="M3.5 18.5h17M7.2 18.5a4.8 4.8 0 019.6 0M12 6.5v3M5.8 10.8l1.9 1.9M18.2 10.8l-1.9 1.9"/>',
 flag:'<path d="M6 20.5V4.5M6 5h11l-2.2 3.4L17 12H6"/>',
 heart:'<path d="M12 19.8S4.5 15.4 4.5 9.9A3.9 3.9 0 0112 8.2a3.9 3.9 0 017.5 1.7c0 5.5-7.5 9.9-7.5 9.9z"/>',
 wave:'<path d="M3 15c2-4 4-4 6 0s4 4 6 0 4-4 6 0M3 9.5c2-4 4-4 6 0s4 4 6 0 4-4 6 0"/>',
 timer:'<circle cx="12" cy="13.5" r="7"/><path d="M12 9.5v4l2.6 1.6M9.5 3.5h5"/>',
 crown:'<path d="M4.5 17.5l-1-9 5 4 3.5-6.5 3.5 6.5 5-4-1 9z"/><path d="M5 20.5h14"/>',
 bolt:'<path d="M13 3L5.5 13.5H11L10 21l8-11h-5.5z"/>',
 flame:'<path d="M12 21.5c-3.6 0-6.2-2.5-6.2-6 0-3.1 2-4.9 3.3-6.7.2 1.7 1 2.7 2 3.2-.1-3.4 1.5-6.3 3.7-8.5.2 3.2 1.8 4.9 2.8 6.8.6 1.1.8 2.3.8 3.7 0 4.3-2.7 7.5-6.4 7.5z"/><path d="M12 21.5c-1.5 0-2.6-1.1-2.6-2.6 0-1.7 1.3-2.6 2.6-4.3 1.3 1.7 2.6 2.6 2.6 4.3 0 1.5-1.1 2.6-2.6 2.6z"/>',
 plug:'<path d="M9 3.5v4M15 3.5v4M6.5 7.5h11V11a5.5 5.5 0 01-11 0zM12 16.5V21"/>',
 book:'<path d="M5 4.5h10.5a3 3 0 013 3V20H8a3 3 0 01-3-3z"/><path d="M5 17a3 3 0 013-3h10.5"/>',
 shield:'<path d="M12 3.5l7 2.8v5.2c0 4.4-2.9 7.6-7 9-4.1-1.4-7-4.6-7-9V6.3z"/><path d="M9 12l2.2 2.2L15.5 10"/>',
 compass:'<circle cx="12" cy="12" r="8.5"/><path d="M15.5 8.5l-2 5-5 2 2-5z"/>',
 star:'<path d="M12 3.6l2.6 5.4 5.9.8-4.3 4.1 1 5.8L12 16.9l-5.2 2.8 1-5.8L3.5 9.8l5.9-.8z"/>',
 wind:'<path d="M3.5 9h10.5a2.7 2.7 0 10-2.7-2.7M3.5 13.5h15a2.7 2.7 0 11-2.7 2.7M3.5 18h6"/>',
 dots:'<circle cx="6" cy="9" r="1.7"/><circle cx="12" cy="6" r="1.7"/><circle cx="18" cy="9" r="1.7"/><circle cx="8.5" cy="15.5" r="1.7"/><circle cx="15.5" cy="15.5" r="1.7"/>',
 dice:'<rect x="4" y="4" width="16" height="16" rx="3.8"/><circle cx="9" cy="9" r="1.2"/><circle cx="15" cy="9" r="1.2"/><circle cx="12" cy="12" r="1.2"/><circle cx="9" cy="15" r="1.2"/><circle cx="15" cy="15" r="1.2"/>',
 glass:'<path d="M7 3h10l-.8 6.5a4.2 4.2 0 0 1-8.4 0L7 3Z"/><path d="M7.4 6.5h9.2"/><path d="M12 14v6.5"/><path d="M8.5 20.5h7"/>',
 lock:'<rect x="5.5" y="10.5" width="13" height="9.5" rx="2.5"/><path d="M8.5 10.5V8a3.5 3.5 0 017 0v2.5"/>',
 copy:'<rect x="8.5" y="8.5" width="11" height="11" rx="2.5"/><path d="M15.5 8.5V6.5a2 2 0 00-2-2h-7a2 2 0 00-2 2v7a2 2 0 002 2h2"/>',
 play:'<path d="M8 5.5v13l10.5-6.5z"/>',
 pause:'<path d="M9 5.5v13M15 5.5v13"/>',
 stop:'<rect x="6.5" y="6.5" width="11" height="11" rx="2.5"/>',
 mic:'<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21"/>',
 back:'<path d="M14.5 5.5L8 12l6.5 6.5"/>',
 next:'<path d="M9.5 5.5L16 12l-6.5 6.5"/>',
 pencil:'<path d="M5 19l1-4.2L16.6 4.2a1.9 1.9 0 012.7 2.7L8.7 17.5z"/><path d="M14.5 6.4l3 3"/>',
 up:'<path d="M6 14.5l6-6 6 6"/>',
 down:'<path d="M6 9.5l6 6 6-6"/>',
 trash:'<path d="M5 7h14M10 7V4.5h4V7M7 7l.8 12h8.4L17 7"/>',
 phone:'<rect x="7" y="3" width="10" height="18" rx="2.5"/><path d="M11 18h2"/>',
 plus:'<path d="M12 5v14M5 12h14"/>',
 x:'<path d="M6 6l12 12M18 6L6 18"/>',
 ext:'<path d="M13.5 5.5H19v5.5M19 5.5l-8 8M17 14v4a1.5 1.5 0 01-1.5 1.5h-9A1.5 1.5 0 015 18V9a1.5 1.5 0 011.5-1.5H10"/>',
 gear:'<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>',
 more:'<circle cx="5.5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="18.5" cy="12" r="1.5"/>'
};

/* ------------------------------------------------------------------------------------------------
   picked: the data and pure helpers behind SOS, the tools, the day and the lessons
   ------------------------------------------------------------------------------------------------ */
const WIN_WHY={wait:'Waited first',sunrise:'Sunrise check',rekindle:'Rekindled',log:'Logged honestly',ride:'Rode it out',pause:'Paused first',bounce:'Bounced back',checkin:'Check-in done',reach:'Reached out',lights:'Screens off on time',wind:'Wind-down done',morning:'Morning questions done',calm:'Calm move',lesson:'Lesson done',reread:'Read it again',phone:'Phone put away'};
function rangeLabel(lo,hi){
 const a=fmtDate(lo,{month:'short',day:'numeric'});
 return a+' to '+(lo.slice(0,7)===hi.slice(0,7)?fmtDate(hi,{day:'numeric'}):fmtDate(hi,{month:'short',day:'numeric'}));
}
const pct=v=>v==null?'–':Math.round(v*100)+'%';
const one=v=>v==null?'–':(Math.round(v*10)/10).toFixed(1);
const STOP_IC={morning:'sunrise',lesson:'book',evening:'pencil',night:'moon'};
const STOP_WHEN={morning:'Morning',lesson:'Daytime',evening:'Evening',night:'Night'};
const HX_NEXT={
 morning:{ic:'sunrise',t:'Last night',s:'2 quick taps',pts:5},
 lesson:{ic:'book',pts:10},
 evening:{ic:'pencil',t:'Check-in',s:'About a minute',pts:10},
 night:{ic:'moon',t:'Wind-down',s:'A few minutes',pts:15}
};
const STATUS_TXT={clean:'No slip',tracked:'Logged',events:'No check-in',empty:'No entry',unknown:'Away'};
const TOOL_GROUPS=[['calm','Calm your body'],['ride','Ride the wave'],['scene','Change the scene'],['connect','Reach out']];
const TOOLS=[
 {id:'breathe',name:'Breathe',desc:'Slow it down',ic:'wind',tone:'sky',g:'calm'},
 {id:'ground',name:'5-4-3-2-1',desc:'Come back to the room',ic:'dots',tone:'mint',g:'calm'},
 {id:'stack',name:'Fit the shapes',desc:'Fill a line, watch it clear',ic:'sparkle',tone:'sky',g:'calm'},
 {id:'curious',name:'Get curious',desc:'Watch the wave',ic:'wave',tone:'accent',g:'ride'},
 {id:'pause',name:'10-minute pause',desc:'Let the wave pass',ic:'timer',tone:'sun',g:'ride'},
 {id:'thought',name:'Name the thought',desc:'A thought is not an order',ic:'sparkle',tone:'violet',g:'ride'},
 {id:'feel',name:'Name the feeling',desc:'Find the word for it',ic:'ask',tone:'violet',g:'ride'},
 {id:'forward',name:'Play it forward',desc:'Picture the next hour',ic:'compass',tone:'mint',g:'ride'},
 {id:'move',name:'Move',desc:'Two minutes, body first',ic:'bolt',tone:'coral',g:'scene'},
 {id:'bed',name:'Go to bed',desc:'Phone away, a plan for the thoughts',ic:'moon',tone:'accent',g:'scene'},
 {id:'surprise',name:'Surprise me',desc:'A random calm move',ic:'dice',tone:'violet',g:'scene'},
 {id:'halt',name:'What do I need?',desc:'Hungry, lonely, tired?',ic:'heart',tone:'sun',g:'scene'},
 {id:'message',name:'Reach a person',desc:'Texts ready to send',ic:'chat',tone:'sky',g:'connect'},
 {id:'reasons',name:'My reasons',desc:'Remember why',ic:'star',tone:'sun',g:'connect'}
];
const TK='daybook.timer',PAUSE_MS=600000;
const PATTERNS={
 calm:{name:'Calm',desc:'in 4 · out 6',ph:[['in',4],['out',6]]},
 box:{name:'Box',desc:'4 · 4 · 4 · 4',ph:[['in',4],['hold',4],['out',4],['hold',4]]},
 slow:{name:'4-7-8',desc:'in 4 · hold 7 · out 8',ph:[['in',4],['hold',7],['out',8]]},
 /* a double breath in, then a long breath out ("cyclic sighing" in the research; see lesson 14) */
 sigh:{name:'Sigh',desc:'in · in again · long out',ph:[['in1',2],['in2',1],['out',6]]}
};
const PH_TXT={in:'Breathe in',in1:'Breathe in',in2:'A little more',hold:'Hold',out:'Breathe out'};
function breathPhase(pat,sec){
 const ph=PATTERNS[pat].ph,total=ph.reduce((a,b)=>a+b[1],0),cyc=Math.floor(sec/total);
 let x=sec-cyc*total;
 for(let i=0;i<ph.length;i++){
  if(x<ph[i][1])return {idx:cyc*ph.length+i,k:ph[i][0],dur:ph[i][1],left:Math.ceil(ph[i][1]-x)};
  x-=ph[i][1];
 }
 return {idx:cyc*ph.length,k:ph[0][0],dur:ph[0][1],left:ph[0][1]};
}
const UR_STR=[['low','A little'],['mid','Strong'],['high','Very strong']];
const UR_STR_NAME={low:'A little',mid:'Strong',high:'Very strong'};
const UR_STR_ADJ={low:'small',mid:'strong',high:'very strong'};
const UR_DID={message:'reach'};
const UR_META={
 breathe:{mins:'3 min',does:'Starts right away. A long breath out.'},
 ground:{mins:'About 2 min',does:'Brings you back to the room.'},
 stack:{mins:'About 1 min',does:'A block puzzle for the eyes and hands. The pictures in your head fade.'},
 curious:{mins:'About 2 min',does:'Watch the wave rise and fall.'},
 halt:{mins:'About 1 min',does:'Finds what you actually need.'},
 surprise:{mins:'A few min',does:'One small thing, away from the screen.'},
 message:{mins:'About 2 min',does:'Your safe person, or a free line.'},
 reasons:{mins:'About 1 min',does:'Why you are doing this.'},
 pause:{mins:'Up to 10 min',does:'A timer. Phone down, step away.'},
 move:{mins:'2 min',does:'Body first, decision later.'},
 bed:{mins:'2 min',does:'Phone away, lights off, and a plan for the thoughts.'},
 thought:{mins:'About 1 min',does:'A thought is not an order.'},
 feel:{mins:'About 1 min',does:'Put a word on the feeling.'},
 forward:{mins:'About 1 min',does:'Picture the next hour both ways.'}
};
const UR_FIT={
 late:  {breathe:6,stack:4,ground:4,curious:6,halt:4,surprise:2,message:3,reasons:5,pause:5,move:3,bed:9,thought:5,feel:4,forward:6},
 lonely:{breathe:4,stack:3,ground:3,curious:5,halt:6,surprise:3,message:9,reasons:6,pause:2,move:3,bed:2,thought:5,feel:6,forward:5},
 bored: {breathe:3,stack:7,ground:4,curious:5,halt:4,surprise:8,message:3,reasons:4,pause:3,move:8,bed:1,thought:4,feel:4,forward:4},
 stress:{breathe:9,stack:5,ground:8,curious:6,halt:5,surprise:4,message:5,reasons:4,pause:3,move:8,bed:2,thought:5,feel:5,forward:4},
 tired: {breathe:5,stack:3,ground:3,curious:4,halt:7,surprise:3,message:2,reasons:4,pause:4,move:3,bed:9,thought:4,feel:4,forward:5},
 scroll:{breathe:4,stack:7,ground:6,curious:5,halt:4,surprise:7,message:3,reasons:4,pause:4,move:7,bed:5,thought:6,feel:5,forward:6},
 other: {breathe:6,stack:5,ground:5,curious:7,halt:6,surprise:4,message:3,reasons:5,pause:3,move:5,bed:3,thought:7,feel:6,forward:6}
};
const UR_STRN={low:{pause:-3,halt:1,reasons:1,curious:1,forward:1,thought:1,feel:1},mid:{pause:-1},high:{breathe:2,ground:2,move:2,pause:2,curious:-2,surprise:-1,reasons:-1,forward:-1,thought:-1,feel:-1}};
const UR_PREF=['breathe','move','ground','stack','thought','halt','feel','reasons','curious','forward','message','surprise','pause','bed'];
const UR_TRIG_PH={late:'late at night',lonely:'you felt lonely or low',bored:'you were bored',stress:'you were stressed',tired:'you were tired',scroll:'after scrolling'};
const urRate=r=>r&&r.n?(r.w+1)/(r.n+2):.5;
const urLift=r=>!r?0:(urRate(r)-.5)*12*Math.min(1,r.n/3)+Math.min(3,r.l*.5)*Math.max(0,1-r.n/3);
const UR_BED_WITH=['thought','forward','curious','reasons','ground','breathe'];
const UR_DO={
 base:['Phone down for a moment.','Unclench your jaw. Drop your shoulders.','Feet on the floor.'],
 night:['Sit up, feet on the floor.','Turn a light on. Sit up.'],
 high:['Eyes off the screen. Breathe out slowly.','Squeeze your fists hard. Now let go.'],
 again:['Still here. That is okay.','Strong is not stuck. Try something different.','Waves can come back. Pick the next thing.'],
 sets:['Back again. That is okay. Waves often come in sets.']
};
const UR_KNOW=[
 {t:'An urge usually rises, peaks, and passes. Your job is to outlast this one, not to win.',l:'l2',f:['low','mid','stress','other','none']},
 {t:'You are not trying to feel nothing. You are making a gap between the urge and what you do next.',l:'l2'},
 {t:'Waiting before you decide is a skill, and it gets easier with practice.',l:'l2',f:['mid']},
 {t:'Putting a feeling into a few words can take some of the charge out of it.',l:'l13',f:['stress','lonely','other','none']},
 {t:'Late nights and low moods make urges harder for many people. Plan for those hours, and go easy on yourself in them.',l:'l4',f:['late','tired','lonely']},
 {t:'Habits live in places. Moving to another room, or moving your phone, changes the pull.',l:'l10',f:['late','scroll','bored']},
 {t:'A plan made ahead (“if this, then I will”) tends to be easier to follow than deciding in the middle of an urge.',l:'l9'},
 {t:'Shame tends to make things harder. Treating yourself kindly makes the next try easier.',l:'l5'},
 {t:'Secrets are heavy to carry. Telling one safe person can lighten the load.',l:'l7',f:['lonely']},
 {t:'Different tools work on different days. Trying a new one is useful information.'},
 {t:'A slow breath with a long breath out is a small, free tool. One minute is enough to try.',l:'l14',f:['stress','high','late']},
 {t:'Moving for a minute or two can ease a craving. Move first, then decide.',l:'l15',f:['bored','tired','stress','high']},
 {t:'“Just once” is a thought, not an order. You can notice it and still choose.',l:'l16',f:['scroll','other','none','mid']},
 {t:'Look at what came just before this. An earlier step is much easier to change than the last one.',l:'l17',f:['late','scroll','bored']},
 {t:'Strong self-control mostly means fewer fights. Set things up so there is less to fight.',l:'l20',f:['scroll','late','tired']}
];
const UR_LPREF={
 slipped:['l3','l6','l5','l21','l17','l12','l18','l22','l31','l32'],
 late:['l4','l10','l9','l17','l20','l23','l30'],
 lonely:['l4','l7','l13','l8','l23'],
 bored:['l23','l15','l10','l20','l9','l13'],
 stress:['l14','l13','l15','l2','l9','l16','l30'],
 tired:['l4','l13','l10','l20','l9'],
 scroll:['l10','l17','l20','l16','l2','l9'],
 other:['l2','l16','l13','l18','l9','l19','l1'],
 none:['l2','l19','l16','l9','l13','l1']
};
const UR_TR_T={p:'it passed',s:'still strong',x:'slipped'};
function urMinText(m){return m<1?'under a minute':m===1?'1 minute':m+' minutes'}
const DONE_MSG={ground:'You came back to the room.',stack:'Eyes busy, urge quieter.',reasons:'Good to remember.',surprise:'Small things add up.',curious:'You watched it. That is the skill.',
 move:'Body first. Nice work.',forward:'You picked the better hour.',thought:'A thought is not an order.',bed:'Ready for tonight.'};
const CU_BODY=[['chest','Chest'],['stomach','Stomach'],['groin','Groin'],['throat','Throat or jaw'],['hands','Hands or arms'],['head','Head'],['all','All over'],['unsure','Not sure']];
const CU_FEEL=[['tight','Tight'],['hot','Hot'],['buzzy','Buzzy'],['heavy','Heavy'],['hollow','Hollow'],['restless','Restless'],['else','Something else']];
const CU_WHERE={chest:'in your chest',stomach:'in your stomach',groin:'in your groin',throat:'in your throat or jaw',hands:'in your hands or arms',head:'in your head',all:'all over'};
const CU_CHG=[['bigger','Bigger'],['same','About the same'],['smaller','Smaller']];
const CU_SAY={bigger:'Waves often build before they fall. Keep watching. You do not have to do anything about it.',same:'Steady is fine. You are watching it, not obeying it.',smaller:'That is the wave going down, and you let it.'};
const CU_MS=90000;
const CU_D='M10 96 C 46 96, 62 76, 82 50 S 112 10, 128 10 S 158 38, 178 64 S 220 96, 250 96';
const GROUND=[
 [5,'See','Look around you. Name 5 things you can see.'],
 [4,'Feel','Notice 4 things you can feel: the chair, your clothes, the floor.'],
 [3,'Hear','Listen for 3 sounds. Near ones and far ones.'],
 [2,'Smell','Find 2 things you can smell, or 2 smells you like.'],
 [1,'Taste','Notice 1 thing you can taste. Or take a sip of water.']
];
const NEEDS=[
 ['hungry','Hungry','Eat something real and drink a glass of water. Running on empty makes everything harder.',null],
 ['angry','Angry or stressed','Move it out of your body first: two minutes of push-ups or a fast walk, or squeeze and let go in your seat. Then write one sentence about what is bugging you.',['move','Move for 2 minutes']],
 ['lonely','Lonely','Reach out to one person. A short text counts. Or go where other people are.',['message','Reach a person']],
 ['tired','Tired','If it is late, the best move is bed, with the phone charging in another room. In the daytime, rest for ten minutes or step outside.',null],
 ['bored','Bored or restless','Give your hands or legs a job for ten minutes: tidy, a hobby, a walk.',['surprise','Surprise me']]
];
const TEXTS=[
 'Hey, thinking of you. How is your week going?',
 'Kind of a rough evening. Can you talk for five minutes?',
 'Trying not to be alone with my phone right now. Can you text me back about anything?'
];
const FREE_LINES=[['Crisis Text Line','Text HOME to 741741','Free, 24/7. A trained volunteer, for whatever you are going through.','741741'],
 ['988 Lifeline','Call or text 988','Free, 24/7. Open to anyone who is struggling, not only in a crisis.','988']];
const MOVES=[['pushups','Push-ups','On the floor, or against a wall'],['squats','Squats','Slow, or down to a chair'],['walk','Walk','Stairs, a hallway, or outside'],['jacks','Jumping jacks','Or march in place'],['shake','Shake it out','Arms, legs, the whole body'],['wallsit','Wall sit or plank','Hold, rest, hold again']];
const MOVE_MS=120000;
const FWD_A=[['ashamed','Ashamed'],['tired','Tired'],['empty','Empty'],['annoyed','Annoyed with myself'],['behind','Behind on things'],['alone','More alone'],['okay','Honestly, okay']];
const FWD_B=[['proud','Proud'],['calm','Calm'],['clear','Clear-headed'],['rested','Rested'],['me','More like myself'],['close','Closer to people'],['unsure','Not sure yet']];
const THOUGHTS=[['once','Just once will not hurt'],['deserve','I deserve this'],['blown','I already blew it today'],['cant','I cannot handle this feeling'],['nobody','Nobody will know'],['tired','I am too tired to fight it'],['last','This is the last time']];
const thoughtIn=t=>{const s=String(t||'').trim().replace(/[.!?]+$/,'');return /^I\b/.test(s)?s:s.charAt(0).toLowerCase()+s.slice(1)};
const BED=[['phone','Phone charging outside the bedroom','Or across the room, out of reach.'],['alarm','Alarm set','A clock, or the phone across the room.'],['lights','Lights off','Screens off too.']];
const LIST_OF={addmove:['menu',24,'calm moves'],addwind:['wind',10,'wind-down list'],addword:['words',WORDS_MAX,'words that steady me']};
const LX_E={hook:['bolt','The thought'],insight:['sparkle','The idea'],proof:['chart','The proof'],turn:['chat','Your turn'],guess:['ask','Take a guess'],recall:['sparkle','Quick recall'],step:['flag','Next step'],
 predict:['ask','Make a guess'],answer:['sparkle','The answer'],move:['flag','What to do'],check:['check','Check it']};
const LCHECK_N=16,LWRITE_LEN=1500;
const LCHECKS=[
 {t:'Start small, ride the wave',q:['What part of you wants this, and what part is unsure? Write both.','Think of your last urge. Where did you feel it first, and what did it do over the next few minutes?','What is one small thing you will try the next time an urge shows up?']},
 {t:'Slips and the hard hours',q:['When did “I blew it” last show up for you? What did you do next?','Which pulls harder for you, tired or lonely? Describe a recent time.','Write the sentence you want ready after a slip, and one change you will make for the hard hours.']},
 {t:'Shame and kindness',q:['Write one harsh sentence you say to yourself. Now write it again as something that happened, not as who you are.','What would you say to a friend in your exact spot?','Say that to yourself, in your own words. Then write one way you will remember it.']},
 {t:'Not carrying it alone',q:['What is the heaviest part of keeping this to yourself?','Who is one person who could know? What would you ask of them?','What is one small step toward people that you could take this week?']},
 {t:'Plans and settings',q:['Write your strongest if-then: If ___, then I will ___.','Which place, hour, or device sets off the pull most? Describe it.','What is the first change you will make to that setting, and when?']},
 {t:'Help and progress',q:['What word do you use for this, if any, and what kind of help fits it?','Describe what better would look like in a month. Include things that are not a number.','What is the first kind of help you will look into, and what would make it easier to start?']},
 {t:'Naming it and breathing out',q:['What feeling do you most often skip past? Name it in a word or two.','Think of a recent hard moment. What did the feeling do once you named it, or what might it do?','When in your day will you try a long breath out? Be specific.']},
 {t:'Moving and noticing thoughts',q:['Which one-minute movement could you actually do? Write it.','What thought shows up first when an urge starts? Write it exactly as it sounds.','How will you answer that thought? Write it: notice it, name it, choose.']},
 {t:'Early links and permission',q:['Walk back from your last slip. What was the earliest small yes?','What permission thought do you hear most? Write it word for word.','Write a short answer to that thought, and what you would do at the earliest link.']},
 {t:'Your log and fewer fights',q:['What has your log taught you so far? Even one line counts.','Which fight do you keep having with yourself?','What could you change so that fight happens less?']},
 {t:'Missed days and values',q:['What will you do the day after you miss one? Keep it small.','What bothers you most: losing control, a clash with your values, or both? Explain.','What does that tell you about the kind of help or support you want?']},
 {t:'The empty hour and therapy',q:['Which hour is hardest? What will you put in it?','What makes it hard to start that, and what would make it easier?','What is one question you would ask a therapist, and what would you want from them?']},
 {t:'Two programs',q:['Which step or point sounds closest to where you are? Why?','Which tool from either program would you try first?','What would trying it look like this week?']},
 {t:'Pausing and groups',q:['Where in your day could a one-minute pause fit?','Who or what group could you try first, even just to listen?','Write the first sentence you would say to ask someone to check in.']},
 {t:'Faith and a plan',q:['How do you want faith to be part of your plan?','Write the words you will say in a hard moment.','What is the next small thing you will do after you say them?']},
 {t:'Guilt, forgiveness, a fresh start',q:['Write one honest line about what you are carrying.','What would forgiving yourself change about your next step, without excusing what happened?','What is one careful way to make things right, and who could help you do it?']}
];
const RCATS=[
 {id:'rel',name:'Relationships',ic:'heart',tone:'coral',words:/relationship|marri|partner|wife|husband|spouse|girlfriend|boyfriend|dating|romanc|love|famil|friend|intima|connect|trust|father|mother|\bdad\b|\bmom\b|kids|child/i},
 {id:'foc',name:'Energy and focus',ic:'bolt',tone:'sky',words:/focus|energy|work|career|sleep|tired|product|concentrat|clear|fog|mind|health|study|school|money|morning|time/i},
 {id:'val',name:'Values',ic:'star',tone:'violet',words:/value|faith|\bgod\b|pray|church|spirit|integrity|honest|character|belief|believe|purpose|soul|proud|my word|respect/i},
 {id:'oth',name:'Something else',ic:'leaf',tone:'mint',words:null}
];
function reasonGuess(text){for(let i=0;i<3;i++)if(RCATS[i].words.test(text))return RCATS[i];return RCATS[3]}
function reasonCat(st,text){
 const m=((st&&st.rmeta)||[]).find(x=>x.t===text);
 return (m&&RCATS.find(c=>c.id===m.c))||reasonGuess(text);
}
const cleanReason=s=>String(s==null?'':s).replace(/\s+/g,' ').trim().slice(0,REASON_LEN);
const sameReason=(a,b)=>a.toLowerCase()===b.toLowerCase();
const SERIES=[['m','Motivation'],['c','Connection'],['e','Energy'],['s','Stress']];
const REVIEW_QS=[
 ['hard','Hardest moment this week'],['helped','What helped'],['change','One change for next week'],['proud','Something I am proud of']
];
const HELP_PAGES={
 people:{t:'Talk to a person',s:'Free, day and night',ic:'chat',tone:'coral',tile:'Hotlines and helplines'},
 therapy:{t:'Therapy on a small budget',s:'Free and low-cost routes, and how to choose',ic:'heart',tone:'violet',tile:'Free and low-cost routes'},
 groups:{t:'Free groups',s:'Peer support, online and in person',ic:'dots',tone:'mint',tile:'Peer support'},
 faith:{t:'Faith and recovery',s:'God in your recovery, with things to do',ic:'star',tone:'sun',tile:'Prayer, words, and people'},
 phone:{t:'Phone and night setup',s:'Make the urge harder to act on',ic:'phone',tone:'sky',tile:'Make the urge harder'},
 say:{t:'What to say',s:'Scripts you can copy',ic:'copy',tone:'sun',tile:'Scripts to copy'},
 plan:{t:'My plan',s:'Safety net, urge plan, slip plan',ic:'shield',tone:'accent',tile:'Safety net and steps'},
 playbook:{t:'My playbook',s:'My reasons, my plan, and what the lessons gave me',ic:'compass',tone:'violet',tile:'All of it on one page'}
};
const HELP_SUBS={
 therapy:[['start','Ways to start'],['choose','Choosing someone']],
 phone:[['iphone','iPhone'],['android','Android'],['computer','Computer'],['night','Nights']],
 plan:[['safety','Safety net'],['urge','Urge plan'],['slip','Slip plan'],['steps','Next steps']]
};
function slipClean(a){return (a||[]).map(x=>String(x==null?'':x).trim()).filter(Boolean)}
const HELP_SRC=[['https://988lifeline.org/','988 Suicide & Crisis Lifeline'],['https://www.crisistextline.org/text-us/','Crisis Text Line'],['https://www.samhsa.gov/find-help/helplines/national-helpline','SAMHSA National Helpline'],['https://www.stopitnow.org/helpnow','Stop It Now helpline'],['https://www.nami.org/','NAMI'],['https://nami.org/Support-Education/NAMI-HelpLine/NAMI-Warmline-Directory','NAMI: warmline directory'],['https://openpathcollective.org/','Open Path Collective: prices and membership'],['https://findahealthcenter.hrsa.gov/','HRSA: find a health center'],['https://findtreatment.gov/','SAMHSA: findtreatment.gov'],['https://www.cms.gov/medical-bill-rights/know-your-rights/no-insurance','CMS: Good Faith Estimate'],['https://meetings.smartrecovery.org/','SMART Recovery meetings'],['https://saa-recovery.org/meetings/','Sex Addicts Anonymous'],['https://slaafws.org/meetings','Sex and Love Addicts Anonymous'],['https://sa.org/meetings/','Sexaholics Anonymous'],['https://www.celebraterecovery.com/','Celebrate Recovery'],['https://support.apple.com/guide/iphone/block-apps-app-downloads-websites-purchases-iph3ff83f3b1/ios','Apple: restrict websites'],['https://support.apple.com/en-us/126533','Apple: Screen Time passcode'],['https://cleanbrowsing.org/','CleanBrowsing'],['https://www.cdc.gov/sleep/about/','CDC: sleep']];
const OB_KEYS=['habit','aim','freq','mins','years','tried','faith','creed','b0','b1','b2','b3','b4','costs','ownCost','when','goal','so','then','thenT'];
const obLab=(list,v)=>{const x=list.find(o=>o[0]===v);return x?x[1]:''};
const obCap=s=>s?s.charAt(0).toUpperCase()+s.slice(1):'';
function obTool(t){
 const fit=UR_FIT[t]||UR_FIT.other;let best=null;
 UR_PREF.forEach(id=>{if(['bed','message','breathe'].indexOf(id)>=0)return;if(best==null||(fit[id]||0)>(fit[best]||0))best=id});
 return TOOLS.find(x=>x.id===best)||TOOLS[1];
}
const CHEERS=['Hi! I get brighter every time you take a step.','You showed up. That is the whole thing.','Slow and steady is still moving.','Honest with yourself. I like that.','A calm minute counts. So does this one.','Warm and glowing over here.','One small thing next?','Proud of you for being here.'];

export {recordFrom,
  TRIGGERS,
  DIDS,
  BUCKETS,
  TRIG_T,
  DID_T,
  BUCKET_T,
  OPT_ID,
  OPT_MAX,
  OPT_KEEP,
  OPT_LEN,
  isOptId,
  cleanOptLabel,
  DID_MORE,
  didIds,
  didToggle,
  didAdd,
  normOptList,
  normOpts,
  mergeOpts,
  optText,
  trigText,
  didText,
  TRIG_HOURS,
  trigFits,
  optList,
  TOOL_IDS,
  LESSON_IDS,
  LNOTE_LEN,
  FAITH_IDS,
  FAITH_MODES,
  WORDS_MAX,
  WORDS_LEN,
  ROUTINE,
  ROUTINE_KEYS,
  MORNING_END,
  LESSON_WIN_FROM,
  normRoutine,
  normOv,
  SAFETY,
  URGE_PLAN,
  SLIP_STEPS,
  SLIP_MAX,
  SLIP_LEN,
  HELP_STEPS,
  THERAPIST_CRIT,
  WIND_DEFAULT,
  MENU_DEFAULT,
  SCRIPTS,
  REASON_DEFAULT,
  REASON_MAX,
  REASON_LEN,
  RCAT_IDS,
  p2,
  keyOfDate,
  utcOf,
  addDays,
  diffDays,
  logicalKey,
  clockOf,
  fmtClock,
  fmtHour,
  fmtDate,
  bucketOf,
  sortMin,
  maxKey,
  minKey,
  clone,
  newId,
  isKey,
  isTime,
  minOf,
  fmtLeft,
  cleanList,
  reasonsFromWhy,
  defaultSettings,
  normSeen,
  normLearn,
  normSettings,
  cleanTag,
  cleanTags,
  normEvent,
  normCheckin,
  pEmpty,
  normP,
  blankP,
  pActive,
  routineOn,
  normDay,
  sumDay,
  sortedEvents,
  phaseOf,
  statusOf,
  allKeys,
  eventsOf,
  cleanLimit,
  dayKind,
  BACK_DAYS,
  rkThirdOf,
  rkFullDays,
  runLedger,
  streaks,
  roughPatch,
  reachedOn,
  computeMetrics,
  weekOf,
  weekRange,
  weekStats,
  STEP_RUNGS,
  evMs,
  slipMoments,
  fmtStretch,
  fmtStretchShort,
  slipsInWeek,
  stepView,
  PATTERN_ROWS,
  patterns,
  hourBins,
  triggerCounts,
  perDayCounts,
  timesPerDay,
  topTrigger,
  busiestWindow,
  rangeKeys,
  rangeStart,
  csvCell,
  csvRow,
  eventsCsv,
  daysCsv,
  SETUP_PTS,
  WIDGET_PTS,
  WINS,
  morningInfo,
  winsOf,
  winTally,
  dayPoints,
  rkOf,
  QUEST_POOL,
  weekGame,
  QUEST_ROUTINE,
  questsFor,
  BADGES,
  totalPoints,
  gameStats,
  gameCompute,
  rhythm,
  minToClock,
  NOTES,
  dailyNote,
  Em,
  sunSvg,
  LUNITS,
  ltext,
  lchoose,
  ltry,
  bP,
  bQ,
  bL,
  SRC,
  LESSONS,
  OB_AIM,
  OB_FREQ,
  OB_MINS,
  OB_YEARS,
  OB_TRIED,
  OB_FAITH,
  OB_BPS,
  OB_BPS_C,
  OB_COST,
  OB_WHEN,
  OB_TOP,
  OB_THEN,
  OB_PEAK,
  OB_SO,
  OB_GOALS,
  OB_GWHY,
  OB_RS,
  OB_RS_BASE,
  OB_BIBLE_H,
  OB_LANG_H,
  OB_GUESS,
  OB_SRC,
  normOnb,
  obScore,
  obHours,
  obRnd,
  obHrs,
  obTop,
  ICO,
  WIN_WHY,
  rangeLabel,
  pct,
  one,
  STOP_IC,
  STOP_WHEN,
  HX_NEXT,
  STATUS_TXT,
  TOOL_GROUPS,
  TOOLS,
  TK,
  PAUSE_MS,
  PATTERNS,
  PH_TXT,
  breathPhase,
  UR_STR,
  UR_STR_NAME,
  UR_STR_ADJ,
  UR_DID,
  UR_META,
  UR_FIT,
  UR_STRN,
  UR_PREF,
  UR_TRIG_PH,
  urRate,
  urLift,
  UR_BED_WITH,
  UR_DO,
  UR_KNOW,
  UR_LPREF,
  UR_TR_T,
  urMinText,
  DONE_MSG,
  CU_BODY,
  CU_FEEL,
  CU_WHERE,
  CU_CHG,
  CU_SAY,
  CU_MS,
  CU_D,
  GROUND,
  NEEDS,
  TEXTS,
  FREE_LINES,
  MOVES,
  MOVE_MS,
  FWD_A,
  FWD_B,
  THOUGHTS,
  thoughtIn,
  BED,
  LIST_OF,
  LX_E,
  LCHECK_N,
  LWRITE_LEN,
  LCHECKS,
  RCATS,
  reasonGuess,
  reasonCat,
  cleanReason,
  sameReason,
  SERIES,
  REVIEW_QS,
  HELP_PAGES,
  HELP_SUBS,
  slipClean,
  HELP_SRC,
  OB_KEYS,
  obLab,
  obCap,
  obTool,
  CHEERS
};
