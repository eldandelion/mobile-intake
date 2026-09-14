Title: Live Content

Description: Fetched live

Source: https://raw.githubusercontent.com/christophacham/agent-skills-library/main/skills/architecture/clean-code/SKILL.md

---

---
name: clean-code
description: 'Write readable, maintainable code through disciplined naming, small functions, and clean error handling. Use when the user mentions "code review", "naming conventions", "function too long", "code smells", or "readable code". Covers SRP, comment discipline, formatting, and unit testing. For refactoring techniques, see refactoring-patterns. For architecture, see clean-architecture.'
license: MIT
metadata:
  author: wondelai
  version: "1.0.0"
---

# Clean Code Framework

A disciplined approach to writing code that communicates intent, minimizes surprises, and welcomes change. Apply these principles when writing new code, reviewing pull requests, refactoring legacy systems, or advising on code quality improvements.

## Core Principle

**Code is read far more often than it is written. Optimize for the reader.** Every naming choice, function boundary, and formatting decision either adds clarity or adds cost. The ratio of time spent reading code to writing code is well over 10:1. Making code easier to read makes it easier to write, easier to debug, and easier to extend.

**The foundation:** Clean code is not about following rules mechanically -- it is about caring for the craft. A clean codebase reads like well-written prose: names reveal intent, functions tell a story one step at a time, and there are no surprises lurking in dark corners. The Boy Scout Rule applies: always leave the code cleaner than you found it.

## Scoring

**Goal: 10/10.** When reviewing or writing code, rate it 0-10 based on adherence to the principles below. A 10/10 means full alignment with all guidelines; lower scores indicate gaps to address. Always provide the current score and specific improvements needed to reach 10/10.

- **9-10:** Names reveal intent, functions are small and focused, error handling is consistent, tests are clean and comprehensive.
- **7-8:** Mostly clean with minor naming ambiguities or a few long functions. Tests exist but may lack edge cases.
- **5-6:** Mixed quality -- some good patterns alongside unclear names, duplicated logic, or inconsistent error handling.
- **3-4:** Significant readability issues -- long functions doing multiple things, misleading names, poor or missing tests.
- **1-2:** Code works but is nearly unreadable -- magic numbers, cryptic abbreviations, no structure, no tests.

## The Clean Code Framework

Six disciplines for writing code that communicates clearly and adapts to change:

### 1. Meaningful Names

**Core concept:** Names should reveal intent, avoid disinformation, and make the code read like prose. If a name requires a comment to explain it, the name is wrong.

**Why it works:** Names are the most pervasive form of documentation. A well-chosen name eliminates the need to read the implementation. A poorly chosen name forces every reader to reverse-engineer the author's intent.

**Key insights:**
- Names should answer why it exists, what it does, and how it is used
- Avoid single-letter variables except for loop counters in tiny scopes
- Avoid encodings, prefixes, and type information in names (no Hungarian notation)
- Class names should be nouns or noun phrases; method names should be verbs or verb phrases
- Use one word per concept consistently: don't mix `fetch`, `retrieve`, and `get`
- Longer scopes demand longer, more descriptive names
- Don't be afraid to rename -- IDEs make it trivial

**Code applications:**

| Context | Pattern | Example |
|---------|---------|---------|
| **Variables** | Intention-revealing name | `elapsedTimeInDays` not `d` or `elapsed` |
| **Booleans** | Predicate phrasing | `isActive`, `hasPermission`, `canEdit` |
| **Functions** | Verb + noun describing action | `calculateMonthlyRevenue()` not `calc()` |
| **Classes** | Noun describing responsibility | `InvoiceGenerator` not `InvoiceManager` |
| **Constants** | Searchable, all-caps with context | `MAX_RETRY_ATTEMPTS = 3` not `3` inline |
| **Collections** | Plural nouns or descriptive phrases | `activeUsers` not `list` or `data` |

See: [references/naming-conventions.md](references/naming-conventions.md)

### 2. Functions

**Core concept:** Functions should be small, do one thing, and do it well. The ideal function is 4-6 lines long, takes zero to two arguments, and operates at a single level of abstraction.

**Why it works:** Small functions are easy to name, easy to understand, easy to test, and easy to reuse. When a function does one thing, its name can describe exactly what it does, eliminating the need to read the body. Long functions hide bugs, resist testing, and accumulate responsibilities over time.

**Key insights:**
- Functions should do one thing, do it well, and do it only
- The Step-Down Rule: code should read like a top-down narrative, each function calling the next level of abstraction
- Ideal argument count is zero (niladic), then one (monadic), then two (dyadic); three or more (polyadic) requires justification
- Flag arguments (booleans) are a code smell -- they mean the function does two things
- Command-Query Separation: a function should either change state or return a value, never both
- Extract till you drop: if you can extract a named function from a block, do it
- Functions should have no side effects -- no hidden changes to state

**Code applications:**

| Context | Pattern | Example |
|---------|---------|---------|
| **Long function** | Extract into named steps | `validateInput(); transformData(); saveRecord();` |
| **Flag argument** | Split into two functions | `renderForPrint()` and `renderForScreen()` not `render(isPrint)` |
| **Deep nesting** | Extract inner blocks | Move nested `if`/`for` bodies into named functions |
| **Multiple returns** | Guard clauses at top | Early return for error cases, single happy path |
| **Many arguments** | Introduce parameter object | `new DateRange(start, end)` not `report(start, end, format, locale)` |
| **Side effects** | Make effects explicit | Rename `checkPassword()` to `checkPasswordAndInitSession()` or separate |

See: [references/functions-and-methods.md](references/functions-and-methods.md)

### 3. Comments and Formatting

**Core concept:** A comment is a failure to express yourself in code. Good code is self-documenting. When comments are necessary, they should explain *why*, never *what*. Formatting creates the visual structure that makes code scannable.

**Why it works:** Comments rot. Code changes but comments often do not, creating misleading documentation that is worse than no documentation. Clean formatting -- consistent indentation, vertical spacing between concepts, and logical ordering -- lets developers scan code the way readers scan a newspaper: headlines first, details on demand.

**Key insights:**
- The best comment is the code itself -- extract a well-named function instead of writing a comment
- Legal comments (copyright headers) and TODO comments are acceptable
- Javadoc for public APIs is valuable; Javadoc for internal code is noise
- Commented-out code should be deleted -- version control remembers it
- Journal comments (changelog in the file) are obsolete -- use git log
- Vertical openness: separate concepts with blank lines
- Vertical density: related code should appear close together
- Variables should be declared close to their usage
- Instance variables should be declared at the top of the class

**Code applications:**

| Context | Pattern | Example |
|---------|---------|---------|
| **Explaining "what"** | Replace with better name | Rename `// check if

