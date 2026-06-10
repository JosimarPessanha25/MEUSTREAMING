---
name: Luminal Prime
colors:
  surface: '#210e0e'
  surface-dim: '#210e0e'
  surface-bright: '#4b3333'
  surface-container-lowest: '#1b0909'
  surface-container-low: '#2a1616'
  surface-container: '#2e1a1a'
  surface-container-high: '#3a2424'
  surface-container-highest: '#462f2e'
  on-surface: '#ffdad8'
  on-surface-variant: '#e9bcba'
  inverse-surface: '#ffdad8'
  inverse-on-surface: '#412b2a'
  outline: '#af8786'
  outline-variant: '#5f3e3e'
  surface-tint: '#ffb3b2'
  primary: '#ffb3b2'
  on-primary: '#680012'
  primary-container: '#ff525c'
  on-primary-container: '#5b000f'
  inverse-primary: '#bf002a'
  secondary: '#ebffe6'
  on-secondary: '#003911'
  secondary-container: '#00fe66'
  on-secondary-container: '#007128'
  tertiary: '#9fcaff'
  on-tertiary: '#003259'
  tertiary-container: '#0095f8'
  on-tertiary-container: '#002b4e'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffdad8'
  primary-fixed-dim: '#ffb3b2'
  on-primary-fixed: '#410008'
  on-primary-fixed-variant: '#92001e'
  secondary-fixed: '#6bff83'
  secondary-fixed-dim: '#00e55b'
  on-secondary-fixed: '#002107'
  on-secondary-fixed-variant: '#00531b'
  tertiary-fixed: '#d2e4ff'
  tertiary-fixed-dim: '#9fcaff'
  on-tertiary-fixed: '#001d36'
  on-tertiary-fixed-variant: '#00497e'
  background: '#210e0e'
  on-background: '#ffdad8'
  surface-variant: '#462f2e'
typography:
  display-lg:
    fontFamily: Anton
    fontSize: 64px
    fontWeight: '400'
    lineHeight: '1.1'
    letterSpacing: 0.02em
  headline-xl:
    fontFamily: Anton
    fontSize: 48px
    fontWeight: '400'
    lineHeight: '1.2'
  headline-lg:
    fontFamily: Anton
    fontSize: 32px
    fontWeight: '400'
    lineHeight: '1.2'
  headline-lg-mobile:
    fontFamily: Anton
    fontSize: 28px
    fontWeight: '400'
    lineHeight: '1.2'
  body-lg:
    fontFamily: Hanken Grotesk
    fontSize: 18px
    fontWeight: '500'
    lineHeight: '1.6'
  body-md:
    fontFamily: Hanken Grotesk
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  label-caps:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '700'
    lineHeight: '1.0'
    letterSpacing: 0.1em
  price-lg:
    fontFamily: Anton
    fontSize: 56px
    fontWeight: '400'
    lineHeight: '1.0'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 8px
  container-max: 1280px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 48px
---

## Brand & Style

This design system is engineered for a high-octane, premium entertainment experience. It targets a tech-savvy audience that values cinematic immersion and high-tier service.

The visual style is a fusion of **High-Contrast / Bold** and **Glassmorphism**, characterized by:
- **Cinematic Immersion:** Utilization of deep blacks to make content thumbnails and vibrant accents "pop" off the screen.
- **Neon Energy:** Strategic use of glowing borders and high-saturation primary colors to indicate interactivity and "live" status.
- **Luxury Aesthetic:** A specialized "Gold" tier treatment for premium annual plans, using gradients and metallic sheen to denote exclusivity.
- **Dynamic Atmosphere:** Layered surfaces with subtle glows that mimic the light spill of a cinema screen.

## Colors

The palette is anchored in a true-black environment to maximize contrast. 

