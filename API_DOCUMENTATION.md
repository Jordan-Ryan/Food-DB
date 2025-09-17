# Food.com Dataset API Documentation

## Overview

This documentation provides comprehensive guidance for accessing and using the Food.com dataset stored in Supabase from mobile and web applications. The dataset contains 231,637 recipes, 226,570 users, and 1,133,167 interactions.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Database Schema](#database-schema)
3. [Authentication Setup](#authentication-setup)
4. [Web App Integration](#web-app-integration)
5. [Mobile App Integration](#mobile-app-integration)
6. [Common Queries](#common-queries)
7. [Advanced Features](#advanced-features)
8. [Performance Optimization](#performance-optimization)
9. [Error Handling](#error-handling)
10. [Security Best Practices](#security-best-practices)

## Quick Start

### Prerequisites
- Supabase project URL and API keys
- Basic knowledge of REST APIs or Supabase client libraries

### Your Supabase Credentials
```bash
SUPABASE_URL=https://qunbglfspdhzlmkrdqxc.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
```

## Database Schema

### Core Tables

#### `recipes` (231,637 records)
```sql
CREATE TABLE recipes (
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
```

#### `users` (226,570 records)
```sql
CREATE TABLE users (
    user_id BIGINT PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### `interactions` (1,133,167 records)
```sql
CREATE TABLE interactions (
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
```

### Useful Views

#### `popular_recipes`
Recipes with 5+ reviews, sorted by average rating and review count.

#### `active_users`
Users with 3+ reviews, showing activity statistics.

#### `recipe_stats`
Comprehensive statistics for each recipe.

## Authentication Setup

### Web Apps (JavaScript/TypeScript)

#### Install Supabase Client
```bash
npm install @supabase/supabase-js
```

#### Initialize Client
```javascript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://qunbglfspdhzlmkrdqxc.supabase.co'
const supabaseKey = 'your-anon-key-here'

export const supabase = createClient(supabaseUrl, supabaseKey)
```

### Mobile Apps

#### React Native
```bash
npm install @supabase/supabase-js react-native-url-polyfill
```

```javascript
import 'react-native-url-polyfill/auto'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://qunbglfspdhzlmkrdqxc.supabase.co'
const supabaseKey = 'your-anon-key-here'

export const supabase = createClient(supabaseUrl, supabaseKey)
```

#### Flutter
```yaml
dependencies:
  supabase_flutter: ^2.0.0
```

```dart
import 'package:supabase_flutter/supabase_flutter.dart';

void main() async {
  await Supabase.initialize(
    url: 'https://qunbglfspdhzlmkrdqxc.supabase.co',
    anonKey: 'your-anon-key-here',
  );
  runApp(MyApp());
}
```

## Web App Integration

### Basic Recipe Fetching

```javascript
// Fetch all recipes with pagination
async function getRecipes(page = 0, limit = 20) {
  const { data, error } = await supabase
    .from('recipes')
    .select('*')
    .range(page * limit, (page + 1) * limit - 1)
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data
}

// Search recipes by name
async function searchRecipes(query) {
  const { data, error } = await supabase
    .from('recipes')
    .select('*')
    .ilike('name', `%${query}%`)
    .limit(50)
  
  if (error) throw error
  return data
}

// Get recipe by ID
async function getRecipe(id) {
  const { data, error } = await supabase
    .from('recipes')
    .select('*')
    .eq('id', id)
    .single()
  
  if (error) throw error
  return data
}
```

### Recipe Filtering and Sorting

```javascript
// Get recipes by cooking time
async function getQuickRecipes(maxMinutes = 30) {
  const { data, error } = await supabase
    .from('recipes')
    .select('*')
    .lte('minutes', maxMinutes)
    .order('minutes', { ascending: true })
    .limit(20)
  
  if (error) throw error
  return data
}

// Get recipes by ingredient count
async function getSimpleRecipes(maxIngredients = 5) {
  const { data, error } = await supabase
    .from('recipes')
    .select('*')
    .lte('n_ingredients', maxIngredients)
    .order('n_ingredients', { ascending: true })
    .limit(20)
  
  if (error) throw error
  return data
}

// Get recipes by tags
async function getRecipesByTag(tag) {
  const { data, error } = await supabase
    .from('recipes')
    .select('*')
    .contains('tags', [tag])
    .limit(20)
  
  if (error) throw error
  return data
}
```

### User Interactions

```javascript
// Get user's recipe ratings
async function getUserRatings(userId) {
  const { data, error } = await supabase
    .from('interactions')
    .select(`
      *,
      recipes (
        id,
        name,
        minutes,
        n_ingredients
      )
    `)
    .eq('user_id', userId)
    .not('rating', 'is', null)
    .order('date', { ascending: false })
  
  if (error) throw error
  return data
}

// Add a new rating
async function addRating(userId, recipeId, rating, review = null) {
  const { data, error } = await supabase
    .from('interactions')
    .insert({
      user_id: userId,
      recipe_id: recipeId,
      rating: rating,
      review: review,
      date: new Date().toISOString().split('T')[0]
    })
    .select()
  
  if (error) throw error
  return data
}
```

## Mobile App Integration

### React Native Example

```javascript
import React, { useState, useEffect } from 'react'
import { View, Text, FlatList, TouchableOpacity } from 'react-native'
import { supabase } from './supabase'

export default function RecipeList() {
  const [recipes, setRecipes] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRecipes()
  }, [])

  const fetchRecipes = async () => {
    try {
      const { data, error } = await supabase
        .from('recipes')
        .select('id, name, minutes, n_ingredients, tags')
        .limit(20)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      setRecipes(data)
    } catch (error) {
      console.error('Error fetching recipes:', error)
    } finally {
      setLoading(false)
    }
  }

  const renderRecipe = ({ item }) => (
    <TouchableOpacity style={styles.recipeCard}>
      <Text style={styles.recipeName}>{item.name}</Text>
      <Text style={styles.recipeInfo}>
        {item.minutes} min • {item.n_ingredients} ingredients
      </Text>
      <Text style={styles.tags}>
        {item.tags?.slice(0, 3).join(', ')}
      </Text>
    </TouchableOpacity>
  )

  if (loading) return <Text>Loading...</Text>

  return (
    <FlatList
      data={recipes}
      renderItem={renderRecipe}
      keyExtractor={(item) => item.id.toString()}
      onEndReached={loadMoreRecipes}
      onEndReachedThreshold={0.5}
    />
  )
}
```

### Flutter Example

```dart
import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

class RecipeList extends StatefulWidget {
  @override
  _RecipeListState createState() => _RecipeListState();
}

class _RecipeListState extends State<RecipeList> {
  List<Map<String, dynamic>> recipes = [];
  bool loading = true;

  @override
  void initState() {
    super.initState();
    fetchRecipes();
  }

  Future<void> fetchRecipes() async {
    try {
      final response = await Supabase.instance.client
          .from('recipes')
          .select('id, name, minutes, n_ingredients, tags')
          .limit(20)
          .order('created_at', ascending: false);

      setState(() {
        recipes = List<Map<String, dynamic>>.from(response);
        loading = false;
      });
    } catch (error) {
      print('Error fetching recipes: $error');
      setState(() => loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (loading) {
      return Center(child: CircularProgressIndicator());
    }

    return ListView.builder(
      itemCount: recipes.length,
      itemBuilder: (context, index) {
        final recipe = recipes[index];
        return Card(
          child: ListTile(
            title: Text(recipe['name']),
            subtitle: Text(
              '${recipe['minutes']} min • ${recipe['n_ingredients']} ingredients'
            ),
            onTap: () => _navigateToRecipe(recipe['id']),
          ),
        );
      },
    );
  }

  void _navigateToRecipe(int recipeId) {
    // Navigate to recipe detail screen
  }
}
```

## Common Queries

### Popular Recipes
```javascript
async function getPopularRecipes() {
  const { data, error } = await supabase
    .from('popular_recipes')
    .select('*')
    .limit(20)
  
  if (error) throw error
  return data
}
```

### Recipe Recommendations
```javascript
// Get recipes similar to user's high-rated recipes
async function getRecommendations(userId) {
  const { data, error } = await supabase
    .from('interactions')
    .select(`
      recipes!inner (
        id,
        name,
        minutes,
        n_ingredients,
        tags
      )
    `)
    .eq('user_id', userId)
    .gte('rating', 4.0)
    .limit(10)
  
  if (error) throw error
  return data
}
```

### Recipe Statistics
```javascript
async function getRecipeStats(recipeId) {
  const { data, error } = await supabase
    .from('recipe_stats')
    .select('*')
    .eq('id', recipeId)
    .single()
  
  if (error) throw error
  return data
}
```

### Search with Multiple Criteria
```javascript
async function advancedSearch(criteria) {
  let query = supabase
    .from('recipes')
    .select('*')
  
  if (criteria.name) {
    query = query.ilike('name', `%${criteria.name}%`)
  }
  
  if (criteria.maxMinutes) {
    query = query.lte('minutes', criteria.maxMinutes)
  }
  
  if (criteria.maxIngredients) {
    query = query.lte('n_ingredients', criteria.maxIngredients)
  }
  
  if (criteria.tags && criteria.tags.length > 0) {
    query = query.overlaps('tags', criteria.tags)
  }
  
  const { data, error } = await query.limit(50)
  
  if (error) throw error
  return data
}
```

## Advanced Features

### Real-time Subscriptions

```javascript
// Subscribe to new recipes
const subscription = supabase
  .channel('new-recipes')
  .on('postgres_changes', 
    { event: 'INSERT', schema: 'public', table: 'recipes' },
    (payload) => {
      console.log('New recipe added:', payload.new)
      // Update your UI
    }
  )
  .subscribe()

// Clean up subscription
subscription.unsubscribe()
```

### Batch Operations

```javascript
// Insert multiple ratings at once
async function addMultipleRatings(ratings) {
  const { data, error } = await supabase
    .from('interactions')
    .insert(ratings.map(rating => ({
      user_id: rating.userId,
      recipe_id: rating.recipeId,
      rating: rating.rating,
      review: rating.review,
      date: new Date().toISOString().split('T')[0]
    })))
    .select()
  
  if (error) throw error
  return data
}
```

### Custom Functions (RPC)

```javascript
// Call a custom database function
async function getRecipeRecommendations(userId, limit = 10) {
  const { data, error } = await supabase
    .rpc('get_user_recommendations', {
      user_id: userId,
      rec_limit: limit
    })
  
  if (error) throw error
  return data
}
```

## Performance Optimization

### Pagination
```javascript
async function getRecipesPaginated(page = 0, pageSize = 20) {
  const from = page * pageSize
  const to = from + pageSize - 1
  
  const { data, error } = await supabase
    .from('recipes')
    .select('*')
    .range(from, to)
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data
}
```

### Selective Field Loading
```javascript
// Only load necessary fields for list view
async function getRecipeList() {
  const { data, error } = await supabase
    .from('recipes')
    .select('id, name, minutes, n_ingredients, tags')
    .limit(20)
  
  if (error) throw error
  return data
}

// Load full details only when needed
async function getRecipeDetails(id) {
  const { data, error } = await supabase
    .from('recipes')
    .select('*')
    .eq('id', id)
    .single()
  
  if (error) throw error
  return data
}
```

### Caching Strategy
```javascript
// Simple in-memory cache
const cache = new Map()

async function getCachedRecipe(id) {
  if (cache.has(id)) {
    return cache.get(id)
  }
  
  const recipe = await getRecipe(id)
  cache.set(id, recipe)
  return recipe
}
```

## Error Handling

### Comprehensive Error Handling
```javascript
async function safeSupabaseCall(operation) {
  try {
    const { data, error } = await operation
    
    if (error) {
      console.error('Supabase error:', error)
      
      // Handle specific error types
      switch (error.code) {
        case 'PGRST116':
          throw new Error('No data found')
        case 'PGRST301':
          throw new Error('Invalid request')
        case '23505':
          throw new Error('Duplicate entry')
        default:
          throw new Error(error.message)
      }
    }
    
    return data
  } catch (error) {
    console.error('Operation failed:', error)
    throw error
  }
}

// Usage
try {
  const recipes = await safeSupabaseCall(
    supabase.from('recipes').select('*').limit(10)
  )
} catch (error) {
  // Handle error in UI
  console.error('Failed to fetch recipes:', error.message)
}
```

### Retry Logic
```javascript
async function retryOperation(operation, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation()
    } catch (error) {
      if (i === maxRetries - 1) throw error
      
      // Exponential backoff
      await new Promise(resolve => 
        setTimeout(resolve, Math.pow(2, i) * 1000)
      )
    }
  }
}
```

## Security Best Practices

### Row Level Security (RLS)
```sql
-- Enable RLS on interactions table
ALTER TABLE interactions ENABLE ROW LEVEL SECURITY;

-- Allow users to only see their own interactions
CREATE POLICY "Users can view own interactions" ON interactions
  FOR SELECT USING (auth.uid()::text = user_id::text);

-- Allow users to insert their own interactions
CREATE POLICY "Users can insert own interactions" ON interactions
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);
```

### API Key Management
```javascript
// Use environment variables
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY

// Never expose service role key in client-side code
```

### Input Validation
```javascript
function validateRecipeInput(recipe) {
  if (!recipe.name || recipe.name.length < 3) {
    throw new Error('Recipe name must be at least 3 characters')
  }
  
  if (recipe.minutes && (recipe.minutes < 0 || recipe.minutes > 10080)) {
    throw new Error('Cooking time must be between 0 and 10080 minutes')
  }
  
  return true
}
```

## Sample Applications

### React Web App
```bash
npx create-react-app food-app
cd food-app
npm install @supabase/supabase-js
```

### React Native App
```bash
npx react-native init FoodApp
cd FoodApp
npm install @supabase/supabase-js react-native-url-polyfill
```

### Flutter App
```bash
flutter create food_app
cd food_app
# Add supabase_flutter to pubspec.yaml
```

## Troubleshooting

### Common Issues

1. **CORS Errors**: Ensure your domain is added to Supabase allowed origins
2. **Rate Limiting**: Implement proper pagination and caching
3. **Large Responses**: Use selective field loading and pagination
4. **Connection Issues**: Implement retry logic and offline handling

### Debug Mode
```javascript
// Enable debug logging
const supabase = createClient(url, key, {
  auth: {
    debug: true
  }
})
```

## Support

For additional help:
- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Community](https://github.com/supabase/supabase/discussions)
- [API Reference](https://supabase.com/docs/reference/javascript)

---

*Last updated: September 2025*
