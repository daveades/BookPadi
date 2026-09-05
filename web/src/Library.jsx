import { formatTimeAgo } from "./ContinueReading";

export default function Library({ history, loading, failed, onResume, onSelect, onBrowse }) {
  if (loading) {
    return <p className="status">Loading your library...</p>;
  }

  if (failed) {
    return <p className="status">Could not load your library.</p>;
  }

  if (!history || history.length === 0) {
    return (
      <div className="library-empty">
        <h2 className="list-head">Your Library</h2>
        <p className="status">
          You haven&apos;t started reading any books yet. Once you open a book to read, your
          reading progress will be automatically saved and displayed here.
        </p>
        <p>
          <button type="button" className="btn" onClick={onBrowse}>
            Explore Books
          </button>
        </p>
      </div>
    );
  }

  return (
    <section className="library" aria-label="Reading history">
      <div className="library__head">
        <h2 className="list-head">Reading History</h2>
        <span className="library__count">
          {history.length} {history.length === 1 ? "book" : "books"} started
        </span>
      </div>

      <ul className="library__list">
        {history.map((book) => {
          const timeAgo = formatTimeAgo(book.updated_at);

          return (
            <li key={book.id} className="library-item">
              <div className="library-item__main">
                {book.cover_ref ? (
                  <img
                    className="library-item__cover"
                    src={"/books/" + book.id + "/cover"}
                    alt=""
                    loading="lazy"
                  />
                ) : (
                  <div className="library-item__cover library-item__cover--placeholder" />
                )}

                <div className="library-item__body">
                  <button
                    type="button"
                    className="library-item__title"
                    onClick={() => onResume(book)}
                  >
                    {book.title}
                  </button>
                  <p className="library-item__authors">
                    {book.authors && book.authors.join(", ")}
                  </p>

                  {timeAgo && (
                    <div className="library-item__meta">
                      <span className="library-item__time">Read {timeAgo}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="library-item__actions">
                <button
                  type="button"
                  className="btn btn--resume"
                  onClick={() => onResume(book)}
                >
                  Resume
                </button>
                <button
                  type="button"
                  className="text-btn text-btn--muted"
                  onClick={() => onSelect(book.id)}
                >
                  Details
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
