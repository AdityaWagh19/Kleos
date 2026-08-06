# Design System

**Kleos** — Visual Identity, Design Tokens, Component Specifications, and Implementation Reference

> Warm cream-paper workspace with graphite accents — a studio where matte-black ink dots float over linen architecture.

---

## Design Philosophy

Kleos operates in a warm-paper product language: a slightly cream canvas carries flat, low-elevation surfaces in sage-tinted stone, with almost no chromatic presence — one vivid green dot punctuates an otherwise fully achromatic system. The whole product reads as architectural: weight 400 headlines, tight -0.01em tracking, and pill-shaped controls feel drawn rather than printed.

Color is rationed to functional punctuation (status dots, active nav dots, gradient-free product screenshots) while the primary CTA is a matte black capsule, not a brand-colored button. Surfaces stack from canvas → white card → sage tile → glass overlay without ever using shadows as decoration; depth is communicated through color temperature shifts from cool gray to warm stone.

---

## Theme

**Mode:** Light  
**Base:** Warm linen canvas (`#edede8`) with single chromatic accent (`#4cc02b`)  
**Rhythm:** LINEN CANVAS → WHITE CARD → WARM STONE → GLASS OVERLAY → GRAPHITE INVERSE

---

## 1. Color Tokens

### 1.1 Color Palette — Full Specification

| Name | Value | CSS Custom Property | Design Token | Role |
|------|-------|--------------------|----|------|
| Linen Canvas | `#edede8` | `--color-linen-canvas` | `color.linen-canvas` | Page background, section surfaces — warm off-white that pushes the whole system toward paper rather than screen |
| Frosted White | `#ffffff` | `--color-frosted-white` | `color.frosted-white` | Card surfaces, elevated panels, glass overlays — clean white floats above the linen canvas for primary content |
| Warm Stone | `#dbdbd2` | `--color-warm-stone` | `color.warm-stone` | Secondary card fills, secondary button backgrounds, accent surface — sage-tinted beige gives neutral elements warmth without becoming chromatic |
| Pebble | `#c0c0c0` | `--color-pebble` | `color.pebble` | Circular accent tiles, muted card backgrounds — cool gray that sits one step back from stone for de-emphasized surfaces |
| Graphite Ink | `#141414` | `--color-graphite-ink` | `color.graphite-ink` | Primary action button background, dark text on light surfaces — near-black with a hair of warmth, anchors every CTA |
| Charcoal Body | `#292929` | `--color-charcoal-body` | `color.charcoal-body` | Primary body and heading text — readable but softer than pure black, keeps long-form copy from feeling harsh |
| Slate Caption | `#6f6f6e` | `--color-slate-caption` | `color.slate-caption` | Secondary body, helper text, descriptive copy — carries the most volume of any text color |
| Ash Subheading | `#8f8f8e` | `--color-ash-subheading` | `color.ash-subheading` | Subtle labels, muted headings, decorative type — sits between caption and hairline |
| Iron Nav | `#353535` | `--color-iron-nav` | `color.iron-nav` | Secondary body text, navigation labels, and subdued headings. Do not promote it to the primary CTA color |
| Onyx Border | `#000000` | `--color-onyx-border` | `color.onyx-border` | Hairline borders, strong dividers, selected-state outlines — used at 1-2px to outline cards, buttons, and focus rings |
| Quartz | `#d0d0c8` | `--color-quartz` | `color.quartz` | Quietest surface tint, reserved for low-contrast dividers and hover-state hints |
| Lime Pulse | `#4cc02b` | `--color-lime-pulse` | `color.lime-pulse` | Green wash for highlight backgrounds, decorative bands, and soft emphasis behind content. Use as a supporting accent, not as a status color |

### 1.2 Surface Hierarchy

| Level | Name | Value | CSS Custom Property | Design Token | Purpose |
|-------|------|-------|--------------------|----|---------|
| 0 | Linen Canvas | `#edede8` | `--surface-linen-canvas` | `surface.linen-canvas` | Page background — warm off-white that warms the entire system |
| 1 | Frosted White | `#ffffff` | `--surface-frosted-white` | `surface.frosted-white` | Primary card surface, feature panels, elevated content blocks |
| 2 | Warm Stone | `#dbdbd2` | `--surface-warm-stone` | `surface.warm-stone` | Secondary surface for pricing cards, de-emphasized panels, button backgrounds |
| 3 | Glass Overlay | `#ffffffb3` | `--surface-glass-overlay` | `surface.glass-overlay` | Floating panels, chat widgets, sticky elements — paired with backdrop blur(12px) |
| 4 | Graphite | `#141414` | `--surface-graphite` | `surface.graphite` | Inverted surface — dark CTAs, emphasis blocks, cookie consent panels |

### 1.3 Color Usage Rules

- **Lime Pulse is a binary signal.** `#4cc02b` is the single chromatic element. It appears as an 8px status dot next to live states, or as a checkmark in pricing cards. Never use it as a button fill, page accent, or decorative block color.
- **One chromatic element per viewport.** The discipline is the brand. Adding a secondary brand color or status spectrum dilutes the architectural feel.
- **No shadows as decoration.** If depth is needed, shift surface tone from white → stone → graphite. Shadows are reserved for glass overlays and floating widgets only.
- **Stack maximum three surface tones per screen.** Canvas → white → stone. Any deeper stacking breaks the warmth.

