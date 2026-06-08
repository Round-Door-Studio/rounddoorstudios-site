# Round Door Studio — Content JSON Schemas

This is the source-of-truth spec for every JSON file that drives a story page.

The goal of this document is to make it easy for a human or AI assistant to generate valid story content files without guessing field names, file names, or how files connect to each other.

---

## AI generation rules

When using AI to generate or edit these files:

- Output **valid JSON only** for `.json` files.
- Do **not** include Markdown fences, comments, trailing commas, or explanatory text inside JSON files.
- Do **not** rename keys.
- Do **not** invent a new schema.
- Preserve `slug`, `title`, and IDs exactly unless intentionally creating a new story.
- Use double quotes for all JSON strings.
- Validate the final JSON before saving.
- For unfinished links, use `"#"` or omit the platform link if the code supports omission.

---

## File types

There are **five file types**, each with a clear job:

| File | Scope | Drives |
|---|---|---|
| `library.json` | one file, all seasons | Library grid + Featured + each story's hero metadata, cover, listen links |
| `<slug>/story.json` | per story | Read Along bilingual narrative |
| `<slug>/vocab.json` | per story | New Words tab |
| `<slug>/questions.json` | per story | Curious Questions tab |
| `<slug>/activities.json` | per story | Culture Corner tab |

---

## File naming and folder rules

Use the story `slug` as the folder name.

Recommended layout:

```txt
site/
  content/
    library.json
    stories/
      frog-at-the-bottom-of-the-well/
        story.json
        vocab.json
        questions.json
        activities.json
```

The folder name must exactly match the `slug` used inside each JSON file.

Example:

```txt
folder name: content/stories/frog-at-the-bottom-of-the-well/
slug field:  "frog-at-the-bottom-of-the-well"
```

---

## Required consistency across files

The **most important connector is `slug`**.

Every story must use the same exact `slug` in:

- `library.json`
- `story.json`
- `vocab.json`
- `questions.json`
- `activities.json`
- the folder name under `content/stories/<slug>/`

### What must match

| Field | Where it appears | Rule |
|---|---|---|
| `slug` | all files | Must match exactly everywhere. This is the join key. |
| `title.en` | `library.json`, `story.json` | Should match exactly. |
| `title.simp` | `library.json`, `story.json` | Should match exactly. |
| `title.trad` | `library.json`, `story.json` | Should match exactly. |
| `ep` | `library.json` only | Episode number for ordering and display. |
| `released` | `library.json` only | Controls whether the story is visible or coming soon. |
| `readAlong.lines[].id` | `story.json` only | Must be unique and stable once published. Use `p001`, `p002`, etc. |
| `activities[].id` | `activities.json` only | Must be unique within that story and stable once published. |
| `vocab[].tier` | `vocab.json` only | Must be `"door"` or `"beyond"`. |
| `questions.open` / `questions.beyond` | `questions.json` only | Same conceptual tiers as vocab. |

### What should not be duplicated unnecessarily

Keep full story metadata in `library.json` only:

- `ep`
- `season`
- `released`
- `blurb`
- `ageRange`
- `runtime`
- `pub`
- `coverColor`
- `coverImage`
- `audio`
- `hasBundle`
- `part`
- `parts`

Keep the actual story text in `story.json` only.

---

## Shared Chinese reading rule

This applies to **all Chinese text that displays pinyin or zhuyin**, including:

- read-along lines
- vocab examples
- any future bilingual question prompts

The reading must be stored as a **space-separated syllable string** with **one syllable per Han character, in order**.

The frontend pairs each Han character with its matching syllable as a `<ruby>` annotation.

Rules:

- One Han character = one reading syllable.
- Punctuation does not consume a syllable.
- Spaces and punctuation in the Chinese text do not consume a syllable.
- Do not rely on code or fonts to guess readings.
- This is required so polyphonic characters are handled correctly.

Example:

```json
{
  "simp": {
    "text": "天空圆圆的。",
    "pinyin": "tiān kōng yuán yuán de."
  },
  "trad": {
    "text": "天空圓圓的。",
    "zhuyin": "ㄊㄧㄢ ㄎㄨㄥ ㄩㄢˊ ㄩㄢˊ ㄉㄜ˙。"
  }
}
```

---

## 1. `library.json` — catalog + per-story metadata

Organized by season. One entry per story. This is the **only** file the Library page reads.

