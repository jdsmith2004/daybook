/* Scenes for lessons told as a story (see story-kit.tsx and story-scenes-h.tsx): lesson 54 (the rested self and the worn-out self, any hour of
   the day) and lesson 55 (how twenty seconds of reach changes what people do). Every person is a simple, fully clothed figure. */
import { type ComponentType, type ReactNode } from 'react';
import { ClipPath, Circle, Defs, Ellipse, G, Path, Rect } from 'react-native-svg';

import { BEAR_LINE, Frame, type Ink, Person, Say } from './story-kit';

const BROWN = '#8A5A2B';
const GOLD = '#FFD25A';
const GOLD_DK = '#C98F1A';
const WHITE = '#FFFFFF';
const GREEN = '#3F8F5B';
const SKIN = '#E8B98F';
const BLUE = '#4F6FA8';
const ORANGE = '#D9602A';
const TEAL = '#3F8F8A';
const BRICK = '#B5533C';
const WOOD = '#C9965B';
const CREAM = '#F6E3C6';
const RED = '#D4473F';
const INK = '#2A2438';

/* the line of words under a picture */
function Cap({ k, s }: { k: Ink; s: string }) {
  return <Say x={150} y={190} s={s} fill={k.ink} />;
}

/* the picture's own rounded panel, so it reads on a light page and a dark one */
function Panel({ id, fill, x = 10, w = 280, children }: { id: string; fill: string; x?: number; w?: number; children: ReactNode }) {
  return (
    <>
      <Defs>
        <ClipPath id={id}>
          <Rect x={x} y={10} width={w} height={152} rx={14} />
        </ClipPath>
      </Defs>
      <G clipPath={`url(#${id})`}>
        <Rect x={x} y={10} width={w} height={152} fill={fill} />
        {children}
      </G>
    </>
  );
}

/* a figure turned to face left: draw it at x, it is mirrored about x */
function Flip({ x, children }: { x: number; children: ReactNode }) {
  return <G transform={`translate(${2 * x} 0) scale(-1 1)`}>{children}</G>;
}

/* a person sitting, seen from the side: x and y are the hips, facing right */
function Sitter({ x, y, s = 1, fill, children }: { x: number; y: number; s?: number; fill: string; children?: ReactNode }) {
  return (
    <G transform={`translate(${x} ${y}) scale(${s})`}>
      <Rect x={-6} y={-12} width={32} height={13} rx={6} fill={fill} />
      <Rect x={16} y={-6} width={13} height={36} rx={6} fill={fill} />
      <Rect x={16} y={24} width={20} height={7} rx={3.5} fill={fill} />
      <Path d="M-11 0 L-11 -18 Q-11 -34 2 -34 Q15 -34 15 -18 L15 0 Z" fill={fill} />
      <Circle cx={2} cy={-44} r={10} fill={fill} />
      <Circle cx={6} cy={-44} r={1.7} fill={WHITE} />
      {children}
    </G>
  );
}

/* a battery icon: level is 0 to 1 */
function BatteryIcon({ x, y, w = 34, h = 18, level, color }: { x: number; y: number; w?: number; h?: number; level: number; color: string }) {
  const iw = (w - 6) * level;
  return (
    <G>
      <Rect x={x + w} y={y + h * 0.3} width={4} height={h * 0.4} rx={1.5} fill={BEAR_LINE} />
      <Rect x={x} y={y} width={w} height={h} rx={4} fill={WHITE} stroke={BEAR_LINE} strokeWidth={2} />
      {iw > 0 ? <Rect x={x + 3} y={y + 3} width={iw} height={h - 6} rx={2} fill={color} /> : null}
    </G>
  );
}

/* a chart of 21 small boxes, 3 rows of 7, the first `done` of them checked */
function Chart({ x, y, box, gap, done }: { x: number; y: number; box: number; gap: number; done: number }) {
  const pad = 5;
  const w = 7 * box + 6 * gap + pad * 2;
  const h = 3 * box + 2 * gap + pad * 2;
  return (
    <G>
      <Rect x={x} y={y} width={w} height={h} rx={4} fill={WHITE} stroke={BROWN} strokeWidth={2} />
      <Rect x={x + w / 2 - 9} y={y - 3} width={18} height={6} rx={2} fill={GOLD} stroke={GOLD_DK} strokeWidth={1} />
      {Array.from({ length: 21 }, (_, i) => {
        const bx = x + pad + (i % 7) * (box + gap);
        const by = y + pad + Math.floor(i / 7) * (box + gap);
        const on = i < done;
        return (
          <G key={i}>
            <Rect x={bx} y={by} width={box} height={box} rx={2} fill={on ? '#DDF1E2' : '#F3EFE6'} stroke={on ? GREEN : '#C9BFAE'} strokeWidth={1} />
            {on ? (
              <Path
                d={`M${bx + box * 0.22} ${by + box * 0.52} L${bx + box * 0.43} ${by + box * 0.74} L${bx + box * 0.8} ${by + box * 0.26}`}
                stroke={GREEN}
                strokeWidth={Math.max(1.8, box * 0.18)}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            ) : null}
          </G>
        );
      })}
    </G>
  );
}

