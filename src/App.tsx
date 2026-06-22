import React, { useState, useEffect, useRef } from "react";
import { 
  Briefcase, 
  ShieldCheck, 
  Cpu, 
  LayoutDashboard, 
  Globe, 
  Sparkles, 
  Send, 
  Mail, 
  Phone, 
  UserCheck, 
  GraduationCap, 
  ExternalLink, 
  MessageSquareCode, 
  ChevronLeft, 
  ChevronRight,
  Menu, 
  X, 
  Clock, 
  CheckCircle2,
  Calendar,
  Layers,
  ArrowUpRight,
  Lock,
  Plus,
  Trash2,
  Edit,
  LogOut,
  Undo
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { ActiveTab, Project, ChatMessage } from "./types";
import { PORTFOLIO_PROJECTS, PROFILE_STATS, CORE_SKILLS } from "./data";
import { ResumeViewer } from "./components/ResumeViewer";

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("home");
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [projectFilter, setProjectFilter] = useState<string>("all");
  
  // Admin Authorization State
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    return localStorage.getItem("eitan_portfolio_isAdmin") === "true";
  });
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  // Projects State with LocalStorage Caching to support Admin dynamic addition/deletion
  const [projects, setProjects] = useState<Project[]>(() => {
    const cached = localStorage.getItem("eitan_portfolio_projects");
    if (cached) {
      try { return JSON.parse(cached); } catch (e) { }
    }
    return PORTFOLIO_PROJECTS;
  });

  // Project Editor Modal State
  const [showManageModal, setShowAddEditModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  
  // Editor form inputs
  const [formTitle, setFormTitle] = useState("");
  const [formSubtitle, setFormSubtitle] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formLongDesc, setFormLongDesc] = useState("");
  const [formCategory, setFormCategory] = useState<"enterprise" | "modern" | "ai">("enterprise");
  const [formRole, setFormRole] = useState("");
  const [formPeriod, setFormPeriod] = useState("");
  const [formTags, setFormTags] = useState("");
  const [formFeatures, setFormFeatures] = useState("");

  // Cache projects changes
  useEffect(() => {
    localStorage.setItem("eitan_portfolio_projects", JSON.stringify(projects));
  }, [projects]);

  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      sender: "assistant",
      text: "שלום! אני העוזר הווירטואלי של איתן ברון. אשמח לענות על כל שאלה לגבי הניסיון המקצועי שלו בבנק דיסקונט ובאמדוקס, השליטה שלו בטכנולוגיות כגון Java, .NET, Vue, React ובינה מלאכותית, או הרקע האקדמי והצבאי שלו. במה אוכל לעזור לך היום?",
      timestamp: new Date().toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" })
    }
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, isChatLoading]);

  // Pre-configured questions for recruiter ease
  const PRESET_QUESTIONS = [
    { text: "ספר לי על הניסיון של איתן בדיסקונט", short: "הניסיון בדיסקונט 🏦" },
    { text: "באילו טכנולוגיות וכלים איתן שולט?", short: "ארסנל טכנולוגי 💻" },
    { text: "מדוע איתן מתאים במיוחד להשתלבות מהירה?", short: "יתרון השתלבות 🚀" },
    { text: "ספר לי על הפרויקטים העצמאיים וה-AI של איתן", short: "חדשנות ו-AI ✨" }
  ];

  // Admin login handler
  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginPassword === "eitan123") {
      setIsAdmin(true);
      localStorage.setItem("eitan_portfolio_isAdmin", "true");
      setShowLoginModal(false);
      setLoginPassword("");
      setLoginError("");
    } else {
      setLoginError("סיסמה שגויה. נסה שוב (סיסמת הברירת מחדל לפרויקט היא eitan123).");
    }
  };

  // Admin logout handler
  const handleAdminLogout = () => {
    setIsAdmin(false);
    localStorage.removeItem("eitan_portfolio_isAdmin");
  };

  // Form edit project trigger
  const openEditModal = (proj: Project, e: React.MouseEvent) => {
    e.stopPropagation(); // prevent modal expansion trigger
    setEditingProject(proj);
    setFormTitle(proj.title);
    setFormSubtitle(proj.subtitle);
    setFormDesc(proj.description);
    setFormLongDesc(proj.longDescription);
    setFormCategory(proj.category);
    setFormRole(proj.role);
    setFormPeriod(proj.period);
    setFormTags(proj.tags.join(", "));
    setFormFeatures(proj.features.join("\n"));
    setShowAddEditModal(true);
  };

  // Form add project trigger
  const openAddModal = () => {
    setEditingProject(null);
    setFormTitle("");
    setFormSubtitle("");
    setFormDesc("");
    setFormLongDesc("");
    setFormCategory("enterprise");
    setFormRole("מפתח תוכנה");
    setFormPeriod(new Date().getFullYear().toString());
    setFormTags("Java, Next.js");
    setFormFeatures("אינטגרציה מאובטחת\nפיתוח בצד השרת");
    setShowAddEditModal(true);
  };

  // Save changes handler (Add/Edit)
  const handleSaveProject = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formTitle.trim() || !formDesc.trim()) return;

    const tagsArray = formTags.split(",").map(t => t.trim()).filter(t => t.length > 0);
    const featuresArray = formFeatures.split("\n").map(f => f.trim()).filter(f => f.length > 0);

    const categoryLabelMap = {
      enterprise: "בנקאות ו-Enterprise",
      modern: "טכנולוגיות Web",
      ai: "עולמות ה-AI וחדשנות"
    };

    const gradientMap = {
      enterprise: "from-emerald-500 to-teal-600",
      modern: "from-purple-500 to-indigo-600",
      ai: "from-amber-500 to-orange-600"
    };

    if (editingProject) {
      // Edit
      setProjects(prev => prev.map(p => {
        if (p.id === editingProject.id) {
          return {
            ...p,
            title: formTitle,
            subtitle: formSubtitle,
            description: formDesc,
            longDescription: formLongDesc,
            category: formCategory,
            categoryLabel: categoryLabelMap[formCategory],
            tags: tagsArray,
            role: formRole,
            period: formPeriod,
            features: featuresArray,
            colorScheme: {
              ...p.colorScheme,
              gradient: gradientMap[formCategory]
            }
          };
        }
        return p;
      }));
    } else {
      // Add
      const newProj: Project = {
        id: `project-${Date.now()}`,
        title: formTitle,
        subtitle: formSubtitle,
        description: formDesc,
        longDescription: formLongDesc,
        category: formCategory,
        categoryLabel: categoryLabelMap[formCategory],
        tags: tagsArray,
        role: formRole,
        period: formPeriod,
        iconName: formCategory === "ai" ? "Sparkles" : formCategory === "enterprise" ? "ShieldCheck" : "Globe",
        features: featuresArray,
        colorScheme: {
          primary: "bg-blue-600",
          bg: "bg-blue-50/50",
          text: "text-blue-700",
          border: "border-blue-200",
          gradient: gradientMap[formCategory]
        }
      };
      setProjects(prev => [newProj, ...prev]);
    }

    setShowAddEditModal(false);
  };

  // Delete project handler
  const handleDeleteProject = (projId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("האם אתה בטוח שברצונך למחוק פרויקט זה מתיק העבודות?")) {
      setProjects(prev => prev.filter(p => p.id !== projId));
    }
  };

  // Reset projects to default values cached in static data
  const handleResetToBackup = () => {
    if (confirm("האם ברצונך לאפס את תיק העבודות ולהחזיר את פרויקטי הברירת מחדל של איתן ברון?")) {
      setProjects(PORTFOLIO_PROJECTS);
    }
  };

  // Send message handler
  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: "user",
      text: textToSend,
      timestamp: new Date().toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" })
    };

    setChatMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    setIsChatLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: textToSend,
          history: chatMessages.slice(-8)
        })
      });

      const data = await response.json();
      
      const assistantMessage: ChatMessage = {
        id: `msg-ans-${Date.now()}`,
        sender: "assistant",
        text: data.response || "סליחה, חלה שגיאה בעיבוד התשובה. אנא נסה שוב.",
        timestamp: new Date().toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" })
      };
      
      setChatMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      console.error(err);
      setChatMessages(prev => [
        ...prev,
        {
          id: `msg-err-${Date.now()}`,
          sender: "assistant",
          text: "שגיאת תקשורת עם שרת ה-AI. אנא ודא שמפתחות API הוגדרו בצורה מוסמכת ב-Secrets.",
          timestamp: new Date().toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" })
        }
      ]);
    } finally {
      setIsChatLoading(false);
    }
  };

  // Filter projects by category
  const filteredProjects = projectFilter === "all" 
    ? projects 
    : projects.filter(p => p.category === projectFilter);

  // Icon mapper helper
  const renderProjectIcon = (name: string, classNameString: string) => {
    switch (name) {
      case "ShieldCheck": return <ShieldCheck className={classNameString} />;
      case "Cpu": return <Cpu className={classNameString} />;
      case "LayoutDashboard": return <LayoutDashboard className={classNameString} />;
      case "Globe": return <Globe className={classNameString} />;
      case "Sparkles": return <Sparkles className={classNameString} />;
      default: return <Layers className={classNameString} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F1EA] text-[#1A1A1A] font-sans flex flex-col selection:bg-black/15 selection:text-black" dir="rtl">
      
      {/* Upper Elegant Header Bar */}
      <header className="sticky top-0 z-45 bg-[#F4F1EA]/95 backdrop-blur-md border-b border-black/10 transition-all duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-24">
            
            {/* Branding / Human Name */}
            <div className="flex items-center gap-4">
              <div 
                className="w-12 h-12 rounded-none bg-[#1A1A1A] flex items-center justify-center text-[#FAF9F6] font-sans font-black text-xl cursor-pointer hover:bg-[#e07631] transition-colors duration-200" 
                onClick={() => setActiveTab("home")}
              >
                אב
              </div>
              <div onClick={() => setActiveTab("home")} className="cursor-pointer flex flex-col">
                <div className="flex items-baseline gap-2">
                  <h1 className="text-3xl font-sans font-black tracking-tighter leading-none uppercase text-[#1A1A1A]">איתן ברון</h1>
                  {isAdmin && (
                    <span className="bg-[#e07631]/10 text-[#e07631] px-2 py-0.5 rounded text-[9px] font-black tracking-wider animate-pulse flex items-center gap-1">
                      <Lock className="w-2.5 h-2.5" />
                      מנהל
                    </span>
                  )}
                </div>
                <p className="text-xs font-sans text-[#1A1A1A]/80 font-bold mt-1">מפתח תוכנה בכיר • מומחה מערכות אנטרפרייז ובנקאות</p>
              </div>
            </div>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-6">
              <button 
                onClick={() => setActiveTab("home")}
                className={`text-sm font-sans font-bold pb-1 border-b-2 transition-all duration-150 ${activeTab === "home" ? "border-black text-[#1A1A1A]" : "border-transparent text-[#1A1A1A]/60 hover:text-black"}`}
              >
                פרופיל &amp; אודות
              </button>
              <button 
                onClick={() => setActiveTab("portfolio")}
                className={`text-sm font-sans font-bold pb-1 border-b-2 transition-all duration-150 ${activeTab === "portfolio" ? "border-black text-[#1A1A1A]" : "border-transparent text-[#1A1A1A]/60 hover:text-black"}`}
              >
                תיק פרויקטים
              </button>
              <button 
                onClick={() => setActiveTab("resume")}
                className={`text-sm font-sans font-bold pb-1 border-b-2 transition-all duration-150 ${activeTab === "resume" ? "border-black text-[#1A1A1A]" : "border-transparent text-[#1A1A1A]/60 hover:text-black"}`}
              >
                קורות חיים מלאים
              </button>
              <button 
                onClick={() => setActiveTab("chat")}
                className={`text-sm font-sans font-bold pb-1 border-b-2 transition-all duration-150 flex items-center gap-1.5 ${activeTab === "chat" ? "border-[#e07631] text-[#e07631]" : "border-transparent text-[#e07631]/75 hover:text-[#e07631]"}`}
              >
                <Sparkles className="w-4 h-4" />
                צ'אט AI
              </button>
              {isAdmin && (
                <button
                  onClick={handleAdminLogout}
                  className="mr-2 p-1 px-2 border border-black/10 hover:border-black text-xs font-sans text-[#e07631] font-bold flex items-center gap-1 transition-colors"
                  title="התנתק ממצב המנהל"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  התנתקות
                </button>
              )}
            </nav>

            {/* Mobile menu trigger */}
            <div className="flex items-center md:hidden">
              <button 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2.5 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>

          </div>
        </div>

        {/* Mobile Navigation List */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-[#F4F1EA] border-b border-black/10 overflow-hidden"
            >
              <div className="px-4 pt-2 pb-6 space-y-2">
                <button 
                  onClick={() => { setActiveTab("home"); setMobileMenuOpen(false); }}
                  className={`w-full text-right px-4 py-3 text-sm font-sans font-bold block ${activeTab === "home" ? "bg-black/5 text-[#e07631]" : "text-[#1A1A1A]/80"}`}
                >
                  פרופיל &amp; אודות
                </button>
                <button 
                  onClick={() => { setActiveTab("portfolio"); setMobileMenuOpen(false); }}
                  className={`w-full text-right px-4 py-3 text-sm font-sans font-bold block ${activeTab === "portfolio" ? "bg-black/5 text-[#e07631]" : "text-[#1A1A1A]/80"}`}
                >
                  תיק פרויקטים
                </button>
                <button 
                  onClick={() => { setActiveTab("resume"); setMobileMenuOpen(false); }}
                  className={`w-full text-right px-4 py-3 text-sm font-sans font-bold block ${activeTab === "resume" ? "bg-black/5 text-[#e07631]" : "text-[#1A1A1A]/80"}`}
                >
                  קורות חיים מלאים
                </button>
                <button 
                  onClick={() => { setActiveTab("chat"); setMobileMenuOpen(false); }}
                  className={`w-full text-right px-4 py-3 text-sm font-sans font-bold flex items-center gap-2 ${activeTab === "chat" ? "bg-[#e07631]/10 text-[#e07631]" : "text-[#e07631]"}`}
                >
                  <Sparkles className="w-4 h-4 text-[#e07631]" />
                  צ'אט AI לראיונות
                </button>
                {isAdmin && (
                  <button 
                    onClick={() => { handleAdminLogout(); setMobileMenuOpen(false); }}
                    className="w-full text-right px-4 py-3 text-sm font-sans font-bold text-[#e07631] flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    התנתק ממצב מנהל
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Main View Container */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <AnimatePresence mode="wait">
          
          {/* TAB 1: HOME */}
          {activeTab === "home" && (
            <motion.div
              key="home-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="space-y-12 sm:space-y-16"
            >
              
              {/* Premium Hero Section */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center p-8 sm:p-12 relative">
                {/* Visual grid pattern / no background blurs for a clean editorial look */}

                {/* Left Text Block */}
                <div className="lg:col-span-8 space-y-6">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#EFEEED] text-xs font-sans font-bold text-[#1A1A1A] border border-black/10">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#e07631]" />
                    זמין להשתלבות מהירה בבנק דיסקונט / משרות פיתוח בכירות
                  </div>
                  
                  <h2 className="text-3xl sm:text-4xl lg:text-5xl font-sans font-black mb-4 leading-tight text-[#1A1A1A]">
                    מפתח תוכנה וקוד עם <span className="text-[#e07631] underline decoration-2 decoration-solid underline-offset-8">18 שנות מומחיות</span>
                  </h2>
                  
                  <p className="text-base sm:text-lg text-[#1A1A1A] leading-relaxed max-w-3xl font-sans">
                    שלום, אני <strong className="text-[#1A1A1A] font-extrabold">איתן ברון</strong>. 11 שנים מהקריירה שלי הוקדשו לפיתוח, כתיבה ואופטימיזציה של מערכות הליבה בבנק דיסקונט. כמי שמכיר היטב את תשתיות הבנק, הדאטאבייסים, אבטחת המידע והתרבות הארגונית שלו – אני יציב, יעיל ומביא איתי ערך קריטי של <span className="text-black font-extrabold underline decoration-[#e07631] decoration-2">תרומה מיידית ללא תקופת חפיפה מורכבת</span>.
                  </p>

                  <p className="text-xs sm:text-sm text-[#1A1A1A]/90 font-sans tracking-wide max-w-3xl leading-relaxed border-t border-black/10 pt-4">
                    אני משלב יציבות חסרת פשרות של תשתיות קלאסיות (<span className="ltr text-black font-bold text-xs sm:text-sm">Java, Struts, ASP.NET, SQL</span>) יחד עם חדשנות טכנולוגית בקצה העליון (<span className="ltr text-black font-bold text-xs sm:text-sm">Vue.js, React, Next.js, AI Codegen</span>).
                  </p>

                  {/* Desktop Actions */}
                  <div className="flex flex-wrap gap-4 pt-4">
                    <button 
                      onClick={() => setActiveTab("chat")}
                      className="px-8 py-3.5 bg-black hover:bg-[#e07631] text-white text-xs font-sans font-extrabold cursor-pointer transition-colors duration-150 flex items-center gap-2"
                    >
                      <Sparkles className="w-4 h-4 text-[#e07631]" />
                      שאל את עוזר ה-AI
                    </button>
                    <button 
                      onClick={() => setActiveTab("portfolio")}
                      className="px-8 py-3.5 bg-[#EFEEED] hover:bg-black hover:text-white text-[#1A1A1A] text-xs font-sans font-extrabold cursor-pointer transition-colors duration-150 flex items-center gap-1.5"
                    >
                      <Briefcase className="w-4 h-4" />
                      תיק פרויקטים
                    </button>
                    <button 
                      onClick={() => setActiveTab("resume")}
                      className="px-8 py-3.5 bg-[#FAF9F6] border border-black/20 hover:border-black text-[#1A1A1A] text-xs font-sans font-extrabold cursor-pointer transition-colors duration-150 flex items-center gap-1.5"
                    >
                      <UserCheck className="w-4 h-4" />
                      קורות חיים מלאים
                    </button>
                  </div>
                </div>

                {/* Right Visual Image */}
                <div className="lg:col-span-4 flex flex-col justify-center items-center">
                  <div className="relative p-2 bg-[#FAF9F6] border border-black/10 shadow-2xl">
                    <div className="w-48 h-56 bg-neutral-200 overflow-hidden relative">
                      <img 
                        src="/picture.png"
                        name="איתן ברון - מפתח בכיר"
                        className="w-full h-full object-cover rounded-none"
                      />
                    </div>
                    {/* Retro / Editorial stamp style badge */}
                    <div className="absolute -bottom-4 -left-4 w-12 h-12 bg-black flex items-center justify-center text-white shadow-lg transform rotate-6 border border-black/10">
                      <ShieldCheck className="w-5 h-5 animate-pulse" />
                    </div>
                  </div>
                </div>

              </div>

              {/* Quick Resume Link Card */}
              <div className="bg-[#1A1A1A] p-8 border border-black text-white flex flex-col md:flex-row justify-between items-center gap-6 relative overflow-hidden">
                <div className="space-y-2 text-right">
                  <h3 className="text-xl sm:text-2xl font-sans font-extrabold flex items-center gap-2">
                    מחפש את קורות החיים המלאים להדפסה או שמירה?
                  </h3>
                  <p className="text-sm text-[#FAF9F6]/90 max-w-2xl font-sans">
                    העמוד המקורי ששלחתם שמור כאן בדיוק כמו שהוא, כולל כפתורי ייצוא ישיר ל-PDF, לקובץ Word (DOCX) ולתמונה (PNG)!
                  </p>
                </div>
                <button 
                  onClick={() => setActiveTab("resume")}
                  className="px-6 py-3.5 bg-[#e07631] hover:bg-white hover:text-black text-white text-xs font-sans font-extrabold cursor-pointer transition-colors duration-150 flex items-center gap-1.5 whitespace-nowrap"
                >
                  הצג את קורות החיים 
                  <ArrowUpRight className="w-4 h-4 ml-1" />
                </button>
              </div>

              {/* Grid of Key Features & Competitive Advantages */}
              <div className="space-y-6">
                <div className="text-right border-b border-black/10 pb-4">
                  <h3 className="text-2xl font-sans font-black text-[#1A1A1A]">מדוע כדאי לגייס אותי?</h3>
                  <p className="text-sm text-[#1A1A1A]/85 font-sans font-bold mt-1">היתרונות הייחודיים שאני מביא איתי לכל ארגון טכנולוגי ובנקאי</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  
                  {/* Advantage 1 */}
                  <div className="bg-[#FAF9F6] p-6 border border-black/10 space-y-4 relative">
                    <div className="w-12 h-12 bg-[#EFEEED] border border-black/5 flex items-center justify-center text-[#e07631]">
                      <CheckCircle2 className="w-6 h-6 animate-pulse" />
                    </div>
                    <h4 className="text-lg font-sans font-bold text-[#1A1A1A]">שליפה מיידית לדיסקונט</h4>
                    <p className="text-sm text-[#1A1A1A] leading-relaxed font-sans">
                      עם 11 שנות ניסיון במערכות הליבה של בנק דיסקונט, אבטחת המידע והתרבות הארגונית, אני נכנס לעבודה בראש שקט ומתחיל לתרום ביום הראשון, ללא צורך בהכשרות ארוכות.
                    </p>
                  </div>

                  {/* Advantage 2 */}
                  <div className="bg-[#FAF9F6] p-6 border border-black/10 space-y-4 relative">
                    <div className="w-12 h-12 bg-[#EFEEED] border border-black/5 flex items-center justify-center text-[#1A1A1A]">
                      <Cpu className="w-6 h-6" />
                    </div>
                    <h4 className="text-lg font-sans font-bold text-[#1A1A1A]">גשר בין אנטרפרייז ל-AI</h4>
                    <p className="text-sm text-[#1A1A1A] leading-relaxed font-sans">
                      שולט לחלוטין בקוד התשתיות הקריטיות (Java/C#) לצד טכנולוגיות פרונט-אנד חדישות (Vue/React) ואינטגרציה של פתרונות בינה מלאכותית לייעול פיתוח.
                    </p>
                  </div>

                  {/* Advantage 3 */}
                  <div className="bg-[#FAF9F6] p-6 border border-black/10 space-y-4 relative">
                    <div className="w-12 h-12 bg-[#EFEEED] border border-black/5 flex items-center justify-center text-[#1A1A1A]">
                      <UserCheck className="w-6 h-6" />
                    </div>
                    <h4 className="text-lg font-sans font-bold text-[#1A1A1A]">חשיבה עסקית ובינאישית</h4>
                    <p className="text-sm text-[#1A1A1A] leading-relaxed font-sans">
                      ניסיון רב שנים בעבודה מול מנתחי מערכות, מנהלי מוצר ולקוחות קצה. תקשורת מעולה, אמינות גבוהה ויכולת פתרון בעיות מורכבות תחת לחץ.
                    </p>
                  </div>

                </div>
              </div>

              {/* Statistics & Competencies Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
                
                {/* Stats Widget */}
                <div className="bg-[#FAF9F6] p-8 border border-black/10 space-y-6">
                  <h4 className="text-lg font-sans font-bold text-[#1A1A1A] border-b border-black/10 pb-3">איתן במספרים</h4>
                  <div className="grid grid-cols-2 gap-4">
                    {PROFILE_STATS.map((stat, idx) => (
                      <div key={idx} className="bg-[#EFEEED] p-4 text-center space-y-1 border border-black/5">
                        <div className="text-4xl font-sans font-black text-[#e07631]">{stat.value}</div>
                        <div className="text-xs font-sans font-extrabold uppercase tracking-wider text-[#1A1A1A]">{stat.label}</div>
                      </div>
                    ))}
                  </div>

                  <div className="bg-[#EFEEED] p-4 text-xs text-[#1A1A1A] leading-relaxed border-l-4 border-[#e07631] font-sans">
                    🎓 <strong>הערה אקדמית:</strong> איתן סיים את התואר כמהנדס תוכנה (B.Tech) במכללת סמי שמעון עם ציוני 90+ בכל השפות, ופרויקט גמר מצטיין בציון 94. ההנדסאי שלו הסתיים עם פרויקט גמר ב-VB6 בציון 100!
                  </div>
                </div>

                {/* Level Progress Bars */}
                <div className="bg-[#FAF9F6] p-8 border border-black/10 space-y-4">
                  <h4 className="text-lg font-sans font-bold text-[#1A1A1A] border-b border-black/10 pb-3">שפות ומומחיות טכנולוגית</h4>
                  <div className="space-y-4" dir="ltr">
                    {CORE_SKILLS.map((skill, idx) => (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between text-xs font-sans font-bold uppercase tracking-wider text-[#1A1A1A]">
                          <span>{skill.name}</span>
                          <span className="text-[#1A1A1A]/80">{skill.level}</span>
                        </div>
                        <div className="w-full h-1.5 bg-[#EFEEED] overflow-hidden">
                          <div 
                            className="h-full bg-black" 
                            style={{ width: skill.level }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
              
            </motion.div>
          )}

          {/* TAB 2: PORTFOLIO */}
          {activeTab === "portfolio" && (
            <motion.div
              key="portfolio-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-8"
            >
              
              {/* Filter controls and Intro */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-black/10 pb-6">
                <div>
                  <h3 className="text-2xl font-sans font-black text-[#1A1A1A]">תיק עבודות ופרויקטים נבחרים</h3>
                  <p className="text-sm text-[#1A1A1A]/85 font-sans font-bold mt-1">אוסף פרויקטים טכנולוגיים שפיתחתי בבנק, עבור לקוחות או באופן עצמאי</p>
                </div>

                {/* Filters & Admin Area */}
                <div className="flex flex-wrap items-center gap-3">
                  
                  {/* Category filters */}
                  <div className="flex flex-wrap gap-1 bg-[#EFEEED] p-1 border border-black/5">
                    {[
                      { id: "all", label: "הכל" },
                      { id: "enterprise", label: "מערכות Enterprise ובנקאות" },
                      { id: "modern", label: "טכנולוגיות Web" },
                      { id: "ai", label: "AI וחדשנות" }
                    ].map(btn => (
                      <button
                        key={btn.id}
                        onClick={() => setProjectFilter(btn.id)}
                        className={`px-3 py-1.5 text-xs font-sans font-bold uppercase transition-colors cursor-pointer ${projectFilter === btn.id ? "bg-black text-white" : "text-[#1A1A1A] hover:bg-black/5"}`}
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>

                  {/* Admin specific action buttons */}
                  {isAdmin && (
                    <div className="flex items-center gap-2">
                       <button
                        onClick={openAddModal}
                        className="px-4 py-2 bg-[#e07631] hover:bg-black text-white text-xs font-sans font-bold uppercase flex items-center gap-1.5 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        הוסף פרויקט
                      </button>
                      <button
                        onClick={handleResetToBackup}
                        className="p-2 bg-[#EFEEED] border border-black/10 hover:bg-black hover:text-white text-[#1A1A1A] text-xs font-bold flex items-center gap-1 cursor-pointer"
                        title="איפוס פרויקטי ברירת מחדל"
                      >
                        <Undo className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                </div>
              </div>

              {/* Projects Bento Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProjects.map((project) => (
                  <motion.div
                    key={project.id}
                    layoutId={`project-container-${project.id}`}
                    onClick={() => setSelectedProject(project)}
                    className="bg-[#FAF9F6] border border-black/10 hover:border-black/30 transition-colors duration-150 flex flex-col justify-between overflow-hidden cursor-pointer relative group"
                  >
                    
                    {/* Admin Project Card Edit overlays */}
                    {isAdmin && (
                      <div className="absolute top-2 right-2 z-20 flex items-center gap-1.5 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <button
                          onClick={(e) => openEditModal(project, e)}
                          className="p-1 px-2.5 bg-white text-black border border-black/20 text-xs font-sans font-bold uppercase flex items-center gap-1 shadow-md hover:bg-black hover:text-white cursor-pointer"
                          title="ערוך פרויקט"
                        >
                          <Edit className="w-3.5 h-3.5" />
                          עריכה
                        </button>
                        <button
                          onClick={(e) => handleDeleteProject(project.id, e)}
                          className="p-1 px-2.5 bg-[#e07631] text-white border border-black/10 text-xs font-sans font-bold uppercase flex items-center gap-1 shadow-md hover:bg-black cursor-pointer"
                          title="מחק פרויקט"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          מחיקה
                        </button>
                      </div>
                    )}
                    
                    {/* Upper decorative banner card */}
                    <div className={`h-32 bg-gradient-to-r ${project.colorScheme.gradient} p-6 flex flex-col justify-between relative border-b border-black/15`}>
                      <div className="absolute top-2 left-2 text-white/10">
                        {renderProjectIcon(project.iconName, "w-24 h-24")}
                      </div>
                      <span className="self-end px-2 py-0.5 bg-black/60 text-white font-sans font-bold text-xs uppercase tracking-wider">
                        {project.categoryLabel}
                      </span>
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-black/25 rounded-none text-white">
                          {renderProjectIcon(project.iconName, "w-5 h-5")}
                        </div>
                        <h4 className="text-white text-sm font-sans font-black tracking-tight truncate max-w-[200px]" title={project.title}>
                          {project.title}
                        </h4>
                      </div>
                    </div>

                    {/* Description Body */}
                    <div className="p-5 flex-grow space-y-4 flex flex-col justify-between">
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-xs font-sans font-bold uppercase tracking-wider text-[#1A1A1A]/80 border-b border-black/5 pb-1">
                          <span>תפקיד: {project.role}</span>
                          <span className="font-mono">{project.period}</span>
                        </div>
                        <p className="text-sm font-sans text-[#1A1A1A] leading-relaxed line-clamp-3">
                          {project.description}
                        </p>
                      </div>

                      {/* Tech stacks tags */}
                      <div className="flex flex-wrap gap-1 pt-2">
                        {project.tags.slice(0, 3).map((tag, tIdx) => (
                          <span key={tIdx} className="px-2 py-0.5 bg-[#EFEEED] border border-black/5 text-[#1A1A1A] text-xs font-sans font-bold ltr">
                            {tag}
                          </span>
                        ))}
                        {project.tags.length > 3 && (
                          <span className="px-1.5 py-0.5 bg-black text-white text-xs font-sans font-bold">
                            +{project.tags.length - 3}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Bottom arrow CTA */}
                    <div className="px-5 py-3 border-t border-black/10 bg-[#EFEEED]/30 flex justify-between items-center text-xs font-sans font-extrabold text-[#1A1A1A] hover:bg-[#EFEEED]/60 transition-colors">
                      <span>הצג פרטים ורשימת תכונות</span>
                      <ChevronLeft className="w-4 h-4 text-[#e07631]" />
                    </div>

                  </motion.div>
                ))}
              </div>

              {/* Empty search fallback */}
              {filteredProjects.length === 0 && (
                <div className="text-center py-16 bg-[#FAF9F6] border border-black/10 rounded-none space-y-2">
                  <Briefcase className="w-12 h-12 text-slate-300 mx-auto" />
                  <p className="text-sm font-bold text-slate-500">אין פרויקטים תחת קטגוריה זו כרגע.</p>
                </div>
              )}

              {/* Project Expansion Modal via framer-motion */}
              <AnimatePresence>
                {selectedProject && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    
                    {/* Backdrop */}
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 0.5 }}
                      exit={{ opacity: 0 }}
                      onClick={() => setSelectedProject(null)}
                      className="absolute inset-0 bg-black/60"
                    />

                    {/* Modal Window */}
                    <motion.div 
                      layoutId={`project-container-${selectedProject.id}`}
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.95, opacity: 0 }}
                      className="bg-[#FAF9F6] max-w-2xl w-full max-h-[85vh] overflow-y-auto z-10 border border-black relative"
                    >
                      <button 
                        onClick={() => setSelectedProject(null)}
                        className="absolute top-4 left-4 p-2 bg-black/25 hover:bg-black/40 text-white rounded-none z-20 backdrop-blur-md transition-colors cursor-pointer"
                        aria-label="Close modal"
                      >
                        <X className="w-5 h-5" />
                      </button>

                      {/* Graphic Gradient Hero */}
                      <div className={`p-8 bg-gradient-to-r ${selectedProject.colorScheme.gradient} text-white space-y-3 border-b border-black/10`}>
                        <div className="inline-block px-3 py-1 bg-black/40 text-white text-xs font-sans font-bold">
                          {selectedProject.categoryLabel}
                        </div>
                        <h3 className="text-2xl sm:text-3xl font-sans font-black text-white">{selectedProject.title}</h3>
                        <p className="text-sm sm:text-base text-white font-bold leading-relaxed font-sans">{selectedProject.subtitle}</p>
                        
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-sans font-bold pt-2">
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4 text-[#e07631]" />
                            <strong>תקופה:</strong> <span className="font-mono">{selectedProject.period}</span>
                          </span>
                          <span className="flex items-center gap-1">
                            <UserCheck className="w-4 h-4 text-[#e07631]" />
                            <strong>תפקיד:</strong> <span>{selectedProject.role}</span>
                          </span>
                        </div>
                      </div>

                      {/* Modal Content */}
                      <div className="p-8 space-y-6 text-right">
                        
                        <div className="space-y-2">
                          <h4 className="text-xs font-sans font-bold uppercase tracking-wider text-[#1A1A1A] border-b border-black/5 pb-1">אודות הפרויקט והרקע המקצועי</h4>
                          <p className="text-[#1A1A1A] font-sans text-sm sm:text-base leading-relaxed whitespace-pre-line">
                            {selectedProject.longDescription}
                          </p>
                        </div>

                        {/* Features List */}
                        {selectedProject.features && selectedProject.features.length > 0 && (
                          <div className="space-y-3 bg-[#EFEEED] p-5 border border-black/5">
                            <h4 className="text-xs font-sans font-bold uppercase tracking-wider text-[#1A1A1A] border-b border-black/10 pb-1">תכונות מרכזיות וטכנולוגיה מיושמת</h4>
                            <ul className="space-y-2.5">
                              {selectedProject.features.map((feat, fIdx) => (
                                <li key={fIdx} className="flex items-start gap-2.5 text-xs sm:text-sm text-[#1A1A1A] leading-relaxed font-sans font-semibold">
                                  <CheckCircle2 className="w-4 h-4 text-[#e07631] flex-shrink-0 mt-0.5" />
                                  <span>{feat}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Tech stacks pills list */}
                        <div className="space-y-2">
                          <h4 className="text-xs font-sans font-bold uppercase tracking-wider text-[#1A1A1A] border-b border-black/5 pb-1">טכנולוגיות בשימוש (Stack)</h4>
                          <div className="flex flex-wrap gap-2">
                            {selectedProject.tags.map((tag, tIdx) => (
                              <span key={tIdx} className="px-2.5 py-1 bg-[#EFEEED] text-black border border-black/10 font-mono text-xs ltr">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Modal Action CTA Buttons */}
                        <div className="flex justify-end pt-4 border-t border-black/10 gap-3">
                          <button 
                            onClick={() => setSelectedProject(null)}
                            className="px-6 py-2.5 bg-black hover:bg-[#e07631] text-white text-xs font-sans font-extrabold uppercase cursor-pointer"
                          >
                            סגור חלונית
                          </button>
                        </div>

                      </div>

                    </motion.div>
                  </div>
                )}
              </AnimatePresence>

            </motion.div>
          )}

          {/* TAB 3: RESUME */}
          {activeTab === "resume" && (
            <motion.div
              key="resume-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6"
            >
              <ResumeViewer />
            </motion.div>
          )}

          {/* TAB 4: CHAT ASSISTANT */}
          {activeTab === "chat" && (
            <motion.div
              key="chat-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="max-w-4xl mx-auto flex flex-col bg-[#FAF9F6] border border-black relative" 
              style={{ height: "72vh" }}
            >
              
              {/* Virtual agent head bar */}
              <div className="bg-black text-white p-5 flex justify-between items-center gap-4 border-b border-black/10">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-11 h-11 bg-[#EFEEED] text-black border border-black/10 rounded-none flex items-center justify-center font-sans font-extrabold text-sm">
                      AI
                    </div>
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-black" />
                  </div>
                  <div className="text-right">
                    <h3 className="font-sans font-black text-sm sm:text-base">העוזר הווירטואלי של איתן</h3>
                    <p className="text-xs text-white/80 font-sans">מבוסס מודל Google Gemini Enterprise</p>
                  </div>
                </div>
                
                {/* Contact badge info bubble */}
                <div className="hidden sm:flex text-left flex-col text-xs font-sans font-bold">
                  <span>ליצירת קשר ישיר:</span>
                  <span className="font-sans font-extrabold text-[#e07631]">054-3033425</span>
                </div>
              </div>

              {/* Recruiter Quick Starter Questions Shelf */}
              <div className="bg-[#EFEEED] border-b border-black/10 px-4 py-3">
                <div className="text-xs font-sans font-extrabold text-[#1A1A1A]/80 mb-1.5 uppercase tracking-wide">שאלות מומלצות למגייסים (לחצו לשליחה):</div>
                <div className="flex flex-wrap gap-1.5 animate-fade-in">
                  {PRESET_QUESTIONS.map((question, idx) => (
                    <button
                      key={idx}
                      disabled={isChatLoading}
                      onClick={() => handleSendMessage(question.text)}
                      className="px-3 py-1.5 bg-white hover:bg-black hover:text-white disabled:opacity-50 text-[#1A1A1A] rounded-none text-xs font-sans font-bold border border-black/10 cursor-pointer transition-colors text-right"
                    >
                      {question.short}
                    </button>
                  ))}
                </div>
              </div>

              {/* Chat Message Window Area */}
              <div className="flex-grow p-4 sm:p-6 overflow-y-auto bg-[#FAF9F6]/50 space-y-4">
                
                {chatMessages.map(msg => (
                  <div 
                    key={msg.id}
                    className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div className={`max-w-[85%] p-4 text-sm leading-relaxed border border-black/10 rounded-none space-y-1 ${msg.sender === "user" ? "bg-[#e07631] text-white" : "bg-[#EFEEED] text-[#1A1A1A]"}`}>
                      
                      {/* Name Header */}
                      <span className="block text-xs font-sans font-bold uppercase tracking-wider opacity-90">
                        {msg.sender === "user" ? "מגייס / מתעניין" : "העוזר של איתן"}
                      </span>

                      {/* Text text with bullet rendering formatting */}
                      <p className="whitespace-pre-line text-xs sm:text-sm font-sans font-semibold">
                        {msg.text}
                      </p>

                      {/* Timestamp */}
                      <span className="block text-left text-xs opacity-60 mt-1 font-mono font-semibold">
                        {msg.timestamp}
                      </span>

                    </div>
                  </div>
                ))}

                {/* loading assistant response state indicator */}
                {isChatLoading && (
                  <div className="flex justify-start">
                    <div className="bg-[#EFEEED] border border-black/10 rounded-none p-4 shadow-none">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-black rounded-full animate-bounce [animation-delay:-0.3s]" />
                        <span className="w-2 h-2 bg-black rounded-full animate-bounce [animation-delay:-0.15s]" />
                        <span className="w-2 h-2 bg-black rounded-full animate-bounce" />
                        <span className="text-xs font-sans font-bold text-[#1A1A1A]/80 mr-1.5">העוזר כותב תגובה מנומקת...</span>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Chat Bottom input form */}
              <form 
                onSubmit={(e) => { e.preventDefault(); handleSendMessage(inputMessage); }}
                className="p-4 border-t border-black/10 bg-[#FAF9F6] flex gap-2"
              >
                <input 
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  disabled={isChatLoading}
                  placeholder="שאלו את העוזר הווירטואלי כל שאלה (למשל: מה איתן למד?)"
                  className="flex-grow px-4 py-3 text-sm bg-[#FAF9F6] focus:bg-[#FAF9F6] border border-black/10 focus:border-black rounded-none outline-none font-mono transition-colors"
                />
                <button 
                  type="submit"
                  disabled={!inputMessage.trim() || isChatLoading}
                  className="px-5 bg-black hover:bg-[#e07631] disabled:bg-[#EFEEED] disabled:text-[#1A1A1A]/40 text-white rounded-none cursor-pointer transition-colors duration-150 flex items-center justify-center font-mono text-[10px] uppercase font-bold tracking-widest"
                  aria-label="Send message"
                >
                  <Send className="w-4 h-4 transform rotate-180" />
                </button>
              </form>

            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* Footer widgets */}
      <footer className="bg-[#FAF9F6] border-t border-black/10 py-8 lg:py-12 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          
          <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
            
            {/* Contact details pills */}
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-xs font-bold text-slate-500">
              <span className="text-slate-900 border-l border-slate-200 pl-4">צור קשר עם איתן:</span>
              <a href="tel:054-3033425" className="flex items-center gap-1.5 hover:text-blue-700 transition-colors">
                <Phone className="w-4 h-4 text-blue-600" />
                054-3033425
              </a>
              <a href="mailto:eitan2007@gmail.com" className="flex items-center gap-1.5 hover:text-blue-700 transition-colors">
                <Mail className="w-4 h-4 text-blue-600" />
                eitan2007@gmail.com
              </a>
              <a href="https://www.eitan.work" target="_blank" rel="noreferrer" className="flex items-center gap-1.5 hover:text-blue-700 transition-colors">
                <Globe className="w-4 h-4 text-blue-600" />
                www.eitan.work
              </a>
            </div>

            {/* Admin trigger & copyright */}
            <div className="flex items-center gap-4 text-xs font-semibold text-slate-450">
              <span>© {new Date().getFullYear()} איתן ברון • כל הזכויות שמורות</span>
              <span className="text-slate-200">|</span>
              {isAdmin ? (
                <button onClick={handleAdminLogout} className="text-red-650 hover:underline flex items-center gap-1 cursor-pointer">
                  התנתק ממצב עריכה
                </button>
              ) : (
                <button onClick={() => setShowLoginModal(true)} className="text-slate-400 hover:text-slate-600 flex items-center gap-1 cursor-pointer">
                  <Lock className="w-3.5 h-3.5" />
                  כניסת מנהל
                </button>
              )}
            </div>

          </div>

          <div className="text-center text-[10px] text-slate-350 font-medium">
            האתר נבנה תוך שימוש בבינה מלאכותית, React ו-Tailwind CSS • תומך בכל נוהלי הראיונות של בנקים ומוסדות פיננסיים.
          </div>

        </div>
      </footer>

      {/* ADMIN LOGIN MODAL */}
      <AnimatePresence>
        {showLoginModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLoginModal(false)}
              className="absolute inset-0 bg-black/60"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white max-w-sm w-full p-6 z-10 border border-black space-y-4"
            >
              <div className="flex justify-between items-center border-b border-black/10 pb-3">
                <h3 className="font-sans font-bold text-base flex items-center gap-1.5 text-slate-900">
                  <Lock className="w-4 h-4 text-[#e07631]" />
                  כניסת מנהל למערכת העריכה
                </h3>
                <button onClick={() => setShowLoginModal(false)} className="text-slate-400 hover:bg-slate-50 p-1 rounded-none cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAdminLogin} className="space-y-4 text-right">
                <p className="text-xs text-[#1A1A1A]/70 leading-relaxed font-sans">
                  היכנס כדי להוסיף, לערוך או למחוק פרויקטים בתיק העבודות בזמן אמת במהלך ראיונות עבודה!
                </p>
                
                <div className="space-y-1">
                  <label className="block text-xs font-mono uppercase tracking-wider text-[#1A1A1A]/60">סיסמה זמנית להדגמה:</label>
                  <input 
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="אנא הזן eitan123"
                    className="w-full px-3 py-2 text-sm bg-white focus:bg-white border border-black/10 focus:border-black rounded-none outline-none font-mono transition-colors"
                    required
                  />
                  {loginError && <p className="text-[10px] font-mono font-bold text-[#e07631] mt-1">{loginError}</p>}
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button 
                    type="button"
                    onClick={() => setShowLoginModal(false)}
                    className="px-4 py-2 bg-[#EFEEED] text-black rounded-none text-[10px] font-mono uppercase tracking-widest font-bold cursor-pointer"
                  >
                    ביטול
                  </button>
                  <button 
                    type="submit"
                    className="px-4 py-2 bg-black hover:bg-[#e07631] text-white rounded-none text-[10px] font-mono uppercase tracking-widest font-bold cursor-pointer"
                  >
                    התחבר
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ADMIN ADD/EDIT PROJECT MODAL */}
      <AnimatePresence>
        {showManageModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddEditModal(false)}
              className="absolute inset-0 bg-black/60"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white max-w-lg w-full max-h-[85vh] overflow-y-auto p-6 z-10 border border-black space-y-4"
            >
              <div className="flex justify-between items-center border-b border-black/10 pb-3">
                <h3 className="font-sans font-bold text-base flex items-center gap-1.5 text-slate-900">
                  <Briefcase className="w-4 h-4 text-[#e07631]" />
                  {editingProject ? "עריכת פרויקט קיים" : "הוספת פרויקט חדש לתיק העבודות"}
                </h3>
                <button onClick={() => setShowAddEditModal(false)} className="text-slate-400 hover:bg-slate-50 p-1.5 rounded-none cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveProject} className="space-y-4 text-right">
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-xs font-mono uppercase tracking-wider text-[#1A1A1A]/60">שם הפרויקט:</label>
                    <input 
                      type="text"
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      placeholder="למשל: סניילר קוד פומפי"
                      className="w-full px-3 py-2 text-xs bg-white border border-black/15 rounded-none outline-none focus:border-black font-sans"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-mono uppercase tracking-wider text-[#1A1A1A]/60">תקופת הפרויקט:</label>
                    <input 
                      type="text"
                      value={formPeriod}
                      onChange={(e) => setFormPeriod(e.target.value)}
                      placeholder="למשל: 2024 – 2026"
                      className="w-full px-3 py-2 text-xs bg-white border border-black/15 rounded-none outline-none focus:border-black font-mono"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-mono uppercase tracking-wider text-[#1A1A1A]/60">תת-כותרת (סלוגן):</label>
                  <input 
                    type="text"
                    value={formSubtitle}
                    onChange={(e) => setFormSubtitle(e.target.value)}
                    placeholder="למשל: בוט חכם המקל על מנהלים ומאחסן נתונים פיננסיים"
                    className="w-full px-3 py-2 text-xs bg-white border border-black/15 rounded-none outline-none focus:border-black font-sans"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-xs font-mono uppercase tracking-wider text-[#1A1A1A]/60">קטגוריה:</label>
                    <select
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value as any)}
                      className="w-full px-3 py-2 text-xs bg-[#EFEEED] border border-black/15 rounded-none outline-none focus:border-black font-mono"
                    >
                      <option value="enterprise">בנקאות ו-Enterprise</option>
                      <option value="modern">טכנולוגיות Web</option>
                      <option value="ai">עולמות ה-AI וחדשנות</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-mono uppercase tracking-wider text-[#1A1A1A]/60">תפקיד בפרויקט:</label>
                    <input 
                      type="text"
                      value={formRole}
                      onChange={(e) => setFormRole(e.target.value)}
                      placeholder="למשל: מפתח Full-Stack בכיר"
                      className="w-full px-3 py-2 text-xs bg-white border border-black/15 rounded-none outline-none focus:border-black font-sans"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-mono uppercase tracking-wider text-[#1A1A1A]/60">תיאור קצר (יופיע בכרטיסיה):</label>
                  <textarea 
                    value={formDesc}
                    onChange={(e) => setFormDesc(e.target.value)}
                    placeholder="תיאור תמציתי של הפרויקט במספר משפטים..."
                    rows={2}
                    className="w-full px-3 py-2 text-xs bg-white border border-black/15 rounded-none outline-none resize-none font-sans"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-mono uppercase tracking-wider text-[#1A1A1A]/60">תיאור מורחב (יופיע בתוך המודאל שנפתח):</label>
                  <textarea 
                    value={formLongDesc}
                    onChange={(e) => setFormLongDesc(e.target.value)}
                    placeholder="פירוט מלא של הרקע, משמעות הפרויקט והצורך שעליו ענה..."
                    rows={3}
                    className="w-full px-3 py-2 text-xs bg-white border border-black/15 rounded-none outline-none resize-y font-sans"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="block text-xs font-mono uppercase tracking-wider text-[#1A1A1A]/60">רשימת תגיות (מופרדות בפסיקים):</label>
                    <span className="text-[9px] font-mono text-slate-400">למשל: Java, Next.js, Oracle</span>
                  </div>
                  <input 
                    type="text"
                    value={formTags}
                    onChange={(e) => setFormTags(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-black/15 rounded-none outline-none focus:border-black font-mono ltr"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="block text-xs font-mono uppercase tracking-wider text-[#1A1A1A]/60">תכונות מרכזיות (רשום כל תכונה בשורה חדשה):</label>
                    <span className="text-[9px] font-mono text-slate-400">כל שורה תהפוך לבולט מוכן</span>
                  </div>
                  <textarea 
                    value={formFeatures}
                    onChange={(e) => setFormFeatures(e.target.value)}
                    rows={3}
                    placeholder="פיתוח תשתיות ענן מהירות בבנק&#10;אבטחת מידע קפדנית ברמה פיננסית"
                    className="w-full px-3 py-2 text-xs bg-white border border-black/15 rounded-none outline-none resize-y font-sans"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-black/10">
                  <button 
                    type="button"
                    onClick={() => setShowAddEditModal(false)}
                    className="px-4 py-2 bg-[#EFEEED] text-black rounded-none text-[10px] font-mono uppercase tracking-widest font-bold cursor-pointer"
                  >
                    ביטול
                  </button>
                  <button 
                    type="submit"
                    className="px-5 py-2 bg-black hover:bg-[#e07631] text-white rounded-none text-[10px] font-mono uppercase tracking-widest font-bold cursor-pointer"
                  >
                    שמור שינויים
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
