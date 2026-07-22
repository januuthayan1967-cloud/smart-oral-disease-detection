FROM python:3.11-slim

WORKDIR /app

# Install system libraries needed by OpenCV and Pillow
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt-get/lists/*

# Copy requirements from ai-service directory
COPY ai-service/requirements.txt .
# Upgrade pip to support modern wheel metadata (e.g. Keras 3.x)
RUN pip install --no-cache-dir --upgrade pip
RUN pip install --no-cache-dir -r requirements.txt

# Copy all ai-service files into working directory
COPY ai-service/ .

ENV PORT=5001
EXPOSE 5001

CMD ["sh", "-c", "gunicorn app:app --bind 0.0.0.0:${PORT:-5001} --workers 1 --threads 8 --timeout 120"]
