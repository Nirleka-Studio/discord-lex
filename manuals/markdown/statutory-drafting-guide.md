# Statutory Drafting Guide
*This is a rendition of the SR Style Guide manual, cutting some SR-specific styles, for a more general guide.*

Hello. You are either an actual lawyer / legal drafter (wtf are you doing), or you are some person who is interested in statutory / legal drafting. This guide will show you how to do that effectively using modern standards.

---

## Principles
Legal drafting must be:
1. Concise;
2. Understandable and clear of ambiguities; and
3. Easily understandable to an average Joe.

---

## Verbs

### "Shall"
Do not use the word "shall". This word is ambiguous in legal drafting because courts have interpreted it to mean "must," "may," "will," or "should" and has caused enough conundrums.

Avoid "can" also because of its ambiguities to mean permission or have the physical or technical ability. Use more precise wording.
Instead of:
> "If a person can not pay the penalty..."

Use:

> "If a person is not able to pay the penalty..."

or better:

> "If a person is unable to pay the penalty..."

### Modal verbs

#### May
"May" for discretionary things.
> "`X` ***may*** be used to..."

This means that you are permitted to use `X`, but it is not mandatory.

#### Must
"must" for something that is mandatory.

Required:
> "The Administrator ***must*** log moderation actions..."

Prohibition:
> "An Administrator ***must not*** tamper with moderation logs..."

Most of the time, using "must not" is the preferred way for prohibitions instead of "is prohibited from" or "is not permitted to."

#### Simple "to be" verbs
Simple "to be" verbs for declarative. It may be used to define something, state a fact, conditions and qualifications, and rights.

> "An Administrator is a member of Administration, and..."

> "A member is entitled to..."

---

## Comma Conundrums (The Oxford Comma & Modifying Clauses)
Commas can alter the entire meaning of a sentence.

* **The Oxford Comma:** Omitting an Oxford comma in a statutory list creates massive ambiguity over whether the last two items are grouped together or separate.
* **The "Limiting Clause" Trap:** Consider the sentence: *"Servants, administrators, and guests who carry weapons must register."* Does *"who carry weapons"* apply to all three groups, or *only* to the guests? The placement of a single comma determines if an unarmed administrator has to register or not.

---

## Sentence Ambiguities
This is where drafters fall into traps like **And vs. Or** and **Modifying Phrases**:

* **"And/Or":** Professional drafters hate "and/or" because it is a lazy crutch. isa undoubtedly advocates for breaking it down into explicit sub-clauses (`a. X; or b. Y; or c. both X and Y`).
* **Pronoun Traps:** Using "they", "it", or "their" when multiple nouns are present, creating ambiguity over who or what the law is actually referring to.

---

## 3. Formulaic Sentence Structure for Penalties

In penal law, penalty clauses must strictly follow a predictable mathematical formula so judges/mods can't invent arbitrary punishments.

A standard penal formula looks like:

> **[If Person X] + [commits Act Y] + [with Circumstances Z], → [They are punished by W].**

By standardizing this formula, every single infraction across the entire code reads with identical logic and structure.

---

## 4. Capitalization (Defined Terms vs. General Language)

In statutory drafting, capitalization is a legal mechanism, not just capitalization for emphasis:

* **"administrator"** (lowercase) = Anyone who happens to be performing an administrative task.
* **"Administrator"** (capitalized) = A specific role defined under Chapter 2 of SR 101 with explicit statutory powers and duties.

isa’s guide undoubtedly warns against random "German-style" capitalization of important-sounding words, restricting capital letters strictly to proper nouns and defined terms.

---

## 5. Items and Lists
Items and lists are common in legal drafting. Although some styles have different ways to format lists, the underlying rule remains the same.

* Using **semi-colons (`;`)** at the end of each bullet item rather than periods.
* Placing an explicit **`and`** or **`or`** on the second-to-last item to establish whether the list is cumulative (all required) or disjunctive (only one required).

## Voices

### Active voice and subject placement
Legislation must clearly identify who holds the power, duty, or prohibition. Passive voice hides the actor and creates severe enforcement loopholes.

Avoid (Passive):

> "Notice must be sent to the affected party within 14 days." (By whom? The court? The applicant? The clerk?)

Use (Active):

> "The Registrar must send notice to the affected party within 14 days."

### Substantive law
Substantive law, such as criminal codes, defines rights, duties, and obligations. These typically uses passive voice as using active will be absurd and repetitive.

### Actor-Verb Proximity

Keep the subject and its primary verb as close together as possible. Placing long conditional clauses between the subject and the verb makes sentences unreadable.

Avoid:

> "An Administrator, unless acting under the express direction of the Board during an emergency declared under Section 12, must not alter the logs."

Use:

> "An Administrator must not alter the logs, unless acting under the express direction of the Board during an emergency declared under Section 12."

---

## Definitions Section

Definitions establish precision, shorten subsequent sections, and eliminate repetitive phrasing.
Rules for Defining Terms

Never embed substantive rules in a definition:

Avoid:
> "Vehicle" means any motorised conveyance, and all vehicles must be inspected annually.

Use:
Define "Vehicle" in the definitions section; place the inspection requirement in its own operational section.

Use "means" vs. "includes":

means = Exhaustive definition (it is only these things).

includes = Partial list / illustrative examples (it includes these things, but is not limited to them). Never use the redundant phrase "includes, but is not limited to,".

Do not define everyday words unless you are restricting or altering their ordinary meaning.

### Where to define words
You may define terms in their own Articles or in a separate "Definitions" section depending on what you are trying to do.

```text
Art. 15 Demotion
A demotion consists of stripping the Administrator of their current tier or rank and assigning them to a lower subordinate role within the Administration hierarchy.
```

```text
Art. 4 Definitions
In this Act:
    a. *media* means any content or visual/auditory that can be perceived, accessed, or viewed by another member, including but not limited to:
        1. messages;
        2. embeds; and
        3. other attachments.
```

---

## Classifying laws
There are many different ways to classify laws.

### The chronological way
By far the most common... for some reason. Laws are written like: `Law No. [Law number] / [Year]`

> Law No. 92/1982

This is great to know when a law was passed but does not tell you when a law is about.

### Dewey Decimal-style

## Hierarchy
Hierarchy vary by style. Our Server law hierarchies are based on Swiss federal laws hierarchies.

### Swiss-style

```text
Act / Code
└── Title
    └── Chapter
        └── Section
            └── Article (main unit)
                ├── Paragraph (1)
                │   ├── Subparagraph / Item (a, b, c...)
                │   │   └── List (1, 2, 3...)
```

```text
SR 310 Penal Code
└── Chapter 1: General Provisions
    └── Section 1: Principles and Definitions
        └── Article 4: Definitions
            ├── In this Code:
            │   ├── a. *to depict* means:
            │   │   └── 1. to...
```

### Notes:

- Articles do not need another paragraph if it is simple enough and can just straight to items.
- Dividers like Titles, Chapters, Sections, etc. can be omitted if an Act / Code is simple enough. Though it must be applied consistently from the top. For example a Chapter may contain 4 Articles without a Section. That is fine. But if you use a Section without being under a Chapter but a Chapter also exists in the same law, Put those Sections under Chapters too.

### Interpretation
Note that the titles of Titles, Chapters, and Articles are not legally binding. Only the provisions of an Article are.

