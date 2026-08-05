# Design System

**Kleos** — Visual Identity, Design Tokens, Component Specifications, and Implementation Reference

> Citrine beacon in void — a glowing lime cube anchoring a dark room, with thin white type and scattered node rings floating around it.

---

## Design Philosophy

Kleos speaks in a single dramatic gesture: a luminous citrine cube floating in deep carbon void, surrounded by orbiting nodes and fragments of structured thought. The interface is almost entirely dark with one electric lime accent (`#e5ff5d`) that does all the chromatic work — primary actions, icon strokes, decorative cubes, brand marks.

Typography is a single humanist sans (Neue Haas Grotesk) set with confident, slightly tight tracking, where 80px display headlines occupy entire rows and small labels earn positive tracking. The page oscillates between dense dark sections packed with constellation diagrams and one cream reversal where giant translucent cubes frame a centered message.

Every screen should feel like looking into a server room through a viewport — dark, quiet, punctuated by one bright signal.

---

## Theme

**Mode:** Mixed (primarily dark, one cream reversal band per page)
**Base:** Dark canvas (`#111111`) with single chromatic accent (`#e5ff5d`)
**Rhythm:** DARK HERO → DARK CONTENT → DARK FEATURE → LIGHT REVERSAL → (DARK CONTINUES)

---

## 1. Color Tokens

### 1.1 Color Palette — Full Specification

| Name | Value | CSS Custom Property | Design Token | Role |
|------|-------|--------------------|----|------|
| Citrine Signal | `#e5ff5d` | `--color-citrine-signal` | `color.citrine-signal` | Primary action buttons, brand cube fills, accent icon strokes, decorative 3D cubes, featured logo marks — the single chromatic voice of the system |
| Carbon Black | `#111111` | `--color-carbon-black` | `color.carbon-black` | Page canvas, primary text on light sections, dominant border color, button fills on reversed (light) sections |
| Bone White | `#f9f9f9` | `--color-bone-white` | `color.bone-white` | Primary text on dark canvas, nav and body text, light icon fills, ghost button text |
| Graphite | `#2b2b2b` | `--color-graphite` | `color.graphite` | Elevated surface above carbon, secondary panels, darker card variants |
| Ash | `#6e6e6e` | `--color-ash` | `color.ash` | Muted card surface, tertiary background layers behind content blocks |
| Stone | `#9c9c9c` | `--color-stone` | `color.stone` | Muted body text, secondary link text, low-priority borders, helper labels |
| Smoke | `#565656` | `--color-smoke` | `color.smoke` | Dividers, subtle borders, decorative strokes in illustrations |
| Chalk | `#d6d6d6` | `--color-chalk` | `color.chalk` | Card borders on dark sections, hairline dividers between content blocks |
| Cream Paper | `#eeeeee` | `--color-cream-paper` | `color.cream-paper` | Light section background — the single warm reversal that breaks the dark rhythm |
| Pure Black | `#000000` | `--color-pure-black` | `color.pure-black` | Maximum contrast text, logo silhouettes, hard-edge decorative fills |
| Sand | `#b7b3a2` | `--color-sand` | `color.sand` | Warm-tinted decorative fills, illustration accents — the only chromatic neutral |

### 1.2 Surface Hierarchy

| Level | Name | Value | CSS Custom Property | Design Token | Purpose |
|-------|------|-------|--------------------|----|---------|
| 1 | Carbon Canvas | `#111111` | `--surface-carbon-canvas` | `surface.carbon-canvas` | Page base — majority of the experience lives here |
| 2 | Graphite Panel | `#2b2b2b` | `--surface-graphite-panel` | `surface.graphite-panel` | Elevated cards and panels sitting on the carbon canvas |
| 3 | Ash Plate | `#6e6e6e` | `--surface-ash-plate` | `surface.ash-plate` | Muted secondary surfaces, logo cloud backgrounds |
| 4 | Cream Reversal | `#eeeeee` | `--surface-cream-reversal` | `surface.cream-reversal` | Light section — the single bright band that resets the eye |

### 1.3 Color Usage Rules

- **Citrine Signal** is a binary signal. It is either fully on (`#e5ff5d`) or off. Never use multiple shades of lime for hover/active states. Rely on opacity shifts and surface steps for state changes.
- **One primary action per viewport.** The lime against carbon creates the highest-attention signal in the system — use it sparingly. Never more than one filled citrine element per viewport.
- **No second chromatic accent.** The system's power comes from single-color discipline. Adding blue, red, or purple destroys the signal-to-noise ratio.
- **One cream reversal per page.** Stacking light sections dilutes the reversal's impact. The brightness reset is the page's dramatic beat.

