---
manual_name: "Style Guide for Writing Nirleka Studios SR Laws"
---

# Style Guide for Writing Nirleka Studios SR Laws

### Art. 1 Language
Spelling must follow the standards of British English.

### Art. 2 Capitalisation
<sup>1</sup> Document titles, Titles, and Sections titles are written in Title Case. Example: `#### Art. 9 Bribery`, `#### Art. 10 Administrative discretion`

<sup>2</sup> Articles, body and title text within an article is written in normal sentence case. Only proper nouns and the start of a sentence are capitalised. Example: `An Administrator shall not use their powers for personal gain.`

<sup>3</sup> "Server", if reffering to the Nirleka Studios Discord server, is capitalised.

### Art. 3 Structural hierarchy and nesting
<sup>1</sup> A law is structured, at most, in four levels: Title → Chapter → Section → Article.

<sup>2</sup> A level may be omitted entirely if the law is short enough not to need it, but omitted levels must be skipped consistently across the whole document.

<sup>3</sup>
```markdown
# SR XXX – DOLOR SIT AMET

## Chapter 1: Lorem Ipsum

### Art 1: Dolor sit amet

### Art 2: Consectetur adipiscing

## Chapter 2: Sed Do Eiusmod

### Section 1: Tempor Incididunt

#### Art 3: Ut labore et dolore

#### Art 4: Magna aliqua

## Section 2: Ut Enim ad Minim

#### Art 5: Veniam quis nostrud

#### Art 6: Exercitation ullamco
```

### Art. 4 Paragraphs and sub-numbering
<sup>1</sup> An Article with a single unbroken provision carries no paragraph marker.

<sup>2</sup> An Article with more than one distinct provision is split into paragraphs, marked with a superscript numeral immediately after the Article title or at the start of the line: `<sup>1</sup>`, `<sup>2</sup>`.

<sup>3</sup> A paragraph that lists sub-items uses lower-case letters (`a.`, `b.`, `c.`), consistent with the same convention used for punishment scales.

### Art. 5 Lists and logical connectors
<sup>1</sup> A lettered list is either cumulative (all items apply) or alternative (any one item applies), never both.

<sup>2</sup> A cumulative list places `and` before the final item; an alternative list places `or` before the final item. This word is omitted if the introductory sentence already makes the relationship unambiguous.

### Art. 6 Cross-references
<sup>1</sup> A reference to another law cites the short title followed by its SR number in parentheses on first use: `the Public Code (SR 210)`.

<sup>2</sup> A reference to a specific provision within another law is cited as `Art. X of the [Short Title] (SR NNN)`. Subsequent references in the same Article may omit the SR number.

<sup>3</sup> A reference within the same document to another Article never restates the document's own title or SR number.

### Art. 7 Definitions
<sup>1</sup> A term defined in an Article titled "Definitions" is written in italics at first mention within that Article, followed by "means" and its definition.

<sup>2</sup> A defined term is not re-italicised elsewhere in the document.

<sup>3</sup>
```markdown
#### Art 4 Definitions
In this Act:\
a. *touch grass* means going outdoors, at roughly 500 meters away from home.

b. *Administrator* means any members of Administration and their appointed staff.

c. *processor* means a private person or federal body that processes personal data on behalf of the controller.

```

### Art. 8 Punishment scales
<sup>1</sup> A punishment scale is written as an escalating lettered list, one offence tier per item, ordered from least to most severe.

<sup>2</sup> Where relevant, "removal from position" is always the terminal tier of a punishment scale for Administration-level offences.

### ~~Art. 9 Registers~~ (repealed)
<sup>1</sup> Anything related to the Administration and its procedures must use the High Formal register. This includes but not limited to using "shall" instead of "must" or other words. The Nirleka franc uses the `₣` character (`100₣`) instead of `*** F R A N C S ***`.

<sup>2</sup> Anything that is intended to be public facing uses the Natural Formal register. This includes the Public Code (SR 210), favour "must" instead of "shall", reduce legal jargon, short but precise, while also maintaining a rigid and distant feeling.

<sup>3</sup> Anything else that is about the server's culture, philosophies or non-serious procedures, use the Semi-Formal register.\
a. For statutes, precision of the High Formal register is still required. But passive-aggression is permitted.\
b. For non-primary parts of a statute, such as preambles, the Soupurreme register is used. Which permits the use of:
1. Passive-aggression;
2. Profanities;
3. Intentional awkward grammar;
4. Exclamation marks.

but NOT:
1. Contractions ("don't" instead of "do not")
2. Non-deliberate misspellings.

### Art. 10 Verbs and precision
<sup>1</sup> Follow the standards of UK statutes drafting styles.

<sup>2</sup> Newer laws must not use `shall` any more.

<sup>3</sup> Use the following words as they are intended:
a. *must* absolute requirement / prohibition.
b. *may* discretionary.
c. *can* do not use this at all. Use more precise words, for example 'unable to'.

### Art. 11 Insertions
<sup>1</sup> Avoid renumbering articles and its structures when inserting between existing provisions unless during a complete revision.

<sup>2</sup> Inserting a new provision at the end can be made normally. For example inserting Article 3:
```markdown
## Art. 1 Lorem ipsum

## Art. 2 Lorem polum

## Art. 3 Kaplow
```

<sup>3</sup> For inserting provisions between existing provisions, add the letter `a` next to the number before it and continue the alphabet sequentially.
```markdown
## Art. 1 Lorem ipsum

## Art. 2 Lorem polum

## Art. 2a Loram polumu

## Art. 3 Kaplow
```

this applies to other provisions such as paragraphs:

```markdown
<sup>1</sup> Lorem ipsum

<sup>1a</sup> Lorrry

<sup>1b</sup> Lorrry palem

<sup>2</sup> Loram polum
```

<sup>3</sup> If you somehow reached `z`, do not continue. Whatever the hell you are doing, it is best to revise it.

### Art. 12 Numbers
State numbers plainly using Arabic numerals. "5 minutes", "5-minute timeout".

### Art. 13 Terms convention
<sup>1</sup> "Law" should always refer to Server laws unless otherwise specified.

<sup>2</sup> "Illegal" is strictly used for real-world laws.

<sup>3</sup> "Lawful" / "Unlawful" should always refer to Server laws.

<sup>4</sup> A "Code" is an Act that holds a collection of rules while an "Act" is a single law that manages a roughly single topic.

### Art. 14 Subject–verb agreement
<sup>1</sup> Before finalising a sentence, identify the head noun of the subject — the single noun that actually governs the verb — and ignore any words between it and the verb.

<sup>2</sup> A verb agrees with its head noun, not with the nearest noun preceding it.

Example — wrong: `Punishable actions includes doxxing.`
Example — right: `Punishable actions include doxxing.` (head noun *actions* is plural)

<sup>3</sup> A subject introduced by a lettered list is treated as its head noun, not as the list items. `The Administration Codes and its subsequent laws apply to...` (head nouns *Codes* and *laws*, both plural → *apply*, not *applies*).

<sup>4</sup> `who`, `that`, and `which` inherit the number of the noun they modify, not the number of the clause they sit in.

Example — wrong: `Administrators who holds positions...`
Example — right: `Administrators who hold positions...`

### Art. 15 Vesting of power
<sup>1</sup> A provision assigning a power, authority, or duty to a Role must use one of the following forms only:
a. `[Role] has the power to [X]`;
b. `[Role] has the authority to [X]`; or
c. `The power to [X] rests exclusively with [Role]`.

<sup>2</sup> The following forms are prohibited when vesting power, as they do not parse correctly in English:
a. `The power to [X] shall be [Role]`;
b. `[X] rests to [Role]`.

<sup>3</sup> Where a power is genuinely joint between two roles, both roles must be named with `and`, and the sentence must use a plural verb. Where a power belongs to either role individually, the roles must be joined with `or`, and the sentence must use a singular verb. A provision must not use `and` where `or` is meant, or vice versa.

Example: `The Head Administrator or the Director may appoint a worker.` (either, individually)
Example: `The Head Administrator and the Director jointly hold the power to dissolve the Executive.` (both, together)

### Art. 16 Prohibited collocations
<sup>1</sup> The following phrasings must not be used. The listed alternative must be used instead.

| Prohibited                       | Required                           |
|----------------------------------|------------------------------------|
| `in accordance to`               | `in accordance with`               |
| `rests to [Role]`                | `rests with [Role]`                |
| `includes but not limited to`    | `includes, but is not limited to,` |
| `includes but not is limited to` | `includes, but is not limited to,` |

<sup>2</sup> Art. 7 (Definitions) is amended: every use of the phrase in paragraph 1 must be written identically, word-for-word, every time it appears. No variant spelling or word order is permitted.

### Art. 17 Punishment scale wording
<sup>1</sup> A punishment scale must open with the fixed lead-in `incurs:`, never `is punishable by`, `results in`, or other variants, unless the surrounding sentence structure makes `incurs` ungrammatical.

<sup>2</sup> Each tier must follow the fixed template `[penalty] on the [ordinal] offence`. Ordinals below eleventh are spelled out (`first`, `second`... `tenth`), never numeralised.

<sup>3</sup> Tiers are separated by semicolons; the final tier is preceded by `and`; the scale ends with a full stop.

<sup>4</sup> A punishment scale for a member-level offence must end with either `a kick` or `a ban` as its terminal tier. A punishment scale for an Administration-level offence must end with `removal from position`, per Art. 8(2).

### Art. 18 Duration expressions
<sup>1</sup> A number-plus-unit expression is hyphenated only when it directly precedes and modifies a noun (used as a compound adjective).

Example — hyphenated: `a 48-hour timeout`.
Example — not hyphenated: `within 48 hours`, `the last 90 days`.

<sup>2</sup> The same expression must not be hyphenated in one place and unhyphenated in another within the same document unless Art. 18(1) requires the difference.

### Art. 19 Collective nouns
<sup>1</sup> The following nouns are treated as grammatically singular in all Server law: `Administration`, `Executive Branch`, `Judiciary Branch`.

<sup>2</sup> The following are treated as grammatically plural: `the People`, `members`, `Administrators` (as a class).

<sup>3</sup> `majority` and `quorum` are treated as singular when referring to the threshold itself (`a majority is required`) and plural when referring to the voters who compose it (`a majority are in favour`). A drafter must choose the correct sense deliberately, not interchangeably.

### Art. 20 Parallel structure
<sup>1</sup> Where two or more actions share a single auxiliary or modal verb (`did`, `must`, `may`, `shall not`), every verb governed by that auxiliary must take the same grammatical form.

Example — wrong: `did not send a message or done an interaction`.
Example — right: `did not send a message or perform an interaction`.

<sup>2</sup> A lettered list introduced by `to both [X], [Y]` is prohibited unless X and Y are grammatically identical in form (both infinitive verbs, or both participles). Where they are not, the list must be split into two separate lettered items instead of forced into one sentence.

### Art. 21 Pre-enactment review
<sup>1</sup> Before enactment, a draft must be read once specifically for subject–verb agreement and once for the vesting-of-power constructions in Art. 15, independent of any content or policy review.

<sup>2</sup> A drafter must not rely on the passive drafting pass alone; grammar review is a distinct step.