import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  await Supabase.initialize(
    url: 'https://qunbglfspdhzlmkrdqxc.supabase.co',
    anonKey: 'your-anon-key-here',
  );
  
  runApp(RecipeApp());
}

class RecipeApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Food.com Recipe Explorer',
      theme: ThemeData(
        primarySwatch: Colors.blue,
        visualDensity: VisualDensity.adaptivePlatformDensity,
      ),
      home: RecipeListScreen(),
    );
  }
}

class RecipeListScreen extends StatefulWidget {
  @override
  _RecipeListScreenState createState() => _RecipeListScreenState();
}

class _RecipeListScreenState extends State<RecipeListScreen> {
  List<Map<String, dynamic>> recipes = [];
  bool loading = true;
  String searchTerm = '';
  final TextEditingController _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    fetchRecipes();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> fetchRecipes() async {
    try {
      setState(() => loading = true);
      
      final response = await Supabase.instance.client
          .from('recipes')
          .select('id, name, minutes, n_ingredients, tags, description')
          .limit(20)
          .order('created_at', ascending: false);

      setState(() {
        recipes = List<Map<String, dynamic>>.from(response);
        loading = false;
      });
    } catch (error) {
      setState(() => loading = false);
      _showErrorDialog('Failed to fetch recipes: $error');
    }
  }

  Future<void> searchRecipes() async {
    if (searchTerm.trim().isEmpty) {
      fetchRecipes();
      return;
    }

    try {
      setState(() => loading = true);
      
      final response = await Supabase.instance.client
          .from('recipes')
          .select('id, name, minutes, n_ingredients, tags, description')
          .ilike('name', '%$searchTerm%')
          .limit(20);

      setState(() {
        recipes = List<Map<String, dynamic>>.from(response);
        loading = false;
      });
    } catch (error) {
      setState(() => loading = false);
      _showErrorDialog('Failed to search recipes: $error');
    }
  }

  Future<void> getQuickRecipes() async {
    try {
      setState(() => loading = true);
      
      final response = await Supabase.instance.client
          .from('recipes')
          .select('id, name, minutes, n_ingredients, tags')
          .lte('minutes', 30)
          .order('minutes', ascending: true)
          .limit(20);

      setState(() {
        recipes = List<Map<String, dynamic>>.from(response);
        loading = false;
      });
    } catch (error) {
      setState(() => loading = false);
      _showErrorDialog('Failed to fetch quick recipes: $error');
    }
  }

  Future<void> getPopularRecipes() async {
    try {
      setState(() => loading = true);
      
      final response = await Supabase.instance.client
          .from('popular_recipes')
          .select('*')
          .limit(20);

      setState(() {
        recipes = List<Map<String, dynamic>>.from(response);
        loading = false;
      });
    } catch (error) {
      setState(() => loading = false);
      _showErrorDialog('Failed to fetch popular recipes: $error');
    }
  }

