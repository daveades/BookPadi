import unittest

from bookpadi.chunks import chunk_sections, text_units


class ChunkingTests(unittest.TestCase):
    def section(self, text, order=0, locator=None):
        return {
            "order": order,
            "title": "Chapter One",
            "locator": locator or {"page_start": 1, "page_end": 2},
            "text": text,
        }

    def test_prefers_sentence_boundaries(self):
        chunks = chunk_sections(
            [self.section("One two three. Four five six. Seven eight nine.")],
            target_words=6,
            max_words=8,
            overlap_words=0,
            min_words=1,
        )

        self.assertEqual([chunk["content"] for chunk in chunks], ["One two three. Four five six.", "Seven eight nine."])

    def test_splits_long_sentences_at_the_maximum(self):
        text = " ".join(f"word{number}" for number in range(13))

        units = text_units(text, 5)
        chunks = chunk_sections(
            [self.section(text)],
            target_words=5,
            max_words=5,
            overlap_words=1,
            min_words=1,
        )

        self.assertEqual([len(unit.split()) for unit in units], [5, 5, 3])
        self.assertTrue(all(len(chunk["content"].split()) <= 5 for chunk in chunks))

    def test_adds_bounded_overlap_without_overlap_only_chunks(self):
        text = "One two three. Four five six. Seven eight nine. Ten eleven twelve."

        chunks = chunk_sections(
            [self.section(text)],
            target_words=6,
            max_words=9,
            overlap_words=3,
            min_words=1,
        )

        self.assertEqual(len(chunks), 2)
        first_words = chunks[0]["content"].split()
        second_words = chunks[1]["content"].split()
        self.assertEqual(first_words[-3:], second_words[:3])
        self.assertNotEqual(chunks[0]["content"], chunks[1]["content"])
        self.assertTrue(all(len(chunk["content"].split()) <= 9 for chunk in chunks))

    def test_merges_a_short_final_tail_when_it_fits(self):
        chunks = chunk_sections(
            [self.section("One two three four five. Six seven.")],
            target_words=5,
            max_words=10,
            overlap_words=2,
            min_words=4,
        )

        self.assertEqual(len(chunks), 1)
        self.assertEqual(chunks[0]["content"], "One two three four five. Six seven.")

    def test_preserves_metadata_and_is_deterministic(self):
        locator = {"href": "OPS/chapter.xhtml", "position": {"section": 2}}
        sections = [self.section("One two three. Four five six.", order=3, locator=locator)]

        first = chunk_sections(sections, target_words=3, max_words=5, overlap_words=1, min_words=1)
        second = chunk_sections(sections, target_words=3, max_words=5, overlap_words=1, min_words=1)

        self.assertEqual(first, second)
        self.assertEqual([chunk["chunk_order"] for chunk in first], [0, 1])
        self.assertTrue(all(chunk["section_order"] == 3 for chunk in first))
        self.assertTrue(all(chunk["section_title"] == "Chapter One" for chunk in first))
        first[0]["locator"]["position"]["section"] = 99
        self.assertEqual(locator["position"]["section"], 2)
        self.assertEqual(first[1]["locator"]["position"]["section"], 2)

    def test_rejects_invalid_settings_and_sections(self):
        valid = [self.section("Searchable text.")]
        invalid_settings = (
            {"target_words": 0},
            {"max_words": 10, "target_words": 20},
            {"overlap_words": -1},
            {"target_words": 10, "overlap_words": 10},
            {"min_words": 20, "target_words": 10},
        )
        for settings in invalid_settings:
            with self.subTest(settings=settings):
                with self.assertRaises(ValueError):
                    chunk_sections(valid, **settings)

        invalid_sections = (
            None,
            {"order": -1, "title": "Title", "locator": {}, "text": "Text"},
            {"order": 0, "title": "", "locator": {}, "text": "Text"},
            {"order": 0, "title": "Title", "locator": None, "text": "Text"},
            {"order": 0, "title": "Title", "locator": {}, "text": ""},
        )
        for section in invalid_sections:
            with self.subTest(section=section):
                with self.assertRaises(ValueError):
                    chunk_sections([section])


if __name__ == "__main__":
    unittest.main()
