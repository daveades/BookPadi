import { useEffect, useState } from "react";
import { Navigate, Route, Routes, useLocation, useMatch, useNavigate } from "react-router-dom";
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
  const [query, setQuery] = useState("");
  const [books, setBooks] = useState(null);
  const [failed, setFailed] = useState(false);
  const [bookSession, setBookSession] = useState(0);
  const [history, setHistory] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyFailed, setHistoryFailed] = useState(false);
  const [addingBook, setAddingBook] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const bookMatch = useMatch("/books/:bookId");
  const readerMatch = useMatch("/books/:bookId/read/:format");
  const mode =
    location.pathname === "/"
      ? "browse"
      : location.pathname === "/library"
        ? "library"
        : location.pathname === "/search"
          ? "search"
          : null;

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
    setQuery("");
    if (next === "search") setBooks(null);
    if (next === "library") loadHistory();
    navigate(next === "browse" ? "/" : "/" + next);
  }

  function sourceRoute() {
    if (mode) return location.pathname;
    return location.state?.from || "/";
  }

  function openBook(id) {
    navigate("/books/" + encodeURIComponent(id), { state: { from: sourceRoute() } });
  }

  function resumeBook(book) {
    const isEpub =
      book.progress_format === "epub" ||
      (book.formats && book.formats.includes("epub") && !book.progress_format);
    const format = book.progress_format || (isEpub ? "epub" : "pdf");
    navigate("/books/" + encodeURIComponent(book.id) + "/read/" + format, {
      state: { from: sourceRoute() },
    });
  }

  function signOut() {
    fetch("/auth/logout", { method: "POST" });
    setUser(null);
    setHistory(null);
    navigate("/", { replace: true });
  }

  if (checking) return <p className="status status--page">Loading your library…</p>;

  if (!user || !user.email) {
    return (
      <div className="page">
        <div className="auth-heading">
          <h1 className="masthead">BookPadi</h1>
          <p>Your personal shelf for open books.</p>
        </div>
        <Auth onSignedIn={(data) => setUser({ id: data.id, email: data.email })} />
      </div>
    );
  }

  if (readerMatch) {
    const { bookId, format } = readerMatch.params;
    const supported = ["epub", "pdf", "html"].includes(format);

    return (
      <Routes>
        <Route
          path="/books/:bookId/read/:format"
          element={
            supported ? (
              <Read
                bookId={bookId}
                epub={format === "epub"}
                readFormat={format}
                onBack={() => {
                  setBookSession((number) => number + 1);
                  navigate("/books/" + encodeURIComponent(bookId), {
                    replace: true,
                    state: { from: location.state?.from || "/" },
                  });
                }}
              />
            ) : (
              <Navigate to={"/books/" + encodeURIComponent(bookId)} replace />
            )
          }
        />
      </Routes>
    );
  }

  const waiting = mode === "search" && !query;
  const results = (
    <>
      {waiting && <p className="status">Search for a title, an author or a topic.</p>}
      {!waiting && failed && <p className="status">The library did not answer.</p>}
      {!waiting && !failed && books === null && <p className="status">Loading.</p>}
      {!waiting && !failed && books !== null && books.length === 0 && (
        <p className="status">
          {mode === "search" ? `Nothing matches ${query}.` : "There are no books yet."}
        </p>
      )}
      {!waiting && !failed && books !== null && books.length > 0 && (
        <>
          {mode === "browse" ? (
            <h2 className="list-head">All books</h2>
          ) : (
            <p className="status">
              {books.length} {books.length === 1 ? "book" : "books"} for {query}
            </p>
          )}
          <BookList books={books} onSelect={openBook} />
        </>
      )}
    </>
  );

  return (
    <div className="page">
      <div className="masthead-row">
        <div>
          <h1 className="masthead">BookPadi</h1>
          <p className="masthead-note">Your reading shelf</p>
        </div>
        <span className="who">
          <button
            type="button"
            className="text-btn text-btn--strong"
            onClick={() => setAddingBook(true)}
          >
            + Add book
          </button>
          <button type="button" className="text-btn" onClick={signOut}>
            Sign out
          </button>
        </span>
      </div>

      {mode && (
        <nav className="modes" aria-label="Library sections">
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

      <Routes>
        <Route
          path="/"
          element={
            <>
              <ContinueReading history={history} onResume={resumeBook} onSelect={openBook} />
              {results}
            </>
          }
        />
        <Route
          path="/library"
          element={
            <Library
              history={history}
              loading={historyLoading}
              failed={historyFailed}
              onResume={resumeBook}
              onSelect={openBook}
              onBrowse={() => show("browse")}
            />
          }
        />
        <Route
          path="/search"
          element={
            <>
              <section className="search-view">
                <h2 className="list-head">Search the library</h2>
                <Search onSearch={search} />
              </section>
              {results}
            </>
          }
        />
        <Route
          path="/books/:bookId"
          element={
            <Book
              key={bookSession}
              bookId={bookMatch?.params.bookId}
              onRead={(_, format) =>
                navigate(
                  "/books/" + encodeURIComponent(bookMatch.params.bookId) + "/read/" + format,
                  { state: { from: location.state?.from || "/" } },
                )
              }
              onBack={() => navigate(location.state?.from || "/")}
            />
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {addingBook && (
        <AddBook
          onClose={() => setAddingBook(false)}
          onBookAdded={(newId) => {
            setAddingBook(false);
            load("/books");
            loadHistory();
            navigate("/books/" + encodeURIComponent(newId), { state: { from: "/" } });
          }}
        />
      )}
    </div>
  );
}
