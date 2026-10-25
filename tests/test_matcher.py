import unittest

from app.matcher.matcher import (
    build_suggestion_groups,
    calculate_match,
    suggest_members,
    visible_match,
)


def role(role_id, title, skills, filled=False):
    return {"id": role_id, "title": title, "skills": skills, "filled": filled}


class MatchScoreTests(unittest.TestCase):
    def test_complete_overlap_scores_100(self):
        result = calculate_match(
            ["python"],
            ["python"],
            [role(1, "Backend", ["python"])],
        )
        self.assertEqual(result.score, 100)
        self.assertEqual(result.best_role, "Backend")
        self.assertEqual(result.matched_skills, ["python"])

    def test_one_of_eight_rounds_half_up_to_13(self):
        skills = [f"skill-{index}" for index in range(8)]
        result = calculate_match(
            ["skill-0"],
            skills,
            [role(1, "Generalist", skills)],
        )
        self.assertEqual(result.score, 13)

    def test_caller_must_omit_filled_role_skills_from_the_stack(self):
        result = calculate_match(
            ["python"],
            ["figma"],
            [
                role(1, "Backend", ["python"], filled=True),
                role(2, "Design", ["figma"]),
            ],
        )
        self.assertEqual(result.score, 0)
        self.assertEqual(result.matched_skills, [])
        self.assertIsNone(result.best_role)

    def test_empty_required_set_adds_nothing(self):
        result = calculate_match(
            ["python"],
            [],
            [role(1, "Unspecified", [])],
        )
        self.assertEqual(result.score, 0)
        self.assertIsNone(result.best_role)
        self.assertEqual(result.role_fit, 0.0)

    def test_lower_role_id_wins_an_equal_fit(self):
        result = calculate_match(
            ["python", "react"],
            ["python", "react"],
            [
                role(5, "Later", ["react"]),
                role(2, "Earlier", ["python"]),
            ],
        )
        self.assertEqual(result.best_role, "Earlier")

    def test_larger_overlap_wins_an_equal_fit(self):
        result = calculate_match(
            ["python", "django"],
            ["python", "django"],
            [
                role(1, "Narrow", ["python"]),
                role(2, "Wide", ["python", "django"]),
            ],
        )
        self.assertEqual(result.best_role, "Wide")

    def test_reason_chips_lead_with_the_best_role(self):
        result = calculate_match(
            ["react", "arduino", "css", "docker"],
            ["react", "arduino", "css", "docker", "sql"],
            [
                role(1, "Frontend", ["react"]),
                role(2, "Hardware", ["arduino", "css", "docker", "sql"]),
            ],
        )
        self.assertEqual(result.best_role, "Frontend")
        self.assertEqual(result.matched_skills, ["react", "arduino", "css"])


class MatchVisibilityTests(unittest.TestCase):
    def test_owner_and_filled_project_have_no_match_object(self):
        roles = [role(1, "Backend", ["python"])]
        self.assertIsNone(visible_match(7, 7, ["python"], roles))
        filled = [role(1, "Backend", ["python"], filled=True)]
        self.assertIsNone(visible_match(3, 7, ["python"], filled))

    def test_zero_overlap_still_returns_a_match_object(self):
        match = visible_match(3, 7, ["python"], [role(1, "Design", ["figma"])])
        self.assertEqual(match["score"], 0)
        self.assertEqual(match["matched_skills"], [])
        self.assertIsNone(match["best_role"])

    def test_closed_project_has_no_suggestions(self):
        groups = build_suggestion_groups(
            "closed",
            1,
            [role(1, "Backend", ["python"])],
            [{"id": 2, "name": "Ada", "branch": "CSE", "standing": "Year 1", "skills": ["python"]}],
        )
        self.assertEqual(groups, [])

    def test_suggestions_skip_the_owner_and_sort_names(self):
        students = [
            {"id": 1, "name": "Owner", "branch": "CSE", "standing": "Year 2", "skills": ["python"]},
            {"id": 2, "name": "bina", "branch": "IT", "standing": "Year 1", "skills": ["python"]},
            {"id": 3, "name": "Ada", "branch": "ECE", "standing": "Year 1", "skills": ["python"]},
        ]
        suggestions = suggest_members(1, ["python"], students)
        self.assertEqual([person["name"] for person in suggestions], ["Ada", "bina"])
        self.assertNotIn("email", suggestions[0])


if __name__ == "__main__":
    unittest.main()
