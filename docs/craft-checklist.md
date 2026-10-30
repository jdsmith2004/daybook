# Crafted app or AI slop: a checklist you can run on a screenshot

Written October 30, 2026, for Daybook. Use it on one screen at a time. CLAUDE.md comes first where they differ: the flame
stays big and alive, answers sit low, and a tidy screen with no spirit is also wrong. What Daybook chose from this list is in
docs/design-standards.md, "The look".

How sure each line is:

- **[Apple]** stated on Apple's own HIG page (read as page data, October 30, 2026).
- **[Std]** an Apple framework default or long-standing practice. Apple's pages do not state the number.
- **[Src]** a designer source (Refactoring UI, NN/g, WCAG). "AI slop" lists are blogs and opinion, so read those as a
  shared pattern, not as measurements.
- **[Mine]** our own calibration, with no source for the number.

## 1. The first five checks (they catch most of it)

1. **Squint.** Blur the picture. You should see 2 or 3 masses, with one clearly first. Grey blocks of equal weight, or
   the eye landing on the wrong thing, means the hierarchy is flat. [Src, NN/g]
2. **Count what shouts.** About 3 text sizes, at most 2 large things, one solid button. Five sizes or three things
   shouting: cut. [Src, NN/g; Apple: "one or two prominent buttons per view"]
3. **Find a box inside a box.** Any card or tinted box inside another card. Flatten it: group with space and a heading,
   and keep a card for something you tap on its own. [Src]
4. **Put three screens side by side.** If only the words changed (same header, same card stack, same chip row), it is a
   template. A screen's layout should come from its one job. [Src]
5. **Delete test.** Point at each thing and name the state or action it carries. Nothing to name, it goes: a line that
   repeats the heading, a label above a heading, a pill that never changes, a glow. [Src]

## 2. Type

- Apple's sizes, size/line height: 34/41 Large Title, 28/34 Title 1, 22/28 Title 2, 20/25 Title 3, 17/22 Headline
  (semibold) and Body, 16/21 Callout, 15/20 Subhead, 13/18 Footnote, 12/16 Caption 1, 11/13 Caption 2. [Apple]
- Half sizes and near misses (13.5, 12.5, 15.5, 9.5, 19) are a sign nobody chose them. Pick from a short scale. [Mine]
- Nothing under 11. Reading text 15 or more; 17 is Apple's body. [Apple]
- 3 or 4 sizes on a screen. [Std]
- Emphasis changes weight, not size. Two weights do most of the work. [Apple]
- Fade with size and weight, not with pale grey. Small text needs 4.5:1 on its background, large or bold text 3:1, icons
  and borders 3:1. Check light and dark. [Apple, WCAG]
- No grey on a coloured background: use a tint of that colour, or white with some transparency. [Src, Refactoring UI]
- Small tracked capitals above a heading: at most one on a screen, and never repeating the heading. [Src]
- It must still work at the largest text sizes: stack side by side items, no fixed heights on text rows. [Apple]

## 3. Space and shape

- One scale: 4, 8, 12, 16, 24, 32, 40. Related things 4 to 8 apart, separate groups 24 to 32. [Std]
- **All gaps equal means no grouping.** A heading sits closer to its own content than to what is above it. [Src]
- One left and right edge for text, cards and the main button: 16, or 20 on bigger phones. You should be able to draw 2
  or 3 vertical lines most things snap to. [Std; alignment is Apple]
- A short radius scale, 3 or 4 values: 10 to 12 small, 16 to 20 cards, 24 to 28 sheets, capsule for buttons and chips.
  One big radius on everything means shape says nothing. [Std, Src]
- **Corners nest:** inner radius = outer radius minus the gap. A child with the same radius as its parent looks wrong. [Apple]
- **Define an edge once:** a fill, or a border, or a shadow, not a border plus a soft shadow on the same card. [Src]
- Shadows: a small downward offset and 2 or 3 levels, not the same soft blur under everything. [Src; the count is Mine]
- No coloured stripe down one side of a rounded card, unless it means a real status. [Src]

## 4. Colour

- One dominant colour, one accent, neutrals, plus status colours that always mean the same thing. Five or six colours
  competing is the tell. [Src; Apple: do not reuse a colour for another purpose]
- The accent goes on the one main action and on selected state, and hardly anywhere else. [Apple]
- Purple, indigo and violet gradients, glows and glass are the most cited AI signature. Compare against indigo-500
  #6366F1 and violet-500 #8B5CF6. **Daybook's accent #6246EA is close to these,** so it needs the flame, the sky and the
  warm paper around it to stay ours, and no extra purple gradients. A gradient earns its place only by drawing the eye
  to one spot. [Src]
- Daybook's skies are ours and are not the tell: they are a picture of a place. A generic gradient behind a button or
  a card is the tell. [Mine]

## 5. Decoration and repeated parts

- An icon in a tinted circle or square at the head of every row or card is the classic template. Put the icon beside
  the words at its own size, or drop the tile. [Src]
- More than 2 or 3 pills on a phone screen is too many, and each must map to a state that changes. [Src; the count is Mine]
- Rows of same-size cards with icon, heading and text: make one the main thing. [Src]
- Emoji as icons, bullets or headers: use one icon set at one stroke width. The flame is a character, not an emoji. [Src]
- Centre the one focal object. Reading text longer than 2 lines goes left. [Mine]
- Decoration that signals nothing goes. [Src]

## 6. Words

