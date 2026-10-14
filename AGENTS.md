# AGENTS.md

Notes for editing this repository. Behavior below is what the files on `main` do.

## Scope

Tracked files are the Python scripts (`setup_migration.py`, `test_migration.py`, `supabase_migration.py`), `schema.sql`, `requirements.txt`, `.gitignore`, `kaggle/README.md`, the markdown docs, and the four files under `examples/`.

There is no application server, test runner config, lockfile beyond `requirements.txt`, or migration tool. `schema.sql` is applied by pasting it into the Supabase SQL editor.

## Commands

From the repository root, with Python 3.8+:

```bash
python3 setup_migration.py
python3 test_migration.py
python3 supabase_migration.py
```

`setup_migration.py` runs `pip install -r requirements.txt` for the current interpreter and writes `.env` if it is missing. `test_migration.py` upserts 10 recipe rows and then deletes them. Do not point those scripts at a project unless that write is intended.

`supabase_migration.py` appends to `migration.log`.

## Facts the docs have to follow

- Credentials for the scripts are `SUPABASE_URL` and `SUPABASE_ANON_KEY` in `.env`. The host string inside `examples/` is not read by the Python scripts.
- `create_database_schema` logs an instruction to run `schema.sql`. It does not execute DDL.
- `schema.sql` does not enable row level security and does not define RPC functions. `GRANT` lines in that file are comments.
- Do not write row counts, import results, or performance statements into docs unless a command in this tree prints them. Nothing here prints fixed totals for the Food.com CSVs.
- `numpy` is imported in `supabase_migration.py` and is not referenced again. `SUPABASE_SERVICE_ROLE_KEY` is only a comment in the `.env` template.
- `DATA_DIR` applies to `supabase_migration.py` only. The other two scripts use the path `kaggle`.

Code-structure details that affect those statements are collected in [docs/STATE.md](docs/STATE.md).
