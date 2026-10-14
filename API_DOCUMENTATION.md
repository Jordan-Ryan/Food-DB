# Schema objects in `schema.sql`

`schema.sql` is the SQL this repository ships. The import script does not apply it. There is no separate API server in this tree. Client calls in `examples/` use the Supabase client against the tables and views below.

`schema.sql` does not enable row level security. The `GRANT` lines at the bottom of the file are comments. The file defines no functions for `rpc` calls.

## Extensions and triggers

- `CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`
- `update_updated_at_column()` sets `NEW.updated_at = NOW()`
- `update_recipes_updated_at` and `update_users_updated_at` call that function `BEFORE UPDATE`

## Tables

### `recipes`

| Column | Type |
| --- | --- |
| `id` | `BIGINT` primary key |
| `name` | `TEXT NOT NULL` |
| `minutes` | `INTEGER` |
| `contributor_id` | `BIGINT` |
| `submitted` | `DATE` |
| `tags` | `TEXT[]` |
| `nutrition` | `JSONB` |
| `n_steps` | `INTEGER` |
| `steps` | `TEXT[]` |
| `description` | `TEXT` |
| `ingredients` | `TEXT[]` |
| `n_ingredients` | `INTEGER` |
| `created_at` | `TIMESTAMP WITH TIME ZONE` default `NOW()` |
| `updated_at` | `TIMESTAMP WITH TIME ZONE` default `NOW()` |

### `users`

| Column | Type |
| --- | --- |
| `user_id` | `BIGINT` primary key |
| `created_at` | `TIMESTAMP WITH TIME ZONE` default `NOW()` |
| `updated_at` | `TIMESTAMP WITH TIME ZONE` default `NOW()` |

### `interactions`

| Column | Type |
| --- | --- |
| `id` | `UUID` primary key, default `uuid_generate_v4()` |
| `user_id` | `BIGINT NOT NULL` references `users(user_id)` |
| `recipe_id` | `BIGINT NOT NULL` references `recipes(id)` |
| `date` | `DATE` |
| `rating` | `DECIMAL(2,1)` |
| `review` | `TEXT` |
| `created_at` | `TIMESTAMP WITH TIME ZONE` default `NOW()` |

The table has no unique constraint on `(user_id, recipe_id)`.

### `pp_recipes`

| Column | Type |
| --- | --- |
| `recipe_id` | `BIGINT` primary key, references `recipes(id)` |
| `techniques` | `INTEGER[]` |
| `items` | `INTEGER[]` |
| `n_items` | `INTEGER` |
| `created_at` | `TIMESTAMP WITH TIME ZONE` default `NOW()` |

### `pp_users`

| Column | Type |
| --- | --- |
| `user_id` | `BIGINT` primary key, references `users(user_id)` |
| `techniques` | `INTEGER[]` |
| `items` | `INTEGER[]` |
| `n_items` | `INTEGER` |
| `ratings` | `DECIMAL(2,1)[]` |
| `n_ratings` | `INTEGER` |
| `created_at` | `TIMESTAMP WITH TIME ZONE` default `NOW()` |

## Indexes

- `idx_interactions_user_id` on `interactions(user_id)`
- `idx_interactions_recipe_id` on `interactions(recipe_id)`
- `idx_interactions_rating` on `interactions(rating)`
- `idx_recipes_submitted` on `recipes(submitted)`
- `idx_recipes_minutes` on `recipes(minutes)`
- `idx_recipes_n_ingredients` on `recipes(n_ingredients)`
- `idx_recipes_name` on `recipes(name)`
- `idx_recipes_contributor_id` on `recipes(contributor_id)`

## Views

`popular_recipes` left-joins `recipes` to `interactions`, keeps rows with `i.rating IS NOT NULL`, groups by recipe fields, and keeps groups with `COUNT(i.id) >= 5`. It orders by `avg_rating` descending, then `review_count` descending. Selected fields: `id`, `name`, `minutes`, `n_ingredients`, `ingredients`, `tags`, `avg_rating`, `review_count`, `high_rating_count` (`high_rating_count` counts ratings `>= 4`).

`active_users` joins `users` to `interactions`, keeps non-null ratings, and keeps users with `COUNT(i.id) >= 3`. It orders by `total_reviews` descending. Selected fields: `user_id`, `total_reviews`, `avg_rating`, `first_review`, `last_review`, `unique_recipes_reviewed`.

`recipe_stats` left-joins `recipes` to `interactions` and groups by recipe. It orders by `total_interactions` descending. Selected fields: `id`, `name`, `minutes`, `n_ingredients`, `total_interactions`, `total_ratings`, `avg_rating`, `total_reviews`, `first_interaction`, `last_interaction`.

## Client snippets

`examples/api-examples.js` queries `recipes`, `popular_recipes`, `recipe_stats`, `active_users`, and `interactions` (including embedded `recipes` and `users`). `examples/react-example.jsx`, `examples/react-native-example.js`, and `examples/flutter-example.dart` query `recipes` and `popular_recipes`. None of these files is wired to a package manifest in this repository. Each file sets the client URL to `https://qunbglfspdhzlmkrdqxc.supabase.co` and the key to `your-anon-key-here`.