- Paragraphs become sentences, sentences become labels, and labels that explain nothing go. [Src]
- If a line explains what the screen already shows, cut it. Explaining is a cost at every level of the app. [Src]
- Search for "Not X. A Y." lines, one dash per sentence, and big claims. Say the concrete thing. [Src]
- Daybook's own rules still hold: plain words, no contractions, no hedging, no shame.

## 7. Touch, motion, haptics

- Tap area at least 44 by 44, measured on the frame, not the glyph. [Apple]
- About 12 around controls with a shape, about 24 around icon-only or plain text ones. Neighbours do not touch. [Apple]
- Every tappable thing has a pressed state. [Src]
- One filled button; if there are two choices, same size, with style showing the preferred one. [Apple]
- Main button about 50 tall, capsule or near it. [Std]
- Tab bar is for going places, never for actions, and stays visible. [Apple]
- Motion: springs with little or no bounce (bounce 0 to 0.2), about 0.3 to 0.4 s for a UI element. Interruptible, so a
  tap mid-way redirects it. Nothing makes a person wait. Frequent actions get less motion. [Std, WWDC23; Apple]
- Haptics: one cause, one haptic. Selection for a step in a slider or a choice, success once for a real finish, a light
  impact for a tap on a custom control. Never on scrolling or on every tap. [Apple for the families; Std for the mapping]
- Reduce Motion: no automatic or repeating motion, fades instead of slides, and the meaning stays in words. [Apple]

## 8. How crafted apps handle a home screen

- **Cap, then reveal.** Streaks shows at most 6 circles and flips to 6 more. Opal shows 3 numbers and one chart, with
  the detail below the fold. Flighty shows only the details that matter in each state. [Reviews; Flighty is a third-party guide]
- **One obvious next thing.** Duolingo's path, Headspace's one session card. [Reviews and a guide]
- **Finch is the warning.** A big pet, a long list and upsells compete: critics say there is no clear hierarchy, and that
  the checklist should win. Daybook's flame sits in the same trap if everything else stays loud. [Pratt IxD critique]
- **The biggest thing is what people find first.** Calm's whole home is the scene. [Older critiques]
- **Warmth comes from form.** How We Feel's warmth is its shapes and their motion (jagged for stormy, soft for calm),
  with haptics credited by its designers, not more content. Its dashboard is dense, and the shapes carry it. [Its own blog]
- Not found: any measured mascot-to-screen ratio for Finch, Duolingo, Headspace or How We Feel. Do not quote one.

## 9. The payment screen

Most sources describe subscription paywalls, not tip jars, and many are vendors selling paywalls. Treat the numbers as
direction, not proof.

- **1 to 3 options with one clear winner, already chosen.** Highlighting the popular one tested better than the cheapest. [Superwall, RevenueCat: vendors]
- Apollo's tip jar is the nearest real example: named tiers with prices, mid-priced "Generous". Its layout was not found. [App Store listing]
- **One decision, one button.** Option rows that are the main thing on the screen, low, with the button under them. [Mine, from CLAUDE.md's thumb rule and "keep paying to one tap"]
- **Sell what they get, concretely, in a few short lines.** Headspace is reported to use four feature bullets. Fold the rest. [Third-party guide]
- **Show it after earned value.** Superwall says after the "aha" moment. RevenueCat's interview reports 2% when it comes late against 8% and 15% with context first. One interview, not a study. [Vendor]
- **Do not:** fake urgency, a hidden close, repeated interruptions, dark patterns. Blinkist's plain "Honest Paywall" reportedly raised conversion 23% and cut complaints 55%. [Vendor report]
- **Apple's rules were not verified in this research.** Read App Review Guidelines 3.1.1 and 3.1.2 before building: StoreKit's localized price, Restore Purchases, working Terms and Privacy links and a visible close are the items to confirm.
- **The flame belongs here too.** A supporter is feeding it, and the extra looks are something to see. Show the flame, big, not an icon in a circle. [Mine, from CLAUDE.md]
- **Slop to look for on this screen:** a tinted circle above the heading, a heading that says what the page is followed by a paragraph saying it again, three identical price cards with pills on them, a gradient button, a list of ticks in tinted circles, small grey legal text that fails 4.5:1.

## Sources

thefountaininstitute.com/blog/signs-vibe-coded-ui, noqta.tn/en/blog/ai-design-slop-overused-ui-patterns-fix-2026,
robotsonpayroll.substack.com/p/how-to-avoid-that-vibe-coded-look, superdesign.dev/blog/why-ai-design-looks-generic,
impeccable.style/slop (one project's opinion), blode.co/writing/you-dont-have-to-make-ai-slop,
uxdesign.cc/how-to-de-slopify-your-designs-4c40c57c1dc9, expo.dev/blog/how-to-apply-professional-design-principles-in-ai-app-development,
medium.com/refactoring-ui/7-practical-tips-for-cheating-at-design-40c736799886, nngroup.com/articles/visual-hierarchy-ux-definition,
developer.apple.com/design/human-interface-guidelines (typography, layout, color, materials, motion, playing-haptics,
buttons, lists-and-tables, accessibility, tab-bars, toolbars), developer.apple.com/videos/play/wwdc2023/10158,
ixd.prattsi.org/2025/09/design-critique-finch-ios-app-2, screensdesign.com, opalapp.com/blog, howwefeel.substack.com/p/we-feelgrateful,
superwall.com/blog, revenuecat.com/blog/growth/how-top-apps-approach-paywalls, blakecrosley.com/guides/design (third-party guides to
Headspace and Flighty; the author may idealise them), MacStories reviews of Streaks 3 and Things 3.

Could not read: Anthropic's frontend-design skill (secondhand summaries only), Apple's navigation-bar and sheet pages,
the App Review Guidelines.
