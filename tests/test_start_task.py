"""Tests for the branch naming in scripts/start-task.sh."""

import subprocess
import unittest
from pathlib import Path

SCRIPT = Path(__file__).resolve().parent.parent / "scripts" / "start-task.sh"


def branch_name(number: str, title: str, labels: str = "") -> str:
    result = subprocess.run(
        ["bash", "-c", f'source "{SCRIPT}"; branch_name "$@"', "_", number, title, labels],
        capture_output=True,
        text=True,
        check=True,
    )
    return result.stdout.strip()


class BranchNameTest(unittest.TestCase):
    def test_feature_branch_from_title(self):
        self.assertEqual(
            branch_name("33", "Build home screen with language picker and topic tiles"),
            "feature/33-build-home-screen-with-language-picker",
        )

    def test_strips_punctuation_and_case(self):
        self.assertEqual(
            branch_name("39", "Explain a photographed letter (Mode 3 incoming)"),
            "feature/39-explain-a-photographed-letter-mode-3",
        )

    def test_bug_label_gives_fix_prefix(self):
        self.assertEqual(
            branch_name("7", "Chat crashes on empty reply", "bug,area:fe"),
            "fix/7-chat-crashes-on-empty-reply",
        )

    def test_empty_slug_falls_back_to_task(self):
        self.assertEqual(branch_name("6", "!!!"), "feature/6-task")


if __name__ == "__main__":
    unittest.main()