/* a guitar standing upright: x, y is the middle of the lower bout, the neck points up */
function Guitar({
  x,
  y,
  s = 1,
  body = '#C9803A',
  dark = '#7A4B2A',
  hole = '#2A1E1A',
}: {
  x: number;
  y: number;
  s?: number;
  body?: string;
  dark?: string;
  hole?: string;
}) {
  return (
    <G transform={`translate(${x} ${y}) scale(${s})`}>
      <Rect x={-3.2} y={-86} width={6.4} height={66} rx={2} fill={dark} />
      <Rect x={-5.6} y={-96} width={11.2} height={14} rx={3} fill={dark} />
      <Circle cx={-3} cy={-92} r={1.4} fill={GOLD} />
      <Circle cx={3} cy={-92} r={1.4} fill={GOLD} />
      <Circle cx={-3} cy={-86} r={1.4} fill={GOLD} />
      <Circle cx={3} cy={-86} r={1.4} fill={GOLD} />
      <Ellipse cx={0} cy={-24} rx={13} ry={11} fill={body} />
      <Ellipse cx={0} cy={0} rx={17} ry={15} fill={body} />
      <Rect x={-9} y={-30} width={18} height={14} fill={body} />
      <Circle cx={0} cy={-8} r={5.4} fill={hole} />
      <Rect x={-6} y={9} width={12} height={3} rx={1.5} fill={dark} />
      <Path d="M-1 -20 L-1 9 M1 -20 L1 9" stroke={WHITE} strokeWidth={0.7} opacity={0.7} />
    </G>
  );
}

function Plant({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <G transform={`translate(${x} ${y}) scale(${s})`}>
      <Ellipse cx={0} cy={-26} rx={5} ry={13} fill={GREEN} transform="rotate(-25 0 -14)" />
      <Ellipse cx={0} cy={-28} rx={5} ry={14} fill="#2F7A4B" />
      <Ellipse cx={0} cy={-26} rx={5} ry={13} fill={GREEN} transform="rotate(25 0 -14)" />
      <Path d="M-9 -13 L9 -13 L7 0 L-7 0 Z" fill={BRICK} />
    </G>
  );
}

/* ---------- lesson 54: the rested self and the worn-out self ---------- */

/* a wall calendar: the highlighted row is the week; the arrow points on to the next one */
function Calendar({ x, y, row, arrow }: { x: number; y: number; row: number; arrow?: boolean }) {
  return (
    <G>
      <Rect x={x} y={y} width={46} height={44} rx={3} fill={WHITE} stroke={BROWN} strokeWidth={1.6} />
      <Rect x={x} y={y} width={46} height={10} rx={3} fill={RED} />
      <Rect x={x} y={y + 6} width={46} height={4} fill={RED} />
      <Rect x={x + 2} y={y + 14 + row * 9} width={42} height={8} rx={2} fill={GOLD} />
      {[0, 1, 2].map((r) =>
        [0, 1, 2, 3, 4, 5, 6].map((c) => (
          <Rect key={`${r}-${c}`} x={x + 4 + c * 6} y={y + 16 + r * 9} width={4} height={4} rx={1} fill={r === row ? BROWN : '#CFC6B6'} />
        )),
      )}
      {arrow ? (
        <G>
          <Path d={`M${x + 50} ${y + 18} q8 0 8 6 q0 6 -8 6`} stroke={BRICK} strokeWidth={2} strokeLinecap="round" fill="none" />
          <Path d={`M${x + 47} ${y + 30} L${x + 53} ${y + 26} L${x + 53} ${y + 34} Z`} fill={BRICK} />
        </G>
      ) : null}
    </G>
  );
}

/* the wicker basket: apples and a banana on the near side, chocolate bars and a bag of crisps on the far side. x, y is the top-left of the rim */
function Basket({ x, y }: { x: number; y: number }) {
  return (
    <G transform={`translate(${x} ${y})`}>
      <Path d="M28 -2 Q31 -14 40 -12" stroke="#F2C230" strokeWidth={5.5} strokeLinecap="round" fill="none" />
      <Circle cx={8} cy={-4} r={7} fill="#D64545" />
      <Path d="M8 -11 L9 -15" stroke={BROWN} strokeWidth={1.6} strokeLinecap="round" />
      <Circle cx={20} cy={-5} r={7} fill="#E05A4F" />
      <Path d="M20 -12 L21 -16" stroke={BROWN} strokeWidth={1.6} strokeLinecap="round" />
      <G transform="translate(51 -8) rotate(8)">
        <Rect x={-6} y={-8} width={13} height={20} rx={3} fill="#3F6FB0" />
        <Circle cx={0.5} cy={2} r={4} fill="#F2C230" />
      </G>
      <G transform="translate(38 -6) rotate(-16)">
        <Rect x={-5} y={-9} width={11} height={19} rx={2} fill="#6B3E26" />
        <Rect x={-5} y={-3} width={11} height={5} fill="#C9C9D2" />
      </G>
      <G transform="translate(45 -4) rotate(10)">
        <Rect x={-5} y={-9} width={11} height={19} rx={2} fill="#7A4B2F" />
        <Rect x={-5} y={-3} width={11} height={5} fill="#E0B24A" />
      </G>
      <Path d="M0 0 L58 0 L53 20 L5 20 Z" fill={WOOD} stroke={BROWN} strokeWidth={1.4} strokeLinejoin="round" />
      <Path d="M3 7 L55 7 M4 13.5 L54 13.5" stroke={BROWN} strokeWidth={1} opacity={0.7} />
      <Path d="M12 0 L14 20 M24 0 L25 20 M35 0 L34 20 M46 0 L44 20" stroke={BROWN} strokeWidth={0.9} opacity={0.5} />
      <Rect x={-2} y={-2} width={62} height={5} rx={2.5} fill="#B07A3E" stroke={BROWN} strokeWidth={1} />
    </G>
  );
}

