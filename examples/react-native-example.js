import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Modal
} from 'react-native'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client
const supabase = createClient(
  'https://qunbglfspdhzlmkrdqxc.supabase.co',
  'your-anon-key-here'
)

export default function RecipeApp() {
  const [recipes, setRecipes] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedRecipe, setSelectedRecipe] = useState(null)
  const [modalVisible, setModalVisible] = useState(false)

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
      Alert.alert('Error', 'Failed to fetch recipes')
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
      Alert.alert('Error', 'Failed to search recipes')
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
      setModalVisible(true)
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch recipe details')
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
      Alert.alert('Error', 'Failed to fetch quick recipes')
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
      Alert.alert('Error', 'Failed to fetch popular recipes')
      console.error('Error fetching popular recipes:', error)
    } finally {
      setLoading(false)
    }
  }

  const renderRecipe = ({ item }) => (
    <TouchableOpacity
      style={styles.recipeCard}
      onPress={() => getRecipeDetails(item.id)}
    >
      <Text style={styles.recipeName}>{item.name}</Text>
      
      <View style={styles.recipeInfo}>
        <Text style={styles.infoText}>
          ⏱️ {item.minutes || 'N/A'} min
        </Text>
        <Text style={styles.infoText}>
          🥘 {item.n_ingredients || 'N/A'} ingredients
        </Text>
      </View>
      
      {item.description && (
        <Text style={styles.description} numberOfLines={2}>
          {item.description}
        </Text>
      )}
      
      {item.tags && item.tags.length > 0 && (
        <View style={styles.tagsContainer}>
          {item.tags.slice(0, 3).map((tag, index) => (
            <View key={index} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
      )}
    </TouchableOpacity>
  )

  const renderRecipeDetails = () => {
    if (!selectedRecipe) return null

    return (
      <Modal
        visible={modalVisible}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>×</Text>
            </TouchableOpacity>
            
            <Text style={styles.modalTitle}>{selectedRecipe.name}</Text>
            
            <View style={styles.modalInfo}>
              <Text style={styles.modalInfoText}>
                ⏱️ {selectedRecipe.minutes || 'N/A'} minutes
              </Text>
              <Text style={styles.modalInfoText}>
                🥘 {selectedRecipe.n_ingredients || 'N/A'} ingredients
              </Text>
              <Text style={styles.modalInfoText}>
                📝 {selectedRecipe.n_steps || 'N/A'} steps
              </Text>
            </View>
            
            {selectedRecipe.description && (
              <Text style={styles.modalDescription}>
                {selectedRecipe.description}
              </Text>
            )}
            
            {selectedRecipe.ingredients && selectedRecipe.ingredients.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Ingredients:</Text>
                {selectedRecipe.ingredients.map((ingredient, index) => (
                  <Text key={index} style={styles.listItem}>
                    • {ingredient}
                  </Text>
                ))}
              </View>
            )}
            
            {selectedRecipe.steps && selectedRecipe.steps.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Instructions:</Text>
                {selectedRecipe.steps.map((step, index) => (
                  <Text key={index} style={styles.stepItem}>
                    {index + 1}. {step}
                  </Text>
                ))}
              </View>
            )}
            
            {selectedRecipe.tags && selectedRecipe.tags.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Tags:</Text>
                <View style={styles.modalTagsContainer}>
                  {selectedRecipe.tags.map((tag, index) => (
                    <View key={index} style={styles.modalTag}>
                      <Text style={styles.modalTagText}>{tag}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>
    )
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading recipes...</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🍳 Food.com Recipe Explorer</Text>
      
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search recipes..."
          value={searchTerm}
          onChangeText={setSearchTerm}
          onSubmitEditing={searchRecipes}
        />
        <TouchableOpacity style={styles.searchButton} onPress={searchRecipes}>
          <Text style={styles.searchButtonText}>Search</Text>
        </TouchableOpacity>
      </View>
      
      {/* Filter Buttons */}
      <View style={styles.filterContainer}>
        <TouchableOpacity style={styles.filterButton} onPress={fetchRecipes}>
          <Text style={styles.filterButtonText}>All</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.filterButton} onPress={getQuickRecipes}>
          <Text style={styles.filterButtonText}>Quick</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.filterButton} onPress={getPopularRecipes}>
          <Text style={styles.filterButtonText}>Popular</Text>
        </TouchableOpacity>
      </View>
      
      {/* Recipe List */}
      <FlatList
        data={recipes}
        renderItem={renderRecipe}
        keyExtractor={(item) => item.id.toString()}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
      />
      
      {/* Recipe Details Modal */}
      {renderRecipeDetails()}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingTop: 50,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: 'white',
    marginRight: 8,
  },
  searchButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    borderRadius: 8,
    justifyContent: 'center',
  },
  searchButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  filterButton: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  filterButtonText: {
    color: '#007AFF',
    fontWeight: '500',
  },
  listContainer: {
    paddingHorizontal: 16,
  },
  recipeCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  recipeName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  recipeInfo: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  infoText: {
    color: '#666',
    fontSize: 14,
    marginRight: 16,
  },
  description: {
    color: '#555',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 4,
  },
  tagText: {
    fontSize: 12,
    color: '#666',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    margin: 20,
    maxHeight: '80%',
    width: '90%',
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 24,
    color: '#666',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    marginRight: 40,
  },
  modalInfo: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  modalInfoText: {
    color: '#666',
    fontSize: 14,
    marginRight: 16,
  },
  modalDescription: {
    color: '#555',
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 16,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  listItem: {
    fontSize: 14,
    color: '#555',
    marginBottom: 4,
    lineHeight: 20,
  },
  stepItem: {
    fontSize: 14,
    color: '#555',
    marginBottom: 8,
    lineHeight: 20,
  },
  modalTagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  modalTag: {
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 4,
  },
  modalTagText: {
    fontSize: 12,
    color: '#1976d2',
  },
})