---

## 2. Typography Tokens

### 2.1 Typeface

**Neue Haas Grotesk Text** — Sole typeface across the entire system.

Weight 400 carries body, nav, and most UI. Weight 500 is reserved for emphasized labels and button text. Display headlines at 80px with 0.90 line-height create the signature monolithic rows. Small labels (10–12px) use positive tracking (+0.020 to +0.032em) to read as uppercase utility marks. The humanist geometry of Haas Grotesk — slightly humanist terminals, even stroke contrast — gives the dark interface a warm, editorial quality rather than feeling like a terminal.

| Property | Value |
|----------|-------|
| CSS Custom Property | `--font-neue-haas-grotesk-text` |
| Design Token | `font.neue-haas-grotesk-text` |
| Stack | `'Neue Haas Grotesk Text', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif` |
| Substitutes | Inter, Soehne, Neue Haas Grotesk Display |
| Weights Used | 400 (regular), 500 (medium) |
| OpenType Features | `"kern" on, "liga" on` |

### 2.2 Type Scale

| Role | Size | Line Height | Letter Spacing | CSS Token | Design Token |
|------|------|-------------|----------------|-----------|--------------|
| utility-label | 10px | 1.5 | +0.32px | `--text-utility-label` | `typography.xs` |
| caption | 12px | 1.5 | +0.24px | `--text-caption` | `typography.xs-4` |
| body-sm | 14px | 1.5 | — | `--text-body-sm` | — |
| body | 16px | 1.5 | — | `--text-body` | `typography.base` |
| subhead | 20px | 1.3 | — | `--text-subhead` | `typography.xl` |
| heading-sm | 24px | 1.2 | -0.24px | `--text-heading-sm` | `typography.2xl` |
| heading | 48px | 1.1 | -0.48px | `--text-heading` | — |
| display | 80px | 0.9 | -0.80px | `--text-display` | `typography.5xl` |

### 2.3 Typography Composite Tokens (Full Detail)

These are the exact composite typography steps from the design token file:

| Token | Font Size | Weight | Line Height | Description |
|-------|-----------|--------|-------------|-------------|
| `typography.xs` | 10px | 500 | 1.3 | Utility label — medium weight, tight |
| `typography.xs-2` | 10px | 500 | 1.0 | Utility label — single-line height |
| `typography.xs-3` | 10px | 400 | 2.08 | Utility label — loose, body weight |
| `typography.xs-4` | 12px | 400 | 1.73 | Caption — body weight, airy |
| `typography.xs-5` | 12px | 400 | 1.3 | Caption — tight |
| `typography.base` | 16px | 400 | 1.3 | Body base — standard |
| `typography.base-2` | 16px | 400 | 1.0 | Body base — single-line |
| `typography.base-3` | 16px | 500 | 1.3 | Body base — medium weight |
| `typography.base-4` | 16px | 400 | 1.2 | Body base — snug |
| `typography.base-5` | 16px | 400 | 1.3 | Body base — alias |
| `typography.xl` | 20px | 400 | 1.5 | Subhead — comfortable |
| `typography.2xl` | 24px | 400 | 1.2 | Heading small — snug |
| `typography.2xl-2` | 24px | 400 | 1.2 | Heading small — alias |
| `typography.5xl` | 80px | 400 | 0.9 | Display — signature line-height |
| `typography.5xl-2` | 80px | 400 | 1.0 | Display — neutral line-height |

### 2.4 Typography Rules

- **Weight 400 at 80px is the signature.** Do not set display headlines in weight 700 or 600. Bolding at scale makes it generic. The 400 weight at this size whispers power.
- **Positive tracking on small labels.** All 10–12px uppercase utility labels use +0.027 to +0.032em letter-spacing to read as terminal/UI marks rather than prose.
- **Negative tracking at scale.** Display and heading sizes use negative letter-spacing to counteract optical expansion at large sizes.
- **Text-transform: uppercase** applied to all display headlines.

---

## 3. Spacing Tokens

**Base unit:** 8px
**Density:** Comfortable

### 3.1 Spacing Scale