---

## 2. Typography Tokens

### 2.1 Typefaces

**Switzer** — Primary typeface for all UI, body, headings, and buttons.

Weight 400 dominates even at display sizes — headlines whisper rather than shout, which gives the brand authority through restraint. The Minor Third scale (1.2) is unusually compressed for a SaaS site, so sizes cluster more tightly than a Major Third or Perfect Fourth system would produce.

| Property | Value |
|----------|-------|
| CSS Custom Property | `--font-switzer` |
| Design Token | `font.switzer` |
| Stack | `'Switzer', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif` |
| Substitutes | Inter, Manrope, or DM Sans at matching weights |
| Weights Used | 400, 500, 600 |
| Sizes | 12, 14, 16, 17, 19, 23, 27, 32, 38, 40, 45, 64, 80 |
| Line Heights | 0.8 / 1.0 / 1.2 / 1.3 / 1.35 / 1.4 / 1.5 / 1.77 |
| Letter Spacing | -0.02em at 80px display, -0.01em at 64px and below, normal at body sizes |

**system-ui** — Icon-internal text and OS-native labels — minimal usage, mostly decorative.

| Property | Value |
|----------|-------|
| CSS Custom Property | `--font-system-ui` |
| Design Token | `font.system-ui` |
| Weights | 400 |
| Sizes | 16px |
| Line Height | 1.0 |

**sans-serif** — Detected in extracted data.

| Property | Value |
|----------|-------|
| CSS Custom Property | `--font-sans-serif` |
| Design Token | `font.sans-serif` |
| Weights | 400, 600 |
| Sizes | 15px |
| Line Height | 1.6 |
| Letter Spacing | 0.007em |

### 2.2 Type Scale

| Role | Size | Line Height | Letter Spacing | CSS Token |
|------|------|-------------|----------------|-----------|
| small | 12px | 1.77 | — | `--text-small` |
| caption | 14px | 1.5 | — | `--text-caption` |
| body-sm | 16px | 1.5 | — | `--text-body-sm` |
| body | 19px | 1.4 | -0.19px | `--text-body` |
| body-lg | 23px | 1.35 | -0.23px | `--text-body-lg` |
| subheading | 27px | 1.3 | -0.27px | `--text-subheading` |
| heading-sm | 32px | 1.3 | -0.32px | `--text-heading-sm` |
| heading | 45px | 1.2 | -0.45px | `--text-heading` |
| heading-lg | 64px | 0.8 | -0.64px | `--text-heading-lg` |
| display | 80px | 1.0 | -1.6px | `--text-display` |

### 2.3 Typography Composite Tokens (Full Detail)

| Token | Font Family | Font Size | Weight | Line Height | Description |
|-------|-------------|-----------|--------|-------------|-------------|
| `typography.xs` | Switzer | 12px | 400 | 1.77 | Small labels, captions |
| `typography.sm` | Switzer | 14px | 400 | 1.5 | Caption standard |
| `typography.sm-2` | Switzer | 14px | 400 | 1.4 | Caption tight |
| `typography.base` | sans-serif | 15px | 400 | 1.6 | Base body |
| `typography.base-2` | sans-serif | 15px | 600 | 1.6 | Base body semibold |
| `typography.base-3` | sans-serif | 15px | 600 | 1.6 | Base body semibold alias |
| `typography.base-4` | Switzer | 16px | 400 | 1.5 | Body small |
| `typography.base-5` | Switzer | 16px | 600 | 1.5 | Body small semibold |
| `typography.base-6` | system-ui | 16px | 400 | 1.0 | OS-native labels |
| `typography.lg` | Switzer | 17px | 400 | 1.4 | Large body |
| `typography.lg-2` | Switzer | 19px | 400 | 1.4 | Primary body |
| `typography.xl` | Switzer | 23px | 400 | 1.35 | Body large |
| `typography.2xl` | Switzer | 27px | 400 | 1.3 | Subheading |
| `typography.3xl` | Switzer | 32px | 400 | 1.3 | Heading small |
| `typography.4xl` | Switzer | 38px | 400 | 1.3 | Heading mid |
| `typography.4xl-2` | Switzer | 40px | 400 | 0.6 | Heading mid tight |
| `typography.4xl-3` | Switzer | 45px | 400 | 1.2 | Heading |
| `typography.5xl` | Switzer | 64px | 400 | 0.8 | Heading large |
| `typography.5xl-2` | Switzer | 64px | 400 | 1.1 | Heading large comfortable |
| `typography.5xl-3` | Switzer | 80px | 500 | 1.0 | Display |

### 2.4 Typography Rules

- **Weight 400 at display sizes is the signature.** Do not bold headlines above body weight; heavier weights belong in buttons and badges only.
- **Tight negative tracking at scale.** -0.01em at 64px and below, -0.02em at 80px display. Never apply positive tracking to body copy — it breaks the tight architectural feel.
- **Weight 500 is exceptional.** Reserved for the display headline (80px) and the product wordmark. Everything else rides at 400.

---

## 3. Spacing Tokens

**Base unit:** 6px  
**Density:** Comfortable

### 3.1 Spacing Scale

