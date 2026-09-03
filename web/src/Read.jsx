export default function Read({ bookId, onBack }) {
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
