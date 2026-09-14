---
name: button-label-audit
description: >
  Audits, verifies, and standardizes Material Design 3 (M3) button labels and interactive action copy, with a specialized focus on Chinese (CJK) and English UI conventions. Scans pages, components, dialogs, and toolbars to ensure labels follow verb-oriented rules, context-aware Verb vs. Verb+Noun (动宾结构) guidelines, 2-character/4-character rhythm, typography specs, and destructive action clarity. Use when: "button label", "button text", "audit buttons", "button copy", "scan page buttons", "action copy", "button wording".
user-invokable: true
argument-hint: "[scan|audit|verify|fix] [page-path-or-component-name]"
---

# Button Label Design & Audit Skill (Material Design 3 + CJK)

This skill provides a systematic framework and automated audit process for designing, reviewing, and standardizing **Material Design 3 (M3)** button labels and interactive action copy across applications, with specialized precision for **Chinese (Simplified/Traditional)** and **English** user interfaces.

---

## 1. Core Philosophy & Copywriting Principles

1. **Predictable & Action-Oriented**:
   Every button label must clearly communicate what will happen when clicked. Always lead with a strong action verb.
2. **Context-Aware Information Density**:
   Button copy density adapts to its containment:
   - **Open/Ambient Context** (Page Header, Toolbar, Canvas) $\rightarrow$ Needs **Verb + Noun** (e.g. `添加量表` / *Add assessment*) to avoid ambiguity among multiple on-screen entities.
   - **Contained Context** (Dialog Footer, Sheet, Dedicated Form) $\rightarrow$ Needs **Concise Verb** (e.g. `取消` / *Cancel*, `保存` / *Save*) because entity context is already established.
3. **Aesthetic Rhythm (二字 / 四字格)**:
   In Chinese UI, standard button copy strictly adheres to **2-character words** or **4-character verb-noun phrases** for visual stability and scannability.
4. **M3 Typographical Compliance**:
   All button copy adheres to the **`Label Large`** typescale role (`14sp / 0.875rem / 14px`, weight `500` Medium or `700` Emphasized), **Sentence case** in English (no ALL CAPS in M3), and **Zero letter-spacing** (`tracking-normal`) in CJK.

---

## 2. The 3-Tier Context Decision Tree

```text
                                  Where is the action located?
                                               │
             ┌─────────────────────────────────┼─────────────────────────────────┐
             ▼                                 ▼                                 ▼
       [ TIER 1: AMBIENT ]            [ TIER 2: CONTAINED ]            [ TIER 3: HIGH-RISK ]
   Page Header, Table Toolbar,         Dialog, Drawer, Sheet,            Destructive Action,
     Floating Action Button             Dedicated Form Footer           Irreversible Confirmation
             │                                 │                                 │
     Verb + Noun (4-Char)             Concise Verb (2-Char)            Explicit Impact Action
   "添加量表" / "新建转诊"               "保存" / "取消" / "提交"         "确认停用" / "确认驳回"
```

### Tier 1: Ambient Context (Page Headers, Toolbars, Table Actions, FABs)
- **Rule**: Must use **Verb + Noun (动宾结构)**. In Chinese, format as a balanced **4-character phrase**.
- **Rationale**: When scanning a dense dashboard or table, multiple entity types exist simultaneously. A generic verb like "添加" (Add) or "新建" (Create) creates cognitive friction (*"Add what?"*).
- **Standards**:
  - ✅ `添加量表` (Add Assessment)
  - ✅ `新建转诊` (Create Referral)
  - ✅ `分配测评` (Assign Questionnaire)
  - ✅ `批量分配` (Assign Cohort)
  - ✅ `导出数据` (Export Data)
  - ✅ `预约排期` (Schedule Appointment)
  - ❌ *Avoid bare verbs*: `添加`, `新建`, `导出`, `分配`

---

### Tier 2: Contained Context (Dialog Footers, Drawer Drawers, Form Actions)
- **Rule**: Must use **Concise Verbs (双音节动词 / 2-character words)**.
- **Rationale**: The dialog title (e.g., *"Assign Questionnaire"*) and form inputs already define the object. Repeating the noun in the action buttons creates redundant clutter.
- **Standards**:
  - ✅ `取消` (Cancel)
  - ✅ `保存` (Save)
  - ✅ `提交` (Submit)
  - ✅ `完成` (Done)
  - ✅ `重置` (Reset)
  - ❌ *Avoid over-specification*: `取消分配量表`, `保存学生基本信息`

---

### Tier 3: High-Risk / Destructive Confirmation (Modal Confirmations)
- **Rule**: Must use an **Explicit Consequence Action** (Verb + Specific Status/Target).
- **Rationale**: Users frequently click through modal popups on autopilot. Vague labels like "确定" (OK) or "是" (Yes) fail to communicate severe or irreversible consequences.
- **Standards**:
  - ✅ `确认驳回` (Confirm Rejection)
  - ✅ `停用用户` (Disable User)
  - ✅ `注销账号` (Deregister Account)
  - ✅ `确认撤回` (Confirm Recall)
  - ✅ `删除记录` (Delete Record)
  - ❌ *Avoid vague labels*: `确定`, `是`, `OK`, `继续`

---

## 3. Language & Localization Rules

### 3.1 Chinese (CJK) Copywriting Rules
1. **The 2/4-Character Cadence**:
   - Standard: Use 2 characters for contained actions (`保存`, `取消`) or 4 characters for ambient actions (`添加量表`, `导出报表`).
   - Prohibited: Never use single-character labels (`增`, `删`, `改`, `查`) or colloquial 3-character phrases (`加量表`, `做测评`).