| Name | Value | CSS Custom Property | Design Token |
|------|-------|--------------------|----|
| unit | 6px | `--spacing-unit` | `spacing.unit` |
| 6 | 6px | `--spacing-6` | `spacing.6` |
| 12 | 12px | `--spacing-12` | `spacing.12` |
| 18 | 18px | `--spacing-18` | `spacing.18` |
| 24 | 24px | `--spacing-24` | `spacing.24` |
| 36 | 36px | `--spacing-36` | `spacing.36` |
| 48 | 48px | `--spacing-48` | `spacing.48` |
| 60 | 60px | `--spacing-60` | `spacing.60` |
| 72 | 72px | `--spacing-72` | `spacing.72` |
| 84 | 84px | `--spacing-84` | `spacing.84` |
| 96 | 96px | `--spacing-96` | `spacing.96` |
| 138 | 138px | `--spacing-138` | `spacing.138` |

---

## 4. Border Radius Tokens

### 4.1 Radius Scale

| Alias | Value | CSS Custom Property | Design Token | Named Usage |
|-------|-------|--------------------|----|-------------|
| md | 3.75px | `--radius-md` | `radius.md` | Small elements, consent dialogs (`--radius-smallelements`) |
| md-2 | 6px | `--radius-md-2` | `radius.md-2` | Inner tiles (`--radius-innertiles`) |
| xl | 12px | `--radius-xl` | `radius.xl` | Cards (`--radius-cards`) |
| 3xl | 30px | `--radius-3xl` | `radius.3xl` | — |
| full | 48px | `--radius-full` | `radius.full` | — |
| full-2 | 200px | `--radius-full-2` | `radius.full-2` | Buttons and pills (`--radius-buttons`, `--radius-pills`) |
| full-3 | 9999px | `--radius-full-3` | `radius.full-3` | Avatars (`--radius-avatars`) |

### 4.2 Named Component Radii

| Element | Value | CSS Custom Property |
|---------|-------|---------------------|
| cards | 12px | `--radius-cards` |
| pills | 200px | `--radius-pills` |
| avatars | 9999px | `--radius-avatars` |
| buttons | 200px | `--radius-buttons` |
| innerTiles | 6px | `--radius-innertiles` |
| smallElements | 3.75px | `--radius-smallelements` |

**Rule:** Use 200px radius on every button and pill — the capsule shape is non-negotiable for brand recognition. Only consent dialogs may use the 3.75px sharp corner; it is the system's intentional outlier.

---

## 5. Layout Tokens

| Property | Value | CSS Custom Property |
|----------|-------|---------------------|
| Page max-width | 1200px | `--page-max-width` |
| Section gap | 80px | `--section-gap` |
| Card padding | 18px | `--card-padding` |
| Element gap | 9px | `--element-gap` |

### 5.1 Layout Principles

Max-width 1200px centered container with generous outer padding. Hero is a centered text stack (display headline, sub-headline, description, trust bar, dual CTA) followed by a full-width product screenshot with gradient backdrop. Sections alternate between linen canvas and white card surfaces separated by 80px gaps. Feature blocks use a 2-column text-plus-screenshot layout that alternates sides. Pricing is a 4-column card grid with equal widths. Navigation is a single transparent top bar with logo left and pill CTA right.

---

## 6. Elevation & Shadows

| Name | Value | CSS Custom Property | Design Token | Usage |
|------|-------|--------------------|----|-------|
| xl | `rgba(0, 0, 0, 0.3) 0px 32px 68px 0px` | `--shadow-xl` | `shadow.xl` | Floating chat widget |
| xl-2 | `rgba(16, 24, 40, 0.12) 0px 18px 55px 0px` | `--shadow-xl-2` | `shadow.xl-2` | Glass overlay panel |

**Rule:** Shadows are not used for decoration. Depth is expressed by stepping the surface tone (linen → white → stone → glass → graphite). The two shadow tokens exist exclusively for floating/modal surfaces.

---

## 7. Components

### 7.1 Pill Button — Dark (Primary)

**Role:** Primary CTA

Matte black capsule. Background `#141414`, text `#ffffff`, border-radius 200px, padding `0 18px`, height ≈44px. Weight 400 in Switzer at 16px. Letter-spacing inherits body tracking. The chromatic-free CTA is the system's signature.

### 7.2 Pill Button — Stone (Secondary)

**Role:** Secondary action, pricing CTA

Warm sage capsule. Background `#dbdbd2`, text `#292929`, optional 1-2px `#292929` border, border-radius 200px, padding `0 24px`, height ≈44px. Same Switzer 16px/400 as primary. The workhorse — pricing cards, demo buttons, and feature CTAs use this instead of dark fill.

### 7.3 Pill Button — Ghost (Tertiary)

**Role:** Inline link, low-emphasis action

Transparent fill, 1px `#353535` border, text `#353535`, border-radius 200px, padding `9px 12px`. Smaller padding marks it as a lightweight control, not a section-level CTA.

### 7.4 Square White Button

**Role:** Consent dialog action — intentional outlier

Background `#ffffff`, text `#000000`, border-radius 3.75px (sharp — breaks the pill language intentionally for cookie/consent contexts), padding 15px square. Use only when the pill vocabulary is wrong for the context.

### 7.5 Feature Card — Warm Stone

**Role:** Feature highlight, de-emphasized panel

Background `#dbdbd2`, border-radius 12px, padding 18px, no shadow. Used for secondary feature blocks that should recede behind the main white content card.

### 7.6 Feature Card — White

