# Student Topics — Supervision Handbook

Static site listing open projects (Master's theses, Guided Research, IDP) from
our lab, and the working guide for PhDs supervising them. The order below
mirrors the actual workflow: **post a topic → applicants email → pick one →
register → run → grade.**

## Contents

1. [Adding a topic to the listings](#1-adding-a-topic-to-the-listings)
2. [Selecting a student](#2-selecting-a-student)
3. [Registering the project](#3-registering-the-project)
4. [Running the project](#4-running-the-project)
5. [Final deliverables & presentation](#5-final-deliverables--presentation)
6. [Grading](#6-grading)
7. [Repo reference](#7-repo-reference)

> **Master's supervision document** — an internal doc with the full TUM
> procedures for registering, managing, and closing out Master's theses
> (paperwork, deadlines, grading forms, etc.). Link TBD — update this line
> once you have it.

## 1. Adding a topic to the listings

The topic goes on the public site so prospective students can email you via
the **Contact advisor** button.

### Scoping

- Keep the scope **reasonable for the timeframe** — it's much easier to extend
  a tight plan than to rescue one that was too ambitious from day one.
- Break the project into **clear milestones** so both you and the student have
  something concrete to aim at.

### Adding the topic

Each topic is **one JSON file in `projects/`** plus **one teaser image in
`assets/`**, sharing the same slug. On push, a GitHub Action runs `build.py`
to regenerate `projects.json` and the site updates automatically.

1. **Copy the template.** From `projects/_template.json`, create a new file
   named after your topic using lowercase-and-dashes, e.g.
   `projects/scan-edit.json`. Files starting with `_` are ignored.
2. **Copy the placeholder image** from `assets/_template.jpg` to
   `assets/<slug>.jpg` (same slug as the JSON).
3. **Fill in the JSON fields.** All fields are required — `build.py` fails if
   any are missing or empty.

   | Field           | Notes                                                                  |
   | --------------- | ---------------------------------------------------------------------- |
   | `title`         | Shown on the card and the project page                                 |
   | `supervisor`    | `{ "name": "...", "href": "..." }` — display name + homepage URL      |
   | `email`         | Wired into the **Contact advisor** button                              |
   | `teaser`        | 1–2 sentence card text                                                 |
   | `abstract`      | Longer description on the project page                                 |
   | `milestones`    | List of strings — 2–4 concrete checkpoints                             |
   | `prerequisites` | List of `{ "label": "...", "href": "..." }` — course name + link       |
   | `references`    | List of `{ "label": "...", "href": "..." }`                            |
   | `tags`          | Used for the tag filter on the landing page                            |
   | `type`          | Any of `Master Thesis`, `Guided Research`, `IDP`                       |
   | `state`         | `"open"` or `"taken"` — `"taken"` hides the topic from the landing page |

   Reuse tags across topics where it makes sense — shared tags cluster in the
   landing page filter bar.
4. **Commit and push.** The GitHub Action rebuilds `projects.json` within
   seconds and the site picks up the new topic on next page load.

### Teaser image

Any representative image works — a schematic you drew yourself, a rendered
figure from a related paper, or a result from your own experiments. Save it as
`assets/<slug>.jpg` (aim for **16:9**, e.g. 1920×1080). The current teaser
images in `assets/` were generated with **GPT Images 2.0**.

If you want a quick option, **Gemini 2.5 Flash Image** (nicknamed *Nano
Banana*, in the Gemini app or API) works well. Use the prompt template below,
fill in the `<placeholders>` for your method, and **eyeball the output before
committing it** — a bad teaser is worse than no teaser.

**Fastest workflow — let an LLM fill the template for you:**

1. Copy the **prompt template** below.
2. Copy your **topic JSON file** (e.g. `projects/my-topic.json`).
3. Paste both into Claude (or Gemini) and say:
   > *"Fill the placeholders in the prompt template using the method details
   > from this JSON file. Return only the completed prompt — no commentary."*
4. Paste the completed prompt into an image model — **Gemini 2.5 Flash Image
   (Nano Banana)** — to generate the teaser.

This keeps the visual style consistent across topics (the `Style:` block stays
untouched) while the method-specific content comes straight from the JSON.

**Prompt template (copy, edit, paste):**

```
Create a clean, research-paper-style teaser figure (16:9 aspect ratio, 1920×1080
px) illustrating <ONE-SENTENCE METHOD DESCRIPTION>.

Composition — <3 or 4> panels, left to right, with thin arrows between them:

  Panel 1 — <STAGE NAME, e.g. INPUT>
    <Visual description: what's rendered, key elements, any highlights.>
    Label underneath: "<short caption>".

  Panel 2 — <STAGE NAME>
    <Visual description. If a pretrained/frozen model is involved, include a
    snowflake icon over a box labeled "<model name> (frozen)".>
    Caption: "<short caption>".

  Panel 3 — <STAGE NAME>
    <Visual description. Text guidance or user instructions can be shown as a
    chat bubble above the panel.>
    Caption: "<short caption>".

  Panel 4 — <OUTPUT NAME>
    <Visual description of the final output.>
    Label underneath: "<short caption>".

Style: minimal, academic teaser aesthetic. Light cream background (#f5f7f7).
Clean sans-serif labels in muted grey. Single accent color: deep teal (#054d5c)
for outlines, arrows, and key icons. Diagrammatic, clean, no photorealism.
No heavy shadows.
```

**Tips:**
- **3–4 panels max** — image models handle fewer elements much better.
- Always include the `Style:` block so every thumbnail looks like it belongs
  to the same family.
- If the first render is too busy, drop one panel or one sub-element and retry.
- Aim for **16:9**, roughly 1920×1080 px.

## 2. Selecting a student

Once applicants start emailing (via the Contact advisor button):

- Prefer students who can commit enough time to produce **publishable** work.
- Screen applicants by checking their **transcript** — look for relevant
  courses (computer vision, ML, 3D, etc.).
- If fit is unclear, ask for a short chat before committing.
- Once you've picked a student, **flip `"state": "open"` to `"state": "taken"`**
  in the topic JSON. `build.py` excludes taken topics from the public manifest,
  so the landing page stops showing it and no further applications come in.
  (You can also just delete `projects/<slug>.json` and `assets/<slug>.jpg` if
  you prefer.)

## 3. Registering the project

Registration is a **separate step** that happens only after you and the
student have agreed to work together.

**Try to register within 2 months** of starting to work together. Letting it
drift past that creates scheduling headaches for everyone, and the lab doesn't
usually allow much beyond it — so it's best sorted early.

Before registering:

- **GPU allocation** — you don't *have* to check with **Christoph** before
  registration, but it's good practice to reach out proactively if you expect
  GPU demand. Either way, Christoph needs to know the project's **start and
  end dates**, so set those reasonably when you register.

Registration is on the TUM CIT portal:

- Landing: <https://portal.cit.tum.de/en/Startseite>
- Project studies (Master's Thesis / Guided Research / IDP):
  <https://portal.cit.tum.de/en/Projectstudies>

You need:

- Student's matriculation number
- Start date
- Project title

## 4. Running the project

- **Try to keep a weekly meeting** with the student — it's easily the single
  biggest factor in keeping a project on track, so skip it only when you
  really have to.
- Ask the student to keep a **running shared document** of meeting notes,
  todos, and results. Kicking off each meeting with *"what happened since last
  time?"* works really well.
- **Stay hands-on**, especially in the early and mid stages. A little
  steering every week goes a long way — projects that drift early tend to
  keep drifting.
- **Set intermediary milestones** — agree with the student on 2–4 checkpoints
  spread across the timeline (e.g. data pipeline ready → baseline running →
  first results → final experiments / ablations). Revisit them at the weekly
  meetings so you can both tell early if the project is off-pace, instead of
  finding out only at the deadline.

## 5. Final deliverables & presentation

The student emails **both you and Angela**, at the respective due dates:

1. **Final report** — CVPR template.
2. **Presentation slides**.
3. **Code** (repo link or archive).

For the presentation:

- Contact **Jonathan** to schedule the slot.
- Double-check **Angela's availability** for that slot — she needs to attend,
  so getting it on her calendar early saves headaches.

Extensions are generally not granted, but if something exceptional comes up
(e.g. documented medical issues), please reach out to Angela and we'll work
it out.

## 6. Grading

You (the PhD supervisor) assign the grade and jot down some notes covering:

- Technical report
- Presentation
- Method and results

**Informal notes are fine** — this doesn't need to be a formal written review.
A short paragraph or bullet list that captures your judgment is enough.

**Grading rubric — publication-readiness.** The grade reflects how close the
project is to a publishable contribution. The **highest grade** goes to a
project that fits cleanly into a publication, backed by **thorough ablations**
and **strong results** (quantitative and qualitative). Lower grades reflect
partial or weak results, missing ablations, or an unclear contribution.

Send your notes and proposed grade to **Angela** for final sign-off before the
grade is submitted.

## 7. Repo reference

### Layout

```
.
├── index.html          # Landing page
├── project.html        # Project detail page (rendered from JSON)
├── styles.css
├── app.js              # Landing page logic
├── project.js          # Detail page logic
├── build.py            # Validates projects/ and writes projects.json
├── projects.json       # Generated — do not edit by hand
├── projects/
│   ├── _template.json  # Starting point for new projects (ignored by build)
│   └── <slug>.json     # One file per project
└── assets/
    ├── _template.jpg
    └── <slug>.jpg      # Teaser image, same slug as the JSON
```

The **slug** is the filename (without `.json`) and must match the teaser
image `assets/<slug>.jpg`.

### Local preview

```
python3 build.py              # regenerate projects.json
python3 -m http.server 8000   # serve the folder
# open http://localhost:8000
```

`build.py` doubles as a validator — it exits non-zero if any project is
missing a required field or its teaser image. CI runs it before deploy, so a
broken project blocks the Pages rollout.

### Assets & Git LFS

`assets/**` is tracked with Git LFS (see `.gitattributes`). Set it up once per
machine:

```
brew install git-lfs
git lfs install
```

GitHub's free LFS tier is 1 GB storage / 1 GB monthly bandwidth. Embed heavy
videos from YouTube/Vimeo rather than committing them:

```html
<iframe src="https://www.youtube.com/embed/VIDEO_ID" ... ></iframe>
```

### Deployment

Pushing to `main` triggers `.github/workflows/deploy.yml`, which runs
`build.py` and publishes to GitHub Pages. Set **Settings → Pages → Source:
GitHub Actions** once per repo.

### Removing or renaming

- **Remove:** delete `projects/<slug>.json` and `assets/<slug>.jpg`.
- **Rename:** rename both files to the new slug — old URLs will break.

---
*If anything here is out of date or missing, please update it — don't let the
next supervisor re-learn it from scratch.*
