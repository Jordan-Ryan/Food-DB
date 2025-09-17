-- Food.com Dataset Schema for Supabase
-- ====================================
-- 
-- This SQL file contains the complete database schema for the Food.com dataset.
-- You can run this manually in your Supabase SQL editor if the automatic
-- schema creation fails.

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create recipes table
CREATE TABLE IF NOT EXISTS recipes (
    id BIGINT PRIMARY KEY,
    name TEXT NOT NULL,
    minutes INTEGER,
    contributor_id BIGINT,
    submitted DATE,
    tags TEXT[],
    nutrition JSONB,
    n_steps INTEGER,
    steps TEXT[],
    description TEXT,
    ingredients TEXT[],
    n_ingredients INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create users table (from interactions)
CREATE TABLE IF NOT EXISTS users (
    user_id BIGINT PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create interactions table
CREATE TABLE IF NOT EXISTS interactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id BIGINT NOT NULL,
    recipe_id BIGINT NOT NULL,
    date DATE,
    rating DECIMAL(2,1),
    review TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (recipe_id) REFERENCES recipes(id)
);

-- Create preprocessed recipes table
CREATE TABLE IF NOT EXISTS pp_recipes (
    recipe_id BIGINT PRIMARY KEY,
    techniques INTEGER[],
    items INTEGER[],
    n_items INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (recipe_id) REFERENCES recipes(id)
);

-- Create preprocessed users table
CREATE TABLE IF NOT EXISTS pp_users (
    user_id BIGINT PRIMARY KEY,
    techniques INTEGER[],
    items INTEGER[],
    n_items INTEGER,
    ratings DECIMAL(2,1)[],
    n_ratings INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_interactions_user_id ON interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_interactions_recipe_id ON interactions(recipe_id);
CREATE INDEX IF NOT EXISTS idx_interactions_rating ON interactions(rating);
CREATE INDEX IF NOT EXISTS idx_recipes_submitted ON recipes(submitted);
CREATE INDEX IF NOT EXISTS idx_recipes_minutes ON recipes(minutes);
CREATE INDEX IF NOT EXISTS idx_recipes_n_ingredients ON recipes(n_ingredients);
CREATE INDEX IF NOT EXISTS idx_recipes_name ON recipes(name);
CREATE INDEX IF NOT EXISTS idx_recipes_contributor_id ON recipes(contributor_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_recipes_updated_at BEFORE UPDATE ON recipes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create some useful views for common queries

-- View for popular recipes with ratings
CREATE OR REPLACE VIEW popular_recipes AS
SELECT 
    r.id,
    r.name,
    r.minutes,
    r.n_ingredients,
    r.ingredients,
    r.tags,
    AVG(i.rating) as avg_rating,
    COUNT(i.id) as review_count,
    COUNT(CASE WHEN i.rating >= 4 THEN 1 END) as high_rating_count
FROM recipes r
LEFT JOIN interactions i ON r.id = i.recipe_id
WHERE i.rating IS NOT NULL
GROUP BY r.id, r.name, r.minutes, r.n_ingredients, r.ingredients, r.tags
HAVING COUNT(i.id) >= 5
ORDER BY avg_rating DESC, review_count DESC;

-- View for active users
CREATE OR REPLACE VIEW active_users AS
SELECT 
    u.user_id,
    COUNT(i.id) as total_reviews,
    AVG(i.rating) as avg_rating,
    MIN(i.date) as first_review,
    MAX(i.date) as last_review,
    COUNT(DISTINCT i.recipe_id) as unique_recipes_reviewed
FROM users u
JOIN interactions i ON u.user_id = i.user_id
WHERE i.rating IS NOT NULL
GROUP BY u.user_id
HAVING COUNT(i.id) >= 3
ORDER BY total_reviews DESC;

-- View for recipe statistics
CREATE OR REPLACE VIEW recipe_stats AS
SELECT 
    r.id,
    r.name,
    r.minutes,
    r.n_ingredients,
    COUNT(i.id) as total_interactions,
    COUNT(CASE WHEN i.rating IS NOT NULL THEN 1 END) as total_ratings,
    AVG(i.rating) as avg_rating,
    COUNT(CASE WHEN i.review IS NOT NULL AND i.review != '' THEN 1 END) as total_reviews,
    MIN(i.date) as first_interaction,
    MAX(i.date) as last_interaction
FROM recipes r
LEFT JOIN interactions i ON r.id = i.recipe_id
GROUP BY r.id, r.name, r.minutes, r.n_ingredients
ORDER BY total_interactions DESC;

-- Grant permissions (adjust as needed for your setup)
-- GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
-- GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;
-- GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