**Role:** Primary content panel

Background `#ffffff`, border-radius 12px, padding 18px, optional 1px solid `#0000001f` border. The default elevated surface. No shadow by default; depth comes from the warmer canvas behind it.

### 7.7 Glass Overlay Panel

**Role:** Floating widget, sticky chat

Background `rgba(255, 255, 255, 0.7)`, border-radius 6px, padding 18px, `backdrop-filter: blur(12px)`. Shadow: `rgba(0,0,0,0.3) 0 32px 68px 0`. Used for the floating support widget and any UI that needs to float over imagery while staying legible.

### 7.8 Circular Accent Tile

**Role:** Category icon container, decorative dot

Background `#c0c0c0`, border-radius 50%, no padding (icon centered inside). Functions as a quiet visual marker — never the primary CTA, always a supporting element.

### 7.9 Navigation Bar

**Role:** Top-level site navigation

Transparent background over linen canvas. Logo + product nav + auth links + dark pill CTA right-aligned. Height ≈60px. Nav text in `#353535` at 14–16px Switzer 400.

**Example implementation:**
- Logo: Switzer 500, 16px, `#292929`
- Nav links: Switzer 400, 14px, `#353535`, 24px horizontal gap
- Right cluster: Login link `#353535` + dark pill (`#141414` fill, white text, 200px radius, `0 18px` padding)

### 7.10 Pricing Card

**Role:** Pricing tier display

Background `#dbdbd2` with 12px radius and 18px padding. Tier name and price at 32px/27px Switzer 400. Checklist uses Lime Pulse (`#4cc02b`) checkmarks at 14-16px. Featured tier gains a subtle gradient highlight strip across the top edge.

### 7.11 Trust Bar

**Role:** Social proof row

Horizontal row of grayscale customer logos with one-line caption at left. Logos desaturated to monochrome at 60-80% opacity. 9-12px vertical gap between logo and caption.

### 7.12 Status Dot

**Role:** Online indicator, success pulse

8px circle filled with `#4cc02b` (Lime Pulse). The **single chromatic element** in the system — appears next to live chat, active features, and system status. Use sparingly.

### 7.13 Display Headline

**Role:** Hero and major section titles

Switzer 500 at 80px, line-height 1.0, letter-spacing -1.6px, color `#292929`. Or Switzer 400 at 64px, line-height 0.8, letter-spacing -0.64px. The tight leading at scale is the system's typographic signature.

### 7.14 Body Text

**Role:** Paragraph copy and descriptions

Switzer 400 at 19px, line-height 1.4, letter-spacing -0.19px, color `#292929` primary / `#6f6f6e` muted. Max comfortable reading width 560px within content columns.

---

## 8. Imagery and Visual Language

Product screenshots dominate over photography. The hero features a full app interface rendered against a soft gradient backdrop of lavender, teal, and peach (decorative — not part of the design system palette). Secondary imagery is tight UI crops with no lifestyle context. No stock photography, no illustrations, no 3D renders.

Icons are monoline outlined at consistent stroke weight, sitting flat on circular Pebble (`#c0c0c0`) tiles. The visual narrative is entirely product-led: the interface IS the hero.

**Color treatment is strictly limited:** graphite and stone carry all UI weight. Lime Pulse appears only as a dot or checkmark. The gradient zone is reserved for the hero product screenshot backdrop only — never applied to buttons, cards, or text.

---

## 9. Do's and Don'ts

### Do

- Use 200px border-radius on every button and pill — the capsule shape is non-negotiable for brand recognition
- Set primary CTAs to `#141414` fill with white text; use the stone (`#dbdbd2`) capsule as the default for any non-purchase action
- Keep headlines at weight 400 Switzer with -0.01em tracking at 64px and below, -0.02em at 80px display — never bold a headline above body weight
- Use the linen canvas (`#edede8`) as the base; place white (`#ffffff`) cards on top for contrast, and step down to stone (`#dbdbd2`) for de-emphasized content
- Apply `backdrop-filter: blur(12px)` to any panel that floats over imagery or gradient backgrounds
- Use `#4cc02b` Lime Pulse only as a status dot or checkmark — never as a button fill, page accent, or decorative color
- Pair the 6px base unit for inline gaps with 18px card padding and 80px section gaps to maintain comfortable density

### Don't

- Do not introduce a brand-colored CTA — the system is intentionally achromatic; colored buttons break the architectural language
- Do not use bold (600+) on headlines — weight 400 at display sizes is the signature; heavier weights belong in buttons and badges only
- Do not stack more than three surface tones in one screen (canvas → white → stone); the palette is rationed to preserve warmth
- Do not use drop shadows as decoration — if depth is needed, shift surface tone from white to stone to graphite instead
- Do not apply sharp corners to feature cards or panels — 12px is the floor for content surfaces; only consent dialogs may use 3.75px
- Do not add gradients to UI elements — the gradient zone is reserved for the hero product screenshot backdrop only
- Do not use letter-spacing wider than -0.01em on body copy; positive tracking breaks the tight architectural feel

---

## 10. Quick Color Reference

