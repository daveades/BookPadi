import copy
import re

from xaperio.content import normalize_text

DEFAULT_TARGET_WORDS = 140
DEFAULT_MAX_WORDS = 180
DEFAULT_OVERLAP_WORDS = 30
DEFAULT_MIN_WORDS = 40


def text_units(text, max_words):
    if not isinstance(max_words, int) or isinstance(max_words, bool) or max_words < 1:
        raise ValueError("max_words must be a positive integer")

    text = normalize_text(text)
    if not text:
        return []

    units = []
    for paragraph in text.split("\n\n"):
        sentences = re.split(r"(?<=[.!?])\s+", paragraph)
        for sentence in sentences:
            words = sentence.split()
            for start in range(0, len(words), max_words):
                unit = " ".join(words[start : start + max_words])
                if unit:
                    units.append(unit)
    return units


def chunk_sections(
    sections,
    target_words=DEFAULT_TARGET_WORDS,
    max_words=DEFAULT_MAX_WORDS,
    overlap_words=DEFAULT_OVERLAP_WORDS,
    min_words=DEFAULT_MIN_WORDS,
):
    settings = {
        "target_words": target_words,
        "max_words": max_words,
        "overlap_words": overlap_words,
        "min_words": min_words,
    }
    for name, value in settings.items():
        if not isinstance(value, int) or isinstance(value, bool):
            raise ValueError(f"{name} must be an integer")
    if min_words < 1:
        raise ValueError("min_words must be positive")
    if target_words < min_words:
        raise ValueError("target_words must be at least min_words")
    if max_words < target_words:
        raise ValueError("max_words must be at least target_words")
    if overlap_words < 0 or overlap_words >= target_words:
        raise ValueError("overlap_words must be non-negative and smaller than target_words")

    try:
        sections = list(sections)
    except TypeError as exc:
        raise ValueError("sections must be iterable") from exc

    chunks = []
    seen_section_orders = set()
    for section in sections:
        if not isinstance(section, dict):
            raise ValueError("each section must be a dictionary")
        section_order = section.get("order")
        if (
            not isinstance(section_order, int)
            or isinstance(section_order, bool)
            or section_order < 0
            or section_order in seen_section_orders
        ):
            raise ValueError("each section must have a unique non-negative integer order")
        seen_section_orders.add(section_order)

        title = normalize_text(section.get("title"))
        if not title:
            raise ValueError("each section must have a non-empty title")
        locator = section.get("locator")
        if not isinstance(locator, dict):
            raise ValueError("each section must have a dictionary locator")
        text = normalize_text(section.get("text"))
        if not text:
            raise ValueError("each section must have non-empty text")

        units = text_units(text, max_words)
        groups = []
        current = []
        current_word_count = 0
        for unit in units:
            unit_word_count = len(unit.split())
            exceeds_target = current and current_word_count + unit_word_count > target_words
            can_fill_small_group = current_word_count < min_words and current_word_count + unit_word_count <= max_words
            if exceeds_target and not can_fill_small_group:
                groups.append(" ".join(current))
                current = []
                current_word_count = 0
            current.append(unit)
            current_word_count += unit_word_count
        if current:
            groups.append(" ".join(current))

        if len(groups) > 1:
            final_words = groups[-1].split()
            previous_words = groups[-2].split()
            if len(final_words) < min_words and len(previous_words) + len(final_words) <= max_words:
                groups[-2] = " ".join(previous_words + final_words)
                groups.pop()

        previous_words = []
        for chunk_order, group in enumerate(groups):
            group_words = group.split()
            overlap_count = min(overlap_words, len(previous_words), max_words - len(group_words))
            overlap = previous_words[-overlap_count:] if overlap_count else []
            content = " ".join(overlap + group_words)
            chunks.append(
                {
                    "section_order": section_order,
                    "chunk_order": chunk_order,
                    "section_title": title,
                    "locator": copy.deepcopy(locator),
                    "content": content,
                }
            )
            previous_words = group_words
    return chunks