2. **Verb Priority (动词首位)**:
   - Always place the active verb before the object noun: `添加量表` (Verb: 添加, Noun: 量表) $\rightarrow$ NEVER `量表添加` (Noun-first).
3. **Zero Letter Spacing**:
   - Always use `letter-spacing: 0` or `tracking-normal`. Positive tracking breaks the natural density of ideographic square glyphs.
4. **No Punctuation in Buttons**:
   - Never append periods (`.`), exclamation marks (`!`), colons (`:`), or trailing ellipsis (`...`) inside button elements.

### 3.2 English Copywriting Rules
1. **Sentence Case Exclusively**:
   - Write `"Save changes"`, `"Add assessment"`, `"Assign questionnaire"`.
   - Never use ALL CAPS (`SAVE CHANGES` ❌) unless adhering to a strict legacy MD2 brand override.
2. **Active Voice**:
   - Lead with an imperative verb (`"Export data"`, not `"Data exporting"`).

---

## 4. Material Design 3 Button Component Hierarchy

Map button copy to the correct M3 visual component based on visual emphasis:

```text
┌────────────────────────┬─────────────────────────────┬────────────────────────────────────────────────────────┐
│ Visual Emphasis Tier   │ Component / Element         │ Intended Copy & Use Case                               │
├────────────────────────┼─────────────────────────────┼────────────────────────────────────────────────────────┤
│ High (Primary CTA)     │ <md-filled-button>          │ Single primary page/modal action ("新建转诊", "提交")   │
│ Medium-High (Tonal)    │ <md-filled-tonal-button>    │ Secondary constructive actions ("批量分配", "预约排期")│
│ Medium (Outlined)      │ <md-outlined-button>        │ Filter actions, secondary choices, non-primary steps   │
│ Low (Text / Dismiss)   │ <md-text-button>            │ Dismissive actions ("取消", "关闭", "返回")            │
│ Destructive            │ DestructiveButton (Custom)  │ Irreversible warning actions ("停用用户", "确认驳回")  │
└────────────────────────┴─────────────────────────────┴────────────────────────────────────────────────────────┘
```

---

## 5. Audit & Scanning Procedure

When scanning a component, page, or directory for button copy compliance, follow this 5-step audit workflow:

```text
1. DISCOVERY        Find all <button>, <md-*-button>, <ActionFooter>, and clickable triggers.
2. CONTEXT MAPPING  Classify each action into Tier 1 (Ambient), Tier 2 (Contained), or Tier 3 (High-Risk).
3. COPY EVALUATION  Check against Verb-Priority, 2/4-Char Cadence, and M3 Casing/Tracking standards.
4. VARIANT AUDIT    Verify button visual variant matches its semantic weight.
5. REPORT & FIX     Output structured compliance table with line-by-line recommendations.
```

### Audit Output Report Template

```markdown
# Button Label & Copy Compliance Audit

**Target File(s)**: `path/to/Component.tsx`
**Overall Score**: [X/10]

## Findings Summary Table

| Location (Line) | Current Label | Context Tier | Recommended Label | M3 Variant | Rationale & Rule |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `Component.tsx:L45` | `添加` | Tier 1 (Toolbar) | `添加量表` | Filled | Ambient context requires 4-character Verb+Noun. |
| `Dialog.tsx:L112` | `确定` | Tier 3 (Destructive)| `确认停用` | Destructive | Destructive modal must explicitly state consequence. |
| `Form.tsx:L88` | `保存个人信息` | Tier 2 (Form) | `保存` | Filled | Form context is explicit; 2-char verb reduces clutter. |

## Recommended Code Changes
[Provide diff or code snippets]
```

---

## 6. Project-Specific Dictionary Reference (Healthcare & Triage)

Use this quick-reference dictionary to guarantee cross-module terminology consistency:

| Action Scenario | English Label | Standard Chinese (中文) | Forbidden / Poor Alternatives |
| :--- | :--- | :--- | :--- |
| **Catalog Add Assessment** | Add assessment | `添加量表` | `添加`, `新建`, `加量表` |
| **Cohort Assignment** | Assign cohort | `批量分配` | `群发`, `全部分配`, `批量做题` |
| **Individual Assignment** | Assign questionnaire | `分配测评` | `指派`, `派发量表`, `分配任务` |
| **New Referral Initiation** | New referral | `新建转诊` | `转诊申请`, `建转诊`, `申请转诊` |
| **HC Referral Approval** | Approve referral | `批准转诊` | `同意`, `通过`, `审核通过` |
| **HC Referral Rejection** | Reject referral | `驳回转诊` / `确认驳回` | `拒绝`, `不通过`, `打回` |
| **Teacher Referral Recall** | Recall referral | `撤回转诊` / `确认撤回` | `取消`, `拿回`, `反悔` |
| **Doctor Appointment** | Schedule appointment| `预约排期` | `排班`, `安排时间`, `预约` |
| **Doctor Feedback Submit** | Submit feedback | `提交反馈` / `录入反馈` | `写诊断`, `提交`, `保存报告` |
| **Admin User Disable** | Disable user | `停用用户` / `确认停用` | `封号`, `禁用`, `确定` |
| **Admin User Deregister** | Deregister account | `注销账号` / `确认注销` | `删除用户`, `注销`, `确定` |
| **Generic Dialog Dismiss** | Cancel | `取消` | `返回`, `算了`, `取消操作` |
| **Generic Form Submit** | Submit | `提交` | `确定提交`, `OK`, `发送` |
| **Generic Form Save** | Save | `保存` | `保存当前`, `存为草稿` (unless draft) |
