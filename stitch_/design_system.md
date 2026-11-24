---
name: "دار النخبة — النمط الداكن الفاخر"
description: "نظام تصميم فائق الفخامة لمتجر أزياء رجالية باللغة العربية (RTL) يجمع بين الخلفيات الفحمية الداكنة والذهب المصقول والخطوط الهندسية النظيفة."
---

## Overview

**دار النخبة (Dar Al-Nukhba)** is an ultra-refined, eye-friendly dark luxury Men's Fashion e-commerce design system built natively for Arabic (RTL) interfaces. The visual language embodies tailored editorial minimalism—deep obsidian and charcoal surfaces, warm ivory typography, and muted brushed champagne gold accents—designed to showcase high-end menswear with zero visual clutter or harsh neon glare.

Target audience: discerning gentlemen seeking bespoke suits, cashmere overcoats, Egyptian-cotton dress shirts, and refined leather accessories, with a friction-free checkout supporting Cash on Delivery and Vodafone Cash receipt verification.

## Colors

The palette is strictly dark-mode luxury, anchored by `#121212` obsidian backgrounds, `#1A1A1A` charcoal elevated surfaces, `#F5F5F0` warm off-white text, and `#C5A059` brushed champagne gold accents.

- **Primary (`#C5A059`):** Brushed champagne gold reserved for primary CTAs, active selections, price highlights, and subtle focus rings.
- **Surface (`#121212`) & Surface Container (`#1A1A1A`):** Deep neutral layers that prevent halation and keep editorial photography as the focal point.
- **On-Surface (`#F5F5F0`):** Warm off-white for effortless long-form reading and product details.
- **Status Colors:** Muted, eye-friendly sage green for verified receipts and order confirmations, and soft coral-red for validation errors.

```yaml
colors:
  primary: "#C5A059"
  on-primary: "#121212"
  primary-container: "#261900"
  on-primary-container: "#FFDEA5"
  secondary: "#BDA986"
  on-secondary: "#121212"
  surface: "#121212"
  surface-container-low: "#161616"
  surface-container: "#1A1A1A"
  surface-container-high: "#242424"
  on-surface: "#F5F5F0"
  on-surface-variant: "#B5AA99"
  outline: "#4E4639"
  outline-variant: "#313030"
  success: "#6BA37A"
  on-success: "#121212"
  success-container: "#142619"
  on-success-container: "#B8E6C4"
  error: "#FF897D"
  on-error: "#410002"
  error-container: "#410002"
  on-error-container: "#FFDAD6"
```

## Typography

All Arabic and Latin interface copy uses **Cairo** for its balanced geometric proportions, crisp legibility at small sizes, and editorial presence in large headings. **IBM Plex Mono** is reserved for order IDs, wallet numbers, and tabular numeric codes. Set `dir="rtl"` and `lang="ar"` on `<html>`.

```yaml
typography:
  display-lg:
    fontFamily: "Cairo"
    fontSize: 48px
    fontWeight: 700
    lineHeight: 58px
    letterSpacing: -0.25px
  display-lg-mobile:
    fontFamily: "Cairo"
    fontSize: 32px
    fontWeight: 700
    lineHeight: 42px
    letterSpacing: 0px
  headline-lg:
    fontFamily: "Cairo"
    fontSize: 36px
    fontWeight: 700
    lineHeight: 46px
    letterSpacing: 0px
  headline-lg-mobile:
    fontFamily: "Cairo"
    fontSize: 26px
    fontWeight: 700
    lineHeight: 36px
    letterSpacing: 0px
  headline-md:
    fontFamily: "Cairo"
    fontSize: 24px
    fontWeight: 600
    lineHeight: 34px
    letterSpacing: 0px
  title-lg:
    fontFamily: "Cairo"
    fontSize: 20px
    fontWeight: 600
    lineHeight: 28px
    letterSpacing: 0px
  title-md:
    fontFamily: "Cairo"
    fontSize: 16px
    fontWeight: 600
    lineHeight: 24px
    letterSpacing: 0px
  body-lg:
    fontFamily: "Cairo"
    fontSize: 16px
    fontWeight: 400
    lineHeight: 26px
    letterSpacing: 0px
  body-md:
    fontFamily: "Cairo"
    fontSize: 14px
    fontWeight: 400
    lineHeight: 22px
    letterSpacing: 0px
  label-lg:
    fontFamily: "Cairo"
    fontSize: 14px
    fontWeight: 600
    lineHeight: 20px
    letterSpacing: 0px
  label-md:
    fontFamily: "Cairo"
    fontSize: 12px
    fontWeight: 600
    lineHeight: 16px
    letterSpacing: 0px
  mono-md:
    fontFamily: "IBM Plex Mono"
    fontSize: 14px
    fontWeight: 500
    lineHeight: 20px
    letterSpacing: 0.5px
```

