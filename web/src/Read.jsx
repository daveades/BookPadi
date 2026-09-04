import { useEffect, useRef, useState } from "react";
import ePub from "epubjs";

export default function Read({ bookId, epub, readFormat, onBack }) {
  const epubHost = useRef(null);
  const frameRef = useRef(null);
  const rendition = useRef(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!epub) return;
    let stopped = false;
    let r;
    let saveTimer;
    let lastCfi = null;

    function flush() {
      if (lastCfi == null) return;
      const cfi = lastCfi;
      lastCfi = null;
      fetch("/books/" + bookId + "/progress", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ position: cfi, format: "epub" }),
      }).catch(() => {});
    }

    async function openBlock() {
      try {
        const res = await fetch("/books/" + bookId + "/read?format=epub");
        if (!res.ok) throw new Error(res.status);
        const buf = await res.arrayBuffer();
        const book = ePub(buf);
        r = book.renderTo(epubHost.current, {
          width: "100%",
          height: "100%",
          spread: "none",
        });
        if (stopped) {
          r.destroy();
          return;
        }
        rendition.current = r;

        const saved = await fetch("/books/" + bookId + "/progress")
          .then((x) => x.json())
          .catch(() => ({}));
        const start = saved && saved.position;

        await r.display(start || undefined);

        r.on("relocated", () => {
          const loc = r.currentLocation();
          const cfi = loc && loc.start && loc.start.cfi;
          if (!cfi) return;
          lastCfi = cfi;
          clearTimeout(saveTimer);
          saveTimer = setTimeout(flush, 300);
        });
      } catch (err) {
        if (!stopped) setFailed(true);
      }
    }

    openBlock();

    return () => {
      stopped = true;
      rendition.current = null;
      clearTimeout(saveTimer);
      flush();
      if (r) r.destroy();
    };
  }, [bookId, epub]);

  useEffect(() => {
    if (epub) return;
    let saveTimer;
    let interval;
    const frame = frameRef.current;
    let saved = null;
    let last = null;
    const isHtml = readFormat === "html";

    function doc() {
      return frame && frame.contentDocument
        ? frame.contentDocument
        : frame && frame.contentWindow
          ? frame.contentWindow.document
          : null;
    }

    function currentPosition() {
      const documentEl = doc();
      if (!documentEl) return null;
      const win = frame.contentWindow;
      const top = win.scrollY || win.pageYOffset || 0;
      if (top <= 0) return "top:0";
      if (!isHtml) return String(top || 0);
      const sections = Array.from(documentEl.querySelectorAll("h1[id], h2[id], h3[id]"));
      let section = null;
      for (const el of sections) {
        if (el.getBoundingClientRect().top <= 1) section = el;
        else break;
      }
      if (!section) return "top:0";
      return section.id + ":" + (top - section.offsetTop);
    }

    function flush() {
      if (last == null) return;
      const pos = last;
      last = null;
      fetch("/books/" + bookId + "/progress", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ position: String(pos), format: isHtml ? "html" : "pdf" }),
      }).catch(() => {});
    }

    function onChange() {
      const documentEl = doc();
      if (!documentEl) return;
      if (frame.contentDocument && !frame.contentDocument.body) return;
      const position = currentPosition();
      if (position == null) return;
      last = position;
      clearTimeout(saveTimer);
      saveTimer = setTimeout(flush, 300);
    }

    function restore() {
      if (!frame || !frame.contentWindow || saved == null) return;
      try {
        const win = frame.contentWindow;
        const documentEl = doc();
        if (!documentEl) return;
        if (isHtml && typeof saved === "string" && saved.includes(":")) {
          const i = saved.indexOf(":");
          const section = documentEl.getElementById(saved.slice(0, i));
          if (section) {
            win.scrollTo(0, section.offsetTop + Number(saved.slice(i + 1)) || 0);
            return;
          }
        }
        win.scrollTo(0, Number(saved) || 0);
      } catch (err) {
        /* not readable (e.g. PDF viewer) */
      }
    }

    fetch("/books/" + bookId + "/progress")
      .then((x) => x.json())
      .then((data) => {
        if (data && data.position != null) {
          saved = data.position;
          if (saved !== "") restore();
        }
      })
      .catch(() => {});

    const frameWin = frame && frame.contentWindow;
    const frameDoc = frame && frame.contentDocument;

    frame && frame.addEventListener("load", restore);
    frameWin && frameWin.addEventListener("scroll", onChange);
    frameDoc && frameDoc.addEventListener("scroll", onChange, true);
    interval = setInterval(() => {
      if (last != null) flush();
    }, 2000);

    return () => {
      clearTimeout(saveTimer);
      clearInterval(interval);
      flush();
      if (frame) {
        frame.removeEventListener("load", restore);
      }
      if (frameWin) {
        frameWin.removeEventListener("scroll", onChange);
      }
      if (frameDoc) {
        frameDoc.removeEventListener("scroll", onChange, true);
      }
    };
  }, [bookId, epub, readFormat]);

  if (epub) {
    return (
      <div className="reader">
        <p className="reader__bar">
          <button type="button" className="text-btn" onClick={onBack}>
            Back
          </button>
          <span className="reader__spacer" />
          <button
            type="button"
            className="text-btn"
            onClick={() => rendition.current && rendition.current.prev()}
          >
            Previous
          </button>
          <span className="reader__sep">/</span>
          <button
            type="button"
            className="text-btn"
            onClick={() => rendition.current && rendition.current.next()}
          >
            Next
          </button>
        </p>
        <div ref={epubHost} className="reader__epub">
          {failed && <p className="reader__error">This book could not be opened.</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="reader">
      <p className="reader__bar">
        <button type="button" className="text-btn" onClick={onBack}>
          Back
        </button>
      </p>
      <iframe
        ref={frameRef}
        className="reader__frame"
        src={"/books/" + bookId + "/read"}
        title="Book"
      />
    </div>
  );
}
