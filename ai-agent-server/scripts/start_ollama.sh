#!/bin/bash

echo "Starting Ollama server..."

# Check if ollama is installed
if ! command -v ollama &> /dev/null; then
    echo "Ollama is not installed. Please install it first:"
    echo "curl -fsSL https://ollama.com/install.sh | sh"
    exit 1
fi

# Set Ollama host to listen on all interfaces
export OLLAMA_HOST="0.0.0.0:11434"

# Start Ollama serve in background
ollama serve &

# Save the PID
OLLAMA_PID=$!
echo $OLLAMA_PID > .ollama.pid

echo "Ollama server started with PID: $OLLAMA_PID"
echo "Server is running at http://localhost:11434"

# Wait a moment for server to start
sleep 3

# Check if server is running
if curl -s http://localhost:11434 > /dev/null; then
    echo "Ollama server is ready!"
else
    echo "Warning: Ollama server may still be starting..."
fi