FROM ollama/ollama:latest

# Set working directory
WORKDIR /root

# Expose the default Ollama port
EXPOSE 11434

# Health check to ensure Ollama is running
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:11434/api/tags || exit 1

# Start Ollama service
CMD ["serve"]