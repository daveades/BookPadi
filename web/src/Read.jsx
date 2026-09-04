import { useEffect, useRef, useState } from "react";
import ePub from "epubjs";

export default function Read({ bookId, epub, onBack }) {
  const epubHost = useRef(null);
  const rendition = useRef(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!epub) return;
    let stopped = false;
    let r;

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
        await r.display();
      } catch (err) {
        if (!stopped) setFailed(true);
      }
    }

    openBlock();

    return () => {
      stopped = true;
      rendition.current = null;
      if (r) r.destroy();
    };
  }, [bookId, epub]);

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
        className="reader__frame"
        src={"/books/" + bookId + "/read"}
        title="Book"
      />
    </div>
  );
}
