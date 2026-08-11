# Legislative Drafting Guide: Nirleka Systematic Collection (*SR*)

Hello, if you are reading this you are either a nerd or an appointed legislator. This guide will you how laws should be written and structured within our SR system.

## But What is "SR"?

_SR_ stands for "Systematische Rechtssammlung" (Systematic Collection of Federal Law) which is the name of Switzerland's official government codification system.

Why use it? Because it is already being used for a long time and it is practical. Do not ask any more questions.

---

## 1. Systematic Classification & File Naming

All files and regulations must be inside the `sr/` directory, categorized by their broad legal domain using the systematic numbering scheme.

```text
sr/
├── 1-constitutional/
│   └── 100-server-charter.md        # Supreme Law & Rights
├── 2-civil-and-public/
│   └── 210-public-code.md           # Member Conduct & Data Privacy
├── 3-penal/
│   └── 310-penal-code.md            # General Offenses & Penalties
│   └── 320-media-regulations.md     # Specialized Media/NSFW Rules
└── 4-administration/
    └── 410-admin-codes.md           # Laws governing staff
```

### File Naming Convention

Every file name must follow the pattern: `{SR_NUMBER}-{slugified-title}.md`

* *Correct:* `210-public-code.md`
* *Incorrect:* `public_code_v2.md` or `SR210.md`

---

## 2. Mandatory YAML Frontmatter & Title Header

Every `.md` file must begin with exact machine-readable metadata at line 1, followed by a formal title block.

```markdown
---
sr_id: "SR 210"
title: "Public Code of Member Conduct"
abbreviation: "Public Code"
version: "1.0.0"
category: "Civil and Public Law"
enacted_date: "2026-08-11"
last_amended: "2026-08-11"
authority: "The Director"
---

# SR 210 — Public Code of Member Conduct
*(Public Code)*

> **Enactment Notice:** Enacted in accordance to Title 4 of the Server Charter (SR 100). Applies to all server members and administrative staff.

---

```

---

## 3. Article Structure & Superscript Formatting

To maintain compatibility across Markdown renderers and ensure clean Git line-diffs, adhere to the 3-tier hierarchy:

```text
Title -> Section -> Article -> Paragraph -> Sub-clause
```

### Strict Formatting Rules

1. **Articles:** Named using Markdown `#### Art. [Number] [Title]`.
2. **Paragraphs:** Numbered using HTML superscripts (`<sup>1</sup>`, `<sup>2</sup>`, `<sup>3</sup>`).
3. **Sub-clauses:** Lettered (`a.`, `b.`, `c.`) and indented under their parent paragraph.
4. **Line Breaks:** Place a blank line between every individual paragraph. **Never** write continuous multi-sentence paragraphs on a single line.

### Structure Example

```markdown
## Title 2: Community Standards

### Section 1: Communications

#### Art. 4 Chat Conduct
<sup>1</sup> Members shall maintain a respectful environment when communicating in public channels.

<sup>2</sup> A violation of paragraph 1 includes, but not limited to:
a. persistent disruptive pinging;
b. derailment of channel topics defined in channel descriptions; and
c. excessive use of profanities.

<sup>3</sup> Offenses under paragraph 2 shall be penalized under Article 12 of the Penal Code (SR 310).

```

---

## 4. Legal Language & Modal Verbs

Legal precision depends on using exact modal verbs. Do not use conversational or subjective terms.

| Word            | Legal Meaning                            | Example                                                               |
|-----------------|------------------------------------------|-----------------------------------------------------------------------|
| **`shall`**     | Mandatory requirement / Obligation       | *"An Administrator **shall** state the reason for message deletion."* |
| **`shall not`** | Absolute prohibition                     | *"Members **shall not** distribute malicious links."*                 |
| **`may`**       | Discretionary power / Optional authority | *"The Secretary **may** review moderation appeals."*                  |
| **`is / are`**  | Declaratory state of law                 | *"The burden of proof **rests** on the enforcing authority."*         |

### Words to Avoid

* ❌ **`should`** (Sounds like advice, not a legally binding command).
* ❌ **`must`** (Use `shall` instead for formal statutory drafting).
* ❌ **`can`** (Refers to physical ability rather than legal authority; use `may`).

---

## 5. Separating Prohibition from Sanction

Never combine the definition of an offense and its punishment into a single sentence. Keep them structurally independent.

* ❌ **Bad (Combined):**
> *"If you spam, admins will time you out for 2 hours unless it's a second offense."*