| Name | Value | CSS Custom Property | Design Token |
|------|-------|--------------------|----|
| unit | 8px | `--spacing-unit` | `spacing.unit` |
| 8 | 8px | `--spacing-8` | `spacing.8` |
| 16 | 16px | `--spacing-16` | `spacing.16` |
| 24 | 24px | `--spacing-24` | `spacing.24` |
| 32 | 32px | `--spacing-32` | `spacing.32` |
| 40 | 40px | `--spacing-40` | `spacing.40` |
| 48 | 48px | `--spacing-48` | `spacing.48` |
| 64 | 64px | `--spacing-64` | `spacing.64` |
| 80 | 80px | `--spacing-80` | `spacing.80` |
| 96 | 96px | `--spacing-96` | `spacing.96` |
| 128 | 128px | `--spacing-128` | `spacing.128` |
| 144 | 144px | `--spacing-144` | `spacing.144` |
| 192 | 192px | `--spacing-192` | `spacing.192` |

---

## 4. Border Radius Tokens

### 4.1 Radius Scale

| Alias | Value | CSS Custom Property | Design Token | Named Usage |
|-------|-------|--------------------|----|-------------|
| md | 4px | `--radius-md` | `radius.md` | Buttons (`--radius-buttons`) |
| lg | 8px | `--radius-lg` | `radius.lg` | Nav container (`--radius-nav`) |
| xl | 12px | `--radius-xl` | `radius.xl` | Cards (`--radius-cards`) |
| 2xl | 20px | `--radius-2xl` | `radius.2xl` | Decorative elements (`--radius-decorative`) |
| full | 1440px / 9999px | `--radius-full` | `radius.full` | Pills (`--radius-pills`) |

### 4.2 Named Component Radii

| Element | Value | CSS Custom Property |
|---------|-------|---------------------|
| nav | 8px | `--radius-nav` |
| cards | 12px | `--radius-cards` |
| pills | 9999px | `--radius-pills` |
| buttons | 4px | `--radius-buttons` |
| decorative | 20px | `--radius-decorative` |

**Rule:** Never use pill-shaped (9999px) buttons. The 4px radius is sharp and architectural. Pills would feel consumer/cute and break the system's editorial posture.

---

## 5. Layout Tokens

| Property | Value | CSS Custom Property |
|----------|-------|---------------------|
| Page max-width | 1280px | `--page-max-width` |
| Section gap | 80px | `--section-gap` |
| Card padding | 24–32px | `--card-padding` |
| Element gap | 16–24px | `--element-gap` |

### 5.1 Layout Principles

Max-width 1280px, centered. The page is a vertical stack of full-width bands, most dark with 80px vertical section padding. The hero is a centered headline-over-cube composition with scattered node icons orbiting the cube — the cube sits above the headline text, not behind it.

Grid usage is minimal — most content is centered stacks or 2-column splits, no card grids. Content never nests inside rounded card backgrounds with shadows. Everything sits flat on the carbon canvas or the cream reversal.

---

## 6. Elevation

| Element | Elevation Treatment |
|---------|---------------------|
| Nav container | None — sits flat on canvas |
| Citrine Primary Button | None — flat color, no shadow |
| Cards | None — relies on color step from canvas surface (`#111111` → `#2b2b2b`) |
| Citrine Cube | Inner gradient + outer glow: `rgba(229,255,93,0.15) 0 0 40px` to simulate light emission |

The Citrine Cube is the **only** element in the system that uses gradients, glow, or dimensional depth. Everything else is flat.

---

## 7. Components

### 7.1 Citrine Primary Button

**Role:** Main call-to-action across the site

Filled `#e5ff5d` background, `#111111` text, 4px radius, padding `12px 24px`. Neue Haas Grotesk Text 500 at 16px. Includes a small left-side pixel icon. The lime against carbon creates the highest-attention signal in the system.

**Usage rule:** Use sparingly. Never more than one per viewport.

### 7.2 Dark Primary Button

**Role:** Primary action on the cream/light reversal section

Filled `#111111` background, `#f9f9f9` text, 4px radius, padding `12px 24px`. Inverted counterpart to the Citrine Primary. The lime accent shifts to a small left-side pixel glyph (citrine or dark depending on section) so the action always carries a brand seed.

### 7.3 Ghost Button

**Role:** Secondary action, paired with primary

Transparent background, `#f9f9f9` 1px border on dark sections / `#111111` border on light sections, uppercase Neue Haas 500 at 12px with +0.032em tracking, 4px radius, `10px 20px` padding. Reads as a utility chip rather than a competing CTA.

### 7.4 Navigation Bar

**Role:** Top-level site navigation

Transparent on dark canvas. Left: wordmark in `#f9f9f9` weight 500 at 20px, tracking 0.027em. Center-right: nav links in Neue Haas 500 at 12px with +0.027em tracking, `#f9f9f9`, separated by 32px. Right: Citrine Primary Button. 8px radius on the nav container.

### 7.5 Citrine Cube

**Role:** Brand signature element — 3D glowing cube

