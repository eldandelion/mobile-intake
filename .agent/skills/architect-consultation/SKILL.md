---
name: architect-consultation
description: Evaluates architectural questions, refactoring proposals, design trade-offs, and technical approaches through the lens of a Senior Software Developer and Principal Architect. Spawns specialized subagents to evaluate the question from Domain-Driven Design (DDD) principles and Clean Code / Engineering Quality standards, then reconciles both perspectives into a clear, actionable architectural opinion and recommendation. Use when asking for architectural advice, evaluating refactoring strategies, comparing design choices, or seeking senior engineering opinion.
license: MIT
metadata:
  author: system-architect
  version: "1.0.0"
---

# Architect Consultation & Advisory

## Overview

When making key technical decisions, refactoring existing modules, or choosing between competing design patterns, making uninformed choices can lead to architectural debt, leaky abstractions, or over-engineered complexity. 

**Architect Consultation** acts as an expert advisory board led by a Senior Software Architect and Staff Engineer. Given any technical question, refactoring proposal, or architectural query, it dispatches two independent, specialized subagents to analyze the question:

1. **Domain-Driven Design (DDD) Subagent**: Evaluates the question through domain modeling, bounded contexts, aggregate invariants, ubiquitous language, entity/value object distinctions, domain events, and context decoupling.
2. **Clean Code & Quality Subagent**: Evaluates the question through code craftsmanship, single responsibility principle (SRP), maintainability, testability (TDD alignment), error handling, simplicity, and prevention of over-engineering (YAGNI).

Once both subagents complete their evaluations and report back, the main orchestrator reconciles their perspectives and delivers a definitive, structured **Architectural Opinion & Recommendation Report**.

```
                  ┌──────────────────────────────┐
                  │    User Question / Topic     │
                  │   (Architecture/Refactoring) │
                  └──────────────┬───────────────┘
                                 │
                 ┌───────────────┴───────────────┐
                 │  Spawn Concurrent Advisors    │
                 └───────┬───────────────┬───────┘
                         │               │
                         ▼               ▼
        ┌──────────────────────┐   ┌──────────────────────────┐
        │  Subagent 1: DDD     │   │ Subagent 2: Clean Code   │
        │  (Domain Modeling,   │   │ & Quality Analysis       │
        │  Aggregates, Events, │   │ (SRP, Simplicity,        │
        │  Bounded Contexts)   │   │ Testability, YAGNI)      │
        └──────────┬───────────┘   └─────────────┬────────────┘
                   │                             │
                   └─────────────┬───────────────┘
                                 │ Reports back
                                 ▼
                  ┌──────────────────────────────┐
                  │   Orchestrator Synthesis &   │
                  │     Trade-Off Reconciliation │
                  └──────────────┬───────────────┘
                                 │
                                 ▼
                  ┌──────────────────────────────┐
                  │    Definitive Architectural  │
                  │    Opinion & Recommendation  │
                  └──────────────────────────────┘
```

---

## When to Use

Apply this skill when:
- You have a question about architectural strategy or design patterns (e.g., *"Should we use Event Sourcing or standard JPA entities for referral tracking?"*).
- You are contemplating a refactoring approach (e.g., *"How should we refactor AssessmentScoringEngine to support custom formula rules?"*).
- You are evaluating trade-offs between competing technical solutions (e.g., *"Should we use MySQL JSON columns or normalized tables for assessment storage?"*).
- You need senior architectural guidance, risk assessment, and recommended best practices before committing to code or drafting a formal implementation plan.

**When NOT to use:**
- Reviewing an already drafted step-by-step implementation plan (Use `architect-plan-review` instead).
- Routine, small-scope bug fixes or straightforward feature additions.
- Simple syntactical or language-specific quick questions.

---

## Consultation Workflow

Follow this 5-step workflow:

```
Architect Consultation Checklist:
- [ ] Step 1: EXTRACT — Define topic, options, scope, codebase context, and constraints.
- [ ] Step 2: SPAWN DDD SUBAGENT — Invoke Subagent 1 with domain-driven-design skill.
- [ ] Step 3: SPAWN CLEAN CODE SUBAGENT — Invoke Subagent 2 with clean-code & code-review-and-quality skills.
- [ ] Step 4: RECONCILE & WEIGHT — Reconcile domain purity vs pragmatic engineering simplicity.
- [ ] Step 5: DELIVER OPINION — Format and output the Senior Architect Advisory Report.
```

---

### Step 1: EXTRACT — Topic & Context Isolation

Before spawning advisor subagents, frame the consultation package:
1. **The Question / Proposal**: Clear formulation of the user's architectural question or refactoring scenario.
2. **Proposed Alternatives**: Explicit list of options being considered (Option A vs Option B vs Option C).
3. **The Codebase Context**:
   - Current domain models, bounded contexts, and existing schemas (`GEMINI.md`, PRD specifications).
   - Relevant codebase paths, patterns, and constraints (e.g., Kotlin Spring Boot backend, React 19 frontend).

---

### Step 2: SPAWN DDD SUBAGENT — Domain Perspective Analysis

Spawn a subagent via `invoke_subagent` to evaluate the question strictly through Domain-Driven Design principles.

#### Subagent 1 Invocation Parameters:
- **`TypeName`**: `"self"` (or `"research"`)
- **`Role`**: `"DDD Architect Advisor"`
- **`Prompt`**:

