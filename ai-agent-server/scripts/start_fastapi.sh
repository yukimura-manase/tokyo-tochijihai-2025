#!/bin/bash

echo "Starting FastAPI server..."

# Load environment variables from .env.local if it exists
if [ -f .env.local ]; then
    echo "Loading environment from .env.local"
    export $(cat .env.local | grep -v '^#' | xargs)
fi

# Ensure we're in the correct directory
cd "$(dirname "$0")/.." || exit 1

# Check if uv is installed
if ! command -v uv &> /dev/null; then
    echo "uv is not installed. Please install it first:"
    echo "curl -LsSf https://astral.sh/uv/install.sh | sh"
    exit 1
fi

# Run FastAPI with uvicorn through uv
echo "Starting FastAPI server on http://localhost:8000"
echo "API documentation available at http://localhost:8000/docs"

# Run the FastAPI application
uv run uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload