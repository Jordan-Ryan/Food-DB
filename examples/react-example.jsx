import React, { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client
const supabase = createClient(
  'https://qunbglfspdhzlmkrdqxc.supabase.co',
  'your-anon-key-here'
)

function RecipeApp() {
  const [recipes, setRecipes] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedRecipe, setSelectedRecipe] = useState(null)

  // Fetch recipes on component mount
  useEffect(() => {
    fetchRecipes()
  }, [])

  const fetchRecipes = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('recipes')
        .select('id, name, minutes, n_ingredients, tags, description')
        .limit(20)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      setRecipes(data || [])
    } catch (error) {
      console.error('Error fetching recipes:', error)
    } finally {
      setLoading(false)
    }
  }

  const searchRecipes = async () => {
    if (!searchTerm.trim()) {
      fetchRecipes()
      return
    }

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('recipes')
        .select('id, name, minutes, n_ingredients, tags, description')
        .ilike('name', `%${searchTerm}%`)
        .limit(20)
      
      if (error) throw error
      setRecipes(data || [])
    } catch (error) {
      console.error('Error searching recipes:', error)
    } finally {
      setLoading(false)
    }
  }

  const getRecipeDetails = async (recipeId) => {
    try {
      const { data, error } = await supabase
        .from('recipes')
        .select('*')
        .eq('id', recipeId)
        .single()
      
      if (error) throw error
      setSelectedRecipe(data)
    } catch (error) {
      console.error('Error fetching recipe details:', error)
    }
  }

  const getQuickRecipes = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('recipes')
        .select('id, name, minutes, n_ingredients, tags')
        .lte('minutes', 30)
        .order('minutes', { ascending: true })
        .limit(20)
      
      if (error) throw error
      setRecipes(data || [])
    } catch (error) {
      console.error('Error fetching quick recipes:', error)
    } finally {
      setLoading(false)
    }
  }

  const getPopularRecipes = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('popular_recipes')
        .select('*')
        .limit(20)
      
      if (error) throw error
      setRecipes(data || [])
    } catch (error) {
      console.error('Error fetching popular recipes:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>🍳 Food.com Recipe Explorer</h1>
      
      {/* Search and Filters */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
          <input
            type="text"
            placeholder="Search recipes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ flex: 1, padding: '8px', fontSize: '16px' }}
          />
          <button onClick={searchRecipes} style={{ padding: '8px 16px' }}>
            Search
          </button>
        </div>
        
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={fetchRecipes} style={{ padding: '8px 16px' }}>
            All Recipes
          </button>
          <button onClick={getQuickRecipes} style={{ padding: '8px 16px' }}>
            Quick (≤30 min)
          </button>
          <button onClick={getPopularRecipes} style={{ padding: '8px 16px' }}>
            Popular
          </button>
        </div>
      </div>

      {/* Recipe List */}
      {loading ? (
        <div>Loading recipes...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
          {recipes.map((recipe) => (
            <div
              key={recipe.id}
              style={{
                border: '1px solid #ddd',
                borderRadius: '8px',
                padding: '16px',
                cursor: 'pointer',
                transition: 'box-shadow 0.2s'
              }}
              onClick={() => getRecipeDetails(recipe.id)}
              onMouseEnter={(e) => e.target.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)'}
              onMouseLeave={(e) => e.target.style.boxShadow = 'none'}
            >
              <h3 style={{ margin: '0 0 8px 0', fontSize: '18px' }}>
                {recipe.name}
              </h3>
              
              <div style={{ color: '#666', marginBottom: '8px' }}>
                ⏱️ {recipe.minutes || 'N/A'} min • 
                🥘 {recipe.n_ingredients || 'N/A'} ingredients
              </div>
              
              {recipe.description && (
                <p style={{ 
                  margin: '8px 0', 
                  fontSize: '14px', 
                  color: '#555',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}>
                  {recipe.description}
                </p>
              )}
              
              {recipe.tags && recipe.tags.length > 0 && (
                <div style={{ marginTop: '8px' }}>
                  {recipe.tags.slice(0, 3).map((tag, index) => (
                    <span
                      key={index}
                      style={{
                        display: 'inline-block',
                        background: '#f0f0f0',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        marginRight: '4px',
                        marginBottom: '4px'
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Recipe Details Modal */}
      {selectedRecipe && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            padding: '20px',
            borderRadius: '8px',
            maxWidth: '600px',
            maxHeight: '80vh',
            overflow: 'auto',
            position: 'relative'
          }}>
            <button
              onClick={() => setSelectedRecipe(null)}
              style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                background: 'none',
                border: 'none',
                fontSize: '20px',
                cursor: 'pointer'
              }}
            >
              ×
            </button>
            
            <h2>{selectedRecipe.name}</h2>
            
            <div style={{ marginBottom: '16px', color: '#666' }}>
              ⏱️ {selectedRecipe.minutes || 'N/A'} minutes • 
              🥘 {selectedRecipe.n_ingredients || 'N/A'} ingredients • 
              📝 {selectedRecipe.n_steps || 'N/A'} steps
            </div>
            
            {selectedRecipe.description && (
              <p style={{ marginBottom: '16px' }}>{selectedRecipe.description}</p>
            )}
            
            {selectedRecipe.ingredients && selectedRecipe.ingredients.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <h3>Ingredients:</h3>
                <ul>
                  {selectedRecipe.ingredients.map((ingredient, index) => (
                    <li key={index}>{ingredient}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {selectedRecipe.steps && selectedRecipe.steps.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <h3>Instructions:</h3>
                <ol>
                  {selectedRecipe.steps.map((step, index) => (
                    <li key={index} style={{ marginBottom: '8px' }}>{step}</li>
                  ))}
                </ol>
              </div>
            )}
            
            {selectedRecipe.tags && selectedRecipe.tags.length > 0 && (
              <div>
                <h3>Tags:</h3>
                <div>
                  {selectedRecipe.tags.map((tag, index) => (
                    <span
                      key={index}
                      style={{
                        display: 'inline-block',
                        background: '#e3f2fd',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '14px',
                        marginRight: '8px',
                        marginBottom: '4px'
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default RecipeApp