- **Primary (Electric Red):** Used for "Live" indicators, urgent calls to action, and primary brand markers.
- **Secondary (Neon Green):** Used for success states, "Free" offers, and WhatsApp integration buttons.
- **Tertiary (Deep Cyan):** Used for informational elements, multi-screen indicators, and standard plan highlights.
- **Luxury Gold:** Reserved strictly for annual/premium tiers and "Quality Guaranteed" seals.

**Dark Mode Implementation:**
- Backgrounds must use the absolute `neutral_black`.
- Surfaces and card containers use `surface_gray` with high-saturation borders.
- Interactive elements utilize "outer glow" effects (8-12px spread) matching their respective functional color.

## Typography

The typography strategy emphasizes impact and technical precision.

- **Display & Headlines:** Uses **Anton** for its condensed, vertical power. Large titles should always be in uppercase to mimic movie poster aesthetics.
- **Body Text:** **Hanken Grotesk** provides a clean, contemporary feel that remains legible over dark, glowing backgrounds.
- **Technical Labels:** **JetBrains Mono** is used for metadata (e.g., 4K, FHD, 15 Mbps) to evoke a sense of high-performance hardware.

**Visual Effects:**
- Apply a subtle "text-shadow" to Display-level fonts in primary colors to simulate neon tubes.
- Gradient fills are permitted for Display text (e.g., White to Light Gray or Gold to Bronze).

## Layout & Spacing

The layout follows a **Fluid Grid** model designed for "10-foot UI" (TV) and mobile-first consumption.

- **Grid:** 12-column system on desktop, 4-column on mobile.
- **Spacing Rhythm:** Based on an 8px base unit. Component padding should scale in increments of 8 (8, 16, 24, 32).
- **Safe Zones:** Content must maintain a 48px margin on desktop to prevent visual clutter against vibrant background effects.
- **Content Reflow:** Film posters use a 2:3 aspect ratio grid, while featured banners use 16:9.

## Elevation & Depth

Depth is created through light and color rather than traditional shadows.

- **Luminous Borders:** Use 1px or 2px solid borders with a box-shadow glow (e.g., `0 0 10px rgba(color, 0.5)`).
- **Glassmorphism:** Overlays (like the Bottom Nav or Filter bars) use a 20px backdrop blur with a 10% white tint.
- **Tonal Hierarchy:**
  - **Level 0:** `#080808` (Deep Background)
  - **Level 1:** `#1A1A1A` (Cards, Containers)
  - **Level 2:** `#2A2A2A` (Hover states, Inputs)
- **Active State:** Elements currently in focus/selection should exhibit a "pulse" glow effect using the Primary or Tier-specific color.

## Shapes

The system uses **Rounded** (0.5rem / 8px) geometry to balance modern tech with approachable entertainment.

- **Buttons & Chips:** Use `rounded-lg` (16px) for a softer, more modern feel.
- **Media Thumbnails:** Use `rounded-md` (8px) to maximize screen real estate for the content.
- **Selection Rings:** Must follow the curvature of the element they wrap, with a 4px offset.

## Components

### Buttons
- **Primary:** Solid Red or Green background, bold Anton uppercase text.
- **Ghost:** Transparent background with neon-colored glowing borders.
- **Icon Buttons:** Circular with backdrop blur (Glassmorphism).

### Tier Cards (Subscription)
- **Monthly:** Blue border and icon accent.
- **Semi-Annual:** Green border, labeled "Most Popular" using a badge.
- **Annual (Premium):** Gold metallic gradient border, Gold icons, and "Best Value" indicator. Includes high-gloss finish.

### Media Cards
- Vertical posters with title overlays at the bottom using a black-to-transparent gradient.
- **Badges:** Top-right corner for "4K", "Live", or "New".

### Input Fields
- Dark gray background with a bottom-only neon border that illuminates on focus.
- Placeholder text in low-contrast gray.

### Navigation
- **Mobile:** Bottom bar with blur effect and active-state neon icons.
- **TV/Desktop:** Left-aligned sidebar with expanded labels on hover.