| Role | Value |
|------|-------|
| Canvas (page base) | `#edede8` (Linen Canvas) |
| Card surface | `#ffffff` (Frosted White) |
| Secondary surface | `#dbdbd2` (Warm Stone) |
| Icon tile | `#c0c0c0` (Pebble) |
| Text primary | `#292929` (Charcoal Body) |
| Text secondary | `#6f6f6e` (Slate Caption) |
| Text nav / subdued | `#353535` (Iron Nav) |
| Text muted | `#8f8f8e` (Ash Subheading) |
| Hairline border | `#0000001f` (~8% black) |
| Border strong | `#000000` (Onyx Border) |
| Primary CTA fill | `#141414` (Graphite Ink) |
| Accent (status only) | `#4cc02b` (Lime Pulse) |
| Divider / hover hint | `#d0d0c8` (Quartz) |

---

## 11. Agent Prompt Guide

### Quick Component Recipes

**Hero Section:**
Linen canvas (`#edede8`) background, centered max-width 1200px. Display headline at 80px Switzer weight 500, color `#292929`, letter-spacing -1.6px. Sub-headline at 45px weight 400, color `#292929`. Body description at 19px weight 400, color `#6f6f6e`, line-height 1.4. Two CTAs centered: dark pill (`#141414` fill, white text, 200px radius, `0 18px` padding, 16px Switzer 400) followed by stone pill (`#dbdbd2` fill, `#292929` text, 200px radius, `0 24px` padding).

**Primary Action Button:**
`#141414` background, `#ffffff` text, 200px radius, compact pill padding `0 18px`. Switzer 400 at 16px.

**Feature Card:**
White surface (`#ffffff`), 12px radius, 18px padding, no shadow. Optional 1px `#0000001f` border. Heading at 27px Switzer 400 in `#292929`. Body text at 16px Switzer 400 in `#6f6f6e`, line-height 1.5. Optional circular accent tile (background `#c0c0c0`, 50% radius, 40px diameter) at top of card containing an outlined icon in `#353535`.

**Floating Chat Widget:**
Glass panel (`rgba(255,255,255,0.7)` with `backdrop-filter: blur(12px)`), 6px radius, 18px padding, shadow `rgba(0,0,0,0.3) 0 32px 68px 0`. Header text at 16px Switzer 400 in `#292929`. Status indicator: 8px Lime Pulse (`#4cc02b`) circle to the left of any "online" label. Position fixed bottom-right.

**Navigation Bar:**
Transparent background over linen canvas, height 60px, max-width 1200px centered. Logo at left in `#292929` at 16px Switzer 500. Center nav links at 14px Switzer 400 in `#353535` with 24px horizontal gap. Right cluster: Login link in `#353535` + dark pill CTA (`#141414` fill, white text, 200px radius, `0 18px` padding).

---

## 12. Implementation Reference

### 12.1 CSS Custom Properties (`variables.css`)

Full `:root` variable block for standard CSS usage:

```css
:root {
  /* Colors */
  --color-linen-canvas: #edede8;
  --color-frosted-white: #ffffff;
  --color-warm-stone: #dbdbd2;
  --color-pebble: #c0c0c0;
  --color-graphite-ink: #141414;
  --color-charcoal-body: #292929;
  --color-slate-caption: #6f6f6e;
  --color-ash-subheading: #8f8f8e;
  --color-iron-nav: #353535;
  --color-onyx-border: #000000;
  --color-quartz: #d0d0c8;
  --color-lime-pulse: #4cc02b;

  /* Typography — Font Families */
  --font-switzer: 'Switzer', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  --font-system-ui: 'system-ui', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  --font-sans-serif: 'sans-serif', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;

  /* Typography — Scale */
  --text-small: 12px;
  --leading-small: 1.77;
  --text-caption: 14px;
  --leading-caption: 1.5;
  --text-body-sm: 16px;
  --leading-body-sm: 1.5;
  --text-body: 19px;
  --leading-body: 1.4;
  --tracking-body: -0.19px;
  --text-body-lg: 23px;
  --leading-body-lg: 1.35;
  --tracking-body-lg: -0.23px;
  --text-subheading: 27px;
  --leading-subheading: 1.3;
  --tracking-subheading: -0.27px;
  --text-heading-sm: 32px;
  --leading-heading-sm: 1.3;
  --tracking-heading-sm: -0.32px;
  --text-heading: 45px;
  --leading-heading: 1.2;
  --tracking-heading: -0.45px;
  --text-heading-lg: 64px;
  --leading-heading-lg: 0.8;
  --tracking-heading-lg: -0.64px;
  --text-display: 80px;
  --leading-display: 1;
  --tracking-display: -1.6px;

  /* Typography — Weights */
  --font-weight-regular: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;

  /* Spacing */
  --spacing-unit: 6px;
  --spacing-6: 6px;
  --spacing-12: 12px;
  --spacing-18: 18px;
  --spacing-24: 24px;
  --spacing-36: 36px;
  --spacing-48: 48px;
  --spacing-60: 60px;
  --spacing-72: 72px;
  --spacing-84: 84px;
  --spacing-96: 96px;
  --spacing-138: 138px;

  /* Layout */
  --page-max-width: 1200px;
  --section-gap: 80px;
  --card-padding: 18px;
  --element-gap: 9px;

  /* Border Radius */
  --radius-md: 3.75px;
  --radius-md-2: 6px;
  --radius-xl: 12px;
  --radius-3xl: 30px;
  --radius-full: 48px;
  --radius-full-2: 200px;
  --radius-full-3: 9999px;

  /* Named Radii */
  --radius-cards: 12px;
  --radius-pills: 200px;
  --radius-avatars: 9999px;
  --radius-buttons: 200px;
  --radius-innertiles: 6px;
  --radius-smallelements: 3.75px;

  /* Shadows */
  --shadow-xl: rgba(0, 0, 0, 0.3) 0px 32px 68px 0px;
  --shadow-xl-2: rgba(16, 24, 40, 0.12) 0px 18px 55px 0px;

  /* Surfaces */
  --surface-linen-canvas: #edede8;
  --surface-frosted-white: #ffffff;
  --surface-warm-stone: #dbdbd2;
  --surface-glass-overlay: #ffffffb3;
  --surface-graphite: #141414;
}
```

