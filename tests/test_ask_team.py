"""Tests for scripts/ask-team.sh (post a question to the team's Discord channel)."""

import json
import os
import subprocess
import unittest
from pathlib import Path

SCRIPT = Path(__file__).resolve().parent.parent / "scripts" / "ask-team.sh"
FAKE_URL = "https://discord.com/api/webhooks/123/abc"


def run(*args: str, url: str | None = None) -> subprocess.CompletedProcess:
    env = {k: v for k, v in os.environ.items() if k != "DISCORD_QUESTIONS_WEBHOOK_URL"}
    env["ASK_TEAM_ENV_FILE"] = "/nonexistent/.env"  # never read the developer's real .env
    env["ASK_TEAM_GITHUB_LOGIN"] = ""  # no network call to gh
    if url is not None:
        env["DISCORD_QUESTIONS_WEBHOOK_URL"] = url
    return subprocess.run(["bash", str(SCRIPT), *args], capture_output=True, text=True, env=env)


def build_payload(author: str, login: str, branch: str, question: str) -> dict:
    result = subprocess.run(
        ["bash", "-c", f'source "{SCRIPT}"; build_payload "$@"', "_", author, login, branch, question],
        capture_output=True,
        text=True,
        check=True,
    )
    return json.loads(result.stdout)


def embed(payload: dict) -> dict:
    return payload["embeds"][0]


class BuildPayloadTest(unittest.TestCase):
    def test_tags_author_and_branch(self):
        payload = build_payload("Ana", "ana-gh", "feature/33-home", "Which i18n lib do we use?")
        self.assertEqual(payload["username"], "Ana's agent")
        self.assertEqual(embed(payload)["author"]["name"], "Ana")
        self.assertEqual(embed(payload)["footer"]["text"], "feature/33-home")
        self.assertEqual(embed(payload)["description"], "Which i18n lib do we use?")

    def test_github_avatar_when_login_known(self):
        payload = build_payload("Ana", "ana-gh", "main", "q")
        self.assertEqual(payload["avatar_url"], "https://github.com/ana-gh.png")
        self.assertEqual(embed(payload)["author"]["icon_url"], "https://github.com/ana-gh.png")

    def test_no_avatar_without_login(self):
        payload = build_payload("Ana", "", "main", "q")
        self.assertNotIn("avatar_url", payload)
        self.assertNotIn("icon_url", embed(payload)["author"])

    def test_color_is_stable_per_person_and_differs_between_people(self):
        ana1 = embed(build_payload("Ana", "", "main", "q1"))["color"]
        ana2 = embed(build_payload("Ana", "", "dev", "q2"))["color"]
        colors = {embed(build_payload(n, "", "main", "q"))["color"] for n in ("Ana", "Ben", "Cleo", "Dan")}
        self.assertEqual(ana1, ana2)
        self.assertGreater(len(colors), 1)

    def test_disables_mentions(self):
        payload = build_payload("Ana", "", "main", "@everyone help")
        self.assertEqual(payload["allowed_mentions"], {"parse": []})

    def test_escapes_quotes_and_newlines(self):
        payload = build_payload("Ana", "", "main", 'He said "hi"\nsecond line')
        self.assertEqual(embed(payload)["description"], 'He said "hi"\nsecond line')

    def test_caps_length_for_discord(self):
        description = embed(build_payload("Ana", "", "main", "x" * 5000))["description"]
        self.assertLessEqual(len(description), 2000)
        self.assertTrue(description.endswith("…"))


class CliTest(unittest.TestCase):
    def test_dry_run_prints_payload_without_url(self):
        result = run("--dry-run", "Is the API on port 8000?")
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("Is the API on port 8000?", embed(json.loads(result.stdout))["description"])

    def test_empty_question_is_usage_error(self):
        self.assertEqual(run().returncode, 2)
        self.assertEqual(run("   ").returncode, 2)

    def test_missing_url_explains_setup(self):
        result = run("Anyone there?")
        self.assertEqual(result.returncode, 1)
        self.assertIn("DISCORD_QUESTIONS_WEBHOOK_URL", result.stderr)

    def test_rejects_non_discord_url(self):
        result = run("Anyone there?", url="https://evil.example.com/hook")
        self.assertEqual(result.returncode, 1)
        self.assertIn("Discord webhook", result.stderr)

    def test_reads_url_from_env_file(self):
        env_file = Path(os.environ.get("TMPDIR", "/tmp")) / "ask-team-test.env"
        env_file.write_text("OTHER=1\nDISCORD_QUESTIONS_WEBHOOK_URL=https://evil.example.com/x\n")
        try:
            env = {k: v for k, v in os.environ.items() if k != "DISCORD_QUESTIONS_WEBHOOK_URL"}
            env["ASK_TEAM_ENV_FILE"] = str(env_file)
            env["ASK_TEAM_GITHUB_LOGIN"] = ""
            result = subprocess.run(
                ["bash", str(SCRIPT), "Anyone there?"], capture_output=True, text=True, env=env
            )
        finally:
            env_file.unlink()
        # The URL was found in the file (so it got as far as URL validation).
        self.assertIn("Discord webhook", result.stderr)


if __name__ == "__main__":
    unittest.main()
