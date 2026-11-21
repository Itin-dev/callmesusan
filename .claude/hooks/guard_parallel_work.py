#!/usr/bin/env python3
"""PreToolUse hook: one task at a time — agents may not create git worktrees.

A worktree lets an agent start a second ticket while another one is in progress,
which the team does not want. Humans can still use worktrees from their own terminal.
Exit code 2 blocks the tool call and shows the reason to Claude.
"""

from __future__ import annotations  # Python 3.9 (macOS system python3)

import json
import re
import sys

REASON = (
    "Blocked: one task at a time. Agents must not create git worktrees or start a second "
    "ticket in parallel. Finish the current task, or propose the new work to the user "
    "(e.g. capture it as a Ticket) and wait for their go-ahead."
)

_SEGMENT_SPLIT = re.compile(r"&&|\|\||[;|\n]")
_WORKTREE_ADD = re.compile(r"^\s*(?:\w+=\S*\s+)*git\b.*?\bworktree\s+add\b")


def block_reason(tool_name: str, tool_input: dict) -> str | None:
    if tool_name == "EnterWorktree":
        return REASON
    if tool_name == "Agent" and tool_input.get("isolation") == "worktree":
        return REASON
    if tool_name == "Bash":
        command = str(tool_input.get("command", ""))
        if any(_WORKTREE_ADD.search(part) for part in _SEGMENT_SPLIT.split(command)):
            return REASON
    return None


def main() -> int:
    try:
        payload = json.load(sys.stdin)
    except (json.JSONDecodeError, ValueError):
        return 0
    if not isinstance(payload, dict):
        return 0
    tool_input = payload.get("tool_input")
    reason = block_reason(
        str(payload.get("tool_name", "")), tool_input if isinstance(tool_input, dict) else {}
    )
    if reason:
        print(reason, file=sys.stderr)
        return 2
    return 0


if __name__ == "__main__":
    sys.exit(main())
