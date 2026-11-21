"""Tests for scripts/check-ignored-sources.sh (no source file may be hidden by .gitignore).

A git-ignored source file works locally but is missing from the commit, so CI and the
deploy break while local hooks stay green.
"""

import subprocess
import tempfile
import unittest
from pathlib import Path

SCRIPT = Path(__file__).resolve().parent.parent / "scripts" / "check-ignored-sources.sh"


class CheckIgnoredSourcesTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.root = Path(self.tmp.name)
        subprocess.run(["git", "init", "-q"], cwd=self.root, check=True)

    def tearDown(self):
        self.tmp.cleanup()

    def write(self, path: str, content: str = "x\n"):
        file = self.root / path
        file.parent.mkdir(parents=True, exist_ok=True)
        file.write_text(content)

    def run_check(self) -> subprocess.CompletedProcess:
        return subprocess.run(["bash", str(SCRIPT)], cwd=self.root, capture_output=True, text=True)

    def test_passes_when_only_build_artifacts_are_ignored(self):
        self.write(".gitignore", "node_modules/\ndist/\n.venv/\n__pycache__/\n.pytest_cache/\n")
        self.write("apps/web/src/main.ts")
        self.write("services/api/app/main.py")
        subprocess.run(["git", "add", "-A"], cwd=self.root, check=True)  # real repos track sources
        self.write("apps/web/node_modules/react/index.js")
        self.write("apps/web/dist/index.html")
        self.write("services/api/.venv/bin/python")
        self.write("services/api/app/__pycache__/main.cpython-312.pyc")
        self.write("services/api/.pytest_cache/README.md")
        result = self.run_check()
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)

    def test_fails_when_a_source_folder_is_ignored(self):
        self.write(".gitignore", "lib/\n")
        self.write("apps/web/src/lib/utils.ts")
        result = self.run_check()
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("apps/web/src/lib/", result.stdout + result.stderr)

    def test_fails_when_a_single_source_file_is_ignored(self):
        self.write(".gitignore", "secret_helper.py\n")
        self.write("services/api/app/secret_helper.py")
        result = self.run_check()
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("services/api/app/secret_helper.py", result.stdout + result.stderr)

    def test_ignores_files_outside_source_folders(self):
        self.write(".gitignore", "lib/\n")
        self.write("lib/python3.12/site.py")
        result = self.run_check()
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)


if __name__ == "__main__":
    unittest.main()