Translucent lime cube (`#e5ff5d` with internal gradient highlights suggesting volume) rendered as a 3D isometric block. Appears in hero (centered above headline), in the constellation diagram (as central node), and in the cream reversal (as large 3–4 cube cluster framing content). Cube edges glow — this is the only place gradients, light, and dimensionality live in the system.

**The Citrine Cube Rule:** The 3D translucent lime cube is the only dimensional element in the system. It is not decoration — it is the brand's logo extended into space. Every screen should either:
- (a) contain at least one cube,
- (b) reference the cube's geometry in a flat icon, or
- (c) arrange node icons in a constellation pattern that implies the cube at its center.

Screens without any cube presence feel incomplete. The cube's translucency and glow are achieved through inner gradient highlights (light lime → saturated lime → darker lime) and a soft outer `rgba(229,255,93,0.15)` glow at 40px blur. Never render the cube as a flat 2D square.

### 7.6 Constellation Network Diagram

**Role:** Visual showing multi-network coverage

Central Citrine Cube with 12–16 node icons arranged in a radial ring around it. Each node is a 40px circle with a dark fill, lime or white icon inside, connected to the center by thin dashed `#565656` lines. Demonstrates breadth through visual geometry rather than a list. Connect nodes with thin dashed `#565656` lines — the network topology IS the content, not decoration.

### 7.7 Node Icon Ring

**Role:** Reusable container for network/entity icons

40px circle with 1px `#2b2b2b` border on dark, or `#d6d6d6` on light. Icon centered, 20px, in lime or white. Used scattered in the hero, in constellation diagrams, and in feature illustrations.

### 7.8 Display Headline

**Role:** Hero and section-level titles

Neue Haas Grotesk Text 400 at 80px, line-height 0.90, letter-spacing -0.01em, `#f9f9f9` on dark, `#111111` on light. Text-transform: uppercase. The tight leading and large size make 4 lines of text fill the entire viewport. Weight 400 (not 700) is the signature choice — it whispers rather than shouts, letting the cube do the shouting.

### 7.9 Section Heading

**Role:** Mid-level section titles

Neue Haas 500 at 24px, line-height 1.20, `#f9f9f9` on dark. Used to label secondary explanations and feature blocks.

### 7.10 Body Text

**Role:** Paragraph copy and descriptions

Neue Haas 400 at 16px, line-height 1.50, `#f9f9f9` for primary body, `#9c9c9c` for muted/helper. Comfortable reading width max 560px within content columns.

### 7.11 Feature Pill

**Role:** Small utility tags highlighting capabilities

Compact label: uppercase Neue Haas 500 at 10–12px with +0.032em tracking, `#e5ff5d` text, optional 4px radius background. Used in rows like `FEATURE-ONE · FEATURE-TWO · FEATURE-THREE` with a small lime dot/icon prefix.

### 7.12 Logo Cloud Row

**Role:** Social proof — brand marks

Two centered rows of monochrome white logos on the carbon canvas. Logos at 60% opacity, `#f9f9f9` fill, evenly spaced via flex with 48px column gap. No card backgrounds — logos float directly on the dark canvas.

### 7.13 Split Feature Block

**Role:** Two-column explanation with text left, visual right

Text column (40% width) with heading + 2 body paragraphs left-aligned. Visual column (60%) centered, containing constellation or cube illustration. 80px column gap, vertically centered. Dark background, `#f9f9f9` text.

**Example implementation:**
- Canvas: Carbon Black
- 2-column layout (40% / 60% split, 80px gap, vertically centered)
- Left column: heading in Neue Haas 500 at 24px, `#f9f9f9`, line-height 1.20; two body paragraphs in Neue Haas 400 at 16px, `#9c9c9c`
- Right column: centered Citrine Cube with 12–16 node circles (40px, `#2b2b2b` fill, 1px border, 20px icon in `#e5ff5d` or `#f9f9f9`) arranged in a radial ring, each connected to the cube center by 1px dashed `#565656` lines

### 7.14 Reversal Band

**Role:** Light section that breaks the dark rhythm

Full-width `#eeeeee` background band with large 3D Citrine Cubes floating at far left and right edges (3–4 cubes each, slight rotation, overlapping). Centered content stack: display headline at 80px `#111111`, subheading at 16px `#9c9c9c`, CTA row (dark button + ghost button). 80px top/bottom padding.

---

## 8. Imagery and Visual Language

No photography anywhere. The visual language is entirely constructed from:

