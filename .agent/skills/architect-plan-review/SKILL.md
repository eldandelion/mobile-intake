---
name: architect-plan-review
description: Double-checks and refines an implementation plan through the lens of a Senior Software Developer and Architect. Spawns specialized subagents to evaluate the plan from Domain-Driven Design (DDD) principles and Clean Code / Code Review & Quality standards, then reconciles both reports to harden and adjust the plan. Use when reviewing plans, validating architecture, or before executing non-trivial feature implementations.
license: MIT
metadata:
  author: system-architect
  version: "1.0.0"
---

# Architect Plan Review

## Overview

A robust implementation plan prevents architectural drift, technical debt, and costly mid-implementation rewrites. **Architect Plan Review** acts as a senior software developer and architect quality gate. It rigorously tests an implementation plan by dispatching two independent, specialized review subagents:

1. **Domain-Driven Design (DDD) Subagent**: Evaluates domain modeling, bounded contexts, aggregate root invariants, ubiquitous language, entity/value object distinctions, domain events, and persistence decoupling.
2. **Clean Code & Quality Subagent**: Evaluates readability, separation of concerns, single responsibility principle (SRP), error handling, edge cases, testability (TDD alignment), and prevention of over-engineering.

Once both subagents complete their evaluations and report back, the main orchestrator reconciles their findings, resolves architectural tensions, and outputs a revised, hardened implementation plan.

```
                  ┌──────────────────────────────┐
                  │   Initial Implementation     │
                  │            Plan              │
                  └──────────────┬───────────────┘
                                 │
                 ┌───────────────┴───────────────┐
                 │  Spawn Concurrent Reviewers   │
                 └───────┬───────────────┬───────┘
                         │               │
                         ▼               ▼
        ┌──────────────────────┐   ┌──────────────────────────┐
        │  Subagent 1: DDD     │   │ Subagent 2: Clean Code   │
        │  (Domain Modeling,   │   │ & Quality Review         │
        │  Aggregates, Events, │   │ (SRP, Testability,       │
        │  Bounded Contexts)   │   │ Readability, Error Paths)│
        └──────────┬───────────┘   └─────────────┬────────────┘
                   │                             │
                   └─────────────┬───────────────┘
                                 │ Reports back
                                 ▼
                  ┌──────────────────────────────┐
                  │   Orchestrator Synthesis &   │
                  │    Conflict Reconciliation   │
                  └──────────────┬───────────────┘
                                 │
                                 ▼
                  ┌──────────────────────────────┐
                  │    Adjusted & Hardened       │
                  │      Production Plan         │
                  └──────────────────────────────┘
```

---

## When to Use

Apply this skill when:
- You have drafted an implementation plan (e.g., `tasks/plan.md` or a feature specification) for a non-trivial feature or refactor.
- You are about to touch domain models, state machines, business workflows, or database entities.
- You want to ensure the proposed design complies with DDD architectural boundaries and Clean Code standards.
- You need senior architectural validation before executing code changes.

**When NOT to use:**
- Simple, single-file bug fixes or minor cosmetic adjustments.
- Routine dependency updates or mechanical refactoring (e.g., simple file moves, renames).
- When the user explicitly requests an immediate, rapid prototype without architectural vetting.

---

## Review Process

Follow this 5-step workflow:

```
Architect Plan Review Checklist:
- [ ] Step 1: EXTRACT — Isolate plan, scope, project context (PRD, GEMINI.md/rules), and constraints.
- [ ] Step 2: SPAWN DDD SUBAGENT — Invoke Subagent 1 with domain-driven-design skill.
- [ ] Step 3: SPAWN CLEAN CODE SUBAGENT — Invoke Subagent 2 with clean-code & code-review-and-quality skills.
- [ ] Step 4: RECONCILE — Collect reports, categorize findings, and resolve design tensions.
- [ ] Step 5: ADJUST PLAN — Update the plan with concrete architectural improvements and trade-off notes.
```

---

### Step 1: EXTRACT — Context & Review Target

Before spawning reviewers, compile the review package containing:
1. **The Plan**: The proposed architecture, step-by-step implementation tasks, data models, API endpoints, and UI state flows.
2. **The Context**:
   - Core domain rules (e.g., `GEMINI.md`, PRD specifications).
   - Existing bounded contexts, aggregates, and database schemas.
   - Tech stack constraints (e.g., Kotlin Spring Boot DDD backend, React 19 frontend).

