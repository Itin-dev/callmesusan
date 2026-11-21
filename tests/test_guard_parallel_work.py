"""Tests for the one-task-at-a-time guards.

- `.claude/hooks/guard_parallel_work.py` (Claude Code PreToolUse hook: no agent-made worktrees)
- `active_tasks` in `scripts/start-task.sh` (refuse a second ticket while one is in progress)
"""

import importlib.util
import json
import subprocess
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
HOOK = ROOT / ".claude" / "hooks" / "guard_parallel_work.py"
START_TASK = ROOT / "scripts" / "start-task.sh"

_spec = importlib.util.spec_from_file_location("guard_parallel_work", HOOK)
guard = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(guard)


def run_hook(payload: dict) -> subprocess.CompletedProcess:
    return subprocess.run(
        [sys.executable, str(HOOK)], input=json.dumps(payload), capture_output=True, text=True
    )


class BlockReasonTest(unittest.TestCase):
    def test_blocks_worktree_add(self):
        for command in (
            "git worktree add ../x origin/main",
            "cd repo && git -C . worktree add -b feat ../y",
            "git fetch && git  worktree   add ../z",
        ):
            with self.subTest(command=command):
                self.assertIsNotNone(guard.block_reason("Bash", {"command": command}))

    def test_allows_other_git_commands(self):
        for command in (
            "git worktree list",
            "git worktree remove ../x",
            "git status && git log --oneline",
            'echo "add a worktree later"',
        ):
            with self.subTest(command=command):
                self.assertIsNone(guard.block_reason("Bash", {"command": command}))

    def test_blocks_worktree_tools(self):
        self.assertIsNotNone(guard.block_reason("EnterWorktree", {}))
        self.assertIsNotNone(guard.block_reason("Agent", {"isolation": "worktree"}))
        self.assertIsNone(guard.block_reason("Agent", {"prompt": "search"}))

    def test_hook_exit_codes(self):
        blocked = run_hook({"tool_name": "Bash", "tool_input": {"command": "git worktree add ../x"}})
        self.assertEqual(blocked.returncode, 2)
        self.assertIn("one task at a time", blocked.stderr.lower())
        allowed = run_hook({"tool_name": "Bash", "tool_input": {"command": "ls"}})
        self.assertEqual(allowed.returncode, 0)
        self.assertEqual(run_hook({}).returncode, 0)


def active_tasks(target: str, assigned: str, branches: str) -> list[str]:
    result = subprocess.run(
        ["bash", "-c", f'source "{START_TASK}"; active_tasks "$@"', "_", target, assigned, branches],
        capture_output=True,
        text=True,
        check=True,
    )
    return result.stdout.split()


class ActiveTasksTest(unittest.TestCase):
    BRANCHES = "\n".join(
        [
            "main",
            "feature/33-build-home-screen",
            "remotes/origin/fix/7-chat-crash",
            "feature/330-other",
        ]
    )

    def test_assigned_issue_with_branch_is_active(self):
        self.assertEqual(active_tasks("58", "33 58", self.BRANCHES), ["33"])

    def test_remote_fix_branch_counts(self):
        self.assertEqual(active_tasks("58", "7", self.BRANCHES), ["7"])

    def test_target_issue_is_ignored(self):
        self.assertEqual(active_tasks("33", "33", self.BRANCHES), [])

    def test_assigned_without_branch_is_not_active(self):
        self.assertEqual(active_tasks("58", "3 12", self.BRANCHES), [])


if __name__ == "__main__":
    unittest.main()
