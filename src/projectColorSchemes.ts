import type { Project } from "./types";

type ProjectColorScheme = Project["colorScheme"];

export const PROJECT_COLOR_SCHEME_BY_ID: Record<string, ProjectColorScheme> = {
  "discount-credit-loan": {
    primary: "bg-emerald-500",
    bg: "bg-emerald-50/50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    gradient: "from-emerald-500 to-teal-600",
  },
  "discount-activex-bridge": {
    primary: "bg-blue-600",
    bg: "bg-blue-50/50",
    text: "text-blue-700",
    border: "border-blue-200",
    gradient: "from-blue-600 to-indigo-700",
  },
  "discount-vue-dashboard": {
    primary: "bg-cyan-500",
    bg: "bg-cyan-50/50",
    text: "text-cyan-700",
    border: "border-cyan-200",
    gradient: "from-cyan-500 to-blue-600",
  },
  "eitan-work-platform": {
    primary: "bg-purple-500",
    bg: "bg-purple-50/50",
    text: "text-purple-700",
    border: "border-purple-200",
    gradient: "from-purple-500 to-indigo-600",
  },
  "ai-financial-assistant": {
    primary: "bg-amber-500",
    bg: "bg-amber-50/50",
    text: "text-amber-700",
    border: "border-amber-200",
    gradient: "from-amber-500 to-orange-600",
  },
};

export const PROJECT_COLOR_SCHEME_BY_CATEGORY: Record<Project["category"], ProjectColorScheme> = {
  enterprise: PROJECT_COLOR_SCHEME_BY_ID["discount-credit-loan"],
  modern: PROJECT_COLOR_SCHEME_BY_ID["eitan-work-platform"],
  ai: PROJECT_COLOR_SCHEME_BY_ID["ai-financial-assistant"],
};

const accidentalNeutralGradient = (from: string, to: string) => `from-[#${from}] to-[#${to}]`;

const ACCIDENTAL_NEUTRAL_GRADIENTS = new Set([
  accidentalNeutralGradient("262a33", "474d5a"),
  accidentalNeutralGradient("34453f", "566b60"),
  accidentalNeutralGradient("a8541f", "e07631"),
]);

function isAccidentalNeutralColorScheme(colorScheme: ProjectColorScheme | undefined) {
  return Boolean(
    colorScheme &&
    colorScheme.primary === "bg-[#1A1A1A]" &&
    colorScheme.bg === "bg-[#E7E1D3]" &&
    colorScheme.text === "text-[#1A1A1A]" &&
    colorScheme.border === "border-black/10" &&
    ACCIDENTAL_NEUTRAL_GRADIENTS.has(colorScheme.gradient),
  );
}

export function getPortfolioProjectColorScheme(project: Pick<Project, "id" | "category" | "colorScheme">) {
  if (!isAccidentalNeutralColorScheme(project.colorScheme)) {
    return project.colorScheme;
  }

  return PROJECT_COLOR_SCHEME_BY_ID[project.id] ?? PROJECT_COLOR_SCHEME_BY_CATEGORY[project.category];
}

export function restorePortfolioProjectColorSchemes<T extends Project>(projects: T[]) {
  return projects.map(project => {
    const colorScheme = getPortfolioProjectColorScheme(project);

    if (colorScheme === project.colorScheme) {
      return project;
    }

    return {
      ...project,
      colorScheme,
    };
  });
}