/* the office with a researcher holding the basket out, and the worker's hand at the end of a reach */
function Office({ id, label, k, cap, reach }: { id: string; label: string; k: Ink; cap: string; reach: 'near' | 'far' }) {
  const far = reach === 'far';
  return (
    <Frame label={label}>
      <Panel id={id} fill="#F1E8D8">
        <Rect x={10} y={150} width={280} height={12} fill={WOOD} />
        <Rect x={10} y={149} width={280} height={3} fill="#B08A57" />
        <Rect x={22} y={28} width={36} height={40} rx={3} fill="#BFE0F2" stroke={BROWN} strokeWidth={3.5} />
        <Rect x={39} y={28} width={2.5} height={40} fill={BROWN} />
        <Rect x={22} y={47} width={36} height={2.5} fill={BROWN} />
        <Calendar x={226} y={24} row={far ? 1 : 0} arrow={!far} />
        <Plant x={274} y={150} s={0.9} />
        <Rect x={34} y={88} width={5} height={44} rx={2.5} fill="#7A4B2A" />
        <Rect x={36} y={121} width={36} height={5} rx={2.5} fill="#7A4B2A" />
        <Rect x={52} y={126} width={4} height={24} fill="#7A4B2A" />
        <Ellipse cx={54} cy={150} rx={14} ry={2.4} fill="#7A4B2A" />
        <Sitter x={52} y={119} fill={ORANGE}>
          <Path d={far ? 'M4 -28 Q50 -46 94 -43' : 'M4 -28 Q26 -38 46 -33'} stroke={ORANGE} strokeWidth={6.5} strokeLinecap="round" fill="none" />
          <Circle cx={far ? 96 : 48} cy={far ? -43.5 : -33} r={4} fill={SKIN} />
        </Sitter>
        <Rect x={72} y={102} width={82} height={6} rx={2} fill={BROWN} />
        <Rect x={78} y={108} width={5} height={42} fill={BROWN} />
        <Rect x={143} y={108} width={5} height={42} fill={BROWN} />
        <Rect x={118} y={108} width={26} height={18} rx={2} fill="#A06A38" />
        <Rect x={128} y={115} width={8} height={2.5} rx={1.2} fill={GOLD} />
        <Rect x={78} y={98.5} width={18} height={3.5} rx={1} fill={WHITE} stroke="#C9BFAE" strokeWidth={0.8} />
        <Basket x={102} y={80} />
        <Flip x={204}>
          <Person x={204} y={150} s={1.3} fill={TEAL} face={WHITE} />
        </Flip>
        <Path d="M190 114 Q172 108 158 98" stroke={TEAL} strokeWidth={7} strokeLinecap="round" fill="none" />
        <Circle cx={157} cy={97} r={4.2} fill={SKIN} />
      </Panel>
      <Cap k={k} s={cap} />
    </Frame>
  );
}

function Basket1({ k }: { k: Ink }) {
  return (
    <Office
      id="h4-basket"
      k={k}
      cap="Pick one for next week"
      reach="near"
      label="In an office, a researcher holds out a wicker basket of apples and a banana on one side and chocolate bars and crisps on the other, while a worker at a desk chooses, and a wall calendar has an arrow to next week"
    />
  );
}

function Back({ k }: { k: Ink }) {
  return (
    <Office
      id="h4-back"
      k={k}
      cap="Change your mind?"
      reach="far"
      label="The same office a week later: the researcher holds the basket out again, and the worker's hand reaches past an apple toward a chocolate bar"
    />
  );
}

function VideoCase({ x, h, fill, label, round }: { x: number; h: number; fill: string; label: string; round?: boolean }) {
  const y = 142 - h;
  return (
    <G>
      <Rect x={x} y={y} width={15} height={h} rx={2} fill={fill} />
      <Rect x={x + 2.5} y={y + 6} width={10} height={16} rx={2} fill={label} opacity={0.9} />
      {round ? <Circle cx={x + 7.5} cy={y + 14} r={3} fill={fill} /> : <Rect x={x + 5} y={y + 11} width={5} height={1.8} rx={0.9} fill={fill} />}
      <Rect x={x + 2.5} y={142 - 10} width={10} height={3} rx={1.5} fill={label} opacity={0.6} />
    </G>
  );
}

function Films({ k }: { k: Ink }) {
  const left = ['#2B3A67', '#7A2438', '#2B3A67', '#7A2438', '#2B3A67'];
  const lh = [66, 62, 68, 64, 66];
  const right = ['#F6C945', '#F28DB2', '#F6C945', '#F28DB2', '#F6C945'];
  const rh = [54, 50, 56, 52, 54];
  return (
    <Frame label="A shelf with two piles of video cases: tall, serious navy and maroon cases under a small calendar, and bright yellow and pink cases under a small cozy sofa">
      <Panel id="h4-films" fill={CREAM}>
        <Rect x={10} y={142} width={280} height={12} fill={WOOD} />
        <Rect x={10} y={141} width={280} height={3} fill="#B08A57" />
        <Rect x={10} y={154} width={280} height={8} fill="#A97B45" />
        {left.map((c, i) => (
          <VideoCase key={`l${i}`} x={30 + i * 17} h={lh[i]} fill={c} label="#E9DDC2" />
        ))}
        {right.map((c, i) => (
          <VideoCase key={`r${i}`} x={176 + i * 17} h={rh[i]} fill={c} label={i % 2 ? '#FFF3C4' : '#FFFFFF'} round />
        ))}
        <G transform="translate(71 44)">
          <Rect x={-15} y={-15} width={30} height={30} rx={4} fill={WHITE} stroke={BEAR_LINE} strokeWidth={1.6} />
          <Rect x={-15} y={-15} width={30} height={9} rx={4} fill={RED} />
          <Rect x={-15} y={-10} width={30} height={4} fill={RED} />
          {[0, 1, 2].map((r) =>
            [0, 1, 2, 3].map((c) => <Rect key={`${r}-${c}`} x={-11 + c * 6.5} y={-2 + r * 6} width={4.4} height={4} rx={1} fill={BROWN} opacity={0.7} />),
          )}
        </G>
        <G transform="translate(218 50)">
          <Rect x={-17} y={-14} width={34} height={15} rx={7} fill="#E0709A" />
          <Rect x={-21} y={-7} width={9} height={20} rx={4.5} fill="#E0709A" />
          <Rect x={12} y={-7} width={9} height={20} rx={4.5} fill="#E0709A" />
          <Rect x={-14} y={-3} width={28} height={12} rx={5} fill="#F5A6C3" />
          <Rect x={-12} y={-9} width={10} height={10} rx={4} fill="#FFE08A" />
          <Rect x={-16} y={12} width={3} height={4} fill={BROWN} />
          <Rect x={13} y={12} width={3} height={4} fill={BROWN} />
        </G>
      </Panel>
      <Cap k={k} s="Serious for later, light for now" />
    </Frame>
  );
}

