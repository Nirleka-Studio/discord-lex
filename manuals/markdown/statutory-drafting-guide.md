# Statutory Drafting Guide
*This is a rendition of the SR Style Guide manual, cutting some SR-specific styles, for a more general guide.*

Hello. You are either an actual lawyer / legal drafter (wtf are you doing), or you are some person who is interested in statutory / legal drafting. This guide will show you how to do that effectively using modern standards.

---

## Principles
Legal drafting must be:
1. Concise;
2. Understandable and clear of structural ambiguities; and
3. Easily understandable to an average Joe.

---

## Verbs & Modals

### The "Shall" Trap
**Do not use "shall."** Never. "Shall" is a legal cancer because courts have spent centuries interpreting it to mean "must," "may," "will," or "should." It creates instant ambiguity.

Avoid **"can"** as well. It confuses actual legal permission with physical or technical ability. Use more precise wording.

* Avoid:
> "If a person can not pay the penalty..."

* Acceptable:
> "If a person is not able to pay the penalty..."

* Best:
> "If a person is unable to pay the penalty..."

### Modal Verbs

#### May (Discretionary)
Use **"may"** strictly for actions that are permitted, but optional.

> "`X` **may** be used to..." *(You have permission to use `X`, but not mandatory.)*

#### Must (Mandatory)
Use **"must"** for absolute requirements and prohibitions.

* Mandatory duty:
> "The Administrator **must** log moderation actions..."

* Prohibition:
> "An Administrator **must not** tamper with moderation logs."

*Note: Use "must not" for prohibitions rather than wordy phrases like "is prohibited from" or "is not permitted to".*

#### Simple "To Be" Verbs (Declarative)
Use simple present-tense "to be" verbs (`is`, `are`) to define terms, state simple facts, outline qualifications, or establish rights.

> "An Administrator **is** a member of Administration..."
> "A member **is** entitled to appeal a suspension..."

---

## Sentence Ambiguities & Formatting Traps

### Comma Conundrums
Commas are extremely important as they change the entire meaning of a sentence.

* **The Oxford Comma:** Always use it. Omitting the final comma in a statutory list creates immediate arguments over whether the last two items are grouped together or stand alone.
* **The Modifying Clause Trap:** Consider this disaster:
> *"Servants, administrators, and guests who carry weapons must register."*

Does *"who carry weapons"* apply to all three groups, or only to the guests? If an administrator is unarmed, do they still have to register?
* Fix it by re-ordering or punctuation: *"Guests who carry weapons, as well as all servants and administrators, must register."*

### Sentence Ambiguities
* **"And/Or":** "And/or" is lazy, sloppy, and hard to read. Break it down explicitly into structured sub-clauses:
> a. X;
> b. Y; or
> c. both X and Y.

* **Pronoun Traps:** Avoid vague pronouns like "they," "it," or "their" when multiple nouns exist in the same sentence. Re-state the defined term if necessary to ensure it is crystal clear who or what the law is talking about.

---

## Formulaic Sentence Structure for Penalties
In penal law or disciplinary codes, punishment clauses must follow a predictable, mathematical structure so judges or moderators can not pull arbitrary sentences out of thin air.

Standard Penal Formula:

> **[If Person X] + [commits Act Y] + [under Circumstances Z], → [They are subject to Penalty W].**

By standardising this, every infraction across your entire code reads with identical logic and zero guessing games.

---

## Capitalization Rules
Capitalization in a statute is a functional legal mechanism, and should not be a tool for random emphasis.

* **"administrator"** (lowercase) = Anyone who happens to be performing an administrative action.
* **"Administrator"** (capitalised) = A specific, formal role defined under the code with explicit statutory powers and duties.

Avoid German-style "important word" capitalisation. If a term isn't a proper noun or an explicitly defined term in your code, keep it lowercase.

---

## Items and Lists
Lists make complex conditions digestible, but they must follow strict syntax:

