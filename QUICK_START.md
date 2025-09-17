# Quick Start Guide - Food.com Dataset API

## 🚀 Get Started in 5 Minutes

### 1. Install Supabase Client

**Web (React/Vue/Angular):**
```bash
npm install @supabase/supabase-js
```

**React Native:**
```bash
npm install @supabase/supabase-js react-native-url-polyfill
```

**Flutter:**
```yaml
dependencies:
  supabase_flutter: ^2.0.0
```

### 2. Initialize Client

```javascript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://qunbglfspdhzlmkrdqxc.supabase.co',
  'your-anon-key-here'
)
```

### 3. Basic Queries

```javascript
// Get 20 recipes
const { data: recipes } = await supabase
  .from('recipes')
  .select('id, name, minutes, n_ingredients')
  .limit(20)

// Search recipes
const { data: searchResults } = await supabase
  .from('recipes')
  .select('*')
  .ilike('name', '%pasta%')
  .limit(10)

// Get popular recipes
const { data: popular } = await supabase
  .from('popular_recipes')
  .select('*')
  .limit(10)

// Get recipe details
const { data: recipe } = await supabase
  .from('recipes')
  .select('*')
  .eq('id', 12345)
  .single()
```

### 4. User Interactions

```javascript
// Get user's ratings
const { data: ratings } = await supabase
  .from('interactions')
  .select(`
    rating,
    review,
    recipes (name, minutes)
  `)
  .eq('user_id', 123)

// Add a rating
const { data } = await supabase
  .from('interactions')
  .insert({
    user_id: 123,
    recipe_id: 456,
    rating: 4.5,
    review: 'Delicious!'
  })
```

## 📊 Dataset Overview

- **231,637 recipes** with full details
- **226,570 users** with interaction history  
- **1,133,167 interactions** (ratings & reviews)
- **Pre-built views** for popular recipes and user stats

## 🔍 Common Use Cases

### Recipe Discovery
```javascript
// Quick recipes (under 30 min)
const quickRecipes = await supabase
  .from('recipes')
  .select('*')
  .lte('minutes', 30)
  .order('minutes')

// Simple recipes (few ingredients)
const simpleRecipes = await supabase
  .from('recipes')
  .select('*')
  .lte('n_ingredients', 5)
  .order('n_ingredients')
```

### Recommendations
```javascript
// Recipes similar to user's favorites
const recommendations = await supabase
  .from('interactions')
  .select(`
    recipes!inner (*)
  `)
  .eq('user_id', userId)
  .gte('rating', 4.0)
```

### Analytics
```javascript
// Recipe statistics
const stats = await supabase
  .from('recipe_stats')
  .select('*')
  .eq('id', recipeId)
  .single()
```

## 🛠️ Next Steps

1. **Read the full documentation**: [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)
2. **Check out examples**: [examples/](./examples/) folder
3. **Set up authentication**: Add user management if needed
4. **Implement caching**: For better performance
5. **Add real-time features**: Subscribe to data changes

## 🆘 Need Help?

- Check the [troubleshooting section](./API_DOCUMENTATION.md#troubleshooting)
- Review [Supabase docs](https://supabase.com/docs)
- Join the [community](https://github.com/supabase/supabase/discussions)
