#!/bin/bash

echo "Starting Ollama and FastAPI services..."
echo "Note: phi4-mini model is pre-pulled during build for faster startup"

# Start all services (model is already available from build)
docker compose up -d

echo "Waiting for services to be ready..."
echo "Health checks will ensure services are fully operational"

# Wait for health checks to pass
timeout=60
elapsed=0
while [ $elapsed -lt $timeout ]; do
    if docker compose ps | grep -q "healthy"; then
        echo "Services started successfully!"
        echo "FastAPI is available at http://localhost:8000"
        echo "API documentation is available at http://localhost:8000/docs"
        exit 0
    fi
    sleep 2
    elapsed=$((elapsed + 2))
    echo "Waiting for services... (${elapsed}s/${timeout}s)"
done

echo "Services may still be starting. Check with 'docker compose ps'"