Ensure the review target is clearly articulated with its goals and acceptance criteria.

---

### Step 2: SPAWN DDD SUBAGENT — Domain Architecture Evaluation

Spawn a dedicated subagent using `invoke_subagent` to evaluate the plan purely through Domain-Driven Design principles.

#### Subagent 1 Invocation Parameters:
- **`TypeName`**: `"self"` (or `"research"`)
- **`Role`**: `"DDD Architect Reviewer"`
- **`Prompt`**:

```markdown
You are a Principal Software Architect specializing in Domain-Driven Design (DDD).
Your task is to critically review the following implementation plan against strict DDD principles.

FIRST: Read the instructions in `.agent/skills/domain-driven-design/SKILL.md`.

Evaluate the plan against these core dimensions:
1. Ubiquitous Language: Are domain concepts named after business realities rather than technical mechanisms (e.g., `ReferralApproved` vs `DataSaved`)?
2. Bounded Contexts & Context Mapping: Does the plan respect domain boundaries? Are Anti-Corruption Layers (ACLs) or translation mappers specified where crossing contexts?
3. Aggregates & Invariants: Are aggregate boundaries clearly defined? Does an aggregate root guard all business invariants within a transaction?
4. Entities vs. Value Objects: Are immutable Value Objects utilized for identity-less domain concepts? Are entity identifiers cleanly separated?
5. Domain Events: Are domain state changes represented as explicit domain events (preferably thin events)?
6. Layering & Decoupling: Is pure domain logic isolated from JPA/database persistence, controllers, and external transport models?

Provide your review structured as follows:
- DDD Quality Score (0-10) with rationale.
- Critical Flaws: Structural or aggregate boundary violations that must be fixed.
- High-Value Improvements: Specific domain model refinements.
- Questions & Ambiguities: Unclear domain invariants or terms in the plan.
- Actionable Recommendations: Concrete, bulleted changes to the plan's domain design.

PLAN TO REVIEW:
<paste plan here>

PROJECT CONTEXT & DOMAIN RULES:
<paste relevant domain constraints/rules here>
```

---

### Step 3: SPAWN CLEAN CODE SUBAGENT — Code Quality & Simplicity Evaluation

Concurrently spawn a second subagent using `invoke_subagent` to evaluate the plan through Clean Code, maintainability, and testing perspectives.

#### Subagent 2 Invocation Parameters:
- **`TypeName`**: `"self"` (or `"research"`)
- **`Role`**: `"Clean Code & Quality Reviewer"`
- **`Prompt`**:

```markdown
You are a Staff Software Engineer specializing in Clean Code, Software Craftsmanship, and Code Review Quality.
Your task is to critically review the following implementation plan for code quality, simplicity, maintainability, and testability.

FIRST: Read the instructions in `.agent/skills/clean-code/SKILL.md` and `.agent/skills/code-review-and-quality/SKILL.md`.

Evaluate the plan against these core dimensions:
1. Single Responsibility Principle (SRP) & Separation of Concerns: Are components, classes, and services focused on a single responsibility?
2. Readability & Simplicity: Is the design intuitive? Does it avoid premature abstraction or over-engineering (YAGNI)? Could this be achieved with fewer layers or simpler abstractions?
3. Error Handling & Edge Cases: Does the plan account for failure paths, validation errors, timeouts, and state rollbacks?
4. Testability & TDD Strategy: Does the plan define clear unit, integration, and mock testing steps? Are side-effects easily mockable?
5. Component & API Interface Design: Are contracts between modules (and between frontend/backend) explicit, minimal, and type-safe?
6. Magic Strings & Hardcoded Text: Does the plan strictly avoid hardcoded UI strings in backend logic? Are backend DTOs purely data-driven, avoiding messages meant for frontend presentation? Are magic strings eliminated?

Provide your review structured as follows:
- Clean Code Score (0-10) with rationale.
- Code Smells & Over-Engineering Warnings: Unnecessary abstractions or bloated responsibilities.
- Reliability & Edge Case Gaps: Missing error handling or untested boundary conditions.
- Test Strategy Recommendations: Concrete test cases needed before and during implementation.
- Actionable Recommendations: Concrete, bulleted improvements to simplify and clean up the plan.

PLAN TO REVIEW:
<paste plan here>

PROJECT CONTEXT & TECH STACK:
<paste tech stack and conventions here>
```

