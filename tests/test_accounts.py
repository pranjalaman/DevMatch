import unittest
from pathlib import Path

from pydantic import ValidationError

from datetime import date

from app.academic_year import joined_year_in_window, with_standing
from app.schemas.auth import LoginData, SignupData
from app.schemas.profile import ProfileDetails
from app.skill_names import SKILL_ALIASES, resolve_skill_list


CATALOG = [
    {"slug": "javascript", "label": "JavaScript"},
    {"slug": "python", "label": "Python"},
    {"slug": "c++", "label": "C++"},
]


class SkillResolutionTests(unittest.TestCase):
    def test_cpp_alias_and_javascript_alias_store_canonical_slugs(self):
        resolved, unknown = resolve_skill_list(["cpp", "JS"], CATALOG)
        self.assertEqual(resolved, ["c++", "javascript"])
        self.assertEqual(unknown, [])

    def test_display_label_is_accepted(self):
        resolved, unknown = resolve_skill_list(["Python"], CATALOG)
        self.assertEqual(resolved, ["python"])
        self.assertEqual(unknown, [])

    def test_unknown_token_is_rejected(self):
        resolved, unknown = resolve_skill_list(["not-a-skill"], CATALOG)
        self.assertEqual(resolved, [])
        self.assertEqual(unknown, ["not-a-skill"])

    def test_frontend_shortcut_map_includes_the_server_aliases(self):
        helpers = Path("frontend/js/helpers.js").read_text(encoding="utf-8")
        for alias, slug in SKILL_ALIASES.items():
            quoted_alias = f"'{alias}'" if "." in alias else alias
            self.assertIn(quoted_alias, helpers)
            self.assertIn(f"'{slug}'", helpers)


class AccountSchemaTests(unittest.TestCase):
    def test_signup_password_longer_than_128_is_rejected(self):
        with self.assertRaises(ValidationError):
            SignupData(
                name="Ada",
                email="ada@example.com",
                password="p" * 129,
                branch="CSE",
                joined_year=2024,
            )

    def test_signup_branch_outside_the_list_is_rejected(self):
        with self.assertRaises(ValidationError):
            SignupData(
                name="Ada",
                email="ada@example.com",
                password="long-enough",
                branch="Banana",
                joined_year=2024,
            )

    def test_joining_year_2024_is_accepted_in_the_2026_session(self):
        self.assertTrue(joined_year_in_window(2024, date(2026, 10, 26)))

    def test_study_year_only_body_is_rejected(self):
        with self.assertRaises(ValidationError):
            SignupData(
                name="Ada",
                email="ada@example.com",
                password="long-enough",
                branch="CSE",
                year=2,
            )

    def test_2018_is_rejected_on_26_october_2026(self):
        self.assertFalse(joined_year_in_window(2018, date(2026, 10, 26)))
        self.assertFalse(joined_year_in_window(2020, date(2026, 10, 26)))
        self.assertFalse(joined_year_in_window(2027, date(2026, 10, 26)))

    def test_profile_accepts_github_gender_and_dob(self):
        profile = ProfileDetails(
            joined_year=2024,
            github_url="https://github.com/ada/",
            gender="female",
            dob="2004-03-02",
        )
        self.assertEqual(profile.github_url, "https://github.com/ada")
        self.assertEqual(profile.gender, "female")
        self.assertEqual(profile.dob, date(2004, 3, 2))

    def test_profile_rejects_a_repository_link_and_a_future_birthday(self):
        with self.assertRaises(ValidationError):
            ProfileDetails(joined_year=2024, github_url="https://github.com/ada/devmatch")
        with self.assertRaises(ValidationError):
            ProfileDetails(joined_year=2024, dob="2099-01-01")

    def test_signup_control_asks_for_the_joining_year(self):
        signup = Path("frontend/js/views/auth.js").read_text(encoding="utf-8")
        self.assertIn("Year you joined", signup)
        self.assertIn("joiningYearChoices", signup)
        self.assertNotIn("year <= 5", signup)

    def test_profile_read_for_a_2024_join_in_the_2026_session(self):
        profile = with_standing({"joined_year": 2024}, date(2026, 10, 26))
        self.assertEqual(profile["joined_year"], 2024)
        self.assertEqual(profile["standing"], "Year 3")

    def test_login_accepts_a_password_longer_than_128(self):
        login = LoginData(email="ada@example.com", password="p" * 129)
        self.assertEqual(len(login.password), 129)


if __name__ == "__main__":
    unittest.main()
