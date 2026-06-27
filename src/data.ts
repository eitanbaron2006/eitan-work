import { Project } from "./types";
import { PROJECT_COLOR_SCHEME_BY_ID } from "./projectColorSchemes";

export const PORTFOLIO_PROJECTS: Project[] = [
  {
    id: "discount-credit-loan",
    title: "פורטל האשראי וההלוואות של בנק דיסקונט",
    subtitle: "ניהול, תחזוקה ושדרוג מערכות הליבה של האשראי הבנקאי",
    description: "פיתוח שדרוגים קריטיים במערכת האשראי של הבנק באמצעות Java/J2EE, Struts 2 ו-SQL מול בסיס הנתונים Oracle.",
    longDescription: "במהלך 11 שנות עבודתי בבנק דיסקונט (מטעם יעל תוכנה), הובלתי וניהלתי שדרוגי תוכנה קריטיים במערכת הלוגיסטיקה והאשראי של הבנק, תוך אינטגרציה מורכבת מול מערכות ליבה פיננסיות קודמות. הפיתוח התבצע בסביבת Java/J2EE עם פלטפורמות Struts 2 ו-Tiles, ושאילתות SQL ו-HQL אופטימליות מול Oracle.",
    category: "enterprise",
    categoryLabel: "בנקאות ו-Enterprise",
    tags: ["Java / J2EE", "Struts 2", "Oracle SQL", "Enterprise Backend", "Bank Core"],
    role: "מפתח תוכנה בכיר (יעל תוכנה)",
    period: "2012 – 2023",
    iconName: "ShieldCheck",
    colorScheme: PROJECT_COLOR_SCHEME_BY_ID["discount-credit-loan"],
    features: [
      "אינטגרציה מאובטחת מול מערכות ליבה פיננסיות ושינויי רגולציה בנקאית",
      "כתיבת שאילתות מורכבות ופרוצדורות מול מסד הנתונים Oracle לייעול ביצועים במאות אחוזים",
      "הטמעת פרוטוקולי פיתוח בנקאיים קפדניים ואבטחת מידע מחמירה ביותר",
      "עבודה שוטפת מול מנתחי מערכות ומשתמשי קצה בנקאיים"
    ]
  },
  {
    id: "discount-activex-bridge",
    title: "מערכת ActiveX מאובטחת ל-IE11",
    subtitle: "רכיב אינטגרציה של חומרה מקומית בתוך רשת בנקאית מאובטחת",
    description: "פיתוח של רכיב ActiveX מותאם ב-ASP.NET C# שמקשר בין דפדפני Enterprise לחומרה משרדית סרוקה.",
    longDescription: "פרויקט ייעודי שפתר צורך קריטי בבנק דיסקונט על ידי גישור פער חומרתי: פיתוח של רכיב ActiveX מאובטח ל-IE11 המאפשר לאפליקציית ה-Web ב-ASP.NET לתקשר באופן ישיר ויציב עם חומרת סריקה, חתימה וקריאת שקים בעמדות הטלרים בבנק.",
    category: "enterprise",
    categoryLabel: "בנקאות ו-Enterprise",
    tags: ["ASP.NET", "C#", "ActiveX", "Hardware Integration", "Windows Forms"],
    role: "מפתח תוכנה ואינטגרציה",
    period: "2016 – 2018",
    iconName: "Cpu",
    colorScheme: PROJECT_COLOR_SCHEME_BY_ID["discount-activex-bridge"],
    features: [
      "גישור פערים טכנולוגיים בין סביבות דפדפן Web לחומרה מקומית (סורקים קוראי צ'קים)",
      "עבודה הדוקה עם דפדפני Enterprise ונהלי אבטחה של Windows",
      "פיתוח פתרונות לשיפור חוויית הלקוח וקיצור זמני הסריקה בסניפים"
    ]
  },
  {
    id: "discount-vue-dashboard",
    title: "לוח בקרה ניהולי (Vue.js 2.0 & .NET Core 3.1)",
    subtitle: "מערכת ניהול ובקרה עבור אפליקציות פיננסיות של הבנק",
    description: "פיתוח ממשק משתמש מתקדם ומודרני ב-Vue.js 2.0 המתחבר ל-API מהיר במיוחד שנכתב ב-.NET Core 3.1.",
    longDescription: "הובלת מודרניזציה של אפליקציות פנימיות בבנק על ידי פיתוח לוח בקרה ואנליטיקה מודרני ב-Vue.js 2.0 ו-jQuery. בצד השרת פותחו שירותי API מהירים ב-.NET Core 3.1, המאפשרים שליפה ודיווח בזמן אמת של עסקאות ומצב הלוואות.",
    category: "enterprise",
    categoryLabel: "בנקאות ו-Enterprise",
    tags: ["Vue.js 2.0", ".NET Core 3.1", "C# API", "Web Dashboards", "Modern Frontend"],
    role: "מפתח Full-Stack",
    period: "2020 – 2022",
    iconName: "LayoutDashboard",
    colorScheme: PROJECT_COLOR_SCHEME_BY_ID["discount-vue-dashboard"],
    features: [
      "פיתוח ארכיטקטורה מודרנית מבוססת REST API מהיר ויציב",
      "ייעול זמני פיתוח וקצב תגובה של הממשק ב-Vue.js תוך הטמעת דפוסי כתיבה מתקדמים",
      "תצוגה ויזואלית מתקדמת של נתונים פיננסיים בזמן אמת"
    ]
  },
  {
    id: "eitan-work-platform",
    title: "פלטפורמת הבית ו-Full-Stack Apps (eitan.work)",
    subtitle: "אפליקציות מודרניות מבוססות React, Next.js ו-Three.js",
    description: "הקמה ופיתוח עצמאי של eitan.work - פיתוח מהיר, עשיר ויזואלית ומותאם אישית לצרכים מגוונים.",
    longDescription: "פיתוח פלטפורמה אישית ויישום אפליקציות עצמאיות מודרניות ב-ReactJS, Next.js ו-Three.js. הפרויקט מדגים שימוש בכלים עדכניים בפיתוח Front-end מורכב, אנימציות עשירות, עיצוב ריספונסיבי מלוטש ב-Tailwind CSS ולוגיקה מורכבת.",
    category: "modern",
    categoryLabel: "טכנולוגיות אינטרנט",
    tags: ["ReactJS", "Next.js", "Three.js", "Tailwind CSS", "Full-Stack Web"],
    role: "מפתח יוצר ועצמאי",
    period: "2024 – 2026",
    iconName: "Globe",
    colorScheme: PROJECT_COLOR_SCHEME_BY_ID["eitan-work-platform"],
    features: [
      "שילוב קוד תלת-ממדי אינטראקטיבי ומתקדם עם Three.js להמחשת ממשקי משתמש מרהיבים",
      "פיתוח Full-Stack מבוסס ענן וארכיטקטורה מבוזרת עם זמני טעינה מהירים במיוחד",
      "רמת גימור וביצועים גבוהים במיוחד המותאמים למובייל ולמסכים רחבים"
    ]
  },
  {
    id: "ai-financial-assistant",
    title: "סוכן בינה מלאכותית לניתוח נתונים (AI Analyst Bot)",
    subtitle: "שילוב סוכני AI לניתוח וחיפוש קטלוג נתונים ומידע פיננסי",
    description: "בוט פיננסי חכם העושה שימוש במודלי שפה של OpenAI ו-Gemini לחיפוש תשובות, ניתוח דוחות והנגשת נתונים.",
    longDescription: "פיתוח יישום AI מתקדם המשלב סוכנים וחיבורי API ל-OpenAI ול-Gemini SDK. הבוט מסוגל לקרוא דוחות כספיים, לנתח מגמות, ולספק סיכומים ותשובות קריאות בעברית ובאנגלית למראיינים ומגייסים בצורה אוטומטית.",
    category: "ai",
    categoryLabel: "עולמות ה-AI וחדשנות",
    tags: ["OpenAI API", "Google Gemini SDK", "Python Agent", "RAG", "AI Tools Integration"],
    role: "מפתח פתרונות בינה מלאכותית",
    period: "2025 – 2026",
    iconName: "Sparkles",
    colorScheme: PROJECT_COLOR_SCHEME_BY_ID["ai-financial-assistant"],
    features: [
      "שימוש בשיטות RAG (Retrieval-Augmented Generation) לחיפוש ומענה מהיר מבין מאות מסמכים",
      "הנגשת מידע פיננסי וטכני מורכב לשפת אנושית פשוטה, אינטואיטיבית ונוחה לכל מנהל",
      "אינטגרציה מאובטחת בצד שרת בלבד לשמירה מוחלטת על מפתחות ה-API"
    ]
  }
];

export const PROFILE_STATS = [
  { label: "שנות ניסיון", value: "18+" },
  { label: "שנים בדיסקונט", value: "11" },
  { label: "פרויקטים שהוביל", value: "25+" },
  { label: "שפות תכנות", value: "10+" }
];

export const CORE_SKILLS = [
  { name: "Java / J2EE", level: "95%" },
  { name: "ASP.NET C#", level: "95%" },
  { name: ".NET Core 3.1", level: "90%" },
  { name: "Vue.js 2.0 / JavaScript", level: "92%" },
  { name: "Oracle / MS SQL Server", level: "95%" },
  { name: "ReactJS & Next.js", level: "88%" },
  { name: "Python / AI APIs", level: "85%" }
];
