#!/bin/bash
# Auto-setup script for markdownlint plugin
# Runs on SessionStart to ensure dependencies are installed and built

set -e

PLUGIN_DIR="${CLAUDE_PLUGIN_ROOT:-$(dirname "$(dirname "$0")")}"
cd "$PLUGIN_DIR"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "Installing markdownlint plugin dependencies..."
    npm install --silent 2>/dev/null
    echo "Dependencies installed."
fi

# Check if dist/server.js exists and is up to date
if [ ! -f "dist/server.js" ] || [ "src/server.ts" -nt "dist/server.js" ]; then
    echo "Building markdownlint MCP server..."
    npm run build --silent 2>/dev/null
    echo "Build complete."
fi

# Silent exit if everything is already set up
exit 0
