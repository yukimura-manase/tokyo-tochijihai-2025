# Multi-stage build for optimized Python dependencies
FROM python:3.11-slim as builder

WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --user -r requirements.txt

# Production stage
FROM python:3.11-slim as runtime

WORKDIR /app

# Copy pre-built dependencies from builder stage
COPY --from=builder /root/.local /root/.local

# Add .local/bin to PATH
ENV PATH=/root/.local/bin:$PATH

# Copy application code
COPY . .

EXPOSE 8000

# Use non-reload mode for production
CMD ["python", "entrypoint.py"]