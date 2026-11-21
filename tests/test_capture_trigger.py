"""Tests for the capture trigger hook (.claude/hooks/capture_trigger.py)."""

import importlib.util
import json
import subprocess
import sys
import unittest
from pathlib import Path

HOOK = Path(__file__).resolve().parent.parent / ".claude" / "hooks" / "capture_trigger.py"

_spec = importlib.util.spec_from_file_location("capture_trigger", HOOK)
capture_trigger = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(capture_trigger)


class DetectModeTest(unittest.TestCase):
    def test_trigger_words(self):
        cases = {
            "Decision: we use Next.js": "decision",
            "we decided to deploy on Vercel": "decision",
            "Ticket, export the login screen": "ticket",
            "tick it add OpenRouter client": "ticket",
            "Idea: live captions for doctor visits": "idea",
            "recap": "recap",
            "Re cap please": "recap",
            "  **Ticket** fix the header": "ticket",
        }
        for prompt, mode in cases.items():
            with self.subTest(prompt=prompt):
                self.assertEqual(capture_trigger.detect_mode(prompt), mode)

    def test_no_trigger(self):
        for prompt in [
            "fix the failing test",
            "what's the best idea here?",
            "ideally we refactor this",
            "tickets.py has a bug",
            "",
        ]:
            with self.subTest(prompt=prompt):
                self.assertIsNone(capture_trigger.detect_mode(prompt))


class HookIOTest(unittest.TestCase):
    def run_hook(self, stdin: str) -> str:
        result = subprocess.run(
            [sys.executable, str(HOOK)], input=stdin, capture_output=True, text=True, check=True
        )
        return result.stdout

    def test_emits_context_on_trigger(self):
        out = json.loads(self.run_hook(json.dumps({"prompt": "Ticket: add login"})))
        self.assertIn("mode: ticket", out["hookSpecificOutput"]["additionalContext"])

    def test_silent_without_trigger(self):
        self.assertEqual(self.run_hook(json.dumps({"prompt": "hello"})), "")

    def test_silent_on_bad_input(self):
        self.assertEqual(self.run_hook("not json"), "")


if __name__ == "__main__":
    unittest.main()
