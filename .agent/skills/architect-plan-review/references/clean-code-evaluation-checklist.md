# Clean Code & Code Quality Evaluation Checklist

Use this checklist during Step 3 of the `architect-plan-review` process when reviewing plans against Clean Code, maintainability, and code review standards.

---

## 1. Single Responsibility & Cohesion
- [ ] **Focused Classes & Functions**: Does each planned service, class, and React component have a single, well-defined reason to change?
- [ ] **Separation of Concerns**: Is UI rendering strictly separated from business logic, data fetching hooks, and state management contexts?
- [ ] **No "God Objects" / Kitchen Sinks**: Does the plan avoid dumping unrelated utility functions into generic `Utils` or multi-thousand-line monster components?

---

## 2. Simplicity & Pragmatic Abstraction (YAGNI & DRY)
- [ ] **No Premature Over-Engineering**: Are abstractions introduced only when there is concrete variation or multi-use necessity (Rule of Three), rather than hypothetical future needs?
- [ ] **Minimal Indirection**: Can a reader easily trace the execution flow without navigating through excessive layers of pass-through wrappers?
- [ ] **Complexity Reduction**: Does the design eliminate complexity at the root (e.g. simplifying data flow) rather than merely shuffling it to another layer?

---

## 3. Error Handling & Edge Cases
- [ ] **Explicit Failure Modes**: Are error states, 4xx/5xx HTTP statuses, network timeouts, and concurrency conflicts explicitly accounted for in the plan?
- [ ] **Consistent Exception Hierarchy**: Does backend error handling use dedicated domain exceptions handled by a centralized controller advice?
- [ ] **User-Facing Resilience**: Does frontend planning include loading skeletons, error boundaries, empty states, and non-blocking snackbar alerts?

---

## 4. Test-Driven Development (TDD) & Verification Plan
- [ ] **Testability by Design**: Are all business logic paths, state transitions, and calculation functions pure or structured with dependency injection to allow fast unit testing?
- [ ] **Granular Test Plan**: Does the plan list explicit unit tests, integration tests, and repository test cases with specific inputs and expected outputs?
- [ ] **Mock Strategy**: Are external dependencies (APIs, email/SMS services, time providers) mockable via MSW (frontend) and Mockito / in-memory databases (backend)?

---

## 5. API & Interface Design
- [ ] **Explicit Type Contracts**: Are request/response DTOs, TypeScript interfaces, and props strongly typed without leaking database entities or internal IDs where inappropriate?
- [ ] **Input Validation**: Are validation rules enforced both on the client (immediate user feedback) and on the server (fail-safe validation annotations)?
- [ ] **Backward Compatibility**: Does the plan preserve existing API contracts or specify migration strategies where breaking changes are necessary?
