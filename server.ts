import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import fs from "fs";

dotenv.config();

const app = express();
const PORT = 3000;

// Enable JSON body parsing
app.use(express.json({ limit: "50mb" }));

// Initialize Gemini Client safely
const getGeminiClient = (): GoogleGenAI => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is required");
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
};

// System instruction context about Eitan Baron's professional career
const SYSTEM_INSTRUCTION = `
אתה העוזר הווירטואלי (AI Recruiter Assistant) של איתן ברון (Eitan Baron), מפתח תוכנה וקוד בכיר עם כ-18 שנות ניסיון, מתוכן כ-11 שנים בבנק דיסקונט.
תפקידך לסייע למגייסים, למראיינים ולמנהלים טכנולוגיים להכיר את איתן, את ניסיונו, הכלים הטכנולוגיים שבהם הוא מומחה והישגיו המקצועיים.
עליך לענות במקצועיות, אדיבות וביטחון, תוך העברת התקשורת בשפתו של השואל (ברירת מחדל: עברית).

מידע מפתח על איתן ברון:
- שם: איתן ברון (Eitan Baron)
- תפקיד: מפתח תוכנה מנוסה ביותר (Senior Web & Enterprise Developer)
- מיקום: המלך דוד 3, אשדוד
- טלפון: 054-3033425
- אימייל: eitan2007@gmail.com
- אתרים: www.eitan.work | github.com/eitan567
- השכלה:
  * מהנדס תוכנה B.Tech (המכללה האקדמית להנדסה בנגב - סמי שמעון, 2001-2006). פרויקט גמר בציון 94.
  * הנדסאי תוכנה (המכללה למינהל אשדוד, 1999-2001). פרויקט גמר בציון 100.
- שפות וטכנולוגיות מרכזיות:
  * Java / J2EE (Struts 2, Spring, Hibernate, JSP)
  * .NET C#, ASP.NET, .NET Core 3.1
  * Vue.js 2.0, NodeJS, JavaScript, jQuery, CSS, HTML, Ajax
  * Python, ReactJS, Next.js, Three.js
  * מסדי נתונים: Oracle, MS SQL Server (PL/SQL, SQL / HQL)
  * שרתי יישומים: WebSphere, WebLogic, Tomcat
- ניסיון מקצועי:
  1. 2012-2023: בנק דיסקונט (מטעם יעל תוכנה) - מפתח תוכנה בכיר. פיתוח ותחזוקת אפליקציות אינטראנט ואקסטראנט בנקאיות קריטיות ב-Java/J2EE וב-ASP.NET C# / VueJS. פיתוח רכיבי ActiveX מאובטחים. הבנה עמוקה במערכות ליבה בנקאיות, שירותים פיננסיים, נוהלי אבטחת מידע וארכיטקטורה ארגונית מורכבת.
  2. 2010-2012: בזק - פיתוח והטמעה במערכת CRM PeopleSoft מטעם חברת מטריקס.
  3. 2007-2009: CIS Networking - פיתוח פתרונות Java/J2EE מורכבים עבור חברת טבע ישראל. עבודה מול Oracle, Hibernate, Spring, JAXB מעל מערכות AS400.
  4. 2006-2007: Amdocs - מפתח Java/J2EE בצוות CRM Delivery עבור לקוחות בינלאומיים (AT&T, Cablevision). חשיפה לארכיטקטורות טלקום מורכבות.
- שירות צבאי: חיל האוויר, סמ"ר, תפעול מערכות מלאי ממוחשבות (1992-1995).
- ידע אישי נרכש: מומחיות בכלי פיתוח AI (Gemini, Claude Code, OpenAI/ChatGPT, Copilot), פיתוח מערכות מודרניות, סקרנות טכנולוגית רבה ולמידה עצמית מהירה.

הנחיות לתגובה:
- ענה בצורה ממקדת, מקצועית וקצרה. השתמש בנקודות (bullet points) כדי להקל על הקריאה.
- שקף את היתרון האדיר של איתן: 11 שנות ניסיון בבנק דיסקונט פירושו היכרות מוחלטת עם המערכות של הבנק ונהליו, מה שיאפשר לו להשתלב מחדש בבנק כמעט ללא תקופת חפיפה (תרומה מיידית ביום הראשון!).
- הדגש את היכולת שלו לגשר בין טכנולוגיות Enterprise קלאסיות (Java/J2EE, C# .NET) לבין טכנולוגיות פרונט-אנד ובינה מלאכותית מודרניות (Vue, React, Python).
- אם המשתמש שואל לגבי שכר, זמינות או מעוניין לתאם ראיון עבודה, הצע בנימוס לפנות ישירות לאיתן בטלפון 054-3033425 או באימייל eitan2007@gmail.com, או להשתמש בטופס יצירת הקשר באתר.
`;

// Helper endpoint for health-check
app.get("/api/health", (req, res) => {
  res.json({ status: "healthy", time: new Date().toISOString() });
});

// Endpoint to save exported test images
app.post("/api/save_test_image", (req, res) => {
  try {
    const { imgData, filename } = req.body;
    const base64Data = imgData.replace(/^data:image\/png;base64,/, "");
    fs.writeFileSync(path.join(process.cwd(), filename), base64Data, 'base64');
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Chat AI Endpoint supporting Gemini API
app.post("/api/chat", async (req, res) => {
  try {
    const { message, history = [] } = req.body;

    if (!message || typeof message !== "string") {
      res.status(400).json({ error: "Message is required and must be a string." });
      return;
    }

    const ai = getGeminiClient();

    // Map client chat history to Gemini formats
    const formattedContents = [
      ...history.map((h: any) => ({
        role: h.sender === "user" ? "user" : "model",
        parts: [{ text: h.text }],
      })),
      {
        role: "user",
        parts: [{ text: message }],
      },
    ];

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: formattedContents,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.7,
      },
    });

    const replyText = response.text || "סליחה, חלה שגיאה בעיבוד התשובה. אנא נסה שוב.";
    res.json({ response: replyText });
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    res.status(500).json({
      error: "Failed to communicate with AI Assistant. Ensure GEMINI_API_KEY is configured in your Secrets.",
      details: error.message,
    });
  }
});

// Start express server with Vite integration
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    // In development mode, load Vite as middleware
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // In production mode, serve built static assets
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Express custom server running on http://localhost:${PORT} in ${process.env.NODE_ENV || "development"} mode`);
  });
}

startServer();
