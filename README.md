# Food.com Dataset - Supabase Integration

A comprehensive food recipe dataset migrated to Supabase with complete API documentation and example applications.

## 📊 Dataset Overview

- **231,637 recipes** with full details (ingredients, steps, nutrition, tags)
- **226,570 users** with interaction history
- **1,133,167 interactions** (ratings and reviews)
- **Pre-built views** for popular recipes, active users, and recipe statistics

## 🚀 Quick Start

1. **Read the Quick Start Guide**: [QUICK_START.md](./QUICK_START.md)
2. **Browse the Full Documentation**: [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)
3. **Check out Examples**: [examples/](./examples/) folder

## 📁 Project Structure

```
Food-DB/
├── README.md                    # This file
├── QUICK_START.md              # 5-minute setup guide
├── API_DOCUMENTATION.md        # Complete API documentation
├── schema.sql                  # Database schema
├── supabase_migration.py       # Migration script
├── .env                        # Environment variables
├── requirements.txt            # Python dependencies
└── examples/                   # Example applications
    ├── react-example.jsx       # React web app
    ├── react-native-example.js # React Native mobile app
    ├── flutter-example.dart    # Flutter mobile app
    └── api-examples.js         # JavaScript API examples
```

## 🔧 Setup

### Prerequisites
- Supabase project with the migrated dataset
- Your Supabase URL and API keys

### Environment Variables
```bash
SUPABASE_URL=https://qunbglfspdhzlmkrdqxc.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
```

## 📱 Example Applications

### Web App (React)
```bash
npx create-react-app food-app
cd food-app
npm install @supabase/supabase-js
# Copy examples/react-example.jsx to src/App.js
```

### Mobile App (React Native)
```bash
npx react-native init FoodApp
cd FoodApp
npm install @supabase/supabase-js react-native-url-polyfill
# Copy examples/react-native-example.js to your component
```

### Mobile App (Flutter)
```bash
flutter create food_app
cd food_app
# Add supabase_flutter to pubspec.yaml
# Copy examples/flutter-example.dart to lib/main.dart
```

## 🔍 Common Use Cases

### Recipe Discovery
- Search by name, ingredients, or tags
- Filter by cooking time and complexity
- Browse popular and trending recipes

### User Interactions
- Rate and review recipes
- Track user preferences
- Generate personalized recommendations

### Analytics
- Recipe popularity metrics
- User engagement statistics
- Cuisine and ingredient analysis

## 📊 Database Schema

### Core Tables
- `recipes` - Complete recipe information
- `users` - User profiles
- `interactions` - Ratings and reviews

### Useful Views
- `popular_recipes` - Recipes with high ratings and review counts
- `active_users` - Users with significant activity
- `recipe_stats` - Comprehensive recipe statistics

## 🛠️ API Examples

### Basic Queries
```javascript
// Get recipes
const recipes = await supabase
  .from('recipes')
  .select('*')
  .limit(20)

// Search recipes
const results = await supabase
  .from('recipes')
  .select('*')
  .ilike('name', '%pasta%')

// Get popular recipes
const popular = await supabase
  .from('popular_recipes')
  .select('*')
  .limit(10)
```

### User Interactions
```javascript
// Add a rating
await supabase
  .from('interactions')
  .insert({
    user_id: 123,
    recipe_id: 456,
    rating: 4.5,
    review: 'Delicious!'
  })

// Get user's ratings
const ratings = await supabase
  .from('interactions')
  .select(`
    rating,
    review,
    recipes (name, minutes)
  `)
  .eq('user_id', 123)
```

## 🔒 Security

- Row Level Security (RLS) enabled on sensitive tables
- API keys properly configured for client-side use
- Input validation and error handling included

## 📈 Performance

- Optimized batch sizes for large datasets
- Efficient indexing on frequently queried columns
- Pagination support for large result sets
- Caching strategies for improved performance

## 🆘 Support

- **Documentation**: [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)
- **Quick Start**: [QUICK_START.md](./QUICK_START.md)
- **Examples**: [examples/](./examples/) folder
- **Supabase Docs**: [supabase.com/docs](https://supabase.com/docs)

## 📝 Migration Notes

The dataset was successfully migrated with the following results:
- ✅ 231,637 recipes imported
- ✅ 226,570 users imported  
- ✅ 1,133,167 interactions imported
- ⚠️ Preprocessed tables had parsing issues (non-critical)

## 🎯 Next Steps

1. **Explore the examples** in the `examples/` folder
2. **Customize the queries** for your specific use case
3. **Add authentication** if user management is needed
4. **Implement caching** for better performance
5. **Add real-time features** using Supabase subscriptions

---

*Built with ❤️ using Supabase and the Food.com dataset*