### 12.2 Tailwind v4 (`theme.css`)

Full `@theme` block for Tailwind v4 usage:

```css
@theme {
  /* Colors */
  --color-linen-canvas: #edede8;
  --color-frosted-white: #ffffff;
  --color-warm-stone: #dbdbd2;
  --color-pebble: #c0c0c0;
  --color-graphite-ink: #141414;
  --color-charcoal-body: #292929;
  --color-slate-caption: #6f6f6e;
  --color-ash-subheading: #8f8f8e;
  --color-iron-nav: #353535;
  --color-onyx-border: #000000;
  --color-quartz: #d0d0c8;
  --color-lime-pulse: #4cc02b;

  /* Typography */
  --font-switzer: 'Switzer', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  --font-system-ui: 'system-ui', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  --font-sans-serif: 'sans-serif', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;

  /* Typography — Scale */
  --text-small: 12px;
  --leading-small: 1.77;
  --text-caption: 14px;
  --leading-caption: 1.5;
  --text-body-sm: 16px;
  --leading-body-sm: 1.5;
  --text-body: 19px;
  --leading-body: 1.4;
  --tracking-body: -0.19px;
  --text-body-lg: 23px;
  --leading-body-lg: 1.35;
  --tracking-body-lg: -0.23px;
  --text-subheading: 27px;
  --leading-subheading: 1.3;
  --tracking-subheading: -0.27px;
  --text-heading-sm: 32px;
  --leading-heading-sm: 1.3;
  --tracking-heading-sm: -0.32px;
  --text-heading: 45px;
  --leading-heading: 1.2;
  --tracking-heading: -0.45px;
  --text-heading-lg: 64px;
  --leading-heading-lg: 0.8;
  --tracking-heading-lg: -0.64px;
  --text-display: 80px;
  --leading-display: 1;
  --tracking-display: -1.6px;

  /* Spacing */
  --spacing-6: 6px;
  --spacing-12: 12px;
  --spacing-18: 18px;
  --spacing-24: 24px;
  --spacing-36: 36px;
  --spacing-48: 48px;
  --spacing-60: 60px;
  --spacing-72: 72px;
  --spacing-84: 84px;
  --spacing-96: 96px;
  --spacing-138: 138px;

  /* Border Radius */
  --radius-md: 3.75px;
  --radius-md-2: 6px;
  --radius-xl: 12px;
  --radius-3xl: 30px;
  --radius-full: 48px;
  --radius-full-2: 200px;
  --radius-full-3: 9999px;

  /* Shadows */
  --shadow-xl: rgba(0, 0, 0, 0.3) 0px 32px 68px 0px;
  --shadow-xl-2: rgba(16, 24, 40, 0.12) 0px 18px 55px 0px;
}
```

### 12.3 Design Tokens JSON (`tokens.json`)

Full W3C Design Token format for use with Style Dictionary, Theo, or Tokens Studio:

