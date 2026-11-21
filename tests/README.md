# tests/

Repository-level and **integration** tests (cross-service flows).

Unit tests should live next to the code under `services/`, `apps/`, or `packages/`.

Run: `python3 -B -m unittest discover -s tests` (also runs in `scripts/validate.sh` and CI).

- `test_capture_trigger.py` — trigger-word detection of `.claude/hooks/capture_trigger.py`
- `test_ask_team.py` — payload, URL handling and usage errors of `scripts/ask-team.sh`
- `test_guard_parallel_work.py` — worktree-blocking hook and the one-task guard in `scripts/start-task.sh`