1. **The 3D Citrine Cube** — the brand's hero object, rendered as a translucent isometric block with internal gradient highlights and soft outer glow.
2. **Node icons in circular frames** — arranged in constellation/ring patterns suggesting network topology.
3. **Thin dashed connector lines** — `#565656`, 1px, connecting nodes to each other or to the cube center.

The aesthetic is abstract data-visualization rather than illustrative — icons feel like terminal glyphs, not friendly illustrations. All imagery lives on pure canvas (no card containers, no rounded masks) and uses the lime accent sparingly for emphasis.

**Color treatment is strictly limited:** lime for the cube and accent icons, white for everything else. Never introduce photography, gradients on non-cube elements, lifestyle imagery, or human faces. The system is abstract infrastructure, not a consumer product.

---

## 9. Do's and Don'ts

### Do

- Use `#e5ff5d` (Citrine Signal) for exactly one primary action per viewport and let the Citrine Cube carry the brand mark everywhere else
- Set display headlines at 80px Neue Haas 400, line-height 0.90, uppercase — the whisper-weight on massive type is the system's signature voice
- Use 4px radius for all interactive elements (buttons, nav items, tags) and 12px for cards — never round buttons into pills
- Apply +0.027 to +0.032em letter-spacing to all 10–12px uppercase utility labels to read as terminal/UI marks rather than prose
- Break the dark rhythm with exactly one cream (`#eeeeee`) reversal band per major page — the brightness reset is the page's dramatic beat
- Connect nodes in constellation diagrams with thin dashed `#565656` lines — the network topology IS the content, not decoration
- Keep all imagery iconographic and monochrome (white or lime) — never introduce photography, gradients, or decorative illustrations

### Don't

- Do not use a second chromatic accent — the system's power comes from single-color discipline; adding blue, red, or purple destroys the signal-to-noise ratio
- Do not set display headlines in weight 700 or 600 — the 400 weight at 80px is the signature; bolding makes it generic
- Do not use pill-shaped (9999px) buttons — the 4px radius is sharp and architectural; pills feel consumer/cute
- Do not place content on rounded card backgrounds with shadows — everything sits flat on the carbon canvas or the cream reversal, no nesting
- Do not use multiple shades of lime for hover/active states — the green is binary (on/off); rely on opacity shifts and surface steps for state changes
- Do not introduce more than one light band per page — stacking light sections dilutes the reversal's impact
- Do not use photography, lifestyle imagery, or human faces — the system is abstract infrastructure, not a consumer product

---

## 10. Quick Color Reference

| Role | Value |
|------|-------|
| Canvas (page base) | `#111111` (Carbon Black) |
| Surface elevated | `#2b2b2b` (Graphite) |
| Text primary | `#f9f9f9` (Bone White) |
| Text muted | `#9c9c9c` (Stone) |
| Border on dark cards | `#d6d6d6` (Chalk) |
| Hairline borders | `#9c9c9c` (Stone) |
| Brand accent / primary action | `#e5ff5d` (Citrine Signal) |
| Reversal light section | `#eeeeee` (Cream Paper) |
| Connector lines / dividers | `#565656` (Smoke) |

---

## 11. Implementation Reference

### 11.1 CSS Custom Properties (`variables.css`)

Full `:root` variable block for standard CSS usage:

```css
:root {
  /* Colors */
  --color-citrine-signal: #e5ff5d;
  --color-carbon-black: #111111;
  --color-bone-white: #f9f9f9;
  --color-graphite: #2b2b2b;
  --color-ash: #6e6e6e;
  --color-stone: #9c9c9c;
  --color-smoke: #565656;
  --color-chalk: #d6d6d6;
  --color-cream-paper: #eeeeee;
  --color-pure-black: #000000;
  --color-sand: #b7b3a2;

  /* Typography — Font Families */
  --font-neue-haas-grotesk-text: 'Neue Haas Grotesk Text', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;

  /* Typography — Scale */
  --text-utility-label: 10px;
  --leading-utility-label: 1.5;
  --tracking-utility-label: 0.32px;
  --text-caption: 12px;
  --leading-caption: 1.5;
  --tracking-caption: 0.24px;
  --text-body-sm: 14px;
  --leading-body-sm: 1.5;
  --text-body: 16px;
  --leading-body: 1.5;
  --text-subhead: 20px;
  --leading-subhead: 1.3;
  --text-heading-sm: 24px;
  --leading-heading-sm: 1.2;
  --tracking-heading-sm: -0.24px;
  --text-heading: 48px;
  --leading-heading: 1.1;
  --tracking-heading: -0.48px;
  --text-display: 80px;
  --leading-display: 0.9;
  --tracking-display: -0.8px;

  /* Typography — Weights */
  --font-weight-regular: 400;
  --font-weight-medium: 500;

  /* Spacing */
  --spacing-unit: 8px;
  --spacing-8: 8px;
  --spacing-16: 16px;
  --spacing-24: 24px;
  --spacing-32: 32px;
  --spacing-40: 40px;
  --spacing-48: 48px;
  --spacing-64: 64px;
  --spacing-80: 80px;
  --spacing-96: 96px;
  --spacing-128: 128px;
  --spacing-144: 144px;
  --spacing-192: 192px;

  /* Layout */
  --page-max-width: 1280px;
  --section-gap: 80px;
  --card-padding: 24-32px;
  --element-gap: 16-24px;

  /* Border Radius */
  --radius-md: 4px;
  --radius-lg: 8px;
  --radius-xl: 12px;
  --radius-2xl: 20px;
  --radius-full: 1440px;

  /* Named Radii */
  --radius-nav: 8px;
  --radius-cards: 12px;
  --radius-pills: 9999px;
  --radius-buttons: 4px;
  --radius-decorative: 20px;

  /* Surfaces */
  --surface-carbon-canvas: #111111;
  --surface-graphite-panel: #2b2b2b;
  --surface-ash-plate: #6e6e6e;
  --surface-cream-reversal: #eeeeee;
}
```

