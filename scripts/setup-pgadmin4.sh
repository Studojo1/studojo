#!/bin/bash
# Script to set up pgadmin4 configuration for user-writable directories
# This fixes the permission error when pgadmin4 tries to write to /var/lib/pgadmin

set -e

echo "🔧 Setting up pgAdmin4 configuration..."

# Create necessary directories
mkdir -p ~/.pgadmin/{sessions,storage}
mkdir -p ~/.config/pgadmin

# Create config_local.py in multiple possible locations
CONFIG_CONTENT='# pgAdmin4 local configuration
# This file overrides default settings to use a user-writable directory

import os

# Override SQLITE_PATH to use a user-writable directory
SQLITE_PATH = os.path.expanduser("~/.pgadmin/pgadmin4.db")

# Override other paths that might need user-writable directories
DATA_DIR = os.path.expanduser("~/.pgadmin")
SESSION_DB_PATH = os.path.expanduser("~/.pgadmin/sessions")
STORAGE_DIR = os.path.expanduser("~/.pgadmin/storage")
LOG_FILE = os.path.expanduser("~/.pgadmin/pgadmin4.log")

# Ensure the directory exists
os.makedirs(os.path.dirname(SQLITE_PATH), exist_ok=True)
os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(SESSION_DB_PATH, exist_ok=True)
os.makedirs(STORAGE_DIR, exist_ok=True)
'

echo "$CONFIG_CONTENT" > ~/.pgadmin/config_local.py
echo "$CONFIG_CONTENT" > ~/.config/pgadmin/config_local.py

echo "✅ Created config_local.py in:"
echo "   - ~/.pgadmin/config_local.py"
echo "   - ~/.config/pgadmin/config_local.py"
echo ""
echo "📝 Note: pgAdmin4 will look for config_local.py in its installation directory."
echo "   If you still get permission errors, you may need to:"
echo "   1. Find pgAdmin4 installation directory"
echo "   2. Copy config_local.py there"
echo ""
echo "💡 Alternative: Use the port-forward scripts and connect with any PostgreSQL client:"
echo "   ./scripts/port-forward-postgres.sh"
echo ""
echo "   Then connect to:"
echo "   Host: localhost"
echo "   Port: 5432"
echo "   Database: postgres"
echo "   User: studojo"











