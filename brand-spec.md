# interviewprep · Brand Spec

> Date: 2026-04-28 night
> Personality: **Editorial** (locked — per `feedback_visual_personalities_4_types.md`)
> Spec written under huashu-design §1.a Core Asset Protocol
> Scope: governs extension popup CSS + future internal pages (settings/upgrade-in-extension). Portal landing + Paddle pages are **portal canon**, not this spec.

## 🎯 Core assets

### Logo / Icon
- Master source: **PLACEHOLDER PENDING USER ICON** — see morning-handover.md for the brief
- Brief sent to user: muted earth tone (deep terracotta `#A0573A` OR sage `#4A5D4A`) base + cream/parchment accent + serif-y mark or typographic monogram. Concept: stack of paper / interview notebook / open book with bookmark / coffee + notebook (atmospheric morning prep). Sizes: 16/32/48/128/512.
- Until icon arrives: typographic placeholder at `chrome/firefox/edge/icons/icon-{16,32,48,128}.png` rendering "ip" in Source Serif on terracotta. Clearly flagged "PLACEHOLDER" in repo README.
- Canonical apex (post-icon): `/var/www/voiddo.com/images/tools/interviewprep.png` (512×512)

### Reference (parent brand)
- vøiddo wordmark — stroked-ø signature in display contexts.

## 🎨 Color palette (Editorial)

| Token | Hex | Role |
|---|---|---|
| `--ip-paper` | `#F5EDD8` | Editorial parchment / page surface (premium feel) |
| `--ip-paper-2` | `#EBE0C5` | Subtle band / divider |
| `--ip-ink` | `#1F1A14` | Body text, default ink |
| `--ip-ink-2` | `#3A322A` | Muted ink, secondary |
| `--ip-ink-3` | `#6B5F4F` | Tertiary, captions, meta |
| `--ip-rust` | `#A0573A` | **Primary accent** — terracotta editorial highlight |
| `--ip-rust-deep` | `#854829` | Hover / pressed state |
| `--ip-rust-soft` | `rgba(160,87,58,0.12)` | Accent fill |
| `--ip-sage` | `#4A5D4A` | Optional secondary accent (used sparingly for "company research" card) |
| `--ip-cream` | `#FAF6EB` | Highlight surface in dark contexts |
| `--ip-line` | `rgba(31,26,20,0.10)` | Hairline borders |

**Forbidden**: pure-cyan `#00E5FF` (that's portal/tools canon — don't bleed into product internals), saturated purple, neon green.

## ✏️ Typography

| Role | Stack | Note |
|---|---|---|
| **Display / Brand** | `'Fraunces','Newsreader','Source Serif 4',Charter,Georgia,serif` | Editorial signature; opt-szie variable enabled where supported |
| **Body / UI** | `'Inter',ui-sans-serif,system-ui,sans-serif` | Body and chrome (buttons, labels) |
| **Mono / Data** | `'JetBrains Mono',ui-monospace,SFMono-Regular,monospace` | Counters, technical metadata only |

## 📄 Editorial pattern signatures (the 120% spots)

1. **Pull-quotes for STAR prompts**: each generated STAR card starts with a serif-italic pull-quote of the question, large, with editorial rule above. Reads like a magazine sidebar.
2. **Company research card**: muted sage accent (different from rust primary), gives it a distinct "research desk" feel inside the product.
3. **Drop cap on the lede**: first letter of the popup tagline rendered as a 3-line drop cap in Fraunces — small homage to magazine layout.
4. **Page-numbered footer**: popup footer reads "p. 1 / 4" stepper instead of a generic counter — emphasizes the multi-page interview prep flow.

## ❌ Forbidden zones

- Glass-frosted backgrounds (that's tabsnap's Atmospheric — don't bleed)
- Sunset gradients (tabsnap)
- Cyan accents (portal canon — only on portal pages)
- Neon / heavy gradient slop
- Inter-only typography (must pair with Fraunces/Newsreader for personality)

## 🎭 Vibe keywords

`editorial` · `considered` · `quiet authority` · `magazine-spread` · `the morning before the interview`

## 🔗 Surfaces using this spec

- Extension popup CSS (`/root/voiddo-extensions/interviewprep/{chrome,firefox,edge}/popup/popup.css`)
- Internal extension pages — settings, upgrade-from-extension (post-install onboarding)
- Drop screenshots (CWS / AMO / Edge)
- Future hero-animation if produced

**NOT covered by this spec** (these go through portal canon):
- `extensions.voiddo.com/interviewprep/` (marketing landing)
- `extensions.voiddo.com/interviewprep/{privacy,contact,pricing,terms,refund}/` (legal + Paddle)
- OG card for the portal landing (`extensions.voiddo.com/og/interviewprep.png`)
- Portal tile in extensions index
