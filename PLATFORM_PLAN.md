# Family Games — Product & Technical Plan

**A web-based multiplayer gaming platform for Indian families and friend groups.**

| | |
|---|---|
| Document version | 1.0 |
| Date | June 2026 |
| Status | Foundation document for design, architecture, and execution |
| Audience | Founders, product, design, engineering |

---

## Table of Contents

1. [Product Vision & Business Goals](#1-product-vision--business-goals)
2. [Target Users & Personas](#2-target-users--personas)
3. [Core Features & User Journeys](#3-core-features--user-journeys)
4. [User Roles & Permissions](#4-user-roles--permissions)
5. [Room Creation & Game Lifecycle](#5-room-creation--game-lifecycle)
6. [Feature Breakdown — MVP vs Future Phases](#6-feature-breakdown--mvp-vs-future-phases)
7. [System Architecture & Technology Stack](#7-system-architecture--technology-stack)
8. [Frontend Architecture & Major Screens](#8-frontend-architecture--major-screens)
9. [Backend Architecture & Major Services](#9-backend-architecture--major-services)
10. [Database Design & Key Entities](#10-database-design--key-entities)
11. [Real-Time Multiplayer Architecture](#11-real-time-multiplayer-architecture)
12. [Extensible Game-Engine Design](#12-extensible-game-engine-design)
13. [Game Isolation from the Core Platform](#13-game-isolation-from-the-core-platform)
14. [Security, Authentication & Authorization](#14-security-authentication--authorization)
15. [Scalability Considerations](#15-scalability-considerations)
16. [Deployment & Hosting](#16-deployment--hosting)
17. [Development Roadmap — MVP to Production](#17-development-roadmap--mvp-to-production)
18. [Sprint-by-Sprint Implementation Plan](#18-sprint-by-sprint-implementation-plan)
19. [Team Requirements & Effort Estimation](#19-team-requirements--effort-estimation)
20. [Risks, Challenges & Mitigations](#20-risks-challenges--mitigations)
21. [Cost Estimation](#21-cost-estimation)
22. [Improvements & Common Mistakes to Avoid](#22-improvements--common-mistakes-to-avoid)

---

## 1. Product Vision & Business Goals

### Vision

> **"The digital living room for Indian families."** A place where a family scattered across cities and countries can gather in one tap and play the games they grew up with — Tambola at Diwali, Rummy after dinner, Chess between cousins — with zero installs, zero learning curve, and zero friction for grandparents.

### What we are really building

The product is **not** "a collection of games." Games are commoditized — Chess exists on chess.com, Rummy on a dozen apps, Poker everywhere. What those products lack, and what we are building, is the **shared social session**: one link, one room, the whole family inside it, with the host running the show the way an uncle runs Tambola at a wedding.

**Reasoning:** If we compete on game quality alone, we lose to specialized incumbents on day one. If we compete on *togetherness* — multi-game rooms, host-driven sessions, festival-event framing, cross-generation usability — we occupy a space the incumbents structurally ignore (they optimize for matchmaking with strangers, not private family rooms).

### Business goals

| Horizon | Goal | Metric |
|---|---|---|
| 0–6 months (MVP) | Validate that families will gather and replay | Weekly active rooms; % rooms with ≥4 players; D30 room-creator retention |
| 6–12 months | Become the default for festival gatherings | Rooms created during Diwali/Holi/Raksha Bandhan spikes; viral coefficient (joins per shared link) |
| 12–24 months | Monetize without breaking trust | Revenue per family group via premium features (see below), not per-user ads |

### Monetization (deliberately deferred, but designed for now)

- **MVP: free, no monetization.** Adding payments early adds legal weight (see Section 20 — this is critical in India) and kills viral growth.
- **Future options, in order of preference:**
  1. **Premium family plan** — larger rooms, custom Tambola tickets, themed events, video chat, tournament brackets.
  2. **Event/occasion packs** — paid "Diwali Tambola Night" kits for housing societies, offices, NRI associations (B2B2C; societies already pay people to run Tambola nights).
  3. **Cosmetics** — avatars, card backs, board themes.
- **Explicitly rejected: real-money gaming.** Real-money Rummy/Poker is a regulatory minefield in India (state-by-state bans, 28% GST on deposits, KYC obligations) and would reposition the brand from "family" to "gambling." This is the single most important strategic boundary of the product. See Section 20.

### Weak assumptions challenged

- **"More games = more value."** False at the start. One game that a 60-year-old can join in 15 seconds beats six games with onboarding friction. MVP ships **two games done excellently**, not six done adequately.
- **"Chess, Poker, Cluedo are good launch games."**
  - *Chess* is 2-player — it doesn't exercise the "family room" value proposition and competes head-on with chess.com. Defer it.
  - *Poker* requires chip/betting mechanics that look like gambling even in free play, and is the least "family across generations" game on the list. Defer it, possibly indefinitely.
  - *"Cluedo" is a Hasbro trademark.* We cannot use the name, board, or characters. We can build an *original* social-deduction game later, but it cannot be Cluedo. This must be flagged before any design work begins.
  - *Tambola (Housie)* is the strongest launch game: it scales to 30+ players, is host-driven (matches our room model), is deeply tied to Indian family occasions, and has near-zero rules friction. **Tambola is the MVP hero game.**
  - *Indian 13-card Rummy* is the strong second: culturally core, 2–6 players, and it forces the architecture to handle hidden information, turns, and server-authoritative state — exactly what every future card game needs.

---

## 2. Target Users & Personas

### Primary segments

1. **Multi-generation Indian families**, often geographically split (metro + hometown + NRI members), gathering digitally on weekends and festivals.
2. **Friend groups / cousins (18–35)** who organize game nights and are the ones who *create* rooms and pull others in.
3. **Communities (future):** housing societies, office social committees, NRI associations running Tambola events for 50–500 people.

### Personas

**Persona 1 — Priya, 29, "The Organizer" (room creator; our growth engine)**
- Product manager in Bengaluru; family in Indore; brother in Toronto.
- Creates the room, shares the link on the family WhatsApp group, explains the rules to everyone over a parallel video call.
- *Needs:* room setup in under a minute; a link that "just works" on every relative's phone; host controls to kick the cousin who's AFK; the session to survive her mom's flaky network.
- *Failure mode that loses her:* any relative saying "it's not opening on my phone."

**Persona 2 — Suresh, 58, "The Uncle" (joiner; our retention test)**
- Joins from a mid-range Android phone on Jio, via WhatsApp link, often on 4G not WiFi.
- Will not install an app, will not create an account, will not read instructions.
- *Needs:* tap link → enter name → in the room. Big touch targets, large fonts, auto-marked Tambola numbers as an option, Hindi/regional language UI (future).
- *Failure mode:* a signup wall or a confusing lobby. He hands the phone back and the family session collapses — losing one Suresh loses the whole room.

**Persona 3 — Aarav, 16, "The Shark" (engagement driver)**
- Plays competitively, wants stats, rematch buttons, and more games.
- *Needs:* low-latency gameplay, leaderboards (future), fast rematch flow.
- *Risk he introduces:* he will try to cheat (multiple tabs, inspecting network traffic). Server-authoritative design (Section 12) is non-negotiable because of him.

**Persona 4 — Meena, 42, "The Society Secretary" (future B2B2C)**
- Runs the housing society's Diwali Tambola for 200 residents, currently with paper tickets and a WhatsApp group.
- *Needs (future):* bulk ticket generation, prize configuration (early five, top line, full house), claim verification, projector-friendly caller screen.

**Design law derived from personas:** every join-side flow is designed for Suresh; every create-side flow is designed for Priya. If a feature helps Aarav but hurts Suresh, Suresh wins.

---

## 3. Core Features & User Journeys

### Core feature pillars

1. **Rooms** — create, share via link, join as guest, persistent for a session, host-controlled.
2. **Games** — pluggable, played inside rooms, multiple games per room session without re-inviting anyone.
3. **Presence & social glue** — who's online, ready states, emoji reactions, lightweight chat.
4. **Host tools** — start/pause/end games, kick/transfer host, configure game options.

### Journey A — Create & invite (Priya)

1. Lands on homepage → "Create a Room" (no login required for MVP; optional account to keep history).
2. Names the room ("Sharma Family Diwali"), picks a game (Tambola), sees a game-options panel (auto-mark on/off, prize lines).
3. Gets a short link + room code (e.g., `famgames.in/r/MANGO42`) and a one-tap "Share on WhatsApp" button.
4. Watches players appear in the lobby in real time; hits **Start** when ready.

*Reasoning:* WhatsApp is the distribution channel in India — the share button and the link-preview card (OG tags showing "Priya invited you to play Tambola 🎉") are growth features, not cosmetics. The room **code** matters too: relatives on a voice call will read it out loud, so it must be short, pronounceable, and case-insensitive.

### Journey B — Join (Suresh)

1. Taps WhatsApp link → browser opens directly into the room's join screen (no homepage detour).
2. Sees room name, host name, who's already in. Types just a display name → "Join."
3. In the lobby. When the host starts, his screen transitions automatically — he never navigates anywhere.

*Hard requirement:* link-tap to in-lobby in **under 20 seconds on a mid-range Android over 4G**. This is the product's most important performance budget.

### Journey C — Play a game (everyone)

1. Host starts Tambola. Players get tickets; host (or auto-caller) calls numbers.
2. Players mark numbers (or auto-mark); claims ("Top Line!") are verified **by the server**, with celebratory broadcast to all.
3. Game ends → results screen → "Play again" or "Switch game" **keeps everyone in the same room**.

*Reasoning:* The "switch game without leaving the room" flow is the architectural reason rooms and games are separate entities (Sections 10, 12). It is also the retention loop: a Tambola crowd rolling into a quick second game is how session length doubles.

### Journey D — Reconnect (the journey everyone forgets to design)

1. Suresh's network drops mid-Rummy. His seat is **held**, his hand preserved, a "reconnecting" badge shows to others.
2. He reopens the link (or the tab recovers) → rejoins into the **current** game state, not the lobby.
3. If he's gone past a grace period (e.g., 2 minutes), the game's own rules decide: Tambola continues without him; Rummy auto-drops his hand.

*Reasoning:* On Indian mobile networks, disconnection is a mainline flow, not an edge case. Designing it last is the most common multiplayer-platform mistake (Section 22). It shapes the state model: all game state lives on the server, and any client can be rebuilt from a state snapshot at any time.

---

## 4. User Roles & Permissions

Keep this deliberately simple. Role systems are a classic over-engineering trap.

### Platform-level roles

| Role | Description | MVP? |
|---|---|---|
| **Guest** | Joined via link, no account. Identified by a device-scoped token. Can do everything inside a room. | ✅ MVP |
| **Registered user** | Optional account (phone OTP or Google). Gets persistent identity, room history, stats. | ✅ MVP (optional, never forced for joining) |
| **Platform admin** | Internal: moderation, feature flags, game enable/disable. | ✅ MVP (minimal internal panel) |

### Room-level roles

| Role | Capabilities |
|---|---|
| **Host** | Everything a player can, plus: select game & options, start/end/abort games, kick players, lock room, transfer host, regenerate invite link |
| **Player** | Join/leave, ready-up, play moves, chat/react |
| **Spectator** *(Phase 2)* | Watch game, chat, no moves. Needed for Tambola callers' family, and for odd-player-out in fixed-seat games |

### Permission principles

- **Room roles are not platform roles.** A guest can be a host. Forcing hosts to register would gut Journey A.
- **Host succession:** if the host disconnects, host transfers automatically to the longest-present player after a grace period; a returning original host can reclaim. Without this, one flaky host connection orphans a 20-person Tambola room.
- **Per-game role extensions** are defined by the game module, not the platform (e.g., Tambola "caller" is a game-level concept the Tambola module assigns — usually to the host — not a new platform role). This keeps the core permission model frozen while games innovate.
- **Enforcement is always server-side.** The client hides buttons for UX; the server rejects unauthorized actions for security. Hidden buttons are not a permission system.

**Challenged assumption:** "We need a fine-grained admin/moderator hierarchy inside rooms." No — these are private rooms among people who know each other. Kick + lock-room covers 99% of moderation needs. Build hierarchy only if/when public rooms exist (not on the roadmap).

---

## 5. Room Creation & Game Lifecycle

The single most important modeling decision in the product:

> **A Room is a long-lived social container. A Game (match) is a short-lived activity inside it.** One room hosts many consecutive games, possibly of different types, with the same crowd.

Getting this wrong — fusing room and game into one object — is why "play again with the same people" is painful on many platforms, and why adding new games later forces rewrites.

### Room lifecycle

```
CREATED ──> OPEN (lobby, joinable) ──> IN_GAME ──> OPEN ──> ... ──> CLOSED
                  │                       │
                  └── LOCKED (host)       └── players may still join as
                                              spectators / next-game queue
```

- **CREATED/OPEN:** room exists, link active, players join the lobby.
- **IN_GAME:** a game instance is active. Whether late joiners can enter the *current* game is decided by the game module (Tambola: yes, sell them a ticket; Rummy: no, queue for next hand). The platform always lets them into the *room*.
- **CLOSED:** explicitly by host, or by inactivity TTL (e.g., 24h with nobody connected). Rooms are ephemeral by default; "persistent family rooms" with a stable link are a Phase 2 premium feature.

### Game (match) lifecycle — uniform across all games

```
CONFIGURING ─> STARTING ─> IN_PROGRESS ─> FINISHED ─> (results) ─> archived
                              │
                              ├─ PAUSED (host)
                              └─ ABORTED (host / all-players-left)
```

- **CONFIGURING:** host picks game + options (the options schema comes from the game module).
- **STARTING:** seats assigned, initial state generated server-side (deck shuffled, tickets dealt), countdown shown.
- **IN_PROGRESS:** the game module owns all rules; the platform owns connectivity, seating, and timers-as-a-service.
- **FINISHED:** game module emits a structured result (rankings, scores); platform renders results, stores history, and returns the room to OPEN with a "play again" pre-config.

### Edge cases to decide now (not during development)

| Situation | Decision |
|---|---|
| Host leaves mid-game | Auto host-transfer (Section 4); game continues |
| All players disconnect | Game PAUSED; room TTL clock starts |
| Player count drops below game minimum | Game module decides: abort vs. continue (Tambola continues at any count; Rummy aborts below 2) |
| Same person opens room in two tabs | Second tab takes over the session; first tab shows "opened elsewhere" (prevents accidental multi-seat) |
| Link shared after room is full | Joiner enters as spectator/queue (Phase 2) or sees a friendly "room is full" with the host notified (MVP) |

---

## 6. Feature Breakdown — MVP vs Future Phases

### Guiding principle

MVP = the smallest product where **one real family completes one real game night and comes back for another**. Everything else is later.

### ✅ MVP (Phase 1)

**Platform**
- Create room (no login), short link + room code, WhatsApp share with OG preview
- Join as guest (name only), lobby with live presence
- Host controls: start game, kick, lock room, transfer host (manual + auto)
- Reconnect with seat-hold and state restore
- In-room emoji reactions (cheap, high-delight) — *full chat deferred; families already have a WhatsApp/call channel open, and chat invites moderation burden*
- Optional account (Google + phone OTP) to save history
- Results screen, "play again," "switch game"
- Responsive web (mobile-first), installable PWA
- Internal admin panel: kill room, disable game, basic metrics

**Games (2 only)**
1. **Tambola** — auto/host caller, server-verified claims, configurable prize lines, auto-mark option, 2–30 players
2. **Indian Rummy (13-card)** — 2–6 players, single-deal mode first (pool/deals scoring later), turn timers, drop option

**Why these two:** Tambola proves the *large-room social event* case; Rummy proves the *hidden-information turn-based card game* engine. Together they exercise ~90% of the platform surface every future game needs. (Reasoning for rejecting Chess/Poker/Cluedo at launch: Section 1.)

### Phase 2 (months 4–7)

- Spectator mode; late-join queues
- Chat (with mute/report basics)
- Game #3 and #4: **Chess** (cheap now — engine pattern exists, use open rules; it's the "two players waiting in a room" filler) and one original quick party game (e.g., a drawing/guessing or trivia game with Indian content packs — these are room-energizers and IP-safe)
- Hindi + 2 regional languages
- Persistent family rooms (stable link, member list)
- Player profiles, per-room leaderboards
- Sound design & celebration animations (Tambola without sound is half a product)

### Phase 3 (months 8–12)

- **Tambola events at scale** (Meena's use case): 100–500 players, bulk tickets, prize management, caller projector view — this is the first monetization wedge
- Premium family plan (room size, themes, history)
- Original social-deduction game (the legally-safe "Cluedo-like")
- Native app wrappers (Capacitor) *only if* PWA install friction proves real in data
- Tournaments/brackets across a room

### Explicitly out of scope (indefinitely, unless strategy changes)

- Real-money gaming, wagering, or anything resembling stakes
- Public matchmaking with strangers (different product, different moderation cost)
- Voice/video calling in-app (families already use WhatsApp/Meet in parallel; build *presence* hooks, not a WebRTC stack — revisit only with strong evidence)

---

## 7. System Architecture & Technology Stack

### Architecture philosophy

**A modular monolith with real-time at its core — not microservices.**

*Reasoning:* The team is small, the domain is one product, and the hardest problems (game-state consistency, reconnects, low-latency fan-out) get *harder* when split across services. Microservices at this stage would multiply deployment, debugging, and latency costs for zero benefit. The monolith is kept modular (clear internal boundaries: platform core vs. game modules vs. HTTP API) so that *if* scale ever demands it, the seams already exist. The only future split candidate is the real-time game-session layer (Section 15).

### High-level diagram

```
                ┌─────────────────────────────────────────┐
                │              Browser (PWA)              │
                │  React UI  ·  Game UI plugins  ·  WS    │
                └───────────────┬───────────────┬─────────┘
                          HTTPS │               │ WebSocket
                                ▼               ▼
   ┌────────────┐     ┌──────────────────────────────────────┐
   │  CDN /     │     │        Application Server(s)         │
   │  static    │     │  (Node.js modular monolith)          │
   │  assets    │     │ ┌─────────┐ ┌──────────────────────┐ │
   └────────────┘     │ │ HTTP API│ │ Real-time core       │ │
                      │ │ (REST)  │ │ rooms · sessions ·   │ │
                      │ └─────────┘ │ presence · game host │ │
                      │             │  ┌────────────────┐  │ │
                      │             │  │ Game modules   │  │ │
                      │             │  │ tambola, rummy │  │ │
                      │             │  └────────────────┘  │ │
                      │             └──────────────────────┘ │
                      └──────┬───────────────┬───────────────┘
                             ▼               ▼
                      ┌────────────┐  ┌─────────────┐
                      │ PostgreSQL │  │    Redis    │
                      │ durable    │  │ live state, │
                      │ data       │  │ pub/sub,    │
                      └────────────┘  │ presence    │
                                      └─────────────┘
```

### Technology choices & reasoning

| Layer | Choice | Reasoning / alternatives considered |
|---|---|---|
| Language (backend) | **TypeScript / Node.js** | One language across stack (small team velocity); event-loop model fits WS fan-out; huge talent pool in India. *Alternatives:* Go (better raw WS perf, but splits the stack and slows a small team — revisit for the session layer at scale); Elixir/Phoenix (technically ideal for this domain, but hiring risk in India is real). |
| Backend framework | **NestJS** (or plain Fastify if the team prefers lighter) | Enforces the module boundaries the monolith depends on; first-class WS gateway support. |
| Real-time | **Socket.IO over WebSocket** | Auto-reconnect, rooms/namespaces, fallbacks, Redis adapter for multi-node — all of which we'd otherwise rebuild. Raw `ws` is leaner but we'd reimplement exactly these features. *Not* WebRTC (peer-to-peer is wrong for server-authoritative games). |
| Frontend | **React + Vite + TypeScript**, PWA | Mobile-first SPA. Next.js is *not* needed for the app shell (almost everything is behind a session, no SEO value) — but use a small static/SSR layer (or simple server-rendered pages) **only** for the landing page and the link-preview/join page where OG tags and first-paint speed matter. |
| State (client) | Zustand (UI) + a thin game-state store fed by server events | Avoid Redux ceremony; game state is server-owned, the client only mirrors it. |
| Durable DB | **PostgreSQL** | Relational fits users/rooms/results; JSONB handles per-game flexible payloads (options, results, snapshots) without schema churn. *Rejected:* MongoDB — we'd lose easy relational queries (history, stats) and gain nothing; live state isn't stored here anyway. |
| Live state & messaging | **Redis** | Room/game live state (with TTL), presence, pub/sub between nodes, rate-limit counters. The natural fit for "fast, ephemeral, shared." |
| Auth | Phone OTP (MSG91/Twilio) + Google OAuth; JWT in httpOnly cookies | Phone-first is the Indian norm; guests get signed anonymous tokens. |
| Infra (MVP) | Single cloud region **in India** (AWS `ap-south-1` Mumbai or DigitalOcean BLR), containers | Latency to the user base; data locality. Detail in Section 16. |
| Observability | Sentry (errors) + structured logs + a metrics dashboard (Grafana Cloud / CloudWatch) | Real-time bugs are unreproducible without event-level logging from day one. |

**Challenged assumption:** "We should pick a 'scalable' architecture now (Kubernetes, microservices, event sourcing) so we don't rewrite later." The rewrite risk is overstated and the drag is understated. The genuinely hard-to-retrofit decisions are: server-authoritative state, room/game separation, the game-module interface, and stateless-where-possible servers. Those we lock in now. Everything else (orchestration, service splits) is mechanical later.

---

## 8. Frontend Architecture & Major Screens

### Architectural shape

```
src/
  platform/            # owns everything outside gameplay
    app shell, routing, theming
    room/ lobby, presence, host controls, results
    realtime/ socket client, event bus, reconnect logic
    auth/ guest identity, OTP/Google flows
  games/               # one self-contained package per game
    tambola/   ui components, local view-state, assets, manifest
    rummy/     ...
  shared/              # design system, i18n, utils
```

- **The platform renders the shell** (room frame, player strip, host menu, chat/reactions); **the game module renders only the play area** inside a slot the platform provides.
- Each game UI package implements a small contract: `mount(container, gameClient)`, where `gameClient` gives it (a) its **player-specific view** of game state, (b) an `act(action)` sender, (c) event subscriptions. The game UI never touches sockets, auth, or room logic directly. This mirrors the backend game interface (Section 12) and is what keeps games drop-in addable.
- **Game UIs are lazy-loaded** (code-split per game). Suresh joining a Tambola room must not download Rummy's code. This protects the 20-second join budget permanently, no matter how many games we add.
- **Optimistic UI only for trivial, reversible interactions** (marking your own Tambola number locally). Anything contested (claims, card moves) waits for server confirmation with a subtle pending state. Optimistic gameplay + authoritative server + Indian network jitter = rollback glitches that feel like cheating; don't go there.

### Major screens

| # | Screen | Notes |
|---|---|---|
| 1 | **Landing** | One job: "Create a Room" + "Join with code." Static, fast, OG-tagged. |
| 2 | **Create room** | Name room → pick game (card grid from game registry) → options panel (schema-driven from game manifest) → get link. Three taps total. |
| 3 | **Join** (the link target) | Room name, host, avatars of who's in, one name field, Join button. Zero other chrome. The most optimized screen in the product. |
| 4 | **Lobby** | Player list with ready/host badges, game + options summary, share button, host's Start button. Doubles as the "between games" screen. |
| 5 | **Game screen** | Platform frame (top: room/players strip; bottom: reactions) + game slot (the module's UI). Landscape/portrait handled per game manifest. |
| 6 | **Results** | Rankings/celebration, "Play again" (host), "Switch game" (host). |
| 7 | **Profile/History** *(thin in MVP)* | Past rooms & results for registered users. |
| 8 | **Internal admin** | Separate mini-app. Rooms list, kill switches, game flags, metrics. |

### UX principles (from the personas)

- **Mobile-first, portrait-first.** Tambola and Rummy must be fully playable one-handed in portrait. Desktop is the enhancement, not the baseline.
- **Touch targets ≥ 48px; base font ≥ 16px;** Tambola numbers legible at arm's length for Suresh.
- **Every game state change is animated and (Phase 2) sounded.** In a family game, the *event* ("FULL HOUSE!") is the product. Server broadcasts these as first-class "moment" events so every client celebrates simultaneously.
- **Connection state is always visible** (subtle when fine, prominent when degraded) — honesty about network state builds trust on flaky connections.
- **i18n from day one in the codebase** (string externalization), even though MVP ships English-only. Retrofitting i18n into hundreds of components is miserable; wiring it early is nearly free.

---

## 9. Backend Architecture & Major Services

All of these are **modules inside the monolith** with clean interfaces — "services" in the logical sense, one deployable in the physical sense.

| Module | Responsibility | Key notes |
|---|---|---|
| **Identity** | Guest tokens, OTP/Google auth, JWT issuance, account merge (guest → registered) | Guest identity = signed token bound to a generated player ID, stored client-side; lets reconnect/seat-hold work without accounts. Account merge preserves history when a guest later signs up. |
| **Room service** | Room CRUD, codes/links, membership, locking, host transfer, TTL cleanup | Room live state in Redis (authoritative while active) with periodic snapshot to Postgres; durable record finalized on close. |
| **Presence** | Connect/disconnect tracking, heartbeats, "reconnecting" grace states | Built on socket lifecycle + Redis with TTL keys; feeds both UI and game-host decisions (e.g., auto-drop). |
| **Game host (session orchestrator)** | The heart. Loads a game module, runs the match lifecycle (Section 5), routes player actions to the module, applies its state transitions, broadcasts per-player views, runs timers | Generic: knows *no* game rules. One authoritative session lives on exactly one node at a time (Section 11/15). Provides services to modules: RNG, timers, scheduler, persistence of snapshots. |
| **Game registry** | Catalog of installed game modules + manifests (id, name, min/max players, options schema, capabilities like `lateJoin`, `spectate`) | Drives the create-room game picker and validates options. Feature flags per game (instant kill switch). |
| **History & results** | Persist finished matches, per-player results; serve profile/history queries | Write-once records; the analytics substrate. |
| **Notification/share** *(thin)* | OG-preview rendering for join links, share-text generation | Bigger later (room reminders, event invites). |
| **Admin** | Internal moderation & ops endpoints | Separate auth realm; never mixed with player auth. |
| **HTTP API vs WS split** | REST for request/response (create room, auth, history); WebSocket for everything live (lobby, presence, gameplay, reactions) | Rule of thumb: if two users must see it at once, it's a WS event; if it's one user asking for data, it's REST. Don't tunnel CRUD through sockets — you lose caching, retries, and easy debugging. |

### Background jobs (in-process scheduler for MVP; BullMQ/Redis later)

- Room TTL sweeper (close abandoned rooms, release codes)
- Snapshot finalizer (flush live state of closed rooms to Postgres)
- OTP cleanup, metrics rollups

---

## 10. Database Design & Key Entities

### The two-tier state principle

- **PostgreSQL** = durable truth: identities, room records, match results, history. Things that must survive a server restart and matter tomorrow.
- **Redis** = live truth: current game state, presence, lobby composition. Things that change 10× a second and are worthless tomorrow. Snapshotted to Postgres at checkpoints (game start, game end, periodic during play) so a crashed node can restore a session.

Putting live game state in Postgres (write amplification, latency) or durable history only in Redis (data loss) are both classic mistakes; the split is the design.

### Core entities (PostgreSQL)

```
users
  id (uuid) · created_at · display_name · avatar
  phone (nullable, unique) · google_id (nullable, unique)
  is_guest (bool)            -- guests are users too; merge on signup

rooms
  id (uuid) · code (short, unique-while-active) · name
  host_user_id → users · status (open|locked|closed)
  settings (jsonb) · created_at · closed_at

room_members
  room_id → rooms · user_id → users
  role (host|player|spectator) · joined_at · left_at
  -- membership history, not just current; feeds "recent rooms"

matches                      -- one row per game played in a room
  id (uuid) · room_id → rooms
  game_id (text, e.g. 'tambola') · game_version (text)
  options (jsonb)            -- validated against game manifest schema
  status (in_progress|finished|aborted)
  started_at · ended_at
  result (jsonb)             -- module-emitted: rankings, scores, highlights
  final_state_snapshot (jsonb, nullable)  -- for audit/replay (future)

match_players
  match_id → matches · user_id → users
  seat (int) · outcome (jsonb: rank, score, claims won, …)
  -- enables per-user stats without parsing result blobs

game_definitions             -- registry mirror, for flags & config
  game_id (pk) · enabled (bool) · min_app_version · config (jsonb)
```

### Live state (Redis, illustrative)

```
room:{code}            hash: status, hostId, gameInProgress, settings
room:{code}:members    hash: playerId → {name, role, connState}
match:{id}:state       (string) serialized authoritative game state
match:{id}:seq         (int) event sequence number for resync
presence:{playerId}    TTL key, refreshed by heartbeat
```

### Design notes & reasoning

- **JSONB for game-specific data** (`options`, `result`, `outcome`) is the schema-stability trick: adding game #7 requires **zero migrations**. The platform schema knows games only by `game_id` string. Per-game leaderboards later can build typed projections from these blobs if needed.
- **`game_version` on matches** matters more than it looks: when Rummy's rules/state format evolve, in-flight and historical matches stay interpretable.
- **Room codes are unique only while active**, then recycled — keeps codes short forever. The `rooms.id` uuid is the permanent reference.
- **Guests are `users` rows** (with `is_guest=true`), not a parallel structure. This makes seat-holding, history, and later account-merge trivial, at the cost of dead guest rows (cleaned up by a retention job).

---

## 11. Real-Time Multiplayer Architecture

### Model: server-authoritative, event-sourced-lite

1. **The server owns all game state.** Clients render views and send *intents* ("I want to discard ♠7"), never state.
2. The game host validates the intent via the game module → produces (new state, list of events).
3. Events are broadcast; **each player receives their own view** (hidden-information filtering — Rummy players never receive others' hands over the wire; you cannot "hide" data with CSS from Aarav and his network inspector).
4. Every broadcast carries a **sequence number per match**. Clients detect gaps and request a resync (full per-player snapshot + replay-from-seq). This one mechanism powers reconnects, tab restores, late spectators, and gap recovery uniformly.

```
Player A          Server (game host + module)            Player B
   │  action{discard ♠7, seq?}     │                        │
   ├──────────────────────────────►│ validate (module)      │
   │                               │ apply → state'         │
   │                               │ events + per-player    │
   │  event{A discarded ♠7} #42    │ view diffs             │
   │◄──────────────────────────────┼───────────────────────►│ event #42
   │  (A's view: hand-7)           │      (B's view: discard pile +♠7)
```

### Communication design

- **Transport:** Socket.IO; one socket per client, multiplexed: `room.*` events (presence, lobby, host actions, reactions) and `game.*` events (actions, state events, sync). Socket.IO rooms map 1:1 to platform rooms for fan-out.
- **Latency posture:** these are turn-based/call-based games — the budget is ~200–300ms perceived, not 16ms. This is why we *don't* need UDP-ish tricks, client prediction, or rollback netcode. Don't import twitch-game complexity into a Tambola product.
- **Timers live on the server** (turn clocks, caller intervals) and are broadcast as deadlines (`turnEndsAt: timestamp`), with clients rendering countdowns locally. Client-side timers as truth = cheating + drift.
- **Idempotency:** client actions carry a client-generated action ID; the server dedupes, so retries on flaky networks can't double-play a move.
- **Reconnect flow:** socket drops → presence marks `reconnecting` (grace 60–120s, game-configurable) → client reconnects with its identity token → server replays per-player snapshot at latest seq → seamless resume. After grace expiry the game module's `onPlayerAbandon` hook decides the in-game consequence.

### Single-writer rule (the consistency keystone)

**Exactly one process owns a given match's state at any time.** All actions for a match are funneled to that owner and processed sequentially (per-match queue). This eliminates the entire class of distributed-locking and concurrent-mutation bugs at the cost of a routing requirement (sticky room→node mapping, Section 15). For MVP on one node this is free; the discipline is in *never* writing code that mutates match state from anywhere else.

---

## 12. Extensible Game-Engine Design

This is the product's central technical asset. The goal: **adding game #7 touches zero platform code** — drop in a module that implements the contract, register its manifest, done.

### The game module contract (conceptual, language-agnostic)

Every game is a **pure-logic state machine** plus a manifest plus a UI package:

```
GameManifest
  id, name, icon, description
  minPlayers, maxPlayers
  optionsSchema          # JSON Schema → auto-rendered config UI
  capabilities: { lateJoin, spectate, pausable, teamPlay, … }

GameModule (server-side, pure logic — no I/O, no sockets, no DB)
  init(players, options, rng)            → GameState
  validateAction(state, playerId, action)→ ok | error(reason)
  applyAction(state, playerId, action)   → { state', events[] }
  playerView(state, playerId)            → PlayerView   # hidden-info filter
  spectatorView(state)                   → View
  onTimer(state, timerId)                → { state', events[] }
  onPlayerAbandon(state, playerId)       → { state', events[] }
  isFinished(state)                      → Result | null

GameUI (client-side package)
  mount(slot, gameClient)   # renders PlayerView, sends actions
```

### Why this exact shape

- **Pure functions over injected RNG** ⇒ deterministic replays, trivial unit tests (a full Rummy hand is testable as data-in/data-out with a seeded RNG — no sockets, no mocks), and audit/replay capability later for dispute resolution.
- **`playerView` as a mandatory contract point** bakes hidden-information security into the architecture instead of leaving it to each game author's discipline.
- **Timers and abandonment as hooks** — the platform owns the clock and presence; the game owns the *meaning* ("turn skipped," "hand auto-dropped"). Clean split between mechanism and policy.
- **`optionsSchema` driving generated config UI** means new games get a settings panel for free, and the server validates options without bespoke code.
- **Events out, not state out**: modules emit semantic events (`NUMBER_CALLED`, `CLAIM_VERIFIED`, `TURN_PASSED`) which power animations, sounds, "moments," logs, and analytics uniformly.

### Platform services available to modules (injected, never imported)

RNG (seeded, logged) · timers · per-match KV scratch (rare) · structured logging. Modules **cannot** access DB, sockets, HTTP, or other rooms. (Enforcement: Section 13.)

### Proof of generality (mental test against the wishlist)

| Game | Stresses | Fits contract? |
|---|---|---|
| Tambola | Many players, broadcast-heavy, claims, late join | ✅ caller = `onTimer`; claims = actions; `lateJoin: true` |
| Rummy | Hidden hands, turns, melding validation, drops | ✅ `playerView` filtering; `onPlayerAbandon` = auto-drop |
| Chess | 2-player, perfect info, clocks, draw offers | ✅ trivial subset; clocks = timers |
| Poker (future) | Betting rounds, side pots, hidden + shared cards | ✅ harder logic, same contract |
| Deduction game (future) | Asymmetric secret roles | ✅ `playerView` is exactly the needed primitive |
| Team games (future) | Shared team views | ⚠️ contract extension: views keyed by team — design the view-key to be `(playerId | teamId)` now to keep the door open |

**Challenged assumption:** "Build a generic 'game description language' so games are data, not code." Tempting, wrong. A DSL powerful enough for Rummy melding rules is a programming language with extra steps. Games are **code behind a narrow interface**; the *interface* is the abstraction, not a rules-DSL.

---

## 13. Game Isolation from the Core Platform

Isolation here means three distinct things; conflating them causes either over-engineering or under-protection.

### 1. Logical isolation (MVP — strict)

- Game modules live in separate packages with **dependency direction enforced by lint/build rules**: platform never imports game internals (only the registry + contract types); games never import platform internals (only the contract).
- All platform capabilities arrive via injection (Section 12). A game module that tries to `import` the DB layer fails CI.
- Per-game **feature flags** in the registry: any game can be disabled platform-wide in seconds without deploy — the kill switch for a logic bug discovered in production.
- *Reasoning:* this is cheap, and it's what actually delivers "add games without architectural change." It's a compile-time and code-review guarantee.

### 2. Fault isolation (MVP — pragmatic)

- The game host wraps every module call (validate/apply/onTimer) in a guard: exceptions are caught, the match is marked errored and gracefully aborted with apology UX, the room survives, the error is reported with full state context to Sentry.
- A buggy game must never take down the node, the room, or other matches. Because modules are pure functions (no I/O, no global state), the blast radius of a bug is naturally one match's state — the guard formalizes it.
- Module call budget (e.g., 50ms CPU watchdog) flags pathological logic.

### 3. Process/runtime isolation (future — only if needed)

- Running each game in a separate process/worker (or V8 isolate) buys protection against CPU-hogging or memory-leaking modules — relevant **only when third-party developers write games**. For first-party games, code review + fault guards suffice, and IPC hops would add latency and complexity for nothing.
- The contract's purity (plain-data in/out, no shared references) means moving modules into workers later is a transport change, not a redesign. This is deliberate: we buy the *option* on hard isolation without paying for it now.

**Decision:** MVP ships levels 1+2. Level 3 is explicitly deferred until a third-party game SDK is on the roadmap (Phase 3+, if ever).

---

## 14. Security, Authentication & Authorization

### Authentication

| Actor | Mechanism |
|---|---|
| Guest | Server-issued signed token (JWT) binding a generated `userId`, stored in localStorage + cookie; lives ~30 days. No PII required. |
| Registered | Phone OTP (primary — Indian norm) and Google OAuth (secondary). Short-lived access JWT + rotating refresh token, httpOnly+Secure+SameSite cookies. |
| Socket auth | Token presented at WS handshake; socket is bound to `userId` server-side. No unauthenticated sockets. |
| Admin | Entirely separate realm (separate app, IdP/SSO, IP allowlist). Never the player token system. |

*Account merge:* guest → registered keeps the same `userId` where possible (guests are real `users` rows — Section 10), so history survives signup. This detail is why people *do* sign up.

### Authorization

- Every WS action is checked server-side: is this socket's user in this room? in this match? seated? is it their turn (delegated to module via `validateAction`)? is the action host-only?
- **The game module is part of the authorization chain** — `validateAction` is a security boundary, not just rules-UX. Treat its bypass as a vulnerability class in review.

### Anti-cheat (right-sized for a family product)

- **Information cheating** — the one that matters: solved structurally by `playerView` filtering (Section 12). Never send hidden state and "trust the client to hide it."
- **Action cheating** — invalid/out-of-turn moves: solved by server validation + idempotent action IDs.
- **RNG integrity** — server-side seeded RNG, seeds logged; deck shuffles use crypto-grade randomness. (Commit-reveal fairness proofs: future, only if trust questions actually arise.)
- **Multi-seat abuse** (one human, two seats): mitigated by one-active-session-per-identity (Section 5); not fully solvable, acceptable for private family rooms. Re-evaluate only if public play ever ships.
- **Rate limiting** everywhere: per-IP on HTTP (room creation especially — link-spam vector), per-socket on actions and reactions.

### Platform security baseline

- TLS everywhere; HSTS. Strict CORS. CSP headers (game UIs are first-party code, so no untrusted-script problem yet — revisit hard if third-party games ever ship).
- Input validation at every boundary (HTTP DTOs, WS payloads, game options vs. manifest schema). All user-rendered strings (names, room names) sanitized — display names are an XSS vector aimed at every screen in the room.
- Secrets in a managed store; no secrets in client bundles (obvious, perennially violated).
- Room links: unguessable enough? Codes like `MANGO42` are guessable by design (read-aloud requirement) — compensate with rate-limited join attempts, host lock, and kick. Private-by-obscurity is acceptable for family rooms *because* the host has control tools.
- **Data protection (India's DPDP Act):** collect minimal PII (a phone number is PII), publish a clear privacy policy, support deletion, store data in-region. Guest-first design is also a compliance asset — most users give us nothing but a nickname.
- Dependency scanning + lockfiles; Sentry PII scrubbing.

---

## 15. Scalability Considerations

### Honest sizing first

A room averages ~6 players; a Tambola event maybe 50–200. Turn-based games generate a few events/second per room *at peak*. **A single decent Node process handles thousands of concurrent sockets and hundreds of rooms.** The MVP scaling problem is mostly imaginary; the *real* problems are the festival spike and the stateful-session constraint. Design for those two, ignore the rest.

### The one real constraint: stateful sessions

The single-writer rule (Section 11) means a live match is pinned to one node. Scaling plan in stages:

1. **MVP: one app node** (plus a warm standby). Redis snapshots every N events ⇒ a node restart loses seconds, sessions restore from snapshot+seq. Vertical scaling covers a long way.
2. **Stage 2: N nodes, room-sticky routing.** Rooms are assigned to nodes (consistent hash on room ID, mapping in Redis); the LB or a thin gateway routes WS connects to the owning node; Socket.IO Redis adapter covers cross-node broadcast for the rare cross-room needs. Players in one room land on one node — which is also the latency-optimal layout.
3. **Stage 3 (only at clear need): split the session layer.** The real-time game-host module becomes its own horizontally-scaled deployment (the modular monolith's pre-built seam); HTTP API scales separately and stateless. This is the only microservice split with a plausible future justification.

### Spike posture (Diwali is the load test)

- Festival evenings will be 10–20× baseline, concentrated 7–11pm IST. Plan: pre-scale on the calendar (we *know* when Diwali is), load-test Tambola-with-200-players specifically (it's the broadcast-amplification worst case: 1 number called → 200 fan-out, ×90 numbers), and keep a degrade ladder (disable animations server-hint, reaction throttling, join queue) instead of falling over.
- Postgres is nowhere near the hot path (Redis is) — its scaling story is boring and that's correct. Add read replicas only when history/stats queries demand it.

### Performance budgets (set now, measured always)

| Metric | Budget |
|---|---|
| Link-tap → in-lobby (mid Android, 4G) | < 20s first visit, < 5s repeat (PWA cache) |
| Action → all-clients-see-event (in-region) | p95 < 300ms |
| Reconnect → restored view | < 3s |
| Tambola 200-player call fan-out | < 1s to last client |

---

## 16. Deployment & Hosting

### Recommendations

| Concern | MVP choice | Reasoning |
|---|---|---|
| Region | **India (Mumbai)** — AWS `ap-south-1`, or DigitalOcean/Linode BLR for cost | Users are in India; RTT dominates perceived quality; DPDP data-locality comfort. NRI players (Toronto, Dubai) accept ~200ms — fine for turn-based. |
| Compute | **Containers on a simple PaaS-like setup**: ECS Fargate / Fly.io / DO App Platform. One app service ×2 (sticky), one worker | *Not Kubernetes* — a 3–5 person team should spend zero hours on cluster ops. *Not serverless for the app* — Lambda & friends are hostile to long-lived WebSockets and per-match in-memory state; this is a disqualifier, not a preference. |
| DB | Managed Postgres (RDS / DO Managed) smallest HA tier | Never self-host the database. Backups, PITR, failover for ~$50–100/mo. |
| Redis | Managed (ElastiCache / Upstash / DO) with persistence (AOF) | It holds live game state; pure-cache configuration would lose active games on restart. |
| Static/CDN | Cloudflare in front of everything; static assets on CDN | Free tier covers MVP; also DDoS/bot shielding and WS proxying. |
| CI/CD | GitHub Actions → build, test, deploy on merge to main; staging env from day one | Real-time bugs must be reproducible somewhere that isn't production. |
| Deploy style | Rolling with **connection draining**: node stops taking new rooms, finishes/migrates active matches (snapshot+restore), then recycles | "Deploy = everyone's game dies" is unacceptable after week one. Build the drain mechanism early; it's also the node-failure recovery path. |
| Environments | local · staging · prod; seeded fake rooms/bots in staging for multiplayer testing | A "4 phones on a desk" test rig (or scripted socket bots) is mandatory tooling, not nice-to-have. |
| Observability | Sentry + structured event logs (every match event with match ID + seq) + uptime alerts | The match event log doubles as the replay/debug record. |

**Challenged assumption:** "Use Kubernetes/multi-region from the start for credibility." No. One region, two nodes, managed data stores, boring pipeline. Multi-region enters the conversation only if a large NRI segment shows up in data *and* complains about latency — and even then, turn-based tolerances probably mean it never does.

---

## 17. Development Roadmap — MVP to Production

```
Phase 0  Foundations            ~3 weeks
Phase 1  MVP build              ~12 weeks   → private alpha (week 12), beta (week 15)
Phase 1.5 Hardening & launch    ~3 weeks    → public launch (~month 4.5)
Phase 2  Growth                 months 5–8  → games 3&4, chat, languages, persistent rooms
Phase 3  Scale & monetize       months 9–12 → Tambola events, premium, original game
```

### Phase 0 — Foundations (don't skip; this is where projects are won)

- Lock the game-module contract on paper; **pressure-test it by writing Tambola and Rummy state machines as design docs** against it before any platform code exists. The contract changes that surface now cost hours; in month 3 they cost weeks.
- Design system seed (tokens, core components), the join-flow prototype tested on real cheap Android phones.
- Repo, CI, staging, observability skeleton. Walking skeleton: one room, two browsers, one echoed event, deployed.

### Phase 1 — MVP (detail in Section 18)

Order of construction is a strategic choice: **platform core with a trivial test game first** (a 10-line "click race" game), so rooms/reconnect/host-tools mature against a game with zero rules complexity; then Tambola (stresses fan-out and events); then Rummy (stresses hidden info and turns). Each real game becomes the integration test of the engine.

### Launch gates (definition of "production-ready")

- 50-room load test + 200-player Tambola test passed against budgets (Section 15)
- Reconnect tested under airplane-mode toggles on real devices
- Deploy-with-drain demonstrated; restore-from-snapshot demonstrated by killing a node mid-game
- Security pass: authz matrix reviewed, rate limits verified, dependency audit clean
- 5+ real-family beta sessions observed end-to-end (watch the Sureshes; fix what confuses them)

---

## 18. Sprint-by-Sprint Implementation Plan

Two-week sprints, team per Section 19. Phase 0 = Sprints 0–1 compressed above; MVP build:

| Sprint | Theme | Key deliverables | Exit demo |
|---|---|---|---|
| **S1** | Walking skeleton | Repo/CI/staging; app shell; create/join room (REST); WS connect + presence; Redis room state | Two phones see each other in a lobby on staging |
| **S2** | Room core | Guest identity tokens; lobby UX; host controls (start/kick/lock); host transfer; share link + OG card; room TTL | Priya-flow end-to-end with 5 devices |
| **S3** | Game host + contract | Game-host orchestrator; module contract implemented; **test game** runs full lifecycle; seq/resync protocol; results screen; "play again" | Click-race game: start → play → results → replay, with one phone reconnecting mid-game |
| **S4** | Reconnect hardening + Tambola logic | Seat-hold/grace/abandon hooks; snapshot/restore; Tambola module (tickets, caller, claim verification) fully unit-tested as pure logic | Kill the server mid-test-game, session restores. Tambola logic passes simulated 1000-game fuzz |
| **S5** | Tambola UI + game slot | Frontend game-plugin slot + lazy loading; Tambola UI (ticket, marking, auto-mark, claims, celebrations); options panel from schema | Full 8-player Tambola night on real phones |
| **S6** | Rummy logic | 13-card Rummy module: deal, draw/discard, meld validation, declare, drop, scoring; turn timers via `onTimer`; abandon = auto-drop. (Logic-only sprint — Rummy rules are genuinely fiddly; don't pair with UI work) | Scripted bots complete 1000 valid Rummy hands; invalid-declare cases all caught |
| **S7** | Rummy UI | Hand UI (sort, drag/group on touch), turn indicators, declare flow, per-player views verified (network-level audit: no hidden data on the wire) | 4-player Rummy hand on phones; cheat-attempt checklist passes |
| **S8** | Auth + history + admin | OTP + Google; guest merge; profile/history; admin panel (rooms, kill switches, flags); rate limiting; DPDP basics (privacy policy, deletion) | Sign up after playing as guest → history intact |
| **S9** | Quality & alpha | Reactions; sounds/animations pass 1; error UX everywhere; Sentry triage; load test 1; **private alpha with 5 real families** | Alpha sessions observed; top-10 friction list produced |
| **S10** | Beta & hardening | Alpha fixes; deploy-drain; 200-player Tambola load test; degrade ladder; on-call runbook; beta (50 invited families) | Launch-gate checklist (Section 17) green |
| **S11** | Launch | Landing page polish, OG/share polish, analytics funnels, festival-spike pre-scale rehearsal; public launch | Launched; live dashboard reviewed daily |

*Buffer honesty:* S1–S11 = 22 weeks ≈ 5 months including alpha/beta — consistent with Section 17 once Phase 0 overlaps are counted. The classic slip points are S4 (reconnect is always worse than estimated) and S6 (Rummy rule edge cases); both sprints carry the least parallel work for that reason.

---

## 19. Team Requirements & Effort Estimation

### MVP team (lean, senior-skewed)

| Role | Count | Notes |
|---|---|---|
| Full-stack/backend engineer (real-time lead) | 1 | Owns game host, WS layer, state model. The hardest-to-hire seat; hire first, hire senior. |
| Full-stack engineer (frontend-leaning) | 1–2 | Platform UI + game UIs. 2nd joins ~S4 when game UI work parallelizes |
| Product designer (UX-heavy) | 1 | Full-time through S7, then fractional. Suresh-proofing is design work, not polish |
| Product/founder | 1 | Priorities, beta-family wrangling, game-rules product decisions (scoring variants etc. are *product* calls) |
| QA (part-time/contract) | 0.5 | From S5; multiplayer device-matrix testing. Engineers cannot self-test 6-player flows |

Total: **~3.5–4.5 FTE for ~5 months ≈ 18–22 person-months to MVP launch.**

*Challenged assumption:* "We need a dedicated DevOps engineer." Not with the Section 16 choices (PaaS-style infra, managed stores). The real-time lead carries infra at MVP scale.

### Phase 2 additions

+1 game-focused engineer (new games become parallel workstreams against the stable contract — this is where the engine investment pays off), +0.5 community/support.

### Estimation risk notes

- The 18–22 PM figure assumes the contract freeze in Phase 0 holds. Every post-S5 contract change is a multi-week tax across platform + both games.
- If forced to cut scope to hit a date: **cut Rummy to Phase 1.5, never cut reconnect/hardening.** A one-game platform that never drops a session beats a two-game platform that does.

---

## 20. Risks, Challenges & Mitigations

| # | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| 1 | **Regulatory: perceived as gambling.** Rummy/Poker carry real-money associations; some states (TN, AP, Telangana) have aggressive online-gaming laws; app stores & payment providers treat card games warily | Medium | Existential | No stakes, no wagering, no chips-purchasable, no "winnings" language anywhere. Legal review of game lineup + copy *before* launch. Poker deferred indefinitely. Position relentlessly as family entertainment (Tambola-first branding helps materially). Monitor the 2023+ online-gaming rules & state amendments |
| 2 | **IP: trademarked games.** "Cluedo" (Hasbro), "Monopoly," "Uno" etc. cannot be cloned in name/trade dress | Certain if ignored | High | Use public-domain games (Tambola, Rummy, Chess, Carrom rules) and *original* designs for deduction/party games. IP checklist gate in the game-addition process |
| 3 | **Retention cliff:** families gather for one festival night and never return | High | High | This is the core product risk, bigger than any technical one. Mitigate with: multi-game rooms (one more game before you go), persistent family rooms + "rematch Sunday?" nudges (Phase 2), festival calendar programming (Diwali/Holi/Onam event modes), and measuring *room-level* (not user-level) retention from day one |
| 4 | **The Suresh wall:** join friction quietly kills whole rooms | Medium | High | The 20-second budget as a tracked SLO; real-device testing on ₹10k Android phones in every sprint; observed family beta sessions |
| 5 | **Reconnect/consistency bugs:** desyncs feel like cheating, destroy trust instantly | Medium-high (it's the hard part) | High | Architecture choices made *for* this: single-writer, server-authoritative, seq+resync, pure-logic modules with fuzz tests, chaos drills (kill nodes mid-game) before launch |
| 6 | **Festival spike outage:** down on Diwali night = down on launch day, reputationally | Medium | High | Calendar-based pre-scaling, 200-player load tests, degrade ladder, Cloudflare shielding (Section 15/16) |
| 7 | **Contract churn:** game-module interface proves wrong after 2 games built on it | Medium | Medium-high | Phase 0 paper-testing against 6 games (Section 12's generality table); version the contract; accept additive-only changes post-freeze |
| 8 | **Scope creep into incumbent territory** (matchmaking, rankings, real-money "just for engagement") | Medium | Medium | Strategy boundary written down (this doc); each such proposal must answer "does this help Priya's family night?" |
| 9 | **WhatsApp/link distribution dependency:** OG previews, link handling changes | Low | Medium | Also support plain room codes; test share cards across WhatsApp/Telegram/iMessage regularly |
| 10 | **Team: losing the real-time lead mid-build** | Low-medium | High | Docs-as-architecture (this doc + contract spec), pairing on the game host, no bus-factor-1 modules after S5 |

---

## 21. Cost Estimation

### Development (to public launch, ~5 months)

Assumes India-based senior-skewed team; blended fully-loaded cost ₹2.5–4 L/month for senior engineers, ₹2–3 L for design.

| Item | Estimate (₹) | Estimate ($) |
|---|---|---|
| Engineering (2.5 FTE avg × 5 mo) | ₹35–50 L | $42–60k |
| Design (1 → 0.5 FTE) | ₹9–13 L | $11–16k |
| QA (0.5 FTE × 3 mo) | ₹2–3 L | $2.5–4k |
| Legal (gaming-law + privacy review) | ₹2–4 L | $2.5–5k |
| Devices, tools, misc | ₹1–2 L | $1.2–2.5k |
| **Total to launch** | **₹49–72 L** | **~$59–87k** |

(Founder-engineer sweat equity can cut cash cost dramatically; the figure prices the work, not necessarily the spend.)

### Infrastructure (monthly)

| Stage | Setup | Monthly |
|---|---|---|
| MVP/beta (≤ 500 concurrent) | 2 small app nodes, managed PG (HA), managed Redis, Cloudflare free, Sentry team, staging | **₹25–45k ($300–550)** |
| Post-launch (≤ 5k concurrent, festival spikes) | Scaled nodes ×4–6 on spike days, bigger Redis, monitoring paid tiers | **₹60k–1.2 L ($700–1,400)**, spiky |
| SMS OTP | MSG91 ~₹0.15–0.25/SMS | usage-based; budget ₹5–15k/mo (guest-first design keeps this low — another reason guests matter) |

Infra is a rounding error next to payroll at this stage — optimize for team velocity, not cloud bills. The first real infra spend decision arrives with Tambola-events scale (Phase 3), and by then it should be revenue-backed.

---

## 22. Improvements & Common Mistakes to Avoid

### Improvements to the original idea

1. **Lead with Tambola, brand around occasions.** The idea as stated is game-catalog-shaped ("Chess, Tambola, Rummy, Poker, Cluedo…"). Reframe it event-shaped: "host your family's game night." Tambola is the wedge — it's the one game on the list with no dominant digital incumbent for *private family events*, and it maps perfectly onto the host/room model.
2. **Treat the WhatsApp share card as a core feature.** The invite link's preview is the product's storefront. Invest in it like a landing page.
3. **Plan the parallel-call reality.** Families will be on a WhatsApp/Meet call *while* playing. Don't fight it (no in-app video for MVP); design for it — readable-at-a-glance screens, room codes that can be spoken aloud, host actions announceable ("Priya started Round 2").
4. **Add a "first 60 seconds" tutorial-by-doing per game** (ghost hand showing where to tap) rather than rules pages nobody reads — especially for Rummy.
5. **Make festival programming a product surface** (Phase 2): Diwali Tambola mode with themed tickets and prize labels. This converts a calendar into a retention engine.
6. **Define success metrics at the room level**, not user level: rooms/week, players/room, games/room-session, room-creator 30-day return. The unit of value is the gathering.

### Common mistakes this plan is explicitly built to avoid

| Mistake | Where this plan counters it |
|---|---|
| Launching with many shallow games instead of two deep ones | §1, §6 — two games, excellence bar |
| Fusing "room" and "game" into one object | §5, §10 — separate lifecycles, separate entities |
| Trusting clients with state or hidden information | §11, §12, §14 — server-authoritative, `playerView` contract |
| Designing reconnect last | §3 (Journey D), §11, S4 — it's a first-class journey and a dedicated sprint |
| Microservices / Kubernetes / DSL-for-games before product-market fit | §7, §12, §16 — modular monolith, code-behind-contract, PaaS |
| Forcing signup before play | §2, §4, §14 — guest-first with merge path |
| Ignoring Indian gaming law until launch week | §1, §20 — no-stakes boundary set at the strategy level, legal review budgeted |
| Cloning trademarked games | §1, §20 — IP gate in the game pipeline |
| Testing multiplayer only on developer laptops/WiFi | §16, §17 — device lab, socket bots, real-family observed betas |
| Skipping the contract design phase to "start building" | §17 Phase 0 — paper-test the engine contract against six games first |
| Measuring users when the product's unit is rooms | §22.6 — room-level metrics from day one |

---

### Immediate next steps

1. Pressure-test this document with the team; resolve open product calls (room-size caps, Rummy scoring variant for MVP, brand/name).
2. Engage gaming-law counsel for a written opinion on the no-stakes lineup (cheap now, existential later).
3. Phase 0: write the game-module contract spec + Tambola/Rummy state-machine design docs against it.
4. Recruit 5–10 real families (with at least one Suresh each) as the standing alpha panel.
5. Build the walking skeleton (S1) and put two phones in a lobby.
