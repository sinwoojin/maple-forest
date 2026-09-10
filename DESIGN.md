# Maple Forest · 단풍숲 모험

## 0. Reference scope

The user names MapleStory as a gameplay inspiration, without a pixel-exact reference. This is an original offline side-scrolling action RPG, not an official client. Reference language: layered forest, oversized cute heads, floating grassy platforms, warm parchment HUD and colorful combat numbers. Frontend design architecture and taste guidance apply to the surrounding game interface. No external assets or services are required.

## 1. Atmosphere & Identity

A sunlit autumn storybook forest with hand-drawn pixel sprites. Amber canopies, distant mint mountains, little mushroom houses, warm paper panels and a small blue-cloaked adventurer. The world occupies the screen; interfaces frame rather than obscure the adventure.

## 2. Color

UI tokens: ink #352a24, muted #76634f, paper #fff9e9, border #d9bf8b, accent #a7461c, accent-bright #f7b749, dark #272923, grass #76934b, hp #cf504b, mana #3a87ad, exp #e6ae36, white #ffffff. Scene ramps: sky #c2dfd9 / #f8e9b7, hills #90b7a1 / #bad0ac, leaves #bd6137 / #df8b42 / #f1b75b / #f8d685, soil #785344 / #a77750 / #ca9968. Sprite accents: blue #4779aa, pale-blue #8fc4d0, skin #ffd8ad, brown #543929, slime #91bd61, pink #e986a5. Alpha variants and lighting interpolations are allowed.

## 3. Typography

UI: Malgun Gothic, system-ui, sans-serif. Display: Georgia, serif for the English title only. Scale: 11, 12, 14, 16, 20, 24, 32, 48, 64px. Korean text uses word-break: keep-all. Canvas labels are 12–20px at a logical 1280×720 viewport.

## 4. Spacing & Layout

4px base; 8, 12, 16, 20, 24, 32, 48px steps. Max shell 1440px. Game aspect ratio 16:9 desktop; mobile canvas fills a 560px-tall stage with cropped horizontal view to retain character size. Header, game, status bar, control guide. Mobile HUD wraps; overlays scroll independently. World coordinates and sprite geometry are implementation mechanics.

## 5. Components

Paper panel: cream fill, 1px tan rim, subtle warm shadow, 12px radius. Button: paper/primary variants, hover brightness, pressed translateY(1px), focus ring, disabled opacity; minimum 44px height. Stat meter: semantic text and colored fill, HP/MP/EXP variants. Keycap: border, square 6px radius, inset bottom shadow. Dialog: native dialog with title, close, keyboard escape and focus restoration. Canvas sprites reuse art functions for scenery, terrain, player, enemies and effects. Touch keys mirror keyboard actions.

## 6. Motion & Interaction

Fixed 60Hz physics with requestAnimationFrame drawing. Parallax supports world navigation; hit arcs, number pops and particles communicate damage. Camera follows player. Reduced-motion removes decorative leaves, camera shake and strong flashes. Escape pauses, blur and hidden tab pause. No autoplay sound; synthesized effects start after interaction and can be muted.

## 7. Depth & Surface

Mixed depth: paper overlays with rim and soft shadow; three forest distance layers; bark and soil textures, layered canopy lighting, sprite shadows. Avoid dashboard cards in the game field. No raster screenshot substitutes.

## 8. Accessibility Constraints & Scope

Keyboard and touch actions, visible focus, text health values, readable Korean labels, sound toggle, pause, help. Game is a visual real-time action experience; its spatial combat is not represented as a screen-reader game. Menus are semantic HTML. Offline localStorage save is best effort and reports failure. No network, account, purchases or multiplayer.

## v2 expansion contract

- Three jobs: warrior (rust/red, sword, close sweep), archer (leaf green, bow, travelling piercing arrow), mage (blue/cyan, staff, travelling orb and area burst). Job picker uses three stacked semantic buttons with role, range, skill and selected state; accessible on 375px.
- Inventory: native dialog, equipped summary and scrollable item rows. Weapon/armor icons are simple inline SVG. Equipped state is textual, not color-only. Buttons equip or sell duplicate loot; empty and incompatible states have explanatory copy.
- New Mushroom Cavern: dark ink/teal #173536 / #284e50 / #3f7470 walls, cyan #8fc4d0 lights, pink #e986a5 mushrooms; pale labels on dark world. Portal after the forest guardian opens a second 3200-unit map. Six cavern kills awaken a new mushroom monarch boss, whose defeat completes the second chapter. Return portal at left preserves both chapters.
- Header adds job and inventory buttons. At <=600px header may wrap, controls remain >=44px. Bottom touch row sticks to viewport bottom on phones so movement/combat remain reachable while playing; landscape uses compact HUD and viewport-height game area. Dialogs scroll without escaping screen bounds.
- Save schema v2 preserves v1 levels, currency and forest progress; adds job, owned gear, equipped IDs, zone and cavern progress. Stable localStorage key preserves existing users. Browser/device saves stay local; no account/cloud sync in this release.
- New components: .job-options/.job-card with active and focus; .inventory-list/.item-row with equipped, available, incompatible; .equipped-summary; .chapter-tag. Token scale extends to9px overlines on narrow HUD only. Existing paper materials and 4px spacing scale remain.
- Mobile persistent controls: seven actions including potion, with a separate always-visible HP/MP/job text strip. Footer is padded by112px to allow all document content to scroll above the fixed controls. Portrait/landscape screenshots are viewport captures for fixed-element verification, with full-page captures retained as scrolling evidence.

## v3 · Stage Expedition