### 11.2 Tailwind v4 (`theme.css`)

Full `@theme` block for Tailwind v4 usage:

```css
@theme {
  /* Colors */
  --color-citrine-signal: #e5ff5d;
  --color-carbon-black: #111111;
  --color-bone-white: #f9f9f9;
  --color-graphite: #2b2b2b;
  --color-ash: #6e6e6e;
  --color-stone: #9c9c9c;
  --color-smoke: #565656;
  --color-chalk: #d6d6d6;
  --color-cream-paper: #eeeeee;
  --color-pure-black: #000000;
  --color-sand: #b7b3a2;

  /* Typography */
  --font-neue-haas-grotesk-text: 'Neue Haas Grotesk Text', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;

  /* Typography — Scale */
  --text-utility-label: 10px;
  --leading-utility-label: 1.5;
  --tracking-utility-label: 0.32px;
  --text-caption: 12px;
  --leading-caption: 1.5;
  --tracking-caption: 0.24px;
  --text-body-sm: 14px;
  --leading-body-sm: 1.5;
  --text-body: 16px;
  --leading-body: 1.5;
  --text-subhead: 20px;
  --leading-subhead: 1.3;
  --text-heading-sm: 24px;
  --leading-heading-sm: 1.2;
  --tracking-heading-sm: -0.24px;
  --text-heading: 48px;
  --leading-heading: 1.1;
  --tracking-heading: -0.48px;
  --text-display: 80px;
  --leading-display: 0.9;
  --tracking-display: -0.8px;

  /* Spacing */
  --spacing-8: 8px;
  --spacing-16: 16px;
  --spacing-24: 24px;
  --spacing-32: 32px;
  --spacing-40: 40px;
  --spacing-48: 48px;
  --spacing-64: 64px;
  --spacing-80: 80px;
  --spacing-96: 96px;
  --spacing-128: 128px;
  --spacing-144: 144px;
  --spacing-192: 192px;

  /* Border Radius */
  --radius-md: 4px;
  --radius-lg: 8px;
  --radius-xl: 12px;
  --radius-2xl: 20px;
  --radius-full: 1440px;
}
```

### 11.3 Design Tokens JSON (`tokens.json`)

Full W3C Design Token format for use with Style Dictionary, Theo, or Tokens Studio:

