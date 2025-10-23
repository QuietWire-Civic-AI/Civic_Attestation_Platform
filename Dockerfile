# Multi-stage Docker build for CAP
# Stage 1: Dependencies and build
FROM node:18-slim AS frontend-builder

WORKDIR /app
COPY apps/cap/package*.json ./
RUN npm install

COPY apps/cap/public ./public
RUN npm run build

# Stage 2: Python application
FROM python:3.11-slim

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1
ENV NODE_ENV=production

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    libffi-dev \
    libssl-dev \
    curl \
    git \
    && rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /app

# Copy requirements and install Python dependencies
COPY apps/cap/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY apps/cap/ ./apps/cap/

# Copy built frontend assets
COPY --from=frontend-builder /app/assets ./apps/cap/assets

# Set permissions
RUN chown -R nobody:nogroup /app
USER nobody

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Default command
CMD ["python", "-m", "frappe", "serve", "--host", "0.0.0.0", "--port", "8000"]