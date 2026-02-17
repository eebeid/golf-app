#!/bin/bash
set -e

echo "This script will fix permission issues and restart the dev server."
echo "You may be asked for your password (for sudo)."

# Fix npm cache permissions
echo "1. Fixing ~/.npm permissions..."
sudo chown -R $(whoami) ~/.npm

# Remove node_modules and package-lock.json
echo "2. Removing existing node_modules and package-lock.json..."
sudo rm -rf node_modules package-lock.json

# Install dependencies
echo "3. Installing dependencies (this may take a moment)..."
npm install

# Start dev server
echo "4. Starting development server..."
npm run dev
