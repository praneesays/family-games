# family-games

Web application to support the Indian family — a multiplayer game-night platform
(Tambola, Rummy, and more) built around shareable rooms.

This repo currently contains:

- [`PLATFORM_PLAN.md`](./PLATFORM_PLAN.md) — product & technical plan
- [`DESIGN_BLUEPRINT.md`](./DESIGN_BLUEPRINT.md) — UX/UI design blueprint
- A **hi-fi front-end prototype** (React + Vite + TypeScript) implementing the blueprint

A clickable, high-fidelity prototype of the FamilyGames platform described in
[`PLATFORM_PLAN.md`](./PLATFORM_PLAN.md) and [`DESIGN_BLUEPRINT.md`](./DESIGN_BLUEPRINT.md).

**There is no backend.** A mock store (`src/lib/store.ts`) simulates the entire
real-time platform — family members joining the room, Tambola numbers being
called, claims being verified, Rummy opponents taking their turns — so you can
walk the real flows in a browser. Everything is wired to be swapped for a real
WebSocket/server layer later without touching the screens.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
# or a production build:
npm run build && npm run preview
```

Open on a phone-sized viewport (or DevTools device mode) — the app is
mobile-first; tablet and desktop add chrome around the same game slot.

## Try these flows

| Flow | Steps |
|---|---|
| **Create (Priya)** | Landing → *Create a Room* → name + pick game + options → *Create* → watch relatives join the lobby → *Start Game* |
| **Tambola** | Start a Tambola room → numbers auto-call → your ticket auto-marks → a *Claim* button slides up when a line/full-house completes → server-style verification → celebration moment → results |
| **Rummy** | Create a Rummy room → on your turn, tap **Draw**/**Take**, select a card, **Discard** (or **Declare**) → bots play their turns on timers → results |
| **Join via shared link (Suresh)** | Visit any `/r/CODE` (e.g. `/r/LOTUS42`) — a room "already hosted by Priya" appears → enter a name → join → host auto-starts |
| **Results loop** | After any game: host gets *Play Again* / *Switch game*; the session win-strip tallies the whole game night |
| **Sign in** | Landing → 👤 → `/login` → Google, or phone + OTP (prototype: **any 6 digits work**) → lands on the dashboard |
| **Dashboard** | `/dashboard` (signed-in home): stats (games/wins/nights), rejoin card, quick create/join, recent-game history — populated from games you actually finish in the prototype |

## Pages

| Route | Screen |
|---|---|
| `/` | Landing (create / join with code / festival banner / resume card) |
| `/create` | Create Room (game picker + schema-driven options) |
| `/r/:code` | The Room — join gate → lobby → game → results as **states** of one URL |
| `/login` | Sign in (Google mock + phone → 6-cell OTP) |
| `/dashboard` | Signed-in home: stats, quick actions, recent games |
| `/me` | Profile (guest or signed-in, recent games, sign out) |

## How the prototype maps to the design system

- **Design tokens ("Angan")** → `src/styles/tokens.css` (semantic tokens + a
  `[data-theme="diwali"]` festival overlay, contrast-locked).
- **Universal Game Room Framework** (blueprint §7) → `src/components/GameFrame.tsx`.
  The platform owns the top bar, action bar, reaction bar, moments and
  connection pill; a game renders **only** into the slot. Tambola and Rummy each
  plug in by declaring an action set + slot UI — adding a game touches no
  platform code.
- **One URL per room** (blueprint §1) → `src/screens/Room.tsx` renders join /
  lobby / game / results as *states* of `/r/:code`.
- **Components** (Button, Avatar, Sheet, Dialog, Toast, etc.) → `src/components/`.
- **Games** → `src/games/tambola/`, `src/games/rummy/` (pure logic in
  `*Logic.ts`, UI alongside).

## What's faked (and where the real backend would slot in)

- Bots joining, presence/reconnect badges, number calling, claim verification,
  Rummy opponent turns, and scoring all live in `src/lib/store.ts` behind plain
  action methods (`createRoom`, `joinRoom`, `startGame`, `claimPrize`,
  `drawFrom`, `declareRummy`, …). Replace the simulation timers with
  socket events and the screens are unchanged.
- Game-rule logic (Tambola ticket generation/validation, Rummy deal) is real
  enough to be believable but intentionally lenient (e.g. declare validation) —
  authority would move server-side per the plan.

## Scope notes

This is a **design/UX prototype**, not the production app: no auth/OTP backend,
no persistence beyond `localStorage` (your name + last room for the resume card),
and host *pause* is omitted. Accessibility intent from the blueprint (≥18px body,
≥48px touch targets, visible focus, reduced-motion) is implemented in the tokens
and components.