function TwoSelves({ k }: { k: Ink }) {
  return (
    <Frame label="The same person twice: on the left upright in bright colors under a full green battery, on the right slumped forward in muted colors under a nearly empty red battery">
      <Panel id="h4-selves-l" fill="#FFEFB8" x={10} w={136}>
        <Ellipse cx={78} cy={152} rx={46} ry={5} fill="#E9CE7A" opacity={0.7} />
        <Person x={78} y={150} s={1.5} fill={ORANGE} face={WHITE} />
        <Path d="M60 110 L52 136 M96 110 L104 136" stroke={ORANGE} strokeWidth={8} strokeLinecap="round" />
        <BatteryIcon x={61} y={26} w={34} h={18} level={1} color={GREEN} />
      </Panel>
      <Panel id="h4-selves-r" fill="#C7CAD6" x={154} w={136}>
        <Ellipse cx={222} cy={152} rx={46} ry={5} fill="#A9ADBD" opacity={0.8} />
        <G transform="translate(222 150) scale(1.5)">
          <G transform="rotate(24)">
            <Path d="M-17 0 L-17 -16 Q-17 -33 0 -33 Q17 -33 17 -16 L17 0 Z" fill="#6F6D86" />
          </G>
          <Path d="M10 -26 L21 -6" stroke="#6F6D86" strokeWidth={6} strokeLinecap="round" />
          <Circle cx={22} cy={-37} r={11} fill="#6F6D86" />
          <Circle cx={27} cy={-35} r={1.8} fill={WHITE} />
        </G>
        <BatteryIcon x={205} y={26} w={34} h={18} level={0.12} color={RED} />
      </Panel>
      <Cap k={k} s="Same person, different tank" />
    </Frame>
  );
}

function Tank({ k }: { k: Ink }) {
  const cells = ['#3F8F5B', '#3F8F5B', '#3F8F5B', '#7DAA45', '#E3B83C', '#E58A2E', '#D4473F'];
  const tick = (cx: number) => <Path d={`M${cx} 62 L${cx} 72`} stroke={BROWN} strokeWidth={2} strokeLinecap="round" strokeDasharray="0.1 5" />;
  return (
    <Frame label="A big battery across the middle, full on the left and nearly empty on the right, with small icons above marking a long day: a briefcase, a speech bubble with a jagged line, an empty plate and a coffee cup">
      <Panel id="h4-tank" fill="#F4E9D4">
        <Rect x={264} y={96} width={9} height={22} rx={3} fill={BEAR_LINE} />
        <Rect x={28} y={76} width={236} height={54} rx={11} fill={WHITE} stroke={BEAR_LINE} strokeWidth={3.5} />
        {Array.from({ length: 10 }, (_, i) => {
          const x = 36 + i * 22.2;
          return i < cells.length ? (
            <Rect key={i} x={x} y={84} width={20} height={38} rx={3} fill={cells[i]} />
          ) : (
            <Rect key={i} x={x} y={84} width={20} height={38} rx={3} fill="none" stroke="#C9BFAE" strokeWidth={1.4} strokeDasharray="3 3" />
          );
        })}
        {tick(54)}
        {tick(112)}
        {tick(180)}
        {tick(240)}
        <G transform="translate(54 44)">
          <Path d="M-5 -8 L-5 -12 L5 -12 L5 -8" stroke="#5A3A20" strokeWidth={2.4} fill="none" strokeLinejoin="round" />
          <Rect x={-14} y={-8} width={28} height={19} rx={3} fill="#7A4B2A" />
          <Rect x={-14} y={0} width={28} height={2} fill="#5A3A20" />
          <Rect x={-3} y={-2} width={6} height={5} rx={1} fill={GOLD} />
        </G>
        <G transform="translate(112 44)">
          <Rect x={-16} y={-12} width={32} height={22} rx={7} fill={WHITE} stroke={BEAR_LINE} strokeWidth={1.6} />
          <Path d="M-7 10 L-10 17 L1 10 Z" fill={WHITE} stroke={BEAR_LINE} strokeWidth={1.6} strokeLinejoin="round" />
          <Rect x={-6} y={8} width={9} height={3} fill={WHITE} />
          <Path d="M-10 0 L-6 -6 L-2 3 L2 -7 L6 3 L10 -4" stroke={RED} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </G>
        <G transform="translate(180 44)">
          <Path d="M-20 -9 L-20 11 M20 -9 L20 11" stroke="#8E8E9C" strokeWidth={2.4} strokeLinecap="round" />
          <Circle cx={0} cy={1} r={14} fill={WHITE} stroke={BEAR_LINE} strokeWidth={1.6} />
          <Circle cx={0} cy={1} r={8.5} fill="#F6F2EA" stroke="#D8D2C4" strokeWidth={1.4} />
        </G>
        <G transform="translate(240 44)">
          <Path d="M-5 -14 Q-8 -18 -5 -22 M2 -14 Q-1 -18 2 -22" stroke="#B7AE9C" strokeWidth={1.8} strokeLinecap="round" fill="none" />
          <Ellipse cx={1} cy={11} rx={15} ry={3.4} fill="#E4DDCD" stroke={BEAR_LINE} strokeWidth={1.2} />
          <Rect x={-9} y={-10} width={20} height={19} rx={4} fill={WHITE} stroke={BEAR_LINE} strokeWidth={1.6} />
          <Path d="M11 -5 Q19 -5 19 1 Q19 7 11 7" stroke={BEAR_LINE} strokeWidth={1.8} fill="none" />
          <Rect x={-7} y={-8} width={16} height={4} rx={2} fill="#6B3E26" />
        </G>
      </Panel>
      <Cap k={k} s="Worn out keeps no clock" />
    </Frame>
  );
}