```json
{
  "seasons": [
    {
      "season": 1,
      "title": "Season 1",
      "stories": [
        {
          "ep": 1,
          "slug": "frog-at-the-bottom-of-the-well",
          "released": true,
          "title": {
            "en": "The Frog at the Bottom of the Well",
            "simp": "井底之蛙",
            "trad": "井底之蛙"
          },
          "blurb": "A little frog who is sure his well is the whole world — until a sea turtle who has seen the ocean comes to rest by the rim.",
          "ageRange": "4–8",
          "runtime": "12 min",
          "pub": "2026-06-10",
          "coverColor": "#5C8358",
          "coverImage": "assets/img/covers/frog-at-the-bottom-of-the-well-square.png",
          "coverImageLandscape": "assets/img/covers/frog-at-the-bottom-of-the-well-landscape.png",
          "audio": {
            "en": {
              "spotify": "#",
              "youtube": "#",
              "apple": "#"
            },
            "zh": {
              "spotify": "#",
              "youtube": "#",
              "apple": "#"
            }
          },
          "hasBundle": true
        }
      ]
    }
  ]
}
```

### Required fields

- `seasons[]`
- `season`
- `stories[]`
- `ep`
- `slug`
- `released`
- `title.en`
- `title.simp`
- `title.trad`
- `coverColor`

### Recommended fields

- `title` at the season level, such as `"Season 1"`
- `blurb`
- `ageRange`
- `runtime`
- `pub`
- `coverImage`
- `coverImageLandscape`
- `audio.en`
- `audio.zh`
- `hasBundle`

### Optional fields for multi-part stories

Use these only when a story spans multiple episodes:

```json
{
  "part": 1,
  "parts": 2
}
```

---

## 2. `story.json` — Read Along

This file contains the bilingual story script.

```json
{
  "slug": "frog-at-the-bottom-of-the-well",
  "title": {
    "en": "The Frog at the Bottom of the Well",
    "simp": "井底之蛙",
    "trad": "井底之蛙"
  },
  "readAlong": {
    "lines": [
      {
        "id": "p001",
        "simp": {
          "text": "很久以前，在一座安静的小山脚下。",
          "pinyin": "hěn jiǔ yǐ qián, zài yí zuò ān jìng de xiǎo shān jiǎo xià."
        },
        "trad": {
          "text": "很久以前，在一座安靜的小山腳下。",
          "zhuyin": "ㄏㄣˇ ㄐㄧㄡˇ ㄧˇ ㄑㄧㄢˊ，ㄗㄞˋ ㄧˊ ㄗㄨㄛˋ ㄢ ㄐㄧㄥˋ ㄉㄜ˙ ㄒㄧㄠˇ ㄕㄢ ㄐㄧㄠˇ ㄒㄧㄚˋ。"
        },
        "en": "A long time ago, at the foot of a quiet little mountain."
      }
    ]
  }
}
```

### Required fields

- `slug`
- `title.en`
- `title.simp`
- `title.trad`
- `readAlong.lines[]`
- `readAlong.lines[].id`
- `readAlong.lines[].simp.text`
- `readAlong.lines[].simp.pinyin`
- `readAlong.lines[].trad.text`
- `readAlong.lines[].trad.zhuyin`
- `readAlong.lines[].en`

### ID rules

Use sequential paragraph IDs:

```txt
p001
p002
p003
...
```

Once a story is published, do not change existing IDs unless absolutely necessary. If you add a new line later, add a new ID.

---

## 3. `vocab.json` — New Words

Each card carries pinyin + zhuyin for the headword and pinyin + zhuyin for the example sentence.

```json
{
  "slug": "frog-at-the-bottom-of-the-well",
  "vocab": [
    {
      "tier": "door",
      "simp": "青蛙",
      "trad": "青蛙",
      "pinyin": "qīng wā",
      "zhuyin": "ㄑㄧㄥ ㄨㄚ",
      "en": "frog",
      "example": {
        "simp": {
          "text": "他是一只小青蛙。",
          "pinyin": "tā shì yì zhī xiǎo qīng wā."
        },
        "trad": {
          "text": "他是一隻小青蛙。",
          "zhuyin": "ㄊㄚ ㄕˋ ㄧˋ ㄓ ㄒㄧㄠˇ ㄑㄧㄥ ㄨㄚ。"
        },
        "en": "He is a little frog."
      }
    }
  ]
}
```

### Required fields

