import { useEffect, useState } from "react";

export default function Book({ bookId, onRead, onBack }) {
  const [book, setBook] = useState(null);
  const [failed, setFailed] = useState(false);
  const [missing, setMissing] = useState(false);
  const [coverHidden, setCoverHidden] = useState(false);

  useEffect(() => {
    setBook(null);
    setFailed(false);
    setMissing(false);
    setCoverHidden(false);
    fetch("/books/" + bookId)
      .then((response) => {
        if (response.status === 404) {
          setMissing(true);
          return null;
        }
        if (!response.ok) throw new Error(response.status);
        return response.json();
      })
      .then((data) => {
        if (data) setBook(data);
      })
      .catch(() => setFailed(true));
  }, [bookId]);

  if (failed || missing || book === null) {
    return (
      <article className="detail">
        <p className="detail__nav">
          <button type="button" className="text-btn" onClick={onBack}>
            Back
          </button>
        </p>
        <p className="status">
          {failed
            ? "The library did not answer."
            : missing
              ? "This book is not in the library."
              : "Loading."}
        </p>
      </article>
    );
  }

  const facts = [
    book.language,
    book.pub_year,
    book.publisher,
    book.edition,
  ].filter(Boolean);

  return (
    <article className="detail">
      <p className="detail__nav">
        <button type="button" className="text-btn" onClick={onBack}>
          Back
        </button>
      </p>

      <div className="detail__head">
        {!coverHidden && (
          <img
            className="detail__cover"
            src={"/books/" + bookId + "/cover"}
            alt=""
            onError={() => setCoverHidden(true)}
          />
        )}
        <div>
          <h2 className="detail__title">{book.title}</h2>
          <p className="detail__authors">{book.authors.join(", ")}</p>
          <p className="detail__actions">
            <button type="button" className="text-btn text-btn--strong" onClick={onRead}>
              Read
            </button>
          </p>
        </div>
      </div>

      {book.description && <p className="detail__blurb">{book.description}</p>}

      {facts.length > 0 && <p className="detail__meta">{facts.join(", ")}</p>}

      {book.topics && book.topics.length > 0 && (
        <p className="detail__meta">{book.topics.join(", ")}</p>
      )}

      <p className="detail__meta">
        <a href={book.license_url}>{book.license_name}</a>
      </p>

      {book.formats && book.formats.length > 0 && (
        <p className="detail__meta">{book.formats.join(", ")}</p>
      )}
    </article>
  );
}
