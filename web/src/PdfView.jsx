import { useRef, useState, useEffect, useCallback } from "react";
import * as pdfjsLib from "pdfjs-dist";
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

const PAGE_WIDTH = 720;

export default function PdfView({ bookId, onBack }) {
  const hostRef = useRef(null);
  const pdfRef = useRef(null);
  const pagesRef = useRef([]);
  const observerRef = useRef(null);
  const scrollRef = useRef(null);
  const currentRef = useRef(1);
  const scaleRef = useRef(1);
  const activeRef = useRef(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [failed, setFailed] = useState(false);

  const renderPage = useCallback(async (num) => {
    const pdf = pdfRef.current;
    if (!pdf) return;
    const pd = pagesRef.current[num - 1];
    if (!pd || pd.rendering || pd.rendered === scaleRef.current) return;
    pd.rendering = true;
    try {
      const pg = await pdf.getPage(num);
      if (!activeRef.current || pagesRef.current[num - 1] !== pd) return;
      const viewport = pg.getViewport({ scale: scaleRef.current });
      const canvas = pd.canvas;
      if (!canvas) return;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.floor(viewport.width * dpr);
      canvas.height = Math.floor(viewport.height * dpr);
      canvas.style.width = viewport.width + "px";
      canvas.style.height = viewport.height + "px";
      const ctx = canvas.getContext("2d");
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      pd.task = pg.render({ canvasContext: ctx, viewport });
      await pd.task.promise;
      pd.rendered = scaleRef.current;
    } catch (err) {
      if (err.name !== "RenderingCancelledException") {
        console.error(`Page ${num} render error:`, err);
      }
    } finally {
      pd.rendering = false;
      pd.task = null;
    }
  }, []);

  const goTo = useCallback(
    (pg) => {
      if (pg < 1 || pg > pagesRef.current.length) return;
      const pd = pagesRef.current[pg - 1];
      if (pd && pd.el && scrollRef.current) {
        scrollRef.current.scrollTop = pd.el.offsetTop;
        setPage(pg);
        currentRef.current = pg;
        renderPage(pg);
      }
    },
    [renderPage],
  );

  useEffect(() => {
    let stopped = false;
    let saveTimer;
    let restoreTimer;
    let intervalTimer;
    activeRef.current = true;

    function flush() {
      const c = currentRef.current;
      if (c < 1) return;
      fetch("/books/" + bookId + "/progress", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ position: String(c), format: "pdf" }),
      }).catch(() => {});
    }

    function onScroll() {
      const scrollEl = scrollRef.current;
      if (!scrollEl) return;
      const top = scrollEl.scrollTop;
      let cur = 1;
      for (const pd of pagesRef.current) {
        if (pd.el && pd.el.offsetTop <= top + 4) cur = pd.num;
      }
      if (cur !== currentRef.current) {
        currentRef.current = cur;
        setPage(cur);
      }
    }

    function onScrollSave() {
      clearTimeout(saveTimer);
      saveTimer = setTimeout(flush, 300);
    }

    async function open() {
      try {
        const res = await fetch("/books/" + bookId + "/read?format=pdf", {
          cache: "no-store",
        });
        if (!res.ok) throw new Error(res.status);
        const buf = await res.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
        if (stopped) {
          await pdf.destroy();
          return;
        }
        pdfRef.current = pdf;
        setTotal(pdf.numPages);

        pagesRef.current = Array.from({ length: pdf.numPages }, (_, i) => ({
          num: i + 1,
          el: null,
          rendering: false,
          rendered: false,
          task: null,
          canvas: null,
        }));

        currentRef.current = 1;

        const cWidth =
          (hostRef.current?.clientWidth || scrollRef.current?.clientWidth || window.innerWidth) - 40;
        scaleRef.current = Math.min(PAGE_WIDTH, Math.max(280, cWidth)) / PAGE_WIDTH;

        const obs = new IntersectionObserver(
          (entries) => {
            for (const e of entries) {
              if (e.isIntersecting)
                renderPage(Number(e.target.dataset.page));
            }
          },
          { root: scrollRef.current, rootMargin: "800px 0px", threshold: 0 },
        );
        observerRef.current = obs;

        renderPage(1);

        const scrollEl = scrollRef.current;
        if (scrollEl) {
          scrollEl.addEventListener("scroll", onScroll, { passive: true });
          scrollEl.addEventListener("scroll", onScrollSave, { passive: true });
        }

        intervalTimer = setInterval(flush, 2000);

        fetch("/books/" + bookId + "/progress")
          .then((x) => x.json())
          .then((data) => {
            if (stopped) return;
            if (data && data.position != null) {
              const pg = Number(data.position);
              if (pg >= 1 && pg <= pdf.numPages)
                restoreTimer = setTimeout(() => {
                  goTo(pg);
                  renderPage(pg);
                }, 100);
            }
          })
          .catch(() => {});
      } catch (err) {
        console.error("Failed to open PDF:", err);
        if (!stopped) setFailed(true);
      }
    }

    open();

    return () => {
      stopped = true;
      activeRef.current = false;
      clearTimeout(saveTimer);
      clearTimeout(restoreTimer);
      clearInterval(intervalTimer);
      flush();
      if (observerRef.current) observerRef.current.disconnect();
      if (scrollRef.current) {
        scrollRef.current.removeEventListener("scroll", onScroll);
        scrollRef.current.removeEventListener("scroll", onScrollSave);
      }
      for (const pd of pagesRef.current) {
        if (pd.task) pd.task.cancel();
      }
      const pdf = pdfRef.current;
      pdfRef.current = null;
      pagesRef.current = [];
      currentRef.current = 1;
      if (pdf) pdf.destroy().catch(() => {});
    };
  }, [bookId, renderPage, goTo]);

  if (failed) {
    return (
      <div ref={hostRef} className="reader">
        <p className="reader__bar">
          <button type="button" className="text-btn" onClick={onBack}>
            Back
          </button>
        </p>
        <p className="reader__error" style={{ position: "static", margin: "2rem 1.5rem" }}>
          This PDF could not be opened.
        </p>
      </div>
    );
  }

  return (
    <div ref={hostRef} className="reader">
      <p className="reader__bar">
        <button type="button" className="text-btn" onClick={onBack}>
          Back
        </button>
        <span className="reader__spacer" />
        <button
          type="button"
          className="text-btn"
          onClick={() => goTo(page - 1)}
          disabled={page <= 1}
        >
          Previous
        </button>
        <span className="reader__sep">/</span>
        <button
          type="button"
          className="text-btn"
          onClick={() => goTo(page + 1)}
          disabled={page >= total}
        >
          Next
        </button>
        <span className="reader__sep">/</span>
        <span className="reader__info">
          {page} / {total}
        </span>
      </p>
      <div ref={scrollRef} className="reader__pdf">
        {pagesRef.current.map((pd) => (
          <div
            key={pd.num}
            ref={(el) => {
              if (pd.el && observerRef.current && pd.el !== el) {
                observerRef.current.unobserve(pd.el);
              }
              pd.el = el;
              if (el && observerRef.current) {
                observerRef.current.observe(el);
              }
            }}
            data-page={pd.num}
            className="reader__pdf-page"
          >
            <canvas
              ref={(c) => { pd.canvas = c; }}
              className="reader__pdf-canvas"
            />
            <p className="reader__pdf-label">{pd.num}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
