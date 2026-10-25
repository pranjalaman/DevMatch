import unittest
from datetime import date

from pathlib import Path

from app.academic_year import academic_facts, joined_year_in_window, owner_view
from app.matcher import suggest_members


OCTOBER_2026 = date(2026, 10, 26)
JULY_2027 = date(2027, 7, 31)
AUGUST_2027 = date(2027, 8, 1)


class AcademicYearTests(unittest.TestCase):
    def test_october_2026_is_session_2026(self):
        facts = academic_facts(2024, OCTOBER_2026)
        self.assertEqual(facts["session_year"], 2026)
        self.assertEqual(facts["standing"], "Year 3")
        self.assertEqual((facts["window_start"], facts["window_end"]), (2021, 2026))

    def test_july_2027_is_still_session_2026(self):
        facts = academic_facts(2024, JULY_2027)
        self.assertEqual(facts["session_year"], 2026)
        self.assertEqual(facts["standing"], "Year 3")

    def test_august_2027_moves_a_2024_join_to_year_4(self):
        self.assertEqual(academic_facts(2024, AUGUST_2027)["standing"], "Year 4")

    def test_2027_join_is_incoming_and_2020_join_is_finished(self):
        self.assertEqual(academic_facts(2027, OCTOBER_2026)["standing"], "Incoming")
        self.assertEqual(academic_facts(2020, OCTOBER_2026)["standing"], "Finished")

    def test_lead_and_suggestion_for_a_2024_join_are_year_3(self):
        lead = owner_view(7, "Ada", 2024, OCTOBER_2026)
        self.assertEqual(lead, {"id": 7, "name": "Ada", "standing": "Year 3"})
        suggestions = suggest_members(
            1,
            ["python"],
            [
                {
                    "id": 2,
                    "name": "Ada",
                    "branch": "CSE",
                    "standing": lead["standing"],
                    "skills": ["python"],
                }
            ],
        )
        self.assertEqual(suggestions[0]["standing"], "Year 3")
        self.assertNotIn("email", suggestions[0])
        self.assertNotIn("joined_year", suggestions[0])

    def test_backfill_sql_matches_the_design_and_keeps_the_drop_separate(self):
        sql = Path("schema/joined-year.sql").read_text(encoding="utf-8")
        backfill, drop = sql.split("-- Run this only after", 1)
        self.assertIn("ADD COLUMN joined_year", backfill)
        self.assertIn("EXTRACT(MONTH FROM CURRENT_DATE) >= 8", backfill)
        self.assertIn("ALTER COLUMN joined_year SET NOT NULL", backfill)
        self.assertNotIn("DROP COLUMN year", backfill)
        self.assertIn("DROP COLUMN year", drop)

    def test_joining_window_is_the_current_year_and_five_before_it(self):
        self.assertTrue(joined_year_in_window(2026, OCTOBER_2026))
        self.assertTrue(joined_year_in_window(2021, OCTOBER_2026))
        self.assertTrue(joined_year_in_window(2024, OCTOBER_2026))
        self.assertFalse(joined_year_in_window(2020, OCTOBER_2026))
        self.assertFalse(joined_year_in_window(2027, OCTOBER_2026))
        self.assertFalse(joined_year_in_window(2018, OCTOBER_2026))

if __name__ == "__main__":
    unittest.main()
