# State of the tree

Factual inventory of this repository. It does not report a Supabase project, a loaded database, or CSV byte sizes. Those are not stored here.

## Tracked files

- `setup_migration.py` — version check, `pip install -r requirements.txt`, `.env` creation, CSV presence check, printed instructions
- `test_migration.py` — connection, file, schema-string, and 10-row upsert/delete checks
- `supabase_migration.py` — chunked upserts and count logging
- `schema.sql` — tables, indexes, triggers, views
- `requirements.txt` — `supabase==2.3.4`, `pandas==2.1.4`, `numpy==1.24.3`, `python-dotenv==1.0.0`
- `examples/api-examples.js`, `examples/react-example.jsx`, `examples/react-native-example.js`, `examples/flutter-example.dart`
- Markdown: `README.md`, `QUICK_START.md`, `API_DOCUMENTATION.md`, `AGENTS.md`, `kaggle/README.md`, this file

Not in the tree: `.env`, `migration.log`, the Kaggle CSVs, `package.json`, `pubspec.yaml`, CI config, a `migrations/` directory.

## `.gitignore` entries that relate to runtime output

Ignored names include `.env`, `migration.log`, virtualenv directories, and `node_modules/`. The data-directory line in the file is `*.tempkaggle/`. There is no `kaggle/` or `*.csv` rule. `git check-ignore` does not ignore `kaggle/RAW_recipes.csv`.

## Environment variables

Read by `supabase_migration.py` and `test_migration.py`:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

Read only by `supabase_migration.py`, with defaults: `DATA_DIR` (`kaggle`), `RECIPES_BATCH_SIZE` (`250`), `INTERACTIONS_BATCH_SIZE` (`800`), `PP_RECIPES_BATCH_SIZE` (`1000`), `PP_USERS_BATCH_SIZE` (`1000`).

`setup_migration.py` writes a commented `SUPABASE_SERVICE_ROLE_KEY` line. No Python file reads that name.

## Schema versus script payloads

`parse_json_field` in `supabase_migration.py` has a docstring and no further body, so the call in `migrate_recipes` passes `nutrition=None`. Statements that call `json.loads` sit inside `to_date_string` after both `return` paths, so they are unreachable. The `recipes.nutrition` column in `schema.sql` is `JSONB`.

`parse_list_field` returns a list of strings. `migrate_pp_recipes` and `migrate_pp_users` send those lists for `techniques`, `items`, and `ratings`. In `schema.sql` those columns are `INTEGER[]`, `INTEGER[]`, and `DECIMAL(2,1)[]`.

`interactions.id` is a generated UUID primary key. `migrate_interactions` upserts rows that omit `id` and does not pass an `on_conflict` column. The table definition has no unique key on `(user_id, recipe_id)`.

`test_migration.py` upserts 10 recipes with empty list fields and `nutrition: None`, then deletes by those ids. Its schema test does not execute the SQL string it builds.

`setup_migration.py` prints that the migration script creates the schema and that the next command is `python supabase_migration.py`. `create_database_schema` only logs the SQL-editor instruction.

## Example snippets

The four example files each call `createClient` or `Supabase.initialize` with `https://qunbglfspdhzlmkrdqxc.supabase.co` and `your-anon-key-here`. No Python script contains that host. The repo has no manifest for the `@supabase/supabase-js` import in the JavaScript examples or the `supabase_flutter` import in `examples/flutter-example.dart`.
