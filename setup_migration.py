#!/usr/bin/env python3
"""
Setup script for Food.com dataset migration to Supabase
======================================================

This script helps you set up the migration environment and provides
instructions for getting your Supabase credentials.
"""

import os
import sys
import subprocess

def check_python_version():
    """Check if Python version is compatible"""
    if sys.version_info < (3, 8):
        print("❌ Python 3.8 or higher is required")
        sys.exit(1)
    print(f"✅ Python {sys.version_info.major}.{sys.version_info.minor} detected")

def install_requirements():
    """Install required packages"""
    print("📦 Installing required packages...")
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"])
        print("✅ Requirements installed successfully")
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to install requirements: {e}")
        sys.exit(1)

def create_env_file():
    """Create .env file if it doesn't exist"""
    env_file = ".env"
    if os.path.exists(env_file):
        print(f"✅ {env_file} already exists")
        return
    
    print(f"📝 Creating {env_file} file...")
    with open(env_file, "w") as f:
        f.write("""# Supabase Configuration
# Get these values from your Supabase project dashboard
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here

# Optional: Database connection for direct SQL execution
# SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
""")
    print(f"✅ Created {env_file} file")
    print("⚠️  Please edit .env file with your Supabase credentials")

def check_kaggle_folder():
    """Check if kaggle folder exists with data files"""
    kaggle_dir = "kaggle"
    if not os.path.exists(kaggle_dir):
        print(f"❌ {kaggle_dir} folder not found")
        print("Please make sure your Kaggle dataset is in the kaggle/ folder")
        return False
    
    required_files = [
        "RAW_recipes.csv",
        "RAW_interactions.csv",
        "PP_recipes.csv",
        "PP_users.csv"
    ]
    
    missing_files = []
    for file in required_files:
        file_path = os.path.join(kaggle_dir, file)
        if not os.path.exists(file_path):
            missing_files.append(file)
    
    if missing_files:
        print(f"❌ Missing files in {kaggle_dir}/: {', '.join(missing_files)}")
        return False
    
    print(f"✅ All required data files found in {kaggle_dir}/")
    return True

def print_instructions():
    """Print setup instructions"""
    print("\n" + "="*60)
    print("🚀 SETUP INSTRUCTIONS")
    print("="*60)
    print()
    print("1. SUPABASE SETUP:")
    print("   - Go to https://supabase.com and create a new project")
    print("   - In your project dashboard, go to Settings > API")
    print("   - Copy your Project URL and anon/public key")
    print("   - Edit the .env file with your credentials")
    print()
    print("2. DATABASE SCHEMA:")
    print("   - The migration script will automatically create the database schema")
    print("   - Tables: recipes, users, interactions, pp_recipes, pp_users")
    print()
    print("3. RUN MIGRATION:")
    print("   - Make sure your .env file is configured")
    print("   - Run: python supabase_migration.py")
    print()
    print("4. MONITORING:")
    print("   - Check migration.log for detailed logs")
    print("   - The script processes data in chunks to handle large files")
    print()
    print("="*60)

def main():
    """Main setup function"""
    print("🔧 Setting up Food.com dataset migration to Supabase...")
    print()
    
    # Check Python version
    check_python_version()
    
    # Install requirements
    install_requirements()
    
    # Create .env file
    create_env_file()
    
    # Check kaggle folder
    data_ready = check_kaggle_folder()
    
    # Print instructions
    print_instructions()
    
    if data_ready:
        print("✅ Setup complete! You can now run the migration.")
        print("   Run: python supabase_migration.py")
    else:
        print("⚠️  Setup incomplete. Please ensure all data files are in place.")
    
    print()

if __name__ == "__main__":
    main()
