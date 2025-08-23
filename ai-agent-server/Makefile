.PHONY: help install ollama ollama-start ollama-stop ollama-pull fastapi dev dev-docker test clean lint format

# Default target
help:
	@echo "AI Agent Server - Makefile Commands"
	@echo "==================================="
	@echo ""
	@echo "Setup commands:"
	@echo "  make install        - Install dependencies using uv"
	@echo "  make ollama-pull    - Pull required Ollama models"
	@echo ""
	@echo "Server commands:"
	@echo "  make ollama         - Start Ollama server"
	@echo "  make ollama-stop    - Stop Ollama server"
	@echo "  make fastapi        - Start FastAPI server"
	@echo "  make dev            - Start both servers (Ollama + FastAPI)"
	@echo ""
	@echo "Docker commands:"
	@echo "  make dev-docker     - Start services using Docker Compose"
	@echo "  make docker-down    - Stop Docker services"
	@echo ""
	@echo "Testing & Quality:"
	@echo "  make test           - Run tests"
	@echo "  make lint           - Run linting"
	@echo "  make format         - Format code"
	@echo ""
	@echo "Cleanup:"
	@echo "  make clean          - Clean generated files and caches"

# Install dependencies using uv
install:
	@echo "Installing dependencies with uv..."
	@command -v uv >/dev/null 2>&1 || { echo "uv is not installed. Installing..."; curl -LsSf https://astral.sh/uv/install.sh | sh; }
	uv sync
	@echo "Dependencies installed successfully!"

# Start Ollama server
ollama: ollama-start

ollama-start:
	@echo "Starting Ollama server..."
	@./scripts/start_ollama.sh

# Stop Ollama server
ollama-stop:
	@echo "Stopping Ollama server..."
	@./scripts/stop_ollama.sh

# Pull Ollama models
ollama-pull:
	@echo "Pulling Ollama models..."
	@./scripts/pull_models.sh

# Start FastAPI server
fastapi:
	@echo "Starting FastAPI server..."
	@./scripts/start_fastapi.sh

# Start both servers for development
dev:
	@echo "Starting development servers..."
	@echo "Starting Ollama server in background..."
	@./scripts/start_ollama.sh
	@echo ""
	@echo "Waiting for Ollama to be ready..."
	@sleep 5
	@echo ""
	@echo "Starting FastAPI server..."
	@./scripts/start_fastapi.sh

# Start services using Docker Compose
dev-docker:
	@echo "Starting services with Docker Compose..."
	@./start.sh

# Stop Docker services
docker-down:
	@echo "Stopping Docker services..."
	docker compose down

# Run tests
test:
	@echo "Running tests..."
	@if [ -f .env.local ]; then \
		export $$(cat .env.local | grep -v '^#' | xargs) && uv run pytest; \
	else \
		uv run pytest; \
	fi

# Run linting
lint:
	@echo "Running linting..."
	uv run ruff check app/ tests/

# Format code
format:
	@echo "Formatting code..."
	uv run ruff format app/ tests/

# Clean generated files
clean:
	@echo "Cleaning generated files..."
	@rm -rf __pycache__ .pytest_cache .coverage
	@rm -rf app/__pycache__ app/**/__pycache__ app/**/**/__pycache__
	@rm -rf tests/__pycache__
	@rm -f .ollama.pid
	@find . -type f -name "*.pyc" -delete
	@find . -type d -name "__pycache__" -delete
	@echo "Cleanup complete!"

# Install development tools
dev-tools:
	@echo "Installing development tools..."
	uv pip install ruff pytest pytest-asyncio pytest-cov httpx