import unittest

from pydantic import ValidationError

from app.schemas.project import (
    ProjectCreate,
    ProjectRoleInput,
    clean_project_filters,
    resolve_role_replacement,
)


class ProjectFilterTests(unittest.TestCase):
    def test_search_longer_than_100_characters_is_rejected(self):
        with self.assertRaises(ValueError):
            clean_project_filters("x" * 101, [])

    def test_whitespace_only_search_is_ignored(self):
        self.assertEqual(clean_project_filters("   ", []), (None, []))

    def test_eleventh_skill_filter_is_rejected(self):
        with self.assertRaises(ValueError):
            clean_project_filters(None, [f"skill-{index}" for index in range(11)])

    def test_repeated_skill_filter_counts_once(self):
        self.assertEqual(
            clean_project_filters(None, ["python", "python"]),
            (None, ["python"]),
        )


class RoleReplacementTests(unittest.TestCase):
    def test_omitted_filled_flag_keeps_the_stored_value(self):
        writes, removed = resolve_role_replacement(
            [{"id": 4, "filled": True}],
            [{"id": 4, "title": "Backend", "skills": ["python"]}],
        )
        self.assertTrue(writes[0]["filled"])
        self.assertEqual(removed, set())

    def test_foreign_role_id_leaves_current_rows_unchanged(self):
        current = [{"id": 4, "filled": True}]
        snapshot = [dict(row) for row in current]
        with self.assertRaises(ValueError):
            resolve_role_replacement(
                current,
                [{"id": 9, "title": "Other", "skills": ["python"]}],
            )
        self.assertEqual(current, snapshot)

    def test_new_role_without_filled_starts_unfilled(self):
        writes, removed = resolve_role_replacement(
            [{"id": 4, "filled": True}],
            [{"title": "Design", "skills": ["figma"]}],
        )
        self.assertFalse(writes[0]["filled"])
        self.assertEqual(removed, {4})


class SingleLineTextTests(unittest.TestCase):
    def test_title_newline_is_rejected(self):
        with self.assertRaises(ValidationError):
            ProjectCreate(
                title="Hello\nthere",
                summary="A short summary",
                description="A description",
                contact_email="lead@example.com",
            )

    def test_role_title_newline_is_rejected(self):
        with self.assertRaises(ValidationError):
            ProjectRoleInput(title="Front\nend", skills=["python"])


if __name__ == "__main__":
    unittest.main()