- `slug`
- `vocab[]`
- `vocab[].tier`
- `vocab[].simp`
- `vocab[].trad`
- `vocab[].pinyin`
- `vocab[].zhuyin`
- `vocab[].en`
- `vocab[].example.simp.text`
- `vocab[].example.simp.pinyin`
- `vocab[].example.trad.text`
- `vocab[].example.trad.zhuyin`
- `vocab[].example.en`

### Allowed `tier` values

Use only:

```txt
door
beyond
```

Meaning:

- `door` = core words / Open the Door
- `beyond` = stretch words / Go Beyond

### Toggle behavior

- **Simplified** → headword shows `simp`; example shows `example.simp.text` with pinyin ruby.
- **Traditional** → headword shows `trad`; example shows `example.trad.text` with zhuyin ruby.
- **Compare** → shows simplified and traditional side by side, with English beneath.

---

## 4. `questions.json` — Curious Questions

Two tiers, currently English-only.

```json
{
  "slug": "frog-at-the-bottom-of-the-well",
  "open": [
    {
      "en": "What does Gua Gua think the sky looks like? Why does he think that?"
    }
  ],
  "beyond": [
    {
      "en": "Have you ever discovered something was bigger than you first thought? What was it?"
    }
  ]
}
```

### Required fields

- `slug`
- `open[]`
- `beyond[]`
- `open[].en`
- `beyond[].en`

### Tier meanings

- `open` = easier comprehension questions / Open the Door
- `beyond` = deeper reflection questions / Go Beyond

### Optional bilingual extension

Only use this if the site later supports Chinese question prompts.

```json
{
  "simp": {
    "text": "呱呱觉得天空是什么样子的？",
    "pinyin": "guā guā jué de tiān kōng shì shén me yàng zi de?"
  },
  "trad": {
    "text": "呱呱覺得天空是什麼樣子的？",
    "zhuyin": "ㄍㄨㄚ ㄍㄨㄚ ㄐㄩㄝˊ ㄉㄜ˙ ㄊㄧㄢ ㄎㄨㄥ ㄕˋ ㄕㄣˊ ㄇㄜ˙ ㄧㄤˋ ㄗ˙ ㄉㄜ˙？"
  },
  "en": "What does Gua Gua think the sky looks like?"
}
```

Do not use this shape unless the frontend is ready for it.

---

## 5. `activities.json` — Culture Corner

```json
{
  "slug": "frog-at-the-bottom-of-the-well",
  "activities": [
    {
      "id": "well-window",
      "title": "My Well Window",
      "desc": "Cut a circle from paper and draw what you can see through your own well window — then draw what is outside the circle too.",
      "time": "15 min",
      "accent": "#5C8358",
      "steps": [
        "Fold a paper plate in half.",
        "Cut a circle in the middle.",
        "Draw the well view inside, the wide world outside."
      ],
      "materials": [
        "paper plate",
        "crayons",
        "scissors"
      ]
    }
  ]
}
```

### Required fields

- `slug`
- `activities[]`
- `activities[].id`
- `activities[].title`
- `activities[].desc`
- `activities[].time`
- `activities[].accent`

### Optional fields

- `activities[].steps[]`
- `activities[].materials[]`

### ID rules

Use short kebab-case IDs:

```txt
well-window
ocean-map
star-count
```

Do not change an activity ID after publishing unless you are okay with breaking anchors, saved links, or future references.

---

## Publishing checklist per story

Before a story is considered ready to publish, confirm all of these exist:

- `library.json` entry with matching `slug`
- `content/stories/<slug>/story.json`
- `content/stories/<slug>/vocab.json`
- `content/stories/<slug>/questions.json`
- `content/stories/<slug>/activities.json`
- `title.en`, `title.simp`, and `title.trad` match between `library.json` and `story.json`
- every read-along line has a stable `id`
- every activity has a stable `id`
- all JSON files validate
- all Chinese text that displays pinyin/zhuyin has exact readings
- `released` is set correctly in `library.json`

---

## One-file alternative

The recommended approach is separate files because the Library page can load one small catalog file, and each story page can lazy-load only the files it needs.

If you would rather ship one file per story, use the same field shapes nested under top-level keys:

```json
{
  "meta": {},
  "readAlong": {},
  "vocab": [],
  "questions": {},
  "activities": []
}
```

Do not mix the one-file approach and the separate-file approach for the same production site unless the frontend explicitly supports both.
