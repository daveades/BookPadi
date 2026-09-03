import { useEffect, useState } from "react";
import Book from "./Book";
import BookList from "./BookList";
import Read from "./Read";
import Search from "./Search";

export default function App() {
  const [mode, setMode] = useState("browse");
  const [view, setView] = useState("list");
  const [bookId, setBookId] = useState(null);
  const [query, setQuery] = useState("");
  const [books, setBooks] = useState(null);
  const [failed, setFailed] = useState(false);

  function load(path) {
    setBooks(null);
    setFailed(false);
    fetch(path)
      .then((response) => {
        if (!response.ok) throw new Error(response.status);
        return response.json();
      })
      .then(setBooks)
      .catch(() => setFailed(true));
  }

  useEffect(() => {
    if (mode === "browse") load("/books");
  }, [mode]);

  function search(text) {
    setQuery(text);
    load("/search?q=" + encodeURIComponent(text));
  }

  function show(next) {
    setMode(next);
    setView("list");
    setBookId(null);
    setQuery("");
    if (next === "search") setBooks(null);
  }

  function openBook(id) {
    setBookId(id);
    setView("book");
  }

  const waiting = mode === "search" && !query;

  if (view === "read") {
    return <Read bookId={bookId} onBack={() => setView("book")} />;
  }

  return (
    <div className="page">
      <h1 className="masthead">BookPadi</h1>

      {view === "list" && (
        <nav className="modes">
          <button
            className={mode === "browse" ? "mode mode--on" : "mode"}
            onClick={() => show("browse")}
            aria-pressed={mode === "browse"}
          >
            Browse
          </button>
          <button
            className={mode === "search" ? "mode mode--on" : "mode"}
            onClick={() => show("search")}
            aria-pressed={mode === "search"}
          >
            Search
          </button>
        </nav>
      )}

      {view === "list" && mode === "search" && <Search onSearch={search} />}

      {view === "book" && (
        <Book
          bookId={bookId}
          onRead={() => setView("read")}
          onBack={() => setView("list")}
        />
      )}

      {view === "list" && waiting && (
        <p className="status">Search for a title, an author or a topic.</p>
      )}
      {view === "list" && !waiting && failed && (
        <p className="status">The library did not answer.</p>
      )}
      {view === "list" && !waiting && !failed && books === null && (
        <p className="status">Loading.</p>
      )}

      {view === "list" && !waiting && !failed && books !== null && books.length === 0 && (
        <p className="status">
          {mode === "search" ? `Nothing matches ${query}.` : "There are no books yet."}
        </p>
      )}

      {view === "list" && !waiting && !failed && books !== null && books.length > 0 && (
        <>
          <p className="status">
            {books.length} {books.length === 1 ? "book" : "books"}
            {mode === "search" ? ` for ${query}` : ""}
          </p>
          <BookList books={books} onSelect={openBook} />
        </>
      )}
    </div>
  );
}