- Gameplay reference: PokéRogue's repeated encounter → choose one reward → next encounter loop (official community wiki new-player guide); original side-scrolling combat and original forest/cavern characters retained.
- Separate 20-stage expedition, bosses at5/10/15/20. Stages1–5 amber forest,6–10 luminous cavern,11–15 frosted cavern,16–20 twilight forest. Compact arenas with no ordinary respawn; remaining count and current stage are explicit. Existing exploration remains reachable.
- Header Expedition button opens run dashboard: start/resume/return to exploration. Rewards are three semantic choice cards, each naming actual effect and whether permanent gear or run-only boon. Clear choices and phase survive reload; closing the dialog must not lose access to rewards.
- Stage HUD uses a paper progress ribbon with20 small marks and textual stage number, remaining enemies and boss warning. Existing quest slot explains current run state. Mobile remains7 fixed controls and HP/MP strip.
- Equipment appearance: weapon tiers0–3 change silhouette, material and gem details; armor0 cloak, armor1 leather vest/shoulder pieces/headband, armor2 crystal armor/shoulders/circlet. Three class colors remain identifiable. Inventory includes a live canvas equipment preview and appearance descriptions. Effects supplement the silhouette and respect reduced motion.
- Additional palette tokens for crystal/snow #c2edf0/#659ca8 and twilight #483b65/#bc83a0. Frost/dusk scenes reuse original drawn geometry with distinct material colors/lighting, not downloaded assets.
- Save key stays maple-forest-v1, schema advances with migration fromv1/v2. Stages persist both phase and pending reward identity; a resumed fight must not grant cleared enemies again. End-of-run temporary bonuses reset; permanent character gear and exploration quest progress stay intact.

## v4 · Branching expedition interface

- Preserve all existing paper, ink, amber and job-color tokens. Reuse semantic choice cards for routes, events, rewards, three builds per job and camp actions. Each card states costs, risk, benefits, disabled reasons and synergy in text. A pending decision stays reopenable through E and the Expedition button.
- Forty-node trail groups four chapters of ten; chapter bosses use stronger amber rims. Objective ribbon shows the actual objective and active elapsed time. Dialog body owns scrolling; buttons remain at least 44px. Imported history/codex/save values render through textContent.
- Bag uses the existing live gear preview plus sort selector, stat comparison, equip/sell/dismantle controls and a materials total. Equipped and starter items show protected states.
- Archive contains local run records, item/relic discovery and unlocks. Daily is explicitly a local, unverified UTC challenge. Save transfer uses downloaded JSON and a labeled file picker with an inline result.
- Settings uses opt-in SFX and original synthesized BGM, visual intensity off/low/full and reduced motion. Effects intensity never hides dangerous telegraphs. Enemy role silhouettes add shields, staff, bow, fuse, horns and healer marks; ground warnings have a bright outline, pattern and readable label.
- Eight touch actions include dodge; portrait uses two reachable rows, landscape one row. Always-visible HP/MP/dodge strip. Labels and menu cards wrap without horizontal scrolling.
- Accepted scope: spatial combat remains canvas based; menu keyboard/focus and text stats are accessible. Synthetic fixture QA is separate from natural gameplay duration evidence. No framework or image dependency is introduced.

## Mobile UX implementation contract · 2026-09-10

- Preserve the existing storybook palette, Canvas sprites, physics, saves and desktop surface. Existing-project redesign; no brand replacement or framework.
- Personas: two-thumb phone player (360px portrait,844px short landscape), interrupted commuter (background/reorientation), menu reader with larger text, keyboard desktop player.
- Mobile scroll ownership: viewport-height game shell, normal header + compact status/objective + flexible canvas + thumb dock. Only native dialog body scrolls while open; desktop document remains scrollable.
- New primitives: mobile status strip with semantic HP/MP meters, compact objective and boss status; paired movement keys; 2x2 action cluster; separate utility row; mobile menu launcher. Existing paper rim/shadow retained. All actions have text, SVG symbol, focus and pressed feedback, cooldown/unavailable text.
- Tokens: minimum touch44px, movement60px, action60px, primary attack68px, dock-gap8px, phone-padding8px, desktop spacing unchanged; phone text12/14/16/20px. Utility keys44px. Landscape dock96px with44px utility and64px combat keys. Ink/paper/amber/mana existing palette, with dodge tint derived from mana and paper; paper inset lighting retains physical key feel.
- Portrait logical camera height480 and short-landscape320; world and physics remain720 coordinates. Camera crops vertically to track player. Canvas backing buffer caps DPR at2 and uses CSS size; visible/world transforms agree. Gameplay warning geometry remains unchanged.
- Native modal becomes fixed header/body/footer scroll shell. Bag has one scroll owner, keeps sort/selected item/scroll after actions. Choice cards separate effects, cost/risk and optional detail; touch drag cannot trigger choices.
- Input ownership is per pointer and per keyboard key. Pointer release/cancel/lostcapture, blur, hidden tab, orientation and modal open clear all held input. Orientation pauses active battle without changing run or decision. No auto attack/potion additions.
- HUD refresh coalesces to100ms; new HUD text writes only changed content. Existing camera art and settings remain. Physical mobile Safari cannot be certified by Chromium emulation.

## Objective and outcome clarity · 2026-09-10

- Reuse the stage ribbon, quest copy, mobile objective, choice cards and dialog paragraphs with existing type, paper and spacing tokens. No additional modal or combat controls.
- Survival uses seconds; escort and defense use percent plus target health and remaining time. Both HUDs derive blocking feedback from the same encounter rule: nearby enemies, distance, or height. Reading HUD state never advances the objective.
- First encounter guidance appears in the existing notification and remains available in the expedition dialog. The mobile player can read the current condition without opening a menu.
- End screens and archives show only captured failure cause and the recorded objective/player snapshot. Older records explicitly report unavailable details. Route cards expose their actual encounter, cost, risk and reward before selection.
