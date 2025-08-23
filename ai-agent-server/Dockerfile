FROM ollama/ollama:latest

# Set working directory
WORKDIR /root

# Pre-pull phi4-mini model during build to reduce startup time
RUN ollama serve & \
    sleep 5 && \
    ollama pull phi4-mini && \
    pkill ollama

# Expose the default Ollama port
EXPOSE 11434

# Start Ollama service
CMD ["serve"]