---

### Step 4: RECONCILE — Synthesize & Resolve Design Tensions

When both subagents report back, the main orchestrator must synthesize their insights. **Do not rubber-stamp every suggestion.** Balance architectural purity with practical engineering simplicity.

#### Common Design Tensions & Resolution Matrix:

| Tension | DDD Subagent Tendency | Clean Code Subagent Tendency | Senior Architect Resolution |
| :--- | :--- | :--- | :--- |
| **Domain Modeling vs Simplicity** | Create multiple granular Value Objects and domain policies for every field. | Keep simple data classes / primitives to avoid boilerplate. | Use Value Objects for fields with business validation/invariants; use simple primitives for purely display/passthrough data. |
| **Event-Driven vs Direct Service Calls** | Publish Domain Events for all internal state transitions. | Direct method calls to reduce indirection and cognitive load. | Use Domain Events for cross-context side-effects (e.g. notifications, risk recalculation); use direct calls within the same aggregate/service. |
| **Layering vs Boilerplate** | Strict 4-layer architecture (Controller ➔ App Service ➔ Domain ➔ Repository/Entity/Mapper). | Consolidate layers if logic is mostly passthrough CRUD. | Enforce domain isolation for complex business logic; keep mappers lightweight and idiomatic. |
| **Testing Scope** | Heavy domain unit tests + context integration tests. | Fast unit tests + pragmatic end-to-end integration tests. | Require unit tests for aggregate invariants and state transitions, plus integration tests for critical database/API flows. |

#### Categorization of Findings:
Classify each finding into:
1. **Critical Flaw (Must Fix)**: Violations of invariants, security/privacy leaks, broken data integrity, or untestable flows.
2. **High-Value Improvement (Adopt)**: Clear improvements to naming, modularity, error resilience, or domain clarity.
3. **Pragmatic Trade-off (Documented)**: Valid points acknowledged but simplified to avoid excessive complexity.
4. **Noise / Out-of-Scope (Discard)**: Suggestions based on misread constraints or irrelevant abstractions.

---

### Step 5: ADJUST PLAN — Generate the Hardened Plan

Produce the updated implementation plan incorporating the validated improvements. 

The finalized output should include:
1. **Executive Architectural Summary**: Scores and key findings from both the DDD and Clean Code reviews.
2. **Reconciliation & Trade-Off Log**: Summary of accepted changes and documented trade-offs.
3. **Hardened Implementation Plan**:
   - Refined domain models & schema mappings.
   - Clear service and component boundaries.
   - Comprehensive error handling and edge cases.
   - Step-by-step implementation tasks with TDD verification criteria.

---

## Red Flags

- **Single-perspective blindness**: Relying only on DDD (leading to over-abstraction) or only on rapid coding (leading to anemic models and tangled logic).
- **Silent dismissal**: Discarding subagent warnings without analyzing the underlying invariant or edge case.
- **Over-engineering paralysis**: Adding 5 layers of indirection when a simple domain function is sufficient.
- **Skipping test planning**: Planning code implementation without defining how each step will be tested and verified.
- **Unstated assumptions**: Proceeding with ambiguous domain terms instead of refining the ubiquitous language.

---

## Verification Checklist

Before finalizing the adjusted plan, verify:
- [ ] Both subagents (DDD and Clean Code) were invoked and provided structured feedback.
- [ ] All Critical Flaws identified by either subagent were addressed in the revised plan.
- [ ] Ubiquitous Language matches the business domain (PRD) across all models, DTOs, and endpoints.
- [ ] Aggregate roots enforce all business invariants; JPA entity mapping is decoupled from domain aggregates.
- [ ] Error paths, validation rules, and rollback behavior are documented for every step.
- [ ] The testing strategy includes unit tests for domain logic and integration tests for external boundaries.
- [ ] Backend logic and API contracts are strictly language-agnostic, containing no hardcoded UI presentation strings or magic strings.
- [ ] Architectural trade-offs are explicitly documented with rationale.
