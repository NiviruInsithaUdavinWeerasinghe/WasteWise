# ============================================================
# WasteWise ML Service — Hugging Face Spaces Dockerfile
# ============================================================
# Uses a Python 3.10 slim base. Hugging Face Spaces runs this
# as a non-root user, so we set up /home/user as the workdir.
# ============================================================

FROM python:3.10-slim

# Create a non-root user (required by Hugging Face Spaces)
RUN useradd -m -u 1000 user
USER user

ENV HOME=/home/user \
    PATH=/home/user/.local/bin:$PATH \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

WORKDIR $HOME/app

# Install Python dependencies first (for Docker layer caching)
COPY --chown=user requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy the application source files
COPY --chown=user . .

# Expose the port Flask will run on (Hugging Face Spaces maps to 7860)
EXPOSE 7860

# Start the Flask app on port 7860
CMD ["python", "app.py"]
