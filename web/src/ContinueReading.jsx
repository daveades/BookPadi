export function formatTimeAgo(isoDate) {
  if (!isoDate) return "";
  const date = new Date(isoDate);
  const now = new Date();
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSec < 60) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function ContinueReading({ history, onResume, onSelect }) {
  if (!history || history.length === 0) return null;

  const current = history[0];
  const timeAgo = formatTimeAgo(current.updated_at);

  return (
    <section className="continue-card" aria-label="Continue reading">
      <div className="continue-card__header">
        <h2 className="continue-card__tag">Continue reading</h2>
        {timeAgo && <span className="continue-card__time">{timeAgo}</span>}
      </div>

      <div className="continue-card__content">
        {current.cover_ref ? (
          <img
            className="continue-card__cover"
            src={"/books/" + current.id + "/cover"}
            alt=""
            loading="lazy"
          />
        ) : (
          <span className="continue-card__cover continue-card__cover--placeholder" aria-hidden="true" />
        )}
        <div className="continue-card__info">
          <h3 className="continue-card__title">{current.title}</h3>
          <p className="continue-card__authors">
            {current.authors && current.authors.join(", ")}
          </p>

          <div className="continue-card__actions">
            <button
              type="button"
              className="btn btn--resume"
              onClick={() => onResume(current)}
            >
              Resume reading
            </button>
            <button
              type="button"
              className="text-btn text-btn--muted"
              onClick={() => onSelect(current.id)}
            >
              Book details
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