  void _showErrorDialog(String message) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('Error'),
        content: Text(message),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: Text('OK'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('🍳 Food.com Recipe Explorer'),
        backgroundColor: Colors.blue,
        foregroundColor: Colors.white,
      ),
      body: Column(
        children: [
          // Search Bar
          Padding(
            padding: EdgeInsets.all(16.0),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _searchController,
                    decoration: InputDecoration(
                      hintText: 'Search recipes...',
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(8.0),
                      ),
                      contentPadding: EdgeInsets.symmetric(
                        horizontal: 12.0,
                        vertical: 8.0,
                      ),
                    ),
                    onChanged: (value) {
                      setState(() {
                        searchTerm = value;
                      });
                    },
                    onSubmitted: (_) => searchRecipes(),
                  ),
                ),
                SizedBox(width: 8.0),
                ElevatedButton(
                  onPressed: searchRecipes,
                  child: Text('Search'),
                ),
              ],
            ),
          ),
          
          // Filter Buttons
          Padding(
            padding: EdgeInsets.symmetric(horizontal: 16.0),
            child: Row(
              children: [
                Expanded(
                  child: ElevatedButton(
                    onPressed: fetchRecipes,
                    child: Text('All'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.grey[200],
                      foregroundColor: Colors.black87,
                    ),
                  ),
                ),
                SizedBox(width: 8.0),
                Expanded(
                  child: ElevatedButton(
                    onPressed: getQuickRecipes,
                    child: Text('Quick'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.grey[200],
                      foregroundColor: Colors.black87,
                    ),
                  ),
                ),
                SizedBox(width: 8.0),
                Expanded(
                  child: ElevatedButton(
                    onPressed: getPopularRecipes,
                    child: Text('Popular'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.grey[200],
                      foregroundColor: Colors.black87,
                    ),
                  ),
                ),
              ],
            ),
          ),
          
          SizedBox(height: 16.0),
          
          // Recipe List
          Expanded(
            child: loading
                ? Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        CircularProgressIndicator(),
                        SizedBox(height: 16.0),
                        Text('Loading recipes...'),
                      ],
                    ),
                  )
                : recipes.isEmpty
                    ? Center(
                        child: Text(
                          'No recipes found',
                          style: TextStyle(fontSize: 16.0),
                        ),
                      )
                    : ListView.builder(
                        padding: EdgeInsets.symmetric(horizontal: 16.0),
                        itemCount: recipes.length,
                        itemBuilder: (context, index) {
                          final recipe = recipes[index];
                          return RecipeCard(
                            recipe: recipe,
                            onTap: () => _showRecipeDetails(recipe['id']),
                          );
                        },
                      ),
          ),
        ],
      ),
    );
  }

  void _showRecipeDetails(int recipeId) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => RecipeDetailScreen(recipeId: recipeId),
      ),
    );
  }
}

class RecipeCard extends StatelessWidget {
  final Map<String, dynamic> recipe;
  final VoidCallback onTap;

