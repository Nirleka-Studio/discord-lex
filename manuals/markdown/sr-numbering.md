Here is the complete, official **SR Numbering & Filing Manual**. It is written as a clear, self-contained operational guide for staff, removing all obscure wiki rules and replacing them with standard Dewey-based principles tailored to your server's legal directory.

---

# SR System Codification Manual

**Systematische Rechtssammlung (Systematic Collection of Server Law)**

*Standard Operating Procedure for Staff & Legislative Clerks*

---

## 1. Overview & Core Mechanics

The **SR System** organizes all server statutes, codes, and ordinances by **subject matter** (taxonomy) using a base-10 decimal hierarchy.

### Why Subject-Based Filing?

1. **Predictability:** Related laws sit next to each other in the directory.
2. **Infinite Capacity:** Decimals allow unlimited new laws to be inserted between existing ones without renumbering old files or breaking citations.
3. **Decentralized Lookup:** Anyone who understands what a document is *about* can locate or classify it without needing a single chronological master log.

```
Chapter (100s)  ➜  Sub-chapter (10s)  ➜  Specific Act (1s)  .  Ordinances & Details (Decimals)
Example: SR 200  ➜  SR 210             ➜  SR 210            .  SR 210.9
        (Civil)     (Public Code)         (Base Act)           (Implementing Ordinance)

```

---

## 2. Directory Structure & Chapter Map

The root directory is divided into seven functional chapters:

| Chapter   | Scope & Content      | Key Topics Included                                                             |
|-----------|----------------------|---------------------------------------------------------------------------------|
| **`000`** | **Extraterritorial** | Inter-server treaties, external relations, cross-community agreements.          |
| **`100`** | **Constitutional**   | The Server Charter, referendum rules, fundamental rights, server structure.     |
| **`200`** | **Civil & Public**   | Public governance, member conduct, general community management.                |
| **`300`** | **Penal**            | Criminal code, offenses, moderation penalties, ban/mute frameworks.             |
| **`400`** | **Administration**   | Staff codes, administrative procedures, ticket handling, court proceedings.     |
| **`500`** | **Culture**          | Server events, cultural initiatives, bots/systems like Dokusai, tradition acts. |
| **`600`** | **Economy**          | Economy acts, currency, bot mini-games, server shops, trade/punishment acts.    |

---

## 3. Numbering Rules for Staff

### Art. 1 Base Statutes & Whole Integers

1. **Primary Acts / Base Codes:** Always receive a whole integer root number (e.g., `SR 210`, `SR 310`). Do **not** append `.0` to base statutes.
2. **Sequential Placement:** Sub-chapters are assigned sequentially by topic (`210`, `211`, `212`). Fixed step-gaps (e.g., leaving arbitrary gaps of 5) are abolished; use decimals when filling space between numbers.

### Art. 2 Decimal Expansion (Adding New Laws)

If a new law must be inserted between two existing base numbers (e.g., between `SR 210` and `SR 211`), **add a decimal point**:

* Existing: `210-public-code.md`
* **New Law:** `210.5-community-safety-act.md`
* Existing: `211-public-spaces.md`

If `210.5` fills up, expand further (`210.51`, `210.52`). You can expand decimals infinitely down.

### Art. 3 Sub-Documents, Regulations & Fees

Implementing ordinances, administrative guidelines, and technical attachments attached to a main Code use specific decimal endings:

* **`.1` through `.8` (Sub-Topics):** Specific statutory branches or secondary acts directly subordinate to the base code.
* **`.9` (General Implementing Ordinances):** Executive rules, staff guidance, or enforcement procedures for that code.
* **`.99` (Fee & Tariff Schedules):** Economy costs, administrative fines, or fee schedules associated with the act.

$$\text{Base Code: } \text{SR } 410 \quad \rightarrow \quad \text{Ordinance: } \text{SR } 410.9 \quad \rightarrow \quad \text{Fines/Fees: } \text{SR } 410.99$$

### Art. 4 Rapid & Emergency Enactments (`.0X` Branch)

To keep the main subject hierarchy clean, fast-tracked, temporary, or emergency measures use the `.0X` prefix under the relevant parent subject:

* `SR 310.01-temporary-raid-containment-act.md`
* Once repealed, `.0X` files are retired; core topic slots (`.1`–`.9`) remain clean.
ì
---

## 4. Resolving Classification Ties

When a proposed law touches multiple subjects (e.g., a "slur article" that involves both **Penal penalties** and **Member Conduct**):

1. **Primary Intent Rule:** Classify the file by its **primary legal remedy**:
* If it defines an *offense and penalty*, it belongs in **`300 Penal`**.
* If it defines *general community standards*, it belongs in **`200 Civil & Public`**.


2. **Cross-Referencing:** State secondary impacts inside the document text rather than splitting the file across two numbers.
3. **Chancery Final Call:** If staff disagree on classification, the Head Moderator or Legislative Clerk makes the binding taxonomy decision before filing.

---

## 5. Re-Organized Directory Layout

Below is how the existing files map into the unified Dewey-standard repository:

```text
.
├── 0-extraterritorial/
│   └── 010-extraterritorial-matters.md
├── 1-constitutional/
│   └── 101-server-charter.md
├── 2-civil-and-public/
│   ├── 210-public-code.md
│   └── 211-server-management.md
├── 3-penal/
│   ├── 310-penal-code.md
│   └── 311-penal-procedure-code.md
├── 4-administration/
│   └── 410-admin-codes.md
└── 6-economy/
    └── 610-economy-act.md

```

### Key Cleanup Changes Applied:

* **`415` $\rightarrow$ `411` & `215` $\rightarrow$ `211`:** Removed arbitrary 5-increment gaps. Standard base laws increment sequentially.
* **`555 Culture Code` $\rightarrow$ `510 Culture Code`:** Placed the foundational Code at the root slot (`510`) before individual cultural systems (`511`, `512`).
* **`415 Admin Codes` split:** Base principles stay at `410`, while administrative execution rules move to `410.9` as an implementing ordinance.