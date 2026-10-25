import unittest
from pathlib import Path

from pydantic import ValidationError

from app.schemas.auth import LoginData, SignupData
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
                year=1,
            )

    def test_signup_branch_outside_the_list_is_rejected(self):
        with self.assertRaises(ValidationError):
            SignupData(
                name="Ada",
                email="ada@example.com",
                password="long-enough",
                branch="Banana",
                year=1,
            )

    def test_login_accepts_a_password_longer_than_128(self):
        login = LoginData(email="ada@example.com", password="p" * 129)
        self.assertEqual(len(login.password), 129)


if __name__ == "__main__":
    unittest.main()
