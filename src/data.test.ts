import test from "node:test";
import assert from "node:assert/strict";
import { PORTFOLIO_PROJECTS } from "./data";
import { restorePortfolioProjectColorSchemes } from "./projectColorSchemes";
import type { Project } from "./types";

const accidentalNeutralGradient = (from: string, to: string) => `from-[#${from}] to-[#${to}]`;

test("portfolio project cards keep their original colorful gradients", () => {
  assert.deepEqual(
    PORTFOLIO_PROJECTS.map(project => [project.id, project.colorScheme.gradient]),
    [
      ["discount-credit-loan", "from-emerald-500 to-teal-600"],
      ["discount-activex-bridge", "from-blue-600 to-indigo-700"],
      ["discount-vue-dashboard", "from-cyan-500 to-blue-600"],
      ["eitan-work-platform", "from-purple-500 to-indigo-600"],
      ["ai-financial-assistant", "from-amber-500 to-orange-600"],
    ],
  );
});

test("cached neutral portfolio project colors are restored without changing project content", () => {
  const cachedProjects: Project[] = PORTFOLIO_PROJECTS.map(project => ({
    ...project,
    title: `${project.title} cached`,
    colorScheme: {
      primary: "bg-[#1A1A1A]",
      bg: "bg-[#E7E1D3]",
      text: "text-[#1A1A1A]",
      border: "border-black/10",
      gradient: project.category === "ai"
        ? accidentalNeutralGradient("a8541f", "e07631")
        : project.category === "modern"
          ? accidentalNeutralGradient("34453f", "566b60")
          : accidentalNeutralGradient("262a33", "474d5a"),
    },
  }));

  const restoredProjects = restorePortfolioProjectColorSchemes(cachedProjects);

  assert.deepEqual(
    restoredProjects.map(project => [project.id, project.title, project.colorScheme.gradient]),
    [
      ["discount-credit-loan", "פורטל האשראי וההלוואות של בנק דיסקונט cached", "from-emerald-500 to-teal-600"],
      ["discount-activex-bridge", "מערכת ActiveX מאובטחת ל-IE11 cached", "from-blue-600 to-indigo-700"],
      ["discount-vue-dashboard", "לוח בקרה ניהולי (Vue.js 2.0 & .NET Core 3.1) cached", "from-cyan-500 to-blue-600"],
      ["eitan-work-platform", "פלטפורמת הבית ו-Full-Stack Apps (eitan.work) cached", "from-purple-500 to-indigo-600"],
      ["ai-financial-assistant", "סוכן בינה מלאכותית לניתוח נתונים (AI Analyst Bot) cached", "from-amber-500 to-orange-600"],
    ],
  );
});

test("custom project colors are preserved when they are not the accidental neutral palette", () => {
  const customProject: Project = {
    ...PORTFOLIO_PROJECTS[0],
    id: "custom-project",
    colorScheme: {
      primary: "bg-custom-primary",
      bg: "bg-custom-bg",
      text: "text-custom",
      border: "border-custom",
      gradient: "from-custom-start to-custom-end",
    },
  };

  assert.equal(
    restorePortfolioProjectColorSchemes([customProject])[0].colorScheme.gradient,
    "from-custom-start to-custom-end",
  );
});