* ✅ **Good (Separated):**\
> **In SR 210 (Public Code - Prohibition):**\
> `#### Art. 6 Spamming`\
> `<sup>1</sup> Members shall not flood text or voice channels with repetitive, automated, or disruptive messages.`\
> **In SR 310 (Penal Code - Sanction):**\
> `#### Art. 14 Penalties for Spamming`\
> `<sup>1</sup> A violation of Article 6 of the Public Code (SR 210) shall result in:`\
> `a. a 2-hour timeout for a first offense;`\
> `b. a 24-hour timeout for a second offense; and`\
> `c. a permanent ban for subsequent offenses.`

or, you may write the definition and punishment separately in the same Article:

> **In SR 410 (Administration Codes):**\
> `#### Art. 5 Negligence`\
> `<sup>1</sup> If an Administrator is well aware an offense is happening and actively ignores it, they shall receive:`\
> `a. a warning for a first offense;`\
> `b. a 48-hour timeout for a second offense; and`\
> `c. removal from position for subsequent offenses.`

---

## 6. Cross-Referencing Standards

When referencing another provision within the same code or in a different code, use standardized legal abbreviations so human moderators and automated bots can trace the reference:

* **To an entire Article in the same code:** `"pursuant to Article 6"`
* **To a specific Paragraph in the same code:** `"under Article 6 paragraph 2"`
* **To a sub-item in the same code:** `"Article 6 paragraph 2 sub-clause a"`
* **To another Code:** `"under Article 12 of the Penal Code (SR 310)"`

---

## 7. Versioning & Git Commit Conventions

Whenever a legislative document is amended, update its YAML frontmatter metadata and follow the Semantic Versioning rules:

* **Major Version (`X.0.0`):** Complete revision or restructuring where Article numbers change.
* **Minor Version (`0.X.0`):** Addition, deletion, or substantial rewriting of individual Articles.
* **Patch Version (`0.0.X`):** Typographical fixes, formatting updates, or minor grammatical adjustments.

### Git Commit Format

When committing a law change to Git, format the commit message so the Discord Webhook generates a clear notification:

```bash
git commit -m "amend(SR 310 Art. 14): double timeout duration for repeat spam offenses"
```

### Commit prefixes

| Prefix             | Description                                       |
|--------------------|---------------------------------------------------|
| `feat(...): ...`   | A brand new law has been passed.                  |
| `amend(...): ...`  | Modification to an existing law.                  |
| `repeal(...): ...` | Deleting a law or provision.                      |
| `insert(...): ...` | Inserting new article(s) into an existing law.    |
| `fix(...): ...`    | Minor patch, such as grammar or cross-references. |

---

## 8. Inserting New Articles

When a new law or rule needs to be added between existing articles, **do not renumber the entire document**.
Renumbering existing articles breaks internal cross-references across other codes, invalidates historical moderation logs, and corrupts git history.

Instead, use the **Decimal Insertion System**.

### Rules for Decimal Insertion

1. **Adding an Article Between Existing Articles:**
   If you need to insert a new rule between `Art. 11` and `Art. 12`, name the new article **`Art. 11a`**.
* *First insertion:* `Art. 11a`
* *Second insertion:* `Art. 11b`

2. **Sub-insertions (Adding between decimal articles):**
   If you need to insert a rule between `Art. 11a` and `Art. 11b`, use numbers after the letter:
* `Art. 11a.1`, `Art. 11a.2`


3. **Repealed Articles (Deleting an Article):**
   If an article is abolished or repealed, **keep the heading and article number**, but replace the content with `[Repealed]` or `[Abrogated]`. This prevents subsequent articles from shifting.

---

### Example: Inserting a New Rule Without Renumbering

#### Before Insertion:

```markdown
#### Art. 11 Election of Administrators
<sup>1</sup> Elections shall occur every six weeks.

#### Art. 12 Removal of Administrators
<sup>1</sup> Administrators may be removed by impeachment.
```

#### After Inserting a "Caretaker" Rule (Correct):

```markdown
#### Art. 11 Election of Administrators
<sup>1</sup> Elections shall occur every six weeks.

#### Art. 11a Caretaker Governance During Elections
<sup>1</sup> During active election periods, outgoing administrators shall retain only essential safety permissions.

<sup>2</sup> The Secretary shall supervise all caretaker activities.

#### Art. 12 Removal of Administrators
<sup>1</sup> Administrators may be removed by impeachment.
```

#### Repeal Example (Correct):

```markdown
#### Art. 13 [Repealed]
*(Repealed on 2026-08-11 pursuant to Referendum No. 4; transferred to SR 100 Art. 14)*
```

---