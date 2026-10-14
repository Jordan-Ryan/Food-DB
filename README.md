# Food-DB

Python scripts and a SQL file for loading the [Food.com Recipes and User Interactions](https://www.kaggle.com/datasets/shuyangli94/food-com-recipes-and-user-interactions/data) CSVs into a Supabase project.

`test_migration.py` and `supabase_migration.py` load `SUPABASE_URL` and `SUPABASE_ANON_KEY` from a `.env` file. This repository does not include `.env`, the CSV data, or an import log.

## Layout

```
Food-DB/
├── README.md
├── QUICK_START.md                 # setup and run steps
├── API_DOCUMENTATION.md           # tables and views in schema.sql
├── AGENTS.md
├── docs/STATE.md
├── schema.sql
├── requirements.txt
├── setup_migration.py
├── test_migration.py
├── supabase_migration.py
├── kaggle/README.md               # CSV filenames the scripts open
└── examples/                      # client snippets, not a packaged app
    ├── api-examples.js
    ├── react-example.jsx
    ├── react-native-example.js
    └── flutter-example.dart
```

## Setup and run

Follow [QUICK_START.md](./QUICK_START.md). In short, from the repository root:

1. Put the four CSVs named in [kaggle/README.md](./kaggle/README.md) in `kaggle/`.
2. Run `python3 setup_migration.py` (requires Python 3.8+). It installs `requirements.txt` with the current interpreter and creates `.env` when that file is absent.
3. Fill in `.env`.
4. Run `schema.sql` in the Supabase SQL editor. `supabase_migration.py` does not execute that DDL.
5. Run `python3 test_migration.py`, then `python3 supabase_migration.py`.

`setup_migration.py` prints `python supabase_migration.py`. The files use `#!/usr/bin/env python3`.

## What the import script does

`supabase_migration.py` logs to stdout and to `migration.log`. After the schema check it calls, in order:

1. `migrate_recipes` — `RAW_recipes.csv`, upsert into `recipes`
2. `migrate_interactions` — `RAW_interactions.csv`, upsert into `users` then `interactions`
3. `migrate_pp_recipes` — `PP_recipes.csv`, upsert into `pp_recipes`
4. `migrate_pp_users` — `PP_users.csv`, upsert into `pp_users`
5. `verify_migration` — logs the `count` returned for each of those tables

Batch sizes and the data directory come from the environment variables listed in [QUICK_START.md](./QUICK_START.md). `test_migration.py` and `setup_migration.py` always look in `kaggle/`.

`schema.sql` defines `recipes`, `users`, `interactions`, `pp_recipes`, `pp_users`, indexes, `updated_at` triggers on `recipes` and `users`, and the views `popular_recipes`, `active_users`, and `recipe_stats`. Column lists are in [API_DOCUMENTATION.md](./API_DOCUMENTATION.md).

## Example files

`examples/` holds single-file client snippets. This repository has no `package.json`, `pubspec.yaml`, or other app manifest. Each snippet contains the host `https://qunbglfspdhzlmkrdqxc.supabase.co` and the placeholder `your-anon-key-here`. The Python scripts do not read those strings.

## Dependencies

Pinned in `requirements.txt`:

- `supabase==2.3.4`
- `pandas==2.1.4`
- `numpy==1.24.3`
- `python-dotenv==1.0.0`

`supabase_migration.py` imports `numpy` and does not reference it again.
