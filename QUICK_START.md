# Setup and run

Commands below are what `setup_migration.py`, `test_migration.py`, and `supabase_migration.py` implement. Run them from the repository root.

## 1. Python and data files

`setup_migration.py` exits if `sys.version_info` is below 3.8.

Download the Food.com CSVs from [Food.com Recipes and User Interactions](https://www.kaggle.com/datasets/shuyangli94/food-com-recipes-and-user-interactions/data) and place these files in `kaggle/`:

- `RAW_recipes.csv`
- `RAW_interactions.csv`
- `PP_recipes.csv`
- `PP_users.csv`

`setup_migration.py` and `test_migration.py` require all four paths. `supabase_migration.py` logs an error and returns from `migrate_recipes` or `migrate_interactions` when the matching RAW file is missing, and logs a warning and returns from the PP migrators when a PP file is missing.

No script opens `interactions_train.csv`, `interactions_validation.csv`, `interactions_test.csv`, or `ingr_map.pkl`.

## 2. Install packages and create `.env`

```bash
python3 setup_migration.py
```

That script:

- installs `requirements.txt` via `sys.executable -m pip`
- creates `.env` when it does not already exist
- checks that the four CSVs above exist

The generated `.env` contains:

```bash
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
# SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

Set `SUPABASE_URL` and `SUPABASE_ANON_KEY` from the Supabase project's API settings. `.env` is listed in `.gitignore`. No script reads `SUPABASE_SERVICE_ROLE_KEY`.

`supabase_migration.py` also reads these variables. Defaults apply when they are unset:

| Variable | Default |
| --- | --- |
| `DATA_DIR` | `kaggle` |
| `RECIPES_BATCH_SIZE` | `250` |
| `INTERACTIONS_BATCH_SIZE` | `800` |
| `PP_RECIPES_BATCH_SIZE` | `1000` |
| `PP_USERS_BATCH_SIZE` | `1000` |

## 3. Apply `schema.sql`

`FoodDatabaseMigrator.create_database_schema` writes a log line telling you to paste `schema.sql` into the Supabase SQL editor. It does not send the SQL. `ensure_schema_exists` then runs `select id` on `recipes` with `limit(1)`. If the error text includes `PGRST205`, `Could not find the table`, or `404`, the script logs that `schema.sql` still needs to be applied and raises.

`schema.sql` uses `CREATE TABLE IF NOT EXISTS` and `CREATE INDEX IF NOT EXISTS`. The two `CREATE TRIGGER` statements do not use `IF NOT EXISTS`.

`test_migration.py` builds a `CREATE TABLE` string in `test_schema_creation` and does not execute it. The connection and small-import checks query `recipes`, so apply `schema.sql` before the test script as well.

## 4. Test script

```bash
python3 test_migration.py
```

The script loads `.env`, then:

1. Checks the four CSV paths and logs each file size in MB.
2. Selects `id` from `recipes` with `count='exact'` and `limit(1)`.
3. Runs `test_schema_creation` (no SQL is sent).
4. Reads the first 10 rows of `kaggle/RAW_recipes.csv`, upserts them into `recipes` with empty `tags`, `steps`, and `ingredients` and `nutrition` set to `None`, then deletes those `id` values.

It exits with status 1 when a check returns false or setup raises. The data-file check uses the hard-coded directory `kaggle`, not `DATA_DIR`.

## 5. Import script

```bash
python3 supabase_migration.py
```

Logging goes to stdout and `migration.log` (`migration.log` is gitignored). The run order is `create_database_schema`, `ensure_schema_exists`, `migrate_recipes`, `migrate_interactions`, `migrate_pp_recipes`, `migrate_pp_users`, `verify_migration`.

`verify_migration` logs `count` for `recipes`, `users`, `interactions`, `pp_recipes`, and `pp_users`. The script does not compare those counts with a fixed total.

CSV columns the import reads:

- `RAW_recipes.csv`: `id`, `name`, `minutes`, `contributor_id`, `submitted`, `tags`, `nutrition`, `n_steps`, `steps`, `description`, `ingredients`, `n_ingredients`
- `RAW_interactions.csv`: `user_id`, `recipe_id`, `date`, `rating`, `review`
- `PP_recipes.csv`: `i`, `techniques`, `items`, `n_items` (`i` is stored as `recipe_id`)
- `PP_users.csv`: `u`, `techniques`, `items`, `n_items`, `ratings`, `n_ratings` (`u` is stored as `user_id`)

`migrate_interactions` upserts `{user_id}` rows into `users` from each chunk, then upserts the interactions. A rating that is missing or equal to `0` is sent as `None`. Dates go through `to_date_string`, which returns `YYYY-MM-DD` or `None`.

See [docs/STATE.md](./docs/STATE.md) for how `parse_json_field`, list parsing, and the `interactions` primary key are written in the current scripts.
