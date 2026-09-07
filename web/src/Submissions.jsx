import { useEffect, useState } from "react";

export default function Submissions({ isAdmin, onReview }) {
  const [submissions, setSubmissions] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    fetch("/submissions")
      .then((response) => {
        if (!response.ok) throw new Error(response.status);
        return response.json();
      })
      .then(setSubmissions)
      .catch(() => setFailed(true));
  }, []);

  if (failed) return <p className="status">Could not load submissions.</p>;
  if (submissions === null) return <p className="status">Loading submissions...</p>;

  return (
    <section className="submissions">
      <div className="submissions__head">
        <h2 className="list-head">{isAdmin ? "Pending review" : "My submissions"}</h2>
        <span className="submissions__count">{submissions.length}</span>
      </div>

      {submissions.length === 0 ? (
        <p className="status">
          {isAdmin ? "There are no books waiting for review." : "You have not submitted a book."}
        </p>
      ) : (
        <ul className="submissions__list">
          {submissions.map((submission) => (
            <li className="submission" key={submission.id}>
              <div className="submission__main">
                <span className="submission__title">{submission.title}</span>
                <span className="submission__authors">
                  {(submission.authors || []).join(", ")}
                </span>
                <span className="submission__date">
                  Submitted {new Date(submission.submitted_at).toLocaleDateString()}
                </span>
                {submission.review_note && (
                  <p className="submission__note">
                    <strong>Review note:</strong> {submission.review_note}
                  </p>
                )}
              </div>
              {isAdmin ? (
                <button
                  type="button"
                  className="text-btn text-btn--strong"
                  onClick={() => onReview(submission.id)}
                >
                  Review
                </button>
              ) : (
                <span className={`submission__status submission__status--${submission.moderation_status}`}>
                  {submission.moderation_status}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
