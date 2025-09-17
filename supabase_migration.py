#!/usr/bin/env python3
"""
Food.com Dataset Migration to Supabase
=====================================

This script migrates the Food.com dataset from CSV files to Supabase.
It handles large files by processing them in chunks and maintains data integrity.

Requirements:
- supabase-py
- pandas
- python-dotenv

Usage:
1. Set up your Supabase credentials in .env file
2. Run: python supabase_migration.py
"""

import os
import sys
import pandas as pd
import numpy as np
from typing import List, Dict, Any, Optional
import json
import re
from datetime import datetime
import logging
from dotenv import load_dotenv
from supabase import create_client, Client
import time

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('migration.log'),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

class FoodDatabaseMigrator:
    """Handles migration of Food.com dataset to Supabase"""
    
    def __init__(self):
        """Initialize the migrator with Supabase connection"""
        self.supabase_url = os.getenv('SUPABASE_URL')
        self.supabase_key = os.getenv('SUPABASE_ANON_KEY')
        
        if not self.supabase_url or not self.supabase_key:
            raise ValueError("Please set SUPABASE_URL and SUPABASE_ANON_KEY in your .env file")
        
        self.supabase: Client = create_client(self.supabase_url, self.supabase_key)
        self.data_dir = "kaggle"
        self.chunk_size = 1000  # Process 1000 rows at a time
        
    def create_database_schema(self) -> None:
        """Create the database schema in Supabase"""
        logger.info("Creating database schema...")
        
        # SQL statements to create tables
        schema_sql = """
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
        """
        
        try:
            # Execute schema creation
            result = self.supabase.rpc('exec_sql', {'sql': schema_sql})
            logger.info("Database schema created successfully")
        except Exception as e:
            logger.error(f"Error creating schema: {e}")
            # Try alternative approach - create tables individually
            self._create_tables_individually()
    
    def _create_tables_individually(self) -> None:
        """Create tables individually if bulk creation fails"""
        logger.info("Creating tables individually...")
        
        tables = [
            {
                'name': 'recipes',
                'sql': '''
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
                '''
            },
            {
                'name': 'users',
                'sql': '''
                CREATE TABLE IF NOT EXISTS users (
                    user_id BIGINT PRIMARY KEY,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                );
                '''
            },
            {
                'name': 'interactions',
                'sql': '''
                CREATE TABLE IF NOT EXISTS interactions (
                    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
                    user_id BIGINT NOT NULL,
                    recipe_id BIGINT NOT NULL,
                    date DATE,
                    rating DECIMAL(2,1),
                    review TEXT,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                );
                '''
            }
        ]
        
        for table in tables:
            try:
                self.supabase.rpc('exec_sql', {'sql': table['sql']})
                logger.info(f"Created table: {table['name']}")
            except Exception as e:
                logger.error(f"Error creating table {table['name']}: {e}")
    
    def parse_list_field(self, field: str) -> List[str]:
        """Parse string representation of list into actual list"""
        if pd.isna(field) or field == '':
            return []
        
        try:
            # Handle string representation of lists
            if isinstance(field, str) and field.startswith('[') and field.endswith(']'):
                # Remove brackets and split by comma
                content = field[1:-1]
                # Handle quoted strings properly
                items = []
                current_item = ""
                in_quotes = False
                quote_char = None
                
                for char in content:
                    if char in ['"', "'"] and not in_quotes:
                        in_quotes = True
                        quote_char = char
                        current_item += char
                    elif char == quote_char and in_quotes:
                        in_quotes = False
                        quote_char = None
                        current_item += char
                    elif char == ',' and not in_quotes:
                        items.append(current_item.strip().strip("'\" "))
                        current_item = ""
                    else:
                        current_item += char
                
                if current_item.strip():
                    items.append(current_item.strip().strip("'\" "))
                
                return items
            else:
                return [str(field)]
        except Exception as e:
            logger.warning(f"Error parsing list field '{field}': {e}")
            return [str(field)] if field else []
    
    def parse_json_field(self, field: str) -> Optional[Dict]:
        """Parse string representation of JSON into actual JSON"""
        if pd.isna(field) or field == '':
            return None
        
        try:
            if isinstance(field, str):
                return json.loads(field)
            return field
        except Exception as e:
            logger.warning(f"Error parsing JSON field '{field}': {e}")
            return None
    
    def migrate_recipes(self) -> None:
        """Migrate recipes data"""
        logger.info("Starting recipes migration...")
        
        file_path = os.path.join(self.data_dir, "RAW_recipes.csv")
        if not os.path.exists(file_path):
            logger.error(f"File not found: {file_path}")
            return
        
        total_rows = 0
        processed_rows = 0
        
        try:
            # Get total row count
            with open(file_path, 'r', encoding='utf-8') as f:
                total_rows = sum(1 for line in f) - 1  # Subtract header
            
            logger.info(f"Total recipes to process: {total_rows}")
            
            # Process in chunks
            chunk_iter = pd.read_csv(file_path, chunksize=self.chunk_size, encoding='utf-8')
            
            for chunk_idx, chunk in enumerate(chunk_iter):
                logger.info(f"Processing recipes chunk {chunk_idx + 1}...")
                
                # Clean and transform data
                recipes_data = []
                
                for _, row in chunk.iterrows():
                    try:
                        recipe_data = {
                            'id': int(row['id']),
                            'name': str(row['name']).strip(),
                            'minutes': int(row['minutes']) if pd.notna(row['minutes']) else None,
                            'contributor_id': int(row['contributor_id']) if pd.notna(row['contributor_id']) else None,
                            'submitted': pd.to_datetime(row['submitted']).date() if pd.notna(row['submitted']) else None,
                            'tags': self.parse_list_field(row['tags']),
                            'nutrition': self.parse_json_field(row['nutrition']),
                            'n_steps': int(row['n_steps']) if pd.notna(row['n_steps']) else None,
                            'steps': self.parse_list_field(row['steps']),
                            'description': str(row['description']).strip() if pd.notna(row['description']) else None,
                            'ingredients': self.parse_list_field(row['ingredients']),
                            'n_ingredients': int(row['n_ingredients']) if pd.notna(row['n_ingredients']) else None
                        }
                        recipes_data.append(recipe_data)
                    except Exception as e:
                        logger.warning(f"Error processing recipe row: {e}")
                        continue
                
                # Insert batch
                if recipes_data:
                    try:
                        result = self.supabase.table('recipes').upsert(recipes_data).execute()
                        processed_rows += len(recipes_data)
                        logger.info(f"Inserted {len(recipes_data)} recipes. Total processed: {processed_rows}/{total_rows}")
                    except Exception as e:
                        logger.error(f"Error inserting recipes batch: {e}")
                        # Try inserting one by one
                        for recipe in recipes_data:
                            try:
                                self.supabase.table('recipes').upsert([recipe]).execute()
                                processed_rows += 1
                            except Exception as e2:
                                logger.error(f"Error inserting individual recipe {recipe.get('id', 'unknown')}: {e2}")
                
                # Small delay to avoid overwhelming the API
                time.sleep(0.1)
            
            logger.info(f"Recipes migration completed. Processed {processed_rows} recipes.")
            
        except Exception as e:
            logger.error(f"Error in recipes migration: {e}")
    
    def migrate_interactions(self) -> None:
        """Migrate interactions data"""
        logger.info("Starting interactions migration...")
        
        file_path = os.path.join(self.data_dir, "RAW_interactions.csv")
        if not os.path.exists(file_path):
            logger.error(f"File not found: {file_path}")
            return
        
        total_rows = 0
        processed_rows = 0
        
        try:
            # Get total row count
            with open(file_path, 'r', encoding='utf-8') as f:
                total_rows = sum(1 for line in f) - 1  # Subtract header
            
            logger.info(f"Total interactions to process: {total_rows}")
            
            # Process in chunks
            chunk_iter = pd.read_csv(file_path, chunksize=self.chunk_size, encoding='utf-8')
            
            for chunk_idx, chunk in enumerate(chunk_iter):
                logger.info(f"Processing interactions chunk {chunk_idx + 1}...")
                
                # Clean and transform data
                interactions_data = []
                users_data = []
                seen_users = set()
                
                for _, row in chunk.iterrows():
                    try:
                        user_id = int(row['user_id'])
                        recipe_id = int(row['recipe_id'])
                        
                        # Prepare interaction data
                        interaction_data = {
                            'user_id': user_id,
                            'recipe_id': recipe_id,
                            'date': pd.to_datetime(row['date']).date() if pd.notna(row['date']) else None,
                            'rating': float(row['rating']) if pd.notna(row['rating']) and row['rating'] != 0 else None,
                            'review': str(row['review']).strip() if pd.notna(row['review']) else None
                        }
                        interactions_data.append(interaction_data)
                        
                        # Track unique users
                        if user_id not in seen_users:
                            users_data.append({'user_id': user_id})
                            seen_users.add(user_id)
                            
                    except Exception as e:
                        logger.warning(f"Error processing interaction row: {e}")
                        continue
                
                # Insert users first (if any new ones)
                if users_data:
                    try:
                        self.supabase.table('users').upsert(users_data).execute()
                        logger.info(f"Inserted {len(users_data)} new users")
                    except Exception as e:
                        logger.error(f"Error inserting users batch: {e}")
                
                # Insert interactions
                if interactions_data:
                    try:
                        result = self.supabase.table('interactions').upsert(interactions_data).execute()
                        processed_rows += len(interactions_data)
                        logger.info(f"Inserted {len(interactions_data)} interactions. Total processed: {processed_rows}/{total_rows}")
                    except Exception as e:
                        logger.error(f"Error inserting interactions batch: {e}")
                        # Try inserting one by one
                        for interaction in interactions_data:
                            try:
                                self.supabase.table('interactions').upsert([interaction]).execute()
                                processed_rows += 1
                            except Exception as e2:
                                logger.error(f"Error inserting individual interaction: {e2}")
                
                # Small delay to avoid overwhelming the API
                time.sleep(0.1)
            
            logger.info(f"Interactions migration completed. Processed {processed_rows} interactions.")
            
        except Exception as e:
            logger.error(f"Error in interactions migration: {e}")
    
    def migrate_pp_recipes(self) -> None:
        """Migrate preprocessed recipes data"""
        logger.info("Starting preprocessed recipes migration...")
        
        file_path = os.path.join(self.data_dir, "PP_recipes.csv")
        if not os.path.exists(file_path):
            logger.warning(f"File not found: {file_path}")
            return
        
        try:
            df = pd.read_csv(file_path)
            logger.info(f"Processing {len(df)} preprocessed recipes...")
            
            pp_recipes_data = []
            
            for _, row in df.iterrows():
                try:
                    pp_recipe_data = {
                        'recipe_id': int(row['i']),
                        'techniques': self.parse_list_field(row['techniques']),
                        'items': self.parse_list_field(row['items']),
                        'n_items': int(row['n_items']) if pd.notna(row['n_items']) else None
                    }
                    pp_recipes_data.append(pp_recipe_data)
                except Exception as e:
                    logger.warning(f"Error processing PP recipe row: {e}")
                    continue
            
            # Insert in batches
            batch_size = 1000
            for i in range(0, len(pp_recipes_data), batch_size):
                batch = pp_recipes_data[i:i + batch_size]
                try:
                    self.supabase.table('pp_recipes').upsert(batch).execute()
                    logger.info(f"Inserted PP recipes batch {i//batch_size + 1}")
                except Exception as e:
                    logger.error(f"Error inserting PP recipes batch: {e}")
            
            logger.info("Preprocessed recipes migration completed.")
            
        except Exception as e:
            logger.error(f"Error in PP recipes migration: {e}")
    
    def migrate_pp_users(self) -> None:
        """Migrate preprocessed users data"""
        logger.info("Starting preprocessed users migration...")
        
        file_path = os.path.join(self.data_dir, "PP_users.csv")
        if not os.path.exists(file_path):
            logger.warning(f"File not found: {file_path}")
            return
        
        try:
            df = pd.read_csv(file_path)
            logger.info(f"Processing {len(df)} preprocessed users...")
            
            pp_users_data = []
            
            for _, row in df.iterrows():
                try:
                    pp_user_data = {
                        'user_id': int(row['u']),
                        'techniques': self.parse_list_field(row['techniques']),
                        'items': self.parse_list_field(row['items']),
                        'n_items': int(row['n_items']) if pd.notna(row['n_items']) else None,
                        'ratings': self.parse_list_field(row['ratings']),
                        'n_ratings': int(row['n_ratings']) if pd.notna(row['n_ratings']) else None
                    }
                    pp_users_data.append(pp_user_data)
                except Exception as e:
                    logger.warning(f"Error processing PP user row: {e}")
                    continue
            
            # Insert in batches
            batch_size = 1000
            for i in range(0, len(pp_users_data), batch_size):
                batch = pp_users_data[i:i + batch_size]
                try:
                    self.supabase.table('pp_users').upsert(batch).execute()
                    logger.info(f"Inserted PP users batch {i//batch_size + 1}")
                except Exception as e:
                    logger.error(f"Error inserting PP users batch: {e}")
            
            logger.info("Preprocessed users migration completed.")
            
        except Exception as e:
            logger.error(f"Error in PP users migration: {e}")
    
    def verify_migration(self) -> None:
        """Verify that the migration was successful"""
        logger.info("Verifying migration...")
        
        try:
            # Check recipes count
            recipes_count = self.supabase.table('recipes').select('id', count='exact').execute()
            logger.info(f"Recipes in database: {recipes_count.count}")
            
            # Check users count
            users_count = self.supabase.table('users').select('user_id', count='exact').execute()
            logger.info(f"Users in database: {users_count.count}")
            
            # Check interactions count
            interactions_count = self.supabase.table('interactions').select('id', count='exact').execute()
            logger.info(f"Interactions in database: {interactions_count.count}")
            
            # Check PP recipes count
            pp_recipes_count = self.supabase.table('pp_recipes').select('recipe_id', count='exact').execute()
            logger.info(f"Preprocessed recipes in database: {pp_recipes_count.count}")
            
            # Check PP users count
            pp_users_count = self.supabase.table('pp_users').select('user_id', count='exact').execute()
            logger.info(f"Preprocessed users in database: {pp_users_count.count}")
            
            logger.info("Migration verification completed.")
            
        except Exception as e:
            logger.error(f"Error verifying migration: {e}")
    
    def run_migration(self) -> None:
        """Run the complete migration process"""
        logger.info("Starting Food.com dataset migration to Supabase...")
        
        try:
            # Create database schema
            self.create_database_schema()
            
            # Migrate data in order (respecting foreign key constraints)
            self.migrate_recipes()
            self.migrate_interactions()
            self.migrate_pp_recipes()
            self.migrate_pp_users()
            
            # Verify migration
            self.verify_migration()
            
            logger.info("Migration completed successfully!")
            
        except Exception as e:
            logger.error(f"Migration failed: {e}")
            raise

def main():
    """Main function to run the migration"""
    try:
        migrator = FoodDatabaseMigrator()
        migrator.run_migration()
    except Exception as e:
        logger.error(f"Migration failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
