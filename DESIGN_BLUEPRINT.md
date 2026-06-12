# Family Games — UX & UI Design Blueprint

**Companion to `PLATFORM_PLAN.md`. Product strategy, scope, and models are frozen; this document converts them into an implementable design specification.**

| | |
|---|---|
| Document version | 1.0 |
| Scope | MVP (Tambola + Rummy) + framework for future games |
| Primary design target | **Suresh, 58, joining via WhatsApp on a mid-range Android (360×800, 4G)** |
| Audience | UI designers, frontend engineers, design-system maintainers |

### The three design laws (apply to every decision below)

1. **Suresh's thumb is the unit of measure.** If it needs precision, explanation, or a second attempt, redesign it. Joins are designed for Suresh; creation flows for Priya; nothing for Aarav at Suresh's expense.
2. **One primary action per screen.** Every screen has exactly one obvious next step, rendered as the largest, highest-contrast element. Everything else is visually subordinate.
3. **The state of the world is always visible.** Whose turn, what just happened, am I connected — never hidden behind a tap. On flaky networks, honesty is the trust feature.

---

## Table of Contents

1. [Information Architecture](#1-information-architecture)
2. [User Flows](#2-user-flows)
3. [Screen Inventory](#3-screen-inventory)
4. [Wireframes](#4-wireframes)
5. [Landing Experience](#5-landing-experience)
6. [Lobby Design](#6-lobby-design)
7. [Universal Game Room Framework](#7-universal-game-room-framework)
8. [Tambola UX Design](#8-tambola-ux-design)
9. [Rummy UX Design](#9-rummy-ux-design)
10. [Results Experience](#10-results-experience)
11. [Design System](#11-design-system)
12. [Accessibility](#12-accessibility)
13. [Responsive Design Strategy](#13-responsive-design-strategy)
14. [Figma Structure](#14-figma-structure)
15. [Handoff Notes](#15-handoff-notes)

---

## 1. Information Architecture

### 1.1 Design principle: a funnel, not a site

This product has almost no "browsing." 90% of users arrive on a deep link and should see exactly **one** screen between WhatsApp and the lobby. The IA is therefore a shallow funnel with two mouths (create / join) converging on one destination (the room), not a navigable website. There is deliberately **no global navigation bar inside a room** — the room *is* the app while you're in it.

### 1.2 Sitemap

```
famgames.in
│
├── /                          Landing (create / join / festival promo)
│     ├── [sheet] Join with code
│     └── [sheet] Sign in (OTP / Google)        ← optional, never blocking
│
├── /create                    Create Room (pick game → options → link)
│
├── /r/{CODE}                  THE ROOM (single URL for its whole life)
│     ├── state: Join gate     (name entry — guests only see this once)
│     ├── state: Lobby         (waiting / between games)
│     ├── state: In-game       (game slot active: Tambola | Rummy | …)
│     ├── state: Results
│     └── [sheets] Room settings · Players · Share · Leave confirm
│
├── /me                        Profile & history (registered users; thin)
│
└── system pages (terminal states, reached only by error)
      /r/{CODE} → full · closed · invalid · kicked   (rendered in-place)
```

**Key IA decision — one URL per room, state-driven rendering.** `/r/MANGO42` is the *only* link anyone ever shares or re-taps. Join gate, lobby, live game, and results are **states of that URL**, not separate routes. Reasoning: Suresh's recovery action for every problem is "tap the WhatsApp link again" — that action must always land him in the right place (Reconnect flow, §2.5). Sub-routes would break this contract.

### 1.3 Navigation hierarchy

```
LEVEL 0  Landing / Create / Profile        ← conventional pages, back = browser back
LEVEL 1  Room (/r/{CODE})                  ← a "place"; you LEAVE it, you don't "go back"
LEVEL 2  Sheets & modals inside the room   ← settings, players, share, claims, declare
```

- Inside a room, the browser back button triggers the **Leave room?** confirm dialog (never a silent exit — accidental back-swipe on Android is endemic).
- Sheets (Level 2) are dismissible by swipe-down, scrim tap, and an explicit ✕ — three redundant exits, because elderly users often know only one of them.
- No hamburger menus anywhere in MVP. Every destination is a visible labeled button.

### 1.4 User access paths & entry points

| Entry point | Audience | Lands on | Notes |
|---|---|---|---|
| WhatsApp/Telegram link tap | Suresh (dominant path, ~80%) | `/r/{CODE}` join gate | OG card = room name + host + game + player faces |
| Room code typed/spoken | Voice-call relatives | Landing → Join sheet → `/r/{CODE}` | Code input: huge, auto-uppercase, no ambiguous chars (no 0/O, 1/I/L) |
| Direct visit / search | Priya (creators) | Landing | Create is the hero action |
| PWA icon (repeat users) | Anyone who installed | Landing, with **"Rejoin {room}"** resume card if a room is live | The resume card is the retention front door |
| Re-tap of an old link | Everyone, post-session | `/r/{CODE}` terminal state | "This room has ended" + Create your own (growth loop) |

### 1.5 Deep-link strategy

- **Format:** `famgames.in/r/{CODE}` — short enough to read aloud; code shown in-product as `MANGO 42` (space for speech, ignored on input).
- **OG/share card (treated as a first-class screen design):** 1200×630, festival-skinnable. Layout: app mark top-left → room name (large) → "{Host} invited you to play {Game} 🎉" → up to 5 avatar chips → "Tap to join · no app needed."
- **Share message template** (pre-filled, editable): `🎉 {Host} is hosting {Game} night! Join "{Room name}": famgames.in/r/{CODE} — Room code: {CODE}. Works in your browser, nothing to install.` Code is in the text on purpose: if the link preview fails or the link is forwarded as plain text, the spoken-code path still works.
- **Link behavior matrix:** room open → join gate (or straight in, if this device already joined); in-game + game allows late join (Tambola) → join gate → enters live game with a ticket; in-game + no late join (Rummy) → join gate → lobby with "Hand in progress — you're in for the next one"; full → friendly full-state with "notify host" ; closed/invalid → terminal state + create-your-own CTA.
- **PWA install prompt:** never on first visit (it competes with joining — the cardinal sin). Offer only on the Results screen of a *second* session: "Add to home screen for next time?"

---

## 2. User Flows

Notation: `[screen]` `(decision)` `{system}` `<<sheet/modal>>`.

### 2.1 Guest Join Flow (the sacred path — 2 taps + 1 text field, ≤20s)

```
WhatsApp message
   │ tap link
   ▼
{OG preview already set expectations}
   ▼
[Join Gate /r/MANGO42]──────────────(room state?)
   │  shows: room name, host,        ├─ full ──────► [Full state] notify host / wait
   │  game icon, live player faces   ├─ closed ────► [Ended state] create-your-own
   │                                 └─ invalid ───► [Invalid] check code / landing
   │ type name (autofocus; remembered on this device forever after)
   │ tap  [ JOIN ROOM ]  ← the only primary button on screen
   ▼
{joining… skeleton lobby appears < 1s; never a blank spinner page}
   ▼
[Lobby] ── sees own avatar pop in w/ confetti tick; others see "{Name} joined" toast
   │ (host starts game)
   ▼
{auto-transition, 3-2-1 countdown overlay — Suresh navigates NOTHING}
   ▼
[Game screen] → plays → {game ends}
   ▼
[Results] ──(host: play again)──► {auto-return to game}   ← the loop
   │ taps [Leave] (or closes tab — same result, seat held per grace rules)
   ▼
<<Leave room?>> confirm ─ yes ─► [Goodbye state] room summary + "see you next time"
```

Critical details: name field is the **only** input in the entire flow; no email, no OTP, no avatar choice (auto-assigned, changeable later). If this device joined this room before, the join gate is **skipped entirely** — re-tap = straight to current state (this single rule powers reconnect, §2.5).

### 2.2 Room Creation Flow (Priya — under 60 seconds)

```
[Landing] tap [ + Create a Room ]
   ▼
[Create: Step 1 — name it]   "Sharma Family Diwali" (smart placeholder by date:
   │                          near Diwali → "Diwali Tambola Night 🪔")
   ▼
[Create: Step 2 — pick game] card grid from game registry (Tambola ★ featured)
   │ tap a game card
   ▼
[Create: Step 3 — options]   schema-driven panel, ALL options pre-set to sane
   │                          defaults; Priya can tap [Create] without touching any
   │ tap [ CREATE ROOM ]
   ▼
{room created < 1s} ─► [Lobby — Host view, "share moment" state]
   │   link + code displayed huge; lobby is intentionally share-first while empty
   │ tap [ ⊕ Share on WhatsApp ]  (also: copy link, more options)
   ▼
{watches avatars pop in, real-time}
   │ (≥ min players?) ──no──► Start disabled w/ live label "Need 1 more player"
   │ yes
   │ tap [ ▶ START GAME ]
   ▼
<<Start?>> "6 players in. Latecomers can still join." [Start now] [Wait]
   ▼
{3-2-1 countdown on ALL screens simultaneously} ─► [Game]
```

Design reasoning: creation is 3 steps but feels like 1 — steps 1–3 are a single screen on desktop and a single scrolling sheet on mobile, with the game grid as the visual anchor. The empty lobby is deliberately styled as a *sharing console*, not a sad empty room (§6).

### 2.3 Tambola Flow

```
[Lobby] host start ─► {server deals tickets}
   ▼
[Ticket reveal] each player's ticket flips in (800ms moment; builds ritual)
   │            auto-mark? shown ON by default for guests, as a dismissible chip
   ▼
[Gameplay loop]
   {number called} ─► BIG number + voice-style callout text ("Two fat ladies… 88!")
        │ ─► on my ticket? cell glows → (auto-mark ON: marks itself w/ tick anim)
        │                              (manual: I tap the cell — forgiving hitbox)
        │ ─► my prize pattern complete? CLAIM BAR slides up, pulsing
        │         │ tap [ 🙋 CLAIM Top Line ]
        │         ▼
        │    {server verifies < 1s; ticket dims to "checking…"}
        │     ├─ valid ──► 🎉 FULL-ROOM MOMENT: "{Name} wins Top Line!" everyone
        │     │            sees identical celebration; prize chip moves to winner
        │     └─ invalid ► private, gentle: "Not yet — 2 numbers to go" (room sees
        │                  nothing; public failure would shame elders — never do it)
        └─ repeat until (all prizes claimed | full house)
   ▼
[Results] prize-by-prize winner list ─► play again / switch game
```

### 2.4 Rummy Flow

```
[Lobby] host start ─► {server seats players}
   ▼
[Seating reveal] table forms; avatars take seats; wildcard joker flips face-up
   │              (2s moment — everyone sees the same joker reveal together)
   ▼
[Deal animation] 13 cards fan into my hand ─► [Sort] suggestion chip appears
   ▼
[Turn loop]                         my turn? ──no──► watch state: turn ring on
   │ yes: my avatar ring fills,                       active player, my hand
   │ haptic + chime, action bar wakes                 interactive for grouping only
   │
   ├─ 1) DRAW: tap closed pile or open discard (both pulse until drawn)
   ├─ 2) arrange/group (any time, never blocked)
   └─ 3) DISCARD: tap a card → [Discard] — or drag to discard zone
   │         (turn timer ring 30s; last 10s amber + tick)
   ▼
(I think I'm done?) drag/tap final card to [ DECLARE ] zone (deliberately
   │                 separate from discard — mis-declares are costly)
   ▼
<<Declare sheet>> arrange groups into labeled slots: [Pure run][Run/Set][Set]…
   │ live validity hints per group ("✓ pure sequence" / "⚠ needs same suit")
   │ [ CONFIRM DECLARE ] — full-width, red-accented, double-step
   ▼
{server validates}
   ├─ valid ──► 🎉 "{Name} declares!" reveal: all hands flip face-up, scores count up
   └─ invalid ► "{Name}'s declare was invalid — 80 points" (public by rule, but
                framed neutrally; the GAME announces it, not a red error style)
   ▼
[Results] ranking by points ─► play again / switch game
```

### 2.5 Reconnect Flow (designed, not handled)

```
{socket lost}
   ▼ (0–3s: silence — micro-blips self-heal; don't alarm anyone)
   ▼ (>3s)
[Connection pill → amber "Reconnecting…"] game UI stays VISIBLE but inert
   │            my last-known state remains on screen (frozen, 60% dim board,
   │            hand never hidden — taking the screen away feels like data loss)
   │ others see: my avatar gets ⚡ badge, "{Name} reconnecting" — seat HELD
   │
   ├─ {auto-reconnect succeeds (most cases)}
   │      ▼
   │   {state resync} board "catches up" with a 600ms replay shimmer
   │      ▼ green pill "Back online" (2s) → play resumes. NO user action needed.
   │
   ├─ {user re-taps WhatsApp link / reopens tab}  ← Suresh's instinct; honor it
   │      ▼ device recognized → SKIP join gate → restore current game view
   │
   └─ {grace period expires (game-defined)}
          ▼ game rule applies (Tambola: ticket keeps auto-marking, can rejoin
            anytime; Rummy: auto-drop, hand folds)
          ▼ on return: [Catch-up card] "While you were away: 3 numbers called /
            you were dropped (25 pts). You're back in for the next hand."
```

**The catch-up card is the signature reconnect element:** one dismissible card, max 3 bullet lines, plain language, sits over the live game. Never a modal wall of history.

---

## 3. Screen Inventory

Twelve MVP screens + system states. (States of `/r/{CODE}` count as screens for design purposes.)

| # | Screen | Purpose | Primary action |
|---|---|---|---|
| S1 | Landing | Route to create / join; festival promo | Create a Room |
| S2 | Create Room | Name → game → options → room | Create Room |
| S3 | Join Gate | Convert link-tap to seated player | Join Room |
| S4 | Lobby | Gather, share, ready, start | Start (host) / none (player — waiting is the job) |
| S5 | Game Room — Tambola | Play Tambola | Mark / Claim |
| S6 | Game Room — Rummy | Play Rummy | Draw / Discard |
| S7 | Results | Celebrate, loop | Play Again (host) |
| S8 | Profile & History | Identity, past games | Sign in / view |
| S9 | Sign-in sheet | OTP / Google (optional everywhere) | Continue |
| S10 | Room Settings sheet | Host controls | per-control |
| S11 | Players sheet | Full roster, host moderation | per-player |
| S12 | Terminal states | Full / ended / invalid / kicked / goodbye | Create your own |

Detail per screen (components, edge/empty/error/loading):

**S1 Landing** — *Goals:* Priya: create in 1 tap; code-holder: enter code. *Components:* logo, hero headline, Create button (primary), Join-with-code field+button (secondary), festival banner slot, resume-room card (conditional), how-it-works (3 illustrated steps), footer (privacy/terms). *Edge:* live room on this device → resume card dominates above the fold. *Empty:* n/a. *Error:* offline → banner "You're offline — joining needs internet". *Loading:* static page, instant; no skeleton needed.

**S2 Create Room** — *Goals:* configured room < 60s. *Components:* room-name input (smart placeholder), game card grid (registry-driven: icon, name, "2–30 players", 1-line description), options panel (schema-rendered: toggles/steppers/segmented controls only — no dropdowns on mobile), Create button. *Edge:* only 2 games in MVP → grid styled to look intentional at 2 ("More games coming for Holi 👀" teaser card, non-tappable). *Error:* create fails → inline retry, input preserved. *Loading:* Create button → inline spinner, ≤1s budget.

**S3 Join Gate** — *Goals:* in lobby ≤20s; zero anxiety. *Components:* room name, host line ("Hosted by Priya"), game chip, live avatar row ("Asha, Ravi +3 are in"), name input (autofocus, remembered), Join button (XL), tiny "What is this?" link. *Edge:* returning device → skipped entirely; mid-game lateJoin room → button reads "Join the game"; mid-game no-lateJoin → reads "Join — next hand starts soon". *Error:* name taken in room → suffix suggestion ("Suresh 2?"); join fails → retry button, never dead-end. *Loading:* room info skeleton (name bar + 3 avatar circles), join button disabled until loaded.

**S4 Lobby** — see §6.

**S5/S6 Game rooms** — see §7–9.

**S7 Results** — see §10.

**S8 Profile & History** — *Goals:* see past games; sign in to keep them. *Components:* avatar+name (editable), sign-in card (guests), history list (room name, game, date, outcome chip), sign-out. *Empty:* "Your game nights will show up here" + Create CTA. *Edge:* guest with history who signs in → "history kept" confirmation moment. *Loading:* 3 skeleton rows.

**S9 Sign-in sheet** — *Components:* Google button, phone input → OTP 6-cell input, resend timer, legal line. *Error:* wrong OTP → shake + inline message, cells clear; SMS delays → "taking long? resend in 0:18". *Edge:* dismissible at every step — sign-in is never a wall.

**S10 Room Settings (host sheet)** — *Components:* lock-room toggle, regenerate link, transfer host (player picker), end room (danger zone, double confirm), game options (between games only). *Edge:* non-host never sees the entry point.

**S11 Players sheet** — *Components:* roster with connection dots, host badge, per-player overflow (host only: make host / kick). *Edge:* kick → confirm with name ("Remove Ravi from the room?"); kicked player gets the kind terminal state, no public broadcast beyond "Ravi left".

**S12 Terminal states** — one template, swapped illustration + copy: Full ("Room's packed! 🎪" + notify host + wait-here auto-retry) · Ended ("This game night has ended" + summary if public + Create) · Invalid ("Hmm, that code doesn't look right" + code re-entry) · Kicked (neutral: "The host removed you from this room") · Goodbye (session summary + "Add to home screen?" on 2nd+ visit). *No terminal state is a dead end — every one offers a forward action.*

---

## 4. Wireframes

Mobile (360px) for every screen; tablet/desktop for layout-changing screens (others scale per §13 rules). Annotations: `◉` primary action · `▣` game-slot region · `≡` scrollable.

### S1 Landing — mobile
```
+--------------------------------+
| 🎪 FamilyGames        [👤]     |
+--------------------------------+
| ┌────────────────────────────┐ |
| │ 🪔 Diwali Tambola Nights   │ |   ← festival banner slot (seasonal,
| │    are here!  [Host one →] │ |     hidden when no festival)
| └────────────────────────────┘ |
|                                |
|   Game night with the          |
|   whole family.                |   ← headline 30/38px
|   One link. No installs.       |
|                                |
| ◉ [ ➕  CREATE A ROOM        ] |   ← 56px, full-width
|                                |
|  ── or join with a code ──     |
| [  M A N G O 4 2   ] [ GO ]    |   ← 24px mono, auto-caps
|                                |
| ≡ How it works                 |
| ① Create  ② Share on WhatsApp  |
| ③ Play together                |
|                                |
| Privacy · Terms                |
+--------------------------------+
Conditional, pinned above headline when a room is live on this device:
| ┌────────────────────────────┐ |
| │ ⚡ "Sharma Diwali" is on!  │ |
| │ ◉ [ REJOIN ROOM → ]        │ |
| └────────────────────────────┘ |
```

### S2 Create Room — mobile (single scroll, 3 zones)
```
+--------------------------------+
| ←  Create a Room               |
+--------------------------------+
| Room name                      |
| [ Diwali Tambola Night 🪔   ]  |   ← smart placeholder = valid default
|                                |
| Pick a game                    |
| ┌─────────────┐ ┌────────────┐ |
| │  🎫 ★       │ │  🃏        │ |
| │  TAMBOLA    │ │  RUMMY     │ |   ← selected card: 3px primary
| │  2–30 play  │ │  2–6 play  │ |     border + filled check
| │ Family fav! │ │ 13-card    │ |
| └─────────────┘ └────────────┘ |
| ┌────────────────────────────┐ |
| │ 🎲 More games coming soon  │ |   ← non-tappable teaser
| └────────────────────────────┘ |
|                                |
| Tambola options                |   ← schema-rendered; defaults preset
| Auto-mark for everyone  [ON ●] |
| Calling speed   [Relaxed|Fast] |
| Prizes: ☑Early5 ☑Top ☑Mid      |
|         ☑Bottom ☑Full House    |
|                                |
| ◉ [ CREATE ROOM ]              |   ← sticky bottom
+--------------------------------+
```

### S3 Join Gate — mobile (the most optimized screen in the product)
```
+--------------------------------+
|        🎪 FamilyGames          |   ← brand only; NO nav, NO links out
|                                |
|     You're invited to          |
|   ╔══════════════════════╗     |
|   ║  Sharma Family       ║     |   ← room name 24px bold
|   ║  Diwali 🪔           ║     |
|   ╚══════════════════════╝     |
|   Hosted by Priya · 🎫 Tambola |
|                                |
|   (🟢A)(🟢R)(🟢M)(+3)          |   ← live avatars: "people are here"
|   Asha, Ravi, Maya & 3 more    |     = social proof + urgency
|                                |
|   Your name                    |
|   [ ____________________ ]     |   ← autofocus; 20px text
|                                |
| ◉ [        JOIN ROOM        ]  |   ← 64px — largest button in app
|                                |
|   No sign-up needed · free     |   ← anxiety-reducer line
+--------------------------------+
```

### S4 Lobby — mobile (player view; host view in §6)
```
+--------------------------------+
| Sharma Family Diwali      [⋮]  |
| Code: MANGO 42   🎫 Tambola    |
+--------------------------------+
| Players (6)              ≡     |
| (👑P) Priya          host      |
| (🟢S) Suresh — you             |
| (🟢A) Asha                     |
| (🟢R) Ravi                     |
| (⚡M) Maya      reconnecting…  |
| (🟢K) Kiran                    |
|                                |
| ┌────────────────────────────┐ |
| │ ⏳ Waiting for Priya to    │ |   ← status card = the "what now?"
| │    start the game…         │ |     answer, always present
| └────────────────────────────┘ |
|                                |
| [ ⊕ Invite more ]   [ Leave ]  |
+--------------------------------+
```

### S5 Tambola — mobile (full spec §8)
```
+--------------------------------+
| MANGO42 ▾  (P)(S)(A)(R)+2  ⏸🟢 |   ← platform top bar (≤48px)
+--------------------------------+
| ▣          ┌──────┐            |
| ▣  called  │  88  │ "Two fat   |   ← current number 56px
| ▣  so far  └──────┘  ladies!"  |
| ▣  4·12·23·47·61·88  (recent)  |
| ▣ ┌──────────────────────────┐ |
| ▣ │ YOUR TICKET              │ |
| ▣ │ ┌──┬──┬──┬──┬──┬──┬──┬──┐ |
| ▣ │ │ 4│  │23│  │47│  │  │80│ |   ← 9×3; marked = filled+✓
| ▣ │ ├──┼──┼──┼──┼──┼──┼──┼──┤ |
| ▣ │ │  │12│  │34│  │56│  │  │ |
| ▣ │ ├──┼──┼──┼──┼──┼──┼──┼──┤ |
| ▣ │ │ 7│  │29│  │  │61│77│  │ |
| ▣ │ └──┴──┴──┴──┴──┴──┴──┴──┘ |
| ▣ │ Auto-mark ON ●            │ |
| ▣ └──────────────────────────┘ |
| ▣ Prizes: 🏆Early5–Asha        |
| ▣  ⭕Top  ⭕Middle  ⭕Bottom    |   ← live prize tracker
| ▣  ⭕FULL HOUSE                |
+--------------------------------+
| ◉ [ 🙋 CLAIM TOP LINE! ]       |   ← claim bar: hidden until a
+--------------------------------+      pattern completes, then slides
| 😂  👏  😮  🎉  ❤️   [players] |      up pulsing (64px)
+--------------------------------+   ← platform reaction bar
```

### S6 Rummy — mobile (full spec §9)
```
+--------------------------------+
| MANGO42 ▾   ⏱ 0:23     ⏸ 🟢   |
+--------------------------------+
| ▣      (A)✦      (R)           |   ← opponents arc; ✦ = turn ring
| ▣   13 cards   13 cards        |     (fills as timer runs)
| ▣                              |
| ▣   ┌─────┐      ┌─────┐       |
| ▣   │ 🂠  │      │ 7♦  │       |   ← draw pile · discard (top card)
| ▣   │DRAW │      │TAKE │       |     both pulse on my turn
| ▣   └─────┘      └─────┘       |
| ▣    Joker: 4♣ (face-up)       |
| ▣ ─────────────────────────── |
| ▣  YOUR HAND        [⇅ Sort]   |
| ▣ ╭──╮╭──╮╭──╮ ╭──╮╭──╮╭──╮    |   ← fanned, grouped w/ gaps;
| ▣ │5♠││6♠││7♠│ │K♥││K♦││K♣│    |     selected card lifts 12px
| ▣ ╰──╯╰──╯╰──╯ ╰──╯╰──╯╰──╯    |
| ▣ ╭──╮╭──╮╭──╮╭──╮ ...(scroll) |
+--------------------------------+
| [ DISCARD ]        [ DECLARE ] |   ← action bar; declare visually
+--------------------------------+      distinct (outline, right, guarded)
| 😂 👏 😮 🎉 ❤️      [players]  |
+--------------------------------+
```

### S7 Results — mobile (full spec §10)
```
+--------------------------------+
|        🎊  (confetti)  🎊      |
|        GAME COMPLETE!          |
|                                |
|        ┌─ (👑 A) ─┐            |
|        │  ASHA    │            |   ← winner card, scale-in
|        │ Full 🏠! │            |
|        └──────────┘            |
| ≡                              |
| 🏆 Early Five      Asha        |
| 🏆 Top Line        Suresh ⭐you |
| 🏆 Middle Line     Ravi        |
| 🏆 Bottom Line     Asha        |
| 🏆 Full House      Asha        |
|                                |
| host:                          |
| ◉ [ 🔁 PLAY AGAIN ]            |
| [ 🎮 Switch game ]  [ End ]    |
| player: "Priya is choosing     |
|          the next game… 🍿"    |
+--------------------------------+
```

### S9 Sign-in sheet · S10 Settings sheet · S11 Players sheet — mobile
```
<<Sign in>>                <<Room settings (host)>>      <<Players (6)>>
+------------------+       +----------------------+      +------------------+
| ── drag handle ──|       | ── Room settings ─ ✕ |      | ── Players ─── ✕ |
| Keep your game   |       | Lock room      [OFF] |      | (👑P) Priya      |
| history          |       | New invite link  [↻] |      | (🟢S) Suresh  [⋮]|
| [ G  Google    ] |       | Transfer host    [→] |      |   ↳ host taps ⋮: |
| ── or ──         |       | ──────────────────── |      |   Make host      |
| [ +91 |________] |       | ⚠ End room for all   |      |   Remove…        |
| [ Get OTP ]      |       |   [ End room ]       |      | (⚡M) Maya  ⚡    |
| Skip for now     |       +----------------------+      +------------------+
+------------------+
```

### Tablet (768px) — representative: Lobby & Tambola
```
LOBBY (tablet)                          TAMBOLA (tablet, portrait)
+--------------------------------------+  +--------------------------------------+
| Sharma Family Diwali    MANGO 42  ⋮  |  | top bar                          ⏸🟢 |
+------------------+-------------------+  +------------------+-------------------+
| Players (6)      |  🎫 Tambola       |  |   ┌────┐         | Called board      |
| (👑P) Priya      |  Auto-mark: ON    |  |   │ 88 │ recent  | 1…90 grid, all    |
| (🟢S) Suresh     |  Speed: Relaxed   |  |   └────┘ 4·12·23 | called nos filled |
| (🟢A) Asha       |  Prizes: 5        |  |  YOUR TICKET     | (the "board" that |
| (🟢R) Ravi       |                   |  |  [ 9×3 ticket ]  |  mobile collapses |
| (⚡M) Maya       |  [⊕ Share invite] |  |  Prize tracker   |  into a sheet)    |
| (🟢K) Kiran      |  ◉ [ START GAME ] |  |  Reactions       |                   |
+------------------+-------------------+  +------------------+-------------------+
   two-pane: roster | game config            game core | secondary info pane
```

### Desktop (1200px+) — representative: Game room (universal frame)
```
+------------------------------------------------------------------------------+
| 🎪 Sharma Family Diwali · MANGO 42        (P)(S)(A)(R)(M)(K)        ⏸  🟢    |
+----------------+---------------------------------------------+---------------+
|  PLAYERS       |                                             |  ACTIVITY     |
|  (👑P) Priya   |              ▣  GAME SLOT  ▣                |  88 called    |
|  (🟢S) you     |                                             |  Asha claimed |
|  (🟢A) Asha    |        (game module renders here:           |  Top Line 🎉  |
|  (🟢R) Ravi    |         Tambola ticket+board /              |  Ravi joined  |
|  (⚡M) Maya    |         Rummy table — max 720px wide,       |  ≡            |
|  (🟢K) Kiran   |         centered, aspect-preserved)         |               |
|                |                                             |  😂👏😮🎉❤️    |
+----------------+---------------------------------------------+---------------+
  Left rail: roster (persistent)   Center: game   Right rail: event feed+reactions
  ← the mobile "players sheet" and "toast stream" become persistent rails;
    the GAME MODULE ITSELF is identical to mobile — only platform chrome moves.
```

---

## 5. Landing Experience

### Hierarchy (top → bottom) and reasoning

1. **Festival banner slot** (seasonal, CMS-driven, collapsible): during Diwali/Holi/Onam windows this is the brand's heartbeat — themed art + one CTA ("Host a Diwali Tambola night"). Off-season it disappears entirely; an empty promo slot is worse than none.
2. **Resume card** (conditional, above everything when live): the single highest-value element for returning users.
3. **Headline:** *"Game night with the whole family. One link. No installs."* — the second sentence is the objection-killer for the WhatsApp generation.
4. **Create a Room** — the one ◉ on the page.
5. **Join with code** — visually secondary but functionally complete: oversized cell-style input, auto-uppercase, ambiguity-free charset, paste-tolerant (full URL pasted into the code box just works).
6. **How it works** — three illustrated steps with Indian-family art direction (real multi-generation scenes, not stock gamer imagery). This section earns trust for the *forwarded-link skeptic* who visits the homepage to check legitimacy before tapping a family link.
7. Footer: privacy, terms, language switcher (placeholder in MVP).

Performance is a design feature here: landing and join gate ship as instant-paint pages — no hero video, no carousel, illustrations as lightweight SVG. The festival banner is the only image-weight budget.

---

## 6. Lobby Design

The lobby has two jobs that conflict — **(a)** get more people in (share-first, while small) and **(b)** get the game started (start-first, once viable). The design resolves this with a **state-aware primary zone**: the same screen region morphs as the room fills.

```
Room state            Primary zone shows
─────────────────     ────────────────────────────────────────────
1 player (host alone) HUGE share module: link, code, WhatsApp ◉
                      "Your room is ready — invite the family!"
2..min-1 players      Share module (still primary) + grayed Start
                      with live label: "Need 1 more for Rummy"
≥ min players (host)  ◉ START GAME takes over; share shrinks to chip
≥ min (player view)   Status card: "Waiting for Priya to start…"
between games         Results summary chip + same logic re-applies
```

### Layout Option A — single column, status-led *(recommended for MVP)*
As wireframed in §4/S4: players list on top, morphing primary zone beneath, actions at bottom. *Pros:* one mental model across phone sizes; the player list (the emotional payload — "my family is appearing!") gets top billing. *Cons:* on 10+ player rooms the primary zone pushes below the fold — mitigated by collapsing roster to a 2-row avatar grid + "view all (14)".

### Layout Option B — avatar constellation
Avatars in a loose circle around a central start/share medallion (a "gathering around the table" metaphor). *Pros:* delightful, photogenic for shares, reinforces togetherness. *Cons:* breaks down past ~10 players; harder for screen readers; circle layouts waste vertical phone space. *Verdict:* hold for the Phase 2 "persistent family room" surface, where membership is stable and small.

### Layout Option C — chat-style lobby feed
Joins, ready-ups, and host actions as a feed. *Rejected for MVP:* implies typed chat (deferred per plan) and buries the start action.

### Lobby component specs

- **Player row:** 56px — avatar (40px, generated from name initial + assigned color), name (18px, "— you" suffix for self), right slot for badge (👑 host / ⚡ reconnecting / 🚪 left-dimmed). Join animation: pop-in + 2s soft highlight; a joining family member should feel like an *arrival*, not a list mutation.
- **Room code chip:** `MANGO 42` in 20px mono, tap-to-copy with "Copied!" toast; always visible in lobby (relatives on the parallel voice call ask for it constantly).
- **Share module:** WhatsApp ◉ (brand-green, recognized instantly) + copy-link + native share sheet. Below: the live link in small text — visible proof the link exists.
- **Ready states:** **deliberately omitted from MVP.** Ready-checks add a coordination tax that elderly users fail ("Suresh, tap the green button" over the phone call). The host eyeballs the lobby and starts — exactly like a real living room. The plan lists "ready-up" as a player capability; design implements it as *presence = ready*, with the start-confirm dialog showing who's connected. Revisit only if data shows hosts starting too early.
- **Host start confirm:** "6 players in · Maya is reconnecting" — surfaces connection facts at the moment they matter, then 3-2-1 countdown broadcast to every screen so nobody is surprised by the transition.

---

## 7. Universal Game Room Framework

The contract that lets Tambola, Rummy, Chess, and future games ship without touching platform UI. **The platform owns the frame; the game owns only the slot.**

### 7.1 The frame (identical in every game, every breakpoint)

```
+--------------------------------------+
| ① PLATFORM TOP BAR            (48px) |  room menu ▾ · player strip · pause/host · ⑥ connection pill
+--------------------------------------+
|                                      |
| ②           GAME SLOT                |  the module's canvas — platform never
|        (all remaining space)         |  draws inside; module never draws outside
|                                      |
+--------------------------------------+
| ③ GAME ACTION BAR (slot-controlled,  |  games REQUEST 0–2 platform-styled actions
|    platform-rendered)         (64px) |  (Tambola: Claim · Rummy: Discard/Declare)
+--------------------------------------+
| ④ REACTION BAR                (48px) |  5 fixed emoji + players button
+--------------------------------------+
   ⑤ TOAST/MOMENT LAYER (overlay, platform-owned: joins, wins, host actions)
```

**① Top bar** — room name/menu (▾ opens settings/leave), horizontally scrolling avatar strip with turn/connection badges, host pause control, connection pill. Never grows; never game-customized.

**② Game slot** — the module gets a bounded canvas and the design tokens (§11). It must function from 320×480 upward and declares `preferredOrientation` in its manifest (platform shows the rotate hint; Tambola and Rummy are both portrait-native by design).

**③ Game action bar** — the critical innovation. Games don't draw their own primary buttons; they *declare* up to two actions + state (label, emphasis, enabled, pulsing) and the platform renders them in the system button style, fixed at the thumb zone. This guarantees every game's most important control is always in the same place, same size, same style — **cross-game muscle memory for Suresh**. A game with no global actions (Chess: moves are board taps) declares zero and the slot absorbs the row.

**④ Reaction bar** — fixed set (😂 👏 😮 🎉 ❤️). Tap → emoji floats up from the sender's avatar on *all* screens. Rate-limited with a playful cooldown wobble. Fixed set keeps moderation at zero and muscle memory total.

**⑤ Moments layer** — platform-owned overlay for the event types every game emits: `playerJoined/Left`, `hostAction`, `gameMoment` (small/medium/full-screen tiers). A *full-screen moment* (Tambola "FULL HOUSE!", Rummy "Asha declares!") is a platform template: dim scrim → winner avatar scale-in → headline → confetti burst → auto-dismiss 2.5s. Games trigger it with content; they cannot restyle it. **Identical celebration choreography across games is the platform's emotional signature.**

**⑥ Connection pill** — three states (🟢 quiet dot · 🟡 "Reconnecting…" expanded · 🔴 "Offline — retrying" expanded + slot dimmed). Platform-owned so network honesty looks identical in every game.

### 7.2 How a new game ships (design-side checklist)

A new game's designer delivers **only**: (1) slot layouts at 360/768/1200 using system tokens; (2) action-bar declarations per game state; (3) moment content (text + tier) for its key events; (4) options-panel schema fields (auto-rendered, §S2); (5) a results payload mapped to the standard results template (§10); (6) an icon + game card for the registry grid. They design **zero**: navigation, lobby, top bar, reactions, toasts, results chrome, settings, share, reconnect UI. *Chess fit-check:* board in slot, zero action-bar buttons (or "Offer draw" as one), clock rendered by module inside slot, moments = "Check!", "Asha wins by checkmate"; results template = 1v1 podium. No platform changes — the framework holds.

---

## 8. Tambola UX Design

Tambola's UX brief: **recreate the living-room ritual** — the dramatic call, the scramble to check, the triumphant shout — not digitize a spreadsheet.

### 8.1 The call (the heartbeat)

- Number appears with a 300ms scale-bounce in a fixed "caller stage" — **56px digits**, the largest text in the app. Below it, the traditional nickname line ("Two fat ladies — 88!") in 18px; these phrases are the game's charm and double as audio-free narration. Phase 2 adds voice.
- Recent-numbers ribbon (last 6) under the stage; full 1–90 board lives behind a "Called so far" expander on mobile (sheet), persistent pane on tablet/desktop. Reasoning: the full board is a *verification* tool, not a *play* surface — it must not steal phone space from the ticket.
- Calling cadence (host option): Relaxed 10s / Normal 7s / Fast 5s; a thin progress ring around the caller stage telegraphs the next call so the room breathes together.

### 8.2 The ticket

- 9×3 grid, full phone width; cells ≈ 38px visual with **48px touch hitboxes** (negative margin spill). Numbers 20px bold. Marked = primary-filled, white number, ✓ stamp animation + light haptic.
- **When a called number is on my ticket, the cell glows amber** (auto-mark: for 1.5s before self-marking; manual: until tapped). This is the Suresh assist: the game points, he taps. Manual-mode mistaps on wrong cells produce a gentle shake — no penalty, no message.
- **Auto-mark defaults ON for everyone** (host-configurable). Purists toggle off per-player via the chip on their own ticket. The plan's auto-mark option is surfaced exactly here — one chip, one toggle, no settings dive.
- Multi-ticket (host option, max 2 in MVP): vertical stack, both always visible — never tabs (checking two tickets against a 5s call cadence across tabs is elder-hostile).

### 8.3 Claims — the emotional core

- **Claim bar** (the game's action-bar declaration) stays hidden until the server-known pattern state says a claim is *plausible*, then slides up pulsing with the specific prize: `🙋 CLAIM TOP LINE!`. One tap claims — no pattern-picking menus (the system knows which pattern completed; if two complete, two stacked buttons).
- **Validation theater:** ticket dims with a 600ms "checking…" sweep (even though the server answers faster — instant feels unceremonious; the sweep is the drumroll).
  - **Valid → full-screen moment** for the whole room: winner avatar, prize name, confetti; prize chip in the tracker flips from ⭕ to 🏆 + name. Sequenced, never overlapped.
  - **Invalid → private and kind:** small inline card on the claimant's screen only — "Not yet! Top line needs 2 more numbers." No room broadcast, no penalty in MVP. *Design rule: public failure is never a Tambola mechanic here* — bogey-calling shame is a feature of money Tambola, not family night.
- **Prize tracker** (under ticket / side pane): every configured prize with state ⭕ open → 🏆 winner-name. Doubles as the scoreboard and the "what's still worth playing for" motivator; when only Full House remains, the tracker highlights it ("All eyes on FULL HOUSE 👀").

### 8.4 Special states

Late joiner → ticket issued on entry, catch-up card shows called-count, board pre-marked. Disconnected player → auto-mark continues server-side (the plan's rule) — their return shows the catch-up card, ticket already current. Host view additions: pause call ⏸ and (auto-caller off) a big CALL NEXT button as *their* action-bar item.

---

## 9. Rummy UX Design

Rummy's brief: make a 13-card hand **manageable on a 360px portrait screen** for someone who has only ever held physical cards. Every interaction has a tap path; drag is an enhancement, never a requirement (low-end Android touch latency makes drag flaky — the plan's device floor decides this).

### 9.1 Hand display & grouping

- Cards 56×80px, fanned with 24px overlap exposing rank+suit corner; **groups are physical gaps** in the fan — no frames, no labels during play (matches how real hands are held).
- Horizontal scroll when needed (13 cards fit at ~340px with overlap; grouping gaps may push wider). Subtle edge-fade affordance signals scrollability.
- **Tap-tap grouping:** tap card (lifts 12px + glow) → tap another card or a gap → it moves there. Multi-select by tapping additional cards while one is lifted. Drag works identically for those who try it.
- **[⇅ Sort] button** (always visible above hand): one tap arranges by suit & rank with a 400ms slide — the single biggest cognitive gift to new players; suggest-chip nudges it after the deal.
- Joker handling: wildcard jokers get a small ⭐ corner badge; the face-up cut joker is pinned next to the draw pile permanently (the #1 "wait, what's the joker?" question, answered ambiently).

### 9.2 Table & turn system

- Opponents as avatar chips in an arc (count-adaptive); each shows card-count and a **turn ring that fills with the 30s timer** — turn state and time pressure in one glanceable element, echoed in the top-bar strip so it survives into every game (framework pattern).
- **My turn ignition:** ring on my avatar + chime + haptic + draw piles begin pulsing + action bar wakes from dimmed to active. Four redundant signals — "I didn't know it was my turn" must be structurally impossible.
- Draw choice: closed pile (🂠 DRAW) vs discard top (face-up, TAKE) as two equal cards center-table; after drawing, the new card slides into hand with a brief glow and the discard step arms.
- Discard: tap card → action bar `DISCARD 7♦` (label shows the card — confirm-by-reading) — or drag card to the discard zone. Timer expiry: system discards the drawn/last card with a neutral "time's up" toast (no shame styling), 2 strikes → game's auto-drop rule with a warning at strike 1.

### 9.3 Declare workflow (high-stakes; engineered friction)

```
[DECLARE] (action bar, outline style — visually distinct from DISCARD)
   ▼ tap
<<Declare sheet — full height>>
  "Place your final discard"      [card slot]
  Arrange your groups:
  ┌ PURE SEQUENCE (required) ┐  ┌ SEQUENCE/SET ┐  ┌ SEQUENCE/SET ┐ …
  │  5♠ 6♠ 7♠   ✓ pure       │  │ K♥ K♦ K♣  ✓ │  │ 2♦ 3♦ ⭐  ✓  │
  └──────────────────────────┘  └──────────────┘  └──────────────┘
  hand groups carry over from play; live ✓/⚠ hints per slot
  ⚠ "This group needs a same-suit run"      ← guidance, not gatekeeping
  ◉ [ CONFIRM DECLARE ]   [ ← back to game ]
```

- Pre-validation **hints** are advisory; the confirm stays enabled even with ⚠ (server is the judge — the plan's authority model — and blocking would falsely imply the client is). The hints exist to make *accidental* invalid declares nearly impossible while leaving the rules drama intact.
- Invalid declare (public by rummy rules): announced via the standard moment template in **neutral game-event styling** — "Ravi's declare didn't stand — 80 points" — never error-red, never iconographically "wrong." The game says it; the UI doesn't editorialize.
- Valid declare → table-wide reveal: all hands flip face-up in sequence, per-player scores count up, then results. The reveal *is* the payoff; give it 3–4 seconds of choreography.
- **Drop:** available on my turn via the room menu + as a quiet text button near the hand ("Drop this hand · 20 pts") — findable but not prominent; cost always shown inline so it's an informed retreat, never a misclick.

---

## 10. Results Experience

One platform template, three layout modes selected by the game's results payload — games fill content, never restyle chrome (framework rule).

| Mode | Used by | Layout |
|---|---|---|
| **Prize list** | Tambola | Winner hero card (Full House) → prize-by-prize list with avatars; my wins flagged ⭐you |
| **Ranking** | Rummy, most future games | Podium top-3 (winner center, elevated) → full table: rank · avatar · name · points; my row highlighted & auto-scrolled-to |
| **Duel** | Chess, 1v1 games | Two large avatar cards, winner crowned; result line ("by checkmate") |

**Choreography (3-act, ~4s, skippable by tap):** ① celebration burst — confetti + winner reveal (full-screen moment reused); ② results settle — list/podium slides in; ③ **the loop controls** arrive last with a soft bounce, so attention lands on them at the exact moment "one more game?" is being said out loud on the family call.

**Loop controls:** Host — ◉ `🔁 PLAY AGAIN` (same game/options, one tap, 5s "starting again…" window others see) · `🎮 Switch game` (opens the same game grid from S2 as a sheet; on pick, everyone's screen shows "Priya picked Rummy!" → lobby-configured state) · quiet `End room`. Players — animated status line ("Priya is choosing the next game… 🍿") **plus their own mini-summary** ("You won Top Line! 3 games tonight") so waiting feels like recap, not limbo.

**Session-cumulative strip** (top of results from game 2 onward): "Tonight: Asha 2 wins · Suresh 1 · 4 games" — the across-games scoreboard that makes the *room session* (the product's true unit) feel like one continuous game night. Second-visit results screens host the PWA install prompt (§1.5) and goodbye states reuse this summary.

---

## 11. Design System — "Angan" (आंगन, the family courtyard)

### 11.1 Color palette

Warm, festive, high-contrast. All combinations specified here pass WCAG AA at their designated usage (§12).

```
PRIMITIVES                                SEMANTIC TOKENS (the only names designers use)
─────────────────────────────             ──────────────────────────────────────────────
marigold-500  #E8590C  ─┐                 color/action/primary        marigold-600
marigold-600  #C2410C  ─┼─ brand          color/action/primary-press  marigold-700
marigold-700  #9A3412  ─┘                 color/action/secondary      peacock-600
peacock-500   #0D9488  ─┐                 color/bg/page               cream-50
peacock-600   #0F766E  ─┼─ secondary      color/bg/surface            #FFFFFF
peacock-700   #115E59  ─┘                 color/bg/sunken             cream-100
indigo-900    #1E1B4B  — night/festive    color/text/primary          ink-900   (13.9:1 on white)
gold-400      #FBBF24  — celebration      color/text/secondary        ink-600   (7.0:1)
cream-50      #FDF8F0  — page bg          color/text/on-primary       #FFFFFF   (5.3:1 on marigold-600)
cream-100     #FAF0E1  — sunken bg        color/border/default        ink-200
ink-900       #292524  — text             color/feedback/success      green-700 #15803D
ink-600       #57534E  — secondary text   color/feedback/error        red-700   #B91C1C
ink-200       #E7E5E4  — borders          color/feedback/warning      amber-700 #B45309
green/red/amber/blue 700-series           color/game/turn-active      gold-400 ring on indigo-900
                                          color/game/marked           marigold-600
                                          color/game/celebrate        gold-400
```

- **Cream page background, white surfaces** — warmer than gray-on-white SaaS palettes; reads "festive home," and lower luminance than pure white reduces glare for older eyes on cheap LCDs.
- **Marigold is exclusively for actions and marks.** If it's marigold, you can tap it or you just scored it — a one-rule color language Suresh can learn in one game.
- **Card suits:** ♥♦ use red-700 (not pure red) for contrast; ♠♣ ink-900. Card faces always pure white for maximum suit legibility.
- **Festival theming = token overlay files** (e.g., `theme/diwali` swaps bg tints, celebration particle colors, banner art). Semantic tokens make a festival skin a data change, not a redesign — text/contrast tokens are locked across themes so accessibility survives every festival.

### 11.2 Typography

```
Family: "Noto Sans" (+ system fallback stack)   — why: free, excellent Devanagari/
        display: "Baloo 2" (headings, numbers)    Tamil/Telugu coverage for the i18n
                                                  roadmap, sturdy at small sizes,
                                                  variable-font = one file
SCALE (mobile / desktop)                  USAGE
display-xl  44/56  Baloo 700              called Tambola number (56px digits)
display     30/38  Baloo 700              landing headline, moments ("FULL HOUSE!")
heading     24/28  Noto 700               room names, sheet titles
title       20/22  Noto 600               section heads, room code, card ranks
body        18/18  Noto 400               DEFAULT — deliberately ≥ standard 16
body-sm     16/16  Noto 400               secondary lines (floor for any reading text)
caption     14/14  Noto 500               badges, timestamps only — never instructions
Line-height 1.5 body / 1.2 display · sentence case everywhere (all-caps only for
≤2-word button labels) · numerals: Baloo tabular for tickets, cards, timers, scores
```

**18px body as default is the headline accessibility decision** — chosen for Suresh-at-arm's-length, budgeted into every layout from the start rather than retrofitted.

### 11.3 Spacing, radius, elevation

```
SPACE  4-base: 4 · 8 · 12 · 16 · 24 · 32 · 48 · 64     (space/1 … space/8)
       screen gutter 16 mobile / 24 tablet / 32 desktop
RADIUS sm 8 (inputs, chips) · md 12 (buttons, cards) · lg 20 (sheets, modals)
       full (avatars, pills) — generous radii = the friendly geometry of the brand
ELEVATION (4 levels, shadow + hairline)
  e0 flat        page sections          e2 raised      sheets, popovers, claim bar
  e1 card        tickets, lobby cards   e3 overlay     modals, full-screen moments
  Shadows warm-tinted (ink at 8/12/16% opacity) — gray shadows look dirty on cream.
```

### 11.4 Iconography

Rounded, filled, 2px-stroke-equivalent set (Phosphor Fill or custom); 24px default / 28px in nav; **always paired with a text label** — icon-only buttons are banned in MVP except the universally-known ✕ and the reaction emoji. Emoji are used deliberately as content (🎫 🃏 👑 🏆 ⚡): zero-cost cross-culture recognition and festival warmth that an icon font can't match.

### 11.5 Component library (MVP set, with key states)

| Component | Variants | Sizes | States | Notes |
|---|---|---|---|---|
| **Button** | primary / secondary / outline / ghost / danger | 64 XL (join, claim) · 56 L (default mobile) · 44 M (desktop, compact) | rest · press (scale .97 + darken) · disabled **(with reason label beneath — never silently disabled)** · loading (inline spinner, label stays) · pulsing (claim/turn) | full-width default on mobile |
| **Game card** (registry grid) | default / selected / teaser-disabled | — | rest · selected (3px primary border + check) | icon, name, player-range, one-liner |
| **Input** | text / code (cell-style) / OTP (6-cell) / phone (+91 prefix) | 56px | rest · focus (2px peacock ring) · error (red ring + 16px message below, never tooltip) · disabled | labels always above, 16px — no floating labels (elderly users lose them) |
| **Sheet** (bottom) | half / full | — | drag-handle + ✕ + scrim-tap (three exits, §1.3) | becomes centered modal ≥768px |
| **Dialog** | confirm / danger | — | max 2 actions, primary right, danger = red + verb-specific label ("Remove Ravi", never "OK") | |
| **Toast** | info / success / moment-sm | — | 3s auto-dismiss, top-center, max 2 stacked, queue beyond | never covers the action bar |
| **Avatar** | initial-auto (name initial + assigned color from an 8-hue set) | 28 strip · 40 list · 64 results · 96 moments | + badge slot: 👑 ⚡ ✦turn-ring 🔇 | photos: post-MVP |
| **Badge/Chip** | status / prize / count / toggle-chip (auto-mark) | 24 / 32 | rest · active | |
| **Connection pill** | quiet-dot / reconnecting / offline | — | per §7 ⑥ | platform-reserved |
| **Player row** | lobby / sheet / results | 56px | + host-actions overflow | per §6 |
| **Caller stage · Ticket cell · Playing card · Pile · Turn ring · Prize tracker row** | game-kit components — built on the same tokens, owned by game-module design kits (§14) | | | |

---

## 12. Accessibility

Accessibility here is not a compliance checklist — **it's the core product bet**. The target user is a 58-year-old on a cheap phone; every guideline below is mainstream UX for this product. Baseline: **WCAG 2.2 AA**.

**Contrast** — body text ≥ 7:1 where feasible (ink-900/white = 13.9:1; secondary 7:1) — AAA-leaning on purpose for older eyes and harsh sunlight; large display text ≥ 4.5:1; interactive elements + focus indicators ≥ 3:1 against adjacents. **Color never carries meaning alone:** marked ticket cells = fill **+ ✓ stamp**; turn = ring **+ ⏱ badge**; suits = color **+ symbol**; connection = color **+ icon/label**. Festival theme overlays are contrast-locked (§11.1).

**Type & zoom** — 18px body floor (16px absolute minimum for any reading text, 14px only for non-essential captions); layouts must survive OS font-scale 1.3× (test requirement per screen — sheets scroll, buttons grow, nothing truncates critical labels); browser zoom 200% without horizontal scroll on document-style pages.

**Touch** — 48×48px minimum hitbox everywhere (visuals may be smaller; hitboxes spill — ticket cells §8.2); primary actions 56–64px in the bottom thumb zone; **destructive/irreversible actions never adjacent to high-frequency targets** (Declare is separated from Discard by position *and* style; Leave is behind the menu, not on the bar); spacing ≥ 8px between adjacent targets.

**Keyboard (desktop)** — full traversal: logical tab order (top bar → game slot → action bar → reactions); visible 2px focus ring (peacock on light, gold on dark) — never suppressed; game-slot grids (ticket, hand) are arrow-key navigable composites with Enter to act; Esc closes sheets/dialogs; moments are dismissible, never focus-trapping.

**Screen readers** — every state change that sighted users see animated has a live-region announcement: polite for ambient ("Number 88 called", "Asha joined"), assertive for personal-critical ("Your turn", "You won Top Line!"); ticket cells expose `aria-label="Number 47, marked"`; cards "7 of diamonds, in group 2 of 3"; timers announce at 30/10/5s — not every second; reaction bursts are decorative (`aria-hidden`) with a single summarized announcement ("Ravi reacted 👏"); all moments/toasts have text equivalents — confetti is never the only signal.

**Motion & audio** — `prefers-reduced-motion` honored globally: celebrations become static cards + color emphasis, card animations become instant placement (a token-level switch in the motion system, not per-feature patches); no flashing > 3Hz; Phase-2 audio always has visual parity (caller voice ⇄ on-screen number — already true by design).

**Elder-specific patterns (the Suresh layer)** — one primary action per screen (law #2); disabled buttons always say *why* ("Need 1 more player"); no gesture-only interactions (everything draggable is also tappable; everything swipeable has a button); no timed reading (toasts repeat in the activity feed on desktop; catch-up card persists until dismissed); forgiving inputs (codes case/space-insensitive, name field trims, OTP auto-advances); error copy in plain warm language — "Not yet! Two more numbers to go", never "Invalid claim (ERR_PATTERN)".

---

## 13. Responsive Design Strategy

### Breakpoints & philosophy

```
S  320–599    phone (DESIGN ORIGIN — every screen designed here first)
M  600–1023   tablet / small laptop
L  1024+      desktop
```

Mobile is the design *origin*, not a compression target. Larger screens **add chrome around the same core** — they never rearrange the game itself. A player on desktop and an uncle on a phone must be describing the same screen on the family call ("tap the orange claim button" must be true for both). Hence the invariant rule:

> **The game slot's internal layout is breakpoint-stable.** Only platform chrome (rails, sheets-vs-panes) and slot *scale* change across breakpoints.

### Per-screen behavior

| Screen | S (phone) | M (tablet) | L (desktop) |
|---|---|---|---|
| Landing | single column, full-width CTAs | single column, max-width 560, larger art | split hero: copy+CTAs left, illustration right; how-it-works 3-up |
| Create | full-screen page, sticky CTA | centered sheet 560px | modal-page 640px; game grid 3-up |
| Join gate | full-screen | centered card 480px on dimmed festive bg | same as M (never wider — it's a funnel, keep it a funnel) |
| Lobby | single column (§6 A) | two-pane: roster \| share+start (§4 tablet) | two-pane wider; roster gains presence detail |
| Game room | frame stacked vertically (§7) | frame + **one** side pane (game chooses: Tambola → called board; Rummy → activity) | three-zone: players rail \| slot (≤720px, centered) \| activity+reactions rail (§4 desktop) |
| Tambola slot | ticket full-width; board in sheet | ticket + persistent board pane | same as M, scaled; board always visible |
| Rummy slot | table arc + hand bottom | identical, more card spread (less overlap) | identical, capped at 720px — a Rummy table wider than arms feels wrong; cap preserves the "table" intimacy |
| Results | single column | centered 560px | centered 640px; session strip becomes side card |
| Sheets | bottom sheets | bottom sheets to 767px, then centered modals | centered modals |

Inputs: hover states exist only ≥M (touch-first at S); desktop adds keyboard shortcuts (Enter = primary action, R = reaction bar focus) as enhancements, never requirements. Orientation: portrait-locked layouts for MVP games; landscape phone shows a friendly rotate card (both MVP games are portrait-native — building dual orientations doubles QA for ~0 user value at this stage).

---

## 14. Figma Structure

### 14.1 File & page architecture (3 libraries + product files)

```
📁 FamilyGames Design
│
├─ 🎨 LIB · Angan Foundations        (tokens only — the dependency root)
│    Pages: Cover/usage · Color (primitives→semantic, Figma Variables,
│    modes: Default / Diwali / Dark-future) · Type · Space-Radius-Elevation ·
│    Iconography · Motion specs
│
├─ 🧩 LIB · Angan Components         (subscribes to Foundations)
│    Pages: Buttons&Actions · Inputs&Forms · Surfaces(Sheet/Dialog/Toast) ·
│    Avatars&Badges · PlayerRows&Lists · Platform-Frame parts (top bar,
│    action bar, reaction bar, connection pill, moment templates)
│
├─ 🃏 LIB · Game Kits                (subscribes to both; one page per game)
│    Tambola kit: caller stage, ticket, cell states, prize tracker
│    Rummy kit: playing card (all 54 via rank/suit props), piles, hand
│    fan, turn ring, declare slots
│    _GameKit Template: starter page for every future game (slot frames
│    at 360/768/1200 + action-bar & moment spec sheets) ← §7.2 made real
│
├─ 📱 PRODUCT · MVP Screens
│    Pages: 0-Flows(FigJam links) · 1-Landing&Create · 2-Join&Lobby ·
│    3-GameRoom-Frame · 4-Tambola · 5-Rummy · 6-Results&Loop ·
│    7-Account&Settings · 8-System&Terminal states · 9-OG&Share cards
│    Per page: S/M/L frame rows + a "States" row (loading/error/edge per §3)
│
├─ 🔗 PROTOTYPES  (Suresh-join · Priya-create · Tambola round · Rummy
│                  turn+declare · Reconnect — one flow per page, phone-size,
│                  used for usability tests with real elders)
└─ 🗄 ARCHIVE     (dated, never deleted in place)
```

### 14.2 Tokens as Figma Variables

Collections: `primitive/*` (hidden from pickers) → `semantic/*` (published; aliases primitives; **modes = themes**: Default, Diwali, …) → `component/*` (only where components need indirection). Designers may only apply `semantic/*` or `component/*` — a lint rule (Figma plugin audit) flags raw-primitive usage. This mirrors the festival-overlay strategy (§11.1) 1:1 so engineering tokens (Style Dictionary export) and design stay isomorphic.

### 14.3 Naming conventions

```
Components   Platform/Button/Primary · Platform/Frame/ActionBar
             Game/Tambola/TicketCell · Game/Rummy/Card
Variants     props not names: size=L|M|XL · state=rest|press|disabled|pulsing
Frames       S3-JoinGate/S-360/state=loading   (screen# / breakpoint / state)
Variables    color/action/primary · space/4 · type/body/size
Layers       named, no "Frame 427" in published libraries (review gate)
Branching    library changes via Figma branches + design review, mirroring
             code PR culture; product files work mainline
```

### 14.4 Handoff conventions

Every shipped screen carries a **spec sidebar frame**: interaction notes (tap/press/disabled-reason), motion timings (from §11 motion specs), a11y annotations (focus order arrows, aria-labels, live-region notes), and the §3 state checklist ticked. Dev-mode-ready: auto-layout throughout, variables bound (no detached fills), components only from published libs.

---

## 15. Handoff Notes

**What a hi-fi designer still decides** (intentionally open): illustration style for landing/terminal states (brief: warm Indian-family scenes, flat vector, festival-skinnable) · final avatar hue set (8 colors, must pass badge-contrast) · Baloo 2 vs. one alternative display face shootout at 56px digits on a 360px LCD · confetti/particle art direction within the locked 2.5s moment choreography · festival banner art per occasion.

**What is locked** (changes require revisiting this doc): the three design laws · one-URL room model & navigation rules (§1) · the universal frame and game-slot contract (§7) · action-bar pattern · 18px body / 48px touch floors · auto-mark-on default · private-invalid-claims rule · declare friction design · token architecture & semantic-only usage.

**Build order for the design team** (mirrors the engineering sprints in `PLATFORM_PLAN.md` §18): ① Foundations + Components libs (S1–S2) → ② Join/Lobby/Frame screens (S2–S3) → ③ Tambola kit + screens (S4–S5) → ④ Rummy kit + screens (S6–S7) → ⑤ Results/account/system states (S8) → ⑥ prototype-test with 3 real elders on real devices before S9 alpha — *the design-side launch gate.*

**The one-line test for every future design decision:** *Could Suresh, on a ₹10k phone, on the family call, do this without asking his daughter for help?* If no — redesign, don't document around it.
