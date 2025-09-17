// Food.com Dataset API Examples
// This file contains practical examples for common use cases

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://qunbglfspdhzlmkrdqxc.supabase.co',
  'your-anon-key-here'
)

// ============================================================================
// BASIC RECIPE OPERATIONS
// ============================================================================

/**
 * Get all recipes with pagination
 */
export async function getAllRecipes(page = 0, limit = 20) {
  const from = page * limit
  const to = from + limit - 1
  
  const { data, error } = await supabase
    .from('recipes')
    .select('id, name, minutes, n_ingredients, tags, description')
    .range(from, to)
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data
}

/**
 * Search recipes by name
 */
export async function searchRecipes(query, limit = 20) {
  const { data, error } = await supabase
    .from('recipes')
    .select('id, name, minutes, n_ingredients, tags, description')
    .ilike('name', `%${query}%`)
    .limit(limit)
  
  if (error) throw error
  return data
}

/**
 * Get recipe by ID with full details
 */
export async function getRecipeById(id) {
  const { data, error } = await supabase
    .from('recipes')
    .select('*')
    .eq('id', id)
    .single()
  
  if (error) throw error
  return data
}

// ============================================================================
// FILTERING AND SORTING
// ============================================================================

/**
 * Get quick recipes (under specified minutes)
 */
export async function getQuickRecipes(maxMinutes = 30, limit = 20) {
  const { data, error } = await supabase
    .from('recipes')
    .select('id, name, minutes, n_ingredients, tags')
    .lte('minutes', maxMinutes)
    .order('minutes', { ascending: true })
    .limit(limit)
  
  if (error) throw error
  return data
}

/**
 * Get simple recipes (few ingredients)
 */
export async function getSimpleRecipes(maxIngredients = 5, limit = 20) {
  const { data, error } = await supabase
    .from('recipes')
    .select('id, name, minutes, n_ingredients, tags')
    .lte('n_ingredients', maxIngredients)
    .order('n_ingredients', { ascending: true })
    .limit(limit)
  
  if (error) throw error
  return data
}

/**
 * Get recipes by specific tags
 */
export async function getRecipesByTag(tag, limit = 20) {
  const { data, error } = await supabase
    .from('recipes')
    .select('id, name, minutes, n_ingredients, tags')
    .contains('tags', [tag])
    .limit(limit)
  
  if (error) throw error
  return data
}

/**
 * Get recipes by multiple tags (any of the tags)
 */
export async function getRecipesByTags(tags, limit = 20) {
  const { data, error } = await supabase
    .from('recipes')
    .select('id, name, minutes, n_ingredients, tags')
    .overlaps('tags', tags)
    .limit(limit)
  
  if (error) throw error
  return data
}

/**
 * Advanced search with multiple criteria
 */
export async function advancedSearch(criteria) {
  let query = supabase
    .from('recipes')
    .select('id, name, minutes, n_ingredients, tags, description')
  
  if (criteria.name) {
    query = query.ilike('name', `%${criteria.name}%`)
  }
  
  if (criteria.maxMinutes) {
    query = query.lte('minutes', criteria.maxMinutes)
  }
  
  if (criteria.minMinutes) {
    query = query.gte('minutes', criteria.minMinutes)
  }
  
  if (criteria.maxIngredients) {
    query = query.lte('n_ingredients', criteria.maxIngredients)
  }
  
  if (criteria.minIngredients) {
    query = query.gte('n_ingredients', criteria.minIngredients)
  }
  
  if (criteria.tags && criteria.tags.length > 0) {
    query = query.overlaps('tags', criteria.tags)
  }
  
  if (criteria.submittedAfter) {
    query = query.gte('submitted', criteria.submittedAfter)
  }
  
  if (criteria.submittedBefore) {
    query = query.lte('submitted', criteria.submittedBefore)
  }
  
  const { data, error } = await query
    .order(criteria.sortBy || 'created_at', { 
      ascending: criteria.sortAscending !== false 
    })
    .limit(criteria.limit || 50)
  
  if (error) throw error
  return data
}

// ============================================================================
// POPULAR RECIPES AND STATISTICS
// ============================================================================

/**
 * Get popular recipes (from the view)
 */
export async function getPopularRecipes(limit = 20) {
  const { data, error } = await supabase
    .from('popular_recipes')
    .select('*')
    .limit(limit)
  
  if (error) throw error
  return data
}