```markdown
You are a Principal Software Architect specializing in Domain-Driven Design (DDD).
Your task is to analyze the following architectural question / refactoring proposal strictly through DDD principles.

FIRST: Read the instructions in `.agent/skills/domain-driven-design/SKILL.md`.

Analyze the topic across these core domain dimensions:
1. Ubiquitous Language & Model Alignment: Which approach best reflects real business concepts and ubiquitous language?
2. Bounded Context Boundaries: How does each option affect context isolation, Anti-Corruption Layers (ACLs), or module boundaries?
3. Aggregates & Business Invariants: Which option better protects aggregate boundaries and guards business state invariants?
4. Entities vs. Value Objects: Does the proposal correctly identify identity-bearing Entities vs immutable Value Objects?
5. Domain Events & Decoupling: How does each option support explicit domain state transitions and event publishing?
6. Persistence & Framework Decoupling: Does the option isolate pure domain logic from database infrastructure (JPA/MySQL/REST)?

Provide your analysis structured as follows:
- DDD Evaluation & Analysis per Option
- Recommended Option (from DDD perspective) with rationale
- Key Domain Risks & Anti-Patterns to avoid
- Actionable Domain Modeling Advice
```

---

### Step 3: SPAWN CLEAN CODE SUBAGENT — Engineering Quality Analysis

Concurrently spawn a second subagent via `invoke_subagent` to analyze the question from Clean Code, maintainability, and pragmatic craftsmanship perspectives.

#### Subagent 2 Invocation Parameters:
- **`TypeName`**: `"self"` (or `"research"`)
- **`Role`**: `"Clean Code & Quality Advisor"`
- **`Prompt`**:

```markdown
You are a Staff Software Engineer specializing in Clean Code, Software Craftsmanship, and Technical Quality.
Your task is to analyze the following architectural question / refactoring proposal for code simplicity, maintainability, performance, and testability.

FIRST: Read the instructions in `.agent/skills/clean-code/SKILL.md` and `.agent/skills/code-review-and-quality/SKILL.md`.

Analyze the topic across these engineering dimensions:
1. Single Responsibility Principle (SRP) & Modularity: How does each option affect class, service, and component cohesion?
2. Simplicity & YAGNI: Is an option over-engineered or introducing unnecessary abstractions? Which option provides the cleanest implementation?
3. Error Resilience & Edge Cases: Which option provides clearer error propagation, validation boundaries, and state consistency?
4. Testability & TDD Impact: How easy is it to unit test, mock, and integration test each proposed approach?
5. Maintainability & Cognitive Load: Which option is easiest for future developers to understand and extend?
6. Performance & Scalability: Are there query, memory, or throughput bottlenecks introduced by any option?

Provide your analysis structured as follows:
- Engineering & Quality Evaluation per Option
- Recommended Option (from Clean Code & Craftsmanship perspective) with rationale
- Over-Engineering & Complexity Warnings
- Actionable Implementation & Testing Advice
```

---

### Step 4: RECONCILE — Synthesize & Weigh Architectural Trade-Offs

When both advisor subagents report back, synthesize their findings. Weigh domain correctness against practical engineering simplicity.

#### Trade-Off Analysis Matrix:

| Evaluation Dimension | DDD Advisor Takeaway | Clean Code Advisor Takeaway | Senior Architect Synthesis |
| :--- | :--- | :--- | :--- |
| **Domain Purity vs Simplicity** | Favors explicit domain objects, factories, and policies. | Favors minimal indirection and straightforward code paths. | Choose explicit domain models for core complex logic; use simpler patterns for pass-through/CRUD workflows. |
| **Persistence Isolation** | Decouple domain aggregates completely from DB tables/entities. | Minimize mapping boilerplate if entity aligns 1:1 with domain. | Separate entities from domain models when aggregate invariants require it; keep mappers lightweight. |
| **Refactoring Risk** | Focuses on ubiquitous language and aggregate boundary cleanup. | Focuses on test coverage, regression safety, and low blast radius. | Prioritize refactoring steps backed by automated unit/integration tests to ensure zero regression. |

---

### Step 5: DELIVER OPINION — Structure the Advisory Output

Formulate the final **Senior Architect & Principal Engineer Advisory Report**. The response must be structured as follows:

1. **Executive Verdict**: Clear, direct recommendation (e.g., *"We recommend Option B (Normalized JPA Entities with Domain Mappers) over Option A"*).
2. **Summary of Evaluated Approaches**: Brief recap of options considered.
3. **Core Architectural Arguments**:
   - **Domain Architecture Insights** (DDD review findings).
   - **Software Craftsmanship & Clean Code Insights** (Simplicity, SRP, and testability findings).
4. **Comprehensive Trade-Off Matrix**: Comparison table evaluating Pros, Cons, Complexity, Risk, and Testability for each option.
5. **Concrete Actionable Recommendations & Migration Strategy**: Step-by-step guidance on how to implement or execute the recommended approach safely.

---

## Red Flags & Pitfalls

- **Rubber-stamping without subagent evaluation**: Providing an opinion off the top of your head without running DDD and Clean Code subagent analyses.
- **Dogmatic DDD over-abstraction**: Recommending 6 layers of indirection for simple CRUD logic when a simpler pattern is cleaner.
- **Premature refactoring traps**: Advising a massive refactor without verifying existing test coverage or blast radius.
- **Ignoring system constraints**: Giving generic advice that violates existing codebase rules (e.g. `GEMINI.md`).

---

## Verification Checklist

Before presenting the architectural opinion, verify:
- [ ] Both specialized advisor subagents (DDD and Clean Code) were invoked and provided analysis.
- [ ] The recommendation explicitly answers the user's specific question or refactoring scenario.
- [ ] A structured Trade-Off Matrix comparing all evaluated options is included.
- [ ] The advice accounts for tech stack constraints (Kotlin Spring Boot, React 19, MySQL 8).
- [ ] Clear, concrete, step-by-step implementation/migration guidelines are provided.
