/* A picture for each section of the lessons, of what the section is about, for the lesson map on Learn: a wave (urges are
   waves), a bell (the cue comes first), a mended heart, a map with the way marked, first light over the hills, a leaf on a
   long breath out, a close look at the first link in a chain, a sprout, a home with the lights on, and people side by side.
   Flat and soft, in the app's colors, drawn on a 120 by 120 square. Each takes an id prefix, so the gradients of two
   pictures on one page never share a name. */

const star = (x: number, y: number, r: number, c: string) =>
  `<path d="M${x} ${y - r}Q${x + r * 0.18} ${y - r * 0.18} ${x + r} ${y}Q${x + r * 0.18} ${y + r * 0.18} ${x} ${y + r}Q${x - r * 0.18} ${y + r * 0.18} ${x - r} ${y}Q${x - r * 0.18} ${y - r * 0.18} ${x} ${y - r}Z" fill="${c}"/>`;
const shadow = (y: number, w: number) => `<ellipse cx="60" cy="${y}" rx="${w}" ry="5" fill="#2A2350" opacity=".1"/>`;

/** the drawings, without their outer svg, keyed by the picture's name */
const ART: Record<string, (id: string) => string> = {
  /* urges are waves: a wave rises, curls and passes */
  wave: (id) => `<defs>
<linearGradient id="${id}1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6FB4F7"/><stop offset="1" stop-color="#2F7DE1"/></linearGradient>
<linearGradient id="${id}2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2F7DE1"/><stop offset="1" stop-color="#1D5CB0"/></linearGradient></defs>
<circle cx="88" cy="30" r="13" fill="#FFC832"/><circle cx="88" cy="30" r="19" fill="#FFC832" opacity=".25"/>
<path d="M8 100C8 64 34 34 70 34C94 34 108 50 104 64C101 74 88 76 82 69C77 63 80 55 87 55C84 50 76 49 69 53C58 59 54 74 60 86C64 94 70 98 78 100Z" fill="url(#${id}1)"/>
<path d="M22 70C30 50 48 40 66 40" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".55"/>
<path d="M70 34C94 34 108 50 104 64C101 74 88 76 82 69" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round"/>
<path d="M4 98C18 92 28 104 44 98S72 92 86 98S108 104 116 98L116 112L4 112Z" fill="url(#${id}2)"/>
<path d="M14 104C24 101 30 107 40 104" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" opacity=".5"/>
<path d="M76 106C86 103 92 109 102 106" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" opacity=".5"/>`,

  /* the cue comes first: a bell rings before anything happens */
  bell: (id) => `<defs>
<linearGradient id="${id}1" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#A792FF"/><stop offset="1" stop-color="#6A4BE6"/></linearGradient></defs>
${shadow(108, 30)}
<path d="M24 38Q16 52 24 66M96 38Q104 52 96 66" fill="none" stroke="#7B5CF0" stroke-width="4.5" stroke-linecap="round"/>
<path d="M13 30Q1 52 13 74M107 30Q119 52 107 74" fill="none" stroke="#7B5CF0" stroke-width="4" stroke-linecap="round" opacity=".4"/>
<circle cx="60" cy="96" r="9" fill="#FFB020"/><circle cx="57" cy="93" r="3" fill="#FFE27A"/>
<path d="M60 20C43 20 37 36 37 52L37 70L29 82L91 82L83 70L83 52C83 36 77 20 60 20Z" fill="url(#${id}1)"/>
<rect x="25" y="78" width="70" height="10" rx="5" fill="#5638C8"/>
<circle cx="60" cy="18" r="6" fill="#5638C8"/>
<path d="M47 36C44 44 44 54 44 64" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".5"/>
${star(98, 22, 7, '#FFC832')}${star(20, 90, 5, '#FFC832')}`,

  /* shame and kindness: a heart, cared for and mending */
  heart: (id) => `<defs>
<linearGradient id="${id}1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FF8A74"/><stop offset="1" stop-color="#D9412F"/></linearGradient>
<radialGradient id="${id}2" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#FFFFFF" stop-opacity=".9"/><stop offset="1" stop-color="#FFFFFF" stop-opacity="0"/></radialGradient></defs>
<circle cx="60" cy="58" r="54" fill="url(#${id}2)"/>
${shadow(110, 30)}
<path d="M60 100C30 80 14 62 20 42C26 24 48 20 60 37C72 20 94 24 100 42C106 62 90 80 60 100Z" fill="url(#${id}1)"/>
<path d="M32 40C34 33 41 30 47 33" fill="none" stroke="#fff" stroke-width="5.5" stroke-linecap="round" opacity=".6"/>
<g transform="rotate(-32 66 62)"><rect x="38" y="53" width="56" height="19" rx="9.5" fill="#FFE7CF" stroke="#EDBE91" stroke-width="1.5"/>
<rect x="57" y="55.5" width="18" height="14" rx="3" fill="#F6CDA4"/>
<circle cx="45" cy="59" r="1.2" fill="#E2AE7E"/><circle cx="49" cy="66" r="1.2" fill="#E2AE7E"/><circle cx="83" cy="59" r="1.2" fill="#E2AE7E"/><circle cx="87" cy="66" r="1.2" fill="#E2AE7E"/></g>
${star(102, 20, 8, '#FFC832')}${star(16, 26, 5, '#FFC832')}${star(108, 80, 4.5, '#FFC832')}`,

  /* making a plan: a map with the way marked to a flag */
  map: () => `${shadow(108, 46)}
<path d="M14 30L42 22L42 96L14 104Z" fill="#E6FAF1"/><path d="M42 22L78 30L78 104L42 96Z" fill="#CFF1E2"/><path d="M78 30L106 22L106 96L78 104Z" fill="#E6FAF1"/>
<path d="M14 30L42 22L78 30L106 22L106 96L78 104L42 96L14 104Z" fill="none" stroke="#7ACFAE" stroke-width="2.5" stroke-linejoin="round"/>
<path d="M20 52C28 46 36 50 38 58C40 66 30 70 22 66Z" fill="#A8E4CB"/><path d="M84 70C92 64 102 66 102 76C102 86 88 88 84 80Z" fill="#A8E4CB"/>
<path d="M26 92C34 84 30 74 44 72C58 70 52 58 64 54C76 50 80 44 86 40" fill="none" stroke="#E5503F" stroke-width="3.5" stroke-linecap="round" stroke-dasharray="1 7"/>
<circle cx="26" cy="92" r="5" fill="#14956F"/><circle cx="26" cy="92" r="2" fill="#fff"/>
<path d="M88 42L88 14" stroke="#7A4B00" stroke-width="3" stroke-linecap="round"/><path d="M89 14L106 20L89 27Z" fill="#FFB020"/>
<circle cx="88" cy="43" r="4" fill="#0C6B4F" opacity=".25"/>`,

  /* faith and recovery: first light over the hills */
  sunrise: (id) => `<defs>
<linearGradient id="${id}1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFE27A"/><stop offset="1" stop-color="#FFA23A"/></linearGradient></defs>
<g stroke="#FFB020" stroke-width="5" stroke-linecap="round" opacity=".8"><path d="M60 22V10M32 34L24 26M88 34L96 26M20 60H8M100 60H112"/></g>
<circle cx="60" cy="68" r="30" fill="url(#${id}1)"/>
<path d="M8 94C22 72 42 70 60 84C78 70 98 72 112 94Q60 112 8 94Z" fill="#FFD36B"/>
<path d="M20 100C34 88 50 88 64 96C80 88 94 90 104 100Q60 114 20 100Z" fill="#F2B23A"/>
${star(108, 44, 5, '#FFC832')}`,

  /* skills for the moment: a longer breath out, carrying a leaf */
  leaf: (id) => `<defs>
<linearGradient id="${id}1" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#6BE0B4"/><stop offset="1" stop-color="#12936D"/></linearGradient></defs>
${shadow(110, 26)}
<path d="M8 62C28 56 44 60 52 70C58 78 52 88 44 84C38 81 40 72 48 72" fill="none" stroke="#7B5CF0" stroke-width="4.5" stroke-linecap="round"/>
<path d="M14 84C40 80 66 94 104 86" fill="none" stroke="#7B5CF0" stroke-width="4" stroke-linecap="round" opacity=".45"/>
<path d="M30 46C50 42 64 48 74 40" fill="none" stroke="#7B5CF0" stroke-width="3.5" stroke-linecap="round" opacity=".35"/>
<g transform="rotate(-14 82 50)"><path d="M58 50C70 26 98 20 112 30C108 54 84 70 58 50Z" fill="url(#${id}1)"/>
<path d="M62 49C76 42 92 36 108 31" fill="none" stroke="#0B6A4C" stroke-width="2.2" stroke-linecap="round" opacity=".5"/>
<path d="M72 40C80 30 92 26 100 27" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".45"/></g>
${star(26, 24, 6, '#FFC832')}${star(104, 76, 4.5, '#FFC832')}`,

  /* seeing your pattern: a close look at the first link in the chain */
  chain: (id) => `<defs>
<radialGradient id="${id}1" cx="35%" cy="30%" r="50%"><stop offset="0" stop-color="#FFFFFF" stop-opacity=".95"/><stop offset="1" stop-color="#DDEEFF" stop-opacity=".7"/></radialGradient></defs>
${shadow(110, 40)}
<g fill="none" stroke-linecap="round"><rect x="6" y="80" width="34" height="18" rx="9" stroke="#1D5CB0" stroke-width="6" transform="rotate(-24 23 89)"/>
<rect x="28" y="70" width="34" height="18" rx="9" stroke="#2F7DE1" stroke-width="6" transform="rotate(-24 45 79)"/>
<rect x="50" y="60" width="34" height="18" rx="9" stroke="#1D5CB0" stroke-width="6" transform="rotate(-24 67 69)"/></g>
<path d="M88 70L106 90" stroke="#2A2350" stroke-width="9" stroke-linecap="round"/>
<circle cx="72" cy="50" r="26" fill="url(#${id}1)" stroke="#2A2350" stroke-width="6"/>
<rect x="58" y="42" width="30" height="16" rx="8" fill="none" stroke="#2F7DE1" stroke-width="5.5" transform="rotate(-24 73 50)"/>
<path d="M58 40C61 33 67 30 73 30" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round"/>
${star(22, 30, 6, '#FFC832')}`,

  /* becoming someone new: a sprout growing up toward the light */
  sprout: (id) => `<defs>
<linearGradient id="${id}1" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#6BE0B4"/><stop offset="1" stop-color="#14956F"/></linearGradient></defs>
<circle cx="92" cy="26" r="11" fill="#FFC832"/><circle cx="92" cy="26" r="17" fill="#FFC832" opacity=".25"/>
<ellipse cx="60" cy="100" rx="38" ry="11" fill="#C98B55"/><ellipse cx="60" cy="97" rx="30" ry="6" fill="#DDA26A"/>
<path d="M60 98C60 82 57 68 62 50" fill="none" stroke="#14956F" stroke-width="5" stroke-linecap="round"/>
<path d="M59 76C42 78 30 68 28 54C44 52 56 60 59 76Z" fill="url(#${id}1)"/>
<path d="M61 62C66 46 82 38 98 42C96 58 80 66 61 62Z" fill="url(#${id}1)"/>
<path d="M62 50C56 40 60 28 70 22C76 32 72 44 62 50Z" fill="#7BE6BE"/>
<path d="M34 58C40 60 46 64 50 70M70 54C78 50 86 46 92 44" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" opacity=".5"/>
${star(24, 30, 6, '#FFC832')}${star(104, 70, 4.5, '#FFC832')}`,

  /* a life that holds: a home with the lights on */
  house: (id) => `<defs>
<radialGradient id="${id}1" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#FFE27A" stop-opacity=".9"/><stop offset="1" stop-color="#FFE27A" stop-opacity="0"/></radialGradient></defs>
${shadow(104, 46)}
<circle cx="98" cy="74" r="14" fill="#F4B3A6"/><circle cx="106" cy="84" r="10" fill="#F4B3A6"/><rect x="99" y="86" width="4" height="16" rx="2" fill="#B5372A"/>
<rect x="76" y="28" width="10" height="20" rx="2" fill="#B5372A"/>
<path d="M30 56L30 102L90 102L90 56Z" fill="#FFF3E6"/>
<path d="M20 60L60 26L100 60Z" fill="#E5503F"/><path d="M18 62L60 26L102 62" fill="none" stroke="#B5372A" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
<circle cx="44" cy="74" r="16" fill="url(#${id}1)"/><circle cx="76" cy="74" r="16" fill="url(#${id}1)"/>
<rect x="36" y="66" width="16" height="16" rx="3" fill="#FFC832"/><rect x="68" y="66" width="16" height="16" rx="3" fill="#FFC832"/>
<path d="M44 66V82M36 74H52M76 66V82M68 74H84" stroke="#F2A23A" stroke-width="2"/>
<path d="M53 102V86C53 80 67 80 67 86V102Z" fill="#B5372A"/>
<path d="M81 22C77 18 83 14 79 10M87 20C84 16 89 13 86 9" fill="none" stroke="#C9C1E8" stroke-width="2.5" stroke-linecap="round"/>`,

  /* well-known programs: people together, side by side */
  group: () => `${shadow(106, 46)}
<circle cx="30" cy="52" r="11" fill="#FF8A74"/><path d="M12 100C12 76 20 66 30 66C40 66 48 76 48 100Z" fill="#E5503F"/>
<circle cx="90" cy="52" r="11" fill="#6FB4F7"/><path d="M72 100C72 76 80 66 90 66C100 66 108 76 108 100Z" fill="#2F7DE1"/>
<circle cx="60" cy="42" r="13" fill="#A792FF"/><path d="M38 102C38 72 48 60 60 60C72 60 82 72 82 102Z" fill="#7B5CF0"/>
<path d="M54 18C54 14 60 13 60 18C60 13 66 14 66 18C66 23 60 26 60 28C60 26 54 23 54 18Z" fill="#FFB020"/>
<path d="M52 38C53 34 56 32 59 32" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".55"/>
${star(18, 26, 5.5, '#FFC832')}${star(104, 28, 5, '#FFC832')}`,
};

/** the picture for each section (by its LUNITS index) */
export const SECTION_ART: Record<number, string> = {
  0: 'wave',
  1: 'heart',
  2: 'map',
  3: 'leaf',
  4: 'chain',
  5: 'house',
  6: 'group',
  7: 'sunrise',
  8: 'bell',
  9: 'sprout',
};

/** a section's picture without its outer svg (to place inside another drawing), on a 120 by 120 square */
export const sectionArtInner = (u: number, id: string): string => (ART[SECTION_ART[u]] || ART.wave)(id);
/** a section's picture as a whole svg */
export const sectionArtXml = (u: number, id = 'sa' + u): string => `<svg viewBox="0 0 120 120">${sectionArtInner(u, id)}</svg>`;