function Setup({ k }: { k: Ink }) {
  return (
    <Frame label="A rested person with a full battery icon above them places a phone on a small shelf by the front door, its charger cable hanging down, while a book is set out on a chair nearby">
      <Panel id="h4-setup" fill={CREAM}>
        <Rect x={10} y={150} width={280} height={12} fill={WOOD} />
        <Rect x={10} y={149} width={280} height={3} fill="#B08A57" />
        <Rect x={16} y={30} width={56} height={120} fill="#6B4423" />
        <Rect x={21} y={35} width={46} height={115} fill={BRICK} />
        <Rect x={26} y={42} width={15} height={36} rx={2} fill="#A24A34" />
        <Rect x={47} y={42} width={15} height={36} rx={2} fill="#A24A34" />
        <Rect x={26} y={86} width={15} height={50} rx={2} fill="#A24A34" />
        <Rect x={47} y={86} width={15} height={50} rx={2} fill="#A24A34" />
        <Circle cx={59} cy={98} r={3.4} fill={GOLD} />
        <Ellipse cx={44} cy={152} rx={30} ry={3.4} fill="#8A5A2B" opacity={0.5} />
        <Rect x={82} y={100} width={42} height={5} rx={1.5} fill={BROWN} />
        <Path d="M90 105 L90 114 M116 105 L116 114" stroke={BROWN} strokeWidth={3} strokeLinecap="round" />
        <Rect x={95} y={126} width={18} height={14} rx={2} fill={WHITE} stroke="#C9BFAE" strokeWidth={1.2} />
        <Rect x={100} y={130} width={2.6} height={6} fill="#8E8E9C" />
        <Rect x={106} y={130} width={2.6} height={6} fill="#8E8E9C" />
        <Path d="M103 99 Q113 108 106 117 Q100 126 105 132" stroke={BEAR_LINE} strokeWidth={3} strokeLinecap="round" fill="none" />
        <Path d="M103 99 Q113 108 106 117 Q100 126 105 132" stroke={WHITE} strokeWidth={1.4} strokeLinecap="round" fill="none" />
        <Rect x={98} y={80} width={12} height={20} rx={3} fill="#2E2E3A" />
        <Rect x={100} y={83} width={8} height={13} rx={1.5} fill="#BFD8F0" />
        <Flip x={152}>
          <Person x={152} y={150} s={1.3} fill={BLUE} face={WHITE} />
        </Flip>
        <Path d="M138 114 Q126 108 118 98" stroke={BLUE} strokeWidth={7} strokeLinecap="round" fill="none" />
        <Circle cx={116} cy={96} r={4.2} fill={SKIN} />
        <BatteryIcon x={135} y={28} w={34} h={18} level={1} color={GREEN} />
        <Rect x={214} y={118} width={42} height={6} rx={2} fill="#7A4B2A" />
        <Rect x={250} y={72} width={6} height={52} rx={2} fill="#7A4B2A" />
        <Rect x={218} y={124} width={5} height={26} fill="#7A4B2A" />
        <Rect x={248} y={124} width={5} height={26} fill="#7A4B2A" />
        <Rect x={226} y={106} width={22} height={12} rx={2} fill={BLUE} />
        <Rect x={228} y={114} width={20} height={3} rx={1} fill={CREAM} />
        <Rect x={226} y={106} width={4} height={12} rx={1.5} fill="#3C5688" />
        <Circle cx={240} cy={110} r={2.2} fill={GOLD} />
      </Panel>
      <Cap k={k} s="Set it up while rested" />
    </Frame>
  );
}

/* ---------- lesson 55: twenty seconds of reach ---------- */
function Closet({ k }: { k: Ink }) {
  return (
    <Frame label="A closet with its door ajar and a guitar standing inside in shadow, and on the wall beside it a chart of 21 small boxes with only the first four checked">
      <Panel id="h4-closet" fill="#F2E4CC">
        <Rect x={10} y={150} width={280} height={12} fill={WOOD} />
        <Rect x={10} y={149} width={280} height={3} fill="#B08A57" />
        <Rect x={22} y={26} width={102} height={124} fill="#B08A57" />
        <Rect x={28} y={32} width={90} height={118} fill={INK} />
        <Rect x={28} y={32} width={90} height={118} fill="#3A3350" opacity={0.5} />
        <Rect x={28} y={60} width={90} height={3} fill="#4A4263" />
        <Guitar x={58} y={130} s={0.88} body="#8A5A30" dark="#5A3A20" hole="#150F1C" />
        <Path d="M118 32 L118 150 L88 142 L88 44 Z" fill={WOOD} stroke={BROWN} strokeWidth={2} strokeLinejoin="round" />
        <Path d="M112 48 L112 138 L94 133 L94 52 Z" fill="#B8864A" />
        <Circle cx={92} cy={96} r={2.6} fill={GOLD} />
        <Ellipse cx={104} cy={152} rx={30} ry={3} fill="#8A5A2B" opacity={0.35} />
        <Chart x={158} y={48} box={12} gap={3} done={4} />
        <Plant x={266} y={150} s={1} />
      </Panel>
      <Cap k={k} s="Twenty seconds away" />
    </Frame>
  );
}

