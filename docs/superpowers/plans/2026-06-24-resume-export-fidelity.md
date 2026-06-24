# Resume Export Fidelity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make PNG/PDF and Word exports preserve the layout and mixed RTL/LTR ordering of the original `resume/index.html`.

**Architecture:** Move the deterministic export constants and Word bidi text construction into a small pure helper module with Node tests. PNG/PDF capture temporarily restores the live React resume to the source document's fixed 794px geometry before html2canvas runs, then restores the interactive layout. Word uses the exact mixed-direction run construction from the source exporter. No iframe is used.

**Tech Stack:** React 19, TypeScript, html2canvas, jsPDF, docx 8.5, Node test runner through `tsx`.

---

### Task 1: Add failing export regression tests

**Files:**
- Create: `src/components/ResumeExportUtils.test.ts`
- Modify: `package.json`

- [ ] **Step 1: Add the test command**

Add:

```json
"test": "tsx --test src/components/ResumeExportUtils.test.ts"
```

- [ ] **Step 2: Write tests for fixed A4 width and Word bidi text**

```ts
import test from "node:test";
import assert from "node:assert/strict";
import {
  RESUME_EXPORT_WIDTH,
  buildKnowledgeLabelSpec,
  buildSubtitleSpec,
} from "./ResumeExportUtils";

test("exports at the original 794px page width", () => {
  assert.equal(RESUME_EXPORT_WIDTH, 794);
});

test("keeps the original mixed subtitle in one LTR run", () => {
  assert.deepEqual(
    buildSubtitleSpec("Java / J2EE · ASP.NET C# | מפתח תוכנה"),
    [{ text: "Java / J2EE · ASP.NET C# | מפתח תוכנה", rightToLeft: false }],
  );
});

test("keeps mixed Hebrew and English knowledge labels in one RTL run", () => {
  assert.deepEqual(buildKnowledgeLabelSpec("שרתי Web", true), [
    { text: "שרתי Web:  \u200F", rightToLeft: true, rtl: true },
  ]);
});

```

- [ ] **Step 3: Run the test and verify RED**

Run: `npm test`

Expected: FAIL because `ResumeExportUtils` does not exist.

### Task 2: Implement deterministic export helpers

**Files:**
- Create: `src/components/ResumeExportUtils.ts`
- Test: `src/components/ResumeExportUtils.test.ts`

- [ ] **Step 1: Add the minimal helper implementation**

```ts
export const RESUME_EXPORT_WIDTH = 794;

export type WordRunSpec = {
  text: string;
  rightToLeft: boolean;
  rtl?: boolean;
};

export const buildSubtitleSpec = (text: string): WordRunSpec[] => [
  { text, rightToLeft: false },
];

export const buildKnowledgeLabelSpec = (
  label: string,
  docRtl: boolean,
): WordRunSpec[] => [
  {
    text: `${label}:  ${docRtl ? "\u200F" : ""}`,
    rightToLeft: docRtl,
    ...(docRtl ? { rtl: true } : {}),
  },
];

```

- [ ] **Step 2: Run the test and verify GREEN**

Run: `npm test`

Expected: 3 passing tests.

### Task 3: Restore fixed-layout PNG/PDF capture

**Files:**
- Modify: `src/components/ResumeViewer.tsx`

- [ ] **Step 1: Import `RESUME_EXPORT_WIDTH`**

- [ ] **Step 2: Temporarily restore the live resume to the source geometry**

Set the React resume root, `#doc`, `#stage`, and both pages to the source width of `794px`, remove preview scaling, wait for layout and fonts, and restore every class/style attribute in `finally`.

- [ ] **Step 3: Preserve the source document context in html2canvas**

Set the cloned document's `lang`/`dir`, remove application wide-mode transforms, and retain the exact source HTML/CSS already embedded by React.

- [ ] **Step 4: Measure and redraw timeline rails/dots from the fixed layout**

All coordinates must come from the same 794px live layout that html2canvas captures, not from the responsive preview geometry.

- [ ] **Step 5: Verify both pages retain 794×1123 CSS geometry**

Run the browser export at a narrow viewport and inspect both downloaded PNGs.

Expected: each canvas is `2382×3369` at scale 3, with no reflow, shifted icons, or timeline drift.

### Task 4: Fix Word mixed-direction runs

**Files:**
- Modify: `src/components/ResumeViewer.tsx`
- Test: `src/components/ResumeExportUtils.test.ts`

- [ ] **Step 1: Build the subtitle from the full `.subtitle` text**

Use one LTR `TextRun`, matching the working original HTML exporter, so the pipe remains between the English technology list and Hebrew role.

- [ ] **Step 2: Build each knowledge label as one RTL run**

Do not split `כלי AI` or `שרתי Web`; Word reorders punctuation between split runs.

- [ ] **Step 3: Preserve the source run ordering for years and page numbers**

Do not add bidi markers that are absent from the working source. Keep the source exporter's year/title and page-number behavior unchanged.

- [ ] **Step 4: Export DOCX and render it through Microsoft Word**

Open the generated DOCX read-only with Word automation, export to PDF, rasterize both pages with ImageMagick, and inspect them.

Expected: the rendered Word pages are pixel-identical to the output produced by `resume/index.html`.

### Task 5: Full verification

**Files:**
- Verify: `src/components/ResumeViewer.tsx`
- Verify: `src/components/ResumeExportUtils.ts`
- Verify: `src/components/ResumeExportUtils.test.ts`

- [ ] **Step 1: Run unit tests**

Run: `npm test`

- [ ] **Step 2: Run TypeScript validation**

Run: `npm run lint`

- [ ] **Step 3: Run production build**

Run: `npm run build`

- [ ] **Step 4: Export and inspect PNG, PDF, and DOCX**

Check both pages in every format against `resume/index.html`, including header spacing, section icons, knowledge rows, timeline rails/dots/years, subtitle, mixed labels, and page numbers.

- [ ] **Step 5: Review the final diff**

Run: `git diff --check` and `git diff -- src/components/ResumeViewer.tsx src/components/ResumeExportUtils.ts src/components/ResumeExportUtils.test.ts package.json`.

Do not commit automatically because the working tree already contains user-owned changes.