## Layout & Spacing

The storefront and checkout use a **12-column Fluid Grid** constrained to a `1280px` max-width editorial container with generous breathing room. Product cards follow Golden Ratio (`1:1.618` / `aspect-[1/1.25]` image + `aspect-[1/0.368]` details) proportions. Use `8px` base increments (`4px` half-step for micro-alignments).

```yaml
spacing:
  gutter-xs: 4px
  gutter-sm: 8px
  gutter-md: 16px
  gutter-lg: 24px
  gutter-xl: 32px
  section: 64px
  page-margin: 24px
```

## Elevation & Depth

Depth is communicated exclusively through **tonal layering** (`surface` `#121212` -> `surface-container` `#1A1A1A` -> `surface-container-high` `#242424`) paired with subtle `1px` `outline-variant` (`#313030`) hairline borders. Avoid heavy drop shadows or frosted glass blurs so dark surfaces remain crisp and tactile.

## Shapes

Soft, generous rounded corners (`12px` to `16px`) soften the dark architectural geometry and invite touch interaction across cards, drawers, inputs, and modals.

```yaml
rounded:
  sm: 8px
  DEFAULT: 12px
  md: 12px
  lg: 16px
  xl: 20px
  full: 9999px
```

## Motion & Micro-interaction

Interactions feel weighted, deliberate, and quiet—like heavy wool tailoring. State transitions settle swiftly without bounce; drawers and modals glide smoothly into place.

```yaml
motion:
  state-change:
    duration: 150ms
    delay: 0ms
    timingFunction: ease-out
  surface-enter:
    duration: 280ms
    delay: 0ms
    timingFunction: cubic-bezier(0.2, 0, 0, 1)
  surface-exit:
    duration: 180ms
    delay: 0ms
    timingFunction: cubic-bezier(0.3, 0, 1, 1)
```

## Voice & Content Strategy

- **Tone of voice:** Courteous, poised, and tailored—using refined Modern Standard Arabic (`العربية الفصحى المعاصرة`) for editorial copy and clear, reassuring Egyptian-friendly phrasing for checkout and payment verification.
- **Action labels:** Direct verb phrases naming the outcome (`تسوق المجموعة الجديدة`، `أضف إلى السلة`، `تأكيد الطلب`، `نسخ الرقم`، `فتح الكاميرا لتصوير الإيصال`).
- **Numbers & Currency:** Use `tabular-nums` for all prices (`ج.م`), Egyptian phone numbers (`010` / `011` / `012` / `015`), and order IDs.

## Components

Component implementations live as individual HTML sticker sheet files in
`components/`. Each file contains the canonical, styled HTML components with
`<!-- COMPONENT: name -->` comment markers. Read each file before use.

- **Button** → `@components/button.html`: `button-primary`, `button-icon`, `button-with-icon`
- **Card** → `@components/card.html`: `card-elevated`, `card-action`, `card-interactive`, `card-interactive-2`
- **Input Field** → `@components/input-field.html`: `input-field-text`, `input-field-icon`
- **Modal** → `@components/modal.html`: `modal-standard`, `modal-alert`, `modal-drawer`
- **Radio** → `@components/radio.html`: `radio-standard`