function Stand({ k }: { k: Ink }) {
  return (
    <Frame label="A living room with a guitar on a stand right in the middle of the floor, a sofa and a lamp behind it, and on the wall the same chart of 21 boxes with every one checked">
      <Panel id="h4-stand" fill="#F6E7CB">
        <Rect x={10} y={134} width={280} height={28} fill={WOOD} />
        <Rect x={10} y={133} width={280} height={3} fill="#B08A57" />
        <Ellipse cx={160} cy={150} rx={62} ry={8} fill={BRICK} opacity={0.6} />
        <Rect x={18} y={76} width={96} height={38} rx={11} fill={TEAL} />
        <Rect x={14} y={92} width={16} height={42} rx={7} fill="#2F7A76" />
        <Rect x={102} y={92} width={16} height={42} rx={7} fill="#2F7A76" />
        <Rect x={26} y={108} width={80} height={26} rx={7} fill="#4FA39D" />
        <Rect x={34} y={94} width={20} height={20} rx={6} fill={GOLD} />
        <Rect x={22} y={134} width={5} height={5} fill={BROWN} />
        <Rect x={105} y={134} width={5} height={5} fill={BROWN} />
        <Circle cx={134} cy={58} r={32} fill={GOLD} opacity={0.18} />
        <Circle cx={134} cy={58} r={19} fill={GOLD} opacity={0.22} />
        <Rect x={132.5} y={62} width={3} height={72} fill={BROWN} />
        <Ellipse cx={134} cy={134} rx={10} ry={3.4} fill={BROWN} />
        <Path d="M120 66 L126 48 L142 48 L148 66 Z" fill="#E0A33C" />
        <Path d="M160 106 L146 148 M160 106 L174 148 M160 106 L160 144" stroke="#3B3A45" strokeWidth={2.6} strokeLinecap="round" />
        <Guitar x={160} y={98} s={0.82} />
        <Chart x={190} y={40} box={9} gap={3} done={21} />
      </Panel>
      <Cap k={k} s="Out where the hands are" />
    </Frame>
  );
}

function Remote({ k }: { k: Ink }) {
  return (
    <Frame label="A television on a low stand, a remote lying on the sofa with its battery cover open and empty, and through a doorway into the next room two batteries on a shelf">
      <Panel id="h4-remote" fill="#EDE1CB">
        <Rect x={10} y={146} width={280} height={16} fill={WOOD} />
        <Rect x={10} y={145} width={280} height={3} fill="#B08A57" />
        <Rect x={22} y={118} width={94} height={28} rx={3} fill={WOOD} stroke={BROWN} strokeWidth={1.6} />
        <Rect x={64} y={106} width={12} height={12} fill="#3B3A45" />
        <Rect x={28} y={50} width={84} height={56} rx={5} fill="#26242E" />
        <Rect x={33} y={55} width={74} height={46} rx={2} fill="#3A3C4F" />
        <Path d="M38 98 L60 58 L72 58 L50 98 Z" fill={WHITE} opacity={0.1} />
        <Circle cx={100} cy={112} r={1.8} fill="#7A7A8A" />
        <Rect x={238} y={34} width={52} height={114} fill={BROWN} />
        <Rect x={244} y={40} width={46} height={108} fill="#F8E9B8" />
        <Rect x={244} y={132} width={46} height={16} fill="#E8CF8E" />
        <Rect x={250} y={96} width={34} height={4} rx={1.5} fill={BROWN} />
        <G>
          <Rect x={256} y={78} width={9} height={18} rx={2} fill="#C9C9D2" />
          <Rect x={256} y={82} width={9} height={11} fill="#E0A33C" />
          <Rect x={258.5} y={76} width={4} height={3} rx={1} fill="#C9C9D2" />
          <Rect x={270} y={78} width={9} height={18} rx={2} fill="#C9C9D2" />
          <Rect x={270} y={82} width={9} height={11} fill="#E0A33C" />
          <Rect x={272.5} y={76} width={4} height={3} rx={1} fill="#C9C9D2" />
        </G>
        <Rect x={124} y={92} width={104} height={32} rx={11} fill={BLUE} />
        <Rect x={118} y={104} width={16} height={42} rx={7} fill="#3C5688" />
        <Rect x={218} y={104} width={16} height={42} rx={7} fill="#3C5688" />
        <Rect x={132} y={118} width={88} height={28} rx={8} fill="#6585BD" />
        <Circle cx={176} cy={126} r={26} fill={GOLD} opacity={0.3} />
        <G transform="translate(176 128) rotate(-6)">
          <Rect x={-29} y={-8} width={58} height={16} rx={6} fill="#3A3A44" />
          <Rect x={-23} y={-5} width={26} height={10} rx={2} fill="#15151B" />
          <Rect x={-19} y={-2} width={7} height={4} rx={1} fill="#2B2B35" />
          <Rect x={-10} y={-2} width={7} height={4} rx={1} fill="#2B2B35" />
          <Rect x={8} y={-17} width={16} height={9} rx={2.5} fill="#4A4A56" transform="rotate(14 16 -12)" />
        </G>
      </Panel>
      <Cap k={k} s="Batteries in the next room" />
    </Frame>
  );
}

