# Food-DB: Kaggle Dataset Migration to Supabase

This project migrates the Food.com recipes and user interactions dataset from Kaggle to Supabase for use across multiple projects.

## Dataset Overview

The Food.com dataset contains:
- **231,637 recipes** with ingredients, steps, nutrition info, and cooking times
- **1,136,762 user interactions** including ratings and reviews
- **Preprocessed data** for machine learning applications
- **Split datasets** for training, validation, and testing

## Quick Start

### 1. Setup Environment

```bash
# Run the setup script
python setup_migration.py
```

This will:
- Install required Python packages
- Create a `.env` file template
- Verify your data files are in place

### 2. Configure Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Settings > API in your project dashboard
3. Copy your Project URL and anon key
4. Edit the `.env` file with your credentials:

```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
```

### 3. Run Migration

```bash
python supabase_migration.py
```

The migration will:
- Create database schema with proper relationships
- Process large CSV files in chunks (1000 rows at a time)
- Handle data type conversions and cleaning
- Create indexes for optimal performance
- Log progress to `migration.log`

## Database Schema

### Tables Created

1. **recipes** - Main recipe data
   - `id`, `name`, `minutes`, `contributor_id`
   - `submitted`, `tags[]`, `nutrition` (JSONB)
   - `n_steps`, `steps[]`, `description`
   - `ingredients[]`, `n_ingredients`

2. **users** - User information
   - `user_id`, `created_at`, `updated_at`

3. **interactions** - User ratings and reviews
   - `id` (UUID), `user_id`, `recipe_id`
   - `date`, `rating`, `review`

4. **pp_recipes** - Preprocessed recipe data
   - `recipe_id`, `techniques[]`, `items[]`, `n_items`

5. **pp_users** - Preprocessed user data
   - `user_id`, `techniques[]`, `items[]`, `n_items`
   - `ratings[]`, `n_ratings`

### Relationships

- `interactions.user_id` → `users.user_id`
- `interactions.recipe_id` → `recipes.id`
- `pp_recipes.recipe_id` → `recipes.id`
- `pp_users.user_id` → `users.user_id`

## File Structure

```
Food-DB/
├── kaggle/                          # Kaggle dataset files
│   ├── RAW_recipes.csv             # Main recipe data (231K recipes)
│   ├── RAW_interactions.csv        # User interactions (1.1M records)
│   ├── PP_recipes.csv              # Preprocessed recipes
│   ├── PP_users.csv                # Preprocessed users
│   ├── interactions_train.csv      # Training split
│   ├── interactions_validation.csv # Validation split
│   └── interactions_test.csv       # Test split
├── supabase_migration.py           # Main migration script
├── setup_migration.py              # Setup and environment script
├── requirements.txt                # Python dependencies
├── .env.example                    # Environment variables template
└── README.md                       # This file
```

## Features

### Data Processing
- **Chunked processing** for large files (handles 200MB+ files)
- **Data type conversion** (strings to arrays, JSON parsing)
- **Error handling** with detailed logging
- **Progress tracking** with row counts

### Database Features
- **Proper indexing** for fast queries
- **Foreign key constraints** for data integrity
- **JSONB storage** for flexible nutrition data
- **Array fields** for tags, ingredients, and steps
- **Automatic timestamps** with triggers

### Monitoring
- **Detailed logging** to `migration.log`
- **Progress indicators** during migration
- **Error reporting** with specific row information
- **Verification queries** after completion

## Usage Examples

### Query Recipes by Cooking Time
```sql
SELECT name, minutes, n_ingredients, ingredients
FROM recipes 
WHERE minutes <= 30 
ORDER BY n_ingredients ASC
LIMIT 10;
```

### Find Popular Recipes
```sql
SELECT r.name, r.minutes, AVG(i.rating) as avg_rating, COUNT(i.id) as review_count
FROM recipes r
JOIN interactions i ON r.id = i.recipe_id
WHERE i.rating IS NOT NULL
GROUP BY r.id, r.name, r.minutes
HAVING COUNT(i.id) >= 10
ORDER BY avg_rating DESC, review_count DESC
LIMIT 20;
```

### User Interaction Analysis
```sql
SELECT 
    u.user_id,
    COUNT(i.id) as total_reviews,
    AVG(i.rating) as avg_rating,
    MIN(i.date) as first_review,
    MAX(i.date) as last_review
FROM users u
JOIN interactions i ON u.user_id = i.user_id
WHERE i.rating IS NOT NULL
GROUP BY u.user_id
HAVING COUNT(i.id) >= 5
ORDER BY total_reviews DESC
LIMIT 10;
```

## Troubleshooting

### Common Issues

1. **"File not found" errors**
   - Ensure all CSV files are in the `kaggle/` folder
   - Check file names match exactly (case-sensitive)

2. **Supabase connection errors**
   - Verify your `.env` file has correct credentials
   - Check your Supabase project is active
   - Ensure your anon key has proper permissions

3. **Memory issues with large files**
   - The script processes files in chunks automatically
   - If still having issues, reduce `chunk_size` in the script

4. **Data type conversion errors**
   - Check `migration.log` for specific error details
   - Some malformed data may be skipped with warnings

### Performance Tips

- **Indexes** are created automatically for common query patterns
- **Batch processing** minimizes API calls to Supabase
- **Upsert operations** handle duplicate data gracefully
- **Chunked processing** prevents memory overflow

## Data Statistics

After migration, you should see approximately:
- **231,637 recipes** in the recipes table
- **25,000+ unique users** in the users table  
- **1,136,762 interactions** in the interactions table
- **Preprocessed data** for ML applications

## Next Steps

Once migration is complete, you can:

1. **Build recommendation systems** using the interaction data
2. **Create recipe search** with ingredient and tag filtering
3. **Analyze cooking patterns** and user preferences
4. **Develop ML models** using the preprocessed features
5. **Build web applications** with real-time recipe data

## Support

For issues or questions:
1. Check the `migration.log` file for detailed error information
2. Verify your Supabase project settings and permissions
3. Ensure all required data files are present and accessible

Happy cooking with your new recipe database! 🍳