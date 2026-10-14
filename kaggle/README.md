# Kaggle CSV files

`setup_migration.py` and `test_migration.py` look in this directory for:

- `RAW_recipes.csv`
- `RAW_interactions.csv`
- `PP_recipes.csv`
- `PP_users.csv`

`supabase_migration.py` reads the same four names from `DATA_DIR` (default `kaggle`).

The files are not in git. `.gitignore` does not list `kaggle/` or `*.csv`.

Download the dataset from [Food.com Recipes and User Interactions](https://www.kaggle.com/datasets/shuyangli94/food-com-recipes-and-user-interactions/data) and extract the four CSVs here.

That dataset also includes `interactions_train.csv`, `interactions_validation.csv`, `interactions_test.csv`, and `ingr_map.pkl`. No script in this repository opens those files.

After the four required CSVs are in this folder:

```bash
python3 setup_migration.py
python3 test_migration.py
python3 supabase_migration.py
```

Apply `schema.sql` in the Supabase SQL editor before `test_migration.py` and `supabase_migration.py`. Step-by-step environment variables and script behavior are in [QUICK_START.md](../QUICK_START.md).
