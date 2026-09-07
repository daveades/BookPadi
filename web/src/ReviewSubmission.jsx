import { useEffect, useState } from "react";

export default function ReviewSubmission({ bookId, onBack, onRead, onReviewed }) {
  const [book, setBook] = useState(null);
  const [form, setForm] = useState(null);
  const [reviewNote, setReviewNote] = useState("");
  const [loadingFailed, setLoadingFailed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch("/books/" + bookId)
      .then((response) => {
        if (!response.ok) throw new Error(response.status);
        return response.json();
      })
      .then((data) => {
        setBook(data);
        setForm({
          title: data.title || "",
          authors: (data.authors || []).join("\n"),
          topics: (data.topics || []).join("\n"),
          language: data.language || "en",
          pub_year: data.pub_year ? String(data.pub_year) : "",
          publisher: data.publisher || "",
          description: data.description || "",
          license_name: data.license_name || "Open Access",
          license_url: data.license_url || "https://creativecommons.org/",
        });
      })
      .catch(() => setLoadingFailed(true));
  }, [bookId]);

  function decide(status) {
    if (status === "rejected" && !reviewNote.trim()) {
      setError("Add a reason before rejecting this submission.");
      return;
    }

    setSaving(true);
    setError(null);
    fetch("/submissions/" + bookId, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        authors: form.authors.split("\n").map((name) => name.trim()).filter(Boolean),
        topics: form.topics.split("\n").map((name) => name.trim()).filter(Boolean),
        pub_year: form.pub_year || null,
        status,
        review_note: reviewNote,
      }),
    })
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || `Review failed (${response.status})`);
        onReviewed();
      })
      .catch((requestError) => setError(requestError.message))
      .finally(() => setSaving(false));
  }

  if (loadingFailed) {
    return (
      <section className="review">
        <button type="button" className="text-btn" onClick={onBack}>← Pending review</button>
        <p className="status">Could not load this submission.</p>
      </section>
    );
  }
  if (!book || !form) return <p className="status">Loading submission...</p>;

  return (
    <section className="review">
      <button type="button" className="text-btn review__back" onClick={onBack}>
        ← Pending review
      </button>
      <div className="review__head">
        <div>
          <h2 className="list-head">Review submission</h2>
          <p className="status">Correct metadata before making a decision.</p>
        </div>
        <div className="review__formats">
          {(book.formats || []).map((format) => (
            <button type="button" className="text-btn text-btn--strong" key={format} onClick={() => onRead(format)}>
              Read {format.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="review__form">
        <div className="form-grid">
          <label className="field">
            <span>Title *</span>
            <input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} disabled={saving} />
          </label>
          <label className="field">
            <span>Language code *</span>
            <input value={form.language} maxLength={3} onChange={(event) => setForm({ ...form, language: event.target.value.toLowerCase().trim() })} disabled={saving} />
          </label>
        </div>

        <div className="form-grid">
          <label className="field">
            <span>Authors, one per line *</span>
            <textarea rows={3} value={form.authors} onChange={(event) => setForm({ ...form, authors: event.target.value })} disabled={saving} />
          </label>
          <label className="field">
            <span>Topics, one per line *</span>
            <textarea rows={3} value={form.topics} onChange={(event) => setForm({ ...form, topics: event.target.value })} disabled={saving} />
          </label>
        </div>

        <div className="form-grid">
          <label className="field">
            <span>Publication year</span>
            <input type="number" min="1" max="2100" value={form.pub_year} onChange={(event) => setForm({ ...form, pub_year: event.target.value })} disabled={saving} />
          </label>
          <label className="field">
            <span>Publisher</span>
            <input value={form.publisher} onChange={(event) => setForm({ ...form, publisher: event.target.value })} disabled={saving} />
          </label>
        </div>

        <label className="field">
          <span>Description</span>
          <textarea rows={5} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} disabled={saving} />
        </label>

        <div className="form-grid">
          <label className="field">
            <span>License name</span>
            <input value={form.license_name} onChange={(event) => setForm({ ...form, license_name: event.target.value })} disabled={saving} />
          </label>
          <label className="field">
            <span>License URL</span>
            <input type="url" value={form.license_url} onChange={(event) => setForm({ ...form, license_url: event.target.value })} disabled={saving} />
          </label>
        </div>

        <label className="field">
          <span>Review note</span>
          <textarea rows={3} value={reviewNote} onChange={(event) => setReviewNote(event.target.value)} placeholder="Required when rejecting or approving with corrections" disabled={saving} />
        </label>

        {error && <p className="auth__error" role="alert">{error}</p>}

        <div className="review__actions">
          <button type="button" className="text-btn text-btn--delete" onClick={() => decide("rejected")} disabled={saving}>
            {saving ? "Saving..." : "Reject"}
          </button>
          <button type="button" className="btn" onClick={() => decide("approved")} disabled={saving}>
            {saving ? "Saving..." : "Approve"}
          </button>
        </div>
      </div>
    </section>
  );
}
