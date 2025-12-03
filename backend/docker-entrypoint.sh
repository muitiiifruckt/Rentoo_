#!/bin/bash
set -e

echo "Starting backend initialization..."

# Initialize categories (script handles existing categories gracefully)
echo "Initializing categories..."
python -m scripts.init_categories || {
    echo "Warning: Failed to initialize categories. Continuing anyway..."
}

# Start the application
echo "Starting uvicorn..."
exec "$@"