1. End every list item with a **semicolon (`;`)**.
2. Place an explicit **`and`** or **`or`** at the end of the second-to-last item to signal whether the list is cumulative (all required) or disjunctive (pick one).
3. End the final item with a **period (`.`)**.

Example:

> An applicant qualifies if they:
> 1. satisfy the residency requirement;
> 2. pass the background check; **and**
> 3. pay the processing fee.

---

## Voice and Structure

### Active Voice vs. Passive Voice
Legislation must state explicitly who holds the power or duty. Passive voice hides the actor and creates massive enforcement loopholes.

* **Instead of (Passive):**
> "Notice must be sent to the affected party within 14 days." *(Sent by whom? The court? The applicant? A carrier pigeon?)*

* **Use (Active):**
> "The Registrar must send notice to the affected party within 14 days."

*Exception:* Substantive penal definitions often use the passive voice to describe the criminal act itself (e.g., *"A person who steals..."*), but procedural commands must always be active.

### Actor-Verb Proximity
Keep the subject and its principal verb right next to each other. Burying the main verb under miles of conditional text makes sentences unreadable.

* **Instead of:**
> "An Administrator, unless acting under the express direction of the Board during an emergency declared under Section 12, must not alter the logs."

* **Use:**
> "An Administrator must not alter the logs, unless acting under the express direction of the Board during an emergency declared under Section 12."

---

## Definitions Section
Definitions set precision, shorten future clauses, and cut out repetitive phrasing.

### Rules for Definitions
1. **Never embed substantive rules inside a definition.**
* **Bad:** *"Vehicle" means any motorised conveyance, and all vehicles must be inspected annually.*
* **Good:** Define *"Vehicle"* in the Definitions section. Put the inspection command in its own operational clause.

2. **"Means" vs. "Includes":**
* **`means`** = Exhaustive (it is *only* these things).
* **`includes` / `including`** = Illustrative/Partial (it includes these, but can include others).
* *Writing "includes, but is not limited to" is considered redundant nowadays.*

3. **do not define ordinary words** unless you are deliberately shrinking or shifting their everyday meaning.

### Location of Definitions
You can define terms right where they occur (for narrow, single-topic articles) or centralise them in a dedicated Definitions section at the start of the code.

*Inline Example:*

> **Art. 15 Demotion**
> A demotion consists of stripping an Administrator of their current rank and assigning them to a subordinate role.

*Global Example:*

> **Art. 4 Definitions**
> In this Code:
>   a. **"media"** means any visual or auditory content made accessible to another member, including:
>       1. text messages;
>       2. embeds; and
>       3. file attachments.

---

## Classifying Laws
* **The Chronological Method:** `Law No. [Number] / [Year]` (e.g., *Law No. 92/1982*). Good for tracking when something passed, useless for knowing what it actually does.
* **Dewey Decimal / Codified Style:** Grouping laws systematically by topic and scope (e.g., *SR 310 Penal Code*). Far better for long-term administration.

---

## Structural Hierarchy
For complex codes, adopt a predictable structural hierarchy (such as the Swiss model):

```text
Act / Code
└── Title
    └── Chapter
        └── Section
            └── Article (Main operative unit)
                ├── Paragraph (1)
                │   ├── Subparagraph / Item (a, b, c)
                │   │   └── List (1, 2, 3)

```

Example:

```text
SR 310 Penal Code
└── Chapter 1: General Provisions
    └── Section 1: Principles and Definitions
        └── Article 4: Definitions
            └── In this Code:
                └── a. "to depict" means:
                    └── 1. to show, broadcast, or render...

```

### Hierarchy Rules:
* Simple Articles do not need subdivisions. Go straight to the point or to an itemised list if necessary.
* Organisational containers (Titles, Chapters, Sections) can be omitted for short, simple laws. Just stay consistent: do not toss random orphan Sections under a Code if everything else is organised into Chapters.

### Interpretation Standard
**Headings, Chapter titles, and Section names have no legal force.** They exist purely for organisation. Only the explicit provisions inside the Articles themselves constitute the law.