/* a salad bowl seen a little from above; dashed draws only where one used to sit */
function Bowl({ x, y, food, dashed }: { x: number; y: number; food?: string; dashed?: boolean }) {
  if (dashed) {
    return (
      <G transform={`translate(${x} ${y})`}>
        <Path
          d="M-17 0 Q-15 12 0 12 Q15 12 17 0 M-17 0 A17 5 0 0 1 17 0 A17 5 0 0 1 -17 0"
          stroke={BEAR_LINE}
          strokeWidth={1.8}
          strokeDasharray="3.5 3.5"
          strokeLinecap="round"
          fill="none"
          opacity={0.75}
        />
      </G>
    );
  }
  return (
    <G transform={`translate(${x} ${y})`}>
      <Path d="M-17 0 Q-15 12 0 12 Q15 12 17 0 Z" fill={WHITE} stroke="#B9C0C8" strokeWidth={1} />
      <Ellipse cx={0} cy={0} rx={17} ry={5} fill="#F4F6F8" stroke="#B9C0C8" strokeWidth={1} />
      <Path d="M-14 0 Q-9 -10 0 -9 Q9 -10 14 0 Q0 4 -14 0 Z" fill={food} />
    </G>
  );
}

function Salad({ k }: { k: Ink }) {
  const back = [
    [50, '#6BB04F'],
    [98, '#E05A4F'],
    [146, '#F2C230'],
    [194, '#8A5FB0'],
    [242, '#E58A2E'],
  ] as const;
  const front = [
    [50, '#C9A56B'],
    [98, '#9CCF6A'],
    [194, '#E9708F'],
    [242, '#3F8F5B'],
  ] as const;
  return (
    <Frame label="A salad bar under a glass sneeze guard with two rows of colorful bowls; one bowl has moved from the front edge to the back row, with a dashed outline where it was and a small arrow between, while a hand reaches in from the side">
      <Panel id="h4-salad" fill="#E4EAEE">
        <Rect x={14} y={52} width={272} height={76} rx={6} fill="#CDD5DC" />
        <Rect x={14} y={128} width={272} height={34} fill="#8E9AA6" />
        <Rect x={14} y={126} width={272} height={4} fill="#B4BEC8" />
        {back.map(([x, c]) => (
          <Bowl key={`b${x}`} x={x} y={68} food={c} />
        ))}
        {front.map(([x, c]) => (
          <Bowl key={`f${x}`} x={x} y={108} food={c} />
        ))}
        <Bowl x={146} y={108} dashed />
        <Path d="M146 100 L146 86" stroke={BEAR_LINE} strokeWidth={2.4} strokeLinecap="round" />
        <Path d="M141 91 L146 84 L151 91" stroke={BEAR_LINE} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <Path d="M28 30 L272 30 L266 96 L34 96 Z" fill="#BFE0F2" opacity={0.28} />
        <Path d="M60 32 L90 32 L84 94 L54 94 Z M190 32 L204 32 L198 94 L184 94 Z" fill={WHITE} opacity={0.22} />
        <Rect x={24} y={26} width={252} height={5} rx={2.5} fill="#8E9AA6" />
        <Rect x={24} y={26} width={5} height={102} rx={2.5} fill="#8E9AA6" />
        <Rect x={271} y={26} width={5} height={102} rx={2.5} fill="#8E9AA6" />
        <Path d="M296 124 L212 123" stroke={BLUE} strokeWidth={12} strokeLinecap="round" />
        <Ellipse cx={204} cy={123} rx={8} ry={6.2} fill={SKIN} />
        <Path d="M200 118 Q196 114 192 114" stroke={SKIN} strokeWidth={3.4} strokeLinecap="round" fill="none" />
      </Panel>
      <Cap k={k} s="Ten inches farther" />
    </Frame>
  );
}

function Hall({ k }: { k: Ink }) {
  return (
    <Frame label="Two pictures: on the left a hand holding a phone, tagged zero seconds; on the right a hallway where the phone sits charging on a small table at the end of a twenty second walk from a doorway">
      <Panel id="h4-hall-l" fill="#FCE3B5" x={10} w={104}>
        <Rect x={44} y={128} width={34} height={50} rx={6} fill={TEAL} />
        <Ellipse cx={61} cy={116} rx={24} ry={16} fill={SKIN} />
        <Rect x={36} y={38} width={46} height={80} rx={9} fill="#2E2E3A" />
        <Rect x={40} y={45} width={38} height={66} rx={4} fill="#BFD8F0" />
        {[0, 1, 2].map((r) =>
          [0, 1, 2].map((c) => (
            <Rect
              key={`${r}-${c}`}
              x={45 + c * 11}
              y={52 + r * 12}
              width={8}
              height={8}
              rx={2.4}
              fill={[ORANGE, GREEN, BLUE, '#E0709A', GOLD, TEAL][(r * 3 + c) % 6]}
            />
          )),
        )}
        <Rect x={28} y={70} width={15} height={9} rx={4.5} fill={SKIN} />
        <Rect x={28} y={82} width={15} height={9} rx={4.5} fill={SKIN} />
        <Rect x={28} y={94} width={15} height={9} rx={4.5} fill={SKIN} />
        <Ellipse cx={80} cy={96} rx={4.6} ry={12} fill={SKIN} transform="rotate(-18 80 96)" />
        <Rect x={22} y={18} width={34} height={20} rx={10} fill={GOLD} />
        <Say x={39} y={32.5} s="0s" fill={BEAR_LINE} size={13} />
      </Panel>
      <Panel id="h4-hall-r" fill="#EFE3CC" x={122} w={168}>
        <Rect x={122} y={146} width={168} height={16} fill={WOOD} />
        <Rect x={122} y={145} width={168} height={3} fill="#B08A57" />
        <Rect x={130} y={36} width={44} height={110} fill={BROWN} />
        <Rect x={135} y={41} width={34} height={105} fill="#F8E3A6" />
        <Person x={152} y={146} s={0.62} fill={ORANGE} face={WHITE} />
        <Rect x={228} y={34} width={42} height={32} rx={3} fill="#FFF3DC" stroke={BROWN} strokeWidth={3} />
        <Path d="M233 62 L243 48 L251 56 L259 44 L266 62 Z" fill="#7FBF8E" />
        <Circle cx={247} cy={94} r={26} fill={GOLD} opacity={0.22} />
        <Rect x={222} y={110} width={52} height={6} rx={2} fill={BROWN} />
        <Rect x={228} y={116} width={5} height={30} fill={BROWN} />
        <Rect x={263} y={116} width={5} height={30} fill={BROWN} />
        <Rect x={240} y={124} width={14} height={10} rx={1.5} fill={WHITE} stroke="#C9BFAE" strokeWidth={1} />
        <Path d="M247 110 Q254 118 247 124" stroke={BEAR_LINE} strokeWidth={2.4} strokeLinecap="round" fill="none" />
        <Rect x={239} y={82} width={16} height={28} rx={3.5} fill="#2E2E3A" />
        <Rect x={241} y={85} width={12} height={21} rx={2} fill="#2A3A66" />
        <Path d="M248.5 87 L243.5 96 L247 96 L245.5 104 L252 94 L248.5 94 Z" fill={GOLD} stroke={GOLD_DK} strokeWidth={0.6} strokeLinejoin="round" />
        <Path d="M176 153 Q204 158 228 153" stroke={BROWN} strokeWidth={2.8} strokeLinecap="round" strokeDasharray="0.1 6.5" fill="none" />
        <Rect x={182} y={124} width={36} height={20} rx={10} fill={GOLD} />
        <Say x={200} y={138.5} s="20s" fill={BEAR_LINE} size={13} />
      </Panel>
      <Cap k={k} s="Zero seconds, or twenty" />
    </Frame>
  );
}

