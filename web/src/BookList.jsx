export default function BookList({ books, onSelect }) {
  return (
    <ul className="books">
      {books.map((book) => (
        <li className="book" key={book.id}>
          <h2 className="book__title">
            <button
              type="button"
              className="book__select"
              onClick={() => onSelect(book.id)}
            >
              {book.title}
            </button>
          </h2>
          <p className="book__authors">{book.authors.join(", ")}</p>
        </li>
      ))}
    </ul>
  );
}
