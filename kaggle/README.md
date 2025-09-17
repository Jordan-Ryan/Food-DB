# Kaggle Dataset Files

This folder should contain the Food.com dataset files from Kaggle.

## How to Get the Dataset

1. Go to [Food.com Recipes and User Interactions](https://www.kaggle.com/datasets/shuyangli94/food-com-recipes-and-user-interactions/data)
2. Download the dataset files
3. Extract them to this `kaggle/` folder

## Required Files

The migration script expects these files:

- `RAW_recipes.csv` - Main recipe data (231K recipes)
- `RAW_interactions.csv` - User ratings and reviews (1.1M records)
- `PP_recipes.csv` - Preprocessed recipe data
- `PP_users.csv` - Preprocessed user data
- `interactions_train.csv` - Training split
- `interactions_validation.csv` - Validation split
- `interactions_test.csv` - Test split
- `ingr_map.pkl` - Ingredient mapping file

## File Sizes

These files are quite large (800MB+ total) and are excluded from Git due to size limits:
- `RAW_recipes.csv` - ~281MB
- `RAW_interactions.csv` - ~333MB
- `PP_recipes.csv` - ~195MB
- `PP_users.csv` - ~13MB
- `interactions_train.csv` - ~27MB

## Setup

Once you have the files in this folder, you can run the migration:

```bash
python3 setup_migration.py  # Setup environment
python3 test_migration.py   # Test the setup
python3 supabase_migration.py  # Run the migration
```
