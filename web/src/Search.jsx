import { useState } from "react";

export default function Search({ onSearch }) {
  const [value, setValue] = useState("");

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
          placeholder="A topic, a title, an author"
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
          <svg width="15" height="15" viewBox="0 0 16 16" aria-hidden="true">
            <path
              d="M8 13.5V3M8 3L3.5 7.5M8 3l4.5 4.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    </form>
  );
}
