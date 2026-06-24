import test from "node:test";
import assert from "node:assert/strict";
import {
  RESUME_ISOLATION_SELECTOR,
  RESUME_EXPORT_WIDTH,
  buildIsolatedResumeCss,
  buildExportSandboxAttributes,
  buildExportSandboxCss,
  buildExportSandboxStyle,
  buildKnowledgeLabelSpec,
  buildSubtitleSpec,
  scopeResumeCss,
} from "./ResumeExportUtils";

test("exports at the original 794px page width", () => {
  assert.equal(RESUME_EXPORT_WIDTH, 794);
});

test("image and PDF export sandbox is a visible fixed-width source layout, not a responsive live view", () => {
  const style = buildExportSandboxStyle();

  assert.equal(style.width, `${RESUME_EXPORT_WIDTH}px`);
  assert.equal(style.maxWidth, "none");
  assert.notEqual(style.display, "none");
  assert.notEqual(style.visibility, "hidden");
  assert.notEqual(style.opacity, "0");
});

test("image and PDF export sandbox carries the same document direction as the source resume", () => {
  assert.deepEqual(buildExportSandboxAttributes("he", "sandbox-1"), {
    "data-resume-export-sandbox": "sandbox-1",
    dir: "rtl",
    lang: "he",
  });

  assert.deepEqual(buildExportSandboxAttributes("en", "sandbox-2"), {
    "data-resume-export-sandbox": "sandbox-2",
    dir: "ltr",
    lang: "en",
  });
});

test("image and PDF export sandbox cancels responsive app viewport changes before measuring", () => {
  const css = buildExportSandboxCss("sandbox-1");

  assert.match(css, /@media\s*\(max-width:560px\)/);
  assert.match(css, /\.name\s*\{\s*font-size:\s*23px\s*!important;/);
  assert.match(css, /\.page\s*\{\s*width:\s*794px\s*!important;/);
});

test("scopes source resume CSS under the isolated document root", () => {
  const css = scopeResumeCss(`
    :root { --navy: #022159; }
    html, body { margin: 0; }
    body { font-family: Heebo; }
    #doc.wide #stage { transform: scale(1); }
    [dir="ltr"] .name-block { text-align: left; }
    html.exporting-shot .experience::before { display: none; }
    .page { width: 794px; }
  `);

  assert.match(css, /\.cv-resume-isolated\s*\{\s*--navy:/);
  assert.match(css, /\.cv-resume-isolated\.wide #stage/);
  assert.match(css, /\[dir="ltr"\] \.cv-resume-isolated \.name-block/);
  assert.match(css, /html\.exporting-shot \.cv-resume-isolated \.experience::before/);
  assert.match(css, /\.cv-resume-isolated \.page/);
  assert.doesNotMatch(css, /(^|\n)\s*body\s*\{/);
  assert.doesNotMatch(css, /(^|\n)\s*\.page\s*\{/);
});

test("isolated resume CSS resets app styles before applying the source CSS", () => {
  const css = buildIsolatedResumeCss(".page { width: 794px; }");

  assert.match(css, new RegExp(`${RESUME_ISOLATION_SELECTOR.replace(".", "\\.")} \\*`));
  assert.match(css, /all:\s*revert;/);
  assert.match(css, /line-height:\s*normal;/);
  assert.match(css, /\.cv-resume-isolated \.page/);
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
