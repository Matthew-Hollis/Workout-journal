# Personal OS (Workout Journal)

Mobile PWA served from GitHub Pages: https://matthew-hollis.github.io/Workout-journal/

Modules: Workouts, Meeting Notes, Action Items, Bible & Meditation, Daily 4, Weekly Review.

## Data
- Offline-first: every module keeps a local copy in `localStorage` and syncs privately to Supabase
  (project `workout-journal`, ref `ptinyojagmcusrhuabah`) after email sign-in. RLS limits every row to its owner.
- Workouts: local key `wj-data-v1` (never rename or clear it) synced as one JSON blob in `public.module_data` (module `workout`).
- Row tables (pk `user_id, id`, soft delete via `deleted`, server-set `updated_at`):
  `meeting_notes`, `action_items`, `bible_entries`, `reading_plans`, `daily_logs`. Local cache keys `pos-t-<table>`.
- `plaud_import_state` holds the Plaud import watermark (server job only, no client access).

## Code
- `sync.js` sync core (`POS.register` for blob modules, `POS.table` for row tables). Only the publishable key lives here.
- `os.js` shell: home tiles, routing, account card. `modules/*.js` one file per module, registered with `OS.reg`.
- `sw.js` bump the cache name `C` on every release and list any new file in `F`.
