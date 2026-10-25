import unittest
from pathlib import Path

from app.runtime import resolve_session_secret


class SessionSecretTests(unittest.TestCase):
    def test_production_without_a_secret_fails(self):
        with self.assertRaises(RuntimeError):
            resolve_session_secret("production", None)

    def test_other_deployed_environment_without_a_secret_fails(self):
        with self.assertRaises(RuntimeError):
            resolve_session_secret("staging", "")

    def test_unset_environment_starts_without_a_secret(self):
        secret = resolve_session_secret(None, None)
        self.assertTrue(secret)

    def test_development_without_a_secret_starts(self):
        secret = resolve_session_secret("development", None)
        self.assertTrue(secret)

    def test_readme_names_the_public_deploy_variables(self):
        readme = Path("README.md").read_text(encoding="utf-8")
        self.assertIn("APP_ENV", readme)
        self.assertIn("SECRET_KEY", readme)


if __name__ == "__main__":
    unittest.main()
