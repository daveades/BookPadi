export default function BookList({ books }) {
  return (
    <ul className="books">
      {books.map((book) => (
        <li className="book" key={book.id}>
          <h2 className="book__title">{book.title}</h2>
          <p className="book__authors">{book.authors.join(", ")}</p>
        </li>
      ))}
    </ul>
  );
}
