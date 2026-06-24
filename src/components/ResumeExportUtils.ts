export const RESUME_EXPORT_WIDTH = 794;
export const RESUME_EXPORT_SANDBOX_ATTR = "data-resume-export-sandbox";
export const RESUME_ISOLATION_CLASS = "cv-resume-isolated";
export const RESUME_ISOLATION_SELECTOR = `.${RESUME_ISOLATION_CLASS}`;

export type ResumeExportLang = "he" | "en";

export type ExportSandboxAttributes = {
  [RESUME_EXPORT_SANDBOX_ATTR]: string;
  dir: "rtl" | "ltr";
  lang: ResumeExportLang;
};

export type ExportSandboxStyle = Record<string, string>;

export const buildExportSandboxAttributes = (
  lang: ResumeExportLang,
  sandboxId: string,
): ExportSandboxAttributes => ({
  [RESUME_EXPORT_SANDBOX_ATTR]: sandboxId,
  dir: lang === "he" ? "rtl" : "ltr",
  lang,
});

export const buildExportSandboxStyle = (): ExportSandboxStyle => ({
  position: "absolute",
  left: "-10000px",
  top: "0",
  width: `${RESUME_EXPORT_WIDTH}px`,
  maxWidth: "none",
  height: "auto",
  overflow: "visible",
  pointerEvents: "none",
  zIndex: "-1",
});

export const buildExportSandboxCss = (sandboxId: string): string => `
  [${RESUME_EXPORT_SANDBOX_ATTR}="${sandboxId}"] {
    width: ${RESUME_EXPORT_WIDTH}px !important;
    max-width: none !important;
  }

  [${RESUME_EXPORT_SANDBOX_ATTR}="${sandboxId}"] #doc,
  [${RESUME_EXPORT_SANDBOX_ATTR}="${sandboxId}"] #stage,
  [${RESUME_EXPORT_SANDBOX_ATTR}="${sandboxId}"] .page {
    width: ${RESUME_EXPORT_WIDTH}px !important;
    max-width: none !important;
  }

  [${RESUME_EXPORT_SANDBOX_ATTR}="${sandboxId}"] #doc {
    height: auto !important;
  }

  [${RESUME_EXPORT_SANDBOX_ATTR}="${sandboxId}"] #stage {
    transform: none !important;
  }

  @media (max-width:560px) {
    [${RESUME_EXPORT_SANDBOX_ATTR}="${sandboxId}"] .page {
      width: ${RESUME_EXPORT_WIDTH}px !important;
      max-width: none !important;
    }

    [${RESUME_EXPORT_SANDBOX_ATTR}="${sandboxId}"] .name {
      font-size: 23px !important;
    }
  }
`;

const stripCssComments = (css: string): string => css.replace(/\/\*[\s\S]*?\*\//g, "");

const findRuleEnd = (css: string, openIndex: number): number => {
  let depth = 0;
  for (let i = openIndex; i < css.length; i++) {
    if (css[i] === "{") depth++;
    if (css[i] === "}") {
      depth--;
      if (depth === 0) return i;
    }
  }

  return css.length - 1;
};

const scopeSelector = (selector: string, scopeSelectorText: string): string => {
  const trimmed = selector.trim();
  if (!trimmed) return trimmed;

  if (trimmed === ":root" || trimmed === "html" || trimmed === "body") {
    return scopeSelectorText;
  }

  if (trimmed === "*") {
    return `${scopeSelectorText}, ${scopeSelectorText} *`;
  }

  if (/^#fs(?:Overlay|Scroll|Page|Left|Right|Close)\b/.test(trimmed) || /^\.fs-/.test(trimmed)) {
    return trimmed;
  }

  if (trimmed.startsWith("html.exporting-shot")) {
    return trimmed.replace(/^html\.exporting-shot\b/, `html.exporting-shot ${scopeSelectorText}`);
  }

  if (trimmed.startsWith("body.wide")) {
    return trimmed.replace(/^body\.wide\b/, `${scopeSelectorText}.wide`);
  }

  if (trimmed.startsWith("#doc")) {
    return trimmed.replace(/^#doc\b/, scopeSelectorText);
  }

  const dirMatch = trimmed.match(/^(\[dir=(?:"|')?(?:rtl|ltr)(?:"|')?\])(?:\s+(.*))?$/);
  if (dirMatch) {
    return `${dirMatch[1]} ${scopeSelectorText}${dirMatch[2] ? ` ${dirMatch[2]}` : ""}`;
  }

  return `${scopeSelectorText} ${trimmed}`;
};

const scopeSelectorList = (selectorText: string, scopeSelectorText: string): string =>
  selectorText
    .split(",")
    .map((selector) => scopeSelector(selector, scopeSelectorText))
    .filter(Boolean)
    .join(",\n");

export const scopeResumeCss = (
  rawCss: string,
  scopeSelectorText = RESUME_ISOLATION_SELECTOR,
): string => {
  const css = stripCssComments(rawCss);
  let output = "";
  let cursor = 0;

  while (cursor < css.length) {
    const openIndex = css.indexOf("{", cursor);
    if (openIndex === -1) {
      output += css.slice(cursor);
      break;
    }

    const prelude = css.slice(cursor, openIndex).trim();
    const closeIndex = findRuleEnd(css, openIndex);
    const body = css.slice(openIndex + 1, closeIndex);

    if (!prelude) {
      cursor = closeIndex + 1;
      continue;
    }

    if (/^@(media|supports|container)\b/.test(prelude)) {
      output += `${prelude} {\n${scopeResumeCss(body, scopeSelectorText)}\n}\n`;
    } else if (prelude.startsWith("@")) {
      output += `${prelude} {${body}}\n`;
    } else {
      output += `${scopeSelectorList(prelude, scopeSelectorText)} {${body}}\n`;
    }

    cursor = closeIndex + 1;
  }

  return output;
};

export const buildIsolatedResumeCss = (
  rawCss: string,
  scopeSelectorText = RESUME_ISOLATION_SELECTOR,
): string => `
  ${scopeSelectorText},
  ${scopeSelectorText} *,
  ${scopeSelectorText} *::before,
  ${scopeSelectorText} *::after {
    all: revert;
    box-sizing: border-box;
    line-height: normal;
  }

  ${scopeSelectorText} {
    display: block;
    direction: inherit;
    unicode-bidi: isolate;
    font-family: 'Heebo', Arial, sans-serif;
    color: var(--ink, #2a2f3a);
    -webkit-font-smoothing: antialiased;
  }

  ${scopeResumeCss(rawCss, scopeSelectorText)}
`;

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
