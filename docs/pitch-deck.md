# Pitch deck structure — Triage Tool

Structure and visual direction for the pitch deck of challenge 7 (Triage Tool for Integration Services, KUNIGO).
Editable working copy with Russian translation: [Claude doc](https://claude.ai/artifact/DfpfzT1kDjrcBQLb3XpsC8).

## Context

One deck does two jobs: the jury reads it alone at the Jury Speedrun, and we present with it on stage if we reach the top 5.

- **Pitch format:** top 5 teams pitch on Saturday at 19:00 — 3 min demo + 2 min jury Q&A, then live voting ([source](https://hackathon.powercoders.org/en/)).
- **Before that:** 18:00 code freeze (submit prototypes), 18:45 Jury Speedrun picks the top 5. Less than a minute per team.
- **Judging:** base score on Desirable, Viable, Feasible, Ethical, summarised as Impact, AI Usage, Prototype, Pitch. Final score = 50% jury, 50% live vote of all participants. Weights to be published.
- **Pitch Coach's frame:** Problem → Demo → Impact in 3 minutes.

Two versions of one deck:

| Version | Who reads it | Slides | Text |
| --- | --- | --- | --- |
| Submission / Speedrun | Jury, without us | All 8 | Self-explanatory, short sentences |
| Stage (3 min) | Jury + audience, with us | Hide 3–6, keep 1, 2, live demo, 7, 8 | Minimal, we speak |

## Slide structure

Eight slides; each names the criteria it covers, but no slide is titled after a criterion.

### 1. Title — the whole project at a glance

- **Content:** product name (TBD), one-line pitch, "for people with a migration background in Lucerne", QR code + link to the live prototype, partner KUNIGO.
- **One-liner draft:** "Ask in your language. Get the right answer or the right office in two minutes."
- **Design:** a phone mock-up with the home screen (language picker + topic tiles) on the right, text on the left. If the jury reads only this slide, they still get the project.
- **Covers:** Pitch, Prototype.

### 2. The problem — Amina (with the video)

- **Content:** Amina, 34, status F, 8 months in Lucerne, speaks Dari, German A1, two kids. Her quote: "I don't want to bother anyone. I just want to know who to go to."
- **Three pains, one line each:** sent from office to office; letters only in German, kids translate; ChatGPT gives generic or wrong answers.
- **Video:** the 15–20 s 3D clip embedded here, plays on click; backup link (YouTube/Drive) in small text under it.
- **Design:** 3D Amina from the video as the hero image, so slide and clip feel like one story.
- **Covers:** Desirable, Impact.

### 3. Our solution — three ways to help

- **Content:** three cards side by side:
    1. Simple question → short answer in plain language + official source.
    2. Needs advice → the right organisation: address, hours, languages, what to bring, map + route.
    3. Official letter → photo of the letter → who sent it, what they want, deadline, what to do; draft reply in German with translation.
- **Entry:** choose a topic tile, type, speak or show a letter.
- **Design:** one phone screenshot per card; same three colours as in the app.
- **Covers:** Prototype, Desirable.

### 4. How the AI works

- **Content:** a simple flow: user input (text / voice / photo) → 2–3 clarifying questions (status, city, urgency) → answer only from a verified knowledge base → answer here OR route to an organisation.
- **Stack line:** React + FastAPI, AI via OpenRouter, deployed on Vercel (developers confirm and add what was integrated).
- **Design:** a left-to-right flow diagram, icons for each step; no code on the slide.
- **Covers:** AI Usage, Feasible.

### 5. Safe by design

- **Content:** status, money, law, health, crisis → always sent to a human organisation, never advised by AI; no photos, letters or chats stored; anonymous, no sign-up; letter drafts marked "check before sending"; urgent help first on the home screen.
- **Design:** 4–5 icons with one line each; calm colours.
- **Covers:** Ethical.

### 6. How it lives at KUNIGO

- **Content:** KUNIGO updates the list of organisations in an admin panel; anonymous statistics show which topics, languages and letter types people ask about; fits KUNIGO's "migrants help migrants" approach. Also works for Carlos, a newcomer specialist on a B permit: "I don't need a lecture, I need an address and opening hours."
- **Design:** a small roadmap: now (hackathon) → next (admin, statistics) → later (optional account, deadline reminders).
- **Covers:** Viable.

### 7. Impact

- **Content:** before / after in two columns: "3 offices, weeks, kids translating" vs "one question, 2 minutes, own language". No invented numbers; add a real figure only if KUNIGO or a mentor gives one.
- **Design:** split slide, grey "before" and colour "after".
- **Covers:** Impact.

### 8. Closing

- **Content:** QR code to the prototype (large), product name, one closing line, team "Call Me Susan" with names and roles.
- **Closing line draft:** "Every new life in Lucerne starts with one question. We make sure it gets an answer."
- **Design:** same layout as slide 1, so the deck closes the loop.
- **Covers:** Pitch.

### Stage version (3 min)

1. Slide 1 + team intro — 20 s
2. Slide 2 with the video — 30 s
3. Live demo of the prototype (Amina's letter + one organisation on the map) — 1 min 40 s
4. Slide 7 Impact — 20 s
5. Slide 8 Closing — 10 s

Backup: 2–3 screenshots or a screen recording hidden after slide 3, in case the Wi-Fi fails.

## Visual direction

The deck, the video and the app should look like one product.

- **Format:** 16:9, built in Figma Slides (the team's Presentation file), exported to PDF for submission.
- **Colours:** take the app's primary colour and the red of "Urgent help" from the Design-Project file; white or very light background, one accent colour per slide.
- **Type:** one sans-serif family, as in the app; titles 40–48 pt, body at least 20 pt, max 3 lines per block.
- **Imagery:** 3D cartoon Amina (and Carlos on slide 6), generated with one consistent character reference, the same as in the video; real phone screenshots for the product, never fake UI.
- **Rhythm:** one idea per slide, one image per slide, lots of white space; slide titles are statements, not labels ("Letters only in German", not "Problem").
- **Languages on screen:** show the same answer in Arabic, Ukrainian and German next to English (languages the app already has) to make "your language" visible.
- **Video in deck:** MP4 embedded, poster frame = Amina with the letter, so the slide looks good even if the video does not play.

## Open questions for Friday

- [ ] What exactly do we submit at code freeze: deck, link, repo or a form?
- [ ] How does the Jury Speedrun work: do they visit tables or only read submissions?
- [ ] Are the criteria weights published yet?
- [ ] Final product name (needed for slides 1 and 8 and the video).
- [ ] Does the app speak Dari? The repo has Arabic, German, English, Russian and Ukrainian; Amina speaks Dari, so either add it or show her using another language.
- [ ] Who presents which part on stage, and who runs the live demo?
- [ ] Do we get ElevenLabs credits for the English voice-over?
