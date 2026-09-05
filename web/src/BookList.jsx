export default function BookList({ books, onSelect }) {
  return (
    <ul className="books">
      {books.map((book) => (
        <li className="book" key={book.id}>
          <button
            type="button"
            className="book__select"
            onClick={() => onSelect(book.id)}
          >
            {book.cover_ref ? (
              <img
                className="book__cover"
                src={"/books/" + book.id + "/cover"}
                alt=""
                loading="lazy"
              />
            ) : (
              <span className="book__cover book__cover--placeholder" aria-hidden="true" />
            )}
            <span className="book__text">
              <span className="book__title">{book.title}</span>
              <span className="book__authors">{book.authors.join(", ")}</span>
            </span>
            <span className="book__arrow" aria-hidden="true">›</span>
          </button>
        </li>
      ))}
    </ul>
  );
}
