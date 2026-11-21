"""Tests for scripts/check-fresh-base.sh (branch must contain the latest origin/main)."""

import os
import subprocess
import tempfile
import unittest
from pathlib import Path

SCRIPT = Path(__file__).resolve().parent.parent / "scripts" / "check-fresh-base.sh"
# Git hooks export GIT_DIR / GIT_INDEX_FILE (absolute inside a worktree); drop them so the
# throwaway test repos are used instead of the repo running the hook.
ENV = {k: v for k, v in os.environ.items() if not k.startswith("GIT_")}


def git(cwd: Path, *args: str) -> str:
    result = subprocess.run(
        ["git", "-c", "user.name=t", "-c", "user.email=t@t", "-c", "core.hooksPath=/dev/null", *args],
        cwd=cwd,
        env=ENV,
        capture_output=True,
        text=True,
        check=True,
    )
    return result.stdout.strip()


def run_check(cwd: Path, *args: str) -> subprocess.CompletedProcess:
    return subprocess.run(
        ["bash", str(SCRIPT), *args], cwd=cwd, env=ENV, capture_output=True, text=True
    )


class CheckFreshBaseTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        root = Path(self.tmp.name)
        self.origin = root / "origin.git"
        git(root, "init", "--bare", "-b", "main", str(self.origin))
        self.me = root / "me"
        self.mate = root / "mate"
        git(root, "clone", "-q", str(self.origin), str(self.me))
        git(self.me, "checkout", "-q", "-b", "main")
        git(self.me, "commit", "-q", "--allow-empty", "-m", "init")
        git(self.me, "push", "-q", "origin", "main")
        git(root, "clone", "-q", str(self.origin), str(self.mate))

    def tearDown(self):
        self.tmp.cleanup()

    def teammate_merges_to_main(self):
        git(self.mate, "commit", "-q", "--allow-empty", "-m", "teammate work")
        git(self.mate, "push", "-q", "origin", "main")

    def test_fresh_branch_passes(self):
        git(self.me, "checkout", "-q", "-b", "feature/x")
        self.assertEqual(run_check(self.me).returncode, 0)

    def test_branch_from_stale_main_is_blocked(self):
        self.teammate_merges_to_main()
        git(self.me, "checkout", "-q", "-b", "feature/x")
        result = run_check(self.me)
        self.assertEqual(result.returncode, 1)
        self.assertIn("git pull origin main", result.stderr)

    def test_pulling_main_into_branch_fixes_it(self):
        self.teammate_merges_to_main()
        git(self.me, "checkout", "-q", "-b", "feature/x")
        git(self.me, "pull", "-q", "--no-rebase", "origin", "main")
        self.assertEqual(run_check(self.me).returncode, 0)

    def test_warn_mode_never_blocks(self):
        self.teammate_merges_to_main()
        git(self.me, "checkout", "-q", "-b", "feature/x")
        result = run_check(self.me, "--warn")
        self.assertEqual(result.returncode, 0)
        self.assertIn("git pull origin main", result.stderr)

    def test_checks_given_commit_instead_of_head(self):
        old = git(self.me, "rev-parse", "HEAD")
        self.teammate_merges_to_main()
        git(self.me, "pull", "-q", "origin", "main")
        self.assertEqual(run_check(self.me, old).returncode, 1)
        self.assertEqual(run_check(self.me, "HEAD").returncode, 0)

    def install_hooks(self):
        """Commit the real hooks + script into the test repo, as after this kit is merged."""
        repo_root = SCRIPT.parent.parent
        for rel in (".githooks/post-checkout", "scripts/check-fresh-base.sh"):
            target = self.me / rel
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_text((repo_root / rel).read_text())
            target.chmod(0o755)
        git(self.me, "add", ".")
        git(self.me, "commit", "-q", "-m", "hooks")
        git(self.me, "push", "-q", "origin", "main")
        git(self.mate, "pull", "-q", "origin", "main")

    def checkout_with_hooks(self, *args: str) -> str:
        result = subprocess.run(
            ["git", "-c", "core.hooksPath=.githooks", "checkout", "-q", *args],
            cwd=self.me,
            env=ENV,
            capture_output=True,
            text=True,
            check=True,
        )
        return result.stderr

    def test_post_checkout_warns_on_new_branch_from_stale_main(self):
        self.install_hooks()
        self.teammate_merges_to_main()
        self.assertIn("git pull origin main", self.checkout_with_hooks("-b", "feature/x"))

    def test_post_checkout_silent_on_fresh_branch_and_existing_branch(self):
        self.install_hooks()
        self.assertEqual(self.checkout_with_hooks("-b", "feature/x"), "")
        git(self.me, "commit", "-q", "--allow-empty", "-m", "my work")
        self.checkout_with_hooks("main")
        self.teammate_merges_to_main()
        self.assertEqual(self.checkout_with_hooks("feature/x"), "")

    def test_offline_does_not_block(self):
        git(self.me, "remote", "set-url", "origin", str(Path(self.tmp.name) / "missing.git"))
        git(self.me, "checkout", "-q", "-b", "feature/x")
        self.assertEqual(run_check(self.me).returncode, 0)


if __name__ == "__main__":
    unittest.main()
