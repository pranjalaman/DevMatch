import unittest

from app.github_client import RepoFetch, decide_repo_meta


PREVIOUS = {"stars": 4, "language": "Python", "pushed_at": "2026-01-01T00:00:00Z", "fetched_at": "2026-01-01T00:00:00+00:00"}
FRESH = {"stars": 9, "language": "Python", "pushed_at": "2026-02-01T00:00:00Z", "fetched_at": "2026-02-01T00:00:00+00:00"}


class RepoMetaDecisionTests(unittest.TestCase):
    def test_unchanged_url_keeps_snapshot_when_the_fetch_fails(self):
        kept = decide_repo_meta(
            url_removed=False,
            url_changed=False,
            fetch=RepoFetch("failure", None),
            previous=PREVIOUS,
        )
        self.assertEqual(kept, PREVIOUS)

    def test_cleared_url_drops_the_snapshot(self):
        self.assertIsNone(
            decide_repo_meta(
                url_removed=True,
                url_changed=False,
                fetch=RepoFetch("failure", None),
                previous=PREVIOUS,
            )
        )

    def test_replaced_url_does_not_keep_the_old_snapshot(self):
        self.assertIsNone(
            decide_repo_meta(
                url_removed=False,
                url_changed=True,
                fetch=RepoFetch("failure", None),
                previous=PREVIOUS,
            )
        )

    def test_successful_fetch_stores_the_new_snapshot(self):
        self.assertEqual(
            decide_repo_meta(
                url_removed=False,
                url_changed=False,
                fetch=RepoFetch("success", FRESH),
                previous=PREVIOUS,
            ),
            FRESH,
        )


if __name__ == "__main__":
    unittest.main()