  const RecipeCard({
    Key? key,
    required this.recipe,
    required this.onTap,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: EdgeInsets.only(bottom: 12.0),
      elevation: 2.0,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(8.0),
        child: Padding(
          padding: EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                recipe['name'] ?? 'Unknown Recipe',
                style: TextStyle(
                  fontSize: 18.0,
                  fontWeight: FontWeight.bold,
                ),
              ),
              SizedBox(height: 8.0),
              Row(
                children: [
                  Icon(Icons.access_time, size: 16.0, color: Colors.grey[600]),
                  SizedBox(width: 4.0),
                  Text(
                    '${recipe['minutes'] ?? 'N/A'} min',
                    style: TextStyle(color: Colors.grey[600]),
                  ),
                  SizedBox(width: 16.0),
                  Icon(Icons.restaurant, size: 16.0, color: Colors.grey[600]),
                  SizedBox(width: 4.0),
                  Text(
                    '${recipe['n_ingredients'] ?? 'N/A'} ingredients',
                    style: TextStyle(color: Colors.grey[600]),
                  ),
                ],
              ),
              if (recipe['description'] != null) ...[
                SizedBox(height: 8.0),
                Text(
                  recipe['description'],
                  style: TextStyle(color: Colors.grey[700]),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
              if (recipe['tags'] != null && (recipe['tags'] as List).isNotEmpty) ...[
                SizedBox(height: 8.0),
                Wrap(
                  spacing: 4.0,
                  runSpacing: 4.0,
                  children: (recipe['tags'] as List)
                      .take(3)
                      .map((tag) => Chip(
                            label: Text(
                              tag.toString(),
                              style: TextStyle(fontSize: 12.0),
                            ),
                            backgroundColor: Colors.grey[200],
                            materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                          ))
                      .toList(),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

class RecipeDetailScreen extends StatefulWidget {
  final int recipeId;

  const RecipeDetailScreen({Key? key, required this.recipeId}) : super(key: key);

  @override
  _RecipeDetailScreenState createState() => _RecipeDetailScreenState();
}

class _RecipeDetailScreenState extends State<RecipeDetailScreen> {
  Map<String, dynamic>? recipe;
  bool loading = true;

  @override
  void initState() {
    super.initState();
    fetchRecipeDetails();
  }

  Future<void> fetchRecipeDetails() async {
    try {
      final response = await Supabase.instance.client
          .from('recipes')
          .select('*')
          .eq('id', widget.recipeId)
          .single();

      setState(() {
        recipe = response;
        loading = false;
      });
    } catch (error) {
      setState(() => loading = false);
      _showErrorDialog('Failed to fetch recipe details: $error');
    }
  }

  void _showErrorDialog(String message) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('Error'),
        content: Text(message),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: Text('OK'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Recipe Details'),
        backgroundColor: Colors.blue,
        foregroundColor: Colors.white,
      ),
      body: loading
          ? Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  CircularProgressIndicator(),
                  SizedBox(height: 16.0),
                  Text('Loading recipe details...'),
                ],
              ),
            )
          : recipe == null
              ? Center(
                  child: Text(
                    'Recipe not found',
                    style: TextStyle(fontSize: 16.0),
                  ),
                )
              : SingleChildScrollView(
                  padding: EdgeInsets.all(16.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        recipe!['name'] ?? 'Unknown Recipe',
                        style: TextStyle(
                          fontSize: 24.0,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      SizedBox(height: 16.0),
                      Row(
                        children: [
                          Icon(Icons.access_time, color: Colors.grey[600]),
                          SizedBox(width: 8.0),
                          Text('${recipe!['minutes'] ?? 'N/A'} minutes'),
                          SizedBox(width: 24.0),
                          Icon(Icons.restaurant, color: Colors.grey[600]),
                          SizedBox(width: 8.0),
                          Text('${recipe!['n_ingredients'] ?? 'N/A'} ingredients'),
                          SizedBox(width: 24.0),
                          Icon(Icons.list, color: Colors.grey[600]),
                          SizedBox(width: 8.0),
                          Text('${recipe!['n_steps'] ?? 'N/A'} steps'),
                        ],
                      ),
                      SizedBox(height: 16.0),
                      if (recipe!['description'] != null) ...[
                        Text(
                          recipe!['description'],
                          style: TextStyle(fontSize: 16.0),
                        ),
                        SizedBox(height: 16.0),
                      ],
                      if (recipe!['ingredients'] != null &&
                          (recipe!['ingredients'] as List).isNotEmpty) ...[
                        Text(
                          'Ingredients:',
                          style: TextStyle(
                            fontSize: 18.0,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        SizedBox(height: 8.0),
                        ...(recipe!['ingredients'] as List).map(
                          (ingredient) => Padding(
                            padding: EdgeInsets.only(bottom: 4.0),
                            child: Text('• $ingredient'),
                          ),
                        ),
                        SizedBox(height: 16.0),
                      ],
                      if (recipe!['steps'] != null &&
                          (recipe!['steps'] as List).isNotEmpty) ...[
                        Text(
                          'Instructions:',
                          style: TextStyle(
                            fontSize: 18.0,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        SizedBox(height: 8.0),
                        ...(recipe!['steps'] as List).asMap().entries.map(
                          (entry) => Padding(
                            padding: EdgeInsets.only(bottom: 8.0),
                            child: Text('${entry.key + 1}. ${entry.value}'),
                          ),
                        ),
                        SizedBox(height: 16.0),
                      ],
                      if (recipe!['tags'] != null &&
                          (recipe!['tags'] as List).isNotEmpty) ...[
                        Text(
                          'Tags:',
                          style: TextStyle(
                            fontSize: 18.0,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        SizedBox(height: 8.0),
                        Wrap(
                          spacing: 8.0,
                          runSpacing: 8.0,
                          children: (recipe!['tags'] as List).map(
                            (tag) => Chip(
                              label: Text(tag.toString()),
                              backgroundColor: Colors.blue[100],
                            ),
                          ).toList(),
                        ),
                      ],
                    ],
                  ),
                ),
    );
  }
}