```json
{
  "color": {
    "linen-canvas": {
      "$value": "#edede8",
      "$type": "color",
      "$description": "Linen Canvas — Page background, section surfaces — warm off-white that pushes the whole system toward paper rather than screen"
    },
    "frosted-white": {
      "$value": "#ffffff",
      "$type": "color",
      "$description": "Frosted White — Card surfaces, elevated panels, glass overlays — clean white floats above the linen canvas for primary content"
    },
    "warm-stone": {
      "$value": "#dbdbd2",
      "$type": "color",
      "$description": "Warm Stone — Secondary card fills, secondary button backgrounds, accent surface — sage-tinted beige gives neutral elements warmth without becoming chromatic"
    },
    "pebble": {
      "$value": "#c0c0c0",
      "$type": "color",
      "$description": "Pebble — Circular accent tiles, muted card backgrounds — cool gray that sits one step back from stone for de-emphasized surfaces"
    },
    "graphite-ink": {
      "$value": "#141414",
      "$type": "color",
      "$description": "Graphite Ink — Primary action button background, dark text on light surfaces — near-black with a hair of warmth, anchors every CTA"
    },
    "charcoal-body": {
      "$value": "#292929",
      "$type": "color",
      "$description": "Charcoal Body — Primary body and heading text — readable but softer than pure black, keeps long-form copy from feeling harsh"
    },
    "slate-caption": {
      "$value": "#6f6f6e",
      "$type": "color",
      "$description": "Slate Caption — Secondary body, helper text, descriptive copy — carries the most volume of any text color"
    },
    "ash-subheading": {
      "$value": "#8f8f8e",
      "$type": "color",
      "$description": "Ash Subheading — Subtle labels, muted headings, decorative type — sits between caption and hairline"
    },
    "iron-nav": {
      "$value": "#353535",
      "$type": "color",
      "$description": "Iron Nav — Secondary body text, navigation labels, and subdued headings. Do not promote it to the primary CTA color"
    },
    "onyx-border": {
      "$value": "#000000",
      "$type": "color",
      "$description": "Onyx Border — Hairline borders, strong dividers, selected-state outlines — used at 1-2px to outline cards, buttons, and focus rings"
    },
    "quartz": {
      "$value": "#d0d0c8",
      "$type": "color",
      "$description": "Quartz — Quietest surface tint, reserved for low-contrast dividers and hover-state hints"
    },
    "lime-pulse": {
      "$value": "#4cc02b",
      "$type": "color",
      "$description": "Lime Pulse — Green wash for highlight backgrounds, decorative bands, and soft emphasis behind content. Use as a supporting accent, not as a status color"
    }
  },
  "font": {
    "switzer": {
      "$value": "Switzer",
      "$type": "fontFamily",
      "$description": "Primary typeface for all UI, body, headings, and buttons. Weight 400 dominates even at display sizes — headlines whisper rather than shout, which gives the brand authority through restraint. The Minor Third scale (1.2) is unusually compressed for a SaaS site, so sizes cluster more tightly than a Major Third or Perfect Fourth system would produce."
    },
    "system-ui": {
      "$value": "system-ui",
      "$type": "fontFamily",
      "$description": "Icon-internal text and OS-native labels — minimal usage, mostly decorative"
    },
    "sans-serif": {
      "$value": "sans-serif",
      "$type": "fontFamily",
      "$description": "sans-serif — detected in extracted data but not described by AI"
    }
  },
  "typography": {
    "xs": { "$value": { "fontFamily": "Switzer", "fontSize": "12px", "fontWeight": 400, "lineHeight": 1.77 }, "$type": "typography", "$description": "Typography step xs at 12px" },
    "sm": { "$value": { "fontFamily": "Switzer", "fontSize": "14px", "fontWeight": 400, "lineHeight": 1.5 }, "$type": "typography", "$description": "Typography step sm at 14px" },
    "sm-2": { "$value": { "fontFamily": "Switzer", "fontSize": "14px", "fontWeight": 400, "lineHeight": 1.4 }, "$type": "typography", "$description": "Typography step sm-2 at 14px" },
    "base": { "$value": { "fontFamily": "sans-serif", "fontSize": "15px", "fontWeight": 400, "lineHeight": 1.6 }, "$type": "typography", "$description": "Typography step base at 15px" },
    "base-2": { "$value": { "fontFamily": "sans-serif", "fontSize": "15px", "fontWeight": 600, "lineHeight": 1.6 }, "$type": "typography", "$description": "Typography step base-2 at 15px" },
    "base-3": { "$value": { "fontFamily": "sans-serif", "fontSize": "15px", "fontWeight": 600, "lineHeight": 1.6 }, "$type": "typography", "$description": "Typography step base-3 at 15px" },
    "base-4": { "$value": { "fontFamily": "Switzer", "fontSize": "16px", "fontWeight": 400, "lineHeight": 1.5 }, "$type": "typography", "$description": "Typography step base-4 at 16px" },
    "base-5": { "$value": { "fontFamily": "Switzer", "fontSize": "16px", "fontWeight": 600, "lineHeight": 1.5 }, "$type": "typography", "$description": "Typography step base-5 at 16px" },
    "base-6": { "$value": { "fontFamily": "system-ui", "fontSize": "16px", "fontWeight": 400, "lineHeight": 1 }, "$type": "typography", "$description": "Typography step base-6 at 16px" },
    "lg": { "$value": { "fontFamily": "Switzer", "fontSize": "17px", "fontWeight": 400, "lineHeight": 1.4 }, "$type": "typography", "$description": "Typography step lg at 17px" },
    "lg-2": { "$value": { "fontFamily": "Switzer", "fontSize": "19px", "fontWeight": 400, "lineHeight": 1.4 }, "$type": "typography", "$description": "Typography step lg-2 at 19px" },
    "xl": { "$value": { "fontFamily": "Switzer", "fontSize": "23px", "fontWeight": 400, "lineHeight": 1.35 }, "$type": "typography", "$description": "Typography step xl at 23px" },
    "2xl": { "$value": { "fontFamily": "Switzer", "fontSize": "27px", "fontWeight": 400, "lineHeight": 1.3 }, "$type": "typography", "$description": "Typography step 2xl at 27px" },
    "3xl": { "$value": { "fontFamily": "Switzer", "fontSize": "32px", "fontWeight": 400, "lineHeight": 1.3 }, "$type": "typography", "$description": "Typography step 3xl at 32px" },
    "4xl": { "$value": { "fontFamily": "Switzer", "fontSize": "38px", "fontWeight": 400, "lineHeight": 1.3 }, "$type": "typography", "$description": "Typography step 4xl at 38px" },
    "4xl-2": { "$value": { "fontFamily": "Switzer", "fontSize": "40px", "fontWeight": 400, "lineHeight": 0.6 }, "$type": "typography", "$description": "Typography step 4xl-2 at 40px" },
    "4xl-3": { "$value": { "fontFamily": "Switzer", "fontSize": "45px", "fontWeight": 400, "lineHeight": 1.2 }, "$type": "typography", "$description": "Typography step 4xl-3 at 45px" },
    "5xl": { "$value": { "fontFamily": "Switzer", "fontSize": "64px", "fontWeight": 400, "lineHeight": 0.8 }, "$type": "typography", "$description": "Typography step 5xl at 64px" },
    "5xl-2": { "$value": { "fontFamily": "Switzer", "fontSize": "64px", "fontWeight": 400, "lineHeight": 1.1 }, "$type": "typography", "$description": "Typography step 5xl-2 at 64px" },
    "5xl-3": { "$value": { "fontFamily": "Switzer", "fontSize": "80px", "fontWeight": 500, "lineHeight": 1 }, "$type": "typography", "$description": "Typography step 5xl-3 at 80px" }
  },
  "spacing": {
    "unit": { "$value": "6px", "$type": "dimension", "$description": "Base spacing unit" },
    "6": { "$value": "6px", "$type": "dimension", "$description": "Spacing 6px" },
    "12": { "$value": "12px", "$type": "dimension", "$description": "Spacing 12px" },
    "18": { "$value": "18px", "$type": "dimension", "$description": "Spacing 18px" },
    "24": { "$value": "24px", "$type": "dimension", "$description": "Spacing 24px" },
    "36": { "$value": "36px", "$type": "dimension", "$description": "Spacing 36px" },
    "48": { "$value": "48px", "$type": "dimension", "$description": "Spacing 48px" },
    "60": { "$value": "60px", "$type": "dimension", "$description": "Spacing 60px" },
    "72": { "$value": "72px", "$type": "dimension", "$description": "Spacing 72px" },
    "84": { "$value": "84px", "$type": "dimension", "$description": "Spacing 84px" },
    "96": { "$value": "96px", "$type": "dimension", "$description": "Spacing 96px" },
    "138": { "$value": "138px", "$type": "dimension", "$description": "Spacing 138px" }
  },
  "radius": {
    "md": { "$value": "3.75px", "$type": "dimension", "$description": "Border radius md — small elements, consent dialogs" },
    "md-2": { "$value": "6px", "$type": "dimension", "$description": "Border radius md-2 — inner tiles" },
    "xl": { "$value": "12px", "$type": "dimension", "$description": "Border radius xl — cards" },
    "3xl": { "$value": "30px", "$type": "dimension", "$description": "Border radius 3xl" },
    "full": { "$value": "48px", "$type": "dimension", "$description": "Border radius full" },
    "full-2": { "$value": "200px", "$type": "dimension", "$description": "Border radius full-2 — buttons and pills" },
    "full-3": { "$value": "9999px", "$type": "dimension", "$description": "Border radius full-3 — avatars" }
  },
  "shadow": {
    "xl": {
      "$value": "rgba(0, 0, 0, 0.3) 0px 32px 68px 0px",
      "$type": "shadow",
      "$description": "Shadow elevation xl — floating chat widget"
    },
    "xl-2": {
      "$value": "rgba(16, 24, 40, 0.12) 0px 18px 55px 0px",
      "$type": "shadow",
      "$description": "Shadow elevation xl-2 — glass overlay panel"
    }
  },
  "surface": {
    "linen-canvas": {
      "$value": "#edede8",
      "$type": "color",
      "$description": "Surface level 0: Page background — warm off-white that warms the entire system"
    },
    "frosted-white": {
      "$value": "#ffffff",
      "$type": "color",
      "$description": "Surface level 1: Primary card surface, feature panels, elevated content blocks"
    },
    "warm-stone": {
      "$value": "#dbdbd2",
      "$type": "color",
      "$description": "Surface level 2: Secondary surface for pricing cards, de-emphasized panels, button backgrounds"
    },
    "glass-overlay": {
      "$value": "#ffffffb3",
      "$type": "color",
      "$description": "Surface level 3: Floating panels, chat widgets, sticky elements — paired with backdrop blur(12px)"
    },
    "graphite": {
      "$value": "#141414",
      "$type": "color",
      "$description": "Surface level 4: Inverted surface — dark CTAs, emphasis blocks, cookie consent panels"
    }
  },
  "$extensions": {
    "com.refero.extraction": {
      "url": "https://gleap.io",
      "siteName": "Gleap",
      "extractedAt": "2026-07-03T03:13:43.210Z",
      "variant": "extended"
    }
  }
}
```

---

## 13. Similar References

Design references sharing the same visual grammar — warm paper canvas, single chromatic accent, weight-400 headlines, and capsule CTAs:

| Brand | Similarity |
|-------|------------|
| Linear | Same weight-400-at-display-sizes typography discipline and matte black pill-button vocabulary; both reject colored CTAs in favor of monochrome depth |
| Vercel | Similar warm off-white canvas with tight tracking and pill-shaped controls; both treat color as rationed punctuation rather than decoration |
| Resend | Shared architectural flatness — warm neutral surfaces, minimal shadows, product-screenshot-as-hero imagery, and weight 400 headlines |
| Frame.io | Same dual-pill CTA pairing (dark primary + light secondary) and warm-paper product aesthetic with desaturated supporting imagery |
| Stripe (docs) | Identical approach to typography tracking (-0.01em at large sizes) and the same rationed chromatic palette with one accent green for status |

---

*Source files: `DESIGN.md`, `variables.css`, `theme.css`, `tokens.json`*
