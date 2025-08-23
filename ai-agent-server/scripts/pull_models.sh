#!/bin/bash

echo "Pulling required Ollama models..."

# Default model from settings
MODEL=${OLLAMA_MODEL:-phi4-mini}

# Check if ollama is installed
if ! command -v ollama &> /dev/null; then
    echo "Ollama is not installed. Please install it first:"
    echo "curl -fsSL https://ollama.com/install.sh | sh"
    exit 1
fi

# Pull the model
echo "Pulling model: $MODEL"
ollama pull $MODEL

if [ $? -eq 0 ]; then
    echo "Model $MODEL pulled successfully!"
else
    echo "Failed to pull model $MODEL"
    exit 1
fi

# List available models
echo ""
echo "Available models:"
ollama list