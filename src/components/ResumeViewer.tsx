import React, { useEffect, useState, useRef } from "react";
import { Download, FileDown, Image, Monitor, Smartphone, RefreshCw } from "lucide-react";

export const ResumeViewer: React.FC = () => {
  const [htmlContent, setHtmlContent] = useState<string>("");
  const [cssContent, setCssContent] = useState<string>("");
  const [lang, setLang] = useState<"he" | "en">("he");
  const [viewMode, setViewMode] = useState<"normal" | "wide">("normal");
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [scriptsLoaded, setScriptsLoaded] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

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

  // Fetch the resume HTML file and extract styles & stage elements
  useEffect(() => {
    fetch("/resume.html")
      .then((res) => {
        if (!res.ok) throw new Error("Could not find resume.html");
        return res.text();
      })
      .then((html) => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");

        // Extract style content
        const styleTags = doc.querySelectorAll("style");
        let mergedStyles = "";
        styleTags.forEach((style) => {
          mergedStyles += style.textContent || "";
        });

        // Scope styles to stay inside .cv-body-wrapper rather than polluting page body
        let cleanStyles = mergedStyles
          .replace(/body\s*{/g, ".cv-body-wrapper {")
          .replace(/html,\s*body\s*{/g, ".cv-html-body-wrapper {")
          .replace(/html\.exporting-shot/g, ".exporting-shot");

        setCssContent(cleanStyles);

        // Extract stage contents
        const stage = doc.getElementById("stage");
        if (stage) {
          // Remove default buttons/switches in raw HTML content so we can supply polished native React buttons
          setHtmlContent(stage.outerHTML);
        } else {
          // Fallback if structure is slightly different
          const bodyContent = doc.body.innerHTML;
          setHtmlContent(bodyContent);
        }
      })
      .catch((err) => {
        console.error("Error loading original resume html:", err);
      });
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
    const stage = containerRef.current.querySelector("#stage") as HTMLDivElement;
    if (!stage) return;

    const availW = containerRef.current.clientWidth - 32;
    const availH = window.innerHeight * 0.75; // Estimate comfortable height inside active scope

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
      const stage = containerRef.current?.querySelector("#stage") as HTMLDivElement;
      if (stage) {
        stage.style.removeProperty("--wide-scale");
      }
    }
    return () => {
      window.removeEventListener("resize", updateWideScale);
    };
  }, [viewMode, htmlContent]);

  // Export functions (implemented with native window references matching resume.html original export mechanics)
  const setButtonsBusy = (isBusy: boolean) => {
    setIsExporting(isBusy);
  };

  const runShot = async (el: HTMLElement) => {
    const html2canvas = (window as any).html2canvas;
    if (!html2canvas) throw new Error("html2canvas library not loaded");

    const scale = 3;
    const captureRect = el.getBoundingClientRect();
    const captureWidth = Math.ceil(captureRect.width);
    const captureHeight = Math.ceil(Math.max(captureRect.height, el.scrollHeight));

    const canvas = await html2canvas(el, {
      scale,
      backgroundColor: "#ffffff",
      useCORS: true,
      width: captureWidth,
      height: captureHeight,
      windowWidth: captureWidth,
      windowHeight: captureHeight,
      onclone: (clonedDoc: Document) => {
        clonedDoc.documentElement.classList.add("exporting-shot");
        const clonedPage = clonedDoc.querySelector(".page") as HTMLElement;
        if (clonedPage) {
          clonedPage.style.width = `${captureWidth}px`;
          clonedPage.style.maxWidth = "none";
        }
        const style = clonedDoc.createElement("style");
        style.textContent = `
          .experience::before, .edu-timeline::before { content: none !important; display: none !important; opacity: 0 !important; background: transparent !important; }
          .exp-dot, .edu-dot { visibility: hidden !important; box-shadow: none !important; }
        `;
        clonedDoc.head.appendChild(style);
      }
    });

    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      const pr = captureRect;

      // Redraw the timeline and dots manually over standard canvas drawing to guarantee HD prints
      el.querySelectorAll(".experience, .edu-timeline").forEach((timeline: any) => {
        const firstDot = timeline.querySelector(".exp-dot, .edu-dot");
        if (!firstDot) return;
        const timelineRect = timeline.getBoundingClientRect();
        const dotRect = firstDot.getBoundingClientRect();
        const cssObj = getComputedStyle(timeline, "::before");
        const timelineCss = getComputedStyle(timeline);

        const railWidth = parseFloat(cssObj.width) || 0;
        const railTop = parseFloat(cssObj.top) || 0;
        const railBottom = parseFloat(cssObj.bottom) || 0;
        const railRight = parseFloat(cssObj.right);
        const railLeft = parseFloat(cssObj.left);

        let centerCssX = dotRect.left - pr.left + dotRect.width / 2;
        if (Number.isFinite(railRight)) {
          centerCssX =
            timelineRect.right - pr.left - (parseFloat(timelineCss.paddingLeft) || 0) - railRight + railWidth / 2;
        } else if (Number.isFinite(railLeft)) {
          centerCssX =
            timelineRect.left - pr.left + (parseFloat(timelineCss.paddingRight) || 0) + railLeft + railWidth / 2;
        }

        const cssPx = canvas.width / pr.width;

        // Draw the rail
        if (railWidth > 0 && timelineRect.bottom > timelineRect.top) {
          ctx.beginPath();
          ctx.moveTo(centerCssX * cssPx, (timelineRect.top - pr.top + railTop) * cssPx);
          ctx.lineTo(centerCssX * cssPx, (timelineRect.bottom - pr.top - railBottom) * cssPx);
          ctx.lineWidth = railWidth * cssPx;
          ctx.lineCap = "round";
          ctx.strokeStyle = cssObj.backgroundColor || "#b9c6dd";
          ctx.stroke();
        }
      });

      // Redraw dots
      el.querySelectorAll(".exp-dot, .edu-dot").forEach((dot: any) => {
        const r = dot.getBoundingClientRect();
        const cssObj = getComputedStyle(dot);
        const cssPx = canvas.width / pr.width;
        const borderWidth = parseFloat(cssObj.borderTopWidth) || 0;

        const parseSpread = (boxShadowStr: string) => {
          const parts = boxShadowStr.match(/-?\d*\.?\d+px/g) || [];
          return parts.length >= 4 ? parseFloat(parts[3]) : 0;
        };

        const parseColor = (boxShadowStr: string) => {
          const match = boxShadowStr.match(/^(rgba?\([^)]+\)|#[0-9a-fA-F]+|[a-zA-Z]+)/);
          return match ? match[1] : "#b9c6dd";
        };

        const shadowSpread = parseSpread(cssObj.boxShadow);
        const shadowColor = parseColor(cssObj.boxShadow);

        const cx = (r.left - pr.left + r.width / 2) * cssPx;
        const cy = (r.top - pr.top + r.height / 2) * cssPx;
        const borderBoxRadius = (r.width / 2) * cssPx;

        const outerRadius = borderBoxRadius + shadowSpread * cssPx;
        const borderRadius = borderBoxRadius;
        const fillRadius = Math.max(0, borderBoxRadius - borderWidth * cssPx);

        // Render outer spread ring
        if (outerRadius > 0) {
          ctx.beginPath();
          ctx.arc(cx, cy, outerRadius, 0, 2 * Math.PI);
          ctx.fillStyle = shadowColor;
          ctx.fill();
        }

        // Render line border
        if (borderRadius > 0) {
          ctx.beginPath();
          ctx.arc(cx, cy, borderRadius, 0, 2 * Math.PI);
          ctx.fillStyle = cssObj.borderTopColor;
          ctx.fill();
        }

        // Render inner dot core
        if (fillRadius > 0) {
          ctx.beginPath();
          ctx.arc(cx, cy, fillRadius, 0, 2 * Math.PI);
          ctx.fillStyle = cssObj.backgroundColor;
          ctx.fill();
        }
      });

      ctx.restore();
    }

    return canvas;
  };

  const handleExportPNG = async () => {
    if (!scriptsLoaded) return;
    setButtonsBusy(true);
    try {
      const pages = containerRef.current?.querySelectorAll(".page");
      if (!pages || pages.length === 0) throw new Error("No page elements found under container");

      for (let i = 0; i < pages.length; i++) {
        const canvas = await runShot(pages[i] as HTMLElement);
        const link = document.createElement("a");
        link.download = (lang === "en" ? "Eitan_Baron_Resume_page_" : "איתן_ברון_קורות_חיים_עמוד_") + (i + 1) + ".png";
        link.href = canvas.toDataURL("image/png");
        link.click();
        if (i < pages.length - 1) {
          await new Promise((r) => setTimeout(r, 500));
        }
      }
    } catch (e: any) {
      alert(lang === "en" ? "Exception exporting Image: " + e.message : "שגיאה בייצוא תמונה: " + e.message);
    }
    setButtonsBusy(false);
  };

  const handleExportPDF = async () => {
    if (!scriptsLoaded) return;
    setButtonsBusy(true);
    try {
      const pages = containerRef.current?.querySelectorAll(".page");
      if (!pages || pages.length === 0) throw new Error("No pages found");

      const windowJS = window as any;
      const jspdfObj = windowJS.jspdf;
      if (!jspdfObj) throw new Error("jsPDF library not accessible");

      const pdf = new jspdfObj.jsPDF("p", "mm", "a4");
      const pw = pdf.internal.pageSize.getWidth();
      const ph = pdf.internal.pageSize.getHeight();

      for (let i = 0; i < pages.length; i++) {
        const canvas = await runShot(pages[i] as HTMLElement);
        const img = canvas.toDataURL("image/jpeg", 0.95);
        if (i > 0) pdf.addPage();
        pdf.addImage(img, "JPEG", 0, 0, pw, ph);
      }
      pdf.save(lang === "en" ? "Eitan_Baron_Resume.pdf" : "איתן_ברון_קורות_חיים.pdf");
    } catch (e: any) {
      alert(lang === "en" ? "Exception exporting PDF: " + e.message : "שגיאה בייצוא PDF: " + e.message);
    }
    setButtonsBusy(false);
  };

  const handleExportWord = async () => {
    if (!scriptsLoaded) return;
    setButtonsBusy(true);
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
                          rightToLeft: true
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
                  new D.TextRun({ text: label + ":  ", bold: true, size: 19, color: navy, font: f, rightToLeft: docRtl, rtl: docRtl }),
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
    } catch (e: any) {
      alert(lang === "en" ? "Error exporting Word: " + e.message : "שגיאה בייצוא ל-Word: " + e.message);
    }
    setButtonsBusy(false);
  };

  return (
    <div className="space-y-6 text-right" dir="rtl">
      {/* Scope embedded CSS inside React head dynamically */}
      {cssContent && <style dangerouslySetInnerHTML={{ __html: cssContent }} />}

      {/* Modern High-End Swiss Controller Panel */}
      <div className="bg-[#FAF9F6] p-6 border border-black/10 flex flex-col md:flex-row justify-between items-stretch md:items-center gap-6">
        <div className="space-y-1 text-right">
          <h3 className="text-xl font-sans font-black text-[#1A1A1A] flex items-center justify-end gap-1.5 leading-none">
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
      <div className="cv-body-wrapper bg-[#5b6578] py-8 px-4 border border-black/10 overflow-x-auto select-none rounded-none flex justify-center">
        {htmlContent ? (
          <div
            ref={containerRef}
            className={`cv-view select-text text-right ${viewMode === "wide" ? "wide" : ""}`}
            style={{ width: "100%", maxWidth: "794px" }}
          >
            {/* Direct injection of stage markup, strictly guarded to avoid any styling leaking out */}
            <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-white/70 space-y-3">
            <RefreshCw className="w-8 h-8 animate-spin" />
            <span className="text-sm font-sans font-bold">טוען קורות חיים...</span>
          </div>
        )}
      </div>
    </div>
  );
};
