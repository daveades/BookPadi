import { useState } from "react";

export default function Search({ onSearch, initialValue = "" }) {
  const [value, setValue] = useState(initialValue);

  return (
    <form
      className="ask"
      onSubmit={(event) => {
        event.preventDefault();
        const query = value.trim();
        if (query) onSearch(query);
      }}
    >
      <div className="ask__box">
        <textarea
          className="ask__field"
          rows={1}
          value={value}
          aria-label="Search the library"
          placeholder="How does recursion work?"
          autoComplete="off"
          autoFocus
          onChange={(event) => {
            setValue(event.target.value);
            event.target.style.height = "auto";
            event.target.style.height = event.target.scrollHeight + "px";
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              const query = value.trim();
              if (query) onSearch(query);
            }
          }}
        />
        <button className="ask__send" type="submit" aria-label="Search" disabled={!value.trim()}>
          Search
        </button>
      </div>
    </form>
  );
}
