#!/usr/bin/env python3
"""UserPromptSubmit hook: route prompts that start with a capture trigger word.

Skills are selected by meaning, which is not fully reliable for dictated input.
This hook makes the trigger deterministic: if the prompt starts with a known
word (or a common dictation mishearing), it tells Claude to use the `capture` skill.
"""

from __future__ import annotations  # Python 3.9 (macOS system python3)

import json
import re
import sys

# Mode -> spoken variants. Matched case-insensitively at the start of the prompt.
TRIGGERS = {
    "decision": ["decision", "decisions", "we decided", "decided"],
    "ticket": ["ticket", "tickets", "tick it", "todo", "to do"],
    "idea": ["idea", "ideas"],
    "recap": ["recap", "re cap", "re-cap"],
}

_LEADING_NOISE = re.compile(r"^[\s\"'`*_>#.,:;!-]+")


def detect_mode(prompt: str) -> str | None:
    text = _LEADING_NOISE.sub("", prompt).lower()
    for mode, variants in TRIGGERS.items():
        for variant in sorted(variants, key=len, reverse=True):
            # Word must end at whitespace/punctuation; "." only when it ends the
            # sentence, so file names like "tickets.py" do not trigger.
            if re.match(rf"{re.escape(variant)}(?=$|[\s,:;!?*_-]|\.(?:\s|$))", text):
                return mode
    return None


def main() -> int:
    try:
        payload = json.load(sys.stdin)
    except (json.JSONDecodeError, ValueError):
        return 0
    mode = detect_mode(payload.get("prompt", ""))
    if mode is None:
        return 0
    context = (
        f"Capture trigger detected (mode: {mode}). Use the `capture` skill "
        "(.claude/skills/capture/SKILL.md) to process this prompt."
    )
    json.dump(
        {
            "hookSpecificOutput": {
                "hookEventName": "UserPromptSubmit",
                "additionalContext": context,
            }
        },
        sys.stdout,
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