function Charger({ k }: { k: Ink }) {
  return (
    <Frame label="A kitchen counter with a phone plugged into a charger, a small lightning bolt glowing on its screen, and beside it a round alarm clock with two bells on top and a blank face">
      <Panel id="h4-charger" fill="#D9EEEB">
        {Array.from({ length: 7 }, (_, i) => (
          <Rect key={`h${i}`} x={10} y={22 + i * 15} width={280} height={1.2} fill="#BFE0DC" />
        ))}
        {Array.from({ length: 15 }, (_, i) => (
          <Rect key={`v${i}`} x={14 + i * 20} y={10} width={1.2} height={102} fill="#BFE0DC" />
        ))}
        <Rect x={10} y={112} width={280} height={10} fill={WOOD} />
        <Rect x={10} y={111} width={280} height={3} fill="#B08A57" />
        <Rect x={10} y={122} width={280} height={40} fill="#4F7F7A" />
        <Rect x={16} y={128} width={130} height={30} rx={3} fill="#5C8F8A" />
        <Rect x={154} y={128} width={130} height={30} rx={3} fill="#5C8F8A" />
        <Circle cx={138} cy={136} r={2.6} fill={GOLD} />
        <Circle cx={162} cy={136} r={2.6} fill={GOLD} />
        <Rect x={60} y={66} width={20} height={30} rx={4} fill={WHITE} stroke="#C9BFAE" strokeWidth={1.2} />
        <Rect x={64} y={72} width={12} height={16} rx={3} fill="#EDEDED" stroke="#C9BFAE" strokeWidth={1} />
        <Path d="M70 88 Q70 112 92 112 L112 111" stroke={BEAR_LINE} strokeWidth={3.2} strokeLinecap="round" fill="none" />
        <Path d="M70 88 Q70 112 92 112 L112 111" stroke={WHITE} strokeWidth={1.4} strokeLinecap="round" fill="none" />
        <Circle cx={124} cy={84} r={34} fill={GOLD} opacity={0.22} />
        <Circle cx={124} cy={84} r={22} fill={GOLD} opacity={0.25} />
        <Rect x={109} y={58} width={30} height={54} rx={6} fill="#2E2E3A" />
        <Rect x={112} y={62} width={24} height={44} rx={3} fill="#1F2A44" />
        <Path d="M126 68 L116 88 L123 88 L119 103 L132 80 L125 80 Z" fill={GOLD} stroke={GOLD_DK} strokeWidth={0.8} strokeLinejoin="round" />
        <G transform="translate(212 88)">
          <Rect x={-23} y={20} width={7} height={8} rx={2} fill={BEAR_LINE} transform="rotate(20 -20 24)" />
          <Rect x={16} y={20} width={7} height={8} rx={2} fill={BEAR_LINE} transform="rotate(-20 20 24)" />
          <Rect x={-3} y={-34} width={6} height={9} rx={2} fill={BEAR_LINE} />
          <Path d="M-20 -17 Q-20 -30 -9 -30 Q2 -28 2 -17 Z" fill={GOLD} stroke={GOLD_DK} strokeWidth={1.4} transform="rotate(-24 -9 -17)" />
          <Path d="M-2 -17 Q-2 -30 9 -30 Q20 -28 20 -17 Z" fill={GOLD} stroke={GOLD_DK} strokeWidth={1.4} transform="rotate(24 9 -17)" />
          <Circle cx={0} cy={0} r={25} fill="#E0593F" />
          <Circle cx={0} cy={0} r={19} fill={WHITE} />
        </G>
        <Plant x={266} y={112} s={0.95} />
      </Panel>
      <Cap k={k} s="A place of its own" />
    </Frame>
  );
}

export const SCENES_H4: Record<string, ComponentType<{ k: Ink }>> = {
  'l54-basket': Basket1,
  'l54-back': Back,
  'l54-films': Films,
  'l54-two-selves': TwoSelves,
  'l54-tank': Tank,
  'l54-setup': Setup,
  'l55-closet': Closet,
  'l55-stand': Stand,
  'l55-remote': Remote,
  'l55-salad': Salad,
  'l55-hall': Hall,
  'l55-charger': Charger,
};