/**
 * Get recipe statistics
 */
export async function getRecipeStats(recipeId) {
  const { data, error } = await supabase
    .from('recipe_stats')
    .select('*')
    .eq('id', recipeId)
    .single()
  
  if (error) throw error
  return data
}

/**
 * Get top-rated recipes
 */
export async function getTopRatedRecipes(minReviews = 10, limit = 20) {
  const { data, error } = await supabase
    .from('popular_recipes')
    .select('*')
    .gte('review_count', minReviews)
    .order('avg_rating', { ascending: false })
    .limit(limit)
  
  if (error) throw error
  return data
}

// ============================================================================
// USER INTERACTIONS
// ============================================================================

/**
 * Get user's ratings and reviews
 */
export async function getUserRatings(userId, limit = 50) {
  const { data, error } = await supabase
    .from('interactions')
    .select(`
      id,
      rating,
      review,
      date,
      recipes (
        id,
        name,
        minutes,
        n_ingredients,
        tags
      )
    `)
    .eq('user_id', userId)
    .not('rating', 'is', null)
    .order('date', { ascending: false })
    .limit(limit)
  
  if (error) throw error
  return data
}

/**
 * Add a new rating/review
 */
export async function addRating(userId, recipeId, rating, review = null) {
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

/**
 * Update an existing rating/review
 */
export async function updateRating(interactionId, rating, review = null) {
  const { data, error } = await supabase
    .from('interactions')
    .update({
      rating: rating,
      review: review
    })
    .eq('id', interactionId)
    .select()
  
  if (error) throw error
  return data
}

/**
 * Delete a rating/review
 */
export async function deleteRating(interactionId) {
  const { data, error } = await supabase
    .from('interactions')
    .delete()
    .eq('id', interactionId)
    .select()
  
  if (error) throw error
  return data
}

/**
 * Get recipe's ratings and reviews
 */
export async function getRecipeReviews(recipeId, limit = 50) {
  const { data, error } = await supabase
    .from('interactions')
    .select(`
      id,
      rating,
      review,
      date,
      users (user_id)
    `)
    .eq('recipe_id', recipeId)
    .not('rating', 'is', null)
    .order('date', { ascending: false })
    .limit(limit)
  
  if (error) throw error
  return data
}

// ============================================================================
// RECOMMENDATION SYSTEMS
// ============================================================================

/**
 * Get recipes similar to user's high-rated recipes
 */
export async function getUserRecommendations(userId, limit = 20) {
  // First get user's high-rated recipes
  const { data: userRatings, error: ratingsError } = await supabase
    .from('interactions')
    .select('recipe_id')
    .eq('user_id', userId)
    .gte('rating', 4.0)
  
  if (ratingsError) throw ratingsError
  
  if (!userRatings || userRatings.length === 0) {
    // If no high ratings, return popular recipes
    return getPopularRecipes(limit)
  }
  
  const recipeIds = userRatings.map(r => r.recipe_id)
  
  // Get recipes with similar tags to user's favorites
  const { data, error } = await supabase
    .from('recipes')
    .select('id, name, minutes, n_ingredients, tags, description')
    .not('id', 'in', `(${recipeIds.join(',')})`)
    .limit(limit)
  
  if (error) throw error
  return data
}

/**
 * Get recipes based on cooking time preferences
 */
export async function getTimeBasedRecommendations(preferredMinutes, tolerance = 15, limit = 20) {
  const minTime = Math.max(0, preferredMinutes - tolerance)
  const maxTime = preferredMinutes + tolerance
  
  const { data, error } = await supabase
    .from('recipes')
    .select('id, name, minutes, n_ingredients, tags')
    .gte('minutes', minTime)
    .lte('minutes', maxTime)
    .order('minutes', { ascending: true })
    .limit(limit)
  
  if (error) throw error
  return data
}

/**
 * Get ingredient-based recommendations
 */
export async function getIngredientRecommendations(ingredients, limit = 20) {
  const { data, error } = await supabase
    .from('recipes')
    .select('id, name, minutes, n_ingredients, tags, ingredients')
    .overlaps('ingredients', ingredients)
    .order('n_ingredients', { ascending: true })
    .limit(limit)
  
  if (error) throw error
  return data
}

// ============================================================================
// ANALYTICS AND INSIGHTS
// ============================================================================

/**
 * Get user activity statistics
 */
export async function getUserStats(userId) {
  const { data, error } = await supabase
    .from('active_users')
    .select('*')
    .eq('user_id', userId)
    .single()
  
  if (error) throw error
  return data
}

/**
 * Get trending recipes (most reviewed recently)
 */
export async function getTrendingRecipes(days = 30, limit = 20) {
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - days)
  
  const { data, error } = await supabase
    .from('interactions')
    .select(`
      recipe_id,
      recipes!inner (
        id,
        name,
        minutes,
        n_ingredients,
        tags
      )
    `)
    .gte('date', cutoffDate.toISOString().split('T')[0])
    .not('rating', 'is', null)
    .limit(limit)
  
  if (error) throw error
  
  // Group by recipe and count
  const recipeCounts = {}
  data.forEach(interaction => {
    const recipeId = interaction.recipe_id
    if (!recipeCounts[recipeId]) {
      recipeCounts[recipeId] = {
        recipe: interaction.recipes,
        count: 0
      }
    }
    recipeCounts[recipeId].count++
  })
  
  // Sort by count and return
  return Object.values(recipeCounts)
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
    .map(item => item.recipe)
}

