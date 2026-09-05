import { useEffect, useState } from "react";
import AddBook from "./AddBook";
import Auth from "./Auth";
import Book from "./Book";
import BookList from "./BookList";
import ContinueReading from "./ContinueReading";
import Library from "./Library";
import Read from "./Read";
import Search from "./Search";

export default function App() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);
  const [mode, setMode] = useState("browse");
  const [view, setView] = useState("list");
  const [bookId, setBookId] = useState(null);
  const [epub, setEpub] = useState(false);
  const [readFormat, setReadFormat] = useState(null);
  const [query, setQuery] = useState("");
  const [books, setBooks] = useState(null);
  const [failed, setFailed] = useState(false);
  const [bookSession, setBookSession] = useState(0);
  const [history, setHistory] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyFailed, setHistoryFailed] = useState(false);
  const [addingBook, setAddingBook] = useState(false);

  useEffect(() => {
    fetch("/auth/me")
      .then((response) => response.json())
      .then((data) => setUser(data.user))
      .catch(() => setUser(null))
      .finally(() => setChecking(false));
  }, []);

  function loadHistory() {
    setHistoryLoading(true);
    setHistoryFailed(false);
    fetch("/books/history")
      .then((response) => {
        if (!response.ok) throw new Error(response.status);
        return response.json();
      })
      .then(setHistory)
      .catch(() => setHistoryFailed(true))
      .finally(() => setHistoryLoading(false));
  }

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
    if (user) {
      loadHistory();
    } else {
      setHistory(null);
    }
  }, [user, bookSession]);

  useEffect(() => {
    if (mode === "browse" && user) load("/books");
  }, [mode, user]);

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
    if (next === "library") loadHistory();
  }

  function openBook(id) {
    setBookId(id);
    setView("book");
  }

  function resumeBook(book) {
    setBookId(book.id);
    const isEpub =
      book.progress_format === "epub" ||
      (book.formats && book.formats.includes("epub") && !book.progress_format);
    const format = book.progress_format || (isEpub ? "epub" : "pdf");
    setEpub(isEpub);
    setReadFormat(format);
    setView("read");
  }

  function signOut() {
    fetch("/auth/logout", { method: "POST" });
    setUser(null);
    setHistory(null);
    setView("list");
    setBookId(null);
  }

  if (checking) return <p className="status">Loading.</p>;

  if (!user || !user.email) {
    return (
      <div className="page">
        <h1 className="masthead">BookPadi</h1>
        <Auth onSignedIn={(data) => setUser({ id: data.id, email: data.email })} />
      </div>
    );
  }

  const waiting = mode === "search" && !query;

  if (view === "read") {
    return (
      <Read
        bookId={bookId}
        epub={epub}
        readFormat={readFormat}
        onBack={() => {
          setView("book");
          setBookSession((n) => n + 1);
        }}
      />
    );
  }

  return (
    <div className="page">
      <div className="masthead-row">
        <h1 className="masthead">BookPadi</h1>
        <span className="who">
          <button
            type="button"
            className="text-btn text-btn--strong"
            onClick={() => setAddingBook(true)}
          >
            + Add book
          </button>
          <span>{user.email}</span>
          <button type="button" className="text-btn" onClick={signOut}>
            Sign out
          </button>
        </span>
      </div>

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
            className={mode === "library" ? "mode mode--on" : "mode"}
            onClick={() => show("library")}
            aria-pressed={mode === "library"}
          >
            My Library
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

      {view === "list" && mode === "library" && (
        <Library
          history={history}
          loading={historyLoading}
          failed={historyFailed}
          onResume={resumeBook}
          onSelect={openBook}
          onBrowse={() => show("browse")}
        />
      )}

      {view === "list" && mode === "search" && <Search onSearch={search} />}

      {view === "book" && (
        <Book
          key={bookSession}
          bookId={bookId}
          onRead={(isEpub, format) => {
            setEpub(isEpub);
            setReadFormat(format);
            setView("read");
          }}
          onBack={() => setView("list")}
        />
      )}

      {view === "list" && mode === "browse" && (
        <ContinueReading
          history={history}
          onResume={resumeBook}
          onSelect={openBook}
        />
      )}

      {view === "list" && mode !== "library" && waiting && (
        <p className="status">Search for a title, an author or a topic.</p>
      )}
      {view === "list" && mode !== "library" && !waiting && failed && (
        <p className="status">The library did not answer.</p>
      )}
      {view === "list" && mode !== "library" && !waiting && !failed && books === null && (
        <p className="status">Loading.</p>
      )}

      {view === "list" && mode !== "library" && !waiting && !failed && books !== null && books.length === 0 && (
        <p className="status">
          {mode === "search" ? `Nothing matches ${query}.` : "There are no books yet."}
        </p>
      )}

      {view === "list" && mode !== "library" && !waiting && !failed && books !== null && books.length > 0 && (
        <>
          {mode === "browse" ? (
            <h2 className="list-head">Recently added</h2>
          ) : (
            <p className="status">
              {books.length} {books.length === 1 ? "book" : "books"} for {query}
            </p>
          )}
          <BookList books={books} onSelect={openBook} />
        </>
      )}

      {addingBook && (
        <AddBook
          onClose={() => setAddingBook(false)}
          onBookAdded={(newId) => {
            setAddingBook(false);
            load("/books");
            loadHistory();
            openBook(newId);
          }}
        />
      )}
    </div>
  );
}

