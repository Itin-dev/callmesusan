# tests/

Repository-level and **integration** tests (cross-service flows).

Unit tests live next to the code: `services/api/tests/` and `apps/web/src/**/*.test.tsx`.

Run: `python3 -B -m unittest discover -s tests` (also runs in `scripts/validate.sh` and CI).

- `test_capture_trigger.py` — trigger-word detection of `.claude/hooks/capture_trigger.py`
- `test_ask_team.py` — payload, URL handling and usage errors of `scripts/ask-team.sh`
- `test_guard_parallel_work.py` — worktree-blocking hook and the one-task guard in `scripts/start-task.sh`
- `test_check_fresh_base.py` — `scripts/check-fresh-base.sh` blocks branches missing the latest `origin/main`
- `test_check_ignored_sources.py` — `scripts/check-ignored-sources.sh` catches source files hidden by `.gitignore`
- `test_start_task.py` — branch naming in `scripts/start-task.sh`
