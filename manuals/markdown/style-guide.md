---
manual_name: "Style Guide for Writing Nirleka Studios SR Laws"
---

# Style Guide for Writing Nirleka Studios SR Laws

### Art. 1 Language
Spelling must follow the standards of British English.

### Art. 2 Capitalisation
<sup>1</sup> Document titles, Titles, Sections, and Article titles are written in Title Case. Example: `#### Art. 9 Bribery`.

<sup>2</sup> Body and title text within an article is written in normal sentence case. Only proper nouns and the start of a sentence are capitalised. Example: `An Administrator shall not use their powers for personal gain.`

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