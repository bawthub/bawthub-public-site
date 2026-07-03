# BawtHub — Positioning & Essence

> North star for the public site. Read this before refactoring `index.html` /
> `story.html`. The goal of the next revision is to make the site *say the thing
> below* — not to preserve the current messaging by default.

_Captured 2026-07-03 from a design conversation with Nick. This is the essence;
the site is the expression of it._

---

## The one sentence

**A self-hosted, always-on family of real coding agents you steer by *watching
them work* — full tool calls and results rendered live — not by firing a message
into a black box.**

If a visitor remembers one thing, it's that: **you watch the agents work.**

---

## The thesis: observable agentic development

The product is not "AI agents." Everyone has those. The product is **seeing what
the agent is doing while it does it** — the tool calls *and their results*, the
reasoning trail, rendered as real data, pleasantly, in real time. You steer by
*watching and correcting*, not by hoping.

This is the part that took hundreds of hours and is why the app is still private.
It is the crown jewel. The site should lead with it.

### The contrarian bet (say this with confidence)

The industry is running the **opposite** direction. The dominant agentic-tool UX
*hides the guts* — a spinner, a "thinking…", a clean final diff, a collapsed log
you have to dig for. Their design language is "trust me, look away, I'll show you
the result." Cursor, Copilot Workspace, the Devin demo — they abstract the
process because the process looks messy and they're optimizing for demo-comfort.

BawtHub makes the opposite bet: **the process *is* the product.** The failure
mode of agentic coding isn't "it can't code" — it's "it confidently did the wrong
thing three steps deep and you didn't notice." Visibility is the fix. Hiding the
guts optimizes for the demo; showing them optimizes for the developer actually
doing the work. No IDE does this because IDEs are built around a *human* typing
with the agent bolted on as a sidecar. BawtHub is built around the *agent
working*, with visibility as the primary surface. Different center of gravity —
that's why it doesn't look like anything else.

---

## What it actually is: a remote, always-on dev environment with agents at the keyboard

The cleanest mental model: **a developer's laptop, except remote, always-on, and
agent-operated.** A dev has a filesystem, edits code, runs a dev server to test
locally, then commits/pushes — CI/CD elsewhere handles real prod. BawtHub is that
same laptop, living on a server, with a *family* of agents at the keyboard.

- It runs **24/7**. Close your laptop; the agents keep working. (Every "agentic
  dev" competitor dies when the user's machine sleeps.)
- The agents share **one filesystem** across bridges — a *team*, not one
  task-runner in a sandbox.
- You control it by **chatting**. The workspace is whatever you point it at.
- What the agents build **runs on the host**, not baked into BawtHub. BawtHub is
  the cockpit, not the user's production host. Their real deploy is them pushing
  to their own repo → their own CI.

---

## Who it's for (keep these separate — do not blur them on the site)

1. **The BawtHub developer (Nick).** The workspace *is* BawtHub's own source →
   self-hosting/recursive: he builds the thing from inside the thing. Special
   case of #2.
2. **A user running their own agent-dev box.** Their workspace is *their*
   project. BawtHub gives their agents a filesystem + the ability to run what
   they build. A remote dev laptop with AI agents.
3. **The prod-only installer.** Just runs the app (chat/voice/memory), no agents
   developing. The lean tenant.

The membrane between "who builds BawtHub" and "who installs BawtHub" is the
**published image** (GHCR). Installers consume images and build *their own*
projects on top; they never touch BawtHub's source. Don't confuse the two on the
site: the workshop is not the product.

---

## Why nothing else is this (the differentiated intersection)

Strip the hype. The honest, defensible intersection nobody else ships:

**Self-hosted · multi-agent-sharing-one-workspace · persistent-24/7 ·
chat-native · built on real coding harnesses · with live observability of the
work.**

Take any one away and it exists elsewhere:

| Drop… | …and it collapses into |
| --- | --- |
| multi-agent | Devin |
| self-hosted | Devin / Jules |
| persistent / 24-7 | OpenHands, Cursor background agents |
| the real harness | the LangChain-flavored "agent" that's an LLM in a costume |
| chat-native | Coder / Gitpod / Codespaces (human-driven, no agent) |
| **live observability** | **everyone — this is the one nobody has** |

Closest neighbors, honestly: **Devin** (persistent, chat-driven, but single-agent,
closed, hosted) and **OpenHands** (real harness, self-hostable, but session/
task-scoped, single agent). The infra layer (Coder/Gitpod) nails "persistent
remote dev filesystem on your own hardware" but has no agent at the keyboard.

The moat isn't "can't be copied" — the vector is obvious and the big players are
walking toward this clearing. The moat is that the unglamorous plumbing already
*works*: the bridges, shared FS, per-bot identity + memory, access controls, the
image membrane. ~600 hours of it. That's the difference between "agentic coding
harness" and "LLM in a costume," and it doesn't show up in a demo.

---

## Implications for the site refactor

**The gap:** the current site leads with _"One conversation. Every device."_ —
cross-device continuity / self-hosted personal AI. That's a real feature, but
it's **not the thesis.** It undersells to "nice multi-device chat app" when the
actual story is "watch a team of agents build software on a box you own."

Direction for the refactor (decide the hierarchy deliberately — this is a
starting position, not a mandate to delete):

- **Lead with observability.** The hero should *show the guts*: a live tool-call
  card with its result, mid-work. Make the screenshot the argument. The current
  device-triptych is a supporting act, not the headline.
- **Sell the always-on team**, not "a chatbot." Multiple named agents, shared
  workspace, working while you're away.
- **Name the contrarian bet** somewhere prominent — "most agent tools hide the
  work; we show it." It's the sharpest differentiator and it's *true*.
- **Keep device-continuity and memory** as real features, demoted from headline.
- **Developer-honest tone.** This audience smells marketing fluff and abstracted
  "magic" instantly — that's the exact thing the product rejects. Show real tool
  calls, real results, real terminal. The site's *credibility* comes from the
  same honesty the product is built on.

### What NOT to do
- Don't drift into the "AI builds your app, no code!" pipeline-junk aesthetic —
  that's the costume the product explicitly rejects.
- Don't hide the guts to look clean. Showing the guts *is* the brand.
- Don't over-promise a public launch the app isn't ready for. It's still private
  for a reason; the site can tell the story without opening the doors.

---

_When the app changes meaningfully, update this file and the in-source history
comment at the top of `index.html`._