```json
{
  "color": {
    "citrine-signal": {
      "$value": "#e5ff5d",
      "$type": "color",
      "$description": "Citrine Signal — Primary action buttons, brand cube fills, accent icon strokes, decorative 3D cubes, featured logo marks — the single chromatic voice of the system"
    },
    "carbon-black": {
      "$value": "#111111",
      "$type": "color",
      "$description": "Carbon Black — Page canvas, primary text on light sections, dominant border color, button fills on reversed (light) sections"
    },
    "bone-white": {
      "$value": "#f9f9f9",
      "$type": "color",
      "$description": "Bone White — Primary text on dark canvas, nav and body text, light icon fills, ghost button text"
    },
    "graphite": {
      "$value": "#2b2b2b",
      "$type": "color",
      "$description": "Graphite — Elevated surface above carbon, secondary panels, darker card variants"
    },
    "ash": {
      "$value": "#6e6e6e",
      "$type": "color",
      "$description": "Ash — Muted card surface, tertiary background layers behind content blocks"
    },
    "stone": {
      "$value": "#9c9c9c",
      "$type": "color",
      "$description": "Stone — Muted body text, secondary link text, low-priority borders, helper labels"
    },
    "smoke": {
      "$value": "#565656",
      "$type": "color",
      "$description": "Smoke — Dividers, subtle borders, decorative strokes in illustrations"
    },
    "chalk": {
      "$value": "#d6d6d6",
      "$type": "color",
      "$description": "Chalk — Card borders on dark sections, hairline dividers between content blocks"
    },
    "cream-paper": {
      "$value": "#eeeeee",
      "$type": "color",
      "$description": "Cream Paper — Light section background — the single warm reversal that breaks the dark rhythm"
    },
    "pure-black": {
      "$value": "#000000",
      "$type": "color",
      "$description": "Pure Black — Maximum contrast text, logo silhouettes, hard-edge decorative fills"
    },
    "sand": {
      "$value": "#b7b3a2",
      "$type": "color",
      "$description": "Sand — Warm-tinted decorative fills, illustration accents — the only chromatic neutral"
    }
  },
  "font": {
    "neue-haas-grotesk-text": {
      "$value": "Neue Haas Grotesk Text",
      "$type": "fontFamily",
      "$description": "Sole typeface across the entire system. Weight 400 carries body, nav, and most UI; weight 500 reserved for emphasized labels and button text. Display headlines at 80px with 0.90 line-height create the signature monolithic rows. Small labels (10–12px) use positive tracking (+0.020 to +0.032em) to read as uppercase utility marks. The humanist geometry of Haas Grotesk — slightly humanist terminals, even stroke contrast — gives the dark interface a warm, editorial quality rather than feeling like a terminal."
    }
  },
  "typography": {
    "xs": {
      "$value": { "fontFamily": "Neue Haas Grotesk Text", "fontSize": "10px", "fontWeight": 500, "lineHeight": 1.3 },
      "$type": "typography",
      "$description": "Typography step xs at 10px"
    },
    "xs-2": {
      "$value": { "fontFamily": "Neue Haas Grotesk Text", "fontSize": "10px", "fontWeight": 500, "lineHeight": 1 },
      "$type": "typography",
      "$description": "Typography step xs-2 at 10px"
    },
    "xs-3": {
      "$value": { "fontFamily": "Neue Haas Grotesk Text", "fontSize": "10px", "fontWeight": 400, "lineHeight": 2.08 },
      "$type": "typography",
      "$description": "Typography step xs-3 at 10px"
    },
    "xs-4": {
      "$value": { "fontFamily": "Neue Haas Grotesk Text", "fontSize": "12px", "fontWeight": 400, "lineHeight": 1.73 },
      "$type": "typography",
      "$description": "Typography step xs-4 at 12px"
    },
    "xs-5": {
      "$value": { "fontFamily": "Neue Haas Grotesk Text", "fontSize": "12px", "fontWeight": 400, "lineHeight": 1.3 },
      "$type": "typography",
      "$description": "Typography step xs-5 at 12px"
    },
    "base": {
      "$value": { "fontFamily": "Neue Haas Grotesk Text", "fontSize": "16px", "fontWeight": 400, "lineHeight": 1.3 },
      "$type": "typography",
      "$description": "Typography step base at 16px"
    },
    "base-2": {
      "$value": { "fontFamily": "Neue Haas Grotesk Text", "fontSize": "16px", "fontWeight": 400, "lineHeight": 1 },
      "$type": "typography",
      "$description": "Typography step base-2 at 16px"
    },
    "base-3": {
      "$value": { "fontFamily": "Neue Haas Grotesk Text", "fontSize": "16px", "fontWeight": 500, "lineHeight": 1.3 },
      "$type": "typography",
      "$description": "Typography step base-3 at 16px"
    },
    "base-4": {
      "$value": { "fontFamily": "Neue Haas Grotesk Text", "fontSize": "16px", "fontWeight": 400, "lineHeight": 1.2 },
      "$type": "typography",
      "$description": "Typography step base-4 at 16px"
    },
    "base-5": {
      "$value": { "fontFamily": "Neue Haas Grotesk Text", "fontSize": "16px", "fontWeight": 400, "lineHeight": 1.3 },
      "$type": "typography",
      "$description": "Typography step base-5 at 16px"
    },
    "xl": {
      "$value": { "fontFamily": "Neue Haas Grotesk Text", "fontSize": "20px", "fontWeight": 400, "lineHeight": 1.5 },
      "$type": "typography",
      "$description": "Typography step xl at 20px"
    },
    "2xl": {
      "$value": { "fontFamily": "Neue Haas Grotesk Text", "fontSize": "24px", "fontWeight": 400, "lineHeight": 1.2 },
      "$type": "typography",
      "$description": "Typography step 2xl at 24px"
    },
    "2xl-2": {
      "$value": { "fontFamily": "Neue Haas Grotesk Text", "fontSize": "24px", "fontWeight": 400, "lineHeight": 1.2 },
      "$type": "typography",
      "$description": "Typography step 2xl-2 at 24px"
    },
    "5xl": {
      "$value": { "fontFamily": "Neue Haas Grotesk Text", "fontSize": "80px", "fontWeight": 400, "lineHeight": 0.9 },
      "$type": "typography",
      "$description": "Typography step 5xl at 80px"
    },
    "5xl-2": {
      "$value": { "fontFamily": "Neue Haas Grotesk Text", "fontSize": "80px", "fontWeight": 400, "lineHeight": 1 },
      "$type": "typography",
      "$description": "Typography step 5xl-2 at 80px"
    }
  },
  "spacing": {
    "unit": { "$value": "8px", "$type": "dimension", "$description": "Base spacing unit" },
    "8": { "$value": "8px", "$type": "dimension", "$description": "Spacing 8px" },
    "16": { "$value": "16px", "$type": "dimension", "$description": "Spacing 16px" },
    "24": { "$value": "24px", "$type": "dimension", "$description": "Spacing 24px" },
    "32": { "$value": "32px", "$type": "dimension", "$description": "Spacing 32px" },
    "40": { "$value": "40px", "$type": "dimension", "$description": "Spacing 40px" },
    "48": { "$value": "48px", "$type": "dimension", "$description": "Spacing 48px" },
    "64": { "$value": "64px", "$type": "dimension", "$description": "Spacing 64px" },
    "80": { "$value": "80px", "$type": "dimension", "$description": "Spacing 80px" },
    "96": { "$value": "96px", "$type": "dimension", "$description": "Spacing 96px" },
    "128": { "$value": "128px", "$type": "dimension", "$description": "Spacing 128px" },
    "144": { "$value": "144px", "$type": "dimension", "$description": "Spacing 144px" },
    "192": { "$value": "192px", "$type": "dimension", "$description": "Spacing 192px" }
  },
  "radius": {
    "md": { "$value": "4px", "$type": "dimension", "$description": "Border radius md — buttons" },
    "lg": { "$value": "8px", "$type": "dimension", "$description": "Border radius lg — nav" },
    "xl": { "$value": "12px", "$type": "dimension", "$description": "Border radius xl — cards" },
    "2xl": { "$value": "20px", "$type": "dimension", "$description": "Border radius 2xl — decorative" },
    "full": { "$value": "1440px", "$type": "dimension", "$description": "Border radius full — pills" }
  },
  "surface": {
    "carbon-canvas": {
      "$value": "#111111",
      "$type": "color",
      "$description": "Surface level 1: Page base — majority of the experience lives here"
    },
    "graphite-panel": {
      "$value": "#2b2b2b",
      "$type": "color",
      "$description": "Surface level 2: Elevated cards and panels sitting on the carbon canvas"
    },
    "ash-plate": {
      "$value": "#6e6e6e",
      "$type": "color",
      "$description": "Surface level 3: Muted secondary surfaces, logo cloud backgrounds"
    },
    "cream-reversal": {
      "$value": "#eeeeee",
      "$type": "color",
      "$description": "Surface level 4: Light section — the single bright band that resets the eye"
    }
  },
  "$extensions": {
    "com.refero.extraction": {
      "url": "https://www.codex.io",
      "siteName": "Codex.io",
      "extractedAt": "2026-06-03T22:38:16.616Z",
      "variant": "extended"
    }
  }
}
```

---

## 12. Similar References

Design references sharing the same visual grammar — dark canvas, single saturated accent, humanist sans typography, and network-topology visuals:

| Brand | Similarity |
|-------|------------|
| Helius | Same dark canvas API positioning with single vivid accent color and constellation-style diagrams |
| Alchemy | Dark infrastructure API with restrained typography, monochrome surfaces, minimal accent discipline |
| Chainbase | Similar dark-mode layout, single neon accent, network-topology visualizations |
| Messari | Dark data platform with humanist sans typography, uppercase utility labels, monochrome logo clouds |
| Privy | Dark canvas, single saturated accent for CTAs, minimal decorative imagery |

---

*Source files: `DESIGN (6).md`, `variables (4).css`, `theme (4).css`, `tokens (4).json`*
