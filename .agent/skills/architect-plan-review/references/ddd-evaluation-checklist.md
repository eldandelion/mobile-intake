# DDD Architectural Evaluation Checklist

Use this checklist during Step 2 of the `architect-plan-review` process when reviewing plans against Domain-Driven Design (DDD).

---

## 1. Ubiquitous Language & Naming
- [ ] **Domain Alignment**: Do all classes, methods, endpoints, and events use business domain terminology instead of generic technical names (e.g., `ReferralStepApproved`, `EscalateUrgentCase` instead of `UpdateStatus`, `ProcessRecord`)?
- [ ] **Ambiguity Free**: Are terms with multiple meanings in different departments explicitly distinguished by bounded context?
- [ ] **No Anemic Entities**: Do domain models encapsulate both data and the business behavior that operates on that data?

---

## 2. Bounded Contexts & Context Mapping
- [ ] **Clear Boundaries**: Is it clear which bounded context (e.g., Referral Management, Student Health Profile, Doctor Scheduling, Notifications) owns each model?
- [ ] **Anti-Corruption Layer (ACL)**: When data crosses contexts or comes from external third parties/legacy systems, is there an ACL or domain mapper to prevent foreign schema leakage?
- [ ] **Decoupled Cross-Context Communication**: Are cross-context side-effects triggered via domain events or dedicated integration services rather than tight synchronous couplings?

---

## 3. Aggregates & Invariants
- [ ] **Aggregate Root Identification**: For each cluster of domain objects, is there an unambiguous Aggregate Root that controls all access and enforces consistency invariants?
- [ ] **Transactional Boundary**: Does each transaction modify only a single aggregate root? (Cross-aggregate consistency should use eventual consistency / domain events).
- [ ] **Direct References**: Do aggregates reference other aggregates by Identity (ID), not by direct in-memory object references?

---

## 4. Entities vs. Value Objects
- [ ] **Value Objects for Descriptive Concepts**: Are concepts defined purely by their attributes modeled as immutable Value Objects (e.g., `RiskTier`, `AppointmentSlot`, `ContactInfo`) with equality by value?
- [ ] **Self-Validating Value Objects**: Do Value Objects enforce their own validation on instantiation (e.g., valid email format, positive integer range)?
- [ ] **Entity Identity**: Do entities have explicit, unique identities that persist across state changes?

---

## 5. Domain Events & Thin Events
- [ ] **Past Tense Naming**: Are domain events named in past tense indicating completed business facts (e.g., `ReferralSubmitted`, `DoctorAssigned`, `AssessmentCompleted`)?
- [ ] **Thin Events**: Do events carry only the essential aggregate ID, event ID, timestamp, and core change payload rather than whole unpersisted entity trees?
- [ ] **Asynchronous Processing**: Are non-critical side effects (e.g. notifications, analytics aggregation) decoupled via asynchronous event listeners?

---

## 6. Persistence & Layer Decoupling
- [ ] **Domain Model Purity**: Are domain models free of framework annotations (`@Entity`, `@Table`, `@JsonProperty`, `@Column`)?
- [ ] **Repository Contracts**: Are repository interfaces defined in terms of domain models, with implementation adapters handling JPA entities and database queries?
- [ ] **Mappers / Converters**: Are explicit mappers or converters specified to translate between domain models, persistence entities, and API DTOs?
