import React, { useEffect, useState, useRef } from "react";
import { Download, FileDown, Image, Monitor, Smartphone, RefreshCw } from "lucide-react";
import { RESUME_RAW_CSS, RESUME_RAW_HTML } from "./ResumeData";

const ResumeMarkup = React.memo(({ html }: { html: string }) => (
  <div dangerouslySetInnerHTML={{ __html: html }} />
));
ResumeMarkup.displayName = "ResumeMarkup";

export const ResumeViewer: React.FC = () => {
  const [htmlContent, setHtmlContent] = useState<string>("");
  const [cssContent, setCssContent] = useState<string>("");
  const [lang, setLang] = useState<"he" | "en">("he");
  const [viewMode, setViewMode] = useState<"normal" | "wide">("normal");
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [scriptsLoaded, setScriptsLoaded] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fullscreen view states
  const [isFullscreenOpen, setIsFullscreenOpen] = useState<boolean>(false);
  const [fsPages, setFsPages] = useState<string[]>([]);
  const [fsPageIndex, setFsPageIndex] = useState<number>(0);

  const handleFsPrev = () => {
    setFsPageIndex(prev => (prev > 0 ? prev - 1 : prev));
  };

  const handleFsNext = () => {
    setFsPageIndex(prev => (prev < fsPages.length - 1 ? prev + 1 : prev));
  };

  const openFullscreen = (pageId: string) => {
    if (!containerRef.current) return;
    const pages = Array.from(containerRef.current.querySelectorAll("#stage .page")) as HTMLElement[];
    if (pages.length === 0) return;

    // Visual order check (RTL reversed)
    const isRtl = lang !== "en";
    const orderedPages = isRtl ? [...pages].reverse() : pages;

    const clickedPage = pages.find(p => p.id === pageId);
    if (!clickedPage) return;

    const idx = orderedPages.indexOf(clickedPage);
    setFsPages(orderedPages.map(p => p.outerHTML));
    setFsPageIndex(idx);
    setIsFullscreenOpen(true);
  };

  const handleStageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (viewMode !== "wide") return;
    const target = e.target as HTMLElement;
    const pageEl = target.closest(".page") as HTMLElement;
    if (pageEl) {
      openFullscreen(pageEl.id);
    }
  };

  // Fullscreen keyboard navigation handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isFullscreenOpen) return;
      if (e.key === "Escape") {
        setIsFullscreenOpen(false);
      } else if (e.key === "ArrowLeft") {
        handleFsPrev();
      } else if (e.key === "ArrowRight") {
        handleFsNext();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isFullscreenOpen, fsPageIndex, fsPages]);


  // Helper: extract a readable error message from any thrown value
  const getErrorMessage = (e: unknown): string => {
    if (e instanceof Error) return e.message;
    if (typeof e === "string") return e;
    try { return JSON.stringify(e); } catch { return String(e); }
  };

  // Load external scripts dynamically
  useEffect(() => {
    const loadScript = (src: string, globalName: string): Promise<void> => {
      return new Promise<void>((resolve, reject) => {
        if ((window as any)[globalName] || (globalName === "docx" && (window as any).docx)) {
          resolve();
          return;
        }
        const script = document.createElement("script");
        script.src = src;
        script.async = true;
        script.onload = () => resolve();
        script.onerror = (err) => reject(err);
        document.body.appendChild(script);
      });
    };

    Promise.all([
      loadScript("https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js", "html2canvas"),
      loadScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js", "jspdf"),
      loadScript("https://cdn.jsdelivr.net/npm/docx@8.5.0/build/index.umd.js", "docx")
    ])
      .then(() => {
        setScriptsLoaded(true);
      })
      .catch((err) => {
        console.error("Failed to load required CV export scripts:", err);
      });
  }, []);

  // Initialize resume content and extract styles & stage elements statically
  useEffect(() => {
    // Scope styles to stay inside .cv-body-wrapper rather than polluting page body
    let cleanStyles = RESUME_RAW_CSS
      .replace(/body\s*{/g, ".cv-body-wrapper {")
      .replace(/html,\s*body\s*{/g, ".cv-html-body-wrapper {")
      .replace(/html\.exporting-shot/g, ".exporting-shot");

    // Change default background color from #5b6578 to #F4F1EA
    cleanStyles = cleanStyles.replace(/#5b6578/g, "#F4F1EA");

    // Override page shadow to exactly 0 12px 40px rgba(0,0,0,0.35)
    cleanStyles += `
      .cv-view .page {
        box-shadow: 0 12px 40px rgba(0, 0, 0, 0.35) !important;
        color: var(--ink, #2a2f3a) !important;
        font-family: 'Heebo', Arial, sans-serif !important;
        line-height: normal !important;
      }
      .cv-body-wrapper,
      .cv-view #stage {
        line-height: normal !important;
      }
      .cv-body-wrapper {
        background: #F4F1EA !important;
      }
    `;

    setCssContent(cleanStyles);
    setHtmlContent(RESUME_RAW_HTML);
  }, []);

  // Handle translation toggles (identical to the script logic of resume.html but reactive)
  useEffect(() => {
    if (!containerRef.current || !htmlContent) return;

    const root = containerRef.current;
    root.setAttribute("lang", lang === "he" ? "he" : "en");
    root.setAttribute("dir", lang === "he" ? "rtl" : "ltr");

    // Apply translations in child nodes having data-en attributes
    const elements = root.querySelectorAll("[data-en]");
    elements.forEach((el: any) => {
      if (!el.dataset.originalHtml) {
        el.dataset.originalHtml = el.innerHTML;
      }
      if (lang === "en") {
        el.innerHTML = el.getAttribute("data-en") || "";
      } else {
        el.innerHTML = el.dataset.originalHtml;
      }
    });

    if (viewMode === "wide") {
      updateWideScale();
    }
  }, [lang, htmlContent]);

  // Handle view scale and styling updates responsive to window resizing or switching normal/wide tab
  const updateWideScale = () => {
    if (viewMode !== "wide" || !containerRef.current) return;
    const docEl = containerRef.current.querySelector("#doc") as HTMLDivElement;
    const stage = containerRef.current.querySelector("#stage") as HTMLDivElement;
    if (!docEl || !stage) return;

    docEl.style.height = "";
    const top = docEl.getBoundingClientRect().top;
    const availH = window.innerHeight - top - 16;
    const availW = containerRef.current.clientWidth - 32;
    docEl.style.height = `${availH}px`;

    const naturalW = stage.scrollWidth || (794 * 2 + 30);
    const naturalH = stage.scrollHeight || 1123;

    const s = Math.min(availW / naturalW, availH / naturalH);
    stage.style.setProperty("--wide-scale", s > 0 ? String(s) : "1");
  };

  useEffect(() => {
    if (viewMode === "wide") {
      updateWideScale();
      window.addEventListener("resize", updateWideScale);
    } else {
      const docEl = containerRef.current?.querySelector("#doc") as HTMLDivElement;
      const stage = containerRef.current?.querySelector("#stage") as HTMLDivElement;
      if (docEl) docEl.style.height = "";
      if (stage) stage.style.removeProperty("--wide-scale");
    }
    return () => {
      window.removeEventListener("resize", updateWideScale);
    };
  }, [viewMode, htmlContent]);

  // Helper functions for HD export drawing (matching original resume.html logic exactly)
  const parseExportShadowSpread = (value: string) => {
    const parts = String(value || "").match(/-?\d*\.?\d+px/g) || [];
    return parts.length >= 4 ? parseFloat(parts[3]) : 0;
  };

  const parseExportShadowColor = (value: string, fallback: string) => {
    const match = String(value || "").match(/^(rgba?\([^)]+\)|#[0-9a-fA-F]+|[a-zA-Z]+)/);
    return match ? match[1] : fallback;
  };

  const runShot = async (el: HTMLElement) => {
    const html2canvas = (window as any).html2canvas;
    if (!html2canvas) throw new Error("html2canvas library not loaded");

    const scale = 3;
    const captureWidth = el.offsetWidth;
    if (captureWidth === 0) {
      throw new Error(`Source page offsetWidth is 0`);
    }

    const targetPage = el.cloneNode(true) as HTMLElement;

    // Capture a clean clone in the same document. Calling html2canvas from the
    // parent window on an element inside a temporary iframe can produce a 0x0
    // canvas in Chrome, which serializes to the empty "data:," URL.
    const exportHost = document.createElement("div");
    exportHost.className = "resume-export-host";
    exportHost.setAttribute("aria-hidden", "true");
    exportHost.setAttribute("lang", lang === "he" ? "he" : "en");
    exportHost.setAttribute("dir", lang === "he" ? "rtl" : "ltr");
    exportHost.style.cssText = [
      "position:fixed",
      "left:-9999px",
      "top:0",
      `width:${captureWidth}px`,
      "min-height:100px",
      "z-index:-2147483647",
      "pointer-events:none",
      "background:#fff",
      "overflow:visible",
    ].join(";");

    exportHost.appendChild(targetPage);
    document.body.appendChild(exportHost);

    // Wait for layout so client rects are populated correctly on the clone
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

    const targetPageRect = targetPage.getBoundingClientRect();
    const captureHeight = Math.max(targetPage.offsetHeight, targetPage.scrollHeight);
    if (captureHeight === 0 || targetPageRect.width === 0) {
      document.body.removeChild(exportHost);
      throw new Error(`Cloned page rendered at ${targetPageRect.width}x${captureHeight}`);
    }

    const railMetrics = Array.from(targetPage.querySelectorAll(".experience, .edu-timeline"))
      .map((timeline: any) => {
        const firstDot = timeline.querySelector(".exp-dot, .edu-dot");
        if (!firstDot) return null;
        const timelineRect = timeline.getBoundingClientRect();
        const dotRect = firstDot.getBoundingClientRect();
        const css = getComputedStyle(timeline, "::before");
        const railTop = parseFloat(css.top) || 0;
        const railBottom = parseFloat(css.bottom) || 0;
        const lineWidth = parseFloat(css.width) || 0;
        return {
          centerX: dotRect.left - targetPageRect.left + dotRect.width / 2,
          y1: timelineRect.top - targetPageRect.top + railTop,
          y2: timelineRect.bottom - targetPageRect.top - railBottom,
          lineWidth,
          strokeStyle: css.backgroundColor || "#b9c6dd",
        };
      })
      .filter((metric): metric is { centerX: number; y1: number; y2: number; lineWidth: number; strokeStyle: string } => Boolean(metric));

    const dotMetrics = Array.from(targetPage.querySelectorAll(".exp-dot, .edu-dot")).map((dot: any) => {
      const rect = dot.getBoundingClientRect();
      const css = getComputedStyle(dot);
      return {
        cx: rect.left - targetPageRect.left + rect.width / 2,
        cy: rect.top - targetPageRect.top + rect.height / 2,
        radius: rect.width / 2,
        borderWidth: parseFloat(css.borderTopWidth) || 0,
        shadowSpread: parseExportShadowSpread(css.boxShadow),
        shadowStyle: parseExportShadowColor(css.boxShadow, "#b9c6dd"),
        borderStyle: css.borderTopColor,
        fillStyle: css.backgroundColor,
      };
    });

    const exportStyle = document.createElement("style");
    exportStyle.textContent = `
      ${RESUME_RAW_CSS}

      /* Flexbox gap workarounds for html2canvas */
      [dir="rtl"] .contact .item svg { margin-left: 7px !important; }
      [dir="ltr"] .contact .item svg { margin-right: 7px !important; }
      [dir="rtl"] .personal .item svg { margin-left: 6px !important; }
      [dir="ltr"] .personal .item svg { margin-right: 6px !important; }
      [dir="rtl"] .photo-wrap { margin-right: 18px !important; }
      [dir="ltr"] .photo-wrap { margin-left: 18px !important; }
      [dir="rtl"] .sec-icon { margin-left: 11px !important; }
      [dir="ltr"] .sec-icon { margin-right: 11px !important; }
      [dir="rtl"] .know-label { margin-left: 10px !important; }
      [dir="ltr"] .know-label { margin-right: 10px !important; }
      [dir="rtl"] .skill { margin-left: 5px !important; margin-bottom: 5px !important; }
      [dir="ltr"] .skill { margin-right: 5px !important; margin-bottom: 5px !important; }
      [dir="rtl"] .lang-item::before { margin-left: 9px !important; }
      [dir="ltr"] .lang-item::before { margin-right: 9px !important; }
      [dir="rtl"] .footer svg { margin-left: 12px !important; }
      [dir="ltr"] .footer svg { margin-right: 12px !important; }

      .resume-export-host .experience::before,
      .resume-export-host .edu-timeline::before {
        content: none !important;
        display: none !important;
        opacity: 0 !important;
        background: transparent !important;
      }
      .resume-export-host .exp-dot,
      .resume-export-host .edu-dot {
        visibility: hidden !important;
        box-shadow: none !important;
      }
      .resume-export-host .page {
        box-shadow: none !important;
        color: var(--ink, #2a2f3a) !important;
        font-family: 'Heebo', Arial, sans-serif !important;
        line-height: normal !important;
        width: ${captureWidth}px !important;
        max-width: none !important;
      }
    `;
    exportHost.insertBefore(exportStyle, targetPage);

    await document.fonts.ready;

    try {
      if (targetPage.offsetWidth === 0 || targetPage.offsetHeight === 0) {
        throw new Error(
          `Export clone rendered at ${targetPage.offsetWidth}x${targetPage.offsetHeight} ` +
            `(source ${captureWidth}x${captureHeight}, host ${exportHost.offsetWidth}x${exportHost.offsetHeight})`
        );
      }

      const canvas = await html2canvas(targetPage, {
        scale,
        backgroundColor: "#ffffff",
        useCORS: true,
        width: captureWidth,
        height: captureHeight,
        windowWidth: captureWidth,
        windowHeight: captureHeight,
      });

      // Post-process: redraw timeline rails and dots in HD on the canvas.
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        const cssPx = scale;

        railMetrics.forEach((rail) => {
          if (rail.lineWidth > 0 && rail.y2 > rail.y1) {
            ctx.beginPath();
            ctx.moveTo(rail.centerX * cssPx, rail.y1 * cssPx);
            ctx.lineTo(rail.centerX * cssPx, rail.y2 * cssPx);
            ctx.lineWidth = rail.lineWidth * cssPx;
            ctx.lineCap = "round";
            ctx.strokeStyle = rail.strokeStyle;
            ctx.stroke();
          }
        });

        dotMetrics.forEach((dot) => {
          const cx = dot.cx * cssPx;
          const cy = dot.cy * cssPx;
          const borderBoxRadius = dot.radius * cssPx;

          const rings: [number, string][] = [
            [borderBoxRadius + dot.shadowSpread * cssPx, dot.shadowStyle],
            [borderBoxRadius, dot.borderStyle],
            [Math.max(0, borderBoxRadius - dot.borderWidth * cssPx), dot.fillStyle],
          ];
          rings.forEach(([radius, fillStyle]) => {
            if (radius <= 0) return;
            ctx.beginPath();
            ctx.arc(cx, cy, radius, 0, 2 * Math.PI);
            ctx.fillStyle = fillStyle;
            ctx.fill();
          });
        });

        ctx.restore();
      }

      return canvas;
    } finally {
      document.body.removeChild(exportHost);
    }
  };

  const handleExportPNG = async () => {
    if (!scriptsLoaded || !containerRef.current) return;
    setIsExporting(true);
    try {
      const pages = Array.from(containerRef.current.querySelectorAll("#stage .page")) as HTMLElement[];
      if (pages.length === 0) throw new Error("No page elements found in resume");

      for (let i = 0; i < pages.length; i++) {
        const canvas = await runShot(pages[i]);
        const link = document.createElement("a");
        link.download = (lang === "en" ? "Eitan_Baron_Resume_page_" : "איתן_ברון_קורות_חיים_עמוד_") + (i + 1) + ".png";
        link.href = canvas.toDataURL("image/png");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        if (i < pages.length - 1) {
          await new Promise((r) => setTimeout(r, 500));
        }
      }
    } catch (e: unknown) {
      console.error("Export PNG error:", e);
      alert(lang === "en" ? "Exception exporting Image: " + getErrorMessage(e) : "שגיאה בייצוא תמונה: " + getErrorMessage(e));
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPDF = async () => {
    if (!scriptsLoaded || !containerRef.current) return;
    setIsExporting(true);
    try {
      const windowJS = window as any;
      const jspdfObj = windowJS.jspdf;
      if (!jspdfObj) throw new Error("jsPDF library not accessible");

      const pdf = new jspdfObj.jsPDF("p", "mm", "a4");
      const pw = pdf.internal.pageSize.getWidth();
      const ph = pdf.internal.pageSize.getHeight();

      const pages = Array.from(containerRef.current.querySelectorAll("#stage .page")) as HTMLElement[];
      if (pages.length === 0) throw new Error("No pages found in resume");

      for (let i = 0; i < pages.length; i++) {
        const canvas = await runShot(pages[i]);
        const img = canvas.toDataURL("image/jpeg", 0.95);
        if (i > 0) pdf.addPage();
        pdf.addImage(img, "JPEG", 0, 0, pw, ph);
      }
      pdf.save(lang === "en" ? "Eitan_Baron_Resume.pdf" : "איתן_ברון_קורות_חיים.pdf");
    } catch (e: unknown) {
      console.error("Export PDF error:", e);
      alert(lang === "en" ? "Exception exporting PDF: " + getErrorMessage(e) : "שגיאה בייצוא PDF: " + getErrorMessage(e));
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportWord = async () => {
    await handleExportWordLegacy();
  };

  const handleExportWordLegacy = async () => {
    if (!scriptsLoaded) return;
    setIsExporting(true);
    try {
      const D = (window as any).docx;
      if (!D) throw new Error("docx package not loaded correctly");

      const docRtl = lang !== "en";
      const navy = "022159";
      const f = "Heebo";
      const rtlTextAlign = D.AlignmentType.START;
      const twoColDividerPadding = 280;

      const gt = (el: Element | null): string => {
        return el ? (el.textContent || "").trim().replace(/\s+/g, " ") : "";
      };

      const base64ToUint8Array = (base64Str: string) => {
        const raw = window.atob(base64Str.split(",")[1]);
        const rawLength = raw.length;
        const array = new Uint8Array(new ArrayBuffer(rawLength));
        for (let i = 0; i < rawLength; i++) {
          array[i] = raw.charCodeAt(i);
        }
        return array;
      };

      const mkSecHead = (text: string) => {
        return new D.Paragraph({
          alignment: rtlTextAlign,
          bidirectional: docRtl,
          spacing: { before: 200, after: 100 },
          border: { bottom: { style: D.BorderStyle.SINGLE, size: 6, color: navy, space: 4 } },
          children: [new D.TextRun({ text: text, bold: true, size: 26, color: navy, font: f, rightToLeft: docRtl })]
        });
      };

      const mkRule = () => {
        return new D.Paragraph({
          spacing: { before: 60, after: 60 },
          border: { bottom: { style: D.BorderStyle.SINGLE, size: 4, color: navy, space: 1 } },
          children: []
        });
      };

      const originalRoot = containerRef.current;
      if (!originalRoot) throw new Error("Element scope not mounted");

      const photoEl = originalRoot.querySelector(".photo-wrap img") as HTMLImageElement;
      const photoSrc = photoEl ? photoEl.src : "";

      const contactRuns: any[] = [];
      const contactItems = Array.from(originalRoot.querySelectorAll(".contact .item")) as any[];
      contactItems.forEach((item, index) => {
        const isEmail = item.querySelector(".mail") !== null;
        const isPhone = !isEmail && item.querySelector(".ltr") !== null;
        contactRuns.push(
          new D.TextRun({
            text: gt(item),
            size: 20,
            color: "1f2a44",
            font: f,
            rightToLeft: !(isEmail || isPhone)
          })
        );
        if (index < contactItems.length - 1) {
          contactRuns.push(
            new D.TextRun({
              text: "   |   ",
              size: 20,
              color: "9aa7c2",
              font: f
            })
          );
        }
      });

      const personalRuns: any[] = [];
      const personalItems = Array.from(originalRoot.querySelectorAll(".personal .item")) as any[];
      personalItems.forEach((item, index) => {
        personalRuns.push(
          new D.TextRun({
            text: gt(item),
            size: 18,
            color: "3a4256",
            font: f,
            rightToLeft: true
          })
        );
        if (index < personalItems.length - 1) {
          personalRuns.push(
            new D.TextRun({
              text: "   |   ",
              size: 18,
              color: "aab4c9",
              font: f
            })
          );
        }
      });

      let headerBlock;
      if (photoSrc && photoSrc.startsWith("data:image")) {
        headerBlock = new D.Table({
          visuallyRightToLeft: true,
          columnWidths: [8606, 1600],
          width: { size: 10206, type: D.WidthType.DXA },
          borders: {
            top: { style: D.BorderStyle.NONE },
            bottom: { style: D.BorderStyle.NONE },
            left: { style: D.BorderStyle.NONE },
            right: { style: D.BorderStyle.NONE },
            insideHorizontal: { style: D.BorderStyle.NONE },
            insideVertical: { style: D.BorderStyle.NONE }
          },
          rows: [
            new D.TableRow({
              children: [
                new D.TableCell({
                  width: { size: 8606, type: D.WidthType.DXA },
                  borders: {
                    top: { style: D.BorderStyle.NONE },
                    bottom: { style: D.BorderStyle.NONE },
                    left: { style: D.BorderStyle.NONE },
                    right: { style: D.BorderStyle.NONE }
                  },
                  children: [
                    new D.Paragraph({
                      alignment: rtlTextAlign,
                      bidirectional: docRtl,
                      spacing: { after: 30 },
                      children: [
                        new D.TextRun({
                          text: gt(originalRoot.querySelector(".name")),
                          bold: true,
                          size: 48,
                          color: "0f3a73",
                          font: f,
                          rightToLeft: true
                        })
                      ]
                    }),
                    new D.Paragraph({
                      alignment: rtlTextAlign,
                      bidirectional: docRtl,
                      spacing: { after: 60 },
                      children: [
                        new D.TextRun({
                          text: gt(originalRoot.querySelector(".subtitle")),
                          bold: true,
                          size: 22,
                          color: navy,
                          font: f,
                          rightToLeft: false
                        })
                      ]
                    }),
                    new D.Paragraph({
                      alignment: rtlTextAlign,
                      bidirectional: docRtl,
                      spacing: { after: 30 },
                      children: contactRuns
                    }),
                    new D.Paragraph({
                      alignment: rtlTextAlign,
                      bidirectional: docRtl,
                      spacing: { after: 30 },
                      children: personalRuns
                    })
                  ]
                }),
                new D.TableCell({
                  width: { size: 1600, type: D.WidthType.DXA },
                  borders: {
                    top: { style: D.BorderStyle.NONE },
                    bottom: { style: D.BorderStyle.NONE },
                    left: { style: D.BorderStyle.NONE },
                    right: { style: D.BorderStyle.NONE }
                  },
                  children: [
                    new D.Paragraph({
                      alignment: D.AlignmentType.LEFT,
                      children: [
                        new D.ImageRun({
                          data: base64ToUint8Array(photoSrc),
                          transformation: { width: 80, height: 95 }
                        })
                      ]
                    })
                  ]
                })
              ]
            })
          ]
        });
      } else {
        headerBlock = new D.Paragraph({
          alignment: rtlTextAlign,
          bidirectional: docRtl,
          children: [
            new D.TextRun({
              text: gt(originalRoot.querySelector(".name")),
              bold: true,
              size: 48,
              color: "0f3a73",
              font: f,
              rightToLeft: true
            })
          ]
        });
      }

      const sections: any[] = [];
      const pages = Array.from(originalRoot.querySelectorAll(".page")) as any[];

      pages.forEach((page: any, pageIndex: number) => {
        const c: any[] = [];

        if (pageIndex === 0) {
          c.push(headerBlock);
          c.push(mkRule());
        }

        page.querySelectorAll(".section, .two-col").forEach((el: any) => {
          if (el.classList.contains("two-col")) {
            const cols = Array.from(el.querySelectorAll(".col")) as any[];
            if (cols.length === 2) {
              const rightColChildren: any[] = [];
              const leftColChildren: any[] = [];

              const processCol = (colEl: Element, colChildren: any[]) => {
                const tEl = colEl.querySelector(".sec-title");
                if (!tEl) return;

                colChildren.push(
                  new D.Paragraph({
                    alignment: rtlTextAlign,
                    bidirectional: docRtl,
                    spacing: { before: 120, after: 120 },
                    border: { bottom: { style: D.BorderStyle.SINGLE, size: 6, color: navy, space: 4 } },
                    children: [new D.TextRun({ text: gt(tEl), bold: true, size: 24, color: navy, font: f, rightToLeft: true })]
                  })
                );

                colEl.querySelectorAll(".edu-item").forEach((item) => {
                  const yr = gt(item.querySelector(".edu-year"));
                  const ti = gt(item.querySelector(".edu-title"));
                  const sub = item.querySelector(".edu-sub");
                  const note = item.querySelector(".edu-note");

                  colChildren.push(
                    new D.Paragraph({
                      alignment: rtlTextAlign,
                      bidirectional: docRtl,
                      spacing: { before: 60, after: 30 },
                      children: [
                        new D.TextRun({ text: ti, bold: true, size: 21, color: "16243f", font: f, rightToLeft: true }),
                        new D.TextRun({ text: "    " + yr, bold: true, size: 20, color: navy, font: f })
                      ]
                    })
                  );
                  if (sub) {
                    colChildren.push(
                      new D.Paragraph({
                        alignment: rtlTextAlign,
                        bidirectional: docRtl,
                        spacing: { after: 20 },
                        children: [new D.TextRun({ text: gt(sub), size: 18, color: "56607a", font: f, rightToLeft: true })]
                      })
                    );
                  }
                  if (note) {
                    colChildren.push(
                      new D.Paragraph({
                        alignment: rtlTextAlign,
                        bidirectional: docRtl,
                        spacing: { after: 40 },
                        children: [new D.TextRun({ text: gt(note), size: 17, color: "6a7488", font: f, rightToLeft: true })]
                      })
                    );
                  }
                });

                colEl.querySelectorAll(".lang-item").forEach((li) => {
                  colChildren.push(
                    new D.Paragraph({
                      alignment: rtlTextAlign,
                      bidirectional: docRtl,
                      spacing: { after: 40 },
                      children: [
                        new D.TextRun({ text: "\u200F\u2022 ", size: 20, color: navy, font: f, rightToLeft: true }),
                        new D.TextRun({ text: gt(li), size: 20, color: "33394a", font: f, rightToLeft: true })
                      ]
                    })
                  );
                });
              };

              processCol(cols[0], rightColChildren);
              processCol(cols[1], leftColChildren);

              c.push(
                new D.Table({
                  visuallyRightToLeft: true,
                  columnWidths: [5103, 5103],
                  width: { size: 10206, type: D.WidthType.DXA },
                  borders: {
                    top: { style: D.BorderStyle.NONE },
                    bottom: { style: D.BorderStyle.NONE },
                    left: { style: D.BorderStyle.NONE },
                    right: { style: D.BorderStyle.NONE },
                    insideHorizontal: { style: D.BorderStyle.NONE },
                    insideVertical: { style: D.BorderStyle.SINGLE, size: 12, color: navy }
                  },
                  rows: [
                    new D.TableRow({
                      children: [
                        new D.TableCell({
                          width: { size: 5103, type: D.WidthType.DXA },
                          margins: { marginUnitType: D.WidthType.DXA, left: twoColDividerPadding, right: 0 },
                          borders: {
                            top: { style: D.BorderStyle.NONE },
                            bottom: { style: D.BorderStyle.NONE },
                            left: { style: D.BorderStyle.NONE },
                            right: { style: D.BorderStyle.NONE }
                          },
                          children: rightColChildren
                        }),
                        new D.TableCell({
                          width: { size: 5103, type: D.WidthType.DXA },
                          margins: { marginUnitType: D.WidthType.DXA, left: 0, right: twoColDividerPadding },
                          borders: {
                            top: { style: D.BorderStyle.NONE },
                            bottom: { style: D.BorderStyle.NONE },
                            left: { style: D.BorderStyle.NONE },
                            right: { style: D.BorderStyle.NONE }
                          },
                          children: leftColChildren
                        })
                      ]
                    })
                  ]
                })
              );
            }
            return;
          }

          const titleEl = el.querySelector(".sec-title");
          if (!titleEl) return;
          c.push(mkSecHead(gt(titleEl)));

          const summary = el.querySelector(".summary");
          if (summary) {
            c.push(
              new D.Paragraph({
                alignment: rtlTextAlign,
                bidirectional: docRtl,
                spacing: { after: 80 },
                children: [new D.TextRun({ text: gt(summary), size: 20, color: "33394a", font: f, rightToLeft: docRtl, rtl: docRtl })]
              })
            );
          }

          el.querySelectorAll(".know-row").forEach((row: any) => {
            const label = gt(row.querySelector(".know-label"));
            const skills = Array.from(row.querySelectorAll(".skill"))
              .map((s: any) => gt(s))
              .join(" \u00B7 ");
            c.push(
              new D.Paragraph({
                alignment: rtlTextAlign,
                bidirectional: docRtl,
                spacing: { after: 60 },
                children: [
                  new D.TextRun({ text: label + ":  " + (docRtl ? "\u200F" : ""), bold: true, size: 19, color: navy, font: f, rightToLeft: docRtl, rtl: docRtl }),
                  new D.TextRun({ text: skills, size: 19, color: "2b5aa0", font: f })
                ]
              })
            );
          });

          el.querySelectorAll(".exp-item").forEach((item: any) => {
            const yr = gt(item.querySelector(".exp-year"));
            const co = gt(item.querySelector(".exp-company"));
            const desc = item.querySelector(".exp-desc");

            c.push(
              new D.Paragraph({
                alignment: rtlTextAlign,
                bidirectional: docRtl,
                spacing: { before: 100, after: 40 },
                children: [
                  new D.TextRun({ text: co, bold: true, size: 22, color: "16243f", font: f, rightToLeft: docRtl, rtl: docRtl }),
                  new D.TextRun({ text: "    " + yr, bold: true, size: 20, color: navy, font: f })
                ]
              })
            );

            if (desc) {
              c.push(
                new D.Paragraph({
                  alignment: rtlTextAlign,
                  bidirectional: docRtl,
                  spacing: { after: 40 },
                  children: [new D.TextRun({ text: gt(desc), size: 18, color: "6a7286", font: f, italics: true, rightToLeft: docRtl, rtl: docRtl })]
                })
              );
            }

            const liOwnText = (liElement: Element) => {
              const clone = liElement.cloneNode(true) as Element;
              clone.querySelectorAll("ul, ol").forEach((u) => u.remove());
              return gt(clone);
            };

            const bulletPara = (bulletText: string, indent: any, marker: string) =>
              new D.Paragraph({
                alignment: rtlTextAlign,
                bidirectional: docRtl,
                spacing: { after: 20 },
                indent,
                children: [
                  new D.TextRun({ text: (docRtl ? "\u200F" : "") + marker + " ", size: 19, color: navy, font: f, rightToLeft: docRtl, rtl: docRtl }),
                  new D.TextRun({ text: bulletText, size: 19, color: "3a4150", font: f, rightToLeft: docRtl, rtl: docRtl })
                ]
              });

            item.querySelectorAll(":scope > .exp-list > li").forEach((li: any) => {
              c.push(bulletPara(liOwnText(li), docRtl ? { right: 240 } : { left: 240 }, "\u2022"));
              li.querySelectorAll(":scope > ul > li").forEach((sub: any) => {
                c.push(bulletPara(gt(sub), docRtl ? { right: 540 } : { left: 540 }, "\u25E6"));
              });
            });
          });

          if (!el.closest(".two-col")) {
            el.querySelectorAll(".edu-item").forEach((item: any) => {
              const yr = gt(item.querySelector(".edu-year"));
              const ti = gt(item.querySelector(".edu-title"));
              const sub = item.querySelector(".edu-sub");
              const note = item.querySelector(".edu-note");

              c.push(
                new D.Paragraph({
                  alignment: rtlTextAlign,
                  bidirectional: docRtl,
                  spacing: { before: 80, after: 30 },
                  children: [
                    new D.TextRun({ text: ti, bold: true, size: 21, color: "16243f", font: f, rightToLeft: docRtl, rtl: docRtl }),
                    new D.TextRun({ text: "    " + yr, bold: true, size: 20, color: navy, font: f })
                  ]
                })
              );

              if (sub) {
                c.push(
                  new D.Paragraph({
                    alignment: rtlTextAlign,
                    bidirectional: docRtl,
                    spacing: { after: 20 },
                    children: [new D.TextRun({ text: gt(sub), size: 18, color: "56607a", font: f, rightToLeft: docRtl, rtl: docRtl })]
                  })
                );
              }

              if (note) {
                c.push(
                  new D.Paragraph({
                    alignment: rtlTextAlign,
                    bidirectional: docRtl,
                    spacing: { after: 40 },
                    children: [new D.TextRun({ text: gt(note), size: 17, color: "6a7488", font: f, rightToLeft: docRtl, rtl: docRtl })]
                  })
                );
              }
            });
          }

          el.querySelectorAll(".lang-item").forEach((li: any) => {
            c.push(
              new D.Paragraph({
                alignment: rtlTextAlign,
                bidirectional: docRtl,
                spacing: { after: 40 },
                children: [
                  new D.TextRun({ text: docRtl ? "‏• " : "• ", size: 20, color: navy, font: f, rightToLeft: docRtl, rtl: docRtl }),
                  new D.TextRun({ text: gt(li), size: 20, color: "33394a", font: f, rightToLeft: docRtl, rtl: docRtl })
                ]
              })
            );
          });

          const knowNote = el.querySelector(".know-note");
          if (knowNote) {
            c.push(
              new D.Paragraph({
                alignment: rtlTextAlign,
                bidirectional: docRtl,
                spacing: { after: 80 },
                children: [new D.TextRun({ text: gt(knowNote), size: 18, color: "3a4150", font: f, rightToLeft: docRtl, rtl: docRtl })]
              })
            );
          }
        });

        const footerEl = page.querySelector(".footer");
        if (footerEl) {
          c.push(mkRule());
          c.push(
            new D.Paragraph({
              alignment: rtlTextAlign,
              bidirectional: docRtl,
              spacing: { before: 80 },
              shading: { type: D.ShadingType.SOLID, color: navy, fill: navy },
              children: [
                new D.TextRun({
                  text: "  " + gt(footerEl) + "  ",
                  bold: true,
                  size: 20,
                  color: "eef2fb",
                  font: f,
                  rightToLeft: docRtl,
                  rtl: docRtl
                })
              ]
            })
          );
        }

        const pageNumEl = page.querySelector(".page-num");
        if (pageNumEl) {
          c.push(
            new D.Paragraph({
              alignment: rtlTextAlign,
              bidirectional: docRtl,
              spacing: { before: 100 },
              children: [new D.TextRun({ text: gt(pageNumEl), size: 16, color: "9aa7c2", font: f, rightToLeft: docRtl, rtl: docRtl })]
            })
          );
        }

        sections.push({
          properties: {
            page: {
              size: { width: 11906, height: 16838 },
              margin: { top: 720, right: 850, bottom: 720, left: 850 }
            },
            bidi: docRtl
          },
          children: c
        });
      });

      const wordDoc = new D.Document({
        styles: {
          default: {
            document: {
              run: {
                font: f,
                rightToLeft: docRtl
              },
              paragraph: {
                spacing: { line: 240 },
                bidirectional: docRtl,
                alignment: rtlTextAlign
              }
            }
          }
        },
        sections: sections
      });

      const wordBlob = await D.Packer.toBlob(wordDoc);
      const url = URL.createObjectURL(wordBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = lang === "en" ? "Eitan_Baron_Resume.docx" : "איתן_ברון_קורות_חיים.docx";
      link.click();
      URL.revokeObjectURL(url);
    } catch (e: unknown) {
      console.error("Export Word error:", e);
      alert(lang === "en" ? "Error exporting Word: " + getErrorMessage(e) : "שגיאה בייצוא ל-Word: " + getErrorMessage(e));
    }
    setIsExporting(false);
  };

  return (
    <div className="space-y-6 text-right" dir="rtl">
      {/* Scope embedded CSS inside React head dynamically */}
      {cssContent && <style dangerouslySetInnerHTML={{ __html: cssContent }} />}

      {/* Modern High-End Swiss Controller Panel */}
      <div className="bg-[#FAF9F6] p-6 border border-black/10 flex flex-col md:flex-row justify-between items-stretch md:items-center gap-6">
        <div className="space-y-1 text-left">
          <h3 className="text-xl font-sans font-black text-[#1A1A1A] flex items-center justify-start gap-1.5 leading-none">
            מסוף קורות חיים של איתן
          </h3>
          <p className="text-xs sm:text-sm text-[#1A1A1A]/70 font-sans font-semibold">
            צפייה אינטראקטיבית ודיווח קורות חיים רשמי, מעובד ישירות מתוך הקוד המקורי ללא שינוי.
          </p>
        </div>

        {/* Polished switches and trigger elements */}
        <div className="flex flex-wrap items-center justify-end gap-3">
          {/* Language selection block */}
          <div className="flex border border-black/10">
            <button
              onClick={() => setLang("he")}
              className={`px-4 py-2 text-xs font-sans font-black tracking-wider transition-all duration-150 cursor-pointer ${
                lang === "he"
                  ? "bg-[#1A1A1A] text-[#FAF9F6]"
                  : "bg-transparent text-[#1A1A1A]/60 hover:text-[#1A1A1A]"
              }`}
            >
              עברית
            </button>
            <button
              onClick={() => setLang("en")}
              className={`px-4 py-2 text-xs font-sans font-black tracking-wider transition-all duration-150 cursor-pointer ${
                lang === "en"
                  ? "bg-[#1A1A1A] text-[#FAF9F6]"
                  : "bg-transparent text-[#1A1A1A]/60 hover:text-[#1A1A1A]"
              }`}
            >
              ENGLISH
            </button>
          </div>

          {/* View mode block */}
          <div className="flex border border-black/10">
            <button
              onClick={() => setViewMode("normal")}
              className={`p-2 flex items-center gap-1.5 text-xs font-sans font-black tracking-wider transition-all duration-150 cursor-pointer ${
                viewMode === "normal"
                  ? "bg-[#1A1A1A] text-[#FAF9F6]"
                  : "bg-transparent text-[#1A1A1A]/60 hover:text-[#1A1A1A]"
              }`}
              title="תצוגה רגילה"
            >
              <Smartphone className="w-4 h-4" />
              <span className="hidden sm:inline">רגילה</span>
            </button>
            <button
              onClick={() => setViewMode("wide")}
              className={`p-2 flex items-center gap-1.5 text-xs font-sans font-black tracking-wider transition-all duration-150 cursor-pointer ${
                viewMode === "wide"
                  ? "bg-[#1A1A1A] text-[#FAF9F6]"
                  : "bg-transparent text-[#1A1A1A]/60 hover:text-[#1A1A1A]"
              }`}
              title="תצוגה רחבה"
            >
              <Monitor className="w-4 h-4" />
              <span className="hidden sm:inline">רחבה</span>
            </button>
          </div>
        </div>
      </div>

      {/* Swiss Export Actions Toolbar - Perfectly styled to existing layout */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <button
          onClick={handleExportPNG}
          disabled={isExporting || !scriptsLoaded}
          className="flex items-center justify-center gap-2 px-5 py-4 border border-[#1A1A1A] text-[#1A1A1A] font-sans font-black text-xs tracking-wider uppercase transition-all duration-150 cursor-pointer hover:bg-[#e07631] hover:border-[#e07631] hover:text-white disabled:opacity-40"
        >
          {isExporting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Image className="w-4 h-4" />}
          להורדה כתמונה (PNG)
        </button>

        <button
          onClick={handleExportPDF}
          disabled={isExporting || !scriptsLoaded}
          className="flex items-center justify-center gap-2 px-5 py-4 border border-[#1A1A1A] text-[#1A1A1A] font-sans font-black text-xs tracking-wider uppercase transition-all duration-150 cursor-pointer hover:bg-[#e07631] hover:border-[#e07631] hover:text-white disabled:opacity-40"
        >
          {isExporting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
          הורדה כקובץ להדפסה (PDF)
        </button>

        <button
          onClick={handleExportWord}
          disabled={isExporting || !scriptsLoaded}
          className="flex items-center justify-center gap-2 px-5 py-4 border border-[#1A1A1A] text-[#1A1A1A] font-sans font-black text-xs tracking-wider uppercase transition-all duration-150 cursor-pointer hover:bg-[#e07631] hover:border-[#e07631] hover:text-white disabled:opacity-40"
        >
          {isExporting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          הורדה לעריכה כקובץ Word
        </button>
      </div>

      {/* CV Interactive Scrolling Stage Center Container */}
      <div className="cv-body-wrapper bg-[#F4F1EA] py-8 px-4 border border-black/10 overflow-x-auto select-none rounded-none flex justify-center">
        {htmlContent ? (
          <div
            ref={containerRef}
            className={`cv-view select-text text-right ${viewMode === "wide" ? "wide" : ""}`}
            style={{ width: "100%", maxWidth: viewMode === "wide" ? "none" : "794px" }}
            onClick={handleStageClick}
          >
            {/* Direct injection of stage markup, strictly guarded to avoid any styling leaking out */}
            <div id="doc" className={viewMode === "wide" ? "wide" : ""}>
              <ResumeMarkup html={htmlContent} />
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-white/70 space-y-3">
            <RefreshCw className="w-8 h-8 animate-spin" />
            <span className="text-sm font-sans font-bold">טוען קורות חיים...</span>
          </div>
        )}
      </div>

      {/* Fullscreen single-page viewer (wide view only) */}
      {isFullscreenOpen && (
        <div id="fsOverlay" style={{ display: "flex" }} dir={lang === "he" ? "rtl" : "ltr"}>
          {fsPageIndex > 0 && (
            <button
              id="fsLeft"
              className="fs-arrow fs-left"
              onClick={handleFsPrev}
              aria-label="prev"
            >
              &#8249;
            </button>
          )}
          <div id="fsScroll">
            <div id="fsPage" dangerouslySetInnerHTML={{ __html: fsPages[fsPageIndex] }} />
          </div>
          {fsPageIndex < fsPages.length - 1 && (
            <button
              id="fsRight"
              className="fs-arrow fs-right"
              onClick={handleFsNext}
              aria-label="next"
            >
              &#8250;
            </button>
          )}
          <button
            id="fsClose"
            className="fs-close"
            onClick={() => setIsFullscreenOpen(false)}
            aria-label="close"
          >
            &#10005;
          </button>
        </div>
      )}
    </div>
  );
};