/**
 * Get cuisine analysis
 */
export async function getCuisineAnalysis() {
  const { data, error } = await supabase
    .from('recipes')
    .select('tags')
    .not('tags', 'is', null)
  
  if (error) throw error
  
  const cuisineCounts = {}
  data.forEach(recipe => {
    if (recipe.tags) {
      recipe.tags.forEach(tag => {
        // Common cuisine tags
        const cuisineTags = ['italian', 'mexican', 'chinese', 'indian', 'french', 'thai', 'japanese', 'american']
        if (cuisineTags.includes(tag.toLowerCase())) {
          cuisineCounts[tag] = (cuisineCounts[tag] || 0) + 1
        }
      })
    }
  })
  
  return Object.entries(cuisineCounts)
    .sort(([,a], [,b]) => b - a)
    .map(([cuisine, count]) => ({ cuisine, count }))
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get random recipes
 */
export async function getRandomRecipes(count = 10) {
  const { data, error } = await supabase
    .from('recipes')
    .select('id, name, minutes, n_ingredients, tags')
    .limit(count * 2) // Get more than needed to ensure randomness
  
  if (error) throw error
  
  // Shuffle and return requested count
  const shuffled = data.sort(() => 0.5 - Math.random())
  return shuffled.slice(0, count)
}

/**
 * Get recipes by contributor
 */
export async function getRecipesByContributor(contributorId, limit = 20) {
  const { data, error } = await supabase
    .from('recipes')
    .select('id, name, minutes, n_ingredients, tags, submitted')
    .eq('contributor_id', contributorId)
    .order('submitted', { ascending: false })
    .limit(limit)
  
  if (error) throw error
  return data
}

/**
 * Get nutrition information for recipes
 */
export async function getRecipesWithNutrition(limit = 20) {
  const { data, error } = await supabase
    .from('recipes')
    .select('id, name, nutrition')
    .not('nutrition', 'is', null)
    .limit(limit)
  
  if (error) throw error
  return data
}

// ============================================================================
// BATCH OPERATIONS
// ============================================================================

/**
 * Add multiple ratings at once
 */
export async function addMultipleRatings(ratings) {
  const ratingData = ratings.map(rating => ({
    user_id: rating.userId,
    recipe_id: rating.recipeId,
    rating: rating.rating,
    review: rating.review || null,
    date: rating.date || new Date().toISOString().split('T')[0]
  }))
  
  const { data, error } = await supabase
    .from('interactions')
    .insert(ratingData)
    .select()
  
  if (error) throw error
  return data
}

/**
 * Get multiple recipes by IDs
 */
export async function getRecipesByIds(ids) {
  const { data, error } = await supabase
    .from('recipes')
    .select('*')
    .in('id', ids)
  
  if (error) throw error
  return data
}

// ============================================================================
// ERROR HANDLING UTILITIES
// ============================================================================

/**
 * Safe Supabase call with error handling
 */
export async function safeSupabaseCall(operation) {
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
        case '23503':
          throw new Error('Foreign key constraint violation')
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

/**
 * Retry operation with exponential backoff
 */
export async function retryOperation(operation, maxRetries = 3) {
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
