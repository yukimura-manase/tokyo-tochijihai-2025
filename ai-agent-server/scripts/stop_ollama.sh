#!/bin/bash

echo "Stopping Ollama server..."

if [ -f .ollama.pid ]; then
    PID=$(cat .ollama.pid)
    if ps -p $PID > /dev/null; then
        kill $PID
        echo "Ollama server (PID: $PID) stopped"
        rm .ollama.pid
    else
        echo "Ollama server is not running (PID: $PID not found)"
        rm .ollama.pid
    fi
else
    echo "No Ollama PID file found. Trying to find and stop any running Ollama process..."
    pkill -f "ollama serve" || echo "No Ollama process found"
fi